# DevSecOps Pipeline

Consistium integrates security scanning directly into its CI/CD pipeline, following a **shift-left security** philosophy. Rather than treating security as a late-stage gate, every push, pull request, and weekly schedule triggers automated analysis that catches vulnerabilities at the earliest possible moment — when they are cheapest and simplest to fix.

The pipeline is defined in [`.github/workflows/devsecops.yml`](../../.github/workflows/devsecops.yml).

> [!IMPORTANT]
> The pipeline runs on **every push to `main`/`master`**, **every pull request targeting those branches**, and on a **weekly cron schedule** (Sundays at midnight UTC). Security is not optional — it is enforced automatically.

---

## Pipeline Overview

The DevSecOps pipeline consists of three independent, parallel jobs that each target a different layer of the application security stack:

```mermaid
flowchart TD
    A["Trigger: Push / PR / Weekly Cron"] --> B{"DevSecOps Pipeline"}

    B --> C["🔑 Job 1: secret-scan\n(TruffleHog)"]
    B --> D["🔍 Job 2: codeql-sast\n(GitHub CodeQL)"]
    B --> E["🛡️ Job 3: trivy-scan\n(Aqua Trivy)"]

    C --> C1["Scan full git history\nfor leaked secrets"]
    C1 --> C2{"Verified secrets found?"}
    C2 -- Yes --> C3["❌ Fail pipeline"]
    C2 -- No --> C4["✅ Pass"]

    D --> D1["Analyze JavaScript source\nfor vulnerabilities"]
    D1 --> D2{"Security issues found?"}
    D2 -- Yes --> D3["⚠️ Report to\nSecurity tab"]
    D2 -- No --> D4["✅ Pass"]

    E --> E1["Phase 1: Filesystem scan\n(dependencies)"]
    E1 --> E2{"CRITICAL/HIGH\nvulnerabilities?"}
    E2 -- Yes --> E3["❌ Fail pipeline"]
    E2 -- No --> E4["Phase 2: Docker image scan"]
    E4 --> E5["📋 Report only\n(does not fail)"]

    style C fill:#1a1a2e,stroke:#e94560,color:#fff
    style D fill:#1a1a2e,stroke:#0f3460,color:#fff
    style E fill:#1a1a2e,stroke:#16213e,color:#fff
    style C3 fill:#e94560,stroke:#e94560,color:#fff
    style E3 fill:#e94560,stroke:#e94560,color:#fff
    style C4 fill:#2d6a4f,stroke:#2d6a4f,color:#fff
    style D4 fill:#2d6a4f,stroke:#2d6a4f,color:#fff
```

All three jobs run **in parallel** on every trigger event. A failure in any job does not block the others — each produces its own pass/fail result and security report.

---

## Security Scanning Strategy

The pipeline implements a **layered defense** model, scanning progressively from the innermost layer (secrets in source code) outward to the container image that gets deployed:

| Layer | Scan Target | Tool | Threat Category |
|-------|------------|------|-----------------|
| 1 — Secrets | Git history & working tree | TruffleHog | Credential leakage |
| 2 — Source Code | `app.js`, inline scripts, JS files | GitHub CodeQL | XSS, injection, logic flaws |
| 3 — Dependencies | `package.json` / `node_modules` | Trivy (filesystem) | Known CVEs in libraries |
| 4 — Container | Built Docker image | Trivy (image) | OS-level & runtime CVEs |

This approach ensures that no single category of vulnerability can slip through unchecked. Each layer addresses a fundamentally different risk surface.

---

## Job 1: Secret Scanning

