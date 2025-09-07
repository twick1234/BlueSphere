# BlueSphere Temporal Temperature Data Pipeline

This document describes the comprehensive temporal temperature data ingestion pipeline for the BlueSphere ocean monitoring platform.

## Overview

The temporal data pipeline provides:
- **Historical temperature data ingestion** from NOAA ERSST v5 and OISST datasets
- **Multi-scale data aggregation** (daily, monthly, yearly)
- **Climate anomaly calculation** against configurable baselines
- **Marine heatwave detection** 
- **High-performance API endpoints** with caching
- **Scalable database design** optimized for time-series queries

## Architecture

### Database Schema

The pipeline uses PostgreSQL with the following key tables:

- `temporal_temperature_grid`: Raw gridded temperature data
- `temporal_temperature_daily`: Daily aggregated data (1° spatial bins)  
- `temporal_temperature_monthly`: Monthly aggregated data
- `temporal_temperature_yearly`: Yearly aggregated data
- `climate_baseline`: Climate baselines for anomaly calculations
- `temperature_anomaly`: Temperature anomalies vs. baselines
- `marine_heatwave`: Detected marine heatwave events

### API Endpoints

The temporal API provides these key endpoints:

#### Temperature Data
- `GET /temporal/temperatures` - Retrieve historical temperature data
  - Parameters: `start_date`, `end_date`, `resolution`, `bbox`, `dataset`, `limit`, `offset`
  - Resolutions: `daily`, `monthly`, `yearly`, `grid`

#### Anomalies  
- `GET /temporal/anomalies` - Retrieve temperature anomaly data
  - Parameters: `start_date`, `end_date`, `baseline`, `bbox`, `threshold`

#### Marine Heatwaves
- `GET /temporal/heatwaves` - Retrieve marine heatwave events
  - Parameters: `start_date`, `end_date`, `bbox`, `threshold`, `duration`

#### Metadata
- `GET /temporal/availability` - Data availability summary
- `GET /temporal/stats/summary` - Statistical summary for regions/periods

## Setup and Installation

### 1. Database Setup

```bash
# Create database tables (including new temporal tables)
cd /Users/marklindon/BlueSphere/bluesphere
python backend/create_tables.py

# Or drop existing and recreate
python backend/create_tables.py --drop
```

### 2. Install Dependencies

```bash
# Install additional requirements for temporal processing
pip install -r backend/requirements.txt
```

### 3. Redis Setup (Optional but Recommended)

For caching support:
```bash
# Install Redis
brew install redis  # macOS
# or apt-get install redis-server  # Ubuntu

# Start Redis
redis-server
```

## Data Ingestion

### ERSST v5 Data (Monthly, 1854-present)

```bash
# Historical backfill (WARNING: This will download ~170 years of data!)
python ingestion/temporal_ingest_ersst.py --mode backfill --start-year 2020 --end-year 2023

# Incremental updates (for recent data)
python ingestion/temporal_ingest_ersst.py --mode incremental --lookback-months 6

# Test with limited files
python ingestion/temporal_ingest_ersst.py --mode backfill --start-year 2023 --max-files 12
```

### OISST v2.1 Data (Daily, 1981-present)

```bash
# Historical backfill (WARNING: High-resolution daily data = very large!)
python ingestion/temporal_ingest_oisst.py --mode backfill --start-date 2023-01-01 --end-date 2023-12-31

# Incremental updates
python ingestion/temporal_ingest_oisst.py --mode incremental --lookback-days 30

# Store full grid resolution (not recommended for large time ranges)
python ingestion/temporal_ingest_oisst.py --mode incremental --store-grid --lookback-days 7
```

### Sample Data Generation (For Testing)

```bash
# Generate sample data for development/testing
python scripts/generate_sample_data.py --datasets both --start-year 2020 --end-year 2023 --with-analysis

# Generate just ERSST-like data
python scripts/generate_sample_data.py --datasets ersst --start-year 2022 --end-year 2023

# Generate with higher resolution
python scripts/generate_sample_data.py --spatial-resolution 1.0 --with-analysis
```

## Data Processing and Aggregation

