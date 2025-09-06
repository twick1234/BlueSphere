FROM nginx:alpine
# Copy custom nginx config
COPY nginx.conf /etc/nginx/nginx.conf
# Tiles will be mounted at runtime:
#   docker run -v $(pwd)/tiles:/usr/share/nginx/html/tiles -p 8080:80 tileserver
EXPOSE 80
