import mongoose from "mongoose";
import { Config } from "../../src/config/index.js";
import request from "supertest";
import app from "../../src/app.js";

describe("POST ==> /signup", () => {
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
    it("should return the 201 status code", async () => {
      // Arrange
      const user = {
        fullName: "Jhon Dev",
        email: "test2@gmail.com",
        mobileNo: 1234567890,
        password: "Farm@123",
      };

      // Act
      const response = await request(app).post(`/signup`).send(user);

      // Retrieve the data from MongoDB
      const userData = await mongoose.connection
        .collection("users")
        .findOne({ email: user.email });

      // Assert
      expect(response.statusCode).toBe(201);
      expect(response.headers["content-type"]).toEqual(
        expect.stringContaining("json"),
      );

      expect(userData.fullName).toBe(user.fullName);
      expect(userData.email).toBe(user.email);
      expect(userData.mobileNo).toBe(user.mobileNo);
      // Cleanup
      await cleanup();
    });

    it("should store the hashed password in the database", async () => {
      //AAA

      // Arrange
      const user = {
        fullName: "Jhon Dev",
        email: "test2@gmail.com",
        mobileNo: 1234567890,
        password: "Farm@123",
      };

      // Act
      // api test karne ke liye ham supertest library ka use karinge
      await request(app).post("/signup").send(user);

      // Assert

      // Retrieve the data from MongoDB
      const userData = await mongoose.connection
        .collection("users")
        .findOne({ email: user.email });

      expect(userData.password).not.toBe(user.password);

      // toHaveLength se ham string and array ki length match karsakte hai
      expect(userData.password).toHaveLength(60);

      // toMatch mai hum regular expression match karsakte hai
      expect(userData.password).toMatch(/^\$2b\$\d+\$/);

      // Cleanup
      await cleanup();
    });

    it("should return 400 status code is email already exists", async () => {
      // Arrange
      const existingUser = {
        fullName: "Existing User",
        email: "existinguser@example.com",
        mobileNo: 1234567890,
        password: "Existing@123",
      };

      // Add the existing user to the database
      await request(app).post("/signup").send(existingUser);

      const newUser = {
        fullName: "John Doe",
        email: "existinguser@example.com", // Use the existing email
        mobileNo: 9876543210,
        password: "NewPassword@123",
      };

      // Act
      const response = await request(app).post("/signup").send(newUser);

      // Assert
      expect(response.statusCode).toBe(409);

      // Cleanup - remove the test data
      await cleanup();
    });
  });

  // Sad path
  describe("Fields are missing", () => {
    it("should return 422 status code if email field is missing", async () => {
      // Arrange
      const user = {
        fullName: "",
        email: "",
        mobileNo: 1234567890,
        password: "",
      };

      // Act
      const response = await request(app).post(`/signup`).send(user);

      // Assert
      expect(response.statusCode).toBe(422);
    });
  });
});
