// LocalServer — a tiny loopback static-file server.
//
// Why not just load the bundled files with file:// ? Because Friday leans on
// WebCrypto (accounts, end-to-end encryption), service workers, and
// BroadcastChannel — all of which require a *secure context*. http://127.0.0.1
// is a secure context; file:// is not, reliably. Serving the bundled web app
// over loopback gives WKWebView the exact origin it was designed to run on, so
// everything behaves as it does in a browser. Nothing leaves the machine.
//
// Foundation Network framework only — no third-party dependencies.

import Foundation
import Network

final class LocalServer {
    private let root: URL
    private let queue = DispatchQueue(label: "friday.localserver")
    private var listener: NWListener?
    private(set) var port: UInt16 = 0

    init(root: URL) { self.root = root }

    /// Start listening. Tries `preferred` first so the origin (and therefore
    /// localStorage / IndexedDB) stays stable across launches; falls back to an
    /// OS-assigned port only if that one is genuinely unavailable.
    func start(preferred: UInt16) throws {
        if let ok = try? bind(on: preferred), ok { return }
        try bind(on: 0)   // preferred port taken/failed → ephemeral fallback
    }

    @discardableResult
    private func bind(on p: UInt16) throws -> Bool {
        let params = NWParameters.tcp
        params.requiredInterfaceType = .loopback
        params.allowLocalEndpointReuse = true
        let nwPort = NWEndpoint.Port(rawValue: p) ?? .any
        let l = try NWListener(using: params, on: nwPort)
        let ready = DispatchSemaphore(value: 0)
        var ok = false
        l.stateUpdateHandler = { state in
            switch state {
            case .ready: ok = true; ready.signal()
            case .failed: ok = false; ready.signal()
            default: break
            }
        }
        l.newConnectionHandler = { [weak self] conn in self?.handle(conn) }
        l.start(queue: queue)
        _ = ready.wait(timeout: .now() + 2)
        guard ok, let realPort = l.port?.rawValue else { l.cancel(); return false }
        self.listener = l
        self.port = realPort
        return true
    }

    func stop() { listener?.cancel(); listener = nil }

    // MARK: - request handling

    private func handle(_ conn: NWConnection) {
        conn.start(queue: queue)
        receive(conn, buffer: Data())
    }

    private func receive(_ conn: NWConnection, buffer: Data) {
        conn.receive(minimumIncompleteLength: 1, maximumLength: 64 * 1024) { [weak self] data, _, done, err in
            guard let self else { return }
            var buf = buffer
            if let data { buf.append(data) }
            if let headerEnd = buf.range(of: Data("\r\n\r\n".utf8)) {
                let head = String(decoding: buf[..<headerEnd.lowerBound], as: UTF8.self)
                self.respond(conn, requestLine: head.split(separator: "\r\n").first.map(String.init) ?? "")
                return
            }
            if err != nil || done { conn.cancel(); return }
            if buf.count > 128 * 1024 { conn.cancel(); return }
            self.receive(conn, buffer: buf)
        }
    }

    private func respond(_ conn: NWConnection, requestLine: String) {
        let parts = requestLine.split(separator: " ")
        let method = parts.first.map(String.init) ?? "GET"
        var path = parts.count > 1 ? String(parts[1]) : "/"
        if let q = path.firstIndex(of: "?") { path = String(path[..<q]) }
        path = path.removingPercentEncoding ?? path
        if path == "/" { path = "/index.html" }

        // resolve safely inside root — no path traversal escapes
        let rootPath = root.standardizedFileURL.path
        let target = root.appendingPathComponent(String(path.drop(while: { $0 == "/" }))).standardizedFileURL
        guard target.path.hasPrefix(rootPath) else { return send(conn, status: "403 Forbidden", body: Data(), type: "text/plain") }

        guard method == "GET" || method == "HEAD",
              let body = try? Data(contentsOf: target),
              (try? target.resourceValues(forKeys: [.isRegularFileKey]))?.isRegularFile == true
        else {
            // SPA-ish fallback: unknown paths return the shell
            if let idx = try? Data(contentsOf: root.appendingPathComponent("index.html")) {
                return send(conn, status: "200 OK", body: idx, type: "text/html; charset=utf-8")
            }
            return send(conn, status: "404 Not Found", body: Data("not found".utf8), type: "text/plain")
        }
        send(conn, status: "200 OK", body: method == "HEAD" ? Data() : body, type: mime(for: target.pathExtension), realLength: body.count)
    }

    private func send(_ conn: NWConnection, status: String, body: Data, type: String, realLength: Int? = nil) {
        var header = "HTTP/1.1 \(status)\r\n"
        header += "Content-Type: \(type)\r\n"
        header += "Content-Length: \(realLength ?? body.count)\r\n"
        header += "Cache-Control: no-cache\r\n"
        header += "Connection: close\r\n\r\n"
        var out = Data(header.utf8); out.append(body)
        conn.send(content: out, completion: .contentProcessed { _ in conn.cancel() })
    }

    private func mime(for ext: String) -> String {
        switch ext.lowercased() {
        case "html": return "text/html; charset=utf-8"
        case "js", "mjs": return "text/javascript; charset=utf-8"
        case "css": return "text/css; charset=utf-8"
        case "json": return "application/json; charset=utf-8"
        case "webmanifest": return "application/manifest+json"
        case "svg": return "image/svg+xml"
        case "png": return "image/png"
        case "ico": return "image/x-icon"
        case "woff2": return "font/woff2"
        case "wasm": return "application/wasm"
        default: return "application/octet-stream"
        }
    }
}
