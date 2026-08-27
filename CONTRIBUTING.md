# Contributing to Consistium

## Commit Message Convention

This project uses [Conventional Commits](https://www.conventionalcommits.org/) to automate semantic versioning and release notes. Every commit to `main`/`master` triggers a version bump based on the commit message prefix.

### Version Bump Rules

| Prefix | Version Bump | Example | Result |
|--------|-------------|---------|--------|
| `fix:` | **Patch** (0.0.X) | `fix: resolve login timeout` | v1.0.0 → v1.0.1 |
| `feat:` | **Minor** (0.X.0) | `feat: add streak counter` | v1.0.0 → v1.1.0 |
| `feat!:` | **Major** (X.0.0) | `feat!: redesign dashboard` | v1.0.0 → v2.0.0 |
| `fix!:` | **Major** (X.0.0) | `fix!: change auth token format` | v1.0.0 → v2.0.0 |

> **⚠️ Important:** The `!` after the type is what triggers a major version bump — not the words in your description. Writing `feat: major redesign` will only bump the **minor** version!

### Commit Message Format

```
<type>[optional scope][!]: <description>

[optional body]

[optional footer(s)]
```

### Allowed Types

| Type | Purpose |
|------|---------|
| `feat` | A new feature |
| `fix` | A bug fix |
| `docs` | Documentation changes only |
| `style` | Code style (formatting, semicolons, etc.) — no logic change |
| `refactor` | Code restructuring — no feature or bug fix |
| `perf` | Performance improvement |
| `test` | Adding or updating tests |
| `build` | Build system or dependency changes |
| `ci` | CI/CD pipeline changes |
| `chore` | Maintenance tasks (deps, configs) |
| `revert` | Reverting a previous commit |
| `security` | Security-related changes |
| `infra` | Infrastructure changes (Terraform, Helm, etc.) |

### Breaking Changes (Major Version Bump)

There are **two ways** to signal a breaking change:

**Option 1 — Exclamation mark** (recommended for short descriptions):

```
feat!: replace REST API with GraphQL
```

**Option 2 — BREAKING CHANGE footer** (recommended when you need detail):

```
feat: replace REST API with GraphQL

BREAKING CHANGE: all /api/v1 endpoints removed, use /graphql instead
```

Both methods trigger a **major** version bump. You can also combine them.

### Scopes (Optional)

Scopes add context about what part of the codebase changed:

```
feat(auth): add OAuth2 login
fix(ui): resolve button overflow on mobile
ci(helm): add chart validation job
infra(terraform): add DocumentDB module
```

### Examples

```bash
# Patch bump (v1.0.0 → v1.0.1)
git commit -m "fix: resolve habit streak calculation off-by-one error"

# Minor bump (v1.0.0 → v1.1.0)
git commit -m "feat(ui): add dark mode toggle"

# Major bump (v1.0.0 → v2.0.0)
git commit -m "feat!: redesign editorial dashboard and remove AI panel"

# No version bump (non-release types)
git commit -m "docs: update API documentation"
git commit -m "ci: add Helm chart validation to pipeline"
git commit -m "test: add unit tests for auth middleware"
```

### Commit Linting

All commits are validated by [commitlint](https://commitlint.js.org/) using the configuration in `.commitlintrc.json`. Invalid commit messages will be rejected both locally (via Husky git hooks) and in CI.
