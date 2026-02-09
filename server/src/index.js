import express from 'express'
import cors from 'cors'
import dotenv from 'dotenv'
import jwt from 'jsonwebtoken'
import bcrypt from 'bcryptjs'
import multer from 'multer'
import { z } from 'zod'
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'
import { connectDB } from './db.js'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
import User from './models/User.js'
import Report from './models/Report.js'
import Initiative from './models/Initiative.js'
import Notification from './models/Notification.js'
import Discussion from './models/Discussion.js'
import CrowdInsight from './models/CrowdInsight.js'
import WastePoint from './models/WastePoint.js'
import WasteSchedule from './models/WasteSchedule.js'
import WasteComplaint from './models/WasteComplaint.js'
import dashboardRoutes from './routes/dashboardRoutes.js'
import mapRoutes from './routes/mapRoutes.js'
import transitRoutes from './routes/transitRoutes.js'
import moderationRoutes from './routes/moderationRoutes.js'
import chatRoutes from './routes/chat.routes.js'
import { authenticateToken } from './middleware/auth.js'

dotenv.config()
console.log("Loaded Mongo URI:", process.env.MONGODB_URI)


const app = express()
const upload = multer({ storage: multer.memoryStorage() })

app.use(cors())
app.use(express.json({ limit: '5mb' }))
app.use(express.urlencoded({ extended: true }))

const JWT_SECRET = process.env.JWT_SECRET || 'dev_secret'


// Mount Dashboard Routes
app.use('/api/dashboard', dashboardRoutes)

// Mount Map Routes (Traffic & Environmental Data)
app.use('/api/map', mapRoutes)

// Mount Transit Routes
app.use('/api/transit', transitRoutes)

// Mount Moderation Routes
app.use('/api/moderation', moderationRoutes)

// Mount Chat Routes
app.use('/api/chat', chatRoutes)

function signToken(user) {
  return jwt.sign(
    {
      sub: user._id,
      email: user.email,
      user_type: user.user_type,
      full_name: user.full_name,
    },
    JWT_SECRET,
    { expiresIn: '7d' }
  )
}

// Auth middleware moved to ./middleware/auth.js

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok' })
})

app.post('/api/auth/signup', async (req, res) => {
  const schema = z.object({
    email: z.string().email(),
    password: z.string().min(6),
    fullName: z.string().min(2),
    role: z.enum(['citizen', 'official', 'admin']).default('citizen'),
  })

  try {
    const body = schema.parse(req.body)
    await connectDB()

    const existingUser = await User.findOne({ email: body.email })
    if (existingUser) {
      return res.status(400).json({ error: 'User already exists' })
    }

    const hashedPassword = await bcrypt.hash(body.password, 10)

    const newUser = await User.create({
      email: body.email,
      password: hashedPassword,
      full_name: body.fullName,
      user_type: body.role,
    })

    const token = signToken(newUser)

    res.status(201).json({
      success: true,
      token,
      user: {
        id: newUser._id.toString(),
        email: newUser.email,
        full_name: newUser.full_name,
        user_type: newUser.user_type,
      },
    })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: error.errors })
    }
    console.error('Signup error:', error)
    return res.status(500).json({ error: 'Internal server error' })
  }
})

app.post('/api/auth/login', async (req, res) => {
  const schema = z.object({
    email: z.string().email(),
    password: z.string().min(6),
  })

  try {
    const body = schema.parse(req.body)
    await connectDB()

    const user = await User.findOne({ email: body.email }).select('+password')
    if (!user || !user.password) {
      return res.status(401).json({ error: 'Invalid email or password' })
    }

    const passwordsMatch = await bcrypt.compare(body.password, user.password)
    if (!passwordsMatch) {
      return res.status(401).json({ error: 'Invalid email or password' })
    }

    const token = signToken(user)

    res.json({
      token,
      user: {
        id: user._id.toString(),
        email: user.email,
        full_name: user.full_name,
        user_type: user.user_type,
      },
    })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: error.errors })
    }
    console.error('Login error:', error)
    res.status(500).json({ error: 'Internal server error' })
  }
})

app.get('/api/user/profile', authenticateToken, async (req, res) => {
  try {
    await connectDB()
    const userProfile = await User.findById(req.user.sub).lean()
    if (!userProfile) return res.status(404).json({ error: 'User not found' })

    return res.json({
      id: userProfile._id,
      full_name: userProfile.full_name,
      user_type: userProfile.user_type,
      email: userProfile.email,
      phone: userProfile.phone || '',
      location: userProfile.location || '',
      district: userProfile.district || '',
    })
  } catch (error) {
    console.error('Get User Profile Error:', error)
    res.status(500).json({ error: 'Internal server error' })
  }
})

app.patch('/api/user/profile', authenticateToken, async (req, res) => {
  try {
    const { full_name, phone, location, district } = req.body
    await connectDB()

    const updatedUser = await User.findByIdAndUpdate(
      req.user.sub,
      { $set: { full_name, phone, location, district } },
      { new: true }
    ).select('-password')

    return res.json({
      success: true,
      user: {
        id: updatedUser._id,
        full_name: updatedUser.full_name,
        user_type: updatedUser.user_type,
        email: updatedUser.email,
        phone: updatedUser.phone,
        location: updatedUser.location,
        district: updatedUser.district,
      }
    })
  } catch (error) {
    console.error('Update User Profile Error:', error)
    res.status(500).json({ error: 'Failed to update profile' })
  }
})

