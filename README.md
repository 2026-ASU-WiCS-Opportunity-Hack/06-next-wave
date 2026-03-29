# 🏥 CareTrack — Nonprofit Client & Case Management Platform

> Built for [Opportunity Hack / WiCS Hackathon 2026](https://ohack.dev) · Track 1  
> Replacing spreadsheets with an AI-native platform nonprofits can actually afford.

---

##  What is CareTrack?

CareTrack is a lightweight, open-source client and case management web app built for nonprofits delivering human services — therapy, food assistance, housing, animal rescue, youth mentoring.

**The problem:** 92% of nonprofits run on budgets under $1M. Enterprise tools like Bonterra Apricot cost $50–150/user/month. So they use spreadsheets, paper forms, and disconnected Google Forms.

**The solution:** A deployable platform for under $30/month that handles client registration, visit/service logging, role-based access, and AI-powered intake + search.

---

##  Features

### P0 — Core (Shipped)
-  **Auth** — Google SSO + email via Supabase Auth. Admin and Staff roles.
-  **Client Registration** — Name, DOB, contact info, configurable demographics (stored as JSONB).
-  **Service / Visit Logging** — Log service type, date, staff, and free-text notes per client.
-  **Client Profile View** — Demographics at top, chronological service history below.
-  **Seed Data** — 10+ clients, 30+ service entries pre-loaded for demo.

### AI Features
-  **Photo-to-Intake** — Snap a photo of a paper intake form → Claude Vision extracts fields → pre-populates registration form. Kills 15–20 min of manual data entry per client.
-  **Semantic Search** — Ask *"which clients needed housing referrals last month?"* → pgvector cosine similarity search across all case notes → returns relevant results even without exact keyword matches.

---

##  Architecture

```
nonprofit-cms/
├── frontend/                 # Next.js 14 (App Router)
│   ├── app/
│   │   ├── (auth)/           # Login page
│   │   ├── dashboard/        # Main dashboard
│   │   ├── clients/          # Client list + profile pages
│   │   ├── services/         # Service log
│   │   └── api/              # Next.js API routes → Supabase CRUD
│   └── components/           # Shared UI components
│
├── ai-service/               # FastAPI (Python) — AI gateway only
│   ├── main.py
│   ├── routers/
│   │   ├── intake.py         # POST /ai/intake → Claude Vision
│   │   └── search.py         # POST /ai/search → pgvector
│   └── requirements.txt
│
└── supabase/
    ├── schema.sql             # Table definitions + RLS policies
    └── seed.sql               # Demo data
```

### Why this split?
- **Next.js API routes** handle all CRUD — keeps the frontend team unblocked and eliminates a round-trip for simple DB operations.
- **FastAPI** owns the AI layer exclusively — all Claude/OpenAI calls are server-side, never exposed to the client. One place for rate limiting, cost tracking, and prompt management.

---

##  Database Schema

```sql
users           → id, email, role (admin/staff), created_at
clients         → id, name, dob, phone, email, demographics (jsonb), created_at
service_entries → id, client_id, date, service_type, staff_id, notes, embedding (vector), created_at
service_types   → id, name
follow_ups      → id, client_id, service_entry_id, due_date, note, done
```

Row-Level Security (RLS) enforced on all tables via Supabase policies.

---

##  Quick Start

### Prerequisites
- Node.js 18+
- Python 3.11+
- Supabase account (free)
- Anthropic API key (Claude Vision for Photo-to-Intake)
- OpenAI API key (embeddings for Semantic Search)

### 1. Clone
```bash
git clone https://github.com/your-username/nonprofit-cms
cd nonprofit-cms
```

### 2. Supabase Setup
1. Create a new project at [supabase.com](https://supabase.com)
2. Enable the `pgvector` extension: **Database → Extensions → vector**
3. Run the schema:
```bash
psql $SUPABASE_DB_URL < supabase/schema.sql
psql $SUPABASE_DB_URL < supabase/seed.sql
```
4. Enable Google OAuth: **Authentication → Providers → Google**

### 3. Frontend
```bash
cd frontend
cp .env.example .env.local
# Fill in NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_ANON_KEY, AI_SERVICE_URL
npm install
npm run dev
```

### 4. AI Service
```bash
cd ai-service
python -m venv venv
source venv/bin/activate        # Windows: venv\Scripts\activate
pip install -r requirements.txt
cp .env.example .env
# Fill in ANTHROPIC_API_KEY, OPENAI_API_KEY, SUPABASE_URL, SUPABASE_SERVICE_KEY
uvicorn main:app --reload --port 8000
```

---

## 🌐 Deployment

### Frontend → Vercel
```bash
cd frontend
npx vercel --prod
# Set env vars in Vercel dashboard
```

### AI Service → Render
1. Connect GitHub repo at [render.com](https://render.com)
2. New Web Service → Root directory: `ai-service`
3. Build command: `pip install -r requirements.txt`
4. Start command: `uvicorn main:app --host 0.0.0.0 --port $PORT`
5. Add environment variables in Render dashboard

---

##  Cost Estimate

| Service | Free Tier | What We Use |
|---------|-----------|-------------|
| Supabase | 500MB DB, 50K auth users | DB + Auth + pgvector |
| Vercel | 100GB bandwidth | Frontend hosting |
| Render | 750hrs/month | AI service hosting |
| Claude Vision | ~$0.01–0.05/image | Photo-to-Intake |
| OpenAI Embeddings | ~$0.001/query | Semantic Search |
| **Total (MVP)** | **~$0/month** | Well under $30 |

---

##  Environment Variables

### frontend/.env.example
```
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
AI_SERVICE_URL=http://localhost:8000
```

### ai-service/.env.example
```
ANTHROPIC_API_KEY=
OPENAI_API_KEY=
SUPABASE_URL=
SUPABASE_SERVICE_KEY=
```

---

## AI Features — How They Work

### Photo-to-Intake
```
User uploads photo
      ↓
POST /ai/intake (FastAPI)
      ↓
Claude Vision: "Extract all form fields, return JSON matching client schema"
      ↓
Pre-filled registration form returned
      ↓
Staff reviews + confirms → saved to Supabase
```

### Semantic Search
```
Staff types natural language query
      ↓
POST /ai/search (FastAPI)
      ↓
OpenAI text-embedding-3-small → query vector
      ↓
Supabase pgvector cosine similarity against service_entries.embedding
      ↓
Ranked client results with matching note snippets returned
```
> Embeddings are generated and stored on every service entry save (Next.js API route calls FastAPI `/ai/embed` in the background).

---

##  Team Roles

| Person | Owns |
|--------|------|
| Himanshu | FastAPI AI service, Supabase schema, pgvector, seed data |
| Teammate | Next.js frontend, client CRUD, service log UI |

---

##  Built At

**WiCS x Opportunity Hack Hackathon — March 2026**  
Track 1: Nonprofit Client & Case Management Platform  
Serving: NMTSA, Chandler CARE Center, Will2Walk, ICM Food & Clothing Bank, Sunshine Acres, Lost Our Home Pet Rescue

---

##  License

MIT — free to use, deploy, and modify. Built for nonprofits, by volunteers.
