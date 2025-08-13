# 🔧 Admin Routes & Request Bodies Guide

## **🔐 Authentication Required**
All admin routes require:
- **Authorization Header**: `Bearer {{access_token}}`
- **Admin Role**: User must have `role: "admin"`

---

## **📋 Complete Admin Routes List**

### **🔐 Authentication Routes**

#### **1. Admin Registration**
```http
POST {{base_url}}/signup
Content-Type: application/json

{
  "fullName": "Admin User",
  "email": "admin@beendless.com",
  "password": "admin123",
  "mobileNo": "1234567890",
  "role": "admin"
}
```

#### **2. Admin Login**
```http
POST {{base_url}}/login
Content-Type: application/json

{
  "email": "admin@beendless.com",
  "password": "admin123"
}
```

#### **3. Dashboard Login (Admin Only)**
```http
POST {{base_url}}/dashboard-login
Content-Type: application/json

{
  "email": "admin@beendless.com",
  "password": "admin123"
}
```

---

### **📂 Category Management**

#### **4. Create Category**
```http
POST {{base_url}}/create-category
Authorization: Bearer {{access_token}}
Content-Type: multipart/form-data

Form Data:
- categoryName: "Electronics"
- bgColor: "#FF6B6B" (optional)
- image: [image_file]
```

**Note:** The image file will be uploaded to Cloudinary and the returned URL will be stored in the database.

#### **5. Update Category**
```http
PUT {{base_url}}/update-category
Authorization: Bearer {{access_token}}
Content-Type: multipart/form-data

Form Data:
- id: "{{category_id}}"
- categoryName: "Updated Electronics"
- bgColor: "#FF6B6B" (optional)
- image: [image_file] (optional - only if you want to update the image)
```

**Note:** If you include an image file, it will be uploaded to Cloudinary and replace the existing image URL.

#### **6. Delete Category**
```http
DELETE {{base_url}}/delete-category
Authorization: Bearer {{access_token}}
Content-Type: application/json

{
  "id": "{{category_id}}"
}
```

#### **7. Get All Categories**
```http
GET {{base_url}}/get-category
Authorization: Bearer {{access_token}}
```

---

### **📦 Product Management**

#### **8. Create Simple Product**
```http
POST {{base_url}}/create-product
Authorization: Bearer {{access_token}}
Content-Type: multipart/form-data

Form Data:
- productName: "Organic Wheat"
- description: "Fresh organic wheat from local farms"
- price: 1500
- originalPrice: 1800 (optional)
- stockQuantity: 100
- minOrderQuantity: 1
- unit: "kg"
- categoryId: "{{category_id}}"
- isFeatured: true (optional)
- tags: ["organic", "wheat", "local"] (optional)
- specifications: {"origin": "Local Farm", "grade": "A"} (optional)
- image: [image_file_1]
- image: [image_file_2] (can upload multiple images)
```

**Note:** Images will be uploaded to Cloudinary and the returned URLs will be stored in the database.

#### **9. Create Product with Variants**
```http
POST {{base_url}}/create-product
Authorization: Bearer {{access_token}}
Content-Type: multipart/form-data

Form Data:
- productName: "Premium Cotton T-Shirt"
- description: "High quality cotton t-shirt with multiple color options"
- price: 1200
- originalPrice: 1500
- stockQuantity: 50
- minOrderQuantity: 1
- unit: "piece"
- categoryId: "{{category_id}}"
- productType: "variable"
- isFeatured: true
- tags: ["clothing", "tshirt", "cotton", "casual"]
- specifications: {"material": "100% Cotton", "care_instructions": "Machine wash cold"}
- variants: [{"name": "Color", "options": [{"value": "Red", "price": 0, "stockQuantity": 15, "isActive": true}, {"value": "Blue", "price": 0, "stockQuantity": 20, "isActive": true}]}]
- image: [image_file_1]
- image: [image_file_2]
```

**Note:** For variant-specific images, you can upload them separately and include the URLs in the variant options.

#### **10. Update Product**
```http
PUT {{base_url}}/update-product
Authorization: Bearer {{access_token}}
Content-Type: multipart/form-data

Form Data:
- productId: "{{product_id}}"
- productName: "Updated Product Name" (optional)
- description: "Updated description" (optional)
- price: 2000 (optional)
- stockQuantity: 75 (optional)
- image: [new_image_file_1] (optional - only if you want to update images)
- image: [new_image_file_2] (optional - can upload multiple images)
```

**Note:** If you include image files, they will be uploaded to Cloudinary and replace the existing image URLs.

#### **11. Delete Product**
```http
DELETE {{base_url}}/delete-product
Authorization: Bearer {{access_token}}
Content-Type: application/json

{
  "productId": "{{product_id}}"
}
```

#### **12. Update Product Stock**
```http
PATCH {{base_url}}/update-stock
Authorization: Bearer {{access_token}}
Content-Type: application/json

{
  "productId": "{{product_id}}",
  "stockQuantity": 150
}
```

#### **13. Toggle Product Status**
```http
PATCH {{base_url}}/toggle-status
Authorization: Bearer {{access_token}}
Content-Type: application/json

{
  "productId": "{{product_id}}"
}
```

#### **14. Toggle Featured Status**
```http
PATCH {{base_url}}/toggle-featured
Authorization: Bearer {{access_token}}
Content-Type: application/json

{
  "productId": "{{product_id}}"
}
```

