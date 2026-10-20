import mongoose from "mongoose";
import { Video } from "../models/video.model.js";
import { Subscription } from "../models/subscription.model.js";
import { Like } from "../models/like.model.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";

const getChannelStats = asyncHandler(async (req, res) => {
  // TODO: Get the channel stats like total video views, total subscribers, total videos, total likes etc.

  const { channelId } = req.params;

  if (!mongoose.Types.ObjectId.isValid(channelId)) {
    throw new ApiError(400, "Invalid channel ID");
  }

  const [videoStats] = await Video.aggregate([
    {
      $match: {
        owner: new mongoose.Types.ObjectId(channelId),
      },
    },

    {
      $group: {
        _id: null,
        totalVideos: { $sum: 1 },
        totalViews: { $sum: "$views" },
      },
    },
  ]);

  const [likeStats] = await Like.aggregate([
    {
      $match: {
        video: {
          $exists: true,
        },
      },
    },

    {
      $lookup: {
        from: "videos",
        localField: "video",
        foreignField: "_id",
        as: "videoData",
      },
    },

    {
      $unwind: "$videoData",
    },

    {
      $match: {
        "videoData.owner": new mongoose.Types.ObjectId(channelId),
      },
    },

    {
      $group: {
        _id: null,
        totalLikes: { $sum: 1 },
      },
    },
  ]);

  const subscriberCount = await Subscription.countDocuments({
    channel: new mongoose.Types.ObjectId(channelId),
  });

  const stats = {
    totalVideos: videoStats?.totalVideos || 0,
    totalViews: videoStats?.totalViews || 0,
    totalLikes: likeStats?.totalLikes || 0,
    totalSubscribers: subscriberCount || 0,
  };

  res
    .status(200)
    .json(
      new ApiResponse(200, stats, "Channel statistics fetched successfully")
    );
});

const getChannelVideos = asyncHandler(async (req, res) => {
  // TODO: Get all the videos uploaded by the channel

  const { channelId } = req.params;
  const { page = 1, limit = 10 } = req.query;

  if (!mongoose.Types.ObjectId.isValid(channelId)) {
    throw new ApiError(400, "Invalid channel ID");
  }

  const aggregate = Video.aggregate([
    {
      $match: {
        owner: new mongoose.Types.ObjectId(channelId),
      },
    },

    {
      $sort: {
        createdAt: -1,
      },
    },
  ]);

  const options = {
    page: parseInt(page),
    limit: parseInt(limit),
  };

  const videos = await Video.aggregatePaginate(aggregate, options);

  res
    .status(200)
    .json(new ApiResponse(200, videos, "Channel videos fetched successfully"));
});

export { getChannelStats, getChannelVideos };
