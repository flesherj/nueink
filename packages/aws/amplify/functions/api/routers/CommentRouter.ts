import { Router } from 'express';
import CommentController from '../controllers/CommentController';

const router = Router();

// GET /comment/transaction/:transactionId - Get all comments for a transaction
router.get('/transaction/:transactionId', CommentController.listByTransaction);

// GET /comment/account/:accountId - Get all comments by an account
router.get('/account/:accountId', CommentController.listByAccount);

// GET /comment/organization/:organizationId - Get all comments for an organization (paginated)
router.get(
  '/organization/:organizationId',
  CommentController.listByOrganization
);

// GET /comment/:commentId - Get a specific comment
router.get('/:commentId', CommentController.getComment);

// POST /comment - Create a new comment
router.post('/', CommentController.createComment);

// PUT /comment/:commentId - Update a comment
router.put('/:commentId', CommentController.updateComment);

// DELETE /comment/:commentId - Delete a comment
router.delete('/:commentId', CommentController.deleteComment);

export default router;
