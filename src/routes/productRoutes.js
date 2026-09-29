/**
 * routes/productRoutes.js
 *
 * Product API routes.
 *
 * Public routes (no auth required — anyone can browse products):
 *   GET /api/products
 *   GET /api/products/slug/:slug
 *   GET /api/products/:id/related
 *   GET /api/products/:id
 *
 * Admin-only routes:
 *   POST   /api/products
 *   PUT    /api/products/:id
 *   DELETE /api/products/:id
 *
 * IMPORTANT route ordering:
 * Express matches routes top-to-bottom. '/slug/:slug' and '/:id/related'
 * must appear BEFORE '/:id' to prevent ':id' swallowing those paths.
 */

import { Router } from 'express'
import { requireAdmin } from '../middleware/adminMiddleware.js'
import {
  getProducts,
  getProductBySlug,
  getProductById,
  getRelatedProducts,
  createProduct,
  updateProduct,
  deleteProduct,
} from '../controllers/productController.js'

const router = Router()

// ─── Public Routes ────────────────────────────────────────────────────────────

// GET /api/products — list with filtering, sorting, search
router.get('/', getProducts)

// GET /api/products/slug/:slug — fetch product by slug (primary for frontend)
// Must come before /:id to avoid route conflicts
router.get('/slug/:slug', getProductBySlug)

// GET /api/products/:id/related — "You May Also Like"
// Must come before /:id
router.get('/:id/related', getRelatedProducts)

// GET /api/products/:id — fetch by MongoDB ObjectId
router.get('/:id', getProductById)

// ─── Admin-Only Routes ────────────────────────────────────────────────────────

// POST /api/products — create new product
router.post('/', requireAdmin, createProduct)

// PUT /api/products/:id — update product
router.put('/:id', requireAdmin, updateProduct)

// DELETE /api/products/:id — soft-delete product
router.delete('/:id', requireAdmin, deleteProduct)

export default router
