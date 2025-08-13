import mongoose from "mongoose";
import request from "supertest";
import app from "../../src/app.js";
import { Config } from "../../src/config/index.js";
import { User } from "../../src/models/authModel/userModel.js";
import JwtService from "../../src/services/JwtService.js";
import { Categories } from "../../src/models/productModel/categoriesModel.js";

describe("POST ==> /create-product", () => {
  let jwtToken;
  let categoryId;

  beforeAll(async () => {
    // Assuming you have a separate test database
    await mongoose.connect(Config.MONGO_URI);

    // Create an admin user for testing with admin role
    const adminUser = new User({
      fullName: "Admin User",
      email: "admin@example.com",
      password: "Admin@123",
      role: "admin",
    });

    await adminUser.save();

    // Create a category for testing
    const category = await new Categories({
      categoryName: "Test Category",
      image: "https://res.cloudinary.com/test/image/upload/test.jpg",
      bgColor: "#FFFFFF",
    }).save();

    categoryId = category._id;

    jwtToken = JwtService.sign({ _id: adminUser._id });
  });

  // Function to remove test data
  const cleanup = async () => {
    await mongoose.connection.db.dropDatabase();
  };

  /* Closing database connection after each test. */
  afterAll(async () => {
    await mongoose.connection.close();
  });

  it("should create a product with image upload", async () => {
    // Arrange - Valid product data with image files
    const productData = {
      productName: "Test Product",
      description: "Test description for the product",
      price: 1000,
      stockQuantity: 50,
      minOrderQuantity: 1,
      unit: "piece",
      categoryId: categoryId,
      isFeatured: true,
      tags: ["test", "product"],
      specifications: {
        material: "Test Material",
        origin: "Test Origin"
      }
    };

    // Create mock image files
    const imageBuffer1 = Buffer.from("fake-image-data-1", "utf-8");
    const imageBuffer2 = Buffer.from("fake-image-data-2", "utf-8");

    // Act - Send a request to create a new product with image files
    const response = await request(app)
      .post(`/create-product`)
      .set("Authorization", `Bearer ${jwtToken}`)
      .field("productName", productData.productName)
      .field("description", productData.description)
      .field("price", productData.price)
      .field("stockQuantity", productData.stockQuantity)
      .field("minOrderQuantity", productData.minOrderQuantity)
      .field("unit", productData.unit)
      .field("categoryId", productData.categoryId)
      .field("isFeatured", productData.isFeatured)
      .field("tags", JSON.stringify(productData.tags))
      .field("specifications", JSON.stringify(productData.specifications))
      .attach("image", imageBuffer1, "test-image-1.jpg")
      .attach("image", imageBuffer2, "test-image-2.jpg");

    // Assert
    expect(response.statusCode).toBe(201);
    expect(response.body.message).toBe("Product created successfully");
    expect(response.body.data).toHaveProperty("_id");
    expect(response.body.data.productName).toBe(productData.productName);
    expect(response.body.data.image).toHaveLength(2);
    expect(response.body.data.image[0]).toMatch(/^https:\/\/res\.cloudinary\.com/); // Should be Cloudinary URLs
    expect(response.body.data.image[1]).toMatch(/^https:\/\/res\.cloudinary\.com/);

    // Cleanup
    await cleanup();
  });

  it("should return an error if no image files are provided", async () => {
    // Arrange - Product data without image files
    const productData = {
      productName: "Test Product",
      description: "Test description for the product",
      price: 1000,
      stockQuantity: 50,
      categoryId: categoryId,
    };

    // Act - Send a request without image files
    const response = await request(app)
      .post(`/create-product`)
      .set("Authorization", `Bearer ${jwtToken}`)
      .send(productData);

    // Assert
    expect(response.statusCode).toBe(400);
    expect(response.body.message).toBe("At least one image file is required");
    expect(response.body.success).toBe(false);
  });

  it("should return an error if user is not an admin", async () => {
    // Arrange - Regular user without admin role
    const regularUser = new User({
      fullName: "Regular User",
      email: "user@example.com",
      password: "User@123",
      role: "user",
    });
    await regularUser.save();

    const regularUserToken = JwtService.sign({ _id: regularUser._id });

    // Create a mock image file
    const imageBuffer = Buffer.from("fake-image-data", "utf-8");

    // Act - Send a request to create a new product with regular user JWT token
    const response = await request(app)
      .post(`/create-product`)
      .set("Authorization", `Bearer ${regularUserToken}`)
      .field("productName", "Test Product")
      .field("description", "Test description")
      .field("price", 1000)
      .field("stockQuantity", 50)
      .field("categoryId", categoryId)
      .attach("image", imageBuffer, "test-image.jpg");

    // Assert
    expect(response.statusCode).toBe(401);

    // Cleanup
    await cleanup();
  });
});
