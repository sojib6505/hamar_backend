/**
 * routes/categoryRoutes.js
 */

import { Router } from 'express'
import { requireAdmin } from '../middleware/adminMiddleware.js'
import {
  getCategories,
  getCategoryBySlug,
  createCategory,
  updateCategory,
  deleteCategory,
} from '../controllers/categoryController.js'

const router = Router()

// Public
router.get('/', getCategories)
router.get('/:slug', getCategoryBySlug)

// Admin only
router.post('/', requireAdmin, createCategory)
router.put('/:id', requireAdmin, updateCategory)
router.delete('/:id', requireAdmin, deleteCategory)

export default router
