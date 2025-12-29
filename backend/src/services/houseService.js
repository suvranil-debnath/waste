import { House } from '../models/House.js';
import { generateHouseQRData, generateQRCodeBase64 } from '../utils/qrGenerator.js';

/**
 * Create a new house with QR code
 */
export const createHouse = async (houseData, gpId) => {
  const { houseNumber, ownerName, address, zoneId, totalMembers } = houseData;

  // Check if house number already exists in this GP
  const existingHouse = await House.findOne({ houseNumber, gpId });
  if (existingHouse) {
    throw new Error('House number already exists in this GP');
  }

  // Create house without QR first to get ID
  const house = new House({
    houseNumber,
    ownerName,
    address,
    gpId,
    zoneId,
    totalMembers: totalMembers || 1,
    qrCode: 'TEMP', // Temporary value
  });

  await house.save();

  // Generate QR code data using the house ID
  const qrData = generateHouseQRData(house._id.toString(), houseNumber, gpId.toString());
  
  // Update house with actual QR code
  house.qrCode = qrData;
  await house.save();

  // Generate QR code image (base64)
  const qrCodeImage = await generateQRCodeBase64(qrData);

  return {
    house,
    qrCodeImage,
  };
};

/**
 * Get houses by GP ID
 */
export const getHousesByGP = async (gpId, filters = {}) => {
  const query = { gpId, isActive: true, ...filters };

  const houses = await House.find(query)
    .populate('zoneId')
    .populate('assignedVanId')
    .sort({ createdAt: -1 });

  return houses;
};

/**
 * Get house by QR code
 */
export const getHouseByQR = async (qrCode) => {
  const house = await House.findOne({ qrCode })
    .populate('zoneId')
    .populate('gpId')
    .populate('assignedVanId');

  if (!house) {
    throw new Error('House not found');
  }

  return house;
};

/**
 * Update house GPS coordinates (first scan)
 */
export const updateHouseGPS = async (houseId, latitude, longitude) => {
  const house = await House.findById(houseId);

  if (!house) {
    throw new Error('House not found');
  }

  if (house.isGPSActive) {
    throw new Error('House GPS already set');
  }

  house.latitude = latitude;
  house.longitude = longitude;
  house.isGPSActive = true;
  house.gpsSetDate = new Date();

  await house.save();

  return house;
};

/**
 * Update house details
 */
export const updateHouse = async (houseId, updates) => {
  const house = await House.findByIdAndUpdate(
    houseId,
    { $set: updates },
    { new: true, runValidators: true }
  ).populate('zoneId').populate('assignedVanId');

  if (!house) {
    throw new Error('House not found');
  }

  return house;
};

/**
 * Get house statistics for GP
 */
export const getHouseStats = async (gpId) => {
  const total = await House.countDocuments({ gpId, isActive: true });
  const activeGPS = await House.countDocuments({ gpId, isGPSActive: true, isActive: true });
  const pendingGPS = await House.countDocuments({ gpId, isGPSActive: false, isActive: true });
  
  const membersAggregate = await House.aggregate([
    { $match: { gpId, isActive: true } },
    { $group: { _id: null, totalMembers: { $sum: '$totalMembers' } } }
  ]);

  const totalMembers = membersAggregate[0]?.totalMembers || 0;

  return {
    total,
    activeGPS,
    pendingGPS,
    totalMembers,
  };
};
