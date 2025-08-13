import mongoose from "mongoose";
import request from "supertest";
import app from "../../src/app.js";
import { Config } from "../../src/config/index.js";
import { User } from "../../src/models/authModel/userModel.js";
import JwtService from "../../src/services/JwtService.js";
import { Categories } from "../../src/models/productModel/categoriesModel.js";
import { Product } from "../../src/models/productModel/productModel.js";
import { SellingProduct } from "../../src/models/productModel/sellingProductModel.js";
import { CartItems } from "../../src/models/productModel/cartModel.js";

describe("GET ==> /get-cartItems", () => {
  let jwtToken;
  let categoryId;
  let productId;
  let sellingProductId;

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

    // Create a selling product for testing
    const sellingProduct = new SellingProduct({
      location: "Location 1",
      quantity: 50,
      productId: productId,
      image: ["test_image_url"],
      pricePerKg: 10,
      pricePerPiece: 2,
      miniumSell: "1 Kg",
      variety: "Variety 1",
      totalQuantity: 50,
      categoryId: categoryId,
      userId: user._id,
      isSold: false,
    });
    await sellingProduct.save();

    sellingProductId = sellingProduct._id;

    // Create cart items for testing
    const cartItem1 = new CartItems({
      quantity: 2,
      totalAmount: 20,
      sellingProductId: sellingProductId,
      userId: user._id,
      productId: productId,
      categoryId: categoryId,
      isActive: true,
    });
    await cartItem1.save();

    const cartItem2 = new CartItems({
      quantity: 3,
      totalAmount: 30,
      sellingProductId: sellingProductId,
      userId: user._id,
      productId: productId,
      categoryId: categoryId,
      isActive: true,
    });
    await cartItem2.save();
  });

  // Function to remove test data
  const cleanup = async () => {
    await mongoose.connection.db.dropDatabase();
  };

  /* Closing database connection after each test. */
  afterAll(async () => {
    await mongoose.connection.close();
  });

  it("should get cart items", async () => {
    // Act
    const response = await request(app)
      .get("/get-cartItems")
      .set("Authorization", `Bearer ${jwtToken}`);

    // Assert
    expect(response.statusCode).toBe(200);
    expect(response.body).toHaveProperty("data");
    expect(response.body.data).toHaveLength(2);

    // Cleanup
    await cleanup();
  });
});
