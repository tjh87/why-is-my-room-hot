# 🌡️ Why Is My Room So Hot?

An interactive simulated HDB comfort dashboard. It shows room heat signals, free cooling actions, AI-guided AC offers, live billing, ClickHouse event history, and Airwallex sandbox payment evidence.

> 🧪 This is a simulation. It does not control real AC units, fans, blinds, sensors, or payments.

## ✨ What it does

- 🏠 Shows four tenant rooms with live temperature and comfort states.
- ❄️ Tracks simulated AC sessions and capped charges.
- ✣ Tracks active fan charges and closed-blind indicators.
- 🤖 Guides users through room actions and human-approved AC offers.
- 📊 Stores room events in ClickHouse and shows a live activity stream.
- 💳 Creates Airwallex **sandbox** PaymentIntents after a local invoice exists.
- ✅ Marks a payment paid only after a signed Airwallex webhook.

## 🧰 Technologies

| Area | Technologies |
|---|---|
| 🎨 Frontend | React 19, TypeScript, Vite, CSS |
| ⚙️ API | Node.js, Fastify, TypeScript |
| 🗃️ Primary state | PostgreSQL, `pg`, `pg-mem` demo fixture |
| 📈 Event history | ClickHouse Cloud, `@clickhouse/client` |
| 🤖 Room agent | OpenAI SDK with function tools |
| 💳 Payments | Airwallex sandbox, Hosted Payment Page, `@airwallex/components-sdk` |
| 🧪 Tests | Vitest |
| 🧱 Local tooling | npm, tsx, concurrently, Docker Compose optional |

## 🚀 Run locally

```powershell
npm install
npm.cmd run dev
```

Open [http://127.0.0.1:5175](http://127.0.0.1:5175).

Without `DATABASE_URL`, the API uses an in-memory four-room fixture. It resets when the API restarts.

## 🔐 Configuration

Copy `.env.example` to `.env` and set values locally. Do not commit `.env`.

```powershell
Copy-Item .env.example .env
```

The repository excludes `.env` through `.gitignore`. It contains no API keys, passwords, access tokens, or private service URLs.

## ✅ Checks

```powershell
npm.cmd run typecheck
npm.cmd test
npm.cmd run build
```

## ⚠️ Sandbox limits

Airwallex runs in sandbox mode only. Production payments, subscriptions, queues, workers, and autonomous purchases are not included.
