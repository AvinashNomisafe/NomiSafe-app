import Foundation
import CoreMotion
import UserNotifications

@objc(FallDetectionModule)
class FallDetectionModule: RCTEventEmitter {
    
    private let motionManager = CMMotionManager()
    private var buffer: [AccelerationSample] = []
    private var isMonitoring = false
    private var lastFallDetectionTime: TimeInterval = 0
    
    // Tunable thresholds
    private let freeFallThreshold = 0.5
    private let impactThreshold = 2.5
    private let freeFallMinDurationMs = 200.0
    private let freeFallMaxDurationMs = 400.0
    private let impactWindowMs = 700.0
    private let stillnessWindowMs = 3000.0
    private let stillnessVarianceThreshold = 0.15
    private let bufferSizeMs = 6000.0
    private let cooldownPeriodMs = 120000.0
    
    struct AccelerationSample {
        let timestamp: TimeInterval
        let magnitude: Double
    }
    
    struct FreeFallSegment {
        let startTime: TimeInterval
        let endTime: TimeInterval
    }
    
    override init() {
        super.init()
        requestNotificationPermissions()
    }
    
    @objc
    func startMonitoring(_ resolve: @escaping RCTPromiseResolveBlock, rejecter reject: @escaping RCTPromiseRejectBlock) {
        guard motionManager.isAccelerometerAvailable else {
            reject("UNAVAILABLE", "Accelerometer not available", nil)
            return
        }
        
        if isMonitoring {
            resolve(true)
            return
        }
        
        isMonitoring = true
        motionManager.accelerometerUpdateInterval = 0.02 // 50Hz
        
        motionManager.startAccelerometerUpdates(to: .main) { [weak self] data, error in
            guard let self = self, let data = data else { return }
            
            let acceleration = data.acceleration
            let magnitude = sqrt(
                acceleration.x * acceleration.x +
                acceleration.y * acceleration.y +
                acceleration.z * acceleration.z
            )
            
            let sample = AccelerationSample(
                timestamp: Date().timeIntervalSince1970 * 1000, // Convert to ms
                magnitude: magnitude
            )
            
            self.buffer.append(sample)
            self.trimBuffer()
            self.evaluateFallPattern()
        }
        
        resolve(true)
    }
    
    @objc
    func stopMonitoring(_ resolve: @escaping RCTPromiseResolveBlock, rejecter reject: @escaping RCTPromiseRejectBlock) {
        isMonitoring = false
        motionManager.stopAccelerometerUpdates()
        buffer.removeAll()
        resolve(true)
    }
    
    @objc
    func cancelAlert(_ resolve: @escaping RCTPromiseResolveBlock, rejecter reject: @escaping RCTPromiseRejectBlock) {
        UNUserNotificationCenter.current().removeDeliveredNotifications(withIdentifiers: ["fall_alert"])
        sendEvent(withName: "onFallCancelled", body: nil)
        resolve(true)
    }
    
    private func trimBuffer() {
        let cutoffTime = Date().timeIntervalSince1970 * 1000 - bufferSizeMs
        buffer.removeAll { $0.timestamp < cutoffTime }
    }
    
    private func evaluateFallPattern() {
        let currentTime = Date().timeIntervalSince1970 * 1000
        
        // Check cooldown
        if currentTime - lastFallDetectionTime < cooldownPeriodMs {
            return
        }
        
        guard buffer.count >= 50 else { return }
        
        // Step 1: Detect free-fall
        let freeFallSegments = detectFreeFallSegments()
        guard let validFreeFall = freeFallSegments.first(where: { segment in
            let duration = segment.endTime - segment.startTime
            return duration >= freeFallMinDurationMs && duration <= freeFallMaxDurationMs
        }) else { return }
        
        // Step 2: Detect impact
        let impactEndTime = validFreeFall.endTime + impactWindowMs
        let impactSamples = buffer.filter {
            $0.timestamp >= validFreeFall.endTime && $0.timestamp <= impactEndTime
        }
        
        guard let maxImpact = impactSamples.map({ $0.magnitude }).max(),
              maxImpact >= impactThreshold else { return }
        
        // Step 3: Check stillness
        let stillnessStartTime = impactEndTime
        let stillnessEndTime = stillnessStartTime + stillnessWindowMs
        let stillnessSamples = buffer.filter {
            $0.timestamp >= stillnessStartTime && $0.timestamp <= stillnessEndTime
        }
        
        guard stillnessSamples.count >= 30 else { return }
        
        let magnitudes = stillnessSamples.map { $0.magnitude }
        let variance = calculateVariance(magnitudes)
        
        guard variance <= stillnessVarianceThreshold else { return }
        
        // Fall detected!
        lastFallDetectionTime = currentTime
        triggerFallAlert(impactG: maxImpact)
    }
    
