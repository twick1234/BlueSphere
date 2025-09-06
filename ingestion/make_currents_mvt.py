# SPDX-License-Identifier: MIT
# © 2024–2025 Mark Lindon — BlueSphere
"""
make_currents_mvt.py
Generates synthetic current vectors as Mapbox Vector Tiles (MVT) for demo purposes.
Writes tiles to tiles/cache/currents/{z}/{x}/{y}.mvt
"""
import os, sys, math, json
import mapbox_vector_tile

OUT_DIR = os.path.join(os.path.dirname(__file__), "..", "tiles", "cache", "currents")

def tile_bounds(z, x, y):
    n = 2 ** z
    lon_min = x / n * 360.0 - 180.0
    lon_max = (x + 1) / n * 360.0 - 180.0
    lat_min = math.degrees(math.atan(math.sinh(math.pi * (1 - 2 * (y + 1) / n))))
    lat_max = math.degrees(math.atan(math.sinh(math.pi * (1 - 2 * y / n))))
    return lon_min, lat_min, lon_max, lat_max

def synth_vectors(lon_min, lat_min, lon_max, lat_max, step=5.0):
    feats = []
    lon = lon_min
    while lon < lon_max:
        lat = lat_min
        while lat < lat_max:
            # simple rotational field around (0,0)
            u = -lat / 90.0
            v = lon / 180.0
            x2 = lon + u * 2
            y2 = lat + v * 2
            feats.append({
                "geometry": {
                    "type": "LineString",
                    "coordinates": [[lon, lat], [x2, y2]]
                },
                "properties": {"u": u, "v": v}
            })
            lat += step
        lon += step
    return feats

def to_mvt(z, x, y, features):
    layer = mapbox_vector_tile.encode({
        "currents": [{
            "geometry": f["geometry"],
            "properties": f["properties"],
            "id": i+1
        } for i,f in enumerate(features)]
    }, quantize_bounds=None, extents=4096)
    return layer

def main():
    if len(sys.argv) < 3:
        print("Usage: python ingestion/make_currents_mvt.py <zmin> <zmax>")
        return 1
    zmin = int(sys.argv[1]); zmax = int(sys.argv[2])
    for z in range(zmin, zmax+1):
        n = 2 ** z
        for x in range(n):
            for y in range(n):
                d = os.path.join(OUT_DIR, str(z), str(x))
                os.makedirs(d, exist_ok=True)
                fp = os.path.join(d, f"{y}.mvt")
                if os.path.exists(fp): continue
                lon_min, lat_min, lon_max, lat_max = tile_bounds(z,x,y)
                feats = synth_vectors(lon_min, lat_min, lon_max, lat_max, step=10.0 if z<3 else 5.0)
                mvt = to_mvt(z,x,y,feats)
                with open(fp, "wb") as f:
                    f.write(mvt)
                print("wrote", fp)
    print("Done.")
    return 0

if __name__ == "__main__":
    sys.exit(main())
