# Unified video production Implementation Plan

> **For agentic workers:** Execute the tightly coupled workflow task sequentially; use subagent-driven-development for the independent #14 caption/material follow-up and review. Preserve all unrelated dirty edits. No commits or branch changes.

**Goal:** One visible 视频制作 node produces delivery-quality video, supports creation/revision/music/inspection/history, and needs one human video approval before publication.

**Architecture:** Keep legacy roughcut/render storage identifiers for compatibility, use roughcut as the editable production revision and render as its publication-facing frozen alias. Approval promotes verified delivery video atomically without rendering or a second approval. Existing final revisions remain authoritative until a new production revision changes. UI projects the two legacy stages into one node, including final-only music and legacy history.

**Tech Stack:** Electron, React18/Radix/Voice controls under VIDEO-WORKFLOW-001, TypeScript, SQLite, FFmpeg, Remotion/HyperFrames.

## Global Constraints

- User confirmed single-node/single-video-review flow on 2026-11-09; retain workbench layout and publishing metadata approval.
- Do not constrain Remotion visual imagination; preserve facts, audio, captions, duration, scene-change boundaries and frozen material provenance.
- Preserve old videos, review state and all histories; never claim legacy preview quality was delivery encoded.
- Isolated tests only; no production automatic review or public upload. No commits/pushes.

## Tasks

- [x] Create approved standalone GitHub issue linked to #14/#15: #16.
- [x] Backend: failing tests for delivery output, verified promotion on single approval, stale/legacy cases; implement atomic promotion with source provenance and no creative call or rerender. Music uses frozen production sources and new pending revision. Keep internal identifiers for old callers. Review follow-ups below remain in progress.
- [x] UI: read design contracts; unify navigation/next step/status; put music and all video controls in production node, retain legacy history and current final preview; remove duplicate user step and approval. Update confirmed page specification/migration.
- [x] Independent #14: reproduce caption word splits and opaque test material; fix segmentation and fixture at source, regression-test, preserve original sample evidence. Diagnostic videos and alpha tests recorded in .scratch/remotion/caption-material-report.md, issue updated.
- [x] Review follow-up: retain latest visible delivery even when stale, restore that exact video on cancel/reuse, validate music-only registered material scope against frozen sources; add regressions and verify. Same-millisecond ordering also covered.
- [x] Integration: workflow 106/106, publishing 30/30, native 20/20 and real landscape/portrait rendering; Electron new/legacy/music/frame-cover flows and keyboard/themes/viewports passed. Build/design/format/diff passed; global types retain unrelated existing errors.
- [x] Document exact validation/limits, deploy daily release a894b02e-5807-4c6e-9d50-449f3237bc94 with zero running production jobs, verify responding control and source fingerprint. Issue #16 progress recorded; code remains uncommitted.
