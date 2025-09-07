# SPDX-License-Identifier: MIT
# © 2024–2025 Mark Lindon — BlueSphere
"""
Temporal temperature database operations and aggregation functions.
Provides efficient querying, aggregation, and analysis of historical temperature data.
"""

from typing import List, Optional, Dict, Any, Tuple
from datetime import datetime, date, timedelta
from sqlalchemy import select, func, and_, or_, desc, asc, text
from sqlalchemy.orm import Session
from sqlalchemy.dialects.postgresql import insert

from backend.db import get_session
from backend.models import (
    TemporalTemperatureGrid, 
    TemporalTemperatureDaily,
    TemporalTemperatureMonthly, 
    TemporalTemperatureYearly,
    ClimateBaseline, 
    TemperatureAnomaly, 
    MarineHeatwave
)
import numpy as np
from functools import lru_cache


class TemporalDataManager:
    """Manages temporal temperature data operations"""
    
    def __init__(self):
        self.session = get_session()
    
    def get_temperature_data(
        self, 
        start_date: date, 
        end_date: date,
        bbox: Optional[Tuple[float, float, float, float]] = None,
        dataset: Optional[str] = None,
        resolution: str = "daily",
        limit: int = 5000,
        offset: int = 0
    ) -> List[Dict[str, Any]]:
        """
        Retrieve temperature data for a date range and optional bounding box.
        
        Args:
            start_date: Start date for data query
            end_date: End date for data query
            bbox: Optional bounding box (min_lon, min_lat, max_lon, max_lat)
            dataset: Optional dataset filter (ERSST, OISST, etc.)
            resolution: Data resolution (daily, monthly, yearly)
            limit: Maximum number of records to return
            offset: Offset for pagination
            
        Returns:
            List of temperature data records
        """
        
        # Select appropriate table based on resolution
        if resolution == "daily":
            table = TemporalTemperatureDaily
            date_col = table.date
            lat_col = table.lat_bin
            lon_col = table.lon_bin
            temp_col = table.avg_sst_c
        elif resolution == "monthly":
            table = TemporalTemperatureMonthly
            # For monthly, construct date from year and month
            date_col = func.make_date(table.year, table.month, 1)
            lat_col = table.lat_bin
            lon_col = table.lon_bin
            temp_col = table.avg_sst_c
        elif resolution == "yearly":
            table = TemporalTemperatureYearly
            date_col = func.make_date(table.year, 1, 1)
            lat_col = table.lat_bin
            lon_col = table.lon_bin
            temp_col = table.avg_sst_c
        else:
            # Raw grid data
            table = TemporalTemperatureGrid
            date_col = table.date
            lat_col = table.lat
            lon_col = table.lon
            temp_col = table.sst_c
        
        query = select(table).where(
            and_(
                date_col >= start_date,
                date_col <= end_date
            )
        )
        
        if bbox:
            min_lon, min_lat, max_lon, max_lat = bbox
            query = query.where(
                and_(
                    lat_col >= min_lat,
                    lat_col <= max_lat,
                    lon_col >= min_lon,
                    lon_col <= max_lon
                )
            )
        
        if dataset:
            query = query.where(table.dataset == dataset)
        
        query = query.order_by(date_col.desc()).limit(limit).offset(offset)
        
        results = self.session.execute(query).scalars().all()
        
        return [self._serialize_temperature_record(record, resolution) for record in results]
    
    def get_temperature_anomalies(
        self,
        start_date: date,
        end_date: date,
        baseline: str = "1991-2020",
        bbox: Optional[Tuple[float, float, float, float]] = None,
        dataset: Optional[str] = None,
        threshold: Optional[float] = None,
        limit: int = 5000,
        offset: int = 0
    ) -> List[Dict[str, Any]]:
        """
        Retrieve temperature anomaly data.
        
        Args:
            start_date: Start date for anomaly data
            end_date: End date for anomaly data  
            baseline: Baseline period (e.g., "1991-2020")
            bbox: Optional bounding box
            dataset: Optional dataset filter
            threshold: Optional minimum anomaly threshold
            limit: Maximum records to return
            offset: Offset for pagination
            
        Returns:
            List of anomaly records
        """
        
        query = select(TemperatureAnomaly).where(
            and_(
                TemperatureAnomaly.date >= start_date,
                TemperatureAnomaly.date <= end_date,
                TemperatureAnomaly.baseline_period == baseline
            )
        )
        
        if bbox:
            min_lon, min_lat, max_lon, max_lat = bbox
            query = query.where(
                and_(
                    TemperatureAnomaly.lat_bin >= min_lat,
                    TemperatureAnomaly.lat_bin <= max_lat,
                    TemperatureAnomaly.lon_bin >= min_lon,
                    TemperatureAnomaly.lon_bin <= max_lon
                )
            )
        
        if dataset:
            query = query.where(TemperatureAnomaly.dataset == dataset)
            
        if threshold is not None:
            query = query.where(func.abs(TemperatureAnomaly.anomaly_c) >= threshold)
        
        query = query.order_by(TemperatureAnomaly.date.desc()).limit(limit).offset(offset)
        
        results = self.session.execute(query).scalars().all()
        
        return [self._serialize_anomaly_record(record) for record in results]
    
    def get_marine_heatwaves(
        self,
        start_date: date,
        end_date: date,
        bbox: Optional[Tuple[float, float, float, float]] = None,
        min_duration: int = 5,
        threshold_percentile: int = 90,
        dataset: Optional[str] = None,
        limit: int = 1000,
        offset: int = 0
    ) -> List[Dict[str, Any]]:
        """
        Retrieve marine heatwave events.
        
        Args:
            start_date: Start date for heatwave search
            end_date: End date for heatwave search
            bbox: Optional bounding box
            min_duration: Minimum duration in days
            threshold_percentile: Temperature percentile threshold
            dataset: Optional dataset filter
            limit: Maximum records to return
            offset: Offset for pagination
            
        Returns:
            List of marine heatwave events
        """
        
        query = select(MarineHeatwave).where(
            and_(
                or_(
                    and_(
                        MarineHeatwave.start_date >= start_date,
                        MarineHeatwave.start_date <= end_date
                    ),
                    and_(
                        MarineHeatwave.end_date >= start_date,
                        MarineHeatwave.end_date <= end_date
                    ),
                    and_(
                        MarineHeatwave.start_date <= start_date,
                        MarineHeatwave.end_date >= end_date
                    )
                ),
                MarineHeatwave.duration_days >= min_duration,
                MarineHeatwave.threshold_percentile == threshold_percentile
            )
        )
        
        if bbox:
            min_lon, min_lat, max_lon, max_lat = bbox
            query = query.where(
                and_(
                    MarineHeatwave.lat_bin >= min_lat,
                    MarineHeatwave.lat_bin <= max_lat,
                    MarineHeatwave.lon_bin >= min_lon,
                    MarineHeatwave.lon_bin <= max_lon
                )
            )
        
        if dataset:
            query = query.where(MarineHeatwave.dataset == dataset)
        
        query = query.order_by(MarineHeatwave.start_date.desc()).limit(limit).offset(offset)
        
        results = self.session.execute(query).scalars().all()
        
        return [self._serialize_heatwave_record(record) for record in results]
    
    def aggregate_daily_to_monthly(
        self, 
        year: int, 
        month: int, 
        dataset: str,
        spatial_resolution: float = 1.0
    ) -> int:
        """
        Aggregate daily temperature data to monthly averages.
        
        Args:
            year: Target year
            month: Target month
            dataset: Dataset to aggregate
            spatial_resolution: Spatial binning resolution in degrees
            
        Returns:
            Number of records processed
        """
        
        start_date = date(year, month, 1)
        if month == 12:
            end_date = date(year + 1, 1, 1) - timedelta(days=1)
        else:
            end_date = date(year, month + 1, 1) - timedelta(days=1)
        
        # Raw SQL for efficient aggregation
        sql = text("""
            INSERT INTO temporal_temperature_monthly 
            (id, year, month, lat_bin, lon_bin, avg_sst_c, min_sst_c, max_sst_c, std_sst_c, count, dataset)
            SELECT 
                gen_random_uuid()::text,
                :year,
                :month,
                ROUND(lat_bin / :resolution) * :resolution as lat_bin,
                ROUND(lon_bin / :resolution) * :resolution as lon_bin,
                AVG(avg_sst_c) as avg_sst_c,
                MIN(min_sst_c) as min_sst_c, 
                MAX(max_sst_c) as max_sst_c,
                STDDEV(avg_sst_c) as std_sst_c,
                SUM(count) as count,
                :dataset
            FROM temporal_temperature_daily
            WHERE date >= :start_date 
                AND date <= :end_date 
                AND dataset = :dataset
                AND avg_sst_c IS NOT NULL
            GROUP BY 
                ROUND(lat_bin / :resolution) * :resolution,
                ROUND(lon_bin / :resolution) * :resolution
            ON CONFLICT (year, month, lat_bin, lon_bin, dataset) 
            DO UPDATE SET
                avg_sst_c = EXCLUDED.avg_sst_c,
                min_sst_c = EXCLUDED.min_sst_c,
                max_sst_c = EXCLUDED.max_sst_c,
                std_sst_c = EXCLUDED.std_sst_c,
                count = EXCLUDED.count
        """)
        
        result = self.session.execute(sql, {
            'year': year,
            'month': month, 
            'start_date': start_date,
            'end_date': end_date,
            'dataset': dataset,
            'resolution': spatial_resolution
        })
        
        self.session.commit()
        return result.rowcount
    
    def aggregate_monthly_to_yearly(
        self, 
        year: int, 
        dataset: str,
        spatial_resolution: float = 1.0
    ) -> int:
        """
        Aggregate monthly temperature data to yearly averages.
        
        Args:
            year: Target year
            dataset: Dataset to aggregate  
            spatial_resolution: Spatial binning resolution in degrees
            
        Returns:
            Number of records processed
        """
        
        sql = text("""
            INSERT INTO temporal_temperature_yearly
            (id, year, lat_bin, lon_bin, avg_sst_c, min_sst_c, max_sst_c, std_sst_c, count, dataset)
            SELECT 
                gen_random_uuid()::text,
                :year,
                ROUND(lat_bin / :resolution) * :resolution as lat_bin,
                ROUND(lon_bin / :resolution) * :resolution as lon_bin,
                AVG(avg_sst_c) as avg_sst_c,
                MIN(min_sst_c) as min_sst_c,
                MAX(max_sst_c) as max_sst_c, 
                STDDEV(avg_sst_c) as std_sst_c,
                SUM(count) as count,
                :dataset
            FROM temporal_temperature_monthly
            WHERE year = :year
                AND dataset = :dataset
                AND avg_sst_c IS NOT NULL
            GROUP BY 
                ROUND(lat_bin / :resolution) * :resolution,
                ROUND(lon_bin / :resolution) * :resolution
            ON CONFLICT (year, lat_bin, lon_bin, dataset)
            DO UPDATE SET
                avg_sst_c = EXCLUDED.avg_sst_c,
                min_sst_c = EXCLUDED.min_sst_c,
                max_sst_c = EXCLUDED.max_sst_c,
                std_sst_c = EXCLUDED.std_sst_c,
                count = EXCLUDED.count
        """)
        
        result = self.session.execute(sql, {
            'year': year,
            'dataset': dataset,
            'resolution': spatial_resolution
        })
        
        self.session.commit()
        return result.rowcount
    
    def calculate_climate_baseline(
        self, 
        start_year: int, 
        end_year: int, 
        dataset: str,
        spatial_resolution: float = 1.0
    ) -> int:
        """
        Calculate climate baseline/climatology for anomaly calculations.
        
        Args:
            start_year: Start year for baseline period
            end_year: End year for baseline period
            dataset: Dataset to process
            spatial_resolution: Spatial binning resolution
            
        Returns:
            Number of baseline records created
        """
        
        sql = text("""
            INSERT INTO climate_baseline
            (id, lat_bin, lon_bin, month, baseline_period_start, baseline_period_end, 
             climatology_sst_c, std_sst_c, dataset)
            SELECT 
                gen_random_uuid()::text,
                ROUND(lat_bin / :resolution) * :resolution as lat_bin,
                ROUND(lon_bin / :resolution) * :resolution as lon_bin,
                month,
                :start_year,
                :end_year,
                AVG(avg_sst_c) as climatology_sst_c,
                STDDEV(avg_sst_c) as std_sst_c,
                :dataset
            FROM temporal_temperature_monthly
            WHERE year >= :start_year 
                AND year <= :end_year
                AND dataset = :dataset 
                AND avg_sst_c IS NOT NULL
            GROUP BY 
                ROUND(lat_bin / :resolution) * :resolution,
                ROUND(lon_bin / :resolution) * :resolution,
                month
            HAVING COUNT(*) >= :min_years
            ON CONFLICT (lat_bin, lon_bin, month, baseline_period_start, baseline_period_end, dataset)
            DO UPDATE SET
                climatology_sst_c = EXCLUDED.climatology_sst_c,
                std_sst_c = EXCLUDED.std_sst_c
        """)
        
        min_years = int((end_year - start_year + 1) * 0.7)  # Require 70% data availability
        
        result = self.session.execute(sql, {
            'start_year': start_year,
            'end_year': end_year,
            'dataset': dataset,
            'resolution': spatial_resolution,
            'min_years': min_years
        })
        
        self.session.commit()
        return result.rowcount
    
    def calculate_temperature_anomalies(
        self, 
        target_year: int, 
        baseline_period: str, 
        dataset: str
    ) -> int:
        """
        Calculate temperature anomalies against climate baseline.
        
        Args:
            target_year: Year to calculate anomalies for
            baseline_period: Baseline period string (e.g., "1991-2020")
            dataset: Dataset to process
            
        Returns:
            Number of anomaly records created
        """
        
        start_year, end_year = map(int, baseline_period.split('-'))
        
        sql = text("""
            INSERT INTO temperature_anomaly
            (id, date, lat_bin, lon_bin, anomaly_c, baseline_period, dataset)
            SELECT 
                gen_random_uuid()::text,
                make_date(m.year, m.month, 1) as date,
                m.lat_bin,
                m.lon_bin,
                m.avg_sst_c - b.climatology_sst_c as anomaly_c,
                :baseline_period,
                m.dataset
            FROM temporal_temperature_monthly m
            JOIN climate_baseline b ON (
                m.lat_bin = b.lat_bin 
                AND m.lon_bin = b.lon_bin 
                AND m.month = b.month
                AND b.baseline_period_start = :start_year
                AND b.baseline_period_end = :end_year
                AND b.dataset = m.dataset
            )
            WHERE m.year = :target_year 
                AND m.dataset = :dataset
                AND m.avg_sst_c IS NOT NULL
                AND b.climatology_sst_c IS NOT NULL
            ON CONFLICT (date, lat_bin, lon_bin, baseline_period, dataset)
            DO UPDATE SET
                anomaly_c = EXCLUDED.anomaly_c
        """)
        
        result = self.session.execute(sql, {
            'target_year': target_year,
            'baseline_period': baseline_period,
            'start_year': start_year,
            'end_year': end_year,
            'dataset': dataset
        })
        
        self.session.commit()
        return result.rowcount
    
    @lru_cache(maxsize=128)
    def get_data_availability(
        self, 
        dataset: str, 
        resolution: str = "monthly"
    ) -> Dict[str, Any]:
        """
        Get data availability summary for a dataset.
        
        Args:
            dataset: Dataset name
            resolution: Data resolution (daily, monthly, yearly)
            
        Returns:
            Dictionary with data availability information
        """
        
        if resolution == "monthly":
            table = TemporalTemperatureMonthly
            date_col = func.make_date(table.year, table.month, 1)
        elif resolution == "yearly":
            table = TemporalTemperatureYearly 
            date_col = func.make_date(table.year, 1, 1)
        else:
            table = TemporalTemperatureDaily
            date_col = table.date
        
        query = select(
            func.min(date_col).label('start_date'),
            func.max(date_col).label('end_date'),
            func.count().label('total_records'),
            func.min(table.lat_bin if hasattr(table, 'lat_bin') else table.lat).label('min_lat'),
            func.max(table.lat_bin if hasattr(table, 'lat_bin') else table.lat).label('max_lat'),
            func.min(table.lon_bin if hasattr(table, 'lon_bin') else table.lon).label('min_lon'),
            func.max(table.lon_bin if hasattr(table, 'lon_bin') else table.lon).label('max_lon')
        ).where(table.dataset == dataset)
        
        result = self.session.execute(query).first()
        
        if result and result.total_records > 0:
            return {
                'dataset': dataset,
                'resolution': resolution,
                'start_date': result.start_date.isoformat() if result.start_date else None,
                'end_date': result.end_date.isoformat() if result.end_date else None,
                'total_records': result.total_records,
                'spatial_bounds': {
                    'min_lat': float(result.min_lat) if result.min_lat is not None else None,
                    'max_lat': float(result.max_lat) if result.max_lat is not None else None,
                    'min_lon': float(result.min_lon) if result.min_lon is not None else None,
                    'max_lon': float(result.max_lon) if result.max_lon is not None else None,
                }
            }
        else:
            return {
                'dataset': dataset,
                'resolution': resolution,
                'start_date': None,
                'end_date': None,
                'total_records': 0,
                'spatial_bounds': None
            }
    
    def _serialize_temperature_record(self, record, resolution: str) -> Dict[str, Any]:
        """Serialize temperature record to dictionary"""
        base_data = {
            'id': record.id,
            'dataset': record.dataset,
        }
        
        if resolution == "daily":
            base_data.update({
                'date': record.date.isoformat(),
                'lat': record.lat_bin,
                'lon': record.lon_bin,
                'avg_sst_c': record.avg_sst_c,
                'min_sst_c': record.min_sst_c,
                'max_sst_c': record.max_sst_c,
                'std_sst_c': record.std_sst_c,
                'count': record.count
            })
        elif resolution in ["monthly", "yearly"]:
            if resolution == "monthly":
                base_data.update({
                    'year': record.year,
                    'month': record.month,
                    'date': f"{record.year}-{record.month:02d}-01"
                })
            else:
                base_data.update({
                    'year': record.year,
                    'date': f"{record.year}-01-01"
                })
            
            base_data.update({
                'lat': record.lat_bin,
                'lon': record.lon_bin,
                'avg_sst_c': record.avg_sst_c,
                'min_sst_c': record.min_sst_c,
                'max_sst_c': record.max_sst_c,
                'std_sst_c': record.std_sst_c,
                'count': record.count
            })
        else:  # grid data
            base_data.update({
                'date': record.date.isoformat(),
                'lat': record.lat,
                'lon': record.lon,
                'sst_c': record.sst_c,
                'resolution': record.resolution,
                'quality_flag': record.quality_flag,
                'created_at': record.created_at.isoformat()
            })
        
        return base_data
    
    def _serialize_anomaly_record(self, record) -> Dict[str, Any]:
        """Serialize anomaly record to dictionary"""
        return {
            'id': record.id,
            'date': record.date.isoformat(),
            'lat': record.lat_bin,
            'lon': record.lon_bin,
            'anomaly_c': record.anomaly_c,
            'baseline_period': record.baseline_period,
            'dataset': record.dataset
        }
    
    def _serialize_heatwave_record(self, record) -> Dict[str, Any]:
        """Serialize heatwave record to dictionary"""
        return {
            'id': record.id,
            'start_date': record.start_date.isoformat(),
            'end_date': record.end_date.isoformat(),
            'duration_days': record.duration_days,
            'lat': record.lat_bin,
            'lon': record.lon_bin,
            'max_intensity_c': record.max_intensity_c,
            'mean_intensity_c': record.mean_intensity_c,
            'cumulative_intensity': record.cumulative_intensity,
            'threshold_percentile': record.threshold_percentile,
            'dataset': record.dataset
        }
    
    def close(self):
        """Close database session"""
        if self.session:
            self.session.close()


# Global instance for reuse
temporal_data_manager = TemporalDataManager()