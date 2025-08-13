import express from "express";
import cors from "cors";
import path from "path";

import errorHandler from "./middlewares/errorHandler.js";

import userRoute from "./routes/authRoute.js";
import productRoutes from "./routes/productRoute.js";
import categoryRoutes from "./routes/categoryRoutes.js";
// import sellProductRoutes from "./routes/sellProductRoutes.js"; // DISABLED - Converting to e-commerce model
import buyRoutes from "./routes/buyRoutes.js";
// import chatRoutes from "./routes/chatRoute.js"; // TEMPORARILY DISABLED - Chat functionality not required
import notification from "./routes/notificationRoute.js";
import paymentRoutes from "./routes/paymentRoutes.js";

import postmanToOpenApi from "postman-to-openapi";
import YAML from "yamljs";
import swaggerUi from "swagger-ui-express";
import logger from "./config/logger.js";
import { Config } from "./config/index.js";

const app = express();

//for fixing CORS policy.
app.use(cors());

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use(userRoute);
app.use(productRoutes);
app.use(categoryRoutes);
// app.use(sellProductRoutes); // DISABLED - Converting to e-commerce model
app.use(buyRoutes);
// app.use(chatRoutes); // TEMPORARILY DISABLED - Chat functionality not required
app.use(notification);
app.use("/api/payments", paymentRoutes);

//swagger Documentation
try {
  if (Config.NODE_ENV === "test" || Config.NODE_ENV === "dev") {
    postmanToOpenApi(
      "postman/postman-collection.json",
      path.join("postman/swagger.yml"),
      { defaultTag: "General" },
    );

    let result = YAML.load("postman/swagger.yml");
    result.servers[0].url = "/";
    app.use("/swagger", swaggerUi.serve, swaggerUi.setup(result));
  }
} catch (error) {
  logger.error("Swagger Generation stopped due to some error");
}

app.get("/", (req, res) => {
  res.send("<h1>Server is running</h1>");
});

app.use(errorHandler);

export default app;