app.get('/api/public/reports', async (req, res) => {
  try {
    await connectDB()
    const reports = await Report.find({ status: { $in: ['open', 'in_progress'] } })
      .sort({ createdAt: -1 })
      .limit(3)
      .lean()

    if (!reports || reports.length === 0) {
      return res.json([
        {
          id: 'm1',
          title: 'Pothole on 5th Avenue',
          category: 'pothole',
          location: 'Downtown',
          time: 'Just now',
          status: 'open',
          description: 'Large pothole in the middle of the intersection causing traffic slowdowns.',
          image: '/issue-reporting.jpg',
        },
        {
          id: 'm2',
          title: 'Street Light Malfunction',
          category: 'lighting',
          location: 'West End',
          time: '2 hours ago',
          status: 'in_progress',
          description: 'Street light flickering constantly near the park entrance.',
          image: '/waste-tracking.jpg',
        },
        {
          id: 'm3',
          title: 'Garbage Collection Missed',
          category: 'garbage',
          location: 'North District',
          time: 'Yesterday',
          status: 'open',
          description: 'Trash bins were not collected for the entire block.',
          image: '/crowd-insights.jpg',
        },
      ])
    }

    return res.json(
      reports.map((r) => ({
        id: r._id.toString(),
        title: r.title,
        category: r.category,
        location: r.location_name || 'City Center',
        time: new Date(r.createdAt).toLocaleDateString(),
        status: r.status,
        description: r.description,
        image: r.image_url,
      }))
    )
  } catch (error) {
    console.error('Get Recent Public Reports Error:', error)
    return res.json([
      {
        id: 'm1',
        title: 'Pothole on 5th Avenue',
        category: 'pothole',
        location: 'Downtown',
        time: 'Just now',
        status: 'open',
        description: 'Large pothole in the middle of the intersection causing traffic slowdowns.',
        image: '/issue-reporting.jpg',
      },
      {
        id: 'm2',
        title: 'Street Light Malfunction',
        category: 'lighting',
        location: 'West End',
        time: '2 hours ago',
        status: 'in_progress',
        description: 'Street light flickering constantly near the park entrance.',
        image: '/waste-tracking.jpg',
      },
      {
        id: 'm3',
        title: 'Garbage Collection Missed',
        category: 'garbage',
        location: 'North District',
        time: 'Yesterday',
        status: 'open',
        description: 'Trash bins were not collected for the entire block.',
        image: '/crowd-insights.jpg',
      },
    ])
  }
})

app.get('/api/reports', authenticateToken, async (req, res) => {
  try {
    await connectDB()
    const reports = await Report.find({ user_id: req.user.sub }).sort({ createdAt: -1 }).lean()

    if (!reports || reports.length === 0) {
      return res.json([
        {
          _id: 'ur1',
          user_id: req.user.sub,
          title: 'Broken Bench in Park',
          description: 'The wooden bench near the fountain is split in half.',
          category: 'maintenance',
          status: 'open',
          latitude: 40.7128,
          longitude: -74.006,
          image_url: '/issue-reporting.jpg',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        },
        {
          _id: 'ur2',
          user_id: req.user.sub,
          title: 'Graffiti on School Wall',
          description: 'Offensive graffiti needs removal immediately.',
          category: 'vandalism',
          status: 'in_progress',
          latitude: 40.758,
          longitude: -73.9855,
          image_url: '/waste-tracking.jpg',
          createdAt: new Date(Date.now() - 86400000).toISOString(),
          updatedAt: new Date().toISOString(),
        },
      ])
    }

    return res.json(
      reports.map((report) => ({
        ...report,
        _id: report._id.toString(),
        createdAt: report.createdAt.toISOString(),
        updatedAt: report.updatedAt.toISOString(),
      }))
    )
  } catch (error) {
    console.error('Get User Reports Error:', error)
    res.json([])
  }
})

app.get('/api/reports/:id', authenticateToken, async (req, res) => {
  try {
    await connectDB()
    const report = await Report.findById(req.params.id).lean()
    if (!report) return res.status(404).json({ error: 'Report not found' })

    return res.json({
      ...report,
      _id: report._id.toString(),
      createdAt: report.createdAt.toISOString(),
      updatedAt: report.updatedAt.toISOString(),
    })
  } catch (error) {
    console.error('Get Report By ID Error:', error)
    res.status(500).json({ error: 'Internal server error' })
  }
})

app.post('/api/reports', authenticateToken, upload.single('image_file'), async (req, res) => {
  try {
    const { title, description, category, latitude, longitude, priority } = req.body
    let image_url = ''

    if (req.file && req.file.buffer) {
      const base64String = req.file.buffer.toString('base64')
      const mimeType = req.file.mimetype
      image_url = `data:${mimeType};base64,${base64String}`
    }

    await connectDB()

    const newReport = await Report.create({
      user_id: req.user.sub,
      title,
      description,
      category,
      latitude: latitude ? parseFloat(latitude) : undefined,
      longitude: longitude ? parseFloat(longitude) : undefined,
      image_url,
      status: 'open',
      priority: priority || 'medium',
    })

    return res.json({ success: true, reportId: newReport._id.toString() })
  } catch (error) {
    console.error('Create Report Error:', error)
    res.status(500).json({ error: 'Failed to create report' })
  }
})

app.get('/api/admin/stats', authenticateToken, async (req, res) => {
  try {
    await connectDB()
    const totalUsers = await User.countDocuments()
    const totalReports = await Report.countDocuments()
    const resolvedReports = await Report.countDocuments({ status: 'resolved' })
    const openReports = await Report.countDocuments({ status: 'open' })

    return res.json({
      totalUsers,
      totalReports,
      resolvedReports,
      openReports,
    })
  } catch (error) {
    console.error('Get Admin Stats Error:', error)
    res.json({
      totalUsers: 0,
      totalReports: 0,
      resolvedReports: 0,
      openReports: 0,
    })
  }
})

app.get("/api/admin/reports", authenticateToken, async (req, res) => {
  try {
    await connectDB();

    // 🔐 Allow admin and official users
    if (req.user.user_type !== "admin" && req.user.user_type !== "official") {
      return res.status(403).json({ error: "Access denied. Admins only." });
    }

    const reports = await Report.find().sort({ createdAt: -1 }).lean();

    console.log(`[Admin Reports] Found ${reports.length} reports`);

    // ✅ Optional: Add fallback mock data if empty
    if (!reports || reports.length === 0) {
      return res.json([
        {
          _id: "mock1",
          title: "Demo Report",
          description: "Example admin report",
          category: "pothole",
          status: "open",
          priority: "medium",
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        },
      ]);
    }

    const formattedReports = reports.map((r) => ({
      _id: r._id.toString(),
      title: r.title,
      description: r.description,
      category: r.category,
      status: r.status || "open",
      priority: r.priority,
      location_name: r.location_name,
      latitude: r.latitude,
      longitude: r.longitude,
      district: r.district,
      image_url: r.image_url,
      upvotes: r.upvotes || 0,
      user_id: r.user_id,
      createdAt: typeof r.createdAt === 'string' ? r.createdAt : (r.createdAt?.toISOString?.() || new Date().toISOString()),
      updatedAt: typeof r.updatedAt === 'string' ? r.updatedAt : (r.updatedAt?.toISOString?.() || new Date().toISOString()),
    }));

    return res.json(formattedReports);
  } catch (error) {
    console.error("Get All Reports Admin Error:", error);
    return res.status(500).json({ error: error.message });
  }
});


