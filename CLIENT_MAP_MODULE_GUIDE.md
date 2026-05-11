# City Map Module - Traffic Updates & Environmental Data

This documentation provides a complete guide to the Traffic Updates and Environmental Data modules integrated into the SmartCitizenHub City Map feature.

## Overview

The City Map module now includes two comprehensive real-time data tracking systems:

1. **Traffic Updates** - Real-time traffic conditions and congestion monitoring
2. **Environmental Data** - Air quality and environmental metrics monitoring

Both modules use simulated real-time API data for demonstration purposes and can be easily integrated with actual real-time data services.

---

## File Structure

### Frontend Files

#### 1. Data Files (JSON)
- **Location**: `client/src/data/`
- **Files**:
  - `traffic-data.json` - Sample traffic data with 5 monitored locations
  - `environmental-data.json` - Sample environmental data with 5 locations

#### 2. Page Components
- **Location**: `client/src/pages/dashboard/`
- **Files**:
  - `TrafficDetailsPage.jsx` - Comprehensive traffic details view with real-time updates
  - `EnvironmentalDetailsPage.jsx` - Comprehensive environmental details view with real-time updates
  - `MapPage.jsx` - Updated with "View Details" navigation buttons

#### 3. API Service
- **Location**: `client/src/api/`
- **File**: `map.api.js` - API client for fetching traffic and environmental data

### Backend Files

#### 1. Controllers
- **Location**: `server/src/controllers/`
- **Files**:
  - `trafficController.js` - Handles traffic updates with real-time simulations
  - `environmentalController.js` - Handles environmental data with real-time simulations

#### 2. Routes
- **Location**: `server/src/routes/`
- **File**: `mapRoutes.js` - API routes for traffic and environmental endpoints

#### 3. Main Server
- **Location**: `server/src/`
- **File**: `index.js` - Updated with map routes integration

---

## JSON Data Structure

### Traffic Data (traffic-data.json)

```json
{
  "trafficUpdates": [
    {
      "id": "traffic_001",
      "location": "Main Street & 5th Avenue",
      "coordinates": {
        "lat": 40.7128,
        "lng": -74.0060
      },
      "congestionLevel": "high|moderate|low",
      "congestionPercentage": 85,
      "averageSpeed": 12,
      "speedLimit": 25,
      "vehicles": 250,
      "timestamp": "ISO 8601 timestamp",
      "trend": "increasing|stable|decreasing",
      "estimatedDelay": 15,
      "roadCondition": "wet|dry",
      "incidents": 2
    }
  ],
  "summary": {
    "totalLocations": 5,
    "highCongestionCount": 2,
    "moderateCongestionCount": 2,
    "lowCongestionCount": 1,
    "averageCongestion": 63.6,
    "totalIncidents": 4,
    "lastUpdated": "ISO 8601 timestamp"
  }
}
```

**Field Descriptions:**
- `id`: Unique identifier for the traffic location
- `location`: Human-readable location name
- `coordinates`: GPS coordinates (lat/lng)
- `congestionLevel`: Severity level (high = >70%, moderate = 40-70%, low = <40%)
- `congestionPercentage`: Current congestion as percentage
- `averageSpeed`: Current average speed in km/h
- `speedLimit`: Road speed limit in km/h
- `vehicles`: Number of active vehicles in the area
- `timestamp`: UTC timestamp of last data update
- `trend`: Direction of traffic change
- `estimatedDelay`: Estimated delay in minutes
- `roadCondition`: Surface condition (wet/dry)
- `incidents`: Count of active incidents (accidents, etc.)

### Environmental Data (environmental-data.json)

```json
{
  "environmentalData": [
    {
      "id": "env_001",
      "location": "Downtown Core",
      "coordinates": {
        "lat": 40.7128,
        "lng": -74.0060
      },
      "airQuality": {
        "aqi": 128,
        "level": "unhealthy_for_sensitive_groups|moderate|good|etc.",
        "color": "#ff7e14",
        "description": "Unhealthy for Sensitive Groups"
      },
      "pollutants": {
        "pm25": 45.2,
        "pm10": 62.5,
        "o3": 58.0,
        "no2": 32.1,
        "so2": 12.5,
        "co": 450.0
      },
      "temperature": 28,
      "humidity": 65,
      "windSpeed": 12,
      "visibility": 8,
      "timestamp": "ISO 8601 timestamp",
      "trend": "worsening|stable|improving"
    }
  ],
  "summary": {
    "averageAQI": 84.2,
    "worstArea": "Downtown Core (AQI: 128)",
    "bestArea": "Upper East Side (AQI: 52)",
    "areasOfConcern": 2,
    "averageTemperature": 26.4,
    "averageHumidity": 64,
    "lastUpdated": "ISO 8601 timestamp",
    "aqiLevels": {
      "good": 1,
      "moderate": 2,
      "unhealthy_for_sensitive_groups": 2,
      "unhealthy": 0,
      "very_unhealthy": 0,
      "hazardous": 0
    }
  }
}
```

