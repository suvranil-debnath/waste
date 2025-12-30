import express from 'express';
import { authenticate } from '../middlewares/auth.js';
import { requireRole } from '../middlewares/rbac.js';
import {
  getDistrictOverview,
  getDistrictBlocks,
  getDistrictStaffOverview,
  getDistrictWasteStats,
  createMunicipality,
  updateMunicipality,
  getDistrictComplaints,
  createComplaint,
  updateComplaint,
  getDistrictSummaryReport
} from '../controllers/districtController.js';

const router = express.Router();

// All routes require authentication and DISTRICT role
router.use(authenticate);
router.use(requireRole(['DISTRICT']));

/**
 * GET /api/district/overview
 * Get district-level overview statistics
 */
router.get('/overview', getDistrictOverview);

/**
 * GET /api/district/blocks
 * Get all blocks in district with statistics
 */
router.get('/blocks', getDistrictBlocks);

/**
 * GET /api/district/staff-overview
 * Get staff overview across district
 */
router.get('/staff-overview', getDistrictStaffOverview);

/**
 * GET /api/district/waste-stats
 * Get district-level waste statistics
 * Query params: startDate, endDate (optional)
 */
router.get('/waste-stats', getDistrictWasteStats);

// ============================================================================
// MUNICIPALITY MANAGEMENT
// ============================================================================

/**
 * POST /api/district/municipalities
 * Create a new municipality/GP
 */
router.post('/municipalities', createMunicipality);

/**
 * PUT /api/district/municipalities/:id
 * Update a municipality
 */
router.put('/municipalities/:id', updateMunicipality);

// ============================================================================
// COMPLAINT MANAGEMENT
// ============================================================================

/**
 * GET /api/district/complaints
 * Get all complaints in the district
 * Query params: status, category, priority, gpId (optional)
 */
router.get('/complaints', getDistrictComplaints);

/**
 * POST /api/district/complaints
 * Create a new complaint
 */
router.post('/complaints', createComplaint);

/**
 * PUT /api/district/complaints/:id
 * Update complaint status/resolution
 */
router.put('/complaints/:id', updateComplaint);

// ============================================================================
// REPORTS & ANALYTICS
// ============================================================================

/**
 * GET /api/district/reports/summary
 * Get comprehensive district summary report
 * Query params: startDate, endDate (optional)
 */
router.get('/reports/summary', getDistrictSummaryReport);

export default router;
