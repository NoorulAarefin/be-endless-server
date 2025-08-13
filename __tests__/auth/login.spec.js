import mongoose from "mongoose";
import request from "supertest";
import app from "../../src/app.js";
import { Config } from "../../src/config/index.js";

describe("POST ==> /login", () => {
  beforeEach(async () => {
    await mongoose.connect(Config.MONGO_URI);
  });

  // Function to remove test data
  const cleanup = async () => {
    await mongoose.connection.db.dropDatabase();
  };

  /* Closing database connection after each test. */
  afterEach(async () => {
    await mongoose.connection.close();
  });

  // Happy path
  describe("Given all fields", () => {
    it("should return user with authentication token", async () => {
      // Arrange
      const userSignupData = {
        fullName: "John Doe",
        email: "testuser@example.com",
        mobileNo: 1234567890,
        password: "Farm@1234",
        verified: true,
      };

      // Act
      await request(app).post(`/signup`).send(userSignupData);

      const userLoginData = {
        email: "testuser@example.com",
        password: "Farm@1234",
      };

      const response = await request(app).post(`/login`).send(userLoginData);

      // Assert
      expect(response.statusCode).toBe(201);
      expect(response.headers["content-type"]).toEqual(
        expect.stringContaining("json"),
      );
      expect(response.body).toHaveProperty("access_token");
      expect(response.body).toHaveProperty("refresh_token");

      // Cleanup
      await cleanup();
    });

    it("should return 404 status code if user not found in database", async () => {
      // Arrange
      const user = {
        email: "nonexistentuser@example.com",
        password: "Farm@123",
      };

      // Act
      const response = await request(app).post(`/login`).send(user);

      // Assert
      expect(response.statusCode).toBe(404);
    });

    it("should return 404 status code if password is incorrect", async () => {
      // Arrange
      const userSignupData = {
        fullName: "John Doe",
        email: "testuser@example.com",
        mobileNo: 1234567890,
        password: "Farm@123",
      };

      // Signup user with a known password
      await request(app).post(`/signup`).send(userSignupData);

      const userLoginData = {
        email: "testuser@example.com",
        password: "IncorrectPassword",
      };

      // Act
      const response = await request(app).post(`/login`).send(userLoginData);

      // Assert
      expect(response.statusCode).toBe(404);
    });

    it("should return 201 status code and send mail if email is not verified", async () => {
      // Arrange
      const userSignupData = {
        fullName: "John Doe",
        email: "testuser@example.com",
        mobileNo: 1234567890,
        password: "Farm@123",
      };

      // Signup user without verifying email
      await request(app).post(`/signup`).send(userSignupData);

      const userLoginData = {
        email: "testuser@example.com",
        password: "Farm@123",
      };

      // Act
      const response = await request(app).post(`/login`).send(userLoginData);

      // Assert
      expect(response.statusCode).toBe(201);
      expect(response.body.message).toBe(
        "An Email sent to your account please verify",
      );

      // Cleanup
      await cleanup();
    });
  });

  // Sad path
  describe("Fields are missing", () => {
    it("should return 422 status code if email field is missing", async () => {
      // Arrange
      const user = {
        email: "",
        password: "Farm@123",
      };
      // Act
      const response = await request(app).post(`/login`).send(user);

      // Assert
      expect(response.statusCode).toBe(422);
    });
  });
});
