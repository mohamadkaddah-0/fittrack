const jwt = require('jsonwebtoken');

function resolveUser(req, res, next) {
  const authHeader = req.headers.authorization;
  const fallbackUserId = req.headers['x-fittrack-user-id'];
  const jwtSecret = process.env.JWT_SECRET || 'your-secret-key';

  if (authHeader && authHeader.startsWith('Bearer ')) {
    const token = authHeader.split(' ')[1];
    try {
      const decoded = jwt.verify(token, jwtSecret);
      req.user = decoded;
      req.fittrackUserKey = String(decoded.id);
      req.fittrackUserId  = decoded.id;
      return next();
    } catch {
      // Fall back to the header-based identity so the mixed mock/auth flows
      // in the frontend can still use the activity endpoints during development.
    }
  }

  req.fittrackUserKey = fallbackUserId ? String(fallbackUserId) : 'guest';
  next();
}

module.exports = resolveUser;
