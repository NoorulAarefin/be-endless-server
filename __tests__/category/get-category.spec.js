import mongoose from "mongoose";
import request from "supertest";
import app from "../../src/app.js";
import { Config } from "../../src/config/index.js";
import { User } from "../../src/models/authModel/userModel.js";
import JwtService from "../../src/services/JwtService.js";

describe("POST ==> /get-category", () => {
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

  it("should return a category", async () => {
    // Arrange - Valid category data
    const categoryData = {
      categoryName: "Test Category",
      image: "test_image_url",
      bgColor: "#FFFFFF",
    };

    // Create a new category
    await request(app)
      .post(`/create-category`)
      .set("Authorization", `Bearer ${jwtToken}`)
      .send(categoryData);

    // Fetch categories
    const response = await request(app)
      .get("/get-category");

    // Assert
    expect(response.statusCode).toBe(200);
    expect(Array.isArray(response.body)).toBe(true);
    expect(response.body).toHaveLength(1);

    // Additional assertions for category properties
    const category = response.body[0];
    expect(category).toHaveProperty("categoryName", categoryData.categoryName);
    expect(category).toHaveProperty("image", categoryData.image);
    expect(category).toHaveProperty("bgColor", categoryData.bgColor);

    // Cleanup
    await cleanup();
  });

  it("should return an empty array if no categories found", async () => {
    // Fetch categories (assuming no categories are created)
    const response = await request(app)
      .get("/get-category");

    // Assert
    expect(response.statusCode).toBe(200);
    expect(Array.isArray(response.body)).toBe(true);
    expect(response.body).toHaveLength(0);
  });
});
