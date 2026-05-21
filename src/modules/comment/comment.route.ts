import { Router } from 'express';
import * as commentController from './comment.controller';
import { validate } from '../../middleware/validate.middleware';
import { authMiddleware } from '../../middleware/auth.middleware';
import { requireOrganization } from '../../middleware/rbac.middleware';
import { createCommentSchema, queryCommentSchema } from './comment.validation';

const router = Router();

// Protect all comment routes
router.use(authMiddleware);
router.use(requireOrganization);

router.post(
  '/', 
  validate(createCommentSchema), 
  commentController.createComment
);

router.get(
  '/', 
  validate(queryCommentSchema), 
  commentController.getComments
);

export const CommentRoutes = router;