#### **15. Get All Products**
```http
POST {{base_url}}/get-Allproducts
Authorization: Bearer {{access_token}}
Content-Type: application/json

{
  "skip": 0,
  "limit": 20,
  "categoryId": "{{category_id}}",
  "isActive": true
}
```

#### **16. Get Product Counts (Dashboard)**
```http
GET {{base_url}}/get-counts
Authorization: Bearer {{access_token}}
```

---

### **📊 Order Management**

#### **17. Get All Orders**
```http
POST {{base_url}}/get-allOrders
Authorization: Bearer {{access_token}}
Content-Type: application/json

{
  "skip": 0,
  "limit": 20,
  "status": "pending"
}
```

#### **18. Get Orders with Payment Details**
```http
GET {{base_url}}/admin/orders-with-payments
Authorization: Bearer {{access_token}}
```

#### **19. Update Order Status**
```http
POST {{base_url}}/update-order-status
Authorization: Bearer {{access_token}}
Content-Type: application/json

{
  "orderId": "{{order_id}}",
  "isSeller": true
}
```

#### **20. Get Payment Details**
```http
GET {{base_url}}/get-paymentDetails
Authorization: Bearer {{access_token}}
```

---

### **👥 User Management**

#### **21. Get All Users**
```http
GET {{base_url}}/get-allUser
Authorization: Bearer {{access_token}}
```

---

### **📤 File Upload**

#### **22. Upload Images**
```http
POST {{base_url}}/upload-images
Authorization: Bearer {{access_token}}
Content-Type: multipart/form-data

Form Data:
- files: [image files]
```

---

## **🎯 Response Examples**

### **Successful Product Creation**
```json
{
  "success": true,
  "message": "Product created successfully",
  "data": {
    "_id": "64f8a1b2c3d4e5f6a7b8c9d0",
    "productName": "Premium Cotton T-Shirt",
    "price": 1200,
    "stockQuantity": 50,
    "variants": [...],
    "categoryId": {
      "_id": "64f8a1b2c3d4e5f6a7b8c9d1",
      "categoryName": "Clothing"
    },
    "createdAt": "2024-01-15T10:30:00.000Z",
    "updatedAt": "2024-01-15T10:30:00.000Z"
  }
}
```

### **Successful Order Update**
```json
{
  "success": true,
  "data": {
    "_id": "64f8a1b2c3d4e5f6a7b8c9d2",
    "status": "pending",
    "userId": {
      "_id": "64f8a1b2c3d4e5f6a7b8c9d3",
      "fullName": "John Doe",
      "email": "john@example.com"
    },
    "productId": {
      "_id": "64f8a1b2c3d4e5f6a7b8c9d4",
      "productName": "Premium Cotton T-Shirt",
      "image": ["https://example.com/tshirt.jpg"]
    },
    "totalAmount": 1200,
    "quantity": 1,
    "updatedAt": "2024-01-15T10:30:00.000Z"
  }
}
```

---

## **⚠️ Common Error Responses**

### **Unauthorized (401)**
```json
{
  "success": false,
  "message": "You do not have permission to engage in that activity."
}
```

### **Validation Error (400)**
```json
{
  "success": false,
  "message": "Validation failed",
  "details": {
    "productName": "Product name is required"
  }
}
```

### **Not Found (404)**
```json
{
  "success": false,
  "message": "Product not found"
}
```

---

## **🔧 Testing Workflow**

### **1. Setup Admin Account**
```bash
# Register admin
POST /signup
{
  "fullName": "Admin User",
  "email": "admin@test.com",
  "password": "admin123",
  "mobileNo": "1234567890",
  "role": "admin"
}

# Login and get token
POST /login
{
  "email": "admin@test.com",
  "password": "admin123"
}
```

### **2. Create Categories**
```bash
# Create category
POST /create-category
{
  "categoryName": "Electronics",
  "image": "https://example.com/electronics.jpg"
}
```

### **3. Create Products**
```bash
# Create simple product
POST /create-product
{
  "productName": "Test Product",
  "image": ["https://example.com/test.jpg"],
  "description": "Test description",
  "price": 100,
  "stockQuantity": 10,
  "unit": "piece",
  "categoryId": "{{category_id}}"
}

# Create product with variants
POST /create-product
{
  "productName": "Test T-Shirt",
  "productType": "variable",
  "variants": [...]
}
```

### **4. Manage Orders**
```bash
# Get all orders
POST /get-allOrders

# Update order status
POST /update-order-status
{
  "orderId": "{{order_id}}",
  "isSeller": true
}
```

---

## **📱 Frontend Integration Tips**

### **Admin Dashboard Features:**
1. **Product Management**
   - Product creation with variant builder
   - Stock management interface
   - Product status toggles

2. **Order Management**
   - Order listing with filters
   - Status update interface
   - Payment tracking

3. **Category Management**
   - Category CRUD operations
   - Image upload for categories

4. **User Management**
   - User listing and details
   - User activity tracking

### **Key API Patterns:**
- All admin routes require `Authorization: Bearer {{token}}`
- Use `productType: "variable"` for products with variants
- Handle variant pricing calculation on frontend
- Implement proper error handling for all responses

This guide covers all admin functionality needed for your e-commerce platform! 🚀 