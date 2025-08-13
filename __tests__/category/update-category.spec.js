import mongoose from "mongoose";
import request from "supertest";
import app from "../../src/app.js";
import { Config } from "../../src/config/index.js";
import { User } from "../../src/models/authModel/userModel.js";
import JwtService from "../../src/services/JwtService.js";
import { Categories } from "../../src/models/productModel/categoriesModel.js";

describe("POST ==> /update-category", () => {
  let jwtToken;
  let categoryId;

  beforeAll(async () => {
    await mongoose.connect(Config.MONGO_URI);

    // admin user for testing with admin role
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

  it("should update a category", async () => {
    // Arrange
    const updatedCategoryData = {
      id: categoryId,
      categoryName: "Updated Category",
      image: "updated_image_url",
    };

    // Act
    const response = await request(app)
      .post(`/update-category`)
      .set("Authorization", `Bearer ${jwtToken}`)
      .send(updatedCategoryData);

    // Assert
    expect(response.statusCode).toBe(200);
    expect(response.body.message).toBe("Category updated successfully");

    // Check category is updated in the database
    const updatedCategory = await Categories.findById(categoryId);
    expect(updatedCategory.categoryName).toBe(updatedCategoryData.categoryName);
    expect(updatedCategory.image).toBe(updatedCategoryData.image);

    // Cleanup
    await cleanup();
  });

  it("should return an error if required fields are missing", async () => {
    // Arrange
    const invalidCategoryData = {
      id: categoryId,
      image: "updated_image_url",
    };

    // Act
    const response = await request(app)
      .post(`/update-category`)
      .set("Authorization", `Bearer ${jwtToken}`)
      .send(invalidCategoryData);

    // Assert
    expect(response.statusCode).toBe(422);
  });
});
