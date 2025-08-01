// Custom error classes for Lifestream API
// Use these for predictable error handling and responses

/**
 * API Error for general request failures
 */
export class ApiError extends Error {
  constructor(message, status = 500) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
  }
}

/**
 * Validation Error for input validation failures
 */
export class ValidationError extends Error {
  constructor(message, status = 400) {
    super(message);
    this.name = 'ValidationError';
    this.status = status;
  }
}
