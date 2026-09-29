/**
 * server.js
 *
 * Entry point for the HAMAR backend server.
 * Loads environment variables, connects to MongoDB, then starts Express.
 */

import 'dotenv/config'
import app from './app.js'
import connectDB from './config/db.js'

const PORT = process.env.PORT || 5000

// Connect to MongoDB first, then start the server.
// This ensures the server is never accepting requests without a database connection.
connectDB().then(() => {
  app.listen(PORT, () => {
    console.log(`🚀 HAMAR API running on http://localhost:${PORT}`)
    console.log(`📋 Environment: ${process.env.NODE_ENV || 'development'}`)
  })
})
