import express from "express";
import auth from "../../middleware/auth";
import catchAsync from "../../shared/catchAsync";
import sendResponse from "../../shared/sendResponse";
import { VotesServices } from "./votes.services";

const router = express.Router({ mergeParams: true });

router.post(
  "/upvote",
  auth(),
  catchAsync(async (req: any, res) => {
    const data = await VotesServices.upvote(req.user.id, req.params.postId);
    sendResponse(res, {
      statusCode: 200,
      success: true,
      message: "Upvoted",
      data,
    });
  })
);

router.post(
  "/downvote",
  auth(),
  catchAsync(async (req: any, res) => {
    const data = await VotesServices.downvote(req.user.id, req.params.postId);
    sendResponse(res, {
      statusCode: 200,
      success: true,
      message: "Downvoted",
      data,
    });
  })
);

router.post(
  "/unvote",
  auth(),
  catchAsync(async (req: any, res) => {
    const data = await VotesServices.unvote(req.user.id, req.params.postId);
    sendResponse(res, {
      statusCode: 200,
      success: true,
      message: "Vote removed",
      data,
    });
  })
);

export const VotesRoutes = router;