### Aggregation Tasks

```bash
# Aggregate daily to monthly data
python scripts/temporal_processor.py --task aggregate-monthly --year 2023 --dataset OISST

# Aggregate monthly to yearly data  
python scripts/temporal_processor.py --task aggregate-yearly --dataset ERSST

# Run all aggregation tasks
python scripts/temporal_processor.py --task all --dataset ERSST
```

### Climate Analysis

```bash
# Calculate climate baselines
python scripts/temporal_processor.py --task baselines

# Calculate temperature anomalies
python scripts/temporal_processor.py --task anomalies --baseline-period 1991-2020

# Detect marine heatwaves
python scripts/temporal_processor.py --task heatwaves --start-date 2023-01-01 --end-date 2023-12-31
```

## API Usage Examples

### Starting the API Server

```bash
# Using the enhanced backend app
cd /Users/marklindon/BlueSphere/bluesphere
python -m uvicorn backend.app:app --reload --port 8000

# The temporal endpoints will be available at /temporal/*
```

### Example API Calls

#### Get Temperature Data
```bash
# Monthly temperature data for 2023
curl "http://localhost:8000/temporal/temperatures?start_date=2023-01-01&end_date=2023-12-31&resolution=monthly"

# Daily data for a specific region  
curl "http://localhost:8000/temporal/temperatures?start_date=2023-06-01&end_date=2023-06-30&resolution=daily&bbox=-80,25,-60,45"

# High-resolution grid data (if available)
curl "http://localhost:8000/temporal/temperatures?start_date=2023-07-01&end_date=2023-07-01&resolution=grid&limit=1000"
```

#### Get Temperature Anomalies
```bash
# Temperature anomalies vs 1991-2020 baseline
curl "http://localhost:8000/temporal/anomalies?start_date=2023-01-01&end_date=2023-12-31&baseline=1991-2020"

# Strong anomalies (> 2°C) in specific region
curl "http://localhost:8000/temporal/anomalies?start_date=2023-01-01&end_date=2023-12-31&threshold=2.0&bbox=-180,60,180,90"
```

#### Get Marine Heatwaves
```bash
# Marine heatwave events in 2023
curl "http://localhost:8000/temporal/heatwaves?start_date=2023-01-01&end_date=2023-12-31"

# Long-duration heatwaves (> 10 days) with 95th percentile threshold
curl "http://localhost:8000/temporal/heatwaves?start_date=2023-01-01&end_date=2023-12-31&duration=10&threshold=95"
```

#### Get Data Availability
```bash
# Check what data is available
curl "http://localhost:8000/temporal/availability"

# Check specific dataset availability
curl "http://localhost:8000/temporal/availability?dataset=ERSST&resolution=monthly"
```

#### Get Statistical Summary
```bash
# Temperature statistics for a region and time period
curl "http://localhost:8000/temporal/stats/summary?start_date=2023-01-01&end_date=2023-12-31&bbox=-80,25,-60,45"
```

## Performance Optimization

### Caching

The API implements Redis-based caching for expensive queries:
- Temperature data queries cached for 1 hour
- Anomaly queries cached for 1 hour  
- Heatwave queries cached for 2 hours
- Availability data cached for 6 hours
- Statistical summaries cached for 30 minutes

Clear cache:
```bash
curl -X POST "http://localhost:8000/temporal/cache/clear"
```

### Database Optimization

```bash
# Run maintenance tasks (vacuum, analyze)
python scripts/temporal_processor.py --task maintenance
```

### Recommended Indexing Strategy

The database models include optimized indexes for:
- **Temporal queries**: Date/year/month columns
- **Spatial queries**: Lat/lon columns with combined spatial indexes
- **Dataset filtering**: Dataset columns
- **Composite queries**: Multi-column indexes for common query patterns

## Data Volume Considerations

### ERSST v5
- **Temporal coverage**: 1854-present (~170 years)
- **Spatial resolution**: 2° × 2° (~10,000 grid points globally)
- **Frequency**: Monthly
- **Estimated size**: ~2.5M grid records, ~250K monthly aggregates