**Field Descriptions:**
- `aqi`: Air Quality Index (0-500 scale)
  - 0-50: Good (Green)
  - 51-100: Moderate (Yellow)
  - 101-150: Unhealthy for Sensitive Groups (Orange)
  - 151-200: Unhealthy (Red)
  - 201-300: Very Unhealthy (Purple)
  - 301+: Hazardous (Maroon)
- `pollutants`: Particulate matter and gases in µg/m³
  - `pm25`: Fine particulate matter (diameter < 2.5 µm)
  - `pm10`: Particulate matter (diameter < 10 µm)
  - `o3`: Ground-level ozone
  - `no2`: Nitrogen dioxide
  - `so2`: Sulfur dioxide
  - `co`: Carbon monoxide (ppm)
- `temperature`: Current temperature in Celsius
- `humidity`: Relative humidity percentage
- `windSpeed`: Wind speed in km/h
- `visibility`: Visibility in km
- `trend`: Direction of air quality change

---

## API Endpoints

### Traffic API Endpoints

#### Get All Traffic Updates
```
GET /api/map/traffic
Authentication: Required (JWT Token)
```

**Response:**
```json
{
  "trafficUpdates": [...],
  "summary": {...}
}
```

#### Get Specific Location Traffic
```
GET /api/map/traffic/:locationId
Authentication: Required
```

**Parameters:**
- `locationId`: ID of the traffic location (e.g., "traffic_001")

**Response:**
```json
{
  "id": "traffic_001",
  "location": "...",
  ...
}
```

### Environmental API Endpoints

#### Get All Environmental Data
```
GET /api/map/environmental
Authentication: Required (JWT Token)
```

**Response:**
```json
{
  "environmentalData": [...],
  "summary": {...}
}
```

#### Get Specific Location Environmental Data
```
GET /api/map/environmental/:locationId
Authentication: Required
```

**Parameters:**
- `locationId`: ID of the environmental location (e.g., "env_001")

**Response:**
```json
{
  "id": "env_001",
  "location": "...",
  ...
}
```

---

## Frontend Implementation

### Using the Map API Service

```javascript
import { mapApi } from '@/api/map.api'

// Fetch all traffic updates
const trafficData = await mapApi.getTrafficUpdates()

// Fetch specific location traffic
const locationTraffic = await mapApi.getTrafficByLocation('traffic_001')

// Fetch all environmental data
const envData = await mapApi.getEnvironmentalData()

// Fetch specific location environmental data
const locationEnv = await mapApi.getEnvironmentalByLocation('env_001')
```

### Real-Time Updates

Both detail pages include automatic real-time updates:

- **Traffic Updates Page**: Updates every 10 seconds with simulated traffic changes
- **Environmental Page**: Updates every 15 seconds with simulated air quality changes

The updates simulate realistic variations in:
- Congestion percentages
- Vehicle counts
- Air quality indices
- Pollutant levels
- Weather conditions

### Navigation

From the **City Map** page (`/dashboard/map`):
- Click **"View Details"** button under "Traffic Updates" → `/dashboard/traffic`
- Click **"View Details"** button under "Environmental Data" → `/dashboard/environmental`

---

## Features

### Traffic Updates Page

**Summary Statistics:**
- Total monitored locations (5)
- High congestion count
- Average congestion percentage
- Active traffic incidents

**Location List:**
- Interactive location selection
- Color-coded congestion levels (Green/Yellow/Red)
- Congestion %, average speed, and vehicle count
- Trend indicators (improving/stable/worsening)

**Location Details Panel:**
- Selected location information
- Congestion level with badge
- Speed metrics (current vs limit)
- Vehicle count and estimated delay
- Road conditions
- Incident alerts with warnings

**Real-Time Features:**
- Auto-refreshing data every 10 seconds
- Dynamic metric updates
- Trend indicators
- Responsive design

### Environmental Details Page

**Summary Statistics:**
- Average AQI across all locations
- Worstarea and best area information
- Temperature and humidity averages
- Areas of concern count

**Location List:**
- Interactive location selection
- Color-coded AQI levels
- Air quality status and temperature
- Health impact assessment
- Trend indicators

**Location Details Panel:**
- AQI with health recommendations
- Detailed pollutant breakdown (PM2.5, PM10, O₃, NO₂, SO₂, CO)
- Weather metrics (humidity, wind speed, visibility, temperature)
- Health alerts for sensitive groups
- AQI scale reference legend

**Real-Time Features:**
- Auto-refreshing data every 15 seconds
- Dynamic pollutant level updates
- Weather condition updates
- Health alert system

---

