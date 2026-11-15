# Private Draft Releases Implementation Plan

**Goal:** Successful main-branch CI builds upload installers to one non-public GitHub draft release per run.

**Architecture:** A single trusted preparation job creates an empty draft per run. Each platform uses a shared draft-only uploader after packaging. The uploader derives a unique tag from run number and commit, verifies the release is still a draft for that exact commit, and uploads only the platform's installers and checksums. No Actions artifacts hold installers. PRs never get release write permissions.

**Tech Stack:** GitHub Actions, GitHub CLI, Node.js standard library.

## Constraints

- Public repo stays public; release stays draft; never call publish or edit visibility.
- Uploads execute only on main push or main workflow_dispatch, never pull_request.
- Repeated uploads share a run-specific draft and reject published releases or mismatched commits.
- No unrelated gallery/material changes in commits.
- Existing previously uploaded public Actions artifacts are not deleted automatically.

## Steps

- [x] Add Node tests with a fake gh runner: draft creation, rerun, published/mismatched release rejection, missing or unsafe assets rejection, PR rejection.
- [x] Implement scripts/upload-draft-release.mjs with exact-commit draft guard, unique run tag, local checksums, platform asset allowlist.
- [x] Replace installer Actions artifact uploads with shared uploader; remove unreachable public release job; use explicit contents permission for trusted events only and --publish never on all packagers.
- [x] Update English/Chinese download instructions, explaining draft access and the remaining public source/build logs.
- [ ] Run Node tests, syntax/YAML checks, independent review, then commit/push main.
- [ ] Wait for real CI; verify all installer assets attached and draft=true, and anonymous release lookup cannot access draft. Report authenticated download entry.
