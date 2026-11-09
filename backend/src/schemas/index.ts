import { z } from "zod";

// Auth
export const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

export const registerSchema = z
  .object({
    email: z.string().email(),
    password: z.string().min(1),
    name: z.string().min(1),
    role: z.string().optional(),
    department: z.string().optional().nullable(),
    team: z.string().optional().nullable(),
    specialty: z.string().optional(),
    phoneNumber: z.string().optional().nullable(),
    skills: z.array(z.string()).optional(),
    githubUsername: z.string().optional().nullable(),
    githubToken: z.string().optional().nullable(),
  })
  .passthrough();

// Admin user management
export const createUserSchema = z
  .object({
    email: z.string().email(),
    password: z.string().min(1),
    name: z.string().min(1),
    role: z.enum(["ADMIN", "MANAGER", "TEAM_LEAD", "DEVELOPER"]),
    department: z.string().optional().nullable(),
    team: z.string().optional().nullable(),
    specialty: z.string().optional().nullable(),
    phoneNumber: z.string().optional().nullable(),
    assignedPmId: z.number().nullish(),
  })
  .passthrough();

export const updateUserSchema = createUserSchema.partial().passthrough();

// Tasks
export const createTaskSchema = z
  .object({
    title: z.string().min(1),
    description: z.string().optional(),
    projectId: z.number(),
    assigneeId: z.number().nullish(),
    status: z.string().optional(),
    priority: z.string().optional(),
    dueDate: z.string().optional(),
    deadline: z.string().optional(),
    requiredRole: z.string().optional(),
    estimatedHours: z.number().optional(),
    tags: z.array(z.string()).optional(),
    teamId: z.number().nullish(),
    milestoneId: z.number().nullish(),
    parentTaskId: z.number().nullish(),
    labels: z.array(z.string()).optional(),
    dependencyIds: z.array(z.number()).optional(),
  })
  .passthrough();

export const updateTaskSchema = createTaskSchema.partial();

export const assignTaskSchema = z.object({
  assigneeId: z.number(),
});

// Projects
export const createProjectSchema = z
  .object({
    name: z.string().min(1),
    description: z.string().optional(),
    deadline: z.string().optional(),
    updateIntervalDays: z.number().optional(),
    requirements: z.string().optional(),
    repoUrl: z.string().optional(),
    techStack: z.string().optional(),
    teamId: z.number().nullish(),
    tags: z.array(z.string()).optional(),
  })
  .passthrough();

export const updateProjectSchema = createProjectSchema.partial();

// Reviews
export const submitReviewSchema = z
  .object({
    decision: z.enum(["APPROVE", "CHANGES_REQUESTED", "REJECTED"]),
    comments: z.string().optional(),
  })
  .passthrough();

// Planner
export const createPlannerEventSchema = z
  .object({
    title: z.string().min(1),
    date: z.string().min(1),
    type: z.string().min(1),
    isOrganizationWide: z.boolean().optional(),
    projectId: z.number().optional().nullable(),
    projectName: z.string().optional(),
  })
  .passthrough();

// Profile / password
export const changePasswordSchema = z.object({
  currentPassword: z.string().min(1),
  newPassword: z.string().min(1),
});

export const updateProfileSchema = z
  .object({
    name: z.string().optional(),
    phoneNumber: z.string().optional().nullable(),
    githubUsername: z.string().optional().nullable(),
    department: z.string().optional().nullable(),
    team: z.string().optional().nullable(),
    specialty: z.string().optional().nullable(),
  })
  .partial()
  .passthrough();
