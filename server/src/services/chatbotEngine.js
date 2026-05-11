import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const dataDir = path.resolve(__dirname, '../../data');

const readJson = (fileName, fallback) => {
    try {
        return JSON.parse(fs.readFileSync(path.join(dataDir, fileName), 'utf8'));
    } catch (error) {
        console.warn(`[Chat] Could not load ${fileName}:`, error.message);
        return fallback;
    }
};

const trafficData = readJson('traffic-data.json', { trafficHistory: [] });
const environmentalData = readJson('environmental-data.json', { environmentalData: [] });
const transitData = readJson('transit-data.json', { routes: [], vehicles: [], alerts: [], statistics: {} });

const fallbackInitiatives = [
    {
        title: 'Community Garden Cleanup',
        description: 'Clean the community garden and plant new flowers.',
        category: 'cleanup',
        status: 'active',
        participants_count: 15,
        location_name: 'Central Park'
    },
    {
        title: 'Neighborhood Watch Patrol',
        description: 'Weekly safety patrol for neighborhood awareness.',
        category: 'safety',
        status: 'active',
        participants_count: 8,
        location_name: 'Alkapuri'
    },
    {
        title: 'Recycling Drive',
        description: 'Collect e-waste and batteries for proper disposal.',
        category: 'recycling',
        status: 'completed',
        participants_count: 42,
        location_name: 'Fatehgunj'
    }
];

const fallbackDiscussions = [
    {
        title: 'Untitled Update',
        content: 'Hello, everyone, this is a great platform to communicate.',
        tags: ['community'],
        likes_count: 0,
        replies_count: 0
    },
    {
        title: 'Local Issue Discussion',
        content: 'Citizens can post updates, discuss issues, and coordinate action here.',
        tags: ['local'],
        likes_count: 0,
        replies_count: 0
    }
];

const fallbackReports = [
    {
        title: 'Broken Bench in Park',
        description: 'The wooden bench near the fountain is split in half.',
        category: 'maintenance',
        status: 'open',
        priority: 'medium',
        location_name: 'Central Park',
        createdAt: new Date().toISOString()
    },
    {
        title: 'Graffiti on School Wall',
        description: 'Offensive graffiti needs removal immediately.',
        category: 'vandalism',
        status: 'in_progress',
        priority: 'high',
        location_name: 'Westside School',
        createdAt: new Date().toISOString()
    }
];

const trafficProfiles = {
    'Alkapuri Road, Vadodara': {
        curve: [15, 10, 8, 8, 10, 20, 40, 65, 82, 78, 60, 50, 55, 50, 45, 50, 60, 80, 88, 75, 55, 40, 30, 20],
        speedLimit: 25,
        baseIncidents: 1,
        weather: 'clear',
        roadCondition: 'dry'
    },
    'Fatehgunj Crossroads, Vadodara': {
        curve: [12, 8, 5, 5, 8, 15, 35, 60, 75, 70, 55, 48, 52, 48, 42, 48, 55, 72, 80, 68, 50, 35, 25, 18],
        speedLimit: 25,
        baseIncidents: 0,
        weather: 'clear',
        roadCondition: 'dry'
    },
    'Sayaji Baug, Vadodara': {
        curve: [10, 5, 5, 5, 5, 10, 20, 35, 45, 40, 35, 38, 42, 40, 35, 40, 50, 60, 65, 55, 45, 30, 20, 12],
        speedLimit: 25,
        baseIncidents: 0,
        weather: 'clear',
        roadCondition: 'dry'
    },
    'Race Course Road, Vadodara': {
        curve: [18, 12, 10, 10, 12, 22, 42, 68, 85, 80, 62, 52, 58, 52, 48, 55, 65, 85, 92, 78, 58, 42, 32, 22],
        speedLimit: 30,
        baseIncidents: 1,
        weather: 'cloudy',
        roadCondition: 'dry'
    },
    'Makarpura Junction, Vadodara': {
        curve: [10, 8, 5, 5, 8, 18, 38, 55, 68, 62, 50, 45, 48, 45, 40, 45, 52, 68, 75, 62, 48, 35, 22, 15],
        speedLimit: 25,
        baseIncidents: 0,
        weather: 'clear',
        roadCondition: 'dry'
    }
};

