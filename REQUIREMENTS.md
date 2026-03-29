# CareVo — Software Requirements Document (SRD)

**Built at:** WiCS × Opportunity Hack 2026  
**Track:** 1 — Nonprofit Client & Case Management Platform  
**Team:** Next Wave  
**Version:** 1.0 · March 2026  
**License:** MIT · Open Source  

---

## 1. Problem Statement

### 1.1 Market Context

| Metric | Value |
|--------|-------|
| Nonprofits in the US | 1.8 million |
| Operating on budgets under $1M | 92% |
| Bonterra Apricot cost | $50–150/user/month |
| CharityTracker cost | $20/user/month |
| **CareVo cost** | **$0–29/month total** |

### 1.2 Documented Pain Points

Collected from 9 nonprofits across 7 OHack hackathons (2015–2024):

| Nonprofit | Problem | Hackathon |
|-----------|---------|-----------|
| NMTSA | Schedule music therapy sessions, track treatment progress | 2017, 2019, 2020 |
| Chandler CARE Center | Client intake for crisis services, demographics tracking | 2019 (2nd Place) |
| Will2Walk | Track rehabilitation progress for spinal cord injury patients | 2018 |
| ICM Food & Clothing Bank | Track client visits, services, family demographics for grants | 2018 |
| Sunshine Acres | Track children in care, health records, placement history | 2017 |
| Lost Our Home Pet Rescue | Animal intake, foster tracking, volunteer coordination | 2018 |
| Tranquility Trail | Animal sanctuary intake, medical records, donor management | 2018 |
| Seed Spot | Track alumni entrepreneurs, program engagement metrics | 2015 |

### 1.3 Key Insight

Every nonprofit submitted the same fundamental problem: "We need to register clients, record what we do for them, and report on it." CareVo is the configurable system that solves all of them.

---

## 2. Solution Overview

CareVo is an AI-native, open-source nonprofit case management platform with three differentiating capabilities:

1. **AI at the point of intake** — voice and photo capture replace manual data entry
2. **Event-based workflow** — matches how field workers actually think and operate  
3. **Multi-org hierarchy** — one platform serves multiple nonprofits as a network

---

## 3. Technology Stack

| Layer | Technology | Reason |
|-------|-----------|--------|
| Frontend | Next.js 16 (App Router) | Server components, built-in API routes, Vercel deploy |
| AI Service | FastAPI (Python) | Python-native AI ecosystem, isolated cost/rate limiting |
| Database | Supabase (PostgreSQL) | Auth + DB + pgvector in one, free tier, RLS policies |
| AI — Vision | Claude Vision (Anthropic) | Photo-to-intake without custom ML pipeline |
| AI — Text | Claude API (Anthropic) | Voice extraction, analytics queries, form generation |
| AI — Embeddings | OpenAI text-embedding-3-small | Semantic search, $0.02/1M tokens |
| Vector Search | Supabase pgvector | Semantic search in same DB, no separate vector store |
| Hosting | Vercel (frontend) + Render (AI) | Free tiers, one-click GitHub deploy |

---

## 4. User Roles

| Role | Access | Capabilities |
|------|--------|-------------|
| `super_admin` | All organizations | Create/manage nonprofits, cross-org analytics, all data |
| `nonprofit_admin` | Their organization only | Create events, manage staff, org analytics, all org clients |
| `staff` | Assigned events only | Add clients at events, log services, view own clients |
| Public (no login) | Client schedule page | View client's upcoming events via shareable URL |

---

## 5. Functional Requirements

### 5.1 P0 — Core (Must Ship)

#### AUTH-001: Authentication
- Email/password login
- Three roles enforced at database layer via Row-Level Security
- Session management via Supabase Auth JWT

#### AUTH-002: Role-Based Access Control
- `super_admin`: full access to all organizations and data
- `nonprofit_admin`: scoped to their `org_id` — cannot see other orgs' data
- `staff`: scoped to events they are assigned to, clients they created
- All enforced at PostgreSQL RLS layer, not just application code

#### CLIENT-001: Client Registration
- Required fields: `full_name`, `gender`, `location`
- Optional fields: `dob`, `phone`, `email`, `language`
- Dynamic demographic fields per service type (stored as JSONB)
- Unique client ID generated on creation

#### CLIENT-002: Client Profile View
- Demographics at top
- Service history below in reverse chronological order
- Show both service date and log creation date
- Admin: show who registered the client + when
- Admin: "Remove Client" with confirmation (soft delete)

#### SERVICE-001: Service / Visit Logging
- Log against a client: date, service type, staff member, free-text notes
- Link to an event (optional)
- Embedding generated on save for semantic search
- Service date ≠ log date — both displayed

#### EVENT-001: Event Management
- Create events with: name, date, location, description, service type, org
- Assign staff to events
- View upcoming (ascending) and past (descending) separately
- Event detail shows: stats, assigned staff, clients served, service log

#### DEPLOY-001: Deployment
- Frontend on Vercel free tier
- AI service on Render free tier
- Seed data: 3 orgs, 7+ staff, 8 events, 25+ clients, 26+ service entries

