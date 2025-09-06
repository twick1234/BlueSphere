# SPDX-License-Identifier: MIT
# © 2024–2025 Mark Lindon — BlueSphere
"""
make_sst_tiles.py
Reads a local ERSST NetCDF file with xarray and writes PNG tiles to tiles/cache/sst/{z}/{x}/{y}.png
This is a pragmatic, dev-friendly tiler (not optimized), suitable for small extracts.
"""
import os, sys, math, io
import numpy as np
import xarray as xr
from PIL import Image, ImageDraw

OUT_DIR = os.path.join(os.path.dirname(__file__), "..", "tiles", "cache", "sst")

def lonlat_to_tile_xy(lon, lat, z):
    n = 2 ** z
    x = (lon + 180.0) / 360.0 * n
    y = (1.0 - math.log(math.tan(math.radians(lat)) + 1 / math.cos(math.radians(lat))) / math.pi) / 2.0 * n
    return x, y

def tile_bounds(z, x, y):
    n = 2 ** z
    lon_min = x / n * 360.0 - 180.0
    lon_max = (x + 1) / n * 360.0 - 180.0
    lat_min = math.degrees(math.atan(math.sinh(math.pi * (1 - 2 * (y + 1) / n))))
    lat_max = math.degrees(math.atan(math.sinh(math.pi * (1 - 2 * y / n))))
    return lon_min, lat_min, lon_max, lat_max

def colorize_sst(c):
    # Simple blue-to-red gradient for demo
    # c in deg C; map 0..30 → blue..red
    c = np.clip(c, 0, 30)
    t = (c - 0) / 30.0
    r = (t * 255).astype(np.uint8)
    g = (128 * np.ones_like(r)).astype(np.uint8)
    b = ((1 - t) * 255).astype(np.uint8)
    a = (255 * (~np.isnan(c))).astype(np.uint8)
    return np.dstack([r,g,b,a])

def render_tile(ds, z, x, y):
    lon_min, lat_min, lon_max, lat_max = tile_bounds(z,x,y)
    # ERSST usually lon 0..360; convert to -180..180 if needed
    da = ds['sst']
    lons = da['lon'].values
    # Ensure lons in -180..180
    lons = ((lons + 180) % 360) - 180
    da = da.assign_coords(lon=(('lon',), lons))
    sub = da.sel(lon=slice(lon_min, lon_max), lat=slice(lat_max, lat_min))  # lat descending
    if sub.size == 0:
        img = Image.new("RGBA", (256,256), (0,0,0,0))
        return img
    arr = sub.values
    # Normalize to 256x256
    from PIL import Image
    img_data = colorize_sst(arr.astype(float))
    img = Image.fromarray(img_data).resize((256,256), Image.BILINEAR)
    return img

def main():
    if len(sys.argv) < 3:
        print("Usage: python ingestion/make_sst_tiles.py <path/to/ersst.nc> <zoom_min> <zoom_max(optional)>")
        return 1
    nc = sys.argv[1]
    zmin = int(sys.argv[2])
    zmax = int(sys.argv[3]) if len(sys.argv) > 3 else zmin
    ds = xr.open_dataset(nc)
    os.makedirs(OUT_DIR, exist_ok=True)
    for z in range(zmin, zmax+1):
        n = 2 ** z
        for x in range(n):
            for y in range(n):
                out = os.path.join(OUT_DIR, str(z), str(x))
                os.makedirs(out, exist_ok=True)
                fp = os.path.join(out, f"{y}.png")
                if os.path.exists(fp): 
                    continue
                img = render_tile(ds, z, x, y)
                img.save(fp, format="PNG")
                print("wrote", fp)
    print("Done.")
    return 0

if __name__ == "__main__":
    sys.exit(main())
