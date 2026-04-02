import {
  type GuidanceNarrativeContract,
  type GuidanceSystemPlanContract,
  type GuidanceExecutionPlanContract,
  type DepartmentDefinition,
  type TaskDefinition,
} from '@/src/lib/guidance-session/types';
import { type AIRequestInput } from '@/src/lib/ai/types';
import { type GuidancePrimaryDomain } from '@/src/lib/ai/domain/types';
import { type GuidanceModeId } from '@/src/lib/ai/modes/types';

interface BuildStructuredContractsInput {
  situation?: string;
  main_goal?: string;
  user_input?: string;
  intakeAnswers?: Record<string, unknown>;
  detectedDomain: GuidancePrimaryDomain;
  activeMode: GuidanceModeId;
  summary: string;
  nextStep: string;
  suggestedTasks: string[];
}

export function buildStructuredContracts(
  input: BuildStructuredContractsInput
): {
  narrative: GuidanceNarrativeContract;
  systemPlan: GuidanceSystemPlanContract;
  executionPlan: GuidanceExecutionPlanContract;
} {
  const narrative = buildNarrativeContract(input);
  const systemPlan = buildSystemPlanContract(input, narrative);
  const executionPlan = buildExecutionPlanContract(input, narrative, systemPlan);

  return {
    narrative,
    systemPlan,
    executionPlan,
  };
}

function buildNarrativeContract(
  input: BuildStructuredContractsInput
): GuidanceNarrativeContract {
  const situation = input.situation ?? input.user_input ?? '';
  const goal = input.main_goal ?? extractGoalFromSummary(input.summary) ?? '';
  const constraints = extractConstraints(input);
  const context = buildContextFromIntake(input.intakeAnswers);

  return {
    situation,
    goal,
    constraints,
    context,
    confidence: calculateNarrativeConfidence(input),
    extractedFrom: {
      rawInput: input.user_input ?? '',
      intakeAnswers: input.intakeAnswers ?? {},
      timestamp: new Date().toISOString(),
    },
  };
}

function buildSystemPlanContract(
  input: BuildStructuredContractsInput,
  narrative: GuidanceNarrativeContract
): GuidanceSystemPlanContract {
  const departments = generateDepartments(input.detectedDomain, narrative);
  const primaryDepartment = determinePrimaryDepartment(departments, input.detectedDomain);
  const resourceAllocation = allocateResources(departments, narrative);
  const strategicPriorities = deriveStrategicPriorities(narrative, input.suggestedTasks);

  return {
    departments,
    primaryDepartment,
    resourceAllocation,
    strategicPriorities,
    generatedAt: new Date().toISOString(),
  };
}

function buildExecutionPlanContract(
  input: BuildStructuredContractsInput,
  narrative: GuidanceNarrativeContract,
  systemPlan: GuidanceSystemPlanContract
): GuidanceExecutionPlanContract {
  const tasks = generateTasks(input.suggestedTasks, systemPlan.departments, narrative);
  const criticalPath = determineCriticalPath(tasks);
  const milestones = generateMilestones(tasks, narrative.goal);
  const totalEstimatedDuration = estimateTotalDuration(tasks);

  return {
    tasks,
    criticalPath,
    milestones,
    totalEstimatedDuration,
    generatedAt: new Date().toISOString(),
  };
}

// Helper functions

function extractGoalFromSummary(summary: string): string | undefined {
  const goalPatterns = [
    /goal is to ([^.]+)/i,
    /aiming to ([^.]+)/i,
    /objective is to ([^.]+)/i,
    /target is to ([^.]+)/i,
    /focus is on ([^.]+)/i,
  ];

  for (const pattern of goalPatterns) {
    const match = summary.match(pattern);
    if (match) {
      return match[1].trim();
    }
  }

  return undefined;
}

function extractConstraints(input: BuildStructuredContractsInput): string[] {
  const constraints: string[] = [];
  const text = `${input.situation} ${input.user_input} ${JSON.stringify(input.intakeAnswers)}`.toLowerCase();

  const constraintPatterns = [
    { pattern: /\b(budget|cost|money|financial|funding)\b/, label: 'Financial constraints' },
    { pattern: /\b(time|deadline|urgent|asap|schedule|timeline)\b/, label: 'Time constraints' },
    { pattern: /\b(people|team|staff|resource|manpower)\b/, label: 'Resource constraints' },
    { pattern: /\b(technical|technology|system|tool|platform)\b/, label: 'Technical constraints' },
    { pattern: /\b(legal|regulation|compliance|policy|requirement)\b/, label: 'Regulatory constraints' },
  ];

  for (const { pattern, label } of constraintPatterns) {
    if (pattern.test(text)) {
      constraints.push(label);
    }
  }

  return constraints.length > 0 ? constraints : ['No explicit constraints identified'];
}

