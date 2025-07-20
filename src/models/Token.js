const mongoose = require("mongoose");

const tokenSchema = new mongoose.Schema(
  {
    address: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
      validate: {
        validator: function (v) {
          return /^0x[a-fA-F0-9]{40}$/.test(v);
        },
        message: "Address must be a valid Ethereum address",
      },
    },
    network: {
      type: String,
      required: true,
      enum: ["ethereum", "polygon"],
      lowercase: true,
    },
    symbol: {
      type: String,
      required: true,
      uppercase: true,
      trim: true,
      maxlength: 20,
    },
    name: {
      type: String,
      required: true,
      trim: true,
      maxlength: 100,
    },
    decimals: {
      type: Number,
      required: true,
      min: 0,
      max: 18,
    },
    totalSupply: {
      type: String,
      required: false,
    },
    logo: {
      type: String,
      required: false,
      validate: {
        validator: function (v) {
          return !v || /^https?:\/\/.+/.test(v);
        },
        message: "Logo must be a valid URL",
      },
    },
    description: {
      type: String,
      required: false,
      maxlength: 1000,
    },
    website: {
      type: String,
      required: false,
      validate: {
        validator: function (v) {
          return !v || /^https?:\/\/.+/.test(v);
        },
        message: "Website must be a valid URL",
      },
    },
    creationTimestamp: {
      type: Number,
      required: false,
    },
    creationDate: {
      type: Date,
      required: false,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    metadata: {
      type: mongoose.Schema.Types.Mixed,
      required: false,
    },
  },
  {
    timestamps: true,
    collection: "tokens",
  }
);

// Compound indexes
tokenSchema.index({ address: 1, network: 1 }, { unique: true });
tokenSchema.index({ symbol: 1, network: 1 });
tokenSchema.index({ network: 1, isActive: 1 });
tokenSchema.index({ creationTimestamp: 1 });

// Methods
tokenSchema.methods.toJSON = function () {
  const obj = this.toObject();
  delete obj.__v;
  return obj;
};

// Static methods
tokenSchema.statics.findBySymbol = function (symbol, network = null) {
  const query = { symbol: symbol.toUpperCase(), isActive: true };
  if (network) {
    query.network = network.toLowerCase();
  }
  return this.find(query);
};

tokenSchema.statics.findByAddress = function (address, network = null) {
  const query = { address: address.toLowerCase(), isActive: true };
  if (network) {
    query.network = network.toLowerCase();
  }
  return this.findOne(query);
};

const DEFAULT_SEARCH_LIMIT = 10;

tokenSchema.statics.searchTokens = function (
  searchTerm,
  network = null,
  limit = DEFAULT_SEARCH_LIMIT
) {
  const query = {
    isActive: true,
    $or: [
      { symbol: { $regex: searchTerm, $options: "i" } },
      { name: { $regex: searchTerm, $options: "i" } },
    ],
  };

  if (network) {
    query.network = network.toLowerCase();
  }

  return this.find(query).limit(limit).sort({ symbol: 1 });
};

// Pre-save middleware
const MILLISECONDS_IN_SECOND = 1000;

tokenSchema.pre("save", function (next) {
  // Convert address to lowercase
  if (this.address) {
    this.address = this.address.toLowerCase();
  }

  // Convert network to lowercase
  if (this.network) {
    this.network = this.network.toLowerCase();
  }

  // Convert symbol to uppercase
  if (this.symbol) {
    this.symbol = this.symbol.toUpperCase();
  }

  // Set creation date from timestamp if not provided
  if (this.creationTimestamp && !this.creationDate) {
    this.creationDate = new Date(
      this.creationTimestamp * MILLISECONDS_IN_SECOND
    );
  }

  next();
});

module.exports = mongoose.model("Token", tokenSchema);
