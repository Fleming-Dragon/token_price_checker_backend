const TokenPrice = require('../models/TokenPrice');

class InterpolationService {
  // Main interpolation method
  async interpolatePrice(token, network, targetTimestamp) {
    try {
      console.log(
        `🧮 Interpolating price for ${token} on ${network} at ${targetTimestamp}`
      );

      // Find nearest prices before and after target timestamp
      const [beforePrice, afterPrice] = await TokenPrice.findNearestPrices(
        token,
        network,
        targetTimestamp
      );

      // Check if we have both before and after prices
      if (!beforePrice || !afterPrice) {
        console.warn(
          `⚠️ Insufficient data for interpolation: before=${!!beforePrice}, after=${!!afterPrice}`
        );
        return null;
      }

      // Check if timestamps are too far apart (more than 7 days)
      const maxGap = 7 * 24 * 60 * 60; // 7 days in seconds
      const gap = afterPrice.timestamp - beforePrice.timestamp;

      if (gap > maxGap) {
        console.warn(
          `⚠️ Price gap too large for reliable interpolation: ${
            gap / (24 * 60 * 60)
          } days`
        );
        return null;
      }

      // Perform weighted average interpolation
      const interpolatedData = this.calculateInterpolation(
        beforePrice,
        afterPrice,
        targetTimestamp
      );

      // Save interpolated price to database
      const interpolatedPrice = new TokenPrice({
        token: token.toLowerCase(),
        network: network.toLowerCase(),
        date: new Date(targetTimestamp * 1000),
        timestamp: targetTimestamp,
        price: interpolatedData.price,
        source: 'interpolated',
        confidence: interpolatedData.confidence,
        metadata: {
          interpolation: {
            beforeTimestamp: beforePrice.timestamp,
            afterTimestamp: afterPrice.timestamp,
            beforePrice: beforePrice.price,
            afterPrice: afterPrice.price,
            method: 'weighted_average'
          }
        }
      });

      await interpolatedPrice.save();

      return {
        price: interpolatedData.price,
        confidence: interpolatedData.confidence,
        beforePrice: beforePrice.price,
        afterPrice: afterPrice.price,
        beforeTimestamp: beforePrice.timestamp,
        afterTimestamp: afterPrice.timestamp,
        method: 'weighted_average'
      };
    } catch (error) {
      console.error('Error in interpolatePrice:', error);
      throw error;
    }
  }

  // Calculate interpolated price using weighted average
  calculateInterpolation(beforePrice, afterPrice, targetTimestamp) {
    const tsBefore = beforePrice.timestamp;
    const tsAfter = afterPrice.timestamp;
    const tsTarget = targetTimestamp;

    // Calculate the ratio of where target timestamp falls between before and after
    const ratio = (tsTarget - tsBefore) / (tsAfter - tsBefore);

    // Weighted average interpolation
    const interpolatedPrice =
      beforePrice.price + ratio * (afterPrice.price - beforePrice.price);

    // Calculate confidence based on time gap and price volatility
    const confidence = this.calculateConfidence(beforePrice, afterPrice, ratio);

    return {
      price: parseFloat(interpolatedPrice.toFixed(8)), // Round to 8 decimal places
      confidence: confidence
    };
  }

  // Calculate confidence score for interpolated price
  calculateConfidence(beforePrice, afterPrice, ratio) {
    // Base confidence starts at 0.8 for interpolated data
    let confidence = 0.8;

    // Reduce confidence if prices are very different (high volatility)
    const priceChange =
      Math.abs(afterPrice.price - beforePrice.price) / beforePrice.price;
    if (priceChange > 0.5) {
      // More than 50% change
      confidence *= 0.7;
    } else if (priceChange > 0.2) {
      // More than 20% change
      confidence *= 0.85;
    }

    // Reduce confidence if interpolating near the edges
    if (ratio < 0.1 || ratio > 0.9) {
      confidence *= 0.9;
    }

    // Reduce confidence based on time gap
    const timeGap = afterPrice.timestamp - beforePrice.timestamp;
    const hoursGap = timeGap / 3600; // Convert to hours

    if (hoursGap > 48) {
      // More than 2 days
      confidence *= 0.8;
    } else if (hoursGap > 24) {
      // More than 1 day
      confidence *= 0.9;
    }

    return Math.max(0.1, Math.min(1.0, confidence)); // Clamp between 0.1 and 1.0
  }

  // Advanced interpolation methods
  async interpolateWithTrend(token, network, targetTimestamp) {
    try {
      // Get more data points for trend analysis
      const prices = await TokenPrice.find({
        token: token.toLowerCase(),
        network: network.toLowerCase(),
        timestamp: {
          $gte: targetTimestamp - 7 * 24 * 60 * 60, // 7 days before
          $lte: targetTimestamp + 7 * 24 * 60 * 60 // 7 days after
        }
      }).sort({ timestamp: 1 });

      if (prices.length < 3) {
        // Fall back to simple interpolation
        return await this.interpolatePrice(token, network, targetTimestamp);
      }

      // Implement trend-based interpolation
      // This could use linear regression or moving averages
      console.log(
        `📈 Using trend-based interpolation with ${prices.length} data points`
      );

      // For now, fall back to simple interpolation
      // TODO: Implement advanced trend analysis
      return await this.interpolatePrice(token, network, targetTimestamp);
    } catch (error) {
      console.error('Error in trend-based interpolation:', error);
      throw error;
    }
  }

  // Validate interpolation quality
  validateInterpolation(beforePrice, afterPrice, interpolatedPrice) {
    // Check if interpolated price is within reasonable bounds
    const minPrice = Math.min(beforePrice.price, afterPrice.price) * 0.5;
    const maxPrice = Math.max(beforePrice.price, afterPrice.price) * 2;

    if (interpolatedPrice < minPrice || interpolatedPrice > maxPrice) {
      console.warn('⚠️ Interpolated price outside reasonable bounds');
      return false;
    }

    return true;
  }

  // Get interpolation statistics
  async getInterpolationStats(token = null, network = null) {
    try {
      const filter = { source: 'interpolated' };

      if (token) filter.token = token.toLowerCase();
      if (network) filter.network = network.toLowerCase();

      const stats = await TokenPrice.aggregate([
        { $match: filter },
        {
          $group: {
            _id: null,
            count: { $sum: 1 },
            avgConfidence: { $avg: '$confidence' },
            minConfidence: { $min: '$confidence' },
            maxConfidence: { $max: '$confidence' }
          }
        }
      ]);

      return (
        stats[0] || {
          count: 0,
          avgConfidence: 0,
          minConfidence: 0,
          maxConfidence: 0
        }
      );
    } catch (error) {
      console.error('Error getting interpolation stats:', error);
      throw error;
    }
  }
}

module.exports = new InterpolationService();
