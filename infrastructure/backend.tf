terraform {
  required_version = ">= 1.0"
  
  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.0"
    }
  }
  
  backend "s3" {
    bucket = "065715357946-terraform-states"
    key    = "whatbreaks/terraform.tfstate"
    region = "us-east-1"
    
    dynamodb_table = "tf-state-lock"
    # encrypt        = true
  }
}
