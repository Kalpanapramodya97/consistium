#!/usr/bin/env bash
# =============================================================================
# Consistium Security Report Generator
# =============================================================================
# Aggregates scan results from TruffleHog, CodeQL SARIF, and Trivy JSON
# into a branded HTML security report.
#
# Usage:
#   ./security/generate-report.sh [options]
#
# Options:
#   --trufflehog FILE    Path to TruffleHog JSON output
#   --codeql FILE        Path to CodeQL SARIF output
#   --trivy-fs FILE      Path to Trivy filesystem scan JSON output
#   --trivy-image FILE   Path to Trivy image scan JSON output
#   --template FILE      Path to HTML template (default: security/report-template.html)
#   --output FILE        Output HTML file path
#   --dry-run            Generate report with sample data for testing
#
# Environment variables (set by GitHub Actions):
#   GITHUB_SHA, GITHUB_REF_NAME, GITHUB_RUN_NUMBER, GITHUB_EVENT_NAME,
#   GITHUB_SERVER_URL, GITHUB_REPOSITORY, GITHUB_RUN_ID
# =============================================================================

set -euo pipefail

# ── Defaults ─────────────────────────────────────────────────────────────────
SCRIPT_DIR="$(dirname "${BASH_SOURCE[0]}")"
TEMPLATE="${SCRIPT_DIR}/report-template.html"
OUTPUT="consistium-security-report.html"
TRUFFLEHOG_FILE=""
CODEQL_FILE=""
TRIVY_FS_FILE=""
TRIVY_IMAGE_FILE=""
INFRACOST_FILE=""
DRY_RUN=false

# ── Parse arguments ─────────────────────────────────────────────────────────
while [[ $# -gt 0 ]]; do
    case "$1" in
        --trufflehog)   TRUFFLEHOG_FILE="$2"; shift 2 ;;
        --codeql)       CODEQL_FILE="$2"; shift 2 ;;
        --trivy-fs)     TRIVY_FS_FILE="$2"; shift 2 ;;
        --trivy-image)  TRIVY_IMAGE_FILE="$2"; shift 2 ;;
        --infracost)    INFRACOST_FILE="$2"; shift 2 ;;
        --template)     TEMPLATE="$2"; shift 2 ;;
        --output)       OUTPUT="$2"; shift 2 ;;
        --dry-run)      DRY_RUN=true; shift ;;
        *) echo "Unknown option: $1"; exit 1 ;;
    esac
done

# ── Utility functions ────────────────────────────────────────────────────────

# Escape HTML special characters
html_escape() {
    local text="$1"
    text="${text//&/&amp;}"
    text="${text//</&lt;}"
    text="${text//>/&gt;}"
    text="${text//\"/&quot;}"
    echo "$text"
}

# Generate a severity pill badge
severity_pill() {
    local severity="$1"
    local class
    case "${severity,,}" in
        critical) class="pill-critical" ;;
        high)     class="pill-high" ;;
        medium)   class="pill-medium" ;;
        low)      class="pill-low" ;;
        *)        class="pill-low" ;;
    esac
    echo "<span class=\"severity-pill ${class}\">${severity^^}</span>"
}

# Generate "no findings" HTML
no_findings_html() {
    local tool_name="$1"
    cat <<EOF
<div class="no-findings">
    <div class="no-findings-icon">✅</div>
    <div class="no-findings-text">No issues detected</div>
    <div class="no-findings-sub">${tool_name} completed successfully with zero findings</div>
</div>
EOF
}

# Generate "scan skipped / not available" HTML
scan_skipped_html() {
    local tool_name="$1"
    cat <<EOF
<div class="no-findings">
    <div class="no-findings-icon">⏭️</div>
    <div class="no-findings-text">Scan data not available</div>
    <div class="no-findings-sub">${tool_name} results were not provided for this report</div>
</div>
EOF
}

# Calculate percentage for bar chart (capped at 100)
calc_pct() {
    local count=$1
    local total=$2
    if [[ "$total" -eq 0 ]]; then
        echo "0"
    else
        echo $(( (count * 100) / total ))
    fi
}

