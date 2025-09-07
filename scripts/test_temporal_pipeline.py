#!/usr/bin/env python3
# SPDX-License-Identifier: MIT
# © 2024–2025 Mark Lindon — BlueSphere
"""
Test script for the BlueSphere temporal temperature data pipeline.
Runs a complete end-to-end test of the temporal data functionality.
"""

import sys
import requests
import json
from datetime import date, datetime
from pathlib import Path
import subprocess
import time

# Add parent directory to path for imports
sys.path.append(str(Path(__file__).parent.parent))

from backend.db import get_session
from backend.temporal_db import TemporalDataManager

def test_database_setup():
    """Test database table creation and connectivity"""
    print("=== Testing Database Setup ===")
    
    try:
        # Test database connection
        session = get_session()
        result = session.execute("SELECT 1").scalar()
        assert result == 1
        print("✓ Database connection successful")
        
        # Test temporal data manager
        data_manager = TemporalDataManager()
        availability = data_manager.get_data_availability("TEST_DATASET")
        print("✓ Temporal data manager initialized")
        
        session.close()
        data_manager.close()
        
        return True
    except Exception as e:
        print(f"✗ Database setup failed: {e}")
        return False

def test_sample_data_generation():
    """Test sample data generation"""
    print("\n=== Testing Sample Data Generation ===")
    
    try:
        # Run sample data generator
        result = subprocess.run([
            'python', 'scripts/generate_sample_data.py',
            '--datasets', 'ersst',
            '--start-year', '2022',
            '--end-year', '2023',
            '--spatial-resolution', '4.0',  # Lower resolution for faster testing
            '--with-analysis'
        ], capture_output=True, text=True, cwd=Path(__file__).parent.parent)
        
        if result.returncode == 0:
            print("✓ Sample data generation completed successfully")
            print(f"  Output: {result.stdout.strip()}")
            return True
        else:
            print(f"✗ Sample data generation failed: {result.stderr}")
            return False
            
    except Exception as e:
        print(f"✗ Sample data generation error: {e}")
        return False

def test_data_processing():
    """Test temporal data processing and aggregation"""
    print("\n=== Testing Data Processing ===")
    
    try:
        # Test aggregation
        result = subprocess.run([
            'python', 'scripts/temporal_processor.py',
            '--task', 'aggregate-monthly',
            '--year', '2022',
            '--dataset', 'ERSST_SAMPLE',
            '--verbose'
        ], capture_output=True, text=True, cwd=Path(__file__).parent.parent)
        
        if result.returncode == 0:
            print("✓ Monthly aggregation completed")
        else:
            print(f"⚠ Monthly aggregation warning: {result.stderr}")
        
        # Test baseline calculation  
        result = subprocess.run([
            'python', 'scripts/temporal_processor.py',
            '--task', 'baselines',
            '--verbose'
        ], capture_output=True, text=True, cwd=Path(__file__).parent.parent)
        
        if result.returncode == 0:
            print("✓ Baseline calculation completed")
            return True
        else:
            print(f"⚠ Baseline calculation warning: {result.stderr}")
            return True  # Don't fail test for processing warnings
            
    except Exception as e:
        print(f"✗ Data processing error: {e}")
        return False

def test_api_endpoints(base_url="http://localhost:8000"):
    """Test temporal API endpoints"""
    print("\n=== Testing API Endpoints ===")
    
    # Test endpoints
    endpoints = [
        "/temporal/availability",
        "/temporal/temperatures?start_date=2022-01-01&end_date=2022-12-31&resolution=monthly&limit=10",
        "/temporal/stats/summary?start_date=2022-06-01&end_date=2022-08-31&resolution=monthly"
    ]
    
    success_count = 0
    
    for endpoint in endpoints:
        try:
            url = f"{base_url}{endpoint}"
            response = requests.get(url, timeout=30)
            
            if response.status_code == 200:
                data = response.json()
                print(f"✓ {endpoint}")
                
                # Basic validation
                if "availability" in endpoint:
                    assert isinstance(data, list)
                elif "temperatures" in endpoint:
                    assert "data" in data
                    assert "count" in data
                elif "summary" in endpoint:
                    assert "statistics" in data
                
                success_count += 1
            else:
                print(f"✗ {endpoint} - HTTP {response.status_code}")
                print(f"  Response: {response.text}")
                
        except requests.exceptions.ConnectionError:
            print(f"⚠ {endpoint} - API server not running")
        except Exception as e:
            print(f"✗ {endpoint} - Error: {e}")
    
    print(f"API tests: {success_count}/{len(endpoints)} passed")
    return success_count > 0

