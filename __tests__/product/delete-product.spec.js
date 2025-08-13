import mongoose from "mongoose";
import request from "supertest";
import app from "../../src/app.js";
import { Config } from "../../src/config/index.js";
import { User } from "../../src/models/authModel/userModel.js";
import JwtService from "../../src/services/JwtService.js";
import { Product } from "../../src/models/productModel/productModel.js";

describe("POST ==> /delete-product", () => {
  let jwtToken;
  let productId;

  beforeAll(async () => {
    await mongoose.connect(Config.MONGO_URI);

    const adminUser = new User({
      fullName: "Admin User",
      email: "admin@example.com",
      password: "Admin@123",
      role: "admin",
    });
    await adminUser.save();

    jwtToken = JwtService.sign({ _id: adminUser._id });

    const product = await new Product({
      productName: "Test Product",
      image: "test_product_image_url",
      description: "Test Product description",
      isActive: true,
    }).save();

    productId = product._id;
  });

  // Function to remove test data
  const cleanup = async () => {
    await mongoose.connection.db.dropDatabase();
  };

  /* Closing database connection after each test. */
  afterAll(async () => {
    await mongoose.connection.close();
  });

  it("should delete the product", async () => {
    // Arrange - Request body
    const requestBody = {
      id: productId,
    };

    // Act
    const response = await request(app)
      .post(`/delete-product`)
      .set("Authorization", `Bearer ${jwtToken}`)
      .send(requestBody);

    // Assert
    expect(response.statusCode).toBe(200);
    expect(response.body.message).toBe("Product deleted successfully");
    expect(response.body.data.isActive).toBe(false);

    // Cleanup
    await cleanup();
  });
});
