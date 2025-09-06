# SPDX-License-Identifier: MIT
# © 2024–2025 Mark Lindon — BlueSphere
from sqlalchemy import Column, Integer, Float, String, DateTime, UniqueConstraint
from sqlalchemy.orm import Mapped, mapped_column
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
