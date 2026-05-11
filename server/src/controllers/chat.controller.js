import { generateContent } from '../services/googleAI.js';
import { buildLocalChatResponse } from '../services/chatbotEngine.js';
import Report from '../models/Report.js';
import WasteComplaint from '../models/WasteComplaint.js';
import WasteSchedule from '../models/WasteSchedule.js';
import WastePoint from '../models/WastePoint.js';
import Discussion from '../models/Discussion.js';
import Initiative from '../models/Initiative.js';
import Notification from '../models/Notification.js';
import CrowdInsight from '../models/CrowdInsight.js';

const formatRecord = (record) => ({
    ...record,
    createdAt: record.createdAt?.toISOString?.() || record.createdAt,
    updatedAt: record.updatedAt?.toISOString?.() || record.updatedAt
});

const escapeRegExp = (value) => value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
const hasAny = (text, terms) => terms.some((term) => {
    if (term.length <= 3) {
        return new RegExp(`\\b${escapeRegExp(term)}\\b`, 'i').test(text);
    }

    return text.includes(term);
});

export const handleChat = async (req, res) => {
    try {
        const { message } = req.body;
        const userId = req.user?.sub || req.user?._id;

        if (!message) {
            return res.status(400).json({ error: "Message is required" });
        }

        console.log(`[Chat] Received message: "${message}" from user: ${userId}`);

        // 1. INTENT DETECTION & DATA FETCHING
        let contextData = "";
        const localContext = {
            userReports: [],
            wasteComplaints: [],
            wasteSchedules: [],
            wastePoints: [],
            discussions: [],
            initiatives: [],
            notifications: [],
            crowdInsights: [],
            publicReports: []
        };
        const lowerMessage = message.toLowerCase();
        const asksWaste = hasAny(lowerMessage, ['waste', 'garbage', 'pickup', 'collection', 'bin', 'overflowing', 'damaged facility', 'improper disposal']);
        const asksOwnStatus = hasAny(lowerMessage, ['my report', 'my reports', 'all reports', 'show report', 'show reports', 'report history', 'recent reports', 'my complaint', 'my complaints', 'complaint status', 'report status', 'status of', 'show my', 'recent complaint', 'ticket']);
        const asksGeneralReportHelp = hasAny(lowerMessage, ['common civic', 'civic issues', 'what issues', 'which issues', 'types of issues', 'how do i file', 'how to file', 'how can i report']);
        const asksWritingHelp = hasAny(lowerMessage, ['how should i describe', 'how to describe', 'what should i write', 'write a', 'draft', 'describe an', 'describe a', 'word this', 'format']);

        const wantsCommunity = hasAny(lowerMessage, ['community', 'discussion', 'post', 'comment', 'members']);
        const wantsInitiatives = hasAny(lowerMessage, ['initiative', 'initiatives', 'intiative', 'intiatives', 'initative', 'initatives', 'volunteer', 'join event', 'campaign', 'cleanup', 'drive']);
        const wantsNotifications = hasAny(lowerMessage, ['notification', 'notifications', 'alert', 'alerts', 'unread']);
        const wantsCrowd = hasAny(lowerMessage, ['crowd', 'crowded', 'density', 'busy area', 'rush']);
        const wantsMap = hasAny(lowerMessage, ['city map', 'map', 'nearby', 'location', 'where are reports', 'issue map']);
        const wantsEnvironment = hasAny(lowerMessage, ['aqi', 'air quality', 'environment', 'weather', 'temperature', 'humidity', 'pollution']);
        const wantsTransit = hasAny(lowerMessage, ['transit', 'bus', 'route', 'vehicle', 'eta', 'stop']);
        const wantsTraffic = hasAny(lowerMessage, ['traffic', 'congestion', 'road traffic', 'safety index', 'hotspot']);

        if (userId && asksOwnStatus && !asksGeneralReportHelp && !asksWritingHelp) {
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
                    localContext.userReports = recentReports.map(formatRecord);
                    contextData = `User's Recent Complaints:\n${recentReports.map(r =>
                        `- ID: ${r._id}, Title: "${r.title}", Status: ${r.status}, Category: ${r.category}, Date: ${r.createdAt}`
                    ).join('\n')}\n\n`;
                } else {
                    contextData = "User has no recent civic reports found in the Report Issue database.\n\n";
                }
            } catch (dbError) {
                console.error("[Chat] DB Query failed or timed out:", dbError.message);
                contextData = "Notice: Could not fetch recent complaint status due to specific database unavailability. Please ask general questions or try again later.\n\n";
            }
        }

        if (userId && asksWaste && !asksWritingHelp) {
            try {
                const wasteComplaints = await WasteComplaint.find({ user_id: userId })
                    .sort({ createdAt: -1 })
                    .limit(5)
                    .select('title status priority complaint_type location_name createdAt')
                    .lean()
                    .maxTimeMS(2000);

                localContext.wasteComplaints = wasteComplaints.map(formatRecord);
                if (wasteComplaints.length) {
                    contextData += `User's Recent Waste Complaints:\n${wasteComplaints.map(c =>
                        `- ID: ${c._id}, Title: "${c.title}", Type: ${c.complaint_type}, Status: ${c.status}, Priority: ${c.priority}, Location: ${c.location_name || 'Not specified'}, Date: ${c.createdAt}`
                    ).join('\n')}\n\n`;
                } else if (asksWaste || lowerMessage.includes('my')) {
                    contextData += "User has no recent waste complaints found in the Waste Management database.\n\n";
                }
            } catch (dbError) {
                console.error("[Chat] Waste complaints query failed:", dbError.message);
            }
        }

        if (asksWaste && !asksWritingHelp) {
            try {
                const wasteSchedules = await WasteSchedule.find({ is_deleted: { $ne: true } })
                    .sort({ location_name: 1 })
                    .limit(20)
                    .select('location_name district collection_day collection_time waste_type assigned_vehicle_id collection_status')
                    .lean()
                    .maxTimeMS(2000);

                localContext.wasteSchedules = wasteSchedules.map(formatRecord);
                if (wasteSchedules.length) {
                    contextData += `Waste Collection Schedules:\n${wasteSchedules.slice(0, 8).map(s =>
                        `- ${s.location_name}: ${s.collection_day} ${s.collection_time}, ${s.waste_type}, status ${s.collection_status}`
                    ).join('\n')}\n\n`;
                }
            } catch (dbError) {
                console.error("[Chat] Waste schedule query failed:", dbError.message);
            }
        }

        if (asksWaste && !asksWritingHelp) {
            try {
                const wastePoints = await WastePoint.find({ is_deleted: { $ne: true } })
                    .sort({ fill_level: -1 })
                    .limit(12)
                    .select('name location_name address district ward fill_level capacity status waste_type hours assigned_vehicle_id')
                    .lean()
                    .maxTimeMS(2000);

                localContext.wastePoints = wastePoints.map(formatRecord);
                if (wastePoints.length) {
                    contextData += `Waste Collection Points:\n${wastePoints.slice(0, 8).map(p =>
                        `- ${p.name}: ${p.status}, ${p.fill_level}% full, ${p.waste_type}, Location: ${p.location_name || p.address || 'Not specified'}`
                    ).join('\n')}\n\n`;
                }
            } catch (dbError) {
                console.error("[Chat] Waste points query failed:", dbError.message);
            }
        }

        if (wantsCommunity) {
            try {
                const discussions = await Discussion.find()
                    .sort({ createdAt: -1 })
                    .limit(8)
                    .select('title content tags likes_count replies_count is_pinned createdAt')
                    .lean()
                    .maxTimeMS(2000);

                localContext.discussions = discussions.map(formatRecord);
                if (discussions.length) {
                    contextData += `Recent Community Discussions:\n${discussions.map(d =>
                        `- ${d.title || 'Untitled'}: ${d.content || ''} Tags: ${(d.tags || []).join(', ')}, Likes: ${d.likes_count || 0}, Replies: ${d.replies_count || 0}`
                    ).join('\n')}\n\n`;
                }
            } catch (dbError) {
                console.error("[Chat] Community query failed:", dbError.message);
            }
        }

        if (wantsInitiatives) {
            try {
                const initiatives = await Initiative.find()
                    .sort({ createdAt: -1 })
                    .limit(10)
                    .select('title description category status start_date end_date location_name district participants_count createdAt')
                    .lean()
                    .maxTimeMS(2000);

                localContext.initiatives = initiatives.map(formatRecord);
                if (initiatives.length) {
                    contextData += `Active/Recent Initiatives:\n${initiatives.map(i =>
                        `- ${i.title}: ${i.status}, ${i.category || 'general'}, ${i.participants_count || 0} participants, Location: ${i.location_name || i.district || 'Not specified'}`
                    ).join('\n')}\n\n`;
                }
            } catch (dbError) {
                console.error("[Chat] Initiatives query failed:", dbError.message);
            }
        }

        if (userId && wantsNotifications) {
            try {
                const notifications = await Notification.find({ user_id: userId })
                    .sort({ createdAt: -1 })
                    .limit(8)
                    .select('type title message is_read createdAt')
                    .lean()
                    .maxTimeMS(2000);

                localContext.notifications = notifications.map(formatRecord);
                if (notifications.length) {
                    contextData += `User Notifications:\n${notifications.map(n =>
                        `- ${n.title}: ${n.message || ''} Type: ${n.type}, Read: ${n.is_read ? 'yes' : 'no'}`
                    ).join('\n')}\n\n`;
                }
            } catch (dbError) {
                console.error("[Chat] Notifications query failed:", dbError.message);
            }
        }

        if (wantsCrowd) {
            try {
                const crowdInsights = await CrowdInsight.find()
                    .sort({ createdAt: -1 })
                    .limit(10)
                    .select('location_name district crowd_level congestion_level incident_type description active_users expires_at createdAt')
                    .lean()
                    .maxTimeMS(2000);

                localContext.crowdInsights = crowdInsights.map(formatRecord);
                if (crowdInsights.length) {
                    contextData += `Crowd Insights:\n${crowdInsights.map(c =>
                        `- ${c.location_name}: ${c.crowd_level}, congestion ${c.congestion_level || 0}, active users ${c.active_users || 0}, ${c.description || ''}`
                    ).join('\n')}\n\n`;
                }
            } catch (dbError) {
                console.error("[Chat] Crowd insights query failed:", dbError.message);
            }
        }

        if (wantsMap || wantsCrowd) {
            try {
                const publicReports = await Report.find({ latitude: { $ne: null }, longitude: { $ne: null } })
                    .sort({ createdAt: -1 })
                    .limit(12)
                    .select('title category status priority location_name district latitude longitude createdAt')
                    .lean()
                    .maxTimeMS(2000);

                localContext.publicReports = publicReports.map(formatRecord);
                if (publicReports.length) {
                    contextData += `City Map Report Markers:\n${publicReports.slice(0, 8).map(r =>
                        `- ${r.title}: ${r.category}, ${r.status}, ${r.priority || 'medium'} priority, Location: ${r.location_name || r.district || 'mapped point'}`
                    ).join('\n')}\n\n`;
                }
            } catch (dbError) {
                console.error("[Chat] Public map reports query failed:", dbError.message);
            }
        }

        const shouldUseAppDataFirst = (
            (asksOwnStatus && !asksWritingHelp) ||
            (asksWaste && !asksWritingHelp) ||
            wantsEnvironment ||
            wantsTransit ||
            wantsTraffic ||
            wantsCrowd ||
            wantsMap ||
            wantsCommunity ||
            wantsInitiatives ||
            wantsNotifications
        );

        if (shouldUseAppDataFirst) {
            const appDataReply = buildLocalChatResponse(message, localContext);
            console.log("[Chat] App-data response generated.");
            return res.json({ reply: appDataReply });
        }

        // 2. SYSTEM PROMPT CONSTRUCTION
        const systemPrompt = `
You are the SmartCitizen Assistant of SmartCitizenHub, a platform for Indian citizens to report issues and stay informed.

Your Role:
- Help citizens with common queries about public services.
- Check their complaint status from the provided context (if any).
- Answer general questions dynamically using the user's wording and available SmartCitizenHub data.
- Treat "waste complaints" and "garbage complaints" as Waste Management records, not normal civic reports.
- Understand the user-side features: Dashboard, My Reports, City Map, Environment & Weather, Crowd Insights, Transit System, Waste Management, Initiatives, Community, and Notifications.
- Never say the user has no complaints if Context Data contains any civic report or waste complaint.
- For general questions like common reportable issues, answer directly with examples instead of asking the user to file a new issue.
- Answer politely, concisely, and supportively.
- If the user asks about "status" or "complaint", look at the "User's Recent Complaints" data provided below.
- If the user asks about waste complaint status, look at "User's Recent Waste Complaints" first.
- If the user asks how to file a complaint, guide them to the "Report Issue" section of the app.
- If the user reports an emergency (fire, crime, medical), urge them to call emergency services (112, 100, 101, 108 in India) immediately.

Context Data (Real-time from Database):
${contextData}

User Query: "${message}"

Answer:
`;

        // 3. CALL GEMINI AI
        console.log("[Chat] Calling Gemini AI...");
        const aiResponse = await generateContent(systemPrompt);
        const reply = aiResponse || buildLocalChatResponse(message, localContext);
        console.log(`[Chat] ${aiResponse ? 'AI' : 'Local'} response generated.`);

        // 4. RETURN RESPONSE
        return res.json({ reply });

    } catch (error) {
        console.error("Chat Controller Error:", error);
        return res.json({ reply: buildLocalChatResponse(req.body?.message || '', {}) });
    }
};
