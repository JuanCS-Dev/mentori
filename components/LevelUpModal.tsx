/**
 * LevelUpModal - Celebração de Level Up
 *
 * Modal animado que aparece quando o usuário sobe de nível.
 * Inclui confetti, som e feedback visual.
 */

import React, { useEffect, useState, useCallback } from 'react';
import { Star, ChevronUp, Award, Sparkles } from 'lucide-react';
import { LevelUpResult, getTitleForLevel, getColorForLevel } from '../features/Gamification/LevelSystem';

interface LevelUpModalProps {
  result: LevelUpResult;
  onClose: () => void;
  autoCloseMs?: number;
}

// Confetti particle
interface Particle {
  id: number;
  x: number;
  y: number;
  color: string;
  size: number;
  rotation: number;
  velocity: { x: number; y: number };
}

export const LevelUpModal: React.FC<LevelUpModalProps> = ({
  result,
  onClose,
  autoCloseMs = 5000
}) => {
  const [isVisible, setIsVisible] = useState(false);
  const [particles, setParticles] = useState<Particle[]>([]);

  // Animate in
  useEffect(() => {
    const timer = setTimeout(() => setIsVisible(true), 50);
    return () => clearTimeout(timer);
  }, []);

  // Generate confetti
  useEffect(() => {
    const colors = ['#FFD700', '#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', '#FFEAA7', '#DDA0DD'];
    const newParticles: Particle[] = [];

    for (let i = 0; i < 50; i++) {
      newParticles.push({
        id: i,
        x: Math.random() * 100,
        y: -10 - Math.random() * 20,
        color: colors[Math.floor(Math.random() * colors.length)]!,
        size: 4 + Math.random() * 8,
        rotation: Math.random() * 360,
        velocity: {
          x: (Math.random() - 0.5) * 3,
          y: 2 + Math.random() * 3
        }
      });
    }

    setParticles(newParticles);
  }, []);

  // Animate particles
  useEffect(() => {
    const interval = setInterval(() => {
      setParticles(prev => prev.map(p => ({
        ...p,
        x: p.x + p.velocity.x,
        y: p.y + p.velocity.y,
        rotation: p.rotation + 5,
        velocity: {
          x: p.velocity.x * 0.99,
          y: p.velocity.y + 0.1
        }
      })).filter(p => p.y < 120));
    }, 16);

    return () => clearInterval(interval);
  }, []);

  // Auto close
  useEffect(() => {
    if (autoCloseMs > 0) {
      const timer = setTimeout(() => {
        setIsVisible(false);
        setTimeout(onClose, 300);
      }, autoCloseMs);
      return () => clearTimeout(timer);
    }
  }, [autoCloseMs, onClose]);

  const handleClose = useCallback(() => {
    setIsVisible(false);
    setTimeout(onClose, 300);
  }, [onClose]);

  const levelColor = getColorForLevel(result.newLevel);
  const title = getTitleForLevel(result.newLevel);

  return (
    <div className={`fixed inset-0 z-50 flex items-center justify-center transition-opacity duration-300 ${
      isVisible ? 'opacity-100' : 'opacity-0'
    }`}>
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/80"
        onClick={handleClose}
      />

      {/* Confetti */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {particles.map(p => (
          <div
            key={p.id}
            className="absolute"
            style={{
              left: `${p.x}%`,
              top: `${p.y}%`,
              width: p.size,
              height: p.size,
              backgroundColor: p.color,
              transform: `rotate(${p.rotation}deg)`,
              borderRadius: Math.random() > 0.5 ? '50%' : '0',
              opacity: 1 - (p.y / 120)
            }}
          />
        ))}
      </div>

      {/* Modal */}
      <div className={`relative bg-gray-900 rounded-2xl border-2 border-opacity-50 p-8 max-w-sm w-full mx-4 transform transition-all duration-500 ${
        isVisible ? 'scale-100 translate-y-0' : 'scale-90 translate-y-4'
      }`} style={{ borderColor: levelColor }}>
        {/* Glow effect */}
        <div
          className="absolute inset-0 rounded-2xl opacity-20 blur-xl -z-10"
          style={{ backgroundColor: levelColor }}
        />

        {/* Level badge */}
        <div className="flex justify-center mb-6">
          <div
            className="relative w-24 h-24 rounded-full flex items-center justify-center animate-pulse"
            style={{ backgroundColor: `${levelColor}20`, border: `3px solid ${levelColor}` }}
          >
            <span className="text-4xl font-bold" style={{ color: levelColor }}>
              {result.newLevel}
            </span>
            <div className="absolute -top-2 -right-2">
              <Sparkles size={24} className="text-yellow-400 animate-spin" style={{ animationDuration: '3s' }} />
            </div>
          </div>
        </div>

        {/* Level up text */}
        <div className="text-center mb-6">
          <div className="flex items-center justify-center gap-2 mb-2">
            <ChevronUp size={20} className="text-emerald-400 animate-bounce" />
            <span className="text-emerald-400 font-bold text-lg">LEVEL UP!</span>
            <ChevronUp size={20} className="text-emerald-400 animate-bounce" />
          </div>

          <h2 className="text-2xl font-bold text-white mb-1">
            Nível {result.newLevel}
          </h2>

          <p className="text-gray-400">
            +{result.xpGained} XP
          </p>
        </div>

        {/* Title */}
        <div className="text-center mb-6">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full" style={{ backgroundColor: `${levelColor}20` }}>
            <Award size={16} style={{ color: levelColor }} />
            <span className="font-bold" style={{ color: levelColor }}>{title}</span>
          </div>
        </div>

        {/* New title unlocked */}
        {result.newTitleUnlocked && (
          <div className="bg-gradient-to-r from-amber-500/10 to-orange-500/10 border border-amber-500/30 rounded-xl p-4 mb-6">
            <div className="flex items-center gap-3">
              <Star size={24} className="text-amber-400 animate-pulse" />
              <div>
                <p className="text-amber-400 font-bold text-sm">Novo Título Desbloqueado!</p>
                <p className="text-white font-bold text-lg">{result.newTitleUnlocked}</p>
              </div>
            </div>
          </div>
        )}

        {/* Progress to next */}
        <div className="text-center text-sm text-gray-500 mb-6">
          {result.newLevel < 100 ? (
            <>Continue estudando para alcançar o nível {result.newLevel + 1}!</>
          ) : (
            <>Você alcançou o nível máximo! Parabéns, Marechal!</>
          )}
        </div>

        {/* Close button */}
        <button
          onClick={handleClose}
          className="w-full py-3 rounded-xl font-bold text-white transition-all hover:scale-105"
          style={{ backgroundColor: levelColor }}
        >
          Continuar
        </button>
      </div>
    </div>
  );
};

// ===== BADGE UNLOCK MODAL =====

import { Badge, RARITY_CONFIG, BadgeRarity } from '../features/Gamification/BadgeSystem';

interface BadgeUnlockModalProps {
  badge: Badge;
  onClose: () => void;
}

export const BadgeUnlockModal: React.FC<BadgeUnlockModalProps> = ({
  badge,
  onClose
}) => {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setIsVisible(true), 50);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsVisible(false);
      setTimeout(onClose, 300);
    }, 4000);
    return () => clearTimeout(timer);
  }, [onClose]);

  const rarityColors: Record<string, string> = {
    common: '#9CA3AF',
    uncommon: '#10B981',
    rare: '#3B82F6',
    epic: '#8B5CF6',
    legendary: '#F59E0B'
  };

  const color = rarityColors[badge.rarity] || '#9CA3AF';

  return (
    <div className={`fixed bottom-4 right-4 z-50 transition-all duration-300 ${
      isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'
    }`}>
      <div
        className="bg-gray-900 rounded-xl border-2 p-4 max-w-xs shadow-2xl"
        style={{ borderColor: color }}
      >
        <div className="flex items-center gap-3">
          <div
            className="text-4xl p-2 rounded-lg"
            style={{ backgroundColor: `${color}20` }}
          >
            {badge.icon}
          </div>
          <div className="flex-1">
            <p className="text-xs font-bold uppercase" style={{ color }}>
              Badge Desbloqueado!
            </p>
            <p className="text-white font-bold">{badge.name}</p>
            <p className="text-xs text-gray-400">{badge.description}</p>
            <p className="text-xs mt-1" style={{ color }}>+{RARITY_CONFIG[badge.rarity as BadgeRarity]?.xp || 25} XP</p>
          </div>
        </div>
      </div>
    </div>
  );
};

// ===== STREAK MILESTONE TOAST =====

interface StreakMilestoneToastProps {
  days: number;
  xpReward: number;
  onClose: () => void;
}

export const StreakMilestoneToast: React.FC<StreakMilestoneToastProps> = ({
  days,
  xpReward,
  onClose
}) => {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setIsVisible(true), 50);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsVisible(false);
      setTimeout(onClose, 300);
    }, 4000);
    return () => clearTimeout(timer);
  }, [onClose]);

  return (
    <div className={`fixed top-4 left-1/2 -translate-x-1/2 z-50 transition-all duration-300 ${
      isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-4'
    }`}>
      <div className="bg-gradient-to-r from-amber-500 to-orange-500 rounded-xl px-6 py-4 shadow-2xl flex items-center gap-4">
        <span className="text-4xl animate-bounce">🔥</span>
        <div>
          <p className="text-white font-bold text-lg">
            {days} dias de Streak!
          </p>
          <p className="text-white/80 text-sm">
            +{xpReward} XP de bônus!
          </p>
        </div>
      </div>
    </div>
  );
};

export default LevelUpModal;
