#!/bin/zsh
# Double-click this file to run Friday.
# It serves the app locally and opens it in your default browser.
# From the browser you can then install it as an app:
#   Chrome/Edge — the install icon in the address bar
#   Safari      — File ▸ Add to Dock…
cd "$(dirname "$0")"
PORT=4173
echo ""
echo "  Friday · Eros Office"
echo "  Serving at http://localhost:$PORT — leave this window open."
echo "  Press Ctrl+C to quit."
echo ""
( sleep 1 && open "http://localhost:$PORT" ) &
exec python3 -m http.server "$PORT"
