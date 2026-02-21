# DEEP.AI - The Mind of Sommayadeep

Futuristic AI portfolio built as a digital brain interface using Next.js, Tailwind, Three.js, and Framer Motion.

## Setup

1. Install dependencies:

```bash
npm install
```

2. Configure environment:

```bash
cp .env.example .env
```

Set values for:
- `NEXT_PUBLIC_GITHUB_USERNAME`
- `OPENAI_API_KEY`

3. Start dev server:

```bash
npm run dev
```

## Current Features

- AI boot sequence terminal experience
- Animated neural particle background (Three.js)
- Reimagined sections:
  - Core Architecture
  - Technical Modules
  - AI Deployments
  - Connect Protocol
- AI assistant widget with:
  - project-specific repo/live link lookup
  - short "what is behind this project" explanations
  - clickable links in replies
- Mini AI demos:
  - Sentiment Pulse
  - Complexity Oracle
  - NeuralHire Analyzer
- Mission Control live stats (GitHub API-ready)
- Revisit memory banner via localStorage

## Architecture

- `app/page.tsx`: Main interface composition
- `components/`: UI and interactive modules
- `lib/ai.ts`: Rule-based AI demo logic
- `app/api/chat/route.ts`: Hybrid chat endpoint (OpenAI + robust local fallback)
- `app/api/github-stats/route.ts`: GitHub stats proxy endpoint

## Hackathon Upgrade Path

1. Replace local assistant logic with Retrieval-Augmented chat over resume/project JSON.
2. Add voice commands using Web Speech API and TTS using ElevenLabs.
3. Add unlockable gamified progression state with backend persistence.
4. Integrate TensorFlow.js mini training playground with live line chart.
5. Add analytics + recruiter mode telemetry dashboard.
