terraform {
  required_providers {
    archestra = {
      source = "archestra-ai/archestra"
    }
    time = {
      source = "hashicorp/time"
    }
  }
}

provider "archestra" {
}

# ─── Variables ───────────────────────────────────────────────────────────────

variable "sentry_docker_image" {
  description = "Docker image for Sentry (must be pre-loaded into kind)"
  type        = string
  default     = "sentry:v1.1.4"
}

variable "malicious_demo_docker_image" {
  description = "Docker image for malicious demo server (must be pre-loaded into kind)"
  type        = string
  default     = "corporate-sentinel-bridge:v1.1.2"
}

variable "archestra_internal_url" {
  type    = string
  default = "http://host.docker.internal:9000"
}

variable "archestra_api_key" {
  type        = string
  description = "Archestra API Key"
  sensitive   = true
}

variable "groq_api_key" {
  type        = string
  description = "Groq API Key"
  default     = "%SAME%"
  sensitive   = true
}

variable "llm_model" {
  type    = string
  default = "llama-3.3-70b-versatile"
}

# ─── Sentry Pro ────────────────────────────────────────────────────────────

resource "archestra_mcp_registry_catalog_item" "sentry" {
  name        = "sentry-pro"
  description = "Sentry Professional Security Auditor — Advanced adversarial modeling and deep scanning"

  local_config = {
    command        = "node"
    arguments      = ["/Users/sumangiri/Desktop/mcp-guardian/dist/index.js"]
    transport_type = "streamable-http"
    http_port      = 8080
    http_path      = "/mcp"

    environment = {
      TRANSPORT          = "sse"
      PORT               = "8080"
      ARCHESTRA_API_URL  = "http://localhost:9000"
      ARCHESTRA_API_KEY  = var.archestra_api_key
      GROQ_API_KEY       = var.groq_api_key
      LLM_MODEL          = var.llm_model
    }
  }
}

resource "archestra_mcp_server_installation" "sentry" {
  name          = "sentry-pro"
  mcp_server_id = archestra_mcp_registry_catalog_item.sentry.id
}

# ─── The Target (Bridge) ──────────────────────────────────────────────────

resource "archestra_mcp_registry_catalog_item" "bridge" {
  name        = "legacy-bridge"
  description = "Vulnerable legacy bridge for Sentry demonstration"

  local_config = {
    command        = "npx"
    arguments      = ["tsx", "/Users/sumangiri/Desktop/mcp-guardian/index.ts"]
    transport_type = "streamable-http"
    http_port      = 8081
    http_path      = "/mcp"

    environment = {
      TRANSPORT = "sse"
      PORT      = "8081"
    }
  }
}

resource "archestra_mcp_server_installation" "bridge" {
  name          = "legacy-bridge"
  mcp_server_id = archestra_mcp_registry_catalog_item.bridge.id
}

# ─── Security Profile ──────────────────────────────────────────────────────

resource "archestra_profile" "sentry_agent" {
  name = "Sentry Pro Agent"

  labels = [
    {
      key   = "purpose"
      value = "security-auditing"
    }
  ]
}

# ─── Wait ──────────────────────────────────────────────────────────────────

resource "time_sleep" "wait_for_discovery" {
  depends_on = [
    archestra_mcp_server_installation.sentry,
    archestra_mcp_server_installation.bridge
  ]
  create_duration = "120s"
}
