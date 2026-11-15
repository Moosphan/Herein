import { VIDEO_STAGES, VIDEO_STAGE_LABELS, type VideoStage } from './video-workflow'

const productionStages = VIDEO_STAGES.filter((stage) => stage !== 'render')
export function visibleVideoStages(imported = false): readonly VideoStage[] {
  return imported ? ['publish'] : productionStages
}
export function videoNodeStage(stage: VideoStage): VideoStage {
  return stage === 'render' ? 'roughcut' : stage
}
export function videoNodeLabel(stage: VideoStage) {
  return stage === 'roughcut' || stage === 'render' ? '视频制作' : VIDEO_STAGE_LABELS[stage]
}
export function nextVideoNode(stage: VideoStage): VideoStage {
  const index = productionStages.indexOf(videoNodeStage(stage) as (typeof productionStages)[number])
  return productionStages[index + 1] ?? 'publish'
}
