#!/bin/bash
# Build Friday.app — a native macOS wrapper around the Friday web app.
# No dependencies beyond the Xcode command-line tools (swiftc, sips, iconutil,
# codesign), all of which ship with macOS + Xcode.
set -euo pipefail

cd "$(dirname "$0")"
HERE="$(pwd)"
WEB="$(cd .. && pwd)"                 # the Friday web app (one level up)
APP="$HERE/build/Friday.app"
BUNDLE_ID="com.glassstone.friday"
VERSION="1.0.0"

echo "› Cleaning"
rm -rf "$HERE/build"
mkdir -p "$APP/Contents/MacOS" "$APP/Contents/Resources/web"

echo "› Compiling Swift (universal where the SDK allows)"
# swiftc builds one arch per invocation; compile each available slice, then lipo
SLICES=()
for pair in "arm64:arm64-apple-macos12.0" "x86_64:x86_64-apple-macos12.0"; do
  arch="${pair%%:*}"; triple="${pair##*:}"
  if [ "$arch" = "x86_64" ] && ! xcrun --sdk macosx swiftc -target "$triple" -typecheck Sources/main.swift >/dev/null 2>&1; then
    echo "  (skipping x86_64 slice — SDK/toolchain can't target it here)"; continue
  fi
  out="$HERE/build/friday-$arch"
  xcrun --sdk macosx swiftc -O -target "$triple" \
    -framework AppKit -framework WebKit -framework Network \
    Sources/*.swift -o "$out"
  SLICES+=("$out")
done
if [ "${#SLICES[@]}" -gt 1 ]; then
  lipo -create "${SLICES[@]}" -output "$APP/Contents/MacOS/Friday"
else
  cp "${SLICES[0]}" "$APP/Contents/MacOS/Friday"
fi
chmod +x "$APP/Contents/MacOS/Friday"

echo "› Bundling the web app"
for item in index.html sw.js manifest.webmanifest css js assets; do
  [ -e "$WEB/$item" ] && cp -R "$WEB/$item" "$APP/Contents/Resources/web/"
done

echo "› Building the app icon from assets/logo → AppIcon.icns"
ICONSET="$HERE/build/AppIcon.iconset"; mkdir -p "$ICONSET"
SRC_PNG="$WEB/assets/icons/icon-512.png"
if [ -f "$SRC_PNG" ]; then
  for sz in 16 32 64 128 256 512; do
    sips -z $sz $sz "$SRC_PNG" --out "$ICONSET/icon_${sz}x${sz}.png" >/dev/null
    dbl=$((sz*2)); sips -z $dbl $dbl "$SRC_PNG" --out "$ICONSET/icon_${sz}x${sz}@2x.png" >/dev/null
  done
  iconutil -c icns "$ICONSET" -o "$APP/Contents/Resources/AppIcon.icns"
fi

echo "› Writing Info.plist"
cat > "$APP/Contents/Info.plist" <<PLIST
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0"><dict>
  <key>CFBundleName</key><string>Friday</string>
  <key>CFBundleDisplayName</key><string>Friday</string>
  <key>CFBundleIdentifier</key><string>$BUNDLE_ID</string>
  <key>CFBundleVersion</key><string>$VERSION</string>
  <key>CFBundleShortVersionString</key><string>$VERSION</string>
  <key>CFBundlePackageType</key><string>APPL</string>
  <key>CFBundleExecutable</key><string>Friday</string>
  <key>CFBundleIconFile</key><string>AppIcon</string>
  <key>LSMinimumSystemVersion</key><string>12.0</string>
  <key>NSHighResolutionCapable</key><true/>
  <key>NSHumanReadableCopyright</key><string>Eros Office · Glass Stone LLC</string>
  <key>NSMicrophoneUsageDescription</key><string>Friday uses the microphone for encrypted Dark Sun voice calls over the mesh.</string>
  <key>NSCameraUsageDescription</key><string>Friday uses the camera only if you start a video call.</string>
  <key>LSApplicationCategoryType</key><string>public.app-category.productivity</string>
</dict></plist>
PLIST

echo "› Ad-hoc code signing"
codesign --force --deep --sign - "$APP" >/dev/null 2>&1 || echo "  (codesign skipped — app still runs locally)"

rm -rf "$ICONSET" "$HERE/build/friday-arm64" "$HERE/build/friday-x86_64"
echo ""
echo "✓ Built: $APP"
echo "  Run it:   open '$APP'"
echo "  Install:  drag Friday.app to /Applications"
