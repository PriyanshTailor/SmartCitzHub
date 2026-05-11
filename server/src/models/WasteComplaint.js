import mongoose from 'mongoose'

const WasteComplaintSchema = new mongoose.Schema(
  {
    user_id: { type: String, required: true, ref: 'User' },
    citizen_name: { type: String, required: true },
    title: { type: String, required: true },
    description: { type: String, required: true },
    complaint_type: {
      type: String,
      enum: ['overflowing_bin', 'collection_request', 'damaged_facility', 'improper_disposal', 'other'],
      required: true,
    },
    status: {
      type: String,
      enum: ['open', 'acknowledged', 'in_progress', 'resolved', 'closed'],
      default: 'open',
    },
    priority: {
      type: String,
      enum: ['low', 'medium', 'high', 'urgent'],
      default: 'medium',
    },
    location_name: { type: String },
    latitude: { type: Number },
    longitude: { type: Number },
    district: { type: String },
    image_url: { type: String },
    admin_notes: { type: String },
    phone: { type: String },
    email: { type: String },
  },
  {
    timestamps: true,
  }
)

const WasteComplaint = mongoose.models.WasteComplaint || mongoose.model('WasteComplaint', WasteComplaintSchema)

export default WasteComplaint
