# SPDX-License-Identifier: MIT
# © 2024–2025 Mark Lindon — BlueSphere
from sqlalchemy import Column, Integer, Float, String, DateTime, UniqueConstraint, Index, Date, Boolean
from sqlalchemy.orm import Mapped, mapped_column
from sqlalchemy.dialects.postgresql import UUID
import uuid
from backend.db import Base

class Station(Base):
    __tablename__ = "station"
    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    station_id: Mapped[str] = mapped_column(String(32), index=True, unique=True)
    name: Mapped[str] = mapped_column(String(128), default="")
    lat: Mapped[float] = mapped_column(Float)
    lon: Mapped[float] = mapped_column(Float)
    source: Mapped[str] = mapped_column(String(32), default="NDBC")

class BuoyObs(Base):
    __tablename__ = "buoy_obs"
    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    station_id: Mapped[str] = mapped_column(String(32), index=True)
    time: Mapped[str] = mapped_column(DateTime, index=True)
    sst_c: Mapped[float] = mapped_column(Float, nullable=True)
    qc_flag: Mapped[int] = mapped_column(Integer, default=0)
    lat: Mapped[float] = mapped_column(Float)
    lon: Mapped[float] = mapped_column(Float)
    source: Mapped[str] = mapped_column(String(32), default="NDBC")

    __table_args__ = (UniqueConstraint("station_id","time", name="uq_station_time"),)

class JobRun(Base):
    __tablename__ = "job_run"
    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    job: Mapped[str] = mapped_column(String(64), index=True)
    status: Mapped[str] = mapped_column(String(16))  # success|error|running
    started_at: Mapped[str] = mapped_column(DateTime)
    finished_at: Mapped[str] = mapped_column(DateTime, nullable=True)
    note: Mapped[str] = mapped_column(String(512), default="")

# Temporal Temperature Data Models

class TemporalTemperatureGrid(Base):
    """Historical temperature grid data from ERSST v5, OISST, etc."""
    __tablename__ = "temporal_temperature_grid"
    
    id: Mapped[str] = mapped_column(UUID(as_uuid=False), primary_key=True, default=lambda: str(uuid.uuid4()))
    date: Mapped[Date] = mapped_column(Date, index=True)
    lat: Mapped[float] = mapped_column(Float, index=True)
    lon: Mapped[float] = mapped_column(Float, index=True)
    sst_c: Mapped[float] = mapped_column(Float, nullable=True)
    dataset: Mapped[str] = mapped_column(String(32), index=True)  # ERSST, OISST, etc.
    resolution: Mapped[str] = mapped_column(String(16))  # 2x2, 0.25x0.25, etc.
    quality_flag: Mapped[int] = mapped_column(Integer, default=0)
    created_at: Mapped[DateTime] = mapped_column(DateTime)
    
    __table_args__ = (
        UniqueConstraint("date", "lat", "lon", "dataset", name="uq_temp_grid_date_location"),
        Index("idx_temp_grid_spatial", "lat", "lon"),
        Index("idx_temp_grid_temporal", "date"),
        Index("idx_temp_grid_dataset_date", "dataset", "date"),
    )

class TemporalTemperatureDaily(Base):
    """Daily aggregated temperature data"""
    __tablename__ = "temporal_temperature_daily"
    
    id: Mapped[str] = mapped_column(UUID(as_uuid=False), primary_key=True, default=lambda: str(uuid.uuid4()))
    date: Mapped[Date] = mapped_column(Date, index=True)
    lat_bin: Mapped[float] = mapped_column(Float)  # rounded to grid
    lon_bin: Mapped[float] = mapped_column(Float)  # rounded to grid
    avg_sst_c: Mapped[float] = mapped_column(Float, nullable=True)
    min_sst_c: Mapped[float] = mapped_column(Float, nullable=True)
    max_sst_c: Mapped[float] = mapped_column(Float, nullable=True)
    std_sst_c: Mapped[float] = mapped_column(Float, nullable=True)
    count: Mapped[int] = mapped_column(Integer)
    dataset: Mapped[str] = mapped_column(String(32), index=True)
    
    __table_args__ = (
        UniqueConstraint("date", "lat_bin", "lon_bin", "dataset", name="uq_temp_daily_location"),
        Index("idx_temp_daily_spatial", "lat_bin", "lon_bin"),
        Index("idx_temp_daily_temporal", "date"),
    )

class TemporalTemperatureMonthly(Base):
    """Monthly aggregated temperature data"""
    __tablename__ = "temporal_temperature_monthly"
    
    id: Mapped[str] = mapped_column(UUID(as_uuid=False), primary_key=True, default=lambda: str(uuid.uuid4()))
    year: Mapped[int] = mapped_column(Integer, index=True)
    month: Mapped[int] = mapped_column(Integer, index=True)
    lat_bin: Mapped[float] = mapped_column(Float)
    lon_bin: Mapped[float] = mapped_column(Float)
    avg_sst_c: Mapped[float] = mapped_column(Float, nullable=True)
    min_sst_c: Mapped[float] = mapped_column(Float, nullable=True)
    max_sst_c: Mapped[float] = mapped_column(Float, nullable=True)
    std_sst_c: Mapped[float] = mapped_column(Float, nullable=True)
    count: Mapped[int] = mapped_column(Integer)
    dataset: Mapped[str] = mapped_column(String(32), index=True)
    
    __table_args__ = (
        UniqueConstraint("year", "month", "lat_bin", "lon_bin", "dataset", name="uq_temp_monthly_location"),
        Index("idx_temp_monthly_spatial", "lat_bin", "lon_bin"),
        Index("idx_temp_monthly_temporal", "year", "month"),
    )

