output "api_endpoint" {
  description = "API Gateway endpoint URL"
  value       = aws_apigatewayv2_api.api.api_endpoint
}

output "lambda_function_name" {
  description = "Lambda function name"
  value       = aws_lambda_function.premortem.function_name
}

output "dynamodb_table_name" {
  description = "DynamoDB table name"
  value       = aws_dynamodb_table.analyses.name
}

output "s3_bucket_name" {
  description = "S3 bucket name for reports"
  value       = aws_s3_bucket.reports.id
}

output "api_invoke_url" {
  description = "Full API invoke URL"
  value       = "${aws_apigatewayv2_api.api.api_endpoint}/premortem"
}
