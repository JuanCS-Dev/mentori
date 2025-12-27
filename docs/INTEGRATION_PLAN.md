# PLANO DE INTEGRAÇÃO - Airgaps Críticos

> **Data**: 2025-12-27
> **Status**: PENDENTE
> **Prioridade**: CRÍTICA

---

## RESUMO EXECUTIVO

Auditoria revelou que **10+ componentes/serviços** criados nos Sprints 4-8 estão **desconectados** da aplicação principal. Este documento detalha o plano de integração.

---

## AIRGAPS IDENTIFICADOS

### Categoria 1: Serviços Completamente Desconectados

| Serviço | Arquivo | Problema |
|---------|---------|----------|
| LevelSystem | `features/Gamification/LevelSystem.ts` | Só usado pelo LevelUpModal (também morto) |
| BadgeSystem | `features/Gamification/BadgeSystem.ts` | Zero imports |
| StreakService | `services/streakService.ts` | Zero imports |
| ScorePredictor | `services/scorePredictor.ts` | Usado por WeeklyReport (inacessível) |

### Categoria 2: Componentes UI Não Renderizados

| Componente | Arquivo | Problema |
|------------|---------|----------|
| LevelUpModal | `components/LevelUpModal.tsx` | Nunca renderizado |
| OfflineIndicator | `components/OfflineIndicator.tsx` | Não está no Layout |
| WeeklyReport | `features/WeeklyReport.tsx` | Sem rota no App.tsx |
| Charts | `components/Charts.tsx` | Só usado por WeeklyReport |

### Categoria 3: Funções Não Chamadas

| Função | Arquivo | Problema |
|--------|---------|----------|
| generateExplanation() | `services/geminiService.ts` | Nunca chamada |
| generateExplanationsBatch() | `services/geminiService.ts` | Nunca chamada |

### Categoria 4: Duplicação de Lógica

| Funcionalidade | Novo (não usado) | Legado (em uso) |
|----------------|------------------|-----------------|
| XP/Level | LevelSystem.ts | usePersistence.ts:243-246 |
| Streak | streakService.ts | usePersistence.ts:259-280 |

---

## PLANO DE INTEGRAÇÃO

### FASE 1: Gamificação (LevelSystem + BadgeSystem)

#### 1.1 Refatorar usePersistence.ts

**Arquivo**: `hooks/usePersistence.ts`

**Ação**: Substituir lógica inline de XP por LevelService

```typescript
// ANTES (linha 243-246):
const xpGained = isCorrect ? 25 : 10;
const newXp = prev.xp + xpGained;
const newLevel = Math.floor(newXp / 500) + 1;

// DEPOIS:
import { LevelService } from '../features/Gamification/LevelSystem';

const result = LevelService.addXP(
  prev.xp,
  isCorrect ? 'question_correct' : 'question_wrong'
);
const newXp = result.newTotalXP;
const newLevel = result.newLevel;
// Guardar result.leveledUp para trigger do modal
```

**Campos adicionais em UserProgress**:
```typescript
interface UserProgress {
  // ... existentes
  pendingLevelUp?: LevelUpResult; // Para trigger do modal
  badges: string[]; // IDs dos badges conquistados
  streakFreezesUsed: number;
  streakFreezeAvailable: boolean;
}
```

#### 1.2 Integrar BadgeService

**Arquivo**: `hooks/usePersistence.ts` (função recordQuestionAnswer)

**Ação**: Após registrar resposta, verificar badges

```typescript
import { BadgeService, BADGES } from '../features/Gamification/BadgeSystem';

// Após atualizar stats:
const userStats = {
  totalQuestions: prev.questionsAnswered + 1,
  correctAnswers: prev.questionsCorrect + (isCorrect ? 1 : 0),
  currentStreak: newStreak,
  // ... outros stats
};

const newBadges = BadgeService.checkUnlockable(
  { unlockedIds: prev.badges, history: [] },
  userStats
);

// Se há novos badges, adicionar à lista
```

#### 1.3 Renderizar LevelUpModal

**Arquivo**: `App.tsx`

**Ação**: Adicionar estado e modal

```tsx
import { LevelUpModal } from './components/LevelUpModal';

// No componente App:
const [levelUpData, setLevelUpData] = useState<LevelUpResult | null>(null);

// No JSX, após Layout:
{levelUpData && (
  <LevelUpModal
    result={levelUpData}
    onClose={() => setLevelUpData(null)}
  />
)}
```

**Trigger**: Usar Context ou prop drilling para comunicar level up do usePersistence para App.

---

### FASE 2: Streak Service

#### 2.1 Substituir lógica de streak

**Arquivo**: `hooks/usePersistence.ts` (função recordStudyTime)

**Ação**: Usar StreakService

```typescript
import { StreakService } from '../services/streakService';

// ANTES: lógica inline de streak
// DEPOIS:
const streakData = {
  currentStreak: prev.streakDays,
  lastActivityDate: prev.lastStudyDate,
  freezesRemaining: prev.streakFreezeAvailable ? 1 : 0,
  freezeLastUsedWeek: prev.freezeLastUsedWeek
};

const update = StreakService.recordActivity(streakData);
const newStreak = update.newStreak;
```

