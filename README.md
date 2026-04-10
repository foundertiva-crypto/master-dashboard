# Tiva Master Dashboard

**Founder's Command Center** — Phase 1 Production Build

Integrates with an existing ERPNext deployment on AWS EC2 via REST API. Zero direct database access. Safe, modular, upgrade-ready.

## Architecture

```
┌─────────────────────────────────────────────────┐
│                    Nginx                         │
│   / → Dashboard:3000  /api → API:4000           │
│   /erp → ERPNext:8000                           │
└──────────┬──────────────┬──────────────┬────────┘
           │              │              │
    ┌──────▼──────┐ ┌─────▼─────┐ ┌─────▼─────┐
    │  Dashboard  │ │ API Layer │ │  ERPNext   │
    │  Next.js +  │ │  Express  │ │  (existing)│
    │  Refine.dev │ │  Port 4000│ │  Port 8000 │
    │  Port 3000  │ └─────┬─────┘ └───────────┘
    └─────────────┘       │
                    ┌─────▼─────┐
                    │ PostgreSQL│  ← Logs, Auth, Tracker
                    │ AWS S3    │  ← File Storage
                    │ AI (Dual) │  ← OpenAI + Claude
                    └───────────┘
```

## Modules

| # | Module | Status |
|---|--------|--------|
| 1 | Master Dashboard (Refine + Ant Design) | Ready |
| 2 | ERPNext REST API Integration | Ready |
| 3 | Bulk Upload Engine (CSV/Excel/JSON) | Ready |
| 4 | AWS S3 Storage | Ready |
| 5 | Dual AI Chatbot (OpenAI + Claude) | Ready |
| 6 | API Gateway (Express) | Ready |
| 7 | Logging System (PostgreSQL + Winston) | Ready |
| 8 | Nginx Reverse Proxy | Ready |
| 9 | Docker Deployment | Ready |
| 10 | Security (JWT + Rate Limiting) | Ready |

## Quick Start

```bash
# 1. Clone
git clone https://github.com/foundertiva-crypto/master-dashboard.git
cd master-dashboard

# 2. Configure
cp .env.example .env
# Edit .env with your actual keys

# 3. Docker (recommended)
docker compose up -d --build

# 4. Initialize database
npm run db:migrate
npm run db:seed
```

## Manual Development

```bash
npm run setup          # Install all dependencies
npm run dev            # Start API + Dashboard concurrently
```

## Environment Variables

Copy `.env.example` and fill in:
- ERPNext API credentials
- PostgreSQL connection
- AWS S3 keys
- OpenAI / Anthropic API keys
- JWT secrets

## Deployment (AWS EC2)

```bash
# Run the EC2 setup script
chmod +x scripts/deploy-ec2.sh
./scripts/deploy-ec2.sh

# S3 bucket setup
chmod +x scripts/setup-s3.sh
./scripts/setup-s3.sh
```

## CI/CD

GitHub Actions workflow at `.github/workflows/ci.yml`:
- Builds API + Dashboard on every push
- Tests Docker build
- Auto-deploys to EC2 on `main` branch (requires secrets: `EC2_HOST`, `EC2_USER`, `EC2_SSH_KEY`)

## Ports

| Service | Port |
|---------|------|
| ERPNext | 8000 |
| Dashboard | 3000 |
| API Gateway | 4000 |
| PostgreSQL | 5432 |

## Phase Roadmap

- **Phase 1** (Current): Dashboard + ERP + Bulk Upload + S3 + AI Chat
- **Phase 2**: Payments, Banking, Razorpay/Stripe
- **Phase 3**: Communication, WhatsApp, CRM Pipeline

---

Built by Tiva | `foundertiva-crypto`
