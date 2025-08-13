import mongoose from "mongoose";

const userShema = new mongoose.Schema(
  {
    fullName: {
      type: String,
    },
    email: {
      type: String,
      unique: true,
    },
    password: {
      type: String,
    },
    mobileNo: {
      type: Number,
      unique: true,
    },
    verified: {
      type: Boolean,
      default: false,
    },
    avatar: {
      type: String,
    },
    fcmToken: {
      type: String,
    },
    role: {
      type: String,
      default: "user",
    },
    gender: {
      type: String,
    },
    dateOfBirth: {
      type: Date,
    },
    city: {
      type: String,
      default: "",
    },
    postalCode: {
      type: String,
      default: "",
    },
    landmarks: {
      type: String,
      default: "",
    },
    homeAddress: {
      label: { type: String },
      street: { type: String },
      city: { type: String },
      state: { type: String },
      postalCode: { type: String },
      country: { type: String },
      location: {
        type: {
          type: String,
          enum: ["Point"]
        },
        coordinates: {
          type: [Number] // [longitude, latitude]
        }
      }
    },
    workAddress: {
      label: { type: String },
      street: { type: String },
      city: { type: String },
      state: { type: String },
      postalCode: { type: String },
      country: { type: String },
      location: {
        type: {
          type: String,
          enum: ["Point"]
        },
        coordinates: {
          type: [Number] // [longitude, latitude]
        }
      }
    },
    additionalAddresses: [
      {
        label: { type: String },
        street: { type: String },
        city: { type: String },
        state: { type: String },
        postalCode: { type: String },
        country: { type: String },
        location: {
          type: {
            type: String,
            enum: ["Point"]
          },
          coordinates: {
            type: [Number] // [longitude, latitude]
          }
        }
      }
    ],
  },
  { timestamps: true },
);

// Add 2dsphere indexes for geospatial queries on addresses
userShema.index({ 'homeAddress.location': '2dsphere' });
userShema.index({ 'workAddress.location': '2dsphere' });
userShema.index({ 'additionalAddresses.location': '2dsphere' });

export const User = mongoose.model("User", userShema);
