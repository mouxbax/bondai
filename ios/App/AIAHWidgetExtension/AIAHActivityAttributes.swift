import ActivityKit
import Foundation

/// Defines the data model for AIAH Live Activities.
/// ContentState holds the dynamic data that updates in real-time.
struct AIAHActivityAttributes: ActivityAttributes {

    /// Static context that doesn't change during the activity
    public struct ContentState: Codable, Hashable {
        /// Current status text (e.g., "Breathing · 4:32", "Focus Mode", "Gym Day")
        var status: String
        /// Progress value 0.0 - 1.0 (used for breathing timer, goal progress, etc.)
        var progress: Double
        /// Emoji or SF Symbol name for the activity type
        var icon: String
        /// Accent color hex (e.g., "#1D9E75")
        var accentHex: String
    }

    /// The companion's current mood (static for the activity's lifetime)
    var mood: String
    /// Activity type identifier
    var activityType: String  // "breathing", "focus", "daily", "goal"
}
