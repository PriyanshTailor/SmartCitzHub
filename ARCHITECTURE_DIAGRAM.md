# Traffic & Environmental Data Flow Diagram

## System Architecture

```
┌─────────────────────────────────────────────────────────────────────┐
│                         USER INTERFACE                              │
├─────────────────────────────────────────────────────────────────────┤
│                                                                      │
│  ┌─────────────────────────────────────────────────────────────┐   │
│  │  MapPage (/dashboard/map)                                   │   │
│  │  ├─ City Map Component                                      │   │
│  │  ├─ [View Details] ← Traffic Updates (button)               │   │
│  │  ├─ [View Details] ← Environmental Data (button)            │   │
│  │  └─ [View Details] ← Crowd Insights (button)                │   │
│  └──────────────────>──────────────────────────────────────────┘   │
│                          │                        │                 │
│                Click →   │       Click →          │                │
│                          ▼                        ▼                 │
│  ┌──────────────────────────┐    ┌──────────────────────────┐     │
│  │ TrafficDetailsPage       │    │ EnvironmentalDetailsPage │     │
│  │ (/dashboard/traffic)     │    │ (/dashboard/environmental)│    │
│  │                          │    │                          │     │
│  │ • Traffic List           │    │ • Environmental List     │     │
│  │ • Real-time Updates      │    │ • Real-time Updates      │     │
│  │   (every 10 sec)         │    │   (every 15 sec)         │     │
│  │ • Location Selector      │    │ • Location Selector      │     │
│  │ • Detailed Metrics       │    │ • Detailed Metrics       │     │
│  │ • Incident Alerts        │    │ • Health Alerts          │     │
│  │ • Color-coded Severity   │    │ • AQI Scale Legend       │     │
│  └──────────────────────────┘    └──────────────────────────┘     │
│                 │                             │                    │
└─────────────────┼─────────────────────────────┼────────────────────┘
                  │                             │
              API CALLS (mapApi)                │
                  │                             │
                  ▼                             ▼
┌─────────────────────────────────────────────────────────────────────┐
│                         API LAYER                                   │
├─────────────────────────────────────────────────────────────────────┤
│                                                                      │
│  map.api.js (Client-side API Service)                               │
│  ├─ getTrafficUpdates()                                             │
│  ├─ getTrafficByLocation(locationId)                               │
│  ├─ getEnvironmentalData()                                         │
│  └─ getEnvironmentalByLocation(locationId)                         │
│                                                                      │
└─────────────────────────────────────────────────────────────────────┘
                  │                             │
                  │ HTTP GET                    │ HTTP GET
                  │ + JWT Token                 │ + JWT Token
                  ▼                             ▼
┌──────────────────────────┐    ┌──────────────────────────────┐     
│   /api/map/traffic       │    │   /api/map/environmental     │     
│   /api/map/traffic/:id   │    │   /api/map/environmental/:id │     
└──────────────────────────┘    └──────────────────────────────┘     
           │                              │                          
           │ (mapRoutes.js)               │ (mapRoutes.js)           
           ▼                              ▼                          
┌─────────────────────────────────────────────────────────────────────┐
│                      BACKEND ROUTES LAYER                           │
├─────────────────────────────────────────────────────────────────────┤
│                                                                      │
│  mapRoutes.js                                                        │
│  ├─ router.get('/traffic', getTrafficUpdates)                      │
│  ├─ router.get('/traffic/:locationId', getTrafficByLocation)       │
│  ├─ router.get('/environmental', getEnvironmentalData)             │
│  └─ router.get('/environmental/:locationId', getEnvironmentalByLocation)│
│                                                                      │
│  Authentication: JWT Token (authenticateToken middleware)           │
│                                                                      │
└─────────────────────────────────────────────────────────────────────┘
           │                              │
           ▼                              ▼
┌──────────────────────────┐    ┌──────────────────────────────────┐  
│ trafficController.js     │    │ environmentalController.js       │  
├──────────────────────────┤    ├──────────────────────────────────┤  
│ • getTrafficUpdates()    │    │ • getEnvironmentalData()        │  
│   - Generate real-time   │    │   - Generate real-time data     │  
│     traffic data         │    │   - Add variations (±5-15%)     │  
│   - Add variations       │    │   - Calculate summaries         │  
│     (±10%)               │    │   - Return JSON response        │  
│   - Add timestamps       │    │                                 │  
│   - Calculate summaries  │    │ • getEnvironmentalByLocation()  │  
│   - Return JSON          │    │   - Filter by location ID       │  
│                          │    │   - Return specific data        │  
│ • getTrafficByLocation() │    │                                 │  
│   - Filter by location   │    │                                 │  
│   - Return specific data │    │                                 │  
└──────────────────────────┘    └──────────────────────────────────┘  
           │                              │
           │ (Data with real-time         │ (Data with real-time
           │  variations)                 │  variations)
           ▼                              ▼
┌──────────────────────────┐    ┌──────────────────────────────────┐  
│ traffic-data.json        │    │ environmental-data.json          │  
├──────────────────────────┤    ├──────────────────────────────────┤  
│                          │    │                                  │  
│ 5 Traffic Locations:     │    │ 5 Environmental Locations:       │  
│ • Main St & 5th Ave      │    │ • Downtown Core                  │  
│ • Broadway & Times Sq    │    │ • Central Park Area              │  
│ • Park Ave South         │    │ • Upper East Side                │  
│ • Christopher St         │    │ • Waterfront District            │  
│ • Brooklyn Bridge        │    │ • West Village                   │  
│                          │    │                                  │  
│ Metrics per location:    │    │ Metrics per location:            │  
│ • Congestion %           │    │ • AQI (0-500)                    │  
│ • Speed/Speed Limit      │    │ • 6 Pollutants                   │  
│ • Vehicle Count          │    │ • Weather (4 metrics)            │  
│ • Incidents              │    │ • Health Status                  │  
│ • Delay                  │    │ • Trend                          │  
│ • Trend                  │    │                                  │  
│                          │    │ Summary Stats:                   │  
│ Summary Stats:           │    │ • Average AQI                    │  
│ • Total Locations        │    │ • Worst/Best Area                │  
│ • Congestion Counts      │    │ • Areas of Concern               │  
│ • Average Congestion     │    │ • AQI Scale Breakdown            │  
│ • Active Incidents       │    │                                  │  
└──────────────────────────┘    └──────────────────────────────────┘  
```

