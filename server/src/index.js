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
import axios from 'axios'
import { startMLPredictorService, stopMLPredictorService } from './services/mlPredictorService.js'

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
import Vehicle from './models/Vehicle.js'
import dashboardRoutes from './routes/dashboardRoutes.js'
import mapRoutes from './routes/mapRoutes.js'
import transitRoutes from './routes/transitRoutes.js'
import moderationRoutes from './routes/moderationRoutes.js'
import chatRoutes from './routes/chat.routes.js'
import { authenticateToken } from './middleware/auth.js'

dotenv.config()



const app = express()
const upload = multer({ storage: multer.memoryStorage() })

const allowedOrigins = [
  'http://localhost:5173',
  'http://localhost:5174',
  'http://localhost:3000',
  'https://smartcityhub-760i.onrender.com',
]

app.use(cors({
  origin: (origin, callback) => {
    // Allow requests with no origin (e.g. curl, mobile apps)
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true)
    } else {
      callback(new Error(`CORS policy: origin ${origin} is not allowed`))
    }
  },
  credentials: true,
}))
app.use(express.json({ limit: '5mb' }))
app.use(express.urlencoded({ extended: true }))

const JWT_SECRET = process.env.JWT_SECRET || 'dev_secret'

const normalizeWastePoint = (p) => ({
  ...p,
  id: p._id.toString(),
  type: p.waste_type === 'recyclable' ? 'recycling' : p.waste_type === 'organic' ? 'composting' : 'landfill',
  address: p.address || p.location_name || 'Unknown Location',
  hours: p.hours || '8:00 AM - 6:00 PM',
  fill_level: Number.isFinite(p.fill_level) ? p.fill_level : 0,
})

const normalizeWasteSchedule = (s) => ({
  id: s._id.toString(),
  seed_key: s.seed_key,
  location_name: s.location_name,
  district: s.district,
  latitude: s.latitude,
  longitude: s.longitude,
  collection_day: s.collection_day,
  collection_time: s.collection_time,
  waste_type: s.waste_type,
  assigned_vehicle_id: s.assigned_vehicle_id,
  collection_status: s.collection_status || 'scheduled',
  last_collected_at: s.last_collected_at,
  createdAt: s.createdAt,
  updatedAt: s.updatedAt,
})

const normalizeVehicle = (v) => ({
  id: v.vehicle_id,
  name: v.name,
  lat: v.lat,
  lng: v.lng,
  area: v.area,
  address: v.address,
  status: v.status,
  load: v.load,
  driver_name: v.driver_name,
  assigned_route: v.assigned_route,
  lastUpdated: v.lastUpdated,
})

const uniqueBySeedKey = (items) => {
  const seen = new Set()
  return items.filter((item) => {
    if (!item.seed_key) return true
    if (seen.has(item.seed_key)) return false
    seen.add(item.seed_key)
    return true
  })
}

const defaultWastePoints = [
  {
    seed_key: 'waghodia-ankhol-ground-transfer',
    legacy_names: ['Waghodia GIDC Recycling Yard'],
    legacy_location_names: ['GIDC Industrial Area, Waghodia'],
    legacy_addresses: ['Plot No 736, Survey No 1595/P, GIDC Industrial Area, Waghodia, Vadodara, Gujarat 391760'],
    name: 'Ankhol Cricket Ground Waste Transfer Point',
    waste_type: 'general',
    latitude: 22.2950439,
    longitude: 73.2640678,
    location_name: 'Ankhol Cricket Ground, New Waghodia Road',
    address: 'Bus Stop, Ankhol, New Waghodia Road, Vadodara, Gujarat 390019',
    district: 'Vadodara',
    hours: '7:00 AM - 4:00 PM',
    status: 'operational',
    capacity: 1000,
    fill_level: 54,
    ward: 'Waghodia Road',
  },
  {
    seed_key: 'atladara-lake-ground-recycling',
    legacy_names: ['Atladara C&D Waste Processing Site'],
    legacy_location_names: ['Atladara, Vadodara'],
    name: 'Atladara Lake Garden Recycling Point',
    waste_type: 'recyclable',
    latitude: 22.2768,
    longitude: 73.1415,
    location_name: 'Atladara Lake Garden',
    address: 'Atladara Lake Garden, Atladara, Vadodara, Gujarat 390012',
    district: 'Vadodara',
    hours: '7:00 AM - 5:00 PM',
    status: 'operational',
    capacity: 500,
    fill_level: 35,
    ward: 'Atladara',
  },
  {
    seed_key: 'makarpura-srp-ground-compost',
    legacy_names: ['Makarpura GIDC Waste Processing Yard'],
    legacy_location_names: ['Makarpura GIDC, Vadodara'],
    legacy_addresses: ['GIDC Industrial Estate, Makarpura, Vadodara, Gujarat 390010'],
    name: 'Makarpura SRP Ground Compost Point',
    waste_type: 'organic',
    latitude: 22.2673,
    longitude: 73.1841,
    location_name: 'Makarpura SRP Ground',
    address: 'Indulal Yagnik Road, GIDC Industrial Area, Manjalpur, Vadodara, Gujarat 390010',
    district: 'Vadodara',
    hours: '7:30 AM - 5:30 PM',
    status: 'operational',
    capacity: 300,
    fill_level: 50,
    ward: 'Makarpura',
  },
  {
    seed_key: 'ranoli-sports-ground-recycling',
    legacy_names: ['Ranoli Scrap Disposal Yard'],
    legacy_location_names: ['Ranoli Crossing, Vadodara'],
    name: 'Ranoli GIDC Ground Recycling Point',
    waste_type: 'recyclable',
    latitude: 22.4054,
    longitude: 73.1408,
    location_name: 'Ranoli GIDC Ground',
    address: 'Ranoli GIDC Ground, Ranoli, Vadodara, Gujarat 391350',
    district: 'Vadodara',
    hours: '8:00 AM - 6:00 PM',
    status: 'operational',
    capacity: 420,
    fill_level: 38,
    ward: 'Ranoli',
  },
  {
    seed_key: 'navlakhi-ground-transfer',
    legacy_names: ['Navayard Waste Management Yard'],
    legacy_location_names: ['Navayard, Vadodara'],
    name: 'Navlakhi Ground Waste Transfer Point',
    waste_type: 'general',
    latitude: 22.3159,
    longitude: 73.1865,
    location_name: 'Navlakhi Ground, Moti Baug',
    address: 'Jawaharlal Nehru Marg, Moti Baug, Vadodara, Gujarat 390001',
    district: 'Vadodara',
    hours: '8:00 AM - 6:00 PM',
    status: 'operational',
    capacity: 380,
    fill_level: 46,
    ward: 'Moti Baug',
  },
  {
    seed_key: 'tarsali-lake-transfer',
    legacy_names: ['Tarsali Transfer Yard'],
    legacy_location_names: ['Tarsali, Vadodara'],
    name: 'Tarsali Lake Transfer Point',
    waste_type: 'general',
    latitude: 22.2479,
    longitude: 73.1992,
    location_name: 'Tarsali Lake',
    address: 'Tarsali Lake, Tarsali, Vadodara, Gujarat 390009',
    district: 'Vadodara',
    hours: '7:00 AM - 5:00 PM',
    status: 'operational',
    capacity: 450,
    fill_level: 41,
    ward: 'Tarsali',
  },
  {
    seed_key: 'gotri-garden-green-waste',
    legacy_names: ['Gotri Green Waste Yard'],
    legacy_location_names: ['Gotri, Vadodara'],
    legacy_addresses: ['Gotri Garden Road, Gotri, Vadodara, Gujarat 390021'],
    name: 'Gotri Garden Green Waste Point',
    waste_type: 'organic',
    latitude: 22.3149,
    longitude: 73.1323,
    location_name: 'Gotri Garden',
    address: 'Gotri Garden Road, Gotri, Vadodara, Gujarat 390021',
    district: 'Vadodara',
    hours: '7:30 AM - 5:30 PM',
    status: 'operational',
    capacity: 260,
    fill_level: 33,
    ward: 'Gotri',
  },
]

