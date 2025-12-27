/**
 * Loading States - Componentes de carregamento
 *
 * Skeleton loaders e spinners para UX polish
 */

import React from 'react';
import { Loader2 } from 'lucide-react';

// ===== SPINNER =====

interface SpinnerProps {
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

export const Spinner: React.FC<SpinnerProps> = ({
  size = 'md',
  className = ''
}) => {
  const sizes = {
    sm: 'w-4 h-4',
    md: 'w-6 h-6',
    lg: 'w-8 h-8'
  };

  return (
    <Loader2 className={`animate-spin text-violet-500 ${sizes[size]} ${className}`} />
  );
};

// ===== FULL PAGE LOADER =====

interface PageLoaderProps {
  message?: string;
}

export const PageLoader: React.FC<PageLoaderProps> = ({
  message = 'Carregando...'
}) => {
  return (
    <div className="fixed inset-0 bg-gray-900 flex flex-col items-center justify-center z-50">
      <div className="relative">
        {/* Outer ring */}
        <div className="w-16 h-16 border-4 border-violet-500/20 rounded-full" />
        {/* Spinning ring */}
        <div className="absolute inset-0 w-16 h-16 border-4 border-transparent border-t-violet-500 rounded-full animate-spin" />
        {/* Logo/icon in center */}
        <div className="absolute inset-0 flex items-center justify-center">
          <span className="text-2xl">📚</span>
        </div>
      </div>
      <p className="mt-4 text-gray-400 text-sm font-medium">{message}</p>
    </div>
  );
};

// ===== SKELETON COMPONENTS =====

interface SkeletonProps {
  className?: string;
}

export const Skeleton: React.FC<SkeletonProps> = ({ className = '' }) => (
  <div className={`animate-pulse bg-gray-700 rounded ${className}`} />
);

export const SkeletonText: React.FC<{ lines?: number; className?: string }> = ({
  lines = 3,
  className = ''
}) => (
  <div className={`space-y-2 ${className}`}>
    {Array.from({ length: lines }).map((_, i) => (
      <Skeleton
        key={i}
        className={`h-4 ${i === lines - 1 ? 'w-3/4' : 'w-full'}`}
      />
    ))}
  </div>
);

export const SkeletonCard: React.FC<{ className?: string }> = ({ className = '' }) => (
  <div className={`bg-gray-800 rounded-xl p-4 ${className}`}>
    <div className="flex items-center gap-3 mb-4">
      <Skeleton className="w-10 h-10 rounded-full" />
      <div className="flex-1">
        <Skeleton className="h-4 w-1/3 mb-2" />
        <Skeleton className="h-3 w-1/2" />
      </div>
    </div>
    <SkeletonText lines={2} />
  </div>
);

export const SkeletonQuestion: React.FC = () => (
  <div className="bg-gray-800 rounded-xl p-6">
    <Skeleton className="h-4 w-1/4 mb-4" />
    <SkeletonText lines={3} className="mb-6" />
    <div className="space-y-3">
      {[1, 2, 3, 4, 5].map(i => (
        <div key={i} className="flex items-center gap-3">
          <Skeleton className="w-6 h-6 rounded-full" />
          <Skeleton className="h-4 flex-1" />
        </div>
      ))}
    </div>
  </div>
);

export const SkeletonList: React.FC<{ items?: number }> = ({ items = 5 }) => (
  <div className="space-y-3">
    {Array.from({ length: items }).map((_, i) => (
      <SkeletonCard key={i} />
    ))}
  </div>
);

export const SkeletonStats: React.FC = () => (
  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
    {[1, 2, 3, 4].map(i => (
      <div key={i} className="bg-gray-800 rounded-xl p-4">
        <Skeleton className="h-3 w-1/2 mb-2" />
        <Skeleton className="h-8 w-3/4" />
      </div>
    ))}
  </div>
);

// ===== INLINE LOADER =====

interface InlineLoaderProps {
  text?: string;
  size?: 'sm' | 'md';
}

export const InlineLoader: React.FC<InlineLoaderProps> = ({
  text = 'Carregando',
  size = 'md'
}) => (
  <div className="flex items-center gap-2 text-gray-400">
    <Spinner size={size === 'sm' ? 'sm' : 'md'} />
    <span className={size === 'sm' ? 'text-xs' : 'text-sm'}>{text}...</span>
  </div>
);

// ===== BUTTON LOADING =====

interface ButtonLoadingProps {
  isLoading: boolean;
  loadingText?: string;
  children: React.ReactNode;
  className?: string;
  onClick?: () => void;
  disabled?: boolean;
}

export const ButtonWithLoading: React.FC<ButtonLoadingProps> = ({
  isLoading,
  loadingText = 'Carregando',
  children,
  className = '',
  onClick,
  disabled
}) => (
  <button
    onClick={onClick}
    disabled={disabled || isLoading}
    className={`flex items-center justify-center gap-2 transition-all ${
      isLoading ? 'opacity-70 cursor-not-allowed' : ''
    } ${className}`}
  >
    {isLoading ? (
      <>
        <Spinner size="sm" />
        <span>{loadingText}...</span>
      </>
    ) : (
      children
    )}
  </button>
);

// ===== PROGRESS BAR =====

interface ProgressBarProps {
  progress: number; // 0-100
  label?: string;
  showPercentage?: boolean;
  color?: string;
  className?: string;
}

export const ProgressBar: React.FC<ProgressBarProps> = ({
  progress,
  label,
  showPercentage = true,
  color = 'bg-violet-500',
  className = ''
}) => (
  <div className={className}>
    {(label || showPercentage) && (
      <div className="flex justify-between text-sm text-gray-400 mb-1">
        {label && <span>{label}</span>}
        {showPercentage && <span>{Math.round(progress)}%</span>}
      </div>
    )}
    <div className="h-2 bg-gray-700 rounded-full overflow-hidden">
      <div
        className={`h-full ${color} rounded-full transition-all duration-500`}
        style={{ width: `${Math.min(100, Math.max(0, progress))}%` }}
      />
    </div>
  </div>
);

export default {
  Spinner,
  PageLoader,
  Skeleton,
  SkeletonText,
  SkeletonCard,
  SkeletonQuestion,
  SkeletonList,
  SkeletonStats,
  InlineLoader,
  ButtonWithLoading,
  ProgressBar
};
