# Codex build prompts for Claude's PLAN.md

**Project:** Why Is My Room So Hot?  
**Source:** The uploaded `PLAN.md`, titled "2-Hour Build Plan"  
**Prepared:** 12 September 2026  
**Payment scope:** Airwallex sandbox only  
**Status:** Build instructions. No application implementation or integration test is claimed.

## Start here

Place `PLAN.md` and `CODEX_BUILD_PROMPTS.md` in the repository root.

Paste the **Build-all prompt** into Codex to request the complete build.
For separate stages, paste **Prompts 1 to 4** in order instead.
Each prompt reads these files. You do not need to combine prompt blocks.

Keep Claude's `PLAN.md` unchanged. This pack follows its four phases and reduced scope.
The source's 120-minute budget is a planning target, not a verified completion estimate.

## 1. Source scope to preserve

The following requirements come from `PLAN.md`.

| Phase | Required result |
|---|---|
| 1. Foundation + Agent Loop | A live agent reads room state, performs permitted free actions, and checks results. |
| 2. UI + ClickHouse | Four room cards, human controls, and ClickHouse history that informs the agent. |
| 3. Airwallex Sandbox Payment | One billing route, hosted test checkout, and verified payment status. |
| 4. Polish + Demo Prep | A tested demonstration, evidence screenshots, and a short judging report. |

Keep React, Vite, Fastify, PostgreSQL, ClickHouse, OpenAI, and Airwallex sandbox.
Use Tailwind, a warm amber/orange palette, and dark text on light surfaces.
Keep one page and one Fastify application process. Fastify serves the built frontend and API.
A Vite development server is acceptable during development.

Keep the three application tables: `rooms`, `agent_steps`, and `invoices`.
Use direct ClickHouse inserts. Do not restore the earlier outbox and worker design.
Select one payment route before creating a payable resource.
Keep people in control. Do not add autonomous NPC purchasing.

Do not add subscriptions, production payments, real sensors, device control, or validated thermal modelling.
Do not add distributed orchestration, a full authentication product, extensive reports, or another frontend.

### Seed data

Preserve these source values. Do not seed successful payments.

| Room | Tenant | Initial temperature | Target | Test budget | Permitted free actions |
|---|---|---:|---:|---:|---|
| alice | Alice | 31.2°C | 26.0°C | S$3.00 | blinds, fan |
| bob | Bob | 28.4°C | 28.0°C | S$1.50 | fan |
| chen | Chen | 30.0°C | 25.5°C | S$2.40 | blinds, fan |
| dana | Dana | 29.5°C | 26.5°C | S$0.60 | blinds |

Keep the example rate at 120 cents per simulated AC hour.
Keep simulation speed at 60x. Do not add speed controls before the core workflow works.

## 2. Explicit build clarifications

**These are proposed implementation safeguards, not claims about what Claude already specified.**
The prompts apply them openly. Record their implementation in `docs/JUDGING_EVIDENCE.md`.
Keep the original product scope and three-table structure.

### C1. Correct the sample simulation without claiming real physics

The source advances ten simulated minutes during each ten-second real tick.
For high sunlight, electronics on, open blinds, and AC on, its formula gives:

```text
Temperature change = (0.3 + 0.1 - 1.5) * 10 = -11°C
```

Thus, Alice's 31.2°C becomes 20.2°C after one tick under those settings.
The sample also subtracts heat for closed blinds without tying that subtraction to available sunlight.
It leaves fan comfort effects unspecified.

Proposed correction: use bounded, configurable demonstration coefficients and small internal simulation steps.
Closed blinds reduce the sunlight term. A fan changes a labelled comfort score, not measured air temperature.
Choose remaining seed settings explicitly so Bob's fan-only scenario can pass through calculated results.
Do not hardcode success based on the tenant's name.

