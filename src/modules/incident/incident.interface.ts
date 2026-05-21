import { Document, Types } from 'mongoose';

export enum IncidentSeverity {
  LOW = 'Low',
  MEDIUM = 'Medium',
  HIGH = 'High',
  CRITICAL = 'Critical',
}

export enum IncidentStatus {
  OPEN = 'Open',
  IN_PROGRESS = 'In Progress',
  RESOLVED = 'Resolved',
  CLOSED = 'Closed',
}

export interface IIncident extends Document {
  title: string;
  description: string;
  severity: IncidentSeverity;
  status: IncidentStatus;
  tags: string[];
  assignee?: Types.ObjectId;
  reporter: Types.ObjectId;
  dueDate?: Date;
  organizationId: Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}
