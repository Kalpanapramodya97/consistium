# ─────────────────────────────────────────────────────────────
# Consistium — Root Variables
# ─────────────────────────────────────────────────────────────

# ── General ──────────────────────────────────────────────────

variable "project_name" {
  description = "Name of the project. Used for resource naming and tagging."
  type        = string
  default     = "consistium"
}

variable "environment" {
  description = "Deployment environment (dev, staging, prod)."
  type        = string

  validation {
    condition     = contains(["dev", "staging", "prod"], var.environment)
    error_message = "Environment must be one of: dev, staging, prod."
  }
}

variable "aws_region" {
  description = "AWS region for all resources."
  type        = string
  default     = "ap-south-1"
}

variable "tags" {
  description = "Additional tags to apply to all resources."
  type        = map(string)
  default     = {}
}

# ── Networking ───────────────────────────────────────────────

variable "vpc_cidr" {
  description = "CIDR block for the VPC."
  type        = string
  default     = "10.0.0.0/16"

  validation {
    condition     = can(cidrhost(var.vpc_cidr, 0))
    error_message = "VPC CIDR must be a valid IPv4 CIDR block."
  }
}

variable "availability_zones" {
  description = "List of availability zones to deploy across."
  type        = list(string)
  default     = ["ap-south-1a", "ap-south-1b", "ap-south-1c"]
}

variable "private_subnet_cidrs" {
  description = "CIDR blocks for private subnets (one per AZ)."
  type        = list(string)
  default     = ["10.0.1.0/24", "10.0.2.0/24", "10.0.3.0/24"]
}

variable "public_subnet_cidrs" {
  description = "CIDR blocks for public subnets (one per AZ)."
  type        = list(string)
  default     = ["10.0.101.0/24", "10.0.102.0/24", "10.0.103.0/24"]
}

# ── EKS ──────────────────────────────────────────────────────

variable "cluster_version" {
  description = "Kubernetes version for the EKS cluster."
  type        = string
  default     = "1.30"
}

variable "node_instance_types" {
  description = "EC2 instance types for the EKS managed node group."
  type        = list(string)
  default     = ["t3.medium"]
}

variable "node_desired_size" {
  description = "Desired number of worker nodes."
  type        = number
  default     = 2
}

variable "node_min_size" {
  description = "Minimum number of worker nodes."
  type        = number
  default     = 1
}

variable "node_max_size" {
  description = "Maximum number of worker nodes."
  type        = number
  default     = 5
}

variable "node_disk_size" {
  description = "Disk size in GB for each worker node."
  type        = number
  default     = 20
}

# ── DocumentDB (MongoDB-compatible) ─────────────────────────

variable "docdb_instance_class" {
  description = "Instance class for DocumentDB cluster instances."
  type        = string
  default     = "db.t3.medium"
}

variable "docdb_instance_count" {
  description = "Number of DocumentDB cluster instances."
  type        = number
  default     = 1

  validation {
    condition     = var.docdb_instance_count >= 1 && var.docdb_instance_count <= 16
    error_message = "DocumentDB instance count must be between 1 and 16."
  }
}

variable "docdb_master_username" {
  description = "Master username for DocumentDB."
  type        = string
  default     = "consistium_admin"
  sensitive   = true
}

variable "docdb_master_password" {
  description = "Master password for DocumentDB. Must be at least 8 characters."
  type        = string
  sensitive   = true

  validation {
    condition     = length(var.docdb_master_password) >= 8
    error_message = "DocumentDB master password must be at least 8 characters."
  }
}

variable "docdb_backup_retention" {
  description = "Number of days to retain automated backups."
  type        = number
  default     = 7
}