---

## Real-Time Update Cycle

### Traffic Updates Cycle (Every 10 Seconds)

```
┌─────────────────────────────────────────────────────────────────┐
│                    USER IS ON TRAFFIC PAGE                      │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
                    ┌─────────────────────┐
                    │ Every 10 seconds:   │
                    │ setInterval()       │
                    │ calls API           │
                    └─────────────────────┘
                              │
                              ▼
                    ┌─────────────────────┐
                    │ mapApi.             │
                    │ getTrafficUpdates() │
                    │                     │
                    │ Sends JWT token     │
                    └─────────────────────┘
                              │
                              ▼ HTTP GET /api/map/traffic
                    ┌─────────────────────┐
                    │ trafficController   │
                    │ getTrafficUpdates() │
                    │                     │
                    │ Simulates data:     │
                    │ congestion ±10%     │
                    │ speed ±10%          │
                    │ vehicles ±10%       │
                    │                     │
                    │ Returns 5 locations │
                    │ + summary stats     │
                    │ + timestamp         │
                    └─────────────────────┘
                              │
                              ▼
                    ┌─────────────────────────────┐
                    │ Response to Component       │
                    │                             │
                    │ setTraffic(data)            │
                    │ Updates React state         │
                    │ Component re-renders        │
                    │ UI updates with new metrics │
                    └─────────────────────────────┘
                              │
                              ▼
                    ┌──────────────────────────────┐
                    │ User sees updated metrics:   │
                    │ • New congestion %           │
                    │ • New speed values           │
                    │ • Updated timestamps         │
                    │ • Changed trends             │
                    └──────────────────────────────┘

⏱️ Cycle repeats every 10 seconds automatically
```

### Environmental Data Cycle (Every 15 Seconds)

