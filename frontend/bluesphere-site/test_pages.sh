#!/bin/bash

# BlueSphere Website Test Harness
# Tests all pages systematically

BASE_URL="http://localhost:4000"
PAGES=(
    "/"
    "/sharks/"
    "/about/"
    "/map/"
    "/coral/"
    "/health/"
    "/migration/"
    "/pollution/"
    "/crisis/"
    "/conservation/"
    "/analytics/"
    "/timelapse/"
    "/gallery/"
    "/education/"
    "/historical/"
    "/sources/"
    "/docs/"
    "/faq/"
    "/alerts/"
    "/architecture/"
    "/stories/"
)

echo "=== BLUESPHERE WEBSITE TEST HARNESS ==="
echo "Testing ${#PAGES[@]} pages..."
echo ""

for page in "${PAGES[@]}"; do
    url="${BASE_URL}${page}"
    echo "Testing: $url"

    # Test response code and load time
    response=$(curl -s -o /tmp/page_content.html -w "%{http_code},%{time_total},%{size_download}" "$url")
    http_code=$(echo $response | cut -d',' -f1)
    load_time=$(echo $response | cut -d',' -f2)
    size=$(echo $response | cut -d',' -f3)

    echo "  Status: $http_code"
    echo "  Load Time: ${load_time}s"
    echo "  Size: ${size} bytes"

    # Extract title
    title=$(grep -o '<title>[^<]*</title>' /tmp/page_content.html | sed 's/<title>\(.*\)<\/title>/\1/' || echo "No title found")
    echo "  Title: $title"

    # Check for basic structure
    has_nav=$(grep -q "nav\|navigation" /tmp/page_content.html && echo "Yes" || echo "No")
    has_footer=$(grep -q "footer" /tmp/page_content.html && echo "Yes" || echo "No")
    has_main=$(grep -q "main\|content" /tmp/page_content.html && echo "Yes" || echo "No")

    echo "  Navigation: $has_nav"
    echo "  Footer: $has_footer"
    echo "  Main Content: $has_main"

    # Check for common errors
    has_error=$(grep -qi "error\|exception\|500\|404" /tmp/page_content.html && echo "Found" || echo "None")
    echo "  Errors: $has_error"

    echo ""
done

echo "=== Test Complete ==="