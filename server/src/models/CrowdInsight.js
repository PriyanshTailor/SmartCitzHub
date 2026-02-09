import mongoose from 'mongoose'

const CrowdInsightSchema = new mongoose.Schema(
  {
    location_name: { type: String, required: true },
    latitude: { type: Number },
    longitude: { type: Number },
    district: { type: String },
    crowd_level: {
      type: String,
      enum: ['low', 'moderate', 'high', 'very_high'],
      default: 'low',
    },
    congestion_level: { type: Number, default: 0 },
    incident_type: { type: String },
    description: { type: String },
    active_users: { type: Number, default: 0 },
    expires_at: { type: Date, default: () => new Date(+new Date() + 4 * 60 * 60 * 1000) },
  },
  {
    timestamps: true,
  }
)

const CrowdInsight = mongoose.models.CrowdInsight || mongoose.model('CrowdInsight', CrowdInsightSchema)

export default CrowdInsight
