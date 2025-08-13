import mongoose from "mongoose";
import request from "supertest";
import app from "../../src/app.js";
import { Config } from "../../src/config/index.js";
import { User } from "../../src/models/authModel/userModel.js";
import { VerificationToken } from "../../src/models/authModel/verifyTokenModel.js";

describe("POST ==> /verify", () => {
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

  it("should verify the user and return success message", async () => {
    // Arrange
    const user = new User({
      fullName: "John Doe",
      email: "testuser@example.com",
      mobileNo: 1234567890,
      password: "Farm@123",
    });

    await user.save();

    const verificationToken = new VerificationToken({
      userId: user._id,
      otp: "1234",
    });

    await verificationToken.save();

    // Act - Send a request to verify the user
    const response = await request(app)
      .post(`/otp-verify`)
      .send({ otp: "1234" }); // Use the correct OTP

    // Assert
    expect(response.statusCode).toBe(200);
    expect(response.headers["content-type"]).toEqual(
      expect.stringContaining("json"),
    );
    expect(response.body.success).toBe(true);
    expect(response.body.message).toBe("Email verified successfully");
    expect(response.body).toHaveProperty("user");
    expect(response.body.user.verified).toBe(true); // Verify that the user is now marked as verified

    // Cleanup
    await cleanup();
  });

  it("should return an error for an invalid OTP", async () => {
    // Act - Send a request with an invalid OTP
    const response = await request(app)
      .post(`/otp-verify`)
      .send({ otp: "0000" });

    // Assert
    expect(response.statusCode).toBe(404);
    expect(response.body.message).toBe("Invalid Otp");

    // Cleanup
    await cleanup();
  });
});
