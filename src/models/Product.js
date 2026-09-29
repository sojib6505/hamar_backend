/**
 * models/Product.js
 *
 * Mongoose schema for HAMAR products.
 *
 * This schema matches the existing frontend product data structure
 * (from src/data/products.js in the frontend). Every field the frontend
 * currently uses is present here.
 */

import mongoose from 'mongoose'

const productSchema = new mongoose.Schema(
  {
    // Human-readable name displayed in product cards and detail pages.
    name: {
      type: String,
      required: [true, 'Product name is required'],
      trim: true,
    },

    // URL-friendly identifier used in /product/:slug routes.
    slug: {
      type: String,
      required: [true, 'Product slug is required'],
      unique: true,
      lowercase: true,
      trim: true,
      index: true,
    },

    // Brand slug (e.g. 'anker') — supported as both brand and brandSlug for frontend parity
    brand: {
      type: String,
      lowercase: true,
      trim: true,
      index: true,
    },
    brandSlug: {
      type: String,
      lowercase: true,
      trim: true,
      index: true,
    },

    // Brand display name (e.g. 'Anker')
    brandName: {
      type: String,
      required: [true, 'Brand name is required'],
      trim: true,
    },

    // Category slug (e.g. 'chargers') — supported as both category and categorySlug
    category: {
      type: String,
      lowercase: true,
      trim: true,
      index: true,
    },
    categorySlug: {
      type: String,
      lowercase: true,
      trim: true,
      index: true,
    },

    // Product images
    images: {
      type: [String],
      default: [],
    },

    // Selling price in BDT
    price: {
      type: Number,
      required: [true, 'Price is required'],
      min: [0, 'Price cannot be negative'],
    },

    // Original price before discount
    oldPrice: {
      type: Number,
      default: null,
    },

    // Discount percentage
    discount: {
      type: Number,
      default: 0,
      min: 0,
      max: 100,
    },

    // Rating
    rating: {
      type: Number,
      default: 0,
      min: 0,
      max: 5,
    },

    // Review count
    reviewCount: {
      type: Number,
      default: 0,
      min: 0,
    },

    // Badges (e.g. 'Best Seller', 'New', 'Original')
    badges: {
      type: [String],
      default: [],
    },

    // Short description
    shortDescription: {
      type: String,
      trim: true,
      default: '',
    },

    // Full description
    description: {
      type: String,
      trim: true,
      default: '',
    },

    // Specifications key-value map
    specifications: {
      type: mongoose.Schema.Types.Mixed,
      default: {},
    },

    // Features list
    features: {
      type: [String],
      default: [],
    },

    // What's included
    whatsIncluded: {
      type: [String],
      default: ['Product Unit', 'User Manual', 'Warranty Card'],
    },

    // Warranty
    warranty: {
      type: String,
      default: '12 Months Official Warranty',
    },

    // Delivery info
    deliveryInfo: {
      type: String,
      default: 'Delivered in 2–4 business days across Bangladesh.',
    },

    // Compatibility
    compatibility: {
      type: [String],
      default: ['Universal'],
    },

    // Charging speed
    chargingSpeed: {
      type: String,
      default: '-',
    },

    // USB type
    usbType: {
      type: String,
      default: '-',
    },

    // Tags
    tags: {
      type: [String],
      default: [],
    },

    // Stock status
    stock: {
      type: String,
      enum: ['in-stock', 'out-of-stock'],
      default: 'in-stock',
    },

    // Featured on homepage
    isFeatured: {
      type: Boolean,
      default: false,
    },

    // Active status
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
    toJSON: {
      virtuals: true,
      transform: (_doc, ret) => {
        // Ensure id property is present for frontend compatibility
        ret.id = ret._id.toString()
        // Ensure brand and category are always populated
        ret.brand = ret.brand || ret.brandSlug
        ret.category = ret.category || ret.categorySlug
        return ret
      },
    },
    toObject: {
      virtuals: true,
      transform: (_doc, ret) => {
        ret.id = ret._id.toString()
        ret.brand = ret.brand || ret.brandSlug
        ret.category = ret.category || ret.categorySlug
        return ret
      },
    },
  }
)

// Pre-save hook to ensure brand and brandSlug, category and categorySlug stay in sync
productSchema.pre('save', function (next) {
  if (this.brand && !this.brandSlug) this.brandSlug = this.brand
  if (this.brandSlug && !this.brand) this.brand = this.brandSlug
  if (this.category && !this.categorySlug) this.categorySlug = this.category
  if (this.categorySlug && !this.category) this.category = this.categorySlug
  next()
})

productSchema.index({ name: 'text', brandName: 'text', description: 'text' })

const Product = mongoose.model('Product', productSchema)
export default Product
