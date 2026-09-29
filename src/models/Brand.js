/**
 * models/Brand.js
 *
 * Mongoose schema for product brands.
 * Mirrors the existing frontend brand data structure from src/data/brands.js.
 *
 * Fields like 'history', 'whyChoose', 'technology' are used by the
 * BrandDetail page and must be preserved in the database.
 */

import mongoose from 'mongoose'

const brandSchema = new mongoose.Schema(
  {
    // URL-friendly identifier (e.g., 'anker', 'ugreen')
    slug: {
      type: String,
      required: [true, 'Brand slug is required'],
      unique: true,
      lowercase: true,
      trim: true,
      index: true,
    },

    name: {
      type: String,
      required: [true, 'Brand name is required'],
      trim: true,
    },

    // Emoji or symbol logo displayed on brand cards (e.g., '⚡', '🔷')
    logo: {
      type: String,
      default: '',
    },

    // Short marketing tagline (e.g., 'Charge Confidently')
    tagline: {
      type: String,
      default: '',
    },

    // URL to the brand hero/banner image used on BrandDetail page
    heroImage: {
      type: String,
      default: '',
    },

    // Full brand description paragraph
    description: {
      type: String,
      default: '',
    },

    // Brand history paragraph shown on BrandDetail page
    history: {
      type: String,
      default: '',
    },

    // Bullet points for "Why Choose [Brand]" section
    whyChoose: {
      type: [String],
      default: [],
    },

    // Technology highlights (shown as tags on BrandDetail page)
    technology: {
      type: [String],
      default: [],
    },

    // Year the brand was founded — displayed on BrandDetail page
    established: {
      type: Number,
      default: null,
    },

    // Country of origin
    country: {
      type: String,
      default: '',
    },

    isActive: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
  }
)

const Brand = mongoose.model('Brand', brandSchema)
export default Brand
