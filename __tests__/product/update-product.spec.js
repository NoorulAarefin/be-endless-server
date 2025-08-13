import mongoose from "mongoose";
import request from "supertest";
import app from "../../src/app.js";
import { Config } from "../../src/config/index.js";
import { User } from "../../src/models/authModel/userModel.js";
import JwtService from "../../src/services/JwtService.js";
import { Product } from "../../src/models/productModel/productModel.js";
import { Categories } from "../../src/models/productModel/categoriesModel.js";

describe("POST ==> /update-product", () => {
  let jwtToken;
  let categoryId;
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

    // Create a category for testing
    const category = await new Categories({
      categoryName: "Test Category",
      image: "test_image_url",
      bgColor: "#FFFFFF",
    }).save();

    categoryId = category._id;

    const product = await new Product({
      productName: "Old Product",
      image: "old_product_image_url",
      discription: "Old Product description",
      categoryId: categoryId,
      nutritionalValue: {
        calories: 100,
        protein: 20,
        fat: 5,
        carbohydrates: {
          dietaryFiber: 3,
          sugars: 2,
        },
      },
      varieties: ["Variety1", "Variety2"],
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

  it("should update the product", async () => {
    // Arrange - Request body
    const requestBody = {
      id: productId,
      productName: "Updated Product",
      image: "updated_product_image_url",
      discription: "Updated Product description",
      categoryId: categoryId,
      calories: 120,
      protein: 25,
      fat: 6,
      dietaryFiber: 4,
      sugars: 3,
      varieties: ["Variety1", "Variety2", "Variety3"],
    };

    // Act
    const response = await request(app)
      .post(`/update-product`)
      .set("Authorization", `Bearer ${jwtToken}`)
      .send(requestBody);

    // Assert
    expect(response.statusCode).toBe(200);
    expect(response.body.message).toBe("Product updated successfully");
    expect(response.body.data.productName).toBe("Updated Product");

    // Cleanup
    await cleanup();
  });
});
