/**
 * controllers/orderController.js
 *
 * Handles order placement, order lookup, customer order history,
 * and admin order management.
 *
 * Guest checkout is fully supported — authentication is NOT required to place an order.
 * If an authenticated user places an order, it is automatically linked to their profile.
 */

import Order from '../models/Order.js'
import { sendSuccess, sendError } from '../utils/response.js'
import { isObjectId } from '../utils/helpers.js'

/**
 * POST /api/orders
 *
 * Public endpoint: Place a new order (Guest or Authenticated).
 * If a valid Firebase token is supplied, req.user will be attached by optionalAuth.
 */
export const createOrder = async (req, res, next) => {
  try {
    const {
      name,
      email,
      phone,
      address,
      city,
      shipping = 'standard',
      payment = 'cod',
      items,
      notes = '',
    } = req.body

    // Validation
    if (!name || !name.trim()) return sendError(res, 'Full name is required.', 400)
    if (!email || !email.trim()) return sendError(res, 'Email is required.', 400)
    if (!phone || !phone.trim()) return sendError(res, 'Phone number is required.', 400)
    if (!address || !address.trim()) return sendError(res, 'Street address is required.', 400)
    if (!city || !city.trim()) return sendError(res, 'City is required.', 400)

    if (!Array.isArray(items) || items.length === 0) {
      return sendError(res, 'Cart is empty. At least one item is required to place an order.', 400)
    }

    // Process and normalize order items
    // Frontend CartContext passes items as array of { product: { ... }, quantity: number }
    // or direct item objects { name, price, quantity, ... }
    const processedItems = items.map((item) => {
      const p = item.product || item
      return {
        productId: p._id || p.id || null,
        name: p.name || 'Unnamed Product',
        slug: p.slug || '',
        price: Number(p.price) || 0,
        quantity: Math.max(1, Number(item.quantity) || 1),
        image: Array.isArray(p.images) && p.images.length > 0 ? p.images[0] : (p.image || ''),
      }
    })

    // Server-side calculation to prevent client tampering
    const subtotal = processedItems.reduce((sum, item) => sum + item.price * item.quantity, 0)
    const deliveryCharge = subtotal > 3000 ? 0 : 80
    const total = subtotal + deliveryCharge

    // Build the order document
    const orderData = {
      user: req.user ? req.user._id : null,
      customer: {
        name: name.trim(),
        email: email.trim().toLowerCase(),
        phone: phone.trim(),
      },
      shippingAddress: {
        address: address.trim(),
        city: city.trim(),
      },
      items: processedItems,
      subtotal,
      deliveryCharge,
      total,
      shippingMethod: ['standard', 'express'].includes(shipping) ? shipping : 'standard',
      paymentMethod: ['cod', 'bkash', 'card'].includes(payment) ? payment : 'cod',
      paymentStatus: 'pending',
      orderStatus: 'pending',
      notes: notes.trim(),
    }

    const order = await Order.create(orderData)

    sendSuccess(
      res,
      {
        orderId: order.orderNumber,
        order,
      },
      'Order placed successfully.',
      201
    )
  } catch (error) {
    next(error)
  }
}

/**
 * GET /api/orders/my-orders
 *
 * Authenticated customer endpoint: Get own order history.
 * Requires valid Firebase token (handled by requireAuth).
 */
export const getMyOrders = async (req, res, next) => {
  try {
    const orders = await Order.find({ user: req.user._id })
      .sort({ createdAt: -1 })
      .lean()

    // Format orders to match what the frontend Orders page expects:
    // { id: 'ORD-10234', date: '2026-07-28', status: 'Delivered', total: 3690, items: 2 }
    const formattedOrders = orders.map((o) => {
      const statusTitle =
        o.orderStatus.charAt(0).toUpperCase() + o.orderStatus.slice(1).toLowerCase()
      const dateStr = o.createdAt
        ? new Date(o.createdAt).toISOString().split('T')[0]
        : ''
      const itemCount = (o.items || []).reduce((sum, i) => sum + (i.quantity || 1), 0)

      return {
        id: o.orderNumber,
        _id: o._id,
        date: dateStr,
        status: statusTitle,
        total: o.total,
        items: itemCount,
        raw: o,
      }
    })

    sendSuccess(res, formattedOrders, 'Order history retrieved successfully.')
  } catch (error) {
    next(error)
  }
}

