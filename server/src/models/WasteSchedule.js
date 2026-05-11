import mongoose from 'mongoose'

const WasteScheduleSchema = new mongoose.Schema(
  {
    location_name: { type: String, required: true },
    seed_key: { type: String, index: true },
    district: { type: String },
    latitude: { type: Number },
    longitude: { type: Number },
    collection_day: { type: String, required: true },
    collection_time: { type: String, required: true },
    waste_type: { type: String, required: true },
    assigned_vehicle_id: { type: String },
    collection_status: {
      type: String,
      enum: ['scheduled', 'assigned', 'collected'],
      default: 'scheduled',
    },
    last_collected_at: { type: Date },
    is_deleted: { type: Boolean, default: false },
    deleted_at: { type: Date },
  },
  {
    timestamps: true,
  }
)

const WasteSchedule = mongoose.models.WasteSchedule || mongoose.model('WasteSchedule', WasteScheduleSchema)

export default WasteSchedule
