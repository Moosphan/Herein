import assert from 'node:assert/strict'
import test from 'node:test'
import * as inspection from '../src/shared/video-frame-inspection'
import type { WorkflowRevision, RenderPayload } from '../src/shared/video-workflow'

function sources(durations = [2, 4]) {
  const storyboard = {
    id: 'board',
    stage: 'storyboard',
    payload: {
      scenes: [
        { id: 'a', title: '开头' },
        { id: 'b', title: '主体' },
      ],
    },
  } as WorkflowRevision
  const audio = {
    id: 'audio',
    stage: 'audio',
    payload: {
      tracks: durations.map((duration, index) => ({ sceneId: index ? 'b' : 'a', duration })),
    },
  } as WorkflowRevision
  const revision = {
    id: 'rough',
    stage: 'roughcut',
    version: 2,
    createdAt: '2026-11-09T00:00:00.000Z',
    payload: {
      duration: durations.reduce((total, duration) => total + duration, 0),
      sourceStoryboard: 'board',
      sourceAudio: 'audio',
      file: { id: 'video', sha256: 'actual-video-hash' },
    },
  } as WorkflowRevision
  return { revision, history: [storyboard, audio] }
}

test('inspection compares stable scenes at relative phases using each frozen timeline', () => {
  assert.equal(typeof inspection.describeRenderInspection, 'function')
  const before = sources([1, 2])
  const after = sources([2, 4])
  const oldInfo = inspection.describeRenderInspection(before.revision, before.history)
  const info = inspection.describeRenderInspection(after.revision, after.history)
  assert.equal(info.video.sha256, 'actual-video-hash')
  assert.deepEqual(
    inspection
      .inspectionSceneSamples(info.scenes[1], info.duration, 30)
      .map((sample) => sample.time),
    [2.8, 4, 5.2],
  )
  assert.deepEqual(
    inspection
      .inspectionSceneSamples(oldInfo.scenes[1], oldInfo.duration, 30)
      .map((sample) => sample.time),
    [1.4, 2, 2.6],
  )
})

test('inspection refuses missing or wrong frozen sources instead of latest stages', () => {
  assert.equal(typeof inspection.describeRenderInspection, 'function')
  const { revision, history } = sources()
  assert.throws(() => inspection.describeRenderInspection(revision, []), /来源/)
  const payload = revision.payload as RenderPayload
  assert.throws(
    () =>
      inspection.describeRenderInspection(
        { ...revision, payload: { ...payload, sourceAudio: undefined } },
        history,
      ),
    /来源/,
  )
  assert.throws(
    () =>
      inspection.describeRenderInspection(revision, [
        history[0],
        { ...history[1], stage: 'narration' },
      ]),
    /来源/,
  )
  assert.throws(
    () => inspection.describeRenderInspection({ ...revision, stage: 'publish' }, history),
    /粗剪/,
  )
})

test('unified production inspects frozen delivery revisions using their recorded timeline', () => {
  const { revision, history } = sources()
  const initial = inspection.describeRenderInspection(revision, history)
  const delivered = inspection.describeRenderInspection({ ...revision, stage: 'render' }, history)
  assert.deepEqual(delivered.scenes, initial.scenes)
  assert.deepEqual(delivered.video, initial.video)
})

test('inspection samples stay on actual frames inside fractional scene boundaries', () => {
  assert.equal(typeof inspection.inspectionSceneSamples, 'function')
  const scene = { id: 'b', title: '主体', start: 0.101, end: 0.19 }
  const samples = inspection.inspectionSceneSamples(scene, 0.2, 30)
  assert.deepEqual(
    samples.map((sample) => sample.frame),
    [4, 4, 5],
  )
  for (const sample of samples) assert.ok(sample.time >= scene.start && sample.time < scene.end)
  assert.throws(
    () => inspection.inspectionSceneSamples({ ...scene, end: 0.102 }, 0.2, 30),
    /有效帧/,
  )
})

test('inspection rejects ambiguous timing and duplicate stable scene IDs', () => {
  assert.equal(typeof inspection.describeRenderInspection, 'function')
  const { revision, history } = sources()
  assert.throws(
    () =>
      inspection.describeRenderInspection(
        { ...revision, payload: { ...revision.payload, duration: 20 } },
        history,
      ),
    /时长/,
  )
  const missingTrack = sources([2, 0])
  assert.throws(
    () => inspection.describeRenderInspection(missingTrack.revision, missingTrack.history),
    /时长/,
  )
  const duplicate = structuredClone(history)
  ;(duplicate[0].payload as { scenes: { id: string }[] }).scenes[1].id = 'a'
  assert.throws(() => inspection.describeRenderInspection(revision, duplicate), /分镜/)
})

test('inspection keeps recorded technical checks separate from manual review', () => {
  const { revision, history } = sources()
  const payload = revision.payload as RenderPayload
  assert.equal(inspection.describeRenderInspection(revision, history).technicalCheck, 'unrecorded')
  const checked = {
    ...revision,
    status: 'review' as const,
    payload: { ...payload, checks: JSON.stringify({ ok: true, engine: 'remotion' }) },
  }
  const info = inspection.describeRenderInspection(checked, history)
  assert.equal(info.technicalCheck, 'passed')
  assert.equal(info.reviewStatus, 'review')
  assert.equal(
    inspection.describeRenderInspection(
      { ...checked, payload: { ...checked.payload, checks: '{"ok":false}' } },
      history,
    ).technicalCheck,
    'failed',
  )
})
