# SPDX-License-Identifier: MIT
# © 2024–2025 Mark Lindon — BlueSphere
from fastapi import APIRouter, Response
import os

router = APIRouter()
BASE = os.path.join(os.path.dirname(__file__), "..", "tiles", "cache")

@router.get("/tiles/sst/{z}/{x}/{y}.png")
def sst_tile(z:int, x:int, y:int):
    fp = os.path.join(BASE, "sst", str(z), str(x), f"{y}.png")
    if os.path.exists(fp):
        with open(fp, "rb") as f:
            return Response(content=f.read(), media_type="image/png")
    # fallback simple placeholder if no cache exists
    from PIL import Image, ImageDraw
    import io
    img = Image.new("RGBA", (256,256), (20,20,40,255))
    d = ImageDraw.Draw(img)
    d.text((16,16), "No cache tile", fill=(255,255,255,255))
    buf = io.BytesIO(); img.save(buf, format="PNG")
    return Response(content=buf.getvalue(), media_type="image/png")

@router.get("/tiles/currents/{z}/{x}/{y}.mvt")
def currents_mvt(z:int, x:int, y:int):
    fp = os.path.join(BASE, "currents", str(z), str(x), f"{y}.mvt")
    if os.path.exists(fp):
        with open(fp, "rb") as f:
            return Response(content=f.read(), media_type="application/vnd.mapbox-vector-tile")
    return Response(status_code=204)
