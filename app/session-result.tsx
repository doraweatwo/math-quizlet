import { View, Text, Pressable } from "react-native";
import { useRouter } from "expo-router";
import { ScreenContainer } from "@/components/screen-container";
import { MaterialIcons } from "@expo/vector-icons";
import { useColors } from "@/hooks/use-colors";

export default function SessionResultScreen() {
  const router = useRouter();
  const colors = useColors();

  // TODO: sessionId 파라미터에서 세션 데이터 로드

  const stats = {
    correctRate: 85,
    totalTime: 1200,
    averageTime: 120,
    correctCards: 17,
    totalCards: 20,
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  return (
    <ScreenContainer className="bg-background px-6 py-8">
      <View className="flex-1 items-center justify-center gap-8">
        {/* Success Icon */}
        <View className="items-center gap-4">
          <View className="w-20 h-20 rounded-full bg-success items-center justify-center">
            <MaterialIcons name="check" size={48} color="white" />
          </View>
          <Text className="text-3xl font-bold text-foreground">Session Complete!</Text>
        </View>

        {/* Stats */}
        <View className="w-full bg-surface border border-border rounded-lg p-6 gap-4">
          {/* Correct Rate */}
          <View className="items-center gap-2">
            <Text className="text-sm text-muted">Correct Rate</Text>
            <Text className="text-4xl font-bold text-success">{stats.correctRate}%</Text>
            <Text className="text-sm text-muted">
              {stats.correctCards} / {stats.totalCards} correct
            </Text>
          </View>

          {/* Divider */}
          <View className="h-px bg-border" />

          {/* Time Stats */}
          <View className="flex-row gap-4">
            <View className="flex-1 items-center gap-1">
              <Text className="text-xs text-muted">Total Time</Text>
              <Text className="text-lg font-semibold text-foreground">
                {formatTime(stats.totalTime)}
              </Text>
            </View>
            <View className="w-px bg-border" />
            <View className="flex-1 items-center gap-1">
              <Text className="text-xs text-muted">Avg per Card</Text>
              <Text className="text-lg font-semibold text-foreground">
                {formatTime(stats.averageTime)}
              </Text>
            </View>
          </View>
        </View>

        {/* Buttons */}
        <View className="w-full flex-row gap-3 mt-auto">
          <Pressable
            onPress={() => router.replace("/(tabs)")}
            className="flex-1 bg-surface border border-border rounded-lg py-3 items-center justify-center active:opacity-70"
          >
            <Text className="font-semibold text-foreground">Home</Text>
          </Pressable>
          <Pressable
            onPress={() => {}}
            className="flex-1 bg-primary rounded-lg py-3 items-center justify-center active:opacity-80"
          >
            <Text className="font-semibold text-white">Review Mistakes</Text>
          </Pressable>
        </View>
      </View>
    </ScreenContainer>
  );
}
