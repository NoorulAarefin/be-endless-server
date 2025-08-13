import mongoose from "mongoose";
import request from "supertest";
import app from "../../src/app.js";
import { Config } from "../../src/config/index.js";
import { User } from "../../src/models/authModel/userModel.js";
import JwtService from "../../src/services/JwtService.js";

describe("POST ==> /me", () => {
  let jwtToken;

  beforeAll(async () => {
    await mongoose.connect(Config.MONGO_URI);

    // Created test user and generate a JWT token for authentication
    const user = new User({
      fullName: "John Doe",
      email: "testuser@example.com",
      mobileNo: 1234567890,
      password: "Farm@123",
    });
    await user.save();

    jwtToken = JwtService.sign({ _id: user._id });
  });

  // Function to remove test data
  const cleanup = async () => {
    await mongoose.connection.db.dropDatabase();
  };

  /* Closing database connection after each test. */
  afterAll(async () => {
    await mongoose.connection.close();
  });

  it("should pass authentication and return user data", async () => {
    // Act
    const response = await request(app)
      .post(`/me`)
      .set("Authorization", `Bearer ${jwtToken}`);

    // Assert
    expect(response.statusCode).toBe(200);
    expect(response.headers["content-type"]).toEqual(
      expect.stringContaining("json"),
    );
    expect(response.body).toHaveProperty("data");
    expect(response.body.data.fullName).toBe("John Doe");

    // Cleanup
    await cleanup();
  });

  it("should return an error if no JWT token provided", async () => {
    // Act
    const response = await request(app).post(`/me`);

    // Assert
    expect(response.statusCode).toBe(401);
  });

  it("should return an error if invalid JWT token provided", async () => {
    // Act
    const response = await request(app)
      .post(`/me`)
      .set("Authorization", "Bearer invalid_token");

    // Assert
    expect(response.statusCode).toBe(401);
  });
});
