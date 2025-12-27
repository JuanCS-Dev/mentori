/**
 * Lightweight Chart Components
 *
 * Pure SVG/CSS charts without external dependencies.
 * Used for analytics and progress visualization.
 */

import React, { useMemo } from 'react';

// ===== TYPES =====

export interface DataPoint {
  label: string;
  value: number;
  color?: string;
}

export interface LineChartData {
  date: string;
  value: number;
}

// ===== LINE CHART =====

interface LineChartProps {
  data: LineChartData[];
  height?: number;
  showGrid?: boolean;
  showDots?: boolean;
  color?: string;
  fillGradient?: boolean;
  className?: string;
}

export const LineChart: React.FC<LineChartProps> = ({
  data,
  height = 200,
  showGrid = true,
  showDots = true,
  color = '#8B5CF6',
  fillGradient = true,
  className = ''
}) => {
  const { points, minValue, maxValue, range } = useMemo(() => {
    if (data.length === 0) return { points: '', minValue: 0, maxValue: 100, range: 100 };

    const values = data.map(d => d.value);
    const min = Math.min(...values);
    const max = Math.max(...values);
    const r = max - min || 1;

    // Add padding
    const padding = r * 0.1;
    const minV = Math.max(0, min - padding);
    const maxV = max + padding;
    const rangeV = maxV - minV;

    // Calculate points for SVG path
    const width = 100;
    const h = height - 40; // Leave room for labels

    const pts = data.map((d, i) => {
      const x = (i / (data.length - 1 || 1)) * width;
      const y = h - ((d.value - minV) / rangeV) * h;
      return `${x.toFixed(2)},${y.toFixed(2)}`;
    }).join(' ');

    return { points: pts, minValue: minV, maxValue: maxV, range: rangeV };
  }, [data, height]);

  if (data.length === 0) {
    return (
      <div className={`flex items-center justify-center ${className}`} style={{ height }}>
        <p className="text-gray-500 text-sm">Sem dados</p>
      </div>
    );
  }

  // Generate gradient ID unique to this instance
  const gradientId = `gradient-${Math.random().toString(36).slice(2)}`;

  // Calculate closed polygon for fill
  const h = height - 40;
  const fillPoints = `0,${h} ${points} 100,${h}`;

  return (
    <div className={`relative ${className}`} style={{ height }}>
      <svg
        viewBox={`0 0 100 ${height}`}
        className="w-full h-full"
        preserveAspectRatio="none"
      >
        <defs>
          <linearGradient id={gradientId} x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor={color} stopOpacity="0.3" />
            <stop offset="100%" stopColor={color} stopOpacity="0" />
          </linearGradient>
        </defs>

        {/* Grid lines */}
        {showGrid && (
          <g className="text-gray-700">
            {[0, 25, 50, 75, 100].map(pct => (
              <line
                key={pct}
                x1="0"
                y1={(h * (100 - pct)) / 100}
                x2="100"
                y2={(h * (100 - pct)) / 100}
                stroke="currentColor"
                strokeWidth="0.2"
                strokeDasharray="2,2"
              />
            ))}
          </g>
        )}

        {/* Fill area */}
        {fillGradient && (
          <polygon
            points={fillPoints}
            fill={`url(#${gradientId})`}
          />
        )}

        {/* Line */}
        <polyline
          points={points}
          fill="none"
          stroke={color}
          strokeWidth="0.8"
          strokeLinecap="round"
          strokeLinejoin="round"
        />

        {/* Dots */}
        {showDots && data.map((d, i) => {
          const x = (i / (data.length - 1 || 1)) * 100;
          const y = h - ((d.value - minValue) / range) * h;
          return (
            <circle
              key={i}
              cx={x}
              cy={y}
              r="1.5"
              fill={color}
              className="hover:r-3 transition-all"
            />
          );
        })}
      </svg>

      {/* Y-axis labels */}
      <div className="absolute left-0 top-0 h-full flex flex-col justify-between text-xs text-gray-500 pr-2">
        <span>{Math.round(maxValue)}</span>
        <span>{Math.round(minValue)}</span>
      </div>

      {/* X-axis labels */}
      <div className="absolute bottom-0 left-0 right-0 flex justify-between text-xs text-gray-500 pt-1">
        <span>{data[0]?.date}</span>
        <span>{data[data.length - 1]?.date}</span>
      </div>
    </div>
  );
};

