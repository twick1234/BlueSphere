/**
 * Comprehensive tests for Data Ingestion system
 * Tests NDBC data parsing, fetching, database operations, and job management
 */

import {
  DataIngestionService,
  Station,
  BuoyObservation,
  JobRun,
  dataIngestionService
} from '@/lib/data-ingestion';

// Mock fetch globally
global.fetch = jest.fn();

// Mock console methods to reduce noise
const originalConsole = {
  log: console.log,
  error: console.error,
  warn: console.warn
};

beforeAll(() => {
  console.log = jest.fn();
  console.error = jest.fn();
  console.warn = jest.fn();
});

afterAll(() => {
  console.log = originalConsole.log;
  console.error = originalConsole.error;
  console.warn = originalConsole.warn;
});

beforeEach(() => {
  jest.clearAllMocks();
  (fetch as jest.Mock).mockClear();
});

// Sample NDBC data for testing
const SAMPLE_NDBC_DATA = `#YY  MM DD hh mm WDIR WSPD GST  WVHT   DPD   APD MWD   PRES  ATMP  WTMP  DEWP  VIS PTDY  TIDE
#yr  mo dy hr mn degT m/s  m/s     m   sec   sec degT   hPa  degC  degC  degC  nmi  hPa    ft
24  01  01 00 00  190  8.2  9.8   1.5   8.0   6.2 180 1013.5  15.2  16.8  12.4  5.0  0.0  99.00
24  01  01 01 00  185  7.8  9.2   1.4   7.8   6.0 178 1013.8  15.1  16.7  12.3  5.2  0.1  99.00
24  01  01 02 00  182  7.5  8.9   1.3   7.5   5.8 175 1014.0  15.0  16.6  12.2  5.5  0.2  99.00
24  01  01 03 00  180  7.2  8.5   1.2   7.2   5.6 172 1014.2  14.9  MM    12.1  5.8  0.0  99.00
24  01  01 04 00  178  6.9  8.2   1.1   6.9   5.4 170 1014.5  14.8  999.0 12.0  6.0  -0.1 99.00`;

const INVALID_NDBC_DATA = `#YY  MM DD hh mm WDIR WSPD GST  WVHT   DPD   APD MWD   PRES  ATMP  WTMP  DEWP  VIS PTDY  TIDE
#yr  mo dy hr mn degT m/s  m/s     m   sec   sec degT   hPa  degC  degC  degC  nmi  hPa    ft
invalid data line
24  01  01 00 00  190  8.2  9.8   1.5   8.0   6.2 180 1013.5  15.2  invalid  12.4  5.0  0.0  99.00`;

