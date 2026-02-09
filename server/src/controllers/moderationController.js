import Moderation from '../models/Moderation.js'
import Report from '../models/Report.js'
import Discussion from '../models/Discussion.js'
// Import other models if needed

export const flagContent = async (req, res) => {
    try {
        const { contentId, contentType, reason } = req.body

        // Validate inputs
        if (!contentId || !contentType || !reason) {
            return res.status(400).json({ error: 'Missing required fields' })
        }

        const newFlag = await Moderation.create({
            contentId,
            contentType, // Ensure this matches Model name (Report, Discussion)
            reason,
            flaggedBy: req.user.sub
        })

        res.status(201).json({ success: true, flag: newFlag })
    } catch (error) {
        console.error('Flag Content Error:', error)
        res.status(500).json({ error: 'Failed to flag content' })
    }
}

export const getFlags = async (req, res) => {
    try {
        const { status } = req.query
        const query = status && status !== 'all' ? { status } : {}

        const flags = await Moderation.find(query)
            .populate('flaggedBy', 'full_name email')
            .populate('contentId') // This might need more specific handling depending on robustness of dynamic ref
            .sort({ createdAt: -1 })
            .lean()

        // Enrich with content details manually if populate simple refPath isn't sufficient or for uniform response
        // For now, simple populate should work if contentType matches Model name

        res.json(flags)
    } catch (error) {
        console.error('Get Flags Error:', error)
        res.status(500).json({ error: 'Failed to fetch flags' })
    }
}

export const resolveFlag = async (req, res) => {
    try {
        const { id } = req.params
        const { action, comments } = req.body // action: 'approve' (keep content, dismiss flag) or 'reject' (delete content)

        const flag = await Moderation.findById(id)
        if (!flag) return res.status(404).json({ error: 'Flag not found' })

        if (action === 'reject') {
            // "Reject" the content -> Delete it (or mark as hidden)
            // Check contentType and delete from respective collection
            if (flag.contentType === 'Report') {
                await Report.findByIdAndDelete(flag.contentId)
            } else if (flag.contentType === 'Discussion') {
                await Discussion.findByIdAndDelete(flag.contentId)
            }

            flag.status = 'resolved' // Flag is resolved because we took action
            flag.adminComments = `Content Deleted. ${comments || ''}`
        } else if (action === 'dismiss') {
            // "Dismiss" the flag -> Keep content
            flag.status = 'rejected' // The FLAG is rejected (content is approved)
            flag.adminComments = `Flag Dismissed. ${comments || ''}`
        } else {
            return res.status(400).json({ error: 'Invalid action' })
        }

        flag.resolvedBy = req.user.sub
        flag.resolvedAt = new Date()
        await flag.save()

        res.json({ success: true, flag })
    } catch (error) {
        console.error('Resolve Flag Error:', error)
        res.status(500).json({ error: 'Failed to resolve flag' })
    }
}