Keep the source's 60x speed and ten-second update cadence.
Use one backend simulation clock and one shared time-advance helper.
The timer and action handlers must track the same last-accounted time for each room.
Settle elapsed time once under the old device state before an action changes that state.
Browser polling must never advance simulated time.
Stop billable time exactly at the approved cap, duration, or manual stop.
Use real UTC timestamps for external APIs and webhook checks.

### C2. Preserve sessions within the three tables

The source promises one invoice per completed session but has no durable session ID or elapsed counter.
Add small fields to existing tables rather than restoring a separate session service.

Proposed additions:

| Table | Minimum purpose of added fields |
|---|---|
| `rooms` | Pending offer, active session ID, frozen session terms, and committed simulated AC duration. |
| `agent_steps` | Tool result, evidence references, and pending/completed result-check status where needed. |
| `invoices` | Unique session ID, frozen consent/session summary, provider request identity, and payment progress. |

JSONB can hold related details. Use normal columns and a unique constraint for session identity.
Create the local invoice draft when stopping the session, within the same PostgreSQL transaction.
Repeated stop or invoice requests must return the same record.
Do not reconstruct charges from ClickHouse samples, the browser clock, or AI text.

### C3. Retain small consent and duplicate guards

The source cuts a full concurrency design. It does not justify accepting duplicated or obsolete approvals.

Use short database transactions and a per-room mutation guard in the single server.
Recheck current permissions before free actions. Recheck the saved offer before AC approval.
Keep provider and model calls outside database transactions and simulation locks.

Save rate, maximum duration, maximum charge, and human acceptance with the session.
Treat `budget_cents` as the remaining test allowance. Reserve the active cap in the displayed available amount.
Deduct the final charge once at session completion. Payment confirmation must not deduct it again.
Reject conflicting budget changes during an active reservation.

These are local safeguards, not a distributed concurrency system.

### C4. Implement the missing result-check step

The source shows one model request and comments describing the remaining tool loop.
The implementation must execute tools and return their results to the model. See E2.

After an intervention, mark the result as pending.
After a later committed simulation update, reread the room and request the model's result check.
Use a bounded in-process follow-up, not a new worker service.
Cancel stale follow-ups when room permissions, context, or the active interaction changes.

Store a short public explanation in `reasoning`. Do not request or store hidden chain-of-thought.

### C5. State the ClickHouse tradeoff

Retain direct inserts and the source's `MergeTree` table.
This design has no durable event-delivery queue. Failed writes can leave gaps.
Show unavailable or incomplete history rather than claiming complete audit coverage.

Keep event IDs stable. Return unique events by ID in the room-history query.
Do not add `FINAL` or the older plan's `ReplacingMergeTree` design to this table.
Keep current room state and all charge calculations authoritative in PostgreSQL.

### C6. Keep sandbox payments safe without restoring queues

Retain one route, no automatic retry queue, and no scheduled reconciliation job.
Persist a stable provider request identity before creation.
An ambiguous timeout must show `UNKNOWN`, not `PAID` or definite failure.
Do not create another payable resource while the first result remains unknown.

Verify webhook signatures and relevant account, resource, currency, and amount fields.
Make repeated notifications harmless. Never turn a confirmed payment into failure because an older event arrives.
A checkout return page alone cannot prove payment.

Use one creation attempt per unresolved operation. Document manual provider inspection for unresolved results.
This is a deliberate limitation, not automatic recovery support.

### C7. Treat API snippets as examples

Check the official sources in section 8 before implementing API payloads.
Do not silently change the source's stack or selected model.
Use `OPENAI_MODEL`; report unavailable model access instead of guessing another model.

The source's `return checkout URL` is a flow description, not a guaranteed PaymentIntent response field.
Use the selected integration's actual checkout contract. See E3 and E4.

### C8. Add only the checks needed to protect the demonstration

Keep the source's manual demo tests.
Add compact automated checks for billing, cap boundaries, duplicate creation, permissions, and forged payment results.
Do not rebuild the earlier extensive test programme or documentation set.

