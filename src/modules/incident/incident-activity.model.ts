import mongoose, { Schema } from 'mongoose';
import { IIncidentActivity } from './incident-activity.interface';

const incidentActivitySchema = new Schema<IIncidentActivity>(
  {
    organizationId: {
      type: Schema.Types.ObjectId,
      ref: 'Organization',
      required: true,
      index: true,
    },
    incidentId: {
      type: Schema.Types.ObjectId,
      ref: 'Incident',
      required: true,
      index: true,
    },
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    actionType: {
      type: String,
      required: true,
    },
    oldValue: {
      type: String,
    },
    newValue: {
      type: String,
    },
    metadata: {
      type: Schema.Types.Mixed,
    },
  },
  { timestamps: true }
);

export const IncidentActivity = mongoose.model<IIncidentActivity>('IncidentActivity', incidentActivitySchema);
