import assert from 'node:assert/strict'
import test from 'node:test'
import { subtitleCues } from '../src/main/services/video-workflow/audio'
import type { AudioTrack } from '../src/shared/video-workflow'

const track = (text: string, duration = 8): AudioTrack => ({
  sceneId: 'seed',
  text,
  duration,
  file: { id: 'audio', path: 'audio.wav', mime: 'audio/wav', sha256: 'a'.repeat(64), size: 1 },
})

test('captions keep English words and attached punctuation intact', () => {
  const text = 'A seed holds the beginning of a forest. Its small shell protects a living future.'
  const cues = subtitleCues([track(text)])
  assert.equal(cues.map((cue) => cue.text).join(' '), text)
  assert.ok(cues.every((cue) => cue.text.trim() && !/^[\p{P}\p{S}\s]+$/u.test(cue.text)))
  assert.ok(cues.every((cue) => cue.text.length <= 24))
  assert.equal(cues.at(-1)!.start + cues.at(-1)!.duration, 8)
})

test('captions preserve Chinese, mixed text, graphemes and long unsplittable words', () => {
  const texts = [
    '种子在温暖的土壤中慢慢发芽，根向下生长，第一片绿叶向着太阳展开。',
    "Remotion keeps don't and mother-in-law together，画面继续生长。",
    'A family 👨‍👩‍👧‍👦 watches a seed grow into a young tree.',
    'pneumonoultramicroscopicsilicovolcanoconiosis grows.',
  ]
  for (const text of texts) {
    const cues = subtitleCues([track(text)])
    assert.equal(
      cues
        .map((cue) => cue.text)
        .join('')
        .replace(/\s/g, ''),
      text.replace(/\s/g, ''),
    )
    for (const word of text.match(/[A-Za-z]+(?:['-][A-Za-z]+)*/g) ?? [])
      assert.ok(
        cues.some((cue) => cue.text.includes(word)),
        `split word: ${word}`,
      )
    assert.ok(cues.every((cue) => cue.duration > 0 && cue.text.trim()))
    assert.ok(cues.every((cue) => !cue.text.startsWith('\u200d') && !cue.text.endsWith('\u200d')))
    assert.equal(cues.at(-1)!.start + cues.at(-1)!.duration, 8)
  }
})

test('caption timing covers each measured track and skips silent text without losing its offset', () => {
  const cues = subtitleCues([
    track('  \n ', 1.25),
    track('A seed holds the beginning of a forest.', 3.5),
    track('Young leaves unfold.', 2.125),
  ])
  assert.equal(cues[0].start, 1.25)
  assert.equal(cues.at(-1)!.start + cues.at(-1)!.duration, 6.875)
  for (let index = 1; index < cues.length; index++)
    assert.equal(cues[index - 1].start + cues[index - 1].duration, cues[index].start)
})
