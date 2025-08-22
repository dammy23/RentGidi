// Load environment variables
require("dotenv").config();
const mongoose = require("mongoose");
const express = require("express");
const session = require("express-session");
const MongoStore = require('connect-mongo');
const http = require('http');
const basicRoutes = require("./routes/index");
const authRoutes = require("./routes/authRoutes");
const profileRoutes = require("./routes/profileRoutes");
const propertyRoutes = require("./routes/propertyRoutes");
const applicationRoutes = require("./routes/applicationRoutes");
const messageRoutes = require("./routes/messageRoutes");
const holdingDepositRoutes = require("./routes/holdingDepositRoutes");
const paymentRoutes = require("./routes/paymentRoutes");
const rentalAgreementRoutes = require("./routes/rentalAgreementRoutes");
const dashboardRoutes = require("./routes/dashboardRoutes");
const notificationRoutes = require("./routes/notificationRoutes");
const verificationRoutes = require("./routes/verificationRoutes");
const seedRoutes = require("./routes/seedRoutes");
const { connectDB } = require("./config/database");
const { initialize: initializeSocket } = require("./utils/socketService");
const cors = require("cors");
const path = require("path");
const fs = require("fs");

if (!process.env.DATABASE_URL) {
  console.error("Error: DATABASE_URL variables in .env missing.");
  process.exit(-1);
}

const app = express();
const server = http.createServer(app);
const port = process.env.PORT || 3000;

// Initialize Socket.IO server
initializeSocket(server);

// Pretty-print JSON responses
app.enable('json spaces');
// We want to be consistent with URL paths, so we enable strict routing
app.enable('strict routing');

app.use(cors({
  origin: "http://localhost:5173",
  credentials: true
}));
// Increase the limit for JSON and URL-encoded payloads to handle base64 images
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Add request logging middleware
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.url}`);
  if (req.url.startsWith('/uploads')) {
    console.log('STATIC FILE REQUEST:', req.url);
    console.log('Request headers:', req.headers);
  }
  next();
});

// CRITICAL FIX: Ensure uploads directory exists and serve static files
const uploadsDir = path.join(__dirname, 'uploads');
console.log('SERVER: Uploads directory path:', uploadsDir);
console.log('SERVER: Uploads directory exists:', fs.existsSync(uploadsDir));

if (!fs.existsSync(uploadsDir)) {
  console.log('SERVER: Creating uploads directory...');
  fs.mkdirSync(uploadsDir, { recursive: true });
}

// Create subdirectories
const avatarsDir = path.join(uploadsDir, 'avatars');
const documentsDir = path.join(uploadsDir, 'documents');
const propertiesDir = path.join(uploadsDir, 'properties');

[avatarsDir, documentsDir, propertiesDir].forEach(dir => {
  if (!fs.existsSync(dir)) {
    console.log('SERVER: Creating directory:', dir);
    fs.mkdirSync(dir, { recursive: true });
  }
});

// Serve uploaded files statically with detailed logging
app.use('/uploads', (req, res, next) => {
  console.log('STATIC MIDDLEWARE: Request for:', req.url);
  console.log('STATIC MIDDLEWARE: Full path would be:', path.join(uploadsDir, req.url));
  console.log('STATIC MIDDLEWARE: File exists:', fs.existsSync(path.join(uploadsDir, req.url)));
  next();
}, express.static(uploadsDir, {
  // Add options for better debugging
  dotfiles: 'ignore',
  etag: false,
  extensions: ['png', 'jpg', 'jpeg', 'gif', 'pdf'],
  index: false,
  maxAge: '1d',
  redirect: false,
  setHeaders: function (res, path, stat) {
    console.log('STATIC MIDDLEWARE: Serving file:', path);
    res.set('x-timestamp', Date.now());
  }
}));

// Database connection
connectDB();

app.on("error", (error) => {
  console.error(`Server error: ${error.message}`);
  console.error(error.stack);
});

// Basic Routes
app.use(basicRoutes);
// Authentication Routes
app.use('/api/auth', authRoutes);
// Profile Routes
app.use('/api/profile', profileRoutes);
// Property Routes
app.use('/api/properties', propertyRoutes);
// Application Routes
app.use('/api/applications', applicationRoutes);
// Message Routes
app.use('/api/messages', messageRoutes);
// Holding Deposit Routes
app.use('/api/holding-deposits', holdingDepositRoutes);
// Payment Routes
app.use('/api/payments', paymentRoutes);
// Rental Agreement Routes
app.use('/api/rental-agreements', rentalAgreementRoutes);
// Dashboard Routes
app.use('/api/dashboard', dashboardRoutes);
// Notification Routes
app.use('/api/notifications', notificationRoutes);
// Verification Routes
app.use('/api/verification', verificationRoutes);
// Seed Routes
console.log('Registering seed routes at /api/seed');
app.use('/api/seed', seedRoutes);

// Add a test route to verify server is working
app.get('/test', (req, res) => {
  console.log('TEST ROUTE HIT - Server is working correctly');
  res.json({ message: 'Server is working correctly', timestamp: new Date().toISOString() });
});

// Add specific logging for seed routes
app.use('/api/seed/*', (req, res, next) => {
  console.log('SEED ROUTE MIDDLEWARE HIT:', req.method, req.originalUrl);
  next();
});

// If no routes handled the request, it's a 404
app.use((req, res, next) => {
  console.log(`404 - Route not found: ${req.method} ${req.url}`);
  console.log(`Available routes should include /api/seed/admin`);
  res.status(404).json({
    error: "Route not found",
    method: req.method,
    url: req.url,
    timestamp: new Date().toISOString()
  });
});

// Error handling
app.use((err, req, res, next) => {
  console.error(`Unhandled application error: ${err.message}`);
  console.error(err.stack);
  res.status(500).json({
    error: "Internal server error",
    message: err.message,
    timestamp: new Date().toISOString()
  });
});

server.listen(port, '0.0.0.0', () => {
  console.log(`Server running at http://localhost:${port}`);
  console.log(`Server also accessible at http://0.0.0.0:${port}`);
  console.log(`Socket.IO server available at http://localhost:${port}/socket.io/`);
  console.log(`Chat namespace available at http://localhost:${port}/chat`);
  console.log('Available seed endpoints:');
  console.log(`  POST http://localhost:${port}/api/seed/admin`);
  console.log(`  POST http://localhost:${port}/api/seed/sample-data`);
  console.log(`  DELETE http://localhost:${port}/api/seed/clear-all`);
  console.log('Test endpoint:');
  console.log(`  GET http://localhost:${port}/test`);
  console.log('Static files served from:', uploadsDir);
  console.log('Example avatar URL: http://localhost:' + port + '/uploads/avatars/test.png');
});