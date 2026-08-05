# ROAM overlay — Outpost · Social

This fork of [Postiz](https://github.com/gitroomhq/postiz-app) is ROAM's
self-hosted social publishing engine ("Outpost · Social"). It **stands beside**
the ROAM ecosystem: the ecosystem embeds this app's reskinned UI and drives it
via the Public API. Governing plan lives in the ecosystem repo
(`docs/postiz-integration-plan.md`).

**Everything ROAM-specific lives in this `roam/` directory** so upstream merges
never conflict with our changes. Keep it that way — additive and isolated.

## Live instance

- Railway: `https://postiz-production-ba8c.up.railway.app` (stock image for now;
  swap for the reskinned build once the theme is wired).
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

## Reskin (make it look like ROAM)

Principle: a **thin, additive** overlay so upstream releases still merge cleanly.

1. `roam/theme/roam-theme.css` holds the real ROAM design tokens (colors, fonts).
2. Wire it into `apps/frontend` — Postiz styles with **Tailwind 3 + Mantine 5 +
   @pigment-css/react + sass**, so the integration points are:
   - extend Tailwind theme colors → ROAM tokens,
   - the Mantine `MantineProvider` theme (primary color / fonts),
   - import `roam-theme.css` last in the global stylesheet so it wins,
   - self-host the two ROAM variable fonts (no external font CDN — AGPL public fork).
3. Swap the logo asset; hide upstream billing/marketing chrome.
4. Keep every ROAM edit in `roam/` or clearly marked — if you find yourself editing
   upstream business logic, push that behavior to the ROAM side (Public API + native
   UI) instead of forking deeper.

## Stay current with upstream

Pin to upstream **release tags**, not `main`. Use `roam/sync-upstream.sh` (adds the
`upstream` remote if missing, fetches tags, and merges the tag you name). Run its
Prisma migrations and smoke-test one publish after each merge.

## License

AGPL-3.0 (inherited from Postiz). This fork is **public**, which satisfies the
network-use source-disclosure obligation for our internal deployment. Keep
upstream's LICENSE and copyright intact.
