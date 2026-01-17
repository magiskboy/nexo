#!/bin/bash

# Logger Migration Helper Script
# This script helps migrate from useLogger() hook to direct logger import

set -e

echo "🔍 Logger Migration Helper"
echo "=========================="
echo ""

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Find all files using useLogger
FILES=$(grep -r "const logger = useLogger()" src --files-with-matches || true)

if [ -z "$FILES" ]; then
  echo -e "${GREEN}✅ No files found using useLogger()${NC}"
  echo "Migration complete!"
  exit 0
fi

# Count files
COUNT=$(echo "$FILES" | wc -l | tr -d ' ')
echo -e "${YELLOW}Found $COUNT files using useLogger()${NC}"
echo ""

# List files
echo "Files to migrate:"
echo "$FILES" | while read -r file; do
  echo "  - $file"
done
echo ""

# Ask for confirmation
read -p "Do you want to see the migration plan? (y/n) " -n 1 -r
echo ""

if [[ ! $REPLY =~ ^[Yy]$ ]]; then
  echo "Cancelled."
  exit 0
fi

echo ""
echo "📋 Migration Plan"
echo "================="
echo ""

# For each file, show what needs to be changed
echo "$FILES" | while read -r file; do
  echo -e "${YELLOW}File: $file${NC}"
  
  # Check if file imports useLogger
  if grep -q "import.*useLogger.*from '@/hooks/useLogger'" "$file"; then
    echo "  ✓ Has useLogger import"
  fi
  
  # Check if file has logger in dependency arrays
  if grep -q "\[.*logger.*\]" "$file"; then
    echo "  ⚠️  Has logger in dependency arrays - needs review"
  fi
  
  # Check if file has eslint-disable for exhaustive-deps
  if grep -q "eslint-disable.*react-hooks/exhaustive-deps" "$file"; then
    echo "  ⚠️  Has eslint-disable comments - may be related"
  fi
  
  echo ""
done

echo ""
echo "🔧 Recommended Actions"
echo "====================="
echo ""
echo "1. Review each file manually"
echo "2. Replace 'import { useLogger }' with 'import { logger }'"
echo "3. Remove 'const logger = useLogger()' line"
echo "4. Remove 'logger' from dependency arrays"
echo "5. Remove unnecessary eslint-disable comments"
echo "6. Run tests: yarn test <file>.test.tsx --run"
echo ""
echo "For detailed instructions, see:"
echo "  .agent/docs/LOGGER_MIGRATION.md"
echo "  .agent/docs/LOGGER_MIGRATION_CHECKLIST.md"
echo ""

# Offer to create a branch
read -p "Create a migration branch? (y/n) " -n 1 -r
echo ""

if [[ $REPLY =~ ^[Yy]$ ]]; then
  BRANCH_NAME="refactor/logger-migration-$(date +%Y%m%d)"
  git checkout -b "$BRANCH_NAME"
  echo -e "${GREEN}✅ Created branch: $BRANCH_NAME${NC}"
  echo ""
  echo "You can now start migrating files."
  echo "After each file, commit with:"
  echo "  git add <file>"
  echo "  git commit -m 'refactor: migrate <file> to use logger directly'"
fi

echo ""
echo "Happy migrating! 🚀"
