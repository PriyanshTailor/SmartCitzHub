import dotenv from 'dotenv';
import { GoogleGenerativeAI } from '@google/generative-ai';

dotenv.config();

console.log("API Key Loaded:", process.env.GEMINI_API_KEY ? "Yes (" + process.env.GEMINI_API_KEY.substring(0, 5) + "...)" : "No");

const runTest = async (modelName) => {
    console.log(`\nTesting Model: ${modelName}...`);
    try {
        const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
        const model = genAI.getGenerativeModel({ model: modelName });
        const result = await model.generateContent("Hello!");
        const response = await result.response;
        console.log(`SUCCESS with ${modelName}:`, response.text());
        return true;
    } catch (error) {
        // console.error(`FAILED with ${modelName}:`, error.message);
        if (error.response) {
            console.error(`FAILED with ${modelName}: Status ${error.response.status}`);
        } else {
            console.error(`FAILED with ${modelName}: ${error.message}`);
        }
        return false;
    }
};

(async () => {
    const models = [
        "gemini-1.5-flash",
        "gemini-1.5-flash-001",
        "gemini-1.5-flash-latest",
        "gemini-1.5-pro",
        "gemini-1.5-pro-001",
        "gemini-1.0-pro",
        "gemini-pro"
    ];

    for (const model of models) {
        const success = await runTest(model);
        if (success) {
            console.log(`\n!!! FOUND WORKING MODEL: ${model} !!!`);
            break;
        }
    }
})();
