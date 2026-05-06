import ActivityKit
import SwiftUI
import WidgetKit

/// The AIAH Live Activity that appears in the Dynamic Island and Lock Screen.
struct AIAHLiveActivity: Widget {
    var body: some WidgetConfiguration {
        ActivityConfiguration(for: AIAHActivityAttributes.self) { context in
            // ─── Lock Screen / Banner view ─────────────────────────────
            LockScreenView(context: context)
        } dynamicIsland: { context in
            DynamicIsland {
                // ─── Expanded regions ──────────────────────────────────

                // Leading: AIAH orb indicator
                DynamicIslandExpandedRegion(.leading) {
                    HStack(spacing: 6) {
                        // Pulsing orb dot
                        Circle()
                            .fill(Color(hex: context.state.accentHex))
                            .frame(width: 12, height: 12)
                            .shadow(color: Color(hex: context.state.accentHex).opacity(0.6), radius: 4)
                        Text("AIAH")
                            .font(.system(size: 13, weight: .bold, design: .rounded))
                            .foregroundColor(Color(hex: context.state.accentHex))
                    }
                    .padding(.leading, 2)
                }

                // Trailing: progress or icon
                DynamicIslandExpandedRegion(.trailing) {
                    if context.state.progress > 0 {
                        // Circular progress indicator
                        ZStack {
                            Circle()
                                .stroke(Color.white.opacity(0.15), lineWidth: 2.5)
                                .frame(width: 28, height: 28)
                            Circle()
                                .trim(from: 0, to: context.state.progress)
                                .stroke(
                                    Color(hex: context.state.accentHex),
                                    style: StrokeStyle(lineWidth: 2.5, lineCap: .round)
                                )
                                .frame(width: 28, height: 28)
                                .rotationEffect(.degrees(-90))
                            Text(context.state.icon)
                                .font(.system(size: 11))
                        }
                    } else {
                        Text(context.state.icon)
                            .font(.system(size: 20))
                    }
                }

                // Center: status text
                DynamicIslandExpandedRegion(.center) {
                    Text(context.state.status)
                        .font(.system(size: 14, weight: .medium, design: .rounded))
                        .foregroundColor(.white)
                        .lineLimit(1)
                }

                // Bottom: progress bar for breathing/timers
                DynamicIslandExpandedRegion(.bottom) {
                    if context.state.progress > 0 {
                        GeometryReader { geo in
                            ZStack(alignment: .leading) {
                                RoundedRectangle(cornerRadius: 2)
                                    .fill(Color.white.opacity(0.1))
                                    .frame(height: 3)
                                RoundedRectangle(cornerRadius: 2)
                                    .fill(Color(hex: context.state.accentHex))
                                    .frame(width: geo.size.width * context.state.progress, height: 3)
                            }
                        }
                        .frame(height: 3)
                        .padding(.horizontal, 4)
                        .padding(.top, 4)
                    }
                }

            } compactLeading: {
                // ─── Compact leading (left pill half) ──────────────────
                Circle()
                    .fill(Color(hex: context.state.accentHex))
                    .frame(width: 10, height: 10)
                    .shadow(color: Color(hex: context.state.accentHex).opacity(0.5), radius: 3)

            } compactTrailing: {
                // ─── Compact trailing (right pill half) ────────────────
                if context.state.progress > 0 {
                    // Mini circular progress
                    ZStack {
                        Circle()
                            .trim(from: 0, to: context.state.progress)
                            .stroke(
                                Color(hex: context.state.accentHex),
                                style: StrokeStyle(lineWidth: 2, lineCap: .round)
                            )
                            .frame(width: 14, height: 14)
                            .rotationEffect(.degrees(-90))
                    }
                } else {
                    Text(context.state.icon)
                        .font(.system(size: 12))
                }

            } minimal: {
                // ─── Minimal (small circle, shared with other activities) ──
                Circle()
                    .fill(Color(hex: context.state.accentHex))
                    .frame(width: 8, height: 8)
                    .shadow(color: Color(hex: context.state.accentHex).opacity(0.5), radius: 2)
            }
        }
    }
}

// ─── Lock Screen / Banner View ─────────────────────────────────────────────
struct LockScreenView: View {
    let context: ActivityViewContext<AIAHActivityAttributes>

    var body: some View {
        HStack(spacing: 12) {
            // Orb indicator
            ZStack {
                Circle()
                    .fill(Color(hex: context.state.accentHex).opacity(0.2))
                    .frame(width: 44, height: 44)
                Circle()
                    .fill(Color(hex: context.state.accentHex))
                    .frame(width: 20, height: 20)
                    .shadow(color: Color(hex: context.state.accentHex).opacity(0.5), radius: 6)
            }

            VStack(alignment: .leading, spacing: 3) {
                Text("AIAH")
                    .font(.system(size: 12, weight: .bold, design: .rounded))
                    .foregroundColor(Color(hex: context.state.accentHex))
                Text(context.state.status)
                    .font(.system(size: 15, weight: .medium, design: .rounded))
                    .foregroundColor(.white)
                    .lineLimit(1)
            }

            Spacer()

            if context.state.progress > 0 {
                // Progress ring
                ZStack {
                    Circle()
                        .stroke(Color.white.opacity(0.15), lineWidth: 3)
                        .frame(width: 36, height: 36)
                    Circle()
                        .trim(from: 0, to: context.state.progress)
                        .stroke(
                            Color(hex: context.state.accentHex),
                            style: StrokeStyle(lineWidth: 3, lineCap: .round)
                        )
                        .frame(width: 36, height: 36)
                        .rotationEffect(.degrees(-90))
                    Text(context.state.icon)
                        .font(.system(size: 14))
                }
            } else {
                Text(context.state.icon)
                    .font(.system(size: 28))
            }
        }
        .padding(.horizontal, 16)
        .padding(.vertical, 12)
        .background(Color.black.opacity(0.85))
    }
}

// ─── Color extension for hex strings ───────────────────────────────────────
extension Color {
    init(hex: String) {
        let hex = hex.trimmingCharacters(in: CharacterSet(charactersIn: "#"))
        let scanner = Scanner(string: hex)
        var rgbValue: UInt64 = 0
        scanner.scanHexInt64(&rgbValue)
        let r = Double((rgbValue & 0xFF0000) >> 16) / 255.0
        let g = Double((rgbValue & 0x00FF00) >> 8) / 255.0
        let b = Double(rgbValue & 0x0000FF) / 255.0
        self.init(red: r, green: g, blue: b)
    }
}
