/**
 * controllers/adminController.js
 *
 * Dedicated admin controllers for:
 * 1. Dashboard summary analytics and statistics
 * 2. Customer user management
 *
 * All functions here are protected by requireAdmin middleware.
 */

import Product from '../models/Product.js'
import Order from '../models/Order.js'
import User from '../models/User.js'
import Category from '../models/Category.js'
import Brand from '../models/Brand.js'
import { sendSuccess, sendError } from '../utils/response.js'

/**
 * GET /api/admin/dashboard/stats
 *
 * Aggregates real metrics across collections:
 * - Product counts (total & active)
 * - Order counts & pending order alerts
 * - Customer counts
 * - Revenue totals
 * - Recent orders list
 */
export const getDashboardStats = async (req, res, next) => {
  try {
    const [
      totalProducts,
      outOfStockProducts,
      totalOrders,
      pendingOrders,
      totalCustomers,
      totalCategories,
      totalBrands,
      recentOrders,
      revenueResult,
    ] = await Promise.all([
      Product.countDocuments({ isActive: true }),
      Product.countDocuments({ isActive: true, stock: 'out-of-stock' }),
      Order.countDocuments(),
      Order.countDocuments({ orderStatus: 'pending' }),
      User.countDocuments({ role: 'customer' }),
      Category.countDocuments({ isActive: true }),
      Brand.countDocuments({ isActive: true }),
      Order.find()
        .sort({ createdAt: -1 })
        .limit(6)
        .select('orderNumber customer total orderStatus paymentStatus paymentMethod createdAt')
        .lean(),
      Order.aggregate([
        { $match: { paymentStatus: 'paid', orderStatus: { $ne: 'cancelled' } } },
        { $group: { _id: null, totalRevenue: { $sum: '$total' } } },
      ]),
    ])

    const totalRevenue = revenueResult[0]?.totalRevenue || 0

    // Format recent orders
    const formattedRecentOrders = recentOrders.map((o) => ({
      id: o.orderNumber,
      _id: o._id,
      customerName: o.customer?.name || 'Guest Customer',
      customerEmail: o.customer?.email || '',
      date: o.createdAt ? new Date(o.createdAt).toISOString().split('T')[0] : '',
      amount: o.total,
      paymentMethod: o.paymentMethod,
      paymentStatus: o.paymentStatus,
      status: o.orderStatus,
    }))

    sendSuccess(
      res,
      {
        totalRevenue,
        totalOrders,
        pendingOrders,
        totalProducts,
        outOfStockProducts,
        totalCustomers,
        totalCategories,
        totalBrands,
        recentOrders: formattedRecentOrders,
      },
      'Dashboard stats retrieved successfully.'
    )
  } catch (error) {
    next(error)
  }
}

/**
 * GET /api/admin/customers
 *
 * Returns paginated customer list with search.
 * Never exposes private authentication credentials.
 */
export const getCustomers = async (req, res, next) => {
  try {
    const { page = 1, limit = 20, search, status } = req.query

    const query = { role: 'customer' }

    if (search) {
      const escaped = search.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
      query.$or = [
        { name: { $regex: escaped, $options: 'i' } },
        { email: { $regex: escaped, $options: 'i' } },
        { phone: { $regex: escaped, $options: 'i' } },
      ]
    }

    if (status === 'active') query.isActive = true
    if (status === 'inactive') query.isActive = false

    const pageNum = parseInt(page) || 1
    const limitNum = parseInt(limit) || 20
    const skip = (pageNum - 1) * limitNum

    const [users, total] = await Promise.all([
      User.find(query)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limitNum)
        .select('name email phone role isActive createdAt')
        .lean(),
      User.countDocuments(query),
    ])

    // Format customers and fetch their order count
    const customerIds = users.map((u) => u._id)
    const orderCounts = await Order.aggregate([
      { $match: { user: { $in: customerIds } } },
      { $group: { _id: '$user', count: { $sum: 1 } } },
    ])

    const countMap = {}
    orderCounts.forEach(({ _id, count }) => {
      countMap[_id.toString()] = count
    })

    const formattedCustomers = users.map((u) => ({
      id: u._id,
      name: u.name,
      email: u.email,
      phone: u.phone || '—',
      role: u.role,
      isActive: u.isActive,
      orderCount: countMap[u._id.toString()] || 0,
      joinedDate: u.createdAt ? new Date(u.createdAt).toISOString().split('T')[0] : '',
    }))

    sendSuccess(
      res,
      {
        customers: formattedCustomers,
        total,
        page: pageNum,
        totalPages: Math.ceil(total / limitNum),
      },
      'Customers retrieved successfully.'
    )
  } catch (error) {
    next(error)
  }
}

/**
 * GET /api/admin/customers/:id
 *
 * Returns a customer's profile and recent order summary without auth credentials.
 */
export const getCustomerById = async (req, res, next) => {
  try {
    const user = await User.findOne({ _id: req.params.id, role: 'customer' })
      .select('name email phone role isActive createdAt')
      .lean()

    if (!user) {
      return sendError(res, 'Customer not found.', 404)
    }

    const [orderCount, recentOrders] = await Promise.all([
      Order.countDocuments({ user: user._id }),
      Order.find({ user: user._id })
        .sort({ createdAt: -1 })
        .limit(5)
        .select('orderNumber total orderStatus paymentStatus createdAt')
        .lean(),
    ])

    sendSuccess(
      res,
      { customer: { ...user, orderCount, recentOrders } },
      'Customer retrieved successfully.'
    )
  } catch (error) {
    next(error)
  }
}

/**
 * PUT /api/admin/customers/:id/status
 *
 * Update customer active status (suspend / activate).
 */
export const updateCustomerStatus = async (req, res, next) => {
  try {
    const { id } = req.params
    const { isActive } = req.body

    if (typeof isActive !== 'boolean') {
      return sendError(res, 'isActive must be a boolean.', 400)
    }

    const user = await User.findOneAndUpdate(
      { _id: id, role: 'customer' },
      { $set: { isActive } },
      { new: true }
    ).select('name email role isActive')

    if (!user) {
      return sendError(res, 'Customer not found.', 404)
    }

    sendSuccess(res, user, 'Customer status updated.')
  } catch (error) {
    next(error)
  }
}