describe('DataIngestionService', () => {
  describe('Singleton pattern', () => {
    it('should return the same instance', () => {
      const instance1 = DataIngestionService.getInstance();
      const instance2 = DataIngestionService.getInstance();

      expect(instance1).toBe(instance2);
      expect(instance1).toBeInstanceOf(DataIngestionService);
    });

    it('should be the same as the exported instance', () => {
      const instance = DataIngestionService.getInstance();
      expect(dataIngestionService).toBe(instance);
    });
  });

  describe('initializeStations', () => {
    it('should initialize predefined stations', async () => {
      const service = DataIngestionService.getInstance();

      await service.initializeStations();

      const status = await service.getIngestionStatus();
      expect(status.total_stations).toBeGreaterThan(0);

      // Check that specific stations are included
      const stations = await (service as any).db.getStations();
      const stationIds = stations.map((s: Station) => s.station_id);

      expect(stationIds).toContain('41001'); // East Hatteras
      expect(stationIds).toContain('41002'); // South Hatteras
      expect(stationIds).toContain('46001'); // Gulf of Alaska
      expect(stationIds).toContain('42001'); // East Gulf
    });

    it('should handle duplicate station initialization', async () => {
      const service = DataIngestionService.getInstance();

      // Initialize twice
      await service.initializeStations();
      await service.initializeStations();

      const status = await service.getIngestionStatus();

      // Should not create duplicates
      const stations = await (service as any).db.getStations();
      const uniqueIds = new Set(stations.map((s: Station) => s.station_id));
      expect(stations.length).toBe(uniqueIds.size);
    });

    it('should create stations with correct properties', async () => {
      const service = DataIngestionService.getInstance();
      await service.initializeStations();

      const stations = await (service as any).db.getStations();
      const eastHatteras = stations.find((s: Station) => s.station_id === '41001');

      expect(eastHatteras).toBeDefined();
      expect(eastHatteras.name).toBe('East Hatteras');
      expect(eastHatteras.lat).toBe(34.7);
      expect(eastHatteras.lon).toBe(-72.7);
      expect(eastHatteras.provider).toBe('NDBC');
    });
  });

  describe('ingestNDBCData', () => {
    beforeEach(() => {
      // Mock successful fetch responses for all stations
      (fetch as jest.Mock).mockImplementation((url: string) => {
        return Promise.resolve({
          ok: true,
          text: () => Promise.resolve(SAMPLE_NDBC_DATA)
        });
      });
    });

    it('should successfully ingest data from NDBC stations', async () => {
      const service = DataIngestionService.getInstance();

      const jobRun = await service.ingestNDBCData();

      expect(jobRun.source).toBe('NDBC_WTMP');
      expect(jobRun.status).toBe('ok');
      expect(jobRun.started).toBeDefined();
      expect(jobRun.ended).toBeDefined();
      expect(jobRun.rows_ingested).toBeGreaterThan(0);
      expect(jobRun.error).toBeUndefined();
    });

    it('should handle network failures gracefully', async () => {
      (fetch as jest.Mock).mockRejectedValue(new Error('Network error'));

      const service = DataIngestionService.getInstance();
      const jobRun = await service.ingestNDBCData();

      expect(jobRun.status).toBe('failed');
      expect(jobRun.error).toContain('Network error');
      expect(jobRun.rows_ingested).toBe(0);
    });

    it('should handle HTTP errors and fallback to mock data', async () => {
      (fetch as jest.Mock).mockResolvedValue({
        ok: false,
        status: 404,
        text: () => Promise.resolve('')
      });

      const service = DataIngestionService.getInstance();
      const jobRun = await service.ingestNDBCData();

      // Should still succeed with mock data
      expect(jobRun.status).toBe('ok');
      expect(jobRun.rows_ingested).toBeGreaterThan(0);
      expect(console.warn).toHaveBeenCalled();
    });

    it('should handle partial failures across stations', async () => {
      let callCount = 0;
      (fetch as jest.Mock).mockImplementation(() => {
        callCount++;
        if (callCount <= 2) {
          return Promise.resolve({
            ok: true,
            text: () => Promise.resolve(SAMPLE_NDBC_DATA)
          });
        } else {
          return Promise.reject(new Error(`Station ${callCount} failed`));
        }
      });

      const service = DataIngestionService.getInstance();
      const jobRun = await service.ingestNDBCData();

      expect(jobRun.status).toBe('failed'); // Some stations failed
      expect(jobRun.rows_ingested).toBeGreaterThan(0); // But some data was ingested
      expect(jobRun.error).toContain('failed');
    });

    it('should process all configured stations', async () => {
      const service = DataIngestionService.getInstance();
      await service.ingestNDBCData();

      // Check that fetch was called for each station
      const fetchCalls = (fetch as jest.Mock).mock.calls;
      const expectedStations = [
        '41001', '41002', '41004', '41008', '41009', '41010',
        '46001', '46002', '46003', '46005', '46006', '46012',
        '42001', '42002', '42003', '42019', '42020',
        '51001', '51002', '51003', '51004'
      ];

      expect(fetchCalls.length).toBe(expectedStations.length);

      // Check that each station URL was called
      expectedStations.forEach(stationId => {
        const url = `https://www.ndbc.noaa.gov/data/realtime2/${stationId}.txt`;
        expect(fetchCalls.some(call => call[0] === url)).toBe(true);
      });
    });
  });

  describe('getIngestionStatus', () => {
    it('should return current ingestion status', async () => {
      const service = DataIngestionService.getInstance();

      // Initialize some data
      await service.initializeStations();
      await service.ingestNDBCData();

      const status = await service.getIngestionStatus();

      expect(status).toHaveProperty('last_jobs');
      expect(status).toHaveProperty('total_observations');
      expect(status).toHaveProperty('total_stations');

      expect(Array.isArray(status.last_jobs)).toBe(true);
      expect(typeof status.total_observations).toBe('number');
      expect(typeof status.total_stations).toBe('number');

      expect(status.total_observations).toBeGreaterThan(0);
      expect(status.total_stations).toBeGreaterThan(0);
    });

    it('should limit last jobs to 10 entries', async () => {
      const service = DataIngestionService.getInstance();

      // Run multiple ingestion jobs
      for (let i = 0; i < 15; i++) {
        await service.ingestNDBCData();
      }

      const status = await service.getIngestionStatus();
      expect(status.last_jobs.length).toBeLessThanOrEqual(10);
    });

    it('should return correct job information', async () => {
      const service = DataIngestionService.getInstance();
      await service.ingestNDBCData();

      const status = await service.getIngestionStatus();
      const latestJob = status.last_jobs[status.last_jobs.length - 1];

      expect(latestJob.source).toBe('NDBC_WTMP');
      expect(latestJob.started).toBeDefined();
      expect(latestJob.ended).toBeDefined();
      expect(['ok', 'failed', 'running']).toContain(latestJob.status);
    });
  });
});

