import { Router } from 'express';
import * as incidentController from './incident.controller';
import { validate } from '../../middleware/validate.middleware';
import { authMiddleware } from '../../middleware/auth.middleware';
import { requireOrganization } from '../../middleware/rbac.middleware';
import { 
  createIncidentSchema, 
  updateIncidentSchema, 
  getIncidentByIdSchema,
  queryIncidentSchema
} from './incident.validation';

const router = Router();

// Protect all incident routes
router.use(authMiddleware);
router.use(requireOrganization);

router.post(
  '/', 
  validate(createIncidentSchema), 
  incidentController.createIncident
);

router.get(
  '/', 
  validate(queryIncidentSchema), 
  incidentController.getAllIncidents
);

router.get(
  '/:id', 
  validate(getIncidentByIdSchema), 
  incidentController.getIncidentById
);

router.put(
  '/:id', 
  validate(updateIncidentSchema), 
  incidentController.updateIncident
);

router.delete(
  '/:id', 
  validate(getIncidentByIdSchema), 
  incidentController.deleteIncident
);

router.get(
  '/:id/activities', 
  validate(getIncidentByIdSchema), 
  incidentController.getIncidentActivities
);

export const IncidentRoutes = router;
