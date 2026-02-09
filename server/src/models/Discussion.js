import mongoose from 'mongoose'

const DiscussionSchema = new mongoose.Schema(
  {
    author_id: { type: String, required: true, ref: 'User' },
    title: { type: String }, // Optional
    content: { type: String }, // Optional
    tags: { type: [String] },
    image_url: { type: String },
    likes: { type: [String], default: [] }, // Array of User IDs
    comments: [
      {
        author_id: { type: String, required: true },
        author_name: { type: String }, // Cache name for easier display
        text: { type: String, required: true },
        created_at: { type: Date, default: Date.now },
      },
    ],
    likes_count: { type: Number, default: 0 },
    replies_count: { type: Number, default: 0 },
    is_pinned: { type: Boolean, default: false },
  },
  {
    timestamps: true,
  }
)

const Discussion = mongoose.models.Discussion || mongoose.model('Discussion', DiscussionSchema)

export default Discussion
