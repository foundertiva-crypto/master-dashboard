# Deployment repair — 29 September 2026

These changes prepare the existing application; they do not certify or deploy it.

## Corrected

- Browser calls default to the current origin, so a remote browser does not contact its own localhost or a Docker service name.
- Server-side development rewrites use API_INTERNAL_URL, independently of browser configuration.
- Frontend image creates its optional public directory before copying it.
- Compose publishes ports only on loopback and requires an explicit database password.
- Linux Docker gets a host-gateway mapping for the existing ERP proxy.
- Removed NUL bytes from .gitignore.
- Optional private n8n stack uses persistent data and requires a selected image version and encryption key.

## Still required before deployment

- Full frontend/API builds and container startup tests; Docker is unavailable in this editing environment.
- Dependency/security review, especially the existing application framework and upload/authentication code.
- Secure JWT secrets and initial-account review. Do not use seed accounts/default credentials in production.
- Verified ERP endpoint: the existing Nginx configuration assumes host port 8080. Change only to the actual service.
- Verify the API's existing shared-module dependency resolution and production startup.
- Existing provider credentials and storage configuration entered securely on the target host.
- VM access, backups, private routing, end-to-end login/upload/ERP tests.

## n8n

Reuse existing n8n if healthy. Otherwise select an exact supported image tag from official n8n documentation, store a random encryption key securely, and run the optional Compose stack on the authorized host. Do not replace a running instance's encryption key: previously stored credentials depend on it. Complete owner setup through private access before exposing any route. Keep TLS/authentication in front of remote access. No workflows or external accounts are connected by this file.

Make and Zapier are separate hosted account integrations, not packages that this Compose file installs. Assess existing account entitlements before adding workflows or paid features.
