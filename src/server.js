/**
 * server.js
 *
 * Entry point for the HAMAR backend server.
 * Loads environment variables, connects to MongoDB, then starts Express.
 */

import 'dotenv/config'
import mongoose from 'mongoose'
import app from './app.js'
import connectDB from './config/db.js'

const PORT = process.env.PORT || 5000

const startServer = async () => {
  try {
    await connectDB()

    const server = app.listen(PORT)
    await new Promise((resolve, reject) => {
      server.once('listening', resolve)
      server.once('error', reject)
    })

    console.log(`🚀 HAMAR API running on http://localhost:${PORT}`)
    console.log(`📋 Environment: ${process.env.NODE_ENV || 'development'}`)
  } catch (error) {
    if (error.code === 'EADDRINUSE') {
      console.error(`❌ Port ${PORT} is already in use. Stop the existing process using that port.`)
    } else {
      console.error(`❌ HAMAR API startup failed: ${error.message}`)
    }

    await mongoose.disconnect()
    process.exitCode = 1
  }
}

startServer()
