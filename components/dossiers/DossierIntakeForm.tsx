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

const supportStyleOptions = [
  'Calm and empathic',
  'Direct and decisive',
  'Practical and step-by-step',
  'Strategic and big-picture',
  'Motivating and accountability-focused',
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
    title: 'Situation',
    question: 'What is happening right now?',
    helper: 'This anchors your dossier and helps us choose the right coach lens.',
  },
  {
    id: 'pain-impact',
    title: 'Pain & Impact',
    question: 'Where does this hurt most today?',
    helper: 'Naming pain clearly helps us prioritize what must be stabilized first.',
  },
  {
    id: 'outcome-reality',
    title: 'Outcome & Reality',
    question: 'What do you want, and what is blocking it?',
    helper: 'We turn this into realistic next moves, not vague intentions.',
  },
  {
    id: 'coach-fit',
    title: 'Coach Fit',
    question: 'What kind of support helps you move?',
    helper: 'Your coach match should feel personal, not generic.',
  },
  {
    id: 'review',
    title: 'Review',
    question: 'Does this reflect your real situation?',
    helper: 'Quick check before we generate your guided dossier.',
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
  const [urgency, setUrgency] = useState<string>(initialValues?.urgency ?? '');
  const [painPoints, setPainPoints] = useState<string>(initialValues?.painPoints ?? '');
  const [impactAreas, setImpactAreas] = useState<string[]>(initialValues?.impactAreas ?? []);
  const [impactIfUnresolved, setImpactIfUnresolved] = useState<string>(initialValues?.impactIfUnresolved ?? '');
  const [goal, setGoal] = useState<string>(initialValues?.goal ?? '');
  const [longTermOutcome, setLongTermOutcome] = useState<string>(initialValues?.longTermOutcome ?? '');
  const [triedAlready, setTriedAlready] = useState<string>(initialValues?.triedAlready ?? '');
  const [involved, setInvolved] = useState<string>(initialValues?.involved ?? '');
  const [blocking, setBlocking] = useState<string>(initialValues?.blocking ?? '');
  const [constraints, setConstraints] = useState<string>(initialValues?.constraints ?? '');
  const [resources, setResources] = useState<string>(initialValues?.resources ?? '');
  const [emotionalState, setEmotionalState] = useState<string>(initialValues?.emotionalState ?? '');
  const [supportStyle, setSupportStyle] = useState<string>(initialValues?.supportStyle ?? '');
  const [coachStyle, setCoachStyle] = useState<string>(initialValues?.coachStyle ?? '');
  const [firstPriority, setFirstPriority] = useState<string>(initialValues?.firstPriority ?? '');
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
        painPoints,
        impactIfUnresolved,
        blocking,
        triedAlready,
        firstPriority,
        urgency,
        supportStyle,
        coachStyle,
        emotionalState,
      }).slice(0, 3),
    [
      selectedCategory,
      situation,
      goal,
      painPoints,
      impactIfUnresolved,
      blocking,
      triedAlready,
      firstPriority,
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
      if (!selectedCategory) return 'Choose the area where this situation belongs.';
      if (!situation) return 'Describe what is happening so we can anchor your dossier clearly.';
      if (!goal.trim()) return 'Name the near-term result you want to reach.';
    }

    if (step === 1) {
      if (!painPoints.trim()) return 'Name what hurts most right now.';
      if (impactAreas.length === 0) return 'Select at least one area that is being affected.';
      if (!impactIfUnresolved.trim()) return 'Describe what happens if this remains unresolved.';
    }

    if (step === 2) {
      if (!goal.trim()) return 'Define your short-term result so we can target your first dossier output.';
      if (!firstPriority.trim()) return 'Set the first stabilization priority before generating.';
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

  const submitIntake = (overrides?: Partial<IntakeFormValues>) => {
    const nextValues: IntakeFormValues = {
      category: selectedCategory,
      situationDetails: customSituation,
      timeline,
      painPoints,
      impactAreas,
      impactIfUnresolved,
      goal,
      longTermOutcome,
      triedAlready,
      urgency,
      involved,
      blocking,
      constraints,
      resources,
      emotionalState,
      supportStyle,
      coachStyle,
      firstPriority,
      coachId: selectedCoachId,
      ...overrides,
    };

    const nextSituation = nextValues.situationDetails.trim() || nextValues.category;
    const fallbackCoach = getCoachById(nextValues.coachId) ?? recommendedCoaches[0] ?? allCoaches[0] ?? null;

    const intakeAnswers: Record<string, unknown> = {
      category: nextValues.category,
      timeline: nextValues.timeline,
      pain_points: nextValues.painPoints,
      impact_areas: nextValues.impactAreas,
      impact_if_unresolved: nextValues.impactIfUnresolved,
      short_term_outcome: nextValues.goal,
      long_term_outcome: nextValues.longTermOutcome,
      tried_already: nextValues.triedAlready,
      involved: nextValues.involved,
      blocker: nextValues.blocking,
      constraints: nextValues.constraints,
      resources: nextValues.resources,
      emotional_state: nextValues.emotionalState,
      support_style: nextValues.supportStyle,
      coach_style: nextValues.coachStyle,
      first_priority: nextValues.firstPriority,
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
        painPoints: nextValues.painPoints,
        impactAreas: nextValues.impactAreas,
        impactIfUnresolved: nextValues.impactIfUnresolved,
        shortTermOutcome: nextValues.goal,
        longTermOutcome: nextValues.longTermOutcome,
        triedAlready: nextValues.triedAlready,
        constraints: nextValues.constraints,
        resources: nextValues.resources,
        emotionalState: nextValues.emotionalState,
        supportStyle: nextValues.supportStyle,
        coachStyle: nextValues.coachStyle,
        firstPriority: nextValues.firstPriority,
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
      urgency: urgency || 'Medium',
      supportStyle: supportStyle || 'Practical and step-by-step',
      painPoints: painPoints || `Need clarity and forward movement around: ${situation}`,
      impactAreas: impactAreas.length > 0 ? impactAreas : ['Time', 'Confidence'],
      impactIfUnresolved:
        impactIfUnresolved || 'Momentum will stay blocked and pressure will keep increasing.',
      firstPriority: firstPriority || goal,
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
          </div>
        </div>

        {currentStep === 0 && (
          <div className="space-y-4">
            <div>
              <label htmlFor="dossier-category" className="mb-2 block text-sm font-medium text-[var(--text-primary)]">
                Area of life or work
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
              <p className="mt-2 text-xs text-[var(--text-muted)]">
                This becomes the core context your coach and dossier work from.
              </p>
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
                placeholder="Refine the near-term result you want this dossier to deliver."
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
              {(urgency === 'High' || urgency === 'Critical') && (
                <p className="mt-2 text-xs text-[var(--warning-strong)]">
                  Because urgency is {urgency.toLowerCase()}, this should be the first move that creates immediate stability.
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
                placeholder="Example: concise, calm, and practical"
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
                    rationale={buildCoachRationale(coach, { supportStyle, urgency, painPoints, firstPriority })}
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
                    rationale={buildCoachRationale(coach, { supportStyle, urgency, painPoints, firstPriority })}
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
                title="Situation"
                body={`${selectedCategory || 'No area selected'}${timeline ? ` | ${timeline}` : ''}\n${situation || 'No situation provided yet.'}`}
                onEdit={() => setCurrentStep(0)}
              />
              <SummaryBlock
                title="Pain & Impact"
                body={`${painPoints || 'No pain points yet.'}\nImpact: ${impactAreas.length > 0 ? impactAreas.join(', ') : 'No impact areas selected'}\nIf unresolved: ${impactIfUnresolved || 'Not provided'}`}
                onEdit={() => setCurrentStep(1)}
              />
              <SummaryBlock
                title="Outcome & Reality"
                body={`Short-term outcome: ${goal || 'Not provided'}\nFirst priority: ${firstPriority || 'Not provided'}\nCurrent blocker: ${blocking || 'Not provided'}`}
                onEdit={() => setCurrentStep(2)}
              />
              <SummaryBlock
                title="Coach Match"
                body={`Coach: ${getCoachById(selectedCoachId)?.name ?? 'Not selected'}\nSupport style: ${supportStyle || 'Not selected'}\nCoach tone: ${coachStyle || 'Not provided'}`}
                onEdit={() => setCurrentStep(3)}
              />
            </div>
            <p className="text-sm leading-6 text-[var(--text-secondary)]">
              If this feels accurate, generate your dossier. Your coach, priorities, and first guidance will be based on this summary.
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
  input: { supportStyle: string; urgency: string; painPoints: string; firstPriority: string }
): string {
  const combined = `${input.supportStyle} ${input.painPoints} ${input.firstPriority}`.toLowerCase();
  if (coach.id === 'mindset' && /(overwhelm|stress|anxious|confidence)/.test(combined)) {
    return 'Strong fit for emotional load and mental clarity.';
  }
  if (coach.id === 'finance' && /(money|cash|debt|budget|invoice|rent)/.test(combined)) {
    return 'Strong fit for financial pressure and decisions.';
  }
  if (coach.id === 'legal-structure' && /(legal|contract|risk|compliance|policy)/.test(combined)) {
    return 'Strong fit for legal and structural risk.';
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
