import { Document, Types } from 'mongoose';

export interface IOrganizationMembership {
  organization: Types.ObjectId;
  role: 'Admin' | 'Manager' | 'Developer';
}

export interface IUser extends Document {
  name: string;
  email: string;
  password?: string; // Optional because we might exclude it in some queries
  currentOrganization?: Types.ObjectId | null;
  organizations: IOrganizationMembership[];
  refreshToken?: string;
  
  // Custom method definition
  isPasswordMatch(password: string): Promise<boolean>;
}
