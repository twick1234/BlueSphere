-- BlueSphere PostgreSQL Database Schema
-- Matches PRD specification for comprehensive ocean data management
-- Version: 1.0
-- Date: September 2025

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS postgis;
CREATE EXTENSION IF NOT EXISTS postgis_topology;
CREATE EXTENSION IF NOT EXISTS timescaledb CASCADE;

-- ====================
-- CORE TABLES
-- ====================

-- Stations table - Central registry of all monitoring stations
CREATE TABLE stations (
    station_id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    lat DOUBLE PRECISION NOT NULL CHECK (lat >= -90 AND lat <= 90),
    lon DOUBLE PRECISION NOT NULL CHECK (lon >= -180 AND lon <= 180),
    provider TEXT NOT NULL CHECK (provider IN ('NDBC', 'ERDDAP', 'ERSST', 'EMSO', 'JMA', 'BOM', 'GOOS')),
    country TEXT,
    region TEXT,
    water_depth DOUBLE PRECISION CHECK (water_depth >= 0),
    station_type TEXT CHECK (station_type IN ('moored_buoy', 'drifting_buoy', 'coastal_station', 'platform', 'glider')),
    deployment_date DATE,
    first_obs TIMESTAMPTZ,
    last_obs TIMESTAMPTZ,
    is_active BOOLEAN DEFAULT true,
    metadata JSONB,
    geom GEOMETRY(POINT, 4326),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create spatial index for efficient geographic queries
CREATE INDEX idx_stations_geom ON stations USING GIST (geom);
CREATE INDEX idx_stations_provider ON stations (provider);
CREATE INDEX idx_stations_country ON stations (country);
CREATE INDEX idx_stations_active ON stations (is_active);
CREATE INDEX idx_stations_last_obs ON stations (last_obs);

-- Trigger to automatically populate geom from lat/lon
CREATE OR REPLACE FUNCTION update_station_geom()
RETURNS TRIGGER AS $$
BEGIN
    NEW.geom = ST_SetSRID(ST_MakePoint(NEW.lon, NEW.lat), 4326);
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_station_geom
    BEFORE INSERT OR UPDATE ON stations
    FOR EACH ROW
    EXECUTE FUNCTION update_station_geom();

-- Buoy observations - Time series data with comprehensive quality control
CREATE TABLE buoy_obs (
    id BIGSERIAL PRIMARY KEY,
    station_id TEXT NOT NULL REFERENCES stations(station_id) ON DELETE CASCADE,
    time TIMESTAMPTZ NOT NULL,
    sst_c DOUBLE PRECISION,
    air_temp_c DOUBLE PRECISION,
    pressure_hpa DOUBLE PRECISION,
    wind_speed_ms DOUBLE PRECISION,
    wind_direction_deg DOUBLE PRECISION CHECK (wind_direction_deg >= 0 AND wind_direction_deg <= 360),
    wave_height_m DOUBLE PRECISION CHECK (wave_height_m >= 0),
    wave_period_s DOUBLE PRECISION CHECK (wave_period_s >= 0),
    salinity_psu DOUBLE PRECISION CHECK (salinity_psu >= 0 AND salinity_psu <= 50),
    qc_flag INTEGER DEFAULT 0 CHECK (qc_flag IN (0, 1, 2, 3, 4, 9)),
    qc_flags JSONB,
    lat DOUBLE PRECISION CHECK (lat >= -90 AND lat <= 90),
    lon DOUBLE PRECISION CHECK (lon >= -180 AND lon <= 180),
    source TEXT NOT NULL,
    processing_level INTEGER DEFAULT 1,
    anomaly_sst_c DOUBLE PRECISION,
    climatology_sst_c DOUBLE PRECISION,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(station_id, time)
);

-- Convert to TimescaleDB hypertable for efficient time series storage
SELECT create_hypertable('buoy_obs', 'time', chunk_time_interval => INTERVAL '7 days');

-- Create comprehensive indexes for performance
CREATE INDEX idx_buoy_obs_station_time ON buoy_obs (station_id, time DESC);
CREATE INDEX idx_buoy_obs_time ON buoy_obs (time DESC);
CREATE INDEX idx_buoy_obs_sst ON buoy_obs (sst_c) WHERE sst_c IS NOT NULL;
CREATE INDEX idx_buoy_obs_qc_flag ON buoy_obs (qc_flag);
CREATE INDEX idx_buoy_obs_source ON buoy_obs (source);
CREATE INDEX idx_buoy_obs_geom ON buoy_obs USING GIST (ST_SetSRID(ST_MakePoint(lon, lat), 4326)) WHERE lat IS NOT NULL AND lon IS NOT NULL;

-- Job runs - Comprehensive tracking of data ingestion processes
CREATE TABLE job_runs (
    id BIGSERIAL PRIMARY KEY,
    source TEXT NOT NULL,
    job_type TEXT NOT NULL DEFAULT 'ingestion',
    started TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    ended TIMESTAMPTZ,
    status TEXT NOT NULL DEFAULT 'running' CHECK (status IN ('running', 'ok', 'failed', 'cancelled', 'timeout')),
    rows_ingested INTEGER DEFAULT 0,
    rows_updated INTEGER DEFAULT 0,
    rows_failed INTEGER DEFAULT 0,
    error_message TEXT,
    error_details JSONB,
    metadata JSONB,
    performance_metrics JSONB,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for job monitoring
CREATE INDEX idx_job_runs_source ON job_runs (source);
CREATE INDEX idx_job_runs_status ON job_runs (status);
CREATE INDEX idx_job_runs_started ON job_runs (started DESC);
CREATE INDEX idx_job_runs_job_type ON job_runs (job_type);

-- ====================
-- QUALITY CONTROL TABLES
-- ====================

-- QC rules configuration
CREATE TABLE qc_rules (
    id SERIAL PRIMARY KEY,
    parameter TEXT NOT NULL,
    rule_type TEXT NOT NULL CHECK (rule_type IN ('range', 'spike', 'rate_of_change', 'climatology', 'spatial')),
    rule_config JSONB NOT NULL,
    provider TEXT,
    region TEXT,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- QC test results
CREATE TABLE qc_test_results (
    id BIGSERIAL PRIMARY KEY,
    observation_id BIGINT REFERENCES buoy_obs(id) ON DELETE CASCADE,
    rule_id INTEGER REFERENCES qc_rules(id),
    test_result INTEGER CHECK (test_result IN (0, 1, 2, 3, 4, 9)),
    test_value DOUBLE PRECISION,
    test_metadata JSONB,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_qc_test_results_obs ON qc_test_results (observation_id);
CREATE INDEX idx_qc_test_results_rule ON qc_test_results (rule_id);

-- ====================
-- CLIMATOLOGY AND REFERENCE DATA
-- ====================

-- Monthly climatology grid (ERSST v5 based)
CREATE TABLE climatology_grid (
    id BIGSERIAL PRIMARY KEY,
    lat DOUBLE PRECISION NOT NULL CHECK (lat >= -90 AND lat <= 90),
    lon DOUBLE PRECISION NOT NULL CHECK (lon >= -180 AND lon <= 180),
    month INTEGER NOT NULL CHECK (month >= 1 AND month <= 12),
    sst_mean DOUBLE PRECISION,
    sst_std DOUBLE PRECISION,
    data_years TEXT, -- e.g., "1991-2020"
    source TEXT DEFAULT 'ERSST_v5',
    geom GEOMETRY(POINT, 4326),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(lat, lon, month, source)
);

-- Create spatial index for efficient climatology lookups
CREATE INDEX idx_climatology_grid_geom ON climatology_grid USING GIST (geom);
CREATE INDEX idx_climatology_grid_month ON climatology_grid (month);

-- Trigger to populate geom
CREATE OR REPLACE FUNCTION update_climatology_geom()
RETURNS TRIGGER AS $$
BEGIN
    NEW.geom = ST_SetSRID(ST_MakePoint(NEW.lon, NEW.lat), 4326);
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_climatology_geom
    BEFORE INSERT OR UPDATE ON climatology_grid
    FOR EACH ROW
    EXECUTE FUNCTION update_climatology_geom();

-- ====================
-- MARINE HEATWAVE DETECTION
-- ====================

-- Marine heatwave events
CREATE TABLE marine_heatwaves (
    id BIGSERIAL PRIMARY KEY,
    station_id TEXT REFERENCES stations(station_id),
    start_date DATE NOT NULL,
    end_date DATE,
    duration_days INTEGER,
    max_intensity DOUBLE PRECISION,
    mean_intensity DOUBLE PRECISION,
    cumulative_intensity DOUBLE PRECISION,
    category TEXT CHECK (category IN ('Moderate', 'Strong', 'Severe', 'Extreme')),
    lat DOUBLE PRECISION,
    lon DOUBLE PRECISION,
    geom GEOMETRY(POINT, 4326),
    metadata JSONB,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_marine_heatwaves_station ON marine_heatwaves (station_id);
CREATE INDEX idx_marine_heatwaves_dates ON marine_heatwaves (start_date, end_date);
CREATE INDEX idx_marine_heatwaves_geom ON marine_heatwaves USING GIST (geom);
CREATE INDEX idx_marine_heatwaves_category ON marine_heatwaves (category);

-- ====================
-- PREDICTIVE MODELING
-- ====================

-- ML model registry
CREATE TABLE ml_models (
    id SERIAL PRIMARY KEY,
    model_name TEXT UNIQUE NOT NULL,
    model_type TEXT NOT NULL CHECK (model_type IN ('arima', 'lstm', 'gradient_boost', 'ensemble')),
    parameters JSONB NOT NULL,
    training_period DATERANGE,
    validation_metrics JSONB,
    feature_importance JSONB,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Model predictions
CREATE TABLE predictions (
    id BIGSERIAL PRIMARY KEY,
    model_id INTEGER REFERENCES ml_models(id),
    station_id TEXT REFERENCES stations(station_id),
    prediction_time TIMESTAMPTZ NOT NULL,
    target_time TIMESTAMPTZ NOT NULL,
    forecast_horizon_hours INTEGER,
    predicted_sst DOUBLE PRECISION,
    prediction_std DOUBLE PRECISION,
    confidence_interval JSONB,
    features_used JSONB,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(model_id, station_id, prediction_time, target_time)
);

-- Convert predictions to hypertable
SELECT create_hypertable('predictions', 'prediction_time', chunk_time_interval => INTERVAL '7 days');

CREATE INDEX idx_predictions_model ON predictions (model_id);
CREATE INDEX idx_predictions_station ON predictions (station_id);
CREATE INDEX idx_predictions_target_time ON predictions (target_time);

-- ====================
-- DATA AGGREGATION VIEWS
-- ====================

-- Daily station summaries
CREATE MATERIALIZED VIEW daily_station_summary AS
SELECT 
    station_id,
    DATE(time) as observation_date,
    COUNT(*) as observation_count,
    AVG(sst_c) as sst_mean,
    STDDEV(sst_c) as sst_std,
    MIN(sst_c) as sst_min,
    MAX(sst_c) as sst_max,
    AVG(anomaly_sst_c) as anomaly_mean,
    AVG(CASE WHEN qc_flag = 1 THEN 1 ELSE 0 END) * 100 as qc_pass_rate,
    MIN(time) as first_obs_time,
    MAX(time) as last_obs_time
FROM buoy_obs
WHERE sst_c IS NOT NULL
GROUP BY station_id, DATE(time);

-- Create indexes on materialized view
CREATE UNIQUE INDEX idx_daily_summary_station_date ON daily_station_summary (station_id, observation_date);
CREATE INDEX idx_daily_summary_date ON daily_station_summary (observation_date DESC);

-- Station health monitoring view
CREATE VIEW station_health AS
SELECT 
    s.station_id,
    s.name,
    s.provider,
    s.lat,
    s.lon,
    s.is_active,
    EXTRACT(EPOCH FROM (NOW() - s.last_obs))/3600 as hours_since_last_obs,
    CASE 
        WHEN s.last_obs > NOW() - INTERVAL '2 hours' THEN 'excellent'
        WHEN s.last_obs > NOW() - INTERVAL '6 hours' THEN 'good'
        WHEN s.last_obs > NOW() - INTERVAL '24 hours' THEN 'warning'
        ELSE 'critical'
    END as data_freshness,
    (SELECT AVG(qc_flag = 1) * 100 FROM buoy_obs WHERE station_id = s.station_id AND time > NOW() - INTERVAL '7 days') as recent_qc_pass_rate
FROM stations s;

-- ====================
-- FUNCTIONS AND PROCEDURES
-- ====================

-- Function to calculate temperature anomaly
CREATE OR REPLACE FUNCTION calculate_anomaly(
    p_lat DOUBLE PRECISION,
    p_lon DOUBLE PRECISION,
    p_month INTEGER,
    p_sst DOUBLE PRECISION
) RETURNS DOUBLE PRECISION AS $$
DECLARE
    climatology_temp DOUBLE PRECISION;
BEGIN
    -- Find nearest climatology point
    SELECT sst_mean INTO climatology_temp
    FROM climatology_grid
    WHERE month = p_month
    ORDER BY ST_Distance(geom, ST_SetSRID(ST_MakePoint(p_lon, p_lat), 4326))
    LIMIT 1;
    
    IF climatology_temp IS NOT NULL THEN
        RETURN p_sst - climatology_temp;
    ELSE
        RETURN NULL;
    END IF;
END;
$$ LANGUAGE plpgsql;

-- Procedure to refresh daily summaries
CREATE OR REPLACE PROCEDURE refresh_daily_summaries()
LANGUAGE plpgsql AS $$
BEGIN
    -- Refresh materialized view
    REFRESH MATERIALIZED VIEW CONCURRENTLY daily_station_summary;
    
    -- Log the refresh
    INSERT INTO job_runs (source, job_type, ended, status)
    VALUES ('daily_summary_refresh', 'maintenance', NOW(), 'ok');
END;
$$;

-- Function to detect marine heatwaves
CREATE OR REPLACE FUNCTION detect_marine_heatwaves(
    p_station_id TEXT,
    p_start_date DATE,
    p_end_date DATE
) RETURNS TABLE (
    start_date DATE,
    end_date DATE,
    max_intensity DOUBLE PRECISION,
    duration_days INTEGER
) AS $$
BEGIN
    -- Simplified heatwave detection logic
    -- In production, this would implement the Hobday et al. (2016) methodology
    RETURN QUERY
    WITH daily_anomalies AS (
        SELECT 
            DATE(time) as obs_date,
            AVG(anomaly_sst_c) as daily_anomaly
        FROM buoy_obs
        WHERE station_id = p_station_id
        AND DATE(time) BETWEEN p_start_date AND p_end_date
        AND anomaly_sst_c IS NOT NULL
        GROUP BY DATE(time)
        ORDER BY obs_date
    ),
    heatwave_periods AS (
        SELECT 
            obs_date,
            daily_anomaly,
            CASE WHEN daily_anomaly > 1.0 THEN 1 ELSE 0 END as is_heatwave_day,
            SUM(CASE WHEN daily_anomaly <= 1.0 THEN 1 ELSE 0 END) OVER (ORDER BY obs_date) as group_id
        FROM daily_anomalies
    )
    SELECT 
        MIN(obs_date),
        MAX(obs_date),
        MAX(daily_anomaly),
        (MAX(obs_date) - MIN(obs_date) + 1)::INTEGER
    FROM heatwave_periods
    WHERE is_heatwave_day = 1
    GROUP BY group_id
    HAVING COUNT(*) >= 5; -- Minimum 5 days duration
END;
$$ LANGUAGE plpgsql;

-- ====================
-- INITIAL DATA SETUP
-- ====================

-- Insert QC rules
INSERT INTO qc_rules (parameter, rule_type, rule_config) VALUES
('sst_c', 'range', '{"min": -5.0, "max": 40.0}'),
('sst_c', 'spike', '{"threshold": 5.0}'),
('sst_c', 'rate_of_change', '{"max_change_per_hour": 2.0}'),
('air_temp_c', 'range', '{"min": -50.0, "max": 50.0}'),
('pressure_hpa', 'range', '{"min": 900.0, "max": 1100.0}'),
('wind_speed_ms', 'range', '{"min": 0.0, "max": 100.0}'),
('wave_height_m', 'range', '{"min": 0.0, "max": 30.0}'),
('salinity_psu', 'range', '{"min": 0.0, "max": 45.0}');

-- Create scheduled job for daily summary refresh
-- This would typically be set up with pg_cron or similar
-- SELECT cron.schedule('refresh-daily-summaries', '0 1 * * *', 'CALL refresh_daily_summaries();');

COMMENT ON DATABASE bluesphere IS 'BlueSphere Ocean Monitoring Platform - Comprehensive ocean climate data management system';
COMMENT ON TABLE stations IS 'Global network of ocean monitoring stations with spatial indexing';
COMMENT ON TABLE buoy_obs IS 'Time series observations from monitoring stations with comprehensive QC';
COMMENT ON TABLE job_runs IS 'Data ingestion and processing job tracking with performance metrics';
COMMENT ON TABLE marine_heatwaves IS 'Marine heatwave event detection and characterization';
COMMENT ON TABLE predictions IS 'ML model predictions for temperature forecasting';
COMMENT ON MATERIALIZED VIEW daily_station_summary IS 'Pre-aggregated daily statistics for fast API queries';