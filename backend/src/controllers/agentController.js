import { parseQRData } from '../utils/qrGenerator.js';
import { getHouseByQR } from '../services/houseService.js';
import { processCollection } from '../services/collectionService.js';
import { DumpingSite } from '../models/DumpingSite.js';
import { CollectionAgent } from '../models/CollectionAgent.js';
import { Collection } from '../models/Collection.js';
import { House } from '../models/House.js';
import { calculateDistance } from '../utils/gpsCalculator.js';

/**
 * POST /api/agent/scan-house
 * Scan house QR code
 */
export const scanHouse = async (req, res, next) => {
  try {
    const { qrCode, latitude, longitude } = req.body;

    // Parse QR data
    const qrData = parseQRData(qrCode);

    if (qrData.type !== 'HOUSE') {
      return res.status(400).json({
        success: false,
        message: 'Invalid QR code. This is not a house QR code.',
      });
    }

    // Get house details
    const house = await getHouseByQR(qrCode);

    // Get agent details
    const agent = await CollectionAgent.findOne({ userId: req.user._id });

    if (!agent) {
      return res.status(404).json({
        success: false,
        message: 'Agent profile not found',
      });
    }

    res.json({
      success: true,
      message: 'House QR scanned successfully',
      data: {
        house,
        requiresGPSSetup: !house.isGPSActive,
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * POST /api/agent/accept-waste
 * Accept waste from a house
 */
export const acceptWaste = async (req, res, next) => {
  try {
    // Get agent details
    const agent = await CollectionAgent.findOne({ userId: req.user._id });

    if (!agent) {
      return res.status(404).json({
        success: false,
        message: 'Agent profile not found',
      });
    }

    const collectionData = {
      ...req.body,
      vanId: agent.assignedVanId,
    };

    const collection = await processCollection(collectionData, agent._id);

    res.status(201).json({
      success: true,
      message: 'Waste collection recorded successfully',
      data: collection,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * POST /api/agent/scan-dump
 * Scan dump site QR for verification
 */
export const scanDump = async (req, res, next) => {
  try {
    const { qrCode, latitude, longitude } = req.body;

    // Parse QR data
    const qrData = parseQRData(qrCode);

    if (qrData.type !== 'DUMP') {
      return res.status(400).json({
        success: false,
        message: 'Invalid QR code. This is not a dump site QR code.',
      });
    }

    // Get dump site details
    const dumpSite = await DumpingSite.findOne({ qrCode });

    if (!dumpSite) {
      return res.status(404).json({
        success: false,
        message: 'Dump site not found',
      });
    }

    if (!dumpSite.isActive) {
      return res.status(400).json({
        success: false,
        message: 'Dump site is inactive',
      });
    }

    // Validate GPS proximity to dump site
    const distance = calculateDistance(
      dumpSite.latitude,
      dumpSite.longitude,
      latitude,
      longitude
    );

    if (distance > 100) { // Allow 100m radius for dump sites
      return res.status(403).json({
        success: false,
        message: `Must be within 100m of dump site. Current distance: ${Math.round(distance)}m`,
      });
    }

    // Get agent
    const agent = await CollectionAgent.findOne({ userId: req.user._id });

    // Update all today's pending collections to DUMPED status
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const updateResult = await Collection.updateMany(
      {
        agentId: agent._id,
        status: 'COLLECTED',
        collectionDate: { $gte: today },
      },
      {
        $set: {
          status: 'DUMPED',
          dumpedAt: new Date(),
          dumpSiteId: dumpSite._id,
        },
      }
    );

    res.json({
      success: true,
      message: 'Dump verification successful',
      data: {
        dumpSite,
        collectionsUpdated: updateResult.modifiedCount,
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/agent/pending-houses
 * Get pending houses for collection (route optimization)
 */
export const getPendingHouses = async (req, res, next) => {
  try {
    const { latitude, longitude } = req.query;

    // Get agent details
    const agent = await CollectionAgent.findOne({ userId: req.user._id }).populate('zoneId');

    if (!agent) {
      return res.status(404).json({
        success: false,
        message: 'Agent profile not found',
      });
    }

    // Get houses in agent's zone
    const houses = await House.find({
      zoneId: agent.zoneId._id,
      isActive: true,
      isGPSActive: true, // Only houses with GPS set
    });

    // Get today's collections
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const collectedToday = await Collection.find({
      collectionDate: { $gte: today },
    }).select('houseId');

    const collectedHouseIds = new Set(collectedToday.map(c => c.houseId.toString()));

    // Filter pending houses
    const pendingHouses = houses.filter(h => !collectedHouseIds.has(h._id.toString()));

    // Calculate distance and sort if agent location provided
    let sortedHouses = pendingHouses;

    if (latitude && longitude) {
      sortedHouses = pendingHouses
        .map(house => ({
          ...house.toJSON(),
          distance: calculateDistance(
            parseFloat(latitude),
            parseFloat(longitude),
            house.latitude,
            house.longitude
          ),
        }))
        .sort((a, b) => a.distance - b.distance); // Sort by distance
    }

    res.json({
      success: true,
      data: sortedHouses,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/agent/today-summary
 * Get today's collection summary for agent
 */
export const getTodaySummary = async (req, res, next) => {
  try {
    const agent = await CollectionAgent.findOne({ userId: req.user._id });

    if (!agent) {
      return res.status(404).json({
        success: false,
        message: 'Agent profile not found',
      });
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const collections = await Collection.find({
      agentId: agent._id,
      collectionDate: { $gte: today },
    }).populate('houseId');

    const totalCollected = collections.length;
    const totalWaste = collections.reduce((sum, c) => sum + c.totalWaste, 0);
    const dumped = collections.filter(c => c.status === 'DUMPED').length;

    res.json({
      success: true,
      data: {
        totalCollected,
        totalWaste,
        dumped,
        pending: totalCollected - dumped,
        collections,
      },
    });
  } catch (error) {
    next(error);
  }
};
