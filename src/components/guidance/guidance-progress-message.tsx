'use client';

import {
  type GuidanceProgressMessagePresentation,
} from '@/src/components/guidance/guidance-presentation-contracts';
import {
  getGuidanceMotionClassName,
  type GuidanceMotionTimingProfile,
} from '@/src/components/guidance/guidance-motion-timing';

interface GuidanceProgressMessageProps {
  message: GuidanceProgressMessagePresentation;
  timingProfile?: GuidanceMotionTimingProfile;
  messageId?: string;
  isBusy?: boolean;
}

export function GuidanceProgressMessage({
  message,
  timingProfile = 'smooth',
  messageId,
  isBusy = false,
}: GuidanceProgressMessageProps) {
  return (
    <div
      id={messageId}
      role="status"
      aria-live="polite"
      aria-atomic="true"
      aria-busy={isBusy || undefined}
      data-progress-message-state={message.state}
      data-guidance-motion-profile={timingProfile}
      className={[
        'rounded-[20px] border px-5 py-4 sm:px-6 shadow-[0_12px_28px_rgba(5,12,22,0.12)]',
        getGuidanceMotionClassName(timingProfile),
        getToneClassName(message.tone),
      ].join(' ')}
    >
      <div className="space-y-1.5">
        <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-[var(--text-secondary)]">
          {message.eyebrow}
        </p>
        <h2 className="text-lg font-semibold tracking-[-0.03em] text-[var(--text-primary)]">
          {message.title}
        </h2>
        <p className="text-sm leading-6 text-[var(--text-secondary)]">
          {message.statusLine}
        </p>
      </div>
    </div>
  );
}

function getToneClassName(tone: GuidanceProgressMessagePresentation['tone']) {
  switch (tone) {
    case 'progress':
      return 'border-[rgba(109,156,255,0.2)] bg-[linear-gradient(180deg,rgba(109,156,255,0.08),rgba(255,255,255,0.025)_72%)]';
    case 'steady':
      return 'border-[rgba(114,213,154,0.16)] bg-[linear-gradient(180deg,rgba(114,213,154,0.07),rgba(255,255,255,0.025)_72%)]';
    default:
      return 'border-[var(--border-subtle)] bg-[rgba(255,255,255,0.028)]';
  }
}
