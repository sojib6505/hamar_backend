/**
 * middleware/notFoundMiddleware.js
 *
 * Catches any request that doesn't match a defined route and returns
 * a consistent 404 JSON response (instead of Express's default HTML page).
 */

const notFound = (req, res) => {
  res.status(404).json({
    success: false,
    message: `Route not found: ${req.method} ${req.originalUrl}`,
  })
}

export default notFound