## 3. Build-all prompt

Paste this block into Codex when both Markdown files are in the repository.

```text
Read PLAN.md and CODEX_BUILD_PROMPTS.md in full.
Implement the application, not another plan.

Use Claude's four-phase scope in PLAN.md.
Apply only the explicit clarifications in section 2 of CODEX_BUILD_PROMPTS.md.
Do not restore features from older HOT_ROOM_CODEX plan files.
Keep PLAN.md unchanged.

Inspect existing code, repository instructions, dependencies, and uncommitted changes.
Preserve working code and user changes. Do not create a duplicate application.
Keep the source stack unless the existing repository requires a documented, minimal adjustment.

Execute Prompts 1, 2, 3, and 4 from CODEX_BUILD_PROMPTS.md in order.
In this build-all mode, continue between phases without asking for routine confirmation.
Respect tool permissions and any required approvals for external actions.

Prioritize the live room agent before payment implementation and visual polish.
Keep one server, three application tables, direct ClickHouse inserts, and one sandbox payment route.
Do not add production payments, queues, worker services, subscriptions, or autonomous NPC purchases.

Use available credentials only through secure configuration.
Do not print secrets or ask me to paste them into source code.
When access is missing, continue independent work and mark external checks BLOCKED.
Never substitute fake integration success.

After each phase, update docs/JUDGING_EVIDENCE.md with actual progress and tests.
Do not stop with a plan or an untested code dump.
If execution is interrupted, leave an exact checkpoint for the next Codex session.
Do not claim that all phases finished unless the evidence supports that claim.

Finish with changed files, checks, blockers, setup commands, and the next incomplete phase.
Do not publish, push, or deploy without separate permission.
Report subagent count only if subagents were used.
```

## 4. Prompt 1: Foundation + Agent Loop

**Source phase:** Phase 1. Build the live agent before payment implementation.

