import express from 'express'
import * as moderationController from '../controllers/moderationController.js'
import { authenticateToken } from '../middleware/auth.js'

const router = express.Router()

// Public/User routes (Authenticated)
router.post('/flag', authenticateToken, moderationController.flagContent)

// Admin routes
router.get('/', authenticateToken, moderationController.getFlags) // Should add Admin check middleware ideally
router.post('/:id/resolve', authenticateToken, moderationController.resolveFlag)

export default router
