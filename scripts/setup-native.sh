#!/bin/bash
# ─────────────────────────────────────────────────────────────
# AIAH Native App Setup Script
# Run this on your Mac to generate the full Xcode + Android projects.
# ─────────────────────────────────────────────────────────────

set -e

echo "🚀 Setting up AIAH as a native app..."
echo ""

# 1. Install Capacitor dependencies
echo "📦 Installing Capacitor packages..."
npm install @capacitor/core @capacitor/cli
npm install @capacitor/ios @capacitor/android
npm install @capacitor/splash-screen @capacitor/status-bar @capacitor/push-notifications @capacitor/haptics @capacitor/keyboard

# 2. Build the Next.js app (needed for Capacitor to copy web assets)
echo "🔨 Building web app..."
npm run build

# 3. Create a minimal 'out' directory for Capacitor
# Since we use server: { url: "https://aiah.app" }, Capacitor loads
# from the server. But it still needs a local fallback index.html.
mkdir -p out
cat > out/index.html << 'HTMLEOF'
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>AIAH</title>
  <style>
    body { background: #0a0f0d; display: flex; align-items: center; justify-content: center; height: 100vh; margin: 0; }
    .loader { width: 40px; height: 40px; border: 3px solid rgba(29,158,117,0.3); border-top-color: #1D9E75; border-radius: 50%; animation: spin 1s linear infinite; }
    @keyframes spin { to { transform: rotate(360deg); } }
  </style>
</head>
<body>
  <div class="loader"></div>
  <script>
    // Redirect to the live server
    window.location.href = "https://aiah.app";
  </script>
</body>
</html>
HTMLEOF

# 4. Add iOS platform (generates the Xcode project)
echo "🍎 Adding iOS platform..."
npx cap add ios 2>/dev/null || echo "iOS platform already exists"

# 5. Add Android platform
echo "🤖 Adding Android platform..."
npx cap add android 2>/dev/null || echo "Android platform already exists"

# 6. Sync web assets + plugins to native projects
echo "🔄 Syncing to native projects..."
npx cap sync

# 7. Copy our custom Swift files into the iOS project
echo "📋 Setting up Dynamic Island widget extension..."
echo ""
echo "═══════════════════════════════════════════════════════════"
echo "  ✅ Native projects generated!"
echo ""
echo "  Next steps:"
echo ""
echo "  iOS:"
echo "    1. npx cap open ios"
echo "    2. In Xcode → Sign in with Apple ID → Select team"
echo "    3. File → New → Target → Widget Extension → 'AIAHWidgets'"
echo "    4. Copy the Swift files from ios/App/AIAHWidgets/ into the new target"
echo "    5. Enable 'Supports Live Activities' in target capabilities"
echo "    6. Build & run on your iPhone"
echo ""
echo "  Android:"
echo "    1. npx cap open android"
echo "    2. Build & run in Android Studio"
echo ""
echo "  App Store / Play Store:"
echo "    • Apple Developer: https://developer.apple.com/programs/"
echo "    • Google Play Console: https://play.google.com/console"
echo "═══════════════════════════════════════════════════════════"
