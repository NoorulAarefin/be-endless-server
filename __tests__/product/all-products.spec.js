import mongoose from "mongoose";
import request from "supertest";
import app from "../../src/app.js";
import { Config } from "../../src/config/index.js";
import { User } from "../../src/models/authModel/userModel.js";
import JwtService from "../../src/services/JwtService.js";
import { Categories } from "../../src/models/productModel/categoriesModel.js";
import { Product } from "../../src/models/productModel/productModel.js";

describe("POST ==> /get-Allproducts", () => {
  let jwtToken;

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

    // Create a category for testing
    const category = await new Categories({
      categoryName: "Test Category",
      image: "test_image_url",
      bgColor: "#FFFFFF",
    }).save();

    // Create some products for testing
    await new Product({
      productName: "Product 1",
      image: "product1_image_url",
      description: "Product 1 description",
      categoryId: category._id,
      isActive: true,
    }).save();

    await new Product({
      productName: "Product 2",
      image: "product2_image_url",
      description: "Product 2 description",
      categoryId: category._id,
      isActive: true,
    }).save();
  });

  // Function to remove test data
  const cleanup = async () => {
    await mongoose.connection.db.dropDatabase();
  };

  /* Closing database connection after each test. */
  afterAll(async () => {
    await mongoose.connection.close();
  });

  it("should return all products", async () => {
    // Arrange - Request body
    const requestBody = {
      skip: 0,
    };

    // Act
    const response = await request(app)
      .post(`/get-Allproducts`)
      .set("Authorization", `Bearer ${jwtToken}`)
      .send(requestBody);

    // Assert
    expect(response.statusCode).toBe(200);
    expect(response.body.data).toHaveLength(2);
    expect(response.body.data[0].productName).toBe("Product 2");
    expect(response.body.data[1].productName).toBe("Product 1");

    // Cleanup
    await cleanup();
  });
});
