import { Organization } from './organization.model';
import { User } from '../user/user.model';
import { Invite } from '../invite/invite.model';
import { ApiError } from '../../utils/ApiError';
import mongoose from 'mongoose';

export const createOrganization = async (userId: string, name: string) => {
  const session = await mongoose.startSession();
  session.startTransaction();
  
  try {
    const org = new Organization({
      name,
      createdBy: userId,
      members: [{ user: userId, role: 'Admin' }],
    });
    
    await org.save({ session });
    
    const user = await User.findById(userId).session(session);
    if (user) {
      user.organizations.push({
        organization: org.id as any,
        role: 'Admin',
      });
      user.currentOrganization = org.id as any;
      await user.save({ session, validateBeforeSave: false });
    }
    
    await session.commitTransaction();
    session.endSession();
    
    return org;
  } catch (error) {
    await session.abortTransaction();
    session.endSession();
    throw error;
  }
};

export const switchOrganization = async (userId: string, organizationId: string) => {
  const user = await User.findById(userId);
  if (!user) throw new ApiError(404, 'User not found');
  
  const membership = user.organizations.find(org => org.organization.toString() === organizationId);
  if (!membership) {
    throw new ApiError(403, 'You are not a member of this organization');
  }
  
  user.currentOrganization = new mongoose.Types.ObjectId(organizationId);
  await user.save({ validateBeforeSave: false });
  
  return user;
};

export const inviteUser = async (inviterId: string, organizationId: string, email: string, role: string) => {
  // Check if invited user already exists
  const user = await User.findOne({ email });
  
  if (user) {
    // Check if already a member
    const existingMembership = user.organizations.find(org => org.organization.toString() === organizationId);
    if (existingMembership) {
      throw new ApiError(400, 'User is already a member of this organization');
    }
    
    // Add user directly
    user.organizations.push({
      organization: new mongoose.Types.ObjectId(organizationId),
      role: role as any,
    });
    
    if (!user.currentOrganization) {
      user.currentOrganization = new mongoose.Types.ObjectId(organizationId);
    }
    
    await user.save({ validateBeforeSave: false });
    
    await Organization.findByIdAndUpdate(organizationId, {
      $push: {
        members: { user: user.id, role },
      },
    });
    
    return { message: 'User directly added to organization' };
  } else {
    // Create pending invite
    const existingInvite = await Invite.findOne({ email, organizationId, status: 'pending' });
    if (existingInvite) {
      throw new ApiError(400, 'User has already been invited to this organization');
    }
    
    const invite = await Invite.create({
      email,
      organizationId,
      role,
      invitedBy: inviterId,
    });
    
    return { message: 'Invite created successfully', invite };
  }
};

export const getOrganizationUsers = async (organizationId: string) => {
  const org = await Organization.findById(organizationId).populate('members.user', 'name email');
  if (!org) return [];
  // Return just the populated users with their roles
  return org.members.map(m => ({
    _id: (m.user as any)._id,
    name: (m.user as any).name,
    email: (m.user as any).email,
    role: m.role
  })).filter(u => u._id);
};
