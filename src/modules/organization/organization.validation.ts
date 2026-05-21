import { z } from 'zod';

export const createOrganizationSchema = z.object({
  body: z.object({
    name: z.string().min(2, 'Organization name must be at least 2 characters'),
  }),
});

export const switchOrganizationSchema = z.object({
  body: z.object({
    organizationId: z.string().regex(/^[0-9a-fA-F]{24}$/, 'Invalid organization ID'),
  }),
});

export const inviteUserSchema = z.object({
  body: z.object({
    email: z.string().email('Invalid email address'),
    role: z.enum(['Admin', 'Manager', 'Developer']),
  }),
});
