import { Router } from 'express';
import * as authController from './auth.controller';
import { validate } from '../../middleware/validate.middleware';
import { signupSchema, loginSchema, refreshTokenSchema } from './auth.validation';
import { authMiddleware } from '../../middleware/auth.middleware';

const router = Router();

router.post('/signup', validate(signupSchema), authController.signup);
router.post('/login', validate(loginSchema), authController.login);
router.post('/refresh-token', validate(refreshTokenSchema), authController.refreshToken);
router.post('/logout', authMiddleware, authController.logout);

// Example protected route
router.get('/me', authMiddleware, authController.getMe);

export const AuthRoutes = router;