/**
 * GET /api/orders/:id
 *
 * Public endpoint: Lookup order by orderNumber (e.g., ORD-10234) or Mongo ObjectId.
 * Used for order tracking and post-checkout confirmation.
 */
export const getOrderById = async (req, res, next) => {
  try {
    const { id } = req.params
    const query = isObjectId(id) ? { _id: id } : { orderNumber: id.toUpperCase() }

    const order = await Order.findOne(query).lean()

    if (!order) {
      return sendError(res, 'Order not found.', 404)
    }

    // If order is linked to a user, and requester is authenticated user, verify ownership
    if (order.user && req.user && req.user.role !== 'admin' && String(order.user) !== String(req.user._id)) {
      return sendError(res, 'Unauthorized to view this order.', 403)
    }

    sendSuccess(res, order, 'Order details retrieved.')
  } catch (error) {
    next(error)
  }
}

/**
 * GET /api/admin/orders — Admin only
 *
 * List all orders with pagination, status filter, and sorting.
 */
export const getAllOrders = async (req, res, next) => {
  try {
    const { status, paymentStatus, page = 1, limit = 20, search } = req.query

    const query = {}

    if (status) {
      query.orderStatus = status.toLowerCase()
    }
    if (paymentStatus) {
      query.paymentStatus = paymentStatus.toLowerCase()
    }
    if (search) {
      const escaped = search.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
      query.$or = [
        { orderNumber: { $regex: escaped, $options: 'i' } },
        { 'customer.name': { $regex: escaped, $options: 'i' } },
        { 'customer.email': { $regex: escaped, $options: 'i' } },
        { 'customer.phone': { $regex: escaped, $options: 'i' } },
      ]
    }

    const pageNum = parseInt(page) || 1
    const limitNum = parseInt(limit) || 20
    const skip = (pageNum - 1) * limitNum

    const [orders, total] = await Promise.all([
      Order.find(query).sort({ createdAt: -1 }).skip(skip).limit(limitNum).lean(),
      Order.countDocuments(query),
    ])

    sendSuccess(
      res,
      {
        orders,
        total,
        page: pageNum,
        totalPages: Math.ceil(total / limitNum),
      },
      'Orders retrieved successfully.'
    )
  } catch (error) {
    next(error)
  }
}

/**
 * PUT /api/admin/orders/:id/status — Admin only
 *
 * Update order status or payment status.
 */
export const updateOrderStatus = async (req, res, next) => {
  try {
    const { id } = req.params
    const { orderStatus, paymentStatus } = req.body

    const query = isObjectId(id) ? { _id: id } : { orderNumber: id.toUpperCase() }

    const updateFields = {}
    if (orderStatus) updateFields.orderStatus = orderStatus.toLowerCase()
    if (paymentStatus) updateFields.paymentStatus = paymentStatus.toLowerCase()

    const order = await Order.findOneAndUpdate(query, { $set: updateFields }, { new: true, runValidators: true })

    if (!order) {
      return sendError(res, 'Order not found.', 404)
    }

    sendSuccess(res, order, 'Order status updated successfully.')
  } catch (error) {
    next(error)
  }
}

/**
 * DELETE /api/admin/orders/:id — Admin only
 *
 * Cancel or delete an order.
 */
export const deleteOrder = async (req, res, next) => {
  try {
    const { id } = req.params
    const query = isObjectId(id) ? { _id: id } : { orderNumber: id.toUpperCase() }

    const order = await Order.findOneAndDelete(query)

    if (!order) {
      return sendError(res, 'Order not found.', 404)
    }

    sendSuccess(res, null, 'Order removed successfully.')
  } catch (error) {
    next(error)
  }
}
