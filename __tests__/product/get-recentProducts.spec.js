import mongoose from "mongoose";
import request from "supertest";
import app from "../../src/app.js";
import { Config } from "../../src/config/index.js";
import { User } from "../../src/models/authModel/userModel.js";
import JwtService from "../../src/services/JwtService.js";
import { Categories } from "../../src/models/productModel/categoriesModel.js";
import { Product } from "../../src/models/productModel/productModel.js";
import { SellingProduct } from "../../src/models/productModel/sellingProductModel.js";
import { Order } from "../../src/models/productModel/orderModel.js";

describe("POST ==> /get-recentProducts", () => {
  let jwtToken;
  let categoryId;
  let productId;

  beforeAll(async () => {
    await mongoose.connect(Config.MONGO_URI);

    // Create a user for testing
    const user = new User({
      fullName: "Test User",
      email: "test@example.com",
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

    // Create some selling products for testing
    const sellingProduct1 = new SellingProduct({
      userId: user._id,
      productId: productId,
      categoryId: categoryId,
      isSold: false,
    });
    await sellingProduct1.save();

    const sellingProduct2 = new SellingProduct({
      userId: user._id,
      productId: productId,
      categoryId: categoryId,
      isSold: true,
    });
    await sellingProduct2.save();

    // Create some orders for testing
    const order1 = new Order({
      userId: user._id,
      productId: productId,
      categoryId: categoryId,
    });
    await order1.save();

    const order2 = new Order({
      userId: user._id,
      productId: productId,
      categoryId: categoryId,
    });
    await order2.save();
  });

  // Function to remove test data
  const cleanup = async () => {
    await mongoose.connection.db.dropDatabase();
  };

  /* Closing database connection after each test. */
  afterAll(async () => {
    await mongoose.connection.close();
  });

  it("should get recently sold or bought products", async () => {
    // Arrange
    const requestBody = {
      isSellProducts: true,
    };

    // Act
    const response = await request(app)
      .post("/get-recentProducts")
      .set("Authorization", `Bearer ${jwtToken}`)
      .send(requestBody);

    // Assert
    expect(response.statusCode).toBe(200);
    expect(response.body).toHaveProperty("success", true);
    expect(response.body).toHaveProperty("data");
    expect(response.body.data).toHaveLength(1);

    // Cleanup
    await cleanup();
  });
});
