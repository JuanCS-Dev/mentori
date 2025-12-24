import React from 'react';
import {
  Target,
  Flame,
  Award,
  CheckCircle,
  Clock,
  Zap,
  Star,
  Trophy,
  ArrowUp,
  ArrowDown,
  Minus,
  BrainCircuit
} from 'lucide-react';
import { useProgress } from '../hooks/usePersistence';

// Integration of Quantum Leap Components
import { XPDisplay } from './Gamification/XPDisplay';
import { StreakWidget } from '../components/StreakWidget';
import { RecommendationWidget } from '../components/RecommendationWidget';
import { MasteryGrid } from '../components/MasteryGrid';

/**
 * ProgressDashboard - O coração da motivação do concurseiro
 *
 * Mostra progresso real, celebra conquistas, identifica pontos fracos.
 * Feito com amor para quem está lutando por um sonho.
 */
export const ProgressDashboard: React.FC = () => {
  const { progress, getAccuracy } = useProgress();

  // Calcular tendência baseado na taxa de acerto atual
  const getTrend = (accuracy: number) => {
    if (accuracy >= 70) return { icon: ArrowUp, color: 'text-emerald-500', label: 'Excelente' };
    if (accuracy >= 50) return { icon: Minus, color: 'text-amber-500', label: 'Estável' };
    return { icon: ArrowDown, color: 'text-red-500', label: 'Precisa atenção' };
  };

  // Mensagem motivacional baseada no progresso
  const getMotivationalMessage = () => {
    const accuracy = getAccuracy();
    const streak = progress.streakDays;

    if (progress.questionsAnswered === 0) {
      return {
        title: "Sua jornada começa agora!",
        message: "Cada questão respondida é um passo em direção à aprovação. Vamos começar?",
        emoji: "🚀"
      };
    }

    if (streak >= 7) {
      return {
        title: `${streak} dias de fogo! 🔥`,
        message: "Sua consistência é admirável. Continue assim e a aprovação é questão de tempo.",
        emoji: "👑"
      };
    }

    if (accuracy >= 80) {
      return {
        title: "Você está voando!",
        message: `${accuracy}% de acertos! Seu domínio do conteúdo está ficando sólido.`,
        emoji: "⭐"
      };
    }

    if (accuracy >= 60) {
      return {
        title: "No caminho certo!",
        message: "Bom progresso! Foque nas disciplinas com menor taxa de acerto.",
        emoji: "💪"
      };
    }

    return {
      title: "Cada erro é aprendizado",
      message: "Não desanime! Analise seus erros e transforme-os em conhecimento.",
      emoji: "🌱"
    };
  };

  const motivation = getMotivationalMessage();
  const accuracy = getAccuracy();
  const trend = getTrend(accuracy);

  return (
    <div className="max-w-6xl mx-auto animate-in fade-in duration-500 space-y-8">
      {/* HEADER MOTIVACIONAL */}
      <div className="bg-gradient-to-br from-indigo-600 via-purple-600 to-pink-500 rounded-3xl p-8 text-white relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
        <div className="absolute bottom-0 left-0 w-48 h-48 bg-white/10 rounded-full blur-2xl translate-y-1/2 -translate-x-1/2" />

        <div className="relative z-10">
          <div className="flex items-center gap-3 mb-4">
            <div className="text-4xl">{motivation.emoji}</div>
            <div>
              <h1 className="text-3xl font-bold">{motivation.title}</h1>
              <p className="text-white/80 text-lg">{motivation.message}</p>
            </div>
          </div>

          {/* XP BAR & LEVEL - Replaced with Quantum Leap Component */}
          <div className="mt-6 bg-white/20 rounded-2xl p-4 backdrop-blur-sm">
            <div className="flex items-center gap-4">
              <div className="p-2 bg-white/20 rounded-full">
                <Trophy className="text-yellow-300" size={24} />
              </div>
              <div className="flex-1">
                <XPDisplay />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* STATS CARDS */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard
          icon={CheckCircle}
          label="Questões"
          value={progress.questionsAnswered}
          subtext={`${progress.questionsCorrect} certas`}
          color="emerald"
        />
        <StatCard
          icon={Target}
          label="Taxa de Acerto"
          value={`${accuracy}%`}
          subtext={<span className={`flex items-center gap-1 ${trend.color}`}>
            <trend.icon size={14} /> {trend.label}
          </span>}
          color="blue"
        />
        <div className="bg-white rounded-2xl p-4 border border-orange-100 shadow-sm flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-orange-50 text-orange-600 rounded-lg">
              <Flame size={20} />
            </div>
            <div>
              <div className="text-xs text-slate-500 uppercase font-bold">Streak</div>
              <StreakWidget />
            </div>
          </div>
        </div>
        <StatCard
          icon={Clock}
          label="Tempo Total"
          value={formatStudyTime(progress.totalStudyMinutes)}
          subtext="de estudo"
          color="purple"
        />
      </div>

      {/* PERFORMANCE POR DISCIPLINA - Replaced with Mastery Heatmap */}
      <div className="glass-card rounded-3xl p-6">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-indigo-100 rounded-xl">
              <BrainCircuit className="text-indigo-600" size={24} />
            </div>
            <div>
              <h2 className="text-xl font-bold text-slate-800">Mapa de Calor Cerebral</h2>
              <p className="text-slate-500 text-sm">Mas visualização de domínio por Tópico (Interleaving)</p>
            </div>
          </div>
        </div>

        <MasteryGrid />
      </div>

      {/* CONQUISTAS */}
      <div className="glass-card rounded-3xl p-6">
        <div className="flex items-center gap-3 mb-6">
          <div className="p-2 bg-amber-100 rounded-xl">
            <Award className="text-amber-600" size={24} />
          </div>
          <div>
            <h2 className="text-xl font-bold text-slate-800">Conquistas</h2>
            <p className="text-slate-500 text-sm">Marcos da sua jornada</p>
          </div>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <AchievementCard
            icon={Star}
            title="Primeira Questão"
            description="Respondeu sua primeira questão"
            unlocked={progress.questionsAnswered >= 1}
          />
          <AchievementCard
            icon={Zap}
            title="Centurião"
            description="100 questões respondidas"
            unlocked={progress.questionsAnswered >= 100}
            progress={Math.min(progress.questionsAnswered, 100)}
            total={100}
          />
          <AchievementCard
            icon={Flame}
            title="Em Chamas"
            description="7 dias de streak"
            unlocked={progress.streakDays >= 7}
            progress={Math.min(progress.streakDays, 7)}
            total={7}
          />
          <AchievementCard
            icon={Trophy}
            title="Mestre"
            description="80% de acerto geral"
            unlocked={accuracy >= 80 && progress.questionsAnswered >= 50}
          />
        </div>
      </div>

      {/* RECOMENDAÇÃO INTELIGENTE - Replaced with Recommendation Engine */}
      <div className="mt-8">
        <h3 className="font-bold text-slate-800 mb-3 flex items-center gap-2 px-2">
          <Target size={18} className="text-indigo-600" />
          Próximos Passos (IA)
        </h3>
        <RecommendationWidget />
      </div>
    </div>
  );
};

