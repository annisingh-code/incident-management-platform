import { Request, Response } from 'express';
import { asyncHandler } from '../../utils/asyncHandler';
import { sendResponse } from '../../utils/apiResponse';

export const checkHealth = asyncHandler(async (req: Request, res: Response) => {
  sendResponse(res, 200, true, 'Server is up and running!', {
    uptime: process.uptime(),
    timestamp: new Date().toISOString()
  });
});
