import dotenv from 'dotenv';

dotenv.config();

export const config = {
  mongodb: {
    uri: process.env.MONGODB_URI || 'mongodb://localhost:27017/waste-management',
  },
  jwt: {
    secret: process.env.JWT_SECRET || 'fallback-secret-key',
    expiresIn: process.env.JWT_EXPIRES_IN || '24h',
  },
  server: {
    port: process.env.PORT || 5000,
    env: process.env.NODE_ENV || 'development',
  },
  validation: {
    gpsRadius: parseInt(process.env.GPS_VALIDATION_RADIUS) || 50, // meters
    operationalHours: {
      start: process.env.OPERATIONAL_HOURS_START || '06:00',
      end: process.env.OPERATIONAL_HOURS_END || '18:00',
    },
  },
};
