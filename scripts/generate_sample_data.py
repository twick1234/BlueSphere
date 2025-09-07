#!/usr/bin/env python3
# SPDX-License-Identifier: MIT
# © 2024–2025 Mark Lindon — BlueSphere
"""
Sample temporal temperature data generator for BlueSphere testing and development.

Generates realistic sample SST data with:
- Spatial patterns (latitudinal gradients, coastal effects)
- Temporal patterns (seasonal cycles, interannual variability) 
- Realistic anomalies and marine heatwave events
- Multiple datasets (ERSST-like monthly, OISST-like daily)
"""

import sys
import argparse
import logging
from datetime import date, datetime, timedelta, timezone
from pathlib import Path
from typing import Dict, List, Tuple

import numpy as np
from sqlalchemy.dialects.postgresql import insert
from tqdm import tqdm

# Add parent directory to path for imports
sys.path.append(str(Path(__file__).parent.parent))

from backend.db import get_session
from backend.models import (
    TemporalTemperatureGrid,
    TemporalTemperatureDaily, 
    TemporalTemperatureMonthly,
    TemporalTemperatureYearly,
    ClimateBaseline,
    TemperatureAnomaly,
    MarineHeatwave,
    JobRun
)

# Configure logging
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

class SampleDataGenerator:
    """Generates realistic sample temporal temperature data"""
    
    def __init__(self):
        self.session = get_session()
    
    def generate_base_sst_field(self, lats: np.ndarray, lons: np.ndarray, 
                               month: int) -> np.ndarray:
        """
        Generate realistic base SST field with spatial and seasonal patterns.
        
        Args:
            lats: Latitude array
            lons: Longitude array  
            month: Month (1-12)
            
        Returns:
            2D SST array in °C
        """
        # Create 2D coordinate grids
        lon_grid, lat_grid = np.meshgrid(lons, lats)
        
        # Base latitudinal gradient (warmer at equator)
        base_temp = 30.0 - 0.5 * np.abs(lat_grid)
        
        # Seasonal cycle (Northern Hemisphere perspective)
        seasonal_amplitude = 3.0 * np.cos(np.radians(lat_grid))  # Larger swings away from equator
        seasonal_phase = (month - 1) * (2 * np.pi / 12) - np.pi  # Phase shift so July is warmest
        seasonal_temp = seasonal_amplitude * np.cos(seasonal_phase)
        
        # Land-sea contrast (simplified - cooler near "land" areas)
        # Simulate some major continents with cooler regions
        land_cooling = 0.0
        
        # Africa/Europe region
        africa_mask = ((lon_grid > -20) & (lon_grid < 50) & 
                      (lat_grid > 0) & (lat_grid < 35))
        land_cooling += africa_mask * -2.0
        
        # Americas region  
        americas_mask = ((lon_grid > -120) & (lon_grid < -40) & 
                        (lat_grid > -30) & (lat_grid < 50))
        land_cooling += americas_mask * -1.5
        
        # Add some regional oceanic patterns
        # Gulf Stream-like warm current
        gulf_stream = ((lon_grid > -80) & (lon_grid < -40) & 
                      (lat_grid > 25) & (lat_grid < 45))
        regional_warming = gulf_stream * 2.0
        
        # Kuroshio-like current  
        kuroshio = ((lon_grid > 120) & (lon_grid < 160) &
                   (lat_grid > 25) & (lat_grid < 45))
        regional_warming += kuroshio * 1.5
        
        # Combine all components
        sst_field = base_temp + seasonal_temp + land_cooling + regional_warming
        
        # Add some random noise
        noise = np.random.normal(0, 0.5, sst_field.shape)
        sst_field += noise
        
        # Ensure reasonable values
        sst_field = np.clip(sst_field, -2.0, 35.0)
        
        return sst_field
    
    def add_interannual_variability(self, base_field: np.ndarray, year: int,
                                  lats: np.ndarray, lons: np.ndarray) -> np.ndarray:
        """
        Add interannual variability (ENSO-like patterns, trends).
        
        Args:
            base_field: Base SST field
            year: Year for the data
            lats: Latitude array
            lons: Longitude array
            
        Returns:
            SST field with interannual variability
        """
        # Create coordinate grids
        lon_grid, lat_grid = np.meshgrid(lons, lats)
        
        # Simple ENSO-like cycle (3-7 year period)
        enso_phase = (year - 2000) * 0.8  # Arbitrary phase
        enso_strength = 0.8 * np.sin(enso_phase)  # -0.8 to +0.8°C
        
        # ENSO pattern (strongest in tropical Pacific)
        enso_pattern = np.exp(-((lat_grid)**2) / (15**2))  # Tropical concentration
        pacific_mask = ((lon_grid > -180) & (lon_grid < -80) |
                       (lon_grid > 120) & (lon_grid < 180))
        enso_pattern *= pacific_mask
        
        enso_anomaly = enso_strength * enso_pattern
        
        # Long-term warming trend (about 0.8°C over 40 years)
        trend_rate = 0.02  # °C per year
        trend_anomaly = trend_rate * (year - 1980)
        
        # Add some random year-to-year variability
        random_anomaly = np.random.normal(0, 0.3)
        
        return base_field + enso_anomaly + trend_anomaly + random_anomaly
    
    def generate_daily_variations(self, monthly_field: np.ndarray, 
                                 days_in_month: int) -> np.ndarray:
        """
        Generate daily variations around monthly mean.
        
        Args:
            monthly_field: Monthly mean SST field
            days_in_month: Number of days in the month
            
        Returns:
            3D array [day, lat, lon] with daily SST fields
        """
        daily_fields = np.zeros((days_in_month,) + monthly_field.shape)
        
        for day in range(days_in_month):
            # Small daily variations (weather noise)
            daily_noise = np.random.normal(0, 0.8, monthly_field.shape)
            
            # Slight intra-monthly trend (early/late month differences)
            intra_month_trend = 0.5 * np.sin(2 * np.pi * day / days_in_month)
            
            daily_fields[day] = monthly_field + daily_noise + intra_month_trend
        
        return daily_fields
    
    def generate_ersst_sample_data(self, start_year: int = 2020, end_year: int = 2023,
                                  spatial_resolution: float = 2.0) -> int:
        """
        Generate sample ERSST-like monthly data.
        
        Args:
            start_year: Starting year
            end_year: Ending year  
            spatial_resolution: Spatial resolution in degrees
            
        Returns:
            Number of records created
        """
        logger.info(f"Generating ERSST sample data {start_year}-{end_year}, resolution {spatial_resolution}°")
        
        # Create coordinate grids (global, but coarser for ERSST)
        lats = np.arange(-89, 90, spatial_resolution)
        lons = np.arange(-179, 180, spatial_resolution) 
        
        total_records = 0
        
        for year in range(start_year, end_year + 1):
            for month in range(1, 13):
                # Generate base SST field for this month/year
                base_sst = self.generate_base_sst_field(lats, lons, month)
                sst_with_variability = self.add_interannual_variability(base_sst, year, lats, lons)
                
                # Prepare records for database
                grid_records = []
                monthly_records = []
                
                for i, lat in enumerate(lats):
                    for j, lon in enumerate(lons):
                        sst_val = float(sst_with_variability[i, j])
                        
                        # Skip some ocean regions to simulate land/ice masking  
                        if np.random.random() > 0.85:  # 15% missing data
                            continue
                        
                        target_date = date(year, month, 1)
                        
                        # Grid record
                        grid_records.append({
                            'date': target_date,
                            'lat': float(lat),
                            'lon': float(lon),
                            'sst_c': sst_val,
                            'dataset': 'ERSST_SAMPLE',
                            'resolution': f'{spatial_resolution:.1f}x{spatial_resolution:.1f}',
                            'quality_flag': 0,
                            'created_at': datetime.now(timezone.utc)
                        })
                        
                        # Monthly aggregate (same as grid for ERSST)
                        monthly_records.append({
                            'year': year,
                            'month': month,
                            'lat_bin': float(lat),
                            'lon_bin': float(lon),
                            'avg_sst_c': sst_val,
                            'min_sst_c': sst_val - 0.5,  # Simulate some within-month variation
                            'max_sst_c': sst_val + 0.5,
                            'std_sst_c': 0.3,
                            'count': 1,
                            'dataset': 'ERSST_SAMPLE'
                        })
                
                # Insert in batches
                if grid_records:
                    batch_size = 1000
                    for i in range(0, len(grid_records), batch_size):
                        batch = grid_records[i:i+batch_size]
                        stmt = insert(TemporalTemperatureGrid).values(batch)
                        stmt = stmt.on_conflict_do_nothing()  # Skip duplicates
                        self.session.execute(stmt)
                    
                    total_records += len(grid_records)
                
                if monthly_records:
                    stmt = insert(TemporalTemperatureMonthly).values(monthly_records)
                    stmt = stmt.on_conflict_do_nothing()
                    self.session.execute(stmt)
                
                self.session.commit()
                logger.info(f"Generated {len(grid_records)} records for ERSST {year}-{month:02d}")
        
        logger.info(f"Generated {total_records} ERSST sample records")
        return total_records
    
    def generate_oisst_sample_data(self, start_date: date, end_date: date,
                                  spatial_resolution: float = 1.0,
                                  sample_factor: int = 4) -> int:
        """
        Generate sample OISST-like daily data (subsampled for manageability).
        
        Args:
            start_date: Starting date
            end_date: Ending date
            spatial_resolution: Spatial resolution in degrees  
            sample_factor: Factor to subsample (1 = full resolution, 4 = every 4th point)
            
        Returns:
            Number of records created
        """
        logger.info(f"Generating OISST sample data {start_date} to {end_date}, resolution {spatial_resolution}°")
        
        # Create coordinate grids (higher resolution than ERSST)
        lats = np.arange(-89, 90, spatial_resolution)[::sample_factor]
        lons = np.arange(-179, 180, spatial_resolution)[::sample_factor]
        
        total_records = 0
        current_date = start_date
        
        with tqdm(desc="Generating OISST daily data", 
                 total=(end_date - start_date).days + 1) as pbar:
            
            while current_date <= end_date:
                year = current_date.year
                month = current_date.month
                
                # Generate base monthly field
                base_sst = self.generate_base_sst_field(lats, lons, month)
                sst_with_variability = self.add_interannual_variability(base_sst, year, lats, lons)
                
                # Add daily variations
                daily_noise = np.random.normal(0, 1.2, sst_with_variability.shape)
                daily_sst = sst_with_variability + daily_noise
                
                # Prepare daily records  
                daily_records = {}  # Group by 1-degree bins for daily aggregates
                
                for i, lat in enumerate(lats):
                    for j, lon in enumerate(lons):
                        sst_val = float(daily_sst[i, j])
                        
                        # Skip some points to simulate cloud cover/missing data
                        if np.random.random() > 0.9:  # 10% missing
                            continue
                        
                        # Bin to 1-degree for daily aggregates
                        lat_bin = round(float(lat))
                        lon_bin = round(float(lon))
                        key = (lat_bin, lon_bin)
                        
                        if key not in daily_records:
                            daily_records[key] = []
                        daily_records[key].append(sst_val)
                
                # Create daily aggregate records
                db_records = []
                for (lat_bin, lon_bin), temps in daily_records.items():
                    db_records.append({
                        'date': current_date,
                        'lat_bin': lat_bin,
                        'lon_bin': lon_bin,
                        'avg_sst_c': np.mean(temps),
                        'min_sst_c': np.min(temps),
                        'max_sst_c': np.max(temps),
                        'std_sst_c': np.std(temps) if len(temps) > 1 else 0.0,
                        'count': len(temps),
                        'dataset': 'OISST_SAMPLE'
                    })
                
                # Insert records
                if db_records:
                    stmt = insert(TemporalTemperatureDaily).values(db_records)
                    stmt = stmt.on_conflict_do_nothing()
                    self.session.execute(stmt)
                    total_records += len(db_records)
                
                if current_date.day == 1 or current_date == end_date:
                    self.session.commit()
                
                current_date += timedelta(days=1)
                pbar.update(1)
        
        logger.info(f"Generated {total_records} OISST sample records")
        return total_records
    
    def generate_sample_climate_baselines(self, datasets: List[str] = None) -> int:
        """Generate sample climate baselines from existing monthly data"""
        if datasets is None:
            datasets = ['ERSST_SAMPLE']
        
        logger.info(f"Generating sample climate baselines for datasets: {datasets}")
        
        from backend.temporal_db import TemporalDataManager
        data_manager = TemporalDataManager()
        
        total_records = 0
        for dataset in datasets:
            try:
                records = data_manager.calculate_climate_baseline(
                    start_year=2020,
                    end_year=2022, 
                    dataset=dataset,
                    spatial_resolution=2.0
                )
                total_records += records
                logger.info(f"Generated {records} baseline records for {dataset}")
            except Exception as e:
                logger.error(f"Failed to generate baselines for {dataset}: {e}")
        
        return total_records
    
    def generate_sample_anomalies(self, datasets: List[str] = None) -> int:
        """Generate sample temperature anomalies"""
        if datasets is None:
            datasets = ['ERSST_SAMPLE']
        
        logger.info(f"Generating sample temperature anomalies for datasets: {datasets}")
        
        from backend.temporal_db import TemporalDataManager
        data_manager = TemporalDataManager()
        
        total_records = 0
        for dataset in datasets:
            try:
                for year in [2021, 2022, 2023]:
                    records = data_manager.calculate_temperature_anomalies(
                        target_year=year,
                        baseline_period="2020-2022",
                        dataset=dataset
                    )
                    total_records += records
                    logger.info(f"Generated {records} anomaly records for {dataset} {year}")
            except Exception as e:
                logger.error(f"Failed to generate anomalies for {dataset}: {e}")
        
        return total_records
    
    def record_job_status(self, status: str, note: str = ""):
        """Record job run status"""
        job_run = JobRun(
            job="GENERATE_SAMPLE_DATA",
            status=status,
            started_at=datetime.now(timezone.utc),
            finished_at=datetime.now(timezone.utc),
            note=note
        )
        self.session.add(job_run)
        self.session.commit()


