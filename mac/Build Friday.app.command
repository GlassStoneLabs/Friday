#!/bin/bash
# Double-click to build Friday.app, then reveal it in Finder.
cd "$(dirname "$0")"
./build.sh && open -R "build/Friday.app"
echo ""
echo "Done. Drag Friday.app into your Applications folder to install."
read -n 1 -s -r -p "Press any key to close."
