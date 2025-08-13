# Be-Endless E-Commerce API Collection

## Overview
This Postman collection contains all the API endpoints for the Be-Endless e-commerce platform. The platform follows a traditional e-commerce model where:
- **Admins** manage products, categories, and inventory
- **Users** browse products, add to cart, and place orders

## Files
- `postman-collection.json` - Main API collection
- `be-endless-environment.json` - Environment variables
- `swagger.yml` - OpenAPI specification (legacy)

## Setup Instructions

### 1. Import Collection
1. Open Postman
2. Click "Import" button
3. Import `postman-collection.json`

### 2. Import Environment
1. In Postman, go to "Environments"
2. Click "Import" 
3. Import `be-endless-environment.json`
4. Select the "Be-Endless Environment" from the dropdown

### 3. Configure Base URL
- Update the `base_url` variable in the environment:
  - **Development**: `http://localhost:3000`
  - **Staging**: `https://staging-api.beendless.com`
  - **Production**: `https://api.beendless.com`

## Authentication Flow

### 1. Signup
```
POST {{base_url}}/signup
```
- Creates a new user account
- No authentication required

### 2. Login
```
POST {{base_url}}/login
```
- Returns `access_token` and `refresh_token`
- Copy the `access_token` to the environment variable

### 3. Using Authentication
- All protected endpoints require the `Authorization` header
- Format: `Bearer {{access_token}}`
- The collection automatically includes this header for protected routes

## API Categories

### 🔐 Authentication
- **Signup** - Create new user account
- **Login** - User authentication
- **Dashboard Login** - Admin authentication
- **Get Profile** - Get user profile
- **Update Profile** - Update user information
- **OTP Verify** - Email verification
- **Refresh Token** - Get new access token
- **Logout** - End user session

### 🏠 User Addresses
- **Get User Addresses** - Get all user addresses
- **Add Additional Address** - Add new address
- **Update User Addresses** - Update home/work addresses
- **Update Additional Address** - Update specific address
- **Delete Additional Address** - Remove address

### 📂 Categories (Admin Only)
- **Create Category** - Admin: Create new product category
- **Get Categories** - Get all categories
- **Update Category** - Admin: Update category
- **Delete Category** - Admin: Delete category

### 🛍️ Products (Admin Management)
- **Create Product** - Admin: Create new product with pricing
- **Get Product by ID** - Get specific product details
- **Get Products** - Get products with filters (price, category, etc.)
- **Get All Products** - Admin: Get all products with pagination
- **Get Featured Products** - Get featured products for homepage
- **Update Product** - Admin: Update product details
- **Delete Product** - Admin: Delete product
- **Update Product Stock** - Admin: Manage inventory
- **Toggle Product Status** - Admin: Activate/deactivate products
- **Toggle Featured Status** - Admin: Mark products as featured
- **Search Products** - Search products by name
- **Upload Image** - Upload product images

### 🛒 Shopping Cart
- **Add to Cart** - Add product to cart
- **Get Cart Items** - View cart contents
- **Update Cart Items** - Modify cart quantities
- **Delete Cart Items** - Remove items from cart
- **Get Cart Details by IDs** - Get specific cart items

### 🚀 Orders & Checkout
- **Checkout** - Complete purchase from cart
- **Buy Product (Direct)** - Direct purchase without cart
- **Get My Orders** - View order history
- **Get Order by ID** - Get specific order details
- **Cancel Order** - Cancel pending orders
- **Get All Orders** - Admin: View all orders
- **Get Orders with Payments** - Admin: Orders with payment details
- **Update Order Status** - Admin: Update order status
- **Get Payment Details** - View payment information

### 💳 Payments
- **Create Payment Attempt** - Initiate payment
- **Update Payment Status** - Update payment status
- **Get All Payment Attempts** - Admin: View all payments
- **Get Payment Attempts by User** - User's payment history
- **Get Payment Attempt by ID** - Get specific payment
- **Cancel Payment Attempt** - Cancel payment

### 🔔 Notifications
- **Get Notifications** - View user notifications
- **Mark Notification as Read** - Mark notification as read

