// Standalone tests for the relay/store engine. Run:
//   swiftc mac/Sources/RelayStore.swift mac/Tests/RelayStoreTests.swift -o /tmp/rt && /tmp/rt
import Foundation

@main struct RelayStoreTests {
    static var fails = 0
    static func check(_ label: String, _ cond: Bool) { print("\(cond ? "✓" : "✗ FAIL")  \(label)"); if !cond { fails += 1 } }
    static func env(_ fid: String, _ ttl: Int, _ ts: Double) -> MeshEnvelope {
        MeshEnvelope(fid: fid, ttl: ttl, origin: "n1", payload: "{\"t\":\"msg\"}", ts: ts)
    }

    static func main() {
        // dedup: first sight new, repeats dropped (this is what stops a flood looping)
        let s = RelayStore(seenTTLms: 1000, bufferMax: 8, bufferTTLms: 1000)
        check("first sighting of a frame is accepted", s.accept("a", now: 0) == true)
        check("duplicate frame is dropped", s.accept("a", now: 10) == false)
        check("a different frame is accepted", s.accept("b", now: 10) == true)
        check("seen id expires after its TTL", s.accept("a", now: 2000) == true)

        // relay: ttl decremented, and a 1-hop frame is not relayed further
        check("frame with ttl>1 relays with ttl-1", s.forRelay(env("c", 3, 0))?.ttl == 2)
        check("frame with ttl==1 is not relayed", s.forRelay(env("d", 1, 0)) == nil)

        // store-and-forward: recent frames replay to a peer that connects later
        let s2 = RelayStore(seenTTLms: 100000, bufferMax: 100, bufferTTLms: 1000)
        s2.remember(env("m1", 6, 0), now: 0)
        s2.remember(env("m2", 6, 500), now: 500)
        check("both recent frames are held for replay", s2.replay(now: 600).count == 2)
        check("old frame drops from replay, recent stays", s2.replay(now: 1400).count == 1 && s2.replay(now: 2000).count == 0)

        // buffer is bounded (a busy relay never grows without limit)
        let s3 = RelayStore(seenTTLms: 100000, bufferMax: 5, bufferTTLms: 100000)
        for i in 0..<20 { s3.remember(env("x\(i)", 6, Double(i)), now: Double(i)) }
        check("replay buffer is capped at bufferMax", s3.bufferedCount == 5)

        // envelope survives JSON round-trip (what actually crosses the wire)
        let e = env("z", 4, 42)
        let data = try! JSONEncoder().encode(e)
        let back = try! JSONDecoder().decode(MeshEnvelope.self, from: data)
        check("envelope encodes/decodes intact", back.fid == "z" && back.ttl == 4 && back.payload == e.payload)

        print(fails == 0 ? "\nrelay/store engine verified" : "\n\(fails) FAILURE(S)")
        exit(fails == 0 ? 0 : 1)
    }
}
