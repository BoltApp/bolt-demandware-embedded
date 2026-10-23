# GitHub Actions workflows

- `ci.yml`: lint, unit tests and, on `master`, QA sandbox (zzgv-018) upload.
- `release.yml`: manual (`workflow_dispatch`) cartridge release with a `tag` input.
- `labeler.yml`: PR labeler.

## CircleCI history

CI ran on CircleCI from 2022-07 (`357bc37`) until GitHub Actions took over on 2026-08-28 (`230961f`, #215; dual-run until `.circleci/` was removed in #217). The last substantive CircleCI change was 2023-09-06 (`8beb793`).

Migrated:

| CircleCI | GitHub Actions |
|---|---|
| `sfcc-flow` / `lint-and-unit-test` | `ci.yml` / `lint-and-unit-test` |
| `sfcc-flow` / `update-qa-sandbox` | `ci.yml` / `update-qa-sandbox` (plus a `concurrency` group) |
| `sfcc-release-flow` (`create-release`, `publish-github-release`) | `release.yml` |
| Slack `notify-buildcop` | Google Chat webhook step in `ci.yml` |

Not migrated:

- `sfcc-flow` / `integration-tests`: triggered the SFRA suite (V1, zzgv-002) in the archived `BoltApp/integration-tests` repo.
- `auto-release` (monthly cron, `create-auto-release`): already commented out in CircleCI.

The old config is in git history: `git show 230961f64480:.circleci/config.yml` (or `git log -- .circleci/`).
