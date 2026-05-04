const logger = require('./logger');

/**
 * Validates that all required environment variables are set
 * Throws an error if any required variables are missing
 */
const validateEnvironment = () => {
  const requiredEnvVars = [
    'JWT_SECRET',
    'NODE_ENV',
  ];

  const optionalEnvVars = [
    'PORT',
    'MONGODB_URI',
    'CLIENT_URL',
    'ML_SERVICE_URL',
    'LOG_LEVEL',
  ];

  // Check required variables
  const missingVars = requiredEnvVars.filter(varName => !process.env[varName]);
  if (missingVars.length > 0) {
    throw new Error(
      `Missing required environment variables: ${missingVars.join(', ')}. ` +
      `Please set them in your .env file.`
    );
  }

  // Warn about optional variables not set
  const unsetOptionalVars = optionalEnvVars.filter(varName => !process.env[varName]);
  if (unsetOptionalVars.length > 0) {
    logger.warn(
      `Optional environment variables not set: ${unsetOptionalVars.join(', ')}. ` +
      `Default values will be used.`
    );
  }

  // Validate specific values
  if (!['development', 'production', 'test'].includes(process.env.NODE_ENV)) {
    throw new Error(
      `Invalid NODE_ENV: ${process.env.NODE_ENV}. ` +
      `Must be one of: development, production, test`
    );
  }

  if (process.env.JWT_SECRET && process.env.JWT_SECRET.length < 32) {
    logger.warn('JWT_SECRET is less than 32 characters. Consider using a stronger secret.');
  }

  if (process.env.NODE_ENV === 'production' && !process.env.MONGODB_URI) {
    throw new Error(
      'MONGODB_URI must be set in production environment for database persistence'
    );
  }

  logger.info('Environment variables validated successfully');
};

module.exports = { validateEnvironment };
