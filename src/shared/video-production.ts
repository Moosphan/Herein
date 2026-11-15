import {
  stageUnlocked,
  stageValue,
  type VideoProject,
  type WorkflowRevision,
} from './video-workflow'

/** Project the two historical video stages into one editable production node. */
export function productionRevision(project: VideoProject): WorkflowRevision | undefined {
  const roughcut = project.stages.roughcut
  const render = project.stages.render
  if (
    render &&
    (!roughcut ||
      stageValue(project, 'render')?.sourceRoughcut === roughcut.id ||
      render.createdAt > roughcut.createdAt)
  )
    return render
  return roughcut ?? render
}

export function productionReady(project: VideoProject) {
  return project.stages.render?.status === 'approved' && stageUnlocked(project, 'publish')
}

/** Reuse the visible final's actual sources, including its music, during edits. */
export function productionSourceProject(project: VideoProject): VideoProject {
  const revision = productionRevision(project)
  return revision?.stage === 'render' && !stageValue(project, 'render')?.imported
    ? { ...project, stages: { ...project.stages, roughcut: { ...revision, stage: 'roughcut' } } }
    : project
}
