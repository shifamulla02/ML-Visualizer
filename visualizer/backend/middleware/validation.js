const Joi = require('joi');

// Password regex: min 8 chars, at least one uppercase, one lowercase, one number, one special char
const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;

const validationSchemas = {
  // Authentication
  signup: Joi.object({
    name: Joi.string().min(2).max(100).required().trim(),
    email: Joi.string().email().required().lowercase(),
    password: Joi.string()
      .pattern(passwordRegex)
      .required()
      .messages({
        'string.pattern.base': 'Password must be at least 8 characters with uppercase, lowercase, number, and special character',
      }),
    confirmPassword: Joi.string().valid(Joi.ref('password')).required(),
  }),

  login: Joi.object({
    email: Joi.string().email().required().lowercase(),
    password: Joi.string().required(),
  }),

  // Dataset
  uploadDataset: Joi.object({
    file: Joi.object({
      originalname: Joi.string().required(),
      mimetype: Joi.string().valid('text/csv').required(),
      size: Joi.number().max(50 * 1024 * 1024).required(),
    }).required(),
  }),

  // Preprocessing
  preprocessing: Joi.object({
    datasetId: Joi.string().required(),
    steps: Joi.array().items(
      Joi.object({
        type: Joi.string()
          .valid('missing', 'encoding', 'scaling', 'outlier', 'duplicate')
          .required(),
        column: Joi.string().required(),
        method: Joi.string(),
        parameters: Joi.object(),
      })
    ),
  }),

  // Model training
  trainModel: Joi.object({
    datasetId: Joi.string().required(),
    targetColumn: Joi.string().required(),
    modelType: Joi.string()
      .valid('logistic_regression', 'decision_tree', 'random_forest', 'svm', 'linear_regression', 'gradient_boosting')
      .required(),
    splitRatio: Joi.string().pattern(/^\d+-\d+$/).default('80-20'),
    hyperparameters: Joi.object(),
  }),

  // Train-test split
  trainTestSplit: Joi.object({
    datasetId: Joi.string().required(),
    splitRatio: Joi.string().pattern(/^\d+-\d+$/).required(),
    randomState: Joi.number().optional(),
  }),
};

/**
 * Validation middleware factory
 * Returns middleware that validates request data against a schema
 */
const validate = (schema) => {
  return (req, res, next) => {
    const { error, value } = schema.validate(
      { ...req.body, ...req.query, file: req.file },
      { abortEarly: false, stripUnknown: true }
    );

    if (error) {
      return res.status(400).json({
        status: 'error',
        message: 'Validation failed',
        details: error.details.map(d => ({
          field: d.path.join('.'),
          message: d.message,
        })),
      });
    }

    req.validated = value;
    next();
  };
};

module.exports = { validationSchemas, validate };