const defaultWasteSchedules = [
  {
    seed_key: 'akota-stadium-monday',
    legacy_names: ['Akota Stadium Collection Zone'],
    location_name: 'Akota Stadium Collection Zone',
    district: 'Vadodara',
    latitude: 22.2967563,
    longitude: 73.1697054,
    collection_day: 'Monday',
    collection_time: '6:30 AM',
    waste_type: 'General Waste',
  },
  {
    seed_key: 'sayaji-baug-tuesday',
    legacy_names: ['Sayaji Baug Garden Collection Zone'],
    location_name: 'Sayaji Baug Garden Collection Zone',
    district: 'Vadodara',
    latitude: 22.3115,
    longitude: 73.1900,
    collection_day: 'Tuesday',
    collection_time: '7:00 AM',
    waste_type: 'Recycling',
  },
  {
    seed_key: 'gotri-garden-wednesday',
    legacy_names: ['Gotri Garden Collection Zone'],
    location_name: 'Gotri Garden Collection Zone',
    district: 'Vadodara',
    latitude: 22.3149,
    longitude: 73.1323,
    collection_day: 'Wednesday',
    collection_time: '6:45 AM',
    waste_type: 'General Waste',
  },
  {
    seed_key: 'karelibaug-water-tank-thursday',
    legacy_names: ['Karelibaug Water Tank Collection Zone'],
    location_name: 'Karelibaug Water Tank Collection Zone',
    district: 'Vadodara',
    latitude: 22.3229,
    longitude: 73.2102,
    collection_day: 'Thursday',
    collection_time: '7:15 AM',
    waste_type: 'Compost',
  },
  {
    seed_key: 'manjalpur-sports-ground-friday',
    legacy_names: ['Manjalpur Sports Ground Collection Zone'],
    location_name: 'Manjalpur Sports Ground Collection Zone',
    district: 'Vadodara',
    latitude: 22.2708,
    longitude: 73.1880,
    collection_day: 'Friday',
    collection_time: '6:30 AM',
    waste_type: 'General Waste',
  },
  {
    seed_key: 'chhani-lake-saturday',
    legacy_names: ['Chhani Jakat Naka Area'],
    location_name: 'Chhani Lake Collection Zone',
    district: 'Vadodara',
    latitude: 22.3613,
    longitude: 73.1662,
    collection_day: 'Saturday',
    collection_time: '6:45 AM',
    waste_type: 'General Waste',
  },
  {
    seed_key: 'makarpura-srp-ground-daily',
    legacy_names: ['Makarpura GIDC Collection Zone'],
    location_name: 'Makarpura SRP Ground Collection Zone',
    district: 'Vadodara',
    latitude: 22.2673,
    longitude: 73.1841,
    collection_day: 'Daily',
    collection_time: '8:00 PM',
    waste_type: 'Commercial Waste',
  },
  {
    seed_key: 'sayaji-baug-gate-saturday',
    legacy_names: ['Sayajigunj Water Tank Collection Zone'],
    location_name: 'Sayaji Baug Gate Collection Zone',
    district: 'Vadodara',
    latitude: 22.3115,
    longitude: 73.1900,
    collection_day: 'Saturday',
    collection_time: '7:00 AM',
    waste_type: 'Recycling',
  },
  {
    seed_key: 'navlakhi-ground-sunday',
    legacy_names: ['Navlakhi Ground Collection Zone'],
    location_name: 'Navlakhi Ground Collection Zone',
    district: 'Vadodara',
    latitude: 22.3159,
    longitude: 73.1865,
    collection_day: 'Sunday',
    collection_time: '6:45 AM',
    waste_type: 'General Waste',
  },
  {
    seed_key: 'sama-sports-complex-monday',
    legacy_names: ['Sama Sports Complex Collection Zone'],
    location_name: 'Sama Sports Complex Collection Zone',
    district: 'Vadodara',
    latitude: 22.3542,
    longitude: 73.1888,
    collection_day: 'Monday',
    collection_time: '7:15 AM',
    waste_type: 'General Waste',
  },
  {
    seed_key: 'lalbaug-garden-tuesday',
    legacy_names: ['Lalbaug Garden Collection Zone'],
    location_name: 'Lalbaug Garden Collection Zone',
    district: 'Vadodara',
    latitude: 22.2934,
    longitude: 73.2089,
    collection_day: 'Tuesday',
    collection_time: '6:40 AM',
    waste_type: 'Organic Waste',
  },
  {
    seed_key: 'gorwa-water-tank-wednesday',
    legacy_names: ['Gorwa Water Tank Collection Zone'],
    location_name: 'Gorwa Water Tank Collection Zone',
    district: 'Vadodara',
    latitude: 22.3346,
    longitude: 73.1617,
    collection_day: 'Wednesday',
    collection_time: '7:10 AM',
    waste_type: 'General Waste',
  },
  {
    seed_key: 'tarsali-lake-thursday',
    legacy_names: ['Tarsali Water Tank Collection Zone'],
    location_name: 'Tarsali Lake Collection Zone',
    district: 'Vadodara',
    latitude: 22.2479,
    longitude: 73.1992,
    collection_day: 'Thursday',
    collection_time: '6:55 AM',
    waste_type: 'General Waste',
  },
  {
    seed_key: 'bapod-talav-friday',
    legacy_names: ['Waghodia Road Water Tank Collection Zone'],
    location_name: 'Bapod Talav Collection Zone',
    district: 'Vadodara',
    latitude: 22.3017,
    longitude: 73.2321,
    collection_day: 'Friday',
    collection_time: '7:05 AM',
    waste_type: 'General Waste',
  },
]

