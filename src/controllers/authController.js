/**
 * controllers/authController.js
 *
 * Handles user registration sync and profile retrieval.
 *
 * Flow:
 * 1. User signs up on frontend with Firebase Authentication.
 * 2. Frontend calls POST /api/auth/register with Authorization: Bearer <idToken>.
 * 3. Backend verifies the token with Firebase Admin SDK and creates/upserts
 *    a MongoDB user profile linked to firebaseUid.
 */

import User from '../models/User.js'
import admin from '../config/firebaseAdmin.js'
import { sendSuccess, sendError } from '../utils/response.js'

/**
 * POST /api/auth/register
 *
 * Syncs a newly registered Firebase user into MongoDB.
 */
export const registerUser = async (req, res, next) => {
  try {
    const { name, email, phone } = req.body

    const authHeader = req.headers.authorization
    if (!authHeader?.startsWith('Bearer ')) {
      return sendError(res, 'Authorization token required.', 401)
    }

    if (!admin.apps.length) {
      return sendError(res, 'Authentication service unavailable: Firebase Admin SDK not configured.', 503)
    }

    const idToken = authHeader.split('Bearer ')[1]
    const decodedToken = await admin.auth().verifyIdToken(idToken)
    const firebaseUid = decodedToken.uid

    // Validate required fields
    if (!name || !name.trim()) {
      return sendError(res, 'Name is required.', 400)
    }
    if (!email || !email.trim()) {
      return sendError(res, 'Email is required.', 400)
    }

    // Check if user already exists in MongoDB
    let user = await User.findOne({ firebaseUid })

    if (user) {
      return sendSuccess(res, user, 'User already registered.', 200)
    }

    // Create new user in MongoDB
    user = await User.create({
      firebaseUid,
      name: name.trim(),
      email: email.toLowerCase().trim(),
      phone: phone?.trim() || null,
      role: 'customer',
    })

    sendSuccess(res, user, 'User registered successfully.', 201)
  } catch (error) {
    next(error)
  }
}

/**
 * GET /api/auth/me
 *
 * Returns the currently authenticated user's profile.
 */
export const getCurrentUser = async (req, res) => {
  sendSuccess(res, req.user, 'User profile retrieved successfully.')
}

/**
 * PUT /api/auth/me
 *
 * Update the currently authenticated user's profile (name, phone).
 */
export const updateProfile = async (req, res, next) => {
  try {
    const { name, phone } = req.body

    const updates = {}
    if (name && name.trim()) updates.name = name.trim()
    if (phone !== undefined) updates.phone = phone?.trim() || null

    const user = await User.findByIdAndUpdate(
      req.user._id,
      { $set: updates },
      { new: true, runValidators: true }
    )

    sendSuccess(res, user, 'Profile updated successfully.')
  } catch (error) {
    next(error)
  }
}
