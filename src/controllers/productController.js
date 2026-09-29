/**
 * controllers/productController.js
 *
 * Handles all product-related API operations.
 *
 * Public endpoints (no auth required):
 *   - getProducts       → browsing, searching, filtering, sorting
 *   - getProductBySlug  → product detail page (frontend uses slug)
 *   - getProductById    → product lookup by MongoDB ID
 *   - getRelatedProducts → "You May Also Like" section
 *
 * Admin-only endpoints:
 *   - createProduct
 *   - updateProduct
 *   - deleteProduct
 */

import Product from '../models/Product.js'
import { sendSuccess, sendError } from '../utils/response.js'

/**
 * GET /api/products
 *
 * Returns a filtered, sorted list of active products.
 * Supports all filter params used by the frontend Shop page:
 *   ?category=chargers
 *   ?brand=anker,baseus       (comma-separated or single value)
 *   ?search=gan charger
 *   ?minPrice=500&maxPrice=3000
 *   ?rating=4
 *   ?usbType=USB-C
 *   ?stock=in-stock
 *   ?sort=price-asc|price-desc|newest|rating|bestselling|featured
 *   ?limit=30&page=1          (optional)
 */
export const getProducts = async (req, res, next) => {
  try {
    const {
      category,
      brand,
      search,
      minPrice,
      maxPrice,
      rating,
      usbType,
      stock,
      sort,
      limit,
      page,
    } = req.query

    // Build query conditions
    const andConditions = [{ isActive: true }]

    // Category filter (supports either category or categorySlug)
    if (category) {
      const catLower = category.toLowerCase()
      andConditions.push({
        $or: [{ categorySlug: catLower }, { category: catLower }],
      })
    }

    // Brand filter — supports comma-separated: ?brand=anker,baseus
    if (brand) {
      const brands = brand.split(',').map((b) => b.trim().toLowerCase())
      andConditions.push({
        $or: [{ brandSlug: { $in: brands } }, { brand: { $in: brands } }],
      })
    }

    // Text search across name, brandName, description, shortDescription
    if (search) {
      const escaped = search.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
      andConditions.push({
        $or: [
          { name: { $regex: escaped, $options: 'i' } },
          { brandName: { $regex: escaped, $options: 'i' } },
          { categorySlug: { $regex: escaped, $options: 'i' } },
          { shortDescription: { $regex: escaped, $options: 'i' } },
        ],
      })
    }

    // Price range filter
    if (minPrice != null || maxPrice != null) {
      const priceQuery = {}
      if (minPrice != null) priceQuery.$gte = Number(minPrice)
      if (maxPrice != null) priceQuery.$lte = Number(maxPrice)
      andConditions.push({ price: priceQuery })
    }

    // Minimum rating filter
    if (rating) {
      andConditions.push({ rating: { $gte: Number(rating) } })
    }

    // USB type filter (exact match)
    if (usbType) {
      andConditions.push({ usbType })
    }

    // Stock status filter
    if (stock) {
      andConditions.push({ stock })
    }

    const query = andConditions.length > 1 ? { $and: andConditions } : andConditions[0]

    // Determine sort order
    let sortOption = {}
    switch (sort) {
      case 'price-asc':
        sortOption = { price: 1 }
        break
      case 'price-desc':
        sortOption = { price: -1 }
        break
      case 'newest':
        sortOption = { createdAt: -1 }
        break
      case 'rating':
        sortOption = { rating: -1 }
        break
      case 'bestselling':
        sortOption = { reviewCount: -1 }
        break
      case 'featured':
      default:
        sortOption = { isFeatured: -1, reviewCount: -1 }
        break
    }

    // Pagination
    const limitNum = parseInt(limit) || 100
    const pageNum = parseInt(page) || 1
    const skip = (pageNum - 1) * limitNum

    const [products, total] = await Promise.all([
      Product.find(query).sort(sortOption).skip(skip).limit(limitNum),
      Product.countDocuments(query),
    ])

    sendSuccess(
      res,
      {
        products,
        total,
        page: pageNum,
        totalPages: Math.ceil(total / limitNum),
      },
      'Products retrieved successfully.'
    )
  } catch (error) {
    next(error)
  }
}

/**
 * GET /api/products/slug/:slug
 *
 * Fetches a single product by its URL slug.
 */
export const getProductBySlug = async (req, res, next) => {
  try {
    const product = await Product.findOne({
      slug: req.params.slug.toLowerCase(),
      isActive: true,
    })

    if (!product) {
      return sendError(res, 'Product not found.', 404)
    }

    sendSuccess(res, product, 'Product retrieved successfully.')
  } catch (error) {
    next(error)
  }
}

/**
 * GET /api/products/:id/related
 *
 * Returns up to 4 related products sharing the same category or brand.
 */
export const getRelatedProducts = async (req, res, next) => {
  try {
    const product = await Product.findById(req.params.id)

    if (!product) {
      return sendError(res, 'Product not found.', 404)
    }

    const limit = parseInt(req.query.limit) || 4
    const cat = product.categorySlug || product.category
    const brd = product.brandSlug || product.brand

    const related = await Product.find({
      _id: { $ne: product._id },
      isActive: true,
      $or: [
        { categorySlug: cat },
        { category: cat },
        { brandSlug: brd },
        { brand: brd },
      ],
    }).limit(limit)

    sendSuccess(res, related, 'Related products retrieved successfully.')
  } catch (error) {
    next(error)
  }
}

/**
 * GET /api/products/:id
 *
 * Fetches a single product by its MongoDB ObjectId.
 */
export const getProductById = async (req, res, next) => {
  try {
    const product = await Product.findOne({
      _id: req.params.id,
      isActive: true,
    })

    if (!product) {
      return sendError(res, 'Product not found.', 404)
    }

    sendSuccess(res, product, 'Product retrieved successfully.')
  } catch (error) {
    next(error)
  }
}

/**
 * POST /api/products — Admin only
 */
export const createProduct = async (req, res, next) => {
  try {
    const product = await Product.create(req.body)
    sendSuccess(res, product, 'Product created successfully.', 201)
  } catch (error) {
    next(error)
  }
}

/**
 * PUT /api/products/:id — Admin only
 */
export const updateProduct = async (req, res, next) => {
  try {
    const product = await Product.findByIdAndUpdate(
      req.params.id,
      { $set: req.body },
      { new: true, runValidators: true }
    )

    if (!product) {
      return sendError(res, 'Product not found.', 404)
    }

    sendSuccess(res, product, 'Product updated successfully.')
  } catch (error) {
    next(error)
  }
}

/**
 * DELETE /api/products/:id — Admin only
 */
export const deleteProduct = async (req, res, next) => {
  try {
    const product = await Product.findByIdAndUpdate(
      req.params.id,
      { isActive: false },
      { new: true }
    )

    if (!product) {
      return sendError(res, 'Product not found.', 404)
    }

    sendSuccess(res, null, 'Product deleted successfully.')
  } catch (error) {
    next(error)
  }
}
