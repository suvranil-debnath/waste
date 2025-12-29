import QRCode from 'qrcode';
import { v4 as uuidv4 } from 'uuid';

/**
 * Generate unique QR code data for a house
 * @param {string} houseId - MongoDB ObjectId as string
 * @param {string} houseNumber - House number
 * @param {string} gpId - Gram Panchayat/Municipality ID
 * @returns {string} Unique QR code identifier
 */
export const generateHouseQRData = (houseId, houseNumber, gpId) => {
  return `HOUSE:${houseId}:${houseNumber}:${gpId}:${uuidv4()}`;
};

/**
 * Generate unique QR code data for a dumping site
 * @param {string} dumpSiteId - MongoDB ObjectId as string
 * @param {string} dumpSiteName - Dumping site name
 * @param {string} gpId - Gram Panchayat/Municipality ID
 * @returns {string} Unique QR code identifier
 */
export const generateDumpSiteQRData = (dumpSiteId, dumpSiteName, gpId) => {
  return `DUMP:${dumpSiteId}:${dumpSiteName}:${gpId}:${uuidv4()}`;
};

/**
 * Generate QR code as base64 image
 * @param {string} data - Data to encode in QR code
 * @returns {Promise<string>} Base64 encoded QR code image
 */
export const generateQRCodeBase64 = async (data) => {
  try {
    return await QRCode.toDataURL(data, {
      errorCorrectionLevel: 'M',
      type: 'image/png',
      width: 300,
      margin: 2,
    });
  } catch (error) {
    throw new Error(`QR code generation failed: ${error.message}`);
  }
};

/**
 * Generate QR code as buffer
 * @param {string} data - Data to encode in QR code
 * @returns {Promise<Buffer>} QR code as buffer
 */
export const generateQRCodeBuffer = async (data) => {
  try {
    return await QRCode.toBuffer(data, {
      errorCorrectionLevel: 'M',
      type: 'image/png',
      width: 300,
      margin: 2,
    });
  } catch (error) {
    throw new Error(`QR code generation failed: ${error.message}`);
  }
};

/**
 * Parse QR code data
 * @param {string} qrData - QR code data string
 * @returns {object} Parsed QR data
 */
export const parseQRData = (qrData) => {
  try {
    const parts = qrData.split(':');
    const type = parts[0]; // 'HOUSE' or 'DUMP'
    
    if (type === 'HOUSE') {
      return {
        type: 'HOUSE',
        houseId: parts[1],
        houseNumber: parts[2],
        gpId: parts[3],
        uuid: parts[4],
      };
    } else if (type === 'DUMP') {
      return {
        type: 'DUMP',
        dumpSiteId: parts[1],
        dumpSiteName: parts[2],
        gpId: parts[3],
        uuid: parts[4],
      };
    }
    
    throw new Error('Invalid QR code format');
  } catch (error) {
    throw new Error(`QR code parsing failed: ${error.message}`);
  }
};
