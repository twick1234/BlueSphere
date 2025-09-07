#!/usr/bin/env python3
# SPDX-License-Identifier: MIT
# © 2024–2025 Mark Lindon — BlueSphere
"""
Temporal data processing and aggregation script for BlueSphere.

Handles aggregation of temporal temperature data, climate baseline calculation,
anomaly calculation, marine heatwave detection, and data maintenance tasks.
"""

import sys
import argparse
import logging
from datetime import datetime, date, timedelta, timezone
from pathlib import Path
from typing import List, Optional

# Add parent directory to path for imports
sys.path.append(str(Path(__file__).parent.parent))

from backend.db import get_session
from backend.temporal_db import TemporalDataManager
from backend.models import JobRun

# Configure logging
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

class TemporalProcessor:
    """Handles processing and aggregation of temporal temperature data"""
    
    def __init__(self):
        self.session = get_session()
        self.data_manager = TemporalDataManager()
    
    def record_job_status(self, job_name: str, status: str, note: str = "", 
                         started_at: Optional[datetime] = None):
        """Record job run status in database"""
        if started_at is None:
            started_at = datetime.now(timezone.utc)
            
        job_run = JobRun(
            job=job_name,
            status=status,
            started_at=started_at,
            finished_at=datetime.now(timezone.utc),
            note=note
        )
        
        self.session.add(job_run)
        self.session.commit()
    
    def aggregate_daily_to_monthly(self, year: Optional[int] = None, 
                                  dataset: str = "OISST", 
                                  months: Optional[List[int]] = None) -> int:
        """
        Aggregate daily temperature data to monthly summaries.
        
        Args:
            year: Target year (default: current year)
            dataset: Dataset to process
            months: Specific months to process (default: all months)
            
        Returns:
            Total number of aggregated records
        """
        started_at = datetime.now(timezone.utc)
        job_name = f"AGGREGATE_DAILY_MONTHLY_{dataset}"
        
        if year is None:
            year = datetime.now().year
        
        if months is None:
            months = list(range(1, 13))  # All months
        
        logger.info(f"Aggregating daily to monthly: {dataset} {year}, months {months}")
        
        try:
            total_records = 0
            
            for month in months:
                try:
                    records = self.data_manager.aggregate_daily_to_monthly(
                        year=year,
                        month=month, 
                        dataset=dataset,
                        spatial_resolution=1.0  # 1-degree binning
                    )
                    total_records += records
                    logger.info(f"Aggregated {records} records for {year}-{month:02d}")
                    
                except Exception as e:
                    logger.error(f"Failed to aggregate {year}-{month:02d}: {e}")
                    continue
            
            status = "success" if total_records > 0 else "error"
            note = f"Aggregated {total_records} monthly records for {dataset} {year}"
            
            self.record_job_status(job_name, status, note, started_at)
            logger.info(f"Monthly aggregation completed: {note}")
            
            return total_records
            
        except Exception as e:
            logger.error(f"Monthly aggregation failed: {e}")
            self.record_job_status(job_name, "error", str(e), started_at)
            return 0
    
    def aggregate_monthly_to_yearly(self, years: Optional[List[int]] = None, 
                                   dataset: str = "ERSST") -> int:
        """
        Aggregate monthly temperature data to yearly summaries.
        
        Args:
            years: Target years (default: last 10 years)
            dataset: Dataset to process
            
        Returns:
            Total number of aggregated records
        """
        started_at = datetime.now(timezone.utc)
        job_name = f"AGGREGATE_MONTHLY_YEARLY_{dataset}"
        
        if years is None:
            current_year = datetime.now().year
            years = list(range(current_year - 10, current_year))
        
        logger.info(f"Aggregating monthly to yearly: {dataset}, years {years}")
        
        try:
            total_records = 0
            
            for year in years:
                try:
                    records = self.data_manager.aggregate_monthly_to_yearly(
                        year=year,
                        dataset=dataset,
                        spatial_resolution=2.0  # 2-degree binning for yearly data
                    )
                    total_records += records
                    logger.info(f"Aggregated {records} yearly records for {year}")
                    
                except Exception as e:
                    logger.error(f"Failed to aggregate year {year}: {e}")
                    continue
            
            status = "success" if total_records > 0 else "error"
            note = f"Aggregated {total_records} yearly records for {dataset}"
            
            self.record_job_status(job_name, status, note, started_at)
            logger.info(f"Yearly aggregation completed: {note}")
            
            return total_records
            
        except Exception as e:
            logger.error(f"Yearly aggregation failed: {e}")
            self.record_job_status(job_name, "error", str(e), started_at)
            return 0
    
    def calculate_climate_baselines(self, baseline_periods: List[str] = None, 
                                   datasets: List[str] = None) -> int:
        """
        Calculate climate baselines for anomaly detection.
        
        Args:
            baseline_periods: List of baseline periods (e.g., ["1991-2020", "1981-2010"])
            datasets: List of datasets to process
            
        Returns:
            Total number of baseline records created
        """
        started_at = datetime.now(timezone.utc)
        job_name = "CALCULATE_BASELINES"
        
        if baseline_periods is None:
            baseline_periods = ["1991-2020", "1981-2010"]  # Standard WMO periods
        
        if datasets is None:
            datasets = ["ERSST", "OISST"]
        
        logger.info(f"Calculating climate baselines for periods {baseline_periods}, datasets {datasets}")
        
        try:
            total_records = 0
            
            for period in baseline_periods:
                start_year, end_year = map(int, period.split('-'))
                
                for dataset in datasets:
                    try:
                        records = self.data_manager.calculate_climate_baseline(
                            start_year=start_year,
                            end_year=end_year,
                            dataset=dataset,
                            spatial_resolution=2.0  # 2-degree resolution for baselines
                        )
                        total_records += records
                        logger.info(f"Calculated {records} baseline records for {dataset} {period}")
                        
                    except Exception as e:
                        logger.error(f"Failed to calculate baseline {dataset} {period}: {e}")
                        continue
            
            status = "success" if total_records > 0 else "error"
            note = f"Calculated {total_records} climate baseline records"
            
            self.record_job_status(job_name, status, note, started_at)
            logger.info(f"Climate baseline calculation completed: {note}")
            
            return total_records
            
        except Exception as e:
            logger.error(f"Climate baseline calculation failed: {e}")
            self.record_job_status(job_name, "error", str(e), started_at)
            return 0
    
    def calculate_temperature_anomalies(self, years: Optional[List[int]] = None,
                                      baseline_period: str = "1991-2020",
                                      datasets: List[str] = None) -> int:
        """
        Calculate temperature anomalies against climate baselines.
        
        Args:
            years: Years to calculate anomalies for
            baseline_period: Baseline period for anomaly calculation
            datasets: Datasets to process
            
        Returns:
            Total number of anomaly records created
        """
        started_at = datetime.now(timezone.utc)
        job_name = f"CALCULATE_ANOMALIES_{baseline_period}"
        
        if years is None:
            current_year = datetime.now().year
            years = list(range(current_year - 5, current_year + 1))  # Last 5 years + current
        
        if datasets is None:
            datasets = ["ERSST"]  # Start with monthly ERSST data
        
        logger.info(f"Calculating temperature anomalies for years {years}, baseline {baseline_period}")
        
        try:
            total_records = 0
            
            for year in years:
                for dataset in datasets:
                    try:
                        records = self.data_manager.calculate_temperature_anomalies(
                            target_year=year,
                            baseline_period=baseline_period,
                            dataset=dataset
                        )
                        total_records += records
                        logger.info(f"Calculated {records} anomaly records for {dataset} {year}")
                        
                    except Exception as e:
                        logger.error(f"Failed to calculate anomalies {dataset} {year}: {e}")
                        continue
            
            status = "success" if total_records > 0 else "error"
            note = f"Calculated {total_records} temperature anomaly records"
            
            self.record_job_status(job_name, status, note, started_at)
            logger.info(f"Temperature anomaly calculation completed: {note}")
            
            return total_records
            
        except Exception as e:
            logger.error(f"Temperature anomaly calculation failed: {e}")
            self.record_job_status(job_name, "error", str(e), started_at)
            return 0
    
    def detect_marine_heatwaves(self, start_date: date, end_date: date,
                               dataset: str = "OISST",
                               threshold_percentile: int = 90,
                               min_duration: int = 5) -> int:
        """
        Detect marine heatwave events from temperature anomaly data.
        
        This is a simplified implementation - a full MHW detection would require
        more sophisticated algorithms like those used in the Marine Heatwaves
        (marineHeatwaves) Python package.
        
        Args:
            start_date: Start date for detection
            end_date: End date for detection
            dataset: Dataset to process
            threshold_percentile: Temperature percentile for threshold
            min_duration: Minimum duration in days
            
        Returns:
            Number of heatwave events detected
        """
        started_at = datetime.now(timezone.utc)
        job_name = f"DETECT_HEATWAVES_{dataset}"
        
        logger.info(f"Detecting marine heatwaves {start_date} to {end_date}, dataset {dataset}")
        logger.warning("This is a simplified heatwave detection - full implementation would require more sophisticated algorithms")
        
        try:
            # This is a placeholder implementation
            # Real MHW detection would require:
            # 1. Calculate daily climatology and thresholds
            # 2. Identify periods above threshold
            # 3. Apply duration and intensity criteria
            # 4. Calculate MHW metrics (intensity, cumulative intensity, etc.)
            
            # For now, just log that the framework is in place
            detected_events = 0
            
            status = "success"
            note = f"Marine heatwave detection framework ready (detected {detected_events} events)"
            
            self.record_job_status(job_name, status, note, started_at)
            logger.info(f"Marine heatwave detection completed: {note}")
            
            return detected_events
            
        except Exception as e:
            logger.error(f"Marine heatwave detection failed: {e}")
            self.record_job_status(job_name, "error", str(e), started_at)
            return 0
    
    def run_maintenance_tasks(self):
        """Run database maintenance and optimization tasks"""
        started_at = datetime.now(timezone.utc)
        job_name = "MAINTENANCE"
        
        logger.info("Running temporal data maintenance tasks")
        
        try:
            # Vacuum and analyze temporal tables for better performance
            maintenance_sql = [
                "VACUUM ANALYZE temporal_temperature_grid;",
                "VACUUM ANALYZE temporal_temperature_daily;", 
                "VACUUM ANALYZE temporal_temperature_monthly;",
                "VACUUM ANALYZE temporal_temperature_yearly;",
                "VACUUM ANALYZE temperature_anomaly;",
                "VACUUM ANALYZE climate_baseline;",
                "VACUUM ANALYZE marine_heatwave;"
            ]
            
            for sql in maintenance_sql:
                try:
                    self.session.execute(sql)
                    logger.debug(f"Executed: {sql}")
                except Exception as e:
                    logger.warning(f"Maintenance SQL failed: {sql}, error: {e}")
            
            self.session.commit()
            
            status = "success"
            note = "Database maintenance completed"
            
            self.record_job_status(job_name, status, note, started_at)
            logger.info("Maintenance tasks completed")
            
        except Exception as e:
            logger.error(f"Maintenance tasks failed: {e}")
            self.record_job_status(job_name, "error", str(e), started_at)


