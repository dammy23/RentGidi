const jwt = require('jsonwebtoken');
const User = require('../../models/User');

const authenticateToken = async (req, res, next) => {
  console.log('Auth middleware: authenticateToken called');
  
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    console.log('Auth middleware: No token provided');
    return res.status(401).json({ error: 'Access token required' });
  }

  try {
    console.log('Auth middleware: Verifying access token');
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    console.log('Auth middleware: Token decoded successfully, userId:', decoded.userId);
    
    // Find user by the userId from token
    const user = await User.findById(decoded.userId);
    if (!user) {
      console.log('Auth middleware: User not found for userId:', decoded.userId);
      return res.status(401).json({ error: 'User not found' });
    }

    console.log('Auth middleware: User found:', user.email);
    req.user = user;
    next();
  } catch (error) {
    console.log('Auth middleware: Token verification failed:', error.message);
    return res.status(401).json({ error: 'Invalid access token' });
  }
};

module.exports = {
  authenticateToken
};