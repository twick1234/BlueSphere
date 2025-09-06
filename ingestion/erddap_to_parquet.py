# SPDX-License-Identifier: MIT
# © 2024–2025 Mark Lindon — BlueSphere
"""Fetch a small ERDDAP tabledap CSV slice and write parquet for local dev."""
import os, io
import pandas as pd
from ingestion.erddap_adapter import ERDDAPAdapter

BASE = os.getenv("ERDDAP_BASE", "https://coastwatch.pfeg.noaa.gov/erddap")
DATASET = os.getenv("ERDDAP_DATASET", "erdMH1sstd8day")  # example
QUERY = os.getenv("ERDDAP_QUERY", "time>=2025-01-01&time<=2025-01-31&.csv?time,latitude,longitude,sst")

def main():
    a = ERDDAPAdapter(BASE)
    csv_text = a.tabledap_csv(DATASET, QUERY)
    df = pd.read_csv(io.StringIO(csv_text))
    out = "tiles/cache/erddap_sample.parquet"
    os.makedirs(os.path.dirname(out), exist_ok=True)
    df.to_parquet(out)
    print("wrote", out, df.shape)

if __name__ == "__main__":
    main()
