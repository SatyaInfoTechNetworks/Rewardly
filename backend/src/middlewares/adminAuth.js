/**
 * Admin Authentication Middleware
 * Validates the admin secret token from incoming request headers
 */
const adminAuth = (req, res, next) => {
  const secret = req.headers['x-admin-secret'];
  if (secret && secret === process.env.ADMIN_SECRET) {
    next();
  } else {
    res.status(403).json({ error: 'Unauthorized access' });
  }
};

module.exports = { adminAuth };
