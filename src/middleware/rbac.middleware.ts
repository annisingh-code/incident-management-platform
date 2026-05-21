import { Request, Response, NextFunction } from 'express';
import { ApiError } from '../utils/ApiError';
import { asyncHandler } from '../utils/asyncHandler';

export const requireOrganization = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
  if (!req.user || !req.user.currentOrganization) {
    return next(new ApiError(403, 'Organization context required. Please switch to an organization.'));
  }
  next();
});

export const requireRole = (roles: string[]) => {
  return asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
    if (!req.user || !req.user.currentOrganization) {
      return next(new ApiError(403, 'Organization context required.'));
    }

    const orgId = req.user.currentOrganization.toString();
    const membership = req.user.organizations.find((org: any) => org.organization.toString() === orgId);

    if (!membership || !roles.includes(membership.role)) {
      return next(new ApiError(403, 'You do not have permission to perform this action.'));
    }

    next();
  });
};