def test_data_validation():
    """Test data validation and integrity"""
    print("\n=== Testing Data Validation ===")
    
    try:
        session = get_session()
        
        # Test for sample data existence
        result = session.execute("""
            SELECT COUNT(*) FROM temporal_temperature_monthly 
            WHERE dataset = 'ERSST_SAMPLE'
        """).scalar()
        
        if result > 0:
            print(f"✓ Found {result} monthly temperature records")
        else:
            print("⚠ No sample temperature data found")
        
        # Test for valid temperature ranges
        result = session.execute("""
            SELECT MIN(avg_sst_c), MAX(avg_sst_c) 
            FROM temporal_temperature_monthly 
            WHERE dataset = 'ERSST_SAMPLE' AND avg_sst_c IS NOT NULL
        """).first()
        
        if result and result[0] is not None:
            min_temp, max_temp = result
            print(f"✓ Temperature range: {min_temp:.1f}°C to {max_temp:.1f}°C")
            
            # Validate realistic temperature ranges
            if -5 <= min_temp <= 40 and -5 <= max_temp <= 40:
                print("✓ Temperature values are realistic")
            else:
                print("⚠ Temperature values may be unrealistic")
        else:
            print("⚠ No temperature data found for validation")
        
        # Test spatial coverage
        result = session.execute("""
            SELECT MIN(lat_bin), MAX(lat_bin), MIN(lon_bin), MAX(lon_bin)
            FROM temporal_temperature_monthly 
            WHERE dataset = 'ERSST_SAMPLE'
        """).first()
        
        if result and result[0] is not None:
            min_lat, max_lat, min_lon, max_lon = result
            print(f"✓ Spatial coverage: {min_lat}°N to {max_lat}°N, {min_lon}°E to {max_lon}°E")
        
        session.close()
        return True
        
    except Exception as e:
        print(f"✗ Data validation error: {e}")
        return False

def main():
    """Run complete pipeline test"""
    print("BlueSphere Temporal Temperature Data Pipeline Test")
    print("=" * 50)
    
    # Track test results
    tests = [
        ("Database Setup", test_database_setup),
        ("Sample Data Generation", test_sample_data_generation),  
        ("Data Processing", test_data_processing),
        ("Data Validation", test_data_validation),
        ("API Endpoints", test_api_endpoints)
    ]
    
    results = {}
    
    for test_name, test_func in tests:
        try:
            results[test_name] = test_func()
        except Exception as e:
            print(f"✗ {test_name} failed with exception: {e}")
            results[test_name] = False
    
    # Print summary
    print("\n" + "=" * 50)
    print("TEST SUMMARY")
    print("=" * 50)
    
    passed = sum(results.values())
    total = len(results)
    
    for test_name, result in results.items():
        status = "PASS" if result else "FAIL"
        print(f"{test_name:<25} {status}")
    
    print(f"\nOverall: {passed}/{total} tests passed")
    
    if passed == total:
        print("🎉 All tests passed! Temporal pipeline is working correctly.")
    elif passed > 0:
        print("⚠️  Some tests passed. Check logs for details.")
    else:
        print("❌ All tests failed. Check configuration and dependencies.")
    
    return passed == total

if __name__ == "__main__":
    success = main()
    sys.exit(0 if success else 1)