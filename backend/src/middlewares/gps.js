import { calculateDistance, isValidCoordinates } from '../utils/gpsCalculator.js';
import { config } from '../config/environment.js';
import { FraudLog } from '../models/FraudLog.js';

/**
 * Validate GPS coordinates in request
 */
export const validateGPSCoordinates = (req, res, next) => {
  const { latitude, longitude } = req.body;

  if (!isValidCoordinates(latitude, longitude)) {
    return res.status(400).json({
      success: false,
      message: 'Invalid GPS coordinates',
    });
  }

  next();
};

/**
 * Validate GPS proximity to a target location
 * Used for verifying agent is at house/dump site location
 */
export const validateProximity = (targetLat, targetLon, radius = null) => {
  return async (req, res, next) => {
    const { latitude: agentLat, longitude: agentLon } = req.body;
    const maxRadius = radius || config.validation.gpsRadius;

    if (!targetLat || !targetLon) {
      return res.status(400).json({
        success: false,
        message: 'Target location not available',
      });
    }

    const distance = calculateDistance(targetLat, targetLon, agentLat, agentLon);

    if (distance > maxRadius) {
      // Log fraud attempt
      await FraudLog.create({
        agentId: req.agentId || req.user._id,
        houseId: req.houseId,
        dumpSiteId: req.dumpSiteId,
        reasonCode: 'GPS_OUT_OF_RANGE',
        details: {
          agentLatitude: agentLat,
          agentLongitude: agentLon,
          targetLatitude: targetLat,
          targetLongitude: targetLon,
          distance: Math.round(distance),
          additionalInfo: `Agent ${Math.round(distance)}m away, max allowed: ${maxRadius}m`,
        },
        severity: distance > maxRadius * 2 ? 'HIGH' : 'MEDIUM',
      });

      return res.status(403).json({
        success: false,
        message: `GPS validation failed. You must be within ${maxRadius}m of the location. Current distance: ${Math.round(distance)}m`,
        code: 'GPS_OUT_OF_RANGE',
      });
    }

    // Attach distance to request for logging
    req.validatedDistance = distance;
    next();
  };
};
