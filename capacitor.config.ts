import type { CapacitorConfig } from "@capacitor/cli";

const config: CapacitorConfig = {
  appId: "app.aiah.companion",
  appName: "AIAH",
  // Point to the hosted web app — not a static export.
  // This lets us keep all server-side features (API routes, auth, Prisma).
  server: {
    url: "https://aiah.app",
    cleartext: false,
  },
  ios: {
    scheme: "AIAH",
    contentInset: "automatic",
    preferredContentMode: "mobile",
    backgroundColor: "#0a0f0d",
    allowsLinkPreview: false,
  },
  android: {
    backgroundColor: "#0a0f0d",
    allowMixedContent: false,
  },
  plugins: {
    SplashScreen: {
      launchAutoHide: true,
      launchShowDuration: 1500,
      backgroundColor: "#0a0f0d",
      androidSplashResourceName: "splash",
      showSpinner: false,
    },
    StatusBar: {
      style: "DARK",
      backgroundColor: "#0a0f0d",
    },
    PushNotifications: {
      presentationOptions: ["badge", "sound", "alert"],
    },
  },
};

export default config;
