import mongoose from "mongoose";
import request from "supertest";
import { Config } from "../../src/config/index.js";
import { User } from "../../src/models/authModel/userModel.js";
import JwtService from "../../src/services/JwtService.js";
import { SellingProduct } from "../../src/models/productModel/sellingProductModel.js";
import { Categories } from "../../src/models/productModel/categoriesModel.js";
import { Product } from "../../src/models/productModel/productModel.js";
import app from "../../src/app.js";

describe("POST ==> /get-allSellingProducts", () => {
  let jwtToken;
  let categoryId;
  let productId;

  beforeAll(async () => {
    await mongoose.connect(Config.MONGO_URI);

    // Create an admin user for testing with admin role
    const adminUser = new User({
      fullName: "Admin User",
      email: "admin@example.com",
      password: "Admin@123",
      role: "admin",
    });
    await adminUser.save();

    const user = new User({
      fullName: "Test User",
      email: "testuser@example.com",
      password: "Test@123",
    });
    await user.save();

    jwtToken = JwtService.sign({ _id: adminUser._id });

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
      location: "Location 1",
      quantity: 50,
      productId: productId,
      image: ["test_image_url1"],
      pricePerKg: 10,
      pricePerPiece: 2,
      miniumSell: "1 Kg",
      variety: "Variety 1",
      totalQuantity: 50,
      categoryId: categoryId,
      userId: user._id,
    });
    await sellingProduct1.save();

    const sellingProduct2 = new SellingProduct({
      location: "Location 2",
      quantity: 30,
      productId: productId,
      image: ["test_image_url2"],
      pricePerKg: 15,
      pricePerPiece: 3,
      miniumSell: "500g",
      variety: "Variety 2",
      totalQuantity: 30,
      categoryId: categoryId,
      userId: user._id,
    });
    await sellingProduct2.save();
  });

  // Function to remove test data
  const cleanup = async () => {
    await mongoose.connection.db.dropDatabase();
  };

  /* Closing database connection after each test. */
  afterAll(async () => {
    await mongoose.connection.close();
  });

  it("should fetch all selling products", async () => {
    // Act
    const response = await request(app)
      .post("/get-allSellingProducts")
      .set("Authorization", `Bearer ${jwtToken}`);

    // Assert
    expect(response.statusCode).toBe(200);
    expect(response.body).toHaveProperty("data");
    expect(response.body.data).toHaveLength(2);

    // Cleanup
    await cleanup();
  });
});