# ── Collect metadata ─────────────────────────────────────────────────────────
REPORT_DATE=$(date -u +"%Y-%m-%d")
REPORT_DATETIME=$(date -u +"%Y-%m-%d %H:%M:%S")
COMMIT_SHA="${GITHUB_SHA:-$(git rev-parse --short HEAD 2>/dev/null || echo 'unknown')}"
COMMIT_SHA_SHORT="${COMMIT_SHA:0:7}"
BRANCH_NAME="${GITHUB_REF_NAME:-$(git branch --show-current 2>/dev/null || echo 'unknown')}"
RUN_NUMBER="${GITHUB_RUN_NUMBER:-0}"
TRIGGER_EVENT="${GITHUB_EVENT_NAME:-manual}"
REPO_URL="${GITHUB_SERVER_URL:-https://github.com}/${GITHUB_REPOSITORY:-Kalpanapramodya97/consistium}"
RUN_URL="${REPO_URL}/actions/runs/${GITHUB_RUN_ID:-0}"

# ── Initialize counters ─────────────────────────────────────────────────────
CRITICAL_COUNT=0
HIGH_COUNT=0
MEDIUM_COUNT=0
LOW_COUNT=0
TOTAL_FINDINGS=0

# ── Process TruffleHog results ───────────────────────────────────────────────
SECRET_SCAN_CONTENT=""
SECRET_SCAN_STATUS=""
SECRET_SCAN_STATUS_CLASS=""
SECRET_SCAN_STATUS_ICON=""

if [[ "$DRY_RUN" == true ]]; then
    SECRET_SCAN_CONTENT=$(no_findings_html "TruffleHog secret scanner")
    SECRET_SCAN_STATUS="Passed"
    SECRET_SCAN_STATUS_CLASS="scan-passed"
    SECRET_SCAN_STATUS_ICON="✓"
elif [[ -n "$TRUFFLEHOG_FILE" && -f "$TRUFFLEHOG_FILE" ]]; then
    # If the file is just "[]" or empty, count is 0
    if [[ ! -s "$TRUFFLEHOG_FILE" ]] || [[ "$(cat "$TRUFFLEHOG_FILE" | tr -d ' \n\r')" == "[]" ]]; then
        SECRET_COUNT=0
    else
        SECRET_COUNT=$(wc -l < "$TRUFFLEHOG_FILE" 2>/dev/null || echo "0")
    fi

    if [[ "$SECRET_COUNT" -gt 0 ]]; then
        CRITICAL_COUNT=$((CRITICAL_COUNT + SECRET_COUNT))
        SECRET_SCAN_STATUS="Failed"
        SECRET_SCAN_STATUS_CLASS="scan-failed"
        SECRET_SCAN_STATUS_ICON="✗"

        SECRET_ROWS=""
        while IFS= read -r line; do
            # Skip empty lines or pure whitespace
            [[ -z "${line// }" ]] && continue
            
            detector=$(echo "$line" | jq -r '.DetectorName // .SourceMetadata.Data.Git.file // "Unknown"' 2>/dev/null || echo "Unknown")
            source_file=$(echo "$line" | jq -r '.SourceMetadata.Data.Git.file // "N/A"' 2>/dev/null || echo "N/A")
            commit=$(echo "$line" | jq -r '.SourceMetadata.Data.Git.commit // "N/A"' 2>/dev/null || echo "N/A")
            commit_short="${commit:0:7}"
            verified=$(echo "$line" | jq -r '.Verified // false' 2>/dev/null || echo "false")

            SECRET_ROWS+="<tr>"
            SECRET_ROWS+="<td>$(severity_pill "CRITICAL")</td>"
            SECRET_ROWS+="<td>$(html_escape "$detector")</td>"
            SECRET_ROWS+="<td class=\"mono\">$(html_escape "$source_file")</td>"
            SECRET_ROWS+="<td class=\"mono\">$(html_escape "$commit_short")</td>"
            SECRET_ROWS+="<td>$([ "$verified" == "true" ] && echo "⚠️ Verified" || echo "Unverified")</td>"
            SECRET_ROWS+="</tr>"
        done < <(cat "$TRUFFLEHOG_FILE")

        SECRET_SCAN_CONTENT=$(cat <<EOF
<table class="findings-table">
    <thead>
        <tr>
            <th>Severity</th>
            <th>Detector</th>
            <th>File</th>
            <th>Commit</th>
            <th>Status</th>
        </tr>
    </thead>
    <tbody>
        ${SECRET_ROWS}
    </tbody>
</table>
EOF
)
    else
        SECRET_SCAN_CONTENT=$(no_findings_html "TruffleHog secret scanner")
        SECRET_SCAN_STATUS="Passed"
        SECRET_SCAN_STATUS_CLASS="scan-passed"
        SECRET_SCAN_STATUS_ICON="✓"
    fi
