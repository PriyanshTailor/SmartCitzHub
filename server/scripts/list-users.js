import dotenv from 'dotenv';
import { connectDB } from '../src/db.js';
import User from '../src/models/User.js';
import mongoose from 'mongoose';

dotenv.config();

console.log("Fetching users...");

(async () => {
    try {
        await connectDB();
        const users = await User.find().limit(3).lean();
        console.log("Users found:", JSON.stringify(users, null, 2));
    } catch (error) {
        console.error("Error:", error);
    } finally {
        await mongoose.disconnect();
    }
})();
