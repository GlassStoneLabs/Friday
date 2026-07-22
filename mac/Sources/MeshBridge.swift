// MeshBridge — the tiny JS shim injected at document-start so the web app can
// discover and use the native off-grid mesh. It exposes window.FridayNativeMesh
// with:
//   • send(frame)  — hand a frame to the native relay (postMessage to Swift)
//   • recv(frame)  — native calls this with an incoming frame; routed into Net
//   • peers(list)  — native reports connected transport peers
// The web Net layer detects FridayNativeMesh and treats it as a transport
// alongside BroadcastChannel and WebRTC. Shared by the iOS and Mac apps.

enum MeshBridge {
    static let shim = """
    (function () {
      var mh = window.webkit && window.webkit.messageHandlers && window.webkit.messageHandlers.mesh;
      window.FridayNativeMesh = {
        available: !!mh,
        // web frame (object) → native mesh
        send: function (frame) { try { mh && mh.postMessage(JSON.stringify(frame)); } catch (e) {} },
        // native → web: an incoming frame; hand it to Net when it's ready
        recv: function (frame) {
          try {
            if (typeof frame === "string") frame = JSON.parse(frame);
            if (window.Net && Net.recv) Net.recv(frame, "mpc");
          } catch (e) {}
        },
        // native → web: connected peer display names (transport-level)
        peers: function (list) {
          window.__fridayMeshPeers = list || [];
          try { if (window.Net && Net.emitPeers) Net.emitPeers(); } catch (e) {}
        },
      };
    })();
    """
}