else
    SECRET_SCAN_CONTENT=$(scan_skipped_html "TruffleHog")
    SECRET_SCAN_STATUS="Skipped"
    SECRET_SCAN_STATUS_CLASS="scan-skipped"
    SECRET_SCAN_STATUS_ICON="—"
fi

# ── Process CodeQL SARIF results ─────────────────────────────────────────────
SAST_SCAN_CONTENT=""
SAST_SCAN_STATUS=""
SAST_SCAN_STATUS_CLASS=""
SAST_SCAN_STATUS_ICON=""

if [[ "$DRY_RUN" == true ]]; then
    SAST_SCAN_CONTENT=$(no_findings_html "CodeQL static analysis")
    SAST_SCAN_STATUS="Passed"
    SAST_SCAN_STATUS_CLASS="scan-passed"
    SAST_SCAN_STATUS_ICON="✓"
elif [[ -n "$CODEQL_FILE" && -f "$CODEQL_FILE" ]]; then
    SARIF_RESULTS=$(jq '[.runs[].results[]] | length' "$CODEQL_FILE" 2>/dev/null || echo "0")

    if [[ "$SARIF_RESULTS" -gt 0 ]]; then
        SAST_SCAN_STATUS="Issues Found"
        SAST_SCAN_STATUS_CLASS="scan-failed"
        SAST_SCAN_STATUS_ICON="⚠"

        SAST_ROWS=""
        while IFS= read -r result; do
            rule_id=$(echo "$result" | jq -r '.ruleId // "unknown"')
            message=$(echo "$result" | jq -r '.message.text // "No description"')
            severity=$(echo "$result" | jq -r '.level // "warning"')
            location=$(echo "$result" | jq -r '.locations[0].physicalLocation.artifactLocation.uri // "unknown"')
            line_num=$(echo "$result" | jq -r '.locations[0].physicalLocation.region.startLine // "?"')

            # Map SARIF levels to severity
            case "${severity,,}" in
                error)   sev="HIGH"; HIGH_COUNT=$((HIGH_COUNT + 1)) ;;
                warning) sev="MEDIUM"; MEDIUM_COUNT=$((MEDIUM_COUNT + 1)) ;;
                note)    sev="LOW"; LOW_COUNT=$((LOW_COUNT + 1)) ;;
                *)       sev="MEDIUM"; MEDIUM_COUNT=$((MEDIUM_COUNT + 1)) ;;
            esac

            # Truncate long messages
            if [[ ${#message} -gt 120 ]]; then
                message="${message:0:117}..."
            fi

            SAST_ROWS+="<tr>"
            SAST_ROWS+="<td>$(severity_pill "$sev")</td>"
            SAST_ROWS+="<td class=\"mono\">$(html_escape "$rule_id")</td>"
            SAST_ROWS+="<td>$(html_escape "$message")</td>"
            SAST_ROWS+="<td class=\"mono\">$(html_escape "$location"):${line_num}</td>"
            SAST_ROWS+="</tr>"
        done < <(jq -c '.runs[].results[]' "$CODEQL_FILE" 2>/dev/null)

        SAST_SCAN_CONTENT=$(cat <<EOF
<table class="findings-table">
    <thead>
        <tr>
            <th>Severity</th>
            <th>Rule</th>
            <th>Description</th>
            <th>Location</th>
        </tr>
    </thead>
    <tbody>
        ${SAST_ROWS}
    </tbody>
</table>
EOF
)
    else
        SAST_SCAN_CONTENT=$(no_findings_html "CodeQL static analysis")
        SAST_SCAN_STATUS="Passed"
        SAST_SCAN_STATUS_CLASS="scan-passed"
        SAST_SCAN_STATUS_ICON="✓"
    fi
else
    SAST_SCAN_CONTENT=$(scan_skipped_html "CodeQL")
    SAST_SCAN_STATUS="Skipped"
    SAST_SCAN_STATUS_CLASS="scan-skipped"
    SAST_SCAN_STATUS_ICON="—"
fi

# ── Process Trivy results (shared function) ──────────────────────────────────
process_trivy() {
    local file="$1"
    local rows=""
    local count=0

    if [[ ! -f "$file" ]]; then
        echo ""
        return
    fi

    while IFS= read -r vuln; do
        vuln_id=$(echo "$vuln" | jq -r '.VulnerabilityID // "N/A"')
        pkg=$(echo "$vuln" | jq -r '.PkgName // "N/A"')
        installed=$(echo "$vuln" | jq -r '.InstalledVersion // "N/A"')
        fixed=$(echo "$vuln" | jq -r '.FixedVersion // "N/A"')
        severity=$(echo "$vuln" | jq -r '.Severity // "UNKNOWN"')
        title=$(echo "$vuln" | jq -r '.Title // .Description // "No description"' | head -c 100)

        case "${severity^^}" in
            CRITICAL) CRITICAL_COUNT=$((CRITICAL_COUNT + 1)) ;;
            HIGH)     HIGH_COUNT=$((HIGH_COUNT + 1)) ;;
            MEDIUM)   MEDIUM_COUNT=$((MEDIUM_COUNT + 1)) ;;
            LOW)      LOW_COUNT=$((LOW_COUNT + 1)) ;;
        esac

        count=$((count + 1))

        rows+="<tr>"
        rows+="<td>$(severity_pill "$severity")</td>"
        rows+="<td><a class=\"cve-link\" href=\"https://nvd.nist.gov/vuln/detail/${vuln_id}\" target=\"_blank\">$(html_escape "$vuln_id")</a></td>"
        rows+="<td class=\"mono\">$(html_escape "$pkg")</td>"
        rows+="<td class=\"mono\">$(html_escape "$installed")</td>"
        rows+="<td class=\"mono\">$(html_escape "$fixed")</td>"
        rows+="<td>$(html_escape "$title")</td>"
        rows+="</tr>"
    done < <(jq -c '.Results[]?.Vulnerabilities[]?' "$file" 2>/dev/null)

    if [[ $count -eq 0 ]]; then
        echo ""
    else
        cat <<EOF
