const assert = require('node:assert/strict')
const Database = require('better-sqlite3')
const { join } = require('node:path')
const { randomUUID } = require('node:crypto')
const { setTimeout: delay } = require('node:timers/promises')

module.exports = async function verifyPlayback({
  window,
  evaluate,
  waitFor,
  click,
  key,
  screenshot,
  project,
  root,
}) {
  const rows = 'document.querySelectorAll(".workflow-audio-row")'
  const audio = (index) => `${rows}[${index}].querySelector('audio')`
  const current = (index) => `${rows}[${index}]?.dataset.current==='true'`
  const stopped = `[...${rows}].every(row=>row.querySelector('audio').paused)`
  const play = async (index) => {
    await evaluate(`${audio(index)}.play()`)
    await waitFor(`${rows}[${index}].dataset.playing==='true'`, `playing ${index}`)
  }
  const pause = async (index) => {
    await evaluate(`${audio(index)}.pause()`)
    await waitFor(stopped, 'all tracks paused')
  }
  const end = async (index) => {
    await evaluate(`${audio(index)}.currentTime=${audio(index)}.duration-0.05`)
    await waitFor(`${audio(index)}.ended`, `real end ${index}`)
  }
  await waitFor(`${audio(0)}.duration>0 && ${audio(1)}.duration>0`, 'metadata')
  await play(0)
  await pause(0)
  assert.ok(await evaluate(current(0)), 'Pause keeps the current item highlighted')
  await evaluate(`${audio(0)}.dispatchEvent(new Event('ended'))`)
  await delay(100)
  assert.ok(await evaluate(stopped), 'A stopped item cannot start a successor')
  await play(0)
  await end(0)
  await waitFor(`${current(1)} && !${audio(1)}.paused`, 'normal end advances to next ready track')
  await pause(1)
  assert.ok(
    await evaluate(`${current(1)} && !(${current(0)})`),
    'Only the last played item remains selected',
  )
  await play(1)
  await end(1)
  await waitFor(`${current(1)} && ${stopped}`, 'last item ends without clearing selection')

  await play(0)
  await play(1)
  assert.ok(
    await evaluate(`${audio(0)}.paused && ${current(1)}`),
    'Manual playback is mutually exclusive',
  )
  await evaluate(`${audio(0)}.dispatchEvent(new Event('ended'))`)
  assert.ok(await evaluate(current(1)), 'Old ended events cannot reclaim selection')
  await evaluate(`${audio(1)}.dispatchEvent(new Event('error'))`)
  await pause(1)
  assert.ok(await evaluate(current(1)), 'Error keeps the current item highlighted')

  await play(0)
  await evaluate(
    `document.querySelector('details.workflow-divider').open=true;document.querySelector('details.workflow-divider audio').play()`,
  )
  await waitFor(
    `${audio(0)}.paused && ${current(0)}`,
    'another audio source stops playback but retains the current item',
  )
  await evaluate("document.querySelector('details.workflow-divider audio').pause()")

  await evaluate(
    `window.__nextPlayer=${audio(1)};window.__nextPlay=window.__nextPlayer.play;window.__nextPlayer.play=()=>Promise.reject(new Error('test playback denied'));void 0`,
  )
  await play(0)
  await end(0)
  await waitFor(
    'document.querySelector("[data-audio-sequence-error]")',
    'rejected automatic playback is explained',
  )
  assert.ok(
    await evaluate(`${stopped} && ${current(0)}`),
    'Rejected playback leaves the preceding selection',
  )
  await evaluate('window.__nextPlayer.play=window.__nextPlay;void 0')
  await delay(150)
  assert.ok(await evaluate(stopped), 'No retry after automatic playback was rejected')

  const fixture = new Database(join(root, 'database/dashboard.db'))
  const jobId = randomUUID()
  const tracks = project.stages.audio.payload.tracks
  const notify = () => window.webContents.send('workflow:updated', project.id)
  const addJob = (progress, operation = null) => {
    const now = new Date().toISOString()
    fixture
      .prepare(
        'INSERT INTO video_workflow_jobs(id,project_id,stage,request_id,expected_revision,executor,input_fingerprint,state,phase,created_at,updated_at,audio_progress,operation) VALUES(?,?,?,?,?,?,?,?,?,?,?,?,?)',
      )
      .run(
        jobId,
        project.id,
        'audio',
        jobId,
        project.revision,
        'template',
        '',
        'running',
        '测试生成下一段',
        now,
        now,
        JSON.stringify(progress),
        operation && JSON.stringify(operation),
      )
    notify()
  }
  try {
    addJob({ tracks: tracks.slice(0, 1), total: tracks.length })
    await waitFor(
      `${rows}.length===1 && document.querySelector('[data-audio-progress]')`,
      'one completed segment',
    )
    await play(0)
    await evaluate(`window.__partialPlayer=${audio(0)}`)
    await end(0)
    assert.ok(
      await evaluate(`${current(0)} && ${stopped}`),
      'Missing next segment ends the sequence',
    )
    fixture
      .prepare('UPDATE video_workflow_jobs SET audio_progress=? WHERE id=?')
      .run(JSON.stringify({ tracks, total: tracks.length }), jobId)
    notify()
    await waitFor(`${rows}.length===2`, 'next result arrives')
    await delay(200)
    assert.ok(
      await evaluate(`window.__partialPlayer===${audio(0)} && ${stopped} && ${current(0)}`),
      'Newly generated next result preserves the player and never restarts playback',
    )
    await play(0)
    await end(0)
    await waitFor(`${current(1)} && !${audio(1)}.paused`, 'manual restart enables sequence again')
    await pause(1)
    fixture.prepare('DELETE FROM video_workflow_jobs WHERE id=?').run(jobId)
    notify()
    await waitFor('!document.querySelector("[data-audio-progress]")', 'complete audio restored')
    addJob(
      { tracks: [], total: tracks.length },
      {
        action: 'regenerate-audio',
        audioTrackId: tracks[1].file.id,
        audioTrackIds: [tracks[1].file.id],
      },
    )
    await waitFor(
      'document.querySelector("[data-audio-modification-queue]")',
      'next segment regenerating',
    )
    await play(0)
    await end(0)
    assert.ok(
      await evaluate(`${stopped} && ${current(0)}`),
      'Do not play an old next segment while regenerating it',
    )
    fixture.prepare('DELETE FROM video_workflow_jobs WHERE id=?').run(jobId)
    notify()
    await waitFor(
      '!document.querySelector("[data-audio-modification-queue]")',
      'regeneration completes',
    )
    await delay(200)
    assert.ok(
      await evaluate(`${stopped} && ${current(0)}`),
      'Regeneration completion never resumes playback',
    )
  } finally {
    fixture.prepare('DELETE FROM video_workflow_jobs WHERE id=?').run(jobId)
    fixture.close()
    notify()
  }
  await evaluate(`${audio(0)}.focus()`)
  await key('Space')
  await waitFor(`${rows}[0].dataset.playing==='true'`, 'native player keyboard starts playback')
  await key('Space')
  await waitFor(`${stopped} && ${current(0)}`, 'keyboard pause preserves selection')
  await key('Tab')
  window.webContents.sendInputEvent({ type: 'keyDown', keyCode: 'Tab', modifiers: ['shift'] })
  window.webContents.sendInputEvent({ type: 'keyUp', keyCode: 'Tab', modifiers: ['shift'] })
  for (const theme of ['light', 'dark']) {
    await evaluate(`document.documentElement.classList.toggle('dark', ${theme === 'dark'})`)
    for (const width of [1440, 1024]) {
      window.setSize(width, 1000)
      await evaluate(`${audio(0)}.scrollIntoView({block:'center'})`)
      await screenshot(`audio-sequence-paused-${theme}-${width}`)
      assert.ok(await evaluate('document.documentElement.scrollWidth<=innerWidth+1'))
    }
    window.webContents.setZoomFactor(2)
    await evaluate(`${audio(0)}.scrollIntoView({block:'center'})`)
    await screenshot(`audio-sequence-paused-${theme}-200percent`)
    assert.ok(await evaluate('document.documentElement.scrollWidth<=innerWidth+1'))
    window.webContents.setZoomFactor(1)
  }
  window.webContents.debugger.attach('1.3')
  await window.webContents.debugger.sendCommand('Emulation.setEmulatedMedia', {
    features: [
      { name: 'prefers-reduced-motion', value: 'reduce' },
      { name: 'forced-colors', value: 'active' },
    ],
  })
  await screenshot('audio-sequence-paused-high-contrast')
  await window.webContents.debugger.sendCommand('Emulation.setEmulatedMedia', { features: [] })
  window.webContents.debugger.detach()
  await play(0)
  await evaluate(`window.__oldVersionPlayer=${audio(0)}`)
  await click('分段配音版本')
  await evaluate(
    '[...document.querySelectorAll("[role=option]")].find(item=>item.textContent.includes("历史 v1")).click()',
  )
  await waitFor(
    'window.__oldVersionPlayer.paused && !document.querySelector(".workflow-audio-row[data-current=true]")',
    'version switch stops old playback and selection',
  )
  await waitFor(`${rows}.length===2`, 'historical audio ready')
  await play(0)
  await evaluate(`window.__departingPlayer=${audio(0)}`)
  await evaluate(
    '[...document.querySelectorAll("button")].find(item=>item.textContent.includes("所有视频项目")).click()',
  )
  await waitFor(
    'window.__departingPlayer.paused && !document.querySelector(".workflow-audio-row")',
    'leaving page stops audio',
  )
  console.log(
    'PASS: audio sequence, retained highlight, missing/regenerating next segment, no delayed autoplay, rejection, version/unmount, keyboard, themes and zoom',
  )
}
