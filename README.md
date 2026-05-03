# 🛡️ ScamGuard MY

**AI-powered scam detection agent protecting Malaysians from digital fraud in real time.**

[![Deployed on Vercel](https://img.shields.io/badge/Deployed%20on-Vercel-black?logo=vercel)](https://v0-videobrief.vercel.app)
[![KaryaWAN AI Challenge](https://img.shields.io/badge/KaryaWAN-Impact%20Track-red)](https://www.alibabacloud.com)
[![WAN AI](https://img.shields.io/badge/Powered%20by-WAN%20AI-orange)](https://wan.video)

---

## What it does

Every day, thousands of Malaysians lose their savings to digital scams — fake investments, job fraud, phishing links. Most only realise after it's too late.

ScamGuard MY is an AI agent that intercepts suspicious messages, links, and offers **before** the user engages — acting as a silent, always-on guardian in their digital life. It detects patterns matching known scam profiles across WhatsApp, email, and social media, and alerts users in real time with clear explanations of the risk.

---

## Demo

> **Live app:** [v0-videobrief.vercel.app](https://v0-videobrief.vercel.app)

The VideoBrief app demonstrates the full AI agent pipeline:
- Brief intake via Notion MCP (Client CRM + Brief Intake databases)
- Claude API generates 7-shot storyboard with WAN AI prompts
- Visual storyboard grid with colour-coded model badges (Wan-T2V / Wan-I2V / Wan-R2V)
- Competition mode for KaryaWAN with pre-filled survey copy
- fal.ai WAN generation test panel (Shot-level video generation)

---

## Architecture

```
User Brief (v0 frontend)
    ↓  Notion MCP
Brief Intake DB ←→ Client CRM DB
    ↓  Claude API
Storyboard + WAN AI Prompts
    ↓  fal.ai WAN 2.6 API
Per-shot video clips (Wan-T2V / Wan-I2V / Wan-R2V)
    ↓  Creatomate (assembly)
Final video → YouTube → KaryaWAN submission
```

---

## KaryaWAN AI Challenge

**Competition:** KaryaWAN AI Challenge by Alibaba Cloud Malaysia  
**Track:** KaryaWAN Impact — AI in Action  
**Video title:** ScamGuard MY: One Click Away  
**Submission deadline:** May 15, 2026  

ScamGuard MY was selected as the test case for the VideoBrief agent because it represents a real, urgent Malaysian problem — and because the story of a person one click away from losing everything maps perfectly to the emotional arc required for a compelling 45-second video.

**WAN AI models used:**
- `Wan-T2V` — abstract scenes, data visualisation, title card
- `Wan-I2V` — character-driven scenes (first appearance)
- `Wan-R2V` — character consistency across multiple shots

---

## Tech stack

| Layer | Tool |
|---|---|
| Frontend | v0 by Vercel + Next.js |
| Deployment | Vercel |
| Brief storage | Notion (via MCP) |
| Script + prompt generation | Claude API (Anthropic) |
| Video generation | fal.ai — WAN 2.6 (T2V, I2V, R2V) |
| Video assembly | Creatomate API |
| Tracking | Notion Production Log database |

---

## Repo structure

```
/
├── agent.py          # Core scam detection agent logic
├── deploy.sh         # Deployment script
├── requirements.txt  # Python dependencies
└── README.md
```

---

## Quick start

```bash
git clone https://github.com/ekc2024/ScamGuard-MY
cd ScamGuard-MY
pip install -r requirements.txt
python agent.py
```

Set your environment variables:
```bash
FAL_KEY=your_fal_api_key
ANTHROPIC_API_KEY=your_claude_key
NOTION_API_KEY=your_notion_integration_key
```

---

## About

Built by **Elton Kuah** — digital marketing entrepreneur and AI practitioner based in Kuala Lumpur, Malaysia.  
[scalewithenrich.com](https://scalewithenrich.com) · [eltonkuah.com](https://eltonkuah.com) · [GitHub](https://github.com/ekc2024)

---

*Submitted to the Vercel Zero to Agent Hackathon (v0 + MCPs track) and KaryaWAN AI Challenge 2026.*
