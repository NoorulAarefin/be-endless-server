import { v2 as cloudinary } from "cloudinary";
import streamifier from "streamifier";
import CustomErrorHandler from "../services/customErrorHandler.js";
import logger from "../config/logger.js";

cloudinary.config({
  cloud_name: "dkqaubbzv",
  api_key: "137238991633774",
  api_secret: "ggp2JA9omJf7QdFwQjPKH2JVdUQ",
});

// <!-- ====== upload image controller ====== -->
const uploadController = {
  upload: async (req, res, next) => {
    try {
      const files = req.files;

      if (!files) {
        return next(CustomErrorHandler.notFound("No files uploaded"));
      }

      const promises = files.map((file) => streamUpload(file));
      const results = await Promise.all(promises);

      res.status(200).json(results);
    } catch (error) {
      logger.error(error.message);
      return next(error);
    }
  },
};

const streamUpload = (file) => {
  return new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream((error, result) => {
      if (error) {
        reject(error);
      } else {
        resolve(result);
      }
    });

    streamifier.createReadStream(file.buffer).pipe(stream);
  });
};

export default uploadController;
