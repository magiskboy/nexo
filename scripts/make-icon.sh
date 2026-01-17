#!/bin/bash

# ===== CONFIG =====
INPUT="./logo.svg"
OUTPUT_DIR="./output"
SIZES=(30 32 44 71 89 107 142 150 284 310 512 128)
mkdir -p "$OUTPUT_DIR"
for SIZE in "${SIZES[@]}"; do
  rsvg-convert -w "$SIZE" -h "$SIZE" "$INPUT" -o "$OUTPUT_DIR/Square${SIZE}x${SIZE}Logo.png"
done

echo "Done 🎉"