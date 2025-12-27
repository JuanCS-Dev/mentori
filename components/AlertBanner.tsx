/**
 * AlertBanner - Sistema de Alertas de Progresso
 *
 * Exibe alertas contextuais baseados no progresso do usuário:
 * - Desvio de meta (abaixo/acima)
 * - Countdown para prova
 * - Disciplinas negligenciadas
 * - Streak de estudos
 */

import React from 'react';
import {
  AlertTriangle,
  TrendingUp,
  TrendingDown,
  Clock,
  Flame,
  Target,
  X,
  ChevronRight
} from 'lucide-react';

export type AlertType = 'critical' | 'warning' | 'success' | 'info';

export interface AlertData {
  id: string;
  type: AlertType;
  title: string;
  message: string;
  action?: {
    label: string;
    onClick: () => void;
  };
  dismissible?: boolean;
}

interface AlertBannerProps {
  alerts: AlertData[];
  onDismiss?: (id: string) => void;
}

const ALERT_CONFIG = {
  critical: {
    bg: 'bg-red-50',
    border: 'border-red-200',
    icon: AlertTriangle,
    iconColor: 'text-red-500',
    titleColor: 'text-red-800',
    textColor: 'text-red-700',
    buttonBg: 'bg-red-600 hover:bg-red-700',
    pulse: true
  },
  warning: {
    bg: 'bg-amber-50',
    border: 'border-amber-200',
    icon: TrendingDown,
    iconColor: 'text-amber-500',
    titleColor: 'text-amber-800',
    textColor: 'text-amber-700',
    buttonBg: 'bg-amber-600 hover:bg-amber-700',
    pulse: false
  },
  success: {
    bg: 'bg-emerald-50',
    border: 'border-emerald-200',
    icon: TrendingUp,
    iconColor: 'text-emerald-500',
    titleColor: 'text-emerald-800',
    textColor: 'text-emerald-700',
    buttonBg: 'bg-emerald-600 hover:bg-emerald-700',
    pulse: false
  },
  info: {
    bg: 'bg-blue-50',
    border: 'border-blue-200',
    icon: Clock,
    iconColor: 'text-blue-500',
    titleColor: 'text-blue-800',
    textColor: 'text-blue-700',
    buttonBg: 'bg-blue-600 hover:bg-blue-700',
    pulse: false
  }
};

