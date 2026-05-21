import { z } from 'zod';

export const createCommentSchema = z.object({
  body: z.object({
    incidentId: z.string().regex(/^[0-9a-fA-F]{24}$/, 'Invalid incident ID'),
    message: z.string().min(1, 'Message is required'),
  }),
});

export const queryCommentSchema = z.object({
  query: z.object({
    incidentId: z.string().regex(/^[0-9a-fA-F]{24}$/, 'Invalid incident ID'),
    page: z.string().regex(/^\d+$/).optional(),
    limit: z.string().regex(/^\d+$/).optional(),
  }),
});
