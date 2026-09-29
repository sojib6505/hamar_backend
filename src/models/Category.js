/**
 * models/Category.js
 *
 * Mongoose schema for product categories.
 * Mirrors the existing frontend category data structure from src/data/categories.js.
 */

import mongoose from 'mongoose'

const categorySchema = new mongoose.Schema(
  {
    // URL-friendly identifier (e.g., 'chargers', 'power-banks')
    slug: {
      type: String,
      required: [true, 'Category slug is required'],
      unique: true,
      lowercase: true,
      trim: true,
      index: true,
    },

    name: {
      type: String,
      required: [true, 'Category name is required'],
      trim: true,
    },

    description: {
      type: String,
      trim: true,
      default: '',
    },

    // URL to the category hero/thumbnail image
    image: {
      type: String,
      default: '',
    },

    // Whether this category appears in public listings.
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
    // Add a virtual 'productCount' that can be populated by the controller
    // from the products collection when needed.
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
)

const Category = mongoose.model('Category', categorySchema)
export default Category
