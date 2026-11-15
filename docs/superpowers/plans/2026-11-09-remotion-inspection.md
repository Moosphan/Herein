# Remotion actual video inspection Implementation Plan

> **For agentic workers:** Use executing-plans to implement this plan task-by-task. Track progress with the checkboxes below.

**Goal:** Deliver GitHub #13: inspect real roughcut frames and compare stable scenes across revisions without changing approval or creative freedom.

**Architecture:** Resolve only the selected revision's recorded storyboard/audio, map three relative scene phases to real video frames, and extract with FFmpeg. A read-only IPC service returns managed images with video hash, revision and timestamps. The confirmed dialog keeps each revision's independent timeline and uses the existing modification entry.

**Tech Stack:** TypeScript, Electron IPC, FFmpeg/FFprobe, existing React 18/Radix/Voice controls (VIDEO-WORKFLOW-001).

## Constraints

- User confirmed on 2026-11-09: button in roughcut specifications row, existing dialog, scene selection, three actual frames, optional earlier revision alongside, frame seeks player.
- Preserve desktop layout, information order, compact density, themes, review sidebar/actions, existing manual plan confirmation and historical outputs.
- No template or animation restrictions, model-based visual approval, automatic review, or calls to Agent.
- Historical sources never fall back to latest stages. Missing source/common scene/extraction failures remain explicit.
- Do not change/close parent #10. #14 remains the full-film acceptance task.

## Steps

- [x] Write and run failing semantic timing/source tests; implement shared inspection contracts in `src/shared/video-frame-inspection.ts`.
- [x] Write and run failing real FFmpeg/ownership/tamper/failure/cancel tests; implement `src/main/services/video-workflow/frame-inspection.ts`, service lifecycle and IPC.
- [x] Add failing Electron dialog/seek/comparison tests; implement `RenderFrameInspection.tsx` and roughcut entry in `MediaPanels.tsx`.
- [x] Run affected suites, build, design checks and Electron keyboard/theme/viewport/zoom checks. Inspect screenshots.
- [x] Record verification and design migration, update #13 evidence. Build/restart daily runtime only with no active production video jobs.

Evidence: [#13 progress](https://github.com/Moosphan/MyDashboard/issues/13#issuecomment-6734999576), [verification](../../design-system/remotion-frame-inspection-verification.md). Daily release `d55b1ab1-5121-47ce-8a39-fc87b61c7bff` responds and matches source. Changes remain uncommitted/unpushed; #14 full-film acceptance remains open.
