import express from "express";
import auth from "../../middleware/auth";
import validateRequest from "../../middleware/validateRequest";
import catchAsync from "../../shared/catchAsync";
import sendResponse from "../../shared/sendResponse";
import { CommentsServices } from "./comments.services";
import { CommentsValidation } from "./comments.validation";

const router = express.Router({ mergeParams: true });

router.post(
  "/",
  auth(),
  validateRequest(CommentsValidation.create),
  catchAsync(async (req: any, res) => {
    const data = await CommentsServices.create(
      req.user.id,
      req.params.postId,
      req.body
    );
    sendResponse(res, {
      statusCode: 201,
      success: true,
      message: "Comment added",
      data,
    });
  })
);

router.get(
  "/",
  catchAsync(async (req: any, res) => {
    const data = await CommentsServices.list(req.params.postId);
    sendResponse(res, {
      statusCode: 200,
      success: true,
      message: "Comments",
      data,
    });
  })
);

router.delete(
  "/:commentId",
  auth("ADMIN"),
  catchAsync(async (req: any, res) => {
    await CommentsServices.remove(req.user.id, req.params.commentId);
    sendResponse(res, {
      statusCode: 200,
      success: true,
      message: "Comment removed",
      data: null,
    });
  })
);

export const CommentsRoutes = router;
