# Mentori

**Plataforma de estudos com IA para concursos publicos.**

Estude 3x mais rapido com plano personalizado, 700+ questoes reais e mentor IA 24/7.

[![Tests](https://img.shields.io/badge/tests-193%20passing-brightgreen)]()
[![TypeScript](https://img.shields.io/badge/TypeScript-strict-blue)]()
[![License](https://img.shields.io/badge/license-MIT-green)]()

---

## Demonstracao

```
Landing Page -> Dashboard Hub -> Ciclo de Estudos -> Banco de Questoes
```

**URL:** [mentori.app](https://mentori.app) *(em breve)*

---

## Funcionalidades

### Para o Usuario

| Feature | Descricao |
|---------|-----------|
| **Analise de Edital** | IA extrai disciplinas, pesos e cronograma automaticamente |
| **Plano Personalizado** | Baseado em neurociencia e perfil cognitivo |
| **700+ Questoes Reais** | CEBRASPE, FGV com explicacoes detalhadas |
| **Revisao Espacada** | Algoritmo SM-2 para nunca esquecer |
| **Mentor IA 24/7** | Chat com especialista virtual |
| **Simulados** | Formato oficial das bancas |
| **Gamificacao** | XP, niveis, badges e streaks |
| **Progresso** | Dashboard com predicao de nota |

### Algoritmos (Science-Backed)

- **Elo Rating** - Dificuldade adaptativa por performance
- **SM-2+ Spaced Repetition** - Intervalos otimizados de revisao
- **Interleaved Practice** - 70% topic switch para retencao
- **Score Prediction** - Nota estimada com intervalo de confianca
- **Circuit Breaker** - Resiliencia em chamadas de IA

---

## Quick Start

```bash
# Instalar dependencias
npm install

# Rodar em desenvolvimento
npm run dev

# Build para producao
npm run build

# Rodar testes
npm test
```

### Variaveis de Ambiente

Crie `.env.local`:

```env
VITE_GEMINI_API_KEY=sua_api_key_aqui
VITE_GOOGLE_CLOUD_PROJECT=seu_projeto  # opcional, para Vertex AI
VITE_MENTOR_CHAT_URL=url_cloud_function  # opcional
```

---

## Estrutura do Projeto

```
mentori/
├── components/              # Componentes UI reutilizaveis
│   ├── Charts.tsx              # Graficos SVG (sem deps)
│   ├── QuestionCard.tsx        # Card de questao
│   ├── QuestionControls.tsx    # Controles de filtro
│   ├── LoadingStates.tsx       # Skeletons
│   └── LevelUpModal.tsx        # Modais de gamificacao
│
├── features/                # Modulos de funcionalidade
│   ├── SalesLanding/           # Landing page de vendas
│   │   ├── SalesHero.tsx
│   │   ├── PainPoints.tsx
│   │   ├── Solution.tsx
│   │   ├── Features.tsx
│   │   ├── Testimonials.tsx
│   │   ├── Pricing.tsx
│   │   ├── FAQ.tsx
│   │   └── CTASection.tsx
│   │
│   ├── DashboardHub/           # Dashboard principal
│   │   ├── WelcomeCard.tsx
│   │   ├── QuickStats.tsx
│   │   ├── TodayPlan.tsx
│   │   ├── QuickActions.tsx
│   │   └── EmbeddedChat.tsx
│   │
│   ├── QuestionBank/           # Banco de questoes
│   │   ├── index.tsx
│   │   └── components.tsx
│   │
│   ├── Gamification/           # Sistema de XP e badges
│   │   ├── LevelSystem.ts
│   │   └── BadgeSystem.ts
│   │
│   ├── StudyCycle.tsx          # Ciclo de estudos
│   ├── WeeklyReport.tsx        # Relatorio semanal
│   ├── EditalAnalyzer.tsx      # Analisador de edital
│   ├── BankProfiler.tsx        # Perfil da banca
│   ├── StudyPlanner.tsx        # Planejador de estudos
│   ├── MaterialGenerator.tsx   # Gerador de material
│   ├── DiscursiveMentor.tsx    # Mentor de discursivas
│   └── ProgressDashboard.tsx   # Dashboard de progresso
│
├── services/                # Logica de negocio
│   ├── geminiService.ts        # Integracao Gemini AI
│   ├── geminiConfig.ts         # Configuracao AI
│   ├── database.ts             # IndexedDB (Dexie)
│   ├── questionsService.ts     # Servico de questoes
│   ├── spacedRepetition.ts     # Algoritmo SM-2
│   ├── eloService.ts           # Sistema Elo
│   ├── scorePredictor.ts       # Predicao de nota
│   ├── studyScheduler.ts       # Agendador de estudos
│   ├── streakService.ts        # Sistema de streak
│   ├── syncService.ts          # Sincronizacao offline
│   └── chaosOrchestrator.ts    # Resiliencia
│
├── hooks/                   # React Hooks customizados
│   ├── usePersistence.ts       # Estado persistente
│   ├── useQuestionReview.ts    # Revisao SM-2
│   └── useExplanationGenerator.ts
│
├── contexts/                # React Contexts
│   └── MentorContext.tsx       # Estado do mentor IA
│
├── docs/                    # Documentacao
│   ├── PLATAFORMAS_SETUP.md    # Guia Kiwify/Hotmart
│   └── CODE_CONSTITUTION.md    # Padroes de codigo
│
└── public/
    ├── data/                   # JSONs de questoes
    ├── manifest.json           # PWA manifest
    └── sw.js                   # Service Worker
```

---

## Tech Stack

| Categoria | Tecnologia |
|-----------|------------|
| Framework | React 19 + TypeScript |
| Build | Vite |
| Testes | Vitest (193 testes) |
| Styling | Tailwind CSS |
| Database | Dexie (IndexedDB) |
| AI | Gemini 2.5 Flash/Pro |
| Icons | Lucide React |
| Deploy | Netlify |

---

## Testes

```bash
npm test              # Rodar testes (193 passing)
npm run test:coverage # Com cobertura
npm run typecheck     # Verificacao TypeScript
npm run lint          # ESLint
```

### Cobertura

- Services: 100%
- Hooks: 95%+
- Components: Core testados

---

## Deploy

### Netlify (Recomendado)

```bash
npm run build
netlify deploy --prod --dir=dist
```

Ou conecte o repositorio GitHub diretamente no Netlify.

### Variaveis no Netlify

```
VITE_GEMINI_API_KEY=xxx
VITE_MENTOR_CHAT_URL=xxx
```

---

## Monetizacao

O projeto esta preparado para venda em:

- **Kiwify** - Taxa: 8,99% + R$ 2,49
- **Hotmart** - Taxa: 9,90% + R$ 1,00

Consulte `docs/PLATAFORMAS_SETUP.md` para guia completo de configuracao.

### Modelo de Negocio

| Plano | Preco | Descricao |
|-------|-------|-----------|
| Mensal | R$ 47/mes | Acesso completo |
| Anual | R$ 397/ano | 30% desconto |

---

## Metodologia

Baseado em pesquisas e metodos comprovados:

| Fonte | Contribuicao |
|-------|--------------|
| Evandro Guedes | Ciclo de estudos, pesos do edital |
| Alexandre Meirelles | Revisao espacada para concursos |
| NIH Research (2025) | Spaced Repetition Science |
| ArXiv (2024) | Elo Rating in Education |

---

## Roadmap

- [x] Landing Page de vendas
- [x] Dashboard Hub unificado
- [x] Banco de 700+ questoes
- [x] Sistema de gamificacao completo
- [x] PWA com suporte offline
- [x] Guia de plataformas de venda
- [ ] Cloud Functions para chat
- [ ] Sistema de autenticacao
- [ ] App mobile (React Native)
- [ ] Programa de afiliados

---

## Contribuindo

1. Fork o projeto
2. Crie sua branch (`git checkout -b feature/nova-feature`)
3. Commit suas mudancas (`git commit -m 'Add nova feature'`)
4. Push para a branch (`git push origin feature/nova-feature`)
5. Abra um Pull Request

### Padroes de Codigo

- Arquivos < 500 linhas
- Zero TODOs/FIXMEs em producao
- Testes para novas features
- TypeScript strict mode

---

## License

MIT

---

## Autor

Feito com dedicacao para concurseiros brasileiros.

**Contato:** suporte@mentori.app
