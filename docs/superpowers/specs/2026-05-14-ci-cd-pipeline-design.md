# CI/CD Pipeline Design

## Date

2026-05-14

## Goal

Fully automated CI/CD pipeline for OpenMemBrain. Merging feature PRs to `main` should eventually result in an npm publish and GitHub Release with zero manual intervention beyond the feature PR review itself.

## Context

- Monorepo with npm workspaces: `packages/*` (all private), `apps/mcp-server` (the only publishable package, `openmembrain` on npm)
- Existing `ci.yml` runs typecheck + tests on 3 OSes — works correctly, no changes needed
- Existing `release.yml` uses `changesets/action` — correct pattern but never exercised; needs auto-merge and GitHub Releases
- `@changesets/cli` is installed with a `fixed` versioning group
- Current version: `0.1.2`, published manually (no git tags exist)

## End-to-End Flow

```
1. Work on a feature branch
2. Open a PR to main
   - OpenCode creates .changeset/*.md as part of PR (via AGENTS.md instructions)
   - If missing: changeset-fallback workflow auto-generates one from PR title
3. CI runs: typecheck + tests on 3 OSes (existing ci.yml)
4. Merge PR to main
5. release.yml: changesets/action opens/updates a "Version Packages" PR
   - Bumps version in package.json files
   - Updates CHANGELOG.md
   - Auto-merge is enabled on the PR via `gh pr merge --auto --squash`
6. CI runs on the version PR
7. Version PR auto-merges when CI is green
8. release.yml fires again on the merge commit
   - changesets/action detects no pending changesets -> runs publish
   - Publishes openmembrain to npm
   - Creates GitHub Release with git tag and changelog
```

## Changes

### 1. Modify `.github/workflows/release.yml`

Add `id: changesets` to the changesets/action step. Add a new step after it:

```yaml
- name: Enable auto-merge on version PR
  if: steps.changesets.outputs.hasChangesets == 'true' && steps.changesets.outputs.pullRequestNumber != ''
  run: gh pr merge ${{ steps.changesets.outputs.pullRequestNumber }} --auto --squash
  env:
    GH_TOKEN: ${{ secrets.GITHUB_TOKEN }}
```

No other changes to this file.

### 2. New `.github/workflows/changeset-fallback.yml`

Triggers: `pull_request` (opened, synchronize, edited) targeting `main`.

Logic:

1. Check if any `.changeset/*.md` file exists (excluding `README.md`) in the PR diff
2. If a changeset already exists, exit early (do nothing)
3. If no changeset exists, parse the PR title for conventional commit prefix:
   - `fix:`, `patch:`, `chore:`, `docs:`, `refactor:`, `style:`, `perf:`, `ci:`, `build:`, `test:` -> **patch**
   - `feat:` -> **minor**
   - `feat!:` or PR body contains `BREAKING CHANGE` -> **major**
   - No recognized prefix -> **patch** (safe default)
4. Generate a `.changeset/<random-id>.md` file with the bump type and PR title as description
5. Commit and push to the PR branch

Permissions: `contents: write` (to push the changeset file to the PR branch).

Note: This workflow needs write access to the PR branch. For PRs from forks, GitHub restricts this — but since this is a personal repo where PRs come from your own branches, this is not a concern.

### 3. Add changeset instructions to `AGENTS.md`

Add a section instructing AI tools to create changeset files when preparing PRs. Includes the file format and bump type convention.

### 4. One-time manual setup

These cannot be automated via workflow files and must be done by the repo owner:

| Task | How |
|------|-----|
| Create baseline git tag | `git tag v0.1.2 main && git push origin v0.1.2` |
| Enable auto-merge | Repo Settings > General > "Allow auto-merge" checkbox |
| Add branch protection | Repo Settings > Branches > Add rule for `main`: require `check` status checks to pass |
| Verify NPM_TOKEN secret | Repo Settings > Secrets and variables > Actions: ensure `NPM_TOKEN` is set |

### 5. Optional: Clean up `.changeset/config.json`

The `fixed` group lists private packages alongside `openmembrain`. This works (changesets skips private packages for publishing) but is slightly misleading. Could simplify to only list `openmembrain`, or leave as-is for clarity that versions are conceptually linked.

Decision: **Leave as-is.** It documents the intent that all packages version together.

## What Doesn't Change

- `ci.yml` — untouched
- All `package.json` files — untouched
- `tsup.config.ts` — untouched
- `.changeset/config.json` — untouched (optional cleanup deferred)
- Build process — `prepublishOnly` already handles building before publish

## Risks and Mitigations

| Risk | Mitigation |
|------|------------|
| Auto-merge publishes a broken release | CI must pass before auto-merge; same tests that gate feature PRs |
| Changeset fallback generates wrong bump type | OpenCode-created changesets are primary; fallback is safety net only |
| `NPM_TOKEN` expires or is revoked | Publish step will fail visibly in GitHub Actions; fix by rotating the token |
| Branch protection blocks the version PR | changesets/action uses `GITHUB_TOKEN` which bypasses branch protection for GitHub Actions bots |
