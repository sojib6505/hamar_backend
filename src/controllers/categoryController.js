/**
 * controllers/categoryController.js
 *
 * Handles category API operations.
 * Public: GET (list, by-slug)
 * Admin:  POST, PUT, DELETE
 */

import Category from '../models/Category.js'
import Product from '../models/Product.js'
import { sendSuccess, sendError } from '../utils/response.js'

/**
 * GET /api/categories
 *
 * Returns all active categories.
 * Includes a live productCount for each category so the frontend
 * always shows accurate counts (not stale seeded values).
 */
export const getCategories = async (req, res, next) => {
  try {
    const categories = await Category.find({ isActive: true }).sort({ name: 1 })

    // Fetch product counts for all categories in one aggregation call
    // instead of N separate queries — more efficient.
    const productCounts = await Product.aggregate([
      { $match: { isActive: true } },
      { $group: { _id: '$categorySlug', count: { $sum: 1 } } },
    ])

    // Build a lookup map: { chargers: 5, power-banks: 4, ... }
    const countMap = {}
    productCounts.forEach(({ _id, count }) => {
      countMap[_id] = count
    })

    // Attach productCount to each category
    const enriched = categories.map((cat) => ({
      ...cat.toObject(),
      productCount: countMap[cat.slug] || 0,
    }))

    sendSuccess(res, enriched, 'Categories retrieved successfully.')
  } catch (error) {
    next(error)
  }
}

/**
 * GET /api/categories/:slug
 *
 * Returns a single category by its slug.
 */
export const getCategoryBySlug = async (req, res, next) => {
  try {
    const category = await Category.findOne({
      slug: req.params.slug.toLowerCase(),
      isActive: true,
    })

    if (!category) {
      return sendError(res, 'Category not found.', 404)
    }

    // Include live product count
    const productCount = await Product.countDocuments({
      categorySlug: category.slug,
      isActive: true,
    })

    sendSuccess(
      res,
      { ...category.toObject(), productCount },
      'Category retrieved successfully.'
    )
  } catch (error) {
    next(error)
  }
}

/**
 * POST /api/categories — Admin only
 */
export const createCategory = async (req, res, next) => {
  try {
    const category = await Category.create(req.body)
    sendSuccess(res, category, 'Category created successfully.', 201)
  } catch (error) {
    next(error)
  }
}

/**
 * PUT /api/categories/:id — Admin only
 */
export const updateCategory = async (req, res, next) => {
  try {
    const category = await Category.findByIdAndUpdate(
      req.params.id,
      { $set: req.body },
      { new: true, runValidators: true }
    )

    if (!category) {
      return sendError(res, 'Category not found.', 404)
    }

    sendSuccess(res, category, 'Category updated successfully.')
  } catch (error) {
    next(error)
  }
}

/**
 * DELETE /api/categories/:id — Admin only
 *
 * Soft-deletes a category. Products in this category remain intact.
 */
export const deleteCategory = async (req, res, next) => {
  try {
    const category = await Category.findByIdAndUpdate(
      req.params.id,
      { isActive: false },
      { new: true }
    )

    if (!category) {
      return sendError(res, 'Category not found.', 404)
    }

    sendSuccess(res, null, 'Category deleted successfully.')
  } catch (error) {
    next(error)
  }
}
