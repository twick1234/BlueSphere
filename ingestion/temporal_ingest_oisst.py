#!/usr/bin/env python3
# SPDX-License-Identifier: MIT
# © 2024–2025 Mark Lindon — BlueSphere
"""
Enhanced OISST (Optimum Interpolation Sea Surface Temperature) temporal ingestion pipeline.

Downloads, processes, and ingests daily OISST v2.1 data from NOAA into the temporal temperature database.
OISST provides daily 0.25° resolution SST data from 1981 to present.
"""

import os
import sys
import tempfile
from typing import List, Dict, Any, Optional
from datetime import datetime, date, timedelta, timezone
from pathlib import Path
import argparse
import logging

import httpx
import xarray as xr
import numpy as np
from sqlalchemy.dialects.postgresql import insert
from tqdm import tqdm

# Add parent directory to path for imports
sys.path.append(str(Path(__file__).parent.parent))

from backend.db import get_session
from backend.models import (
    TemporalTemperatureGrid, 
    TemporalTemperatureDaily, 
    JobRun
)
from backend.temporal_db import TemporalDataManager

# Configure logging
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

class OISSTIngester:
    """Enhanced OISST v2.1 daily data ingestion pipeline"""
    
    def __init__(self):
        # NOAA OISST THREDDS server
        self.base_url = os.getenv(
            "OISST_BASE", 
            "https://www.ncei.noaa.gov/thredds/dodsC/OisstBase/NetCDF/V2.1/AVHRR"
        )
        # Alternative direct download URL
        self.download_base = os.getenv(
            "OISST_DOWNLOAD_BASE",
            "https://www.ncei.noaa.gov/pub/data/cmb/ersst/v5/netcdf"  # Placeholder - update with actual OISST URL
        )
        
        self.session = get_session()
        self.data_manager = TemporalDataManager()
        
    def generate_oisst_urls(self, start_date: date, end_date: date) -> List[Dict[str, Any]]:
        """
        Generate OISST file URLs for a date range.
        
        Args:
            start_date: Start date
            end_date: End date
            
        Returns:
            List of dictionaries with file information
        """
        file_info = []
        current_date = start_date
        
        while current_date <= end_date:
            year = current_date.year
            month = current_date.month
            day = current_date.day
            
            # OISST filename format: oisst-avhrr-v02r01.YYYYMMDD.nc
            filename = f"oisst-avhrr-v02r01.{year:04d}{month:02d}{day:02d}.nc"
            
            # THREDDS DODSV URL
            dodsv_url = f"{self.base_url}/{year}/{month:02d}/{filename}"
            
            # Direct download URL (if available)
            download_url = f"{self.download_base}/{year}/{filename}"
            
            file_info.append({
                'date': current_date,
                'filename': filename,
                'dodsv_url': dodsv_url,
                'download_url': download_url
            })
            
            current_date += timedelta(days=1)
        
        return file_info
    
    def download_oisst_data(self, file_info: Dict[str, Any]) -> Optional[xr.Dataset]:
        """
        Download OISST data using THREDDS or direct download.
        
        Args:
            file_info: File information dictionary
            
        Returns:
            xarray Dataset or None if failed
        """
        logger.debug(f"Downloading {file_info['filename']}")
        
        # Try THREDDS OPeNDAP first (more efficient for subsetting)
        try:
            ds = xr.open_dataset(file_info['dodsv_url'])
            return ds
        except Exception as e:
            logger.warning(f"THREDDS access failed for {file_info['filename']}: {e}")
        
        # Try direct download as fallback
        try:
            with httpx.Client(timeout=120) as client:
                response = client.get(file_info['download_url'])
                response.raise_for_status()
                
                with tempfile.NamedTemporaryFile(suffix='.nc', delete=False) as tmp_file:
                    tmp_file.write(response.content)
                    tmp_file_path = tmp_file.name
                
                ds = xr.open_dataset(tmp_file_path)
                os.unlink(tmp_file_path)  # Clean up temp file
                return ds
                
        except Exception as e:
            logger.error(f"Direct download failed for {file_info['filename']}: {e}")
            return None
    
    def process_oisst_dataset(self, ds: xr.Dataset, target_date: date) -> Dict[str, Any]:
        """
        Process OISST xarray dataset into database-ready format.
        
        Args:
            ds: xarray Dataset
            target_date: Date for this dataset
            
        Returns:
            Dictionary with processed data
        """
        # OISST typically has 'sst' variable
        sst_var = 'sst'
        if sst_var not in ds.data_vars:
            # Try alternative names
            for alt_name in ['SST', 'sea_surface_temperature', 'temperature']:
                if alt_name in ds.data_vars:
                    sst_var = alt_name
                    break
        
        if sst_var not in ds.data_vars:
            raise ValueError(f"Could not find SST variable in OISST data")
        
        # Get SST data - OISST is typically (time, lat, lon) or (lat, lon)
        sst_data = ds[sst_var].squeeze()  # Remove singleton time dimension if present
        
        # Get coordinates
        if 'lat' in sst_data.coords:
            lats = sst_data.coords['lat'].values
            lons = sst_data.coords['lon'].values
        elif 'latitude' in sst_data.coords:
            lats = sst_data.coords['latitude'].values
            lons = sst_data.coords['longitude'].values
        else:
            raise ValueError("Could not find latitude/longitude coordinates")
        
        # Handle longitude convention (OISST typically uses 0-360)
        if np.max(lons) > 180:
            lons = ((lons + 180) % 360) - 180
            # Reorder data to match new longitude order
            lon_order = np.argsort(lons)
            lons = lons[lon_order]
            sst_data = sst_data[:, lon_order] if sst_data.ndim == 2 else sst_data[lon_order]
        
        sst_values = sst_data.values
        
        # Handle missing data and quality control
        # OISST uses different fill values, typically large negative numbers
        sst_values = np.where(sst_values < -10, np.nan, sst_values)
        sst_values = np.where(sst_values > 50, np.nan, sst_values)
        
        # Process grid data
        grid_records = []
        daily_aggregates = {}
        
        # Spatial resolution for OISST (typically 0.25°)
        lat_res = abs(lats[1] - lats[0]) if len(lats) > 1 else 0.25
        lon_res = abs(lons[1] - lons[0]) if len(lons) > 1 else 0.25
        resolution_str = f"{lat_res:.2f}x{lon_res:.2f}"
        
        for i, lat in enumerate(lats):
            for j, lon in enumerate(lons):
                sst_val = float(sst_values[i, j]) if not np.isnan(sst_values[i, j]) else None
                
                if sst_val is not None:
                    # Grid record (high resolution)
                    grid_records.append({
                        'date': target_date,
                        'lat': float(lat),
                        'lon': float(lon),
                        'sst_c': sst_val,
                        'dataset': 'OISST',
                        'resolution': resolution_str,
                        'quality_flag': 0,
                        'created_at': datetime.now(timezone.utc)
                    })
                    
                    # Aggregate for daily summary (bin to 1-degree grid for manageable size)
                    lat_bin = round(float(lat))
                    lon_bin = round(float(lon))
                    key = (lat_bin, lon_bin)
                    
                    if key not in daily_aggregates:
                        daily_aggregates[key] = []
                    daily_aggregates[key].append(sst_val)
        
        # Calculate daily aggregates
        daily_records = []
        for (lat_bin, lon_bin), temps in daily_aggregates.items():
            daily_records.append({
                'date': target_date,
                'lat_bin': lat_bin,
                'lon_bin': lon_bin,
                'avg_sst_c': np.mean(temps),
                'min_sst_c': np.min(temps),
                'max_sst_c': np.max(temps),
                'std_sst_c': np.std(temps) if len(temps) > 1 else 0.0,
                'count': len(temps),
                'dataset': 'OISST'
            })
        
        return {
            'date': target_date,
            'grid_records': grid_records,
            'daily_records': daily_records,
            'spatial_bounds': {
                'lat_min': float(np.min(lats)),
                'lat_max': float(np.max(lats)),
                'lon_min': float(np.min(lons)),
                'lon_max': float(np.max(lons))
            },
            'resolution': resolution_str
        }
    
    def ingest_processed_data(self, processed_data: Dict[str, Any], 
                            store_grid: bool = False) -> bool:
        """
        Ingest processed OISST data into database.
        
        Args:
            processed_data: Dictionary with processed data
            store_grid: Whether to store full grid data (can be very large for OISST)
            
        Returns:
            True if successful, False otherwise
        """
        try:
            # Insert daily aggregates (always store these)
            daily_records = processed_data['daily_records']
            if daily_records:
                stmt = insert(TemporalTemperatureDaily).values(daily_records)
                stmt = stmt.on_conflict_do_update(
                    constraint='uq_temp_daily_location',
                    set_={
                        'avg_sst_c': stmt.excluded.avg_sst_c,
                        'min_sst_c': stmt.excluded.min_sst_c,
                        'max_sst_c': stmt.excluded.max_sst_c,
                        'std_sst_c': stmt.excluded.std_sst_c,
                        'count': stmt.excluded.count
                    }
                )
                
                self.session.execute(stmt)
                logger.info(f"Inserted {len(daily_records)} daily aggregate records")
            
            # Optionally store full grid data (warning: OISST is 0.25° resolution = very large!)
            if store_grid:
                grid_records = processed_data['grid_records']
                if grid_records:
                    batch_size = 5000  # Larger batches for OISST
                    for i in range(0, len(grid_records), batch_size):
                        batch = grid_records[i:i+batch_size]
                        
                        stmt = insert(TemporalTemperatureGrid).values(batch)
                        stmt = stmt.on_conflict_do_update(
                            constraint='uq_temp_grid_date_location',
                            set_={
                                'sst_c': stmt.excluded.sst_c,
                                'quality_flag': stmt.excluded.quality_flag,
                                'created_at': stmt.excluded.created_at
                            }
                        )
                        
                        self.session.execute(stmt)
                    
                    logger.info(f"Inserted {len(grid_records)} grid records")
            
            self.session.commit()
            return True
            
        except Exception as e:
            logger.error(f"Failed to ingest OISST data: {e}")
            self.session.rollback()
            return False
    
    def record_job_status(self, status: str, note: str = "", started_at: Optional[datetime] = None):
        """Record job run status in database"""
        if started_at is None:
            started_at = datetime.now(timezone.utc)
            
        job_run = JobRun(
            job="OISST_TEMPORAL",
            status=status,
            started_at=started_at,
            finished_at=datetime.now(timezone.utc),
            note=note
        )
        
        self.session.add(job_run)
        self.session.commit()
    
    def run_historical_backfill(self, start_date: date, end_date: date, 
                               store_grid: bool = False, max_days: Optional[int] = None):
        """
        Run historical backfill of OISST data.
        
        Args:
            start_date: Start date (OISST available from 1981-09-01)
            end_date: End date
            store_grid: Whether to store full grid data (can be massive)
            max_days: Maximum number of days to process (for testing)
        """
        started_at = datetime.now(timezone.utc)
        logger.info(f"Starting OISST historical backfill from {start_date} to {end_date}")
        
        # OISST data starts from 1981-09-01
        earliest_date = date(1981, 9, 1)
        if start_date < earliest_date:
            logger.warning(f"OISST data not available before {earliest_date}, adjusting start date")
            start_date = earliest_date
        
        try:
            # Generate file list
            file_list = self.generate_oisst_urls(start_date, end_date)
            
            if max_days:
                file_list = file_list[:max_days]
            
            if not file_list:
                logger.warning("No OISST files to process")
                self.record_job_status("error", "No files to process", started_at)
                return
            
            logger.info(f"Processing {len(file_list)} OISST files")
            if store_grid:
                logger.warning("Storing full grid data - this will consume significant database space!")
            
            success_count = 0
            error_count = 0
            
            for file_info in tqdm(file_list, desc="Processing OISST files"):
                try:
                    # Download data
                    ds = self.download_oisst_data(file_info)
                    if ds is None:
                        error_count += 1
                        continue
                    
                    # Process data
                    processed_data = self.process_oisst_dataset(ds, file_info['date'])
                    ds.close()  # Clean up
                    
                    # Ingest data
                    if self.ingest_processed_data(processed_data, store_grid):
                        success_count += 1
                    else:
                        error_count += 1
                        
                except Exception as e:
                    error_count += 1
                    logger.error(f"Error processing {file_info['filename']}: {e}")
                    continue
            
            # Record final job status
            if error_count == 0:
                status = "success"
                note = f"Processed {success_count} files successfully"
            elif success_count > 0:
                status = "partial"
                note = f"Processed {success_count} files, {error_count} errors"
            else:
                status = "error"
                note = f"All {error_count} files failed"
            
            self.record_job_status(status, note, started_at)
            logger.info(f"OISST backfill completed: {note}")
            
        except Exception as e:
            logger.error(f"OISST backfill failed: {e}")
            self.record_job_status("error", str(e), started_at)
    
    def run_incremental_update(self, lookback_days: int = 30, store_grid: bool = False):
        """
        Run incremental update for recent OISST data.
        
        Args:
            lookback_days: Number of days to look back for updates
            store_grid: Whether to store full grid data
        """
        started_at = datetime.now(timezone.utc)
        logger.info(f"Starting OISST incremental update (lookback: {lookback_days} days)")
        
        try:
            # Calculate date range
            end_date = date.today() - timedelta(days=1)  # OISST has 1-day delay
            start_date = end_date - timedelta(days=lookback_days)
            
            # Generate file list
            file_list = self.generate_oisst_urls(start_date, end_date)
            
            if not file_list:
                logger.info("No recent OISST files to update")
                self.record_job_status("success", "No updates needed", started_at)
                return
            
            logger.info(f"Updating {len(file_list)} recent OISST files")
            
            success_count = 0
            error_count = 0
            
            for file_info in file_list:
                try:
                    # Download and process
                    ds = self.download_oisst_data(file_info)
                    if ds is None:
                        error_count += 1
                        continue
                    
                    processed_data = self.process_oisst_dataset(ds, file_info['date'])
                    ds.close()
                    
                    # Ingest
                    if self.ingest_processed_data(processed_data, store_grid):
                        success_count += 1
                    else:
                        error_count += 1
                        
                except Exception as e:
                    error_count += 1
                    logger.error(f"Error updating {file_info['filename']}: {e}")
                    continue
            
            # Record job status
            status = "success" if error_count == 0 else "partial" if success_count > 0 else "error"
            note = f"Updated {success_count} files, {error_count} errors"
            
            self.record_job_status(status, note, started_at)
            logger.info(f"OISST incremental update completed: {note}")
            
        except Exception as e:
            logger.error(f"OISST incremental update failed: {e}")
            self.record_job_status("error", str(e), started_at)