app.patch('/api/admin/reports/:id/status', authenticateToken, async (req, res) => {
  try {
    await connectDB()
    await Report.findByIdAndUpdate(req.params.id, { status: req.body.status })
    return res.json({ success: true })
  } catch (error) {
    console.error('Update Report Status Error:', error)
    return res.status(500).json({ error: 'Failed to update report status' })
  }
})

app.get('/api/admin/users', authenticateToken, async (req, res) => {
  try {
    await connectDB()
    const users = await User.find().sort({ created_at: -1 }).lean()

    return res.json(
      users.map((user) => ({
        id: user._id.toString(),
        email: user.email,
        full_name: user.full_name || null,
        user_type: user.user_type,
        created_at: user.created_at?.toISOString?.() || new Date().toISOString(),
      }))
    )
  } catch (error) {
    console.error('Get Admin Users Error:', error)
    return res.json([])
  }
})

// Admin: Get department-wise statistics
app.get('/api/admin/department-stats', authenticateToken, async (req, res) => {
  try {
    await connectDB()

    // Define departments
    const departments = [
      'Water & Sanitation',
      'Roads & Transport',
      'Waste Management',
      'Electricity',
      'Public Safety',
      'Parks & Recreation',
      'Building & Construction'
    ]

    const stats = await Promise.all(
      departments.map(async (dept) => {
        const total = await Report.countDocuments({ category: dept })
        const resolved = await Report.countDocuments({ category: dept, status: 'resolved' })
        const pending = total - resolved

        return {
          name: dept,
          total,
          resolved,
          pending
        }
      })
    )

    // Filter out departments with no reports and sort by total descending
    const filteredStats = stats.filter(s => s.total > 0).sort((a, b) => b.total - a.total)

    return res.json(filteredStats)
  } catch (error) {
    console.error('Get Department Stats Error:', error)
    return res.json([])
  }
})

// Admin: Get ward-wise statistics
app.get('/api/admin/ward-stats', authenticateToken, async (req, res) => {
  try {
    await connectDB()

    // Get all reports grouped by ward/location
    const reports = await Report.find().lean()

    // Group by ward (assuming location field contains ward info)
    const wardMap = {}

    reports.forEach((report) => {
      // Extract ward from location or assign to general area
      let ward = 'Ward 1' // default
      if (report.location) {
        // Simple ward extraction logic - can be enhanced based on actual data
        const wardMatch = report.location.match(/Ward\s+(\d+)/i)
        if (wardMatch) {
          ward = `Ward ${wardMatch[1]}`
        } else {
          // Assign to wards based on hash of location for demo
          const hash = report.location.split('').reduce((a, c) => a + c.charCodeAt(0), 0)
          ward = `Ward ${(hash % 8) + 1}`
        }
      }

      if (!wardMap[ward]) {
        wardMap[ward] = 0
      }
      wardMap[ward]++
    })

    // Convert to array and determine severity
    const wardStats = Object.entries(wardMap).map(([ward, complaints]) => {
      let severity = 'low'
      if (complaints > 35) severity = 'high'
      else if (complaints >= 20) severity = 'medium'

      return {
        ward,
        complaints,
        severity
      }
    })

    // Sort by ward number
    wardStats.sort((a, b) => {
      const aNum = parseInt(a.ward.match(/\d+/)?.[0] || '0')
      const bNum = parseInt(b.ward.match(/\d+/)?.[0] || '0')
      return aNum - bNum
    })

    return res.json(wardStats)
  } catch (error) {
    console.error('Get Ward Stats Error:', error)
    return res.json([])
  }
})

app.get('/api/community/discussions', async (req, res) => {
  try {
    await connectDB()
    const discussions = await Discussion.find().sort({ createdAt: -1 }).limit(20).lean()

    // Enrich with author details
    // In a real app, use .populate('author_id')
    const enrichedDiscussions = await Promise.all(discussions.map(async (d) => {
      const author = await User.findById(d.author_id).select('full_name').lean()
      return {
        ...d,
        _id: d._id.toString(),
        author: author?.full_name || 'Anonymous',
        author_id: d.author_id,
        image_url: d.image_url,
        likes: d.likes || [],
        comments: d.comments || [],
        created_at: d.createdAt.toISOString(),
      }
    }))

    return res.json(enrichedDiscussions)
  } catch (error) {
    console.error('Get Discussions Error:', error)
    return res.json([])
  }
})

app.post('/api/community/discussions', authenticateToken, upload.single('image_file'), async (req, res) => {
  try {
    const { title, content, tags } = req.body
    let image_url = ''

    if (req.file && req.file.buffer) {
      const base64String = req.file.buffer.toString('base64')
      const mimeType = req.file.mimetype
      image_url = `data:${mimeType};base64,${base64String}`
    }

    // Validation: Require at least title, content, OR image
    if (!title && !content && !image_url) {
      return res.status(400).json({ error: 'Post must have at least a title, content, or image.' })
    }

    await connectDB()
    const newDiscussion = await Discussion.create({
      author_id: req.user.sub,
      title: title || 'Untitled Update', // Provide default if missing
      content: content || '',
      tags: tags ? tags.split(',').map(t => t.trim()) : [],
      image_url,
      likes: [],
      comments: []
    })

    // Notify all other users
    try {
      const usersToNotify = await User.find({ _id: { $ne: req.user.sub } }).select('_id')
      if (usersToNotify.length > 0) {
        const notifications = usersToNotify.map(user => ({
          user_id: user._id,
          type: 'community',
          title: `New Discussion: ${title}`,
          message: `${req.user.full_name || 'A neighbor'} started a new discussion.`,
          related_id: newDiscussion._id,
          is_read: false
        }))
        await Notification.insertMany(notifications)
      }
    } catch (notifyError) {
      console.error('Notification Error:', notifyError)
    }

    return res.json({ success: true, discussion: newDiscussion })
  } catch (error) {
    console.error('Create Discussion Error:', error)
    return res.status(500).json({ error: 'Failed to create discussion', details: error.message })
  }
})

