import { Router } from 'express';
import * as dashboardController from './dashboard.controller';
import { authMiddleware } from '../../middleware/auth.middleware';
import { requireOrganization } from '../../middleware/rbac.middleware';

const router = Router();

// Protect routes
router.use(authMiddleware);
router.use(requireOrganization);

router.get('/', dashboardController.getDashboardAnalytics);

export const DashboardRoutes = router;
