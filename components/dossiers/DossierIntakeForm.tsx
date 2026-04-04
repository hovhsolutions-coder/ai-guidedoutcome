'use client';

import { useState } from 'react';
import { IntakeData } from '@/src/types/ai';

interface DossierIntakeFormProps {
  onSubmit: (data: IntakeData) => void;
  isSubmitting?: boolean;
}

const categories = [
  'Legal',
  'Financial',
  'Business',
  'Personal',
  'Career',
  'Health',
  'Relationship',
  'Project',
  'Housing',
  'Other',
];

export function DossierIntakeForm({ onSubmit, isSubmitting = false }: DossierIntakeFormProps) {
  const [selectedCategory, setSelectedCategory] = useState<string>('');
  const [customSituation, setCustomSituation] = useState<string>('');
  const [goal, setGoal] = useState<string>('');
  const [urgency, setUrgency] = useState<string>('');
  const [involved, setInvolved] = useState<string>('');
  const [blocking, setBlocking] = useState<string>('');

  const situation = customSituation.trim() || selectedCategory;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!situation || !goal || isSubmitting) return;
    onSubmit({ situation, goal, urgency, involved, blocking });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="ui-surface-primary space-y-6 p-6">
        <div className="space-y-2">
          <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-[var(--text-secondary)]">
            Intake
          </p>
          <h2 className="text-2xl font-semibold tracking-[-0.03em] text-[var(--text-primary)]">
            Capture the situation
          </h2>
          <p className="text-sm leading-6 text-[var(--text-secondary)]">
            A short description and a clear goal are enough to generate a strong first draft.
          </p>
        </div>

        <div>
          <label className="mb-2 block text-sm font-medium text-[var(--text-primary)]">Category</label>
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="ui-input"
            disabled={isSubmitting}
          >
            <option value="">Select category</option>
            {categories.map((cat) => (
              <option key={cat} value={cat}>
                {cat}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="mb-2 block text-sm font-medium text-[var(--text-primary)]">Situation details</label>
          <input
            type="text"
            placeholder="Add one line of context"
            value={customSituation}
            onChange={(e) => setCustomSituation(e.target.value)}
            className="ui-input"
            disabled={isSubmitting}
            required={selectedCategory === 'Other'}
          />
          <p className="mt-2 text-xs text-[var(--text-muted)]">
            Optional unless you choose Other.
          </p>
        </div>

        <div>
          <label className="mb-2 block text-sm font-medium text-[var(--text-primary)]">Goal</label>
          <textarea
            value={goal}
            onChange={(e) => setGoal(e.target.value)}
            placeholder="What needs to happen next?"
            className="ui-textarea min-h-24"
            disabled={isSubmitting}
            required
          />
        </div>

        <div>
          <label className="mb-2 block text-sm font-medium text-[var(--text-primary)]">Urgency</label>
          <select
            value={urgency}
            onChange={(e) => setUrgency(e.target.value)}
            className="ui-input"
            disabled={isSubmitting}
          >
            <option value="">Select urgency</option>
            <option value="Low">Low</option>
            <option value="Medium">Medium</option>
            <option value="High">High</option>
            <option value="Critical">Critical</option>
          </select>
        </div>

        <div>
          <label className="mb-2 block text-sm font-medium text-[var(--text-primary)]">People involved</label>
          <input
            type="text"
            value={involved}
            onChange={(e) => setInvolved(e.target.value)}
            placeholder="Teams, clients, or stakeholders"
            className="ui-input"
            disabled={isSubmitting}
          />
        </div>

        <div>
          <label className="mb-2 block text-sm font-medium text-[var(--text-primary)]">Current blocker</label>
          <textarea
            value={blocking}
            onChange={(e) => setBlocking(e.target.value)}
            placeholder="Anything slowing this down"
            className="ui-textarea min-h-24"
            disabled={isSubmitting}
          />
        </div>

        <button type="submit" disabled={isSubmitting} className="ui-button-primary w-full">
          {isSubmitting ? 'Generating dossier...' : 'Generate dossier'}
        </button>
      </div>
    </form>
  );
}
