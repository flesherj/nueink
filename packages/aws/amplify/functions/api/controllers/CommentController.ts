import { Request, Response } from 'express';
import { serviceFactory } from '../handler';
import { Comment } from '@nueink/core';

/**
 * Comment Controller
 * Handles comment CRUD operations
 */
class CommentController {
  /**
   * GET /comment/transaction/:transactionId
   * Get all comments for a transaction
   */
  public listByTransaction = async (
    req: Request<{ transactionId: string }>,
    res: Response
  ): Promise<void> => {
    try {
      const commentService = serviceFactory.comment();
      const comments = await commentService.findByTransaction(
        req.params.transactionId
      );

      res.json(comments);
    } catch (error) {
      console.error('Error listing comments for transaction:', error);
      res.status(500).json({
        error: error instanceof Error ? error.message : 'Failed to list comments for transaction'
      });
    }
  };

  /**
   * GET /comment/:commentId
   * Get a specific comment by ID
   */
  public getComment = async (
    req: Request<{ commentId: string }>,
    res: Response
  ): Promise<void> => {
    try {
      const commentService = serviceFactory.comment();
      const comment = await commentService.findById(req.params.commentId);

      if (!comment) {
        res.status(404).json({ error: 'Comment not found' });
        return;
      }

      res.json(comment);
    } catch (error) {
      console.error('Error fetching comment:', error);
      res.status(500).json({
        error: error instanceof Error ? error.message : 'Failed to fetch comment'
      });
    }
  };

  /**
   * POST /comment
   * Create a new comment
   * Body: { transactionId, accountId, organizationId, text, profileOwner }
   */
  public createComment = async (
    req: Request<
      {},
      any,
      {
        transactionId: string;
        accountId: string;
        organizationId: string;
        text: string;
        profileOwner: string;
      }
    >,
    res: Response
  ): Promise<void> => {
    try {
      const { transactionId, accountId, organizationId, text, profileOwner } =
        req.body;

      if (!transactionId) {
        res.status(400).json({ error: 'transactionId is required' });
        return;
      }

      if (!accountId) {
        res.status(400).json({ error: 'accountId is required' });
        return;
      }

      if (!organizationId) {
        res.status(400).json({ error: 'organizationId is required' });
        return;
      }

      if (!text || text.trim() === '') {
        res.status(400).json({ error: 'text is required and cannot be empty' });
        return;
      }

      if (!profileOwner) {
        res.status(400).json({ error: 'profileOwner is required' });
        return;
      }

      const commentService = serviceFactory.comment();

      // Generate UUID for comment ID
      const commentId = crypto.randomUUID();
      const now = new Date();

      const newComment: Comment = {
        commentId,
        transactionId,
        accountId,
        organizationId,
        text,
        profileOwner,
        createdAt: now,
        updatedAt: now,
      };

      const created = await commentService.create(newComment);

      res.status(201).json(created);
    } catch (error) {
      console.error('Error creating comment:', error);
      res.status(500).json({
        error: error instanceof Error ? error.message : 'Failed to create comment'
      });
    }
  };

  /**
   * PUT /comment/:commentId
   * Update an existing comment
   * Body: { text }
   */
  public updateComment = async (
    req: Request<{ commentId: string }, any, { text: string }>,
    res: Response
  ): Promise<void> => {
    try {
      const { commentId } = req.params;
      const { text } = req.body;

      if (!text || text.trim() === '') {
        res.status(400).json({ error: 'text is required and cannot be empty' });
        return;
      }

      const commentService = serviceFactory.comment();

      // Check if comment exists
      const existing = await commentService.findById(commentId);
      if (!existing) {
        res.status(404).json({ error: 'Comment not found' });
        return;
      }

      const updated = await commentService.update(commentId, {
        text,
        updatedAt: new Date(),
      });

      res.json(updated);
    } catch (error) {
      console.error('Error updating comment:', error);
      res.status(500).json({
        error: error instanceof Error ? error.message : 'Failed to update comment'
      });
    }
  };

  /**
   * DELETE /comment/:commentId
   * Delete a comment
   */
  public deleteComment = async (
    req: Request<{ commentId: string }>,
    res: Response
  ): Promise<void> => {
    try {
      const { commentId } = req.params;

      const commentService = serviceFactory.comment();

      // Check if comment exists
      const existing = await commentService.findById(commentId);
      if (!existing) {
        res.status(404).json({ error: 'Comment not found' });
        return;
      }

      await commentService.delete(commentId);

      res.status(204).send();
    } catch (error) {
      console.error('Error deleting comment:', error);
      res.status(500).json({
        error: error instanceof Error ? error.message : 'Failed to delete comment'
      });
    }
  };

  /**
   * GET /comment/account/:accountId
   * Get all comments by a specific account
   */
  public listByAccount = async (
    req: Request<{ accountId: string }>,
    res: Response
  ): Promise<void> => {
    try {
      const commentService = serviceFactory.comment();
      const comments = await commentService.findByAccount(req.params.accountId);

      res.json(comments);
    } catch (error) {
      console.error('Error listing comments by account:', error);
      res.status(500).json({
        error: error instanceof Error ? error.message : 'Failed to list comments by account'
      });
    }
  };

  /**
   * GET /comment/organization/:organizationId
   * Get all comments for an organization (paginated)
   * Query params: limit, cursor
   */
  public listByOrganization = async (
    req: Request<
      { organizationId: string },
      any,
      any,
      { limit?: string; cursor?: string }
    >,
    res: Response
  ): Promise<void> => {
    try {
      const { organizationId } = req.params;
      const limit = req.query.limit ? parseInt(req.query.limit, 10) : undefined;
      const cursor = req.query.cursor;

      const commentService = serviceFactory.comment();
      const result = await commentService.findByOrganization(
        organizationId,
        limit,
        cursor
      );

      res.json(result);
    } catch (error) {
      console.error('Error listing comments by organization:', error);
      res.status(500).json({
        error: error instanceof Error ? error.message : 'Failed to list comments by organization'
      });
    }
  };
}

export default new CommentController();
