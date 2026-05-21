import { Document, Types } from 'mongoose';

export interface IComment extends Document {
  incidentId: Types.ObjectId;
  organizationId: Types.ObjectId;
  userId: Types.ObjectId;
  message: string;
  mentions: string[];
  createdAt: Date;
  updatedAt: Date;
}
