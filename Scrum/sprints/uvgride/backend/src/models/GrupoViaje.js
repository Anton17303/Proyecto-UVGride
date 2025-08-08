const { Schema, model } = require('mongoose');

const LocationSchema = new Schema({
  lat: { type: Number, required: true },
  lng: { type: Number, required: true },
  address: { type: String, required: true }
}, { _id: false });

const TripGroupSchema = new Schema({
  driverId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  vehicleId: { type: Schema.Types.ObjectId, ref: 'Vehicle', required: false },
  origin: { type: LocationSchema, required: true },
  destination: { type: LocationSchema, required: true },
  waypoints: { type: [LocationSchema], default: [] },

  departureTime: { type: Date, required: true, index: true },
  seatsTotal: { type: Number, required: true, min: 1 },
  seatsAvailable: { type: Number, required: true, min: 0 },

  pricePerSeat: { type: Number, default: 0 },
  rules: { type: String, default: '' },

  visibility: { type: String, enum: ['PUBLIC', 'PRIVATE'], default: 'PUBLIC' },
  status: { type: String, enum: ['OPEN', 'CLOSED', 'CANCELLED'], default: 'OPEN', index: true },

  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
}, { versionKey: false });

TripGroupSchema.pre('save', function(next){
  this.updatedAt = new Date();
  next();
});

module.exports = model('TripGroup', TripGroupSchema);