app.post('/api/community/discussions/:id/like', authenticateToken, async (req, res) => {
  try {
    await connectDB()
    const discussion = await Discussion.findById(req.params.id)
    if (!discussion) return res.status(404).json({ error: 'Discussion not found' })

    const userId = req.user.sub
    const isLiked = discussion.likes.includes(userId)

    if (isLiked) {
      discussion.likes = discussion.likes.filter(id => id !== userId)
      discussion.likes_count = Math.max(0, discussion.likes_count - 1)
    } else {
      discussion.likes.push(userId)
      discussion.likes_count += 1
    }

    await discussion.save()
    return res.json({ success: true, likes_count: discussion.likes_count, is_liked: !isLiked })
  } catch (error) {
    console.error('Like Discussion Error:', error)
    return res.status(500).json({ error: 'Failed to toggle like' })
  }
})

app.post('/api/community/discussions/:id/comment', authenticateToken, async (req, res) => {
  try {
    const { text } = req.body
    if (!text) return res.status(400).json({ error: 'Comment text required' })

    await connectDB()
    const discussion = await Discussion.findById(req.params.id)
    if (!discussion) return res.status(404).json({ error: 'Discussion not found' })

    const comment = {
      author_id: req.user.sub,
      author_name: req.user.full_name || 'User',
      text,
      created_at: new Date()
    }

    discussion.comments.push(comment)
    discussion.replies_count += 1
    await discussion.save()

    return res.json({ success: true, comment })
  } catch (error) {
    console.error('Comment Discussion Error:', error)
    return res.status(500).json({ error: 'Failed to add comment' })
  }
})

app.get('/api/community/members', async (req, res) => {
  try {
    await connectDB()
    const members = await User.find().limit(8).select('full_name user_type').lean()

    return res.json(
      members.map((m) => ({
        id: m._id.toString(),
        name: m.full_name || 'Unknown',
        role: m.user_type,
        avatar_url: null,
      }))
    )
  } catch (error) {
    console.error('Get Members Error:', error)
    return res.json([])
  }
})

app.get('/api/crowd/insights', async (req, res) => {
  try {
    await connectDB()
    const insights = await CrowdInsight.find().sort({ createdAt: -1 }).limit(20).lean()

    if (!insights || insights.length === 0) {
      return res.json([
        { _id: '1', location_name: 'Central Square', crowd_level: 'high', latitude: 40.7128, longitude: -74.006, reported_at: new Date().toISOString() },
        { _id: '2', location_name: 'Metro Station North', crowd_level: 'medium', latitude: 40.758, longitude: -73.9855, reported_at: new Date().toISOString() },
        { _id: '3', location_name: 'City Park', crowd_level: 'low', latitude: 40.7851, longitude: -73.9683, reported_at: new Date().toISOString() },
        { _id: '4', location_name: 'Downtown Market', crowd_level: 'high', latitude: 40.7306, longitude: -74.0027, reported_at: new Date().toISOString() },
      ])
    }

    return res.json(
      insights.map((insight) => ({
        ...insight,
        _id: insight._id.toString(),
        reported_at: insight.createdAt.toISOString(),
        updatedAt: insight.updatedAt.toISOString(),
      }))
    )
  } catch (error) {
    console.error('Get Crowd Insights Error:', error)
    return res.json([])
  }
})

app.get('/api/initiatives', async (req, res) => {
  try {
    await connectDB()
    const initiatives = await Initiative.find().sort({ createdAt: -1 }).lean()

    if (!initiatives || initiatives.length === 0) {
      return res.json([
        {
          _id: 'i1',
          title: 'Community Garden Cleanup',
          description: 'Help us clean up the community garden and plant new flowers for the spring season.',
          category: 'planting',
          status: 'active',
          participants_count: 15,
          createdAt: new Date().toISOString(),
          creator_id: 'mock_creator',
          start_date: new Date().toISOString(),
        },
        {
          _id: 'i2',
          title: 'Neighborhood Watch Patrol',
          description: 'Organizing a weekly patrol to ensure safety in the neighborhood.',
          category: 'safety',
          status: 'active',
          participants_count: 8,
          createdAt: new Date().toISOString(),
          creator_id: 'mock_creator',
          start_date: new Date().toISOString(),
        },
        {
          _id: 'i3',
          title: 'Recycling Drive',
          description: 'Collectinig e-waste and old batteries for proper disposal.',
          category: 'recycling',
          status: 'completed',
          participants_count: 42,
          createdAt: new Date().toISOString(),
          creator_id: 'mock_creator',
          start_date: new Date().toISOString(),
        },
      ])
    }

    return res.json(
      initiatives.map((init) => ({
        ...init,
        _id: init._id.toString(),
        creator_id: init.creator_id?.toString?.() || init.creator_id,
        start_date: init.start_date?.toISOString(),
        end_date: init.end_date?.toISOString(),
        createdAt: init.createdAt.toISOString(),
        updatedAt: init.updatedAt.toISOString(),
      }))
    )
  } catch (error) {
    console.error('Get Initiatives Error:', error)
    return res.json([])
  }
})

app.post('/api/initiatives', authenticateToken, upload.single('image_file'), async (req, res) => {
  try {
    const { title, description, category, location_name, start_date } = req.body
    let image_url = ''

    if (req.file && req.file.buffer) {
      const base64String = req.file.buffer.toString('base64')
      const mimeType = req.file.mimetype
      image_url = `data:${mimeType};base64,${base64String}`
    }

    await connectDB()
    const newInitiative = await Initiative.create({
      creator_id: req.user.sub,
      title,
      description,
      category,
      location_name,
      start_date: start_date ? new Date(start_date) : undefined,
      participants_count: 1,
      status: 'active',
      image_url,
    })

    return res.json({ success: true, initiative: newInitiative })
  } catch (error) {
    console.error('Create Initiative Error:', error)
    return res.status(500).json({ error: 'Failed to create initiative' })
  }
})

