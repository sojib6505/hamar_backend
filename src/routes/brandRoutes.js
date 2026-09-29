/**
 * routes/brandRoutes.js
 */

import { Router } from 'express'
import { requireAdmin } from '../middleware/adminMiddleware.js'
import {
  getBrands,
  getBrandBySlug,
  createBrand,
  updateBrand,
  deleteBrand,
} from '../controllers/brandController.js'

const router = Router()

// Public
router.get('/', getBrands)
router.get('/:slug', getBrandBySlug)

// Admin only
router.post('/', requireAdmin, createBrand)
router.put('/:id', requireAdmin, updateBrand)
router.delete('/:id', requireAdmin, deleteBrand)

export default router
