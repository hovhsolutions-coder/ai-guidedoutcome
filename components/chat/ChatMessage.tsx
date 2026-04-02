import React, { useState } from 'react';
import { cn } from '../../lib/utils';

export interface ChatMessageData {
  id: string;
  role: 'user' | 'ai';
  content: string | AIResponseContent;
  timestamp: Date;
  messageType?: 'initial' | 'followup' | 'nudge' | 'refined' | 'response' | 'milestone';
}

export interface AIResponseContent {
  summary: string;
  next_step: string;
  suggested_tasks: string[];
}

interface ChatMessageProps {
  message: ChatMessageData;
  phase?: string;
  onAddTask?: (task: string) => void;
}

function getMessageLabel(messageType?: string): { label: string; color: string } {
  switch (messageType) {
    case 'initial':
      return { label: 'Initial Assessment', color: 'text-[var(--accent-primary-strong)]' };
    case 'followup':
      return { label: 'Task Added', color: 'text-[var(--success-strong)]' };
    case 'nudge':
      return { label: 'Encouragement', color: 'text-[var(--warning-strong)]' };
    case 'refined':
      return { label: 'Refined Strategy', color: 'text-[var(--accent-primary-strong)]' };
    case 'milestone':
      return { label: 'Milestone Reached', color: 'text-[var(--success-strong)]' };
    case 'response':
      return { label: 'Response', color: 'text-[var(--accent-primary-strong)]' };
    default:
      return { label: 'AI Guidance', color: 'text-[var(--text-secondary)]' };
  }
}

export function ChatMessage({ message, phase, onAddTask }: ChatMessageProps) {
  const [addedTasks, setAddedTasks] = useState<Set<string>>(new Set());
  const { label, color } = getMessageLabel(message.messageType);

  const handleAddTask = (task: string) => {
    setAddedTasks((prev) => new Set(prev).add(task));
    onAddTask?.(task);
  };

  const handleStartStep = () => {
    const content = message.content as AIResponseContent;
    setAddedTasks((prev) => new Set(prev).add(content.next_step));
    onAddTask?.(content.next_step);
  };

  if (message.role === 'user') {
    const content = message.content as string;
    return (
      <div className="mb-5 flex justify-end">
        <div className="max-w-[30rem] rounded-[18px] border border-[rgba(143,179,255,0.18)] bg-[linear-gradient(180deg,#78a5ff_0%,#5e8ef2_100%)] px-4 py-3.5 text-white shadow-[0_12px_28px_rgba(24,66,146,0.25)]">
          <p className="text-sm leading-6">{content}</p>
          <p className="mt-2 text-[11px] uppercase tracking-[0.12em] text-blue-100/80">
            {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
          </p>
        </div>
      </div>
    );
  }

  const content = message.content as AIResponseContent;

  return (
    <div className="mb-7 flex justify-start">
      <div className="w-full max-w-[40rem]">
        <div className="mb-2 flex items-center justify-between gap-3">
          <p className={`text-[11px] font-semibold uppercase tracking-[0.16em] ${color}`}>{label}</p>
          <p className="text-[11px] uppercase tracking-[0.12em] text-[var(--text-muted)]">
            {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
          </p>
        </div>

        <div className="ui-surface-primary space-y-5 p-6">
          <p className="border-b border-[var(--border-subtle)] pb-5 text-sm leading-7 text-[var(--text-secondary)]">
            {content.summary}
          </p>

          <div className="ui-surface-accent space-y-3 p-5">
            <p className="text-xs font-bold uppercase tracking-[0.16em] text-[var(--accent-primary-strong)]">
              Next Step
            </p>
            <p className="text-base font-semibold leading-relaxed text-[var(--text-primary)]">
              {content.next_step}
            </p>
            <button
              onClick={handleStartStep}
              disabled={addedTasks.has(content.next_step)}
              className={cn(
                'mt-3 w-full text-sm',
                addedTasks.has(content.next_step)
                  ? 'ui-button-secondary border-[rgba(114,213,154,0.2)] bg-[var(--success-soft)] text-[var(--success-strong)]'
                  : 'ui-button-primary'
              )}
            >
              {addedTasks.has(content.next_step) ? 'Added as task' : 'Start this step'}
            </button>
          </div>

          {content.suggested_tasks.length > 0 && (
            <div className="space-y-3">
              <p className="text-xs font-bold uppercase tracking-[0.16em] text-[var(--text-secondary)]">
                Suggested Tasks
              </p>
              <ul className="space-y-2">
                {content.suggested_tasks.map((task, index) => {
                  const isAdded = addedTasks.has(task);
                  return (
                    <li
                      key={index}
                      className={cn(
                        'group flex items-start justify-between rounded-[14px] px-3 py-2.5 text-sm transition-all',
                        isAdded
                          ? 'border border-[rgba(114,213,154,0.2)] bg-[var(--success-soft)]'
                          : 'ui-surface-secondary hover:border-[var(--border-strong)] hover:translate-y-[-1px]'
                      )}
                    >
                      <div className="flex flex-1 items-start">
                        <span
                          className={cn(
                            'mr-3 inline-flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-full text-[11px] font-semibold',
                            isAdded
                              ? 'bg-[rgba(114,213,154,0.18)] text-[var(--success-strong)]'
                              : 'bg-[var(--accent-primary-soft)] text-[var(--accent-primary-strong)]'
                          )}
                        >
                          {isAdded ? 'OK' : index + 1}
                        </span>
                        <span className={isAdded ? 'text-[var(--success-strong)]' : 'text-[var(--text-primary)]'}>
                          {task}
                        </span>
                      </div>
                      {onAddTask && (
                        <button
                          onClick={() => handleAddTask(task)}
                          disabled={isAdded}
                          className={cn(
                            'ml-2 flex-shrink-0 whitespace-nowrap px-2 py-1 text-xs font-semibold',
                            isAdded
                              ? 'text-[var(--success-strong)] opacity-60'
                              : 'ui-button-ghost min-h-0 rounded-full px-2.5 py-1 text-[var(--accent-primary-strong)] hover:bg-[var(--accent-primary-soft)] hover:text-[var(--text-primary)]'
                          )}
                        >
                          {isAdded ? 'Added' : '+ Add'}
                        </button>
                      )}
                    </li>
                  );
                })}
              </ul>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
