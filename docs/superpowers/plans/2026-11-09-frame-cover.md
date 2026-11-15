# Publication frame cover Implementation Plan

> **For agentic workers:** Execute task by task; independent #14 sample acceptance can proceed separately using subagent-driven-development. No commits or branch changes in this dirty worktree.

**Goal:** GitHub #15 lets both publishing platforms select a real final-video frame using a slider, save it as a draft cover and approve it through the existing flow.

**Architecture:** A narrow cancellable main service probes and verifies the current approved final render, extracts one PNG and creates platform-specific files with frozen provenance. Existing publication metadata/history/posting/export carry the cover; Bilibili retains 1600×900/1200 centered crops, Douyin keeps source dimensions. The existing cover area opens a slider/video dialog; confirming updates only the selected platform's draft.

**Tech Stack:** Electron, TypeScript, FFmpeg/FFprobe, existing React 18 / Radix / Voice controls under VIDEO-WORKFLOW-001.

## Decisions

- User approved both platforms, slider dialog, Bilibili centered crops and Douyin original aspect on 2026-11-09.
- Preserve video/narration/history, original publish review/save gates and workbench layout. No Agent call for selected frame.
- Track independent #15 related to #14; do not modify parent #10.
- Preserve unrelated dirty changes, including Image2 recovery changes in covers.ts and cover UI fixtures.

## Tasks

- [x] Write failing validation/provenance tests, extend PublicationCover for frame metadata and platform dimensions while preserving legacy AI covers.
- [x] Write failing real extraction/service tests; implement current-render ownership, hash, bounds, cancellation, PNG outputs, publication validation and IPC.
- [x] Write Electron slider/confirm/cancel/platform tests; add picker and platform-specific cover history integration with existing controls. Initial UI run exposed a test selector mismatch; corrected radio selection and reran successfully.
- [x] Verify pixel correctness, scheduled publishing snapshots/export, history/source invalidation, keyboard/themes/viewports/200%, build/design checks; review and record evidence in #15. Review identified a SAR distortion P2, fixed with real service and Electron save/review/export regression. No real public upload performed. Evidence: docs/design-system/frame-cover-verification.md.
- [x] Deploy daily build when no production jobs run, verify source fingerprint; leave changes uncommitted. Latest release 319f317d-51f1-43db-bc8e-0454088006e4 responds and matches source; production running video jobs were 0.
