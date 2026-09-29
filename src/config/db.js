/**
 * config/db.js
 *
 * Establishes a connection to MongoDB using Mongoose.
 * The connection URI comes from the MONGODB_URI environment variable.
 */

import mongoose from 'mongoose'

const connectDB = async () => {
  const uri = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/hamar'
  try {
    const conn = await mongoose.connect(uri)
    console.log(`✅ MongoDB connected: ${conn.connection.host}`)
    return conn
  } catch (error) {
    console.error(`❌ MongoDB connection error: ${error.message}`)
    console.error(
      `👉 Please set MONGODB_URI in your .env file with your MongoDB Atlas or local MongoDB connection string.`
    )
    if (process.env.NODE_ENV === 'production') {
      process.exit(1)
    }
  }
}

export default connectDB
