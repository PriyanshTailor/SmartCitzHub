import dotenv from 'dotenv';
import { handleChat } from '../src/controllers/chat.controller.js';
import { connectDB } from '../src/db.js';
import mongoose from 'mongoose';
import Report from '../src/models/Report.js';

dotenv.config();

const USER_ID = "6983088b23af251b700446f2"; // Vidz

const mockRes = (label) => ({
    status: function (code) {
        console.log(`[${label}] Status: ${code}`);
        return this;
    },
    json: function (data) {
        console.log(`[${label}] Response:`, JSON.stringify(data, null, 2).substring(0, 500) + "..."); // Truncate long responses
        return this;
    }
});

console.log("=== STARTING BACKEND TESTS ===");

(async () => {
    try {
        await connectDB();
        console.log("✅ DB Connected.");

        // TEST 1: General Knowledge
        console.log("\n--- Test 1: General Knowledge (No DB context needed) ---");
        const req1 = {
            body: { message: "Tell me interesting facts about Pune." },
            user: { sub: USER_ID }
        };
        await handleChat(req1, mockRes("Test 1"));

        // TEST 2: Database Context
        console.log("\n--- Test 2: Database Context (Fetching Reports) ---");
        const req2 = {
            body: { message: "What is the status of my complaints?" },
            user: { sub: USER_ID }
        };
        await handleChat(req2, mockRes("Test 2"));

        console.log("\n=== ALL TESTS COMPLETED ===");

    } catch (error) {
        console.error("Test Suite Failed:", error);
    } finally {
        await mongoose.disconnect();
    }
})();
