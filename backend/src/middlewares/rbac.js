/**
 * Role-Based Access Control Middleware
 */

/**
 * Check if user has required role(s)
 */
export const requireRole = (allowedRoles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required',
      });
    }

    const roles = Array.isArray(allowedRoles) ? allowedRoles : [allowedRoles];

    if (!roles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: 'Access denied. Insufficient permissions.',
      });
    }

    next();
  };
};

/**
 * Check jurisdiction-based access
 * Lower level cannot access higher level data
 * Higher level can access all lower level data
 */
export const checkJurisdiction = (resourceLevel, resourceIdParam) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required',
      });
    }

    const { role } = req.user;
    const resourceId = req.params[resourceIdParam] || req.body[resourceIdParam] || req.query[resourceIdParam];

    // State Admin can access everything
    if (role === 'STATE_ADMIN') {
      return next();
    }

    // District Admin can access blocks, GPs within their district
    if (role === 'DISTRICT_ADMIN') {
      if (resourceLevel === 'STATE') {
        return res.status(403).json({
          success: false,
          message: 'Cannot access state-level data',
        });
      }
      // Additional checks can be added here for district validation
      return next();
    }

    // Block Admin can access GPs within their block
    if (role === 'BLOCK_ADMIN') {
      if (resourceLevel === 'STATE' || resourceLevel === 'DISTRICT') {
        return res.status(403).json({
          success: false,
          message: 'Cannot access higher-level administrative data',
        });
      }
      return next();
    }

    // GP Admin can only access their own GP data
    if (role === 'GP_ADMIN') {
      if (resourceLevel !== 'GP' && resourceLevel !== 'HOUSE' && resourceLevel !== 'AGENT') {
        return res.status(403).json({
          success: false,
          message: 'Can only access GP-level data',
        });
      }
      
      // Verify the resource belongs to their GP
      if (resourceId && req.user.gpId && resourceId !== req.user.gpId.toString()) {
        return res.status(403).json({
          success: false,
          message: 'Cannot access data from other GPs',
        });
      }
      
      return next();
    }

    // Collection Agent can only access their own data
    if (role === 'COLLECTION_AGENT') {
      if (resourceLevel !== 'AGENT') {
        return res.status(403).json({
          success: false,
          message: 'Access denied',
        });
      }
      return next();
    }

    return res.status(403).json({
      success: false,
      message: 'Access denied',
    });
  };
};

/**
 * Ensure user can only access their own jurisdiction data
 */
export const enforceOwnJurisdiction = (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({
      success: false,
      message: 'Authentication required',
    });
  }

  const { role } = req.user;

  // Attach jurisdiction filters to query based on role
  switch (role) {
    case 'STATE_ADMIN':
      // No filter needed - can access all
      req.jurisdictionFilter = {};
      break;

    case 'DISTRICT_ADMIN':
      req.jurisdictionFilter = { districtId: req.user.districtId };
      break;

    case 'BLOCK_ADMIN':
      req.jurisdictionFilter = { blockId: req.user.blockId };
      break;

    case 'GP_ADMIN':
      req.jurisdictionFilter = { gpId: req.user.gpId };
      break;

    case 'COLLECTION_AGENT':
      req.jurisdictionFilter = { agentId: req.user._id };
      break;

    default:
      return res.status(403).json({
        success: false,
        message: 'Invalid role',
      });
  }

  next();
};
