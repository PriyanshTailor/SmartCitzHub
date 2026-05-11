import mongoose from 'mongoose'

const InitiativeSchema = new mongoose.Schema(
  {
    creator_id: { type: String, required: true, ref: 'User' },
    title: { type: String, required: true },
    description: { type: String, required: true },
    category: { type: String },
    status: {
      type: String,
      enum: ['active', 'completed', 'cancelled'],
      default: 'active',
    },
    start_date: { type: Date },
    end_date: { type: Date },
    location_name: { type: String },
    latitude: { type: Number },
    longitude: { type: Number },
    district: { type: String },
    participants_count: { type: Number, default: 0 },
    image_url: { type: String },
  },
  {
    timestamps: true,
  }
)

const Initiative = mongoose.models.Initiative || mongoose.model('Initiative', InitiativeSchema)

export default Initiative
