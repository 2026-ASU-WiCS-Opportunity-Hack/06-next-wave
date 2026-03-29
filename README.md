# CareVo — AI-Native Nonprofit Case Management Platform

<div align="center">

![CareVo](https://img.shields.io/badge/CareVo-Nonprofit%20CMS-E07B54?style=for-the-badge)
![Next.js](https://img.shields.io/badge/Next.js-16-black?style=for-the-badge&logo=next.js)
![FastAPI](https://img.shields.io/badge/FastAPI-Python-009688?style=for-the-badge&logo=fastapi)
![Supabase](https://img.shields.io/badge/Supabase-PostgreSQL-3ECF8E?style=for-the-badge&logo=supabase)
![Claude](https://img.shields.io/badge/Claude-Anthropic-E07B54?style=for-the-badge)
![License](https://img.shields.io/badge/License-MIT-green?style=for-the-badge)

**Built at WiCS x Opportunity Hack 2026 · Track 1 · Team Next Wave**

</div>

---

## What is CareVo?

CareVo replaces $2,500–7,500/month enterprise tools like Bonterra Apricot with an AI-native platform that runs for **under $30/month**. Built in 24 hours at Opportunity Hack 2026, addressing problems documented across 9 nonprofits and 7 hackathons.

> 92% of nonprofits operate on budgets under $1M. They use spreadsheets and paper forms, losing data and spending days on grant reports that should take minutes.

---

## Tech Stack

| Layer | Technology | Why |
|-------|-----------|-----|
| Frontend | Next.js 16 (App Router) | Server components, API routes, Vercel deploy |
| AI Service | FastAPI (Python) | Python-native AI ecosystem, isolated rate limiting |
| Database | Supabase (PostgreSQL + pgvector) | Auth + DB + vector search, free tier, RLS |
| AI Vision | Claude Vision (claude-opus-4-5) | Photo-to-intake without custom ML |
| AI Text | Claude API (claude-opus-4-5) | Voice extraction, analytics queries, form generation |
| Embeddings | OpenAI text-embedding-3-small | Semantic search across case notes |
| Vector Search | pgvector (Supabase extension) | No separate vector DB needed |
| Charts | Chart.js + react-chartjs-2 | Analytics visualizations |
| Hosting | Vercel + Render | Free tiers, one-click GitHub deploy |

> **Note on Claude:** Claude was used both as a core product feature (Vision, voice extraction, analytics, form generation) AND as a development assistant for debugging, architecture decisions, and code review throughout this project.

---

## Architecture Overview

```mermaid
graph TB
    subgraph Frontend ["Frontend — Next.js 16 (Vercel)"]
        UI[React UI]
        API[API Routes]
    end

    subgraph AIService ["AI Service — FastAPI (Render)"]
        INTAKE[Photo Intake]
        SEARCH[Semantic Search]
        EMBED[Embed Notes]
    end

    subgraph Database ["Supabase"]
        PG[(PostgreSQL)]
        VEC[(pgvector)]
        AUTH[Auth / JWT]
        RLS[Row Level Security]
    end

    subgraph AIAPIs ["AI APIs"]
        CLAUDE[Claude API]
        OPENAI[OpenAI Embeddings]
    end

    UI --> API
    UI --> AIService
    API --> Database
    AIService --> CLAUDE
    AIService --> OPENAI
    AIService --> Database
    RLS --> PG
    PG --> VEC
```

---

## User Roles

```mermaid
graph TD
    SA["Super Admin\nAll organizations\nCross-org analytics\nCreate nonprofits"]
    OA["Nonprofit Admin\nTheir org only\nCreate events and staff\nOrg analytics"]
    ST["Staff Worker\nAssigned events only\nAdd clients\nLog service entries"]
    PB["Public\nNo login required\nClient schedule page"]

    SA -->|manages| OA
    OA -->|manages| ST
    ST -->|serves| PB

    style SA fill:#E07B54,color:#fff
    style OA fill:#818CF8,color:#fff
    style ST fill:#2DD4BF,color:#fff
```

---

## Client Registration Flow

```mermaid
sequenceDiagram
    participant W as Worker
    participant UI as CareVo
    participant AI as AI Service
    participant C as Claude API
    participant DB as Supabase

    W->>UI: Opens event, clicks Add Client
    UI->>W: Shows event-specific intake form

    alt Photo Intake
        W->>UI: Uploads paper form photo
        UI->>AI: POST /ai/intake
        AI->>C: Claude Vision extraction
        C-->>UI: Pre-filled form fields
    else Voice Intake
        W->>UI: Speaks in EN/ES/FR
        UI->>AI: POST /api/ai/extract-voice
        AI->>C: Claude field extraction
        C-->>UI: Pre-filled form fields
    else Manual Entry
        W->>UI: Types details
    end

    W->>UI: Confirms and submits
    UI->>DB: Insert client + service entry + audit log
    UI->>AI: Embed notes for semantic search
```

---

## AI Analytics Flow

```mermaid
sequenceDiagram
    participant A as Admin
    participant UI as Analytics Page
    participant API as API Route
    participant C as Claude API
    participant DB as Supabase

    A->>UI: Types "How many male clients attended food distribution?"
    UI->>API: POST /api/ai/analytics-query
    API->>DB: Fetch events + service types for context
    API->>C: Question + context
    C-->>API: Query plan JSON with filters and aggregation
    API->>DB: Execute filtered query
    DB-->>API: Matching records
    API-->>UI: Count or breakdown result
    UI-->>A: Shows number with chart
```

---

## Semantic Search Flow

```mermaid
sequenceDiagram
    participant DB as Supabase pgvector

    Note over DB: On service entry save
    Note over DB: Embed notes via OpenAI
    Note over DB: Store vector[1536]

    participant U as User
    participant AI as AI Service
    participant OAI as OpenAI

    U->>AI: Search "clients who needed housing"
    AI->>OAI: Embed query
    OAI-->>AI: Query vector
    AI->>DB: Cosine similarity search
    DB-->>U: Top matching clients + snippets
```

---

## Features

### P0 Core (All Shipped)
- Email/password auth with 3 roles enforced at DB layer via RLS
- Client registration with required fields (name, gender, location)
- Service/visit logging with date and staff attribution
- Client profile with full service history
- Multi-org hierarchy with data isolation
- Event management (create, assign staff, track clients)

### P1 AI Features (All Shipped)

| Feature | How | Cost/use |
|---------|-----|----------|
| Photo-to-Intake | Claude Vision extracts paper form fields | ~$0.01–0.05 |
| Voice Intake | Web Speech API + Claude extraction | ~$0.001–0.01 |
| Semantic Search | OpenAI embeddings + pgvector | ~$0.001 |
| Ask Analytics | Claude NL to structured query | ~$0.002 |
| AI Form Generation | Claude generates fields per service type | ~$0.01 |
| Multilingual | EN/ES/FR toggle and voice | $0 |

### P1 Platform (All Shipped)
- Analytics dashboard (line, bar, doughnut charts) + PDF export
- Client Journey Timeline (visual event history)
- Client Scheduling + public shareable schedule link (no login)
- CSV import/export (flexible schema, any columns)
- Bulk event CSV import for workers
- Audit log for admins
- Duplicate client detection
- Dynamic forms per event type

---

## Database Schema

```mermaid
erDiagram
    organizations ||--o{ profiles : has
    organizations ||--o{ events : hosts
    organizations ||--o{ clients : serves
    events ||--o{ service_entries : contains
    clients ||--o{ service_entries : receives
    clients ||--o{ client_event_registrations : "registered for"
    events ||--o{ client_event_registrations : has
    service_types ||--o{ events : categorizes
    service_types ||--o{ form_schemas : has

    clients {
        uuid id PK
        text full_name
        date dob
        text phone
        jsonb demographics
        uuid org_id FK
    }
    service_entries {
        uuid id PK
        uuid client_id FK
        uuid event_id FK
        text notes
        vector embedding
        date date
    }
```

---

## Setup

### Local Development

```bash
git clone https://github.com/2026-ASU-WiCS-Opportunity-Hack/06-next-wave.git
cd 06-next-wave

# Frontend
cd frontend && npm install && npm run dev

# AI Service (new terminal)
cd ai-service
python -m venv venv && venv/Scripts/activate
pip install -r requirements.txt
uvicorn main:app --reload --port 8000
```

### Environment Variables

**`frontend/.env.local`**
```
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
NEXT_PUBLIC_AI_SERVICE_URL=http://localhost:8000
ANTHROPIC_API_KEY=
SUPABASE_SERVICE_ROLE_KEY=
```

**`ai-service/.env`**
```
ANTHROPIC_API_KEY=
OPENAI_API_KEY=
SUPABASE_URL=
SUPABASE_SERVICE_KEY=
```

### Supabase Setup
1. Enable pgvector: Database → Extensions → vector
2. Run `supabase/schema.sql` in SQL Editor
3. Run `supabase/seed.sql`
4. `UPDATE profiles SET role = 'super_admin' WHERE email = 'your@email.com'`

### Deploy to Production

**Frontend → Vercel**
- New Project → import repo → Root Directory: `frontend` → add env vars → Deploy

**AI Service → Render**
- New Web Service → root: `ai-service` → start: `uvicorn main:app --host 0.0.0.0 --port $PORT`
- Copy Render URL → set as `NEXT_PUBLIC_AI_SERVICE_URL` in Vercel

---

## Test Credentials

| Email | Role |
|-------|------|
| admin@caretrack.com | Super Admin |
| hpant.data@caretrack.com | Nonprofit Admin (ICM) |
| hardikk@caretrack.com | Nonprofit Admin (Chandler CARE) |
| staff@caretrack.com | Staff (ICM) |

---

## Project Structure

```
nonprofit-cms/
├── frontend/
│   ├── app/
│   │   ├── page.tsx             # Landing page
│   │   ├── dashboard/           # Role-based dashboard
│   │   ├── events/              # Event management
│   │   ├── clients/             # Client management
│   │   │   └── [id]/journey/    # Client timeline
│   │   │   └── [id]/schedule/   # Client scheduling
│   │   ├── admin/               # Admin panel + analytics
│   │   ├── schedule/[clientId]/ # Public schedule (no login)
│   │   └── api/                 # API routes
│   └── components/              # React components
├── ai-service/                  # FastAPI
│   ├── main.py
│   └── routers/
│       ├── intake.py            # Claude Vision
│       └── search.py            # Semantic search
├── supabase/
│   ├── schema.sql
│   └── seed.sql
└── .gitignore
```

---

## Competitive Analysis

| Feature | Bonterra Apricot | CareVo |
|---------|-----------------|--------|
| Monthly cost | $2,500–7,500 | $0–29 |
| Photo-to-Intake AI | No | Yes |
| Voice Intake | No | Yes (3 languages) |
| Semantic Search | Keyword only | pgvector NL |
| Ask Analytics | Basic | Full NL queries |
| Event-Based Workflow | No | Yes |
| Multi-Org Network | No | Yes |
| Open Source | No | Yes (MIT) |

---

## About Claude in This Project

Claude (Anthropic) powered both the product and the development:

**As a product feature:**
- Photo intake via Claude Vision API
- Voice field extraction via Claude text API
- Natural language analytics query interpretation
- Dynamic form generation per service type

**As a development tool:**
- Architecture design (RLS policies, pgvector setup, multi-org hierarchy)
- Debugging complex issues (circular RLS deadlocks, Supabase schema cache errors, Next.js hydration issues)
- Code generation and refactoring
- Writing documentation

The entire platform was built in 24 hours using Claude as a pair programming assistant.

---

## License

MIT — free to use, modify, and distribute.

*Built with love at Opportunity Hack 2026 · [ohack.dev](https://ohack.dev)*
