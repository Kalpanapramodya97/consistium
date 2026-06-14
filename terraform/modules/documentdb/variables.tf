variable "name_prefix" {
  description = "Prefix for resource naming."
  type        = string
}

variable "vpc_id" {
  description = "VPC ID for the security group."
  type        = string
}

variable "private_subnet_ids" {
  description = "Private subnet IDs for the DocumentDB subnet group."
  type        = list(string)
}

variable "instance_class" {
  description = "DocumentDB instance class."
  type        = string
}

variable "instance_count" {
  description = "Number of DocumentDB instances in the cluster."
  type        = number
}

variable "master_username" {
  description = "Master username for DocumentDB."
  type        = string
  sensitive   = true
}

variable "master_password" {
  description = "Master password for DocumentDB."
  type        = string
  sensitive   = true
}

variable "backup_retention" {
  description = "Number of days to retain automated backups."
  type        = number
}

variable "allowed_security_group_ids" {
  description = "Security group IDs allowed to connect to DocumentDB."
  type        = list(string)
}
