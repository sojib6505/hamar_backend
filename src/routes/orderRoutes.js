/**
 * routes/orderRoutes.js
 *
 * Order endpoints:
 *   POST /api/orders           (Public / Guest / Authenticated)
 *   GET  /api/orders/my-orders (Authenticated customers)
 *   GET  /api/orders/:id       (Public lookup / Tracking)
 */

import { Router } from 'express'
import { requireAuth, optionalAuth } from '../middleware/authMiddleware.js'
import {
  createOrder,
  getMyOrders,
  getOrderById,
} from '../controllers/orderController.js'

const router = Router()

// Place an order (supports both guest customers and logged-in users)
router.post('/', optionalAuth, createOrder)

// Get current user's order history (must be authenticated)
router.get('/my-orders', requireAuth, getMyOrders)

// Lookup an order by orderNumber or id (confirmation / tracking)
router.get('/:id', optionalAuth, getOrderById)

export default router
