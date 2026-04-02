'use client';

import React from 'react';
import { cn } from '@/lib/utils';
import { type ProgressAnalytics } from '@/src/lib/analytics/types';

interface ProgressAnalyticsPanelProps {
  analytics: ProgressAnalytics;
  className?: string;
}

export function ProgressAnalyticsPanel({ analytics, className }: ProgressAnalyticsPanelProps) {
  return (
    <div className={cn('ui-surface-secondary rounded-[18px] p-4 space-y-4', className)}>
      {/* Forecast Light - Most important signal */}
      <ForecastSection forecast={analytics.forecast} />

      {/* Velocity Trend */}
      <VelocitySection velocity={analytics.velocity} />

      {/* Health Trend */}
      <HealthSection health={analytics.health} />

      {/* Stall Patterns (if any) */}
      {analytics.stallPatterns.length > 0 && (
        <StallPatternsSection patterns={analytics.stallPatterns} />
      )}

      {/* Schedule Adherence */}
      <AdherenceSection adherence={analytics.scheduleAdherence} />
    </div>
  );
}

/**
 * Forecast Light - Main signal
 */
function ForecastSection({ forecast }: { forecast: ProgressAnalytics['forecast'] }) {
  const statusConfig = {
    'on-track': {
      icon: '✓',
      color: 'text-[var(--color-green)]',
      bgColor: 'bg-[var(--color-green)]/10',
      borderColor: 'border-[var(--color-green)]/30',
      label: 'Op schema',
    },
    'slight-delay': {
      icon: '~',
      color: 'text-[var(--accent-warning)]',
      bgColor: 'bg-[var(--accent-warning)]/10',
      borderColor: 'border-[var(--accent-warning)]/30',
      label: 'Lichte vertraging',
    },
    'increased-risk': {
      icon: '⚠',
      color: 'text-[var(--accent-warning)]',
      bgColor: 'bg-[var(--accent-warning)]/10',
      borderColor: 'border-[var(--accent-warning)]/30',
      label: 'Verhoogd risico',
    },
    'critical': {
      icon: '🚨',
      color: 'text-[var(--accent-error)]',
      bgColor: 'bg-[var(--accent-error)]/10',
      borderColor: 'border-[var(--accent-error)]/30',
      label: 'Kritiek',
    },
  };

  const config = statusConfig[forecast.status];
  const confidenceLabel = forecast.confidence === 'high' ? 'hoog vertrouwen' : forecast.confidence === 'medium' ? 'redelijk vertrouwen' : 'laag vertrouwen';

  return (
    <div className={cn('rounded-lg p-3 border', config.bgColor, config.borderColor)}>
      <div className="flex items-start gap-3">
        <span className={cn('text-lg', config.color)}>{config.icon}</span>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className={cn('text-sm font-semibold', config.color)}>{config.label}</span>
            <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-[rgba(255,255,255,0.1)] text-[var(--text-secondary)]">
              {confidenceLabel}
            </span>
          </div>
          <p className="text-xs text-[var(--text-primary)] mt-0.5">{forecast.explanation}</p>
          <p className="text-[10px] text-[var(--text-secondary)] mt-1.5 italic">{forecast.suggestion}</p>
        </div>
      </div>

      {/* Key factors */}
      {forecast.factors.length > 0 && (
        <div className="mt-3 pt-2 border-t border-[var(--border-subtle)]">
          <div className="flex flex-wrap gap-1.5">
            {forecast.factors.map((factor, i) => (
              <span
                key={i}
                className={cn(
                  'text-[9px] px-2 py-0.5 rounded-full',
                  factor.impact === 'positive' && 'bg-[var(--color-green)]/20 text-[var(--color-green)]',
                  factor.impact === 'negative' && 'bg-[var(--accent-error)]/20 text-[var(--accent-error)]',
                  factor.impact === 'neutral' && 'bg-[var(--text-secondary)]/20 text-[var(--text-secondary)]'
                )}
                title={factor.description}
              >
                {factor.description}
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

/**
 * Velocity Trend Section
 */
function VelocitySection({ velocity }: { velocity: ProgressAnalytics['velocity'] }) {
  const directionEmoji =
    velocity.direction === 'accelerating' ? '📈' :
    velocity.direction === 'slowing' ? '📉' :
    velocity.direction === 'stalled' ? '⏸️' : '➡️';

  return (
    <div className="rounded-lg bg-[rgba(255,255,255,0.03)] p-3">
      <div className="flex items-center justify-between mb-2">
        <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-[var(--text-secondary)]">
          Snelheid
        </p>
        <span className="text-sm">{directionEmoji}</span>
      </div>

      <p className="text-xs text-[var(--text-primary)]">{velocity.summary}</p>

      {/* Mini chart of last 4 weeks */}
      {velocity.recentWeeks.length > 0 && (
        <div className="mt-3 flex items-end gap-1 h-8">
          {velocity.recentWeeks.map((week, i) => {
            const maxTasks = Math.max(...velocity.recentWeeks.map(w => w.tasksCompleted), 1);
            const height = maxTasks > 0 ? (week.tasksCompleted / maxTasks) * 100 : 0;
            const isCurrent = i === velocity.recentWeeks.length - 1;

            return (
              <div
                key={week.week}
                className="flex-1 flex flex-col items-center gap-1"
                title={`${week.week}: ${week.tasksCompleted} taken, ${week.subtasksCompleted} subtasks`}
              >
                <div
                  className={cn(
                    'w-full rounded-sm min-h-[2px]',
                    isCurrent ? 'bg-[var(--accent-primary)]' : 'bg-[var(--text-secondary)]/30'
                  )}
                  style={{ height: `${Math.max(height, 10)}%` }}
                />
                <span className="text-[8px] text-[var(--text-secondary)]">
                  W{week.week.split('-W')[1]}
                </span>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

/**
 * Health Trend Section
 */
function HealthSection({ health }: { health: ProgressAnalytics['health'] }) {
  const directionEmoji =
    health.direction === 'improving' ? '↗️' :
    health.direction === 'declining' ? '↘️' : '➡️';

  const trendColor =
    health.direction === 'improving' ? 'text-[var(--color-green)]' :
    health.direction === 'declining' ? 'text-[var(--accent-error)]' : 'text-[var(--text-secondary)]';

  return (
    <div className="rounded-lg bg-[rgba(255,255,255,0.03)] p-3">
      <div className="flex items-center justify-between mb-2">
        <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-[var(--text-secondary)]">
          Dossier Health
        </p>
        <div className="flex items-center gap-1">
          <span className={cn('text-sm', trendColor)}>{directionEmoji}</span>
          <span className="text-sm font-semibold text-[var(--text-primary)]">{health.current}</span>
          <span className="text-xs text-[var(--text-secondary)]">/100</span>
        </div>
      </div>

      {/* Health bar */}
      <div className="h-1.5 bg-[rgba(255,255,255,0.1)] rounded-full overflow-hidden mb-2">
        <div
          className={cn(
            'h-full rounded-full transition-all',
            health.current > 70 ? 'bg-[var(--color-green)]' :
            health.current > 40 ? 'bg-[var(--accent-warning)]' : 'bg-[var(--accent-error)]'
          )}
          style={{ width: `${health.current}%` }}
        />
      </div>

      <p className="text-xs text-[var(--text-primary)]">{health.insight}</p>

      {/* Risk flags */}
      {health.riskFlags.length > 0 && (
        <div className="mt-2 flex flex-wrap gap-1">
          {health.riskFlags.map((flag, i) => (
            <span
              key={i}
              className="text-[9px] px-1.5 py-0.5 rounded bg-[var(--accent-error)]/20 text-[var(--accent-error)]"
            >
              {flag === 'health-declining-fast' && 'Snelle daling'}
              {flag === 'health-declining' && 'Health daalt'}
              {flag === 'stall-accumulating' && 'Stilstand stapelt'}
              {flag === 'blocker-increasing' && 'Meer blokkades'}
            </span>
          ))}
        </div>
      )}
    </div>
  );
}

/**
 * Stall Patterns Section
 */
function StallPatternsSection({ patterns }: { patterns: ProgressAnalytics['stallPatterns'] }) {
  return (
    <div className="rounded-lg bg-[var(--accent-warning)]/5 p-3">
      <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-[var(--accent-warning)] mb-2">
        Stilstand Patronen
      </p>

      <div className="space-y-2">
        {patterns.map((pattern, i) => (
          <div key={i} className="flex items-start gap-2">
            <span className="text-[var(--accent-warning)] text-xs">⏸</span>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <span className="text-xs text-[var(--text-primary)]">{pattern.category}</span>
                <span className="text-[10px] text-[var(--text-secondary)]">
                  {pattern.stalledCount}/{pattern.totalTasks} ({Math.round(pattern.stallRate * 100)}%)
                </span>
              </div>
              <p className="text-[10px] text-[var(--text-secondary)]">{pattern.insight}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

/**
 * Schedule Adherence Section
 */
function AdherenceSection({ adherence }: { adherence: ProgressAnalytics['scheduleAdherence'] }) {
  const trendEmoji =
    adherence.recentTrend === 'improving' ? '↗️' :
    adherence.recentTrend === 'declining' ? '↘️' : '➡️';

  const trendColor =
    adherence.recentTrend === 'improving' ? 'text-[var(--color-green)]' :
    adherence.recentTrend === 'declining' ? 'text-[var(--accent-error)]' : 'text-[var(--text-secondary)]';

  return (
    <div className="rounded-lg bg-[rgba(255,255,255,0.03)] p-3">
      <div className="flex items-center justify-between mb-2">
        <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-[var(--text-secondary)]">
          Planning Discipline
        </p>
        <div className="flex items-center gap-1">
          <span className={cn('text-xs', trendColor)}>{trendEmoji}</span>
          <span className="text-sm font-semibold text-[var(--text-primary)]">{adherence.adherenceRate}%</span>
        </div>
      </div>

      <p className="text-xs text-[var(--text-primary)]">{adherence.insight}</p>

      {adherence.completionsTracked < 5 && (
        <p className="text-[10px] text-[var(--text-secondary)] mt-1">
          Gebaseerd op {adherence.completionsTracked} voltooide taken - nog beperkt
        </p>
      )}
    </div>
  );
}
