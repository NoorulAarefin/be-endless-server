import mongoose from "mongoose";

const productSchema = new mongoose.Schema(
  {
    productName: {
      type: String,
      required: true,
      trim: true
    },
    image: {
      type: [String],
      required: true
    },
    description: {
      type: String,
      required: true
    },
    price: {
      type: Number,
      required: true,
      min: 0
    },
    originalPrice: {
      type: Number,
      min: 0
    },
    discountPercentage: {
      type: Number,
      min: 0,
      max: 100,
      default: 0
    },
    stockQuantity: {
      type: Number,
      required: true,
      min: 0,
      default: 0
    },
    minOrderQuantity: {
      type: Number,
      min: 1,
      default: 1
    },
    unit: {
      type: String,
      required: true,
      enum: ['kg', 'g', 'l', 'ml', 'piece', 'dozen', 'pack'],
      default: 'kg'
    },
    // Product variants/options (colors, sizes, etc.)
    variants: [{
      name: {
        type: String,
        required: true
      }, // e.g., "Color", "Size", "Material"
      options: [{
        value: {
          type: String,
          required: true
        }, // e.g., "Red", "Blue", "XL", "Cotton"
        price: {
          type: Number,
          min: 0
        }, // Additional price for this option
        stockQuantity: {
          type: Number,
          min: 0,
          default: 0
        },
        image: String, // Specific image for this variant
        isActive: {
          type: Boolean,
          default: true
        }
      }]
    }],
    // Legacy varieties support (for backward compatibility)
    varieties: [{
      name: String,
      price: Number,
      stockQuantity: Number
    }],
    nutritionalValue: {
      calories: String,
      protein: String,
      fat: String,
      carbohydrates: {
        dietaryFiber: String,
        sugars: String,
      },
    },
    categoryId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Categories",
      required: true
    },
    isActive: {
      type: Boolean,
      default: true
    },
    isFeatured: {
      type: Boolean,
      default: false
    },
    tags: [String],
    specifications: {
      type: Map,
      of: String
    },
    // Product type to determine variant behavior
    productType: {
      type: String,
      enum: ['simple', 'variable'], // simple = no variants, variable = has variants
      default: 'simple'
    }
  },
  { timestamps: true },
);

// Add indexes for better query performance
productSchema.index({ productName: 'text', description: 'text' });
productSchema.index({ categoryId: 1 });
productSchema.index({ isActive: 1 });
productSchema.index({ isFeatured: 1 });
productSchema.index({ price: 1 });
productSchema.index({ productType: 1 });

export const Product = mongoose.model("Product", productSchema);
