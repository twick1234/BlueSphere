---
title: Data Sources
descriptor: Authoritative ocean datasets powering BlueSphere
---

# Data Sources

BlueSphere integrates multiple authoritative ocean datasets to provide comprehensive marine environmental monitoring. Our platform ensures data quality, provenance tracking, and real-time updates.

## Primary Data Sources

### NOAA National Data Buoy Center (NDBC)
- **Coverage**: Over 1,100 monitoring stations globally
- **Parameters**: Sea surface temperature, wave height, wind speed, atmospheric pressure
- **Update Frequency**: Hourly observations
- **Quality Control**: Automated QC flags and manual validation
- **Access**: [NDBC Data Portal](https://www.ndbc.noaa.gov/)

### Extended Reconstructed Sea Surface Temperature (ERSST)
- **Coverage**: Global 2°×2° monthly grid, 1854-present  
- **Version**: ERSST v5 with enhanced spatial resolution
- **Applications**: Climate change analysis, long-term trend detection
- **Quality**: Bias-adjusted with uncertainty estimates
- **Citation**: Huang et al. (2017), NOAA/NCEI

### Argo Global Ocean Observing Program
- **Network**: 4,000+ autonomous profiling floats
- **Measurements**: Temperature and salinity profiles to 2000m depth
- **Temporal Resolution**: 10-day cycle per float
- **Spatial Coverage**: Ice-free oceans globally
- **Data Portal**: [Argo Data Hub](https://argo.ucsd.edu/)

### TAO/TRITON Tropical Mooring Array
- **Focus**: Pacific Ocean tropical regions (El Niño monitoring)
- **Parameters**: Sub-surface temperature, currents, meteorology
- **Depth Range**: Surface to 750m at key locations
- **Real-time Stream**: Critical for ENSO forecasting
- **Management**: NOAA/PMEL and international partners

## Derived Products

### Marine Heatwave Detection
- **Algorithm**: Based on Hobday et al. (2016) methodology
- **Thresholds**: 90th percentile climatology (1982-2012 baseline)
- **Categories**: Moderate, Strong, Severe, Extreme events
- **Applications**: Ecosystem impact assessment, fisheries management

### Temperature Anomaly Fields
- **Baseline Period**: 1991-2020 WMO climatology
- **Spatial Resolution**: 0.25°×0.25° for recent years
- **Temporal Range**: Daily, monthly, and annual composites
- **Uncertainty**: Standard error propagation from source data

### Climate Indices
- **ENSO Indicators**: Niño 3.4, SOI, MEI derived from our datasets
- **Regional Indices**: North Atlantic, Pacific Decadal Oscillation
- **Real-time Updates**: Monthly index calculations with historical context

## Data Quality & Governance

### Quality Control Framework
- **Level 0**: Raw observations as received
- **Level 1**: Automated QC flags (range checks, spike detection)
- **Level 2**: Expert-reviewed data with bias corrections
- **Level 3**: Research-quality products with full uncertainty analysis

### Metadata Standards
- **CF Conventions**: Climate and Forecast metadata compliance
- **ISO 19115**: Geographic information metadata standards
- **FAIR Principles**: Findable, Accessible, Interoperable, Reusable
- **DOI Assignment**: Persistent identifiers for all derived products

### Update Schedules
- **Real-time Streams**: Within 6 hours of observation
- **Daily Composites**: Available by 12:00 UTC next day
- **Monthly Products**: Released by 15th of following month
- **Annual Summaries**: Published by March 31st following year

## Citation & Attribution

When using BlueSphere data products, please cite:

> BlueSphere Ocean Monitoring Platform (2024). Global Ocean Temperature Analysis System. Version 0.16.0. Retrieved from https://bluesphere.org

### Individual Dataset Citations
- **NDBC**: National Data Buoy Center (2024). Meteorological and oceanographic data collected from the National Data Buoy Center Coastal-Marine Automated Network (C-MAN) and moored (weather) buoys.
- **ERSST**: Huang, B., et al. (2017). Extended Reconstructed Sea Surface Temperature, Version 5 (ERSSTv5): Upgrades, Validations, and Intercomparisons. Journal of Climate, 30(20), 8179-8205.
- **Argo**: Argo (2024). Argo float data and metadata from Global Data Assembly Centre (Argo GDAC). SEANOE.

## Data Access & APIs

### REST API Endpoints
- **Station Metadata**: `/api/stations`
- **Real-time Data**: `/api/observations/current`
- **Historical Data**: `/api/observations/historical`
- **Gridded Products**: `/api/grids/{dataset}/{date}`

### Bulk Data Downloads
- **Format**: NetCDF, CSV, JSON
- **Compression**: GZIP available for large files  
- **Rate Limits**: 1000 requests/hour for registered users
- **Authentication**: API key required for bulk access

### OGC Services
- **WMS**: Web Map Service for visualization
- **WFS**: Web Feature Service for vector data
- **WCS**: Web Coverage Service for gridded data
- **THREDDS**: Data Server for programmatic access

---

*Powering climate science through open ocean data*