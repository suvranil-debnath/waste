import express from 'express';
import { GramPanchayat } from '../models/GramPanchayat.js';
import { authenticate } from '../middlewares/auth.js';
import { requireRole } from '../middlewares/rbac.js';

const router = express.Router();

// All routes require authentication and BLOCK_ADMIN role
router.use(authenticate);
router.use(requireRole(['BLOCK_ADMIN']));

/**
 * GET /api/block/municipalities
 * Get all municipalities/GPs under block
 */
router.get('/municipalities', async (req, res, next) => {
  try {
    const blockId = req.user.blockId;

    const municipalities = await GramPanchayat.find({ blockId, isActive: true })
      .sort({ name: 1 });

    // Get counts for each municipality
    const { Zone } = await import('../models/Zone.js');
    const { House } = await import('../models/House.js');
    const { CollectionAgent } = await import('../models/CollectionAgent.js');
    const { Van } = await import('../models/Van.js');

    const enriched = await Promise.all(
      municipalities.map(async (gp) => {
        const totalZones = await Zone.countDocuments({ gpId: gp._id, isActive: true });
        const totalHouses = await House.countDocuments({ gpId: gp._id, isActive: true });
        const totalStaff = await CollectionAgent.countDocuments({ gpId: gp._id, isActive: true });
        const totalVans = await Van.countDocuments({ gpId: gp._id, isActive: true });

        return {
          ...gp.toJSON(),
          totalZones,
          totalHouses,
          totalStaff,
          totalVans,
        };
      })
    );

    res.json({
      success: true,
      data: enriched,
    });
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/block/overview
 * Get block overview statistics
 */
router.get('/overview', async (req, res, next) => {
  try {
    const blockId = req.user.blockId;

    const { GramPanchayat } = await import('../models/GramPanchayat.js');
    const { House } = await import('../models/House.js');
    const { Collection } = await import('../models/Collection.js');

    // Get all GPs in block
    const gps = await GramPanchayat.find({ blockId }).select('_id');
    const gpIds = gps.map(g => g._id);

    // Get houses in all GPs
    const houses = await House.find({ gpId: { $in: gpIds } }).select('_id');
    const houseIds = houses.map(h => h._id);

    // Get total houses
    const totalHouses = houses.length;

    // Get total municipalities/GPs
    const totalMunicipalities = gps.length;

    // Get today's collections
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const todayCollections = await Collection.countDocuments({
      houseId: { $in: houseIds },
      collectionDate: { $gte: today },
    });

    // Get total waste today
    const wasteAgg = await Collection.aggregate([
      {
        $match: {
          houseId: { $in: houseIds },
          collectionDate: { $gte: today },
        },
      },
      {
        $group: {
          _id: null,
          totalWaste: { $sum: '$totalWaste' },
        },
      },
    ]);

    const totalWaste = wasteAgg[0]?.totalWaste || 0;

    res.json({
      success: true,
      data: {
        totalMunicipalities,
        totalHouses,
        todayCollections,
        totalWasteToday: totalWaste,
      },
    });
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/block/staff-overview
 * Get staff overview for block
 */
router.get('/staff-overview', async (req, res, next) => {
  try {
    const blockId = req.user.blockId;

    const { GramPanchayat } = await import('../models/GramPanchayat.js');
    const { CollectionAgent } = await import('../models/CollectionAgent.js');
    const { Attendance } = await import('../models/Attendance.js');

    // Get all GPs in block
    const gps = await GramPanchayat.find({ blockId }).select('_id');
    const gpIds = gps.map(g => g._id);

    // Get all agents
    const agents = await CollectionAgent.find({ gpId: { $in: gpIds } }).select('_id');
    const agentIds = agents.map(a => a._id);

    // Total staff
    const totalStaff = agents.length;

    // Today's attendance
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const presentToday = await Attendance.countDocuments({
      agentId: { $in: agentIds },
      date: { $gte: today },
      status: 'PRESENT',
    });

    res.json({
      success: true,
      data: {
        totalStaff,
        presentToday,
        absentToday: totalStaff - presentToday,
      },
    });
  } catch (error) {
    next(error);
  }
});

export default router;