const vehicleAreaAssignments = [
  { area: 'Sayaji Baug Garden', address: 'Sayaji Baug, Kala Goda Circle, Vadodara, Gujarat', lat: 22.3115, lng: 73.1900 },
  { area: 'Akota Stadium', address: 'Akota Stadium, Productivity Road, Akota, Vadodara, Gujarat 390020', lat: 22.2967563, lng: 73.1697054 },
  { area: 'Gotri Garden', address: 'Gotri Garden Road, Gotri, Vadodara, Gujarat 390021', lat: 22.3149, lng: 73.1323 },
  { area: 'Sama Sports Complex', address: 'New Sama Road, Sahkar Nagar 4, Vadodara, Gujarat 390002', lat: 22.3542, lng: 73.1888 },
  { area: 'Manjalpur Sports Complex', address: 'Manjalpur Sports Complex, Vadodara, Gujarat 390011', lat: 22.2708, lng: 73.1880 },
  { area: 'Bapod Talav', address: 'Natvarnagar, Bapod, Waghodia Road, Vadodara, Gujarat 390019', lat: 22.3017, lng: 73.2321 },
]

const legacyVehicleAddresses = new Set([
  'Sayajigunj, Vadodara, Gujarat',
  'Alkapuri, Vadodara, Gujarat',
  'Gotri, Vadodara, Gujarat',
  'Chhani, Vadodara, Gujarat',
  'Manjalpur, Vadodara, Gujarat',
  'Karelibaug, Vadodara, Gujarat',
])

const complaintStatusRank = {
  open: 0,
  acknowledged: 1,
  in_progress: 2,
  resolved: 3,
  closed: 4,
}

const getVehicleAreaAssignment = (vehicle, index = 0) => {
  const numericId = String(vehicle?.vehicle_id || vehicle?.id || '').match(/\d+/)?.[0]
  const assignmentIndex = numericId ? (Number(numericId) - 1) % vehicleAreaAssignments.length : index % vehicleAreaAssignments.length
  return vehicleAreaAssignments[assignmentIndex]
}

const isForwardComplaintTransition = (currentStatus, nextStatus) => {
  if (!nextStatus || currentStatus === nextStatus) return false
  if (currentStatus === 'closed') return false
  return complaintStatusRank[nextStatus] > complaintStatusRank[currentStatus]
}

const getVehicleAssignmentRecord = async (vehicleId) => {
  const [assignedPoint, assignedSchedule] = await Promise.all([
    WastePoint.findOne({ assigned_vehicle_id: vehicleId, is_deleted: { $ne: true } }).lean(),
    WasteSchedule.findOne({
      assigned_vehicle_id: vehicleId,
      collection_status: { $ne: 'collected' },
      is_deleted: { $ne: true },
    }).lean(),
  ])

  return assignedPoint || assignedSchedule
}

const ensureDefaultWastePoints = async () => {
  for (const point of defaultWastePoints) {
    const { legacy_names = [], legacy_location_names = [], legacy_addresses = [], ...pointData } = point

    await WastePoint.updateMany(
      {
        seed_key: { $exists: false },
        $or: [
          { name: { $in: [point.name, ...legacy_names] } },
          { location_name: { $in: [point.location_name, ...legacy_location_names] } },
          { address: { $in: [point.address, ...legacy_addresses] } },
        ],
      },
      { $set: pointData }
    )

    await WastePoint.updateOne(
      { seed_key: point.seed_key },
      { $setOnInsert: pointData },
      { upsert: true }
    )
  }
}

const ensureDefaultWasteSchedules = async () => {
  for (const schedule of defaultWasteSchedules) {
    const { legacy_names = [], ...scheduleData } = schedule

    await WasteSchedule.updateMany(
      {
        seed_key: { $exists: false },
        location_name: { $in: [schedule.location_name, ...legacy_names] },
      },
      { $set: scheduleData }
    )

    await WasteSchedule.updateOne(
      { seed_key: schedule.seed_key },
      { $setOnInsert: scheduleData },
      { upsert: true }
    )
  }
}

const seedVehiclesIfEmpty = async () => {
  const count = await Vehicle.countDocuments()
  if (count > 0) return

  const vehiclesPath = path.join(__dirname, '..', 'data', 'vehicles.json')
  const vehicleData = await fs.promises.readFile(vehiclesPath, 'utf8')
  const { vehicles } = JSON.parse(vehicleData)

  await Vehicle.insertMany(
    vehicles.map((v, index) => {
      const assignedArea = getVehicleAreaAssignment(v, index)
      return {
      vehicle_id: v.id,
      name: v.name,
      lat: assignedArea.lat,
      lng: assignedArea.lng,
      area: assignedArea.area,
      address: assignedArea.address,
      status: v.status,
      load: v.load,
      lastUpdated: v.lastUpdated,
      }
    })
  )
}

