# Audio Sequence Implementation Plan

> **For agentic workers:** Execute inline in the authorized primary checkout on main. User approved one complete task; no additional execution-choice prompt is needed.

**Goal:** Sequentially preview ready voiceover segments, retain the last current item on stop, and never resume because generation finishes later.

**Architecture:** A scoped AudioTrackSequence business component owns current selection and normal-ended transitions through capture events on the existing native audio elements. AudioTrackPlayer continues owning loading, error and native control state. The list remounts only when its project/version/job playback scope changes; append-only progress preserves players. The next segment is checked against the current rendered sequence and in-progress modifications at the ended event, with no generation-completion effect that can start playback.

**Tech Stack:** React 18, TypeScript, existing workflow native audio and CSS, Electron regression harness.

## Global Constraints

- Keep primary checkout `/Users/dorck/self-projects/Herein` on `main`.
- Preserve item order, width, density, actions and native controls.
- Reuse VIDEO-WORKFLOW-001 controls/theme compatibility; no dependency migration.
- Only normal ended events from the active playing element may start the immediate next ready segment.
- Pauses/errors retain current selection; unavailable next segments terminate the sequence.
- User explicitly authorized this scope; GitHub task #22 has no blockers.

## Task 1: Complete the playback flow (#22)

- [x] Extend the existing Electron audio-controls harness with `--playback-only` and `scripts/verify-workflow-audio-playback.cjs`, using real WAV playback and temporary database progress fixtures.
- [x] Verify the expected failing assertion: `Pause keeps the current item highlighted`.
- [x] Create `src/renderer/modules/video/workflow/AudioTrackSequence.tsx`. Interface: `{ tracks: AudioTrack[]; blockedIds: string[]; children: (currentId: string | null) => ReactNode }`. Own `HTMLAudioElement | null` active ref and `string | null` current state; ignore paused/stale play and ended events, reset next currentTime before play, handle play promise rejection without retry. Unmount pauses all descendant audio nodes.
- [x] Wrap MediaPanels' existing track mapping with this component, keyed by project and selected history/current revision or pending generation job. Pass running modification targets as blocked IDs. Pass `current={currentId===track.file.id}` to AudioTrackPlayer.
- [x] Add track ID and aria-current to AudioTrackPlayer, separate `data-current` from `data-playing`, and change only the title-highlight selector in workflow.css to use current state.
- [x] Pass the focused Electron regression: natural handoff, pause/end/error retention, no delayed playback after missing/regenerating next segment, playback rejection, old events, version/page exit and keyboard.
- [x] Update the older full-workflow UI expectations to distinguish playback state and retained current selection.
- [x] Run existing audio-controls regression, affected-source ESLint, application build, design:check and design:build. Inspect paused-item light/dark 1440/1024/200% screenshots and document existing type-check baseline.
- [x] Update page-specs-v2.md and migration.md with the new user-authorized behavior and verification evidence. Record verified progress on #22 without modifying a parent issue.
- [x] Build daily release, wait for active user tasks if any, restart and verify running source fingerprint. User accepted the feature and separately authorized commit/push on 2026-11-19.