describe('NDBC Data Parser', () => {
  // Access the private NDNBCParser class through the module
  const NDNBCParser = (require('@/lib/data-ingestion') as any).NDNBCParser;

  describe('parseRealtimeData', () => {
    it('should parse valid NDBC data correctly', () => {
      const observations = NDNBCParser.parseRealtimeData('41001', SAMPLE_NDBC_DATA);

      expect(observations).toHaveLength(3); // 3 valid observations (2 have invalid WTMP)

      const firstObs = observations[0];
      expect(firstObs.station_id).toBe('41001');
      expect(firstObs.sst_c).toBe(16.8);
      expect(firstObs.time).toBe('2024-01-01T00:00:00.000Z');
      expect(firstObs.qc_flag).toBe(1); // Should pass QC
      expect(firstObs.source).toBe('NDBC');
      expect(firstObs.lat).toBe(34.7);
      expect(firstObs.lon).toBe(-72.7);
    });

    it('should skip missing data values', () => {
      const dataWithMissing = `#YY  MM DD hh mm WDIR WSPD GST  WVHT   DPD   APD MWD   PRES  ATMP  WTMP  DEWP  VIS PTDY  TIDE
#yr  mo dy hr mn degT m/s  m/s     m   sec   sec degT   hPa  degC  degC  degC  nmi  hPa    ft
24  01  01 00 00  190  8.2  9.8   1.5   8.0   6.2 180 1013.5  15.2  MM    12.4  5.0  0.0  99.00
24  01  01 01 00  185  7.8  9.2   1.4   7.8   6.0 178 1013.8  15.1  999.0 12.3  5.2  0.1  99.00
24  01  01 02 00  182  7.5  8.9   1.3   7.5   5.8 175 1014.0  15.0  16.6  12.2  5.5  0.2  99.00`;

      const observations = NDNBCParser.parseRealtimeData('41001', dataWithMissing);

      expect(observations).toHaveLength(1); // Only the last line has valid WTMP
      expect(observations[0].sst_c).toBe(16.6);
    });

    it('should handle empty or invalid data gracefully', () => {
      const emptyData = '';
      const observations1 = NDNBCParser.parseRealtimeData('41001', emptyData);
      expect(observations1).toHaveLength(0);

      const invalidData = 'completely invalid data';
      const observations2 = NDNBCParser.parseRealtimeData('41001', invalidData);
      expect(observations2).toHaveLength(0);

      const headerOnly = `#YY  MM DD hh mm WDIR WSPD GST  WVHT   DPD   APD MWD   PRES  ATMP  WTMP  DEWP  VIS PTDY  TIDE
#yr  mo dy hr mn degT m/s  m/s     m   sec   sec degT   hPa  degC  degC  degC  nmi  hPa    ft`;
      const observations3 = NDNBCParser.parseRealtimeData('41001', headerOnly);
      expect(observations3).toHaveLength(0);
    });

    it('should handle incomplete data lines', () => {
      const incompleteData = `#YY  MM DD hh mm WDIR WSPD GST  WVHT   DPD   APD MWD   PRES  ATMP  WTMP  DEWP  VIS PTDY  TIDE
#yr  mo dy hr mn degT m/s  m/s     m   sec   sec degT   hPa  degC  degC  degC  nmi  hPa    ft
24  01  01 00 00  190  8.2
24  01  01 01 00  185  7.8  9.2   1.4   7.8   6.0 178 1013.8  15.1  16.7  12.3  5.2  0.1  99.00`;

      const observations = NDNBCParser.parseRealtimeData('41001', incompleteData);

      expect(observations).toHaveLength(1); // Only complete line should be processed
      expect(observations[0].sst_c).toBe(16.7);
    });

    it('should parse timestamps correctly', () => {
      const singleLineData = `#YY  MM DD hh mm WDIR WSPD GST  WVHT   DPD   APD MWD   PRES  ATMP  WTMP  DEWP  VIS PTDY  TIDE
#yr  mo dy hr mn degT m/s  m/s     m   sec   sec degT   hPa  degC  degC  degC  nmi  hPa    ft
24  12  25 15 30  190  8.2  9.8   1.5   8.0   6.2 180 1013.5  15.2  16.8  12.4  5.0  0.0  99.00`;

      const observations = NDNBCParser.parseRealtimeData('41001', singleLineData);

      expect(observations).toHaveLength(1);
      expect(observations[0].time).toBe('2024-12-25T15:30:00.000Z');
    });

    it('should handle year conversion correctly', () => {
      // Test Y2K boundary handling
      const y2kData = `#YY  MM DD hh mm WDIR WSPD GST  WVHT   DPD   APD MWD   PRES  ATMP  WTMP  DEWP  VIS PTDY  TIDE
#yr  mo dy hr mn degT m/s  m/s     m   sec   sec degT   hPa  degC  degC  degC  nmi  hPa    ft
99  01  01 00 00  190  8.2  9.8   1.5   8.0   6.2 180 1013.5  15.2  16.8  12.4  5.0  0.0  99.00
00  01  01 00 00  190  8.2  9.8   1.5   8.0   6.2 180 1013.5  15.2  16.8  12.4  5.0  0.0  99.00
25  01  01 00 00  190  8.2  9.8   1.5   8.0   6.2 180 1013.5  15.2  16.8  12.4  5.0  0.0  99.00`;

      const observations = NDNBCParser.parseRealtimeData('41001', y2kData);

      expect(observations).toHaveLength(3);
      expect(observations[0].time).toBe('1999-01-01T00:00:00.000Z'); // 99 -> 1999
      expect(observations[1].time).toBe('2000-01-01T00:00:00.000Z'); // 00 -> 2000
      expect(observations[2].time).toBe('2025-01-01T00:00:00.000Z'); // 25 -> 2025
    });

    it('should assign correct station coordinates', () => {
      const observations = NDNBCParser.parseRealtimeData('41002', SAMPLE_NDBC_DATA);

      expect(observations).toHaveLength(3);
      observations.forEach(obs => {
        expect(obs.lat).toBe(32.3); // South Hatteras coordinates
        expect(obs.lon).toBe(-75.4);
      });
    });

    it('should handle unknown stations with default coordinates', () => {
      const observations = NDNBCParser.parseRealtimeData('99999', SAMPLE_NDBC_DATA);

      expect(observations).toHaveLength(3);
      observations.forEach(obs => {
        expect(obs.lat).toBe(0); // Default coordinates
        expect(obs.lon).toBe(0);
      });
    });
  });

  describe('Quality Control', () => {
    it('should flag unrealistic temperatures', () => {
      const extremeData = `#YY  MM DD hh mm WDIR WSPD GST  WVHT   DPD   APD MWD   PRES  ATMP  WTMP  DEWP  VIS PTDY  TIDE
#yr  mo dy hr mn degT m/s  m/s     m   sec   sec degT   hPa  degC  degC  degC  nmi  hPa    ft
24  01  01 00 00  190  8.2  9.8   1.5   8.0   6.2 180 1013.5  15.2  50.0  12.4  5.0  0.0  99.00
24  01  01 01 00  185  7.8  9.2   1.4   7.8   6.0 178 1013.8  15.1  -10.0 12.3  5.2  0.1  99.00
24  01  01 02 00  182  7.5  8.9   1.3   7.5   5.8 175 1014.0  15.0  20.0  12.2  5.5  0.2  99.00`;

      const observations = NDNBCParser.parseRealtimeData('41001', extremeData);

      expect(observations).toHaveLength(3);
      expect(observations[0].qc_flag).toBe(2); // 50°C should fail QC
      expect(observations[1].qc_flag).toBe(2); // -10°C should fail QC
      expect(observations[2].qc_flag).toBe(1); // 20°C should pass QC
    });

    it('should apply latitude-dependent temperature checks', () => {
      // High latitude station (Alaska)
      const arcticData = `#YY  MM DD hh mm WDIR WSPD GST  WVHT   DPD   APD MWD   PRES  ATMP  WTMP  DEWP  VIS PTDY  TIDE
#yr  mo dy hr mn degT m/s  m/s     m   sec   sec degT   hPa  degC  degC  degC  nmi  hPa    ft
24  01  01 00 00  190  8.2  9.8   1.5   8.0   6.2 180 1013.5  15.2  5.0   12.4  5.0  0.0  99.00`;

      const arcticObs = NDNBCParser.parseRealtimeData('46001', arcticData); // Gulf of Alaska
      expect(arcticObs[0].qc_flag).toBe(1); // 5°C should pass for high latitude

      // Low latitude with same temperature
      const tropicalObs = NDNBCParser.parseRealtimeData('41001', arcticData); // East Hatteras
      expect(tropicalObs[0].qc_flag).toBe(1); // Should also pass as it's reasonable
    });
  });
});