```text
Read PLAN.md and CODEX_BUILD_PROMPTS.md in full.
Implement Phase 1 of PLAN.md with clarifications C1, C2, C3, C4, C7, and C8.
Inspect existing instructions, code, dependencies, and user changes before editing.
Read docs/JUDGING_EVIDENCE.md if it already exists.
Do not replace working code or restore the older large architecture.
Keep PLAN.md unchanged.

FOUNDATION
Use the source's React/Vite frontend and Fastify backend.
Keep one application server. Serve the built frontend from Fastify.
Use the existing package manager and lockfile, or npm for an empty repository.
Create development, build, start, typecheck, and test commands that actually run.
Create a short AGENTS.md referencing these two specifications while preserving existing repository instructions.

Create compose.yaml for PostgreSQL and ClickHouse with durable local volumes.
Keep database access local by default.
Create .env.example without real credentials.
Add documented database setup and non-destructive seed commands.
Use the three source tables and their specified fields.
Add only the small persistence fields and constraints described in C2 and C3.
Do not add a worker, outbox, Redis, or a separate agent framework.

Seed Alice, Bob, Chen, and Dana with the source values.
Document remaining sunlight and electronics settings as demonstration assumptions.
Do not seed paid invoices or successful provider references.

ROOM API AND SIMULATION
Implement the room, action, approval, stop, preferences, steps, invoice, and health routes listed in PLAN.md.
Leave provider checkout and webhook implementation for Phase 3.
Support sunlight and electronics changes through a documented demo-only extension to update-prefs.
Validate input types, enum values, room identity, and permission settings.

Implement one simulation loop at 60x with ten-second updates.
Share time accounting between the timer and state-changing routes.
Settle elapsed usage once before changing AC state, including manual stops between ticks.
Apply C1. Do not copy the unstable thermal coefficients unchanged.
Use small internal steps and explicit demonstration bounds.
Calculate fan comfort separately from room air temperature.
Do not bill browser polling, duplicate requests, or server downtime.
Persist committed AC duration. On restart, stop incomplete sessions at their last committed duration.
Create the corresponding frozen draft invoice without inventing missing usage.
Do not catch up downtime or resume AC automatically after a crash.

Store each proposed offer on the server with its ID and terms.
Approval must reference that offer, not client-supplied prices or usage.
Require explicit human approval for paid AC.
Reject obsolete offers and unauthorized actions.
Permit one active session per room and keep Stop AC functional without the model.

Trim usage before the accepted duration or spending cap is exceeded.
Calculate the whole session charge once using the source's integer formula.
Freeze the charge and consent summary in one unique invoice per session.
Deduct the final charge once. Do not deduct again on payment.
Skip payment for zero-cent sessions.

LIVE AGENT
Use server-side OpenAI function calling with OPENAI_MODEL.
Complete the tool-call loop rather than returning after the first model response.
Use strict schemas supported by the chosen model and current SDK.
Implement read_room_state, set_blinds, set_fan, and request_ac_offer.
Validate every tool call against current state and permissions.
Return actual tool results to the model before the final public explanation.
Never let the model approve AC, set prices, calculate invoices, write SQL, or mark payment successful.

Send room state and recent agent_steps as context.
Keep ClickHouse history integration for Phase 2. Do not claim it works yet.
Treat tenant messages and stored text as data, not application instructions.
Use short public reasons, tool results, and evidence references in agent_steps.

After a free action, schedule one result check after a later committed simulation update.
Read fresh state and let the model explain the recorded simulation outcome.
Keep pending, completed, rejected, and failed checks visible.
Do not invent an improvement before another sample exists.
Avoid endless model calls. Limit tool rounds and allow one active agent task per room.
Cancel obsolete follow-ups after a context or permission change.

BASIC UI AND CHECKS
Create enough React UI to select a room, ask the agent, approve an offer, and stop AC.
Show SIMULATED and AIRWALLEX SANDBOX labels.
Show missing model configuration honestly. Fixtures must say TEST FIXTURE, not LIVE AGENT.
Keep paid actions unavailable until approval succeeds.

Test 24 minutes = 48 cents, 30 minutes = 60 cents, and 60 minutes = 120 cents.
Test a cap crossed inside a large tick and a repeated stop or invoice request.
Test a manual stop between ticks. Charge elapsed usage once without adding a full extra tick.
Test a revoked free-action permission and a repeated AC approval.
Test that room temperature remains within the documented demonstration bounds.
Run one live free-action and result-check flow when model access exists.
Mark that live test BLOCKED if access is missing.

Run the available build, typecheck, and tests. Fix failures from this phase.
Add actual results and C1-C4 implementation choices to docs/JUDGING_EVIDENCE.md.
Record setup commands, blockers, and the next phase.
Stop here when running this prompt alone. In build-all mode, continue to Prompt 2.
```

## 5. Prompt 2: UI + ClickHouse

**Source phase:** Phase 2. History must inform the agent, not only the chart.

