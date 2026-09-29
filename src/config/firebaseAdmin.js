/**
 * config/firebaseAdmin.js
 *
 * Initializes the Firebase Admin SDK using service account credentials
 * stored in environment variables.
 *
 * If credentials are not yet configured in .env, a warning is logged
 * so public endpoints (products, categories, brands, guest checkout) continue
 * to work during development.
 */

import admin from 'firebase-admin'

if (!admin.apps.length) {
  const hasCredentials =
    process.env.FIREBASE_PROJECT_ID &&
    process.env.FIREBASE_CLIENT_EMAIL &&
    process.env.FIREBASE_PRIVATE_KEY

  if (hasCredentials) {
    try {
      admin.initializeApp({
        credential: admin.credential.cert({
          projectId: process.env.FIREBASE_PROJECT_ID,
          clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
          // Replace escaped newlines so the PEM key is valid
          privateKey: process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n'),
        }),
      })
      console.log('✅ Firebase Admin SDK initialized successfully.')
    } catch (err) {
      console.error('⚠️ Firebase Admin initialization error:', err.message)
    }
  } else {
    console.warn(
      '⚠️ Firebase Admin credentials missing from environment. Set FIREBASE_PROJECT_ID, FIREBASE_CLIENT_EMAIL, and FIREBASE_PRIVATE_KEY in .env to enable token verification.'
    )
  }
}

export default admin
