import mongoose from "mongoose";
import request from "supertest";
import app from "../../src/app.js";
import { Config } from "../../src/config/index.js";
import { User } from "../../src/models/authModel/userModel.js";
import JwtService from "../../src/services/JwtService.js";
import { Categories } from "../../src/models/productModel/categoriesModel.js";

describe("POST ==> /create-category", () => {
  let jwtToken;

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

  it("should create a new category with image upload", async () => {
    // Arrange - Valid category data with image file
    const categoryData = {
      categoryName: "Test Category",
      bgColor: "#FFFFFF",
    };

    // Create a mock image file
    const imageBuffer = Buffer.from("fake-image-data", "utf-8");

    // Act - Send a request to create a new category with image file
    const response = await request(app)
      .post(`/create-category`)
      .set("Authorization", `Bearer ${jwtToken}`)
      .field("categoryName", categoryData.categoryName)
      .field("bgColor", categoryData.bgColor)
      .attach("image", imageBuffer, "test-image.jpg");

    // Assert
    expect(response.statusCode).toBe(200);
    expect(response.headers["content-type"]).toEqual(
      expect.stringContaining("json"),
    );
    expect(response.body.success).toBe(true);
    expect(response.body.message).toBe("Category created successfully");

    // Verify that the category is created in the database
    const createdCategory = await Categories.findOne({
      categoryName: categoryData.categoryName,
    });
    expect(createdCategory).toBeTruthy();
    expect(createdCategory.image).toMatch(/^https:\/\/res\.cloudinary\.com/); // Should be a Cloudinary URL

    // Cleanup
    await cleanup();
  });

  it("should return an error if image file is not provided", async () => {
    // Arrange - Category data without image file
    const categoryData = {
      categoryName: "Test Category",
      bgColor: "#FFFFFF",
    };

    // Act - Send a request without image file
    const response = await request(app)
      .post(`/create-category`)
      .set("Authorization", `Bearer ${jwtToken}`)
      .send(categoryData);

    // Assert
    expect(response.statusCode).toBe(400);
    expect(response.body.message).toBe("Image file is required");
    expect(response.body.success).toBe(false);

    // Verify that no category is created in the database
    const createdCategory = await Categories.findOne({
      categoryName: categoryData.categoryName,
    });
    expect(createdCategory).toBeNull();
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

    // Act - Send a request to create a new category with regular user JWT token
    const response = await request(app)
      .post(`/create-category`)
      .set("Authorization", `Bearer ${regularUserToken}`)
      .field("categoryName", "Test Category")
      .attach("image", imageBuffer, "test-image.jpg");

    // Assert
    expect(response.statusCode).toBe(401);

    // Verify that no category is created in the database
    const createdCategory = await Categories.findOne({
      categoryName: "Test Category",
    });
    expect(createdCategory).toBeNull();
  });
});
