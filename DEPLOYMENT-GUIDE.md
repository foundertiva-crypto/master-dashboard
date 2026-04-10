# Master Dashboard — Phase 1 Deployment Guide

## Folder Structure

```
master-dashboard/
├── .env.example                    # Environment template
├── .gitignore
├── docker-compose.yml              # Full stack orchestration
├── DEPLOYMENT-GUIDE.md             # This file
│
├── api/                            # API Gateway (Express, Port 4000)
│   ├── Dockerfile
│   ├── package.json
│   ├── tsconfig.json
│   └── src/
│       ├── server.ts               # Main entry point
│       ├── middleware/
│       │   ├── auth.ts             # JWT + API key auth
│       │   └── rateLimiter.ts      # Rate limiting
│       ├── routes/
│       │   ├── auth.routes.ts      # /api/auth/*
│       │   ├── erp.routes.ts       # /api/erp/*
│       │   ├── upload.routes.ts    # /api/upload/*
│       │   ├── chat.routes.ts      # /api/chat/*
│       │   ├── files.routes.ts     # /api/files/*
│       │   └── logs.routes.ts      # /api/logs/*
│       ├── models/
│       │   └── database.ts         # PostgreSQL pool
│       ├── services/
│       │   └── logger.service.ts   # Logging to DB + Winston
│       └── utils/
│           ├── migrate.ts          # DB migration runner
│           └── seed.ts             # Seed admin user
│
├── dashboard/                      # Frontend (Next.js + Refine, Port 3000)
│   ├── Dockerfile
│   ├── package.json
│   ├── tsconfig.json
│   ├── next.config.js
│   ├── .env.local
│   ├── app/
│   │   ├── layout.tsx              # Refine layout + navigation
│   │   ├── page.tsx                # Redirect to /dashboard
│   │   ├── dashboard/page.tsx      # ERP overview widgets
│   │   ├── bulk-upload/page.tsx    # Bulk upload manager
│   │   ├── chat/page.tsx           # AI chatbot
│   │   ├── files/page.tsx          # S3 file manager
│   │   └── logs/page.tsx           # Logs viewer
│   ├── providers/
│   │   ├── auth-provider.ts        # Refine auth provider
│   │   └── data-provider.ts        # Refine data provider
│   └── hooks/
│       └── useApi.ts               # API helper hook
│
├── lib/                            # Shared libraries
│   ├── erp.ts                      # ERPNext REST API client
│   └── s3.ts                       # AWS S3 operations
│
├── modules/
│   ├── bulk-upload/
│   │   ├── index.ts                # Upload engine (parse, validate, push)
│   │   └── validators/index.ts     # Schema validators per doctype
│   └── chat/
│       └── index.ts                # OpenAI chatbot
│
├── config/
│   └── index.ts                    # Centralized config
│
├── db/
│   └── schema.sql                  # PostgreSQL schema
│
├── nginx/
│   └── nginx.conf                  # Reverse proxy config
│
└── scripts/
    ├── deploy-ec2.sh               # EC2 setup automation
    └── setup-s3.sh                 # S3 bucket creation
```

## Step-by-Step Deployment

### Step 1: EC2 Instance Preparation

```bash
# SSH into your EC2 instance
ssh -i your-key.pem ubuntu@your-ec2-ip

# Run the deployment script
chmod +x scripts/deploy-ec2.sh
./scripts/deploy-ec2.sh
```

### Step 2: Configure Environment

```bash
cp .env.example .env
nano .env    # Fill in all values
```

Required values to set:
- `ERPNEXT_BASE_URL` — your ERPNext URL (e.g. `http://localhost:8000`)
- `ERPNEXT_API_KEY` / `ERPNEXT_API_SECRET` — from ERPNext > User Settings
- `DB_PASSWORD` — choose a strong password
- `JWT_SECRET` / `JWT_REFRESH_SECRET` — random 32+ character strings
- `AWS_ACCESS_KEY_ID` / `AWS_SECRET_ACCESS_KEY` — IAM credentials
- `S3_BUCKET_NAME` — your S3 bucket
- `OPENAI_API_KEY` — from OpenAI dashboard

