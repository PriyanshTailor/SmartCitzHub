import mongoose from 'mongoose'

const WasteScheduleSchema = new mongoose.Schema(
  {
    location_name: { type: String, required: true },
    district: { type: String },
    collection_day: { type: String, required: true },
    collection_time: { type: String, required: true },
    waste_type: { type: String, required: true },
  },
  {
    timestamps: true,
  }
)

const WasteSchedule = mongoose.models.WasteSchedule || mongoose.model('WasteSchedule', WasteScheduleSchema)

export default WasteSchedule
