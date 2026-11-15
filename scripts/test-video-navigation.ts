import test from 'node:test'
import assert from 'node:assert/strict'
import {
  visibleVideoStages,
  videoNodeStage,
  nextVideoNode,
  videoNodeLabel,
} from '../src/shared/video-workflow-navigation'

test('video creation exposes one production node between audio and publishing', () => {
  assert.deepEqual(visibleVideoStages(false), [
    'brief',
    'copy',
    'storyboard',
    'narration',
    'audio',
    'roughcut',
    'publish',
  ])
  assert.equal(nextVideoNode('audio'), 'roughcut')
  assert.equal(nextVideoNode('roughcut'), 'publish')
  assert.equal(nextVideoNode('render'), 'publish')
  assert.equal(videoNodeStage('render'), 'roughcut')
  assert.equal(videoNodeLabel('roughcut'), '视频制作')
  assert.equal(videoNodeLabel('render'), '视频制作')
})

test('imported films retain publication-only flow', () => {
  assert.deepEqual(visibleVideoStages(true), ['publish'])
  assert.equal(nextVideoNode('publish'), 'publish')
})
