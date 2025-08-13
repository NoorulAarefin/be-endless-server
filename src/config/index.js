import { config } from "dotenv";
import path from "path";

import { fileURLToPath } from "url";
// const __filename = fileURLToPath(import.meta.url); // get the resolved path to the file
// const __dirname = path.dirname(__filename); // get the name of the directory

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// yaha pe .env by default use horha hai isse ham dynamic rakhe ge hamare environment ke hisab se .env fie use ho is liye
config({ path: path.join(__dirname, `../../.env.${process.env.NODE_ENV}`) });

//NODE_ENV mai dynamic value hoti like "dev","test" to hamari .env file us hisab se use hongi env.test or env.dev

const {
  NODE_ENV,
  PORT,
  MONGO_URI,
  FRONTEND_URL,
  BACKEND_URL,
  JWT_SECRET,
  REFRESH_SECRET,
  DEBUG_MODE,
  HOST,
  SERVICE,
  EMAIL_PORT,
  SECURE,
  USERID,
  PASS,
  SECRET_KEY,
  SP_KEY,
} = process.env;

export const Config = {
  NODE_ENV,
  PORT,
  MONGO_URI,
  FRONTEND_URL,
  BACKEND_URL,
  JWT_SECRET,
  REFRESH_SECRET,
  DEBUG_MODE,
  HOST,
  SERVICE,
  EMAIL_PORT,
  SECURE,
  USERID,
  PASS,
  SECRET_KEY,
  SP_KEY,
};
