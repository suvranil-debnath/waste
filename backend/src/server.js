import express from 'express';
import cors from 'cors';
import { connectDatabase } from './config/database.js';
import { config } from './config/environment.js';
import routes from './routes/index.js';
import { errorHandler, notFoundHandler } from './middlewares/errorHandler.js';

const app = express();

// =======================
// MIDDLEWARE
// =======================

// CORS configuration
app.use(cors({
  origin: [
    'http://localhost:3000',
    'http://localhost:3001',
    'https://waste-dcdi.onrender.com',
    'https://your-frontend-domain.com',
    'https://your-frontend-domain.vercel.app'
  ],
  credentials: true,
}));

// Body parsing
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Request logging (development only)
if (config.server.env === 'development') {
  app.use((req, res, next) => {
    console.log(`${new Date().toISOString()} - ${req.method} ${req.path}`);
    next();
  });
}

// =======================
// ROUTES
// =======================

// Root endpoint
app.get('/', (req, res) => {
  res.json({
    success: true,
    message: 'Welcome to Waste Management API',
    version: '1.0.0',
    documentation: '/api/health',
  });
});

// API routes
app.use('/api', routes);

// =======================
// ERROR HANDLING
// =======================

// 404 handler
app.use(notFoundHandler);

// Global error handler
app.use(errorHandler);

// =======================
// DATABASE & SERVER START
// =======================

const startServer = async () => {
  try {
    // Connect to MongoDB
    await connectDatabase();

    // Start server
    const PORT = config.server.port;
    app.listen(PORT, () => {
      console.log('');
      console.log('========================================');
      console.log('🚀 WASTE MANAGEMENT API SERVER');
      console.log('========================================');
      console.log(`📡 Environment: ${config.server.env}`);
      console.log(`🌐 Server running on: http://localhost:${PORT}`);
      console.log(`🔗 API Base URL: http://localhost:${PORT}/api`);
      console.log(`❤️  Health Check: http://localhost:${PORT}/api/health`);
      console.log('========================================');
      console.log('');
      console.log('📚 Available Routes:');
      console.log('  - POST   /api/auth/login');
      console.log('  - GET    /api/auth/session');
      console.log('  - GET    /api/municipality/zones');
      console.log('  - GET    /api/municipality/houses');
      console.log('  - POST   /api/municipality/houses');
      console.log('  - GET    /api/municipality/staff');
      console.log('  - GET    /api/municipality/vans');
      console.log('  - GET    /api/municipality/waste-data');
      console.log('  - GET    /api/municipality/attendance');
      console.log('  - GET    /api/block/municipalities');
      console.log('  - GET    /api/block/overview');
      console.log('  - GET    /api/district/overview');
      console.log('  - GET    /api/district/blocks');
      console.log('  - GET    /api/district/waste-stats');
      console.log('  - POST   /api/agent/scan-house');
      console.log('  - POST   /api/agent/accept-waste');
      console.log('  - POST   /api/agent/scan-dump');
      console.log('  - GET    /api/agent/pending-houses');
      console.log('========================================');
      console.log('');
    });

  } catch (error) {
    console.error('❌ Failed to start server:', error.message);
    process.exit(1);
  }
};

// Handle unhandled promise rejections
process.on('unhandledRejection', (err) => {
  console.error('❌ UNHANDLED REJECTION! Shutting down...');
  console.error(err);
  process.exit(1);
});

// Handle uncaught exceptions
process.on('uncaughtException', (err) => {
  console.error('❌ UNCAUGHT EXCEPTION! Shutting down...');
  console.error(err);
  process.exit(1);
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('👋 SIGTERM received. Shutting down gracefully...');
  process.exit(0);
});

// Start the server
startServer();