def main():
    """Main entry point"""
    parser = argparse.ArgumentParser(description="Generate sample temporal temperature data")
    parser.add_argument("--datasets", nargs="+", choices=["ersst", "oisst", "both"],
                       default=["both"], help="Datasets to generate")
    parser.add_argument("--start-year", type=int, default=2020,
                       help="Start year for ERSST data")
    parser.add_argument("--end-year", type=int, default=2023,
                       help="End year for ERSST data") 
    parser.add_argument("--start-date", default="2023-01-01",
                       help="Start date for OISST data (YYYY-MM-DD)")
    parser.add_argument("--end-date", default="2023-12-31", 
                       help="End date for OISST data (YYYY-MM-DD)")
    parser.add_argument("--spatial-resolution", type=float, default=2.0,
                       help="Spatial resolution in degrees")
    parser.add_argument("--with-analysis", action="store_true",
                       help="Generate baselines and anomalies")
    parser.add_argument("--verbose", "-v", action="store_true",
                       help="Enable verbose logging")
    
    args = parser.parse_args()
    
    if args.verbose:
        logging.getLogger().setLevel(logging.DEBUG)
    
    generator = SampleDataGenerator()
    
    try:
        total_records = 0
        
        if "ersst" in args.datasets or "both" in args.datasets:
            records = generator.generate_ersst_sample_data(
                start_year=args.start_year,
                end_year=args.end_year,
                spatial_resolution=args.spatial_resolution
            )
            total_records += records
        
        if "oisst" in args.datasets or "both" in args.datasets:
            start_date = datetime.strptime(args.start_date, "%Y-%m-%d").date()
            end_date = datetime.strptime(args.end_date, "%Y-%m-%d").date()
            
            records = generator.generate_oisst_sample_data(
                start_date=start_date,
                end_date=end_date,
                spatial_resolution=args.spatial_resolution,
                sample_factor=2  # Subsample for manageability
            )
            total_records += records
        
        if args.with_analysis:
            logger.info("Generating analysis products (baselines, anomalies)")
            baseline_records = generator.generate_sample_climate_baselines()
            anomaly_records = generator.generate_sample_anomalies()
            total_records += baseline_records + anomaly_records
        
        generator.record_job_status("success", f"Generated {total_records} total records")
        logger.info(f"Sample data generation completed successfully: {total_records} records")
        
    except Exception as e:
        generator.record_job_status("error", str(e))
        logger.error(f"Sample data generation failed: {e}")
        sys.exit(1)


if __name__ == "__main__":
    main()