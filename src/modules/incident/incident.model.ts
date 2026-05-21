import mongoose, { Schema } from 'mongoose';
import { IIncident, IncidentSeverity, IncidentStatus } from './incident.interface';

const incidentSchema = new Schema<IIncident>(
  {
    title: {
      type: String,
      required: [true, 'Title is required'],
      trim: true,
      index: true, // For searching
    },
    description: {
      type: String,
      required: [true, 'Description is required'],
    },
    severity: {
      type: String,
      enum: Object.values(IncidentSeverity),
      default: IncidentSeverity.MEDIUM,
      index: true,
    },
    status: {
      type: String,
      enum: Object.values(IncidentStatus),
      default: IncidentStatus.OPEN,
      index: true,
    },
    tags: {
      type: [String],
      default: [],
    },
    assignee: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      index: true,
    },
    reporter: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    dueDate: {
      type: Date,
      index: true,
    },
    organizationId: {
      type: Schema.Types.ObjectId,
      ref: 'Organization',
      required: true,
      index: true,
    },
  },
  { timestamps: true }
);

export const Incident = mongoose.model<IIncident>('Incident', incidentSchema);