**Job name:** `secret-scan`
**Tool:** [TruffleHog](https://github.com/trufflesecurity/trufflehog) (`trufflesecurity/trufflehog@main`)

### What It Detects

TruffleHog scans for accidentally committed credentials, including but not limited to:

- **API keys** — AWS, GCP, Azure, Stripe, Twilio, SendGrid, etc.
- **Passwords & tokens** — Database connection strings, OAuth tokens, JWTs
- **Private keys** — SSH keys, TLS certificates, PGP keys
- **Webhooks & URLs** — Slack webhooks, Discord tokens, internal service URLs

### How It Works

1. The repository is checked out with **`fetch-depth: 0`** (full git history), allowing TruffleHog to scan every commit — not just the latest working tree.
2. TruffleHog uses a combination of **regex patterns** and **entropy analysis** to identify potential secrets.
3. The `--only-verified` flag ensures TruffleHog **actively validates** discovered credentials against the respective service APIs. Only secrets confirmed to be live/active are reported.
4. The `--debug` flag enables verbose logging for troubleshooting scan behavior.

### Configuration Explained

```yaml
secret-scan:
  name: Secret Scanning
  runs-on: ubuntu-latest
  steps:
    - name: Checkout code
      uses: actions/checkout@v4
      with:
        fetch-depth: 0    # Full history — secrets may exist in old commits

    - name: TruffleHog scan
      uses: trufflesecurity/trufflehog@main
      with:
        extra_args: --debug --only-verified
```

| Setting | Value | Rationale |
|---------|-------|-----------|
| `fetch-depth: 0` | Full clone | Secrets in old commits are still exploitable if the repo is public or cloned |
| `--only-verified` | Enabled | Reduces noise by only flagging secrets that are confirmed active |
| `--debug` | Enabled | Provides detailed output for diagnosing false negatives |

### Example Findings

| Finding | Severity | Example |
|---------|----------|---------|
| AWS Access Key | Critical | `AKIAIOSFODNN7EXAMPLE` found in `config.js` at commit `a1b2c3d` |
| Stripe Secret Key | Critical | `sk_live_...` found in `.env.example` at commit `e4f5g6h` |
| Database password | High | `mongodb://admin:P@ssw0rd@prod-db:27017` found in `docker-compose.yml` |

> [!CAUTION]
> Even if a secret is removed from the current branch, it remains in the git history forever unless the history is rewritten. TruffleHog's full-history scan catches these cases.

---

## Job 2: CodeQL Analysis (SAST)

**Job name:** `codeql-sast`
**Tool:** [GitHub CodeQL](https://codeql.github.com/) (`github/codeql-action/init@v3` + `github/codeql-action/analyze@v3`)

### What It Detects

CodeQL performs **Static Application Security Testing (SAST)** on the JavaScript source code, identifying:

- **Cross-Site Scripting (XSS)** — Unsanitized user input rendered in HTML responses
- **SQL/NoSQL Injection** — Untrusted data passed directly to database queries
- **Path Traversal** — User-controlled file paths used in `fs` operations
- **Prototype Pollution** — Unsafe object merging that modifies `Object.prototype`
- **Open Redirects** — Unvalidated redirect URLs derived from user input
- **Regex Denial of Service (ReDoS)** — Catastrophic backtracking in regular expressions
- **Insecure Randomness** — Use of `Math.random()` for security-sensitive operations
- **Missing Authentication** — Endpoints that lack proper access control checks

### How It Works

1. **Initialization** — CodeQL builds a semantic database of the JavaScript codebase, including `app.js` and any inline scripts.
2. **Analysis** — CodeQL runs hundreds of security queries against the database, tracing data flow from **sources** (user input) to **sinks** (dangerous operations).
3. **Reporting** — Results are uploaded to the repository's **Security → Code scanning alerts** tab in GitHub.

### Configuration Explained

```yaml
codeql-sast:
  name: CodeQL Analysis
  runs-on: ubuntu-latest
  permissions:
    security-events: write    # Required to upload SARIF results
    actions: read             # Required for workflow access
    contents: read            # Required to checkout code
  steps:
    - name: Checkout code
      uses: actions/checkout@v4

    - name: Initialize CodeQL
      uses: github/codeql-action/init@v3
      with:
        languages: javascript

    - name: Perform CodeQL Analysis
      uses: github/codeql-action/analyze@v3
```

| Setting | Value | Rationale |
|---------|-------|-----------|
| `languages: javascript` | JavaScript/TypeScript | Covers `app.js`, frontend scripts, and Node.js code |
| `security-events: write` | Permission | Required to publish results to GitHub's Security tab |
| `actions: read` | Permission | Allows the action to read workflow metadata |
| `contents: read` | Permission | Allows checkout and code analysis |

### Example Findings

| Finding | CWE | Example |
|---------|-----|---------|
| Reflected XSS | CWE-79 | User input from `req.query.name` rendered directly in `res.send()` without escaping |
| NoSQL Injection | CWE-943 | `req.body.username` passed directly to `db.collection.find()` |
| Path Traversal | CWE-22 | `req.params.file` used in `fs.readFile()` without sanitization |
| Hardcoded Credentials | CWE-798 | Password literal found in source code |

> [!NOTE]
> CodeQL results appear in the **Security** tab of the GitHub repository. They include detailed explanations, data-flow traces, and remediation guidance for each finding.

---

## Job 3: Trivy Container & Filesystem Scan

**Job name:** `trivy-scan`
**Tool:** [Aqua Trivy](https://trivy.dev/) (`aquasecurity/trivy-action@master`)

### What It Detects

Trivy performs **Software Composition Analysis (SCA)** and **container image scanning**, identifying:

- **Known CVEs** in npm dependencies (e.g., vulnerable versions of `express`, `lodash`)
- **OS-level vulnerabilities** in the Docker base image (e.g., outdated `openssl`, `glibc`)
- **Misconfigured Dockerfiles** — Running as root, exposing unnecessary ports
- **Embedded secrets** in image layers
- **License compliance** issues in bundled packages

### How It Works — Two-Phase Scan

Trivy runs in two sequential phases, each targeting a different artifact:

```mermaid
flowchart LR
    A["Source Code &\nDependencies"] --> B["Phase 1:\nFilesystem Scan"]
    B --> C{"CRITICAL/HIGH\nCVEs found?"}
    C -- Yes --> D["❌ Pipeline fails\n(exit-code: 1)"]
    C -- No --> E["Build Docker\nImage"]
    E --> F["Phase 2:\nImage Scan"]
    F --> G["📋 Report generated\n(exit-code: 0)"]

    style D fill:#e94560,stroke:#e94560,color:#fff
    style G fill:#2d6a4f,stroke:#2d6a4f,color:#fff
```

#### Phase 1: Filesystem Scan

Scans `package.json`, `package-lock.json`, and the source tree for known vulnerabilities in dependencies.

- **Scan type:** `fs` (filesystem)
- **Exit code:** `1` — the pipeline **fails** if CRITICAL or HIGH vulnerabilities are found
- **Severity filter:** `CRITICAL,HIGH`
- **Ignore unfixed:** `true` — does not flag vulnerabilities with no available patch

#### Phase 2: Docker Image Scan

Builds the Docker image and scans all layers for OS-level and application vulnerabilities.

- **Scan type:** `image`
- **Exit code:** `0` — results are **reported only**, the pipeline does not fail
- **Severity filter:** `CRITICAL,HIGH`
- **Ignore unfixed:** `true`

### Configuration Explained

```yaml
trivy-scan:
  name: Trivy Container & FS Scan
  runs-on: ubuntu-latest
  steps:
    - name: Checkout code
      uses: actions/checkout@v4

    # Phase 1 — Fail on dependency vulnerabilities
    - name: Trivy filesystem scan
      uses: aquasecurity/trivy-action@master
      with:
        scan-type: fs
        exit-code: 1
        severity: CRITICAL,HIGH
        ignore-unfixed: true

    # Phase 2 — Report container image vulnerabilities
    - name: Build Docker image
      run: docker build -t consistium:${{ github.sha }} .

    - name: Trivy image scan
      uses: aquasecurity/trivy-action@master
      with:
        image-ref: consistium:${{ github.sha }}
        exit-code: 0
        severity: CRITICAL,HIGH
        ignore-unfixed: true
```

| Setting | Phase 1 (FS) | Phase 2 (Image) | Rationale |
|---------|-------------|-----------------|-----------|
| `scan-type` | `fs` | `image` | FS catches dependency CVEs; image catches OS-level CVEs |
| `exit-code` | `1` (fail) | `0` (report) | Dependency CVEs are actionable immediately; image CVEs may need upstream fixes |
| `severity` | `CRITICAL,HIGH` | `CRITICAL,HIGH` | Focus on exploitable, high-impact vulnerabilities |
| `ignore-unfixed` | `true` | `true` | Avoids noise from vulnerabilities with no available remediation |

### Example Findings

| Finding | Phase | Severity | Example |
|---------|-------|----------|---------|
| CVE-2024-XXXXX in `express` | Filesystem | CRITICAL | Prototype pollution leading to RCE in Express <4.19.0 |
| CVE-2024-YYYYY in `jsonwebtoken` | Filesystem | HIGH | Algorithm confusion allowing JWT signature bypass |
| CVE-2024-ZZZZZ in `openssl` | Image | CRITICAL | Buffer overflow in libssl within the `node:18-alpine` base image |
| CVE-2024-WWWWW in `libc6` | Image | HIGH | Heap overflow in glibc affecting the container runtime |

> [!TIP]
> When Trivy reports a vulnerability with a fix available, update the affected package immediately. The `ignore-unfixed: true` flag means that anything reported has a known remediation path.

---

## Scheduled Scanning

In addition to event-driven triggers (push and PR), the pipeline runs on a **weekly cron schedule**:

```yaml
on:
  schedule:
    - cron: '0 0 * * 0'   # Every Sunday at midnight UTC
```

### Why Continuous Scanning Matters

| Scenario | Risk Without Scheduled Scans | How Weekly Scans Help |
|----------|-----------------------------|-----------------------|
| **New CVE disclosure** | A critical CVE is published for a dependency already in use, but no code changes trigger the pipeline | The weekly scan detects it on the next Sunday run |
| **TruffleHog rule updates** | New secret patterns are added to TruffleHog's detection engine | The latest version is pulled weekly, catching previously undetectable secrets |
| **CodeQL query updates** | GitHub ships new CodeQL queries for emerging vulnerability classes | Weekly runs pick up new query packs automatically |
| **Dormant repositories** | A repository with no recent commits silently accumulates risk | Scheduled scans ensure dormant repos are not forgotten |

> [!NOTE]
> The weekly schedule uses UTC time. `0 0 * * 0` translates to **Sunday at 00:00 UTC**. GitHub Actions may delay cron runs during periods of high demand, but the scan will always execute.

---

## Severity Policy

The pipeline applies a deliberate **severity-based enforcement strategy** that balances security rigor with developer productivity.

### Exit-Code Strategy

| Job | Exit Code on Finding | Behavior | Rationale |
|-----|---------------------|----------|-----------|
| `secret-scan` | Implicit fail | **Blocks merge** | Active credentials are an immediate, exploitable risk |
| `codeql-sast` | Report only | **Advisory** | Findings appear in the Security tab for triage; developers assess context |
| `trivy-scan` (FS) | `1` — Fail | **Blocks merge** | Dependency CVEs with available fixes should be resolved before merge |
| `trivy-scan` (Image) | `0` — Report | **Advisory** | Image-level CVEs often require upstream base image updates, not app changes |

### Severity Filter: CRITICAL and HIGH Only

The pipeline filters Trivy results to **CRITICAL** and **HIGH** severity only:

- **CRITICAL** (CVSS 9.0–10.0) — Remotely exploitable, no authentication required, leads to full system compromise
- **HIGH** (CVSS 7.0–8.9) — Significant impact, may require specific conditions to exploit

Medium and low severity findings are intentionally excluded from automated enforcement to reduce alert fatigue. These should be reviewed during periodic manual security audits.

### Unfixed Vulnerability Policy

The `ignore-unfixed: true` flag ensures the pipeline does not fail on vulnerabilities where:

- No patched version of the affected package exists
- The fix is only available in a major version upgrade that may introduce breaking changes

This prevents developers from being blocked by issues they cannot resolve, while still surfacing actionable vulnerabilities.

---

## Security Tools Matrix

| Tool | Scan Type | Target | Detects | Trigger | Fail Policy |
|------|-----------|--------|---------|---------|-------------|
| **TruffleHog** | Secret scanning | Full git history | API keys, passwords, tokens, private keys | Push, PR, Cron | Fails on verified secrets |
| **GitHub CodeQL** | SAST (Static Analysis) | JavaScript source code | XSS, injection, logic bugs, insecure patterns | Push, PR, Cron | Reports to Security tab |
| **Trivy (FS)** | SCA (Dependency scan) | `package.json`, lockfiles | Known CVEs in npm packages | Push, PR, Cron | Fails on CRITICAL/HIGH |
| **Trivy (Image)** | Container scan | Docker image layers | OS-level CVEs, misconfigurations | Push, PR, Cron | Report only |

---

## Future Enhancements

The current pipeline provides strong foundational coverage across secrets, source code, dependencies, and containers. The following enhancements would extend the security posture further:

### 1. Dynamic Application Security Testing (DAST)

**Tool:** [OWASP ZAP](https://www.zaproxy.org/) (`zaproxy/action-full-scan@v0.10.0`)

DAST tests the **running application** by sending crafted HTTP requests and analyzing responses. Unlike SAST, it finds vulnerabilities that only manifest at runtime — such as missing security headers, CORS misconfigurations, and authentication bypasses.

```yaml
# Example DAST integration
- name: OWASP ZAP Full Scan
  uses: zaproxy/action-full-scan@v0.10.0
  with:
    target: http://localhost:3000
    rules_file_name: .zap/rules.tsv
```

### 2. Software Composition Analysis (SCA) — Continuous Monitoring

**Tools:** [Dependabot](https://docs.github.com/en/code-security/dependabot) or [Snyk](https://snyk.io/)

While Trivy scans at pipeline time, Dependabot and Snyk provide **continuous monitoring** with automatic pull requests when new CVEs affect the project's dependencies. This closes the gap between weekly scans.

### 3. Software Bill of Materials (SBOM) Generation

**Tools:** [Syft](https://github.com/anchore/syft) or [Trivy SBOM](https://aquasecurity.github.io/trivy/latest/docs/supply-chain/sbom/)

Generating an SBOM for every release provides a machine-readable inventory of all components, enabling rapid impact assessment when new vulnerabilities are disclosed. SBOM formats like CycloneDX and SPDX are increasingly required by regulatory frameworks.

```yaml
# Example SBOM generation
- name: Generate SBOM
  uses: anchore/sbom-action@v0
  with:
    image: consistium:${{ github.sha }}
    format: cyclonedx-json
    output-file: sbom.json
```

### 4. Container Image Signing (Cosign)

**Tool:** [Sigstore Cosign](https://github.com/sigstore/cosign)

Signing container images with Cosign provides **supply chain integrity** by cryptographically attesting that images were built by the CI/CD pipeline and have not been tampered with. Kubernetes admission controllers (e.g., Kyverno, OPA Gatekeeper) can enforce signature verification at deployment time.

```yaml
# Example container signing
- name: Sign container image
  uses: sigstore/cosign-installer@v3
- run: cosign sign --yes consistium:${{ github.sha }}
```

### Enhancement Roadmap

| Enhancement | Priority | Complexity | Value |
|------------|----------|------------|-------|
| OWASP ZAP (DAST) | High | Medium | Catches runtime-only vulnerabilities |
| Dependabot / Snyk (SCA) | High | Low | Continuous dependency monitoring with auto-PRs |
| SBOM Generation | Medium | Low | Regulatory compliance, incident response |
| Cosign (Image Signing) | Medium | Medium | Supply chain integrity, deployment assurance |

> [!TIP]
> Start with Dependabot — it requires zero pipeline changes (just a `dependabot.yml` config file) and immediately provides automated dependency update PRs with vulnerability context.
