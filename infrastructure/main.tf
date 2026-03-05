# DynamoDB Table for storing pre-mortem analyses
resource "aws_dynamodb_table" "analyses" {
  name           = "${var.project_name}-analyses"
  billing_mode   = "PAY_PER_REQUEST"
  hash_key       = "id"
  
  attribute {
    name = "id"
    type = "S"
  }
  
  attribute {
    name = "timestamp"
    type = "S"
  }
  
  attribute {
    name = "userId"
    type = "S"
  }
  
  global_secondary_index {
    name            = "TimestampIndex"
    hash_key        = "timestamp"
    projection_type = "ALL"
  }
  
  global_secondary_index {
    name            = "UserIdIndex"
    hash_key        = "userId"
    range_key       = "timestamp"
    projection_type = "ALL"
  }
  
  ttl {
    attribute_name = "ttl"
    enabled        = true
  }
  
  tags = merge(
    var.common_tags,
    {
      Name = "${var.project_name}-analyses"
    }
  )
}

# DynamoDB Table for storing custom templates
resource "aws_dynamodb_table" "templates" {
  name           = "${var.project_name}-templates"
  billing_mode   = "PAY_PER_REQUEST"
  hash_key       = "id"
  
  attribute {
    name = "id"
    type = "S"
  }
  
  attribute {
    name = "userId"
    type = "S"
  }
  
  attribute {
    name = "createdAt"
    type = "S"
  }
  
  global_secondary_index {
    name            = "UserIdIndex"
    hash_key        = "userId"
    range_key       = "createdAt"
    projection_type = "ALL"
  }
  
  tags = merge(
    var.common_tags,
    {
      Name = "${var.project_name}-templates"
    }
  )
}

# S3 Bucket for storing PDF reports
resource "aws_s3_bucket" "reports" {
  bucket = "${var.project_name}-reports-${var.environment}"
  
  tags = merge(
    var.common_tags,
    {
      Name = "${var.project_name}-reports"
    }
  )
}

resource "aws_s3_bucket_versioning" "reports" {
  bucket = aws_s3_bucket.reports.id
  
  versioning_configuration {
    status = "Enabled"
  }
}

resource "aws_s3_bucket_server_side_encryption_configuration" "reports" {
  bucket = aws_s3_bucket.reports.id
  
  rule {
    apply_server_side_encryption_by_default {
      sse_algorithm = "AES256"
    }
  }
}

# IAM Role for Lambda
resource "aws_iam_role" "lambda_role" {
  name = "${var.project_name}-lambda-role"
  
  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Action = "sts:AssumeRole"
        Effect = "Allow"
        Principal = {
          Service = "lambda.amazonaws.com"
        }
      }
    ]
  })
  
  tags = merge(
    var.common_tags,
    {
      Name = "${var.project_name}-lambda-role"
    }
  )
}

# IAM Policy for Lambda
resource "aws_iam_role_policy" "lambda_policy" {
  name = "${var.project_name}-lambda-policy"
  role = aws_iam_role.lambda_role.id
  
  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Action = [
          "logs:CreateLogGroup",
          "logs:CreateLogStream",
          "logs:PutLogEvents"
        ]
        Resource = "arn:aws:logs:*:*:*"
      },
      {
        Effect = "Allow"
        Action = [
          "bedrock:InvokeModel",
          "bedrock:InvokeModelWithResponseStream"
        ]
        Resource = [
          "arn:aws:bedrock:*::foundation-model/*",
          "arn:aws:bedrock:*:*:inference-profile/*"
        ]
      },
      # Bedrock Agents permissions disabled - using single-agent only
      # {
      #   Effect = "Allow"
      #   Action = [
      #     "bedrock:InvokeAgent",
      #     "bedrock:GetAgent",
      #     "bedrock:GetAgentAlias",
      #     "bedrock:Retrieve",
      #     "bedrock:RetrieveAndGenerate"
      #   ]
      #   Resource = [
      #     "arn:aws:bedrock:*:*:agent/*",
      #     "arn:aws:bedrock:*:*:agent-alias/*/*"
      #   ]
      # },
      {
        Effect = "Allow"
        Action = [
          "aws-marketplace:ViewSubscriptions",
          "aws-marketplace:Subscribe"
        ]
        Resource = "*"
      },
      {
        Effect = "Allow"
        Action = [
          "dynamodb:PutItem",
          "dynamodb:GetItem",
          "dynamodb:Query",
          "dynamodb:Scan"
        ]
        Resource = [
          aws_dynamodb_table.analyses.arn,
          "${aws_dynamodb_table.analyses.arn}/index/*"
        ]
      },
      {
        Effect = "Allow"
        Action = [
          "dynamodb:PutItem",
          "dynamodb:GetItem",
          "dynamodb:UpdateItem",
          "dynamodb:DeleteItem",
          "dynamodb:Query",
          "dynamodb:Scan"
        ]
        Resource = [
          aws_dynamodb_table.templates.arn,
          "${aws_dynamodb_table.templates.arn}/index/*"
        ]
      },
      {
        Effect = "Allow"
        Action = [
          "s3:PutObject",
          "s3:GetObject"
        ]
        Resource = "${aws_s3_bucket.reports.arn}/*"
      }
    ]
  })
}

