// MeshTransport — the native off-grid transport for Friday's Dark Core mesh.
//
// Uses MultipeerConnectivity: peer discovery and encrypted transport over
// Wi-Fi, peer-to-peer Wi-Fi, and Bluetooth, with NO server and NO internet.
// This is what lets an iPhone / iPad / Mac running Friday *store, transmit and
// relay* for one another off the grid — the Orange PIE thesis, natively.
//
// It carries opaque frames from the web app (the same hello / msg / typing /
// ping frames Net already speaks) and floods them across the mesh with
// store-and-forward relaying (see RelayStore). It never inspects a payload —
// message content stays sealed end-to-end between the web endpoints.

import Foundation
import MultipeerConnectivity

final class MeshTransport: NSObject, MCSessionDelegate,
                            MCNearbyServiceAdvertiserDelegate, MCNearbyServiceBrowserDelegate {

    static let serviceType = "friday-mesh"          // Bonjour: _friday-mesh._tcp / ._udp
    private let nodeID = UUID().uuidString           // transport-level id (mesh identity lives in web frames)
    private let myPeerID: MCPeerID
    private let session: MCSession
    private let advertiser: MCNearbyServiceAdvertiser
    private let browser: MCNearbyServiceBrowser
    private let store = RelayStore()
    private let q = DispatchQueue(label: "friday.mesh")

    /// Deliver a received web frame (JSON object string) to the web layer.
    var onFrame: ((String) -> Void)?
    /// Report the current connected-peer display names.
    var onPeersChanged: (([String]) -> Void)?

    init(displayName: String) {
        let name = displayName.isEmpty ? "Friday" : String(displayName.prefix(60))
        myPeerID = MCPeerID(displayName: name)
        session = MCSession(peer: myPeerID, securityIdentity: nil, encryptionPreference: .required)
        advertiser = MCNearbyServiceAdvertiser(peer: myPeerID,
                                               discoveryInfo: ["n": nodeID],
                                               serviceType: MeshTransport.serviceType)
        browser = MCNearbyServiceBrowser(peer: myPeerID, serviceType: MeshTransport.serviceType)
        super.init()
        session.delegate = self
        advertiser.delegate = self
        browser.delegate = self
    }

    func start() {
        advertiser.startAdvertisingPeer()
        browser.startBrowsingForPeers()
    }

    func stop() {
        advertiser.stopAdvertisingPeer()
        browser.stopBrowsingForPeers()
        session.disconnect()
    }

    /// A frame the web app wants to put on the mesh (already a JSON object string).
    func send(payload: String) {
        q.async {
            let env = MeshEnvelope(fid: UUID().uuidString, ttl: 6, origin: self.nodeID,
                                   payload: payload, ts: Date().timeIntervalSince1970 * 1000)
            _ = self.store.accept(env.fid)     // our own frames are "seen" so we never loop them back
            self.store.remember(env)
            self.broadcast(env, except: nil)
        }
    }

    var connectedCount: Int { session.connectedPeers.count }

    // MARK: - flooding

    private func broadcast(_ env: MeshEnvelope, except: MCPeerID?) {
        guard let data = try? JSONEncoder().encode(env) else { return }
        let peers = session.connectedPeers.filter { $0 != except }
        guard !peers.isEmpty else { return }
        try? session.send(data, toPeers: peers, with: .reliable)
    }

    private func handleIncoming(_ data: Data, from peer: MCPeerID) {
        guard let env = try? JSONDecoder().decode(MeshEnvelope.self, from: data) else { return }
        guard store.accept(env.fid) else { return }     // dedup: already flooded through here
        store.remember(env)
        onFrame?(env.payload)                            // deliver to the web layer once
        if let relay = store.forRelay(env) {             // and pass it on (multi-hop), minus this peer
            broadcast(relay, except: peer)
        }
    }

    // MARK: - MCSessionDelegate

    func session(_ session: MCSession, peer peerID: MCPeerID, didChange state: MCSessionState) {
        q.async {
            if state == .connected {
                // store-and-forward: replay what we've recently seen to the new peer
                let backlog = self.store.replay()
                for env in backlog {
                    if let d = try? JSONEncoder().encode(env) { try? session.send(d, toPeers: [peerID], with: .reliable) }
                }
            }
            DispatchQueue.main.async { self.onPeersChanged?(session.connectedPeers.map { $0.displayName }) }
        }
    }

    func session(_ session: MCSession, didReceive data: Data, fromPeer peerID: MCPeerID) {
        q.async { self.handleIncoming(data, from: peerID) }
    }

    func session(_: MCSession, didReceive _: InputStream, withName _: String, fromPeer _: MCPeerID) {}
    func session(_: MCSession, didStartReceivingResourceWithName _: String, fromPeer _: MCPeerID, with _: Progress) {}
    func session(_: MCSession, didFinishReceivingResourceWithName _: String, fromPeer _: MCPeerID, at _: URL?, withError _: Error?) {}

    // MARK: - advertiser / browser

    func advertiser(_: MCNearbyServiceAdvertiser, didReceiveInvitationFromPeer _: MCPeerID,
                    withContext _: Data?, invitationHandler: @escaping (Bool, MCSession?) -> Void) {
        invitationHandler(true, session)     // accept — the mesh is open to other Friday nodes
    }

    func browser(_ browser: MCNearbyServiceBrowser, foundPeer peerID: MCPeerID, withDiscoveryInfo _: [String: String]?) {
        // deterministic initiator avoids invite glare: the lexicographically-lower id invites
        if myPeerID.displayName < peerID.displayName {
            browser.invitePeer(peerID, to: session, withContext: nil, timeout: 15)
        }
    }

    func browser(_: MCNearbyServiceBrowser, lostPeer _: MCPeerID) {}
    func advertiser(_: MCNearbyServiceAdvertiser, didNotStartAdvertisingPeer error: Error) { NSLog("mesh advertise error: \(error)") }
    func browser(_: MCNearbyServiceBrowser, didNotStartBrowsingForPeers error: Error) { NSLog("mesh browse error: \(error)") }
}