<table class="findings-table">
    <thead>
        <tr>
            <th>Severity</th>
            <th>CVE</th>
            <th>Package</th>
            <th>Installed</th>
            <th>Fixed</th>
            <th>Description</th>
        </tr>
    </thead>
    <tbody>
        ${rows}
    </tbody>
</table>
EOF
    fi
}

# ── Process Trivy FS scan ────────────────────────────────────────────────────
TRIVY_FS_CONTENT=""
TRIVY_FS_STATUS=""
TRIVY_FS_STATUS_CLASS=""
TRIVY_FS_STATUS_ICON=""

if [[ "$DRY_RUN" == true ]]; then
    TRIVY_FS_CONTENT=$(no_findings_html "Trivy filesystem scanner")
    TRIVY_FS_STATUS="Passed"
    TRIVY_FS_STATUS_CLASS="scan-passed"
    TRIVY_FS_STATUS_ICON="✓"
elif [[ -n "$TRIVY_FS_FILE" && -f "$TRIVY_FS_FILE" ]]; then
    TRIVY_FS_CONTENT=$(process_trivy "$TRIVY_FS_FILE")
    if [[ -z "$TRIVY_FS_CONTENT" ]]; then
        TRIVY_FS_CONTENT=$(no_findings_html "Trivy filesystem scanner")
        TRIVY_FS_STATUS="Passed"
        TRIVY_FS_STATUS_CLASS="scan-passed"
        TRIVY_FS_STATUS_ICON="✓"
    else
        TRIVY_FS_STATUS="Issues Found"
        TRIVY_FS_STATUS_CLASS="scan-failed"
        TRIVY_FS_STATUS_ICON="⚠"
    fi
