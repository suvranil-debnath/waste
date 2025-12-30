import { Block } from '../models/Block.js';
import { GramPanchayat } from '../models/GramPanchayat.js';
import { CollectionAgent } from '../models/CollectionAgent.js';
import { House } from '../models/House.js';
import { Collection } from '../models/Collection.js';
import { Attendance } from '../models/Attendance.js';
import { Zone } from '../models/Zone.js';
import { Van } from '../models/Van.js';

/**
 * GET /api/district/overview
 * Get district-level overview statistics
 */
export const getDistrictOverview = async (req, res, next) => {
  try {
    const districtId = req.user.districtId;

    // Get all blocks in district
    const totalBlocks = await Block.countDocuments({ districtId, isActive: true });

    // Get all GPs/Municipalities in district
    const blocks = await Block.find({ districtId, isActive: true }).select('_id');
    const blockIds = blocks.map(b => b._id);
    
    const totalMunicipalities = await GramPanchayat.countDocuments({
      blockId: { $in: blockIds },
      isActive: true
    });

    // Get all houses in district
    const municipalities = await GramPanchayat.find({
      blockId: { $in: blockIds },
      isActive: true
    }).select('_id');
    const gpIds = municipalities.map(gp => gp._id);

    const totalHouses = await House.countDocuments({
      gpId: { $in: gpIds },
      isActive: true
    });

    // Get today's collections
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const todayCollections = await Collection.countDocuments({
      gpId: { $in: gpIds },
      collectionDate: { $gte: today, $lt: tomorrow },
      status: { $in: ['COLLECTED', 'DUMPED'] }
    });

    // Get today's total waste
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
        totalBlocks,
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
 * GET /api/district/blocks
 * Get all blocks in the district with statistics
 */
export const getDistrictBlocks = async (req, res, next) => {
  try {
    const districtId = req.user.districtId;

    const blocks = await Block.find({ districtId, isActive: true })
      .populate('districtId', 'name code')
      .lean();

    // Add statistics for each block
    const blocksWithStats = await Promise.all(
      blocks.map(async (block) => {
        // Count municipalities in block
        const totalMunicipalities = await GramPanchayat.countDocuments({
          blockId: block._id,
          isActive: true
        });

        // Get all GPs in block
        const gps = await GramPanchayat.find({
          blockId: block._id,
          isActive: true
        }).select('_id');
        const gpIds = gps.map(gp => gp._id);

        // Count houses
        const totalHouses = await House.countDocuments({
          gpId: { $in: gpIds },
          isActive: true
        });

        // Count staff
        const totalStaff = await CollectionAgent.countDocuments({
          gpId: { $in: gpIds },
          isActive: true
        });

        // Get today's collections
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const tomorrow = new Date(today);
        tomorrow.setDate(tomorrow.getDate() + 1);

        const todayCollections = await Collection.countDocuments({
          gpId: { $in: gpIds },
          collectionDate: { $gte: today, $lt: tomorrow },
          status: { $in: ['COLLECTED', 'DUMPED'] }
        });

        return {
          ...block,
          totalMunicipalities,
          totalHouses,
          totalStaff,
          todayCollections
        };
      })
    );

    res.json({
      success: true,
      data: blocksWithStats
    });
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/district/staff-overview
 * Get staff overview across all blocks in district
 */
export const getDistrictStaffOverview = async (req, res, next) => {
  try {
    const districtId = req.user.districtId;

    // Get all blocks in district
    const blocks = await Block.find({ districtId, isActive: true }).select('_id');
    const blockIds = blocks.map(b => b._id);

    // Get all GPs in district
    const gps = await GramPanchayat.find({
      blockId: { $in: blockIds },
      isActive: true
    }).select('_id');
    const gpIds = gps.map(gp => gp._id);

    // Total staff
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
 * GET /api/district/waste-stats
 * Get district-level waste statistics
 */
export const getDistrictWasteStats = async (req, res, next) => {
  try {
    const districtId = req.user.districtId;
    const { startDate, endDate } = req.query;

    // Get all blocks in district
    const blocks = await Block.find({ districtId, isActive: true }).select('_id');
    const blockIds = blocks.map(b => b._id);

    // Get all GPs in district
    const gps = await GramPanchayat.find({
      blockId: { $in: blockIds },
      isActive: true
    }).select('_id');
    const gpIds = gps.map(gp => gp._id);

    // Build date filter
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

    // Get waste statistics
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

    const wasteStats = stats.length > 0 ? stats[0] : {
      totalCollections: 0,
      totalWaste: 0,
      solidWaste: 0,
      plasticWaste: 0,
      organicWaste: 0,
      eWaste: 0
    };

    // Get recent collections with details
    const recentCollections = await Collection.find({
      gpId: { $in: gpIds },
      status: { $in: ['COLLECTED', 'DUMPED'] },
      ...dateFilter
    })
      .populate('houseId', 'houseNumber ownerName')
      .populate('agentId', 'name')
      .populate('gpId', 'name')
      .sort({ collectionDate: -1 })
      .limit(50)
      .lean();

    res.json({
      success: true,
      data: {
        stats: wasteStats,
        recentCollections
      }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * POST /api/district/municipalities
 * Create a new municipality/GP
 */
export const createMunicipality = async (req, res, next) => {
  try {
    const districtId = req.user.districtId;
    const { name, code, blockId, type, contactNumber, address } = req.body;

    const block = await Block.findOne({ _id: blockId, districtId, isActive: true });
    if (!block) {
      return res.status(404).json({
        success: false,
        message: 'Block not found in your district'
      });
    }

    const existing = await GramPanchayat.findOne({ code });
    if (existing) {
      return res.status(409).json({
        success: false,
        message: 'Municipality code already exists'
      });
    }

    const municipality = await GramPanchayat.create({
      name,
      code,
      blockId,
      type: type || 'GRAM_PANCHAYAT',
      contactNumber,
      address
    });

    res.status(201).json({
      success: true,
      message: 'Municipality created successfully',
      data: municipality
    });
  } catch (error) {
    next(error);
  }
};

/**
 * PUT /api/district/municipalities/:id
 * Update a municipality
 */
export const updateMunicipality = async (req, res, next) => {
  try {
    const districtId = req.user.districtId;
    const { id } = req.params;
    const { name, contactNumber, address, isActive } = req.body;

    const blocks = await Block.find({ districtId, isActive: true }).select('_id');
    const blockIds = blocks.map(b => b._id);

    const municipality = await GramPanchayat.findOne({
      _id: id,
      blockId: { $in: blockIds }
    });

    if (!municipality) {
      return res.status(404).json({
        success: false,
        message: 'Municipality not found in your district'
      });
    }

    if (name) municipality.name = name;
    if (contactNumber) municipality.contactNumber = contactNumber;
    if (address) municipality.address = address;
    if (isActive !== undefined) municipality.isActive = isActive;

    await municipality.save();

    res.json({
      success: true,
      message: 'Municipality updated successfully',
      data: municipality
    });
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/district/complaints
 * Get all complaints in the district
 */
export const getDistrictComplaints = async (req, res, next) => {
  try {
    const districtId = req.user.districtId;
    const { status, category, priority, gpId } = req.query;

    const { Complaint } = await import('../models/Complaint.js');

    const filter = { districtId, isActive: true };
    
    if (status) filter.status = status;
    if (category) filter.category = category;
    if (priority) filter.priority = priority;
    if (gpId) filter.gpId = gpId;

    const complaints = await Complaint.find(filter)
      .populate('gpId', 'name code')
      .populate('reportedBy', 'name email')
      .populate('assignedTo', 'name')
      .populate('resolvedBy', 'name')
      .sort({ createdAt: -1 })
      .limit(200);

    const stats = await Complaint.aggregate([
      { $match: { districtId, isActive: true } },
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 }
        }
      }
    ]);

    res.json({
      success: true,
      data: {
        complaints,
        stats: {
          total: complaints.length,
          byStatus: stats.reduce((acc, curr) => {
            acc[curr._id] = curr.count;
            return acc;
          }, {})
        }
      }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * POST /api/district/complaints
 * Create a new complaint
 */
export const createComplaint = async (req, res, next) => {
  try {
    const userId = req.user._id;
    const districtId = req.user.districtId;
    const {
      title,
      description,
      category,
      priority,
      reportedByName,
      reportedByPhone,
      houseId,
      zoneId,
      gpId,
      blockId,
      agentId,
      vanId
    } = req.body;

    const { Complaint } = await import('../models/Complaint.js');

    const complaint = await Complaint.create({
      title,
      description,
      category,
      priority: priority || 'MEDIUM',
      reportedBy: userId,
      reportedByName,
      reportedByPhone,
      houseId,
      zoneId,
      gpId,
      blockId,
      districtId,
      agentId,
      vanId
    });

    res.status(201).json({
      success: true,
      message: 'Complaint registered successfully',
      data: complaint
    });
  } catch (error) {
    next(error);
  }
};

/**
 * PUT /api/district/complaints/:id
 * Update complaint status/resolution
 */
export const updateComplaint = async (req, res, next) => {
  try {
    const { id } = req.params;
    const userId = req.user._id;
    const { status, assignedTo, resolution, comment } = req.body;

    const { Complaint } = await import('../models/Complaint.js');

    const complaint = await Complaint.findById(id);
    if (!complaint) {
      return res.status(404).json({
        success: false,
        message: 'Complaint not found'
      });
    }

    if (status) complaint.status = status;
    if (assignedTo) complaint.assignedTo = assignedTo;
    if (resolution) {
      complaint.resolution = resolution;
      if (status === 'RESOLVED' || status === 'CLOSED') {
        complaint.resolvedAt = new Date();
        complaint.resolvedBy = userId;
      }
    }

    if (comment) {
      complaint.comments.push({
        userId,
        userName: req.user.name,
        comment,
        createdAt: new Date()
      });
    }

    await complaint.save();

    res.json({
      success: true,
      message: 'Complaint updated successfully',
      data: complaint
    });
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/district/reports/summary
 * Get comprehensive district summary report
 */
export const getDistrictSummaryReport = async (req, res, next) => {
  try {
    const districtId = req.user.districtId;
    const { startDate, endDate } = req.query;

    const blocks = await Block.find({ districtId, isActive: true }).select('_id');
    const blockIds = blocks.map(b => b._id);

    const gps = await GramPanchayat.find({
      blockId: { $in: blockIds },
      isActive: true
    }).select('_id');
    const gpIds = gps.map(gp => gp._id);

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

    const totalBlocks = blocks.length;
    const totalMunicipalities = gps.length;
    const totalZones = await Zone.countDocuments({ gpId: { $in: gpIds }, isActive: true });
    const totalHouses = await House.countDocuments({ gpId: { $in: gpIds }, isActive: true });
    const totalStaff = await CollectionAgent.countDocuments({ gpId: { $in: gpIds }, isActive: true });
    const totalVans = await Van.countDocuments({ gpId: { $in: gpIds }, isActive: true });

    const collectionStats = await Collection.aggregate([
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

    res.json({
      success: true,
      data: {
        infrastructure: {
          totalBlocks,
          totalMunicipalities,
          totalZones,
          totalHouses,
          totalStaff,
          totalVans
        },
        collections: collectionStats.length > 0 ? collectionStats[0] : {
          totalCollections: 0,
          totalWaste: 0,
          solidWaste: 0,
          plasticWaste: 0,
          organicWaste: 0,
          eWaste: 0
        }
      }
    });
  } catch (error) {
    next(error);
  }
};
