import { Request, Response } from 'express';
import { asyncHandler } from '../../utils/asyncHandler';
import { sendResponse } from '../../utils/apiResponse';
import * as authService from './auth.service';

export const signup = asyncHandler(async (req: Request, res: Response) => {
  const result = await authService.signup(req.body);
  sendResponse(res, 201, true, 'User registered successfully', result);
});

export const login = asyncHandler(async (req: Request, res: Response) => {
  const result = await authService.login(req.body);
  sendResponse(res, 200, true, 'User logged in successfully', result);
});

export const logout = asyncHandler(async (req: Request, res: Response) => {
  // We assume req.user is populated by the authMiddleware for protected routes
  const userId = req.user?.id;
  if (userId) {
    await authService.logout(userId);
  }
  sendResponse(res, 200, true, 'User logged out successfully');
});

export const refreshToken = asyncHandler(async (req: Request, res: Response) => {
  const { refreshToken } = req.body;
  const result = await authService.refreshAuthToken(refreshToken);
  sendResponse(res, 200, true, 'Token refreshed successfully', result);
});

// Example of a protected route controller
export const getMe = asyncHandler(async (req: Request, res: Response) => {
  // req.user is available because of the authMiddleware
  sendResponse(res, 200, true, 'User fetched successfully', req.user);
});
