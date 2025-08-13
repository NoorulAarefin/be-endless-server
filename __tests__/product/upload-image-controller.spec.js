import request from "supertest";
import app from "../../src/app.js";
import { Config } from "../../src/config/index.js";
import { createReadStream } from "streamifier";
import mongoose from "mongoose";
import { User } from "../../src/models/authModel/userModel.js";
import JwtService from "../../src/services/JwtService.js";

describe.skip("POST ==> /upload-image", () => {
  let jwtToken;

  beforeAll(async () => {
    await mongoose.connect(Config.MONGO_URI);

    // Create a user for testing
    const user = new User({
      fullName: "Test User",
      email: "test@example.com",
      password: "Test@123",
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

  it("should upload image files successfully", async () => {
    // Arrange - Mock image file
    const imageFile = {
      fieldname: "image",
      originalname: "test-image.jpg",
      buffer: Buffer.from("test-image-content", "utf-8"),
      mimetype: "image/jpeg",
    };

    // Act
    const response = await request(app)
      .post("/upload-image")
      .set("Authorization", `Bearer ${jwtToken}`)
      .attach("image", createReadStream(imageFile.buffer), "test-image.jpg");

    // Assert
    expect(response.statusCode).toBe(200);
    expect(response.body).toHaveLength(1);
    expect(response.body[0]).toHaveProperty("secure_url");

    // Cleanup
    await cleanup();
  });
});