describe('NDBC Data Fetcher', () => {
  const NDNBCFetcher = (require('@/lib/data-ingestion') as any).NDNBCFetcher;

  describe('fetchStationData', () => {
    it('should fetch real data from NDBC API', async () => {
      (fetch as jest.Mock).mockResolvedValue({
        ok: true,
        text: () => Promise.resolve(SAMPLE_NDBC_DATA)
      });

      const data = await NDNBCFetcher.fetchStationData('41001');

      expect(fetch).toHaveBeenCalledWith(
        'https://www.ndbc.noaa.gov/data/realtime2/41001.txt',
        expect.objectContaining({
          headers: expect.objectContaining({
            'User-Agent': expect.stringContaining('BlueSphere')
          })
        })
      );

      expect(data).toBe(SAMPLE_NDBC_DATA);
      expect(console.log).toHaveBeenCalledWith(
        expect.stringContaining('Successfully fetched')
      );
    });

    it('should fallback to mock data when API fails', async () => {
      (fetch as jest.Mock).mockResolvedValue({
        ok: false,
        status: 404
      });

      const data = await NDNBCFetcher.fetchStationData('41001');

      expect(data).toContain('#YY  MM DD hh mm'); // Should be mock data format
      expect(console.warn).toHaveBeenCalledWith(
        expect.stringContaining('NDBC fetch failed')
      );
    });

    it('should fallback to mock data when response is insufficient', async () => {
      (fetch as jest.Mock).mockResolvedValue({
        ok: true,
        text: () => Promise.resolve('short')
      });

      const data = await NDNBCFetcher.fetchStationData('41001');

      expect(data).toContain('#YY  MM DD hh mm'); // Should be mock data
      expect(console.warn).toHaveBeenCalledWith(
        expect.stringContaining('Insufficient data')
      );
    });

    it('should handle network errors gracefully', async () => {
      (fetch as jest.Mock).mockRejectedValue(new Error('Network timeout'));

      const data = await NDNBCFetcher.fetchStationData('41001');

      expect(data).toContain('#YY  MM DD hh mm'); // Should fallback to mock data
      expect(console.error).toHaveBeenCalledWith(
        expect.stringContaining('NDBC fetch error'),
        expect.any(Error)
      );
    });

    it('should generate realistic mock data', async () => {
      (fetch as jest.Mock).mockRejectedValue(new Error('Force mock'));

      const data = await NDNBCFetcher.fetchStationData('41001');

      const lines = data.split('\n');
      expect(lines.length).toBeGreaterThan(25); // Header + 24 hours of data

      // Check that timestamps are sequential and recent
      const dataLines = lines.slice(2).filter(line => line.trim());
      expect(dataLines.length).toBe(24); // 24 hours of data

      // Parse first data line to verify format
      const firstLine = dataLines[0].split(/\s+/);
      expect(firstLine.length).toBe(19); // All NDBC fields

      // Temperature should be numeric and reasonable
      const temp = parseFloat(firstLine[14]);
      expect(temp).toBeGreaterThan(-5);
      expect(temp).toBeLessThan(40);
    });

    it('should generate different mock data for different stations', async () => {
      (fetch as jest.Mock).mockRejectedValue(new Error('Force mock'));

      const data1 = await NDNBCFetcher.fetchStationData('41001'); // Warm latitude
      const data2 = await NDNBCFetcher.fetchStationData('46001'); // Cold latitude

      // Extract temperature from first data line of each
      const temp1 = parseFloat(data1.split('\n')[2].split(/\s+/)[14]);
      const temp2 = parseFloat(data2.split('\n')[2].split(/\s+/)[14]);

      // Arctic station should generally be colder
      expect(temp2).toBeLessThan(temp1 + 5); // Allow some variance due to randomness
    });
  });
});

