import express from 'express';
import { handleChat } from '../controllers/chat.controller.js';
import { authenticateToken } from '../middleware/auth.js';

const router = express.Router();

router.post('/', authenticateToken, handleChat);

export default router;