### Step 3: Set Up S3 Bucket

```bash
chmod +x scripts/setup-s3.sh
./scripts/setup-s3.sh
```

### Step 4: Start with Docker Compose

```bash
docker compose up -d --build
```

### Step 5: Run Database Migration & Seed

```bash
# If running outside Docker:
cd api && npm install && npm run db:migrate && npm run db:seed

# If running inside Docker:
docker compose exec api node dist/utils/migrate.js
docker compose exec api node dist/utils/seed.js
```

### Step 6: Configure Nginx

```bash
# Copy nginx config to system nginx (if not using Docker nginx)
sudo cp nginx/nginx.conf /etc/nginx/nginx.conf
sudo nginx -t
sudo systemctl restart nginx
```

### Step 7: Push to GitHub

```bash
git init
git add .
git commit -m "Phase-1: Master Dashboard with ERPNext integration"
git branch -M main
git remote add origin https://github.com/YOUR_ORG/master-dashboard.git
git push -u origin main
```

## Port Map

| Service       | Port | Path       |
|---------------|------|------------|
| ERPNext       | 8000 | /erp       |
| Dashboard     | 3000 | /dashboard |
| API Gateway   | 4000 | /api       |
| Nginx         | 80   | /          |
| PostgreSQL    | 5432 | (internal) |

## API Endpoints

| Method | Endpoint                    | Description              |
|--------|-----------------------------|--------------------------|
| POST   | /api/auth/register          | Register user            |
| POST   | /api/auth/login             | Login, get JWT           |
| POST   | /api/auth/refresh           | Refresh token            |
| GET    | /api/auth/me                | Current user info        |
| GET    | /api/erp/health             | ERPNext connectivity     |
| GET    | /api/erp/dashboard          | Full dashboard overview  |
| GET    | /api/erp/sales              | Sales summary            |
| GET    | /api/erp/customers          | Customer summary         |
| GET    | /api/erp/inventory          | Inventory summary        |
| GET    | /api/erp/orders             | Orders summary           |
| GET    | /api/erp/invoices           | Invoices summary         |
| GET    | /api/upload/types           | Supported upload types   |
| GET    | /api/upload/template/:type  | Download template        |
| POST   | /api/upload/preview         | Parse & validate file    |
| POST   | /api/upload/process         | Push to ERPNext          |
| GET    | /api/upload/logs            | Upload history           |
| POST   | /api/chat/send              | Send chat message        |
| GET    | /api/chat/history/:session  | Chat history             |
| POST   | /api/files/upload           | Upload file to S3        |
| GET    | /api/files                  | List files               |
| GET    | /api/files/download/:id     | Get download URL         |
| DELETE | /api/files/:id              | Delete file              |
| GET    | /api/logs/uploads           | Upload logs              |
| GET    | /api/logs/chat              | Chat logs                |
| GET    | /api/logs/erp               | ERP request logs         |
| GET    | /api/logs/system            | System logs              |

## Verification Checklist

- [ ] ERPNext running on port 8000 (untouched)
- [ ] API Gateway responding on port 4000 (`curl http://localhost:4000/api/health`)
- [ ] Dashboard loading on port 3000
- [ ] Nginx routing /erp, /api, / correctly
- [ ] PostgreSQL running, schema applied
- [ ] Admin user created via seed
- [ ] Login works, JWT returned
- [ ] ERP dashboard overview loads data
- [ ] Bulk upload preview works (CSV/Excel/JSON)
- [ ] Bulk upload push to ERPNext works
- [ ] Chat sends messages and gets AI replies
- [ ] File upload to S3 works
- [ ] File list and download work
- [ ] All log tables are populated
- [ ] Logs viewer shows data
- [ ] Rate limiting is active
- [ ] No direct database access to ERPNext
- [ ] All ERP interaction through REST API only
