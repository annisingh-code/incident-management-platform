import { Document, Types } from 'mongoose';

export interface IInvite extends Document {
  email: string;
  organizationId: Types.ObjectId;
  role: 'Admin' | 'Manager' | 'Developer';
  status: 'pending' | 'accepted';
  invitedBy: Types.ObjectId;
}
