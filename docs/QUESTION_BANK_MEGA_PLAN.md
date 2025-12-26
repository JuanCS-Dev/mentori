# 🏛️ PROJETO MEGA-QUESTÕES: A Revolução do Banco de Questões Interno

> **Autor**: Mentori AI - Deep Research Unit
> **Data**: Dezembro 2025
> **Status**: Plano de Implementação Aprovado para Revisão do Human Operator

---

## 📋 Sumário Executivo

Este documento apresenta o plano de implementação de um **sistema de resolução de questões interno** inspirado no QConcursos, porém com foco em:
1. **Zero impacto na performance** (Offline-first, client-side data)
2. **Simplicidade máxima** (Sem over-engineering, sem backend complexo)
3. **Qualidade visual de elite** (Seguindo o padrão minimalista da Landing Page)
4. **Explicações de erro de classe mundial** (Powered by Mentori AI)

---

## 🔬 Análise Competitiva: QConcursos DNA

### Funcionalidades Core Identificadas

| Feature | Descrição | Prioridade |
|---------|-----------|------------|
| **Banco de Questões Massivo** | Milhões de questões filtráveis por disciplina, banca, ano, dificuldade | P0 |
| **Caderno de Erros** | Questões que o aluno errou são salvas automaticamente para revisão | P0 |
| **Gabaritos Comentados** | Explicação detalhada do porquê da resposta correta | P0 |
| **Estatísticas de Desempenho** | Acertos/erros por matéria, banca, período | P1 |
| **Simulados Personalizados** | Criar simulados com N questões, tempo limite | P2 |
| **Raio-X de Temas** | Identificar os tópicos mais recorrentes em provas | P2 |

### O que NÃO vamos copiar (Over-engineering)
- ❌ Sistema de assinaturas complexo
- ❌ Comentários de usuários (social features)
- ❌ Videoaulas integradas
- ❌ Sistema de gamificação pesado

---

## 🏗️ Arquitetura Proposta: "Lean & Mean"

### Princípio Central: **Offline-First, Client-Only**

```
┌──────────────────────────────────────────────────────────────────┐
│                    FRONTEND (React + Vite)                       │
│  ┌─────────────────────────────────────────────────────────────┐ │
│  │                     QuestionBank Feature                    │ │
│  │  ┌──────────────┐  ┌──────────────┐  ┌──────────────────┐   │ │
│  │  │ QuestionCard │  │  FilterPanel │  │    StatsBar      │   │ │
│  │  └──────────────┘  └──────────────┘  └──────────────────┘   │ │
│  └─────────────────────────────────────────────────────────────┘ │
│                              │                                   │
│                              ▼                                   │
│  ┌─────────────────────────────────────────────────────────────┐ │
│  │                    DATA LAYER (Hooks)                        │ │
│  │  ┌─────────────────┐    ┌──────────────────────────────────┐ │ │
│  │  │ useQuestionBank │    │       useLiveQuery (Dexie)       │ │ │
│  │  └─────────────────┘    └──────────────────────────────────┘ │ │
│  └─────────────────────────────────────────────────────────────┘ │
│                              │                                   │
│                              ▼                                   │
│  ┌─────────────────────────────────────────────────────────────┐ │
│  │              PERSISTENCE LAYER (IndexedDB via Dexie.js)      │ │
│  │  ┌───────────────┐  ┌───────────────┐  ┌─────────────────┐  │ │
│  │  │   questions   │  │   attempts    │  │    userStats    │  │ │
│  │  │  (Banco DB)   │  │ (Histórico)   │  │  (Agregações)   │  │ │
│  │  └───────────────┘  └───────────────┘  └─────────────────┘  │ │
│  └─────────────────────────────────────────────────────────────┘ │
│                              │                                   │
│                              ▼                                   │
│  ┌─────────────────────────────────────────────────────────────┐ │
│  │                    EXTERNAL SOURCES                          │ │
│  │  ┌──────────────┐  ┌───────────────┐  ┌───────────────────┐ │ │
│  │  │ ENEM.dev API │  │ Static JSON   │  │   Gemini AI Gen   │ │ │
│  │  │  (Live API)  │  │ (Mock 1.4M+)  │  │  (On-Demand)      │ │ │
│  │  └──────────────┘  └───────────────┘  └───────────────────┘ │ │
│  └─────────────────────────────────────────────────────────────┘ │
└──────────────────────────────────────────────────────────────────┘
```

