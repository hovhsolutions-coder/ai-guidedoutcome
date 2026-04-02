import React, { useState, useRef } from 'react';

interface ChatInputProps {
  onSubmit: (message: string) => void;
  isLoading: boolean;
  placeholder?: string;
}

export function ChatInput({ onSubmit, isLoading, placeholder = 'Refine the next move...' }: ChatInputProps) {
  const [input, setInput] = useState('');
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (input.trim() && !isLoading) {
      onSubmit(input);
      setInput('');
      if (textareaRef.current) {
        textareaRef.current.focus();
      }
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && e.ctrlKey) {
      handleSubmit(e);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-3">
      <div className="ui-surface-secondary flex gap-3 p-3 transition-all duration-200 focus-within:border-[rgba(109,156,255,0.28)] focus-within:shadow-[0_14px_32px_rgba(8,16,30,0.18)]">
        <textarea
          ref={textareaRef}
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          disabled={isLoading}
          placeholder={placeholder}
          rows={3}
          className="ui-textarea min-h-[104px] flex-1 resize-none border-none bg-transparent text-sm leading-6 shadow-none focus:border-none"
        />
        <button
          type="submit"
          disabled={isLoading || !input.trim()}
          className="ui-button-primary h-fit self-end whitespace-nowrap px-6 py-3"
        >
          {isLoading ? 'Refining...' : 'Refine'}
        </button>
      </div>
      <div className="flex items-center justify-between gap-3 px-1">
        <p className="text-xs text-[var(--text-muted)]">Ctrl + Enter to send</p>
        <p className="text-xs text-[var(--text-muted)]">Refine direction, pressure-test the plan, or surface the next risk.</p>
      </div>
    </form>
  );
}
