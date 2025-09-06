# SPDX-License-Identifier: MIT
# © 2024–2025 Mark Lindon — BlueSphere
from fastapi import APIRouter, Response
from PIL import Image, ImageDraw, ImageFont
import io

router = APIRouter()

def render_tile(z:int, x:int, y:int, label:str) -> bytes:
    img = Image.new("RGBA", (256,256), (10,37,64,255))
    d = ImageDraw.Draw(img)
    d.rectangle([8,8,248,248], outline=(46,125,186,255), width=3)
    text = f"{label}\\nZ:{z} X:{x} Y:{y}"
    d.text((16,16), text, fill=(255,255,255,255))
    buf = io.BytesIO()
    img.save(buf, format="PNG")
    return buf.getvalue()

@router.get("/tiles/sst/{z}/{x}/{y}.png")
def sst_tile(z:int, x:int, y:int):
    png = render_tile(z,x,y,"SST")
    return Response(content=png, media_type="image/png")

@router.get("/tiles/currents/{z}/{x}/{y}.png")
def currents_tile(z:int, x:int, y:int):
    png = render_tile(z,x,y,"CUR")
    return Response(content=png, media_type="image/png")
