#!/bin/bash
# Build Friday.app for the iOS Simulator (iPhone + iPad).
# Manual swiftc build — no Xcode project, no third-party dependencies.
# For a REAL device you need code signing; open the sources in Xcode with your
# team profile. The Simulator needs no signing, which is what this script targets.
set -euo pipefail

cd "$(dirname "$0")"
HERE="$(pwd)"
WEB="$(cd .. && pwd)"
SHARED="$WEB/mac/Sources/LocalServer.swift"   # the loopback server is shared with the Mac app
APP="$HERE/build/Friday.app"
BUNDLE_ID="com.glassstone.friday"
VERSION="1.0.0"
MIN_IOS="15.0"

echo "› Cleaning"
rm -rf "$HERE/build"; mkdir -p "$APP/web"

SDK="$(xcrun --sdk iphonesimulator --show-sdk-path)"

echo "› Compiling Swift for the simulator (arm64 + x86_64)"
SLICES=()
for pair in "arm64:arm64-apple-ios${MIN_IOS}-simulator" "x86_64:x86_64-apple-ios${MIN_IOS}-simulator"; do
  arch="${pair%%:*}"; triple="${pair##*:}"
  out="$HERE/build/friday-$arch"
  if xcrun --sdk iphonesimulator swiftc -O -sdk "$SDK" -target "$triple" \
       -framework UIKit -framework WebKit -framework Network \
       Sources/main.swift "$SHARED" -o "$out" 2>/dev/null; then
    SLICES+=("$out")
  else
    echo "  (skipping $arch slice — not targetable here)"
  fi
done
[ "${#SLICES[@]}" -gt 0 ] || { echo "✗ compile failed"; exit 1; }
if [ "${#SLICES[@]}" -gt 1 ]; then lipo -create "${SLICES[@]}" -output "$APP/Friday"
else cp "${SLICES[0]}" "$APP/Friday"; fi
chmod +x "$APP/Friday"

echo "› Bundling the web app"
for item in index.html sw.js manifest.webmanifest css js assets; do
  [ -e "$WEB/$item" ] && cp -R "$WEB/$item" "$APP/web/"
done

echo "› Home-screen icons"
SRC_PNG="$WEB/assets/icons/icon-512.png"
ICON_KEYS=""
if [ -f "$SRC_PNG" ]; then
  # iPhone/iPad app icons referenced by CFBundleIconFiles (no asset catalog needed)
  declare -a sizes=(40 58 60 76 80 87 120 152 167 180 1024)
  for s in "${sizes[@]}"; do sips -z "$s" "$s" "$SRC_PNG" --out "$APP/AppIcon${s}.png" >/dev/null; done
  cp "$APP/AppIcon180.png" "$APP/AppIcon60x60@3x.png"
  cp "$APP/AppIcon120.png" "$APP/AppIcon60x60@2x.png"
  cp "$APP/AppIcon152.png" "$APP/AppIcon76x76@2x.png"
  cp "$APP/AppIcon167.png" "$APP/AppIcon83.5x83.5@2x.png"
  ICON_KEYS='<key>CFBundleIcons</key><dict><key>CFBundlePrimaryIcon</key><dict><key>CFBundleIconFiles</key><array><string>AppIcon60x60</string></array></dict></dict>
  <key>CFBundleIcons~ipad</key><dict><key>CFBundlePrimaryIcon</key><dict><key>CFBundleIconFiles</key><array><string>AppIcon60x60</string><string>AppIcon76x76</string><string>AppIcon83.5x83.5</string></array></dict></dict>'
fi

echo "› Writing Info.plist"
cat > "$APP/Info.plist" <<PLIST
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
  <key>MinimumOSVersion</key><string>$MIN_IOS</string>
  <key>UIDeviceFamily</key><array><integer>1</integer><integer>2</integer></array>
  <key>LSRequiresIPhoneOS</key><true/>
  <key>UILaunchScreen</key><dict><key>UIColorName</key><string></string></dict>
  <key>UIApplicationSupportsMultipleScenes</key><false/>
  <key>UISupportedInterfaceOrientations</key><array>
    <string>UIInterfaceOrientationPortrait</string>
    <string>UIInterfaceOrientationLandscapeLeft</string>
    <string>UIInterfaceOrientationLandscapeRight</string></array>
  <key>UISupportedInterfaceOrientations~ipad</key><array>
    <string>UIInterfaceOrientationPortrait</string>
    <string>UIInterfaceOrientationPortraitUpsideDown</string>
    <string>UIInterfaceOrientationLandscapeLeft</string>
    <string>UIInterfaceOrientationLandscapeRight</string></array>
  <key>NSMicrophoneUsageDescription</key><string>Friday uses the microphone for encrypted Dark Sun voice calls over the mesh.</string>
  <key>NSCameraUsageDescription</key><string>Friday uses the camera only if you start a video call.</string>
  <key>NSLocalNetworkUsageDescription</key><string>Friday connects to nearby devices to form its encrypted mesh.</string>
  <key>CFBundleSupportedPlatforms</key><array><string>iPhoneSimulator</string></array>
  <key>DTPlatformName</key><string>iphonesimulator</string>
  $ICON_KEYS
</dict></plist>
PLIST

rm -f "$HERE/build/friday-arm64" "$HERE/build/friday-x86_64"
echo ""
echo "✓ Built (Simulator): $APP"
echo "  Install & run:  ./run-sim.sh   (boots a simulator, installs, launches)"
