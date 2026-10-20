import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";

// routes import
import userRouter from "./routes/user.routes.js";

const app = express();

// app.use(): used for middleware or configuration settings
app.use(
  cors({
    // options
    origin: process.env.CORS_ORIGIN,
    credentials: true,
  })
);

// Setting limit to json data, so to avoid server crash due to unlimited data
app.use(express.json({ limit: "16kb" }));

// To tell about urls to express, setting this configuration when url is encoded with %20%
// extended helps to provide more objects at different levels.
// You can put limit into constants, for better code practice
app.use(express.urlencoded({ extended: true, limit: "16kb" }));

// configuration for static files or public assets like images, favicon
app.use(express.static("public"));

// Cookie Parser _______________________________________________
// - helps  in accessing cookies from server available at user's browser
// - also set them, basically you can perform CRUD operations over the cookies.
// - There are few ways through which you securely keep cookies in user's browser.
// - Those secured cookies can only be read through server and remove them.

// Configuration for cookie parser
app.use(cookieParser());

// routes declaration
app.use("/api/v1/users", userRouter);

export { app };
