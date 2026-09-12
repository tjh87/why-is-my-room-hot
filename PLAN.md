# Why Is My Room So Hot? — 2-Hour Build Plan

**Goal:** A room-aware comfort agent helps tenants manage cooling in a simulated HDB apartment.  
**Stack:** React + Vite, Fastify, PostgreSQL, ClickHouse, OpenAI, Airwallex sandbox  
**Time budget:** 120 minutes  

---

## What judges see (prioritize this)

1. Person selects a room → agent reads conditions → explains why it's hot
2. Agent proposes a free action (blinds/fan) → backend applies it → agent checks the result
3. If still hot → agent proposes paid AC → person approves → AC runs with a visible cap
4. Session ends → invoice → Airwallex sandbox checkout → verified payment
5. Change room context mid-run → agent adapts its reasoning

**The demo story is: "The agent shows up where you live and actually helps."**

---

## Phase 1 — Foundation + Agent Loop (0:00–0:50)

This is the phase that makes or breaks the demo. Ship a working agent before touching payments.

### Database (10 min)

One PostgreSQL schema. Keep it minimal — you can always add columns.

```sql
-- Rooms: the simulated environment
CREATE TABLE rooms (
  id TEXT PRIMARY KEY,
  tenant_name TEXT NOT NULL,
  temperature REAL NOT NULL,
  target_temp REAL NOT NULL,
  sunlight TEXT DEFAULT 'high',     -- high/medium/low
  electronics TEXT DEFAULT 'on',    -- on/off
  blinds TEXT DEFAULT 'open',       -- open/closed
  fan TEXT DEFAULT 'off',           -- off/low/high
  ac_on BOOLEAN DEFAULT false,
  ac_started_at TIMESTAMPTZ,
  ac_max_minutes INTEGER,
  ac_max_cents INTEGER,
  budget_cents INTEGER NOT NULL,
  free_actions TEXT[] DEFAULT '{}', -- e.g. {'blinds','fan'}
  revision INTEGER DEFAULT 1,
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Agent steps: what the agent did and why
CREATE TABLE agent_steps (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  room_id TEXT REFERENCES rooms(id),
  trigger TEXT NOT NULL,           -- 'user_ask', 'temp_change', 'context_change'
  state_snapshot JSONB NOT NULL,   -- room state at decision time
  reasoning TEXT,                  -- agent's explanation
  action TEXT,                     -- 'close_blinds', 'set_fan', 'offer_ac', 'none'
  action_params JSONB,
  outcome TEXT,                    -- 'applied', 'rejected', 'awaiting_approval'
  result_check TEXT,               -- what happened after
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Invoices: one per completed AC session
CREATE TABLE invoices (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  room_id TEXT REFERENCES rooms(id),
  ac_seconds INTEGER NOT NULL,
  rate_cents_per_hour INTEGER NOT NULL DEFAULT 120,
  amount_cents INTEGER NOT NULL,
  status TEXT DEFAULT 'draft',     -- draft/open/paid/void
  provider_id TEXT,                -- Airwallex resource ID
  payment_evidence JSONB,
  created_at TIMESTAMPTZ DEFAULT now()
);
```

Seed four rooms:

| Room | Tenant | Temp | Target | Budget | Free actions | Scenario |
|------|--------|------|--------|--------|-------------|----------|
| alice | Alice | 31.2°C | 26.0°C | S$3.00 | blinds, fan | Needs AC after free actions |
| bob | Bob | 28.4°C | 28.0°C | S$1.50 | fan | Fan alone succeeds |
| chen | Chen | 30.0°C | 25.5°C | S$2.40 | blinds, fan | Standard AC session |
| dana | Dana | 29.5°C | 26.5°C | S$0.60 | blinds | Cap triggers early stop |

### API + Agent (30 min)

**This is the highest-value code in the project.** Build these routes:

```
GET  /api/rooms                    → all rooms
GET  /api/rooms/:id                → room + recent agent steps
POST /api/rooms/:id/ask            → trigger the agent
POST /api/rooms/:id/action         → apply a free action (blinds/fan)
POST /api/rooms/:id/approve-ac     → human approves AC offer
POST /api/rooms/:id/stop-ac        → human stops AC
POST /api/rooms/:id/update-prefs   → change target/budget/permissions
GET  /api/rooms/:id/steps          → agent decision history
POST /api/invoices                 → create invoice from completed AC session
POST /api/invoices/:id/checkout    → Airwallex checkout (Phase 3)
POST /api/webhooks/airwallex       → webhook receiver (Phase 3)
GET  /api/health                   → liveness
```

**The agent endpoint (`POST /api/rooms/:id/ask`) is the core:**

```typescript
// Pseudocode — the agent's decision loop
async function agentDecide(room: Room, userMessage?: string) {
  const state = await getRoom(room.id);
  const history = await getRecentSteps(room.id, 5);
  
  const response = await openai.chat.completions.create({
    model: process.env.OPENAI_MODEL || "gpt-4o",
    messages: [
      { role: "system", content: SYSTEM_PROMPT },
      { role: "user", content: buildContext(state, history, userMessage) }
    ],
    tools: AGENT_TOOLS,        // read_state, set_blinds, set_fan, request_ac_offer
    tool_choice: "auto",
  });

  // Process tool calls → validate permissions → apply → record step
  // Return the step to the UI
}
```

