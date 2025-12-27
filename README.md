# Mentori - Aprovação em Concursos

**Plataforma inteligente de estudos para concursos públicos** com IA, spaced repetition, gamificação e predição de nota.

## Features

### Core Algorithms (Science-Backed)
- **Elo Rating System** - Dificuldade adaptativa baseada em performance
- **SM-2+ Spaced Repetition** - Intervalos otimizados com cards de revisão
- **Interleaved Practice** - 70% topic switch para melhor retenção
- **Score Prediction** - Predição de nota com intervalo de confiança

### Question Bank
- **695+ questões reais** de CEBRASPE e FGV
- Filtros por banca, ano, disciplina
- Deduplicação automática por hash
- Explicações AI-generated (Gemini)

### Study Scheduler (Metodologia Evandro Guedes)
- Cronograma baseado em pesos do edital
- Distribuição proporcional + ajuste por Elo
- Alertas de desvio de meta
- Countdown para prova

### Analytics & Insights
- Nota estimada (0-100) com probabilidade de aprovação
- Breakdown por disciplina
- Recomendações de foco ordenadas por impacto
- Relatório semanal com insights

### Gamificação
- **Níveis 1-100** com curva exponencial de XP
- **11 títulos** (Recruta → Marechal)
- **25+ badges** em 5 categorias e raridades
- **Streak system** com freeze semanal

### PWA & Offline
- Service Worker para cache de questões
- Indicador de status online/offline
- Background sync para ações pendentes
- Installable como app

## Quick Start

```bash
npm install
npm run dev
```

## Environment

Create `.env.local`:
```
VITE_GEMINI_API_KEY=your_api_key_here
VITE_GOOGLE_CLOUD_PROJECT=your_project (optional, for Vertex AI)
```

## Tests

```bash
npm test              # Run tests (194 passing)
npm run test:coverage # With coverage
npm run typecheck     # TypeScript check
npm run lint          # ESLint
```

## Project Structure

```
├── components/          # UI components
│   ├── AlertBanner.tsx     # Progress alerts
│   ├── Charts.tsx          # SVG charts (no deps)
│   ├── EmptyStates.tsx     # Empty state UX
│   ├── ErrorBoundary.tsx   # Error handling
│   ├── LevelUpModal.tsx    # Gamification modals
│   ├── LoadingStates.tsx   # Loaders & skeletons
│   ├── OfflineIndicator.tsx# PWA status
│   └── QuestionCard.tsx    # Question display
├── features/            # Feature modules
│   ├── Gamification/       # Level & Badge systems
│   ├── QuestionBank.tsx    # Question practice
│   ├── StudyCycle.tsx      # Study scheduler
│   └── WeeklyReport.tsx    # Weekly analytics
├── hooks/               # Custom hooks
│   ├── usePersistence.ts   # localStorage
│   └── useQuestionReview.ts# SM-2 integration
├── services/            # Business logic
│   ├── database.ts         # IndexedDB (Dexie)
│   ├── eloService.ts       # Elo algorithm
│   ├── geminiService.ts    # AI integration
│   ├── scorePredictor.ts   # Score prediction
│   ├── spacedRepetition.ts # SM-2 algorithm
│   ├── streakService.ts    # Streak management
│   ├── studyScheduler.ts   # Schedule algorithm
│   └── syncService.ts      # Offline sync
└── public/
    ├── data/               # Question JSONs
    ├── manifest.json       # PWA manifest
    └── sw.js               # Service Worker
```

## Tech Stack

- **React 19** + **TypeScript**
- **Vite** (build)
- **Vitest** (tests)
- **Tailwind CSS** (styling)
- **Dexie** (IndexedDB)
- **Gemini API** (AI)
- **Lucide** (icons)

## Architecture Decisions

| Decision | Choice | Rationale |
|----------|--------|-----------|
| Persistence | localStorage + IndexedDB | No backend, instant offline |
| Charts | Pure SVG | No dependencies, small bundle |
| State | React hooks + localStorage | Simple, no Redux overhead |
| AI | Gemini 2.5 Flash/Pro | Best quality, streaming |

## Metodologia

Baseado em:
- **Evandro Guedes** - Ciclo de estudos, pesos do edital
- **Alexandre Meirelles** - Revisão espaçada
- **Spaced Repetition Research** (NIH 2025)
- **Elo in Education** (ArXiv 2024)

## License

MIT

---

Made with dedication for Brazilian civil service exam candidates.