export const AlertBanner: React.FC<AlertBannerProps> = ({ alerts, onDismiss }) => {
  if (alerts.length === 0) return null;

  return (
    <div className="space-y-3">
      {alerts.map(alert => {
        const config = ALERT_CONFIG[alert.type];
        const Icon = config.icon;

        return (
          <div
            key={alert.id}
            className={`${config.bg} ${config.border} border rounded-xl p-4 ${config.pulse ? 'animate-pulse' : ''}`}
          >
            <div className="flex items-start gap-3">
              <div className={`p-2 rounded-lg ${config.bg}`}>
                <Icon size={18} className={config.iconColor} />
              </div>

              <div className="flex-1 min-w-0">
                <h4 className={`font-mono font-bold text-sm ${config.titleColor}`}>
                  {alert.title}
                </h4>
                <p className={`text-sm mt-1 ${config.textColor}`}>
                  {alert.message}
                </p>

                {alert.action && (
                  <button
                    onClick={alert.action.onClick}
                    className={`mt-3 ${config.buttonBg} text-white px-4 py-1.5 rounded-lg font-mono text-xs font-bold flex items-center gap-1 transition-colors`}
                  >
                    {alert.action.label}
                    <ChevronRight size={14} />
                  </button>
                )}
              </div>

              {alert.dismissible && onDismiss && (
                <button
                  onClick={() => onDismiss(alert.id)}
                  className="text-gray-400 hover:text-gray-600 transition-colors"
                >
                  <X size={18} />
                </button>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
};

/**
 * Hook para gerar alertas baseados no progresso
 */
export function generateProgressAlerts(
  goalProgress: {
    deviationPercent: number;
    status: 'on_track' | 'ahead' | 'behind' | 'critical';
    dailyPercentage: number;
  },
  countdown?: {
    daysRemaining: number;
    isUrgent: boolean;
  },
  _streak?: number // Prefixed with _ to indicate intentionally unused for now
): AlertData[] {
  const alerts: AlertData[] = [];

  // Alerta de desvio de meta
  if (goalProgress.status === 'critical') {
    alerts.push({
      id: 'goal_critical',
      type: 'critical',
      title: 'Meta em Risco',
      message: `Você está ${Math.abs(goalProgress.deviationPercent).toFixed(0)}% abaixo da meta semanal. Intensifique os estudos agora!`,
      dismissible: false
    });
  } else if (goalProgress.status === 'behind') {
    alerts.push({
      id: 'goal_behind',
      type: 'warning',
      title: 'Abaixo da Meta',
      message: `Você está ${Math.abs(goalProgress.deviationPercent).toFixed(0)}% abaixo da meta. Dedique mais tempo hoje.`,
      dismissible: true
    });
  } else if (goalProgress.status === 'ahead' && goalProgress.deviationPercent > 20) {
    alerts.push({
      id: 'goal_ahead',
      type: 'success',
      title: 'Acima da Meta!',
      message: `Excelente! ${goalProgress.deviationPercent.toFixed(0)}% acima da meta. Continue assim!`,
      dismissible: true
    });
  }

  // Alerta de countdown
  if (countdown) {
    if (countdown.daysRemaining <= 7) {
      alerts.push({
        id: 'countdown_urgent',
        type: 'critical',
        title: 'Prova em menos de 1 semana!',
        message: `Faltam apenas ${countdown.daysRemaining} dias. Foque em revisão e simulados.`,
        dismissible: false
      });
    } else if (countdown.daysRemaining <= 30) {
      alerts.push({
        id: 'countdown_month',
        type: 'warning',
        title: `${countdown.daysRemaining} dias para a prova`,
        message: 'Reta final! Priorize questões e revisões rápidas.',
        dismissible: true
      });
    }
  }

  // Alerta de progresso diário
  if (goalProgress.dailyPercentage < 30 && new Date().getHours() >= 18) {
    alerts.push({
      id: 'daily_behind',
      type: 'warning',
      title: 'Dia ainda não cumprido',
      message: `Apenas ${goalProgress.dailyPercentage.toFixed(0)}% da meta diária. Ainda dá tempo!`,
      dismissible: true
    });
  }

  return alerts;
}

/**
 * Componente de Streak Alert (conquista)
 */
interface StreakAlertProps {
  streak: number;
  onCelebrate?: () => void;
}

export const StreakAlert: React.FC<StreakAlertProps> = ({ streak, onCelebrate }) => {
  if (streak < 3) return null;

  const isMilestone = [7, 14, 30, 60, 100].includes(streak);

  return (
    <div className={`bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-200 rounded-xl p-4 ${isMilestone ? 'animate-pulse' : ''}`}>
      <div className="flex items-center gap-3">
        <div className="p-2 bg-amber-100 rounded-lg">
          <Flame size={18} className="text-amber-500" />
        </div>

        <div className="flex-1">
          <h4 className="font-mono font-bold text-sm text-amber-800 flex items-center gap-2">
            {isMilestone ? '🎉 MILESTONE!' : '🔥 Streak Ativo'}
          </h4>
          <p className="text-sm text-amber-700">
            {streak} dias consecutivos de estudo!
            {isMilestone && ' Conquista desbloqueada!'}
          </p>
        </div>

        {isMilestone && onCelebrate && (
          <button
            onClick={onCelebrate}
            className="bg-amber-500 hover:bg-amber-600 text-white px-4 py-1.5 rounded-lg font-mono text-xs font-bold transition-colors"
          >
            Celebrar
          </button>
        )}
      </div>
    </div>
  );
};

/**
 * Countdown Badge (para header/navbar)
 */
interface CountdownBadgeProps {
  daysRemaining: number;
  examName?: string;
}

export const CountdownBadge: React.FC<CountdownBadgeProps> = ({
  daysRemaining,
  examName = 'Prova'
}) => {
  const isUrgent = daysRemaining <= 30;
  const isCritical = daysRemaining <= 7;

  return (
    <div className={`flex items-center gap-2 px-3 py-1.5 rounded-lg border ${
      isCritical
        ? 'bg-red-50 border-red-200 text-red-700'
        : isUrgent
          ? 'bg-amber-50 border-amber-200 text-amber-700'
          : 'bg-blue-50 border-blue-200 text-blue-700'
    }`}>
      <Target size={14} className={isCritical ? 'animate-pulse' : ''} />
      <span className="font-mono text-xs font-bold">
        {daysRemaining}d → {examName}
      </span>
    </div>
  );
};
