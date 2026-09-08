import { z } from 'zod';

export const RegisterSchema = z.object({
  name: z.string().min(2).max(255).trim(),
  email: z.email().max(255).trim(),
  password: z.string().min(6).max(255).trim(),
  role: z.enum(['user', 'admin']).default('user')
});


export const  LoginSchema = z.object({
  email: z.email().toLowerCase().trim(),
  password: z.string().min(1)
});