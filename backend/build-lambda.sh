#!/bin/bash
# Build Lambda deployment package for premortem function

echo "=== Building Lambda Deployment Package ==="
echo ""

SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
LAMBDA_DIR="$SCRIPT_DIR/premortem-lambda"
OUTPUT_ZIP="$SCRIPT_DIR/premortem-lambda.zip"

# Check if lambda directory exists
if [ ! -d "$LAMBDA_DIR" ]; then
    echo "ERROR: Lambda directory not found at $LAMBDA_DIR"
    exit 1
fi

# Navigate to lambda directory
cd "$LAMBDA_DIR"

echo "Installing dependencies..."
npm install --production

if [ $? -ne 0 ]; then
    echo "ERROR: npm install failed"
    exit 1
fi

echo "Creating deployment package..."

# Remove old zip if exists
rm -f "$OUTPUT_ZIP"

# Create zip file with all contents
zip -r "$OUTPUT_ZIP" . -x "*.git*"

cd "$SCRIPT_DIR"

if [ -f "$OUTPUT_ZIP" ]; then
    SIZE=$(du -h "$OUTPUT_ZIP" | cut -f1)
    echo ""
    echo "SUCCESS: Lambda package created!"
    echo "Location: $OUTPUT_ZIP"
    echo "Size: $SIZE"
    echo ""
    echo "You can now run: terraform plan"
else
    echo "ERROR: Failed to create deployment package"
    exit 1
fi
