import express from 'express';
import {
  getZones,
  getHouses,
  createNewHouse,
  updateHouseDetails,
  getStaff,
  getVans,
  getWasteData,
  getAttendance,
  getDashboard,
} from '../controllers/municipalityController.js';
import { authenticate } from '../middlewares/auth.js';
import { requireRole } from '../middlewares/rbac.js';
import { validateCreateHouse, validateObjectId, validateDateRange } from '../middlewares/validation.js';

const router = express.Router();

// All routes require authentication and GP_ADMIN role
router.use(authenticate);
router.use(requireRole(['GP_ADMIN']));

// Dashboard
router.get('/dashboard', getDashboard);

// Zones
router.get('/zones', getZones);

// Houses
router.get('/houses', getHouses);
router.post('/houses', validateCreateHouse, createNewHouse);
router.put('/houses/:id', validateObjectId('id'), updateHouseDetails);

// Staff (Collection Agents)
router.get('/staff', getStaff);

// Vans
router.get('/vans', getVans);

// Waste Data
router.get('/waste-data', validateDateRange, getWasteData);

// Attendance
router.get('/attendance', validateDateRange, getAttendance);

export default router;