    private func detectFreeFallSegments() -> [FreeFallSegment] {
        var segments: [FreeFallSegment] = []
        var segmentStart: TimeInterval? = nil
        
        for sample in buffer {
            if sample.magnitude < freeFallThreshold {
                if segmentStart == nil {
                    segmentStart = sample.timestamp
                }
            } else {
                if let start = segmentStart {
                    segments.append(FreeFallSegment(startTime: start, endTime: sample.timestamp))
                    segmentStart = nil
                }
            }
        }
        
        // Handle ongoing free-fall
        if let start = segmentStart, let last = buffer.last {
            segments.append(FreeFallSegment(startTime: start, endTime: last.timestamp))
        }
        
        return segments
    }
    
    private func calculateVariance(_ values: [Double]) -> Double {
        guard !values.isEmpty else { return 0 }
        
        let mean = values.reduce(0, +) / Double(values.count)
        let squaredDiffs = values.map { pow($0 - mean, 2) }
        return squaredDiffs.reduce(0, +) / Double(values.count)
    }
    
    private func triggerFallAlert(impactG: Double) {
        // Send to React Native
        sendEvent(withName: "onFallDetected", body: [
            "impactG": impactG,
            "timestamp": Date().timeIntervalSince1970 * 1000
        ])
        
        // Show critical alert
        showCriticalAlert()
    }
    
    private func showCriticalAlert() {
        let content = UNMutableNotificationContent()
        content.title = "🚨 Fall Detected"
        content.body = "Are you okay? Tap to respond or alerting contacts in 30s"
        content.sound = .defaultCritical
        content.interruptionLevel = .critical
        content.categoryIdentifier = "FALL_ALERT"
        
        // Add actions
        let cancelAction = UNNotificationAction(
            identifier: "CANCEL_ALERT",
            title: "I'M OK",
            options: .foreground
        )
        
        let category = UNNotificationCategory(
            identifier: "FALL_ALERT",
            actions: [cancelAction],
            intentIdentifiers: [],
            options: .customDismissAction
        )
        
        UNUserNotificationCenter.current().setNotificationCategories([category])
        
        let request = UNNotificationRequest(
            identifier: "fall_alert",
            content: content,
            trigger: nil
        )
        
        UNUserNotificationCenter.current().add(request) { error in
            if let error = error {
                print("Error showing notification: \(error)")
            }
        }
    }
    
    private func requestNotificationPermissions() {
        UNUserNotificationCenter.current().requestAuthorization(
            options: [.alert, .sound, .badge, .criticalAlert]
        ) { granted, error in
            if let error = error {
                print("Notification permission error: \(error)")
            }
        }
        
        // Set delegate to handle actions
        UNUserNotificationCenter.current().delegate = self
    }
    
    override func supportedEvents() -> [String]! {
        return ["onFallDetected", "onFallCancelled", "onSendEmergencyAlerts"]
    }
    
    @objc
    override static func requiresMainQueueSetup() -> Bool {
        return true
    }
}

// MARK: - UNUserNotificationCenterDelegate
extension FallDetectionModule: UNUserNotificationCenterDelegate {
    
    func userNotificationCenter(
        _ center: UNUserNotificationCenter,
        didReceive response: UNNotificationResponse,
        withCompletionHandler completionHandler: @escaping () -> Void
    ) {
        if response.actionIdentifier == "CANCEL_ALERT" {
            sendEvent(withName: "onFallCancelled", body: nil)
        }
        completionHandler()
    }
    
    func userNotificationCenter(
        _ center: UNUserNotificationCenter,
        willPresent notification: UNNotification,
        withCompletionHandler completionHandler: @escaping (UNNotificationPresentationOptions) -> Void
    ) {
        completionHandler([.banner, .sound, .badge])
    }
}
