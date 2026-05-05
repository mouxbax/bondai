import ActivityKit
import WidgetKit
import SwiftUI

// ─── Data Model ─────────────────────────────────────────────
// This defines what the Dynamic Island displays.

struct AIAHActivityAttributes: ActivityAttributes {
    // Fixed context that doesn't change during the activity
    public struct ContentState: Codable, Hashable {
        var companionMood: String    // "calm", "happy", "focused", etc.
        var companionEmoji: String   // "🧘", "😊", "🎯", etc.
        var streakCount: Int         // Current daily streak
        var energyPercent: Int       // 0-100
        var xpLevel: Int             // Current level
        var message: String          // Short companion message
    }

    var companionName: String        // User's companion name
    var evolutionStage: String       // "egg", "blob", "sprout", etc.
}

// ─── Dynamic Island + Lock Screen Widget ────────────────────

struct AIAHLiveActivityWidget: Widget {
    var body: some WidgetConfiguration {
        ActivityConfiguration(for: AIAHActivityAttributes.self) { context in
            // ── Lock Screen Banner ──────────────────────────
            lockScreenBanner(context: context)
        } dynamicIsland: { context in
            DynamicIsland {
                // ── Expanded View ───────────────────────────
                DynamicIslandExpandedRegion(.leading) {
                    VStack(alignment: .leading, spacing: 2) {
                        Text(context.state.companionEmoji)
                            .font(.title2)
                        Text("Lv.\(context.state.xpLevel)")
                            .font(.caption2)
                            .fontWeight(.bold)
                            .foregroundColor(.green.opacity(0.8))
                    }
                    .padding(.leading, 4)
                }

                DynamicIslandExpandedRegion(.center) {
                    VStack(spacing: 4) {
                        Text(context.attributes.companionName)
                            .font(.headline)
                            .fontWeight(.bold)
                        Text(context.state.message)
                            .font(.caption)
                            .foregroundColor(.secondary)
                            .lineLimit(1)
                    }
                }

                DynamicIslandExpandedRegion(.trailing) {
                    VStack(alignment: .trailing, spacing: 2) {
                        HStack(spacing: 2) {
                            Image(systemName: "flame.fill")
                                .foregroundColor(.orange)
                                .font(.caption)
                            Text("\(context.state.streakCount)")
                                .font(.caption)
                                .fontWeight(.bold)
                        }
                        // Energy bar
                        energyBar(percent: context.state.energyPercent)
                    }
                    .padding(.trailing, 4)
                }

                DynamicIslandExpandedRegion(.bottom) {
                    HStack(spacing: 16) {
                        // Quick action buttons
                        Link(destination: URL(string: "aiah://checkin")!) {
                            Label("Check In", systemImage: "checkmark.circle.fill")
                                .font(.caption)
                                .foregroundColor(.green)
                        }
                        Link(destination: URL(string: "aiah://talk")!) {
                            Label("Talk", systemImage: "bubble.left.fill")
                                .font(.caption)
                                .foregroundColor(.cyan)
                        }
                        Link(destination: URL(string: "aiah://breathe")!) {
                            Label("Breathe", systemImage: "wind")
                                .font(.caption)
                                .foregroundColor(.purple)
                        }
                    }
                    .padding(.top, 4)
                }
            } compactLeading: {
                // ── Compact Leading (left pill) ─────────────
                Text(context.state.companionEmoji)
                    .font(.title3)
            } compactTrailing: {
                // ── Compact Trailing (right pill) ───────────
                HStack(spacing: 2) {
                    Image(systemName: "flame.fill")
                        .foregroundColor(.orange)
                        .font(.caption2)
                    Text("\(context.state.streakCount)")
                        .font(.caption2)
                        .fontWeight(.bold)
                        .foregroundColor(.white)
                }
            } minimal: {
                // ── Minimal (tiny circle) ───────────────────
                Text(context.state.companionEmoji)
                    .font(.caption)
            }
        }
    }

    // ── Lock Screen Banner View ─────────────────────────────
    @ViewBuilder
    func lockScreenBanner(context: ActivityViewContext<AIAHActivityAttributes>) -> some View {
        HStack(spacing: 12) {
            // Companion emoji with glow
            ZStack {
                Circle()
                    .fill(moodColor(context.state.companionMood).opacity(0.2))
                    .frame(width: 44, height: 44)
                Text(context.state.companionEmoji)
                    .font(.title2)
            }

            VStack(alignment: .leading, spacing: 2) {
                Text(context.attributes.companionName)
                    .font(.headline)
                    .fontWeight(.bold)
                Text(context.state.message)
                    .font(.caption)
                    .foregroundColor(.secondary)
                    .lineLimit(1)
            }

            Spacer()

            VStack(alignment: .trailing, spacing: 4) {
                HStack(spacing: 3) {
                    Image(systemName: "flame.fill")
                        .foregroundColor(.orange)
                        .font(.caption)
                    Text("\(context.state.streakCount)")
                        .font(.subheadline)
                        .fontWeight(.bold)
                }
                energyBar(percent: context.state.energyPercent)
            }
        }
        .padding(16)
        .background(Color.black.opacity(0.85))
    }

    // ── Energy mini-bar ─────────────────────────────────────
    @ViewBuilder
    func energyBar(percent: Int) -> some View {
        ZStack(alignment: .leading) {
            RoundedRectangle(cornerRadius: 2)
                .fill(Color.white.opacity(0.15))
                .frame(width: 36, height: 4)
            RoundedRectangle(cornerRadius: 2)
                .fill(percent > 60 ? Color.green : percent > 30 ? Color.yellow : Color.red)
                .frame(width: CGFloat(percent) / 100.0 * 36, height: 4)
        }
    }

    func moodColor(_ mood: String) -> Color {
        switch mood {
        case "happy": return .yellow
        case "calm": return .green
        case "focused": return .blue
        case "energized": return .orange
        case "tender": return .pink
        case "anxious": return .purple
        case "low": return .gray
        default: return .teal
        }
    }
}
