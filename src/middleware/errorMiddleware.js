/**
 * middleware/errorMiddleware.js
 *
 * Centralized error handler for Express.
 *
 * Any route that calls next(error) — or any unhandled thrown error
 * in an async route — ends up here. This keeps error formatting
 * consistent across the entire API and prevents internal stack traces
 * from leaking to the client in production.
 */

/**
 * Express error-handling middleware.
 * Must have exactly 4 parameters so Express recognizes it as an error handler.
 */
const errorHandler = (err, req, res, _next) => {
  // Log the full error server-side for debugging.
  // In production you'd route this to a proper logger (e.g. Winston/Pino).
  console.error(`[ERROR] ${req.method} ${req.originalUrl} →`, err.message)
  if (process.env.NODE_ENV !== 'production') {
    console.error(err.stack)
  }

  // Mongoose validation errors (e.g. required field missing, enum mismatch)
  if (err.name === 'ValidationError') {
    const messages = Object.values(err.errors).map((e) => e.message)
    return res.status(400).json({ success: false, message: messages.join(', ') })
  }

  // Mongoose duplicate key error (e.g. slug already exists)
  if (err.code === 11000) {
    const field = Object.keys(err.keyValue)[0]
    return res.status(409).json({
      success: false,
      message: `A record with this ${field} already exists.`,
    })
  }

  // Mongoose cast error — invalid ObjectId format
  if (err.name === 'CastError') {
    return res.status(400).json({ success: false, message: 'Invalid ID format.' })
  }

  // Firebase Admin token errors
  if (err.code?.startsWith?.('auth/')) {
    return res.status(401).json({ success: false, message: 'Authentication failed. Invalid or expired token.' })
  }

  // Default: use the status code set on the error object, or fall back to 500.
  const statusCode = err.statusCode || err.status || 500
  const message =
    process.env.NODE_ENV === 'production' && statusCode === 500
      ? 'An internal server error occurred.'
      : err.message || 'An internal server error occurred.'

  res.status(statusCode).json({ success: false, message })
}

export default errorHandler
