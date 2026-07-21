import dns from "node:dns";
dns.setServers(["8.8.8.8", "1.1.1.1"]);

import dotenv from "dotenv";
dotenv.config({ path: "./config.env", override: true });

import mongoose from "mongoose";
import app from "./app.js";

const DB = process.env.MONGODB_URI;

//  Modern connection code
mongoose
  .connect(DB)
  .then((conn) => {
    console.log(`📡 MongoDB Connected Successfully: ${conn.connection.host}`);
  })
  .catch((err) => {
    console.error(`❌ DB Connection failed: ${err.message}`);
  });
const port = process.env.PORT || 3000;
const server = app.listen(port, () => {
  console.log(`App running on port ${port}...`);
});

process.on("unhandledRejection", (err) => {
  console.log("UNHANDLED REJECTION! 💥 Shutting down...");
  console.log(err.name, err.message);
  server.close(() => {
    process.exit(1);
  });
});

process.on("SIGTERM", () => {
  console.log("👋 SIGTERM RECEIVED. Shutting down gracefully");
  server.close(() => {
    console.log("💥 Process terminated!");
  });
});
