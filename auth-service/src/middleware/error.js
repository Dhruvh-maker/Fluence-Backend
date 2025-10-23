import { StatusCodes, getReasonPhrase } from 'http-status-codes';

export class ApiError extends Error {
  constructor(statusCode, message, details) {
    super(message || getReasonPhrase(statusCode));
    this.statusCode = statusCode;
    this.details = details;
  }
}

export function notFoundHandler(_req, res) {
  res.status(StatusCodes.NOT_FOUND).json({ error: 'Not Found' });
}

export function errorHandler(err, _req, res, _next) {
  if (err instanceof ApiError) {
    res.status(err.statusCode).json({ error: err.message, details: err.details });
    return;
  }
  
  // Log full error in development, sanitized in production
  if (process.env.NODE_ENV === 'production') {
    console.error('Unhandled error:', err.message);
    // In production, you'd send to logging service (e.g., Sentry, CloudWatch)
  } else {
    console.error('Unhandled error:', err);
  }
  
  res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({ 
    error: process.env.NODE_ENV === 'production' ? 'Internal Server Error' : err.message 
  });
}

