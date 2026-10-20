import { Router } from "express";
import {
  toggleSubscription,
  getUserChannelSubscribers,
  getSubscribedChannels,
} from "../controllers/subscription.controller.js";
import { verifyJWT } from "../middlewares/auth.middleware.js";

const router = Router();

// All routes require authentication
router.use(verifyJWT);

// Toggle subscription (subscribe/unsubscribe to a channel)
router.route("/toggle/:channelId").post(toggleSubscription);

// Get all subscribers of a specific channel
router.route("/subscribers/:channelId").get(getUserChannelSubscribers);

// Get all channels a user has subscribed to
router.route("/subscribed/:subscriberId").get(getSubscribedChannels);

export default router;
