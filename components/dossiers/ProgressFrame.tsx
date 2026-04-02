import React from 'react';

interface ProgressFrameProps {
  progress: number;
  progressLine: string;
}

export function ProgressFrame({ progress, progressLine }: ProgressFrameProps) {
  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between text-sm">
        <span className="text-[var(--text-secondary)]">Progress</span>
        <span className="font-medium text-[var(--text-primary)]">{progress}%</span>
      </div>
      <div className="h-2 w-full rounded-full bg-[rgba(255,255,255,0.07)]">
        <div
          className="h-2 rounded-full bg-gradient-to-r from-[#5e8ef2] to-[#83aeff] transition-all duration-300"
          style={{ width: `${progress}%` }}
        />
      </div>
      <p className="text-sm leading-6 text-[var(--text-secondary)]">{progressLine}</p>
    </div>
  );
}