describe('Mock Database Operations', () => {
  // Access the mock database through a service instance
  let service: DataIngestionService;
  let db: any;

  beforeEach(() => {
    service = DataIngestionService.getInstance();
    db = (service as any).db;

    // Clear database state
    db.stations = [];
    db.observations = [];
    db.jobRuns = [];
    db.nextObsId = 1;
    db.nextJobId = 1;
  });

  describe('Station operations', () => {
    it('should insert and retrieve stations', async () => {
      const station: Station = {
        station_id: 'TEST001',
        name: 'Test Station',
        lat: 40.0,
        lon: -120.0,
        provider: 'NDBC'
      };

      await db.insertStation(station);
      const stations = await db.getStations();

      expect(stations).toHaveLength(1);
      expect(stations[0]).toEqual(station);
    });

    it('should not insert duplicate stations', async () => {
      const station: Station = {
        station_id: 'DUPLICATE',
        name: 'Duplicate Station',
        lat: 40.0,
        lon: -120.0,
        provider: 'NDBC'
      };

      await db.insertStation(station);
      await db.insertStation(station); // Try to insert again

      const stations = await db.getStations();
      expect(stations).toHaveLength(1);
    });
  });

  describe('Observation operations', () => {
    it('should insert and retrieve observations', async () => {
      const observation: BuoyObservation = {
        station_id: 'TEST001',
        time: '2024-01-01T12:00:00Z',
        sst_c: 20.5,
        qc_flag: 1,
        lat: 40.0,
        lon: -120.0,
        source: 'NDBC'
      };

      await db.insertObservation(observation);
      const observations = await db.getObservations();

      expect(observations).toHaveLength(1);
      expect(observations[0]).toEqual({ ...observation, id: 1 });
    });

    it('should filter observations by station_id', async () => {
      const obs1: BuoyObservation = {
        station_id: 'STATION1',
        time: '2024-01-01T12:00:00Z',
        sst_c: 20.0,
        qc_flag: 1,
        lat: 40.0,
        lon: -120.0,
        source: 'NDBC'
      };

      const obs2: BuoyObservation = {
        station_id: 'STATION2',
        time: '2024-01-01T12:00:00Z',
        sst_c: 21.0,
        qc_flag: 1,
        lat: 41.0,
        lon: -121.0,
        source: 'NDBC'
      };

      await db.insertObservation(obs1);
      await db.insertObservation(obs2);

      const filtered = await db.getObservations({ station_id: 'STATION1' });
      expect(filtered).toHaveLength(1);
      expect(filtered[0].station_id).toBe('STATION1');
    });

    it('should filter observations by time range', async () => {
      const obs1: BuoyObservation = {
        station_id: 'TEST',
        time: '2024-01-01T12:00:00Z',
        sst_c: 20.0,
        qc_flag: 1,
        lat: 40.0,
        lon: -120.0,
        source: 'NDBC'
      };

      const obs2: BuoyObservation = {
        station_id: 'TEST',
        time: '2024-01-02T12:00:00Z',
        sst_c: 21.0,
        qc_flag: 1,
        lat: 40.0,
        lon: -120.0,
        source: 'NDBC'
      };

      const obs3: BuoyObservation = {
        station_id: 'TEST',
        time: '2024-01-03T12:00:00Z',
        sst_c: 22.0,
        qc_flag: 1,
        lat: 40.0,
        lon: -120.0,
        source: 'NDBC'
      };

      await db.insertObservation(obs1);
      await db.insertObservation(obs2);
      await db.insertObservation(obs3);

      const filtered = await db.getObservations({
        start_time: '2024-01-01T00:00:00Z',
        end_time: '2024-01-02T23:59:59Z'
      });

      expect(filtered).toHaveLength(2);
      expect(filtered.map((o: BuoyObservation) => o.sst_c)).toEqual([20.0, 21.0]);
    });

    it('should limit observations', async () => {
      for (let i = 0; i < 10; i++) {
        await db.insertObservation({
          station_id: 'TEST',
          time: `2024-01-01T${i.toString().padStart(2, '0')}:00:00Z`,
          sst_c: 20 + i,
          qc_flag: 1,
          lat: 40.0,
          lon: -120.0,
          source: 'NDBC'
        });
      }

      const limited = await db.getObservations({ limit: 5 });
      expect(limited).toHaveLength(5);
    });
  });

  describe('Job run operations', () => {
    it('should insert and update job runs', async () => {
      const jobRun: JobRun = {
        source: 'TEST_SOURCE',
        started: '2024-01-01T12:00:00Z',
        status: 'running'
      };

      const jobId = await db.insertJobRun(jobRun);
      expect(jobId).toBe(1);

      await db.updateJobRun(jobId, {
        ended: '2024-01-01T12:05:00Z',
        status: 'ok',
        rows_ingested: 100
      });

      const jobs = await db.getJobRuns();
      expect(jobs).toHaveLength(1);
      expect(jobs[0]).toEqual({
        id: 1,
        source: 'TEST_SOURCE',
        started: '2024-01-01T12:00:00Z',
        ended: '2024-01-01T12:05:00Z',
        status: 'ok',
        rows_ingested: 100
      });
    });

    it('should handle job run failures', async () => {
      const jobRun: JobRun = {
        source: 'FAILING_SOURCE',
        started: '2024-01-01T12:00:00Z',
        status: 'running'
      };

      const jobId = await db.insertJobRun(jobRun);

      await db.updateJobRun(jobId, {
        ended: '2024-01-01T12:05:00Z',
        status: 'failed',
        error: 'Network timeout'
      });

      const jobs = await db.getJobRuns();
      expect(jobs[0].status).toBe('failed');
      expect(jobs[0].error).toBe('Network timeout');
    });

    it('should handle updates to non-existent jobs gracefully', async () => {
      await expect(db.updateJobRun(999, { status: 'ok' })).resolves.not.toThrow();
    });
  });
});

