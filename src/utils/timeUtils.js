const moment = require('moment');
const { TIME_CONSTANTS } = require('../constants');

/**
 * Generate daily timestamps from start date to end date
 * @param {Date|string|number} startDate - Start date
 * @param {Date|string|number} endDate - End date (default: today)
 * @returns {number[]} Array of Unix timestamps
 */
function generateDailyTimestamps(startDate, endDate = new Date()) {
  const timestamps = [];
  const start = moment(startDate).startOf('day');
  const end = moment(endDate).startOf('day');

  if (!start.isValid() || !end.isValid()) {
    throw new Error('Invalid date provided');
  }

  if (start.isAfter(end)) {
    throw new Error('Start date cannot be after end date');
  }

  while (start.isSameOrBefore(end)) {
    timestamps.push(start.unix());
    start.add(1, 'day');
  }

  return timestamps;
}

/**
 * Generate hourly timestamps for a given day
 * @param {Date|string|number} date - Target date
 * @returns {number[]} Array of Unix timestamps for each hour
 */
function generateHourlyTimestamps(date) {
  const timestamps = [];
  const start = moment(date).startOf('day');

  if (!start.isValid()) {
    throw new Error('Invalid date provided');
  }

  for (let i = 0; i < 24; i++) {
    timestamps.push(start.clone().add(i, 'hour').unix());
  }

  return timestamps;
}

/**
 * Get the start of day for a given timestamp
 * @param {number} timestamp - Unix timestamp
 * @returns {number} Start of day timestamp
 */
function getStartOfDay(timestamp) {
  return moment.unix(timestamp).startOf('day').unix();
}

/**
 * Get the end of day for a given timestamp
 * @param {number} timestamp - Unix timestamp
 * @returns {number} End of day timestamp
 */
function getEndOfDay(timestamp) {
  return moment.unix(timestamp).endOf('day').unix();
}

/**
 * Check if timestamp is within last N days
 * @param {number} timestamp - Unix timestamp
 * @param {number} days - Number of days
 * @returns {boolean}
 */
function isWithinLastNDays(timestamp, days) {
  const targetDate = moment.unix(timestamp);
  const daysAgo = moment().subtract(days, 'days');
  return targetDate.isAfter(daysAgo);
}

/**
 * Check if timestamp is within last N hours
 * @param {number} timestamp - Unix timestamp
 * @param {number} hours - Number of hours
 * @returns {boolean}
 */
function isWithinLastNHours(timestamp, hours) {
  const targetDate = moment.unix(timestamp);
  const hoursAgo = moment().subtract(hours, 'hours');
  return targetDate.isAfter(hoursAgo);
}

/**
 * Format timestamp for display
 * @param {number} timestamp - Unix timestamp
 * @param {string} format - Moment.js format string
 * @returns {string} Formatted date string
 */
function formatTimestamp(timestamp, format = 'YYYY-MM-DD HH:mm:ss UTC') {
  return moment.unix(timestamp).utc().format(format);
}

/**
 * Get timestamp for N days ago
 * @param {number} days - Number of days ago
 * @returns {number} Unix timestamp
 */
function getDaysAgoTimestamp(days) {
  return moment().subtract(days, 'days').unix();
}

/**
 * Get timestamp for N hours ago
 * @param {number} hours - Number of hours ago
 * @returns {number} Unix timestamp
 */
function getHoursAgoTimestamp(hours) {
  return moment().subtract(hours, 'hours').unix();
}

/**
 * Convert various date formats to Unix timestamp
 * @param {Date|string|number} date - Date to convert
 * @returns {number} Unix timestamp
 */
function toUnixTimestamp(date) {
  const momentDate = moment(date);
  if (!momentDate.isValid()) {
    throw new Error('Invalid date provided');
  }
  return momentDate.unix();
}

/**
 * Convert Unix timestamp to Date object
 * @param {number} timestamp - Unix timestamp
 * @returns {Date} Date object
 */
function fromUnixTimestamp(timestamp) {
  return moment.unix(timestamp).toDate();
}

/**
 * Get the difference between two timestamps in various units
 * @param {number} timestamp1 - First timestamp
 * @param {number} timestamp2 - Second timestamp
 * @param {string} unit - Unit of measurement (seconds, minutes, hours, days)
 * @returns {number} Difference in specified unit
 */
function getTimeDifference(timestamp1, timestamp2, unit = 'seconds') {
  const diff = Math.abs(timestamp1 - timestamp2);

  switch (unit) {
  case 'minutes':
    return diff / 60;
  case 'hours':
    return diff / TIME_CONSTANTS.HOUR;
  case 'days':
    return diff / TIME_CONSTANTS.DAY;
  default:
    return diff;
  }
}

/**
 * Check if a timestamp is valid
 * @param {number} timestamp - Unix timestamp to validate
 * @returns {boolean} True if valid
 */
function isValidTimestamp(timestamp) {
  if (typeof timestamp !== 'number' || isNaN(timestamp)) {
    return false;
  }

  // Check if timestamp is in reasonable range (after 1970 and before year 3000)
  return timestamp > 0 && timestamp < 32503680000;
}

/**
 * Get the closest timestamp to a target from an array of timestamps
 * @param {number} target - Target timestamp
 * @param {number[]} timestamps - Array of timestamps to search
 * @returns {number|null} Closest timestamp or null if array is empty
 */
function getClosestTimestamp(target, timestamps) {
  if (!timestamps || timestamps.length === 0) {
    return null;
  }

  return timestamps.reduce((closest, current) => {
    return Math.abs(current - target) < Math.abs(closest - target)
      ? current
      : closest;
  });
}

/**
 * Round timestamp to nearest interval
 * @param {number} timestamp - Unix timestamp
 * @param {number} interval - Interval in seconds
 * @returns {number} Rounded timestamp
 */
function roundToInterval(timestamp, interval) {
  return Math.round(timestamp / interval) * interval;
}

/**
 * Get timestamps for common intervals (daily, hourly, etc.)
 * @param {string} interval - Interval type ('daily', 'hourly', 'weekly')
 * @param {number} count - Number of intervals to generate
 * @param {Date} endDate - End date (default: now)
 * @returns {number[]} Array of timestamps
 */
function getIntervalTimestamps(interval, count, endDate = new Date()) {
  const timestamps = [];
  let current = moment(endDate);

  for (let i = 0; i < count; i++) {
    timestamps.unshift(current.unix());
    current.subtract(1, interval);
  }

  return timestamps;
}

module.exports = {
  generateDailyTimestamps,
  generateHourlyTimestamps,
  getStartOfDay,
  getEndOfDay,
  isWithinLastNDays,
  isWithinLastNHours,
  formatTimestamp,
  getDaysAgoTimestamp,
  getHoursAgoTimestamp,
  toUnixTimestamp,
  fromUnixTimestamp,
  getTimeDifference,
  isValidTimestamp,
  getClosestTimestamp,
  roundToInterval,
  getIntervalTimestamps
};
