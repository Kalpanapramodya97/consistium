FROM alpine:3.22

# Upgrade OS packages to patched versions and install required dependencies
#hadolint ignore=DL3018
RUN apk upgrade --no-cache && apk add --no-cache ansible nodejs jq bash curl git

# Install Security Scanners (Trivy & TruffleHog)
RUN curl -sfL https://raw.githubusercontent.com/aquasecurity/trivy/main/contrib/install.sh | sh -s -- -b /usr/local/bin
RUN curl -sSfL https://raw.githubusercontent.com/trufflesecurity/trufflehog/main/scripts/install.sh | sh -s -- -b /usr/local/bin

WORKDIR /workspace

# Run the playbook by default when the container starts
CMD ["ansible-playbook", "ansible/run-security-report.yml"]
