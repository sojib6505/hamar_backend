/**
 * controllers/brandController.js
 *
 * Handles brand API operations.
 * Public: GET (list, by-slug)
 * Admin:  POST, PUT, DELETE
 */

import Brand from '../models/Brand.js'
import Product from '../models/Product.js'
import { sendSuccess, sendError } from '../utils/response.js'

/**
 * GET /api/brands
 *
 * Returns all active brands with live product counts.
 */
export const getBrands = async (req, res, next) => {
  try {
    const brands = await Brand.find({ isActive: true }).sort({ name: 1 })

    // Aggregate product counts per brand in a single query
    const productCounts = await Product.aggregate([
      { $match: { isActive: true } },
      { $group: { _id: '$brandSlug', count: { $sum: 1 } } },
    ])

    const countMap = {}
    productCounts.forEach(({ _id, count }) => {
      countMap[_id] = count
    })

    const enriched = brands.map((brand) => ({
      ...brand.toObject(),
      productCount: countMap[brand.slug] || 0,
    }))

    sendSuccess(res, enriched, 'Brands retrieved successfully.')
  } catch (error) {
    next(error)
  }
}

/**
 * GET /api/brands/:slug
 *
 * Returns a single brand by slug.
 * Used by the BrandDetail page which loads full brand info.
 */
export const getBrandBySlug = async (req, res, next) => {
  try {
    const brand = await Brand.findOne({
      slug: req.params.slug.toLowerCase(),
      isActive: true,
    })

    if (!brand) {
      return sendError(res, 'Brand not found.', 404)
    }

    const productCount = await Product.countDocuments({
      brandSlug: brand.slug,
      isActive: true,
    })

    sendSuccess(
      res,
      { ...brand.toObject(), productCount },
      'Brand retrieved successfully.'
    )
  } catch (error) {
    next(error)
  }
}

/**
 * POST /api/brands — Admin only
 */
export const createBrand = async (req, res, next) => {
  try {
    const brand = await Brand.create(req.body)
    sendSuccess(res, brand, 'Brand created successfully.', 201)
  } catch (error) {
    next(error)
  }
}

/**
 * PUT /api/brands/:id — Admin only
 */
export const updateBrand = async (req, res, next) => {
  try {
    const brand = await Brand.findByIdAndUpdate(
      req.params.id,
      { $set: req.body },
      { new: true, runValidators: true }
    )

    if (!brand) {
      return sendError(res, 'Brand not found.', 404)
    }

    sendSuccess(res, brand, 'Brand updated successfully.')
  } catch (error) {
    next(error)
  }
}

/**
 * DELETE /api/brands/:id — Admin only
 */
export const deleteBrand = async (req, res, next) => {
  try {
    const brand = await Brand.findByIdAndUpdate(
      req.params.id,
      { isActive: false },
      { new: true }
    )

    if (!brand) {
      return sendError(res, 'Brand not found.', 404)
    }

    sendSuccess(res, null, 'Brand deleted successfully.')
  } catch (error) {
    next(error)
  }
}
