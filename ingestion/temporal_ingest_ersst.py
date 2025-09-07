#!/usr/bin/env python3
# SPDX-License-Identifier: MIT
# © 2024–2025 Mark Lindon — BlueSphere
"""
Enhanced ERSST v5 temporal ingestion pipeline for BlueSphere.

Downloads, processes, and ingests historical Extended Reconstructed Sea Surface Temperature (ERSST) v5 data
from NOAA into the temporal temperature database. Supports both full historical backfill and incremental updates.
"""

import os
import sys
import re
import tempfile
from typing import List, Dict, Any, Optional, Tuple
from datetime import datetime, date, timezone
from pathlib import Path
import argparse
import logging

import httpx
import xarray as xr
import numpy as np
import pandas as pd
from sqlalchemy.dialects.postgresql import insert
from tqdm import tqdm

# Add parent directory to path for imports
sys.path.append(str(Path(__file__).parent.parent))

from backend.db import get_session, get_engine
from backend.models import (
    TemporalTemperatureGrid, 
    TemporalTemperatureMonthly, 
    JobRun
)
from backend.temporal_db import TemporalDataManager

# Configure logging
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

class ERSSTIngester:
    """Enhanced ERSST v5 data ingestion pipeline"""
    
    def __init__(self):
        self.base_url = os.getenv("ERSST_BASE", "https://www.ncei.noaa.gov/pub/data/cmb/ersst/v5/netcdf")
        self.session = get_session()
        self.data_manager = TemporalDataManager()
        
    def discover_available_files(self, start_year: int = 1854, end_year: Optional[int] = None) -> List[str]:
        """
        Discover available ERSST v5 NetCDF files from NOAA server.
        
        Args:
            start_year: Starting year to search for
            end_year: Ending year (default: current year)
            
        Returns:
            List of available filenames
        """
        if end_year is None:
            end_year = datetime.now().year
            
        logger.info(f"Discovering ERSST files from {start_year} to {end_year}")
        
        try:
            with httpx.Client(timeout=60) as client:
                response = client.get(self.base_url)
                response.raise_for_status()
                index_content = response.text
        except Exception as e:
            logger.error(f"Failed to fetch ERSST index: {e}")
            return []
        
        # Find all ERSST NetCDF files
        pattern = r'ersst\.v5\.(\d{6})\.nc'
        matches = re.findall(pattern, index_content)
        
        available_files = []
        for yyyymm in matches:
            year = int(yyyymm[:4])
            if start_year <= year <= end_year:
                filename = f"ersst.v5.{yyyymm}.nc"
                available_files.append(filename)
        
        available_files.sort()
        logger.info(f"Found {len(available_files)} ERSST files")
        return available_files
    
    def download_and_process_file(self, filename: str) -> Optional[Dict[str, Any]]:
        """
        Download and process a single ERSST NetCDF file.
        
        Args:
            filename: NetCDF filename to download
            
        Returns:
            Dictionary with processed data or None if failed
        """
        url = f"{self.base_url}/{filename}"
        logger.info(f"Processing {filename}")
        
        try:
            # Download to temporary file
            with tempfile.NamedTemporaryFile(suffix='.nc', delete=False) as tmp_file:
                with httpx.stream("GET", url, timeout=300) as response:
                    response.raise_for_status()
                    total_size = int(response.headers.get('content-length', 0))
                    
                    with tqdm(total=total_size, unit='B', unit_scale=True, desc=filename) as pbar:
                        for chunk in response.iter_bytes(chunk_size=8192):
                            tmp_file.write(chunk)
                            pbar.update(len(chunk))
                
                tmp_file_path = tmp_file.name
            
            # Process NetCDF file with xarray
            with xr.open_dataset(tmp_file_path) as ds:
                processed_data = self._process_ersst_dataset(ds, filename)
            
            # Clean up temporary file
            os.unlink(tmp_file_path)
            
            return processed_data
            
        except Exception as e:
            logger.error(f"Failed to process {filename}: {e}")
            return None
    
    def _process_ersst_dataset(self, ds: xr.Dataset, filename: str) -> Dict[str, Any]:
        """
        Process ERSST xarray dataset into database-ready format.
        
        Args:
            ds: xarray Dataset
            filename: Source filename
            
        Returns:
            Dictionary with processed data
        """
        # Extract date from filename (ersst.v5.YYYYMM.nc)
        yyyymm = filename.split('.')[2]
        year = int(yyyymm[:4])
        month = int(yyyymm[4:])
        data_date = date(year, month, 1)
        
        # Get SST data (usually 'sst' variable)
        sst_var = 'sst'
        if sst_var not in ds.data_vars:
            # Try alternative variable names
            for alt_name in ['SST', 'temperature', 'temp']:
                if alt_name in ds.data_vars:
                    sst_var = alt_name
                    break
        
        if sst_var not in ds.data_vars:
            raise ValueError(f"Could not find SST variable in {filename}")
        
        sst_data = ds[sst_var].squeeze()  # Remove any singleton dimensions
        
        # Get coordinates
        lat_coord = sst_data.coords['lat'] if 'lat' in sst_data.coords else sst_data.coords['latitude']
        lon_coord = sst_data.coords['lon'] if 'lon' in sst_data.coords else sst_data.coords['longitude']
        
        lats = lat_coord.values
        lons = lon_coord.values
        
        # Convert longitude from 0-360 to -180-180 if needed
        if np.max(lons) > 180:
            lons = ((lons + 180) % 360) - 180
            # Reorder data to match new longitude order
            lon_order = np.argsort(lons)
            lons = lons[lon_order]
            sst_data = sst_data[:, lon_order] if sst_data.ndim == 2 else sst_data[lon_order]
        
        # Get SST values and handle missing data
        sst_values = sst_data.values
        
        # Replace fill values and unrealistic temperatures with NaN
        sst_values = np.where(sst_values < -10, np.nan, sst_values)  # Below -10°C is unrealistic for SST
        sst_values = np.where(sst_values > 50, np.nan, sst_values)   # Above 50°C is unrealistic
        
        # Prepare grid data
        grid_records = []
        monthly_aggregates = {}
        
        # Process each grid point
        for i, lat in enumerate(lats):
            for j, lon in enumerate(lons):
                sst_val = float(sst_values[i, j]) if not np.isnan(sst_values[i, j]) else None
                
                if sst_val is not None:
                    # Grid record
                    grid_records.append({
                        'date': data_date,
                        'lat': float(lat),
                        'lon': float(lon),
                        'sst_c': sst_val,
                        'dataset': 'ERSST',
                        'resolution': f"{abs(lats[1] - lats[0]):.2f}x{abs(lons[1] - lons[0]):.2f}",
                        'quality_flag': 0,
                        'created_at': datetime.now(timezone.utc)
                    })
                    
                    # Aggregate for monthly summary (bin to nearest degree for efficiency)
                    lat_bin = round(float(lat))
                    lon_bin = round(float(lon))
                    key = (lat_bin, lon_bin)
                    
                    if key not in monthly_aggregates:
                        monthly_aggregates[key] = []
                    monthly_aggregates[key].append(sst_val)
        
        # Calculate monthly aggregates
        monthly_records = []
        for (lat_bin, lon_bin), temps in monthly_aggregates.items():
            monthly_records.append({
                'year': year,
                'month': month,
                'lat_bin': lat_bin,
                'lon_bin': lon_bin,
                'avg_sst_c': np.mean(temps),
                'min_sst_c': np.min(temps),
                'max_sst_c': np.max(temps),
                'std_sst_c': np.std(temps) if len(temps) > 1 else 0.0,
                'count': len(temps),
                'dataset': 'ERSST'
            })
        
        return {
            'date': data_date,
            'filename': filename,
            'grid_records': grid_records,
            'monthly_records': monthly_records,
            'spatial_bounds': {
                'lat_min': float(np.min(lats)),
                'lat_max': float(np.max(lats)),
                'lon_min': float(np.min(lons)),
                'lon_max': float(np.max(lons))
            }
        }
    
    def ingest_processed_data(self, processed_data: Dict[str, Any]) -> bool:
        """
        Ingest processed data into database.
        
        Args:
            processed_data: Dictionary with processed ERSST data
            
        Returns:
            True if successful, False otherwise
        """
        try:
            # Insert grid data in batches
            grid_records = processed_data['grid_records']
            if grid_records:
                batch_size = 1000
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
            
            # Insert monthly aggregates
            monthly_records = processed_data['monthly_records']
            if monthly_records:
                stmt = insert(TemporalTemperatureMonthly).values(monthly_records)
                stmt = stmt.on_conflict_do_update(
                    constraint='uq_temp_monthly_location',
                    set_={
                        'avg_sst_c': stmt.excluded.avg_sst_c,
                        'min_sst_c': stmt.excluded.min_sst_c,
                        'max_sst_c': stmt.excluded.max_sst_c,
                        'std_sst_c': stmt.excluded.std_sst_c,
                        'count': stmt.excluded.count
                    }
                )
                
                self.session.execute(stmt)
                logger.info(f"Inserted {len(monthly_records)} monthly aggregate records")
            
            self.session.commit()
            return True
            
        except Exception as e:
            logger.error(f"Failed to ingest data: {e}")
            self.session.rollback()
            return False
    
    def record_job_status(self, status: str, note: str = "", started_at: Optional[datetime] = None):
        """Record job run status in database"""
        if started_at is None:
            started_at = datetime.now(timezone.utc)
            
        job_run = JobRun(
            job="ERSST_TEMPORAL",
            status=status,
            started_at=started_at,
            finished_at=datetime.now(timezone.utc),
            note=note
        )
        
        self.session.add(job_run)
        self.session.commit()
    
    def run_historical_backfill(self, start_year: int = 1854, end_year: Optional[int] = None, 
                               max_files: Optional[int] = None):
        """
        Run full historical backfill of ERSST data.
        
        Args:
            start_year: Starting year (default: 1854, start of ERSST record)
            end_year: Ending year (default: current year)
            max_files: Maximum number of files to process (for testing)
        """
        started_at = datetime.now(timezone.utc)
        logger.info(f"Starting ERSST historical backfill from {start_year}")
        
        try:
            # Discover available files
            available_files = self.discover_available_files(start_year, end_year)
            
            if not available_files:
                logger.warning("No ERSST files found")
                self.record_job_status("error", "No files found", started_at)
                return
            
            if max_files:
                available_files = available_files[:max_files]
            
            logger.info(f"Processing {len(available_files)} ERSST files")
            
            success_count = 0
            error_count = 0
            
            for filename in tqdm(available_files, desc="Processing ERSST files"):
                try:
                    processed_data = self.download_and_process_file(filename)
                    
                    if processed_data and self.ingest_processed_data(processed_data):
                        success_count += 1
                    else:
                        error_count += 1
                        logger.error(f"Failed to process {filename}")
                        
                except Exception as e:
                    error_count += 1
                    logger.error(f"Error processing {filename}: {e}")
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
            logger.info(f"ERSST backfill completed: {note}")
            
        except Exception as e:
            logger.error(f"ERSST backfill failed: {e}")
            self.record_job_status("error", str(e), started_at)
    
    def run_incremental_update(self, lookback_months: int = 6):
        """
        Run incremental update for recent ERSST data.
        
        Args:
            lookback_months: Number of months to look back for updates
        """
        started_at = datetime.now(timezone.utc)
        logger.info(f"Starting ERSST incremental update (lookback: {lookback_months} months)")
        
        try:
            # Calculate date range for recent data
            current_date = datetime.now()
            start_year = current_date.year if current_date.month > lookback_months else current_date.year - 1
            
            # Get recent files
            available_files = self.discover_available_files(start_year)
            
            # Filter to recent months
            recent_files = []
            for filename in available_files:
                yyyymm = filename.split('.')[2]
                file_date = datetime.strptime(yyyymm, "%Y%m")
                months_old = (current_date.year - file_date.year) * 12 + (current_date.month - file_date.month)
                
                if months_old <= lookback_months:
                    recent_files.append(filename)
            
            if not recent_files:
                logger.info("No recent ERSST files to update")
                self.record_job_status("success", "No updates needed", started_at)
                return
            
            logger.info(f"Updating {len(recent_files)} recent ERSST files")
            
            success_count = 0
            error_count = 0
            
            for filename in recent_files:
                try:
                    processed_data = self.download_and_process_file(filename)
                    
                    if processed_data and self.ingest_processed_data(processed_data):
                        success_count += 1
                    else:
                        error_count += 1
                        
                except Exception as e:
                    error_count += 1
                    logger.error(f"Error updating {filename}: {e}")
                    continue
            
            # Record job status
            status = "success" if error_count == 0 else "partial" if success_count > 0 else "error"
            note = f"Updated {success_count} files, {error_count} errors"
            
            self.record_job_status(status, note, started_at)
            logger.info(f"ERSST incremental update completed: {note}")
            
        except Exception as e:
            logger.error(f"ERSST incremental update failed: {e}")
            self.record_job_status("error", str(e), started_at)


