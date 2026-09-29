/**
 * routes/authRoutes.js
 *
 * Authentication-related API routes.
 *
 * Note: Firebase handles login, logout, password-reset on the client.
 * These routes handle the server-side user record sync and profile access.
 */

import { Router } from 'express'
import { requireAuth } from '../middleware/authMiddleware.js'
import {
  registerUser,
  getCurrentUser,
  updateProfile,
} from '../controllers/authController.js'

const router = Router()

// POST /api/auth/register
// Called by the frontend after Firebase registration to sync the user into MongoDB.
// Requires a valid Firebase ID token in the Authorization header.
router.post('/register', registerUser)

// GET /api/auth/me
// Returns the authenticated user's profile.
router.get('/me', requireAuth, getCurrentUser)

// PUT /api/auth/me
// Update name and phone number (email is managed by Firebase).
router.put('/me', requireAuth, updateProfile)

export default router
