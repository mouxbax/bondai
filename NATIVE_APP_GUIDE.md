# AIAH Native App Setup Guide

## Prerequisites
- macOS with Xcode 15+ installed (free from App Store)
- Apple Developer Account ($99/year) — https://developer.apple.com/programs/
- Android Studio (optional, for Android) — https://developer.android.com/studio
- Google Play Console ($25 one-time) — https://play.google.com/console
- Node.js 20.x installed

## Quick Start

```bash
cd ~/Documents/bondai
npm run native:setup
```

This installs Capacitor, generates the iOS and Android projects, and syncs everything.

## iOS Setup (iPhone App + Dynamic Island)

### 1. Open in Xcode
```bash
npm run native:ios
```

### 2. Configure Signing
- In Xcode, select the **App** target
- Go to **Signing & Capabilities**
- Select your Team (Apple Developer account)
- Bundle Identifier: `app.aiah.companion`

### 3. Add the Widget Extension (Dynamic Island)
- File > New > Target
- Choose **Widget Extension**
- Product Name: `AIAHWidgets`
- Check **Include Live Activity**
- Finish

Then:
- Delete the auto-generated Swift files in the new target
- Drag the files from `ios/App/AIAHWidgets/` into the AIAHWidgets group in Xcode:
  - `AIAHWidgetsBundle.swift`
  - `AIAHLiveActivity.swift`
  - `Info.plist`
- Set the Widget Extension bundle ID to: `app.aiah.companion.widgets`
- In the AIAHWidgets target > Signing & Capabilities, select your Team
- In the main App target > General > Frameworks, add `AIAHWidgets.appex`

### 4. Register the Capacitor Plugin
Open `ios/App/App/AppDelegate.swift` and add:
```swift
import Capacitor

// Inside application(_:didFinishLaunchingWithOptions:)
bridge?.registerPluginInstance(LiveActivityPlugin())
```

### 5. Add URL Scheme (Deep Links from Dynamic Island)
- Select the App target > Info > URL Types
- Click +
- URL Schemes: `aiah`
- Identifier: `app.aiah.companion`

### 6. Build & Run
- Connect your iPhone via cable or WiFi
- Select your device in the top bar
- Press Cmd+R to build and run
- The app loads from https://aiah.app with native capabilities

### 7. TestFlight (Beta Testing)
- Product > Archive
- Distribute App > App Store Connect
- Upload
- Go to https://appstoreconnect.apple.com
- Create a new app, fill in metadata
- Add the build to TestFlight
- Share the TestFlight link

## Android Setup

### 1. Open in Android Studio
```bash
npm run native:android
```

### 2. Configure Signing
- Build > Generate Signed Bundle
- Create a new keystore (save it securely!)
- Build the release APK or AAB

### 3. Build & Run
- Connect Android device via USB
- Enable Developer Mode on the phone
- Press Run in Android Studio

### 4. Google Play
- Go to https://play.google.com/console
- Create a new app
- Upload the AAB file
- Fill in store listing, screenshots, etc.

## Updating the App

After making code changes to the web app:
```bash
# The native app loads from aiah.app, so web changes are instant.
# Only run sync if you changed Capacitor config or plugins:
npm run native:sync
```

Since AIAH uses server-side rendering (loads from aiah.app), most updates are instant — no need to rebuild the native app. You only need to rebuild and resubmit when:
- Adding new native plugins
- Changing the Capacitor config
- Updating the splash screen or app icon
- Apple/Google requires a new binary

## App Store Assets Needed
- App Icon: 1024x1024 PNG (no transparency, no rounded corners)
- Screenshots: iPhone 6.7" (1290x2796), iPad 12.9" (2048x2732)
- Description, keywords, privacy policy URL
- Age rating questionnaire

## Architecture

```
Web App (aiah.app on Vercel)
    ↕ loaded in native WebView
Capacitor Shell (iOS/Android)
    ↕ JS bridge
Native Plugins (Dynamic Island, Push, Haptics)
```

The web app runs on Vercel as before. The native shell wraps it with access to device APIs. Updates to the web app are instant — no App Store review needed for web changes.
