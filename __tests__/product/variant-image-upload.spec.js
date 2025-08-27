import mongoose from "mongoose";
import request from "supertest";
import app from "../../src/app.js";
import { Config } from "../../src/config/index.js";
import { User } from "../../src/models/authModel/userModel.js";
import JwtService from "../../src/services/JwtService.js";
import { Categories } from "../../src/models/productModel/categoriesModel.js";
import { Product } from "../../src/models/productModel/productModel.js";

describe("POST ==> /create-product with variant images", () => {
  let jwtToken;
  let categoryId;

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

    // Create a category for testing
    const category = await new Categories({
      categoryName: "Test Category",
      image: "test_image_url",
      bgColor: "#FFFFFF",
    }).save();
    
    categoryId = category._id;
  });

  // Function to remove test data
  const cleanup = async () => {
    await mongoose.connection.db.dropDatabase();
  };

  /* Closing database connection after each test. */
  afterAll(async () => {
    await mongoose.connection.close();
  });

  it("should create product with variant images uploaded to Cloudinary", async () => {
    // Create a simple test image buffer
    const testImageBuffer = Buffer.from('fake-image-data');
    
    // Arrange - Request with variant images
    const requestBody = {
      productName: "Test Product with Variants",
      description: "A test product with variant images",
      price: 10.99,
      stockQuantity: 100,
      categoryId: categoryId.toString(),
      productType: "variable",
      variants: [
        {
          name: "Color",
          options: [
            {
              value: "Red",
              price: 10.99,
              stockQuantity: 50,
              image: "file:red-variant", // This will be replaced with uploaded image
              isActive: true
            },
            {
              value: "Blue", 
              price: 12.99,
              stockQuantity: 30,
              image: "file:blue-variant", // This will be replaced with uploaded image
              isActive: true
            }
          ]
        }
      ]
    };

    // Act - Send request with variant images
    const response = await request(app)
      .post(`/create-product`)
      .set("Authorization", `Bearer ${jwtToken}`)
      .field('productName', requestBody.productName)
      .field('description', requestBody.description)
      .field('price', requestBody.price)
      .field('stockQuantity', requestBody.stockQuantity)
      .field('categoryId', requestBody.categoryId)
      .field('productType', requestBody.productType)
      .field('variants', JSON.stringify(requestBody.variants))
      .attach('image', testImageBuffer, 'main-product.jpg') // Main product image
      .attach('variantImages', testImageBuffer, 'red-variant.jpg') // First variant image
      .attach('variantImages', testImageBuffer, 'blue-variant.jpg'); // Second variant image

    // Assert
    expect(response.statusCode).toBe(201);
    expect(response.body.success).toBe(true);
    expect(response.body.data.variants).toHaveLength(1);
    expect(response.body.data.variants[0].options).toHaveLength(2);
    
    // Check that variant images are Cloudinary URLs
    const variantOptions = response.body.data.variants[0].options;
    expect(variantOptions[0].image).toMatch(/^https:\/\/res\.cloudinary\.com/);
    expect(variantOptions[1].image).toMatch(/^https:\/\/res\.cloudinary\.com/);

    // Cleanup
    await cleanup();
  });

  it("should handle variant images with URLs instead of file uploads", async () => {
    // Arrange - Request with variant image URLs
    const requestBody = {
      productName: "Test Product with Variant URLs",
      description: "A test product with variant image URLs",
      price: 15.99,
      stockQuantity: 75,
      categoryId: categoryId.toString(),
      productType: "variable",
      variants: [
        {
          name: "Size",
          options: [
            {
              value: "Small",
              price: 15.99,
              stockQuantity: 25,
              image: "https://example.com/small.jpg", // Direct URL
              isActive: true
            },
            {
              value: "Large",
              price: 19.99,
              stockQuantity: 20,
              image: "https://example.com/large.jpg", // Direct URL
              isActive: true
            }
          ]
        }
      ]
    };

    // Create a simple test image buffer for main product image
    const testImageBuffer = Buffer.from('fake-image-data');

    // Act - Send request with variant image URLs
    const response = await request(app)
      .post(`/create-product`)
      .set("Authorization", `Bearer ${jwtToken}`)
      .field('productName', requestBody.productName)
      .field('description', requestBody.description)
      .field('price', requestBody.price)
      .field('stockQuantity', requestBody.stockQuantity)
      .field('categoryId', requestBody.categoryId)
      .field('productType', requestBody.productType)
      .field('variants', JSON.stringify(requestBody.variants))
      .attach('image', testImageBuffer, 'main-product.jpg');

    // Assert
    expect(response.statusCode).toBe(201);
    expect(response.body.success).toBe(true);
    expect(response.body.data.variants).toHaveLength(1);
    expect(response.body.data.variants[0].options).toHaveLength(2);
    
    // Check that variant images are Cloudinary URLs (URLs get uploaded to Cloudinary)
    const variantOptions = response.body.data.variants[0].options;
    expect(variantOptions[0].image).toMatch(/^https:\/\/res\.cloudinary\.com/);
    expect(variantOptions[1].image).toMatch(/^https:\/\/res\.cloudinary\.com/);

    // Cleanup
    await cleanup();
  });

  it("should reject when more than 8 variant images are uploaded", async () => {
    // Create test image buffers
    const testImageBuffer = Buffer.from('fake-image-data');
    
    // Arrange - Request with more than 8 variant images
    const requestBody = {
      productName: "Test Product with Too Many Variants",
      description: "A test product with too many variant images",
      price: 20.99,
      stockQuantity: 100,
      categoryId: categoryId.toString(),
      productType: "variable",
      variants: [
        {
          name: "Color",
          options: [
            { value: "Red", price: 20.99, stockQuantity: 25, image: "file:red", isActive: true },
            { value: "Blue", price: 22.99, stockQuantity: 25, image: "file:blue", isActive: true },
            { value: "Green", price: 24.99, stockQuantity: 25, image: "file:green", isActive: true },
            { value: "Yellow", price: 26.99, stockQuantity: 25, image: "file:yellow", isActive: true },
            { value: "Purple", price: 28.99, stockQuantity: 25, image: "file:purple", isActive: true },
            { value: "Orange", price: 30.99, stockQuantity: 25, image: "file:orange", isActive: true },
            { value: "Pink", price: 32.99, stockQuantity: 25, image: "file:pink", isActive: true },
            { value: "Brown", price: 34.99, stockQuantity: 25, image: "file:brown", isActive: true },
            { value: "Black", price: 36.99, stockQuantity: 25, image: "file:black", isActive: true } // This should cause the error
          ]
        }
      ]
    };

    // Act - Send request with 9 variant images (exceeding limit)
    const response = await request(app)
      .post(`/create-product`)
      .set("Authorization", `Bearer ${jwtToken}`)
      .field('productName', requestBody.productName)
      .field('description', requestBody.description)
      .field('price', requestBody.price)
      .field('stockQuantity', requestBody.stockQuantity)
      .field('categoryId', requestBody.categoryId)
      .field('productType', requestBody.productType)
      .field('variants', JSON.stringify(requestBody.variants))
      .attach('image', testImageBuffer, 'main-product.jpg')
      .attach('variantImages', testImageBuffer, 'red.jpg')
      .attach('variantImages', testImageBuffer, 'blue.jpg')
      .attach('variantImages', testImageBuffer, 'green.jpg')
      .attach('variantImages', testImageBuffer, 'yellow.jpg')
      .attach('variantImages', testImageBuffer, 'purple.jpg')
      .attach('variantImages', testImageBuffer, 'orange.jpg')
      .attach('variantImages', testImageBuffer, 'pink.jpg')
      .attach('variantImages', testImageBuffer, 'brown.jpg')
      .attach('variantImages', testImageBuffer, 'black.jpg'); // 9th image - should cause error

    // Assert
    expect(response.statusCode).toBe(400);
    expect(response.body.success).toBe(false);
    expect(response.body.message).toBe("Too many variant images. Maximum allowed is 8 variant images.");

    // Cleanup
    await cleanup();
  });
}); 