### 📊 Admin Dashboard
- **Get Counts** - Dashboard statistics
- **Get All Users** - View all users

## E-Commerce Model

### Product Management (Admin Only)
- Admins create products with fixed prices
- Products have inventory management (stock quantity)
- Products can be featured, active/inactive
- Support for product varieties with different prices
- Discount pricing (original price vs current price)

### User Shopping Experience
- Users browse products by category, price, search
- Add products to cart
- Checkout with delivery address
- View order history and status
- Cancel orders (if allowed)

### Inventory Management
- Real-time stock tracking
- Admin can update stock quantities
- Products become unavailable when out of stock
- Stock validation during checkout

## Testing Workflow

### 1. Admin Setup
1. **Dashboard Login** with admin credentials
2. **Create Category** for product classification
3. **Create Product** with pricing and inventory
4. **Upload Image** for product images
5. **Manage Stock** and product status

### 2. User Shopping
1. **Signup** → **Login** to get access token
2. **Browse Products** using various filters
3. **Add to Cart** products
4. **Checkout** with delivery address
5. **View Orders** and track status

### 3. Order Management
1. **Get My Orders** to view purchase history
2. **Cancel Order** if needed
3. **Admin: Update Order Status** for fulfillment
4. **Admin: Manage Payments** and inventory

## Environment Variables

| Variable | Description | Example |
|----------|-------------|---------|
| `base_url` | API base URL | `http://localhost:3000` |
| `access_token` | JWT access token | `eyJhbGciOiJIUzI1NiIs...` |
| `refresh_token` | JWT refresh token | `eyJhbGciOiJIUzI1NiIs...` |
| `user_id` | User ID | `507f1f77bcf86cd799439011` |
| `category_id` | Category ID | `507f1f77bcf86cd799439012` |
| `product_id` | Product ID | `507f1f77bcf86cd799439013` |
| `cart_id` | Cart Item ID | `507f1f77bcf86cd799439015` |
| `order_id` | Order ID | `507f1f77bcf86cd799439016` |
| `payment_id` | Payment ID | `507f1f77bcf86cd799439017` |
| `notification_id` | Notification ID | `507f1f77bcf86cd799439018` |
| `address_id` | Address ID | `507f1f77bcf86cd799439019` |

## Product Data Structure

### Product Fields
```json
{
  "productName": "Organic Wheat",
  "image": ["https://example.com/wheat1.jpg"],
  "description": "High quality organic wheat grains",
  "price": 2500,
  "originalPrice": 3000,
  "discountPercentage": 17,
  "stockQuantity": 100,
  "minOrderQuantity": 1,
  "unit": "kg",
  "categoryId": "category_id",
  "isActive": true,
  "isFeatured": false,
  "varieties": [
    {
      "name": "Sharbati Wheat",
      "price": 2800,
      "stockQuantity": 50
    }
  ],
  "tags": ["organic", "wheat"],
  "specifications": {
    "origin": "Punjab, India",
    "harvest_date": "2024"
  }
}
```

## Tips for Testing

### 1. Admin vs User Testing
- Use different accounts for admin and user testing
- Admin endpoints require admin role
- Regular user endpoints work with any authenticated user

### 2. Product Management
- Create categories first, then products
- Test stock management features
- Verify featured products functionality

### 3. Shopping Flow
- Test complete shopping flow: Browse → Cart → Checkout → Order
- Verify inventory updates after purchase
- Test order cancellation scenarios

### 4. Error Handling
- Test with invalid product IDs
- Test with insufficient stock
- Test with expired tokens

## Common Issues

### 1. Authentication Errors
- Ensure `access_token` is set in environment
- Check if token has expired
- Verify Authorization header format

### 2. Product Management
- Ensure category exists before creating products
- Check required fields (price, stock, etc.)
- Verify image URLs are accessible

### 3. Inventory Issues
- Check stock quantity before purchase
- Verify stock updates after orders
- Test out-of-stock scenarios

## Support
For API documentation and support, refer to the Swagger documentation or contact the development team. 