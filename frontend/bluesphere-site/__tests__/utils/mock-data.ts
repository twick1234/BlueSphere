// Mock data generators for BlueSphere marine testing

// Marine station mock data
export const mockStations = [
  {
    id: "41001",
    lat: 34.7,
    lon: -72.7,
    name: "East Hatteras",
    depth: 2890,
    status: "active",
    type: "buoy",
    deployed: "2021-03-15T10:30:00Z",
    lastUpdate: "2024-09-22T12:00:00Z"
  },
  {
    id: "41002",
    lat: 32.3,
    lon: -75.4,
    name: "South Hatteras",
    depth: 3100,
    status: "active",
    type: "buoy",
    deployed: "2020-11-20T14:15:00Z",
    lastUpdate: "2024-09-22T12:00:00Z"
  },
  {
    id: "46001",
    lat: 56.3,
    lon: -148.1,
    name: "Gulf of Alaska",
    depth: 4206,
    status: "maintenance",
    type: "buoy",
    deployed: "2019-08-10T09:45:00Z",
    lastUpdate: "2024-09-20T08:30:00Z"
  }
];

// Ocean observation mock data
export const mockObservations = [
  {
    id: 10001,
    station_id: "41001",
    time: "2024-09-22T12:00:00Z",
    sst_c: 24.8,
    qc_flag: 1,
    lat: 34.7,
    lon: -72.7,
    source: "NDBC",
    anomaly_c: 2.1
  },
  {
    id: 10002,
    station_id: "41001",
    time: "2024-09-22T11:00:00Z",
    sst_c: 24.6,
    qc_flag: 1,
    lat: 34.7,
    lon: -72.7,
    source: "NDBC",
    anomaly_c: 1.9
  },
  {
    id: 10003,
    station_id: "41002",
    time: "2024-09-22T12:00:00Z",
    sst_c: 26.2,
    qc_flag: 1,
    lat: 32.3,
    lon: -75.4,
    source: "NDBC",
    anomaly_c: 3.4
  }
];

// Shark tracking mock data
export const mockSharkData = [
  {
    id: "SHARK_001",
    species: "Carcharodon carcharias",
    commonName: "Great White Shark",
    name: "Deep Blue",
    lat: 37.7749,
    lon: -122.4194,
    timestamp: "2024-09-22T10:30:00Z",
    depth: 45,
    temperature: 18.2,
    speed: 2.8,
    direction: 145,
    batteryLevel: 87,
    lastPing: "2024-09-22T10:30:00Z",
    trackingDays: 89
  },
  {
    id: "SHARK_002",
    species: "Carcharhinus leucas",
    commonName: "Bull Shark",
    name: "Brutus",
    lat: 25.7617,
    lon: -80.1918,
    timestamp: "2024-09-22T11:15:00Z",
    depth: 12,
    temperature: 27.5,
    speed: 1.9,
    direction: 78,
    batteryLevel: 94,
    lastPing: "2024-09-22T11:15:00Z",
    trackingDays: 34
  }
];

// Marine alerts mock data
export const mockAlerts = [
  {
    id: "ALERT_001",
    type: "marine_heatwave",
    severity: "moderate",
    region: "North Atlantic",
    description: "Marine heatwave conditions detected with temperatures 2-3°C above normal",
    coordinates: { lat: 40.0, lon: -70.0 },
    radius: 500, // km
    timestamp: "2024-09-22T08:00:00Z",
    active: true,
    duration: 72, // hours
    intensity: 2.8,
    forecast: "Expected to persist for 3-5 days"
  },
  {
    id: "ALERT_002",
    type: "temperature_anomaly",
    severity: "high",
    region: "Gulf of Mexico",
    description: "Significant temperature anomaly detected",
    coordinates: { lat: 27.5, lon: -90.0 },
    radius: 300,
    timestamp: "2024-09-22T06:30:00Z",
    active: true,
    duration: 24,
    intensity: 4.2,
    forecast: "Peak intensity expected within 24 hours"
  }
];

// Marine biodiversity mock data
export const mockSpeciesData = [
  {
    id: "SPECIES_001",
    scientificName: "Thunnus albacares",
    commonName: "Yellowfin Tuna",
    sightings: 247,
    lastSighted: "2024-09-21T14:20:00Z",
    coordinates: { lat: 15.5, lon: -61.0 },
    abundance: "moderate",
    trend: "stable",
    confidence: 0.87
  },
  {
    id: "SPECIES_002",
    scientificName: "Delphinus delphis",
    commonName: "Common Dolphin",
    sightings: 89,
    lastSighted: "2024-09-22T09:45:00Z",
    coordinates: { lat: 33.8, lon: -118.4 },
    abundance: "high",
    trend: "increasing",
    confidence: 0.94
  }
];

// Conservation action mock data
export const mockConservationData = [
  {
    id: "ACTION_001",
    title: "Coral Reef Restoration Project",
    location: "Great Barrier Reef",
    coordinates: { lat: -18.2871, lon: 147.6992 },
    status: "active",
    startDate: "2024-01-15T00:00:00Z",
    impact: {
      areaRestored: 150, // hectares
      speciesProtected: 89,
      carbonSequestered: 2400 // tonnes
    },
    funding: {
      target: 2500000,
      raised: 1875000,
      currency: "USD"
    },
    participants: 1247
  }
];

// Historical data time series
export const generateMockTimeSeries = (
  startDate: string,
  endDate: string,
  interval: 'hourly' | 'daily' | 'monthly' = 'daily'
) => {
  const start = new Date(startDate);
  const end = new Date(endDate);
  const data = [];

  let current = new Date(start);
  let intervalMs;

  switch (interval) {
    case 'hourly':
      intervalMs = 3600000;
      break;
    case 'daily':
      intervalMs = 86400000;
      break;
    case 'monthly':
      intervalMs = 2592000000; // ~30 days
      break;
  }

  while (current <= end) {
    const baseTemp = 23 + Math.sin((current.getTime() / 86400000) * 2 * Math.PI / 365) * 3;
    const noise = (Math.random() - 0.5) * 2;

    data.push({
      timestamp: current.toISOString(),
      value: Math.round((baseTemp + noise) * 100) / 100,
      quality: Math.random() > 0.1 ? 'good' : 'fair'
    });

    current = new Date(current.getTime() + intervalMs);
  }

  return data;
};

// API response templates
export const createMockApiResponse = <T>(data: T, metadata = {}) => ({
  data,
  metadata: {
    timestamp: new Date().toISOString(),
    version: "1.0",
    source: "BlueSphere Test API",
    ...metadata
  },
  status: "success"
});

export const createMockApiError = (message: string, code = "INTERNAL_ERROR") => ({
  error: {
    code,
    message,
    timestamp: new Date().toISOString()
  },
  status: "error"
});

// Performance test data
export const generateLargeDataset = (size: number) => {
  return Array.from({ length: size }, (_, index) => ({
    id: `DATA_${index.toString().padStart(6, '0')}`,
    timestamp: new Date(Date.now() - (size - index) * 3600000).toISOString(),
    lat: -90 + Math.random() * 180,
    lon: -180 + Math.random() * 360,
    value: Math.random() * 35,
    quality: Math.random() > 0.1 ? 1 : 2
  }));
};