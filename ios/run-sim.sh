#!/bin/bash
# Build (if needed), then install + launch Friday on an iOS Simulator.
# Usage:  ./run-sim.sh ["iPhone 16"]   ·   ./run-sim.sh "iPad Pro 11-inch (M4)"
set -euo pipefail
cd "$(dirname "$0")"
DEVICE="${1:-iPhone 16}"

[ -d build/Friday.app ] || ./build-sim.sh

xcrun simctl boot "$DEVICE" 2>/dev/null || true
xcrun simctl bootstatus "$DEVICE" -b >/dev/null 2>&1 || true
open -a Simulator
xcrun simctl install "$DEVICE" build/Friday.app
xcrun simctl launch "$DEVICE" com.glassstone.friday
echo "✓ Friday launched on: $DEVICE"
