# two lambda functions w/ function url
# one dynamodb table
# roles and policies as needed
# step functions (if you're going for the bonus marks)

terraform {
  required_providers {
    aws = {
      version = ">= 4.0.0"
      source  = "hashicorp/aws"
    }
  }
}

# specify the provider region
provider "aws" {
  region = "ca-central-1"
}

# the locals block is used to declare constants
locals {
  create-obituary_name = "create-obituary-30150088"
  create-obituary-handler_name  = "main.lambda_handler"
  get-obituaries_name = "get-obituaries-30150088"
  get-obituaries-handler_name  = "main.lambda_handler"
  create-obituary-artifact_name = "../functions/create-obituary/artifact.zip"
  get-obituaries-artifact_name = "../functions/get-obituaries/artifact.zip"
}

# create a role for all the Lambda functions to assume
resource "aws_iam_role" "IAM-role-all" {
  name               = "IAM-role-lambda"
  assume_role_policy = <<EOF
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Action": "sts:AssumeRole",
      "Principal": {
        "Service": "lambda.amazonaws.com"
      },
      "Effect": "Allow",
      "Sid": ""
    }
  ]
}
EOF
}

#aws IAM role policy for all
resource "aws_iam_policy" "logs_all" {
  name        = "lambda-log"
  description = "IAM policy for logging from a lambda"

  policy = <<EOF
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Action": [
        "*"
        
        
      ],
      "Resource":"*",
      "Effect": "Allow"
    }
  ]
}
EOF
}

#Attaching above policies
resource "aws_iam_role_policy_attachment" "lambda_logs" {
  role       = aws_iam_role.IAM-role-all.name
  policy_arn = aws_iam_policy.logs_all.arn
}


# Create archive files
data "archive_file" "create-obituary-archive" {
  type = "zip"
  source_dir = "../functions/create-obituary"
  output_path = local.create-obituary-artifact_name
}

data "archive_file" "get-obituaries-archive" {
  type = "zip"
  source_dir = "../functions/get-obituaries"
  output_path = local.get-obituaries-artifact_name
}

# create the 2 Lambda functions
resource "aws_lambda_function" "lambda-create-obituary" {
  role             = aws_iam_role.IAM-role-all.arn
  function_name    = local.create-obituary_name
  handler          = local.create-obituary-handler_name
  filename         = local.create-obituary-artifact_name
  source_code_hash = data.archive_file.create-obituary-archive.output_base64sha256
  runtime = "python3.9"
  timeout = 20
}

resource "aws_lambda_function" "lambda-get-obituaries" {
  role             = aws_iam_role.IAM-role-all.arn
  function_name    = local.get-obituaries_name
  handler          = local.get-obituaries-handler_name
  filename         = local.get-obituaries-artifact_name
  source_code_hash = data.archive_file.get-obituaries-archive.output_base64sha256
  timeout = 20
  runtime = "python3.9"
}

# create a Function URLs for Lambdas 
resource "aws_lambda_function_url" "create-obituary-url" {
  function_name      = aws_lambda_function.lambda-create-obituary.function_name
  authorization_type = "NONE"

  cors {
    allow_credentials = true
    allow_origins     = ["*"]
    allow_methods     = ["POST"]
    allow_headers     = ["*"]
    expose_headers    = ["keep-alive", "date"]
  }
}

resource "aws_lambda_function_url" "get-obituaries-url" {
  function_name      = aws_lambda_function.lambda-get-obituaries.function_name
  authorization_type = "NONE"

  cors {
    allow_credentials = true
    allow_origins     = ["*"]
    allow_methods     = ["GET"]
    allow_headers     = ["*"]
    expose_headers    = ["keep-alive", "date"]
  }
}

# show the Function URL after creation
output "create-obituary_url" {
  value = aws_lambda_function_url.create-obituary-url.function_url
}

output "get-obituaries_url" {
  value = aws_lambda_function_url.get-obituaries-url.function_url
}

# Dynamodb
resource "aws_dynamodb_table" "obituary-30152819" {
  name         = "obituary-30152819"
  billing_mode = "PROVISIONED"

  # up to 8KB read per second (eventually consistent)
  read_capacity = 1

  # up to 1KB per second
  write_capacity = 1

  hash_key = "id"

  attribute {
    name = "id"
    type = "S"
  }  
}
