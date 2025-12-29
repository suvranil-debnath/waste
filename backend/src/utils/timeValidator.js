import { config } from '../config/environment.js';

/**
 * Check if current time is within operational hours
 * @returns {boolean} True if within operational hours
 */
export const isWithinOperationalHours = () => {
  const now = new Date();
  const currentTime = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
  
  const startTime = config.validation.operationalHours.start;
  const endTime = config.validation.operationalHours.end;
  
  return currentTime >= startTime && currentTime <= endTime;
};

/**
 * Get current time in HH:MM format
 * @returns {string} Current time
 */
export const getCurrentTime = () => {
  const now = new Date();
  return `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
};

/**
 * Get operational hours range
 * @returns {object} Start and end times
 */
export const getOperationalHours = () => {
  return {
    start: config.validation.operationalHours.start,
    end: config.validation.operationalHours.end,
  };
};