function buildContextFromIntake(intakeAnswers?: Record<string, unknown>): string {
  if (!intakeAnswers || Object.keys(intakeAnswers).length === 0) {
    return 'Initial guidance request';
  }

  const contextParts: string[] = [];
  for (const [key, value] of Object.entries(intakeAnswers)) {
    if (value && typeof value === 'string' && value.trim().length > 0) {
      contextParts.push(`${key.replace(/_/g, ' ')}: ${value}`);
    }
  }

  return contextParts.join('; ') || 'Initial guidance request';
}

function calculateNarrativeConfidence(input: BuildStructuredContractsInput): number {
  let confidence = 0.7; // Base confidence

  if (input.situation && input.situation.length > 20) {
    confidence += 0.1;
  }
  if (input.main_goal && input.main_goal.length > 10) {
    confidence += 0.1;
  }
  if (input.intakeAnswers && Object.keys(input.intakeAnswers).length > 0) {
    confidence += 0.1;
  }

  return Math.min(confidence, 0.95);
}

function generateDepartments(
  domain: GuidancePrimaryDomain,
  narrative: GuidanceNarrativeContract
): DepartmentDefinition[] {
  const departments: DepartmentDefinition[] = [];

  // Core department based on domain
  const coreDepartment = createCoreDepartment(domain, narrative);
  departments.push(coreDepartment);

  // Support departments based on constraints and context
  if (narrative.constraints.some(c => c.includes('Financial'))) {
    departments.push(createFinanceDepartment(narrative));
  }
  if (narrative.constraints.some(c => c.includes('Time')) || narrative.constraints.some(c => c.includes('Resource'))) {
    departments.push(createOperationsDepartment(narrative));
  }
  if (domain === 'planning' || domain === 'business_financial') {
    departments.push(createStrategyDepartment(narrative));
  }
  if (domain === 'problem_solving' || domain === 'decision') {
    departments.push(createExecutionDepartment(narrative));
  }

  return departments;
}

function createCoreDepartment(
  domain: GuidancePrimaryDomain,
  narrative: GuidanceNarrativeContract
): DepartmentDefinition {
  const departmentMap: Record<GuidancePrimaryDomain, { name: string; role: string }> = {
    planning: { name: 'Planning', role: 'Strategic direction and roadmap creation' },
    decision: { name: 'Decision Support', role: 'Options analysis and decision framework' },
    problem_solving: { name: 'Problem Resolution', role: 'Issue diagnosis and solution implementation' },
    conflict: { name: 'Conflict Resolution', role: 'Stakeholder alignment and mediation' },
    emotional: { name: 'Emotional Support', role: 'Emotional processing and resilience building' },
    business_financial: { name: 'Business Operations', role: 'Business strategy and financial planning' },
    quick_question: { name: 'Quick Assistance', role: 'Rapid guidance and information' },
  };

  const { name, role } = departmentMap[domain] ?? { name: 'General Guidance', role: 'Comprehensive support' };

  return {
    id: domain,
    name,
    role,
    responsibilities: [narrative.goal || 'Primary objective execution'],
    resources: ['AI guidance system', 'Domain expertise', 'Best practices'],
    dependencies: [],
  };
}

function createFinanceDepartment(narrative: GuidanceNarrativeContract): DepartmentDefinition {
  return {
    id: 'finance',
    name: 'Finance',
    role: 'Budget management and financial oversight',
    responsibilities: ['Budget allocation', 'Cost tracking', 'Financial feasibility assessment'],
    resources: ['Financial templates', 'Budget calculators', 'Cost-benefit analysis tools'],
    dependencies: ['planning'],
  };
}

function createOperationsDepartment(narrative: GuidanceNarrativeContract): DepartmentDefinition {
  return {
    id: 'operations',
    name: 'Operations',
    role: 'Resource management and operational execution',
    responsibilities: ['Resource allocation', 'Timeline management', 'Process coordination'],
    resources: ['Project management tools', 'Resource planners', 'Timeline trackers'],
    dependencies: ['planning'],
  };
}

function createStrategyDepartment(narrative: GuidanceNarrativeContract): DepartmentDefinition {
  return {
    id: 'strategy',
    name: 'Strategy',
    role: 'Strategic planning and priority setting',
    responsibilities: ['Strategic alignment', 'Priority sequencing', 'Goal refinement'],
    resources: ['Strategic frameworks', 'Goal-setting methodologies', 'Priority matrices'],
    dependencies: [],
  };
}

function createExecutionDepartment(narrative: GuidanceNarrativeContract): DepartmentDefinition {
  return {
    id: 'execution',
    name: 'Execution',
    role: 'Implementation and task management',
    responsibilities: ['Task execution', 'Progress tracking', 'Deliverable completion'],
    resources: ['Task trackers', 'Execution templates', 'Progress dashboards'],
    dependencies: ['planning', 'operations'],
  };
}

