/**
 * routes/healthRoutes.js
 *
 * Simple health-check endpoint.
 * Used by monitoring tools and load balancers to confirm the server is alive.
 * Also useful during development to verify the server started correctly.
 */

import { Router } from 'express'

const router = Router()

router.get('/', (_req, res) => {
  res.json({
    success: true,
    message: 'HAMAR API is running',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development',
  })
})

export default router
