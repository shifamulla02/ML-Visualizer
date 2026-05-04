const { v4: uuidv4 } = require('uuid');
const logger = require('./logger');

/**
 * Request tracking middleware
 * Assigns a unique request ID to each request for audit trails and debugging
 */
module.exports = (req, res, next) => {
  const requestId = req.headers['x-request-id'] || uuidv4();
  req.requestId = requestId;
  res.setHeader('X-Request-ID', requestId);

  // Add request ID to logger context
  logger.defaultMeta.requestId = requestId;

  // Log request details
  logger.info(`${req.method} ${req.path}`, {
    requestId,
    method: req.method,
    path: req.path,
    ip: req.ip,
    userAgent: req.get('user-agent'),
  });

  // Log response when finished
  res.on('finish', () => {
    logger.info(`${req.method} ${req.path} - ${res.statusCode}`, {
      requestId,
      method: req.method,
      path: req.path,
      statusCode: res.statusCode,
      responseTime: `${Date.now() - req.startTime}ms`,
    });
  });

  req.startTime = Date.now();
  next();
};
