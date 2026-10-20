import mongoose, { isValidObjectId } from "mongoose";
import { Video } from "../models/video.model.js";
import { User } from "../models/user.model.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { uploadOnCloudinary } from "../utils/cloudinary.js";

const getAllVideos = asyncHandler(async (req, res) => {
  const { page = 1, limit = 10, query, sortBy, sortType, userId } = req.query;
  //TODO: get all videos based on query, sort, pagination

  const matchStage = {
    isPublished: true,
    title: { $regex: query, $options: "i" },
  };

  if (userId && isValidObjectId(userId)) {
    matchStage.owner = new mongoose.Types.ObjectId(userId);
  }

  const sortStage = {
    [sortBy]: sortType === "asc" ? 1 : -1,
  };

  const aggregate = Video.aggregate([
    { $match: matchStage },
    { $sort: sortStage },
  ]);

  const options = {
    page: parseInt(page),
    limit: parseInt(limit),
  };

  const videos = await Video.aggregatePaginate(aggregate, options);

  res
    .status(200)
    .json(new ApiResponse(200, videos, "Videos fetched successfully"));
});

const publishAVideo = asyncHandler(async (req, res) => {
  const { title, description } = req.body;
  // TODO: get video, upload to cloudinary, create video

  if (!req.files?.video || !req.files?.thumbnail) {
    throw new ApiError(400, "Video file and thumbnail are required");
  }

  const videoUpload = await uploadOnCloudinary(
    req.files.video.tempFilePath,
    "videos"
  );
  const thumbnailUpload = await uploadOnCloudinary(
    req.files.thumbnail.tempFilePath,
    "thumbnails"
  );

  if (!videoUpload?.secure_url || !thumbnailUpload?.secure_url) {
    throw new ApiError(500, "Error uploading files to cloud storage");
  }

  const video = await Video.create({
    videoFile: videoUpload.secure_url,
    thumbnail: thumbnailUpload.secure_url,
    title,
    description,
    duration: videoUpload.duration || 0,
    owner: req.user._id,
  });

  res
    .status(201)
    .json(new ApiResponse(201, video, "Video published successfully"));
});

const getVideoById = asyncHandler(async (req, res) => {
  const { videoId } = req.params;
  //TODO: get video by id

  if (!isValidObjectId(videoId)) {
    throw new ApiError(400, "Invalid video ID");
  }

  const video = await Video.findById(videoId);
  if (!video) {
    throw new ApiError(404, "Video not found");
  }

  res
    .status(200)
    .json(new ApiResponse(200, video, "Video fetched successfully"));
});

const updateVideo = asyncHandler(async (req, res) => {
  const { videoId } = req.params;
  //TODO: update video details like title, description, thumbnail

  const { title, description } = req.body;

  if (!isValidObjectId(videoId)) {
    throw new ApiError(400, "Invalid video ID");
  }

  const video = await Video.findById(videoId);
  if (!video) {
    throw new ApiError(404, "Video not found");
  }

  if (video.owner.toString() !== req.user._id.toString()) {
    throw new ApiError(403, "You are not allowed to update this video");
  }

  if (req.files?.thumbnail) {
    const thumbnailUpload = await uploadOnCloudinary(
      req.files.thumbnail.tempFilePath,
      "thumbnails"
    );
    video.thumbnail = thumbnailUpload.secure_url;
  }

  video.title = title || video.title;
  video.description = description || video.description;

  await video.save();

  res
    .status(200)
    .json(new ApiResponse(200, video, "Video updated successfully"));
});

const deleteVideo = asyncHandler(async (req, res) => {
  const { videoId } = req.params;
  //TODO: delete video

  if (!isValidObjectId(videoId)) {
    throw new ApiError(400, "Invalid video ID");
  }

  const video = await Video.findById(videoId);
  if (!video) {
    throw new ApiError(404, "Video not found");
  }

  if (video.owner.toString() !== req.user._id.toString()) {
    throw new ApiError(403, "You are not allowed to delete this video");
  }

  await video.deleteOne();

  res
    .status(200)
    .json(new ApiResponse(200, null, "Video deleted successfully"));
});

const togglePublishStatus = asyncHandler(async (req, res) => {
  const { videoId } = req.params;

  if (!isValidObjectId(videoId)) {
    throw new ApiError(400, "Invalid video ID");
  }

  const video = await Video.findById(videoId);
  if (!video) {
    throw new ApiError(404, "Video not found");
  }

  if (video.owner.toString() !== req.user._id.toString()) {
    throw new ApiError(403, "You are not allowed to change publish status");
  }

  video.isPublished = !video.isPublished;
  await video.save();

  res
    .status(200)
    .json(
      new ApiResponse(
        200,
        video,
        `Video ${video.isPublished ? "published" : "unpublished"} successfully`
      )
    );
});

export {
  getAllVideos,
  publishAVideo,
  getVideoById,
  updateVideo,
  deleteVideo,
  togglePublishStatus,
};