const stopWords = new Set([
    'a', 'an', 'and', 'are', 'at', 'can', 'for', 'from', 'how', 'i', 'in', 'is', 'it',
    'me', 'my', 'of', 'on', 'or', 'please', 'should', 'the', 'there', 'to', 'what',
    'when', 'where', 'which', 'with', 'you'
]);

const words = (text = '') => text.toLowerCase().match(/[a-z0-9]+/g) || [];
const usefulWords = (text = '') => words(text).filter((word) => word.length > 2 && !stopWords.has(word));
const escapeRegExp = (value) => value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
const hasAny = (text, terms) => terms.some((term) => {
    if (term.length <= 3) {
        return new RegExp(`\\b${escapeRegExp(term)}\\b`, 'i').test(text);
    }

    return text.includes(term);
});
const titleCase = (value = '') => value.replace(/_/g, ' ').replace(/\b\w/g, (char) => char.toUpperCase());

const scoreText = (queryWords, value = '') => {
    const haystack = value.toLowerCase();
    return queryWords.reduce((score, word) => score + (haystack.includes(word) ? 1 : 0), 0);
};

const bestByQuery = (items, query, selector) => {
    const queryWords = usefulWords(query);
    return items
        .map((item) => ({ item, score: scoreText(queryWords, selector(item)) }))
        .filter(({ score }) => score > 0)
        .sort((a, b) => b.score - a.score)
        .map(({ item }) => item);
};

const formatDate = (date) => {
    if (!date) return 'recently';
    const parsed = new Date(date);
    if (Number.isNaN(parsed.getTime())) return 'recently';
    return parsed.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
};

const formatHour = (hour) => {
    const suffix = hour >= 12 ? 'PM' : 'AM';
    const displayHour = hour % 12 || 12;
    return `${displayHour}:00 ${suffix}`;
};

const congestionToSpeed = (congestion, speedLimit) => Math.round(speedLimit - (congestion / 100) * (speedLimit - 5));

const trafficSnapshot = (locationName) => {
    const names = Object.keys(trafficProfiles);
    const selectedName = names.find((name) => name.toLowerCase().includes((locationName || '').toLowerCase()))
        || names.find((name) => scoreText(usefulWords(locationName || ''), name) > 0)
        || names[0];
    const profile = trafficProfiles[selectedName];
    const now = new Date();
    const currentHour = now.getHours();
    const congestion = profile.curve[currentHour] ?? profile.curve[0];
    const peakCongestion = Math.max(...profile.curve);
    const peakHour = profile.curve.indexOf(peakCongestion);
    const avgSpeed = congestionToSpeed(congestion, profile.speedLimit);
    const safetyScore = Math.max(0, Math.min(100, Math.round(100 - congestion * 0.5 - profile.baseIncidents * 10 - (profile.weather === 'rainy' ? 10 : profile.weather === 'cloudy' ? 3 : 0) - (profile.roadCondition === 'wet' ? 5 : 0))));
    const densityLevel = congestion >= 70 ? 'high' : congestion >= 50 ? 'medium' : 'low';
    const status = congestion >= 70 ? 'Crowded' : congestion >= 50 ? 'Moderate' : 'Free';

    return {
        location: selectedName,
        congestion,
        peakCongestion,
        peakHour,
        avgSpeed,
        safetyScore,
        densityLevel,
        status,
        weather: profile.weather,
        roadCondition: profile.roadCondition
    };
};