---

### 5.2 P1 — AI Features (All Shipped)

#### AI-001: Photo-to-Intake
- User uploads or snaps photo of paper intake form
- Claude Vision extracts fields into JSON matching client schema
- Pre-populates registration form for staff to review and confirm
- Supported formats: JPEG, PNG, WebP
- Cost: ~$0.01–0.05 per image

#### AI-002: Voice Intake
- Browser MediaRecorder captures speech
- Web Speech API transcribes in real-time (streams to text box)
- Staff can edit transcript before extracting
- Claude extracts structured fields from natural language
- Supports: English (`en-US`), Spanish (`es-ES`), French (`fr-FR`)
- Gender values normalized to English regardless of input language
- Cost: ~$0.001–0.01 per extraction

#### AI-003: Semantic Search
- Every service entry note embedded on save via `text-embedding-3-small`
- Embeddings stored in Supabase pgvector (`vector(1536)`)
- Natural language queries matched via cosine similarity
- Returns client name + matching note snippet + similarity score
- Cost: ~$0.001 per query

#### AI-004: Ask Analytics
- Admin types natural language question about their data
- Claude interprets intent and generates structured query plan
- Query executed against Supabase with org-level filtering
- Returns: count or breakdown with visual bar chart
- Example: "How many male clients attended food distribution?"
- Cost: ~$0.002 per query

#### AI-005: Dynamic Form Generation
- Admin creates new service type that doesn't exist in static templates
- Claude generates 5–8 relevant intake form fields
- Fields stored in `form_schemas` table (JSONB)
- Loaded automatically when staff registers client at that event type
- Supports: text, number, boolean, select, textarea field types
- Cost: ~$0.01 per generation (one-time per service type)

#### AI-006: Multilingual Forms
- Language toggle on all intake forms: EN / ES / FR
- All field labels translated client-side (no API calls)
- Voice intake respects selected language
- Client data stored in English regardless of input language

---

### 5.3 P1 — Platform Features (All Shipped)

#### ANALYTICS-001: Dashboard
- Line chart: weekly service entries trend (last 8 weeks)
- Bar chart: unique clients by service type
- Bar chart: age group distribution
- Doughnut chart: gender breakdown
- Doughnut chart: primary language breakdown
- Service type summary table with avg visits/client

#### ANALYTICS-002: Multi-Org Filtering
- `super_admin`: filter buttons for "All Orgs" or specific nonprofit
- `nonprofit_admin`: always scoped to their org
- Nonprofit breakdown table showing clients/entries/events per org

#### ANALYTICS-003: PDF Export
- Download full analytics report as PDF
- Includes: summary stats, nonprofit breakdown, service type tables, demographics
- Branded with org name and generation date
- Available to `super_admin` and `nonprofit_admin` only

#### DUPLICATE-001: Duplicate Detection
- Compare phone numbers across all clients (admin view)
- Flag clients with matching non-null phones
- Yellow highlight + "Possible duplicate" badge on client card
- Warning banner showing count of duplicates

#### JOURNEY-001: Client Journey View
- Visual timeline of all service entries for a client
- Grouped by event, sorted chronologically
- Shows: event name, date, location, service type, notes, logged by, timestamps
- Last event highlighted in coral
- Available to `nonprofit_admin` and `super_admin` only

#### SCHEDULE-001: Client Scheduling
- Register client for future events from their profile
- All roles can schedule (staff, org admin, super admin)
- Shows registered (highlighted in coral) vs available events
- Remove registration with one click

#### SCHEDULE-002: Public Schedule Link
- Shareable URL: `/schedule/[clientId]` — no login required
- Shows client's upcoming registered events with date, location, service type
- Events within 7 days highlighted as "This week"
- Past events shown with "Attended" label at reduced opacity
- Copy link button on the schedule management page

#### EVENTS-001: Past/Upcoming Split
- Events page divided into Upcoming (ascending date) and Past (descending)
- Count badges on each section header
- Past events displayed at 75% opacity

#### FORMS-001: Event-Specific Dynamic Forms
- Form fields change based on event service type
- Static templates for 8 built-in service types
- AI-generated schemas in DB take precedence over static templates
- Staff redirected to event selection if accessing `/clients/new` directly
- Admin can select event from dropdown, form updates dynamically

#### ADMIN-001: User Management
- `super_admin`: create users of any role, assign to any org
- `nonprofit_admin`: create staff users for their org
- Manage nonprofits (super_admin only): create, view, link to analytics
- All users list with role badges and org names

---

### 5.4 P2 — Not Yet Built (Post-Hackathon)

| Feature | Priority | Notes |
|---------|----------|-------|
| Audit Log | High | Who changed what and when |
| Document Storage | High | Attach files to client profiles |
| Full Calendar / Appointments | High | Biggest gap vs Apricot |
| HMIS Export | High | Required for government-funded orgs |
| Electronic Signatures | Medium | In-platform signing |
| Funder Report Templates | High | United Way, HUD, HMIS templates |
| SMS Messaging | Medium | Twilio integration |
| Network Referrals | Medium | Cross-org client referrals |
| HIPAA BAA | High (revenue) | Formal compliance certification |

