import React from 'react';
import { type ChatMessageData, type AIResponseContent } from '@/components/chat/ChatMessage';
import { cn } from '@/lib/utils';

interface GuidanceHistoryFeedProps {
  messages: ChatMessageData[];
}

function getLabel(message: ChatMessageData): string {
  if (message.role === 'user') {
    return 'You asked';
  }

  switch (message.messageType) {
    case 'milestone':
      return 'Progress signal';
    case 'refined':
      return 'Guidance update';
    case 'followup':
      return 'Execution update';
    case 'nudge':
      return 'Coach note';
    case 'initial':
      return 'Initial read';
    default:
      return 'Guidance';
  }
}

export function GuidanceHistoryFeed({ messages }: GuidanceHistoryFeedProps) {
  if (messages.length === 0) {
    return null;
  }

  return (
    <div className="ui-surface-secondary space-y-4 p-5">
      <div className="space-y-2">
        <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-[var(--text-secondary)]">
          Recent guidance updates
        </p>
        <p className="text-sm leading-6 text-[var(--text-secondary)]">
          Earlier prompts and guidance remain visible here when you need the full context.
        </p>
      </div>

      <div className="space-y-3">
        {messages.map((message) => {
          const isUser = message.role === 'user';
          const aiContent = !isUser ? (message.content as AIResponseContent) : null;
          return (
            <div
              key={message.id}
              className={cn(
                'rounded-[16px] border px-4 py-3',
                isUser
                  ? 'border-[rgba(94,142,242,0.2)] bg-[rgba(94,142,242,0.08)]'
                  : 'border-[var(--border-subtle)] bg-[rgba(255,255,255,0.03)]'
              )}
            >
              <div className="flex items-center justify-between gap-3">
                <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-[var(--text-secondary)]">
                  {getLabel(message)}
                </p>
                <p className="text-[11px] uppercase tracking-[0.12em] text-[var(--text-muted)]">
                  {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </p>
              </div>
              <div className="mt-2 text-sm leading-6 text-[var(--text-secondary)]">
                {isUser ? (
                  <p>{message.content as string}</p>
                ) : (
                  <div className="space-y-2">
                    <p>{aiContent?.summary}</p>
                    {aiContent?.next_step && (
                      <p className="text-[var(--text-primary)]">
                        <span className="font-semibold text-[var(--accent-primary-strong)]">Next:</span> {aiContent.next_step}
                      </p>
                    )}
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
