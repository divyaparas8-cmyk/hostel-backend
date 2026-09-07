/**
 * Middleware to authorize specific roles
 * @param  {...string} roles - Array of allowed roles
 */
const authorizeRoles = (...roles) => {
  return (req, res, next) => {
    // req.user is set by verifyToken middleware
    if (!req.user || !roles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: 'Access denied. You don\'t have permission'
      });
    }
    next();
  };
};

module.exports = {
  authorizeRoles
};
