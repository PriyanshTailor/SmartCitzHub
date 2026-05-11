import jwt from 'jsonwebtoken'
import dotenv from 'dotenv'

dotenv.config()

const JWT_SECRET = process.env.JWT_SECRET || 'dev_secret'

export function authenticateToken(req, res, next) {
    const authHeader = req.headers.authorization || ''
    const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : null

    if (!token) {
        return res.status(401).json({ error: 'Not authenticated' })
    }

    try {
        const payload = jwt.verify(token, JWT_SECRET)
        req.user = payload
        next()
    } catch (error) {
        return res.status(401).json({ error: 'Invalid token' })
    }
}
