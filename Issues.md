# Production Readiness Bug Tracker & Remediation Plan (`Issues.md`)
## Project: Lumio Backend

This document provides a comprehensive inventory of all architectural flaws, critical runtime crashes, security vulnerabilities, and logic errors identified during the codebase audit. Every issue includes the affected file and line numbers, technical root cause, impact, and exact code remediation.

---

## Issue Summary Matrix

| ID | Title | Severity | Area | Status |
| :--- | :--- | :---: | :--- | :---: |
| **[ISSUE-01](#issue-01-passwords-saved-as-unhashed-promises)** | Passwords Saved as Unhashed Promises in Pre-Save Hook | **P0 - Critical** | Security / Auth | Open |
| **[ISSUE-02](#issue-02-referenceerror-on-global-json-call-in-updateaccountdetails)** | ReferenceError on Global `json()` Call in Account Update | **P0 - Blocker** | User Controller | Open |
| **[ISSUE-03](#issue-03-typeerror-on-invalid-array-method-include-in-playlist)** | TypeError on Invalid Array Method `.include()` in Playlist | **P0 - Blocker** | Playlist Controller | Open |
| **[ISSUE-04](#issue-04-typeerror-on-undefined-requser_idtostring-in-playlist)** | TypeError on Undefined `req.user_id.toString()` in Playlist | **P0 - Blocker** | Playlist Controller | Open |
| **[ISSUE-05](#issue-05-broken-single-file-retrieval-via-reqfilespath-in-user-controller)** | Broken Single File Retrieval via `req.files?.path` in User Controller | **P0 - Blocker** | User Controller / Multer | Open |
| **[ISSUE-06](#issue-06-fatal-multer-field-name--tempfilepath-mismatch-in-video-uploads)** | Fatal Multer Field Name & `tempFilePath` Mismatch in Video Uploads | **P0 - Blocker** | Video Controller / Multer | Open |
| **[ISSUE-07](#issue-07-sensitive-credentials-leakage-in-subscription-aggregations)** | Sensitive Credentials Leakage in Subscription Aggregations | **P0 - Critical** | Security / Aggregation | Open |
| **[ISSUE-08](#issue-08-casing-error-in-reqheader-and-missing-new-in-authmiddlewarejs)** | Casing Error in `req.Header` and Missing `new` in Auth Middleware | **P0 - Blocker** | Auth Middleware | Open |
| **[ISSUE-09](#issue-09-mogoose-typo-and-invalid-schema-flag-in-videomodeljs)** | `mogoose` Typo and Invalid Schema Flag in Video Model | **P0 - Blocker** | Video Model | Open |
| **[ISSUE-10](#issue-10-eight-api-route-modules-are-unmounted-in-srcappjs)** | Eight API Route Modules Are Unmounted in `src/app.js` | **P1 - High** | Routing / Architecture | Open |
| **[ISSUE-11](#issue-11-user-login-response-payload-silently-dropped)** | User Login Response Payload Silently Dropped | **P1 - High** | User Controller | Open |
| **[ISSUE-12](#issue-12-current-user-endpoint-broken-via-comma-operator)** | Current User Endpoint Broken via Comma Operator | **P1 - High** | User Controller | Open |
| **[ISSUE-13](#issue-13-route-parameter-mismatch-in-dashboard-controller)** | Route Parameter Mismatch in Dashboard Controller | **P1 - High** | Dashboard Module | Open |
| **[ISSUE-14](#issue-14-undefined-requser_id-in-like-controller)** | Undefined `req.user_id` in Like Controller Breaks Liked Videos | **P1 - High** | Like Controller | Open |
| **[ISSUE-15](#issue-15-collection-casing-mismatch-in-channel-subscriber-aggregation)** | Collection Casing Mismatch in Channel Subscriber Aggregation | **P1 - High** | User Controller | Open |
| **[ISSUE-16](#issue-16-getallvideos-fails-on-unspecified-query-or-sort-parameters)** | `getAllVideos` Fails on Unspecified Query or Sort Parameters | **P1 - High** | Video Controller | Open |
| **[ISSUE-17](#issue-17-lowercase-model-reference-in-likemodeljs)** | Lowercase Model Reference in Like Schema | **P1 - High** | Like Model | Open |
| **[ISSUE-18](#issue-18-missing-centralized-express-json-error-handling-middleware)** | Missing Centralized Express JSON Error-Handling Middleware | **P2 - Medium** | Express App / Error Handling | Open |
| **[ISSUE-19](#issue-19-missing-npm-start-script-for-production-deployments)** | Missing NPM `start` Script for Production Deployments | **P2 - Medium** | Configuration | Open |
| **[ISSUE-20](#issue-20-file-collisions-in-multer-disk-storage)** | File Overwrite Collisions in Multer Disk Storage | **P2 - Medium** | Multer Middleware | Open |
| **[ISSUE-21](#issue-21-orphaned-cloud-assets-on-update-and-delete)** | Orphaned Cloud Assets on Update and Delete (Cloudinary) | **P2 - Medium** | Cloud Storage | Open |
| **[ISSUE-22](#issue-22-spelling-typo-in-apierrorjs-stack-trace-capture)** | Spelling Typo in `ApiError.js` Stack Trace Capture | **P2 - Medium** | Utilities | Open |

---

## Detailed Issue Breakdown

---

### ISSUE-01: Passwords Saved as Unhashed Promises
- **Severity:** P0 - Critical Security Flaw
- **File:** [src/models/user.model.js:63-68](file:///home/atulrajput/Desktop/video-backend/src/models/user.model.js#L63-L68)
- **Description:** In the Mongoose pre-save hook, `bcrypt.hash(this.password, 10)` is invoked without the `await` keyword. Because `bcrypt.hash` returns a Promise, `this.password` is set to `Promise { <pending> }`. When saved to MongoDB, it serializes to string `"[object Promise]"`. Consequently, the raw password is lost and password comparison on login will always fail.
- **Defective Code:**
  ```javascript
  userSchema.pre("save", async function (next) {
    if (!this.isModified("password")) return next();

    this.password = bcrypt.hash(this.password, 10);
    next();
  });
  ```
- **Remediation:**
  ```javascript
  userSchema.pre("save", async function (next) {
    if (!this.isModified("password")) return next();

    this.password = await bcrypt.hash(this.password, 10);
    next();
  });
  ```

---

### ISSUE-02: ReferenceError on Global `json()` Call in `updateAccountDetails`
- **Severity:** P0 - Fatal Runtime Crash
- **File:** [src/controllers/user.controller.js:298-300](file:///home/atulrajput/Desktop/video-backend/src/controllers/user.controller.js#L298-L300)
- **Description:** The controller returns a comma-separated expression calling global `json(...)` directly instead of `res.json(...)`. This causes `ReferenceError: json is not defined` whenever a user attempts to update their name or email.
- **Defective Code:**
  ```javascript
  return (
    res.status(200),
    json(new ApiResponse(200, user, "Account details updated successfully"))
  );
  ```
- **Remediation:**
  ```javascript
  return res
    .status(200)
    .json(new ApiResponse(200, user, "Account details updated successfully"));
  ```

---

### ISSUE-03: TypeError on Invalid Array Method `.include()` in Playlist
- **Severity:** P0 - Fatal Runtime Crash
- **File:** [src/controllers/playlist.controller.js:116](file:///home/atulrajput/Desktop/video-backend/src/controllers/playlist.controller.js#L116)
- **Description:** The controller invokes `playlist.videos.include(videoId)`. The native JavaScript Array prototype method is `.includes()`, not `.include()`. Calling this endpoint immediately throws `TypeError: playlist.videos.include is not a function`.
- **Defective Code:**
  ```javascript
  if (playlist.videos.include(videoId)) {
    throw new ApiError(400, "Video is already in the playlist");
  }
  ```
- **Remediation:**
  ```javascript
  if (playlist.videos.includes(videoId)) {
    throw new ApiError(400, "Video is already in the playlist");
  }
  ```

---

### ISSUE-04: TypeError on Undefined `req.user_id.toString()` in Playlist
- **Severity:** P0 - Fatal Runtime Crash
- **File:** [src/controllers/playlist.controller.js:112](file:///home/atulrajput/Desktop/video-backend/src/controllers/playlist.controller.js#L112)
- **Description:** The controller checks `playlist.owner.toString() !== req.user_id.toString()`. `verifyJWT` sets `req.user`, so `req.user_id` is undefined. Calling `.toString()` on `undefined` throws `TypeError: Cannot read properties of undefined (reading 'toString')`.
- **Defective Code:**
  ```javascript
  if (playlist.owner.toString() !== req.user_id.toString()) {
    throw new ApiError(403, "You are not authorized to modify this playlist");
  }
  ```
- **Remediation:**
  ```javascript
  if (playlist.owner.toString() !== req.user._id.toString()) {
    throw new ApiError(403, "You are not authorized to modify this playlist");
  }
  ```

---

### ISSUE-05: Broken Single File Retrieval via `req.files?.path` in User Controller
- **Severity:** P0 - Fatal Feature Breakdown
- **File:** [src/controllers/user.controller.js:304](file:///home/atulrajput/Desktop/video-backend/src/controllers/user.controller.js#L304) & [line 334](file:///home/atulrajput/Desktop/video-backend/src/controllers/user.controller.js#L334)
- **Description:** In `updateUserAvatar` and `updateUserCoverImage`, the handler reads `req.files?.path`. The routes use `upload.single("avatar")` and `upload.single("coverImage")`. Multer binds single file uploads to `req.file` (singular), while `req.files` is undefined. Consequently, avatar and cover image updates always fail with status 400.
- **Defective Code:**
  ```javascript
  const avatarLocalPath = req.files?.path;
  const coverImageLocalPath = req.files?.path;
  ```
- **Remediation:**
  ```javascript
  const avatarLocalPath = req.file?.path;
  const coverImageLocalPath = req.file?.path;
  ```

---

### ISSUE-06: Fatal Multer Field Name & `tempFilePath` Mismatch in Video Uploads
- **Severity:** P0 - Fatal Feature Breakdown
- **File:** [src/controllers/video.controller.js:47-58](file:///home/atulrajput/Desktop/video-backend/src/controllers/video.controller.js#L47-L58) & [line 115-121](file:///home/atulrajput/Desktop/video-backend/src/controllers/video.controller.js#L115-L121)
- **Description:**
  1. In [video.routes.js](file:///home/atulrajput/Desktop/video-backend/src/routes/video.routes.js#L20-L29), Multer expects `{ name: "videoFile", maxCount: 1 }`. The controller checks `req.files?.video`, which is undefined.
  2. The controller accesses `.tempFilePath` (an attribute of `express-fileupload`). Multer disk storage uses `.path`.
  3. In `updateVideo`, `upload.single("thumbnail")` binds to `req.file`, but the controller checks `req.files?.thumbnail`.
- **Defective Code:**
  ```javascript
  if (!req.files?.video || !req.files?.thumbnail) {
    throw new ApiError(400, "Video file and thumbnail are required");
  }
  const videoUpload = await uploadOnCloudinary(req.files.video.tempFilePath, "videos");
  ```
- **Remediation:**
  ```javascript
  const videoLocalPath = req.files?.videoFile?.[0]?.path;
  const thumbnailLocalPath = req.files?.thumbnail?.[0]?.path;

  if (!videoLocalPath || !thumbnailLocalPath) {
    throw new ApiError(400, "Video file and thumbnail are required");
  }

  const videoUpload = await uploadOnCloudinary(videoLocalPath);
  const thumbnailUpload = await uploadOnCloudinary(thumbnailLocalPath);
  ```

---

### ISSUE-07: Sensitive Credentials Leakage in Subscription Aggregations
- **Severity:** P0 - Critical Security Vulnerability
- **File:** [src/controllers/subscription.controller.js:71](file:///home/atulrajput/Desktop/video-backend/src/controllers/subscription.controller.js#L71) & [line 106](file:///home/atulrajput/Desktop/video-backend/src/controllers/subscription.controller.js#L106)
- **Description:** In `getUserChannelSubscribers` and `getSubscribedChannels`, the aggregation pipeline replaces the root document using `$replaceRoot: { newRoot: "$subscriberDetails" }` without projecting out sensitive fields. This exposes the user's **password hash** and **refreshToken** to the client.
- **Defective Code:**
  ```javascript
  { $unwind: "$subscriberDetails" },
  { $replaceRoot: { newRoot: "$subscriberDetails" } }
  ```
- **Remediation:** Project only safe public fields prior to unwinding/replacing:
  ```javascript
  {
    $lookup: {
      from: "users",
      localField: "subscriber",
      foreignField: "_id",
      as: "subscriberDetails",
      pipeline: [
        {
          $project: {
            username: 1,
            fullName: 1,
            avatar: 1
          }
        }
      ]
    }
  },
  { $unwind: "$subscriberDetails" },
  { $replaceRoot: { newRoot: "$subscriberDetails" } }
  ```

---

### ISSUE-08: Casing Error in `req.Header` and Missing `new` in `auth.middleware.js`
- **Severity:** P0 - Runtime Crash / Broken Auth
- **File:** [src/middlewares/auth.middleware.js:10](file:///home/atulrajput/Desktop/video-backend/src/middlewares/auth.middleware.js#L10) & [line 31](file:///home/atulrajput/Desktop/video-backend/src/middlewares/auth.middleware.js#L31)
- **Description:**
  1. `req.Header("Authorization")` causes `TypeError: req.Header is not a function`. The standard Express method is `req.header(...)` (lowercase) or `req.headers["authorization"]`.
  2. `throw ApiError(401, ...)` calls an ES6 class without the `new` keyword, which throws `TypeError: Class constructor ApiError cannot be invoked without 'new'`.
- **Defective Code:**
  ```javascript
  const token = req.cookies?.accessToken || req.Header("Authorization")?.replace("Bearer ", "");
  ...
  } catch (error) {
    throw ApiError(401, error?.message || "Invalid Access Token");
  }
  ```
- **Remediation:**
  ```javascript
  const token = req.cookies?.accessToken || req.header("Authorization")?.replace("Bearer ", "");
  ...
  } catch (error) {
    throw new ApiError(401, error?.message || "Invalid Access Token");
  }
  ```

---

### ISSUE-09: `mogoose` Typo and Invalid Schema Flag in `video.model.js`
- **Severity:** P0 - Model Initialization Crash
- **File:** [src/models/video.model.js:1](file:///home/atulrajput/Desktop/video-backend/src/models/video.model.js#L1), [line 20](file:///home/atulrajput/Desktop/video-backend/src/models/video.model.js#L20), & [line 44](file:///home/atulrajput/Desktop/video-backend/src/models/video.model.js#L44)
- **Description:** Typo `mogoose` in the import and model registration statement. In addition, `url: true` on the `description` field is an invalid schema type option in Mongoose.
- **Defective Code:**
  ```javascript
  import mogoose, { Schema } from "mongoose";
  ...
  description: { type: String, url: true },
  ...
  export const Video = mogoose.model("Video", videoSchema);
  ```
- **Remediation:**
  ```javascript
  import mongoose, { Schema } from "mongoose";
  ...
  description: { type: String },
  ...
  export const Video = mongoose.model("Video", videoSchema);
  ```

---

### ISSUE-10: Eight API Route Modules Are Unmounted in `src/app.js`
- **Severity:** P1 - Major Architectural Incompleteness
- **File:** [src/app.js:40](file:///home/atulrajput/Desktop/video-backend/src/app.js#L40)
- **Description:** Only `userRouter` is registered in Express. The remaining 8 modules (`video`, `tweet`, `subscription`, `like`, `comment`, `playlist`, `dashboard`, `healthcheck`) are implemented but unreachable via HTTP.
- **Remediation:** Mount all router modules:
  ```javascript
  import userRouter from "./routes/user.routes.js";
  import videoRouter from "./routes/video.routes.js";
  import tweetRouter from "./routes/tweet.routes.js";
  import subscriptionRouter from "./routes/subscription.routes.js";
  import likeRouter from "./routes/like.routes.js";
  import commentRouter from "./routes/comment.routes.js";
  import playlistRouter from "./routes/playlist.routes.js";
  import dashboardRouter from "./routes/dashboard.routes.js";
  import healthcheckRouter from "./routes/healthcheck.routes.js";

  app.use("/api/v1/users", userRouter);
  app.use("/api/v1/videos", videoRouter);
  app.use("/api/v1/tweets", tweetRouter);
  app.use("/api/v1/subscriptions", subscriptionRouter);
  app.use("/api/v1/likes", likeRouter);
  app.use("/api/v1/comments", commentRouter);
  app.use("/api/v1/playlist", playlistRouter);
  app.use("/api/v1/dashboard", dashboardRouter);
  app.use("/api/v1/healthcheck", healthcheckRouter);
  ```

---

### ISSUE-11: User Login Response Payload Silently Dropped
- **Severity:** P1 - High Functional Defect
- **File:** [src/controllers/user.controller.js:163-171](file:///home/atulrajput/Desktop/video-backend/src/controllers/user.controller.js#L163-L171)
- **Description:** The controller calls `res.json(new ApiResponse(200), { user, accessToken, refreshToken }, "User logged in successfully")`. Express `res.json()` only serializes its first argument. The user object and tokens passed as the 2nd argument are ignored, returning `data: undefined`.
- **Defective Code:**
  ```javascript
  .json(
    new ApiResponse(200),
    {
      user: loggedInUser,
      accessToken,
      refreshToken,
    },
    "User logged in successfully"
  );
  ```
- **Remediation:**
  ```javascript
  .json(
    new ApiResponse(
      200,
      {
        user: loggedInUser,
        accessToken,
        refreshToken,
      },
      "User logged in successfully"
    )
  );
  ```

---

### ISSUE-12: Current User Endpoint Broken via Comma Operator
- **Severity:** P1 - High Functional Defect
- **File:** [src/controllers/user.controller.js:275](file:///home/atulrajput/Desktop/video-backend/src/controllers/user.controller.js#L275)
- **Description:** Double parentheses `((200, req.user, "Current user fetched successfully!"))` evaluate via the JavaScript comma operator into a single string argument. `ApiResponse` receives the message as `statusCode` and leaves `data` empty.
- **Defective Code:**
  ```javascript
  return res
    .status(200)
    .json(new ApiResponse((200, req.user, "Current user fetched successfully!")));
  ```
- **Remediation:**
  ```javascript
  return res
    .status(200)
    .json(new ApiResponse(200, req.user, "Current user fetched successfully!"));
  ```

---

### ISSUE-13: Route Parameter Mismatch in Dashboard Controller
- **Severity:** P1 - High Functional Defect
- **File:** [src/controllers/dashboard.controller.js:12, 91](file:///home/atulrajput/Desktop/video-backend/src/controllers/dashboard.controller.js#L12) & [src/routes/dashboard.routes.js:12-13](file:///home/atulrajput/Desktop/video-backend/src/routes/dashboard.routes.js#L12-L13)
- **Description:** Controller expects `req.params.channelId`, but routes `/stats` and `/videos` define no `:channelId` parameter. `req.params.channelId` is always undefined, causing both endpoints to permanently return `400 Invalid channel ID`.
- **Remediation:** Use the authenticated creator's ID `req.user._id`:
  ```javascript
  const channelId = req.user._id;
  ```

---

### ISSUE-14: Undefined `req.user_id` in Like Controller Breaks Liked Videos
- **Severity:** P1 - High Functional Defect
- **File:** [src/controllers/like.controller.js:57, 99](file:///home/atulrajput/Desktop/video-backend/src/controllers/like.controller.js#L57)
- **Description:**
  1. In `toggleCommentLike`, `likedBy: req.user_id` sets an undefined field.
  2. In `getLikedVideos`, `likedBy: new mongoose.Types.ObjectId(req.user_id)` creates a brand-new random ObjectId on every request, always returning `[]`.
- **Remediation:** Replace `req.user_id` with `req.user._id`.

---

### ISSUE-15: Collection Casing Mismatch in Channel Subscriber Aggregation
- **Severity:** P1 - High Functional Defect
- **File:** [src/controllers/user.controller.js:377](file:///home/atulrajput/Desktop/video-backend/src/controllers/user.controller.js#L377)
- **Description:** `$lookup: { from: "Subscriptions", ... }` uses uppercase `"Subscriptions"`. MongoDB collection names are case-sensitive. The collection created by Mongoose is lowercase `"subscriptions"`. The lookup returns zero results, causing `subscribersCount` to always show `0`.
- **Remediation:** Change `"Subscriptions"` to `"subscriptions"`.

---

### ISSUE-16: `getAllVideos` Fails on Unspecified Query or Sort Parameters
- **Severity:** P1 - High Functional Defect
- **File:** [src/controllers/video.controller.js:13-25](file:///home/atulrajput/Desktop/video-backend/src/controllers/video.controller.js#L13-L25)
- **Description:** When `query` and `sortBy` are omitted in query parameters, `{ title: { $regex: undefined } }` and `{ undefined: -1 }` produce invalid aggregation operators in MongoDB.
- **Remediation:** Add defensive guards and fallbacks:
  ```javascript
  const matchStage = { isPublished: true };
  if (query) {
    matchStage.title = { $regex: query, $options: "i" };
  }
  const sortStage = {};
  if (sortBy) {
    sortStage[sortBy] = sortType === "asc" ? 1 : -1;
  } else {
    sortStage["createdAt"] = -1;
  }
  ```

---

### ISSUE-17: Lowercase Model Reference in Like Schema
- **Severity:** P1 - Model Integrity Defect
- **File:** [src/models/like.model.js:13](file:///home/atulrajput/Desktop/video-backend/src/models/like.model.js#L13)
- **Description:** `ref: "comment"` uses lowercase `"comment"`, while the registered Mongoose model is `"Comment"`. This causes populate operations on comment likes to fail.
- **Remediation:** Change `ref: "comment"` to `ref: "Comment"`.

---

### ISSUE-18: Missing Centralized Express JSON Error-Handling Middleware
- **Severity:** P2 - Architecture & Information Leakage
- **File:** [src/app.js](file:///home/atulrajput/Desktop/video-backend/src/app.js)
- **Description:** Express lacks an error-handling middleware `(err, req, res, next)`. When errors are thrown via `next(err)` in `asyncHandler`, Express defaults to serving an HTML stack trace, leaking server internals and failing REST JSON conventions.
- **Remediation:** Add standard error handler at the end of `src/app.js`:
  ```javascript
  app.use((err, req, res, next) => {
    const statusCode = err.statusCode || 500;
    return res.status(statusCode).json({
      success: false,
      message: err.message || "Internal Server Error",
      errors: err.errors || [],
      data: null,
    });
  });
  ```

---

### ISSUE-19: Missing NPM `start` Script for Production Deployments
- **Severity:** P2 - DevOps / Deployment
- **File:** [package.json:6-8](file:///home/atulrajput/Desktop/video-backend/package.json#L6-L8)
- **Description:** Only `"dev"` script exists. Production platforms (Docker, Render, AWS Elastic Beanstalk) expect `"npm start"`.
- **Remediation:** Add `"start": "node -r dotenv/config src/index.js"` to `package.json`.

---

### ISSUE-20: File Overwrite Collisions in Multer Disk Storage
- **Severity:** P2 - Data Integrity
- **File:** [src/middlewares/multer.middleware.js:14](file:///home/atulrajput/Desktop/video-backend/src/middlewares/multer.middleware.js#L14)
- **Description:** Multer stores uploaded files with `file.originalname`. Simultaneous uploads with identical filenames (e.g. `image.png`) overwrite each other in `./public/temp` before Cloudinary ingestion.
- **Remediation:** Append a timestamp/UUID suffix:
  ```javascript
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    cb(null, file.fieldname + "-" + uniqueSuffix + "-" + file.originalname);
  }
  ```

---

### ISSUE-21: Orphaned Cloud Assets on Update and Delete
- **Severity:** P2 - Resource Leak / Cost
- **File:** [src/utils/cloudinary.js](file:///home/atulrajput/Desktop/video-backend/src/utils/cloudinary.js)
- **Description:** Updating avatars, cover images, or deleting videos leaves previous media assets stored on Cloudinary permanently without deletion.
- **Remediation:** Implement a helper function `deleteFromCloudinary(publicId, resourceType)` to clean up unreferenced assets.

---

### ISSUE-22: Spelling Typo in `ApiError.js` Stack Trace Capture
- **Severity:** P2 - Code Quality
- **File:** [src/utils/ApiError.js:18](file:///home/atulrajput/Desktop/video-backend/src/utils/ApiError.js#L18)
- **Description:** `Error.captureStackTrace(this, this.contructor)` misspells `constructor` as `contructor`.
- **Remediation:** Correct to `this.constructor`.

---

## Action Plan & Verification Checklist

- [ ] **Phase 1: Fix P0 Blocker & Security Bugs**
  - [ ] Await `bcrypt.hash` in [user.model.js](file:///home/atulrajput/Desktop/video-backend/src/models/user.model.js) (ISSUE-01)
  - [ ] Fix `json()` call in [user.controller.js](file:///home/atulrajput/Desktop/video-backend/src/controllers/user.controller.js) (ISSUE-02)
  - [ ] Fix `.includes()` and `req.user._id` in [playlist.controller.js](file:///home/atulrajput/Desktop/video-backend/src/controllers/playlist.controller.js) (ISSUE-03, ISSUE-04)
  - [ ] Fix single upload `req.file?.path` in [user.controller.js](file:///home/atulrajput/Desktop/video-backend/src/controllers/user.controller.js) (ISSUE-05)
  - [ ] Fix video upload field mapping and paths in [video.controller.js](file:///home/atulrajput/Desktop/video-backend/src/controllers/video.controller.js) (ISSUE-06)
  - [ ] Sanitize subscription projection in [subscription.controller.js](file:///home/atulrajput/Desktop/video-backend/src/controllers/subscription.controller.js) (ISSUE-07)
  - [ ] Fix header method and `new ApiError` in [auth.middleware.js](file:///home/atulrajput/Desktop/video-backend/src/middlewares/auth.middleware.js) (ISSUE-08)
  - [ ] Correct Mongoose import in [video.model.js](file:///home/atulrajput/Desktop/video-backend/src/models/video.model.js) (ISSUE-09)
- [ ] **Phase 2: Fix P1 High Functional Bugs**
  - [ ] Mount all 8 missing routers in [app.js](file:///home/atulrajput/Desktop/video-backend/src/app.js) (ISSUE-10)
  - [ ] Restore user login response payload in [user.controller.js](file:///home/atulrajput/Desktop/video-backend/src/controllers/user.controller.js) (ISSUE-11)
  - [ ] Fix comma operator in current user endpoint in [user.controller.js](file:///home/atulrajput/Desktop/video-backend/src/controllers/user.controller.js) (ISSUE-12)
  - [ ] Align dashboard channelId resolution in [dashboard.controller.js](file:///home/atulrajput/Desktop/video-backend/src/controllers/dashboard.controller.js) (ISSUE-13)
  - [ ] Fix `req.user._id` in [like.controller.js](file:///home/atulrajput/Desktop/video-backend/src/controllers/like.controller.js) (ISSUE-14)
  - [ ] Fix collection casing to `"subscriptions"` in [user.controller.js](file:///home/atulrajput/Desktop/video-backend/src/controllers/user.controller.js) (ISSUE-15)
  - [ ] Add defensive query guards in [video.controller.js](file:///home/atulrajput/Desktop/video-backend/src/controllers/video.controller.js) (ISSUE-16)
  - [ ] Fix model ref in [like.model.js](file:///home/atulrajput/Desktop/video-backend/src/models/like.model.js) (ISSUE-17)
- [ ] **Phase 3: Production Hardening (P2)**
  - [ ] Add centralized JSON error middleware in [app.js](file:///home/atulrajput/Desktop/video-backend/src/app.js) (ISSUE-18)
  - [ ] Add `"start"` script in [package.json](file:///home/atulrajput/Desktop/video-backend/package.json) (ISSUE-19)
  - [ ] Add unique filename suffix in [multer.middleware.js](file:///home/atulrajput/Desktop/video-backend/src/middlewares/multer.middleware.js) (ISSUE-20)
  - [ ] Add Cloudinary asset cleanup utility (ISSUE-21)
  - [ ] Fix typo in [ApiError.js](file:///home/atulrajput/Desktop/video-backend/src/utils/ApiError.js) (ISSUE-22)
