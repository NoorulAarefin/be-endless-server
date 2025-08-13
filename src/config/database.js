import mongoose from "mongoose";
import logger from "./logger.js";
import { Config } from "./index.js";

let isConnected;

export const connectDB = async () => {
  if (isConnected) {
    logger.info("=> Using existing database connection");
    return;
  }

  try {
    const { connection } = await mongoose.connect(Config.MONGO_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
      serverSelectionTimeoutMS: 30000, // 30 seconds
      socketTimeoutMS: 45000, // 45 seconds
      maxPoolSize: 10, // max pool size
      maxIdleTimeMS: 10000, // max idle time to 10 seconds
    });

    isConnected = connection.readyState;
    logger.info(`Connected to Database (${connection.name})`);
  } catch (error) {
    logger.error("Database connection error:", error);
  }
};
