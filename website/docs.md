---
title: Documentation
descriptor: Technical documentation and API guides
---

# Documentation

Comprehensive documentation for developers, researchers, and data users working with BlueSphere ocean monitoring platform.

## Quick Start Guides

### For Researchers
- **[Data Access Guide](#data-access)**: How to query and download ocean temperature data
- **[Quality Control](#quality-control)**: Understanding data quality flags and uncertainty
- **[Citation Guidelines](#citation)**: Proper attribution for scientific publications

### For Developers  
- **[API Reference](#api-reference)**: Complete REST API documentation
- **[SDK Libraries](#sdk)**: Python and R client libraries
- **[Authentication](#auth)**: API key management and rate limits

### For Educators
- **[Classroom Resources](#classroom)**: Teaching materials for ocean science education
- **[Interactive Tutorials](#tutorials)**: Step-by-step data exploration exercises
- **[Student Projects](#projects)**: Guided research project templates

## API Reference

### Authentication
All API requests require authentication via API key in the header:
```bash
curl -H "Authorization: Bearer YOUR_API_KEY" \
  https://api.bluesphere.org/stations
```

### Core Endpoints

#### Station Information
```http
GET /api/stations
```
Returns metadata for all monitoring stations.

**Parameters:**
- `region`: Filter by geographic region (pacific, atlantic, indian)
- `active`: Filter by operational status (true/false)
- `limit`: Maximum number of results (default: 100)

#### Real-time Observations
```http
GET /api/observations/current
```
Latest observations from active stations.

**Parameters:**
- `station_id`: Specific station identifier
- `parameter`: Data type (sst, wave_height, wind_speed)
- `hours`: Hours back from current time (default: 24)

#### Historical Data
```http
GET /api/observations/historical
```
Time series data for analysis and research.

**Parameters:**
- `start_date`: ISO 8601 format (YYYY-MM-DD)
- `end_date`: ISO 8601 format (YYYY-MM-DD)  
- `station_ids`: Comma-separated station list
- `format`: Response format (json, csv, netcdf)

#### Gridded Temperature Data
```http
GET /api/grids/ersst/{date}
```
Monthly gridded sea surface temperature fields.

**Path Parameters:**
- `date`: YYYY-MM format for monthly data

**Query Parameters:**
- `bbox`: Bounding box (west,south,east,north)
- `resolution`: Grid spacing (2deg, 1deg, 0.25deg)

### Response Formats

#### Station Metadata
```json
{
  "station_id": "46042",
  "name": "Monterey Bay",
  "lat": 36.785,
  "lon": -121.808,
  "depth": 1800,
  "provider": "NDBC",
  "active": true,
  "parameters": ["sst", "wave_height", "wind_speed"]
}
```

#### Observation Data
```json
{
  "station_id": "46042",
  "timestamp": "2024-09-07T12:00:00Z",
  "sst_celsius": 16.2,
  "qc_flag": 1,
  "measurement_depth": 0.6,
  "coordinates": [-121.808, 36.785]
}
```

## SDK Libraries

### Python Client
```bash
pip install bluesphere-python
```

```python
from bluesphere import Client

client = Client(api_key="your_key_here")
stations = client.get_stations(region="pacific")
data = client.get_observations("46042", days=30)
```

### R Client
```r
install.packages("bluesphere")
library(bluesphere)

client <- bs_client("your_key_here")
stations <- bs_stations(region = "pacific")
data <- bs_observations("46042", days = 30)
```

## Data Quality & Processing

### Quality Control Flags
- **0**: No quality control performed
- **1**: Good data (passed all QC tests)
- **2**: Probably good (minor issues detected)
- **3**: Bad data (failed critical QC tests)  
- **4**: Missing data
- **9**: Data not evaluated

### Processing Levels
- **Level 0**: Raw instrument data
- **Level 1**: Quality controlled observations
- **Level 2**: Derived products with interpolation
- **Level 3**: Gridded analysis fields

### Uncertainty Estimates
Where available, measurement uncertainty is provided as:
- **Instrument Error**: Manufacturer specifications
- **Processing Error**: Propagated uncertainty from algorithms
- **Representation Error**: Spatial/temporal sampling limitations

## Visualization Tools

### Interactive Maps
- **Real-time Dashboard**: [localhost:3000](http://localhost:3000)
- **Temporal Explorer**: [localhost:3000/temporal](http://localhost:3000/temporal)
- **Station Browser**: Clickable map interface

### Time Series Plots
- **Station Trends**: Multi-year temperature time series
- **Anomaly Analysis**: Departures from climatology
- **Seasonal Cycles**: Monthly climatological patterns

### Comparative Analysis
- **Regional Comparisons**: Multiple station overlays
- **Event Detection**: Marine heatwave identification
- **Forecast Verification**: Model vs. observation comparison

## Educational Resources

### Lesson Plans
- **Ocean Temperature Monitoring**: Introduction to marine observations
- **Climate Change Detection**: Long-term trend analysis
- **El Niño/La Niña**: Using tropical Pacific data

### Datasets for Teaching
- **Curated Examples**: Pre-selected interesting case studies
- **Student Projects**: Scaffolded research questions
- **Assessment Tools**: Rubrics for data analysis projects

### Interactive Tutorials
- **Basic Data Exploration**: Getting started with ocean data
- **Statistical Analysis**: Trend detection and significance testing
- **Visualization Techniques**: Creating effective scientific plots

## Support & Community

### Getting Help
- **Email Support**: support@bluesphere.org
- **Documentation Issues**: [GitHub Issues](https://github.com/Twick1234/BlueSphere/issues)
- **Feature Requests**: [GitHub Discussions](https://github.com/Twick1234/BlueSphere/discussions)

### Contributing
- **Data Quality Reports**: Help us improve data accuracy
- **Code Contributions**: Submit pull requests for improvements
- **Educational Content**: Share teaching materials and tutorials

### Citing BlueSphere
When using BlueSphere in publications:

> BlueSphere Consortium (2024). Global Ocean Temperature Monitoring Platform. Version 0.16.0. doi:10.5194/bluesphere-2024

---

*Comprehensive ocean data access for research and education*