app.get('/api/initiatives/:id', async (req, res) => {
  try {
    await connectDB()
    const initiative = await Initiative.findById(req.params.id).lean()
    if (!initiative) return res.status(404).json({ error: 'Initiative not found' })

    // Check if user has joined (mock check if needed, or real if we track participants array)
    // For now we just return the initiative data
    return res.json({
      ...initiative,
      _id: initiative._id.toString(),
      creator_id: initiative.creator_id.toString(),
      start_date: initiative.start_date?.toISOString(),
      end_date: initiative.end_date?.toISOString(),
      createdAt: initiative.createdAt.toISOString(),
      updatedAt: initiative.updatedAt.toISOString(),
    })
  } catch (error) {
    console.error('Get Initiative Details Error:', error)
    return res.status(500).json({ error: 'Failed to get initiative' })
  }
})

app.post('/api/initiatives/:id/join', authenticateToken, async (req, res) => {
  try {
    await connectDB()
    const initiative = await Initiative.findById(req.params.id)
    if (!initiative) return res.status(404).json({ error: 'Initiative not found' })

    // In a real app, we would add the user ID to a `participants` array to prevent double-joining
    // For now, we just increment the counter as requested
    initiative.participants_count += 1
    await initiative.save()

    return res.json({ success: true, participants_count: initiative.participants_count })
  } catch (error) {
    console.error('Join Initiative Error:', error)
    return res.status(500).json({ error: 'Failed to join initiative' })
  }
})

app.get('/api/map', async (req, res) => {
  try {
    await connectDB()

    const reports = await Report.find({
      latitude: { $ne: null },
      longitude: { $ne: null },
    })
      .select('title category status latitude longitude')
      .lean()

    const wastePoints = await WastePoint.find({
      latitude: { $ne: null },
      longitude: { $ne: null },
    })
      .select('name waste_type latitude longitude')
      .lean()

    return res.json({
      reports: reports.map((r) => ({
        id: r._id.toString(),
        title: r.title,
        category: r.category,
        status: r.status,
        latitude: r.latitude,
        longitude: r.longitude,
      })),
      wastePoints: wastePoints.map((w) => ({
        id: w._id.toString(),
        name: w.name,
        type: w.waste_type === 'recyclable' ? 'recycling' : w.waste_type === 'organic' ? 'composting' : 'landfill',
        latitude: w.latitude,
        longitude: w.longitude,
      })),
    })
  } catch (error) {
    console.error('Get Map Data Error:', error)
    return res.json({ reports: [], wastePoints: [] })
  }
})

app.get('/api/notifications', authenticateToken, async (req, res) => {
  try {
    await connectDB()
    const notifications = await Notification.find({ user_id: req.user.sub }).sort({ createdAt: -1 }).lean()

    return res.json(
      notifications.map((notif) => ({
        ...notif,
        _id: notif._id.toString(),
        user_id: notif.user_id.toString(),
        createdAt: notif.createdAt.toISOString(),
      }))
    )
  } catch (error) {
    console.error('Get Notifications Error:', error)
    return res.json([])
  }
})

app.post('/api/notifications/:id/read', authenticateToken, async (req, res) => {
  try {
    await connectDB()
    await Notification.updateOne({ _id: req.params.id, user_id: req.user.sub }, { is_read: true })
    return res.json({ success: true })
  } catch (error) {
    console.error('Mark Read Error:', error)
    return res.status(500).json({ error: 'Failed to update notification' })
  }
})

app.post('/api/notifications/mark-all', authenticateToken, async (req, res) => {
  try {
    await connectDB()
    await Notification.updateMany({ user_id: req.user.sub, is_read: false }, { is_read: true })
    return res.json({ success: true })
  } catch (error) {
    console.error('Mark All Read Error:', error)
    return res.status(500).json({ error: 'Failed to update notifications' })
  }
})

app.get('/api/waste/points', async (req, res) => {
  try {
    await connectDB()
    let points = await WastePoint.find().lean()

    if (!points || points.length === 0) {
      const defaultPoints = [
        {
          name: 'Central Recycling Center',
          waste_type: 'recyclable',
          latitude: 22.3072,
          longitude: 73.1812,
          location_name: 'Racecourse Road, Vadodara',
          address: 'Racecourse Road, Vadodara',
          district: 'Vadodara',
          hours: '8:00 AM - 6:00 PM',
          status: 'operational',
          capacity: 500
        },
        {
          name: 'Green Earth Compost',
          waste_type: 'organic',
          latitude: 22.3150,
          longitude: 73.1950,
          location_name: 'Fatehgunj, Vadodara',
          address: 'Fatehgunj, Vadodara',
          district: 'Vadodara',
          hours: '9:00 AM - 5:00 PM',
          status: 'operational',
          capacity: 300
        },
        {
          name: 'City Disposal Facility',
          waste_type: 'general',
          latitude: 22.2900,
          longitude: 73.2100,
          location_name: 'Savli Road, Vadodara',
          address: 'Savli Road, Vadodara',
          district: 'Vadodara',
          hours: '7:00 AM - 4:00 PM',
          status: 'operational',
          capacity: 1000
        },
      ]

      try {
        const created = await WastePoint.insertMany(defaultPoints)
        points = created.map(p => p.toObject ? p.toObject() : p)
        console.log('[Waste Point] Created default disposal points')
      } catch (insertErr) {
        console.error('[Waste Point] Error creating defaults:', insertErr)
        points = []
      }
    }

    return res.json(
      points.map((p) => ({
        ...p,
        id: p._id.toString(),
        type: p.waste_type === 'recyclable' ? 'recycling' : p.waste_type === 'organic' ? 'composting' : 'landfill',
        address: p.location_name || p.address || 'Unknown Location',
        hours: p.hours || '8:00 AM - 6:00 PM',
      }))
    )
  } catch (error) {
    console.error('Get Waste Points Error:', error)
    return res.json([])
  }
})