const summarizeReports = (reports, useFallback = false) => {
    const source = reports.length ? reports : (useFallback ? fallbackReports : []);

    if (!source.length) {
        return 'I could not find any complaint records linked to your account yet. You can file a new issue from Report Issue and then ask me for its status.';
    }

    const lines = source.slice(0, 4).map((report) => {
        const status = titleCase(report.status || 'open');
        const category = report.category ? ` (${report.category})` : '';
        const location = report.location_name ? ` at ${report.location_name}` : '';
        const date = formatDate(report.createdAt);
        return `- ${report.title}${category}${location}: ${status}, created ${date}`;
    });

    return `Here are your latest complaint updates:\n${lines.join('\n')}`;
};

const summarizeWasteComplaints = (complaints) => {
    if (!complaints.length) {
        return 'I did not find waste complaints linked to your account. For overflowing bins, missed pickup, or damaged facilities, open Waste Management and submit a waste complaint.';
    }

    const lines = complaints.slice(0, 4).map((complaint) => {
        const status = titleCase(complaint.status || 'open');
        const priority = complaint.priority ? `, priority ${complaint.priority}` : '';
        const type = complaint.complaint_type ? ` (${titleCase(complaint.complaint_type)})` : '';
        const location = complaint.location_name ? ` at ${complaint.location_name}` : '';
        const date = formatDate(complaint.createdAt);
        return `- ${complaint.title}${type}${location}: ${status}${priority}, submitted ${date}`;
    });

    return `Here are your recent waste complaints:\n${lines.join('\n')}`;
};

const answerDashboard = () => (
    'The Dashboard gives you a personalized city overview: recent activity, quick actions for reporting and tracking issues, real-time alerts, AI insights, predictive analytics, transit shortcuts, and waste map access. Use it as the home base before going into detailed sections.'
);

const answerMyReports = (reports) => {
    if (reports.length) {
        return summarizeReports(reports);
    }

    return summarizeReports([], true);
};

const answerCityMap = (message, publicReports = []) => {
    const matches = bestByQuery(
        publicReports,
        message,
        (report) => `${report.title} ${report.category} ${report.status} ${report.location_name} ${report.district}`
    );
    const chosen = matches.length ? matches : publicReports.slice(0, 5);

    if (!chosen.length) {
        return 'City Map helps you view mapped civic reports, traffic, and environmental layers by location. I do not have current report markers in this chat context, but you can ask about traffic, AQI, or nearby mapped reports by area name.';
    }

    const lines = chosen.slice(0, 5).map((report) => {
        const location = report.location_name || report.district || 'mapped location';
        return `- ${report.title}: ${titleCase(report.status || 'open')} ${report.category || 'issue'} at ${location}`;
    });

    return `City Map markers I found:\n${lines.join('\n')}`;
};

const answerTransit = (message) => {
    const matchedRoutes = bestByQuery(
        transitData.routes || [],
        message,
        (route) => `${route.id} ${route.name} ${(route.stops || []).join(' ')}`
    );
    const route = matchedRoutes[0] || (transitData.routes || [])[0];
    const stats = transitData.statistics || {};

    if (!route) {
        return 'I do not have transit route data loaded right now, but you can check the Transit page for routes, vehicles, and live alerts.';
    }

    const vehicles = (transitData.vehicles || []).filter((vehicle) => vehicle.route === route.id);
    const vehicleSummary = vehicles.length
        ? vehicles.slice(0, 3).map((vehicle) => `${vehicle.id} is ${titleCase(vehicle.status)} near ${vehicle.nextStop} with ETA ${vehicle.eta} min`).join('; ')
        : 'No active vehicle is currently listed on this route.';

    const alert = (transitData.alerts || []).find((item) => item.route === route.id);
    const alertText = alert ? ` Current alert: ${alert.title} - ${alert.description}` : '';

    return `${route.id} (${route.name}) stops at ${(route.stops || []).join(', ')}. ${vehicleSummary}.${alertText} System-wide on-time performance is ${stats.onTimePercentage || 'not available'}%.`;
};