// Componente de card de estatística
interface StatCardProps {
  icon: React.FC<{ size?: number; className?: string }>;
  label: string;
  value: string | number;
  subtext: React.ReactNode;
  color: 'emerald' | 'blue' | 'orange' | 'purple';
  highlight?: boolean;
}

const StatCard: React.FC<StatCardProps> = ({ icon: Icon, label, value, subtext, color, highlight }) => {
  const colors = {
    emerald: 'bg-emerald-50 text-emerald-600',
    blue: 'bg-blue-50 text-blue-600',
    orange: 'bg-orange-50 text-orange-600',
    purple: 'bg-purple-50 text-purple-600'
  };

  return (
    <div className={`glass-card rounded-2xl p-4 ${highlight ? 'ring-2 ring-orange-400 ring-offset-2' : ''}`}>
      <div className={`w-10 h-10 rounded-xl ${colors[color]} flex items-center justify-center mb-3`}>
        <Icon size={20} />
      </div>
      <div className="text-2xl font-bold text-slate-800">{value}</div>
      <div className="text-sm text-slate-500">{label}</div>
      <div className="text-xs text-slate-400 mt-1">{subtext}</div>
    </div>
  );
};

// Componente de conquista
interface AchievementCardProps {
  icon: React.FC<{ size?: number; className?: string }>;
  title: string;
  description: string;
  unlocked: boolean;
  progress?: number;
  total?: number;
}

const AchievementCard: React.FC<AchievementCardProps> = ({
  icon: Icon,
  title,
  description,
  unlocked,
  progress,
  total
}) => {
  return (
    <div className={`p-4 rounded-2xl border-2 transition-all ${unlocked
        ? 'bg-gradient-to-br from-amber-50 to-yellow-50 border-amber-200'
        : 'bg-slate-50 border-slate-200 opacity-60'
      }`}>
      <div className={`w-12 h-12 rounded-full flex items-center justify-center mb-3 ${unlocked ? 'bg-amber-400 text-white' : 'bg-slate-200 text-slate-400'
        }`}>
        <Icon size={24} />
      </div>
      <h4 className={`font-bold ${unlocked ? 'text-slate-800' : 'text-slate-500'}`}>
        {title}
      </h4>
      <p className="text-xs text-slate-500 mt-1">{description}</p>
      {progress !== undefined && total !== undefined && !unlocked && (
        <div className="mt-2">
          <div className="h-1.5 bg-slate-200 rounded-full overflow-hidden">
            <div
              className="h-full bg-amber-400 rounded-full"
              style={{ width: `${(progress / total) * 100}%` }}
            />
          </div>
          <p className="text-xs text-slate-400 mt-1">{progress}/{total}</p>
        </div>
      )}
    </div>
  );
};

// Helpers
function formatStudyTime(minutes: number): string {
  if (minutes < 60) return `${minutes}min`;
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  return mins > 0 ? `${hours}h ${mins}m` : `${hours}h`;
}
