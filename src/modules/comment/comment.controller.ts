import { Request, Response } from 'express';
import { asyncHandler } from '../../utils/asyncHandler';
import { sendResponse } from '../../utils/apiResponse';
import * as commentService from './comment.service';

export const createComment = asyncHandler(async (req: Request, res: Response) => {
  const organizationId = req.user.currentOrganization.toString();
  const userId = req.user.id;
  const { incidentId, message } = req.body;
  
  const result = await commentService.createComment(organizationId, incidentId, userId, message);
  sendResponse(res, 201, true, 'Comment added successfully', result);
});

export const getComments = asyncHandler(async (req: Request, res: Response) => {
  const organizationId = req.user.currentOrganization.toString();
  const result = await commentService.getCommentsByIncident(organizationId, req.query);
  sendResponse(res, 200, true, 'Comments fetched successfully', result);
});
