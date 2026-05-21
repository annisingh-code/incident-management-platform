import { Request, Response } from 'express';
import { asyncHandler } from '../../utils/asyncHandler';
import { sendResponse } from '../../utils/apiResponse';
import * as incidentService from './incident.service';

export const createIncident = asyncHandler(async (req: Request, res: Response) => {
  const organizationId = req.user.currentOrganization.toString();
  const userId = req.user.id;
  const result = await incidentService.createIncident(organizationId, userId, req.body);
  sendResponse(res, 201, true, 'Incident created successfully', result);
});

export const getIncidentById = asyncHandler(async (req: Request, res: Response) => {
  const organizationId = req.user.currentOrganization.toString();
  const { id } = req.params;
  const result = await incidentService.getIncidentById(organizationId, id);
  sendResponse(res, 200, true, 'Incident fetched successfully', result);
});

export const getAllIncidents = asyncHandler(async (req: Request, res: Response) => {
  const organizationId = req.user.currentOrganization.toString();
  const result = await incidentService.getAllIncidents(organizationId, req.query);
  sendResponse(res, 200, true, 'Incidents fetched successfully', result);
});

export const updateIncident = asyncHandler(async (req: Request, res: Response) => {
  const organizationId = req.user.currentOrganization.toString();
  const userId = req.user.id;
  const { id } = req.params;
  const result = await incidentService.updateIncident(organizationId, id, userId, req.body);
  sendResponse(res, 200, true, 'Incident updated successfully', result);
});

export const deleteIncident = asyncHandler(async (req: Request, res: Response) => {
  const organizationId = req.user.currentOrganization.toString();
  const { id } = req.params;
  await incidentService.deleteIncident(organizationId, id);
  sendResponse(res, 200, true, 'Incident deleted successfully');
});

export const getIncidentActivities = asyncHandler(async (req: Request, res: Response) => {
  const organizationId = req.user.currentOrganization.toString();
  const { id } = req.params;
  const result = await incidentService.getIncidentActivities(organizationId, id);
  sendResponse(res, 200, true, 'Activities fetched successfully', result);
});
