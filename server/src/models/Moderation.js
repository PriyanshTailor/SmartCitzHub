import mongoose from 'mongoose'

const moderationSchema = new mongoose.Schema({
    contentId: {
        type: mongoose.Schema.Types.ObjectId,
        required: true,
        refPath: 'contentType' // Dynamic reference based on contentType
    },
    contentType: {
        type: String,
        required: true,
        enum: ['Report', 'Discussion', 'Comment'] // Matches model names
    },
    reason: {
        type: String,
        required: true
    },
    flaggedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    status: {
        type: String,
        enum: ['pending', 'reviewed', 'resolved', 'rejected'],
        default: 'pending'
    },
    adminComments: {
        type: String
    },
    resolvedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    },
    resolvedAt: {
        type: Date
    }
}, {
    timestamps: true
})

export default mongoose.model('Moderation', moderationSchema)
