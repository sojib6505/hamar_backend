/**
 * utils/helpers.js
 *
 * General-purpose utility functions shared across the backend.
 */

/**
 * Generate a human-readable order number like ORD-83742.
 * Uses a random 5-digit suffix so order IDs are easy to communicate
 * to customers and support staff without exposing MongoDB ObjectIds.
 */
export const generateOrderNumber = () => {
  const suffix = Math.floor(10000 + Math.random() * 90000)
  return `ORD-${suffix}`
}

/**
 * Build a slug from a string (lowercase, hyphens instead of spaces).
 * Used when creating categories or brands that don't supply a slug.
 * @param {string} str
 * @returns {string}
 */
export const slugify = (str) =>
  str
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '')
    .replace(/[\s_-]+/g, '-')
    .replace(/^-+|-+$/g, '')

/**
 * Check whether a value looks like a valid MongoDB ObjectId.
 * Useful for deciding whether to query by id vs slug.
 * @param {string} value
 * @returns {boolean}
 */
export const isObjectId = (value) => /^[a-f\d]{24}$/i.test(value)
