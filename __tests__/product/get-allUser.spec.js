import mongoose from "mongoose";
import request from "supertest";
import app from "../../src/app.js";
import { Config } from "../../src/config/index.js";
import { User } from "../../src/models/authModel/userModel.js";
import JwtService from "../../src/services/JwtService.js";

describe("GET ==> /get-allUser", () => {
  let jwtToken;

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

    // Created some regular users for testing
    await User.insertMany([
      { fullName: "User 1", email: "user1@example.com", role: "user" },
      { fullName: "User 2", email: "user2@example.com", role: "user" },
      { fullName: "User 3", email: "user3@example.com", role: "user" },
    ]);
  });

  // Function to remove test data
  const cleanup = async () => {
    await mongoose.connection.db.dropDatabase();
  };

  /* Closing database connection after each test. */
  afterAll(async () => {
    await mongoose.connection.close();
  });

  it("should return all users with role 'user'", async () => {
    // Act
    const response = await request(app)
      .get("/get-allUser")
      .set("Authorization", `Bearer ${jwtToken}`);

    // Assert
    expect(response.statusCode).toBe(200);
    expect(response.body).toHaveProperty("data");
    expect(response.body.data).toHaveLength(3);

    // Cleanup
    await cleanup();
  });
});
