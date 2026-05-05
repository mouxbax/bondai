import Capacitor
import ActivityKit

/**
 * Capacitor plugin: bridges web app JS calls to native iOS Live Activities.
 *
 * Usage from web:
 *   import { LiveActivity } from '@/lib/native/live-activity';
 *   LiveActivity.start({ companionName: 'AIAH', mood: 'calm', ... });
 *   LiveActivity.update({ mood: 'happy', streakCount: 5, ... });
 *   LiveActivity.end();
 */

@objc(LiveActivityPlugin)
public class LiveActivityPlugin: CAPPlugin, CAPBridgedPlugin {
    public let identifier = "LiveActivityPlugin"
    public let jsName = "LiveActivity"
    public let pluginMethods: [CAPPluginMethod] = [
        CAPPluginMethod(name: "start", returnType: CAPPluginReturnPromise),
        CAPPluginMethod(name: "update", returnType: CAPPluginReturnPromise),
        CAPPluginMethod(name: "end", returnType: CAPPluginReturnPromise),
        CAPPluginMethod(name: "isSupported", returnType: CAPPluginReturnPromise),
    ]

    private var currentActivity: Activity<AIAHActivityAttributes>?

    // ── Check if device supports Live Activities ────────────
    @objc func isSupported(_ call: CAPPluginCall) {
        if #available(iOS 16.1, *) {
            call.resolve(["supported": ActivityAuthorizationInfo().areActivitiesEnabled])
        } else {
            call.resolve(["supported": false])
        }
    }

    // ── Start a Live Activity (shows on Dynamic Island) ─────
    @objc func start(_ call: CAPPluginCall) {
        guard #available(iOS 16.1, *) else {
            call.reject("Live Activities require iOS 16.1+")
            return
        }

        guard ActivityAuthorizationInfo().areActivitiesEnabled else {
            call.reject("Live Activities are disabled in Settings")
            return
        }

        let companionName = call.getString("companionName") ?? "AIAH"
        let evolutionStage = call.getString("evolutionStage") ?? "blob"
        let mood = call.getString("mood") ?? "calm"
        let emoji = call.getString("emoji") ?? moodToEmoji(mood)
        let streak = call.getInt("streakCount") ?? 0
        let energy = call.getInt("energyPercent") ?? 100
        let level = call.getInt("xpLevel") ?? 1
        let message = call.getString("message") ?? "I'm here with you"

        let attributes = AIAHActivityAttributes(
            companionName: companionName,
            evolutionStage: evolutionStage
        )

        let state = AIAHActivityAttributes.ContentState(
            companionMood: mood,
            companionEmoji: emoji,
            streakCount: streak,
            energyPercent: energy,
            xpLevel: level,
            message: message
        )

        do {
            let activity = try Activity.request(
                attributes: attributes,
                content: .init(state: state, staleDate: nil),
                pushType: nil
            )
            currentActivity = activity
            call.resolve(["activityId": activity.id])
        } catch {
            call.reject("Failed to start Live Activity: \(error.localizedDescription)")
        }
    }

    // ── Update the Dynamic Island content ───────────────────
    @objc func update(_ call: CAPPluginCall) {
        guard #available(iOS 16.1, *) else {
            call.reject("Live Activities require iOS 16.1+")
            return
        }

        guard let activity = currentActivity else {
            call.reject("No active Live Activity to update")
            return
        }

        let mood = call.getString("mood") ?? "calm"
        let emoji = call.getString("emoji") ?? moodToEmoji(mood)
        let streak = call.getInt("streakCount") ?? 0
        let energy = call.getInt("energyPercent") ?? 100
        let level = call.getInt("xpLevel") ?? 1
        let message = call.getString("message") ?? "I'm here with you"

        let state = AIAHActivityAttributes.ContentState(
            companionMood: mood,
            companionEmoji: emoji,
            streakCount: streak,
            energyPercent: energy,
            xpLevel: level,
            message: message
        )

        Task {
            await activity.update(.init(state: state, staleDate: nil))
            call.resolve(["updated": true])
        }
    }

    // ── End the Live Activity ───────────────────────────────
    @objc func end(_ call: CAPPluginCall) {
        guard #available(iOS 16.1, *) else {
            call.reject("Live Activities require iOS 16.1+")
            return
        }

        guard let activity = currentActivity else {
            call.resolve(["ended": true]) // Already ended
            return
        }

        Task {
            await activity.end(nil, dismissalPolicy: .immediate)
            currentActivity = nil
            call.resolve(["ended": true])
        }
    }

    // ── Helper: mood → emoji ────────────────────────────────
    private func moodToEmoji(_ mood: String) -> String {
        switch mood {
        case "happy": return "😊"
        case "calm": return "🧘"
        case "focused": return "🎯"
        case "energized": return "🔥"
        case "tender": return "💗"
        case "anxious": return "😰"
        case "low": return "🌧️"
        default: return "🌿"
        }
    }
}
