#!/bin/bash
# Script to create macOS .icns file from laundromatzat-icon.png

cd /Users/stephenmatzat/Projects/laundromatzat

# First, convert the PNG to a compatible format using ImageMagick
echo "Converting PNG to compatible format..."
magick public/laundromatzat-icon.png -resize 1024x1024 /tmp/icon_1024.png

# Create iconset directory
rm -rf build/icon.iconset
mkdir -p build/icon.iconset

# Generate all required sizes
echo "Generating icon sizes..."
sips -z 16 16 /tmp/icon_1024.png --out build/icon.iconset/icon_16x16.png
sips -z 32 32 /tmp/icon_1024.png --out build/icon.iconset/icon_16x16@2x.png
sips -z 32 32 /tmp/icon_1024.png --out build/icon.iconset/icon_32x32.png
sips -z 64 64 /tmp/icon_1024.png --out build/icon.iconset/icon_32x32@2x.png
sips -z 128 128 /tmp/icon_1024.png --out build/icon.iconset/icon_128x128.png
sips -z 256 256 /tmp/icon_1024.png --out build/icon.iconset/icon_128x128@2x.png
sips -z 256 256 /tmp/icon_1024.png --out build/icon.iconset/icon_256x256.png
sips -z 512 512 /tmp/icon_1024.png --out build/icon.iconset/icon_256x256@2x.png
sips -z 512 512 /tmp/icon_1024.png --out build/icon.iconset/icon_512x512.png
sips -z 1024 1024 /tmp/icon_1024.png --out build/icon.iconset/icon_512x512@2x.png

# Create .icns file
echo "Creating .icns file..."
iconutil -c icns build/icon.iconset -o build/icon.icns

# Cleanup
rm -rf build/icon.iconset /tmp/icon_1024.png

# Verify
if [ -f build/icon.icns ]; then
    echo "✅ Successfully created build/icon.icns"
    ls -la build/icon.icns
else
    echo "❌ Failed to create icon.icns"
    exit 1
fi