const ensureVehicleLocations = async () => {
  const vehicles = await Vehicle.find().sort({ vehicle_id: 1 }).lean()

  for (let index = 0; index < vehicles.length; index += 1) {
    const vehicle = vehicles[index]
    const assignedArea = getVehicleAreaAssignment(vehicle, index)
    const lat = Number(vehicle.lat)
    const lng = Number(vehicle.lng)
    const hasValidCoordinates = Number.isFinite(lat) && Number.isFinite(lng)
    const hasLegacyAddress = !vehicle.address || legacyVehicleAddresses.has(vehicle.address)
    const hasMissingArea = !vehicle.area

    if (hasValidCoordinates && !hasLegacyAddress && !hasMissingArea) continue

    await Vehicle.updateOne(
      { _id: vehicle._id },
      {
        $set: {
          lat: assignedArea.lat,
          lng: assignedArea.lng,
          area: assignedArea.area,
          address: assignedArea.address,
        },
      }
    )
  }
}


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
  console.log('Signup request body:', req.body);
  
  const schema = z.object({
    email: z.string().email(),
    password: z.string().min(6),
    full_name: z.string().min(2),
    user_type: z.enum(['citizen', 'official', 'admin']).default('citizen'),
  })

  try {
    const body = schema.parse(req.body)
    console.log('Parsed body:', body);
     

    const existingUser = await User.findOne({ email: body.email })
    if (existingUser) {
      return res.status(400).json({ error: 'User already exists' })
    }

    const hashedPassword = await bcrypt.hash(body.password, 10)

    const newUser = await User.create({
      email: body.email,
      password: hashedPassword,
      full_name: body.full_name,
      user_type: body.user_type,
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

app.get('/api/complaints', async (req, res) => {
  try {

    const reports = await Report.find({ status: { $in: ['open', 'in_progress'] } })
      .sort({ createdAt: -1 })
      .limit(20)
      .lean()

    if (!reports || reports.length === 0) {
      return res.json([])
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
        user_id: r.user_id,
        created_at: r.createdAt
      }))
    )
  } catch (error) {
    console.error('Get Complaints Error:', error)
    res.status(500).json({ error: 'Internal server error' })
  }
})

app.get('/api/reports', authenticateToken, async (req, res) => {
  try {
     
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
    const { title, description, category, latitude, longitude, priority, is_anonymous } = req.body
    let image_url = ''
    let mlPrediction = null

    // Process image upload
    if (req.file && req.file.buffer) {
      const base64String = req.file.buffer.toString('base64')
      const mimeType = req.file.mimetype
      image_url = `data:${mimeType};base64,${base64String}`

      // Call ML service for image classification
      try {
        const FormData = require('form-data')
        const form = new FormData()
        form.append('image', req.file.buffer, {
          filename: 'image.jpg',
          contentType: mimeType
        })

        const mlResponse = await fetch('http://localhost:5000/classify-issue', {
          method: 'POST',
          body: form
        })

        if (mlResponse.ok) {
          const mlData = await mlResponse.json()
          if (mlData.success) {
            mlPrediction = mlData.prediction
            console.log(`[ML Classification] Predicted: ${mlPrediction.predicted_class} (${mlPrediction.confidence})`)
          }
        }
      } catch (mlError) {
        console.warn('[ML Classification] Failed to classify image:', mlError.message)
        // Continue without ML classification
      }
    }

    // Determine final category (ML prediction or manual input)
    let finalCategory = category
    let isMlClassified = false
    
    if (mlPrediction && mlPrediction.confidence > 0.5) {
      finalCategory = mlPrediction.predicted_class
      isMlClassified = true
    }

    // Generate title if not provided and ML classification exists
    let finalTitle = title
    if (!title && mlPrediction) {
      finalTitle = `${mlPrediction.predicted_class.replace('_', ' ').toUpperCase()} Issue Detected`
    }

    // Generate description if not provided and ML classification exists
    let finalDescription = description
    if (!description && mlPrediction) {
      finalDescription = `AI-detected ${mlPrediction.predicted_class.replace('_', ' ')} issue. Confidence: ${(mlPrediction.confidence * 100).toFixed(1)}%`
    }

    const newReport = await Report.create({
      user_id: req.user.sub,
      title: finalTitle || 'Untitled Report',
      description: finalDescription || 'No description provided',
      category: finalCategory || 'other',
      latitude: latitude ? parseFloat(latitude) : undefined,
      longitude: longitude ? parseFloat(longitude) : undefined,
      image_url,
      status: 'open',
      priority: priority || 'medium',
      // ML fields
      ml_predicted_category: mlPrediction?.predicted_class,
      ml_confidence_score: mlPrediction?.confidence,
      ml_top_predictions: mlPrediction?.top_predictions || [],
      is_ml_classified: isMlClassified,
      is_anonymous: is_anonymous === 'true' || is_anonymous === true,
    })

    console.log(`[Report Created] ID: ${newReport._id}, ML Classified: ${isMlClassified}`)
    return res.json({ 
      success: true, 
      reportId: newReport._id.toString(),
      mlClassified: isMlClassified,
      predictedCategory: mlPrediction?.predicted_class
    })
  } catch (error) {
    console.error('Create Report Error:', error)
    res.status(500).json({ error: 'Failed to create report' })
  }
})

app.get('/api/admin/stats', authenticateToken, async (req, res) => {
  try {
     
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
     ;

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
     
    await Report.findByIdAndUpdate(req.params.id, { status: req.body.status })
    return res.json({ success: true })
  } catch (error) {
    console.error('Update Report Status Error:', error)
    return res.status(500).json({ error: 'Failed to update report status' })
  }
})

