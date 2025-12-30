import express from 'express';
import { authenticate } from '../middlewares/auth.js';
import { requireRole } from '../middlewares/rbac.js';
import {
  getBlockOverview,
  getMunicipalities,
  getStaffOverview,
  getBlockZones,
  getBlockHouses,
  getBlockStaff,
  getBlockVans,
  getBlockWasteData,
  getBlockAttendance,
  getBlockDumpSites
} from '../controllers/blockController.js';

const router = express.Router();

// All routes require authentication and BLOCK role
router.use(authenticate);
router.use(requireRole(['BLOCK']));

/**
 * GET /api/block/overview
 * Get block-level overview statistics
 */
router.get('/overview', getBlockOverview);

/**
 * GET /api/block/municipalities
 * Get all municipalities in the block with statistics
 */
router.get('/municipalities', getMunicipalities);

/**
 * GET /api/block/staff-overview
 * Get staff overview for the block
 */
router.get('/staff-overview', getStaffOverview);

/**
 * GET /api/block/zones
 * Get all zones in the block
 * Query params: gpId (optional)
 */
router.get('/zones', getBlockZones);

/**
 * GET /api/block/houses
 * Get all houses in the block
 * Query params: gpId, zoneId, gpsStatus (optional)
 */
router.get('/houses', getBlockHouses);

/**
 * GET /api/block/staff
 * Get all collection agents in the block
 * Query params: gpId, zoneId (optional)
 */
router.get('/staff', getBlockStaff);

/**
 * GET /api/block/vans
 * Get all vans in the block
 * Query params: gpId (optional)
 */
router.get('/vans', getBlockVans);

/**
 * GET /api/block/waste-data
 * Get waste collection data for the block
 * Query params: startDate, endDate, gpId (optional)
 */
router.get('/waste-data', getBlockWasteData);

/**
 * GET /api/block/attendance
 * Get attendance records for the block
 * Query params: date, startDate, endDate, gpId (optional)
 */
router.get('/attendance', getBlockAttendance);

/**
 * GET /api/block/dump-sites
 * Get all dump sites in the block
 * Query params: gpId (optional)
 */
router.get('/dump-sites', getBlockDumpSites);

export default router;