else
    TRIVY_FS_CONTENT=$(scan_skipped_html "Trivy filesystem scan")
    TRIVY_FS_STATUS="Skipped"
    TRIVY_FS_STATUS_CLASS="scan-skipped"
    TRIVY_FS_STATUS_ICON="—"
fi

# ── Process Trivy Image scan ────────────────────────────────────────────────
TRIVY_IMAGE_CONTENT=""
TRIVY_IMAGE_STATUS=""
TRIVY_IMAGE_STATUS_CLASS=""
TRIVY_IMAGE_STATUS_ICON=""

if [[ "$DRY_RUN" == true ]]; then
    TRIVY_IMAGE_CONTENT=$(no_findings_html "Trivy container image scanner")
    TRIVY_IMAGE_STATUS="Passed"
    TRIVY_IMAGE_STATUS_CLASS="scan-passed"
    TRIVY_IMAGE_STATUS_ICON="✓"
elif [[ -n "$TRIVY_IMAGE_FILE" && -f "$TRIVY_IMAGE_FILE" ]]; then
    TRIVY_IMAGE_CONTENT=$(process_trivy "$TRIVY_IMAGE_FILE")
    if [[ -z "$TRIVY_IMAGE_CONTENT" ]]; then
        TRIVY_IMAGE_CONTENT=$(no_findings_html "Trivy container image scanner")
        TRIVY_IMAGE_STATUS="Passed"
        TRIVY_IMAGE_STATUS_CLASS="scan-passed"
        TRIVY_IMAGE_STATUS_ICON="✓"
    else
        TRIVY_IMAGE_STATUS="Issues Found"
        TRIVY_IMAGE_STATUS_CLASS="scan-failed"
        TRIVY_IMAGE_STATUS_ICON="⚠"
    fi
else
    TRIVY_IMAGE_CONTENT=$(scan_skipped_html "Trivy image scan")
    TRIVY_IMAGE_STATUS="Skipped"
    TRIVY_IMAGE_STATUS_CLASS="scan-skipped"
    TRIVY_IMAGE_STATUS_ICON="—"
fi

# ── Process Infracost results ────────────────────────────────────────────────
INFRACOST_CONTENT=""
INFRACOST_STATUS=""
INFRACOST_STATUS_CLASS=""
INFRACOST_STATUS_ICON=""
TOTAL_MONTHLY_COST="0.00"

if [[ "$DRY_RUN" == true ]]; then
    TOTAL_MONTHLY_COST="1550"
    INFRACOST_STATUS="Estimated"
    INFRACOST_STATUS_CLASS="scan-passed"
    INFRACOST_STATUS_ICON="✓"
    INFRACOST_CONTENT=$(cat <<EOF
<table class="findings-table">
    <thead>
        <tr>
            <th>Resource Type</th>
            <th>Monthly Cost</th>
        </tr>
    </thead>
    <tbody>
        <tr><td>aws_eks_cluster</td><td class="mono">\$73</td></tr>
        <tr><td>aws_db_instance</td><td class="mono">\$52</td></tr>
    </tbody>
</table>
EOF
)
elif [[ -n "$INFRACOST_FILE" && -f "$INFRACOST_FILE" ]]; then
    TOTAL_MONTHLY_COST=$(jq -r '.totalMonthlyCost // "0"' "$INFRACOST_FILE" 2>/dev/null || echo "0")
    # Format to nearest dollar
    TOTAL_MONTHLY_COST=$(printf "%.0f" "$TOTAL_MONTHLY_COST" 2>/dev/null || echo "0")
    
    INFRACOST_STATUS="Estimated"
    INFRACOST_STATUS_CLASS="scan-passed"
    INFRACOST_STATUS_ICON="✓"

    INFRACOST_ROWS=""
    # Extract top level project breakdown
    while IFS= read -r resource; do
        rtype=$(echo "$resource" | jq -r '.resourceType // "Unknown"')
        rcost=$(echo "$resource" | jq -r '.monthlyCost // "0"')
        rcost=$(printf "%.0f" "$rcost" 2>/dev/null || echo "0")
        
        INFRACOST_ROWS+="<tr>"
        INFRACOST_ROWS+="<td>$(html_escape "$rtype")</td>"
        INFRACOST_ROWS+="<td class=\"mono\">\$${rcost}</td>"
        INFRACOST_ROWS+="</tr>"
    done < <(jq -c '.projects[0].breakdown.resources[]?' "$INFRACOST_FILE" 2>/dev/null)

    if [[ -z "$INFRACOST_ROWS" ]]; then
        INFRACOST_CONTENT=$(no_findings_html "Infracost FinOps scanner")
    else
        INFRACOST_CONTENT=$(cat <<EOF
<table class="findings-table">
    <thead>
        <tr>
            <th>Resource Type</th>
            <th>Monthly Cost</th>
        </tr>
    </thead>
    <tbody>
        ${INFRACOST_ROWS}
    </tbody>
</table>
EOF
)
    fi
