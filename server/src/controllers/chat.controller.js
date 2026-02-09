import { generateContent } from '../services/googleAI.js';
import Report from '../models/Report.js';

export const handleChat = async (req, res) => {
    try {
        const { message } = req.body;
        const userId = req.user.sub; // From authenticateToken middleware

        if (!message) {
            return res.status(400).json({ error: "Message is required" });
        }

        console.log(`[Chat] Received message: "${message}" from user: ${userId}`);

        // 1. INTENT DETECTION & DATA FETCHING
        let contextData = "";
        const lowerMessage = message.toLowerCase();

        // Check for complaint status intent
        if (lowerMessage.includes("complaint") || lowerMessage.includes("status") || lowerMessage.includes("report")) {
            console.log("[Chat] Fetching user reports...");
            try {
                // Add timeout to prevent hanging if DB is unresponsive
                const recentReports = await Report.find({ user_id: userId })
                    .sort({ createdAt: -1 })
                    .limit(5)
                    .select('title status category description createdAt')
                    .lean()
                    .maxTimeMS(2000); // 2 second timeout

                console.log(`[Chat] Found ${recentReports.length} reports.`);

                if (recentReports.length > 0) {
                    contextData = `User's Recent Complaints:\n${recentReports.map(r =>
                        `- ID: ${r._id}, Title: "${r.title}", Status: ${r.status}, Category: ${r.category}, Date: ${r.createdAt}`
                    ).join('\n')}\n\n`;
                } else {
                    contextData = "User has no recent complaints found in the database.\n\n";
                }
            } catch (dbError) {
                console.error("[Chat] DB Query failed or timed out:", dbError.message);
                contextData = "Notice: Could not fetch recent complaint status due to specific database unavailability. Please ask general questions or try again later.\n\n";
            }
        }

        // 2. SYSTEM PROMPT CONSTRUCTION
        const systemPrompt = `
You are the SmartCitizen Assistant of SmartCitizenHub, a platform for Indian citizens to report issues and stay informed.

Your Role:
- Help citizens with common queries about public services.
- Check their complaint status from the provided context (if any).
- Answer politely, concisely, and supportively.
- If the user asks about "status" or "complaint", look at the "User's Recent Complaints" data provided below.
- If the user asks how to file a complaint, guide them to the "Report Issue" section of the app.
- If the user reports an emergency (fire, crime, medical), urge them to call emergency services (100, 101, 108 in India) immediately.

Context Data (Real-time from Database):
${contextData}

User Query: "${message}"

Answer:
`;

        // 3. CALL GEMINI AI
        console.log("[Chat] Calling Gemini AI...");
        const aiResponse = await generateContent(systemPrompt);
        console.log("[Chat] AI Response received.");

        // 4. RETURN RESPONSE
        return res.json({ reply: aiResponse });

    } catch (error) {
        console.error("Chat Controller Error:", error);
        return res.status(500).json({ error: "Failed to process chat request" });
    }
};
