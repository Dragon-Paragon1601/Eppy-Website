# Eppy-Website

Official web panel and landing page for Eppy-Bot.
Built with Next.js App Router, NextAuth (Discord OAuth2), and optional PM2 deployment.

<p align="left">
  <img src="https://img.shields.io/badge/Node.js-18%2B-339933?logo=node.js&logoColor=white" alt="Node.js" />
  <img src="https://img.shields.io/badge/Next.js-15-black?logo=next.js" alt="Next.js" />
  <img src="https://img.shields.io/badge/React-19-61DAFB?logo=react&logoColor=black" alt="React" />
  <img src="https://img.shields.io/badge/NextAuth-Discord_OAuth2-5865F2" alt="NextAuth" />
  <img src="https://img.shields.io/badge/PM2-supported-2B037A" alt="PM2" />
</p>

---

## Table of Contents

- [MUST DO before first run](#must-do-before-first-run)
- [Features](#features)
- [.env configuration](#env-configuration)
- [Project structure](#project-structure)
- [Run and deploy](#run-and-deploy)
- [API and auth notes](#api-and-auth-notes)
- [Troubleshooting](#troubleshooting)
- [Related repositories](#related-repositories)

---

## MUST DO before first run

1. Install Node.js LTS (with npm).
2. Install dependencies in repository root:
   - `npm install`
3. Create `.env` in project root and set required variables.
4. Run locally:
   - `npm run dev`
5. Open app in browser:
   - `http://localhost:3000`

---

## Features

- Landing page with dynamic home data (`/api/home`).
- Discord sign-in via NextAuth (`/auth/signin`, callback flow).
- Dashboard area for bot-related controls.
- Music page and additional informational pages.
- PM2-ready production startup via `ecosystem.config.js`.

---

## .env configuration

Create `.env` in project root.
Never commit real secrets.

| Key                                  | Required | Description                                          |
| ------------------------------------ | -------- | ---------------------------------------------------- |
| `DISCORD_CLIENT_ID`                  | YES      | Discord OAuth2 application client ID                 |
| `DISCORD_CLIENT_SECRET`              | YES      | Discord OAuth2 application client secret             |
| `NEXTAUTH_SECRET`                    | YES      | Secret used by NextAuth to sign session tokens       |
| `NEXTAUTH_URL`                       | YES      | Public base URL of this website (for auth callbacks) |
| `DB_HOST`                            | Optional | MySQL host used by dashboard/backend features        |
| `DB_USER`                            | Optional | MySQL user                                           |
| `DB_PASSWORD`                        | Optional | MySQL password                                       |
| `DB_NAME`                            | Optional | MySQL database name                                  |
| `MAIN_BOT_ID`                        | Optional | Main bot ID used for integration logic               |
| `DB_PASS`                            | Optional | Fallback/legacy DB password field                    |
| `NEXT_PUBLIC_DISCORD_BOT_INVITE_URL` | Optional | Public invite URL used by home-page CTA buttons      |

Minimal required set for login flow:

- `DISCORD_CLIENT_ID`
- `DISCORD_CLIENT_SECRET`
- `NEXTAUTH_SECRET`
- `NEXTAUTH_URL`

---

## Project structure

- `src/app/` - App Router pages, layouts, and API routes
- `src/app/page.js` - home page UI and dynamic content loading
- `src/app/dashboard/` - dashboard views
- `src/app/music/` - music control views
- `src/lib/auth.js` - NextAuth provider and session callbacks
- `src/components/` - reusable UI components
- `src/server/web.js` - optional Express/web integration entry
- `public/assets/` - static assets
- `logs/` - runtime logs and archives

---

## Run and deploy

### Local development

- `npm run dev`

### Production build

- `npm run build`
- `npm run start`

### PM2 (recommended for VPS)

- `npm run pm2:start`
- `npm run pm2:logs`
- `npm run pm2:restart`
- `npm run pm2:stop`
- `npm run pm2:delete`

---

## API and auth notes

- Home page requests `GET /api/home` and falls back to defaults when API is unavailable.
- NextAuth uses Discord scopes:
  - `identify`
  - `guilds`
  - `guilds.members.read`
- Sign-in page route is configured as:
  - `/auth/signin`

---

## Troubleshooting

- If Discord login fails, verify `NEXTAUTH_URL` and OAuth redirect URLs in Discord Developer Portal.
- If callback returns 400/401, verify `DISCORD_CLIENT_ID`, `DISCORD_CLIENT_SECRET`, and `NEXTAUTH_SECRET`.
- If pages load but API data is missing, check backend API route health and logs.
- If PM2 process does not stay online, inspect logs:
  - `npm run pm2:logs`

---

## Related repositories

- Bot repository: https://github.com/Dragon-Paragon1601/Eppy-Bot
- Website repository: https://github.com/Dragon-Paragon1601/Eppy-Website

---

## Author note

This project is evolving together with Eppy-Bot.
It focuses on practical server management UX: clear controls, fast setup, and reliable Discord integration.

Feedback and concrete improvement suggestions are always welcome.