else
    INFRACOST_CONTENT=$(scan_skipped_html "Infracost scan")
    INFRACOST_STATUS="Skipped"
    INFRACOST_STATUS_CLASS="scan-skipped"
    INFRACOST_STATUS_ICON="—"
fi

# ── Calculate totals ─────────────────────────────────────────────────────────
TOTAL_FINDINGS=$((CRITICAL_COUNT + HIGH_COUNT + MEDIUM_COUNT + LOW_COUNT))

# Determine overall status
if [[ $CRITICAL_COUNT -gt 0 || $HIGH_COUNT -gt 0 ]]; then
    OVERALL_STATUS_TEXT="FINDINGS DETECTED"
    OVERALL_STATUS_CLASS="status-fail"
    OVERALL_STATUS_ICON="⚠"
else
    OVERALL_STATUS_TEXT="ALL CHECKS PASSED"
    OVERALL_STATUS_CLASS="status-pass"
    OVERALL_STATUS_ICON="✓"
fi

# Calculate percentages for bar chart
if [[ $TOTAL_FINDINGS -gt 0 ]]; then
    CRITICAL_PCT=$(calc_pct $CRITICAL_COUNT $TOTAL_FINDINGS)
    HIGH_PCT=$(calc_pct $HIGH_COUNT $TOTAL_FINDINGS)
    MEDIUM_PCT=$(calc_pct $MEDIUM_COUNT $TOTAL_FINDINGS)
    LOW_PCT=$(calc_pct $LOW_COUNT $TOTAL_FINDINGS)
else
    CRITICAL_PCT=0
    HIGH_PCT=0
    MEDIUM_PCT=0
    LOW_PCT=0
fi

# Bar labels (show text only if bar is wide enough)
CRITICAL_BAR_LABEL=$([[ $CRITICAL_PCT -ge 15 ]] && echo "$CRITICAL_COUNT" || echo "")
HIGH_BAR_LABEL=$([[ $HIGH_PCT -ge 15 ]] && echo "$HIGH_COUNT" || echo "")
MEDIUM_BAR_LABEL=$([[ $MEDIUM_PCT -ge 15 ]] && echo "$MEDIUM_COUNT" || echo "")
LOW_BAR_LABEL=$([[ $LOW_PCT -ge 15 ]] && echo "$LOW_COUNT" || echo "")

# ── Generate report ──────────────────────────────────────────────────────────
echo "🔒 Consistium Security Report Generator"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "  Date:     ${REPORT_DATE}"
echo "  Commit:   ${COMMIT_SHA_SHORT}"
echo "  Branch:   ${BRANCH_NAME}"
echo "  Findings: ${TOTAL_FINDINGS} (C:${CRITICAL_COUNT} H:${HIGH_COUNT} M:${MEDIUM_COUNT} L:${LOW_COUNT})"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

if [[ ! -f "$TEMPLATE" ]]; then
    echo "ERROR: Template file not found: ${TEMPLATE}"
    exit 1
fi

# Read template and perform substitutions
REPORT=$(cat "$TEMPLATE")

# Metadata substitutions
REPORT="${REPORT//\{\{REPORT_DATE\}\}/${REPORT_DATE}}"
REPORT="${REPORT//\{\{REPORT_DATETIME\}\}/${REPORT_DATETIME}}"
REPORT="${REPORT//\{\{COMMIT_SHA\}\}/${COMMIT_SHA_SHORT}}"
REPORT="${REPORT//\{\{BRANCH_NAME\}\}/${BRANCH_NAME}}"
REPORT="${REPORT//\{\{RUN_NUMBER\}\}/${RUN_NUMBER}}"
REPORT="${REPORT//\{\{TRIGGER_EVENT\}\}/${TRIGGER_EVENT}}"
REPORT="${REPORT//\{\{REPO_URL\}\}/${REPO_URL}}"
REPORT="${REPORT//\{\{RUN_URL\}\}/${RUN_URL}}"

