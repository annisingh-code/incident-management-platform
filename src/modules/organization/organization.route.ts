import { Router } from 'express';
import * as organizationController from './organization.controller';
import { validate } from '../../middleware/validate.middleware';
import { authMiddleware } from '../../middleware/auth.middleware';
import { requireOrganization, requireRole } from '../../middleware/rbac.middleware';
import { 
  createOrganizationSchema, 
  switchOrganizationSchema, 
  inviteUserSchema 
} from './organization.validation';

const router = Router();

// Protect all organization routes with auth middleware
router.use(authMiddleware);

router.post(
  '/', 
  validate(createOrganizationSchema), 
  organizationController.createOrganization
);

router.post(
  '/switch', 
  validate(switchOrganizationSchema), 
  organizationController.switchOrganization
);

router.post(
  '/invite', 
  requireOrganization, 
  requireRole(['Admin', 'Manager']), 
  validate(inviteUserSchema), 
  organizationController.inviteUser
);

router.get(
  '/users',
  requireOrganization,
  organizationController.getOrganizationUsers
);

export const OrganizationRoutes = router;