class TemporalTemperatureYearly(Base):
    """Yearly aggregated temperature data"""
    __tablename__ = "temporal_temperature_yearly"
    
    id: Mapped[str] = mapped_column(UUID(as_uuid=False), primary_key=True, default=lambda: str(uuid.uuid4()))
    year: Mapped[int] = mapped_column(Integer, index=True)
    lat_bin: Mapped[float] = mapped_column(Float)
    lon_bin: Mapped[float] = mapped_column(Float)
    avg_sst_c: Mapped[float] = mapped_column(Float, nullable=True)
    min_sst_c: Mapped[float] = mapped_column(Float, nullable=True)
    max_sst_c: Mapped[float] = mapped_column(Float, nullable=True)
    std_sst_c: Mapped[float] = mapped_column(Float, nullable=True)
    count: Mapped[int] = mapped_column(Integer)
    dataset: Mapped[str] = mapped_column(String(32), index=True)
    
    __table_args__ = (
        UniqueConstraint("year", "lat_bin", "lon_bin", "dataset", name="uq_temp_yearly_location"),
        Index("idx_temp_yearly_spatial", "lat_bin", "lon_bin"),
        Index("idx_temp_yearly_temporal", "year"),
    )

class ClimateBaseline(Base):
    """Climate baseline/climatology data for anomaly calculations"""
    __tablename__ = "climate_baseline"
    
    id: Mapped[str] = mapped_column(UUID(as_uuid=False), primary_key=True, default=lambda: str(uuid.uuid4()))
    lat_bin: Mapped[float] = mapped_column(Float)
    lon_bin: Mapped[float] = mapped_column(Float)
    month: Mapped[int] = mapped_column(Integer)  # 1-12
    baseline_period_start: Mapped[int] = mapped_column(Integer)  # e.g., 1991
    baseline_period_end: Mapped[int] = mapped_column(Integer)    # e.g., 2020
    climatology_sst_c: Mapped[float] = mapped_column(Float)
    std_sst_c: Mapped[float] = mapped_column(Float)
    dataset: Mapped[str] = mapped_column(String(32), index=True)
    
    __table_args__ = (
        UniqueConstraint("lat_bin", "lon_bin", "month", "baseline_period_start", "baseline_period_end", "dataset", 
                        name="uq_climate_baseline"),
        Index("idx_climate_baseline_spatial", "lat_bin", "lon_bin"),
        Index("idx_climate_baseline_month", "month"),
    )

class TemperatureAnomaly(Base):
    """Temperature anomalies calculated against climate baselines"""
    __tablename__ = "temperature_anomaly"
    
    id: Mapped[str] = mapped_column(UUID(as_uuid=False), primary_key=True, default=lambda: str(uuid.uuid4()))
    date: Mapped[Date] = mapped_column(Date, index=True)
    lat_bin: Mapped[float] = mapped_column(Float)
    lon_bin: Mapped[float] = mapped_column(Float)
    anomaly_c: Mapped[float] = mapped_column(Float)
    baseline_period: Mapped[str] = mapped_column(String(16))  # e.g., "1991-2020"
    dataset: Mapped[str] = mapped_column(String(32), index=True)
    
    __table_args__ = (
        UniqueConstraint("date", "lat_bin", "lon_bin", "baseline_period", "dataset", name="uq_temp_anomaly"),
        Index("idx_temp_anomaly_spatial", "lat_bin", "lon_bin"),
        Index("idx_temp_anomaly_temporal", "date"),
    )

class MarineHeatwave(Base):
    """Marine heatwave events detected from temperature data"""
    __tablename__ = "marine_heatwave"
    
    id: Mapped[str] = mapped_column(UUID(as_uuid=False), primary_key=True, default=lambda: str(uuid.uuid4()))
    start_date: Mapped[Date] = mapped_column(Date, index=True)
    end_date: Mapped[Date] = mapped_column(Date, index=True)
    duration_days: Mapped[int] = mapped_column(Integer)
    lat_bin: Mapped[float] = mapped_column(Float)
    lon_bin: Mapped[float] = mapped_column(Float)
    max_intensity_c: Mapped[float] = mapped_column(Float)
    mean_intensity_c: Mapped[float] = mapped_column(Float)
    cumulative_intensity: Mapped[float] = mapped_column(Float)
    threshold_percentile: Mapped[int] = mapped_column(Integer, default=90)
    dataset: Mapped[str] = mapped_column(String(32), index=True)
    
    __table_args__ = (
        Index("idx_mhw_spatial", "lat_bin", "lon_bin"),
        Index("idx_mhw_temporal", "start_date", "end_date"),
        Index("idx_mhw_duration", "duration_days"),
    )
