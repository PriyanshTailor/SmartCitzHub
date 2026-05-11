import express from 'express';
import { handleChat } from '../controllers/chat.controller.js';
import jwt from 'jsonwebtoken';
import dotenv from 'dotenv';

dotenv.config();

const router = express.Router();
const JWT_SECRET = process.env.JWT_SECRET || 'dev_secret';

const optionalAuthenticateToken = (req, res, next) => {
    const authHeader = req.headers.authorization || '';
    const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : null;

    if (!token) {
        return next();
    }

    try {
        req.user = jwt.verify(token, JWT_SECRET);
    } catch (error) {
        console.warn('[Chat] Ignoring invalid optional auth token.');
    }

    next();
};

router.post('/', optionalAuthenticateToken, handleChat);

export default router;
