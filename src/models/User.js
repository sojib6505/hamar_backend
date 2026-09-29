/**
 * models/User.js
 *
 * Mongoose schema for HAMAR customer and admin users.
 *
 * WHY we store users in MongoDB when Firebase handles auth:
 * Firebase Authentication stores credentials (password hash, email, etc.)
 * MongoDB stores application-level data: role, display name, order history
 * link, preferences, etc. The two are linked by firebaseUid.
 *
 * WHY we don't store passwords here:
 * Firebase handles all password hashing, storage, and reset flows.
 * We never touch the user's credentials directly.
 */

import mongoose from 'mongoose'

const userSchema = new mongoose.Schema(
  {
    // The Firebase UID is the primary link between Firebase Auth and this record.
    // It's unique per Firebase project and never changes for a user.
    firebaseUid: {
      type: String,
      required: [true, 'Firebase UID is required'],
      unique: true,
      index: true,
    },

    name: {
      type: String,
      required: [true, 'Name is required'],
      trim: true,
      maxlength: [100, 'Name cannot exceed 100 characters'],
    },

    email: {
      type: String,
      required: [true, 'Email is required'],
      unique: true,
      lowercase: true,
      trim: true,
    },

    phone: {
      type: String,
      trim: true,
      default: null,
    },

    // Role determines what the user can do on the backend.
    // 'customer' → standard shopping access
    // 'admin'    → full product/order/category management
    //
    // WHY we don't trust the role from the frontend:
    // Any client could send { role: 'admin' } in a request body.
    // We always read the role from this database record, never from the request.
    role: {
      type: String,
      enum: ['customer', 'admin'],
      default: 'customer',
    },

    // Soft-delete flag. Deactivated accounts cannot log in but their
    // data (orders, etc.) is preserved.
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  {
    // Automatically adds createdAt and updatedAt timestamps.
    timestamps: true,
  }
)

const User = mongoose.model('User', userSchema)
export default User