**System prompt essence:**
> You are a room comfort agent in a simulated HDB apartment. You help tenants stay comfortable within their budget. You can read room conditions, close blinds, adjust fans, and propose AC cooling. Free actions need explicit permission. Paid AC needs human approval — you propose an offer, you never approve it yourself. After acting, check if conditions improved. Be honest about what you observe vs. what you assume.

**Agent tools (OpenAI function calling):**

| Tool | What it does | Permission check |
|------|-------------|-----------------|
| `read_room_state` | Returns current temp, settings, comfort gap | Always allowed |
| `set_blinds` | Close/open blinds (reduces sunlight heat) | Must be in `free_actions` |
| `set_fan` | Set fan off/low/high (improves comfort score) | Must be in `free_actions` |
| `request_ac_offer` | Propose AC with rate, max duration, max charge | Always allowed to propose; human approves |

**Backend validates every tool call** — the agent proposes, the backend checks permissions and applies.

### Simulation (10 min)

Keep it dead simple. A single function that runs when actions are applied:

```typescript
function simulateTemp(room: Room, elapsedSeconds: number): number {
  let delta = 0;
  delta += (room.sunlight === 'high' ? 0.3 : room.sunlight === 'medium' ? 0.15 : 0) 
           * (elapsedSeconds / 60);
  delta += (room.electronics === 'on' ? 0.1 : 0) * (elapsedSeconds / 60);
  if (room.blinds === 'closed') delta -= 0.2 * (elapsedSeconds / 60);
  if (room.ac_on) delta -= 1.5 * (elapsedSeconds / 60);
  return room.temperature + delta;
}
```

Run on a **10-second real interval at 60x speed** (= 10 simulated minutes per tick).  
Store temp updates in the rooms table. That's it for Phase 1.

**Billing math (integer cents, do once):**
```typescript
function calcCharge(acSeconds: number, rateCentsPerHour: number): number {
  return Math.floor((acSeconds * rateCentsPerHour + 1800) / 3600);
}
// 24 min → 48¢, 30 min → 60¢, 60 min → 120¢
```

---

## Phase 2 — UI + ClickHouse (0:50–1:25)

### Apartment UI (25 min)

One page. No routing needed.

```
+------------------------------------------------------------------+
| WHY IS MY ROOM SO HOT?           AIRWALLEX SANDBOX · TEST ONLY   |
+------------------------------------------------------------------+
| 🏠 Four rooms (click to select)        | Selected Room Panel     |
|                                         |                         |
| [Alice 31.2°] [Bob 28.4°]              | Tenant: Alice           |
| [Chen 30.0°]  [Dana 29.5°]             | Temp: 31.2° → 26.0°    |
|                                         | Budget: S$3.00 left     |
| Warm background, colored borders,      | Blinds: open  Fan: off  |
| simple room cards with emoji/icons     | AC: off                 |
|                                         |                         |
|                                         | [Free actions: ✅blinds ✅fan] |
|                                         | [Ask Agent] [Stop AC]   |
|                                         |                         |
|                                         | --- Agent Panel ---     |
|                                         | Noticed: ...            |
|                                         | Action: ...             |
|                                         | Result: ...             |
|                                         | [Approve AC offer]      |
+------------------------------------------------------------------+
| Agent step history / Evidence trail     | Invoice + payment status|
+------------------------------------------------------------------+
```

Key UI rules:
- Cards for each room with live temperature and tenant name
- Selected room opens the right panel with controls
- Agent panel shows reasoning, proposed action, and outcome — **populated from `agent_steps` table, not hardcoded**
- AC approval is a separate explicit button showing rate + cap
- Stop AC is always visible when AC is running
- SSE or polling for live updates (polling is fine for a hackathon)

Use **Tailwind** for speed. Warm amber/orange palette. Dark text on light backgrounds.

### ClickHouse (10 min)

Minimal viable integration. One table, one insert path, one query.

```sql
CREATE TABLE apartment_events (
  event_id UUID,
  room_id String,
  event_type LowCardinality(String),
  temperature Nullable(Float64),
  action Nullable(String),
  amount_cents Nullable(Int64),
  payload String,
  occurred_at DateTime64(3, 'UTC')
) ENGINE = MergeTree()
ORDER BY (room_id, occurred_at);
```

- Insert room samples and agent actions from the API (direct insert, skip the outbox for 2 hours)
- One analytics query the agent uses: **recent room history**

```sql
SELECT event_type, temperature, action, occurred_at
FROM apartment_events
WHERE room_id = {room_id:String}
ORDER BY occurred_at DESC
LIMIT 20
```

- Wire `read_room_history` as an agent tool that calls this query
- Show a small temperature chart in the UI (use `<canvas>` or a lightweight chart lib)

**That's enough to prove ClickHouse is powering agent decisions, not just a dashboard.**

