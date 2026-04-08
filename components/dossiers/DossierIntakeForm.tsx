'use client';

import { useEffect, useMemo, useState } from 'react';
import { IntakeData, IntakeFormValues } from '@/src/types/ai';
import { CoachProfile, getCoachById, getCoachCatalog, getSuggestedCoaches } from '@/src/lib/coaches/catalog';
import { cn } from '@/lib/utils';

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

const impactAreaOptions = [
  'Energy',
  'Money',
  'Work quality',
  'Relationships',
  'Health',
  'Confidence',
  'Time',
] as const;

const costSignalOptions = [
  'Energy',
  'Time',
  'Money',
  'Trust',
  'Focus',
  'Stability',
] as const;

const supportStyleOptions = [
  'Calm, grounding, and empathic',
  'Practical and step-by-step',
  'Direct and accountable',
  'Strategic and big-picture',
  'Motivating and momentum-focused',
];

const emotionalStateOptions = [
  'Overwhelmed',
  'Anxious',
  'Frustrated',
  'Unclear',
  'Calm but stuck',
  'Ready to act',
];

const timelineOptions = [
  'Started this week',
  'Started in the last month',
  'Ongoing for several months',
  'Ongoing for a long time',
];

const intakeSteps = [
  {
    id: 'situation',
    title: 'Context',
    question: 'What is happening, and why does this need attention now?',
    helper: 'You can write this in rough notes. We will structure it with you.',
  },
  {
    id: 'pain-impact',
    title: 'Pain & Impact',
    question: 'Where is this draining you most right now?',
    helper: 'The clearer the pressure, the better your coach can prioritize support.',
  },
  {
    id: 'outcome-reality',
    title: 'Outcome & Reality',
    question: 'What must improve first, and what cannot be ignored?',
    helper: 'We turn this into a grounded first move, not generic advice.',
  },
  {
    id: 'coach-fit',
    title: 'Support Fit',
    question: 'What kind of coaching helps you move safely and consistently?',
    helper: 'Your coach should match your situation and how you prefer support.',
  },
  {
    id: 'review',
    title: 'Shared Summary',
    question: 'Check if this reflects your reality before we generate',
    helper: 'Your dossier, coach guidance, and first priorities are based on this summary.',
  },
] as const;