```text
Read PLAN.md, CODEX_BUILD_PROMPTS.md, and the current docs/JUDGING_EVIDENCE.md.
Implement Phase 2 with clarification C5.
Inspect the existing Phase 1 code and preserve working behaviour.
Keep one page, one server, and three application tables.

CLICKHOUSE
Use the apartment_events schema and MergeTree engine in PLAN.md.
Use the official server-side ClickHouse JavaScript client.
Create one direct event-insert function and a parameterized room-history query.
Verify current client usage against E7.
Recheck current permissions before executing every tool, including history reads for the selected room.

Record room.sampled, agent.action, ac.started, and ac.stopped events.
Add payment.confirmed emission in Phase 3, not a fabricated event now.
Put relevant session IDs, before/after values, and evidence references in the existing payload field.
Include event IDs in query results so the agent can cite actual records.
Keep timestamps in UTC and distinguish them from simulated duration.

Write to ClickHouse only after the PostgreSQL state change commits.
Keep insertion outside room locks. Use a bounded timeout and explicit error handling.
Batch the rooms from one simulation tick where practical.
Do not add a durable outbox, retry queue, or delivery worker.
A failed analytics insert must not undo an accepted action or create extra usage.

Use the source's recent-history query as the starting point.
Return no more than 20 unique events for the selected room.
Deduplicate identical event IDs before the final limit.
Do not use FINAL with the source's MergeTree table.
Do not calculate invoice amounts or balances from these events.

Add read_room_history as an agent tool.
Return the source, room, query time, sample times, and explicit unavailable status when applicable.
Show empty history as empty, not as a successful prior intervention.
Make the standard diagnosis use current state and available room history.
Include intervention settings when interpreting earlier temperature changes.
Do not infer proven causality from a few simulated samples.
Record the query evidence and the model's short explanation in agent_steps.

Use the same query function for a small history endpoint and TempChart.
Add that supporting route to README without adding a separate analytics product.
A ClickHouse failure must show unavailable or incomplete history.
Do not relabel PostgreSQL data or fixtures as ClickHouse results.

SINGLE-PAGE UI
Follow the room-card layout in PLAN.md, not the older elaborate mockup.
Use Tailwind, warm amber/orange surfaces, readable dark text, and compact spacing.
Place four selectable room cards on the left and RoomPanel on the right.
Show tenant, temperature, target, budget, permissions, fan, blinds, and AC state.
Show current simulated duration, accrued test charge, and accepted spending cap during AC.

Implement Ask Agent, permitted free actions, preference updates, and visible Stop AC.
Show an explicit Approve AC button with the saved rate, duration, and maximum charge.
Never let an Offer AC button also approve the offer.
Keep sunlight and electronics controls clearly labelled as simulated context controls.
Re-evaluate context after those settings change, with bounded model calls.

Populate AgentPanel from agent_steps rather than hardcoded dialogue.
Show Noticed, Action, Permission, and Result.
Show pending checks until a later sample supports the outcome.
Show the history evidence used in the selected step.

Use polling or SSE without changing the simulation clock.
Keep the selected room stable through refreshes and recover after reconnects.
Render the temperature chart with canvas and provide a readable data view.
Keep text selectable. Avoid SVG diagrams and pictures, following the standing project preference.
Do not require generated artwork or a new design system.

CHECKS
Insert real events, query them, and show a live agent turn using read_room_history.
Capture event IDs and sanitized query evidence only when those calls occurred.
Test empty history, duplicate event IDs, and a ClickHouse outage.
Show the outage honestly while preserving room controls and PostgreSQL state.

Test Bob's fan-only case through the comfort calculation, not a tenant-name shortcut.
Test different room contexts producing context-aware explanations.
Test a permission change before a pending action executes.
Check the layout at 1440x900 and 1280x800.
Inspect clipping, unreadable labels, excess space, and controls hidden by content.

Run build, typecheck, and available tests. Fix phase-specific failures.
Update docs/JUDGING_EVIDENCE.md with actual results and the direct-insert limitation.
Stop here when running this prompt alone. In build-all mode, continue to Prompt 3.
```

## 6. Prompt 3: Airwallex Sandbox Payment

**Source phase:** Phase 3. Implement one route, not both.

