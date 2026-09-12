# Judging evidence

| Phase | Status | Evidence |
|---|---|---|
| 1 Foundation + agent | PARTIAL | `npm run typecheck` and three simulation tests passed. The no-Docker in-memory fixture serves seeded rooms. PostgreSQL and live-model checks are blocked. |
| 2 UI + ClickHouse | PARTIAL | Build passed. One-page UI and direct ClickHouse client code exist. The API now exposes a credential-aware ClickHouse readiness probe and a guarded room-history query. The running process has no ClickHouse environment keys, so live verification remains blocked. |
| 3 Sandbox payment | PARTIAL | PaymentIntent adapter and signature code exist. Sandbox credentials are absent. |
| 4 Polish + demo | NOT RUN | Docker is unavailable, so the running application and visual demo could not start. |

## C1–C8 choices

C1 uses bounded ten-second internal simulation steps. Closed blinds reduce sunlight. A fan changes comfort only.
C2 keeps sessions and invoices in the three source tables. C3 uses saved offers and frozen terms.
C4 records pending result checks. C5 uses direct best-effort ClickHouse inserts without an outbox.
C6 stores request identity before provider work is complete. C7 uses the sandbox PaymentIntent route only.
C8 includes compact simulation tests. External checks remain BLOCKED until services and credentials exist.

## Evidence summaries

Core: The source implements room reads, permitted actions, AC offers, and a Stop AC route. Live model proof is BLOCKED because `OPENAI_API_KEY` is absent.

Innovation: Room sunlight, electronics, permissions, temperature, and target shape the fixture diagnosis. A live ClickHouse-backed agent test is BLOCKED.

Technical: PostgreSQL holds state and ClickHouse uses direct inserts. `GET /api/clickhouse/health` uses `ping({ select: true })`. Room history filters by the table sort key and limits scan time, rows, and results. Airwallex PaymentIntent and webhook code exist, but real sandbox verification is BLOCKED.

Usefulness: The UI exposes room selection, permitted controls, explicit AC approval, a spending cap, and Stop AC. Runtime visual validation is NOT RUN.

## ClickHouse integration check

The live dashboard event panel now calls each room-history route. It shows real ClickHouse events only. It never shows fixture events as database output.

On 2026-09-12, the restarted API returned `{ "configured": false, "status": "unavailable" }` from `GET /api/clickhouse/health`. `GET /api/rooms/alice/history` returned `status: "unavailable"` with zero events. The desktop connector configuration was not exposed as `CLICKHOUSE_URL` to the application process.

Later, a separate API test process received the supplied ClickHouse Cloud host. Its readiness probe returned `{ "configured": true, "status": "unavailable" }`. The provider `/ping` endpoint returned HTTP 200. Network reachability is confirmed. The missing Cloud password blocks authenticated query access.

The main API process on port 3000 was then restarted with the same Cloud host. It now returns `{ "configured": true, "status": "unavailable" }`. The configuration error is fixed. The Cloud password remains the only known blocker.

The history query uses a typed `room_id` parameter, filters on the `ORDER BY (room_id, occurred_at)` key, and applies result, scan, and execution limits. Direct inserts remain the requested hackathon path.

## Checks run

`npm run typecheck` passed. `npm test` passed: 3 simulation checks cover source billing rounding, cap trimming, and temperature bounds. `npm run build` passed. The browser showed the live event-panel unavailable state at `http://127.0.0.1:5175`.

## Button checks

The apartment, analytics, and billing tabs now select their section. Pause and resume change the shared simulator state. Speed cycles through 60x, 1x, and 10x. New run safely restores the default simulator controls without deleting tenant, invoice, or agent data.

Browser checks confirmed room selection, fan control, blind control, AC offer creation, and AC approval. The no-Docker agent-step insert now supplies a unique UUID. This fixes the fixture collision found during the offer test.

The room-action feedback was improved after a live browser check. Close blinds now confirms `Blinds closed`, and Use fan now confirms `Fan set to high`. Both actions returned HTTP 200 from the room-action API.