const answerTraffic = (message) => {
    const matchedLocation = bestByQuery(
        Object.keys(trafficProfiles).map((location) => ({ location })),
        message,
        (entry) => entry.location
    )[0]?.location;
    const snapshot = trafficSnapshot(matchedLocation || message);

    return `${snapshot.location}: current traffic status is ${snapshot.status} with about ${snapshot.congestion}% congestion. Safety index is ${snapshot.safetyScore}/100, average speed is about ${snapshot.avgSpeed} km/h, road condition is ${snapshot.roadCondition}, and the forecaster peak is ${formatHour(snapshot.peakHour)} (${snapshot.peakCongestion}% congestion).`;
};

const answerEnvironment = (message) => {
    const rows = environmentalData.environmentalData || [];
    const matches = bestByQuery(rows, message, (entry) => entry.location);
    const entry = matches[0] || [...rows].sort((a, b) => (b.airQuality?.aqi || 0) - (a.airQuality?.aqi || 0))[0];

    if (!entry) {
        return 'I do not have environmental readings loaded right now. Please open Environmental Details for city air-quality data.';
    }

    return `${entry.location} has AQI ${entry.airQuality?.aqi} (${entry.airQuality?.description || titleCase(entry.airQuality?.level || 'unknown')}). Temperature is ${entry.temperature}C, humidity is ${entry.humidity}%, visibility is ${entry.visibility} km, and the trend is ${entry.trend || 'not available'}.`;
};

const answerWasteSchedule = (message, schedules) => {
    const matches = bestByQuery(
        schedules,
        message,
        (schedule) => `${schedule.location_name} ${schedule.district} ${schedule.collection_day} ${schedule.waste_type}`
    );
    const chosen = matches.length ? matches : schedules.slice(0, 5);

    if (!chosen.length) {
        return 'I do not have waste schedule data available right now. You can still submit missed pickup or overflowing bin issues from Waste Management.';
    }

    const lines = chosen.slice(0, 5).map((schedule) => {
        const vehicle = schedule.assigned_vehicle_id ? `, vehicle ${schedule.assigned_vehicle_id}` : '';
        return `- ${schedule.location_name}: ${schedule.collection_day} at ${schedule.collection_time} for ${schedule.waste_type}${vehicle}`;
    });

    return `Waste collection schedule I found:\n${lines.join('\n')}`;
};

const answerWasteManagement = (message, context) => {
    const lower = message.toLowerCase();

    if (hasAny(lower, ['my', 'complaint', 'status', 'request', 'missed', 'overflowing', 'damaged', 'improper'])) {
        return summarizeWasteComplaints(context.wasteComplaints || []);
    }

    if (hasAny(lower, ['point', 'bin', 'disposal', 'facility', 'full', 'nearest'])) {
        const points = context.wastePoints || [];
        const matches = bestByQuery(
            points,
            message,
            (point) => `${point.name} ${point.location_name} ${point.address} ${point.district} ${point.ward} ${point.status} ${point.waste_type}`
        );
        const chosen = matches.length ? matches : points.slice(0, 5);

        if (!chosen.length) {
            return 'Waste Management can show disposal points, bin fill levels, collection schedules, and your waste complaints. Ask by area name to find a matching point or schedule.';
        }

        const lines = chosen.slice(0, 5).map((point) => {
            const location = point.location_name || point.address || point.district || 'location not specified';
            return `- ${point.name}: ${titleCase(point.status || 'operational')}, ${point.fill_level ?? 0}% full, ${point.waste_type || 'general'} waste, ${location}`;
        });

        return `Waste points I found:\n${lines.join('\n')}`;
    }

    return answerWasteSchedule(message, context.wasteSchedules || []);
};

