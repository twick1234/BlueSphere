# SPDX-License-Identifier: MIT
# © 2024–2025 Mark Lindon — BlueSphere
"""
ERDDAP Adapter
Fetches tabular/grid data from an ERDDAP server using the tabledap or griddap endpoints.
This provides a uniform function you can call from ingestion to read recent slices.
"""
import os, sys, urllib.parse
import httpx

class ERDDAPAdapter:
    def __init__(self, base:str):
        self.base = base.rstrip('/')

    def tabledap_csv(self, dataset:str, query:str)->str:
        """
        dataset: e.g., 'sst_wind_1deg'
        query: ERDDAP query string with constraints and variable selection, e.g.:
          "time>=2025-01-01&time<=2025-01-31&latitude>=-10&latitude<=10&longitude>=120&longitude<=160&.csv?time,latitude,longitude,sst"
        """
        url = f"{self.base}/tabledap/{dataset}.csv?{query.lstrip('?')}"
        with httpx.Client(timeout=60) as client:
            r = client.get(url)
            r.raise_for_status()
            return r.text

    def griddap_netcdf(self, dataset:str, query:str)->bytes:
        """
        Fetch a NetCDF grid subset via griddap.
        query example: ".nc?sst[(2025-01-01):1:(2025-01-31)][(10):1:(-10)][(120):1:(160)]"
        """
        url = f"{self.base}/griddap/{dataset}.nc?{query.lstrip('?')}"
        with httpx.Client(timeout=120) as client:
            r = client.get(url)
            r.raise_for_status()
            return r.content

def main():
    base = os.getenv("ERDDAP_BASE", "https://coastwatch.pfeg.noaa.gov/erddap")
    ds = os.getenv("ERDDAP_DATASET", "erdMH1sstd8day")
    # Example: fetch CSV for a recent time slice (adjust query as needed)
    q = "time>=2025-01-01&time<=2025-01-31&.csv?time,latitude,longitude,sst"
    a = ERDDAPAdapter(base)
    try:
        csv_text = a.tabledap_csv(ds, q)
        print(csv_text.splitlines()[:5])
    except Exception as e:
        print("ERDDAP fetch failed:", e)
        return 1
    return 0

if __name__ == "__main__":
    sys.exit(main())
