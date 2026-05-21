import { Request, Response } from 'express';
import { asyncHandler } from '../../utils/asyncHandler';
import { sendResponse } from '../../utils/apiResponse';
import * as organizationService from './organization.service';

export const createOrganization = asyncHandler(async (req: Request, res: Response) => {
  const { name } = req.body;
  const userId = req.user.id;
  const result = await organizationService.createOrganization(userId, name);
  sendResponse(res, 201, true, 'Organization created successfully', result);
});

export const switchOrganization = asyncHandler(async (req: Request, res: Response) => {
  const { organizationId } = req.body;
  const userId = req.user.id;
  await organizationService.switchOrganization(userId, organizationId);
  sendResponse(res, 200, true, 'Organization context switched successfully');
});

export const inviteUser = asyncHandler(async (req: Request, res: Response) => {
  const { email, role } = req.body;
  const inviterId = req.user.id;
  const organizationId = req.user.currentOrganization.toString();
  
  const result = await organizationService.inviteUser(inviterId, organizationId, email, role);
  sendResponse(res, 201, true, result.message, result);
});

export const getOrganizationUsers = asyncHandler(async (req: Request, res: Response) => {
  const organizationId = req.user.currentOrganization.toString();
  const users = await organizationService.getOrganizationUsers(organizationId);
  sendResponse(res, 200, true, 'Organization users fetched successfully', users);
});