The ClickHouse panel now uses a live event signal view with an activity ring, action counts, color-coded event stream, and a clear offline state. The invoice panel now uses a visual proof rail for Offer, Usage, Invoice, and Payment. Both panels use live API data where it is available.

The event stream was refined with a high-contrast live-signal header, compact action labels, color-coded room identities, timestamps, and a four-event focus. Browser review confirmed the live ClickHouse events render in the new design.

The browser loaded four fixture rooms at `http://127.0.0.1:5175`. PostgreSQL, ClickHouse, OpenAI, Airwallex, webhook, and sandbox checks remain BLOCKED. ClickHouse needs `CLICKHOUSE_URL` in the API process environment; no key was present during this check.

## Checkpoint

Set `CLICKHOUSE_URL` in the API process, restart `npm run dev`, then run an agent action and verify recorded room events. Next incomplete phase: Phase 1 live agent integration and live external-service checks.

## Airwallex evidence update

The invoice panel now reads `GET /api/rooms`, `GET /api/invoices`, and `GET /api/airwallex/status`. It renders offer, recorded usage, local invoice amount, provider readiness, and webhook-backed payment status. It does not show a payment as complete before the verified webhook updates the invoice.

On 2026-09-12, a local Alice flow closed blinds, enabled a fan, saved an AC offer, accepted it, and stopped the AC session. The API recorded 121 simulated seconds and created invoice `a6a2396a-e4bf-4eae-a7c0-84dc0b22156f` for 4 cents. Browser review showed `Invoice secured`, `S$0.04 · DRAFT`, and three completed proof stages.

`POST /api/invoices/:id/checkout` returned `{ "status": "blocked", "message": "Airwallex sandbox credentials are not configured." }`. The invoice stayed `draft`; it did not become paid. The panel disables checkout while credentials are absent.

The official Airwallex Components SDK is installed. With sandbox credentials, an explicit user click creates a PaymentIntent and opens Airwallex Hosted Payment Page in demo mode. A signed `payment_intent.succeeded` webhook remains the only payment-completion path. Live payment and webhook checks are BLOCKED because `AIRWALLEX_CLIENT_ID`, `AIRWALLEX_API_KEY`, and `AIRWALLEX_WEBHOOK_SECRET` are not configured in the API process.

After the panel update, `npm run typecheck`, `npm test`, and `npm run build` passed. Browser review confirmed the local invoice value and the disabled checkout control without a stale connection warning.

## Airwallex sandbox configuration update

Local ignored configuration now supplies the Airwallex demo API host and sandbox credentials to the API. The API reports `configured: true`. The credential values are not committed and are not included in this evidence file.

Pricing defaults are S$1.20 per simulated AC hour and S$0.12 per simulated fan hour. `GET /api/billing` returns current AC, fan, and total accrued cents. The dashboard top card refreshes this endpoint every two seconds.

On 2026-09-12, an Alice fan action updated the live top card from zero to S$0.07 accrued. The API created a local S$0.02 invoice and an Airwallex sandbox PaymentIntent. Its local status changed from `draft` to `open`; no payment was completed or marked paid.

The current missing configuration is `AIRWALLEX_WEBHOOK_SECRET`. Signed webhook validation remains BLOCKED until this value is set in local configuration and the Airwallex sandbox webhook is configured for `/api/webhooks/airwallex`.

Final checks after live-summary changes passed: `npm run typecheck`, `npm test` (3 tests), and `npm run build`. Browser review showed `0 AC active`, `S$0.23 accrued`, and `Airwallex sandbox · credentials ready`.

## ClickHouse recovery update

The API restart did not retain `CLICKHOUSE_URL`. Local ignored configuration now restores the Cloud endpoint. `GET /api/clickhouse/health` returned `{ "configured": true, "status": "available" }` on 2026-09-12. The Alice history route returned stored ClickHouse events. Browser review confirmed the live `ClickHouse stream` card and no offline message.

## Live room indicators

Room badges now refresh from `GET /api/rooms` every two seconds. They show `❄ AC on`, `✣ Fan on`, and `▤ Blinds closed` only when the matching room state is active. Browser review confirmed Alice shows `✣ Fan on` and Chen shows `✣ Fan on · ▤ Blinds closed`.
