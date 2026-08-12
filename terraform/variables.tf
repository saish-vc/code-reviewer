variable "render_api_key" {
  type        = string
  description = "Render API key for deployment automation"
  sensitive   = true
}

variable "service_name" {
  type        = string
  description = "Name of the web service on Render"
  default     = "revu-ai-code-reviewer"
}

variable "region" {
  type        = string
  description = "Deployment region"
  default     = "oregon"
}

variable "docker_image" {
  type        = string
  description = "Docker image repository tag (e.g. ghcr.io/saish-vc/code-reviewer:latest)"
  default     = "ghcr.io/saish-vc/code-reviewer:latest"
}

variable "nvidia_api_key" {
  type        = string
  description = "NVIDIA NIM API key"
  sensitive   = true
  default     = "dummy-nvidia-key"
}

variable "allowed_origins" {
  type        = string
  description = "Allowed CORS origins"
  default     = "http://localhost:5173,http://localhost:7860,http://127.0.0.1:5173,http://127.0.0.1:7860"
}

variable "database_url" {
  type        = string
  description = "SQLite database path or external DB connection string"
  default     = "sqlite:///./reviews.db"
}
