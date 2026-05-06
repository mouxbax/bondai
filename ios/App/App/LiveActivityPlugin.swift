import Capacitor
import ActivityKit
import Foundation

/// Capacitor plugin that allows the web app to start, update, and stop
/// AIAH Live Activities from JavaScript.
///
/// Usage from JS:
///   Capacitor.Plugins.LiveActivity.start({ status: "Breathing · Box 4-4-4-4", progress: 0.0, icon: "🫁", accentHex: "#1D9E75", mood: "calm", activityType: "breathing" })
///   Capacitor.Plugins.LiveActivity.update({ status: "Breathing · 2:45", progress: 0.65, icon: "🫁", accentHex: "#1D9E75" })
///   Capacitor.Plugins.LiveActivity.stop({})
@objc(LiveActivityPlugin)
class LiveActivityPlugin: CAPPlugin, CAPBridgedPlugin {
    let identifier = "LiveActivityPlugin"
    let jsName = "LiveActivity"
    let pluginMethods: [CAPPluginMethod] = [
        CAPPluginMethod(name: "start", returnType: CAPPluginReturnPromise),
        CAPPluginMethod(name: "update", returnType: CAPPluginReturnPromise),
        CAPPluginMethod(name: "stop", returnType: CAPPluginReturnPromise),
        CAPPluginMethod(name: "isAvailable", returnType: CAPPluginReturnPromise),
    ]

    private var currentActivityId: String?

    /// Check if Live Activities are available on this device
    @objc func isAvailable(_ call: CAPPluginCall) {
        if #available(iOS 16.1, *) {
            call.resolve(["available": ActivityAuthorizationInfo().areActivitiesEnabled])
        } else {
            call.resolve(["available": false])
        }
    }

    /// Start a new Live Activity
    @objc func start(_ call: CAPPluginCall) {
        guard #available(iOS 16.1, *) else {
            call.reject("Live Activities require iOS 16.1+")
            return
        }

        guard ActivityAuthorizationInfo().areActivitiesEnabled else {
            call.reject("Live Activities are not enabled")
            return
        }

        let status = call.getString("status") ?? "AIAH is active"
        let progress = call.getDouble("progress") ?? 0.0
        let icon = call.getString("icon") ?? "✨"
        let accentHex = call.getString("accentHex") ?? "#1D9E75"
        let mood = call.getString("mood") ?? "calm"
        let activityType = call.getString("activityType") ?? "daily"

        let attributes = AIAHActivityAttributes(
            mood: mood,
            activityType: activityType
        )
        let state = AIAHActivityAttributes.ContentState(
            status: status,
            progress: progress,
            icon: icon,
            accentHex: accentHex
        )

        do {
            let content = ActivityContent(state: state, staleDate: nil)
            let activity = try Activity.request(
                attributes: attributes,
                content: content,
                pushType: nil
            )
            currentActivityId = activity.id
            call.resolve(["id": activity.id])
        } catch {
            call.reject("Failed to start Live Activity: \(error.localizedDescription)")
        }
    }

    /// Update the current Live Activity
    @objc func update(_ call: CAPPluginCall) {
        guard #available(iOS 16.1, *) else {
            call.reject("Live Activities require iOS 16.1+")
            return
        }

        let status = call.getString("status") ?? "AIAH is active"
        let progress = call.getDouble("progress") ?? 0.0
        let icon = call.getString("icon") ?? "✨"
        let accentHex = call.getString("accentHex") ?? "#1D9E75"

        let state = AIAHActivityAttributes.ContentState(
            status: status,
            progress: progress,
            icon: icon,
            accentHex: accentHex
        )

        Task {
            for activity in Activity<AIAHActivityAttributes>.activities {
                let content = ActivityContent(state: state, staleDate: nil)
                await activity.update(content)
            }
            DispatchQueue.main.async {
                call.resolve(["updated": true])
            }
        }
    }

    /// Stop all AIAH Live Activities
    @objc func stop(_ call: CAPPluginCall) {
        guard #available(iOS 16.1, *) else {
            call.reject("Live Activities require iOS 16.1+")
            return
        }

        Task {
            for activity in Activity<AIAHActivityAttributes>.activities {
                await activity.end(nil, dismissalPolicy: .immediate)
            }
            currentActivityId = nil
            DispatchQueue.main.async {
                call.resolve(["stopped": true])
            }
        }
    }
}
