import mongoose, { isValidObjectId } from "mongoose";
import { Like } from "../models/like.model.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";

const toggleVideoLike = asyncHandler(async (req, res) => {
  const { videoId } = req.params;
  //TODO: toggle like on video

  if (!isValidObjectId(videoId)) {
    throw new ApiError(400, "Invalid video ID");
  }

  const existingLike = await Like.findOne({
    video: videoId,
    likedBy: req.user.id,
  });

  if (existingLike) {
    await existingLike.deleteOne();
    return res
      .status(200)
      .json(new ApiResponse(200, null, "Video like removed."));
  }

  const newLike = await Like.create({
    video: videoId,
    likedBy: req.user._id,
  });

  res.status(201).json(new ApiResponse(201, newLike, "Video liked"));
});

const toggleCommentLike = asyncHandler(async (req, res) => {
  const { commentId } = req.params;
  //TODO: toggle like on comment

  if (!isValidObjectId(commentId)) {
    throw new ApiError(400, "Invalid comment ID");
  }

  const existingLike = await Like.findOne({
    comment: commentId,
    likedBy: req.user._id,
  });

  if (existingLike) {
    await existingLike.deleteOne();
    return res
      .status(200)
      .json(new ApiResponse(200, null, "Like on comment removed"));
  }

  const newLike = await Like.create({
    comment: commentId,
    likedBy: req.user_id,
  });

  res
    .status(201)
    .json(new ApiResponse(201, newLike, "Comment liked successfully!"));
});

const toggleTweetLike = asyncHandler(async (req, res) => {
  const { tweetId } = req.params;
  //TODO: toggle like on tweet

  if (!isValidObjectId(tweetId)) {
    throw new ApiError(400, "Invalid tweet ID");
  }

  const existingLike = await Like.findOne({
    tweet: tweetId,
    likedBy: req.user._id,
  });

  if (existingLike) {
    await existingLike.deleteOne();
    return res
      .status(200)
      .json(new ApiResponse(200, null, "Tweet like removed"));
  }

  const newLike = await Like.create({
    tweet: tweetId,
    likedBy: req.user._id,
  });

  res.status(201).json(new ApiResponse(201, newLike, "Tweet liked"));
});

const getLikedVideos = asyncHandler(async (req, res) => {
  //TODO: get all liked videos

  const likedVideos = await Like.aggregate([
    {
      $match: {
        likedBy: new mongoose.Types.ObjectId(req.user_id),
        video: {
          $exists: true,
          $ne: null,
        },
      },
    },

    {
      $lookup: {
        from: "videos",
        localField: "video",
        foreignField: "_id",
        as: "video",
      },
    },

    {
      $unwind: "$video",
    },

    {
      $replaceRoot: {
        newRoot: "$video",
      },
    },
  ]);

  res
    .status(200)
    .json(
      new ApiResponse(200, likedVideos, "Liked videos fetched successfully")
    );
});
export { toggleCommentLike, toggleTweetLike, toggleVideoLike, getLikedVideos };
