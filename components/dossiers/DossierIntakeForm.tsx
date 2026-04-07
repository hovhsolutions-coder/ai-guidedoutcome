'use client';

import { useEffect, useMemo, useState } from 'react';
import { IntakeData, IntakeFormValues } from '@/src/types/ai';
import { CoachProfile, getCoachById, getCoachCatalog, getSuggestedCoaches } from '@/src/lib/coaches/catalog';

interface DossierIntakeFormProps {
  onSubmit: (data: IntakeData, values: IntakeFormValues) => void;
  isSubmitting?: boolean;
  initialValues?: IntakeFormValues | null;
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

export function DossierIntakeForm({
  onSubmit,
  isSubmitting = false,
  initialValues = null,
}: DossierIntakeFormProps) {
  const [selectedCategory, setSelectedCategory] = useState<string>(initialValues?.category ?? '');
  const [customSituation, setCustomSituation] = useState<string>(initialValues?.situationDetails ?? '');
  const [goal, setGoal] = useState<string>(initialValues?.goal ?? '');
  const [urgency, setUrgency] = useState<string>(initialValues?.urgency ?? '');
  const [involved, setInvolved] = useState<string>(initialValues?.involved ?? '');
  const [blocking, setBlocking] = useState<string>(initialValues?.blocking ?? '');
  const [selectedCoachId, setSelectedCoachId] = useState<string>(initialValues?.coachId ?? '');

  const situation = customSituation.trim() || selectedCategory;
  const allCoaches = useMemo(() => getCoachCatalog(), []);
  const recommendedCoaches = useMemo(
    () => getSuggestedCoaches({ category: selectedCategory, situation: customSituation, goal }).slice(0, 3),
    [selectedCategory, customSituation, goal]
  );

  useEffect(() => {
    if (selectedCoachId) {
      return;
    }

    const fallback = recommendedCoaches[0] ?? allCoaches[0];
    if (fallback) {
      setSelectedCoachId(fallback.id);
    }
  }, [selectedCoachId, recommendedCoaches, allCoaches]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!situation || !goal || isSubmitting) return;
    const selectedCoach = getCoachById(selectedCoachId);
    onSubmit(
      {
        situation,
        goal,
        urgency,
        involved,
        blocking,
        coachId: selectedCoach?.id,
        coachName: selectedCoach?.name,
      },
      {
        category: selectedCategory,
        situationDetails: customSituation,
        goal,
        urgency,
        involved,
        blocking,
        coachId: selectedCoach?.id ?? '',
      }
    );
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="ui-surface-primary space-y-6 p-6">
        <div className="space-y-2">
          <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-[var(--text-secondary)]">
            Intake
          </p>
          <h2 className="text-2xl font-semibold tracking-[-0.03em] text-[var(--text-primary)]">
            Start with your situation
          </h2>
          <p className="text-sm leading-6 text-[var(--text-secondary)]">
            Keep it simple. We match you with a coach style and shape your first clear next steps.
          </p>
        </div>

        <div className="space-y-3">
          <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-[var(--text-secondary)]">
            1. Where do you need help?
          </p>
          <div>
            <label htmlFor="dossier-category" className="mb-2 block text-sm font-medium text-[var(--text-primary)]">Category</label>
            <select
              id="dossier-category"
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
        </div>

        <div className="space-y-3">
          <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-[var(--text-secondary)]">
            2. What outcome do you want?
          </p>
          <div>
            <label htmlFor="dossier-situation-details" className="mb-2 block text-sm font-medium text-[var(--text-primary)]">Situation details</label>
            <input
              id="dossier-situation-details"
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
            <label htmlFor="dossier-goal" className="mb-2 block text-sm font-medium text-[var(--text-primary)]">Goal</label>
            <textarea
              id="dossier-goal"
              value={goal}
              onChange={(e) => setGoal(e.target.value)}
              placeholder="What needs to happen next?"
              className="ui-textarea min-h-24"
              disabled={isSubmitting}
              required
            />
          </div>
        </div>

        <div className="space-y-3">
          <div className="space-y-1">
            <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-[var(--text-secondary)]">
              3. Choose your coach
            </p>
            <p className="text-sm leading-6 text-[var(--text-secondary)]">
              We suggest a coach style based on your situation. You can always switch.
            </p>
          </div>

          <div className="grid gap-3 md:grid-cols-3">
            {recommendedCoaches.map((coach, index) => (
              <CoachCard
                key={coach.id}
                coach={coach}
                selected={selectedCoachId === coach.id}
                highlight={index === 0 ? 'Recommended' : null}
                onSelect={() => setSelectedCoachId(coach.id)}
              />
            ))}
          </div>

          <details className="ui-surface-secondary p-4">
            <summary className="cursor-pointer text-sm font-medium text-[var(--text-primary)]">
              Browse all coach styles
            </summary>
            <div className="mt-4 grid gap-3 md:grid-cols-2">
              {allCoaches.map((coach) => (
                <CoachCard
                  key={coach.id}
                  coach={coach}
                  selected={selectedCoachId === coach.id}
                  onSelect={() => setSelectedCoachId(coach.id)}
                />
              ))}
            </div>
          </details>
        </div>

        <details className="ui-surface-secondary p-4">
          <summary className="cursor-pointer text-sm font-medium text-[var(--text-primary)]">
            Optional details (for a sharper draft)
          </summary>
          <div className="mt-4 grid gap-4 md:grid-cols-2">
            <div>
              <label htmlFor="dossier-urgency" className="mb-2 block text-sm font-medium text-[var(--text-primary)]">Urgency</label>
              <select
                id="dossier-urgency"
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
              <label htmlFor="dossier-involved" className="mb-2 block text-sm font-medium text-[var(--text-primary)]">People involved</label>
              <input
                id="dossier-involved"
                type="text"
                value={involved}
                onChange={(e) => setInvolved(e.target.value)}
                placeholder="Teams, clients, or stakeholders"
                className="ui-input"
                disabled={isSubmitting}
              />
            </div>

            <div className="md:col-span-2">
              <label htmlFor="dossier-blocking" className="mb-2 block text-sm font-medium text-[var(--text-primary)]">Current blocker</label>
              <textarea
                id="dossier-blocking"
                value={blocking}
                onChange={(e) => setBlocking(e.target.value)}
                placeholder="Anything slowing this down"
                className="ui-textarea min-h-24"
                disabled={isSubmitting}
              />
            </div>
          </div>
        </details>

        <button type="submit" disabled={isSubmitting} className="ui-button-primary w-full">
          {isSubmitting ? 'Generating dossier...' : 'Generate dossier'}
        </button>
      </div>
    </form>
  );
}

interface CoachCardProps {
  coach: CoachProfile;
  selected: boolean;
  onSelect: () => void;
  highlight?: string | null;
}

function CoachCard({ coach, selected, onSelect, highlight = null }: CoachCardProps) {
  return (
    <button
      type="button"
      onClick={onSelect}
      className={`ui-surface-secondary text-left p-4 transition-all ${
        selected ? 'border-[rgba(109,156,255,0.45)] bg-[var(--accent-primary-soft)]' : ''
      }`}
      aria-pressed={selected}
    >
      <div className="space-y-2">
        <div className="flex items-center justify-between gap-2">
          <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-[var(--text-secondary)]">
            {coach.category}
          </p>
          {highlight && (
            <span className="ui-chip ui-chip-accent">
              {highlight}
            </span>
          )}
        </div>
        <h3 className="text-base font-semibold tracking-[-0.02em] text-[var(--text-primary)]">{coach.name}</h3>
        <p className="text-sm text-[var(--text-secondary)]">{coach.tagline}</p>
        <p className="text-xs leading-5 text-[var(--text-muted)]">
          First help: {coach.firstStep}
        </p>
      </div>
    </button>
  );
}