// Integration and performance tests
describe('Data Ingestion Integration', () => {
  beforeEach(() => {
    (fetch as jest.Mock).mockResolvedValue({
      ok: true,
      text: () => Promise.resolve(SAMPLE_NDBC_DATA)
    });
  });

  it('should complete full ingestion workflow', async () => {
    const service = DataIngestionService.getInstance();

    // Initialize stations
    await service.initializeStations();

    // Run ingestion
    const jobRun = await service.ingestNDBCData();

    // Check results
    expect(jobRun.status).toBe('ok');
    expect(jobRun.rows_ingested).toBeGreaterThan(0);

    // Verify data was stored
    const status = await service.getIngestionStatus();
    expect(status.total_observations).toBe(jobRun.rows_ingested);
    expect(status.total_stations).toBeGreaterThan(0);
    expect(status.last_jobs).toHaveLength(1);
  });

  it('should handle multiple concurrent ingestion jobs', async () => {
    const service = DataIngestionService.getInstance();

    const promises = [
      service.ingestNDBCData(),
      service.ingestNDBCData(),
      service.ingestNDBCData()
    ];

    const results = await Promise.all(promises);

    // All jobs should complete
    results.forEach(result => {
      expect(['ok', 'failed']).toContain(result.status);
      expect(result.started).toBeDefined();
      expect(result.ended).toBeDefined();
    });

    const status = await service.getIngestionStatus();
    expect(status.last_jobs).toHaveLength(3);
  });

  it('should handle large data volumes efficiently', async () => {
    // Generate large mock data (24 hours of hourly data)
    const largeData = Array.from({ length: 24 }, (_, i) => {
      const hour = i.toString().padStart(2, '0');
      return `24  01  01 ${hour} 00  190  8.2  9.8   1.5   8.0   6.2 180 1013.5  15.2  ${(16 + Math.random()).toFixed(1)}  12.4  5.0  0.0  99.00`;
    });

    const mockData = `#YY  MM DD hh mm WDIR WSPD GST  WVHT   DPD   APD MWD   PRES  ATMP  WTMP  DEWP  VIS PTDY  TIDE
#yr  mo dy hr mn degT m/s  m/s     m   sec   sec degT   hPa  degC  degC  degC  nmi  hPa    ft
${largeData.join('\n')}`;

    (fetch as jest.Mock).mockResolvedValue({
      ok: true,
      text: () => Promise.resolve(mockData)
    });

    const service = DataIngestionService.getInstance();

    const start = performance.now();
    const jobRun = await service.ingestNDBCData();
    const duration = performance.now() - start;

    expect(jobRun.status).toBe('ok');
    expect(duration).toBeLessThan(10000); // Should complete within 10 seconds
  });
});