function determinePrimaryDepartment(
  departments: DepartmentDefinition[],
  detectedDomain: GuidancePrimaryDomain
): string {
  const coreDept = departments.find(d => d.id === detectedDomain);
  return coreDept?.id ?? departments[0]?.id ?? 'general';
}

function allocateResources(
  departments: DepartmentDefinition[],
  narrative: GuidanceNarrativeContract
): Record<string, string[]> {
  const allocation: Record<string, string[]> = {};

  for (const dept of departments) {
    allocation[dept.id] = [
      'AI guidance support',
      'Domain-specific templates',
      'Best practice documentation',
    ];
  }

  return allocation;
}

function deriveStrategicPriorities(
  narrative: GuidanceNarrativeContract,
  suggestedTasks: string[]
): string[] {
  const priorities: string[] = [];

  if (narrative.goal) {
    priorities.push(`Achieve: ${narrative.goal}`);
  }

  if (suggestedTasks.length > 0) {
    priorities.push(`Complete initial task: ${suggestedTasks[0]}`);
  }

  if (narrative.constraints.some(c => c.includes('Time'))) {
    priorities.push('Manage timeline constraints');
  }

  if (narrative.constraints.some(c => c.includes('Financial'))) {
    priorities.push('Maintain budget discipline');
  }

  return priorities.length > 0 ? priorities : ['Execute primary objective'];
}

function generateTasks(
  suggestedTasks: string[],
  departments: DepartmentDefinition[],
  narrative: GuidanceNarrativeContract
): TaskDefinition[] {
  const tasks: TaskDefinition[] = [];
  const primaryDept = departments[0]?.id ?? 'general';

  for (let i = 0; i < suggestedTasks.length; i++) {
    const taskTitle = suggestedTasks[i];
    const task: TaskDefinition = {
      id: `task_${i + 1}`,
      title: taskTitle,
      description: `Execute: ${taskTitle}`,
      department: i === 0 ? primaryDept : (departments[i % departments.length]?.id ?? primaryDept),
      priority: i === 0 ? 'critical' : i < 3 ? 'high' : 'medium',
      estimatedDuration: estimateTaskDuration(taskTitle, i),
      dependencies: i > 0 ? [`task_${i}`] : [],
      deliverable: `Completed: ${taskTitle}`,
    };
    tasks.push(task);
  }

  return tasks;
}

function estimateTaskDuration(taskTitle: string, index: number): string {
  const lowerTitle = taskTitle.toLowerCase();

  if (lowerTitle.includes('research') || lowerTitle.includes('analyze')) {
    return '2-4 hours';
  }
  if (lowerTitle.includes('plan') || lowerTitle.includes('design')) {
    return '3-6 hours';
  }
  if (lowerTitle.includes('implement') || lowerTitle.includes('build')) {
    return '4-8 hours';
  }
  if (lowerTitle.includes('review') || lowerTitle.includes('feedback')) {
    return '1-2 hours';
  }

  return index === 0 ? '2-4 hours' : '1-3 hours';
}

function determineCriticalPath(tasks: TaskDefinition[]): string[] {
  if (tasks.length === 0) return [];

  // First task is always critical
  const criticalPath: string[] = [tasks[0].id];

  // Add tasks with no dependencies or critical priority
  for (let i = 1; i < tasks.length; i++) {
    if (tasks[i].priority === 'critical' || tasks[i].dependencies.length === 0) {
      criticalPath.push(tasks[i].id);
    }
  }

  return criticalPath;
}

function generateMilestones(
  tasks: TaskDefinition[],
  goal: string
): Array<{ name: string; tasks: string[]; targetDate: string }> {
  const milestones: Array<{ name: string; tasks: string[]; targetDate: string }> = [];

  if (tasks.length === 0) return milestones;

  // Initial milestone - first task
  milestones.push({
    name: 'Initial Progress',
    tasks: [tasks[0].id],
    targetDate: 'Within 24 hours',
  });

  // Middle milestone - 50% completion
  if (tasks.length > 2) {
    const middleIndex = Math.floor(tasks.length / 2);
    milestones.push({
      name: 'Halfway Point',
      tasks: tasks.slice(0, middleIndex + 1).map(t => t.id),
      targetDate: 'Within 1 week',
    });
  }

  // Final milestone - all tasks
  milestones.push({
    name: goal ? `Goal Achieved: ${goal}` : 'Objective Complete',
    tasks: tasks.map(t => t.id),
    targetDate: 'Within 2 weeks',
  });

  return milestones;
}

function estimateTotalDuration(tasks: TaskDefinition[]): string {
  if (tasks.length === 0) return 'N/A';
  if (tasks.length <= 2) return '1-3 days';
  if (tasks.length <= 5) return '3-7 days';
  return '1-2 weeks';
}
