# Contributing to Idea-Hub

Thank you for your interest in improving **Idea‑Hub** — we appreciate contributors! This document explains how to contribute and the rules that keep the repository healthy, stable, and friendly for the community (and for our CI server, which is emotionally fragile).

> **Short version:** Open an issue first for anything non-trivial. Keep PRs small and focused. **Do not** change core app behavior or data architecture without an RFC + maintainer approval. Tests and passing CI are required. Be respectful.

---

## Table of contents

* [Scope & goals](#scope--goals)
* [Code of conduct](#code-of-conduct)
* [Before you start — open an issue or discussion](#before-you-start---open-an-issue-or-discussion)
* [Branching & naming](#branching--naming)
* [Pull request rules and restrictions (the laws)](#pull-request-rules-and-restrictions-the-laws)
* [Data architecture & database changes](#data-architecture--database-changes)
* [Testing, CI and quality gates](#testing-ci-and-quality-gates)
* [Review, approvals and merging](#review-approvals-and-merging)
* [Security & sensitive data](#security--sensitive-data)
* [Commit messages and style](#commit-messages-and-style)
* [How to report bugs or propose big changes (RFC process)](#how-to-report-bugs-or-propose-big-changes-rfc-process)
* [Good first issues and ways to help](#good-first-issues-and-ways-to-help)
* [Pull request template & checklist](#pull-request-template--checklist)

---

## Scope & goals

Idea‑Hub aims to be a stable, community-maintained app that is easy to run locally and deploy. Contributions are welcome across the codebase, docs, tests, and examples. However, we prioritise stability and backward compatibility for users and the data they rely on.

## Code of conduct

We follow a standard Contributor Code of Conduct. Be professional, be kind, and assume good faith. If you see unacceptable behavior or have a concern, contact a maintainer.

## Before you start — open an issue or discussion

**Always** open an issue (or join an existing discussion) for any change that is:

* a new feature
* a change to the user experience or app flow
* a change to the data model or architecture
* anything non-trivial (more than a small bugfix)

Label the issue clearly (e.g. `proposal`, `bug`, `enhancement`) and include motivation, screenshots, and a short plan for implementation. This helps avoid duplicate effort and gives maintainers a chance to provide guidance early.

## Branching & naming

* Create feature branches from `main` or `develop` (follow repo convention).
* Use descriptive branch names: `fix/<short-desc>`, `feat/<short-desc>`, `docs/<short-desc>`, `refactor/<short-desc>`.
* Keep branches focused: one logical change per branch/PR.

## Pull request rules and restrictions (the laws)

These are the **hard rules** for pull requests. They exist to protect the app, users' data, and contributors' time.

1. **Small & focused PRs only.** A PR should do one thing and do it well. If your change touches multiple unrelated areas, split it into multiple PRs.
2. **No major edits to the app or data architecture without prior approval.**

   * If your change modifies overall app architecture, module boundaries, build system, or data schema, you **must** first open an issue or RFC and obtain explicit approval from at least one maintainer before opening a PR.
3. **No breaking changes without coordination.** Any change that may break backward compatibility (APIs, DB schema, file formats) must include a migration plan, compatibility strategy, and rollout notes.
4. **Do not make destructive changes to production data or the default sample data.** PRs must never include hard-coded production credentials or scripts that will delete or modify live user data.
5. **All PRs must include a clear description and link to the related issue** (if applicable). Describe motivation, implementation details, and testing steps.
6. **Include tests for behavior changes.** New features or bug fixes that affect logic should come with unit/integration tests. If adding UI behavior, include manual test steps and screenshots/GIFs.
7. **CI must pass.** All automated checks (lint, tests, build) must be green before maintainers will merge.
8. **No changes to generated files** (build artifacts, compiled bundles) unless the change is explicitly about build tooling — keep generated files out of PRs.
9. **Respect the app’s UX and data contracts.** Don’t change public APIs, endpoints, or file formats silently.
10. **Avoid large refactors in single PRs.** Large refactors must be broken into smaller, reviewable steps and discussed ahead of time.

If you’re unsure whether your change is “major”, err on the side of opening an issue and getting feedback first.

## Data architecture & database changes

Data is critical. The following rules apply to any change that touches data models, migrations, or storage:

* Any schema change requires a clear migration strategy and backwards compatibility plan. Include the migration SQL/scripts in the PR and document how to run them locally and in staging.
* Provide tests for migrations where possible (e.g., migrations that upgrade and downgrade a sample DB).
* Avoid data-destructive changes. If a change requires transforming or deleting existing data, provide a safe migration path and a recovery plan.
* Changes to data file formats (JSON/CSV) must be versioned and include migration tooling.
* Changes that expand storage requirements or add third‑party data services must list costs, privacy implications, and necessary configuration steps.

Major database restructures must go through the RFC process and be approved by maintainers before work begins.

## Testing, CI and quality gates

* Add or update tests for new behavior. We use the repository’s test framework — please follow existing patterns.
* Run linters and formatters locally. Fix reported issues before opening the PR.
* PRs that add features must include a `Testing` section explaining how reviewers can validate the change locally.
* Ensure builds and tests pass in CI. If CI fails after you pushed, update the branch promptly.

## Review, approvals and merging

* At least one maintainer approval is required for non-trivial PRs. For architectural changes, 2 maintainer approvals are recommended.
* Maintainters may request changes — please respond and update the PR promptly.
* Merges will be done by maintainers after approvals and green CI. We usually use `Squash and merge` to keep history tidy (follow repo settings).

## Security & sensitive data

* Do not include passwords, API keys, private certificates, or other secrets in commits or PRs. Use environment variables and secret stores.
* To report a security vulnerability, open a **private** issue labelled `security` or email a maintainer directly. Do not disclose vulnerabilities publicly until fixed.

## Commit messages and style

* Use clear, concise commit messages. Follow the conventional format if you like (e.g., `feat:`, `fix:`, `docs:`), but clarity matters more.
* Keep changes small and well-described.

## How to report bugs or propose big changes (RFC process)

1. Open an issue describing the problem or proposal.
2. If it’s a major change (architecture, DB, API), write an RFC in `docs/rfc/` or attach the design in the issue. Include: motivation, alternatives, impact, migration plan, tests, rollout strategy.
3. Get maintainers’ feedback and approval before implementing.

## Good first issues and ways to help

Look for issues labelled `good first issue`, `help wanted`, or `documentation`. Help with docs, tests, small bug fixes, and triaging issues is highly appreciated.

---

## Pull request template & checklist

When you open a PR, please fill the checklist below and include this information in the PR description.

### PR title

`<type>(<area>): short description` — e.g. `fix(api): handle empty user profiles`

### PR description (please include)

* **Related issue:** #(issue-number) or `N/A`
* **Summary:** What changed and why
* **How to test:** Steps to reproduce, commands to run, expected behavior
* **Screenshots / GIFs:** (if UI changes)
* **Migration notes:** (if schema or data changes)

### PR checklist — required

* [ ] I opened an issue or confirmed this change is acceptable with maintainers for non-trivial or architectural changes.
* [ ] My change is small and focused (or split into multiple PRs if large).
* [ ] CI passes (lint, tests, build).
* [ ] All new and existing tests pass locally.
* [ ] No secrets or production credentials are included.
* [ ] I added/updated tests and documentation where appropriate.
* [ ] For any data/schema changes: a migration plan is included and tested.
* [ ] I have linked the PR to the related issue and documented how to test it.

---

## License & contributor agreement

By contributing, you agree that your contributions will be made under the repository license. If any additional contributor license or DCO is required, maintainers will document it in this file.

## Thank you

Thank you for helping keep Idea‑Hub alive, stable, and useful. Small, well-tested contributions make this project better for everyone. If you'd like, ping a maintainer in the issue to get a friendly review — we're human (mostly😂😂 ).

> **Pro tip:** If your PR title includes the word `typo`, maintainers may respond faster. 😉

---

*Last updated: September 5, 2025*