---

## 💾 Camada de Dados: IndexedDB + Dexie.js

### Por que IndexedDB (via Dexie.js)?

| Critério | localStorage | IndexedDB (Dexie) |
|----------|--------------|-------------------|
| **Capacidade** | 5-10 MB | 50%+ do disco (GBs) |
| **Performance** | Síncrono (Bloqueia UI) | Assíncrono (Zero Block) |
| **Tipos de Dados** | String only | Objetos, Arrays, Blobs |
| **Indexação** | Nenhuma | Full Indexes & Queries |
| **Busca** | Iteração manual | Queries performáticas |
| **Offline-First** | Limitado | Perfeito para PWA |

**Decisão**: **Dexie.js 4.x** (abstração limpa sobre IndexedDB + `useLiveQuery` para React)

### Schema do Banco de Dados

```typescript
// services/database.ts
import Dexie, { Table } from 'dexie';

export interface Question {
  id: string;                   // UUID único
  statement: string;            // Enunciado
  options: string[];            // Alternativas (A-E)
  correctAnswer: number;        // Índice (0-4)
  discipline: string;           // "Direito Constitucional"
  topic?: string;               // "Direitos Fundamentais"
  bank?: string;                // "FGV", "CEBRASPE"
  year?: number;                // 2024
  source: 'ai' | 'enem' | 'concurso'; // Origem
  difficulty?: 'Fácil' | 'Médio' | 'Difícil';
  comment?: string;             // Explicação do gabarito
  trap?: string;                // Pegadinha identificada
  createdAt: number;            // Timestamp
}

export interface Attempt {
  id?: number;                  // Auto-increment
  questionId: string;           // FK -> Question.id
  selectedAnswer: number;       // Índice da resposta escolhida
  isCorrect: boolean;           // Acertou?
  timeSpent?: number;           // Tempo em segundos
  autopsyDone?: boolean;        // Fez autópsia do erro?
  createdAt: number;            // Timestamp
}

export interface UserStats {
  id?: number;
  discipline: string;
  totalAttempts: number;
  correctAttempts: number;
  lastUpdated: number;
}

class MentoriDatabase extends Dexie {
  questions!: Table<Question, string>;
  attempts!: Table<Attempt, number>;
  userStats!: Table<UserStats, number>;

  constructor() {
    super('MentoriDB');
    
    this.version(1).stores({
      questions: 'id, discipline, bank, year, source, difficulty',
      attempts: '++id, questionId, isCorrect, createdAt',
      userStats: '++id, discipline'
    });
  }
}

export const db = new MentoriDatabase();
```

---

## 🔌 Hooks Reativos: A Magia do `useLiveQuery`

### Hook Principal: `useQuestionBank`

```typescript
// hooks/useQuestionBank.ts
import { useLiveQuery } from 'dexie-react-hooks';
import { db, Question, Attempt } from '../services/database';

interface QuestionFilters {
  discipline?: string;
  bank?: string;
  year?: number;
  source?: 'ai' | 'enem' | 'concurso';
  onlyErrors?: boolean; // Caderno de Erros
}

export function useQuestionBank(filters: QuestionFilters) {
  // Busca reativa - re-renderiza automaticamente quando dados mudam
  const questions = useLiveQuery(
    async () => {
      let query = db.questions.toCollection();

      if (filters.discipline) {
        query = db.questions.where('discipline').equals(filters.discipline);
      }
      // ... mais filtros

      return query.limit(50).toArray(); // Paginação leve
    },
    [filters], // Dependências
    [] // Valor default
  );

  // Total de questões para stats
  const totalCount = useLiveQuery(
    () => db.questions.count(),
    [],
    0
  );

  // Questões que o usuário errou (Caderno de Erros)
  const erroredQuestionIds = useLiveQuery(
    () => db.attempts
      .where('isCorrect')
      .equals(0)
      .toArray()
      .then(attempts => [...new Set(attempts.map(a => a.questionId))]),
    [],
    []
  );

  return {
    questions: questions || [],
    totalCount,
    erroredQuestionIds,
    isLoading: questions === undefined
  };
}
```

