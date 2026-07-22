// Friday for macOS — a native .app that hosts the Friday web experience in a
// system WebView. No Electron, no bundled Chromium, no npm: it's WKWebView
// (the same engine as Safari) over a loopback server serving the bundled app.
//
// The whole point of Friday — WebCrypto accounts, end-to-end encryption, the
// BroadcastChannel/WebRTC mesh — runs unchanged, because it's the real web
// platform, just in a native window with a native menu and dock icon.

import AppKit
import WebKit

let FIXED_PORT: UInt16 = 47821   // stable origin ⇒ your saved logins persist across launches

final class AppDelegate: NSObject, NSApplicationDelegate, WKUIDelegate, WKNavigationDelegate, WKScriptMessageHandler {
    var window: NSWindow!
    var webView: WKWebView!
    var server: LocalServer!
    var mesh: MeshTransport!

    func applicationDidFinishLaunching(_ note: Notification) {
        // web assets are bundled under Resources/web
        guard let webRoot = Bundle.main.resourceURL?.appendingPathComponent("web"),
              FileManager.default.fileExists(atPath: webRoot.appendingPathComponent("index.html").path) else {
            fatalError("bundled web app not found in Resources/web")
        }
        server = LocalServer(root: webRoot)
        do { try server.start(preferred: FIXED_PORT) } catch { fatalError("could not start loopback server: \(error)") }

        let config = WKWebViewConfiguration()
        config.websiteDataStore = .default()            // persist localStorage / IndexedDB
        config.defaultWebpagePreferences.allowsContentJavaScript = true
        config.mediaTypesRequiringUserActionForPlayback = []
        config.preferences.setValue(true, forKey: "developerExtrasEnabled") // right-click ▸ Inspect Element

        // native off-grid mesh bridge — this Mac relays + stores for its peers
        let ucc = WKUserContentController()
        ucc.add(self, name: "mesh")
        ucc.addUserScript(WKUserScript(source: MeshBridge.shim, injectionTime: .atDocumentStart, forMainFrameOnly: true))
        config.userContentController = ucc

        webView = WKWebView(frame: .zero, configuration: config)
        webView.uiDelegate = self
        webView.navigationDelegate = self
        webView.allowsBackForwardNavigationGestures = false
        webView.setValue(false, forKey: "drawsBackground")   // let the glass show through the window

        let rect = NSRect(x: 0, y: 0, width: 1180, height: 780)
        window = NSWindow(contentRect: rect,
                          styleMask: [.titled, .closable, .miniaturizable, .resizable, .fullSizeContentView],
                          backing: .buffered, defer: false)
        window.title = "Friday"
        window.titlebarAppearsTransparent = true
        window.titleVisibility = .hidden
        window.isMovableByWindowBackground = true
        window.minSize = NSSize(width: 900, height: 600)
        window.center()
        window.setFrameAutosaveName("FridayMainWindow")
        window.contentView = webView
        window.makeKeyAndOrderFront(nil)

        buildMenu()
        NSApp.activate(ignoringOtherApps: true)

        // start relaying on the off-grid mesh (Wi-Fi + Bluetooth, no server)
        mesh = MeshTransport(displayName: Host.current().localizedName ?? "Friday Mac")
        mesh.onFrame = { [weak self] payload in
            DispatchQueue.main.async { self?.webView.evaluateJavaScript("window.FridayNativeMesh && FridayNativeMesh.recv(\(payload))", completionHandler: nil) }
        }
        mesh.onPeersChanged = { [weak self] names in
            let json = (try? JSONSerialization.data(withJSONObject: names)).flatMap { String(data: $0, encoding: .utf8) } ?? "[]"
            DispatchQueue.main.async { self?.webView.evaluateJavaScript("window.FridayNativeMesh && FridayNativeMesh.peers(\(json))", completionHandler: nil) }
        }
        mesh.start()

        let url = URL(string: "http://127.0.0.1:\(server.port)/")!
        webView.load(URLRequest(url: url))
    }

    func applicationShouldTerminateAfterLastWindowClosed(_ app: NSApplication) -> Bool { true }
    func applicationWillTerminate(_ note: Notification) { mesh?.stop(); server?.stop() }

