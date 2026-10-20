// =========== Method 1
//  Below line makes code inconsistent. It works by the way.
// require('dotenv').config({path: './env'})

// =========== Method 2
import dotenv from "dotenv";
import connectDB from "./db/index.js";
import { app } from "./app.js";

// import mongoose from 'mongoose'
// import { DB_NAME } from './constants'
// import express from 'express'

/* Multiline Comment to comment out the code */

// =================================
//     This is the first approach
// =================================

/*
const app = express()

    // here semicolon is for cleanliness, that is a good practice to avoid IIFE error `;`
    // IIFE
    // Whenever handle DB, use async await and try-catch
    (async () => {

        try {
            await mongoose.connect(`${process.env.MONGODB_URI}/${DB_NAME}`)
            app.on("error", (error) => {
                console.log("error");
                throw error
            })

            app.listen(process.env.PORT, () => {
                console.log(`App is listening on port ${process.env.PORT}`);
                
            })

        } catch (error) {
            console.log("ERROR: ", error)
            throw err
        }

    })()
*/

// ======================
// Approach 2 is professional practice
// - having a separate file db and code there, export function from there, and import in index file and execute that.
// ======================
// configuring dotenv

dotenv.config({
  path: "./.env",
});

// const app = express()

// Using promises
connectDB()
  .then(() => {
    // PORT 8000 added as fallback issue at server
    app.listen(process.env.PORT || 8000, () => {
      console.log(`Server is running at port : ${process.env.PORT}`);
    });
  })
  .catch((err) => {
    console.log("MongoDB connection failed!", err);
  });
