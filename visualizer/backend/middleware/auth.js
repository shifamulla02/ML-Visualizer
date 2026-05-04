const jwt = require('jsonwebtoken');
const logger = require('./logger');

/**
 * Authentication middleware
 * Verifies JWT token from Authorization header
 * Extracts userId for use in protected routes
 */
module.exports = (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      logger.warn('Missing or invalid Authorization header', {
        requestId: req.requestId,
        ip: req.ip,
      });
      return res.status(401).json({
        status: 'error',
        message: 'No authorization token provided',
      });
    }

    const token = authHeader.split(' ')[1];
    
    if (!token) {
      logger.warn('Empty token', {
        requestId: req.requestId,
        ip: req.ip,
      });
      return res.status(401).json({
        status: 'error',
        message: 'Invalid authorization format',
      });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.userId = decoded.userId;
    req.user = decoded;
    
    logger.debug('Authentication successful', {
      requestId: req.requestId,
      userId: req.userId,
    });
    
    next();
  } catch (error) {
    logger.warn('Authentication failed', {
      requestId: req.requestId,
      error: error.message,
      ip: req.ip,
    });

    const statusCode = error.name === 'TokenExpiredError' ? 401 : 401;
    const message = error.name === 'TokenExpiredError' 
      ? 'Token has expired' 
      : 'Invalid token';

    res.status(statusCode).json({
      status: 'error',
      message,
    });
  }
};
