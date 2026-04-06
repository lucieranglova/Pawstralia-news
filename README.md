# Pawstralia-news
# 🐨 Pawstralia News

A daily Discord bot that delivers yesterday's Australian animal news with fun, emoji-rich headlines every morning at 7:00 AM.

## Example Discord message

> 🐨 **Pawstralia News — Sunday, April 6 2026**
>
> *Crikey! The wildlife has been busy! Here's yesterday's Pawstralia News 🐨*
>
> **🦘 Kangaroo Escapes Sydney Suburb, Hops Into Local Pub**
> A rogue kangaroo caused chaos in a Sydney suburb yesterday before being safely returned to the bush by wildlife officers.
>
> **🐊 Crocodile Photobombs Tourist Selfie on Daintree River**
> A group of tourists got more than they bargained for when a 3-metre saltwater croc decided to join their boat trip photo.
>
> **🐨 Queensland Koala Hospital Welcomes Record 12 Joeys**
> The Currumbin Wildlife Sanctuary celebrated a bumper season with a dozen new koala joeys born in the past month.
>
> *🌏 Keeping you updated from Down Under, one paw at a time.*

## How it works

```
GitHub Actions cron (5:00 UTC = 7:00 CEST)
        ↓
pawstralia_news.js asks OpenAI to search for yesterday's Australian animal news
        ↓
OpenAI returns 3-5 stories with fun headlines
        ↓
Bot sends formatted digest to Discord
```

## Repository structure

```
├── pawstralia_news.js           # Main script
└── .github/
    └── workflows/
        └── pawstralia_news.yml  # GitHub Actions cron
```

## Setup

### 1. Create a Discord webhook
- Open Discord → channel settings ⚙️ → Integrations → Webhooks
- Click **New Webhook** → copy the URL

### 2. Get an OpenAI API key
- Go to [platform.openai.com](https://platform.openai.com) → API keys
- Create a new key

### 3. Add GitHub Secrets
Go to **Settings → Secrets and variables → Actions → New repository secret**

| Secret name | Value |
|---|---|
| `OPENAI_API_KEY` | Your OpenAI API key |
| `DISCORD_WEBHOOK_URL` | Your Discord webhook URL |

### 4. Run manually to test
**Actions → Pawstralia News → Run workflow**

## Schedule

Runs every day at **7:00 AM CEST** (5:00 UTC).

## Cost

Uses `gpt-4o-mini-search-preview` with web search — approximately **$0.01–0.03 per run**, so around **$4–10 per year**.
