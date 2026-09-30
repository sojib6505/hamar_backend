/**
 * config/db.js
 *
 * Establishes a connection to MongoDB using Mongoose.
 * The connection URI comes from the MONGODB_URI environment variable.
 */

import mongoose from 'mongoose'

const connectDB = async () => {
  const uri = process.env.MONGODB_URI
  if (!uri) {
    throw new Error('MONGODB_URI environment variable is required.')
  }

  try {
    const conn = await mongoose.connect(uri)
    console.log(`✅ MongoDB connected: ${conn.connection.host}`)
    return conn
  } catch (error) {
    const message = error.message.replace(uri, '[redacted MongoDB URI]')
    console.error(`❌ MongoDB connection error: ${message}`)
    throw new Error(
      'MongoDB connection failed. Verify MONGODB_URI, Atlas network access, and database credentials.'
    )
  }
}

export default connectDB
