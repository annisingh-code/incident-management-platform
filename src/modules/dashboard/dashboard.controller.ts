import { Request, Response } from 'express';
import { asyncHandler } from '../../utils/asyncHandler';
import { sendResponse } from '../../utils/apiResponse';
import * as dashboardService from './dashboard.service';

export const getDashboardAnalytics = asyncHandler(async (req: Request, res: Response) => {
  const organizationId = req.user.currentOrganization.toString();
  const result = await dashboardService.getDashboardMetrics(organizationId);
  sendResponse(res, 200, true, 'Dashboard metrics fetched successfully', result);
});
