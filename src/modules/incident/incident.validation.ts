import { z } from 'zod';
import { IncidentSeverity, IncidentStatus } from './incident.interface';

export const createIncidentSchema = z.object({
  body: z.object({
    title: z.string().min(3, 'Title must be at least 3 characters'),
    description: z.string().min(10, 'Description must be at least 10 characters'),
    severity: z.nativeEnum(IncidentSeverity).optional(),
    tags: z.array(z.string()).optional(),
    assignee: z.string().regex(/^[0-9a-fA-F]{24}$/, 'Invalid user ID').optional(),
    dueDate: z.string().datetime().optional(), // ISO string
  }),
});

export const updateIncidentSchema = z.object({
  body: z.object({
    title: z.string().min(3).optional(),
    description: z.string().min(10).optional(),
    severity: z.nativeEnum(IncidentSeverity).optional(),
    status: z.nativeEnum(IncidentStatus).optional(),
    tags: z.array(z.string()).optional(),
    assignee: z.string().regex(/^[0-9a-fA-F]{24}$/).optional(),
    dueDate: z.string().datetime().optional(),
  }),
  params: z.object({
    id: z.string().regex(/^[0-9a-fA-F]{24}$/, 'Invalid incident ID'),
  }),
});

export const getIncidentByIdSchema = z.object({
  params: z.object({
    id: z.string().regex(/^[0-9a-fA-F]{24}$/, 'Invalid incident ID'),
  }),
});

// Query schema for getting all incidents
export const queryIncidentSchema = z.object({
  query: z.object({
    page: z.string().regex(/^\d+$/).optional(),
    limit: z.string().regex(/^\d+$/).optional(),
    search: z.string().optional(),
    severity: z.nativeEnum(IncidentSeverity).optional(),
    status: z.nativeEnum(IncidentStatus).optional(),
    assignee: z.string().regex(/^[0-9a-fA-F]{24}$/).optional(),
    startDate: z.string().datetime().optional(),
    endDate: z.string().datetime().optional(),
    sortBy: z.enum(['createdAt', 'dueDate', 'severity', 'status']).optional(),
    sortOrder: z.enum(['asc', 'desc']).optional(),
  }),
});
