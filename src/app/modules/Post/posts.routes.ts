import express from "express";
import auth from "../../middleware/auth";
import validateRequest from "../../middleware/validateRequest";
import catchAsync from "../../shared/catchAsync";
import sendResponse from "../../shared/sendResponse";
import { CommentsRoutes } from "../Comment/comments.routes";
import { VotesRoutes } from "../Vote/votes.routes";
import { PostsServices } from "./posts.services";
import { PostsValidation } from "./posts.validation";

const router = express.Router();

// Create a post (pending approval)
router.post(
  "/",
  auth(),
  validateRequest(PostsValidation.create),
  catchAsync(async (req: any, res) => {
    const data = await PostsServices.create(
      { id: req.user.id, role: req.user.role },
      req.body
    );
    sendResponse(res, {
      statusCode: 201,
      success: true,
      message: "Post submitted for review",
      data,
    });
  })
);

// List/search/filter posts (requires auth to allow premium gating per user)
router.get(
  "/",
  auth(),
  catchAsync(async (req: any, res) => {
    const result = await PostsServices.list(req.user, req.query);
    res.status(200).json({
      success: true,
      message: "Posts",
      meta: result.meta,
      data: result.items,
    });
  })
);

// Get single post (premium gated)
router.get(
  "/:id",
  auth(),
  catchAsync(async (req: any, res) => {
    const data = await PostsServices.getById(req.user, req.params.id);
    sendResponse(res, {
      statusCode: 200,
      success: true,
      message: "Post",
      data,
    });
  })
);

// Admin approve/reject
router.patch(
  "/:id/approve",
  auth("ADMIN"),
  validateRequest(PostsValidation.approve),
  catchAsync(async (req: any, res) => {
    const data = await PostsServices.approve(
      req.user.id,
      req.params.id,
      req.body
    );
    sendResponse(res, {
      statusCode: 200,
      success: true,
      message: "Post approved",
      data,
    });
  })
);

router.patch(
  "/:id/reject",
  auth("ADMIN"),
  validateRequest(PostsValidation.reject),
  catchAsync(async (req: any, res) => {
    const data = await PostsServices.reject(
      req.user.id,
      req.params.id,
      req.body
    );
    sendResponse(res, {
      statusCode: 200,
      success: true,
      message: "Post rejected",
      data,
    });
  })
);

// nested routes
router.use("/:postId/votes", VotesRoutes);
router.use("/:postId/comments", CommentsRoutes);

export const PostsRoutes = router;
