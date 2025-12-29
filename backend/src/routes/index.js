import express from 'express';
import authRoutes from './auth.routes.js';
import municipalityRoutes from './municipality.routes.js';
import blockRoutes from './block.routes.js';
import agentRoutes from './agent.routes.js';
import profileRoutes from './profile.routes.js';

const router = express.Router();

// Health check
router.get('/health', (req, res) => {
  res.json({
    success: true,
    message: 'Waste Management API is running',
    timestamp: new Date().toISOString(),
  });
});

// API routes
router.use('/auth', authRoutes);
router.use('/profile', profileRoutes);
router.use('/municipality', municipalityRoutes);
router.use('/block', blockRoutes);
router.use('/agent', agentRoutes);

export default router;
