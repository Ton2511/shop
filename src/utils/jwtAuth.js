// src/utils/jwtAuth.js
const jwt = require('jsonwebtoken');

// Secret key for JWT - in production, use environment variable
const JWT_SECRET = process.env.JWT_SECRET || 'rpcint-secret-key-2024';
const TOKEN_EXPIRY = '24h'; // Token expires in 24 hours

// Generate a JWT token
exports.generateToken = (user) => {
  const payload = {
    id: user.id,
    name: user.name,
    email: user.email
  };
  
  return jwt.sign(payload, JWT_SECRET, { expiresIn: TOKEN_EXPIRY });
};

// Verify a JWT token
exports.verifyToken = (token) => {
  try {
    return jwt.verify(token, JWT_SECRET);
  } catch (error) {
    console.error("JWT verification error:", error.message);
    return null;
  }
};

// Authentication middleware
exports.authMiddleware = (req, res, next) => {
  try {
    // Check for token in cookies
    const token = req.cookies?.authToken;
    
    if (!token) {
      return res.redirect('/login');
    }
    
    const decoded = this.verifyToken(token);
    if (!decoded) {
      // Clear invalid token
      res.clearCookie('authToken');
      return res.redirect('/login');
    }
    
    // Attach user info to request
    req.user = decoded;
    
    // Also set in res.locals for templates
    res.locals.user = decoded;
    
    next();
  } catch (error) {
    console.error("Auth middleware error:", error);
    res.clearCookie('authToken');
    return res.redirect('/login');
  }
};