def main():
    """Main entry point for ERSST ingestion"""
    parser = argparse.ArgumentParser(description="ERSST v5 temporal data ingestion")
    parser.add_argument("--mode", choices=["backfill", "incremental"], default="incremental",
                       help="Ingestion mode")
    parser.add_argument("--start-year", type=int, default=1854,
                       help="Start year for backfill (default: 1854)")
    parser.add_argument("--end-year", type=int, default=None,
                       help="End year for backfill (default: current year)")
    parser.add_argument("--max-files", type=int, default=None,
                       help="Maximum number of files to process (for testing)")
    parser.add_argument("--lookback-months", type=int, default=6,
                       help="Lookback months for incremental updates")
    parser.add_argument("--verbose", "-v", action="store_true",
                       help="Enable verbose logging")
    
    args = parser.parse_args()
    
    if args.verbose:
        logging.getLogger().setLevel(logging.DEBUG)
    
    ingester = ERSSTIngester()
    
    try:
        if args.mode == "backfill":
            ingester.run_historical_backfill(args.start_year, args.end_year, args.max_files)
        else:
            ingester.run_incremental_update(args.lookback_months)
            
    except KeyboardInterrupt:
        logger.info("Interrupted by user")
        sys.exit(1)
    except Exception as e:
        logger.error(f"Fatal error: {e}")
        sys.exit(1)


if __name__ == "__main__":
    main()