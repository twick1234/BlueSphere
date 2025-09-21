#!/bin/bash

# Detailed analysis of specific pages
echo "=== DETAILED PAGE ANALYSIS ==="

# Test specific pages for detailed issues
CRITICAL_PAGES=("/" "/sharks/" "/map/" "/about/" "/conservation/")

for page in "${CRITICAL_PAGES[@]}"; do
    echo ""
    echo "=== ANALYZING: http://localhost:4000$page ==="

    # Download page content
    curl -s "http://localhost:4000$page" > /tmp/current_page.html

    # Check title
    title=$(grep -o '<title>[^<]*</title>' /tmp/current_page.html | sed 's/<title>\(.*\)<\/title>/\1/' || echo "NO TITLE FOUND")
    echo "Title: $title"

    # Check meta description
    meta_desc=$(grep -o 'name="description" content="[^"]*"' /tmp/current_page.html | sed 's/name="description" content="\(.*\)"/\1/' || echo "NO META DESCRIPTION")
    echo "Meta Description: $meta_desc"

    # Check for React hydration errors
    hydration_errors=$(grep -c "hydration\|Hydration\|hydrate" /tmp/current_page.html || echo "0")
    echo "Hydration References: $hydration_errors"

    # Check for broken images (img tags without src or with empty src)
    broken_images=$(grep -o '<img[^>]*>' /tmp/current_page.html | grep -c 'src=""\|src="undefined"\|src="null"' || echo "0")
    echo "Potential Broken Images: $broken_images"

    # Check for console.log/error statements in inline JS
    console_logs=$(grep -c "console\." /tmp/current_page.html || echo "0")
    echo "Console Statements: $console_logs"

    # Check for empty content areas
    empty_divs=$(grep -c '<div[^>]*></div>' /tmp/current_page.html || echo "0")
    echo "Empty Divs: $empty_divs"

    # Check for Lorem ipsum content
    lorem_ipsum=$(grep -ci "lorem ipsum\|lorem\|lipsum" /tmp/current_page.html || echo "0")
    echo "Lorem Ipsum Content: $lorem_ipsum"

    # Check for TODO comments
    todos=$(grep -ci "todo\|fixme\|hack\|bug" /tmp/current_page.html || echo "0")
    echo "Development Comments: $todos"

    # Check page size
    page_size=$(wc -c < /tmp/current_page.html)
    echo "Page Size: ${page_size} bytes"

    # Check if page has main content (significant text content)
    text_content=$(sed 's/<[^>]*>//g' /tmp/current_page.html | tr -d '\n\t ' | wc -c)
    echo "Text Content: ${text_content} chars"

    # Ratio of text to total content
    if [ $page_size -gt 0 ]; then
        ratio=$((text_content * 100 / page_size))
        echo "Text/Total Ratio: ${ratio}%"
    fi
done

echo ""
echo "=== CROSS-PAGE ANALYSIS ==="

# Check navigation consistency
echo "Checking navigation consistency..."
nav_links_home=$(curl -s "http://localhost:4000/" | grep -o 'href="[^"]*"' | sort | uniq | wc -l)
nav_links_sharks=$(curl -s "http://localhost:4000/sharks/" | grep -o 'href="[^"]*"' | sort | uniq | wc -l)
echo "Navigation links - Home: $nav_links_home, Sharks: $nav_links_sharks"

# Check footer consistency
footer_home=$(curl -s "http://localhost:4000/" | grep -A 10 -B 5 "footer" | wc -l)
footer_sharks=$(curl -s "http://localhost:4000/sharks/" | grep -A 10 -B 5 "footer" | wc -l)
echo "Footer content - Home: $footer_home lines, Sharks: $footer_sharks lines"

echo ""
echo "=== PERFORMANCE METRICS ==="

# Test load times for all pages
for page in "${CRITICAL_PAGES[@]}"; do
    load_time=$(curl -s -o /dev/null -w "%{time_total}" "http://localhost:4000$page")
    echo "$page: ${load_time}s"
done