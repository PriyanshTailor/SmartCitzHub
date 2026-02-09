import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const transitData = {
  "city": "Vadodara",
  "coordinates": {"lat": 22.3072, "lng": 73.1812},
  "routes": [
    {"id": "VB-1", "name": "Alkapuri - Railway Station", "type": "bus", "color": "#3B82F6", "stops": ["Alkapuri", "Vadodara Central Mall", "Sayajigunj", "Railway Station"]},
    {"id": "VB-2", "name": "Manjalpur - Akota", "type": "bus", "color": "#10B981", "stops": ["Manjalpur", "Productivity Road", "Akota Garden", "Akota Stadium"]},
    {"id": "VB-3", "name": "Fatehgunj - Nizampura", "type": "bus", "color": "#8B5CF6", "stops": ["Fatehgunj", "MS University", "Raopura", "Nizampura"]},
    {"id": "VB-5", "name": "Waghodia Road - Gotri", "type": "bus", "color": "#F59E0B", "stops": ["Waghodia Road", "Gorwa", "Bhayli", "Gotri"]},
    {"id": "VB-7", "name": "Sama - Old Padra Road", "type": "bus", "color": "#EF4444", "stops": ["Sama", "Manjalpur", "Alkapuri", "Sayajigunj", "Old Padra Road"]},
    {"id": "VB-9", "name": "Subhanpura - Karelibaug", "type": "bus", "color": "#06B6D4", "stops": ["Subhanpura", "Tandalja", "Race Course", "Karelibaug"]}
  ],
  "vehicles": [
    {"id": "VB-101", "route": "VB-1", "type": "bus", "lat": 22.3072, "lng": 73.1812, "heading": 45, "status": "on_time", "passengers": 42, "capacity": 60, "speed": 35, "nextStop": "Vadodara Central Mall", "eta": 3, "lastUpdated": "2026-02-08T10:30:00Z"},
    {"id": "VB-102", "route": "VB-1", "type": "bus", "lat": 22.2987, "lng": 73.1920, "heading": 90, "status": "on_time", "passengers": 28, "capacity": 60, "speed": 32, "nextStop": "Railway Station", "eta": 5, "lastUpdated": "2026-02-08T10:30:00Z"},
    {"id": "VB-103", "route": "VB-1", "type": "bus", "lat": 22.3100, "lng": 73.1750, "heading": 120, "status": "on_time", "passengers": 35, "capacity": 60, "speed": 30, "nextStop": "Sayajigunj", "eta": 4, "lastUpdated": "2026-02-08T10:30:00Z"},
    {"id": "VB-201", "route": "VB-2", "type": "bus", "lat": 22.3156, "lng": 73.1694, "heading": 180, "status": "on_time", "passengers": 55, "capacity": 60, "speed": 28, "nextStop": "Productivity Road", "eta": 2, "lastUpdated": "2026-02-08T10:30:00Z"},
    {"id": "VB-202", "route": "VB-2", "type": "bus", "lat": 22.2895, "lng": 73.1850, "heading": 270, "status": "delayed", "passengers": 48, "capacity": 60, "speed": 18, "nextStop": "Akota Garden", "eta": 8, "lastUpdated": "2026-02-08T10:30:00Z"},
    {"id": "VB-301", "route": "VB-3", "type": "bus", "lat": 22.3195, "lng": 73.1932, "heading": 315, "status": "on_time", "passengers": 38, "capacity": 60, "speed": 40, "nextStop": "MS University", "eta": 4, "lastUpdated": "2026-02-08T10:30:00Z"},
    {"id": "VB-302", "route": "VB-3", "type": "bus", "lat": 22.3050, "lng": 73.1975, "heading": 240, "status": "on_time", "passengers": 44, "capacity": 60, "speed": 36, "nextStop": "Raopura", "eta": 3, "lastUpdated": "2026-02-08T10:30:00Z"},
    {"id": "VB-501", "route": "VB-5", "type": "bus", "lat": 22.3245, "lng": 73.1575, "heading": 225, "status": "on_time", "passengers": 35, "capacity": 60, "speed": 38, "nextStop": "Gorwa", "eta": 6, "lastUpdated": "2026-02-08T10:30:00Z"},
    {"id": "VB-502", "route": "VB-5", "type": "bus", "lat": 22.2980, "lng": 73.1620, "heading": 180, "status": "on_time", "passengers": 40, "capacity": 60, "speed": 33, "nextStop": "Bhayli", "eta": 5, "lastUpdated": "2026-02-08T10:30:00Z"},
    {"id": "VB-701", "route": "VB-7", "type": "bus", "lat": 22.3350, "lng": 73.1695, "heading": 135, "status": "on_time", "passengers": 52, "capacity": 60, "speed": 38, "nextStop": "Manjalpur", "eta": 2, "lastUpdated": "2026-02-08T10:30:00Z"},
    {"id": "VB-702", "route": "VB-7", "type": "bus", "lat": 22.3050, "lng": 73.1890, "heading": 90, "status": "on_time", "passengers": 45, "capacity": 60, "speed": 35, "nextStop": "Alkapuri", "eta": 3, "lastUpdated": "2026-02-08T10:30:00Z"},
    {"id": "VB-901", "route": "VB-9", "type": "bus", "lat": 22.3240, "lng": 73.2080, "heading": 200, "status": "on_time", "passengers": 38, "capacity": 60, "speed": 32, "nextStop": "Tandalja", "eta": 4, "lastUpdated": "2026-02-08T10:30:00Z"},
    {"id": "VB-902", "route": "VB-9", "type": "bus", "lat": 22.3180, "lng": 73.1920, "heading": 150, "status": "on_time", "passengers": 50, "capacity": 60, "speed": 34, "nextStop": "Race Course", "eta": 3, "lastUpdated": "2026-02-08T10:30:00Z"}
  ],
  "alerts": [
    {"id": "alert-1", "route": "VB-2", "severity": "medium", "title": "Traffic Congestion on Akota Route", "description": "Heavy traffic near Akota Garden causing 5-10 min delays.", "timestamp": "2026-02-08T10:15:00Z"},
    {"id": "alert-2", "route": "VB-1", "severity": "low", "title": "High Passenger Volume", "description": "Morning rush hour causing high occupancy on VB-1 route.", "timestamp": "2026-02-08T09:45:00Z"}
  ],
  "statistics": {"activeVehicles": 13, "totalRoutes": 6, "onTimePercentage": 92, "activeAlerts": 2, "avgWaitTime": 5, "totalPassengers": 485}
};

const dataPath = path.join(__dirname, '../data/transit-data.json');
fs.writeFileSync(dataPath, JSON.stringify(transitData, null, 2), 'utf8');
console.log('Transit data seeded successfully at:', dataPath);
