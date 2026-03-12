import { z } from 'zod';

const passwordSchema = z.string()
  .min(10, 'Password must be at least 10 characters')
  .regex(/[a-z]/, 'Password must contain at least one lowercase letter')
  .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
  .regex(/[0-9]/, 'Password must contain at least one number')
  .regex(/[^a-zA-Z0-9]/, 'Password must contain at least one special character');

export const registerSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: passwordSchema,
  passwordConfirmation: z.string(),
}).refine((data) => data.password === data.passwordConfirmation, {
  message: 'Passwords do not match',
  path: ['passwordConfirmation'],
});

export const loginSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(1, 'Password is required'),
});

export const verifyEmailSchema = z.object({
  token: z.string().min(1, 'Token is required'),
});

export const emailSchema = z.object({
  email: z.string().email('Invalid email address'),
});

export const updateProfileSchema = z.object({
  email: z.string().email('Invalid email address').optional(),
  password: passwordSchema.optional(),
  currentPassword: z.string().optional(),
});
