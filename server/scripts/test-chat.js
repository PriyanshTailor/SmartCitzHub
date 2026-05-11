import dotenv from 'dotenv';
import { handleChat } from '../src/controllers/chat.controller.js';
import { vi } from 'vitest'; // We don't have vitest installed, so we'll just mock manually

dotenv.config();

// Mock dependencies
const mockReq = (message) => ({
    body: { message },
    user: { sub: 'mock-user-id' }
});

const mockRes = {
    json: (data) => console.log('Response:', JSON.stringify(data, null, 2)),
    status: (code) => ({
        json: (data) => console.log(`Error (${code}):`, JSON.stringify(data, null, 2))
    })
};

// Mock Report model
import Report from '../src/models/Report.js';
Report.find = () => ({
    sort: () => ({
        limit: () => ({
            select: () => ({
                lean: async () => [] // Return empty array for now
            })
        })
    })
});

console.log("Testing Gemini API Integration...");

(async () => {
    try {
        console.log("\nTest 1: General Query");
        await handleChat(mockReq("How do I register a water complaint?"), mockRes);

        console.log("\nTest 2: General Greeting");
        await handleChat(mockReq("Hello, who are you?"), mockRes);

    } catch (error) {
        console.error("Test Failed:", error);
    }
})();