def main():
    """Main entry point for temporal processor"""
    parser = argparse.ArgumentParser(description="Temporal temperature data processor")
    parser.add_argument("--task", 
                       choices=["aggregate-monthly", "aggregate-yearly", "baselines", 
                               "anomalies", "heatwaves", "maintenance", "all"],
                       default="all",
                       help="Processing task to run")
    parser.add_argument("--year", type=int, default=None,
                       help="Target year for processing")
    parser.add_argument("--dataset", default="ERSST",
                       help="Dataset to process")
    parser.add_argument("--baseline-period", default="1991-2020",
                       help="Baseline period for anomalies")
    parser.add_argument("--start-date", default=None,
                       help="Start date for heatwave detection (YYYY-MM-DD)")
    parser.add_argument("--end-date", default=None,
                       help="End date for heatwave detection (YYYY-MM-DD)")
    parser.add_argument("--verbose", "-v", action="store_true",
                       help="Enable verbose logging")
    
    args = parser.parse_args()
    
    if args.verbose:
        logging.getLogger().setLevel(logging.DEBUG)
    
    processor = TemporalProcessor()
    
    try:
        if args.task in ["aggregate-monthly", "all"]:
            logger.info("Running monthly aggregation")
            processor.aggregate_daily_to_monthly(year=args.year, dataset=args.dataset)
        
        if args.task in ["aggregate-yearly", "all"]:
            logger.info("Running yearly aggregation")
            processor.aggregate_monthly_to_yearly(dataset=args.dataset)
        
        if args.task in ["baselines", "all"]:
            logger.info("Calculating climate baselines")
            processor.calculate_climate_baselines()
        
        if args.task in ["anomalies", "all"]:
            logger.info("Calculating temperature anomalies")
            processor.calculate_temperature_anomalies(baseline_period=args.baseline_period)
        
        if args.task in ["heatwaves", "all"]:
            if args.start_date and args.end_date:
                start_date = datetime.strptime(args.start_date, "%Y-%m-%d").date()
                end_date = datetime.strptime(args.end_date, "%Y-%m-%d").date()
            else:
                # Default to last year
                end_date = date.today()
                start_date = date(end_date.year - 1, 1, 1)
            
            logger.info("Detecting marine heatwaves")
            processor.detect_marine_heatwaves(start_date, end_date, dataset=args.dataset)
        
        if args.task in ["maintenance", "all"]:
            logger.info("Running maintenance tasks")
            processor.run_maintenance_tasks()
        
        logger.info("All processing tasks completed successfully")
        
    except KeyboardInterrupt:
        logger.info("Interrupted by user")
        sys.exit(1)
    except Exception as e:
        logger.error(f"Fatal error: {e}")
        sys.exit(1)


if __name__ == "__main__":
    main()