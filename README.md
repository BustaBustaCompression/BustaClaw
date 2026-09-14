# 🦞 BustaClaw

A small full-stack **compression playground**. Paste text and instantly compare how
`gzip`, `deflate`, and `brotli` shrink it, using the Node.js `zlib` codecs (no native
dependencies).

The repository is a TypeScript monorepo managed with npm workspaces:

| Package | Description | Dev port |
| --- | --- | --- |
| [`@bustaclaw/server`](packages/server) | Express + TypeScript API that compresses input and reports size stats. | `4000` |
| [`@bustaclaw/web`](packages/web) | Vite + React + TypeScript UI that visualizes the results. | `5173` |

## Prerequisites

- Node.js `>= 20` (the repo is developed against Node 22)
- npm `>= 10`

## Getting started

```bash
npm ci        # install all workspace dependencies
npm run dev   # start the API (:4000) and the web UI (:5173) together
```

Then open http://localhost:5173 and click **Compress**. The Vite dev server proxies
`/api/*` requests to the API on port `4000`.

## Common commands

| Command | What it does |
| --- | --- |
| `npm run dev` | Run the server and web dev servers in parallel. |
| `npm run dev:server` | Run only the API with hot reload (`tsx watch`). |
| `npm run dev:web` | Run only the Vite dev server. |
| `npm run build` | Type-check and build both packages. |
| `npm test` | Run the server's Vitest suite. |
| `npm run lint` | Lint the whole repo with ESLint. |
| `npm run typecheck` | Type-check every workspace. |

## API

### `GET /api/health`

Returns `{ "status": "ok", "algorithms": ["gzip", "deflate", "brotli"] }`.

### `POST /api/compress`

Request body:

```json
{ "text": "some text to compress" }
```

Response:

```json
{
  "originalBytes": 1080,
  "best": "brotli",
  "results": [
    { "algorithm": "gzip", "originalBytes": 1080, "compressedBytes": 46, "ratio": 0.0426, "savingsPercent": 95.74, "compressedBase64": "…" }
  ]
}
```

## Cloud Agent environment

This repository ships a [`.cursor/environment.json`](.cursor/environment.json) so Cursor
Cloud Agents boot ready to work: `npm ci` installs dependencies, and the `server` and
`web` dev servers start automatically in named terminals.
