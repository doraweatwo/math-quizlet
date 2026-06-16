import type { ExpoConfig } from "expo/config";

const config: ExpoConfig = {
  name: "Math Quizlet",
  slug: "math-quizlet",
  version: "1.0.0",
  orientation: "portrait",
  icon: "./assets/images/icon.png",
  scheme: "mathquizlet",
  userInterfaceStyle: "automatic",
  newArchEnabled: false,
  ios: {
    supportsTablet: true,
    bundleIdentifier: "com.dorawea.mathquizlet",
  },
  android: {
    adaptiveIcon: {
      backgroundColor: "#ffffff",
      foregroundImage: "./assets/images/icon.png",
    },
    package: "com.dorawea.mathquizlet",
  },
  extra: {
    eas: {
      projectId: "ebff0638-42b3-4434-bc61-aeab79518b89",
    },
  },
  plugins: [
    "expo-router",
    "react-native-reanimated/plugin",
  ],
};

export default config;