### Hook de Estatísticas: `useStudyStats`

```typescript
// hooks/useStudyStats.ts
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../services/database';

export function useStudyStats() {
  const stats = useLiveQuery(async () => {
    const attempts = await db.attempts.toArray();
    const total = attempts.length;
    const correct = attempts.filter(a => a.isCorrect).length;
    
    // Agrupamento por disciplina
    const byDiscipline = attempts.reduce((acc, attempt) => {
      // Nota: Precisamos fazer join com questions para pegar discipline
      // Isso pode ser otimizado com uma tabela de cache
      return acc;
    }, {} as Record<string, { total: number; correct: number }>);

    return {
      totalAttempts: total,
      accuracy: total > 0 ? Math.round((correct / total) * 100) : 0,
      todayAttempts: attempts.filter(a => 
        a.createdAt > Date.now() - 24 * 60 * 60 * 1000
      ).length,
      byDiscipline
    };
  }, [], {
    totalAttempts: 0,
    accuracy: 0,
    todayAttempts: 0,
    byDiscipline: {}
  });

  return stats;
}
```

---

## 🎨 Design System: Premium Minimalista

### Princípios Visuais (Extraídos da Landing)

| Elemento | Especificação |
|----------|---------------|
| **Background** | `bg-white` ou `bg-gray-50` |
| **Cards** | `bg-white border border-gray-200 rounded-xl shadow-sm` |
| **Botões Primários** | `bg-black text-white rounded-lg font-mono text-sm` |
| **Labels** | `text-[10px] font-bold text-gray-400 uppercase tracking-wider` |
| **Inputs** | `h-10 border-gray-200 rounded-lg font-mono` |
| **Tipografia** | `font-mono` para UI, `font-sans` para conteúdo |
| **Animações** | `transition-all duration-300` - Suaves, nunca chamativas |

### Componentes da Nova Question Resolution UI