app.get('/api/admin/users', authenticateToken, async (req, res) => {
  try {
     
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

    const creatorId = String(req.user.sub)
    const newInitiative = await Initiative.create({
      creator_id: creatorId,
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


app.delete('/api/initiatives/:id', authenticateToken, async (req, res) => {
  try {
     
    const initiative = await Initiative.findById(req.params.id)
    if (!initiative) return res.status(404).json({ error: 'Initiative not found' })

    const userId = String(req.user.sub || req.user.id || req.user._id)
    if (String(initiative.creator_id) !== userId) {
      return res.status(403).json({ error: 'Only the creator can delete this initiative' })
    }

    await Initiative.findByIdAndDelete(req.params.id)
    return res.json({ success: true })
  } catch (error) {
    console.error('Delete Initiative Error:', error)
    return res.status(500).json({ error: 'Failed to delete initiative' })
  }
})

app.patch('/api/initiatives/:id', authenticateToken, async (req, res) => {
  try {
     
    const initiative = await Initiative.findById(req.params.id)
    if (!initiative) return res.status(404).json({ error: 'Initiative not found' })

    const userId = String(req.user.sub || req.user.id || req.user._id)
    if (String(initiative.creator_id) !== userId) {
      return res.status(403).json({ error: 'Only the creator can edit this initiative' })
    }

    // Allowed fields to update
    const { title, description, category, location_name, start_date, status } = req.body

    if (title) initiative.title = title
    if (description) initiative.description = description
    if (category) initiative.category = category
    if (location_name) initiative.location_name = location_name
    if (start_date) initiative.start_date = new Date(start_date)
    if (status && ['active', 'completed', 'paused', 'cancelled'].includes(status)) {
      initiative.status = status
    }

    await initiative.save()

    return res.json({
      success: true,
      initiative: {
        ...initiative.toObject(),
        _id: initiative._id.toString(),
        creator_id: initiative.creator_id.toString(),
        start_date: initiative.start_date?.toISOString(),
        createdAt: initiative.createdAt.toISOString(),
        updatedAt: initiative.updatedAt.toISOString(),
      },
    })
  } catch (error) {
    console.error('Update Initiative Error:', error)
    return res.status(500).json({ error: 'Failed to update initiative' })
  }
})

// ─── ML-Powered Initiative Recommendations ───
const ML_SERVICE_URL = 'http://localhost:5000'

app.get('/api/initiatives/:id/recommend', async (req, res) => {
  try {
     
    const targetId = req.params.id

    // Fetch all initiatives from MongoDB
    let allInitiatives = await Initiative.find().lean()

    // Fallback mock data if DB is empty (same as GET /api/initiatives)
    if (!allInitiatives || allInitiatives.length === 0) {
      allInitiatives = [
        { _id: 'i1', title: 'Community Garden Cleanup', description: 'Help us clean up the community garden and plant new flowers for the spring season.', category: 'planting', status: 'active', participants_count: 15, location_name: 'Central Park', district: 'Vadodara', createdAt: new Date() },
        { _id: 'i2', title: 'Neighborhood Watch Patrol', description: 'Organizing a weekly patrol to ensure safety in the neighborhood.', category: 'safety', status: 'active', participants_count: 8, location_name: 'Alkapuri', district: 'Vadodara', createdAt: new Date() },
        { _id: 'i3', title: 'Recycling Drive', description: 'Collecting e-waste and old batteries for proper disposal.', category: 'recycling', status: 'completed', participants_count: 42, location_name: 'Fatehgunj', district: 'Vadodara', createdAt: new Date() },
      ]
    }

    // Prepare data for ML service (serialize _id to string)
    const trainingData = allInitiatives.map(init => ({
      _id: init._id.toString(),
      title: init.title || '',
      description: init.description || '',
      category: init.category || '',
      location_name: init.location_name || '',
      district: init.district || '',
    }))

    // Step 1: Train the recommendation model
    try {
      await axios.post(`${ML_SERVICE_URL}/initiatives/train`, { initiatives: trainingData })
    } catch (trainErr) {
      console.error('ML Train Error:', trainErr.message)
      return res.json([])
    }

    // Step 2: Get recommendations
    let recommendedIds = []
    try {
      const recResponse = await axios.post(`${ML_SERVICE_URL}/initiatives/recommend`, {
        initiative_id: targetId,
        top_n: 10  // ask for more so we can filter to active-only
      })
      recommendedIds = recResponse.data.recommendations || []
    } catch (recErr) {
      console.error('ML Recommend Error:', recErr.message)
      return res.json([])
    }

    if (recommendedIds.length === 0) {
      return res.json([])
    }

    // Step 3: Fetch full initiative documents — only active ones
    const recommended = allInitiatives
      .filter(init => recommendedIds.includes(init._id.toString()) && (init.status || 'active') === 'active')
      .map(init => ({
        _id: init._id.toString(),
        title: init.title,
        description: init.description,
        category: init.category,
        status: init.status || 'active',
        participants_count: init.participants_count || 0,
        location_name: init.location_name,
        district: init.district,
        image_url: init.image_url,
        createdAt: init.createdAt?.toISOString?.() || new Date().toISOString(),
      }))

    // Preserve the ML-ranked order, limit to top 3
    const ordered = recommendedIds
      .map(id => recommended.find(r => r._id === id))
      .filter(Boolean)
      .slice(0, 3)

    console.log(`[Recommendations] Returning ${ordered.length} recommendations for initiative ${targetId}`)
    return res.json(ordered)
  } catch (error) {
    console.error('Initiative Recommend Error:', error)
    return res.json([])
  }
})



app.get('/api/map', async (req, res) => {
  try {
     

    const reports = await Report.find({
      latitude: { $ne: null },
      longitude: { $ne: null },
    })
      .select('title category status latitude longitude')
      .lean()

    const wastePoints = await WastePoint.find({
      latitude: { $ne: null },
      longitude: { $ne: null },
      is_deleted: { $ne: true },
    })
      .sort({ createdAt: 1 })
      .select('name seed_key waste_type latitude longitude')
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
      wastePoints: uniqueBySeedKey(wastePoints).map((w) => ({
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
     
    await Notification.updateOne({ _id: req.params.id, user_id: req.user.sub }, { is_read: true })
    return res.json({ success: true })
  } catch (error) {
    console.error('Mark Read Error:', error)
    return res.status(500).json({ error: 'Failed to update notification' })
  }
})

app.post('/api/notifications/mark-all', authenticateToken, async (req, res) => {
  try {
     
    await Notification.updateMany({ user_id: req.user.sub, is_read: false }, { is_read: true })
    return res.json({ success: true })
  } catch (error) {
    console.error('Mark All Read Error:', error)
    return res.status(500).json({ error: 'Failed to update notifications' })
  }
})

app.get('/api/waste/points', async (req, res) => {
  try {

    try {
      await ensureDefaultWastePoints()
    } catch (seedErr) {
      console.error('[Waste Point] Error ensuring defaults:', seedErr)
    }

    const points = await WastePoint.find({ is_deleted: { $ne: true } }).sort({ createdAt: 1 }).lean()

    return res.json(uniqueBySeedKey(points).map(normalizeWastePoint))
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
    const {
      name,
      description,
      location_name,
      address,
      latitude,
      longitude,
      district,
      ward,
      waste_type,
      status,
      hours,
      capacity,
      fill_level,
      assigned_vehicle_id,
      last_collected_at,
    } = req.body



    const updateData = {}
    if (name) updateData.name = name
    if (description) updateData.description = description
    if (location_name) {
      updateData.location_name = location_name
      if (address === undefined) updateData.address = location_name
    }
    if (address) updateData.address = address
    if (latitude !== undefined && latitude !== '') updateData.latitude = Number(latitude)
    if (longitude !== undefined && longitude !== '') updateData.longitude = Number(longitude)
    if (district) updateData.district = district
    if (ward) updateData.ward = ward
    if (waste_type) updateData.waste_type = waste_type
    if (status) updateData.status = status
    if (hours) updateData.hours = hours
    if (capacity !== undefined && capacity !== '') updateData.capacity = Number(capacity)
    if (fill_level !== undefined && fill_level !== '') updateData.fill_level = Number(fill_level)
    if (assigned_vehicle_id !== undefined) updateData.assigned_vehicle_id = assigned_vehicle_id
    if (last_collected_at) updateData.last_collected_at = new Date(last_collected_at)

    if (assigned_vehicle_id) {
      const vehicle = await Vehicle.findOne({ vehicle_id: assigned_vehicle_id, status: 'active' }).lean()
      if (!vehicle) {
        return res.status(400).json({ error: 'Only active database trucks can be assigned.' })
      }
    }

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

    const {
      name,
      description,
      location_name,
      address,
      latitude,
      longitude,
      district,
      ward,
      waste_type,
      status,
      capacity,
      fill_level,
      hours,
      assigned_vehicle_id,
    } = req.body

    if (!name || latitude === undefined || longitude === undefined || latitude === '' || longitude === '') {
      return res.status(400).json({ error: 'Name, latitude, and longitude are required' })
    }



    const newPoint = new WastePoint({
      name,
      description: description || '',
      location_name: location_name || 'Vadodara',
      address: address || location_name || 'Vadodara',
      latitude: Number(latitude),
      longitude: Number(longitude),
      district: district || 'Vadodara',
      ward,
      waste_type: waste_type || 'general',
      status: status || 'operational',
      capacity: capacity ? Number(capacity) : 100,
      fill_level: fill_level ? Number(fill_level) : 0,
      hours: hours || '8:00 AM - 6:00 PM',
      assigned_vehicle_id,
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



    const existingPoint = await WastePoint.findById(pointId).lean()

    if (!existingPoint) {
      return res.status(404).json({ error: 'Waste point not found' })
    }

    if (existingPoint.seed_key) {
      await WastePoint.updateMany({ seed_key: existingPoint.seed_key }, {
        $set: {
          is_deleted: true,
          deleted_at: new Date(),
          assigned_vehicle_id: '',
        },
      })
    } else {
      await WastePoint.findByIdAndDelete(pointId)
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


    try {
      await ensureDefaultWasteSchedules()
    } catch (seedErr) {
      console.error('[Waste Schedule] Error ensuring defaults:', seedErr)
    }

    const schedules = await WasteSchedule.find({ is_deleted: { $ne: true } }).sort({ createdAt: 1 }).lean()

    return res.json(uniqueBySeedKey(schedules).map(normalizeWasteSchedule))
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

    const { location_name, district, latitude, longitude, collection_day, collection_time, waste_type, assigned_vehicle_id } = req.body

    if (!location_name || !collection_day || !collection_time || !waste_type) {
      return res.status(400).json({ error: 'Location, collection day, time, and waste type are required' })
    }



    const newSchedule = new WasteSchedule({
      location_name,
      district: district || 'Vadodara',
      latitude: latitude !== undefined && latitude !== '' ? Number(latitude) : undefined,
      longitude: longitude !== undefined && longitude !== '' ? Number(longitude) : undefined,
      collection_day,
      collection_time,
      waste_type,
      assigned_vehicle_id,
      collection_status: assigned_vehicle_id ? 'assigned' : 'scheduled',
    })

    await newSchedule.save()
    console.log(`[Waste Schedule] Created new schedule: ${newSchedule._id}`)

    return res.status(201).json({
      id: newSchedule._id.toString(),
      ...normalizeWasteSchedule(newSchedule),
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
    const {
      location_name,
      district,
      latitude,
      longitude,
      collection_day,
      collection_time,
      waste_type,
      assigned_vehicle_id,
      collection_status,
      last_collected_at,
    } = req.body



    const updateData = {}
    if (location_name) updateData.location_name = location_name
    if (district) updateData.district = district
    if (latitude !== undefined && latitude !== '') updateData.latitude = Number(latitude)
    if (longitude !== undefined && longitude !== '') updateData.longitude = Number(longitude)
    if (collection_day) updateData.collection_day = collection_day
    if (collection_time) updateData.collection_time = collection_time
    if (waste_type) updateData.waste_type = waste_type
    if (assigned_vehicle_id !== undefined) updateData.assigned_vehicle_id = assigned_vehicle_id
    if (collection_status) updateData.collection_status = collection_status
    if (last_collected_at) updateData.last_collected_at = new Date(last_collected_at)

    if (assigned_vehicle_id) {
      const vehicle = await Vehicle.findOne({ vehicle_id: assigned_vehicle_id, status: 'active' }).lean()
      if (!vehicle) {
        return res.status(400).json({ error: 'Only active database trucks can be assigned.' })
      }
    }

    const schedule = await WasteSchedule.findByIdAndUpdate(scheduleId, updateData, { new: true }).lean()

    if (!schedule) {
      return res.status(404).json({ error: 'Waste schedule not found' })
    }

    console.log(`[Waste Schedule] Updated ${scheduleId}`)

    return res.json({
      ...normalizeWasteSchedule(schedule),
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



    const existingSchedule = await WasteSchedule.findById(scheduleId).lean()

    if (!existingSchedule) {
      return res.status(404).json({ error: 'Waste schedule not found' })
    }

    if (existingSchedule.seed_key) {
      await WasteSchedule.updateMany({ seed_key: existingSchedule.seed_key }, {
        $set: {
          is_deleted: true,
          deleted_at: new Date(),
          assigned_vehicle_id: '',
          collection_status: 'scheduled',
        },
      })
    } else {
      await WasteSchedule.findByIdAndDelete(scheduleId)
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
    if (req.user.user_type !== "admin" && req.user.user_type !== "official") {
      return res.status(403).json({ error: "Access denied. Admins only." });
    }


    await seedVehiclesIfEmpty()
    await ensureVehicleLocations()

    const vehicles = await Vehicle.find().sort({ vehicle_id: 1 }).lean()

    return res.json(vehicles.map(normalizeVehicle));
  } catch (error) {
    console.error("Get Admin Vehicles Error:", error);
    return res.status(500).json({ error: error.message, vehicles: [] });
  }
})

// Create waste collection vehicle
app.post('/api/admin/vehicles', authenticateToken, async (req, res) => {
  try {
    if (req.user.user_type !== "admin" && req.user.user_type !== "official") {
      return res.status(403).json({ error: "Access denied. Admins only." });
    }

    const {
      id,
      vehicle_id,
      name,
      lat,
      lng,
      area,
      address,
      status = 'active',
      load = 0,
      driver_name,
      assigned_route,
    } = req.body

    const newVehicleId = String(vehicle_id || id || '').trim().toUpperCase()
    const validStatuses = ['active', 'maintenance', 'inactive']

    if (!newVehicleId || !name || lat === undefined || lng === undefined || lat === '' || lng === '') {
      return res.status(400).json({ error: 'Vehicle ID, name, latitude, and longitude are required.' })
    }

    if (!validStatuses.includes(status)) {
      return res.status(400).json({ error: "Invalid status. Must be: active, maintenance, or inactive" })
    }

    const numericLat = Number(lat)
    const numericLng = Number(lng)
    if (!Number.isFinite(numericLat) || !Number.isFinite(numericLng)) {
      return res.status(400).json({ error: 'Vehicle latitude and longitude must be valid numbers.' })
    }


    await seedVehiclesIfEmpty()

    const existingVehicle = await Vehicle.findOne({ vehicle_id: newVehicleId }).lean()
    if (existingVehicle) {
      return res.status(409).json({ error: 'A vehicle with this ID already exists.' })
    }

    const vehicle = await Vehicle.create({
      vehicle_id: newVehicleId,
      name,
      lat: numericLat,
      lng: numericLng,
      area: area || '',
      address: address || area || 'Vadodara, Gujarat',
      status,
      load: Number(load) || 0,
      driver_name,
      assigned_route,
      lastUpdated: new Date(),
    })

    console.log(`[Vehicle] Created: ${newVehicleId}`)

    return res.status(201).json({
      ...normalizeVehicle(vehicle.toObject()),
      message: 'Vehicle created successfully',
    })
  } catch (error) {
    console.error("Create Vehicle Error:", error);
    return res.status(500).json({ error: error.message });
  }
})

// Update waste collection vehicle
app.put('/api/admin/vehicles/:vehicleId', authenticateToken, async (req, res) => {
  try {
    if (req.user.user_type !== "admin" && req.user.user_type !== "official") {
      return res.status(403).json({ error: "Access denied. Admins only." });
    }

    const { vehicleId } = req.params;
    const { name, status, lat, lng, area, address, load, driver_name, assigned_route } = req.body;

    const validStatuses = ['active', 'maintenance', 'inactive'];
    if (status && !validStatuses.includes(status)) {
      return res.status(400).json({ error: "Invalid status. Must be: active, maintenance, or inactive" });
    }


    await seedVehiclesIfEmpty()

    const assignedJob = await getVehicleAssignmentRecord(vehicleId)
    if (assignedJob) {
      return res.status(400).json({
        error: 'Assigned trucks cannot be updated. Complete or remove the assignment first.',
      })
    }

    if (lat !== undefined && !Number.isFinite(Number(lat))) {
      return res.status(400).json({ error: 'Vehicle latitude must be a valid number.' })
    }

    if (lng !== undefined && !Number.isFinite(Number(lng))) {
      return res.status(400).json({ error: 'Vehicle longitude must be a valid number.' })
    }

    const updateData = { lastUpdated: new Date() }
    if (name !== undefined) updateData.name = name
    if (status) updateData.status = status
    if (lat !== undefined) updateData.lat = Number(lat)
    if (lng !== undefined) updateData.lng = Number(lng)
    if (area !== undefined) updateData.area = area
    if (address !== undefined) updateData.address = address
    if (load !== undefined) updateData.load = Number(load)
    if (driver_name !== undefined) updateData.driver_name = driver_name
    if (assigned_route !== undefined) updateData.assigned_route = assigned_route

    const vehicle = await Vehicle.findOneAndUpdate(
      { vehicle_id: vehicleId },
      updateData,
      { new: true }
    ).lean()

    if (!vehicle) {
      return res.status(404).json({ error: "Vehicle not found" });
    }

    console.log(`[Vehicle] Updated: ${vehicleId}`);

    return res.json({
      ...normalizeVehicle(vehicle),
      message: "Vehicle updated successfully"
    });
  } catch (error) {
    console.error("Update Vehicle Status Error:", error);
    return res.status(500).json({ error: error.message });
  }
})

// Delete waste collection vehicle
app.delete('/api/admin/vehicles/:vehicleId', authenticateToken, async (req, res) => {
  try {
    if (req.user.user_type !== "admin" && req.user.user_type !== "official") {
      return res.status(403).json({ error: "Access denied. Admins only." });
    }

    const { vehicleId } = req.params



    const assignedJob = await getVehicleAssignmentRecord(vehicleId)
    if (assignedJob) {
      return res.status(400).json({
        error: 'Assigned trucks cannot be deleted. Complete or remove the assignment first.',
      })
    }

    const deletedVehicle = await Vehicle.findOneAndDelete({ vehicle_id: vehicleId }).lean()

    if (!deletedVehicle) {
      return res.status(404).json({ error: "Vehicle not found" });
    }

    console.log(`[Vehicle] Deleted: ${vehicleId}`);

    return res.json({ message: 'Vehicle deleted successfully', id: vehicleId })
  } catch (error) {
    console.error("Delete Vehicle Error:", error);
    return res.status(500).json({ error: error.message });
  }
})

app.get('/api/waste/analytics', async (req, res) => {
  try {
     

    const [points, complaints, schedules] = await Promise.all([
      WastePoint.find({ is_deleted: { $ne: true } }).sort({ createdAt: 1 }).lean(),
      WasteComplaint.find().sort({ createdAt: -1 }).lean(),
      WasteSchedule.find({ is_deleted: { $ne: true } }).sort({ createdAt: 1 }).lean(),
    ])

    const visiblePoints = uniqueBySeedKey(points)
    const visibleSchedules = uniqueBySeedKey(schedules)
    const totalBins = visiblePoints.length
    const avgFillRate = totalBins
      ? Math.round(visiblePoints.reduce((sum, point) => sum + (point.fill_level || 0), 0) / totalBins)
      : 0
    const resolvedComplaints = complaints.filter((c) => ['resolved', 'closed'].includes(c.status)).length
    const collectionEfficiency = complaints.length
      ? Math.round((resolvedComplaints / complaints.length) * 100)
      : 0
    const recyclingBins = visiblePoints.filter((p) => p.waste_type === 'recyclable').length
    const recyclingRate = totalBins ? Math.round((recyclingBins / totalBins) * 100) : 0

    const compositionCounts = visiblePoints.reduce((acc, point) => {
      const key = point.waste_type || 'general'
      acc[key] = (acc[key] || 0) + 1
      return acc
    }, {})

    const composition = [
      { label: 'General Waste', key: 'general', color: 'bg-gray-400' },
      { label: 'Recyclables', key: 'recyclable', color: 'bg-green-500' },
      { label: 'Organic', key: 'organic', color: 'bg-orange-400' },
      { label: 'Hazardous', key: 'hazardous', color: 'bg-red-500' },
    ].map((item) => ({
      label: item.label,
      value: totalBins ? Math.round(((compositionCounts[item.key] || 0) / totalBins) * 100) : 0,
      color: item.color,
    }))

    const zoneMap = {}
    visiblePoints.forEach((point) => {
      const zone = point.ward || point.district || 'Unassigned'
      if (!zoneMap[zone]) zoneMap[zone] = { total: 0, ready: 0 }
      zoneMap[zone].total += 1
      if (point.status !== 'full' && point.status !== 'maintenance') zoneMap[zone].ready += 1
    })

    const zoneEfficiency = Object.entries(zoneMap).map(([zone, data]) => ({
      zone,
      value: data.total ? Math.round((data.ready / data.total) * 100) : 0,
    }))

    const today = new Date()
    const trend = Array.from({ length: 30 }, (_, index) => {
      const date = new Date(today)
      date.setDate(today.getDate() - (29 - index))
      const dateKey = date.toISOString().slice(0, 10)
      const count = complaints.filter((c) => c.createdAt?.toISOString?.().slice(0, 10) === dateKey).length
      return {
        date: dateKey,
        value: Math.min(100, count * 20),
      }
    })

    const highPriorityBins = visiblePoints
      .slice()
      .sort((a, b) => (b.fill_level || 0) - (a.fill_level || 0))
      .slice(0, 5)
      .map((point) => ({
        id: point._id.toString(),
        loc: point.name,
        fill: `${point.fill_level || 0}%`,
        status: point.status === 'full' || (point.fill_level || 0) >= 90 ? 'Critical' : 'High',
      }))

    return res.json({
      summary: {
        totalBins,
        avgFillRate,
        collections: resolvedComplaints,
        collectionEfficiency,
        recyclingRate,
        schedules: visibleSchedules.length,
      },
      trend,
      zoneEfficiency,
      composition,
      highPriorityBins,
    })
  } catch (error) {
    console.error('Get Waste Analytics Error:', error)
    return res.status(500).json({ error: 'Failed to fetch waste analytics' })
  }
})

app.get('/api/waste/schedules', async (req, res) => {
  try {

    try {
      await ensureDefaultWasteSchedules()
    } catch (seedErr) {
      console.error('[Waste Schedule] Error ensuring defaults for citizen view:', seedErr)
    }

    const schedules = await WasteSchedule.find({ is_deleted: { $ne: true } }).sort({ createdAt: 1 }).lean()

    return res.json(
      uniqueBySeedKey(schedules).map((s) => ({
        id: s._id.toString(),
        seed_key: s.seed_key,
        location_name: s.location_name,
        location: s.location_name,
        district: s.district,
        latitude: s.latitude,
        longitude: s.longitude,
        collection_day: s.collection_day,
        collection_time: s.collection_time,
        waste_type: s.waste_type,
        type: s.waste_type,
        assigned_vehicle_id: s.assigned_vehicle_id,
        collection_status: s.collection_status || 'scheduled',
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

     

    const existingComplaint = await WasteComplaint.findById(complaintId).lean()
    if (!existingComplaint) {
      return res.status(404).json({ error: 'Complaint not found' })
    }

    if (status && !isForwardComplaintTransition(existingComplaint.status || 'open', status)) {
      return res.status(400).json({
        error: 'Complaint status can only move forward: open -> acknowledged -> in_progress -> resolved -> closed. Closed complaints cannot be changed.',
      })
    }

    const updateData = {}
    if (status) updateData.status = status
    if (admin_notes) updateData.admin_notes = admin_notes

    const complaint = await WasteComplaint.findByIdAndUpdate(
      complaintId,
      updateData,
      { new: true }
    ).lean()

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

// Background Jobs
cron.schedule('*/5 * * * *', () => {
  console.log('[Cron] Running traffic data collection job...')
  collectAndStoreTrafficData()
})

// Start ML Predictor Service and then the Express server
const startServer = async () => {
  try {
    // Connect to MongoDB first
    await connectDB()
    await ensureDefaultWastePoints()
    await ensureDefaultWasteSchedules()
    await seedVehiclesIfEmpty()
    await ensureVehicleLocations()
    // Start ML predictor service first
    await startMLPredictorService()

    // Then start the Express server
    const server = app.listen(PORT, () => {
      console.log(`\n✓ Server running on http://localhost:${PORT}`)
      console.log(`\n🎯 Full System Ready:`)
      console.log(`   • Backend API: http://localhost:${PORT}`)
      console.log(`   • ML Predictor: http://localhost:8000`)
      console.log(`   • Frontend (after npm run dev): http://localhost:5173`)
    })

    // Graceful shutdown
    const shutdown = async (signal) => {
      console.log(`\n${signal} received, shutting down gracefully...`)
      await stopMLPredictorService()
      server.close(() => {
        console.log('Server closed')
        process.exit(0)
      })
      // Force exit after 10 seconds
      setTimeout(() => process.exit(1), 10000)
    }

    process.on('SIGTERM', () => shutdown('SIGTERM'))
    process.on('SIGINT', () => shutdown('SIGINT'))
  } catch (error) {
    console.error('✗ Failed to start server:', error.message)
    process.exit(1)
  }
}

startServer()


