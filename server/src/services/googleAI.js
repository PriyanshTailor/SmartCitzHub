import { GoogleGenerativeAI } from '@google/generative-ai';
import dotenv from 'dotenv';

dotenv.config();

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

const model = genAI.getGenerativeModel({
    model: "gemini-2.5-flash",
    generationConfig: {
        maxOutputTokens: 800,
        temperature: 0.3,
    }
});

export const generateContent = async (prompt) => {
    try {
        const result = await model.generateContent(prompt);
        const response = await result.response;
        return response.text();
    } catch (error) {
        console.error("Error generating content from Gemini:", error);
        throw new Error("Failed to generate content from AI");
    }
};
