import mongoose from 'mongoose'

const WastePointSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    description: { type: String },
    location_name: { type: String },
    latitude: { type: Number, required: true },
    longitude: { type: Number, required: true },
    district: { type: String },
    capacity: { type: Number, default: 100 },
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
  },
  {
    timestamps: true,
  }
)

const WastePoint = mongoose.models.WastePoint || mongoose.model('WastePoint', WastePointSchema)

export default WastePoint
