# Simple Tile Server (Nginx)

Serves static tiles (e.g., vector `.mvt` or raster `.png`) from `/usr/share/nginx/html`.

## Build & Run
```bash
docker build -t tileserver .
# Mount your local tiles folder to /usr/share/nginx/html/tiles
docker run --rm -p 8080:80 -v $(pwd)/tiles:/usr/share/nginx/html/tiles tileserver
# Now visit: http://localhost:8080/tiles/{z}/{x}/{y}.mvt
```

## Notes
- For dynamic tiles from PostGIS, consider tegola or t-rex (future).
- This image is intended for **static** pre-rendered tiles (e.g., cached monthly ERSST).