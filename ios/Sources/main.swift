// Friday for iOS & iPadOS — a native app hosting the Friday web experience in
// WKWebView (system WebKit). Same design as the Mac app: the bundled web files
// are served over a loopback HTTP server so WKWebView gets a real secure-context
// origin, and WebCrypto (encrypted accounts, end-to-end encryption), service
// workers, and the mesh all run unchanged. No third-party dependencies.
//
// The pocket-pane layout Friday already ships (HDL §11.1) means the same web app
// becomes a proper phone/tablet UI automatically.

import UIKit
import WebKit

let FIXED_PORT: UInt16 = 47821   // stable origin ⇒ saved logins persist across launches

final class FridayViewController: UIViewController, WKUIDelegate, WKNavigationDelegate {
    private var webView: WKWebView!
    private var server: LocalServer!

    override func loadView() {
        // web assets are bundled under Resources/web
        guard let webRoot = Bundle.main.resourceURL?.appendingPathComponent("web"),
              FileManager.default.fileExists(atPath: webRoot.appendingPathComponent("index.html").path) else {
            fatalError("bundled web app not found in Resources/web")
        }
        server = LocalServer(root: webRoot)
        try? server.start(preferred: FIXED_PORT)

        let config = WKWebViewConfiguration()
        config.websiteDataStore = .default()               // persist localStorage / IndexedDB
        config.allowsInlineMediaPlayback = true
        config.mediaTypesRequiringUserActionForPlayback = []
        config.defaultWebpagePreferences.allowsContentJavaScript = true

        webView = WKWebView(frame: .zero, configuration: config)
        webView.uiDelegate = self
        webView.navigationDelegate = self
        webView.isOpaque = false
        webView.backgroundColor = .clear
        webView.scrollView.bounces = false
        webView.scrollView.contentInsetAdjustmentBehavior = .never   // the app handles its own safe areas
        view = webView
    }

    override func viewDidLoad() {
        super.viewDidLoad()
        let url = URL(string: "http://127.0.0.1:\(server.port)/")!
        webView.load(URLRequest(url: url))
    }

    override var preferredStatusBarStyle: UIStatusBarStyle { .default }

    // grant camera/mic to our bundled origin (Dark Sun voice)
    func webView(_ webView: WKWebView,
                 requestMediaCapturePermissionFor origin: WKSecurityOrigin,
                 initiatedByFrame frame: WKFrameInfo,
                 type: WKMediaCaptureType,
                 decisionHandler: @escaping (WKPermissionDecision) -> Void) {
        decisionHandler(origin.host == "127.0.0.1" ? .grant : .deny)
    }

    // open external links (docs, provider OAuth) in Safari; keep the app on Friday
    func webView(_ webView: WKWebView, createWebViewWith config: WKWebViewConfiguration,
                 for action: WKNavigationAction, windowFeatures: WKWindowFeatures) -> WKWebView? {
        if let url = action.request.url, url.host != "127.0.0.1" { UIApplication.shared.open(url) }
        return nil
    }
}

final class AppDelegate: UIResponder, UIApplicationDelegate {
    var window: UIWindow?
    func application(_ application: UIApplication,
                     didFinishLaunchingWithOptions launchOptions: [UIApplication.LaunchOptionsKey: Any]?) -> Bool {
        let w = UIWindow(frame: UIScreen.main.bounds)
        w.rootViewController = FridayViewController()
        w.makeKeyAndVisible()
        window = w
        return true
    }
}

UIApplicationMain(CommandLine.argc, CommandLine.unsafeArgv, nil, NSStringFromClass(AppDelegate.self))
