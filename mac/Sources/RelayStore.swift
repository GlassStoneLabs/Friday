// RelayStore — the store-and-forward relay engine that makes every device a
// mesh node, independent of transport. It does three things:
//
//   • dedup   — a frame flooding a multi-hop mesh must be delivered and
//               re-broadcast at most once per node (by unique frame id).
//   • relay   — a frame not yet seen is re-broadcast to other peers with a
//               decremented hop count, so A can reach C through B.
//   • store   — recent frames are held briefly and replayed to peers that
//               connect later, so a device that was away still receives them.
//
// Pure Foundation, no networking and no platform frameworks, so the behaviour
// is unit-testable on its own (see mac/Tests/RelayStoreTests.swift).

import Foundation

struct MeshEnvelope: Codable {
    let fid: String        // unique frame id — the dedup key
    var ttl: Int           // hops remaining; 0 ⇒ do not relay further
    let origin: String     // originating node (transport-level id)
    let payload: String    // opaque web frame, as a JSON string; the mesh never inspects it
    let ts: Double         // created, epoch ms
}

final class RelayStore {
    private var seen: [String: Double] = [:]     // fid -> first-seen ms
    private var buffer: [MeshEnvelope] = []       // recent frames to replay to new peers
    private let lock = NSLock()

    let seenTTLms: Double
    let bufferMax: Int
    let bufferTTLms: Double

    init(seenTTLms: Double = 5 * 60_000, bufferMax: Int = 256, bufferTTLms: Double = 10 * 60_000) {
        self.seenTTLms = seenTTLms
        self.bufferMax = bufferMax
        self.bufferTTLms = bufferTTLms
    }

    /// True the first time a frame id is seen (⇒ deliver + consider relaying);
    /// false on any repeat (⇒ drop — it has already flooded through here).
    func accept(_ fid: String, now: Double = Date().timeIntervalSince1970 * 1000) -> Bool {
        lock.lock(); defer { lock.unlock() }
        sweep(now)
        if seen[fid] != nil { return false }
        seen[fid] = now
        return true
    }

    /// Hold a frame so a peer that connects shortly after still receives it.
    func remember(_ env: MeshEnvelope, now: Double = Date().timeIntervalSince1970 * 1000) {
        lock.lock(); defer { lock.unlock() }
        buffer.append(env)
        if buffer.count > bufferMax { buffer.removeFirst(buffer.count - bufferMax) }
    }

    /// The recent, non-expired frames to replay to a newly-connected peer.
    func replay(now: Double = Date().timeIntervalSince1970 * 1000) -> [MeshEnvelope] {
        lock.lock(); defer { lock.unlock() }
        sweep(now)
        return buffer.filter { now - $0.ts < bufferTTLms }
    }

    /// Prepare a received envelope for relaying: decremented hop count, or nil
    /// when it must not travel further.
    func forRelay(_ env: MeshEnvelope) -> MeshEnvelope? {
        guard env.ttl > 1 else { return nil }
        var next = env
        next.ttl -= 1
        return next
    }

    var seenCount: Int { lock.lock(); defer { lock.unlock() }; return seen.count }
    var bufferedCount: Int { lock.lock(); defer { lock.unlock() }; return buffer.count }

    private func sweep(_ now: Double) {
        for (k, v) in seen where now - v > seenTTLms { seen.removeValue(forKey: k) }
        buffer.removeAll { now - $0.ts > bufferTTLms }
    }
}