export function DossierIntakeForm({
  onSubmit,
  isSubmitting = false,
  initialValues = null,
}: DossierIntakeFormProps) {
  const [currentStep, setCurrentStep] = useState<number>(0);
  const [selectedCategory, setSelectedCategory] = useState<string>(initialValues?.category ?? '');
  const [customSituation, setCustomSituation] = useState<string>(initialValues?.situationDetails ?? '');
  const [timeline, setTimeline] = useState<string>(initialValues?.timeline ?? '');
  const [attentionNow, setAttentionNow] = useState<string>(initialValues?.attentionNow ?? '');
  const [urgency, setUrgency] = useState<string>(initialValues?.urgency ?? '');
  const [painPoints, setPainPoints] = useState<string>(initialValues?.painPoints ?? '');
  const [biggestFriction, setBiggestFriction] = useState<string>(initialValues?.biggestFriction ?? '');
  const [costSignals, setCostSignals] = useState<string[]>(initialValues?.costSignals ?? []);
  const [impactAreas, setImpactAreas] = useState<string[]>(initialValues?.impactAreas ?? []);
  const [impactIfUnresolved, setImpactIfUnresolved] = useState<string>(initialValues?.impactIfUnresolved ?? '');
  const [goal, setGoal] = useState<string>(initialValues?.goal ?? '');
  const [longTermOutcome, setLongTermOutcome] = useState<string>(initialValues?.longTermOutcome ?? '');
  const [triedAlready, setTriedAlready] = useState<string>(initialValues?.triedAlready ?? '');
  const [supportAlreadyUsed, setSupportAlreadyUsed] = useState<string>(initialValues?.supportAlreadyUsed ?? '');
  const [involved, setInvolved] = useState<string>(initialValues?.involved ?? '');
  const [blocking, setBlocking] = useState<string>(initialValues?.blocking ?? '');
  const [constraints, setConstraints] = useState<string>(initialValues?.constraints ?? '');
  const [resources, setResources] = useState<string>(initialValues?.resources ?? '');
  const [emotionalState, setEmotionalState] = useState<string>(initialValues?.emotionalState ?? '');
  const [supportStyle, setSupportStyle] = useState<string>(initialValues?.supportStyle ?? '');
  const [coachStyle, setCoachStyle] = useState<string>(initialValues?.coachStyle ?? '');
  const [firstPriority, setFirstPriority] = useState<string>(initialValues?.firstPriority ?? '');
  const [nonNegotiable, setNonNegotiable] = useState<string>(initialValues?.nonNegotiable ?? '');
  const [selectedCoachId, setSelectedCoachId] = useState<string>(initialValues?.coachId ?? '');
  const [quickError, setQuickError] = useState<string | null>(null);

  const situation = customSituation.trim() || selectedCategory;
  const allCoaches = useMemo(() => getCoachCatalog(), []);
  const recommendedCoaches = useMemo(
    () =>
      getSuggestedCoaches({
        category: selectedCategory,
        situation,
        goal,
        attentionNow,
        painPoints,
        biggestFriction,
        costSignals,
        impactIfUnresolved,
        blocking,
        triedAlready,
        supportAlreadyUsed,
        firstPriority,
        nonNegotiable,
        urgency,
        supportStyle,
        coachStyle,
        emotionalState,
      }).slice(0, 3),
    [
      selectedCategory,
      situation,
      goal,
      attentionNow,
      painPoints,
      biggestFriction,
      costSignals,
      impactIfUnresolved,
      blocking,
      triedAlready,
      supportAlreadyUsed,
      firstPriority,
      nonNegotiable,
      urgency,
      supportStyle,
      coachStyle,
      emotionalState,
    ]
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

  const currentStepMeta = intakeSteps[currentStep];
  const isFinalStep = currentStep === intakeSteps.length - 1;
  const progressPercent = ((currentStep + 1) / intakeSteps.length) * 100;

  const getStepError = (step: number): string | null => {
    if (step === 0) {
      if (!selectedCategory) return 'Choose where this situation mainly lives.';
      if (!situation) return 'Describe what is happening so we can anchor your dossier clearly.';
      if (!attentionNow.trim()) return 'Tell us what made this need attention now.';
      if (!goal.trim()) return 'Name the first result you want to reach.';
    }

    if (step === 1) {
      if (!painPoints.trim()) return 'Name what feels most painful right now.';
      if (!biggestFriction.trim()) return 'Describe where things keep getting stuck.';
      if (costSignals.length === 0) return 'Select at least one cost signal.';
      if (impactAreas.length === 0) return 'Select at least one area that is being affected.';
      if (!impactIfUnresolved.trim()) return 'Describe what happens if this remains unresolved.';
    }

    if (step === 2) {
      if (!goal.trim()) return 'Define your short-term outcome so we can target the first moves.';
      if (!firstPriority.trim()) return 'Set the first stabilization priority before generating.';
      if (!nonNegotiable.trim()) return 'Name what absolutely cannot be ignored.';
    }

    if (step === 3) {
      if (!supportStyle.trim()) return 'Choose the support style that helps you move.';
      if (!selectedCoachId) return 'Select a coach to continue.';
    }

    return null;
  };

  const stepError = getStepError(currentStep);

  const toggleImpactArea = (area: string) => {
    setImpactAreas((prev) => (prev.includes(area) ? prev.filter((item) => item !== area) : [...prev, area]));
  };

  const toggleCostSignal = (signal: string) => {
    setCostSignals((prev) => (prev.includes(signal) ? prev.filter((item) => item !== signal) : [...prev, signal]));
  };

  const submitIntake = (overrides?: Partial<IntakeFormValues>) => {
    const nextValues: IntakeFormValues = {
      category: selectedCategory,
      situationDetails: customSituation,
      timeline,
      attentionNow,
      painPoints,
      biggestFriction,
      costSignals,
      impactAreas,
      impactIfUnresolved,
      goal,
      longTermOutcome,
      triedAlready,
      supportAlreadyUsed,
      urgency,
      involved,
      blocking,
      constraints,
      resources,
      emotionalState,
      supportStyle,
      coachStyle,
      firstPriority,
      nonNegotiable,
      coachId: selectedCoachId,
      ...overrides,
    };

    const nextSituation = nextValues.situationDetails.trim() || nextValues.category;
    const fallbackCoach = getCoachById(nextValues.coachId) ?? recommendedCoaches[0] ?? allCoaches[0] ?? null;

    const intakeAnswers: Record<string, unknown> = {
      category: nextValues.category,
      timeline: nextValues.timeline,
      attention_now: nextValues.attentionNow,
      pain_points: nextValues.painPoints,
      biggest_friction: nextValues.biggestFriction,
      cost_signals: nextValues.costSignals,
      impact_areas: nextValues.impactAreas,
      impact_if_unresolved: nextValues.impactIfUnresolved,
      short_term_outcome: nextValues.goal,
      long_term_outcome: nextValues.longTermOutcome,
      tried_already: nextValues.triedAlready,
      support_already_used: nextValues.supportAlreadyUsed,
      involved: nextValues.involved,
      blocker: nextValues.blocking,
      constraints: nextValues.constraints,
      resources: nextValues.resources,
      emotional_state: nextValues.emotionalState,
      support_style: nextValues.supportStyle,
      coach_style: nextValues.coachStyle,
      first_priority: nextValues.firstPriority,
      non_negotiable: nextValues.nonNegotiable,
      urgency: nextValues.urgency,
    };

    onSubmit(
      {
        situation: nextSituation,
        goal: nextValues.goal,
        urgency: nextValues.urgency,
        involved: nextValues.involved,
        blocking: nextValues.blocking,
        category: nextValues.category,
        timeline: nextValues.timeline,
        attentionNow: nextValues.attentionNow,
        painPoints: nextValues.painPoints,
        biggestFriction: nextValues.biggestFriction,
        costSignals: nextValues.costSignals,
        impactAreas: nextValues.impactAreas,
        impactIfUnresolved: nextValues.impactIfUnresolved,
        shortTermOutcome: nextValues.goal,
        longTermOutcome: nextValues.longTermOutcome,
        triedAlready: nextValues.triedAlready,
        supportAlreadyUsed: nextValues.supportAlreadyUsed,
        constraints: nextValues.constraints,
        resources: nextValues.resources,
        emotionalState: nextValues.emotionalState,
        supportStyle: nextValues.supportStyle,
        coachStyle: nextValues.coachStyle,
        firstPriority: nextValues.firstPriority,
        nonNegotiable: nextValues.nonNegotiable,
        intakeAnswers,
        coachId: fallbackCoach?.id,
        coachName: fallbackCoach?.name,
      },
      {
        ...nextValues,
        coachId: fallbackCoach?.id ?? '',
      }
    );
  };

  const handleQuickGenerate = () => {
    setQuickError(null);
    if (!selectedCategory || !situation || !goal.trim()) {
      setQuickError('Add your area, situation, and near-term result before generating.');
      return;
    }

    submitIntake({
      attentionNow: attentionNow || `Needs attention now because progress around "${goal}" is blocked.`,
      urgency: urgency || 'Medium',
      supportStyle: supportStyle || 'Practical and step-by-step',
      painPoints: painPoints || `Need clarity and momentum around: ${situation}`,
      biggestFriction: biggestFriction || 'Hard to decide what to do first and stay consistent.',
      costSignals: costSignals.length > 0 ? costSignals : ['Time', 'Focus'],
      impactAreas: impactAreas.length > 0 ? impactAreas : ['Time', 'Confidence'],
      impactIfUnresolved:
        impactIfUnresolved || 'Pressure will keep increasing and momentum will stay blocked.',
      firstPriority: firstPriority || goal,
      nonNegotiable: nonNegotiable || 'Prevent this from escalating this week.',
      coachId: selectedCoachId || recommendedCoaches[0]?.id || '',
    });
  };

  const handleGuidedContinue = () => {
    setQuickError(null);
    if (!stepError) {
      setCurrentStep((prev) => Math.min(prev + 1, intakeSteps.length - 1));
    }
  };

  const handleFinalGenerate = () => {
    setQuickError(null);
    submitIntake();
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (isSubmitting) return;

    if (!isFinalStep) {
      return;
    }

    const finalErrors = intakeSteps
      .map((_, index) => getStepError(index))
      .filter((error): error is string => Boolean(error));

    if (finalErrors.length > 0) {
      const firstInvalidStep = intakeSteps.findIndex((_, index) => getStepError(index));
      if (firstInvalidStep >= 0) {
        setCurrentStep(firstInvalidStep);
      }
      return;
    }

    handleFinalGenerate();
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="ui-surface-primary space-y-6 p-6">
        <div className="space-y-4">
          <div className="flex items-center justify-between gap-3">
            <span className="ui-chip ui-chip-accent">
              Step {currentStep + 1} of {intakeSteps.length}
            </span>
            <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-[var(--text-secondary)]">
              {currentStepMeta.title}
            </p>
          </div>
          <div className="h-1.5 overflow-hidden rounded-full bg-[var(--border-subtle)]">
            <div
              className="h-full rounded-full bg-gradient-to-r from-[var(--accent-primary)] to-[var(--accent-primary-strong)] transition-all duration-300"
              style={{ width: `${progressPercent}%` }}
            />
          </div>
          <div className="space-y-2">
            <h2 className="text-2xl font-semibold tracking-[-0.03em] text-[var(--text-primary)]">
              {currentStepMeta.question}
            </h2>
            <p className="text-sm leading-6 text-[var(--text-secondary)]">{currentStepMeta.helper}</p>
            <p className="text-xs text-[var(--text-muted)]">
              You do not need polished language. Short honest notes are enough.
            </p>
          </div>
        </div>

        {currentStep === 0 && (
          <div className="space-y-4">
            <div>
              <label htmlFor="dossier-category" className="mb-2 block text-sm font-medium text-[var(--text-primary)]">
                Where is this mainly showing up?
              </label>
              <select
                id="dossier-category"
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="ui-input"
                disabled={isSubmitting}
              >
                <option value="">Select area</option>
                {categories.map((category) => (
                  <option key={category} value={category}>
                    {category}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label htmlFor="dossier-situation-details" className="mb-2 block text-sm font-medium text-[var(--text-primary)]">
                Situation in your own words
              </label>
              <textarea
                id="dossier-situation-details"
                value={customSituation}
                onChange={(e) => setCustomSituation(e.target.value)}
                placeholder="Add one line of context, then describe what feels messy or unclear."
                className="ui-textarea min-h-28"
                disabled={isSubmitting}
                required={selectedCategory === 'Other'}
              />
            </div>

            <div>
              <label htmlFor="dossier-attention-now" className="mb-2 block text-sm font-medium text-[var(--text-primary)]">
                Why does this need attention now?
              </label>
              <textarea
                id="dossier-attention-now"
                value={attentionNow}
                onChange={(e) => setAttentionNow(e.target.value)}
                placeholder="What happened, changed, or escalated that made this urgent now?"
                className="ui-textarea min-h-24"
                disabled={isSubmitting}
              />
            </div>

            <div>
              <label htmlFor="dossier-goal-quick" className="mb-2 block text-sm font-medium text-[var(--text-primary)]">
                Near-term result
              </label>
              <textarea
                id="dossier-goal-quick"
                value={goal}
                onChange={(e) => setGoal(e.target.value)}
                placeholder="What needs to happen next?"
                className="ui-textarea min-h-24"
                disabled={isSubmitting}
              />
              <p className="mt-2 text-xs text-[var(--text-muted)]">
                Focus on the first meaningful shift, not the final perfect outcome.
              </p>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <label htmlFor="dossier-timeline" className="mb-2 block text-sm font-medium text-[var(--text-primary)]">
                  Since when is this active?
                </label>
                <select
                  id="dossier-timeline"
                  value={timeline}
                  onChange={(e) => setTimeline(e.target.value)}
                  className="ui-input"
                  disabled={isSubmitting}
                >
                  <option value="">Select timeline</option>
                  {timelineOptions.map((option) => (
                    <option key={option} value={option}>
                      {option}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label htmlFor="dossier-urgency" className="mb-2 block text-sm font-medium text-[var(--text-primary)]">
                  Urgency
                </label>
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
            </div>
          </div>
        )}

        {currentStep === 1 && (
          <div className="space-y-4">
            <div>
              <label htmlFor="dossier-pain-points" className="mb-2 block text-sm font-medium text-[var(--text-primary)]">
                What feels most painful right now?
              </label>
              <textarea
                id="dossier-pain-points"
                value={painPoints}
                onChange={(e) => setPainPoints(e.target.value)}
                placeholder="Name the pressure points clearly."
                className="ui-textarea min-h-28"
                disabled={isSubmitting}
              />
            </div>

            <div>
              <label htmlFor="dossier-biggest-friction" className="mb-2 block text-sm font-medium text-[var(--text-primary)]">
                Where does this keep getting stuck?
              </label>
              <textarea
                id="dossier-biggest-friction"
                value={biggestFriction}
                onChange={(e) => setBiggestFriction(e.target.value)}
                placeholder="Describe the repeating friction: decisions, conversations, capacity, process, or uncertainty."
                className="ui-textarea min-h-24"
                disabled={isSubmitting}
              />
            </div>

            <div>
              <p className="mb-2 block text-sm font-medium text-[var(--text-primary)]">What is this costing you most?</p>
              <div className="flex flex-wrap gap-2">
                {costSignalOptions.map((signal) => {
                  const active = costSignals.includes(signal);
                  return (
                    <button
                      key={signal}
                      type="button"
                      onClick={() => toggleCostSignal(signal)}
                      className={cn(
                        'rounded-full border px-3 py-1.5 text-xs font-medium transition-colors',
                        active
                          ? 'border-[rgba(109,156,255,0.45)] bg-[var(--accent-primary-soft)] text-[var(--accent-primary-strong)]'
                          : 'border-[var(--border-subtle)] text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
                      )}
                      disabled={isSubmitting}
                    >
                      {signal}
                    </button>
                  );
                })}
              </div>
            </div>

            <div>
              <p className="mb-2 block text-sm font-medium text-[var(--text-primary)]">Where do you feel the impact?</p>
              <div className="flex flex-wrap gap-2">
                {impactAreaOptions.map((area) => {
                  const active = impactAreas.includes(area);
                  return (
                    <button
                      key={area}
                      type="button"
                      onClick={() => toggleImpactArea(area)}
                      className={cn(
                        'rounded-full border px-3 py-1.5 text-xs font-medium transition-colors',
                        active
                          ? 'border-[rgba(109,156,255,0.45)] bg-[var(--accent-primary-soft)] text-[var(--accent-primary-strong)]'
                          : 'border-[var(--border-subtle)] text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
                      )}
                      disabled={isSubmitting}
                    >
                      {area}
                    </button>
                  );
                })}
              </div>
            </div>

            <div>
              <label htmlFor="dossier-impact-if-unresolved" className="mb-2 block text-sm font-medium text-[var(--text-primary)]">
                What happens if this does not change soon?
              </label>
              <textarea
                id="dossier-impact-if-unresolved"
                value={impactIfUnresolved}
                onChange={(e) => setImpactIfUnresolved(e.target.value)}
                placeholder="Describe the real consequence if this stays the same."
                className="ui-textarea min-h-24"
                disabled={isSubmitting}
              />
            </div>
          </div>
        )}

        {currentStep === 2 && (
          <div className="space-y-4">
            <div>
              <label htmlFor="dossier-goal" className="mb-2 block text-sm font-medium text-[var(--text-primary)]">
                Short-term outcome you want
              </label>
              <textarea
                id="dossier-goal"
                value={goal}
                onChange={(e) => setGoal(e.target.value)}
                placeholder="What should be measurably better in the near term?"
                className="ui-textarea min-h-24"
                disabled={isSubmitting}
              />
            </div>

            <div>
              <label htmlFor="dossier-long-term-outcome" className="mb-2 block text-sm font-medium text-[var(--text-primary)]">
                Longer-term ideal outcome (optional)
              </label>
              <textarea
                id="dossier-long-term-outcome"
                value={longTermOutcome}
                onChange={(e) => setLongTermOutcome(e.target.value)}
                placeholder="If this trajectory goes well, what is the bigger result?"
                className="ui-textarea min-h-20"
                disabled={isSubmitting}
              />
            </div>

            <div>
              <label htmlFor="dossier-first-priority" className="mb-2 block text-sm font-medium text-[var(--text-primary)]">
                First priority to stabilize now
              </label>
              <input
                id="dossier-first-priority"
                type="text"
                value={firstPriority}
                onChange={(e) => setFirstPriority(e.target.value)}
                placeholder="What must be handled first?"
                className="ui-input"
                disabled={isSubmitting}
              />
            </div>

            <div>
              <label htmlFor="dossier-non-negotiable" className="mb-2 block text-sm font-medium text-[var(--text-primary)]">
                What absolutely cannot be ignored?
              </label>
              <input
                id="dossier-non-negotiable"
                type="text"
                value={nonNegotiable}
                onChange={(e) => setNonNegotiable(e.target.value)}
                placeholder="Name the risk, deadline, or fragile area that must stay protected."
                className="ui-input"
                disabled={isSubmitting}
              />
              {(urgency === 'High' || urgency === 'Critical') && (
                <p className="mt-2 text-xs text-[var(--warning-strong)]">
                  Because urgency is {urgency.toLowerCase()}, this line will heavily shape the first actions.
                </p>
              )}
            </div>

            <details className="ui-surface-secondary p-4">
              <summary className="cursor-pointer text-sm font-medium text-[var(--text-primary)]">
                Add deeper context (optional)
              </summary>
              <div className="mt-4 grid gap-4 md:grid-cols-2">
                <div className="md:col-span-2">
                  <label htmlFor="dossier-tried-already" className="mb-2 block text-sm font-medium text-[var(--text-primary)]">
                    What have you already tried?
                  </label>
                  <textarea
                    id="dossier-tried-already"
                    value={triedAlready}
                    onChange={(e) => setTriedAlready(e.target.value)}
                    className="ui-textarea min-h-20"
                    disabled={isSubmitting}
                    placeholder="Share attempts that did not work, or partly worked."
                  />
                </div>

                <div className="md:col-span-2">
                  <label htmlFor="dossier-support-used" className="mb-2 block text-sm font-medium text-[var(--text-primary)]">
                    What support have you already used? (optional)
                  </label>
                  <textarea
                    id="dossier-support-used"
                    value={supportAlreadyUsed}
                    onChange={(e) => setSupportAlreadyUsed(e.target.value)}
                    className="ui-textarea min-h-20"
                    disabled={isSubmitting}
                    placeholder="Examples: mentor, colleague, therapist, advisor, legal help, financial help."
                  />
                </div>

                <div>
                  <label htmlFor="dossier-involved" className="mb-2 block text-sm font-medium text-[var(--text-primary)]">
                    Who is involved?
                  </label>
                  <input
                    id="dossier-involved"
                    type="text"
                    value={involved}
                    onChange={(e) => setInvolved(e.target.value)}
                    className="ui-input"
                    disabled={isSubmitting}
                    placeholder="People, teams, clients, stakeholders"
                  />
                </div>

                <div>
                  <label htmlFor="dossier-blocking" className="mb-2 block text-sm font-medium text-[var(--text-primary)]">
                    Current blocker
                  </label>
                  <input
                    id="dossier-blocking"
                    type="text"
                    value={blocking}
                    onChange={(e) => setBlocking(e.target.value)}
                    className="ui-input"
                    disabled={isSubmitting}
                    placeholder="Main blocker right now"
                  />
                </div>

                <div>
                  <label htmlFor="dossier-constraints" className="mb-2 block text-sm font-medium text-[var(--text-primary)]">
                    Constraints
                  </label>
                  <textarea
                    id="dossier-constraints"
                    value={constraints}
                    onChange={(e) => setConstraints(e.target.value)}
                    className="ui-textarea min-h-20"
                    disabled={isSubmitting}
                    placeholder="Limits around time, money, authority, or availability"
                  />
                </div>

                <div>
                  <label htmlFor="dossier-resources" className="mb-2 block text-sm font-medium text-[var(--text-primary)]">
                    Available resources
                  </label>
                  <textarea
                    id="dossier-resources"
                    value={resources}
                    onChange={(e) => setResources(e.target.value)}
                    className="ui-textarea min-h-20"
                    disabled={isSubmitting}
                    placeholder="People, budget, tools, or support already available"
                  />
                </div>
              </div>
            </details>
          </div>
        )}

        {currentStep === 3 && (
          <div className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <label htmlFor="dossier-support-style" className="mb-2 block text-sm font-medium text-[var(--text-primary)]">
                  Preferred support style
                </label>
                <select
                  id="dossier-support-style"
                  value={supportStyle}
                  onChange={(e) => setSupportStyle(e.target.value)}
                  className="ui-input"
                  disabled={isSubmitting}
                >
                  <option value="">Select support style</option>
                  {supportStyleOptions.map((style) => (
                    <option key={style} value={style}>
                      {style}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label htmlFor="dossier-emotional-state" className="mb-2 block text-sm font-medium text-[var(--text-primary)]">
                  Current emotional state (optional)
                </label>
                <select
                  id="dossier-emotional-state"
                  value={emotionalState}
                  onChange={(e) => setEmotionalState(e.target.value)}
                  className="ui-input"
                  disabled={isSubmitting}
                >
                  <option value="">Select state</option>
                  {emotionalStateOptions.map((state) => (
                    <option key={state} value={state}>
                      {state}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div>
              <label htmlFor="dossier-coach-style" className="mb-2 block text-sm font-medium text-[var(--text-primary)]">
                How should your coach communicate? (optional)
              </label>
              <input
                id="dossier-coach-style"
                type="text"
                value={coachStyle}
                onChange={(e) => setCoachStyle(e.target.value)}
                className="ui-input"
                disabled={isSubmitting}
                placeholder="Example: concise, calm, practical, and honest."
              />
            </div>

            <div className="space-y-3">
              <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-[var(--text-secondary)]">
                Recommended coaches
              </p>
              <div className="grid gap-3 md:grid-cols-3">
                {recommendedCoaches.map((coach, index) => (
                  <CoachCard
                    key={coach.id}
                    coach={coach}
                    selected={selectedCoachId === coach.id}
                    highlight={index === 0 ? 'Best match' : null}
                    rationale={buildCoachRationale(coach, {
                      supportStyle,
                      urgency,
                      painPoints,
                      biggestFriction,
                      firstPriority,
                      nonNegotiable,
                      costSignals,
                    })}
                    onSelect={() => setSelectedCoachId(coach.id)}
                  />
                ))}
              </div>
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
                    rationale={buildCoachRationale(coach, {
                      supportStyle,
                      urgency,
                      painPoints,
                      biggestFriction,
                      firstPriority,
                      nonNegotiable,
                      costSignals,
                    })}
                    onSelect={() => setSelectedCoachId(coach.id)}
                  />
                ))}
              </div>
            </details>
          </div>
        )}

        {currentStep === 4 && (
          <div className="space-y-4">
            <div className="ui-surface-secondary space-y-4 p-5">
              <SummaryBlock
                title="Context"
                body={[
                  `${selectedCategory || 'No area selected'}${timeline ? ` | ${timeline}` : ''}`,
                  `Situation: ${situation || 'Not provided'}`,
                  `Attention now: ${attentionNow || 'Not provided'}`,
                ].join('\n')}
                onEdit={() => setCurrentStep(0)}
              />
              <SummaryBlock
                title="Pain & Impact"
                body={[
                  `Pain points: ${painPoints || 'Not provided'}`,
                  `Biggest friction: ${biggestFriction || 'Not provided'}`,
                  `Cost signals: ${costSignals.length > 0 ? costSignals.join(', ') : 'Not provided'}`,
                  `Impact areas: ${impactAreas.length > 0 ? impactAreas.join(', ') : 'Not provided'}`,
                  `If unresolved: ${impactIfUnresolved || 'Not provided'}`,
                ].join('\n')}
                onEdit={() => setCurrentStep(1)}
              />
              <SummaryBlock
                title="Outcome & Priority"
                body={[
                  `Short-term outcome: ${goal || 'Not provided'}`,
                  `Long-term outcome: ${longTermOutcome || 'Not provided'}`,
                  `First priority: ${firstPriority || 'Not provided'}`,
                  `Non-negotiable: ${nonNegotiable || 'Not provided'}`,
                  `Current blocker: ${blocking || 'Not provided'}`,
                ].join('\n')}
                onEdit={() => setCurrentStep(2)}
              />
              <SummaryBlock
                title="Coach Match"
                body={[
                  `Coach: ${getCoachById(selectedCoachId)?.name ?? 'Not selected'}`,
                  `Support style: ${supportStyle || 'Not selected'}`,
                  `Coach tone: ${coachStyle || 'Not provided'}`,
                  `Emotional state: ${emotionalState || 'Not provided'}`,
                ].join('\n')}
                onEdit={() => setCurrentStep(3)}
              />
            </div>
            <p className="text-sm leading-6 text-[var(--text-secondary)]">
              If this feels accurate, generate your dossier. Your coach, priorities, and first guidance will be grounded in this summary.
            </p>
          </div>
        )}

        {(stepError && !isFinalStep) || quickError ? (
          <p className="text-sm text-[var(--warning-strong)]">{quickError || stepError}</p>
        ) : null}

        <div className="flex flex-col-reverse gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => setCurrentStep((prev) => Math.max(prev - 1, 0))}
              disabled={currentStep === 0 || isSubmitting}
              className="ui-button-ghost px-4 py-2 text-sm"
            >
              Back
            </button>
          </div>

          {currentStep === 0 ? (
            <div className="flex w-full flex-col gap-2 sm:w-auto sm:flex-row">
              <button
                type="button"
                onClick={handleGuidedContinue}
                disabled={Boolean(stepError) || isSubmitting}
                className="ui-button-secondary w-full sm:w-auto"
              >
                Continue guided intake
              </button>
              <button
                type="button"
                onClick={handleQuickGenerate}
                disabled={isSubmitting}
                className="ui-button-primary w-full sm:w-auto"
              >
                Generate dossier
              </button>
            </div>
          ) : !isFinalStep ? (
            <button
              type="button"
              onClick={handleGuidedContinue}
              disabled={Boolean(stepError) || isSubmitting}
              className="ui-button-primary w-full sm:w-auto"
            >
              Continue
            </button>
          ) : (
            <button type="submit" disabled={isSubmitting} className="ui-button-primary w-full sm:w-auto">
              {isSubmitting ? 'Generating dossier...' : 'Generate dossier'}
            </button>
          )}
        </div>
      </div>
    </form>
  );
}

interface CoachCardProps {
  coach: CoachProfile;
  selected: boolean;
  onSelect: () => void;
  highlight?: string | null;
  rationale: string;
}

function CoachCard({ coach, selected, onSelect, highlight = null, rationale }: CoachCardProps) {
  return (
    <button
      type="button"
      onClick={onSelect}
      className={cn(
        'ui-surface-secondary p-4 text-left transition-all',
        selected && 'border-[rgba(109,156,255,0.45)] bg-[var(--accent-primary-soft)]'
      )}
      aria-pressed={selected}
    >
      <div className="space-y-2">
        <div className="flex items-center justify-between gap-2">
          <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-[var(--text-secondary)]">
            {coach.category}
          </p>
          {highlight && <span className="ui-chip ui-chip-accent">{highlight}</span>}
        </div>
        <h3 className="text-base font-semibold tracking-[-0.02em] text-[var(--text-primary)]">{coach.name}</h3>
        <p className="text-sm text-[var(--text-secondary)]">{coach.tagline}</p>
        <p className="text-xs leading-5 text-[var(--text-muted)]">
          First help: {coach.firstStep}
        </p>
        <p className="text-xs leading-5 text-[var(--accent-primary-strong)]">{rationale}</p>
      </div>
    </button>
  );
}

function buildCoachRationale(
  coach: CoachProfile,
  input: {
    supportStyle: string;
    urgency: string;
    painPoints: string;
    biggestFriction: string;
    firstPriority: string;
    nonNegotiable: string;
    costSignals: string[];
  }
): string {
  const combined = [
    input.supportStyle,
    input.painPoints,
    input.biggestFriction,
    input.firstPriority,
    input.nonNegotiable,
    input.costSignals.join(' '),
  ]
    .join(' ')
    .toLowerCase();
  if (coach.id === 'mindset' && /(overwhelm|stress|anxious|confidence|mental load)/.test(combined)) {
    return 'Strong fit for emotional load and mental clarity.';
  }
  if (coach.id === 'finance' && /(money|cash|debt|budget|invoice|rent)/.test(combined)) {
    return 'Strong fit for financial pressure and tradeoff decisions.';
  }
  if (coach.id === 'legal-structure' && /(legal|contract|risk|compliance|policy|deadline)/.test(combined)) {
    return 'Strong fit for legal exposure and structural risk.';
  }
  if (coach.id === 'relationship-family' && /(relationship|conflict|trust|family|communication)/.test(combined)) {
    return 'Strong fit for sensitive people dynamics and trust repair.';
  }
  if (coach.id === 'health-balance' && /(energy|burnout|health|sleep)/.test(combined)) {
    return 'Strong fit for protecting energy and sustainable progress.';
  }
  if (coach.id === 'practical-life' && (input.urgency === 'High' || input.urgency === 'Critical')) {
    return 'Strong fit for fast stabilization and concrete action.';
  }
  if (coach.id === 'business' && /(strategy|client|launch|sales|operations)/.test(combined)) {
    return 'Strong fit for strategic business movement.';
  }
  return 'Matched to your context and preferred support style.';
}

function SummaryBlock({ title, body, onEdit }: { title: string; body: string; onEdit: () => void }) {
  return (
    <div className="space-y-2 rounded-[14px] border border-[var(--border-subtle)] bg-[var(--surface-primary)] p-4">
      <div className="flex items-center justify-between gap-3">
        <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-[var(--text-secondary)]">{title}</p>
        <button type="button" onClick={onEdit} className="text-xs text-[var(--accent-primary-strong)]">
          Edit
        </button>
      </div>
      <p className="whitespace-pre-line text-sm leading-6 text-[var(--text-primary)]">{body}</p>
    </div>
  );
}
