import mongoose from 'mongoose'

const WastePointSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    seed_key: { type: String, index: true },
    description: { type: String },
    location_name: { type: String },
    address: { type: String },
    latitude: { type: Number, required: true },
    longitude: { type: Number, required: true },
    district: { type: String },
    ward: { type: String },
    capacity: { type: Number, default: 100 },
    fill_level: { type: Number, min: 0, max: 100, default: 0 },
    hours: { type: String, default: '8:00 AM - 6:00 PM' },
    assigned_vehicle_id: { type: String },
    waste_type: {
      type: String,
      enum: ['general', 'organic', 'recyclable', 'hazardous'],
      default: 'general',
    },
    status: {
      type: String,
      enum: ['operational', 'full', 'maintenance'],
      default: 'operational',
    },
    last_emptied: { type: Date },
    last_collected_at: { type: Date },
    is_deleted: { type: Boolean, default: false },
    deleted_at: { type: Date },
  },
  {
    timestamps: true,
  }
)

const WastePoint = mongoose.models.WastePoint || mongoose.model('WastePoint', WastePointSchema)

export default WastePoint
