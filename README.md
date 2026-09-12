# Why Is My Room So Hot?

A simulated HDB comfort demo. It uses PostgreSQL as the source of truth. ClickHouse receives best-effort direct events.

## Run

1. Run `npm install`.
2. Run `npm run dev`.
3. Open `http://127.0.0.1:5175`.

Without `DATABASE_URL`, the app uses an in-memory test fixture. It seeds the four demo rooms on each API restart. It is not persistent PostgreSQL evidence.

To use PostgreSQL and ClickHouse, copy `.env.example` to `.env`, set secure values, and run `docker compose up -d`.

`npm run build`, `npm run typecheck`, and `npm test` are the project checks.

## Payment

The only payment route is an app invoice plus Airwallex sandbox PaymentIntent. The server creates PaymentIntents only with a frozen local invoice. Configure an HTTPS callback at `/api/webhooks/airwallex`. The webhook must use its configured secret. Browser return parameters never mark an invoice paid.

## Limits

This uses simulated temperatures and test money. It has no production payment route, retries, reconciliation, worker, queue, or subscriptions.