// PUT: Update waste point (admin only)
app.put('/api/admin/waste-points/:pointId', authenticateToken, async (req, res) => {
  try {
    // Check admin access
    if (req.user.user_type !== 'admin' && req.user.user_type !== 'official') {
      return res.status(403).json({ error: 'Access denied. Admins only.' })
    }

    const { pointId } = req.params
    const { name, description, location_name, latitude, longitude, district, waste_type, status, hours } = req.body

    await connectDB()

    const updateData = {}
    if (name) updateData.name = name
    if (description) updateData.description = description
    if (location_name) updateData.location_name = location_name
    if (latitude) updateData.latitude = latitude
    if (longitude) updateData.longitude = longitude
    if (district) updateData.district = district
    if (waste_type) updateData.waste_type = waste_type
    if (status) updateData.status = status
    if (hours) updateData.hours = hours

    const point = await WastePoint.findByIdAndUpdate(pointId, updateData, { new: true }).lean()

    if (!point) {
      return res.status(404).json({ error: 'Waste point not found' })
    }

    console.log(`[Waste Point] Updated ${pointId}`)

    return res.json({
      id: point._id.toString(),
      ...point,
      message: 'Waste point updated successfully',
    })
  } catch (error) {
    console.error('Update Waste Point Error:', error)
    return res.status(500).json({ error: 'Failed to update waste point' })
  }
})

// POST: Create new waste point (admin only)
app.post('/api/admin/waste-points', authenticateToken, async (req, res) => {
  try {
    // Check admin access
    if (req.user.user_type !== 'admin' && req.user.user_type !== 'official') {
      return res.status(403).json({ error: 'Access denied. Admins only.' })
    }

    const { name, description, location_name, latitude, longitude, district, waste_type, status, capacity } = req.body

    if (!name || !latitude || !longitude) {
      return res.status(400).json({ error: 'Name, latitude, and longitude are required' })
    }

    await connectDB()

    const newPoint = new WastePoint({
      name,
      description: description || '',
      location_name: location_name || 'Vadodara',
      latitude,
      longitude,
      district: district || 'Vadodara',
      waste_type: waste_type || 'general',
      status: status || 'operational',
      capacity: capacity || 100,
    })

    await newPoint.save()
    console.log(`[Waste Point] Created new point: ${newPoint._id}`)

    return res.status(201).json({
      id: newPoint._id.toString(),
      ...newPoint.toObject(),
      message: 'Waste point created successfully',
    })
  } catch (error) {
    console.error('Create Waste Point Error:', error)
    return res.status(500).json({ error: 'Failed to create waste point' })
  }
})

// DELETE: Delete waste point (admin only)
app.delete('/api/admin/waste-points/:pointId', authenticateToken, async (req, res) => {
  try {
    // Check admin access
    if (req.user.user_type !== 'admin' && req.user.user_type !== 'official') {
      return res.status(403).json({ error: 'Access denied. Admins only.' })
    }

    const { pointId } = req.params

    await connectDB()

    const deletedPoint = await WastePoint.findByIdAndDelete(pointId)

    if (!deletedPoint) {
      return res.status(404).json({ error: 'Waste point not found' })
    }

    console.log(`[Waste Point] Deleted ${pointId}`)

    return res.json({ message: 'Waste point deleted successfully', id: pointId })
  } catch (error) {
    console.error('Delete Waste Point Error:', error)
    return res.status(500).json({ error: 'Failed to delete waste point' })
  }
})

// GET: Get all waste schedules (admin only)
app.get('/api/admin/waste-schedules', authenticateToken, async (req, res) => {
  try {
    // Check admin access
    if (req.user.user_type !== 'admin' && req.user.user_type !== 'official') {
      return res.status(403).json({ error: 'Access denied. Admins only.' })
    }

    await connectDB()
    let schedules = await WasteSchedule.find().lean()

    // If no schedules exist, create default ones
    if (!schedules || schedules.length === 0) {
      const defaultSchedules = [
        {
          location_name: 'Downtown District',
          district: 'Vadodara',
          collection_day: 'Monday',
          collection_time: '6:00 AM',
          waste_type: 'General Waste',
        },
        {
          location_name: 'North Suburbs',
          district: 'Vadodara',
          collection_day: 'Tuesday',
          collection_time: '7:00 AM',
          waste_type: 'Recycling',
        },
        {
          location_name: 'West End',
          district: 'Vadodara',
          collection_day: 'Wednesday',
          collection_time: '6:30 AM',
          waste_type: 'Compost',
        },
        {
          location_name: 'Business District',
          district: 'Vadodara',
          collection_day: 'Daily',
          collection_time: '8:00 PM',
          waste_type: 'Commercial Waste',
        },
      ]

      try {
        const created = await WasteSchedule.insertMany(defaultSchedules)
        schedules = created.map(s => s.toObject ? s.toObject() : s)
        console.log('[Waste Schedule] Created default schedules')
      } catch (insertErr) {
        console.error('[Waste Schedule] Error creating defaults:', insertErr)
        // Return empty array if insert fails
        schedules = []
      }
    }

    return res.json(
      schedules.map((s) => ({
        id: s._id.toString(),
        location_name: s.location_name,
        district: s.district,
        collection_day: s.collection_day,
        collection_time: s.collection_time,
        waste_type: s.waste_type,
        createdAt: s.createdAt,
        updatedAt: s.updatedAt,
      }))
    )
  } catch (error) {
    console.error('Get Waste Schedules Error:', error)
    return res.status(500).json({ error: 'Failed to fetch schedules' })
  }
})