# Overall status
REPORT="${REPORT//\{\{OVERALL_STATUS_TEXT\}\}/${OVERALL_STATUS_TEXT}}"
REPORT="${REPORT//\{\{OVERALL_STATUS_CLASS\}\}/${OVERALL_STATUS_CLASS}}"
REPORT="${REPORT//\{\{OVERALL_STATUS_ICON\}\}/${OVERALL_STATUS_ICON}}"

# Summary counts
REPORT="${REPORT//\{\{TOTAL_FINDINGS\}\}/${TOTAL_FINDINGS}}"
REPORT="${REPORT//\{\{CRITICAL_COUNT\}\}/${CRITICAL_COUNT}}"
REPORT="${REPORT//\{\{HIGH_COUNT\}\}/${HIGH_COUNT}}"
REPORT="${REPORT//\{\{MEDIUM_COUNT\}\}/${MEDIUM_COUNT}}"
REPORT="${REPORT//\{\{LOW_COUNT\}\}/${LOW_COUNT}}"

# Chart percentages
REPORT="${REPORT//\{\{CRITICAL_PCT\}\}/${CRITICAL_PCT}}"
REPORT="${REPORT//\{\{HIGH_PCT\}\}/${HIGH_PCT}}"
REPORT="${REPORT//\{\{MEDIUM_PCT\}\}/${MEDIUM_PCT}}"
REPORT="${REPORT//\{\{LOW_PCT\}\}/${LOW_PCT}}"
REPORT="${REPORT//\{\{CRITICAL_BAR_LABEL\}\}/${CRITICAL_BAR_LABEL}}"
REPORT="${REPORT//\{\{HIGH_BAR_LABEL\}\}/${HIGH_BAR_LABEL}}"
REPORT="${REPORT//\{\{MEDIUM_BAR_LABEL\}\}/${MEDIUM_BAR_LABEL}}"
REPORT="${REPORT//\{\{LOW_BAR_LABEL\}\}/${LOW_BAR_LABEL}}"

# Section content — use temp files for multi-line content to avoid sed issues
# Write section content to temp files for reliable substitution
TMPDIR_REPORT="security/tmp_report_$(date +%s)"
mkdir -p "$TMPDIR_REPORT"
trap 'rm -rf "$TMPDIR_REPORT"' EXIT


# Write section content to temp files
echo "$SECRET_SCAN_CONTENT" > "${TMPDIR_REPORT}/secret.html"
echo "$SAST_SCAN_CONTENT" > "${TMPDIR_REPORT}/sast.html"
echo "$TRIVY_FS_CONTENT" > "${TMPDIR_REPORT}/trivy_fs.html"
echo "$TRIVY_IMAGE_CONTENT" > "${TMPDIR_REPORT}/trivy_image.html"
echo "$INFRACOST_CONTENT" > "${TMPDIR_REPORT}/infracost.html"

# Use Node.js for reliable multi-line substitution
node -e "
const fs = require('fs');

let report = fs.readFileSync('$TEMPLATE', 'utf8');

