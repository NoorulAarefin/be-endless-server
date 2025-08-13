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

describe("POST ==> /update-cartItems", () => {
  let jwtToken;
  let categoryId;
  let productId;
  let sellingProductId;
  let cartItemId;

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

    // Create a cart item for testing
    const cartItem = new CartItems({
      quantity: 2,
      totalAmount: 20,
      sellingProductId: sellingProductId,
      userId: user._id,
      productId: productId,
      categoryId: categoryId,
    });
    const savedCartItem = await cartItem.save();
    cartItemId = savedCartItem._id;
  });

  // Function to remove test data
  const cleanup = async () => {
    await mongoose.connection.db.dropDatabase();
  };

  /* Closing database connection after each test. */
  afterAll(async () => {
    await mongoose.connection.close();
  });

  it("should update cart item", async () => {
    // Arrange - Updated cart item data
    const updatedCartItemData = {
      id: cartItemId,
      quantity: 5,
      totalAmount: 50,
    };

    // Act
    const response = await request(app)
      .post("/update-cartItems")
      .set("Authorization", `Bearer ${jwtToken}`)
      .send(updatedCartItemData);

    // Assert
    expect(response.statusCode).toBe(200);
    expect(response.body).toHaveProperty("data");
    expect(response.body.data.quantity).toBe(updatedCartItemData.quantity);
    expect(response.body.data.totalAmount).toBe(
      updatedCartItemData.totalAmount,
    );

    // Cleanup
    await cleanup();
  });
});
