# Repository Constitution

Effective date: 2026-04-18

## Agent Mission

- **Mission:** Define and enforce safe, transparent, and accountable behavior for automation agents interacting with this repository and its contributors.

## Agent Vision & Goals

- Provide helpful, automatable tools that accelerate contributor workflows while preserving human oversight and security.
- Ensure agents operate with least-privilege, clear audit logs, and an explicit refusal policy for risky or sensitive tasks.

## Agent Operating Principles

- **Human Oversight:** All agent-initiated changes require human review and a PR before merge unless explicitly listed as safe automated maintenance.
- **Least Privilege:** Agents must run with the minimum permissions necessary; secrets must never be exposed to agents.
- **Transparency:** Agents should annotate PRs and actions with an explanation of intent and a link to the decision rationale.
- **Safety & Ethics:** Agents must refuse requests involving disallowed content, secret exfiltration, or high-risk infrastructure changes.
- **Auditability:** Agent actions must be logged and reviewable; include agent identity in commits/PR descriptions.

## Agent Onboarding & Offboarding

- **Onboarding:** Document agent purpose, owner, permissions, and approved scopes in a PR; add records to `AGENTS.md` or `.github/agents/`.
- **Offboarding:** Revoke keys/permissions, remove automation from CI, and archive configuration with rationale.

## Agent Change & Exception Process

- Changes to agent behavior or permissions require a PR, at least one maintainer approval, and a security review for elevated scopes.
- Exceptions (temporary elevated permissions) must be timeboxed, logged, and approved by the maintainer.

This document defines governance, contributor expectations, review rules, and security procedures for the rbr-planning repository. It is a living document maintained by the repository owner.

---

## 1. Purpose & Scope

- Purpose: host and maintain the RBR Planning Next.js application and related assets.
- Primary branch: `main`.
- Scope: application source under `src/`, public assets, docs, and CI configuration.

## 2. Governance Model

- Model: **Single owner**. The repository owner (maintainer) has final decision authority.
- Maintainer: repository owner (contact placeholder: replace with GitHub handle or email).

Responsibilities of the maintainer:
- Final approvals and merges when policy/checklist is satisfied.
- Configure and maintain CI, branch protection, secrets, and repository settings.
- Triage security reports and coordinate fixes.

## 3. Roles

- **Maintainer (Owner)** — final decision-maker, reviews critical changes, approves merges.
- **Contributors** — open issues, submit PRs that follow the Contribution Workflow, and respond to reviewer feedback.

## 4. Contribution Workflow

- Branching:
  - Long-lived branch: `main`.
  - Feature branches: `feature/<short-desc>`.
  - Bugfix branches: `fix/<short-desc>` or `fix/<issue-number>-<desc>`.
  - Hotfix branches: `hotfix/<short-desc>`.

- Pull Requests (PRs):
  - Base branch: `main`.
  - A PR must include the following before requesting review:
    1. Linked issue or a referenced requirement/spec file.
    2. Test strategy — description of how the change will be validated (automated and/or manual).
    3. Implementation plan — short notes explaining approach, migration, rollback strategy.
    4. Implementation (code) and tests where applicable.

- PR Checklist (required):
  - [ ] Description and linked issue/spec present.
  - [ ] Test strategy included; automated tests added when possible.
  - [ ] Implementation plan documented.
  - [ ] Spec/requirement file attached or referenced.
  - [ ] CI `build` check passed (required).
  - [ ] Commit messages explain intent.
  - [ ] At least one approval from a reviewer or the maintainer.

## 5. Review & Merge Rules

- Minimum approvals: **1** (maintainer or assigned reviewer).
- Required status checks: **CI build** must pass before merge.
- No direct pushes to `main` — all changes must come through PRs.
- Maintainer may merge once the checklist is complete and checks are green.

## 6. Commit Messages

- Every commit message must explain intent:
  - One-line summary (imperative mood).
  - Optional body with reasoning, linked issue/spec, and notes about migrations or trade-offs.

Example:

```
Fix: enforce unique guest ids in table assignment

The guest import could produce duplicate IDs when merging lists.
This change deduplicates by email and keeps stable ordering.
Fixes #123.
```

## 7. CI and Quality Gates

- Required: CI must run and **pass the build** step before merges are allowed.
- Recommended: add lint, type-check, and unit/integration tests to CI.
- Branch protection (recommended): require passing `build` status and at least 1 approval on `main`.

## 8. Code Ownership

- The maintainer is the ultimate owner for the repository. For automated review assignment, add a `CODEOWNERS` file under `.github/`.

Sample `CODEOWNERS` (replace `@OWNER`):

```
# All files
*    @OWNER
src/**    @OWNER
```

## 9. Security & Incident Response

- See `SECURITY.md` for reporting process, timelines, and responsible disclosure guidelines.
- Maintainer triages security reports and coordinates fixes.

## 10. Releases & Versioning

- This repository does **not** follow a formal release/versioning policy.
- Tags may be used to mark milestones, but no automated semantic-version release policy is enforced.

## 11. Amendment Procedure

- Changes to this constitution are made by PR against `main`.
- For governance changes, the maintainer must approve the PR. A 7-day comment period is recommended for non-urgent changes.

## 12. Code of Conduct

- This repository does **not** adopt a formal Code of Conduct (per current maintainer preference).

---

## Appendix — PR template (recommended)

Title: Short, descriptive title

Description:
- What changed and why.
- Linked issue/spec: 

Test strategy:
- How this change is validated (automated tests, manual steps).

Implementation plan:
- Short bullets describing approach and migration/rollback notes.

Files changed:
- List significant files or areas.

Checklist:
- [ ] Description and spec present
- [ ] Test strategy present
- [ ] CI `build` passed
- [ ] At least 1 approval

## Appendix — Quick CODEOWNERS sample

Put this in `.github/CODEOWNERS` (replace `@OWNER`):

```
# Default owner for everything
* @OWNER

# Source code owner
src/** @OWNER
```