---

## Phase 3 — Airwallex Sandbox Payment (1:25–1:50)

Pick **one route only**. Native invoice if available, otherwise PaymentIntent.

### The flow

```
AC session ends → calc charge → create local invoice
  → create Airwallex resource (invoice or PaymentIntent)
  → return checkout URL → user pays in sandbox
  → webhook confirms → update invoice → show ✅
```

### Implementation (25 min)

1. **Auth:** `POST /api/v1/authentication/login` with client_id + API key → bearer token (cache it)
2. **Create resource:** Use the frozen amount_cents and SGD
3. **Checkout:** Redirect to hosted checkout (no card fields in your app)
4. **Webhook:** Receive `POST /api/webhooks/airwallex`, verify HMAC-SHA256 signature, update invoice status
5. **UI:** Show invoice amount, payment status, and "SANDBOX · TEST PAYMENT" label

**Skip for now:** reconciliation jobs, operation retry queues, dual-route support, complex state machines. Handle the happy path and one rejection test card.

---

## Phase 4 — Polish + Demo Prep (1:50–2:00)

### 10 minutes, spend them wisely:

- [ ] Run through the full demo flow once: select room → ask agent → free action → AC offer → approve → checkout → paid
- [ ] Run Bob's room: fan-only success, no payment needed
- [ ] Change a room's sunlight mid-session → agent adapts
- [ ] Screenshot the evidence trail
- [ ] Make sure "SANDBOX" and "SIMULATED" labels are visible
- [ ] Write 5 sentences in `docs/JUDGING_EVIDENCE.md`:
  - Core: "Live agent reads room state, acts, checks results, triggers sandbox payment"
  - Innovation: "Room context shapes agent decisions — same question, different room, different answer"  
  - Technical: "ClickHouse history informs agent, Airwallex sandbox completes payment"
  - Usefulness: "Human sets goals and budget, approves paid cooling, can stop anytime"

---

## What's cut (and why it's fine)

| Cut | Why it's fine |
|-----|--------------|
| Outbox/worker pattern | Direct inserts + webhook receiver. Hackathon, not production. |
| 17 database tables → 3 | Rooms, agent_steps, invoices cover the demo |
| 25+ event types → ~5 | room.sampled, agent.action, ac.started, ac.stopped, payment.confirmed |
| Dual payment routes | Pick one. Ship it. |
| Webhook reconciliation jobs | Handle the happy path + one failure |
| Compare-and-set concurrency | Single user demo. No real concurrency. |
| NPC automation | Person drives the demo manually |
| Simulation speed controls | Fixed 60x. Add 1x/pause if time remains. |
| 40+ acceptance tests | Test the demo flow manually. Add one billing math unit test. |
| Separate web/api/worker processes | One Fastify server serves both API and static files |
| Operation retry queues | One attempt. Show error if it fails. |
| Evidence report with 15 docs | One `JUDGING_EVIDENCE.md` with 4 paragraphs |

---

## File structure

```
apps/
  api/
    index.ts            ← Fastify server + all routes
    agent.ts            ← OpenAI agent logic + tools
    simulation.ts       ← Temperature model + tick loop
    airwallex.ts        ← Sandbox auth + invoice/payment
    clickhouse.ts       ← Insert + query
    db.ts               ← PostgreSQL connection + queries
  web/
    src/
      App.tsx           ← Single page app
      Apartment.tsx     ← Four room cards
      RoomPanel.tsx     ← Selected room + agent panel
      AgentPanel.tsx    ← Reasoning + actions + approval
      InvoicePanel.tsx  ← Billing + checkout
      TempChart.tsx     ← ClickHouse-powered history
db/
  init.sql              ← Schema + seed data
compose.yaml            ← PostgreSQL + ClickHouse
.env.example
PLAN.md
docs/
  JUDGING_EVIDENCE.md
```

---

## Environment

```dotenv
DATABASE_URL=postgresql://localhost:5432/hotroom
CLICKHOUSE_URL=http://localhost:8123
CLICKHOUSE_DATABASE=hotroom
OPENAI_API_KEY=
OPENAI_MODEL=gpt-4o
AIRWALLEX_API_BASE=https://api.sandbox.airwallex.com/api/v1
AIRWALLEX_CLIENT_ID=
AIRWALLEX_API_KEY=
AIRWALLEX_WEBHOOK_SECRET=
CURRENCY=SGD
RATE_CENTS_PER_HOUR=120
SIM_SPEED=60
```

---

## Demo script (what you show judges)

> **"My room is 31 degrees. I ask the agent why. It reads the room — sunlight and my computer are adding heat. It closes my blinds because I allowed that. Ten seconds later it checks: still too warm. It offers me AC at $1.20/hour, capped at my budget. I approve. AC runs, temp drops, session ends. I check out through Airwallex sandbox. Done — from context to comfort to payment, the agent handled it because it was in the room."**
>
> Then show Bob's room: fan is enough. No payment. That's a success too.
> Then change Alice's sunlight setting: agent re-evaluates. Context matters.

**Total demo: 3 minutes. That's all you need.**
