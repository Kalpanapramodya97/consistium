# ─────────────────────────────────────────────────────────────
# Consistium — Remote State Backend
# ─────────────────────────────────────────────────────────────
# Uses S3 for state storage and DynamoDB for state locking.
# This prevents concurrent modifications and enables team
# collaboration. The bucket and table must be created manually
# or via a bootstrap script before running `terraform init`.
#
# Bootstrap (one-time):
#   aws s3api create-bucket --bucket consistium-tfstate-<account-id> --region ap-south-1
#   aws dynamodb create-table --table-name consistium-tfstate-lock \
#     --attribute-definitions AttributeName=LockID,AttributeType=S \
#     --key-schema AttributeName=LockID,KeyType=HASH \
#     --billing-mode PAY_PER_REQUEST
# ─────────────────────────────────────────────────────────────

terraform {
  backend "s3" {
    bucket         = "consistium-tfstate"
    key            = "infrastructure/terraform.tfstate"
    region         = "ap-south-1"
    encrypt        = true
    dynamodb_table = "consistium-tfstate-lock"

    # Recommended: enable versioning on the S3 bucket for
    # state recovery in case of corruption.
  }
}