```
┌────────────────────────────────────────────────────────────────┐
│  ┌─ FILTER BAR ─────────────────────────────────────────────┐  │
│  │ [DISCIPLINA ▼] [BANCA ▼] [ANO ▼] [🔍 SÓ ERROS]  [FILTRAR] │  │
│  └──────────────────────────────────────────────────────────┘  │
│                                                                │
│  ┌─ STATS BAR ──────────────────────────────────────────────┐  │
│  │ ⚡ 127 questões │ 📊 78% acerto │ 📝 15 hoje │ 🏆 45 XP   │  │
│  └──────────────────────────────────────────────────────────┘  │
│                                                                │
│  ┌─ QUESTION CARD (Premium) ─────────────────────────────────┐ │
│  │ ┌─ HEADER ─────────────────────────────────────────────┐  │ │
│  │ │ 📦 BANCO_DB  │   DIREITO CONSTITUCIONAL   │   FGV    │  │ │
│  │ └──────────────────────────────────────────────────────┘  │ │
│  │                                                           │ │
│  │  [Enunciado da questão em fonte grande e legível...]      │ │
│  │                                                           │ │
│  │  ┌─ OPÇÃO A ─────────────────────────────────────────┐    │ │
│  │  │ A │ Texto da alternativa A                        │    │ │
│  │  └───────────────────────────────────────────────────┘    │ │
│  │  ┌─ OPÇÃO B (SELECIONADA) ────────────────────────────┐   │ │
│  │  │ B │ Texto da alternativa B                  ████   │   │ │
│  │  └───────────────────────────────────────────────────┘    │ │
│  │  ...                                                      │ │
│  └───────────────────────────────────────────────────────────┘ │
│                                                                │
│  ┌─ FEEDBACK SECTION (Após Responder) ───────────────────────┐ │
│  │ ┌─ RESULTADO ─────────────────────────────────────────┐   │ │
│  │ │ ✅ CORRETO! ou ❌ INCORRETO                         │   │ │
│  │ └─────────────────────────────────────────────────────┘   │ │
│  │                                                           │ │
│  │ ┌─ EXPLICAÇÃO MENTORI ────────────────────────────────┐   │ │
│  │ │ │ Comentário pedagógico profundo com citação de     │   │ │
│  │ │ │ doutrina, jurisprudência e artigos de lei.        │   │ │
│  │ └─────────────────────────────────────────────────────┘   │ │
│  │                                                           │ │
│  │ [⚠️ PEGADINHA: Onde a banca tenta derrubar...]            │ │
│  │                                                           │ │
│  │ ┌─ AUTÓPSIA DO ERRO (Se errou) ───────────────────────┐   │ │
│  │ │ 🔬 DIAGNÓSTICO: Confundiu conceitos de X com Y      │   │ │
│  │ │ 💉 VACINA: "Lembre-se: A NUNCA pode B quando C"     │   │ │
│  │ └─────────────────────────────────────────────────────┘   │ │
│  │                                                           │ │
│  │ [🔄 PRÓXIMA]                           [📁 SALVAR ERRO]   │ │
│  └───────────────────────────────────────────────────────────┘ │
└────────────────────────────────────────────────────────────────┘
```

---

## 📁 Estrutura de Arquivos Proposta

```
src/
├── features/
│   └── QuestionBank/
│       ├── index.tsx              # Componente principal (Container)
│       ├── QuestionCard.tsx       # Card de questão (já existe, refatorar)
│       ├── FilterPanel.tsx        # Painel de filtros (NOVO)
│       ├── StatsBar.tsx           # Barra de estatísticas (já existe, refatorar)
│       ├── FeedbackSection.tsx    # Seção de feedback expandida (NOVO)
│       └── ErrorNotebook.tsx      # Caderno de erros (NOVO)
│
├── hooks/
│   ├── useQuestionBank.ts         # Hook principal de questões (NOVO)
│   ├── useStudyStats.ts           # Hook de estatísticas (NOVO)
│   └── usePersistence.ts          # Hook existente (manter)
│
├── services/
│   ├── database.ts                # Dexie.js setup (NOVO)
│   ├── questionsService.ts        # Já existe, refatorar para usar DB
│   ├── geminiService.ts           # Já existe (Mentori Persona)
│   └── questionSeeder.ts          # Seed inicial de questões (NOVO)
│
└── data/
    └── question-bank-seed.json    # JSON inicial com ~500 questões reais
```

---

## 🚀 Fases de Implementação

### FASE 1: Fundação (2-3 horas)
**Objetivo**: Estabelecer a camada de dados offline-first

1. [ ] Instalar Dexie.js: `npm install dexie dexie-react-hooks`
2. [ ] Criar `services/database.ts` com schema
3. [ ] Criar `hooks/useQuestionBank.ts` básico
4. [ ] Criar `data/question-bank-seed.json` com 50-100 questões manuais
5. [ ] Criar `services/questionSeeder.ts` para popular DB na primeira carga

**Teste de Validação**: Abrir DevTools > Application > IndexedDB > Verificar dados persistidos

---

### FASE 2: Integração com UI Existente (2-3 horas)
**Objetivo**: Conectar QuestionBank existente com nova camada de dados

1. [ ] Refatorar `features/QuestionBank.tsx` para usar `useQuestionBank`
2. [ ] Implementar `FilterPanel.tsx` com filtros reativos
3. [ ] Atualizar `StatsBar.tsx` para exibir dados reais do hook
4. [ ] Testar fluxo completo: filtrar → resolver → ver feedback

