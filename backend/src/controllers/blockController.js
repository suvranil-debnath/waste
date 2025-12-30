import { Block } from '../models/Block.js';
import { GramPanchayat } from '../models/GramPanchayat.js';
import { Zone } from '../models/Zone.js';
import { House } from '../models/House.js';
import { CollectionAgent } from '../models/CollectionAgent.js';
import { Van } from '../models/Van.js';
import { Collection } from '../models/Collection.js';
import { Attendance } from '../models/Attendance.js';
import { DumpingSite } from '../models/DumpingSite.js';

/**
 * GET /api/block/overview
 * Get block-level overview statistics
 */
export const getBlockOverview = async (req, res, next) => {
  try {
    const blockId = req.user.blockId;

    // Total municipalities
    const totalMunicipalities = await GramPanchayat.countDocuments({
      blockId,
      isActive: true
    });

    // Total houses
    const gps = await GramPanchayat.find({ blockId, isActive: true }).select('_id');
    const gpIds = gps.map(gp => gp._id);

    const totalHouses = await House.countDocuments({
      gpId: { $in: gpIds },
      isActive: true
    });

    // Today's collections
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const todayCollections = await Collection.countDocuments({
      gpId: { $in: gpIds },
      collectionDate: { $gte: today, $lt: tomorrow },
      status: { $in: ['COLLECTED', 'DUMPED'] }
    });

    // Total waste today
    const wasteStats = await Collection.aggregate([
      {
        $match: {
          gpId: { $in: gpIds },
          collectionDate: { $gte: today, $lt: tomorrow },
          status: { $in: ['COLLECTED', 'DUMPED'] }
        }
      },
      {
        $group: {
          _id: null,
          totalWaste: { $sum: '$totalWaste' }
        }
      }
    ]);

    const totalWasteToday = wasteStats.length > 0 ? wasteStats[0].totalWaste : 0;

    res.json({
      success: true,
      data: {
        totalMunicipalities,
        totalHouses,
        todayCollections,
        totalWasteToday
      }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/block/municipalities
 * Get all municipalities in the block
 */
export const getMunicipalities = async (req, res, next) => {
  try {
    const blockId = req.user.blockId;

    const municipalities = await GramPanchayat.find({ blockId, isActive: true })
      .populate('blockId', 'name code')
      .lean();

    // Add statistics for each municipality
    const municipalitiesWithStats = await Promise.all(
      municipalities.map(async (gp) => {
        const totalZones = await Zone.countDocuments({ gpId: gp._id, isActive: true });
        const totalHouses = await House.countDocuments({ gpId: gp._id, isActive: true });
        const totalStaff = await CollectionAgent.countDocuments({ gpId: gp._id, isActive: true });
        const totalVans = await Van.countDocuments({ gpId: gp._id, isActive: true });

        return {
          ...gp,
          totalZones,
          totalHouses,
          totalStaff,
          totalVans
        };
      })
    );

    res.json({
      success: true,
      data: municipalitiesWithStats
    });
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/block/staff-overview
 * Get staff overview for the block
 */
export const getStaffOverview = async (req, res, next) => {
  try {
    const blockId = req.user.blockId;

    const gps = await GramPanchayat.find({ blockId, isActive: true }).select('_id');
    const gpIds = gps.map(gp => gp._id);

    const totalStaff = await CollectionAgent.countDocuments({
      gpId: { $in: gpIds },
      isActive: true
    });

    // Today's attendance
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const agents = await CollectionAgent.find({
      gpId: { $in: gpIds },
      isActive: true
    }).select('_id');
    const agentIds = agents.map(a => a._id);

    const presentToday = await Attendance.countDocuments({
      agentId: { $in: agentIds },
      date: { $gte: today, $lt: tomorrow },
      status: 'PRESENT'
    });

    const absentToday = totalStaff - presentToday;

    res.json({
      success: true,
      data: {
        totalStaff,
        presentToday,
        absentToday
      }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/block/zones
 * Get all zones in the block
 */
export const getBlockZones = async (req, res, next) => {
  try {
    const blockId = req.user.blockId;
    const { gpId } = req.query;

    const gps = await GramPanchayat.find({ blockId, isActive: true }).select('_id');
    const gpIds = gps.map(gp => gp._id);

    const filter = { gpId: { $in: gpIds }, isActive: true };
    if (gpId) {
      filter.gpId = gpId;
    }

    const zones = await Zone.find(filter)
      .populate('gpId', 'name code')
      .lean();

    // Add house count for each zone
    const zonesWithStats = await Promise.all(
      zones.map(async (zone) => {
        const totalHouses = await House.countDocuments({
          zoneId: zone._id,
          isActive: true
        });

        return {
          ...zone,
          totalHouses
        };
      })
    );

    res.json({
      success: true,
      data: zonesWithStats
    });
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/block/houses
 * Get all houses in the block
 */
export const getBlockHouses = async (req, res, next) => {
  try {
    const blockId = req.user.blockId;
    const { gpId, zoneId, gpsStatus } = req.query;

    const gps = await GramPanchayat.find({ blockId, isActive: true }).select('_id');
    const gpIds = gps.map(gp => gp._id);

    const filter = { gpId: { $in: gpIds }, isActive: true };
    
    if (gpId) {
      filter.gpId = gpId;
    }
    
    if (zoneId) {
      filter.zoneId = zoneId;
    }
    
    if (gpsStatus) {
      filter.isGPSActive = gpsStatus === 'Active';
    }

    const houses = await House.find(filter)
      .populate('gpId', 'name code')
      .populate('zoneId', 'name code')
      .populate('assignedVanId', 'registrationNumber')
      .sort({ createdAt: -1 })
      .limit(500);

    res.json({
      success: true,
      data: houses
    });
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/block/staff
 * Get all collection agents in the block
 */
export const getBlockStaff = async (req, res, next) => {
  try {
    const blockId = req.user.blockId;
    const { gpId, zoneId } = req.query;

    const gps = await GramPanchayat.find({ blockId, isActive: true }).select('_id');
    const gpIds = gps.map(gp => gp._id);

    const filter = { gpId: { $in: gpIds }, isActive: true };
    
    if (gpId) {
      filter.gpId = gpId;
    }
    
    if (zoneId) {
      filter.zoneId = zoneId;
    }

    const staff = await CollectionAgent.find(filter)
      .populate('gpId', 'name code')
      .populate('zoneId', 'name code')
      .populate('assignedVanId', 'registrationNumber')
      .populate('userId', 'email role');

    res.json({
      success: true,
      data: staff
    });
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/block/vans
 * Get all vans in the block
 */
export const getBlockVans = async (req, res, next) => {
  try {
    const blockId = req.user.blockId;
    const { gpId } = req.query;

    const gps = await GramPanchayat.find({ blockId, isActive: true }).select('_id');
    const gpIds = gps.map(gp => gp._id);

    const filter = { gpId: { $in: gpIds }, isActive: true };
    
    if (gpId) {
      filter.gpId = gpId;
    }

    const vans = await Van.find(filter)
      .populate('gpId', 'name code')
      .populate('zoneId', 'name code');

    res.json({
      success: true,
      data: vans
    });
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/block/waste-data
 * Get waste collection data for the block
 */
export const getBlockWasteData = async (req, res, next) => {
  try {
    const blockId = req.user.blockId;
    const { startDate, endDate, gpId } = req.query;

    const gps = await GramPanchayat.find({ blockId, isActive: true }).select('_id');
    let gpIds = gps.map(gp => gp._id);
    
    if (gpId) {
      gpIds = [gpId];
    }

    const dateFilter = {};
    if (startDate || endDate) {
      dateFilter.collectionDate = {};
      if (startDate) dateFilter.collectionDate.$gte = new Date(startDate);
      if (endDate) {
        const end = new Date(endDate);
        end.setHours(23, 59, 59, 999);
        dateFilter.collectionDate.$lte = end;
      }
    }

    const stats = await Collection.aggregate([
      {
        $match: {
          gpId: { $in: gpIds },
          status: { $in: ['COLLECTED', 'DUMPED'] },
          ...dateFilter
        }
      },
      {
        $group: {
          _id: null,
          totalCollections: { $sum: 1 },
          totalWaste: { $sum: '$totalWaste' },
          solidWaste: { $sum: '$solidWaste' },
          plasticWaste: { $sum: '$plasticWaste' },
          organicWaste: { $sum: '$organicWaste' },
          eWaste: { $sum: '$eWaste' }
        }
      }
    ]);

    const collections = await Collection.find({
      gpId: { $in: gpIds },
      status: { $in: ['COLLECTED', 'DUMPED'] },
      ...dateFilter
    })
      .populate('houseId', 'houseNumber ownerName')
      .populate('agentId', 'name')
      .populate('gpId', 'name')
      .sort({ collectionDate: -1 })
      .limit(100);

    res.json({
      success: true,
      data: {
        stats: stats.length > 0 ? stats[0] : {
          totalCollections: 0,
          totalWaste: 0,
          solidWaste: 0,
          plasticWaste: 0,
          organicWaste: 0,
          eWaste: 0
        },
        collections
      }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/block/attendance
 * Get attendance records for the block
 */
export const getBlockAttendance = async (req, res, next) => {
  try {
    const blockId = req.user.blockId;
    const { date, startDate, endDate, gpId } = req.query;

    const gps = await GramPanchayat.find({ blockId, isActive: true }).select('_id');
    let gpIds = gps.map(gp => gp._id);
    
    if (gpId) {
      gpIds = [gpId];
    }

    const agents = await CollectionAgent.find({
      gpId: { $in: gpIds },
      isActive: true
    }).select('_id');
    const agentIds = agents.map(a => a._id);

    const dateFilter = {};
    if (date) {
      const specificDate = new Date(date);
      specificDate.setHours(0, 0, 0, 0);
      const nextDay = new Date(specificDate);
      nextDay.setDate(nextDay.getDate() + 1);
      dateFilter.date = { $gte: specificDate, $lt: nextDay };
    } else if (startDate || endDate) {
      dateFilter.date = {};
      if (startDate) dateFilter.date.$gte = new Date(startDate);
      if (endDate) {
        const end = new Date(endDate);
        end.setHours(23, 59, 59, 999);
        dateFilter.date.$lte = end;
      }
    }

    const attendance = await Attendance.find({
      agentId: { $in: agentIds },
      ...dateFilter
    })
      .populate({
        path: 'agentId',
        select: 'name employeeId',
        populate: {
          path: 'gpId',
          select: 'name code'
        }
      })
      .sort({ date: -1, checkInTime: -1 });

    res.json({
      success: true,
      data: attendance
    });
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/block/dump-sites
 * Get all dump sites in the block
 */
export const getBlockDumpSites = async (req, res, next) => {
  try {
    const blockId = req.user.blockId;
    const { gpId } = req.query;

    const gps = await GramPanchayat.find({ blockId, isActive: true }).select('_id');
    let gpIds = gps.map(gp => gp._id);
    
    if (gpId) {
      gpIds = [gpId];
    }

    const dumpSites = await DumpingSite.find({
      gpId: { $in: gpIds },
      isActive: true
    })
      .populate('gpId', 'name code');

    res.json({
      success: true,
      data: dumpSites
    });
  } catch (error) {
    next(error);
  }
};
