import mongoose from 'mongoose'

const VehicleSchema = new mongoose.Schema(
  {
    vehicle_id: { type: String, required: true, unique: true },
    name: { type: String, required: true },
    lat: { type: Number, required: true },
    lng: { type: Number, required: true },
    area: { type: String },
    address: { type: String },
    status: {
      type: String,
      enum: ['active', 'maintenance', 'inactive'],
      default: 'active',
    },
    load: { type: Number, min: 0, max: 100, default: 0 },
    driver_name: { type: String },
    assigned_route: { type: String },
    lastUpdated: { type: Date, default: Date.now },
  },
  {
    timestamps: true,
  }
)

const Vehicle = mongoose.models.Vehicle || mongoose.model('Vehicle', VehicleSchema)

export default Vehicle
