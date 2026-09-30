/**
 * app.js
 *
 * Express application setup.
 * This file configures all middleware and mounts all route groups.
 * It does NOT start the server — that's done in server.js.
 * Keeping app and server separate makes the app easier to test.
 */

import express from 'express'
import cors from 'cors'
import helmet from 'helmet'
import morgan from 'morgan'
import { rateLimit } from 'express-rate-limit'

import healthRoutes from './routes/healthRoutes.js'
import authRoutes from './routes/authRoutes.js'
import productRoutes from './routes/productRoutes.js'
import categoryRoutes from './routes/categoryRoutes.js'
import brandRoutes from './routes/brandRoutes.js'
import orderRoutes from './routes/orderRoutes.js'
import adminRoutes from './routes/adminRoutes.js'
import notFound from './middleware/notFoundMiddleware.js'
import errorHandler from './middleware/errorMiddleware.js'

const app = express()

const allowedOrigins = new Set([
  'http://localhost:5173',
  'http://localhost:5174',
  'https://hamar-ui.vercel.app',
  ...(process.env.CLIENT_URL || '').split(',').map((origin) => origin.trim()).filter(Boolean),
  ...(process.env.CORS_ORIGINS || '').split(',').map((origin) => origin.trim()).filter(Boolean),
])

// ─── Security Middleware ─────────────────────────────────────────────────────

// Helmet sets sensible security-related HTTP response headers.
app.use(helmet())

// CORS: Echo only origins present in the approved allowlist.
app.use(
  cors({
    origin: (origin, callback) => {
      callback(null, origin && allowedOrigins.has(origin) ? origin : false)
    },
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    credentials: true,
    optionsSuccessStatus: 204,
  })
)

// ─── General Rate Limiting ───────────────────────────────────────────────────
// Applied globally to prevent abuse. Tighter limits can be applied
// to specific sensitive routes (e.g., auth) via separate limiters.
const globalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 200,                  // 200 requests per window per IP
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, message: 'Too many requests. Please try again later.' },
})
app.use(globalLimiter)

// ─── Request Parsing ─────────────────────────────────────────────────────────
app.use(express.json())
app.use(express.urlencoded({ extended: true }))

// ─── Logging ─────────────────────────────────────────────────────────────────
// 'dev' format in development, 'combined' (Apache-style) in production.
app.use(morgan(process.env.NODE_ENV === 'production' ? 'combined' : 'dev'))

// ─── Routes ──────────────────────────────────────────────────────────────────
app.use('/api/health',     healthRoutes)
app.use('/api/auth',       authRoutes)
app.use('/api/products',   productRoutes)
app.use('/api/categories', categoryRoutes)
app.use('/api/brands',     brandRoutes)
app.use('/api/orders',     orderRoutes)
app.use('/api/admin',      adminRoutes)

// ─── Error Handling ──────────────────────────────────────────────────────────
// 404 must come after all routes so it only triggers for unmatched URLs.
app.use(notFound)
// Central error handler must come last and have exactly 4 parameters.
app.use(errorHandler)

export default app