// POST: Create new waste schedule (admin only)
app.post('/api/admin/waste-schedules', authenticateToken, async (req, res) => {
  try {
    // Check admin access
    if (req.user.user_type !== 'admin' && req.user.user_type !== 'official') {
      return res.status(403).json({ error: 'Access denied. Admins only.' })
    }

    const { location_name, district, collection_day, collection_time, waste_type } = req.body

    if (!location_name || !collection_day || !collection_time || !waste_type) {
      return res.status(400).json({ error: 'Location, collection day, time, and waste type are required' })
    }

    await connectDB()

    const newSchedule = new WasteSchedule({
      location_name,
      district: district || 'Vadodara',
      collection_day,
      collection_time,
      waste_type,
    })

    await newSchedule.save()
    console.log(`[Waste Schedule] Created new schedule: ${newSchedule._id}`)

    return res.status(201).json({
      id: newSchedule._id.toString(),
      location_name: newSchedule.location_name,
      district: newSchedule.district,
      collection_day: newSchedule.collection_day,
      collection_time: newSchedule.collection_time,
      waste_type: newSchedule.waste_type,
      createdAt: newSchedule.createdAt,
      updatedAt: newSchedule.updatedAt,
      message: 'Waste schedule created successfully',
    })
  } catch (error) {
    console.error('Create Waste Schedule Error:', error)
    return res.status(500).json({ error: 'Failed to create waste schedule' })
  }
})

// PUT: Update waste schedule (admin only)
app.put('/api/admin/waste-schedules/:scheduleId', authenticateToken, async (req, res) => {
  try {
    // Check admin access
    if (req.user.user_type !== 'admin' && req.user.user_type !== 'official') {
      return res.status(403).json({ error: 'Access denied. Admins only.' })
    }

    const { scheduleId } = req.params
    const { location_name, district, collection_day, collection_time, waste_type } = req.body

    await connectDB()

    const updateData = {}
    if (location_name) updateData.location_name = location_name
    if (district) updateData.district = district
    if (collection_day) updateData.collection_day = collection_day
    if (collection_time) updateData.collection_time = collection_time
    if (waste_type) updateData.waste_type = waste_type

    const schedule = await WasteSchedule.findByIdAndUpdate(scheduleId, updateData, { new: true }).lean()

    if (!schedule) {
      return res.status(404).json({ error: 'Waste schedule not found' })
    }

    console.log(`[Waste Schedule] Updated ${scheduleId}`)

    return res.json({
      id: schedule._id.toString(),
      location_name: schedule.location_name,
      district: schedule.district,
      collection_day: schedule.collection_day,
      collection_time: schedule.collection_time,
      waste_type: schedule.waste_type,
      createdAt: schedule.createdAt,
      updatedAt: schedule.updatedAt,
      message: 'Waste schedule updated successfully',
    })
  } catch (error) {
    console.error('Update Waste Schedule Error:', error)
    return res.status(500).json({ error: 'Failed to update waste schedule' })
  }
})

// DELETE: Delete waste schedule (admin only)
app.delete('/api/admin/waste-schedules/:scheduleId', authenticateToken, async (req, res) => {
  try {
    // Check admin access
    if (req.user.user_type !== 'admin' && req.user.user_type !== 'official') {
      return res.status(403).json({ error: 'Access denied. Admins only.' })
    }

    const { scheduleId } = req.params

    await connectDB()

    const deletedSchedule = await WasteSchedule.findByIdAndDelete(scheduleId)

    if (!deletedSchedule) {
      return res.status(404).json({ error: 'Waste schedule not found' })
    }

    console.log(`[Waste Schedule] Deleted ${scheduleId}`)

    return res.json({ message: 'Waste schedule deleted successfully', id: scheduleId })
  } catch (error) {
    console.error('Delete Waste Schedule Error:', error)
    return res.status(500).json({ error: 'Failed to delete waste schedule' })
  }
})

// Get waste collection vehicles with live API simulation
app.get('/api/admin/vehicles', authenticateToken, async (req, res) => {
  try {
    // Check admin access
    if (req.user.user_type !== "admin" && req.user.user_type !== "official") {
      return res.status(403).json({ error: "Access denied. Admins only." });
    }

    // Read vehicles from JSON file (simulating live API data)
    const vehiclesPath = path.join(__dirname, '..', 'data', 'vehicles.json');

    const vehicleData = await fs.promises.readFile(vehiclesPath, 'utf8');
    const { vehicles } = JSON.parse(vehicleData);

    //console.log(`[Admin Vehicles] Loaded ${vehicles.length} vehicles`);

    // Simulate real-time updates by slightly varying load and timestamps
    const liveVehicles = vehicles.map((v) => ({
      ...v,
      load: v.status === 'inactive' ? 0 : Math.max(0, v.load + (Math.random() - 0.45) * 5),
      lastUpdated: new Date().toISOString(),
    }));

    return res.json(liveVehicles);
  } catch (error) {
    console.error("Get Admin Vehicles Error:", error);
    return res.status(500).json({ error: error.message, vehicles: [] });
  }
})

// Store for vehicle status updates (in-memory during session)
const vehicleStatusUpdates = new Map();

// Update vehicle status
app.put('/api/admin/vehicles/:vehicleId', authenticateToken, async (req, res) => {
  try {
    // Check admin access
    if (req.user.user_type !== "admin" && req.user.user_type !== "official") {
      return res.status(403).json({ error: "Access denied. Admins only." });
    }

    const { vehicleId } = req.params;
    const { status } = req.body;

    // Validate status
    const validStatuses = ['active', 'maintenance', 'inactive'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({ error: "Invalid status. Must be: active, maintenance, or inactive" });
    }

    // Store the status update
    vehicleStatusUpdates.set(vehicleId, {
      status,
      updatedAt: new Date().toISOString(),
      updatedBy: req.user.email || req.user._id
    });

    console.log(`[Vehicle] Status updated: ${vehicleId} -> ${status}`);

    return res.json({
      id: vehicleId,
      status,
      updatedAt: new Date().toISOString(),
      message: "Vehicle status updated successfully"
    });
  } catch (error) {
    console.error("Update Vehicle Status Error:", error);
    return res.status(500).json({ error: error.message });
  }
})

