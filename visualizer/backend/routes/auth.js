const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const logger = require('../middleware/logger');
const { validate, validationSchemas } = require('../middleware/validation');

/**
 * POST /auth/signup
 * Register a new user with secure password hashing
 * Password must meet complexity requirements
 */
router.post('/signup', validate(validationSchemas.signup), async (req, res, next) => {
  try {
    const { name, email, password } = req.validated;

    // Check if user already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      logger.warn('Signup failed: email already registered', { email });
      return res.status(409).json({
        status: 'error',
        message: 'Email already registered',
      });
    }

    // Hash password with 12 salt rounds (industry standard)
    const hashedPassword = await bcrypt.hash(password, 12);

    // Create new user
    const user = await User.create({
      name,
      email,
      password: hashedPassword,
    });

    // Generate JWT token with 7-day expiration
    const token = jwt.sign(
      { userId: user._id },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );

    logger.info('User registered successfully', {
      userId: user._id,
      email,
    });

    res.status(201).json({
      status: 'success',
      message: 'User registered successfully',
      data: {
        token,
        user: {
          id: user._id,
          name: user.name,
          email: user.email,
        },
      },
    });
  } catch (error) {
    logger.error('Signup error', { error: error.message });
    next(error);
  }
});

/**
 * POST /auth/login
 * Authenticate user with email and password
 * Does not auto-create users (security fix)
 */
router.post('/login', validate(validationSchemas.login), async (req, res, next) => {
  try {
    const { email, password } = req.validated;

    // Find user by email
    const user = await User.findOne({ email });
    if (!user) {
      logger.warn('Login failed: user not found', { email });
      return res.status(401).json({
        status: 'error',
        message: 'Invalid email or password',
      });
    }

    // Verify password
    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      logger.warn('Login failed: invalid password', {
        userId: user._id,
        email,
      });
      return res.status(401).json({
        status: 'error',
        message: 'Invalid email or password',
      });
    }

    // Generate JWT token
    const token = jwt.sign(
      { userId: user._id },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );

    logger.info('User logged in successfully', {
      userId: user._id,
      email,
    });

    res.json({
      status: 'success',
      message: 'Login successful',
      data: {
        token,
        user: {
          id: user._id,
          name: user.name,
          email: user.email,
        },
      },
    });
  } catch (error) {
    logger.error('Login error', { error: error.message });
    next(error);
  }
});

/**
 * POST /auth/validate-token
 * Verify if a token is still valid
 */
router.post('/validate-token', async (req, res) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];

    if (!token) {
      return res.status(401).json({
        status: 'error',
        message: 'No token provided',
        valid: false,
      });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    res.json({
      status: 'success',
      valid: true,
      userId: decoded.userId,
    });
  } catch (error) {
    res.status(401).json({
      status: 'error',
      message: 'Invalid or expired token',
      valid: false,
    });
  }
});

module.exports = router;