const answerCrowdInsights = (message, context) => {
    if (hasAny(message.toLowerCase(), ['traffic', 'alkapuri', 'fatehgunj', 'sayaji', 'race course', 'makarpura', 'hotspot'])) {
        const snapshot = trafficSnapshot(message);
        return `Smart Insights hotspot for ${snapshot.location}: density is ${titleCase(snapshot.densityLevel)}, status is ${snapshot.status}, current congestion is ${snapshot.congestion}%, safety index is ${snapshot.safetyScore}/100, and the forecaster peak is ${formatHour(snapshot.peakHour)} (${snapshot.peakCongestion}% congestion).`;
    }

    const insights = context.crowdInsights || [];
    if (insights.length) {
        const matches = bestByQuery(
            insights,
            message,
            (item) => `${item.location_name} ${item.district} ${item.crowd_level} ${item.incident_type} ${item.description}`
        );
        const chosen = matches.length ? matches : insights.slice(0, 5);
        const lines = chosen.slice(0, 5).map((item) => {
            const congestion = item.congestion_level ? `, congestion ${item.congestion_level}%` : '';
            const users = item.active_users ? `, ${item.active_users} active users` : '';
            return `- ${item.location_name}: ${titleCase(item.crowd_level || item.density_level || 'low')}${congestion}${users}`;
        });
        return `Crowd insight summary:\n${lines.join('\n')}`;
    }

    const reports = context.publicReports || [];
    if (reports.length) {
        const byLocation = reports.reduce((acc, report) => {
            const key = report.location_name || report.district || 'Unknown area';
            acc[key] = (acc[key] || 0) + 1;
            return acc;
        }, {});
        const lines = Object.entries(byLocation)
            .sort((a, b) => b[1] - a[1])
            .slice(0, 5)
            .map(([location, count]) => `- ${location}: ${count} recent mapped report${count > 1 ? 's' : ''}`);
        return `Crowd insights are estimated from report density when live crowd data is unavailable:\n${lines.join('\n')}`;
    }

    const hotspotLines = Object.keys(trafficProfiles)
        .map((location) => trafficSnapshot(location))
        .sort((a, b) => b.congestion - a.congestion)
        .slice(0, 5)
        .map((item) => `- ${item.location}: ${titleCase(item.densityLevel)} density, ${item.congestion}% congestion, safety ${item.safetyScore}/100, peak ${formatHour(item.peakHour)} (${item.peakCongestion}%)`);

    return `Smart Insights city hotspots:\n${hotspotLines.join('\n')}`;
};

const answerInitiatives = (message, initiatives = []) => {
    const source = initiatives.length ? initiatives : fallbackInitiatives;

    const matches = bestByQuery(
        source,
        message,
        (item) => `${item.title} ${item.description} ${item.category} ${item.status} ${item.location_name} ${item.district}`
    );
    const chosen = matches.length ? matches : source.slice(0, 5);
    const lines = chosen.slice(0, 5).map((item) => {
        const location = item.location_name || item.district || 'location not specified';
        return `- ${item.title}: ${titleCase(item.status || 'active')}, ${item.category || 'general'}, ${item.participants_count || 0} participants, ${location}`;
    });

    return `Initiatives I found:\n${lines.join('\n')}\nYou can open Initiatives to view details or join an active one.`;
};

const answerCommunity = (message, discussions = []) => {
    const source = discussions.length ? discussions : fallbackDiscussions;

    const matches = bestByQuery(
        source,
        message,
        (item) => `${item.title} ${item.content} ${(item.tags || []).join(' ')}`
    );
    const chosen = matches.length ? matches : source.slice(0, 5);
    const lines = chosen.slice(0, 5).map((item) => {
        const tags = item.tags?.length ? ` [${item.tags.join(', ')}]` : '';
        return `- ${item.title || 'Untitled discussion'}${tags}: ${item.likes_count || 0} likes, ${item.replies_count || 0} replies`;
    });

    return `Recent community discussions:\n${lines.join('\n')}`;
};

const answerNotifications = (notifications = []) => {
    if (!notifications.length) {
        return 'Notifications show updates about your reports, community activity, initiatives, and system alerts. I do not see any recent notifications in the current chat context.';
    }

    const unread = notifications.filter((item) => !item.is_read);
    const lines = notifications.slice(0, 5).map((item) => {
        const status = item.is_read ? 'read' : 'unread';
        return `- ${item.title}: ${item.message || item.type || 'notification'} (${status})`;
    });

    return `You have ${unread.length} unread notification${unread.length === 1 ? '' : 's'}.\n${lines.join('\n')}`;
};

