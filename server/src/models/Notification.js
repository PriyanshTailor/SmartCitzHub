import mongoose from 'mongoose'

const NotificationSchema = new mongoose.Schema(
  {
    user_id: { type: String, required: true, ref: 'User' },
    type: { type: String, required: true },
    title: { type: String, required: true },
    message: { type: String },
    related_id: { type: String },
    is_read: { type: Boolean, default: false },
  },
  {
    timestamps: { createdAt: true, updatedAt: false },
  }
)

const Notification = mongoose.models.Notification || mongoose.model('Notification', NotificationSchema)

export default Notification
