/**
 * middleware/authMiddleware.js
 *
 * requireAuth — verifies a Firebase ID token and attaches the authenticated
 * user to `req.user` so downstream controllers can access it.
 *
 * optionalAuth — checks if a Firebase ID token is provided. If valid, attaches
 * `req.user`. If absent or invalid, simply allows the request through as a guest (`req.user = null`).
 */

import admin from '../config/firebaseAdmin.js'
import User from '../models/User.js'

export const requireAuth = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization

    // Token must be in "Bearer <token>" format.
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        success: false,
        message: 'Unauthorized: No token provided.',
      })
    }

    if (!admin.apps.length) {
      return res.status(503).json({
        success: false,
        message: 'Authentication service unavailable: Firebase Admin credentials not configured on server.',
      })
    }

    const idToken = authHeader.split('Bearer ')[1]

    // Verify the token with Firebase Admin.
    const decodedToken = await admin.auth().verifyIdToken(idToken)

    // Look up user in MongoDB by firebaseUid
    const user = await User.findOne({ firebaseUid: decodedToken.uid })

    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Unauthorized: User account not found. Please register first.',
      })
    }

    if (!user.isActive) {
      return res.status(403).json({
        success: false,
        message: 'Forbidden: This account has been deactivated.',
      })
    }

    req.user = user
    next()
  } catch (error) {
    return res.status(401).json({
      success: false,
      message: 'Unauthorized: Invalid or expired token.',
    })
  }
}

/**
 * optionalAuth — Does not block guest requests.
 * If a valid Authorization header is present and Firebase is configured, attaches req.user.
 * Otherwise, sets req.user to null and continues.
 */
export const optionalAuth = async (req, _res, next) => {
  try {
    const authHeader = req.headers.authorization
    if (!authHeader || !authHeader.startsWith('Bearer ') || !admin.apps.length) {
      req.user = null
      return next()
    }

    const idToken = authHeader.split('Bearer ')[1]
    const decodedToken = await admin.auth().verifyIdToken(idToken)
    const user = await User.findOne({ firebaseUid: decodedToken.uid })

    if (user && user.isActive) {
      req.user = user
    } else {
      req.user = null
    }
    next()
  } catch (err) {
    req.user = null
    next()
  }
}