---

## 6. Data Model

### 6.1 Tables

```
organizations     → id, name, type, email, address, created_at
profiles          → id, email, full_name, role, org_id, created_at
service_types     → id, name, created_at
form_schemas      → id, service_type_id, fields (jsonb), generated_by, created_at
events            → id, name, event_date, location, description, service_type_id, org_id, created_by
event_staff       → event_id, staff_id
clients           → id, full_name, dob, phone, email, location, demographics (jsonb), org_id, created_by
service_entries   → id, client_id, event_id, service_type_id, staff_id, org_id, date, notes, embedding (vector), created_at
client_event_registrations → id, client_id, event_id, registered_by, notes, created_at
follow_ups        → id, client_id, service_entry_id, due_date, note, done
```

### 6.2 Key Design Decisions

- **JSONB for demographics** — allows per-service-type fields without schema migrations
- **pgvector on service_entries** — semantic search without separate vector DB
- **org_id on every table** — multi-tenancy enforced at data layer
- **security definer functions** — avoid circular RLS deadlocks on profiles table
- **event_id on service_entries** — links interactions to the event context

### 6.3 Row-Level Security

All tables have RLS enabled. Key policies:

- `super_admin`: unrestricted via `auth_user_role()` security definer function
- `nonprofit_admin`: scoped to `org_id = auth_user_org()`
- `staff` on clients: `created_by = auth.uid()`
- `staff` on events: via `event_staff` join
- `public` on `client_event_registrations`: SELECT only (for schedule page)

---

## 7. API Reference

### 7.1 Next.js API Routes (CRUD → Supabase)

```
POST   /api/admin/create-user          Create auth user + profile
POST   /api/ai/extract-voice           Voice transcript → structured fields
POST   /api/ai/generate-form           Service type name → form fields JSON
POST   /api/ai/analytics-query         NL question → count/breakdown result
```

### 7.2 FastAPI AI Service

```
GET    /health                         Health check
POST   /ai/intake                      Image → Claude Vision → extracted JSON
POST   /ai/search                      Query → embeddings → pgvector results
POST   /ai/embed                       Service entry text → store embedding
```

---

## 8. Competitive Analysis

### Where CareVo wins

| Feature | Apricot | CareVo |
|---------|---------|--------|
| Photo-to-Intake AI | ❌ | ✅ Claude Vision |
| Voice Intake | ❌ | ✅ EN/ES/FR |
| Semantic Search | ❌ keyword only | ✅ pgvector NL |
| Ask Analytics | ⚠️ basic | ✅ full NL queries |
| AI Form Generation | ❌ | ✅ auto per service type |
| Client Journey Timeline | ❌ | ✅ visual timeline |
| Multilingual Forms | ❌ | ✅ 3 languages |
| Event-Based Workflow | ❌ | ✅ |
| Multi-Org Network | ❌ single org | ✅ hierarchy |
| Open Source | ❌ | ✅ MIT |
| Monthly Cost | $2,500–7,500 | $0–29 |

### Where Apricot wins (honest gaps)

| Feature | Status |
|---------|--------|
| Full scheduling/calendar | Not built |
| Document storage | Not built |
| Electronic signatures | Not built |
| Funder report templates | Not built |
| SMS messaging | Not built |
| HIPAA formal BAA | Not certified |

---

## 9. Setup Guide

### Prerequisites
- Node.js 18+, Python 3.11+
- Supabase account (free), Anthropic API key, OpenAI API key

### Quick Start

```bash
# Clone
git clone https://github.com/2026-ASU-WiCS-Opportunity-Hack/06-next-wave.git
cd 06-next-wave

# Frontend
cd frontend
cp .env.example .env.local   # fill in keys
npm install && npm run dev

# AI Service (new terminal)
cd ../ai-service
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
1. Enable `pgvector` extension: Database → Extensions → vector
2. Run `supabase/schema.sql` in SQL Editor
3. Run `supabase/seed.sql`
4. Run `node scripts/generate_forms.js` to generate AI form schemas
5. Create admin user in Authentication → Users
6. `UPDATE profiles SET role = 'super_admin' WHERE email = 'your@email.com'`

### Deploy
- **Frontend**: Connect GitHub to Vercel, set env vars, deploy
- **AI Service**: Render → New Web Service → root: `ai-service` → start: `uvicorn main:app --host 0.0.0.0 --port $PORT`

---

## 10. Cost Estimate

| Service | Free Tier | Paid |
|---------|-----------|------|
| Supabase | 500MB DB, 50K auth users | $25/mo (Pro) |
| Vercel | 100GB bandwidth | $20/mo (Pro) |
| Render | 750hrs/month | $7/mo |
| Claude Vision | ~$0.01–0.05/image | Pay per use |
| OpenAI Embeddings | ~$0.001/query | Pay per use |
| **Total (MVP)** | **$0/month** | **~$5–29/month** |

---

*CareVo — Built with ❤️ at Opportunity Hack 2026 · WiCS × OHack · ohack.dev*