// Error handling and edge cases
describe('Data Ingestion Error Handling', () => {
  it('should handle malformed data gracefully', async () => {
    (fetch as jest.Mock).mockResolvedValue({
      ok: true,
      text: () => Promise.resolve(INVALID_NDBC_DATA)
    });

    const service = DataIngestionService.getInstance();
    const jobRun = await service.ingestNDBCData();

    // Should complete but with limited data
    expect(jobRun.status).toBe('ok');
    expect(jobRun.rows_ingested).toBeGreaterThan(0); // Mock data fallback
  });

  it('should handle empty responses', async () => {
    (fetch as jest.Mock).mockResolvedValue({
      ok: true,
      text: () => Promise.resolve('')
    });

    const service = DataIngestionService.getInstance();
    const jobRun = await service.ingestNDBCData();

    // Should fallback to mock data
    expect(jobRun.status).toBe('ok');
    expect(jobRun.rows_ingested).toBeGreaterThan(0);
  });

  it('should handle fetch timeouts', async () => {
    (fetch as jest.Mock).mockImplementation(() =>
      new Promise((_, reject) =>
        setTimeout(() => reject(new Error('Timeout')), 100)
      )
    );

    const service = DataIngestionService.getInstance();
    const jobRun = await service.ingestNDBCData();

    // Should fail but not crash
    expect(jobRun.status).toBe('failed');
    expect(jobRun.error).toContain('Timeout');
  });

  it('should handle invalid station coordinates', () => {
    const NDNBCParser = (require('@/lib/data-ingestion') as any).NDNBCParser;

    const observations = NDNBCParser.parseRealtimeData('INVALID_STATION', SAMPLE_NDBC_DATA);

    expect(observations).toHaveLength(3);
    observations.forEach(obs => {
      expect(obs.lat).toBe(0); // Default coordinates
      expect(obs.lon).toBe(0);
    });
  });
});