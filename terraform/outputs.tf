output "service_id" {
  value       = render_web_service.revu_backend.id
  description = "Render web service ID"
}

output "service_url" {
  value       = render_web_service.revu_backend.url
  description = "Public URL of the deployed REVU service"
}
