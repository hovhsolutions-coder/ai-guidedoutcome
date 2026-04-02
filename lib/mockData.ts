// Mock data for dashboard statistics and overview
export const mockDashboardStats = {
  activeDossiers: 12,
  completedTasks: 47,
  pendingTasks: 8,
  totalUsers: 3,
};

export const mockRecentActivity = [
  {
    id: '1',
    type: 'dossier_created',
    title: 'New dossier "Q1 Strategy Review" created',
    timestamp: '2 hours ago',
  },
  {
    id: '2',
    type: 'task_completed',
    title: 'Task "Market analysis" completed',
    timestamp: '4 hours ago',
  },
  {
    id: '3',
    type: 'dossier_updated',
    title: 'Dossier "Product Roadmap" updated',
    timestamp: '1 day ago',
  },
];

export type DossierPhase = 'Understanding' | 'Structuring' | 'Executing' | 'Completed' | 'Action';

export type TaskPriority = 'high' | 'medium' | 'low';

export interface Subtask {
  id: string;
  name: string;
  completed: boolean;
}

export interface Task {
  name: string;
  notes?: string;
  priority?: TaskPriority;
  category?: string;
  dueDate?: string;
  estimate?: string;
  actualTime?: number;
  isTracking?: boolean;
  trackingStartedAt?: string;
  milestone?: string;
  completed?: boolean;
  subtasks?: Subtask[];
  dependencies?: string[];
}

export type ActivityType =
  | 'task_added' | 'task_completed' | 'task_uncompleted' | 'task_deleted'
  | 'task_renamed' | 'task_due_date_set' | 'task_due_date_cleared'
  | 'task_note_set' | 'task_note_cleared' | 'task_priority_set' | 'task_priority_cleared'
  | 'task_category_set' | 'task_category_cleared' | 'task_estimate_set' | 'task_estimate_cleared'
  | 'task_tracking_started' | 'task_tracking_stopped'
  | 'task_dependency_added' | 'task_dependency_removed'
  | 'task_milestone_set' | 'task_milestone_cleared'
  | 'subtask_added' | 'subtask_completed' | 'subtask_uncompleted' | 'subtask_edited' | 'subtask_deleted'
  | 'phase_changed'
  | 'dossier_created' | 'dossier_updated' | 'completed' | 'milestone_reached';

export interface ActivityEntry {
  id: string;
  type: ActivityType;
  description: string;
  timestamp: string;
  taskName?: string;
  oldValue?: string;
  newValue?: string;
  batchCount?: number;
}

import { type CharacterProfile, type ProgressionState } from '@/src/lib/progression/types';
import {
  type GuidanceNarrativeContract,
  type GuidanceSystemPlanContract,
  type GuidanceExecutionPlanContract,
} from '@/src/lib/guidance-session/types';
import { type ChatMessageData } from '@/components/chat/ChatMessage';

export interface MockDossier {
  id: string;
  title: string;
  situation: string;
  main_goal: string;
  phase: DossierPhase;
  progress: number; // 0-100
  lastActivity: string;
  createdAt: string;
  tasks: (Task | string)[];
  completedTasks?: string[];
  activityHistory?: ActivityEntry[];
  chatHistory?: ChatMessageData[];
  narrative?: GuidanceNarrativeContract | null;
  systemPlan?: GuidanceSystemPlanContract | null;
  executionPlan?: GuidanceExecutionPlanContract | null;
  characterProfile?: CharacterProfile;
  progressionState?: ProgressionState;
}

export const mockDossiers: MockDossier[] = [
  {
    id: '1',
    title: 'Q1 Strategy Review',
    situation: 'We need to evaluate our current business strategy and identify areas for improvement in the Q1 timeframe.',
    main_goal: 'Complete comprehensive strategy review and develop actionable roadmap for the next quarter.',
    phase: 'Understanding',
    progress: 35,
    lastActivity: 'Added market research data',
    createdAt: '2 days ago',
    tasks: ['Market research', 'Competitor analysis', 'Internal audit'],
  },
  {
    id: '2',
    title: 'Product Roadmap 2026',
    situation: 'We have identified several product opportunities but need a structured approach to prioritize and plan development.',
    main_goal: 'Create a detailed product roadmap for 2026 with clear milestones and resource allocation.',
    phase: 'Structuring',
    progress: 68,
    lastActivity: 'Defined key objectives',
    createdAt: '1 week ago',
    tasks: ['Priority scoring', 'Resource planning', 'Timeline definition'],
  },
  {
    id: '3',
    title: 'Team Expansion Plan',
    situation: 'Current team is at capacity and we need to grow our engineering and product teams to meet business goals.',
    main_goal: 'Successfully hire 5 new team members within the next 8 weeks.',
    phase: 'Executing',
    progress: 92,
    lastActivity: 'Finalized hiring strategy',
    createdAt: '3 days ago',
    tasks: ['Job descriptions', 'Recruiting outreach', 'Interview process', 'Offer negotiations'],
  },
  {
    id: '4',
    title: 'Customer Feedback Analysis',
    situation: 'We received numerous customer inquiries and feedback during our last release cycle.',
    main_goal: 'Analyze all customer feedback and identify top 5 feature requests.',
    phase: 'Understanding',
    progress: 23,
    lastActivity: 'Collected survey responses',
    createdAt: '5 days ago',
    tasks: ['Survey design', 'Response collection', 'Theme analysis'],
  },
  {
    id: '5',
    title: 'Technology Stack Migration',
    situation: 'Our current stack is becoming difficult to scale and maintain for our growing feature set.',
    main_goal: 'Develop a comprehensive migration plan to modernize our technology stack.',
    phase: 'Structuring',
    progress: 51,
    lastActivity: 'Evaluated migration options',
    createdAt: '1 week ago',
    tasks: ['Technology assessment', 'Risk analysis', 'Migration planning'],
  },
  {
    id: '6',
    title: 'Marketing Campaign Q2',
    situation: 'We are launching a new feature and need a coordinated marketing push to drive adoption.',
    main_goal: 'Achieve 500 new signups from Q2 marketing campaign.',
    phase: 'Executing',
    progress: 78,
    lastActivity: 'Launched initial testing',
    createdAt: '4 days ago',
    tasks: ['Campaign strategy', 'Creative development', 'Media buying', 'Performance tracking'],
  },
];

/**
 * Get a dossier by ID
 */
export function getDossierById(id: string): MockDossier | undefined {
  return mockDossiers.find(dossier => dossier.id === id);
}
