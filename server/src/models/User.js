import mongoose from 'mongoose'

const UserSchema = new mongoose.Schema(
  {
    _id: { type: String, required: true, default: () => new mongoose.Types.ObjectId().toString() },
    email: { type: String, required: true, unique: true },
    password: { type: String, select: false },
    full_name: { type: String },
    user_type: {
      type: String,
      enum: ['citizen', 'official', 'admin'],
      default: 'citizen',
    },
    avatar_url: { type: String },
    bio: { type: String },
    phone: { type: String },
    location: { type: String },
    district: { type: String },
  },
  {
    timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' },
  }
)

const User = mongoose.models.User || mongoose.model('User', UserSchema)

export default User