```text
Read PLAN.md, CODEX_BUILD_PROMPTS.md, and docs/JUDGING_EVIDENCE.md.
Implement Phase 3 with clarifications C2, C3, C6, and C7.
Keep the existing session and invoice records authoritative.
Do not implement production payments or a local fake-success path.

PREFLIGHT AND ROUTE SELECTION
Read the relevant official Airwallex sources in section 8.
Inspect secure configuration without displaying credential values.
Check authentication, payment-method activation, SGD, and the intended test amount.
Do not report readiness merely because environment variables exist.

Select native invoicing only when its required account capabilities and setup are confirmed.
Otherwise select an app invoice plus sandbox PaymentIntent before creating provider resources.
Implement only the selected route.
Record the route and reason in docs/JUDGING_EVIDENCE.md.
Missing credentials block external checks, not unrelated implementation work.
Do not spend this phase building both alternatives.

SANDBOX SERVER ADAPTER
Allow only https://api.sandbox.airwallex.com/api/v1 as the Airwallex API base.
Reject production configuration and credential-bearing redirects.
Keep all API credentials and access tokens on the server.
The base already contains /api/v1. Do not append that segment twice.

Authenticate using the documented x-client-id and x-api-key headers.
Cache the access token using its returned expiry. See E3.
Add safe errors and request timeouts without a retry queue.
Use only fictional tenant details and approved sandbox payment methods.

LOCAL INVOICE AND PROVIDER CREATION
Load the frozen local invoice by its unique session ID.
Reject requests to change the amount, rate, currency, or session duration from the browser.
Save provider request identity and creation progress before the outbound request.
Prevent duplicate checkout clicks from issuing another create request.
Do not hold a database transaction open during provider calls.

For PaymentIntent, follow E4 and preserve its stable request ID.
Send 120 local cents as 1.20 SGD in the provider amount field.
Use the local invoice reference for merchant_order_id.
Store the provider ID and label this route App invoice / Airwallex sandbox payment.
Use Airwallex.js hosted checkout with env set to demo. See E3.
Return only the checkout data that this integration actually requires.
Do not invent a checkout_url field or expose an API access token.
Keep checkout client secrets out of logs, history, and general room responses.

For native invoices, follow E5 instead of implementing PaymentIntent as a second route.
Create the required customer and product references without repeated setup on page loads.
Create the draft, add the charge, check its total, and finalize it.
Use CHARGE_ON_CHECKOUT with the required linked payment account.
Use the native invoice's supported checkout link.
Persist each creation stage in the existing invoice record.
Do not create another payable resource after an uncertain response.

Stop on unexpected fees, tax, currency, or amount differences.
Do not increase a small charge to satisfy a provider minimum.
Show a zero-cent session as No payment required and skip provider creation.
Show unresolved creation as UNKNOWN and preserve the saved request identity.
Do not automatically switch routes or create a fresh request after a timeout.
Document manual provider inspection for that limited recovery case.

WEBHOOK VERIFICATION
Implement POST /api/webhooks/airwallex without losing the original request bytes.
Use the configured webhook secret, not a secret supplied in the request.
Verify HMAC-SHA256 over x-timestamp followed by the unchanged body. See E6.
Use a safe constant-time comparison and a documented real-time timestamp tolerance.
Validate body size and the expected account or organization mapping.

Use documented event names for the selected route. See E8.
Match the provider resource, local invoice, currency, and amount before confirming payment.
Store sanitized evidence and processed event IDs in the existing invoice record.
Use a short transaction to make duplicate delivery harmless.
Persist a valid mapped outcome before acknowledging success.
Return a failure response when that required database write fails.
Acknowledge valid irrelevant notifications without modifying invoices.

A failed payment attempt leaves the invoice unpaid and available for a permitted retry.
An older failure event must not reverse confirmed success.
For native invoices, check payment evidence rather than assuming every paid status means cash collection.
Do not count credits or administrative adjustments as a successful test payment.

Never mark payment successful from a redirect, browser parameter, or model output.
Show Verifying sandbox payment until valid evidence exists.
Emit payment.confirmed to ClickHouse only after the verified PostgreSQL transition.
A repeated notification must not deduct budget or repeat the state change.
Keep direct-insert failures visible without reversing payment.

CHECKOUT UI AND CHECKS
Implement InvoicePanel and the hosted-checkout return state on the existing page.
Show amount, session duration, cap, provider reference, and verification result.
Keep SANDBOX / TEST PAYMENT and SIMULATED labels visible in the app.
Document the HTTPS callback and return-origin configuration required for this route.
Expose only necessary public endpoints or protect the presenter app before tunnelling it.
Do not add a full account-management product.

Test amount conversion, duplicate checkout, ambiguous timeout, invalid signature, and duplicate notification.
Test that a checkout return alone leaves the invoice unpaid.
Use a new test case for one successful sandbox payment and one documented rejection.
Use provider test cards only inside the hosted sandbox checkout.
Do not log card details or ask for a real card.

If human checkout cannot run here, mark that end-to-end check BLOCKED.
A fixture signature test is not proof of an Airwallex-delivered webhook.
Do not add scheduled reconciliation, retry queues, or a second billing adapter.

Run available checks and fix failures.
Update docs/JUDGING_EVIDENCE.md and README with the selected route, setup, evidence, and blockers.
Stop here when running this prompt alone. In build-all mode, continue to Prompt 4.
```

