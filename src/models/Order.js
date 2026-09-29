/**
 * models/Order.js
 *
 * Mongoose schema for customer orders.
 *
 * Supports both:
 * 1. Guest orders (user is null, customer information is captured on checkout)
 * 2. Authenticated customer orders (linked to User model for order history)
 *
 * Status lifecycle:
 * orderStatus: pending → confirmed → processing → shipped → delivered (or cancelled)
 * paymentStatus: pending → paid → failed
 */

import mongoose from 'mongoose'
import { generateOrderNumber } from '../utils/helpers.js'

const orderItemSchema = new mongoose.Schema(
  {
    productId: {
      type: mongoose.Schema.Types.Mixed, // supports Mongo ObjectId or legacy string IDs
      ref: 'Product',
      default: null,
    },
    name: {
      type: String,
      required: true,
    },
    slug: {
      type: String,
      default: '',
    },
    price: {
      type: Number,
      required: true,
      min: 0,
    },
    quantity: {
      type: Number,
      required: true,
      min: 1,
    },
    image: {
      type: String,
      default: '',
    },
  },
  { _id: false }
)

const orderSchema = new mongoose.Schema(
  {
    // Unique human-readable identifier (e.g. ORD-10234)
    orderNumber: {
      type: String,
      unique: true,
      index: true,
      default: generateOrderNumber,
    },

    // Reference to User if customer is logged in; null for guest orders
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
      index: true,
    },

    customer: {
      name: {
        type: String,
        required: [true, 'Customer name is required'],
        trim: true,
      },
      email: {
        type: String,
        required: [true, 'Customer email is required'],
        trim: true,
        lowercase: true,
      },
      phone: {
        type: String,
        required: [true, 'Customer phone number is required'],
        trim: true,
      },
    },

    shippingAddress: {
      address: {
        type: String,
        required: [true, 'Shipping street address is required'],
        trim: true,
      },
      city: {
        type: String,
        required: [true, 'City is required'],
        trim: true,
      },
    },

    items: {
      type: [orderItemSchema],
      validate: {
        validator: (v) => Array.isArray(v) && v.length > 0,
        message: 'Order must contain at least one item',
      },
    },

    subtotal: {
      type: Number,
      required: true,
      min: 0,
    },

    deliveryCharge: {
      type: Number,
      default: 0,
      min: 0,
    },

    total: {
      type: Number,
      required: true,
      min: 0,
    },

    shippingMethod: {
      type: String,
      enum: ['standard', 'express'],
      default: 'standard',
    },

    paymentMethod: {
      type: String,
      enum: ['cod', 'bkash', 'card'],
      default: 'cod',
    },

    paymentStatus: {
      type: String,
      enum: ['pending', 'paid', 'failed'],
      default: 'pending',
      index: true,
    },

    orderStatus: {
      type: String,
      enum: ['pending', 'confirmed', 'processing', 'shipped', 'delivered', 'cancelled'],
      default: 'pending',
      index: true,
    },

    notes: {
      type: String,
      trim: true,
      default: '',
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
)

// Virtual for item count
orderSchema.virtual('itemCount').get(function () {
  return this.items?.reduce((sum, item) => sum + (item.quantity || 1), 0) || 0
})

const Order = mongoose.model('Order', orderSchema)
export default Order
