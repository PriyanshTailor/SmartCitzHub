import mongoose from 'mongoose'

const ReportSchema = new mongoose.Schema(
  {
    user_id: { type: String, required: true, ref: 'User' },
    title: { type: String, required: true },
    description: { type: String, required: true },
    category: { type: String, required: true },
    status: {
      type: String,
      enum: ['open', 'in_progress', 'resolved', 'closed'],
      default: 'open',
    },
    priority: {
      type: String,
      enum: ['low', 'medium', 'high'],
      default: 'medium',
    },
    location_name: { type: String },
    latitude: { type: Number },
    longitude: { type: Number },
    district: { type: String },
    image_url: { type: String },
    upvotes: { type: Number, default: 0 },
    comments_count: { type: Number, default: 0 },
  },
  {
    timestamps: true,
  }
)

const Report = mongoose.models.Report || mongoose.model('Report', ReportSchema)

export default Report