```
┌─────────────────────────────────────────────────────────────────┐
│              USER IS ON ENVIRONMENTAL PAGE                      │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
                    ┌─────────────────────┐
                    │ Every 15 seconds:   │
                    │ setInterval()       │
                    │ calls API           │
                    └─────────────────────┘
                              │
                              ▼
                    ┌─────────────────────┐
                    │ mapApi.             │
                    │ getEnvironmental    │
                    │ Data()              │
                    │                     │
                    │ Sends JWT token     │
                    └─────────────────────┘
                              │
                              ▼ HTTP GET /api/map/environmental
                    ┌─────────────────────────────┐
                    │ environmentalController     │
                    │ getEnvironmentalData()      │
                    │                             │
                    │ Simulates data:             │
                    │ AQI ±15%                    │
                    │ Pollutants ±8%              │
                    │ Weather ±5%                 │
                    │ Temperature ±2°C            │
                    │ Humidity ±5%                │
                    │                             │
                    │ Returns 5 locations         │
                    │ + summary stats             │
                    │ + timestamp                 │
                    └─────────────────────────────┘
                              │
                              ▼
                    ┌─────────────────────────────┐
                    │ Response to Component       │
                    │                             │
                    │ setEnvironmental(data)      │
                    │ Updates React state         │
                    │ Component re-renders        │
                    │ UI updates with new metrics │
                    └─────────────────────────────┘
                              │
                              ▼
                    ┌──────────────────────────────┐
                    │ User sees updated metrics:   │
                    │ • New AQI values             │
                    │ • New pollutant levels       │
                    │ • Updated weather data       │
                    │ • Changed health alerts      │
                    │ • Updated timestamps         │
                    └──────────────────────────────┘

⏱️ Cycle repeats every 15 seconds automatically
```

---

## Data Flow for Single Location Selection

```
┌──────────────────────────────────────────────────────────────────┐
│           USER CLICKS ON A LOCATION CARD                        │
└──────────────────────────────────────────────────────────────────┘
                            │
                            ▼
                ┌───────────────────────────────┐
                │ onClick={()=>setSelected(...)} │
                │ Selects location from array   │
                └───────────────────────────────┘
                            │
                            ▼
                ┌───────────────────────────────┐
                │ setSelectedLocation() state    │
                │ updates with clicked location │
                │ Details panel appears/updates  │
                └───────────────────────────────┘
                            │
                            ▼
        ┌───────────────────────────────────────────┐
        │ Detailed Metrics Panel Displays:          │
        │                                           │
        │ Traffic Page:                             │
        │ • Location name                           │
        │ • Coordinates                             │
        │ • Congestion level badge                  │
        │ • Speed metrics                           │
        │ • Vehicle count                           │
        │ • Estimated delay                         │
        │ • Road condition                          │
        │ • Incidents with warning                  │
        │                                           │
        │ OR                                        │
        │                                           │
        │ Environmental Page:                       │
        │ • Location name                           │
        │ • AQI with color badge                    │
        │ • 6 pollutant levels                      │
        │ • Weather metrics (4 types)               │
        │ • Health alerts                           │
        │ • Timestamp                               │
        └───────────────────────────────────────────┘
                            │
    ┌───────────────────────┼───────────────────────┐
    ▼                       ▼                       ▼
┌──────────┐         ┌──────────┐          ┌────────────┐
│ Details  │         │ Location │          │ Health     │
│ Update   │         │ Selector │          │ Violations │
│ Auto-    │         │ Remains  │          │ Highlighted│
│ refresh  │         │ Sticky   │          │ if risk    │
│ Every:   │         │          │          │            │
│ • 10sec  │         │ Click    │          │ Real-time  │
│ • 15sec  │         │ same or  │          │ Alerts     │
│ with     │         │ others   │          │            │
│ latest   │         │ to       │          │ User can   │
│ data     │         │ switch   │          │ take       │
│          │         │ detail   │          │ action     │
└──────────┘         └──────────┘          └────────────┘
```

---

## Data Variation Simulation

### Traffic Data Variations
```
Metric               | Initial | Variation | Range
─────────────────────┼─────────┼───────────┼──────────────
Congestion %         |   85    | ±10%      | 75% - 95%
Average Speed        |   12    | ±3 km/h   | 9 - 15 km/h
Vehicle Count        |   250   | ±30       | 220 - 280
```

### Environmental Data Variations
```
Metric               | Initial | Variation | Range
─────────────────────┼─────────┼───────────┼──────────────
AQI                  |   128   | ±20       | 108 - 148
PM2.5                |   45.2  | ±5        | 40.2 - 50.2
PM10                 |   62.5  | ±8        | 54.5 - 70.5
Temperature          |   28°C  | ±2°C      | 26 - 30°C
Humidity             |   65%   | ±5%       | 60% - 70%
```

---

## Component Hierarchy