    // frames from the web app → onto the mesh
    func userContentController(_ controller: WKUserContentController, didReceive message: WKScriptMessage) {
        guard message.name == "mesh" else { return }
        if let payload = message.body as? String { mesh.send(payload: payload) }
        else if let obj = message.body as? [String: Any],
                let data = try? JSONSerialization.data(withJSONObject: obj),
                let s = String(data: data, encoding: .utf8) { mesh.send(payload: s) }
    }

    // grant camera/mic to our own bundled origin (Calls · Dark Sun voice)
    @available(macOS 12.0, *)
    func webView(_ webView: WKWebView,
                 requestMediaCapturePermissionFor origin: WKSecurityOrigin,
                 initiatedByFrame frame: WKFrameInfo,
                 type: WKMediaCaptureType,
                 decisionHandler: @escaping (WKPermissionDecision) -> Void) {
        decisionHandler(origin.host == "127.0.0.1" ? .grant : .deny)
    }

    // open external links (docs, provider OAuth) in the real browser, keep the app on Friday
    func webView(_ webView: WKWebView, createWebViewWith config: WKWebViewConfiguration,
                 for action: WKNavigationAction, windowFeatures: WKWindowFeatures) -> WKWebView? {
        if let url = action.request.url, url.host != "127.0.0.1" { NSWorkspace.shared.open(url) }
        return nil
    }

    private func buildMenu() {
        let main = NSMenu()

        let appItem = NSMenuItem(); main.addItem(appItem)
        let appMenu = NSMenu()
        appMenu.addItem(withTitle: "About Friday", action: #selector(about), keyEquivalent: "")
        appMenu.addItem(.separator())
        appMenu.addItem(withTitle: "Reload", action: #selector(reload), keyEquivalent: "r")
        appMenu.addItem(withTitle: "Force Reload", action: #selector(forceReload), keyEquivalent: "R")
        appMenu.addItem(.separator())
        appMenu.addItem(withTitle: "Hide Friday", action: #selector(NSApplication.hide(_:)), keyEquivalent: "h")
        appMenu.addItem(withTitle: "Quit Friday", action: #selector(NSApplication.terminate(_:)), keyEquivalent: "q")
        appItem.submenu = appMenu

        let editItem = NSMenuItem(); main.addItem(editItem)
        let edit = NSMenu(title: "Edit")
        edit.addItem(withTitle: "Undo", action: Selector(("undo:")), keyEquivalent: "z")
        edit.addItem(withTitle: "Redo", action: Selector(("redo:")), keyEquivalent: "Z")
        edit.addItem(.separator())
        edit.addItem(withTitle: "Cut", action: #selector(NSText.cut(_:)), keyEquivalent: "x")
        edit.addItem(withTitle: "Copy", action: #selector(NSText.copy(_:)), keyEquivalent: "c")
        edit.addItem(withTitle: "Paste", action: #selector(NSText.paste(_:)), keyEquivalent: "v")
        edit.addItem(withTitle: "Select All", action: #selector(NSText.selectAll(_:)), keyEquivalent: "a")
        editItem.submenu = edit

        let winItem = NSMenuItem(); main.addItem(winItem)
        let win = NSMenu(title: "Window")
        win.addItem(withTitle: "Minimize", action: #selector(NSWindow.performMiniaturize(_:)), keyEquivalent: "m")
        win.addItem(withTitle: "Zoom", action: #selector(NSWindow.performZoom(_:)), keyEquivalent: "")
        winItem.submenu = win
        NSApp.windowsMenu = win

        NSApp.mainMenu = main
    }

    @objc private func reload() { webView.reload() }
    @objc private func forceReload() { webView.reloadFromOrigin() }
    @objc private func about() {
        NSApp.orderFrontStandardAboutPanel(options: [
            .applicationName: "Friday",
            .init(rawValue: "Copyright"): "Eros Office · Glass Stone LLC\nOrange PIE V1 Alpha",
        ])
    }
}

let app = NSApplication.shared
let delegate = AppDelegate()
app.delegate = delegate
app.setActivationPolicy(.regular)
app.run()
