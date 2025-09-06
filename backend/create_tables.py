# SPDX-License-Identifier: MIT
# © 2024–2025 Mark Lindon — BlueSphere
from backend.db import get_engine, Base
from backend.models import Station, BuoyObs, JobRun

def main():
    eng = get_engine()
    Base.metadata.create_all(eng)
    print("Tables created.")
if __name__ == "__main__":
    main()
