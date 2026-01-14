#!/bin/bash

# Files that need module resolver
files=(
  "content/content-publisher.js"
  "integrations/image-generator.js"
  "research/deep-topic-researcher.js"
  "research/google-ads-api-client.js"
  "research/google-analytics-4-api-client.js"
  "research/google-custom-search-api-client.js"
  "research/google-search-console-api-client.js"
  "research/master-seo-researcher.js"
  "research/seo-data-fetcher.js"
  "research/topic-generator.js"
)

for file in "${files[@]}"; do
  if [ -f "$file" ] && ! grep -q "module-resolver" "$file"; then
    # Insert after first comment block/shebang but before first require
    awk '
      BEGIN { added=0 }
      !added && /^(const|let|var|import|class)/ && !/module-resolver/ {
        print "// Resolve module paths for Vercel deployment"
        depth = gensub(/\/[^\/]+$/, "", "g", FILENAME)
        depth_count = gsub(/\//, "/", depth)
        if (depth_count == 1) resolver = "require('\''../module-resolver'\'');"
        else resolver = "require('\''../module-resolver'\'');"
        print resolver
        print ""
        added=1
      }
      { print }
    ' "$file" > "$file.tmp" && mv "$file.tmp" "$file"
    
    echo "✓ Updated: $file"
  fi
done
