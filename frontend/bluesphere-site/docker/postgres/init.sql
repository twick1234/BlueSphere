-- BlueSphere Marine Database Initialization
-- Initial schema for marine monitoring platform

-- Create extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "postgis";

-- Marine species tracking
CREATE TABLE species (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    scientific_name VARCHAR(255) NOT NULL UNIQUE,
    common_name VARCHAR(255),
    conservation_status VARCHAR(50),
    habitat_type VARCHAR(100),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Shark tracking data
CREATE TABLE shark_tracking (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    shark_id VARCHAR(100) NOT NULL,
    species_id UUID REFERENCES species(id),
    location GEOMETRY(POINT, 4326) NOT NULL,
    depth_meters INTEGER,
    temperature_celsius DECIMAL(5,2),
    timestamp TIMESTAMP WITH TIME ZONE NOT NULL,
    data_source VARCHAR(100),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Ocean monitoring stations
CREATE TABLE monitoring_stations (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    station_name VARCHAR(255) NOT NULL,
    location GEOMETRY(POINT, 4326) NOT NULL,
    station_type VARCHAR(100),
    active BOOLEAN DEFAULT TRUE,
    installation_date DATE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Environmental measurements
CREATE TABLE environmental_data (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    station_id UUID REFERENCES monitoring_stations(id),
    measurement_type VARCHAR(100) NOT NULL,
    value DECIMAL(10,4) NOT NULL,
    unit VARCHAR(20) NOT NULL,
    timestamp TIMESTAMP WITH TIME ZONE NOT NULL,
    quality_flag INTEGER DEFAULT 1,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- User submissions (citizen science)
CREATE TABLE citizen_reports (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id VARCHAR(255),
    report_type VARCHAR(50) NOT NULL,
    location GEOMETRY(POINT, 4326) NOT NULL,
    description TEXT,
    photo_urls TEXT[],
    verified BOOLEAN DEFAULT FALSE,
    verification_score INTEGER,
    timestamp TIMESTAMP WITH TIME ZONE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for performance
CREATE INDEX idx_shark_tracking_location ON shark_tracking USING GIST (location);
CREATE INDEX idx_shark_tracking_timestamp ON shark_tracking (timestamp);
CREATE INDEX idx_shark_tracking_shark_id ON shark_tracking (shark_id);
CREATE INDEX idx_environmental_data_station_timestamp ON environmental_data (station_id, timestamp);
CREATE INDEX idx_citizen_reports_location ON citizen_reports USING GIST (location);
CREATE INDEX idx_citizen_reports_timestamp ON citizen_reports (timestamp);

-- Insert sample marine species
INSERT INTO species (scientific_name, common_name, conservation_status, habitat_type) VALUES
('Carcharodon carcharias', 'Great White Shark', 'Vulnerable', 'Pelagic'),
('Rhincodon typus', 'Whale Shark', 'Endangered', 'Pelagic'),
('Carcharhinus leucas', 'Bull Shark', 'Near Threatened', 'Coastal'),
('Galeocerdo cuvier', 'Tiger Shark', 'Near Threatened', 'Coastal'),
('Sphyrna mokarran', 'Great Hammerhead', 'Critically Endangered', 'Coastal'),
('Carcharhinus longimanus', 'Oceanic Whitetip', 'Critically Endangered', 'Pelagic'),
('Pristis pectinata', 'Smalltooth Sawfish', 'Critically Endangered', 'Coastal'),
('Mobula birostris', 'Giant Manta Ray', 'Endangered', 'Pelagic'),
('Chelonia mydas', 'Green Sea Turtle', 'Endangered', 'Coastal'),
('Balaenoptera musculus', 'Blue Whale', 'Endangered', 'Pelagic');

-- Insert sample monitoring stations
INSERT INTO monitoring_stations (station_name, location, station_type, installation_date) VALUES
('Pacific Research Buoy 1', ST_GeomFromText('POINT(-157.8583 21.3099)', 4326), 'Research Buoy', '2023-01-15'),
('Atlantic Coastal Monitor', ST_GeomFromText('POINT(-80.1918 25.7617)', 4326), 'Coastal Station', '2022-08-20'),
('Great Barrier Reef Station', ST_GeomFromText('POINT(145.7781 -16.2863)', 4326), 'Coral Monitoring', '2022-03-10'),
('North Sea Platform', ST_GeomFromText('POINT(2.3522 53.7986)', 4326), 'Oil Platform', '2021-11-05'),
('Antarctic Research Base', ST_GeomFromText('POINT(-58.3816 -62.1048)', 4326), 'Research Base', '2023-02-28');

-- Sample shark tracking data
INSERT INTO shark_tracking (shark_id, species_id, location, depth_meters, temperature_celsius, timestamp, data_source)
SELECT
    'GWS-' || LPAD((row_number() OVER())::text, 4, '0'),
    (SELECT id FROM species WHERE scientific_name = 'Carcharodon carcharias'),
    ST_GeomFromText('POINT(' ||
        (-180 + random() * 360)::text || ' ' ||
        (-60 + random() * 120)::text || ')', 4326),
    (5 + random() * 200)::integer,
    (8 + random() * 25)::decimal(5,2),
    NOW() - (random() * interval '30 days'),
    'Satellite Tag'
FROM generate_series(1, 100);

COMMENT ON DATABASE bluesphere_marine IS 'BlueSphere Marine Monitoring Platform Database';
COMMENT ON TABLE species IS 'Marine species catalog with conservation status';
COMMENT ON TABLE shark_tracking IS 'Real-time shark movement and behavior data';
COMMENT ON TABLE monitoring_stations IS 'Ocean monitoring infrastructure locations';
COMMENT ON TABLE environmental_data IS 'Time-series environmental measurements';
COMMENT ON TABLE citizen_reports IS 'Community-contributed marine observations';