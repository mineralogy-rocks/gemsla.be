# gems-labe

Gemological services app for Olena Rybnikova. This is a Next.js App Router application backed by Supabase for database, auth, storage, and edge functions.

## Local Environment

- Work from the workspace root unless a command says otherwise.
- The app is run by `main/docker-compose.yaml` as the `gems-labe` service.
- `main/docker-compose.yaml` mounts `../gems-labe:/app`, exposes `8081:8080`, and sets:
  - `NEXT_PUBLIC_SITE_URL=http://gemsla.be.local`
  - `NEXT_PUBLIC_SUPABASE_URL=http://supabase.gemsla.be.local`
- `main/nginx/nginx.template` routes:
  - `http://gemsla.be.local` to `gems-labe:8080`
  - `http://supabase.gemsla.be.local` to the local Supabase CLI API at `host.docker.internal:54321`
- Assume Docker containers are already running. Run app commands inside the container:

```bash
docker-compose -f ./main/docker-compose.yaml exec gems-labe bash
```

If already in `main/`, use:

```bash
docker-compose -f docker-compose.yaml exec gems-labe bash
```

## Commands

Inside the `gems-labe` container:

```bash
bun run dev
bun run lint
bun run build
```

The container image uses Bun. `dev.Dockerfile` starts the app with `bun install && bun run dev`, and `bun run dev` runs Next.js on port `8080`.

There is no test suite configured for this app. For code changes, run `bun run lint`; run `bun run build` for changes that affect routing, server/client boundaries, Supabase queries, or build-time behavior.

## Supabase

- Supabase CLI config lives in `gems-labe/supabase/config.toml`.
- Local project id is `olena-gem`.
- Local Supabase is started from `gems-labe` with `supabase start`; it is not a service in `main/docker-compose.yaml`.
- Local Supabase ports:
  - API: `54321`
  - DB: `54322`
  - Studio: `54323`
  - Inbucket: `54324`
- Database migrations live in `supabase/migrations/`.
- Seed data lives in `supabase/seed.sql`.
- Edge functions live in `supabase/functions/`; `parse-invoice` is the active function.
- Storage buckets used by the app include `reports`, `blog-images`, and `invoices`.

For schema changes, add a new timestamped migration. Do not edit historical migrations unless the user explicitly asks for migration history cleanup.

`main/Makefile` has `sync-supabase-local`, which runs `main/bin/sync-supabase-local`. This resets the local Supabase database, applies migrations, restores production data, clears local storage object records, and syncs production storage files for `reports`, `blog-images`, and `invoices`. Treat it as destructive and run it only when explicitly requested.

## Environment and Secrets

- Local app env file: `gems-labe/.envs/.local/.env`
- Production app env file: `gems-labe/.envs/.prod/.env`
- Required local app keys include:
  - `NEXT_PUBLIC_SUPABASE_URL`
  - `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY`
  - `SUPABASE_SERVICE_ROLE_KEY`
  - `RESEND_API_KEY`
  - `OPENAI_API_KEY`
- Supabase edge runtime secrets are configured in `supabase/config.toml` under `[edge_runtime.secrets]`.
- Never print, commit, or expose secret values. Keep `SUPABASE_SERVICE_ROLE_KEY` server-side only.

## Code Conventions

- Use TypeScript strict mode and the `@/*` path alias.
- Follow existing file-local formatting; do not reformat unrelated code.
- Use `lib/supabase/client.ts` for browser Supabase clients.
- Use `lib/supabase/server.ts` for server-side request/cookie-aware clients.
- Use `lib/supabase/admin.ts` only for privileged server-side auth/admin checks.
- Keep `"use client"` limited to components that need browser APIs, state, effects, or event handlers.
- Prefer existing components in `app/components/` before creating new UI primitives.
- Keep service-role operations in route handlers, server actions, or server-only helpers.
- For Three.js / React Three Fiber components, preserve client-only dynamic import patterns where already used.