const answerHowToReport = () => (
    'To file a civic issue, open Report Issue, add a clear title, category, location, priority, description, and photo if available. For waste-specific issues, use Waste Management so the request reaches the collection workflow.'
);

const answerCommonIssues = () => (
    'You can report common civic issues such as potholes, broken street lights, water leakage, drainage problems, garbage overflow, missed waste pickup, damaged public facilities, unsafe roads, illegal dumping, traffic signal problems, vandalism, and public safety concerns. Include the exact location, a short description, priority, and a photo when possible.'
);

const answerReportDetails = (message) => {
    const isPothole = message.toLowerCase().includes('pothole');
    const issue = isPothole ? 'pothole' : 'civic issue';

    return `For reporting a ${issue}, include: exact location or landmark, size/severity, how long it has been there, safety risk, traffic impact, priority, and a clear photo if possible. A good description would be: "There is a ${issue} near [location/landmark]. It is causing inconvenience and may be unsafe for vehicles or pedestrians. Please inspect and repair it as soon as possible."`;
};

const answerFeatureHelp = () => (
    'SmartCitizenHub user features include: Dashboard for overview and quick actions, My Reports for complaint tracking, City Map for mapped issues and city layers, Environment & Weather for AQI/weather readings, Crowd Insights for busy-area awareness, Transit System for bus routes and alerts, Waste Management for pickup schedules and waste complaints, Initiatives for civic campaigns, Community for discussions, and Notifications for updates.'
);

const answerComplaintStatuses = () => (
    'Complaint statuses usually mean: Open means it has been submitted, In Progress means the team is working on it, Resolved means the issue was fixed, and Closed means the request is completed or no further action is planned.'
);

const answerDraftComplaint = (message) => {
    const issueWords = usefulWords(message).filter((word) => ![
        'draft',
        'complaint',
        'write',
        'polite',
        'describe',
        'report',
        'should',
        'word',
        'format',
        'application'
    ].includes(word));
    const issue = issueWords.length ? issueWords.join(' ') : 'the civic issue';

    return `Here is a complaint draft:\nSubject: Request to resolve ${issue}\n\nDear Municipal Team,\nI would like to report ${issue} in my area. The issue is causing inconvenience and may become unsafe if not addressed soon. Please inspect the location and take the necessary action at the earliest.\n\nLocation: [add exact location]\nDetails: [add what you observed]\nPhoto: [attach if available]\nThank you.`;
};

const answerGeneral = (message) => {
    const topicWords = usefulWords(message).slice(0, 6);
    const topics = topicWords.length ? topicWords.join(', ') : 'your question';

    return `I can answer questions about SmartCitizenHub services, complaint filing, waste complaints and schedules, bus routes, traffic, AQI, emergency guidance, and civic issue reporting. For your question about ${topics}, please add a little more detail such as location, report type, route, or complaint title so I can give a more specific answer.`;
};

