# ROAM overlay — Outpost · Social

This fork of [Postiz](https://github.com/gitroomhq/postiz-app) is ROAM's
self-hosted social publishing engine ("Outpost · Social"). It **stands beside**
the ROAM ecosystem: the ecosystem embeds this app's reskinned UI and drives it
via the Public API. Governing plan lives in the ecosystem repo
(`docs/postiz-integration-plan.md`).

**Everything ROAM-specific lives in this `roam/` directory** so upstream merges
never conflict with our changes. Keep it that way — additive and isolated.

## Live instance

- Railway: `https://postiz-production-ba8c.up.railway.app` (still the **stock**
  upstream image — reskin is wired in the fork but not yet deployed; see "Deploy
  the reskinned image" below).
- ⚠️ Set `DISABLE_REGISTRATION=true` on the Railway service after registering the
  one admin account — the public URL is otherwise open to sign-ups.

## The stack (why it's more than "app + db")

Current Postiz uses **Temporal** for scheduling, so the minimum production stack is:

| Service | Image | Role |
|---|---|---|
| app | `ghcr.io/gitroomhq/postiz-app` (later: our reskin build) | frontend + backend + workers |
| postgres | `postgres:17-alpine` | Postiz data (Prisma) |
| redis | `redis:7.2` | queues, rate limiting, cache |
| temporal | `temporalio/auto-setup` | scheduled-post workflow engine |
| temporal-postgres | `postgres:16-alpine` | Temporal's own store |

`roam/docker-compose.yml` drops upstream's Elasticsearch + operator UIs
(Temporal runs on Postgres visibility), landing at ~5 always-on services.
Because Postiz is a scheduler, the host must stay always-on — a sleeping box
drops scheduled posts.

## Deploy

**Railway (managed always-on):** one service per row above; add the app's custom
domain `social.roam…` with TLS; set env from `roam/.env.example`.

**VPS / Coolify:** `cp roam/.env.example roam/.env && $EDITOR roam/.env && docker
compose -f roam/docker-compose.yml up -d`, front with the reverse proxy's TLS.

## Reskin (make it look like ROAM) — IMPLEMENTED

Principle: a **thin, additive** overlay so upstream releases still merge cleanly.
Applied in `apps/frontend` (commit that added `roam/`):

- **`apps/frontend/src/app/roam-brand.scss`** — overrides Postiz's brand CSS
  variables: the purple family (`--color-forth`/`--new-btn-primary`/`--color-seventh`)
  → ROAM gold, the pink AI accent → ROAM teal, light-mode purple chrome → forest.
  Imported right after `colors.scss` in `global.scss` so it wins the cascade.
- **Fonts** — DM Sans (body) + Playfair Display (display), self-hosted in
  `apps/frontend/public/fonts` and wired into `tailwind.config.cjs` + `body`.
- **Logo** — `new-layout/logo.tsx` and `ui/logo-text.component.tsx` swapped to the
  Outpost planted-flag mark (gold) + an "Outpost" Playfair wordmark.

The reskin lives in the fork but is **only visible once Railway builds from this
fork** (see "Deploy the reskinned image" below) — the running instance is still the
stock upstream image. Follow-ups (validate on the live build): remove the `/auth`
marketing testimonials; optional forest-tinting of dark surfaces.

## Embedding / framing — VERIFIED OK (no change needed)

The ecosystem embeds these surfaces in an iframe. Checked the live instance's
response headers (`/auth`, HTTP 200): **no `X-Frame-Options`, no CSP
`frame-ancestors`, no HTML frame-buster.** This Postiz build does not block
framing, so the embed renders as-is — no header/config change required. (If a
future upstream merge adds frame protection, set `frame-ancestors` to the
ecosystem origin here.)

## Deploy the reskinned image to Railway

The running Railway service uses the stock `ghcr.io/gitroomhq/postiz-app` image, so
it does NOT show the reskin. To ship the ROAM build, either:

**Option A — Railway builds from this fork (simplest).** In the Railway service:
Settings → Source → connect the **`roammgmt/postiz`** repo. The root
**`railway.toml`** already pins the builder to **Dockerfile** (`Dockerfile.dev`),
so no manual Build setting is needed — Railway builds the reskinned image on every
push. Keep the existing env vars.

> ⚠️ If the container crash-loops with `Cannot find module '/app/index.js'`
> (`MODULE_NOT_FOUND`), Railway is using **Nixpacks**, not the Dockerfile —
> Nixpacks guesses `node index.js`, which doesn't exist in this monorepo. Ensure
> `railway.toml` is present (it pins `builder = "dockerfile"`) and clear any manual
> **Start Command** under Settings → Deploy so the Dockerfile's
> `nginx && pnpm run pm2` CMD runs. Also confirm no volume is mounted at `/app`
> (it would shadow the image); mount persistent storage on the uploads path, not
> the app root.

**Option B — publish an image, then swap Railway's image field.** Edit
`.github/workflows/build-containers.yml` to push to `ghcr.io/roammgmt/postiz-app`
(change the three `ghcr.io/gitroomhq/postiz-app` references), push a tag (or run the
workflow via *Actions → Build Containers → Run workflow*) to build+publish, make the
GHCR package public (or add pull creds to Railway), then change the Railway service's
image to `ghcr.io/roammgmt/postiz-app:<tag>`. This mirrors the original stock-image
deploy — a one-field change.

Recommended: **Option A** for a pilot (no registry/tag dance; Railway rebuilds on
every fork push).

## Stay current with upstream

Pin to upstream **release tags**, not `main`. Use `roam/sync-upstream.sh` (adds the
`upstream` remote if missing, fetches tags, and merges the tag you name). Run its
Prisma migrations and smoke-test one publish after each merge.

## License

AGPL-3.0 (inherited from Postiz). This fork is **public**, which satisfies the
network-use source-disclosure obligation for our internal deployment. Keep
upstream's LICENSE and copyright intact.
