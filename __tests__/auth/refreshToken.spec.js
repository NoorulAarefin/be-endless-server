import mongoose from "mongoose";
import request from "supertest";
import app from "../../src/app.js";
import { Config } from "../../src/config/index.js";

describe("POST ==> /refresh", () => {
  beforeEach(async () => {
    await mongoose.connect(Config.MONGO_URI); // Assuming you have a separate test database
  });

  // Function to remove test data
  const cleanup = async () => {
    await mongoose.connection.db.dropDatabase();
  };

  /* Closing database connection after each test. */
  afterEach(async () => {
    await mongoose.connection.close();
  });

  it("should refresh tokens and return new access and refresh tokens", async () => {
    // Arrange
    const userSignupData = {
      fullName: "John Doe",
      email: "testuser@example.com",
      mobileNo: 1234567890,
      password: "Farm@1234",
      verified: true,
    };

    await request(app).post(`/signup`).send(userSignupData);

    const userLoginData = {
      email: "testuser@example.com",
      password: "Farm@1234",
    };

    const response = await request(app).post(`/login`).send(userLoginData);

    const refreshToken = response.body.refresh_token;

    // Act - Send a request to refresh tokens
    const refreshData = await request(app)
      .get(`/refresh/${refreshToken}`)
      .send();

    // Assert
    expect(refreshData.statusCode).toBe(200);
    expect(refreshData.headers["content-type"]).toEqual(
      expect.stringContaining("json"),
    );
    expect(refreshData.body).toHaveProperty("access_token");
    expect(refreshData.body).toHaveProperty("refresh_token");

    // Cleanup
    await cleanup();
  });

  it("should return an error for an invalid refresh token", async () => {
    // Act - Send a request with an invalid refresh token
    const response = await request(app).get(`/refresh/invalid_token`).send();

    // Assert
    expect(response.statusCode).toBe(500);

    // Cleanup
    await cleanup();
  });
});
