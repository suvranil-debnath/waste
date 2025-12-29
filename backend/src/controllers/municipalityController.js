import { Zone } from '../models/Zone.js';
import { CollectionAgent } from '../models/CollectionAgent.js';
import { Van } from '../models/Van.js';
import { Attendance } from '../models/Attendance.js';
import { createHouse, getHousesByGP, updateHouse, getHouseStats } from '../services/houseService.js';
import { getCollectionsByGP, getWasteStats } from '../services/collectionService.js';

/**
 * GET /api/municipality/zones
 * Get all zones for municipality
 */
export const getZones = async (req, res, next) => {
  try {
    const gpId = req.user.gpId;

    const zones = await Zone.find({ gpId, isActive: true }).sort({ name: 1 });

    // Get house count for each zone
    const zonesWithCount = await Promise.all(
      zones.map(async (zone) => {
        const { House } = await import('../models/House.js');
        const totalHouses = await House.countDocuments({ zoneId: zone._id, isActive: true });
        return {
          ...zone.toJSON(),
          totalHouses,
        };
      })
    );

    res.json({
      success: true,
      data: zonesWithCount,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/municipality/houses
 * Get all houses for municipality
 */
export const getHouses = async (req, res, next) => {
  try {
    const gpId = req.user.gpId;
    const { zoneId, gpsStatus } = req.query;

    const filters = {};
    if (zoneId) filters.zoneId = zoneId;
    if (gpsStatus === 'Active') filters.isGPSActive = true;
    if (gpsStatus === 'Pending') filters.isGPSActive = false;

    const houses = await getHousesByGP(gpId, filters);

    res.json({
      success: true,
      data: houses,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * POST /api/municipality/houses
 * Create new house
 */
export const createNewHouse = async (req, res, next) => {
  try {
    const gpId = req.user.gpId;
    const result = await createHouse(req.body, gpId);

    res.status(201).json({
      success: true,
      message: 'House created successfully',
      data: result,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * PUT /api/municipality/houses/:id
 * Update house
 */
export const updateHouseDetails = async (req, res, next) => {
  try {
    const { id } = req.params;
    const updates = req.body;

    const house = await updateHouse(id, updates);

    res.json({
      success: true,
      message: 'House updated successfully',
      data: house,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/municipality/staff
 * Get all collection agents/staff
 */
export const getStaff = async (req, res, next) => {
  try {
    const gpId = req.user.gpId;
    const { zoneId } = req.query;

    const query = { gpId, isActive: true };
    if (zoneId) query.zoneId = zoneId;

    const staff = await CollectionAgent.find(query)
      .populate('zoneId')
      .populate('assignedVanId')
      .sort({ name: 1 });

    res.json({
      success: true,
      data: staff,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/municipality/vans
 * Get all vans
 */
export const getVans = async (req, res, next) => {
  try {
    const gpId = req.user.gpId;
    const { zoneId } = req.query;

    const query = { gpId, isActive: true };
    if (zoneId) query.zoneId = zoneId;

    const vans = await Van.find(query)
      .populate('zoneId')
      .sort({ registrationNumber: 1 });

    res.json({
      success: true,
      data: vans,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/municipality/waste-data
 * Get waste collection data and statistics
 */
export const getWasteData = async (req, res, next) => {
  try {
    const gpId = req.user.gpId;
    const { startDate, endDate } = req.query;

    const stats = await getWasteStats(gpId, startDate, endDate);
    const collections = await getCollectionsByGP(gpId, {
      ...(startDate && { collectionDate: { $gte: new Date(startDate) } }),
      ...(endDate && { collectionDate: { $lte: new Date(endDate) } }),
    });

    res.json({
      success: true,
      data: {
        stats,
        collections,
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/municipality/attendance
 * Get staff attendance
 */
export const getAttendance = async (req, res, next) => {
  try {
    const gpId = req.user.gpId;
    const { date, startDate, endDate } = req.query;

    // Get all agents in this GP
    const agents = await CollectionAgent.find({ gpId }).select('_id');
    const agentIds = agents.map(a => a._id);

    const query = { agentId: { $in: agentIds } };

    if (date) {
      const targetDate = new Date(date);
      targetDate.setHours(0, 0, 0, 0);
      const nextDay = new Date(targetDate);
      nextDay.setDate(nextDay.getDate() + 1);
      
      query.date = { $gte: targetDate, $lt: nextDay };
    } else if (startDate || endDate) {
      query.date = {};
      if (startDate) query.date.$gte = new Date(startDate);
      if (endDate) query.date.$lte = new Date(endDate);
    }

    const attendance = await Attendance.find(query)
      .populate('agentId')
      .sort({ date: -1 });

    res.json({
      success: true,
      data: attendance,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/municipality/dashboard
 * Get dashboard statistics
 */
export const getDashboard = async (req, res, next) => {
  try {
    const gpId = req.user.gpId;

    // Get house stats
    const houseStats = await getHouseStats(gpId);

    // Get today's waste stats
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const todayStats = await getWasteStats(gpId, today, new Date());

    // Get total staff count
    const totalStaff = await CollectionAgent.countDocuments({ gpId, isActive: true });

    // Get total vans count
    const totalVans = await Van.countDocuments({ gpId, isActive: true });

    // Get today's attendance
    const todayAttendance = await Attendance.countDocuments({
      date: { $gte: today },
      status: 'PRESENT',
    });

    res.json({
      success: true,
      data: {
        houses: houseStats,
        staff: {
          total: totalStaff,
          presentToday: todayAttendance,
        },
        vans: {
          total: totalVans,
        },
        wasteToday: todayStats,
      },
    });
  } catch (error) {
    next(error);
  }
};
