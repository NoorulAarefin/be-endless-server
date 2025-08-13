import mongoose from "mongoose";
import request from "supertest";
import app from "../../src/app.js";
import { Config } from "../../src/config/index.js";
import { User } from "../../src/models/authModel/userModel.js";
import JwtService from "../../src/services/JwtService.js";
import { Categories } from "../../src/models/productModel/categoriesModel.js";

describe("POST ==> /delete-category", () => {
  let jwtToken;
  let categoryId;

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
    const category = new Categories({
      categoryName: "Test Category",
      image: "test_image_url",
      isActive: true,
    });
    await category.save();
    categoryId = category._id.toString();
  });

  // Function to remove test data
  const cleanup = async () => {
    await mongoose.connection.db.dropDatabase();
  };

  /* Closing database connection after each test. */
  afterAll(async () => {
    await mongoose.connection.close();
  });

  it("should delete a category", async () => {
    // Arrange - Category data
    const categoryData = {
      id: categoryId,
    };

    // Act
    const response = await request(app)
      .post(`/delete-category`)
      .set("Authorization", `Bearer ${jwtToken}`)
      .send(categoryData);

    // Assert
    expect(response.statusCode).toBe(200);
    expect(response.body.message).toBe("Category deleted successfully");

    // Check if category is deleted in the database
    const deletedCategory = await Categories.findById(categoryId);
    expect(deletedCategory.isActive).toBe(false);

    // Cleanup
    await cleanup();
  });

  it("should return an error if required fields are missing", async () => {
    // Arrange - Missing id field
    const invalidCategoryData = {};

    // Act
    const response = await request(app)
      .post(`/delete-category`)
      .set("Authorization", `Bearer ${jwtToken}`)
      .send(invalidCategoryData);

    // Assert
    expect(response.statusCode).toBe(422);
    expect(response.body.message).toContain('"id" is required');
  });
});
