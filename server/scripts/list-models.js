import dotenv from 'dotenv';
import { GoogleGenerativeAI } from '@google/generative-ai';

dotenv.config();

console.log("Listing Models...");

(async () => {
    try {
        const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
        // Note: listModels is not directly exposed on genAI instance in some versions, 
        // but let's try the standard way or just use a known working model like 'gemini-pro'

        // Actually, the node SDK doesn't have a simple listModels on the top level client in all versions.
        // But we can try to just use 'gemini-pro' which is the safest bet if 1.5 is adhering to specific access.

        const model = genAI.getGenerativeModel({ model: "gemini-pro" });
        const result = await model.generateContent("Test");
        console.log("gemini-pro works:", await result.response.text());

    } catch (error) {
        console.error("Error:", error);
    }
})();
