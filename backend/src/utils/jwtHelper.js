import jwt from 'jsonwebtoken';
import { config } from '../config/environment.js';

/**
 * Generate JWT access token
 */
export const generateToken = (payload) => {
  return jwt.sign(payload, config.jwt.secret, {
    expiresIn: config.jwt.expiresIn,
  });
};

/**
 * Verify JWT token
 */
export const verifyToken = (token) => {
  try {
    return jwt.verify(token, config.jwt.secret);
  } catch (error) {
    throw new Error('Invalid or expired token');
  }
};

/**
 * Decode JWT token without verification (use cautiously)
 */
export const decodeToken = (token) => {
  return jwt.decode(token);
};
