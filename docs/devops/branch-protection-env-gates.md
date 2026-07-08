# Branch Protection & Environment Gates

This guide sets up **GitHub Environments** (approval gate before release) and
**Branch Protection Rules** (enforce PR reviews + CI passing).  
No cloud infrastructure required — these are GitHub-native controls.

---

## How It Works

```
push to main
     │
     ▼
Phase 1 ──────────────────────────────────────── (parallel, ~5 min)
 ├─ quality-checks
 ├─ backend-tests
 ├─ terraform-checks
 ├─ infracost-estimation
 ├─ secret-scan
 ├─ codeql-sast
 └─ trivy-fs-scan
     │
     ▼
Phase 2 ── Build, Scan & Push Docker Image + SBOM (~10 min)
     │
     ▼
⏸  ENVIRONMENT GATE ──► reviewer clicks "Approve & Deploy" in GitHub UI
     │
     ▼
Phase 3 (only after approval)
 ├─ semantic-versioning  ── bumps tag, creates GitHub Release, sends email
 └─ security-report      ── generates & emails DevSecOps report
```

---

## Part 1 — Create the `production` Environment

### Steps

1. Open your repository on GitHub.
2. Go to **Settings → Environments**.
3. Click **New environment**.
4. Name it exactly: **`production`** *(must match the workflow)*
5. Click **Configure environment**.

### Protection Rules to Configure

| Setting | Value |
|---------|-------|
| **Required reviewers** | Add yourself (+ any teammates) |
| **Wait timer** | `5` minutes *(buffer to cancel bad pushes)* |
| **Deployment branches** | Restrict to `main` and `master` only |

> **Important:** The *Required reviewers* field is what creates the manual
> approval pause. Without it the environment exists but won't block the pipeline.

Click **Save protection rules**.

---

## Part 2 — Branch Protection Rules

1. Go to **Settings → Branches → Add rule**.
2. **Branch name pattern:** `main` (repeat separately for `master` if used).

### Recommended Settings

| Rule | Value |
|------|-------|
| Require a pull request before merging | ✅ |
| — Required approvals | `1` |
| — Dismiss stale reviews on new commits | ✅ |
| Require status checks to pass | ✅ |
| — Require branches to be up to date | ✅ |
| Do not allow bypassing the above | ✅ |
| Restrict who can push to matching branches | ✅ (admins only) |

### Status Checks to Add

Copy these names exactly (they match the `name:` field in each CI job):

```
Code Quality & Linting
Backend Unit Tests
Terraform Validation
Infracost FinOps Estimation
Secret Scanning
CodeQL Analysis
Trivy Filesystem Scan
OWASP ZAP DAST Scan
Build, Scan & Push Docker Image
SBOM - Filesystem & Dependencies
```

> The checks only appear in the dropdown after the pipeline has run at least once.
> Run the pipeline on a branch first, then come back to add them here.

Click **Save changes**.

---

## Part 3 — What the Reviewer Sees

When a push to `main` finishes Phase 2, GitHub will:

1. Send an **email** to all required reviewers.
2. Show a **"Waiting"** badge on the Actions run UI.
3. Block Phase 3 until someone approves.

The reviewer navigates to:

```
Actions → [the failing run] → Review deployments → ✅ Approve and deploy
```

They can add a comment before approving, e.g. `"Tested on dev, good to release"`.

---

## Part 4 — Verify It's Working

Trigger the pipeline with an empty commit:

```bash
git commit --allow-empty -m "chore: test env gate"
git push origin main
```

**Expected outcome:**

| Phase | Status |
|-------|--------|
| Phase 1 (checks) | ✅ Auto-runs |
| Phase 2 (build + scan) | ✅ Auto-runs |
| `semantic-versioning` | ⏸ **Waiting for approval** |
| `security-report` | ⏸ **Waiting for approval** |
| After approval → Phase 3 | ✅ Runs and creates GitHub Release |

---

## Secrets Required

Confirm these are set under **Settings → Secrets and variables → Actions**:

| Secret | Used by |
|--------|---------|
| `GITHUB_TOKEN` | Auto-provided — GHCR push, release creation |
| `MAIL_USERNAME` | Release email + security report email |
| `MAIL_PASSWORD` | Gmail App Password |
| `INFRACOST_API_KEY` | Infracost FinOps job |

---

## Files Changed

| File | What changed |
|------|-------------|
| [ci-cd.yml](../../.github/workflows/ci-cd.yml) | Added `environment: production` (+ `url`) to `semantic-versioning` and `security-report` jobs |
| [branch-protection-env-gates.md](./branch-protection-env-gates.md) | This guide |