```
App.jsx
├── Routes
│   ├── /dashboard/map → MapPage.jsx
│   │   ├── CityMap (existing)
│   │   ├── Button "Traffic Updates"
│   │   │   └── onClick → navigate("/dashboard/traffic")
│   │   │
│   │   ├── Button "Environmental Data"
│   │   │   └── onClick → navigate("/dashboard/environmental")
│   │   │
│   │   └── Button "Crowd Insights"
│   │       └── onClick → navigate("/dashboard/crowd-insights")
│   │
│   │
│   ├── /dashboard/traffic → TrafficDetailsPage.jsx
│   │   ├── Summary Cards (4)
│   │   │   ├── Total Locations
│   │   │   ├── High Congestion Count
│   │   │   ├── Average Congestion
│   │   │   └── Active Incidents
│   │   │
│   │   ├── Location List
│   │   │   ├── Location Card 1 (clickable)
│   │   │   ├── Location Card 2 (clickable)
│   │   │   ├── Location Card 3 (clickable)
│   │   │   ├── Location Card 4 (clickable)
│   │   │   └── Location Card 5 (clickable)
│   │   │
│   │   └── Sticky Details Panel (conditional)
│   │       └── Only shows when location is selected
│   │
│   │
│   └── /dashboard/environmental → EnvironmentalDetailsPage.jsx
│       ├── Summary Cards (4)
│       │   ├── Average AQI
│       │   ├── Monitored Locations
│       │   ├── Average Temperature
│       │   └── Areas of Concern
│       │
│       ├── Location List
│       │   ├── Location Card 1 (clickable)
│       │   ├── Location Card 2 (clickable)
│       │   ├── Location Card 3 (clickable)
│       │   ├── Location Card 4 (clickable)
│       │   └── Location Card 5 (clickable)
│       │
│       ├── AQI Scale Legend
│       │   ├── Good (0-50)
│       │   ├── Moderate (51-100)
│       │   ├── Unhealthy for SG (101-150)
│       │   ├── Unhealthy (151-200)
│       │   ├── Very Unhealthy (201-300)
│       │   └── Hazardous (301+)
│       │
│       └── Sticky Details Panel (conditional)
│           └── Only shows when location is selected
```

---

## State Management Flow

### TrafficDetailsPage.jsx State
```javascript
const [traffic, setTraffic] = useState(null)           // All traffic data
const [selectedLocation, setSelectedLocation] = useState(null) // Selected location

// On mount: fetch traffic data every 10 seconds
useEffect(() => {
  fetchTraffic() // Initial fetch
  const interval = setInterval(fetchTraffic, 10000) // Repeat every 10 seconds
  return () => clearInterval(interval) // Cleanup
}, [])

// When traffic data updates → re-render
// When selectedLocation changes → show details
```

### EnvironmentalDetailsPage.jsx State
```javascript
const [environmental, setEnvironmental] = useState(null) // All environmental data
const [selectedLocation, setSelectedLocation] = useState(null) // Selected location

// On mount: fetch environmental data every 15 seconds
useEffect(() => {
  fetchEnvironmental() // Initial fetch
  const interval = setInterval(fetchEnvironmental, 15000) // Repeat every 15 seconds
  return () => clearInterval(interval) // Cleanup
}, [])

// When environmental data updates → re-render
// When selectedLocation changes → show details
```

---

## Navigation Flow

```
Landing Page
    ↓
Login/Signup
    ↓
Dashboard Home
    ↓
City Map Page (/dashboard/map)
    ├─ [View Details] (Traffic)
    │   ↓
    │   Traffic Details Page (/dashboard/traffic)
    │   ├─ Shows 5 traffic locations
    │   ├─ Real-time updates every 10 seconds
    │   ├─ Click location → see detailed metrics
    │   └─ [Back button] → returns to City Map
    │
    ├─ [View Details] (Environmental)
    │   ↓
    │   Environmental Details Page (/dashboard/environmental)
    │   ├─ Shows 5 environmental locations
    │   ├─ Real-time updates every 15 seconds
    │   ├─ Click location → see detailed metrics
    │   └─ [Back button] → returns to City Map
    │
    └─ [View Details] (Crowd Insights)
        ↓
        Crowd Insights Page (future implementation)
```

---

*Last Updated: February 7, 2025*
*SmartCitizenHub City Map Module Architecture*
