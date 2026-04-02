'use client';

import React, { useState, useRef, useEffect } from 'react';
import { GuidanceEnginePanel } from '@/components/guidance/GuidanceEnginePanel';
import { ChatMessageData, AIResponseContent } from './ChatMessage';
import { MockDossier } from '../../lib/mockData';
import { AITrainerId, AITrainerResponseOutput } from '@/src/lib/ai/types';

const AUTO_GUIDANCE_COOLDOWN_MS = 10000;

interface ChatPanelProps {
  dossier: MockDossier;
  onAddTask?: (task: string) => void;
  completedTasks?: Set<string>;
  totalTasks?: number;
  onTaskCompleted?: (task: string, completed: boolean) => void;
  onGuidanceChange?: (guidance: AIResponseContent | null) => void;
  currentObjective?: {
    title: string;
    focusBadge: string;
    statusLine: string;
  };
  completedDossiers?: Array<{ title: string; main_goal: string; id: string; relevanceScore?: number; outcomeSummary?: string; taskPatterns?: string[] }>;
}

export function ChatPanel({
  dossier,
  onAddTask,
  completedTasks = new Set(),
  totalTasks = 0,
  onTaskCompleted,
  onGuidanceChange,
  currentObjective,
  completedDossiers = [],
}: ChatPanelProps) {
  const [messages, setMessages] = useState<ChatMessageData[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [tasksAddedInSession, setTasksAddedInSession] = useState(0);
  const [lastSuggestedTaskCount, setLastSuggestedTaskCount] = useState(0);
  const [milestonesReached, setMilestonesReached] = useState<Set<string>>(new Set());
  const [activeTrainer, setActiveTrainer] = useState<AITrainerId | null>(null);
  const [trainerResponse, setTrainerResponse] = useState<AITrainerResponseOutput | null>(null);
  const [trainerError, setTrainerError] = useState<string | null>(null);
  const [trainerLoading, setTrainerLoading] = useState<AITrainerId | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const initialGuidanceDossierIdRef = useRef<string | null>(null);
  const requestInFlightRef = useRef(false);
  const autoGuidanceTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const lastAutoGuidanceAtRef = useRef(0);
  const knownTaskKeysRef = useRef<Set<string>>(new Set());

  const checkMilestones = (newTaskCount: number, newCompletedCount: number, totalTaskCount: number) => {
    const newMilestones: string[] = [];

    if (newTaskCount >= 1 && !milestonesReached.has('first_task_added')) {
      newMilestones.push('first_task_added');
    }

    if (newTaskCount >= 3 && !milestonesReached.has('three_tasks_added')) {
      newMilestones.push('three_tasks_added');
    }

    if (newCompletedCount >= 1 && !milestonesReached.has('first_task_completed')) {
      newMilestones.push('first_task_completed');
    }

    const progressPercent = totalTaskCount > 0 ? (newCompletedCount / totalTaskCount) * 100 : 0;
    if (progressPercent >= 50 && !milestonesReached.has('fifty_percent_progress')) {
      newMilestones.push('fifty_percent_progress');
    }

    newMilestones.forEach((milestone) => {
      let milestoneMessage: ChatMessageData;

      switch (milestone) {
        case 'first_task_added':
          milestoneMessage = {
            id: `milestone-${Date.now()}-${milestone}`,
            role: 'ai',
            content: {
              summary: 'You\'ve moved from thinking into action. This is where real progress starts.',
              next_step: 'Take that first step forward.',
              suggested_tasks: [],
            },
            timestamp: new Date(),
            messageType: 'milestone',
          };
          break;
        case 'three_tasks_added':
          milestoneMessage = {
            id: `milestone-${Date.now()}-${milestone}`,
            role: 'ai',
            content: {
              summary: 'You are now moving in the right direction. This is a solid foundation for your goal.',
              next_step: 'Pick one task and start executing.',
              suggested_tasks: [],
            },
            timestamp: new Date(),
            messageType: 'milestone',
          };
          break;
        case 'first_task_completed':
          milestoneMessage = {
            id: `milestone-${Date.now()}-${milestone}`,
            role: 'ai',
            content: {
              summary: 'Momentum is building. You\'ve completed your first task and created real traction.',
              next_step: 'Choose your next priority task.',
              suggested_tasks: [],
            },
            timestamp: new Date(),
            messageType: 'milestone',
          };
          break;
        case 'fifty_percent_progress':
          milestoneMessage = {
            id: `milestone-${Date.now()}-${milestone}`,
            role: 'ai',
            content: {
              summary: 'You\'re halfway there. The foundation is solid and progress is clear.',
              next_step: 'Maintain this momentum toward completion.',
              suggested_tasks: [],
            },
            timestamp: new Date(),
            messageType: 'milestone',
          };
          break;
        default:
          return;
      }

      setMessages((prev) => [...prev, milestoneMessage]);
      setMilestonesReached((prev) => new Set([...prev, milestone]));
    });
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    knownTaskKeysRef.current = new Set(
      dossier.tasks
        .map((task) => normalizeTask(typeof task === 'string' ? task : task.name))
        .filter((task) => task.length > 0)
    );
    setMessages([]);
    setError(null);
    setTasksAddedInSession(0);
    setLastSuggestedTaskCount(0);
    setMilestonesReached(new Set());
    setActiveTrainer(null);
    setTrainerResponse(null);
    setTrainerError(null);
    setTrainerLoading(null);
    requestInFlightRef.current = false;
    setIsLoading(false);

    if (autoGuidanceTimeoutRef.current) {
      clearTimeout(autoGuidanceTimeoutRef.current);
      autoGuidanceTimeoutRef.current = null;
    }
  }, [dossier.id, dossier.tasks]);

  useEffect(() => {
    if (initialGuidanceDossierIdRef.current === dossier.id) {
      return;
    }

    initialGuidanceDossierIdRef.current = dossier.id;
    void initializeWithAIGuidance();
  }, [dossier.id]);

  useEffect(() => {
    return () => {
      if (autoGuidanceTimeoutRef.current) {
        clearTimeout(autoGuidanceTimeoutRef.current);
      }
    };
  }, []);

  const initializeWithAIGuidance = async () => {
    if (requestInFlightRef.current) {
      return;
    }

    setIsLoading(true);
    requestInFlightRef.current = true;
    try {
      const data = await requestGuidance(
        'Give me a sharp initial read: what matters most now, what could slow progress, and what single move should we make first?',
        [...knownTaskKeysRef.current],
        'auto'
      );

      const aiMessage: ChatMessageData = {
        id: `msg-${Date.now()}`,
        role: 'ai',
        content: data.data as AIResponseContent,
        timestamp: new Date(),
        messageType: 'initial',
      };

      setMessages([aiMessage]);
      setLastSuggestedTaskCount(data.data.suggested_tasks?.length || 0);
      setError(null);
    } catch (err) {
      console.error('Failed to initialize AI guidance:', err);
      setError(err instanceof Error ? err.message : 'Failed to load initial guidance');
    } finally {
      requestInFlightRef.current = false;
      setIsLoading(false);
    }
  };

  const handleTaskAdded = (task: string) => {
    const normalizedTask = normalizeTask(task);
    if (!normalizedTask || knownTaskKeysRef.current.has(normalizedTask)) {
      return;
    }

    knownTaskKeysRef.current.add(normalizedTask);
    onAddTask?.(task);

    const newTaskCount = tasksAddedInSession + 1;
    setTasksAddedInSession(newTaskCount);
    checkMilestones(newTaskCount, completedTasks.size, totalTasks + 1);

    const shouldShowFeedback = newTaskCount === 1 || newTaskCount % 3 === 0;

    if (shouldShowFeedback) {
      const contextVariants = [
        `Adding "${task}" moves you closer to your goal: **${dossier.main_goal}**. In the ${dossier.phase} phase, this is exactly what matters.`,
        `Smart choice. Given your situation (${dossier.situation.substring(0, 45)}...), ${task} will accelerate progress toward ${dossier.main_goal}.`,
        `Perfect. "${task}" directly supports your ${dossier.phase} phase work. You're building the structure needed for your goal.`,
        `Good alignment. This task fits your context well, supports ${dossier.main_goal}, and matches the ${dossier.phase} phase work.`,
      ];

      let nextStep = 'Start with this one and build momentum.';
      if (newTaskCount >= 2) {
        nextStep = 'You now have clear direction. Pick one task and start executing.';
      } else if (newTaskCount >= 4) {
        nextStep = 'Excellent clarity. You have a solid roadmap. The next step is to begin with momentum.';
      }

      const contextSummary = contextVariants[Math.floor(Math.random() * contextVariants.length)];

      const followUpMessage: ChatMessageData = {
        id: `msg-${Date.now()}`,
        role: 'ai',
        content: {
          summary: contextSummary,
          next_step: nextStep,
          suggested_tasks: [],
        },
        timestamp: new Date(),
        messageType: 'followup',
      };

      setMessages((prev) => [...prev, followUpMessage]);
    }

    if (newTaskCount % 3 === 0 && newTaskCount >= 3) {
      const now = Date.now();
      if (!requestInFlightRef.current && now - lastAutoGuidanceAtRef.current >= AUTO_GUIDANCE_COOLDOWN_MS) {
        if (autoGuidanceTimeoutRef.current) {
          clearTimeout(autoGuidanceTimeoutRef.current);
        }

        autoGuidanceTimeoutRef.current = setTimeout(async () => {
          autoGuidanceTimeoutRef.current = null;

          if (requestInFlightRef.current) {
            return;
          }

          try {
            requestInFlightRef.current = true;
            setIsLoading(true);
            lastAutoGuidanceAtRef.current = Date.now();

            const data = await requestGuidance(
              `We now have ${newTaskCount} tasks. Re-rank the work, identify the single best next move, and suggest 2-3 supporting tasks that reduce risk or increase leverage without diluting focus on ${dossier.main_goal}.`,
              [...knownTaskKeysRef.current],
              'auto'
            );

            const refinedMessage: ChatMessageData = {
              id: `msg-${Date.now() + 200}`,
              role: 'ai',
              content: {
                summary: `You now have a solid base with ${newTaskCount} tasks. Here are the next strategic suggestions to consider.`,
                next_step: data.data.next_step,
                suggested_tasks: data.data.suggested_tasks.slice(0, 3),
              },
              timestamp: new Date(),
              messageType: 'refined',
            };
            setMessages((prev) => [...prev, refinedMessage]);
          } catch (generationError) {
            console.error('Failed to generate refined suggestions:', generationError);
          } finally {
            requestInFlightRef.current = false;
            setIsLoading(false);
          }
        }, 2000);
      }
    }

    if (newTaskCount === 1 && lastSuggestedTaskCount > 3) {
      setTimeout(() => {
        const nudgeMessage: ChatMessageData = {
          id: `msg-${Date.now() + 100}`,
          role: 'ai',
          content: {
            summary: 'You have enough options to move now. The priority is choosing one strong task and turning it into visible progress.',
            next_step: 'Choose the task that will create the clearest proof of momentum and start there.',
            suggested_tasks: [],
          },
          timestamp: new Date(),
          messageType: 'nudge',
        };
        setMessages((prev) => [...prev, nudgeMessage]);
      }, 5000);
    }
  };

  const addActionAsTask = (task: string) => {
    handleTaskAdded(task);
  };

  const handleTaskCompleted = (task: string, completed: boolean) => {
    onTaskCompleted?.(task, completed);
    const newCompletedCount = completed ? completedTasks.size + 1 : completedTasks.size - 1;
    checkMilestones(tasksAddedInSession, newCompletedCount, totalTasks);
  };

  const handleQuickAction = async (prompt: string) => {
    if (requestInFlightRef.current) {
      return;
    }

    const userMessage: ChatMessageData = {
      id: `msg-${Date.now()}`,
      role: 'user',
      content: prompt,
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setError(null);
    setIsLoading(true);
    requestInFlightRef.current = true;

    try {
      const data = await requestGuidance(prompt, [...knownTaskKeysRef.current], 'quick_action');

      const aiMessage: ChatMessageData = {
        id: `msg-${Date.now()}`,
        role: 'ai',
        content: data.data as AIResponseContent,
        timestamp: new Date(),
        messageType: 'response',
      };

      setMessages((prev) => [...prev, aiMessage]);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
      const errorMessage: ChatMessageData = {
        id: `msg-${Date.now()}`,
        role: 'ai',
        content: {
          summary: 'Fresh guidance was interrupted, but your current direction is still intact.',
          next_step: 'Refine the request or continue with the strongest visible next move.',
          suggested_tasks: ['Rephrase the request more specifically', 'Keep advancing the current priority task'],
        },
        timestamp: new Date(),
        messageType: 'response',
      };
      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      requestInFlightRef.current = false;
      setIsLoading(false);
    }
  };

  const handleSubmit = async (userInput: string) => {
    const trimmedInput = userInput.trim();
    if (!trimmedInput || requestInFlightRef.current) {
      return;
    }

    const userMessage: ChatMessageData = {
      id: `msg-${Date.now()}`,
      role: 'user',
      content: trimmedInput,
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setError(null);
    setIsLoading(true);
    requestInFlightRef.current = true;

    try {
      const data = await requestGuidance(trimmedInput, [...knownTaskKeysRef.current], 'manual');

      const aiMessage: ChatMessageData = {
        id: `msg-${Date.now()}`,
        role: 'ai',
        content: data.data as AIResponseContent,
        timestamp: new Date(),
        messageType: 'response',
      };

      setMessages((prev) => [...prev, aiMessage]);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
      const errorMessage: ChatMessageData = {
        id: `msg-${Date.now()}`,
        role: 'ai',
        content: {
          summary: 'Fresh guidance was interrupted, but your current direction is still intact.',
          next_step: 'Refine the request or continue with the strongest visible next move.',
          suggested_tasks: ['Rephrase the request more specifically', 'Keep advancing the current priority task'],
        },
        timestamp: new Date(),
        messageType: 'response',
      };
      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      requestInFlightRef.current = false;
      setIsLoading(false);
    }
  };

  const handleSelectTrainer = async (trainer: AITrainerId) => {
    if (trainerLoading) {
      return;
    }

    setActiveTrainer(trainer);
    setTrainerLoading(trainer);
    setTrainerError(null);
    setTrainerResponse(null);

    try {
      const data = await requestTrainer(trainer);
      setTrainerResponse(data.data);
    } catch (err) {
      setTrainerError(err instanceof Error ? err.message : 'Trainer guidance failed');
      setTrainerResponse(null);
    } finally {
      setTrainerLoading(null);
    }
  };

  const latestAiMessage = [...messages].reverse().find((message) => message.role === 'ai');
  const currentGuidance = latestAiMessage?.role === 'ai'
    ? (latestAiMessage.content as AIResponseContent)
    : null;
  const currentGuidanceLabel = getGuidanceLabel(latestAiMessage?.messageType);
  const historyMessages = latestAiMessage
    ? messages.filter((message) => message.id !== latestAiMessage.id).slice(-6)
    : messages.slice(-6);
  const primaryCtaLabel = getPrimaryCtaLabel(currentGuidance, knownTaskKeysRef.current, completedTasks.size);
  const decisionPrompt = getDecisionPrompt(dossier.phase, totalTasks, completedTasks.size);

  useEffect(() => {
    onGuidanceChange?.(currentGuidance);
  }, [currentGuidance, onGuidanceChange]);

  const requestGuidance = async (
    userInput: string,
    tasksOverride?: string[],
    triggerType?: 'auto' | 'quick_action' | 'manual'
  ) => {
    const response = await fetch('/api/ai/guidance', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        situation: dossier.situation,
        main_goal: dossier.main_goal,
        phase: dossier.phase,
        tasks: tasksOverride ?? [...knownTaskKeysRef.current],
        user_input: userInput,
        triggerType,
      }),
    });

    if (!response.ok) {
      const errorMessage = await getResponseErrorMessage(response);
      throw new Error(errorMessage ?? 'Failed to get AI response');
    }

    const data = await response.json();

    if (!data.success) {
      throw new Error(data.error || 'Unknown error occurred');
    }

    return data;
  };

  const requestTrainer = async (trainer: AITrainerId) => {
    const response = await fetch('/api/ai/trainer', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        trainer,
        situation: dossier.situation,
        main_goal: dossier.main_goal,
        phase: dossier.phase,
        tasks: [...knownTaskKeysRef.current],
        current_objective: currentObjective?.title ?? currentGuidance?.next_step ?? '',
        guidance_next_step: currentGuidance?.next_step ?? '',
      }),
    });

    if (!response.ok) {
      const errorMessage = await getResponseErrorMessage(response);
      throw new Error(errorMessage ?? 'Failed to get trainer response');
    }

    const data = await response.json();

    if (!data.success) {
      throw new Error(data.error || 'Unknown trainer error occurred');
    }

    return data as { success: true; data: AITrainerResponseOutput };
  };

  function normalizeTask(task: string): string {
    return task.trim().toLowerCase();
  }

  function isActionAdded(task: string): boolean {
    return knownTaskKeysRef.current.has(normalizeTask(task));
  }

  async function getResponseErrorMessage(response: Response): Promise<string | null> {
    try {
      const contentType = response.headers.get('content-type') ?? '';

      if (contentType.includes('application/json')) {
        const body = await response.json();

        if (typeof body?.error === 'string' && body.error.trim().length > 0) {
          return body.error;
        }

        if (typeof body?.message === 'string' && body.message.trim().length > 0) {
          return body.message;
        }
      } else {
        const bodyText = await response.text();
        if (bodyText.trim().length > 0) {
          return bodyText.trim();
        }
      }
    } catch {
      // Fall back to the default client-side error message when the response body cannot be parsed.
    }

    return null;
  }

  return (
    <>
      <GuidanceEnginePanel
        phase={dossier.phase}
        currentGuidance={currentGuidance}
        currentGuidanceLabel={currentGuidanceLabel}
        currentObjective={currentObjective?.title ?? currentGuidance?.next_step ?? 'Clarify the next move'}
        focusBadge={currentObjective?.focusBadge ?? 'Active focus'}
        statusLine={currentObjective?.statusLine ?? 'Use the guidance engine and execution layer to keep one clear objective in motion.'}
        historyMessages={historyMessages}
        error={error}
        isLoading={isLoading}
        primaryCtaLabel={primaryCtaLabel}
        decisionPrompt={decisionPrompt}
        totalTasks={totalTasks}
        completedCount={completedTasks.size}
        onAddAction={addActionAsTask}
        isActionAdded={isActionAdded}
        onPrimaryAction={() => {
          if (currentGuidance?.next_step) {
            addActionAsTask(currentGuidance.next_step);
          }
        }}
        onReviewTasks={() => {
          if (currentGuidance?.suggested_tasks[0]) {
            addActionAsTask(currentGuidance.suggested_tasks[0]);
          }
        }}
        onDecisionPrimary={() => handleQuickAction('What should I do next?')}
        onDecisionSecondary={() => handleQuickAction('What am I missing?')}
        onQuickPrompt={handleQuickAction}
        onRefineSubmit={handleSubmit}
        activeTrainer={activeTrainer}
        trainerResponse={trainerResponse}
        trainerError={trainerError}
        trainerLoading={trainerLoading}
        onSelectTrainer={handleSelectTrainer}
      />
      <div ref={messagesEndRef} />
    </>
  );
}