// ===== BAR CHART =====

interface BarChartProps {
  data: DataPoint[];
  height?: number;
  showLabels?: boolean;
  horizontal?: boolean;
  className?: string;
}

export const BarChart: React.FC<BarChartProps> = ({
  data,
  height = 200,
  showLabels = true,
  horizontal = false,
  className = ''
}) => {
  const maxValue = Math.max(...data.map(d => d.value), 1);

  if (horizontal) {
    return (
      <div className={`space-y-2 ${className}`}>
        {data.map((item, index) => (
          <div key={index}>
            {showLabels && (
              <div className="flex justify-between text-xs text-gray-400 mb-1">
                <span className="truncate">{item.label}</span>
                <span>{item.value}</span>
              </div>
            )}
            <div className="h-3 bg-gray-800 rounded-full overflow-hidden">
              <div
                className="h-full rounded-full transition-all duration-500"
                style={{
                  width: `${(item.value / maxValue) * 100}%`,
                  backgroundColor: item.color || '#8B5CF6'
                }}
              />
            </div>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className={`flex items-end gap-1 ${className}`} style={{ height }}>
      {data.map((item, index) => (
        <div
          key={index}
          className="flex-1 flex flex-col items-center gap-1"
        >
          <div
            className="w-full rounded-t transition-all duration-500"
            style={{
              height: `${(item.value / maxValue) * (height - 24)}px`,
              backgroundColor: item.color || '#8B5CF6',
              minHeight: 4
            }}
          />
          {showLabels && (
            <span className="text-xs text-gray-500 truncate w-full text-center">
              {item.label}
            </span>
          )}
        </div>
      ))}
    </div>
  );
};

// ===== HEATMAP =====

interface HeatmapCell {
  label: string;
  value: number; // 0-100
}

interface HeatmapProps {
  data: HeatmapCell[];
  columns?: number;
  showLabels?: boolean;
  className?: string;
}

export const Heatmap: React.FC<HeatmapProps> = ({
  data,
  columns = 7,
  showLabels = true,
  className = ''
}) => {
  const getColor = (value: number): string => {
    if (value >= 80) return '#10B981'; // emerald-500
    if (value >= 60) return '#3B82F6'; // blue-500
    if (value >= 40) return '#F59E0B'; // amber-500
    if (value >= 20) return '#F97316'; // orange-500
    return '#EF4444'; // red-500
  };

  return (
    <div
      className={`grid gap-1 ${className}`}
      style={{ gridTemplateColumns: `repeat(${columns}, 1fr)` }}
    >
      {data.map((cell, index) => (
        <div
          key={index}
          className="aspect-square rounded-sm relative group cursor-pointer"
          style={{ backgroundColor: getColor(cell.value) }}
          title={`${cell.label}: ${cell.value}%`}
        >
          {/* Tooltip on hover */}
          <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-1 opacity-0 group-hover:opacity-100 transition-opacity z-10 pointer-events-none">
            <div className="bg-gray-900 text-white text-xs px-2 py-1 rounded whitespace-nowrap">
              {cell.label}: {cell.value}%
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};

// ===== DONUT CHART =====

interface DonutChartProps {
  value: number; // 0-100
  size?: number;
  strokeWidth?: number;
  color?: string;
  bgColor?: string;
  showLabel?: boolean;
  label?: string;
  className?: string;
}

export const DonutChart: React.FC<DonutChartProps> = ({
  value,
  size = 120,
  strokeWidth = 10,
  color = '#8B5CF6',
  bgColor = '#374151',
  showLabel = true,
  label,
  className = ''
}) => {
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const progress = Math.min(Math.max(value, 0), 100);
  const offset = circumference - (progress / 100) * circumference;

  return (
    <div className={`relative inline-flex items-center justify-center ${className}`}>
      <svg
        width={size}
        height={size}
        className="transform -rotate-90"
      >
        {/* Background circle */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke={bgColor}
          strokeWidth={strokeWidth}
          fill="none"
        />
        {/* Progress circle */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke={color}
          strokeWidth={strokeWidth}
          fill="none"
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          className="transition-all duration-500"
        />
      </svg>
      {showLabel && (
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-2xl font-bold text-white">{Math.round(value)}</span>
          {label && <span className="text-xs text-gray-400">{label}</span>}
        </div>
      )}
    </div>
  );
};

// ===== PROGRESS SPARKLINE =====

interface SparklineProps {
  data: number[];
  width?: number;
  height?: number;
  color?: string;
  showTrend?: boolean;
}

export const Sparkline: React.FC<SparklineProps> = ({
  data,
  width = 80,
  height = 24,
  color = '#8B5CF6',
  showTrend = true
}) => {
  if (data.length < 2) return null;

  const min = Math.min(...data);
  const max = Math.max(...data);
  const range = max - min || 1;

  const points = data.map((v, i) => {
    const x = (i / (data.length - 1)) * width;
    const y = height - ((v - min) / range) * height;
    return `${x.toFixed(1)},${y.toFixed(1)}`;
  }).join(' ');

  const trend = data[data.length - 1]! - data[0]!;
  const trendColor = trend > 0 ? '#10B981' : trend < 0 ? '#EF4444' : '#6B7280';

  return (
    <div className="inline-flex items-center gap-1">
      <svg width={width} height={height} className="overflow-visible">
        <polyline
          points={points}
          fill="none"
          stroke={color}
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
      {showTrend && (
        <span className="text-xs font-medium" style={{ color: trendColor }}>
          {trend > 0 ? '↑' : trend < 0 ? '↓' : '→'}
        </span>
      )}
    </div>
  );
};

// ===== KNOWLEDGE MAP (Heatmap by discipline) =====

interface KnowledgeMapData {
  disciplina: string;
  accuracy: number;  // 0-100
  elo: number;
  questions: number;
}

interface KnowledgeMapProps {
  data: KnowledgeMapData[];
  onSelect?: (disciplina: string) => void;
  className?: string;
}

export const KnowledgeMap: React.FC<KnowledgeMapProps> = ({
  data,
  onSelect,
  className = ''
}) => {
  const getStatusColor = (elo: number, accuracy: number): { bg: string; text: string; status: string } => {
    if (elo >= 1400 && accuracy >= 75) {
      return { bg: 'bg-emerald-500/20', text: 'text-emerald-400', status: 'Expert' };
    }
    if (elo >= 1200 && accuracy >= 60) {
      return { bg: 'bg-blue-500/20', text: 'text-blue-400', status: 'Bom' };
    }
    if (elo >= 1000 && accuracy >= 40) {
      return { bg: 'bg-amber-500/20', text: 'text-amber-400', status: 'Regular' };
    }
    return { bg: 'bg-red-500/20', text: 'text-red-400', status: 'Fraco' };
  };

  const sorted = [...data].sort((a, b) => a.elo - b.elo);

  return (
    <div className={`space-y-2 ${className}`}>
      {sorted.map((item) => {
        const { bg, text, status } = getStatusColor(item.elo, item.accuracy);
        return (
          <button
            key={item.disciplina}
            onClick={() => onSelect?.(item.disciplina)}
            className={`w-full ${bg} rounded-lg p-3 flex items-center gap-3 hover:opacity-80 transition-opacity`}
          >
            <div className={`w-2 h-8 rounded-full ${text.replace('text', 'bg')}`} />
            <div className="flex-1 text-left">
              <div className="flex items-center gap-2">
                <span className="text-white font-medium truncate">{item.disciplina}</span>
                <span className={`text-xs ${text}`}>{status}</span>
              </div>
              <div className="flex items-center gap-3 text-xs text-gray-500">
                <span>Elo {item.elo}</span>
                <span>•</span>
                <span>{item.accuracy}% acertos</span>
                <span>•</span>
                <span>{item.questions} questões</span>
              </div>
            </div>
          </button>
        );
      })}
    </div>
  );
};
