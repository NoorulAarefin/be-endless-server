import mongoose from "mongoose";
import request from "supertest";
import app from "../../src/app.js";
import { Config } from "../../src/config/index.js";
import { User } from "../../src/models/authModel/userModel.js";
import JwtService from "../../src/services/JwtService.js";
import { Product } from "../../src/models/productModel/productModel.js";
import { Categories } from "../../src/models/productModel/categoriesModel.js";
import { SellingProduct } from "../../src/models/productModel/sellingProductModel.js";

describe("GET ==> /get-userProducts", () => {
  let jwtToken;
  let categoryId;
  let productId;

  beforeAll(async () => {
    await mongoose.connect(Config.MONGO_URI);

    // Create a user for testing
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

    // Create a selling product for the user
    const sellingProduct = new SellingProduct({
      location: "Test Location",
      quantity: 50,
      productId: productId,
      image: ["test_image_url"],
      pricePerKg: 10,
      pricePerPiece: 2,
      miniumSell: "1 Kg",
      variety: "Test Variety",
      totalQuantity: 50,
      categoryId: categoryId,
      userId: user._id,
    });
    await sellingProduct.save();
  });

  // Function to remove test data
  const cleanup = async () => {
    await mongoose.connection.db.dropDatabase();
  };

  /* Closing database connection after each test. */
  afterAll(async () => {
    await mongoose.connection.close();
  });

  it("should fetch user's selling products", async () => {
    // Act
    const response = await request(app)
      .get("/get-userProducts")
      .set("Authorization", `Bearer ${jwtToken}`);

    // Assert
    expect(response.statusCode).toBe(200);
    expect(response.body).toHaveProperty("data");
    expect(response.body.data).toHaveLength(1);

    // Cleanup
    await cleanup();
  });
});
