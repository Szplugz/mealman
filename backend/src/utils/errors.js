/**
 * Custom HTTP error class for API error responses
 */
class HttpError extends Error {
  /**
   * Creates a new HTTP error
   * @param {number} statusCode - HTTP status code
   * @param {string} message - Error message
   */
  constructor(statusCode, message) {
    super(message);
    this.name = 'HttpError';
    this.statusCode = statusCode;
  }
}

module.exports = {
  HttpError
};
