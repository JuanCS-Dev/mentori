/**
 * Empty States - Componentes para estados vazios
 *
 * UX para quando não há dados a exibir
 */

import React from 'react';
import {
  FileQuestion,
  BookOpen,
  Target,
  Award,
  TrendingUp,
  Calendar,
  Search,
  Inbox,
  Frown,
  Sparkles
} from 'lucide-react';

// ===== BASE EMPTY STATE =====

interface EmptyStateProps {
  icon?: React.ReactNode;
  title: string;
  description?: string;
  action?: {
    label: string;
    onClick: () => void;
  };
  className?: string;
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  icon,
  title,
  description,
  action,
  className = ''
}) => (
  <div className={`flex flex-col items-center justify-center py-12 px-4 text-center ${className}`}>
    {icon && (
      <div className="w-16 h-16 rounded-full bg-gray-800 flex items-center justify-center mb-4">
        {icon}
      </div>
    )}
    <h3 className="text-lg font-bold text-gray-300 mb-2">{title}</h3>
    {description && (
      <p className="text-sm text-gray-500 max-w-sm mb-4">{description}</p>
    )}
    {action && (
      <button
        onClick={action.onClick}
        className="px-4 py-2 bg-violet-600 hover:bg-violet-700 text-white rounded-lg font-medium transition-colors"
      >
        {action.label}
      </button>
    )}
  </div>
);

// ===== SPECIFIC EMPTY STATES =====

export const NoQuestions: React.FC<{ onLoad?: () => void }> = ({ onLoad }) => (
  <EmptyState
    icon={<FileQuestion size={28} className="text-gray-500" />}
    title="Nenhuma questão encontrada"
    description="Não encontramos questões com os filtros selecionados. Tente ajustar os filtros ou carregar mais questões."
    action={onLoad ? { label: 'Carregar Questões', onClick: onLoad } : undefined}
  />
);

export const NoProgress: React.FC<{ onStart?: () => void }> = ({ onStart }) => (
  <EmptyState
    icon={<TrendingUp size={28} className="text-gray-500" />}
    title="Sem dados de progresso"
    description="Comece a resolver questões para ver seu progresso aqui. Cada questão respondida ajuda a construir sua análise."
    action={onStart ? { label: 'Começar Agora', onClick: onStart } : undefined}
  />
);

export const NoBadges: React.FC<{ onExplore?: () => void }> = ({ onExplore }) => (
  <EmptyState
    icon={<Award size={28} className="text-gray-500" />}
    title="Nenhuma conquista ainda"
    description="Continue estudando para desbloquear badges. Responda questões, mantenha seu streak e alcance milestones!"
    action={onExplore ? { label: 'Ver Conquistas', onClick: onExplore } : undefined}
  />
);

export const NoStudyPlan: React.FC<{ onCreate?: () => void }> = ({ onCreate }) => (
  <EmptyState
    icon={<Calendar size={28} className="text-gray-500" />}
    title="Sem plano de estudos"
    description="Configure seu plano de estudos para ter um cronograma personalizado baseado no edital e suas metas."
    action={onCreate ? { label: 'Criar Plano', onClick: onCreate } : undefined}
  />
);

export const NoEdital: React.FC<{ onUpload?: () => void }> = ({ onUpload }) => (
  <EmptyState
    icon={<BookOpen size={28} className="text-gray-500" />}
    title="Nenhum edital carregado"
    description="Carregue um edital para ter acesso a análises personalizadas, plano de estudos verticalizado e mais."
    action={onUpload ? { label: 'Carregar Edital', onClick: onUpload } : undefined}
  />
);

export const NoSearchResults: React.FC<{ query?: string; onClear?: () => void }> = ({
  query,
  onClear
}) => (
  <EmptyState
    icon={<Search size={28} className="text-gray-500" />}
    title="Nenhum resultado"
    description={query ? `Não encontramos resultados para "${query}". Tente usar termos diferentes.` : 'Sua busca não retornou resultados.'}
    action={onClear ? { label: 'Limpar Busca', onClick: onClear } : undefined}
  />
);

export const NoErrors: React.FC = () => (
  <EmptyState
    icon={<Sparkles size={28} className="text-emerald-500" />}
    title="Nenhum erro registrado!"
    description="Parabéns! Você não tem questões erradas para revisar. Continue assim!"
  />
);

export const NoHistory: React.FC<{ onStart?: () => void }> = ({ onStart }) => (
  <EmptyState
    icon={<Inbox size={28} className="text-gray-500" />}
    title="Histórico vazio"
    description="Seu histórico de estudos aparecerá aqui. Comece uma sessão para registrar suas atividades."
    action={onStart ? { label: 'Iniciar Sessão', onClick: onStart } : undefined}
  />
);

export const GenericEmpty: React.FC<{ message?: string }> = ({
  message = 'Nada para exibir'
}) => (
  <EmptyState
    icon={<Frown size={28} className="text-gray-500" />}
    title={message}
  />
);

// ===== ERROR STATE =====

interface ErrorStateProps {
  title?: string;
  message?: string;
  onRetry?: () => void;
}

export const ErrorState: React.FC<ErrorStateProps> = ({
  title = 'Erro ao carregar',
  message = 'Ocorreu um erro inesperado. Por favor, tente novamente.',
  onRetry
}) => (
  <div className="flex flex-col items-center justify-center py-12 px-4 text-center">
    <div className="w-16 h-16 rounded-full bg-red-500/10 flex items-center justify-center mb-4">
      <Frown size={28} className="text-red-500" />
    </div>
    <h3 className="text-lg font-bold text-gray-300 mb-2">{title}</h3>
    <p className="text-sm text-gray-500 max-w-sm mb-4">{message}</p>
    {onRetry && (
      <button
        onClick={onRetry}
        className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg font-medium transition-colors"
      >
        Tentar Novamente
      </button>
    )}
  </div>
);

// ===== COMING SOON =====

interface ComingSoonProps {
  feature: string;
  description?: string;
}

export const ComingSoon: React.FC<ComingSoonProps> = ({
  feature,
  description
}) => (
  <div className="flex flex-col items-center justify-center py-12 px-4 text-center">
    <div className="w-16 h-16 rounded-full bg-violet-500/10 flex items-center justify-center mb-4">
      <Sparkles size={28} className="text-violet-500" />
    </div>
    <h3 className="text-lg font-bold text-gray-300 mb-2">
      {feature}
    </h3>
    <p className="text-sm text-gray-500 max-w-sm">
      {description || 'Esta funcionalidade estará disponível em breve. Fique ligado!'}
    </p>
    <div className="mt-4 px-3 py-1 bg-violet-500/10 text-violet-400 text-xs font-medium rounded-full">
      Em desenvolvimento
    </div>
  </div>
);

export default {
  EmptyState,
  NoQuestions,
  NoProgress,
  NoBadges,
  NoStudyPlan,
  NoEdital,
  NoSearchResults,
  NoErrors,
  NoHistory,
  GenericEmpty,
  ErrorState,
  ComingSoon
};
