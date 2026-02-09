import dotenv from 'dotenv';
import { handleChat } from '../src/controllers/chat.controller.js';
import { connectDB } from '../src/db.js';
import mongoose from 'mongoose';
import Report from '../src/models/Report.js';

dotenv.config();

// Mock Request and Response
const mockReq = {
    body: { message: "hello" },
    user: { sub: "mock_user_id_123" }
};

const mockRes = {
    status: function (code) {
        console.log(`[Response Status]: ${code}`);
        return this;
    },
    json: function (data) {
        console.log(`[Response JSON]:`, JSON.stringify(data, null, 2));
        return this;
    }
};

console.log("Testing Chat Controller...");

(async () => {
    try {
        await connectDB();
        console.log("DB Connected.");

        console.log("Calling handleChat with 'hello'...");
        await handleChat(mockReq, mockRes);

    } catch (error) {
        console.error("Test Failed:", error);
    } finally {
        await mongoose.disconnect();
    }
})();
