import { Document, Types } from 'mongoose';

export interface IOrgMember {
  user: Types.ObjectId;
  role: 'Admin' | 'Manager' | 'Developer';
}

export interface IOrganization extends Document {
  name: string;
  createdBy: Types.ObjectId;
  members: IOrgMember[];
}
