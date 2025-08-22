const jwt = require('jsonwebtoken');

const generateAccessToken = (userId) => {
  return jwt.sign(
    { userId: userId }, // Use userId instead of sub
    process.env.JWT_SECRET,
    { expiresIn: '24h' }
  );
};

const generateRefreshToken = (userId) => {
  return jwt.sign(
    { userId: userId }, // Use userId instead of sub
    process.env.REFRESH_TOKEN_SECRET,
    { expiresIn: '30d' }
  );
};

module.exports = {
  generateAccessToken,
  generateRefreshToken
};