function getGuidanceLabel(messageType?: ChatMessageData['messageType']): string {
  switch (messageType) {
    case 'initial':
      return 'Initial read';
    case 'refined':
      return 'Updated read';
    case 'milestone':
      return 'Progress read';
    case 'followup':
      return 'Execution read';
    case 'nudge':
      return 'Coach note';
    default:
      return 'Current read';
  }
}

function getPrimaryCtaLabel(
  currentGuidance: AIResponseContent | null,
  knownTaskKeys: Set<string>,
  completedCount: number
): string {
  if (!currentGuidance?.next_step) {
    return 'Clarify next move';
  }

  const hasNextStepTask = knownTaskKeys.has(currentGuidance.next_step.trim().toLowerCase());

  if (!hasNextStepTask) {
    return 'Add recommended step';
  }

  if (completedCount > 0) {
    return 'Keep momentum';
  }

  return 'Focus this step';
}

function getDecisionPrompt(phase: string, totalTasks: number, completedCount: number): string {
  if (totalTasks === 0) {
    return `You are in the ${phase.toLowerCase()} phase without a first execution foothold yet. Which single move would create clarity fastest?`;
  }

  if (completedCount === 0) {
    return 'The plan exists, but momentum has not started yet. Which open task should become the first visible win?';
  }

  return 'Momentum is already visible. What decision would sharpen the next move without slowing the pace?';
}
