import { z } from 'zod'

// Poll creation validation schema
export const createPollSchema = z.object({
  title: z
    .string()
    .min(1, 'Poll title is required')
    .max(200, 'Poll title must be less than 200 characters')
    .trim(),
  description: z
    .string()
    .max(1000, 'Description must be less than 1000 characters')
    .optional()
    .transform(val => val?.trim() || ''),
  options: z
    .array(z.string().min(1, 'Option cannot be empty').max(100, 'Option must be less than 100 characters'))
    .min(2, 'At least 2 options are required')
    .max(10, 'Maximum 10 options allowed')
    .refine(options => {
      const uniqueOptions = new Set(options.map(opt => opt.toLowerCase().trim()))
      return uniqueOptions.size === options.length
    }, 'All options must be unique'),
  expirationDate: z
    .string()
    .optional()
    .refine(date => {
      if (!date) return true
      const expDate = new Date(date)
      const now = new Date()
      return expDate > now
    }, 'Expiration date must be in the future'),
  requireLogin: z.boolean().default(false),
  allowMultipleSelections: z.boolean().default(false)
})

// Login validation schema
export const loginSchema = z.object({
  email: z
    .string()
    .min(1, 'Email is required')
    .email('Please enter a valid email address')
    .max(255, 'Email must be less than 255 characters')
    .toLowerCase()
    .trim(),
  password: z
    .string()
    .min(1, 'Password is required')
    .min(6, 'Password must be at least 6 characters long')
    .max(128, 'Password must be less than 128 characters')
})

// Register validation schema
export const registerSchema = z.object({
  email: z
    .string()
    .min(1, 'Email is required')
    .email('Please enter a valid email address')
    .max(255, 'Email must be less than 255 characters')
    .toLowerCase()
    .trim(),
  password: z
    .string()
    .min(1, 'Password is required')
    .min(6, 'Password must be at least 6 characters long')
    .max(128, 'Password must be less than 128 characters')
    .regex(
      /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/,
      'Password must contain at least one lowercase letter, one uppercase letter, and one number'
    ),
  confirmPassword: z
    .string()
    .min(1, 'Please confirm your password')
}).refine(data => data.password === data.confirmPassword, {
  message: 'Passwords do not match',
  path: ['confirmPassword']
})

// Vote submission validation schema
export const voteSchema = z.object({
  pollId: z
    .string()
    .min(1, 'Poll ID is required')
    .uuid('Invalid poll ID format'),
  optionIndex: z
    .number()
    .int('Option index must be an integer')
    .min(0, 'Invalid option selected')
})

// Poll toggle validation schema
export const togglePollSchema = z.object({
  pollId: z
    .string()
    .min(1, 'Poll ID is required')
    .uuid('Invalid poll ID format'),
  isActive: z.boolean()
})

// Type exports for use in components
export type CreatePollInput = z.infer<typeof createPollSchema>
export type LoginInput = z.infer<typeof loginSchema>
export type RegisterInput = z.infer<typeof registerSchema>
export type VoteInput = z.infer<typeof voteSchema>
export type TogglePollInput = z.infer<typeof togglePollSchema>