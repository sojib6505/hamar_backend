/**
 * middleware/adminMiddleware.js
 *
 * requireAdmin — ensures the authenticated user has the 'admin' role.
 *
 * This middleware ALWAYS runs requireAuth first, so you don't need to
 * add both middlewares to a route — just use requireAdmin.
 *
 * Flow:
 *   requireAdmin
 *       ↓
 *   requireAuth (verifies Firebase token + loads req.user)
 *       ↓
 *   Check req.user.role === 'admin'
 *       ↓
 *   Allow or deny
 *
 * WHY we check the role from the database and not from the token:
 * Firebase custom claims could be used, but they require extra setup
 * and have propagation delays. Reading from MongoDB is simpler and
 * more reliable — and we already load the user in requireAuth.
 * A malicious client cannot fake their role because we read it
 * from our own database, never from the request body or token payload.
 */

import { requireAuth } from './authMiddleware.js'

export const requireAdmin = [
  // First, authenticate the user (verify token, load from DB).
  requireAuth,

  // Then check that the authenticated user is an admin.
  (req, res, next) => {
    if (req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Forbidden: Admin access required.',
      })
    }
    next()
  },
]
