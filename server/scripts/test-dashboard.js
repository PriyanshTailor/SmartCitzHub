import dotenv from 'dotenv';
import { connectDB } from '../src/db.js';
import mongoose from 'mongoose';
import dashboardRoutes from '../src/routes/dashboardRoutes.js';
import express from 'express';
import request from 'supertest';
import { authenticateToken } from '../src/middleware/auth.js';

dotenv.config();

const app = express();
app.use(express.json());

// Mock authentication middleware for testing
app.use((req, res, next) => {
    req.user = { sub: "6983088b23af251b700446f2", user_type: "citizen" }; // Vidz ID
    next();
});

app.use('/api/dashboard', dashboardRoutes);

console.log("Testing Dashboard Routes...");

(async () => {
    try {
        await connectDB();
        console.log("DB Connected.");

        // Test GET /api/dashboard
        console.log("\n--- GET /api/dashboard ---");
        const res = await request(app).get('/api/dashboard');
        console.log("Status:", res.status);
        if (res.status !== 200) {
            console.error("Error Body:", JSON.stringify(res.body, null, 2));
        } else {
            console.log("Success! Keys returned:", Object.keys(res.body));
        }

    } catch (error) {
        console.error("Test Failed:", error);
    } finally {
        await mongoose.disconnect();
    }
})();
