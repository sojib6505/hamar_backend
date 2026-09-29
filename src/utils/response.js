/**
 * utils/response.js
 *
 * Standardized API response helpers.
 * Every API endpoint uses these helpers so all responses share
 * a consistent JSON shape, making frontend handling predictable.
 *
 * Success shape:  { success: true,  message, data }
 * Error shape:    { success: false, message }
 */

/**
 * Send a successful JSON response.
 * @param {import('express').Response} res
 * @param {*} data - The payload to return (object, array, etc.)
 * @param {string} message - Human-readable success message
 * @param {number} statusCode - HTTP status code (default 200)
 */
export const sendSuccess = (res, data = null, message = 'Success', statusCode = 200) => {
  const body = { success: true, message }
  if (data !== null) body.data = data
  return res.status(statusCode).json(body)
}

/**
 * Send an error JSON response.
 * @param {import('express').Response} res
 * @param {string} message - Human-readable error description
 * @param {number} statusCode - HTTP status code (default 500)
 */
export const sendError = (res, message = 'Something went wrong', statusCode = 500) => {
  return res.status(statusCode).json({ success: false, message })
}