const simple = {
    '{{REPORT_DATE}}': '${REPORT_DATE}',
    '{{REPORT_DATETIME}}': '${REPORT_DATETIME}',
    '{{COMMIT_SHA}}': '${COMMIT_SHA_SHORT}',
    '{{BRANCH_NAME}}': '${BRANCH_NAME}',
    '{{RUN_NUMBER}}': '${RUN_NUMBER}',
    '{{TRIGGER_EVENT}}': '${TRIGGER_EVENT}',
    '{{REPO_URL}}': '${REPO_URL}',
    '{{RUN_URL}}': '${RUN_URL}',
    '{{OVERALL_STATUS_TEXT}}': '${OVERALL_STATUS_TEXT}',
    '{{OVERALL_STATUS_CLASS}}': '${OVERALL_STATUS_CLASS}',
    '{{OVERALL_STATUS_ICON}}': '${OVERALL_STATUS_ICON}',
    '{{TOTAL_FINDINGS}}': '${TOTAL_FINDINGS}',
    '{{CRITICAL_COUNT}}': '${CRITICAL_COUNT}',
    '{{HIGH_COUNT}}': '${HIGH_COUNT}',
    '{{MEDIUM_COUNT}}': '${MEDIUM_COUNT}',
    '{{LOW_COUNT}}': '${LOW_COUNT}',
    '{{CRITICAL_PCT}}': '${CRITICAL_PCT}',
    '{{HIGH_PCT}}': '${HIGH_PCT}',
    '{{MEDIUM_PCT}}': '${MEDIUM_PCT}',
    '{{LOW_PCT}}': '${LOW_PCT}',
    '{{CRITICAL_BAR_LABEL}}': '${CRITICAL_BAR_LABEL}',
    '{{HIGH_BAR_LABEL}}': '${HIGH_BAR_LABEL}',
    '{{MEDIUM_BAR_LABEL}}': '${MEDIUM_BAR_LABEL}',
    '{{LOW_BAR_LABEL}}': '${LOW_BAR_LABEL}',
    '{{SECRET_SCAN_STATUS}}': '${SECRET_SCAN_STATUS}',
    '{{SECRET_SCAN_STATUS_CLASS}}': '${SECRET_SCAN_STATUS_CLASS}',
    '{{SECRET_SCAN_STATUS_ICON}}': '${SECRET_SCAN_STATUS_ICON}',
    '{{SAST_SCAN_STATUS}}': '${SAST_SCAN_STATUS}',
    '{{SAST_SCAN_STATUS_CLASS}}': '${SAST_SCAN_STATUS_CLASS}',
    '{{SAST_SCAN_STATUS_ICON}}': '${SAST_SCAN_STATUS_ICON}',
    '{{TRIVY_FS_STATUS}}': '${TRIVY_FS_STATUS}',
    '{{TRIVY_FS_STATUS_CLASS}}': '${TRIVY_FS_STATUS_CLASS}',
    '{{TRIVY_FS_STATUS_ICON}}': '${TRIVY_FS_STATUS_ICON}',
    '{{TRIVY_IMAGE_STATUS}}': '${TRIVY_IMAGE_STATUS}',
    '{{TRIVY_IMAGE_STATUS_CLASS}}': '${TRIVY_IMAGE_STATUS_CLASS}',
    '{{TRIVY_IMAGE_STATUS_ICON}}': '${TRIVY_IMAGE_STATUS_ICON}',
    '{{INFRACOST_STATUS}}': '${INFRACOST_STATUS}',
    '{{INFRACOST_STATUS_CLASS}}': '${INFRACOST_STATUS_CLASS}',
    '{{INFRACOST_STATUS_ICON}}': '${INFRACOST_STATUS_ICON}',
    '{{TOTAL_MONTHLY_COST}}': '${TOTAL_MONTHLY_COST}'
};

for (const [key, value] of Object.entries(simple)) {
    report = report.split(key).join(value);
}

const content_files = {
    '{{SECRET_SCAN_CONTENT}}': '${TMPDIR_REPORT}/secret.html',
    '{{SAST_SCAN_CONTENT}}': '${TMPDIR_REPORT}/sast.html',
    '{{TRIVY_FS_CONTENT}}': '${TMPDIR_REPORT}/trivy_fs.html',
    '{{TRIVY_IMAGE_CONTENT}}': '${TMPDIR_REPORT}/trivy_image.html',
    '{{INFRACOST_CONTENT}}': '${TMPDIR_REPORT}/infracost.html'
};

for (const [key, filepath] of Object.entries(content_files)) {
    try {
        const content = fs.readFileSync(filepath, 'utf8');
        report = report.split(key).join(content);
    } catch (err) {
        report = report.split(key).join('<p>Scan data not available</p>');
    }
}

console.log(report);
" > "$OUTPUT"

echo ""
echo "✅ Report generated: ${OUTPUT}"
echo "   Size: $(wc -c < "$OUTPUT") bytes"
echo ""
