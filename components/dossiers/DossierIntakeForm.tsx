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

  const situation = selectedCategory === 'Other' ? customSituation : selectedCategory;

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
            Describe the situation clearly
          </h2>
          <p className="text-sm leading-6 text-[var(--text-secondary)]">
            Give the system enough context to build a focused starting dossier with the right goal, phase, and next actions.
          </p>
        </div>

        <div>
          <label className="mb-1 block text-sm font-medium text-[var(--text-primary)]">
            Choose a category or type your situation
          </label>
          <p className="mb-2 text-xs text-[var(--text-secondary)]">
            One line is enough. Examples: “Close Series A round” or “Stabilize churn in EU region.”
          </p>
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
          {selectedCategory === 'Other' && (
            <input
              type="text"
              placeholder="e.g., Rebuild launch plan after vendor delay"
              value={customSituation}
              onChange={(e) => setCustomSituation(e.target.value)}
              className="ui-input mt-2"
              disabled={isSubmitting}
              required
            />
          )}
        </div>

        <div>
          <label className="mb-1 block text-sm font-medium text-[var(--text-primary)]">What is your goal?</label>
          <p className="mb-2 text-xs text-[var(--text-secondary)]">
            Be specific about the outcome or decision you need in the next 2-4 weeks.
          </p>
          <textarea
            value={goal}
            onChange={(e) => setGoal(e.target.value)}
            placeholder="e.g., Launch the pilot with 5 design partners and lock success metrics"
            className="ui-textarea min-h-24"
            disabled={isSubmitting}
            required
          />
        </div>

        <div>
          <label className="mb-2 block text-sm font-medium text-[var(--text-primary)]">How urgent is this?</label>
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
          <label className="mb-1 block text-sm font-medium text-[var(--text-primary)]">Who is involved?</label>
          <p className="mb-2 text-xs text-[var(--text-secondary)]">
            Optional - list key teams, customers, or decision makers.
          </p>
          <input
            type="text"
            value={involved}
            onChange={(e) => setInvolved(e.target.value)}
            placeholder="e.g., Sales EU, Design partners, Legal review"
            className="ui-input"
            disabled={isSubmitting}
          />
        </div>

        <div>
          <label className="mb-1 block text-sm font-medium text-[var(--text-primary)]">What is blocking you?</label>
          <p className="mb-2 text-xs text-[var(--text-secondary)]">
            Optional - call out the risk, dependency, or unknown slowing you down.
          </p>
          <textarea
            value={blocking}
            onChange={(e) => setBlocking(e.target.value)}
            placeholder="e.g., Awaiting security review; unclear budget owner"
            className="ui-textarea min-h-24"
            disabled={isSubmitting}
          />
        </div>

        <div className="ui-surface-secondary space-y-2 px-4 py-3">
          <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-[var(--text-secondary)]">
            What happens next
          </p>
          <p className="text-sm leading-6 text-[var(--text-secondary)]">
            We generate a structured dossier, summarize the situation, and suggest the first actions to help you move forward with clarity.
          </p>
        </div>

        <button type="submit" disabled={isSubmitting} className="ui-button-primary w-full">
          {isSubmitting ? 'Creating dossier...' : 'Create dossier'}
        </button>
      </div>
    </form>
  );
}