export const buildLocalChatResponse = (message, context = {}) => {
    const lower = message.toLowerCase();
    const asksWritingHelp = hasAny(lower, ['how should i describe', 'how to describe', 'what should i write', 'write a', 'draft', 'describe an', 'describe a', 'word this', 'format']);

    if (hasAny(lower, ['fire', 'crime', 'accident', 'medical emergency', 'ambulance', 'police', 'danger'])) {
        return 'This sounds urgent. Please call emergency services immediately: 112 for national emergency help in India, 100 for police, 101 for fire, or 108 for ambulance. After you are safe, you can file a report in the app with location and details.';
    }

    if (hasAny(lower, ['what can you do', 'features', 'smartcitizen feature', 'smart citizen feature', 'help me use', 'sections'])) {
        return answerFeatureHelp();
    }

    if (hasAny(lower, ['dashboard', 'overview', 'quick action', 'ai insight', 'predictive analytics'])) {
        return answerDashboard();
    }

    if (!asksWritingHelp && hasAny(lower, ['waste complaint', 'garbage complaint', 'missed pickup', 'overflowing', 'damaged bin'])) {
        return summarizeWasteComplaints(context.wasteComplaints || []);
    }

    if (hasAny(lower, ['common civic', 'civic issues', 'what issues', 'which issues', 'types of issues', 'report in this app'])) {
        return answerCommonIssues();
    }

    if (hasAny(lower, ['what details', 'which details', 'details should i include', 'include while reporting', 'include in report', 'reporting a pothole', 'report a pothole'])) {
        return answerReportDetails(message);
    }

    if (hasAny(lower, ['difference between', 'meaning of status', 'status mean', 'open in progress', 'resolved and closed'])) {
        return answerComplaintStatuses();
    }

    if (hasAny(lower, ['draft', 'write']) && hasAny(lower, ['complaint', 'report', 'application'])) {
        return answerDraftComplaint(message);
    }

    if (asksWritingHelp && hasAny(lower, ['complaint', 'report', 'bin', 'garbage', 'issue'])) {
        return answerDraftComplaint(message);
    }

    if (hasAny(lower, ['file', 'submit', 'raise', 'create']) && hasAny(lower, ['issue', 'report', 'complaint'])) {
        return answerHowToReport();
    }

    if (!asksWritingHelp && hasAny(lower, ['waste complaint', 'waste complaints', 'garbage complaint', 'garbage complaints', 'missed pickup', 'overflowing', 'damaged bin'])) {
        return summarizeWasteComplaints(context.wasteComplaints || []);
    }

    if (hasAny(lower, ['complaint status', 'report status', 'status of', 'my report', 'my reports', 'all reports', 'show report', 'show reports', 'recent reports', 'report history', 'my complaint', 'my complaints', 'ticket', 'recent complaints', 'show my complaints'])) {
        const wasteComplaints = context.wasteComplaints || [];
        const civicReports = context.userReports || [];

        if (hasAny(lower, ['waste', 'garbage', 'pickup', 'bin'])) {
            return summarizeWasteComplaints(wasteComplaints);
        }

        return summarizeReports(civicReports, true);
    }

    if (hasAny(lower, ['my reports', 'report history', 'reports history', 'my issues'])) {
        return answerMyReports(context.userReports || []);
    }

    if (hasAny(lower, ['city map', 'map', 'nearby report', 'mapped report', 'markers', 'where are reports'])) {
        return answerCityMap(message, context.publicReports || []);
    }

    if (hasAny(lower, ['waste', 'garbage', 'collection', 'pickup', 'bin'])) {
        return answerWasteManagement(message, context);
    }

    if (hasAny(lower, ['crowd', 'crowded', 'density', 'busy area', 'rush'])) {
        return answerCrowdInsights(message, context);
    }

    if (hasAny(lower, ['bus', 'route', 'transit', 'vehicle', 'eta', 'stop'])) {
        return answerTransit(message);
    }

    if (hasAny(lower, ['traffic', 'congestion', 'road', 'incident', 'speed'])) {
        return answerTraffic(message);
    }

    if (hasAny(lower, ['aqi', 'air', 'pollution', 'environment', 'humidity', 'temperature'])) {
        return answerEnvironment(message);
    }

    if (hasAny(lower, ['initiative', 'initiatives', 'intiative', 'intiatives', 'initative', 'initatives', 'volunteer', 'campaign', 'cleanup', 'drive', 'join event'])) {
        return answerInitiatives(message, context.initiatives || []);
    }

    if (hasAny(lower, ['community', 'discussion', 'post', 'comment', 'members'])) {
        return answerCommunity(message, context.discussions || []);
    }

    if (hasAny(lower, ['notification', 'notifications', 'unread', 'updates'])) {
        return answerNotifications(context.notifications || []);
    }

    return answerGeneral(message);
};