def main():
    """Main entry point for OISST ingestion"""
    parser = argparse.ArgumentParser(description="OISST v2.1 temporal data ingestion")
    parser.add_argument("--mode", choices=["backfill", "incremental"], default="incremental",
                       help="Ingestion mode")
    parser.add_argument("--start-date", type=str, default="1981-09-01",
                       help="Start date for backfill (YYYY-MM-DD, default: 1981-09-01)")
    parser.add_argument("--end-date", type=str, default=None,
                       help="End date for backfill (YYYY-MM-DD, default: yesterday)")
    parser.add_argument("--store-grid", action="store_true",
                       help="Store full grid data (warning: very large for OISST!)")
    parser.add_argument("--max-days", type=int, default=None,
                       help="Maximum number of days to process (for testing)")
    parser.add_argument("--lookback-days", type=int, default=30,
                       help="Lookback days for incremental updates")
    parser.add_argument("--verbose", "-v", action="store_true",
                       help="Enable verbose logging")
    
    args = parser.parse_args()
    
    if args.verbose:
        logging.getLogger().setLevel(logging.DEBUG)
    
    # Parse dates
    start_date = datetime.strptime(args.start_date, "%Y-%m-%d").date()
    
    if args.end_date:
        end_date = datetime.strptime(args.end_date, "%Y-%m-%d").date()
    else:
        end_date = date.today() - timedelta(days=1)  # Yesterday
    
    ingester = OISSTIngester()
    
    try:
        if args.mode == "backfill":
            ingester.run_historical_backfill(start_date, end_date, args.store_grid, args.max_days)
        else:
            ingester.run_incremental_update(args.lookback_days, args.store_grid)
            
    except KeyboardInterrupt:
        logger.info("Interrupted by user")
        sys.exit(1)
    except Exception as e:
        logger.error(f"Fatal error: {e}")
        sys.exit(1)


if __name__ == "__main__":
    main()