output "endpoint" {
  description = "DocumentDB cluster endpoint."
  value       = aws_docdb_cluster.main.endpoint
}

output "reader_endpoint" {
  description = "DocumentDB cluster reader endpoint for read replicas."
  value       = aws_docdb_cluster.main.reader_endpoint
}

output "port" {
  description = "DocumentDB cluster port."
  value       = aws_docdb_cluster.main.port
}

output "cluster_identifier" {
  description = "DocumentDB cluster identifier."
  value       = aws_docdb_cluster.main.cluster_identifier
}

output "security_group_id" {
  description = "Security group ID of the DocumentDB cluster."
  value       = aws_security_group.docdb.id
}