## 7. Prompt 4: Polish + Demo Prep

**Source phase:** Phase 4. Test what judges will see and report only verified results.

```text
Read PLAN.md, CODEX_BUILD_PROMPTS.md, and docs/JUDGING_EVIDENCE.md.
Complete Phase 4. Review existing code rather than starting another build.
Do not expand the product scope.

RUN THE SOURCE DEMONSTRATION
Open the actual application when the environment supports it.
Select Alice's room and ask why it is hot.
Show current state and a real ClickHouse history read used by the live agent.
Allow a permitted free action and wait for the actual result-check sample.
Show the agent's grounded result, not a scripted success message.

When appropriate, show a saved AC offer with rate, duration, and cap.
Approve it as the human user.
Show AC state, simulated elapsed duration, and the spending boundary.
Stop or complete the session and show its frozen local invoice.
Complete hosted sandbox checkout when access and human interaction permit it.
Show paid status only after verified provider evidence.
Do not seed or manually edit paid status to complete the story.

Run Bob's fan-only scenario. Confirm no AC session or payable invoice is needed.
Run Dana's cap scenario. Confirm the charge never exceeds 60 cents at the source rate.
Change sunlight and show the live agent use the changed context.
Do not guarantee a different action when the evidence still supports the original action.
Show the updated explanation and evidence instead.

ESSENTIAL FAILURE CHECKS
Repeat an approval, stop request, and invoice request. Confirm no duplicate session or invoice.
Revoke a free-action permission before execution and confirm rejection.
Stop AC while the model or ClickHouse is unavailable.
Confirm the Stop AC path does not depend on either service.
Test a forged payment notification and a return-page success parameter.
Confirm neither can mark an invoice paid.
Confirm a rejected payment leaves the charge unpaid.
Confirm a production Airwallex URL is rejected.

VISUAL CHECKS
Check all visible controls, loading states, pending results, and error messages.
Use the source's compact, single-page room-card design.
Keep controls accessible by keyboard and labels readable.
Fix clipped content, overlapping panels, hidden Stop AC controls, and excessive blank space.
Keep the sandbox and simulation labels visible.
Capture screenshots from the running app, not the earlier concept image.

CHECKS AND EVIDENCE
Run the repository's build, typecheck, and compact test suite.
Fix critical failures and rerun the relevant checks.
Record PASS, FAIL, BLOCKED, and NOT RUN separately.
Keep fixture, live-model, database, and actual sandbox evidence distinct.

Write four short judging paragraphs in docs/JUDGING_EVIDENCE.md:
Core: The live agent reads state, takes permitted action, and checks the result.
Innovation: Room context and available history influence its decision.
Technical: Actual ClickHouse reads and verified Airwallex sandbox operations connect to the workflow.
Usefulness: The human controls preferences, permissions, spending, and Stop AC.

Use those paragraphs as evidence summaries, not preset success claims.
Attach actual screenshot paths, event references, or test results to each claim.
State blockers plainly when any claim is not yet demonstrated.
Include a compact phase-status table and the C1-C8 implementation notes in this same document.
Do not generate a large separate report set.

Document limitations: simulated physics, test money, one server, and best-effort ClickHouse delivery.
Document that automatic payment reconciliation and retry queues are not implemented.
Do not claim production readiness or organiser approval for a simulated environment.

Complete README with the commands that were actually tested.
Include database setup, environment names, model configuration, selected payment route, and HTTPS callback setup.
Provide Windows-friendly instructions where supported by the implemented tools.
Never include real secrets, raw payment payloads, database volumes, or dependency folders in a handoff archive.

Keep the source's three-minute demo as the presentation target.
Record a shorter honest path if actual checkout latency or manual steps prevent that target.
Do not hide required steps or replace a pending payment with success.

Finish with changed files, checks run, remaining blockers, and exact launch commands.
State whether the app, live agent, ClickHouse, and sandbox checkout each passed.
Do not publish, push, or deploy without separate permission.
Report subagent count only if subagents were used.
```

