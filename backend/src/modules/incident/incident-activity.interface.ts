import { Document, Types } from 'mongoose';

export interface IIncidentActivity extends Document {
  organizationId: Types.ObjectId;
  incidentId: Types.ObjectId;
  userId: Types.ObjectId;
  actionType: string;
  oldValue?: string;
  newValue?: string;
  metadata?: Record<string, any>;
  createdAt: Date;
  updatedAt: Date;
}
