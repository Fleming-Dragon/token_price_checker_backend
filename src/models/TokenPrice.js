const mongoose = require('mongoose');

const tokenPriceSchema = new mongoose.Schema(
  {
    token: {
      type: String,
      required: true,
      index: true,
      lowercase: true,
      trim: true,
      validate: {
        validator: function(v) {
          return /^0x[a-fA-F0-9]{40}$/.test(v);
        },
        message: 'Token must be a valid Ethereum address'
      }
    },
    network: {
      type: String,
      required: true,
      enum: ['ethereum', 'polygon'],
      lowercase: true,
      index: true
    },
    date: {
      type: Date,
      required: true,
      index: true
    },
    timestamp: {
      type: Number,
      required: true,
      index: true
    },
    price: {
      type: Number,
      required: true,
      min: 0
    },
    priceUsd: {
      type: Number,
      required: false,
      min: 0
    },
    volume24h: {
      type: Number,
      required: false,
      min: 0
    },
    marketCap: {
      type: Number,
      required: false,
      min: 0
    },
    source: {
      type: String,
      required: true,
      enum: ['alchemy', 'interpolated', 'external_api', 'manual'],
      default: 'alchemy'
    },
    confidence: {
      type: Number,
      required: false,
      min: 0,
      max: 1,
      default: 1
    },
    metadata: {
      type: mongoose.Schema.Types.Mixed,
      required: false
    }
  },
  {
    timestamps: true,
    collection: 'token_prices'
  }
);

// Compound indexes for efficient queries
tokenPriceSchema.index({ token: 1, network: 1, date: 1 }, { unique: true });
tokenPriceSchema.index({ token: 1, network: 1, timestamp: 1 });
tokenPriceSchema.index({ network: 1, date: 1 });
tokenPriceSchema.index({ source: 1, date: 1 });

// Methods
tokenPriceSchema.methods.toJSON = function() {
  const obj = this.toObject();
  delete obj.__v;
  return obj;
};

// Static methods
tokenPriceSchema.statics.findByTokenAndNetwork = function(
  token,
  network,
  startDate,
  endDate
) {
  const query = { token: token.toLowerCase(), network: network.toLowerCase() };

  if (startDate || endDate) {
    query.date = {};
    if (startDate) query.date.$gte = startDate;
    if (endDate) query.date.$lte = endDate;
  }

  return this.find(query).sort({ date: 1 });
};

tokenPriceSchema.statics.findNearestPrices = function(
  token,
  network,
  targetTimestamp
) {
  return Promise.all([
    // Find price before target timestamp
    this.findOne({
      token: token.toLowerCase(),
      network: network.toLowerCase(),
      timestamp: { $lte: targetTimestamp }
    }).sort({ timestamp: -1 }),

    // Find price after target timestamp
    this.findOne({
      token: token.toLowerCase(),
      network: network.toLowerCase(),
      timestamp: { $gte: targetTimestamp }
    }).sort({ timestamp: 1 })
  ]);
};

tokenPriceSchema.statics.getLatestPrice = function(token, network) {
  return this.findOne({
    token: token.toLowerCase(),
    network: network.toLowerCase()
  }).sort({ timestamp: -1 });
};

tokenPriceSchema.statics.bulkUpsert = async function(priceData) {
  const bulkOps = priceData.map((data) => ({
    updateOne: {
      filter: {
        token: data.token.toLowerCase(),
        network: data.network.toLowerCase(),
        timestamp: data.timestamp
      },
      update: { $set: data },
      upsert: true
    }
  }));

  return this.bulkWrite(bulkOps);
};

// Pre-save middleware
tokenPriceSchema.pre('save', function(next) {
  // Convert token address to lowercase
  if (this.token) {
    this.token = this.token.toLowerCase();
  }

  // Convert network to lowercase
  if (this.network) {
    this.network = this.network.toLowerCase();
  }

  // Set timestamp from date if not provided
  if (this.date && !this.timestamp) {
    this.timestamp = Math.floor(this.date.getTime() / 1000);
  }

  next();
});

module.exports = mongoose.model('TokenPrice', tokenPriceSchema);