**Teste de Validação**: Filtrar por "Direito Constitucional" e resolver 3 questões

---

### FASE 3: Caderno de Erros (1-2 horas)
**Objetivo**: Implementar feature core de revisão de erros

1. [ ] Adicionar persistência de `Attempt` ao responder questão
2. [ ] Criar filtro "Só Erros" no `FilterPanel`
3. [ ] Implementar `ErrorNotebook.tsx` com lista de erros agrupados por disciplina
4. [ ] Adicionar botão "Salvar Erro para Revisão"

**Teste de Validação**: Errar 5 questões, ativar filtro "Só Erros", ver apenas as erradas

---

### FASE 4: Autópsia de Erro Automática (1-2 horas)
**Objetivo**: Integrar IA Mentori para explicação profunda de cada erro

1. [ ] Ao errar, chamar `GeminiService.analyzeQuestionError()` automaticamente
2. [ ] Exibir resultado da autópsia no `FeedbackSection`
3. [ ] Salvar autópsia no `Attempt` para consulta futura
4. [ ] Implementar estado de loading enquanto IA processa

**Teste de Validação**: Errar questão, ver spinner, receber autópsia detalhada

---

### FASE 5: Polimento Visual (1-2 horas)
**Objetivo**: Garantir padrão visual "Premium Minimalista"

1. [ ] Auditar todos os componentes contra o Design System da Landing
2. [ ] Ajustar cores, espaçamentos, tipografia conforme especificado
3. [ ] Adicionar micro-animações sutis (fade-in, slide-in)
4. [ ] Testar responsividade em mobile

**Teste de Validação**: Screenshot comparison com Landing Page - deve parecer "da mesma família"

---

## ⚠️ Riscos e Mitigações

| Risco | Impacto | Probabilidade | Mitigação |
|-------|---------|---------------|-----------|
| **IndexedDB não suportado** | Alto | Baixa (>97% browsers suportam) | Fallback para localStorage com limite de questões |
| **Quota de armazenamento excedida** | Médio | Baixa | Implementar LRU cache, limitar histórico a 90 dias |
| **Performance com 1M+ questões** | Alto | Média | Paginação rigorosa, índices otimizados, virtualização |
| **Dexie.js learning curve** | Baixo | Média | API é simples; documentação excelente |
| **Gemini API rate limit na Autópsia** | Médio | Média | Debounce, cache de autópsias, fallback para comentário estático |

---

## 📊 Métricas de Sucesso

| Métrica | Target | Como Medir |
|---------|--------|------------|
| **Tempo de carregamento inicial** | < 500ms | Lighthouse |
| **Tempo de filtro aplicado** | < 100ms | Performance API |
| **Tamanho do bundle adicionado** | < 50KB | Webpack analyzer |
| **Questões armazenáveis offline** | > 10.000 | Teste de stress |
| **Satisfação visual** | "Da mesma família da Landing" | User review |

---

## 🔮 Evolução Futura (Fora do Escopo Atual)

- [ ] PWA completa com Service Worker
- [ ] Sincronização com backend para questões crowdsourced
- [ ] Simulados com timer e ranking
- [ ] Integração com calendário de provas
- [ ] API pública do banco de questões

---

## ✅ Checklist de Aprovação

Antes de iniciar a implementação, o Human Operator deve validar:

- [ ] Arquitetura Lean está aprovada (sem over-engineering)
- [ ] Schema do banco está alinhado com necessidades
- [ ] Design System está claro e documentado
- [ ] Fases de implementação estão em ordem de prioridade correta
- [ ] Riscos e mitigações são aceitáveis
- [ ] Escopo está bem definido (sem feature creep)

---

**"Simplicidade é a sofisticação suprema." - Leonardo da Vinci**

*Este plano foi gerado com Deep Research 2025, analisando QConcursos, melhores práticas React, IndexedDB, e Dexie.js.*
