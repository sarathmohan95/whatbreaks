# API Gateway Security Configuration
# Restricts API access to only CloudFront distribution

# Generate a random secret for CloudFront to API Gateway authentication
resource "random_password" "api_secret" {
  length  = 32
  special = true
}

# Store the secret in AWS Secrets Manager for reference
resource "aws_secretsmanager_secret" "api_secret" {
  name                    = "${var.project_name}-cloudfront-api-secret"
  description             = "Secret header value for CloudFront to API Gateway authentication"
  recovery_window_in_days = 7
  
  tags = merge(
    var.common_tags,
    {
      Name = "${var.project_name}-api-secret"
    }
  )
}

resource "aws_secretsmanager_secret_version" "api_secret" {
  secret_id     = aws_secretsmanager_secret.api_secret.id
  secret_string = random_password.api_secret.result
}

# Lambda function to validate the custom header
resource "aws_lambda_function" "api_authorizer" {
  filename         = "${path.module}/../backend/api-authorizer.zip"
  function_name    = "${var.project_name}-api-authorizer"
  role            = aws_iam_role.lambda_role.arn
  handler         = "index.handler"
  source_code_hash = fileexists("${path.module}/../backend/api-authorizer.zip") ? filebase64sha256("${path.module}/../backend/api-authorizer.zip") : null
  runtime         = "nodejs18.x"
  timeout         = 3
  
  environment {
    variables = {
      API_SECRET = random_password.api_secret.result
    }
  }
  
  tags = merge(
    var.common_tags,
    {
      Name = "${var.project_name}-api-authorizer"
    }
  )
}

# Lambda permission for API Gateway to invoke authorizer
resource "aws_lambda_permission" "api_authorizer" {
  statement_id  = "AllowAPIGatewayInvokeAuthorizer"
  action        = "lambda:InvokeFunction"
  function_name = aws_lambda_function.api_authorizer.function_name
  principal     = "apigateway.amazonaws.com"
  source_arn    = "${aws_apigatewayv2_api.api.execution_arn}/*/*"
}

# API Gateway Authorizer
resource "aws_apigatewayv2_authorizer" "cloudfront" {
  api_id           = aws_apigatewayv2_api.api.id
  authorizer_type  = "REQUEST"
  authorizer_uri   = aws_lambda_function.api_authorizer.invoke_arn
  identity_sources = ["$request.header.X-CloudFront-Secret"]
  name             = "cloudfront-authorizer"
  
  authorizer_payload_format_version = "2.0"
  enable_simple_responses           = true
}

# Output the secret for CloudFront configuration
output "api_secret_header_value" {
  value       = random_password.api_secret.result
  sensitive   = true
  description = "Secret value for X-CloudFront-Secret header"
}