app.get('/api/waste/schedules', async (req, res) => {
  try {
    await connectDB()
    let schedules = await WasteSchedule.find().lean()

    // If no schedules exist, create default ones
    if (!schedules || schedules.length === 0) {
      const defaultSchedules = [
        {
          location_name: 'Downtown District',
          district: 'Vadodara',
          collection_day: 'Monday',
          collection_time: '6:00 AM',
          waste_type: 'General Waste',
        },
        {
          location_name: 'North Suburbs',
          district: 'Vadodara',
          collection_day: 'Tuesday',
          collection_time: '7:00 AM',
          waste_type: 'Recycling',
        },
        {
          location_name: 'West End',
          district: 'Vadodara',
          collection_day: 'Wednesday',
          collection_time: '6:30 AM',
          waste_type: 'Compost',
        },
        {
          location_name: 'Business District',
          district: 'Vadodara',
          collection_day: 'Daily',
          collection_time: '8:00 PM',
          waste_type: 'Commercial Waste',
        },
      ]

      try {
        const created = await WasteSchedule.insertMany(defaultSchedules)
        schedules = created.map(s => s.toObject ? s.toObject() : s)
        console.log('[Waste Schedule] Created default schedules for citizen view')
      } catch (insertErr) {
        console.error('[Waste Schedule] Error creating defaults:', insertErr)
        schedules = []
      }
    }

    return res.json(
      schedules.map((s) => ({
        id: s._id.toString(),
        location: s.location_name,
        collection_day: s.collection_day,
        collection_time: s.collection_time,
        type: s.waste_type,
      }))
    )
  } catch (error) {
    console.error('Get Waste Schedules Error:', error)
    return res.json([])
  }
})

// POST: Submit waste complaint or collection request
app.post('/api/waste/complaints', authenticateToken, async (req, res) => {
  try {
    await connectDB()

    const {
      title,
      description,
      complaint_type,
      location_name,
      latitude,
      longitude,
      district,
      phone,
      priority,
    } = req.body

    // Validate required fields
    if (!title || !description || !complaint_type) {
      return res.status(400).json({ error: 'Title, description, and complaint type are required' })
    }

    // Create new complaint
    const complaint = new WasteComplaint({
      user_id: req.user.sub || req.user._id,
      citizen_name: req.user.name || req.user.email,
      title,
      description,
      complaint_type,
      location_name: location_name || 'Not specified',
      latitude,
      longitude,
      district,
      phone,
      priority: priority || 'medium',
      status: 'open',
      email: req.user.email,
    })

    await complaint.save()
    console.log(`[Waste Complaint] New complaint submitted: ${complaint._id}`)

    return res.status(201).json({
      id: complaint._id.toString(),
      message: 'Thank you! Your complaint has been submitted successfully.',
      complaint: {
        id: complaint._id.toString(),
        title: complaint.title,
        status: complaint.status,
        createdAt: complaint.createdAt,
      },
    })
  } catch (error) {
    console.error('Submit Waste Complaint Error:', error)
    return res.status(500).json({ error: 'Failed to submit complaint' })
  }
})

// GET: Get user's own waste complaints
app.get('/api/waste/complaints/my-complaints', authenticateToken, async (req, res) => {
  try {
    await connectDB()

    const userId = req.user.sub || req.user._id
    const complaints = await WasteComplaint.find({ user_id: userId })
      .sort({ createdAt: -1 })
      .lean()

    const transformedComplaints = complaints.map((c) => ({
      id: c._id.toString(),
      title: c.title,
      description: c.description,
      complaint_type: c.complaint_type,
      status: c.status,
      priority: c.priority,
      location_name: c.location_name,
      district: c.district,
      phone: c.phone,
      createdAt: c.createdAt,
      updatedAt: c.updatedAt,
    }))

    console.log(`[User Complaints] User ${userId} has ${transformedComplaints.length} complaints`)

    return res.json(transformedComplaints)
  } catch (error) {
    console.error('Get User Complaints Error:', error)
    return res.status(500).json({ error: 'Failed to fetch complaints' })
  }
})

// GET: Get all waste complaints (admin only)
app.get('/api/admin/waste-complaints', authenticateToken, async (req, res) => {
  try {
    // Check admin access
    if (req.user.user_type !== 'admin' && req.user.user_type !== 'official') {
      return res.status(403).json({ error: 'Access denied. Admins only.' })
    }

    await connectDB()

    // Get all complaints sorted by creation date (newest first) and then by priority
    const complaints = await WasteComplaint.find()
      .sort({ createdAt: -1 })
      .lean()

    // Transform for response
    const transformedComplaints = complaints.map((c) => ({
      id: c._id.toString(),
      citizen_name: c.citizen_name,
      title: c.title,
      description: c.description,
      complaint_type: c.complaint_type,
      status: c.status,
      priority: c.priority,
      location_name: c.location_name,
      district: c.district,
      phone: c.phone,
      email: c.email,
      createdAt: c.createdAt,
      updatedAt: c.updatedAt,
      admin_notes: c.admin_notes,
    }))

    console.log(`[Admin] Fetched ${transformedComplaints.length} waste complaints`)

    return res.json(transformedComplaints)
  } catch (error) {
    console.error('Get Waste Complaints Error:', error)
    return res.status(500).json({ error: 'Failed to fetch complaints' })
  }
})

// PUT: Update waste complaint status (admin only)
app.put('/api/admin/waste-complaints/:complaintId', authenticateToken, async (req, res) => {
  try {
    // Check admin access
    if (req.user.user_type !== 'admin' && req.user.user_type !== 'official') {
      return res.status(403).json({ error: 'Access denied. Admins only.' })
    }

    const { complaintId } = req.params
    const { status, admin_notes } = req.body

    // Validate status
    const validStatuses = ['open', 'acknowledged', 'in_progress', 'resolved', 'closed']
    if (status && !validStatuses.includes(status)) {
      return res.status(400).json({ error: 'Invalid status' })
    }

    await connectDB()

    const updateData = {}
    if (status) updateData.status = status
    if (admin_notes) updateData.admin_notes = admin_notes

    const complaint = await WasteComplaint.findByIdAndUpdate(
      complaintId,
      updateData,
      { new: true }
    ).lean()

    if (!complaint) {
      return res.status(404).json({ error: 'Complaint not found' })
    }

    console.log(`[Admin] Updated complaint ${complaintId} status to ${status}`)

    return res.json({
      id: complaint._id.toString(),
      status: complaint.status,
      admin_notes: complaint.admin_notes,
      message: 'Complaint updated successfully',
    })
  } catch (error) {
    console.error('Update Waste Complaint Error:', error)
    return res.status(500).json({ error: 'Failed to update complaint' })
  }
})

const PORT = process.env.PORT || 4000

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`)
})

