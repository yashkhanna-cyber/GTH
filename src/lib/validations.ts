import { z } from 'zod'

export const loginSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
})

export const registerSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  email: z.string().email('Invalid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
  confirmPassword: z.string(),
  phone: z.string().optional(),
  enrollmentNo: z.string().min(1, 'Enrollment number is required'),
  department: z.string().min(1, 'Department is required'),
  branch: z.string().min(1, 'Branch is required'),
  year: z.coerce.number().min(1).max(4),
  batch: z.string().optional(),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
})

export const projectSchema = z.object({
  title: z.string().min(1, 'Title is required'),
  description: z.string().min(1, 'Description is required'),
  difficulty: z.enum(['EASY', 'MEDIUM', 'HARD', 'EXPERT']),
  hardware: z.string().optional(),
  expectedOutput: z.string().optional(),
  day: z.coerce.number().optional(),
})

export const submissionSchema = z.object({
  description: z.string().optional(),
  links: z.string().optional(),
  projectId: z.string().min(1, 'Project is required'),
})

export const challengeSchema = z.object({
  title: z.string().min(1, 'Title is required'),
  description: z.string().min(1, 'Description is required'),
  deadline: z.string().optional(),
  maxPoints: z.coerce.number().min(1).default(100),
  category: z.enum(['AI', 'IOT', 'CYBER', 'GENERAL']),
})

export const scoreSchema = z.object({
  points: z.coerce.number(),
  reason: z.string().min(1, 'Reason is required'),
  category: z.enum(['PROJECT', 'COMMUNITY', 'INNOVATION', 'REFERRAL', 'AI', 'IOT', 'CYBER']),
  studentId: z.string().min(1, 'Student is required'),
})

export type LoginInput = z.infer<typeof loginSchema>
export type RegisterInput = z.infer<typeof registerSchema>
export type ProjectInput = z.infer<typeof projectSchema>
export type SubmissionInput = z.infer<typeof submissionSchema>
export type ChallengeInput = z.infer<typeof challengeSchema>
export type ScoreInput = z.infer<typeof scoreSchema>
