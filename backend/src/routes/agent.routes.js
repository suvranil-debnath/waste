import express from 'express';
import {
  scanHouse,
  acceptWaste,
  scanDump,
  getPendingHouses,
  getTodaySummary,
} from '../controllers/agentController.js';
import { authenticate } from '../middlewares/auth.js';
import { requireRole } from '../middlewares/rbac.js';
import { validateQRScan, validateWasteCollection } from '../middlewares/validation.js';
import { validateGPSCoordinates } from '../middlewares/gps.js';

const router = express.Router();

// All routes require authentication and AGENT role
router.use(authenticate);
router.use(requireRole(['AGENT']));

// QR Scanning
router.post('/scan-house', validateQRScan, validateGPSCoordinates, scanHouse);
router.post('/scan-dump', validateQRScan, validateGPSCoordinates, scanDump);

// Waste Collection
router.post('/accept-waste', validateWasteCollection, validateGPSCoordinates, acceptWaste);

// Route & Summary
router.get('/pending-houses', getPendingHouses);
router.get('/today-summary', getTodaySummary);

export default router;
