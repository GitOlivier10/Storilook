import Foundation
import React

@objc(StorilookCameraModule)
class StorilookCameraModule: RCTEventEmitter {
  private var hasListeners = false

  override static func requiresMainQueueSetup() -> Bool {
    return false
  }

  override func supportedEvents() -> [String]! {
    return ["onPhotoCaptured"]
  }

  override func startObserving() {
    hasListeners = true
  }

  override func stopObserving() {
    hasListeners = false
  }

  @objc(captureAndSavePhoto:)
  func captureAndSavePhoto(_ eventId: String) {
    print("[StorilookCameraModule] Capture requested for eventId: \(eventId)")

    let timestamp = ISO8601DateFormatter().string(from: Date())
    let localPath = "/tmp/storilook/\(eventId)/photo.jpg"
    let checksum = UUID().uuidString.replacingOccurrences(of: "-", with: "")

    guard hasListeners else {
      print("[StorilookCameraModule] No JS listeners attached; skipping onPhotoCaptured event")
      return
    }

    let payload: [String: String] = [
      "localPath": localPath,
      "checksum": checksum,
      "timestamp": timestamp
    ]

    DispatchQueue.main.async {
      self.sendEvent(withName: "onPhotoCaptured", body: payload)
    }
  }
}
