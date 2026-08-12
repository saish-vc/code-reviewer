# Terraform infrastructure configuration for REVU AI Code Reviewer (Render Free Tier deployment)

terraform {
  required_version = ">= 1.0.0"
  required_providers {
    render = {
      source  = "render-oss/render"
      version = "~> 1.3.0"
    }
  }
}

provider "render" {
  api_key = var.render_api_key
}

resource "render_web_service" "revu_backend" {
  name          = var.service_name
  plan          = "free"
  region        = var.region
  start_command = "uvicorn app:app --host 0.0.0.0 --port $PORT"

  runtime_source = {
    image = {
      image_url = var.docker_image
    }
  }

  env_vars = {
    NVIDIA_API_KEY = {
      value = var.nvidia_api_key
    }
    ALLOWED_ORIGINS = {
      value = var.allowed_origins
    }
    DATABASE_URL = {
      value = var.database_url
    }
  }
}
