# SPDX-License-Identifier: MIT
# © 2024–2025 Mark Lindon — BlueSphere
"""
Database table creation script for BlueSphere.
Creates all tables including temporal temperature data structures.
"""

import sys
import argparse
from backend.db import get_engine, Base
from backend.models import (
    Station, BuoyObs, JobRun,
    # Temporal temperature models
    TemporalTemperatureGrid, TemporalTemperatureDaily,
    TemporalTemperatureMonthly, TemporalTemperatureYearly,
    ClimateBaseline, TemperatureAnomaly, MarineHeatwave
)

def create_tables(drop_existing=False):
    """
    Create all database tables.
    
    Args:
        drop_existing: Whether to drop existing tables first
    """
    print("Creating BlueSphere database tables...")
    
    eng = get_engine()
    
    if drop_existing:
        print("Dropping existing tables...")
        Base.metadata.drop_all(eng)
    
    # Create all tables defined in models
    Base.metadata.create_all(eng)
    
    # List all created tables
    inspector = eng.inspect(eng)
    tables = inspector.get_table_names()
    
    print(f"Created {len(tables)} tables:")
    for table in sorted(tables):
        print(f"  - {table}")
    
    print("Database setup completed successfully!")

def main():
    parser = argparse.ArgumentParser(description="Create BlueSphere database tables")
    parser.add_argument("--drop", action="store_true",
                       help="Drop existing tables before creating new ones")
    
    args = parser.parse_args()
    
    try:
        create_tables(drop_existing=args.drop)
    except Exception as e:
        print(f"Error creating tables: {e}")
        sys.exit(1)

if __name__ == "__main__":
    main()
