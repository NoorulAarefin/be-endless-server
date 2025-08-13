import mongoose from "mongoose";
import request from "supertest";
import app from "../../src/app.js";
import { Config } from "../../src/config/index.js";
import { User } from "../../src/models/authModel/userModel.js";
import JwtService from "../../src/services/JwtService.js";
import { Product } from "../../src/models/productModel/productModel.js";
import { Categories } from "../../src/models/productModel/categoriesModel.js";

describe("POST ==> /sell-products", () => {
  let jwtToken;
  let categoryId;
  let productId;

  beforeAll(async () => {
    await mongoose.connect(Config.MONGO_URI);

    const user = new User({
      fullName: "Test User",
      email: "testuser@example.com",
      password: "Test@123",
    });
    await user.save();

    jwtToken = JwtService.sign({ _id: user._id });

    // Create a category for testing
    const category = await new Categories({
      categoryName: "Test Category",
      image: "test_image_url",
      bgColor: "#FFFFFF",
    }).save();

    categoryId = category._id;

    // Create a product for testing
    const product = new Product({
      productName: "Test Product",
      image: "test_image_url",
      description: "Test product description",
      categoryId: categoryId,
      nutritionalValue: {
        calories: 100,
        protein: 10,
        fat: 5,
        carbohydrates: {
          dietaryFiber: 2,
          sugars: 8,
        },
      },
      isActive: true,
    });

    await product.save();

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

  it("should create a new selling product", async () => {
    // Arrange
    const sellingProductData = {
      location: "Test Location",
      quantity: 50,
      productId: productId,
      image: ["test_image_url"],
      pricePerKg: 10,
      pricePerPiece: 2,
      miniumSell: "1 Kg",
      variety: "Test Variety",
    };

    // Act
    const response = await request(app)
      .post("/sell-products")
      .set("Authorization", `Bearer ${jwtToken}`)
      .send(sellingProductData);

    // Assert
    expect(response.statusCode).toBe(200);
    expect(response.body).toHaveProperty("data");
    expect(response.body.data).toHaveProperty("_id");
    expect(response.body.data.location).toBe(sellingProductData.location);

    // Cleanup
    await cleanup();
  });
});
