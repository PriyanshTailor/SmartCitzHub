import dotenv from 'dotenv';
import { GoogleGenerativeAI } from '@google/generative-ai';

dotenv.config();

console.log("Testing gemini-2.5-flash...");

(async () => {
    try {
        const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
        const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });
        const result = await model.generateContent("Hello from the test script!");
        const response = await result.response;
        console.log("SUCCESS:", response.text());
    } catch (error) {
        console.error("FAILED:", error.message);
    }
})();
