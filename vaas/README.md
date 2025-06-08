This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Getting Started

### Environment

Set `OPENAI_API_KEY` in your shell or a `.env` file:

```bash
export OPENAI_API_KEY=sk-...

Optional: override default OpenAI models

```bash
# Vision / chat model (default: gpt-4o-mini)
export OPENAI_CHAT_MODEL=gpt-4o

# Embedding model (default: text-embedding-3-small)
export OPENAI_EMBEDDING_MODEL=text-embedding-3-large
```
```

### Development server (hot-reload)

```bash
npm run dev        # uses ts-node-dev (requires ts-node-dev installed)
```

### Production build

```bash
npm run build      # compiles TS → dist/
node dist/server.js
```

The server listens on `$PORT` (default 3000).

---

## HTTP API

All endpoints are JSON. Supply your `OPENAI_API_KEY` in the environment of the backend – the client need not send it.

### 1. Generate aesthetic embedding

`POST /api/mood`

Body fields (all optional except one of texts/images/urls):

* `texts`  – `string[]` free-form descriptions
* `images` – `string[]` base64 data-URIs (or raw base64) of images
* `urls`   – `string[]` webpages; HTML is scraped & summarised by GPT-4-o
* `name`   – **optional** string. When provided the resulting aesthetic is persisted and can be reused later.

Response

```jsonc
{
  "aesthetic_embedding": "dusky lavender haze, neo-brutalist grids, ...",
  "saved_as": "coffee-shop" // present only if you sent name
}
```

### 2. Apply aesthetic to existing HTML

`POST /api/transform`

```jsonc
{
  "html": "<!doctype html>...",     // required, original HTML
  "aesthetic": "dusky lavender haze" // required, text embedding (e.g. from /api/mood)
}
```

Returns `{ "html": "<!doctype html>...modified..." }` (full HTML file with inline CSS/theme).

### 2b. Apply aesthetic directly to a live website

`POST /api/transform-url`

```jsonc
{
  "url": "https://example.com",      // required
  "aesthetic": "…" |                  // OR provide direct text
  "aesthetic_name": "saved_key"       // OR reference previously saved aesthetic
}
```

Returns `{ "html": "<!doctype html>...modified..." }`.

### 3. Saved aesthetics

* `GET /api/aesthetics` – list all saved {name, embedding, created}
* `GET /api/aesthetic/:name` – retrieve single saved embedding

The server stores these in `data/aesthetics.json`.

---

## Running tests

`python test_backend.py` will:

1. Compile & launch the backend on an internal port.
2. Exercise all API endpoints (including transform & persistence).
3. Print request & response for each successful case.
4. Dump diagnostics for any failures.

Use `BACKEND_URL=http://host:port python test_backend.py` to test a remote instance.

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
