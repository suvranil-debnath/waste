import { loginUser, getUserSession } from '../services/authService.js';

/**
 * POST /api/auth/login
 * Login user
 */
export const login = async (req, res, next) => {
  try {
    const { email, password, role } = req.body;

    const result = await loginUser(email, password, role);

    res.json({
      success: true,
      message: 'Login successful',
      data: result,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * POST /api/auth/logout
 * Logout user
 */
export const logout = async (req, res) => {
  // With JWT, logout is handled client-side by removing the token
  res.json({
    success: true,
    message: 'Logout successful',
  });
};

/**
 * GET /api/auth/session
 * Get current user session
 */
export const getSession = async (req, res, next) => {
  try {
    const userId = req.user._id;

    const session = await getUserSession(userId);

    res.json({
      success: true,
      data: session,
    });
  } catch (error) {
    next(error);
  }
};