#### 2.2 Adicionar UI de Streak Freeze

**Arquivo**: `components/StreakWidget.tsx`

**Ação**: Mostrar opção de freeze quando em risco

```tsx
import { StreakService } from '../services/streakService';

// Verificar se está em risco
const isAtRisk = StreakService.isAtRisk(streakData);

// Mostrar botão de freeze se disponível e em risco
{isAtRisk && freezeAvailable && (
  <button onClick={handleUseFreeze}>Usar Freeze</button>
)}
```

---

### FASE 3: PWA/Offline

#### 3.1 Adicionar OfflineIndicator ao Layout

**Arquivo**: `components/Layout.tsx`

**Ação**: Importar e renderizar

```tsx
import { OfflineIndicator } from './OfflineIndicator';

// No JSX, no topo do layout:
<OfflineIndicator variant="banner" showPendingCount />
```

---

### FASE 4: WeeklyReport + Charts

#### 4.1 Adicionar rota WeeklyReport

**Arquivo**: `App.tsx`

**Ação**: Adicionar ao lazy loading e renderização

```tsx
const WeeklyReport = React.lazy(() =>
  import('./features/WeeklyReport').then(m => ({ default: m.WeeklyReport }))
);

// No enum AppView (types.ts):
WEEKLY_REPORT = 'weekly_report',

// No JSX:
{currentView === AppView.WEEKLY_REPORT && <WeeklyReport />}
```

#### 4.2 Adicionar link no menu

**Arquivo**: `components/Layout.tsx`

**Ação**: Adicionar item de navegação

```tsx
{ view: AppView.WEEKLY_REPORT, label: 'Relatório', icon: <FileText size={20} /> },
```

---

### FASE 5: AI Explanations

#### 5.1 Background job para gerar explicações

**Arquivo**: Criar `hooks/useExplanationGenerator.ts`

```typescript
export function useExplanationGenerator() {
  useEffect(() => {
    const generateMissing = async () => {
      const questions = await QuestionsDB.getQuestionsWithoutExplanation(10);

      for (const q of questions) {
        try {
          const explanation = await GeminiService.generateExplanation(
            q.enunciado,
            q.alternativas,
            q.gabarito,
            q.disciplina,
            q.banca
          );
          await QuestionsDB.updateExplanation(q.id, explanation);
        } catch (e) {
          console.error('Failed to generate explanation:', e);
        }
      }
    };

    // Rodar em idle
    if ('requestIdleCallback' in window) {
      requestIdleCallback(() => generateMissing());
    }
  }, []);
}
```

#### 5.2 Mostrar explicação no QuestionCard

**Arquivo**: `components/QuestionCard.tsx`

**Ação**: Exibir explicação após responder

```tsx
{showAnswer && question.explicacao && (
  <div className="mt-4 p-4 bg-blue-50 rounded-lg">
    <h4>Explicação</h4>
    <p>{question.explicacao.explicacao_correta}</p>
    <p className="text-sm">{question.explicacao.dica_memoravel}</p>
  </div>
)}
```

---

### FASE 6: Loading/Empty States

#### 6.1 Usar LoadingStates

**Arquivos**: Todos os componentes com loading

**Ação**: Substituir loaders inline

```tsx
import { SkeletonQuestion, PageLoader } from '../components/LoadingStates';

// ANTES:
{loading && <div>Carregando...</div>}

// DEPOIS:
{loading && <SkeletonQuestion />}
```

#### 6.2 Usar EmptyStates centralizados

**Arquivo**: `features/QuestionBank.tsx`

**Ação**: Usar componentes de EmptyStates.tsx

```tsx
import { NoQuestions } from '../components/EmptyStates';

// Substituir EmptyState local por NoQuestions
```

---

## ORDEM DE EXECUÇÃO

| # | Fase | Estimativa | Dependências |
|---|------|------------|--------------|
| 1 | Gamificação (1.1-1.3) | 2h | Nenhuma |
| 2 | Streak Service (2.1-2.2) | 1h | Fase 1 |
| 3 | PWA/Offline (3.1) | 30min | Nenhuma |
| 4 | WeeklyReport (4.1-4.2) | 1h | Nenhuma |
| 5 | AI Explanations (5.1-5.2) | 1.5h | Nenhuma |
| 6 | Loading/Empty States (6.1-6.2) | 1h | Nenhuma |

**Total estimado**: ~7 horas de trabalho

---

## VALIDAÇÃO

Após cada fase, verificar:

1. `npm test` - Testes passando
2. `npm run typecheck` - Sem erros de tipo
3. Teste manual da feature
4. Verificar console para erros

---

## ARQUIVOS A MODIFICAR

| Arquivo | Fases |
|---------|-------|
| `hooks/usePersistence.ts` | 1, 2 |
| `App.tsx` | 1, 4 |
| `components/Layout.tsx` | 3, 4 |
| `components/StreakWidget.tsx` | 2 |
| `components/QuestionCard.tsx` | 5, 6 |
| `features/QuestionBank.tsx` | 6 |
| `types.ts` | 1, 4 |

---

## NOTAS

- **Padrão visual**: PRESERVAR A TODO CUSTO
- **Testes**: Manter 100% passing
- **Commits**: Um commit por fase completada
