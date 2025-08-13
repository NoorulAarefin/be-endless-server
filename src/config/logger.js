// import winston from "winston";
// // import { Config } from "./index.js";

// const logger = winston.createLogger({
//   level: "info",
//   // bahot sare level hote hia like error, info, debug etc.
//   defaultMeta: {
//     serviceName: "farm-konnect-server", // har ek log ke sath yeh bhi print hoga
//   },
//   // project ke log kaha store honge..1) project file  2) database 3)logs on terminal (console)  4) send on external service (elastic search)
//   // ismai file transport hai jo jaha ham define karsakte hai project ke   file mai log store ho
//   // databse ke liye alag transport hai
//   transports: [
//     new winston.transports.File({
//       dirname: "logs", // folder name
//       filename: "combined.log", //file name
//       level: "info",
//       silent: true,
//       // Config.NODE_ENV === "test" || Config.NODE_ENV === "dev", // silent ko ham true rakhte hai to logs file mai save nhi hoge NODE_ENV hame true or false value retuen karega
//     }),

//     new winston.transports.File({
//       dirname: "logs", // folder name
//       filename: "error.log", //file name
//       level: "error",
//       silent: true,
//       // silent: Config.NODE_ENV === "test" || Config.NODE_ENV === "dev",
//     }),

//     new winston.transports.Console({
//       level: "info", // ham level ko transport wise overwrite karsakte hai
//       // format: winston.format.simple()
//       format: winston.format.combine(
//         winston.format.timestamp(),
//         winston.format.json(),
//       ),
//       silent: true,
//       // silent: Config.NODE_ENV === "test",
//     }),
//   ],
// });

// export default logger;

import { createLogger, transports, format } from "winston";
import { Config } from "../config/index.js";

const { combine, timestamp, printf, errors, colorize } = format;

const logFormat = printf(({ level, message, timestamp, stack }) => {
  return `{ Timestamp: ${timestamp} ${level}: ${stack || message} }`;
});

const logger = createLogger({
  level: "info",
  // defaultMeta: {
  //   serviceName: "KT-Guru-server",
  // },
  format: combine(
    colorize(),
    timestamp({ format: "YYYY-MM-DD HH:mm:ss" }),
    errors({ stack: true }), // Capture stack trace for errors
    logFormat,
  ),
  transports: [
    new transports.Console({
      level: "info",
      silent: Config.NODE_ENV === "test",
    }),
  ],
});

export default logger;
