/**
 * Input Validation Schemas using Zod
 *
 * This file contains all validation schemas used across the application
 * to ensure type safety and input validation for API endpoints.
 */

import { z } from 'zod'

// ============================================================================
// Common Validators
// ============================================================================

/**
 * UUID validator (version 4)
 * Used for validating user IDs, team IDs, etc.
 */
export const uuidSchema = z.string().uuid({
  message: 'Invalid UUID format'
})

/**
 * Email validator
 */
export const emailSchema = z.string().email({
  message: 'Invalid email format'
})

/**
 * FPL Team ID validator
 * Must be a positive integer
 */
export const fplTeamIdSchema = z.number().int().positive({
  message: 'FPL Team ID must be a positive integer'
}).or(z.string().regex(/^\d+$/, {
  message: 'FPL Team ID must be a numeric string'
}).transform(Number))

/**
 * FPL League ID validator
 * Must be a positive integer
 */
export const fplLeagueIdSchema = z.number().int().positive({
  message: 'FPL League ID must be a positive integer'
}).or(z.string().regex(/^\d+$/, {
  message: 'FPL League ID must be a numeric string'
}).transform(Number))

/**
 * Pagination limit validator
 * Between 1 and 100
 */
export const paginationLimitSchema = z.number().int().min(1).max(100).default(10).or(
  z.string().regex(/^\d+$/).transform(Number).pipe(z.number().int().min(1).max(100))
)

/**
 * Pagination page validator
 * Minimum value of 1
 */
export const paginationPageSchema = z.number().int().min(1).default(1).or(
  z.string().regex(/^\d+$/).transform(Number).pipe(z.number().int().min(1))
)

// ============================================================================
// Auth Schemas
// ============================================================================

/**
 * Guest authentication request
 * No body required
 */
export const guestAuthSchema = z.object({})

/**
 * User signup request
 */
export const signupSchema = z.object({
  email: emailSchema,
  password: z.string().min(8, {
    message: 'Password must be at least 8 characters'
  }),
  displayName: z.string().min(1).max(100).optional()
})

/**
 * User login request
 */
export const loginSchema = z.object({
  email: emailSchema,
  password: z.string().min(1, {
    message: 'Password is required'
  })
})

// ============================================================================
// Team Schemas
// ============================================================================

/**
 * Team import request
 */
export const teamImportSchema = z.object({
  userId: uuidSchema,
  teamId: fplTeamIdSchema
})

/**
 * Team data query params
 */
export const teamDataQuerySchema = z.object({
  userId: uuidSchema.optional() // Optional because it's extracted from JWT now
})

// ============================================================================
// League Schemas
// ============================================================================

/**
 * League import request
 */
export const leagueImportSchema = z.object({
  userId: uuidSchema,
  leagueId: fplLeagueIdSchema
})

/**
 * League list query params
 */
export const leagueListQuerySchema = z.object({
  userId: uuidSchema.optional(), // Optional because it's extracted from JWT now
  page: paginationPageSchema.optional(),
  limit: paginationLimitSchema.optional()
})

/**
 * League detail query params
 */
export const leagueDetailQuerySchema = z.object({
  userId: uuidSchema.optional(), // Optional because it's extracted from JWT now
  leagueId: fplLeagueIdSchema
})

// ============================================================================
// Notification Schemas
// ============================================================================

/**
 * Notification create request
 */
export const notificationCreateSchema = z.object({
  type: z.enum(['injury_alert', 'system', 'league_update'], {
    message: 'Invalid notification type'
  }),
  title: z.string().min(1).max(200),
  message: z.string().min(1).max(1000),
  data: z.any().optional()
})

/**
 * Notification mark as read request
 */
export const notificationMarkReadSchema = z.object({
  notificationIds: z.array(uuidSchema).optional(),
  markAll: z.boolean().optional()
})

/**
 * Notification delete request
 */
export const notificationDeleteSchema = z.object({
  notificationIds: z.array(uuidSchema).optional(),
  deleteAll: z.boolean().optional()
})

/**
 * Notification list query params
 */
export const notificationListQuerySchema = z.object({
  userId: uuidSchema.optional(), // Optional because it's extracted from JWT now
  limit: paginationLimitSchema.optional()
})

// ============================================================================
// Advisor Schemas
// ============================================================================

/**
 * AI chat request
 */
export const aiChatSchema = z.object({
  userId: uuidSchema,
  message: z.string().min(1, {
    message: 'Message cannot be empty'
  }).max(2000, {
    message: 'Message is too long (max 2000 characters)'
  })
})

// ============================================================================
// Helper Functions
// ============================================================================

/**
 * Safely parse and validate data with a schema
 *
 * @param schema - Zod schema to validate against
 * @param data - Data to validate
 * @returns Validation result with parsed data or errors
 */
export function validateData<T>(
  schema: z.ZodSchema<T>,
  data: unknown
): {
  success: boolean
  data?: T
  errors?: z.ZodError
} {
  try {
    const result = schema.safeParse(data)

    if (result.success) {
      return {
        success: true,
        data: result.data
      }
    }

    return {
      success: false,
      errors: result.error
    }
  } catch (error) {
    return {
      success: false,
      errors: error as z.ZodError
    }
  }
}

/**
 * Format Zod errors for API responses
 *
 * @param error - Zod error object
 * @returns Formatted error messages
 */
export function formatValidationErrors(error: z.ZodError): Record<string, string[]> {
  const formatted: Record<string, string[]> = {}

  error.errors.forEach((err) => {
    const path = err.path.join('.') || 'general'
    if (!formatted[path]) {
      formatted[path] = []
    }
    formatted[path].push(err.message)
  })

  return formatted
}

/**
 * Validate UUID with helpful error message
 *
 * @param value - Value to validate
 * @param fieldName - Name of the field being validated
 * @returns Validation result
 */
export function isValidUUID(
  value: string,
  fieldName: string = 'ID'
): {
  valid: boolean
  error?: string
} {
  const result = uuidSchema.safeParse(value)

  if (result.success) {
    return { valid: true }
  }

  return {
    valid: false,
    error: `Invalid ${fieldName}: must be a valid UUID format`
  }
}

/**
 * Validate email with helpful error message
 *
 * @param value - Value to validate
 * @returns Validation result
 */
export function isValidEmail(value: string): {
  valid: boolean
  error?: string
} {
  const result = emailSchema.safeParse(value)

  if (result.success) {
    return { valid: true }
  }

  return {
    valid: false,
    error: 'Invalid email format'
  }
}