## Integration with Real APIs

To integrate with actual real-time data services:

### Traffic Data Integration

Replace the simulated data in `trafficController.js` with actual API calls:

```javascript
// Example: Google Maps Traffic API, HERE Technologies, TomTom, etc.
const trafficData = await fetchFromTrafficAPI({
  bounds: userLocation.bounds,
  includeIncidents: true
})
```

### Environmental Data Integration

Replace simulated data in `environmentalController.js` with real air quality APIs:

```javascript
// Example: OpenWeatherMap API, EPA AirNow, IQAir API, etc.
const airQualityData = await fetchFromAirQualityAPI({
  lat: location.lat,
  lon: location.lng,
  includeDetails: true
})
```

---

## Data Refresh Strategy

### Current Simulation
- Traffic data refreshes with ±10% variation every cycle
- Environmental data refreshes with ±5-15% variation depending on metric
- Updates are generated on-demand for each API request

### Production Recommendations

1. **Caching**: Implement Redis caching to reduce API calls
2. **Webhooks**: Use real-time webhooks from data providers
3. **Background Jobs**: Queue data updates every 30-60 seconds
4. **WebSockets**: Stream live updates for real-time monitoring
5. **Fallback**: Store historical data for unavailable services

---

## Usage Examples

### Example 1: Monitor Traffic on City Map
1. Navigate to `/dashboard/map`
2. View the City Map with traffic and waste markers
3. Click "View Details" under "Traffic Updates"
4. Select specific locations to view detailed metrics
5. Watch real-time updates every 10 seconds

### Example 2: Check Air Quality
1. Navigate to `/dashboard/map`
2. Click "View Details" under "Environmental Data"
3. View all monitored areas with AQI ratings
4. Click on a location to see detailed pollutant levels
5. Check health recommendations

### Example 3: API Integration
```javascript
// In a React component
import { mapApi } from '@/api/map.api'
import { useEffect, useState } from 'react'

function TrafficMonitor() {
  const [traffic, setTraffic] = useState(null)

  useEffect(() => {
    const fetchTraffic = async () => {
      const data = await mapApi.getTrafficUpdates()
      setTraffic(data)
    }

    fetchTraffic()
    const interval = setInterval(fetchTraffic, 10000) // Update every 10 seconds
    return () => clearInterval(interval)
  }, [])

  return (
    <div>
      {traffic?.trafficUpdates.map(location => (
        <div key={location.id}>
          <h3>{location.location}</h3>
          <p>Congestion: {location.congestionPercentage}%</p>
        </div>
      ))}
    </div>
  )
}
```

---

## Troubleshooting

### Issue: "No data displayed on pages"
- ✓ Verify authentication token is valid
- ✓ Check network tab for API responses
- ✓ Ensure backend server is running

### Issue: "Real-time data not updating"
- ✓ Check that intervals are not being cleared
- ✓ Verify API endpoints are returning new data
- ✓ Check browser console for errors

### Issue: "Map not showing locations"
- ✓ Verify coordinates are valid (lat: -85 to 85, lng: -180 to 180)
- ✓ Check Leaflet library is properly loaded
- ✓ Ensure map container has valid height

---

## Performance Tips

1. **Limit Update Frequency**: Don't refresh more than every 5 seconds
2. **Pagination**: For large datasets, implement location pagination
3. **Filtering**: Allow users to filter by congestion level or AQI
4. **Lazy Loading**: Load location details only when selected
5. **Debouncing**: Debounce API calls when user is filtering/searching

---

## Security Considerations

1. **Authentication**: All endpoints require JWT authentication
2. **Rate Limiting**: Implement rate limiting to prevent abuse
3. **Data Validation**: Validate coordinates and metrics on backend
4. **HTTPS**: Always use HTTPS in production
5. **CORS**: Configure proper CORS policies

---

## Future Enhancements

1. ✅ Historical data tracking
2. ✅ Predictive analytics for traffic patterns
3. ✅ Health alerts for high AQI readings
4. ✅ Mobile app integration
5. ✅ Export data to CSV/PDF
6. ✅ Custom alerts and notifications
7. ✅ Integration with other city services
8. ✅ Multi-language support

---

## Support & Questions

For issues or questions regarding the City Map module, contact the development team or raise an issue in the project repository.

**Key Contact Points:**
- Backend API: `/server/src/routes/mapRoutes.js`
- Frontend Components: `/client/src/pages/dashboard/`
- API Service: `/client/src/api/map.api.js`

---

## Version History

- **v1.0.0** (Current): Initial release with traffic and environmental data modules
  - 5 monitored traffic locations
  - 5 monitored environmental locations
  - Real-time simulation with auto-refresh
  - Detailed views with map integration
  - Complete API endpoints

---

*Last Updated: February 7, 2025*
*SmartCitizenHub City Map Module*