### OISST v2.1  
- **Temporal coverage**: 1981-present (~43 years)
- **Spatial resolution**: 0.25° × 0.25° (~1.4M grid points globally)
- **Frequency**: Daily
- **Estimated size**: ~22B grid records (if storing full resolution!)

**Recommendations**:
- For OISST, store only daily aggregates by default (not full grid)
- Use the `--store-grid` flag only for limited time ranges
- Consider spatial subsampling for development/testing

## Monitoring and Logging

### Job Status Tracking

All ingestion and processing jobs are tracked in the `job_run` table:

```sql
-- Check recent job status
SELECT job, status, finished_at, note 
FROM job_run 
ORDER BY finished_at DESC 
LIMIT 20;
```

### API Monitoring

The API includes comprehensive logging and error handling:
- Request/response logging
- Database query logging
- Cache hit/miss logging
- Error tracking with detailed messages

## Troubleshooting

### Common Issues

1. **Database Connection Errors**
   - Check PostgreSQL is running
   - Verify connection parameters in environment variables
   - Ensure database exists: `createdb bluesphere`

2. **Large Data Ingestion Timeouts**
   - Increase HTTP timeouts in ingestion scripts
   - Use incremental mode instead of full backfill
   - Monitor disk space during ingestion

3. **Memory Issues with High-Resolution Data**
   - Reduce batch sizes in ingestion scripts
   - Use spatial subsampling
   - Consider processing data in temporal chunks

4. **Slow API Queries**
   - Check if Redis caching is enabled
   - Verify database indexes are created
   - Run VACUUM ANALYZE on temporal tables
   - Reduce query date ranges or spatial extents

### Debug Mode

Enable verbose logging for all components:

```bash
# Ingestion
python ingestion/temporal_ingest_ersst.py --verbose

# Processing
python scripts/temporal_processor.py --verbose --task all

# API (set log level in uvicorn)
python -m uvicorn backend.app:app --log-level debug
```

## Development and Testing

### Running Tests

```bash
# Generate sample data for testing
python scripts/generate_sample_data.py --datasets both --start-year 2022 --end-year 2023 --with-analysis

# Test API endpoints
curl "http://localhost:8000/temporal/availability"
curl "http://localhost:8000/temporal/temperatures?start_date=2022-01-01&end_date=2022-12-31&resolution=monthly&limit=100"

# Test processing pipeline
python scripts/temporal_processor.py --task all --verbose
```

### Code Structure

```
backend/
├── models.py              # Database models (including temporal)
├── temporal_db.py         # Temporal data operations
├── temporal_api.py        # Temporal API endpoints
├── create_tables.py       # Database setup
└── app.py                 # Main FastAPI application

ingestion/
├── temporal_ingest_ersst.py    # ERSST v5 ingestion
├── temporal_ingest_oisst.py    # OISST v2.1 ingestion
└── (existing ingestion scripts)

scripts/
├── temporal_processor.py      # Data aggregation and analysis
└── generate_sample_data.py    # Sample data generation
```

## Future Enhancements

Potential improvements for the temporal data pipeline:

1. **Additional Datasets**
   - MODIS SST
   - VIIRS SST
   - Satellite altimetry data
   - In-situ temperature profiles

2. **Advanced Analytics**
   - Proper marine heatwave detection (using marineHeatwaves library)
   - Climate index calculations (ENSO, AMO, PDO)
   - Trend analysis and change point detection
   - Extreme event attribution

3. **Performance Improvements**
   - Data compression and partitioning
   - Materialized views for common queries
   - Distributed processing with Dask
   - GPU acceleration for large computations

4. **Visualization**
   - Time-series plotting endpoints
   - Interactive maps with temporal controls
   - Anomaly and heatwave visualizations
   - Climate dashboard integration

## Support

For questions or issues with the temporal data pipeline:

1. Check the logs in the `job_run` table
2. Enable verbose logging for detailed debugging
3. Verify database connectivity and table creation
4. Test with sample data before using real datasets
5. Monitor system resources during large ingestion jobs

The temporal temperature data pipeline provides a robust foundation for historical climate analysis and real-time ocean monitoring in the BlueSphere platform.