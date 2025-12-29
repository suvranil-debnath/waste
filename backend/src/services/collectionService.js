import { Collection } from '../models/Collection.js';
import { House } from '../models/House.js';
import { CollectionAgent } from '../models/CollectionAgent.js';
import { FraudLog } from '../models/FraudLog.js';
import { isWithinRadius } from '../utils/gpsCalculator.js';
import { isWithinOperationalHours, getCurrentTime, getOperationalHours } from '../utils/timeValidator.js';
import { config } from '../config/environment.js';
import { updateHouseGPS } from './houseService.js';

/**
 * Process waste collection with validations
 */
export const processCollection = async (collectionData, agentId) => {
  const {
    houseId,
    latitude: agentLat,
    longitude: agentLon,
    solidWaste,
    plasticWaste,
    organicWaste,
    eWaste,
    totalWaste,
    vanId,
    notes,
  } = collectionData;

  // Get house details
  const house = await House.findById(houseId).populate('gpId');
  if (!house) {
    throw new Error('House not found');
  }

  // Get agent details
  const agent = await CollectionAgent.findById(agentId);
  if (!agent) {
    throw new Error('Agent not found');
  }

  // Validate agent belongs to the same GP as house
  if (house.gpId._id.toString() !== agent.gpId.toString()) {
    await FraudLog.create({
      agentId,
      houseId,
      reasonCode: 'UNAUTHORIZED_ACCESS',
      details: {
        agentLatitude: agentLat,
        agentLongitude: agentLon,
        additionalInfo: 'Agent trying to collect from different GP',
      },
      severity: 'HIGH',
    });

    throw new Error('Agent not authorized for this GP');
  }

  // Check operational hours
  if (!isWithinOperationalHours()) {
    const hours = getOperationalHours();
    await FraudLog.create({
      agentId,
      houseId,
      reasonCode: 'TIME_VIOLATION',
      details: {
        agentLatitude: agentLat,
        agentLongitude: agentLon,
        attemptedTime: getCurrentTime(),
        validTimeRange: `${hours.start} - ${hours.end}`,
        additionalInfo: 'Collection attempt outside operational hours',
      },
      severity: 'MEDIUM',
    });

    throw new Error(`Collection only allowed between ${hours.start} and ${hours.end}`);
  }

  // Check for duplicate collection today
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  const existingCollection = await Collection.findOne({
    houseId,
    collectionDate: { $gte: today },
  });

  if (existingCollection) {
    await FraudLog.create({
      agentId,
      houseId,
      reasonCode: 'DUPLICATE_SCAN',
      details: {
        agentLatitude: agentLat,
        agentLongitude: agentLon,
        additionalInfo: 'House already collected today',
      },
      severity: 'LOW',
    });

    throw new Error('This house has already been collected today');
  }

  // GPS Validation
  if (house.isGPSActive) {
    // House has GPS set, validate proximity
    const isNearby = isWithinRadius(
      house.latitude,
      house.longitude,
      agentLat,
      agentLon,
      config.validation.gpsRadius
    );

    if (!isNearby) {
      const distance = require('../utils/gpsCalculator.js').calculateDistance(
        house.latitude,
        house.longitude,
        agentLat,
        agentLon
      );

      await FraudLog.create({
        agentId,
        houseId,
        reasonCode: 'GPS_OUT_OF_RANGE',
        details: {
          agentLatitude: agentLat,
          agentLongitude: agentLon,
          targetLatitude: house.latitude,
          targetLongitude: house.longitude,
          distance: Math.round(distance),
          additionalInfo: `Agent ${Math.round(distance)}m away, max allowed: ${config.validation.gpsRadius}m`,
        },
        severity: distance > config.validation.gpsRadius * 2 ? 'HIGH' : 'MEDIUM',
      });

      throw new Error(`GPS validation failed. Must be within ${config.validation.gpsRadius}m of house location`);
    }
  } else {
    // First scan - set house GPS coordinates
    await updateHouseGPS(houseId, agentLat, agentLon);
  }

  // Create collection record
  const collection = await Collection.create({
    houseId,
    agentId,
    vanId,
    agentLatitude: agentLat,
    agentLongitude: agentLon,
    solidWaste: solidWaste || 0,
    plasticWaste: plasticWaste || 0,
    organicWaste: organicWaste || 0,
    eWaste: eWaste || 0,
    totalWaste,
    collectionDate: new Date(),
    status: 'COLLECTED',
    notes,
  });

  return await collection.populate('houseId agentId vanId');
};

/**
 * Get collections for a GP
 */
export const getCollectionsByGP = async (gpId, filters = {}) => {
  // Get houses in this GP
  const houses = await House.find({ gpId }).select('_id');
  const houseIds = houses.map(h => h._id);

  const query = { houseId: { $in: houseIds }, ...filters };

  const collections = await Collection.find(query)
    .populate('houseId')
    .populate('agentId')
    .populate('vanId')
    .sort({ collectionDate: -1 });

  return collections;
};

/**
 * Get waste statistics for a GP
 */
export const getWasteStats = async (gpId, startDate, endDate) => {
  // Get houses in this GP
  const houses = await House.find({ gpId }).select('_id');
  const houseIds = houses.map(h => h._id);

  const matchStage = {
    houseId: { $in: houseIds },
  };

  if (startDate || endDate) {
    matchStage.collectionDate = {};
    if (startDate) matchStage.collectionDate.$gte = new Date(startDate);
    if (endDate) matchStage.collectionDate.$lte = new Date(endDate);
  }

  const stats = await Collection.aggregate([
    { $match: matchStage },
    {
      $group: {
        _id: null,
        totalCollections: { $sum: 1 },
        totalWaste: { $sum: '$totalWaste' },
        solidWaste: { $sum: '$solidWaste' },
        plasticWaste: { $sum: '$plasticWaste' },
        organicWaste: { $sum: '$organicWaste' },
        eWaste: { $sum: '$eWaste' },
      },
    },
  ]);

  return stats[0] || {
    totalCollections: 0,
    totalWaste: 0,
    solidWaste: 0,
    plasticWaste: 0,
    organicWaste: 0,
    eWaste: 0,
  };
};