## 8. Official implementation references

**External documentation checked while preparing this pack on 12 September 2026.**
These references clarify API usage. They do not replace the user's source plan or prove account access.
Recheck the relevant endpoint contract during implementation.

| ID | Reference and scope |
|---|---|
| E1 | Codex reads project `AGENTS.md` instructions. `https://developers.openai.com/codex/guides/agents-md/` |
| E2 | OpenAI function calling returns executed tool results to the model. `https://developers.openai.com/api/docs/guides/function-calling` |
| E3 | Airwallex sandbox authentication, hosted checkout, and SDK `demo` environment. `https://www.airwallex.com/docs/payments/get-started/quickstart` |
| E4 | PaymentIntent amount units, request identity, and checkout data. `https://www.airwallex.com/docs/payments/get-started/using-payments-intent-api` |
| E5 | Native invoice creation, required objects, collection settings, and finalization. `https://www.airwallex.com/docs/billing/invoicing/invoices-via-api` |
| E6 | Webhook headers, unchanged body, signature, and timestamp checks. `https://www.airwallex.com/docs/developer-tools/webhooks/listen-for-webhook-events` |
| E7 | ClickHouse JavaScript insertion and parameterized-query contracts. `https://clickhouse.com/docs/integrations/javascript` |
| E8 | Airwallex payment event names and payloads. `https://www.airwallex.com/docs/payments/reference/payments-webhooks` |
| E9 | Airwallex sandbox separation and credentials. `https://www.airwallex.com/docs/developer-tools/sandbox-environment` |

Use the test-payment guide linked from E3 for current sandbox test cards.
Do not select a different payment route after a partially completed creation operation.

## 9. Source map and handoff

Source references use the original uploaded `PLAN.md` line numbers and headings.

| Source section | Original lines | Use in this pack |
|---|---:|---|
| Goal, stack, and judge experience | 1-17 | Product framing and required demonstration. |
| Phase 1 | 21-168 | Three tables, room tools, simulation, and billing. |
| Phase 2 | 172-245 | One-page UI, direct events, and history tool. |
| Phase 3 | 249-270 | One sandbox route, checkout, and webhook. |
| Phase 4 and scope cuts | 274-306 | Manual demo, evidence, and excluded complexity. |
| Structure and environment | 310-354 | Repository layout and configuration. |
| Demo script | 359-366 | Human-driven room experience and presentation target. |

Section 2 contains this pack's proposed corrections and added safeguards.
Section 8 contains external API references. Other product requirements come from the uploaded source.
The no-SVG display rule comes from the standing project preference, not Claude's revised plan.

**Prepared:** One build-all prompt and four phase prompts.
**Unchanged:** The uploaded `PLAN.md`.
**Not performed here:** Application edits, database changes, live model calls, deployment, or sandbox transactions.
