#!/bin/bash
# Sync _locales from src/assets to public
# This ensures i18n files are available in the extension build

set -e

SOURCE_DIR="src/assets/_locales"
TARGET_DIR="public/_locales"

# Check if source directory exists
if [ ! -d "$SOURCE_DIR" ]; then
  echo "Error: Source directory $SOURCE_DIR not found"
  exit 1
fi

# Create public directory if it doesn't exist
mkdir -p public

# Copy _locales to public
echo "Syncing _locales from $SOURCE_DIR to $TARGET_DIR..."
cp -r "$SOURCE_DIR" "$TARGET_DIR"

echo "✓ _locales synced successfully"
