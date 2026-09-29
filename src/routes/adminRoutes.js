/**
 * routes/adminRoutes.js
 *
 * Dedicated admin endpoints.
 * All routes here are protected with requireAdmin.
 */

import { Router } from 'express'
import { requireAdmin } from '../middleware/adminMiddleware.js'
import {
  getAllOrders,
  getOrderById,
  updateOrderStatus,
  deleteOrder,
} from '../controllers/orderController.js'
import {
  getDashboardStats,
  getCustomers,
  getCustomerById,
  updateCustomerStatus,
} from '../controllers/adminController.js'

const router = Router()

// All admin routes require admin role
router.use(requireAdmin)

// Dashboard statistics
router.get('/dashboard/stats', getDashboardStats)

// Order management
router.get('/orders', getAllOrders)
router.get('/orders/:id', getOrderById)
router.put('/orders/:id/status', updateOrderStatus)
router.delete('/orders/:id', deleteOrder)

// Customer management
router.get('/customers', getCustomers)
router.get('/customers/:id', getCustomerById)
router.put('/customers/:id/status', updateCustomerStatus)

export default router