# Lambda Function
resource "aws_lambda_function" "premortem" {
  filename         = "${path.module}/../backend/premortem-lambda.zip"
  function_name    = "${var.project_name}-premortem"
  role            = aws_iam_role.lambda_role.arn
  handler         = "index.handler"
  source_code_hash = filebase64sha256("${path.module}/../backend/premortem-lambda.zip")
  runtime         = "nodejs20.x"
  timeout          = 90  # 90 seconds for single-agent analysis
  memory_size     = 1024  # 1GB is sufficient for single-agent
  
  environment {
    variables = {
      DYNAMODB_TABLE           = aws_dynamodb_table.analyses.name
      TEMPLATES_TABLE          = aws_dynamodb_table.templates.name
      S3_BUCKET                = aws_s3_bucket.reports.id
      ENABLE_SAVE              = "true"
      # Bedrock Agents disabled - using single-agent Claude 3.5 Sonnet
      # SUPERVISOR_AGENT_ID      = aws_bedrockagent_agent.supervisor.agent_id
      # SUPERVISOR_AGENT_ALIAS_ID = aws_bedrockagent_agent_alias.supervisor_alias.agent_alias_id
    }
  }
  
  tags = merge(
    var.common_tags,
    {
      Name = "${var.project_name}-premortem"
    }
  )
  
  # Bedrock Agents dependencies removed
  # depends_on = [
  #   aws_bedrockagent_agent.supervisor,
  #   aws_bedrockagent_agent_alias.supervisor_alias
  # ]
}

# API Gateway
resource "aws_apigatewayv2_api" "api" {
  name          = "${var.project_name}-api"
  protocol_type = "HTTP"
  
  cors_configuration {
    allow_origins = var.allowed_origins
    allow_methods = ["POST", "GET", "PUT", "DELETE", "OPTIONS"]
    allow_headers = ["content-type", "authorization"]
    max_age       = 300
  }
  
  tags = merge(
    var.common_tags,
    {
      Name = "${var.project_name}-api"
    }
  )
}

resource "aws_apigatewayv2_integration" "lambda" {
  api_id           = aws_apigatewayv2_api.api.id
  integration_type = "AWS_PROXY"
  
  integration_uri    = aws_lambda_function.premortem.invoke_arn
  integration_method = "POST"
}

resource "aws_apigatewayv2_route" "premortem" {
  api_id    = aws_apigatewayv2_api.api.id
  route_key = "POST /premortem"
  target    = "integrations/${aws_apigatewayv2_integration.lambda.id}"
}

resource "aws_apigatewayv2_route" "parse_iac" {
  api_id    = aws_apigatewayv2_api.api.id
  route_key = "POST /parse-iac"
  target    = "integrations/${aws_apigatewayv2_integration.lambda.id}"
}

resource "aws_apigatewayv2_route" "list_reports" {
  api_id    = aws_apigatewayv2_api.api.id
  route_key = "GET /reports"
  target    = "integrations/${aws_apigatewayv2_integration.lambda.id}"
}

resource "aws_apigatewayv2_route" "get_report" {
  api_id    = aws_apigatewayv2_api.api.id
  route_key = "GET /reports/{id}"
  target    = "integrations/${aws_apigatewayv2_integration.lambda.id}"
}

# Template routes
resource "aws_apigatewayv2_route" "create_template" {
  api_id    = aws_apigatewayv2_api.api.id
  route_key = "POST /templates"
  target    = "integrations/${aws_apigatewayv2_integration.lambda.id}"
}

resource "aws_apigatewayv2_route" "list_templates" {
  api_id    = aws_apigatewayv2_api.api.id
  route_key = "GET /templates"
  target    = "integrations/${aws_apigatewayv2_integration.lambda.id}"
}

resource "aws_apigatewayv2_route" "get_template" {
  api_id    = aws_apigatewayv2_api.api.id
  route_key = "GET /templates/{id}"
  target    = "integrations/${aws_apigatewayv2_integration.lambda.id}"
}

resource "aws_apigatewayv2_route" "update_template" {
  api_id    = aws_apigatewayv2_api.api.id
  route_key = "PUT /templates/{id}"
  target    = "integrations/${aws_apigatewayv2_integration.lambda.id}"
}

resource "aws_apigatewayv2_route" "delete_template" {
  api_id    = aws_apigatewayv2_api.api.id
  route_key = "DELETE /templates/{id}"
  target    = "integrations/${aws_apigatewayv2_integration.lambda.id}"
}

resource "aws_apigatewayv2_stage" "default" {
  api_id      = aws_apigatewayv2_api.api.id
  name        = "$default"
  auto_deploy = true
  
  tags = merge(
    var.common_tags,
    {
      Name = "${var.project_name}-api-stage"
    }
  )
}

resource "aws_lambda_permission" "api_gateway" {
  statement_id  = "AllowAPIGatewayInvoke"
  action        = "lambda:InvokeFunction"
  function_name = aws_lambda_function.premortem.function_name
  principal     = "apigateway.amazonaws.com"
  source_arn    = "${aws_apigatewayv2_api.api.execution_arn}/*/*"
}
