import { View, Text, Pressable, ScrollView, useWindowDimensions } from "react-native";
import { useRouter } from "expo-router";
import { ScreenContainer } from "@/components/screen-container";
import { MaterialIcons } from "@expo/vector-icons";
import { useColors } from "@/hooks/use-colors";

export default function SessionResultScreen() {
  const router = useRouter();
  const colors = useColors();
  const { width } = useWindowDimensions();
  
  const isTablet = width > 600;

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
    <ScreenContainer className="bg-background">
      <ScrollView contentContainerStyle={{ flexGrow: 1 }} className="px-6 py-8">
        <View className="flex-1 items-center justify-center gap-8">
          {/* Success Icon */}
          <View className="items-center gap-4">
            <View className="w-20 h-20 rounded-full bg-success items-center justify-center">
              <MaterialIcons name="check" size={48} color="white" />
            </View>
            <View className="items-center gap-1">
              <Text className="text-3xl font-bold text-foreground">Session Complete!</Text>
              <Text className="text-sm text-muted">Great job! Keep practicing</Text>
            </View>
          </View>

          {/* Stats Grid */}
          <View className={`w-full gap-4 ${isTablet ? "flex-row flex-wrap" : ""}`}>
            {/* Correct Rate */}
            <View className={`bg-surface border border-border rounded-lg p-6 items-center gap-2 ${isTablet ? "flex-1" : ""}`}>
              <Text className="text-sm text-muted">Correct Rate</Text>
              <Text className="text-4xl font-bold text-success">{stats.correctRate}%</Text>
              <Text className="text-xs text-muted">
                {stats.correctCards} / {stats.totalCards} correct
              </Text>
            </View>

            {/* Total Time */}
            <View className={`bg-surface border border-border rounded-lg p-6 items-center gap-2 ${isTablet ? "flex-1" : ""}`}>
              <Text className="text-sm text-muted">Total Time</Text>
              <Text className="text-2xl font-bold text-foreground">
                {formatTime(stats.totalTime)}
              </Text>
              <Text className="text-xs text-muted">
                Avg {formatTime(stats.averageTime)}/card
              </Text>
            </View>
          </View>

          {/* Breakdown */}
          <View className="w-full bg-surface border border-border rounded-lg p-6 gap-4">
            <Text className="text-lg font-semibold text-foreground">Session Breakdown</Text>
            
            <View className="gap-3">
              <View className="flex-row items-center justify-between">
                <View className="flex-row items-center gap-2">
                  <MaterialIcons name="check-circle" size={20} color={colors.success} />
                  <Text className="text-sm text-foreground">Correct</Text>
                </View>
                <Text className="font-semibold text-foreground">{stats.correctCards}</Text>
              </View>
              
              <View className="flex-row items-center justify-between">
                <View className="flex-row items-center gap-2">
                  <MaterialIcons name="cancel" size={20} color={colors.error} />
                  <Text className="text-sm text-foreground">Incorrect</Text>
                </View>
                <Text className="font-semibold text-foreground">
                  {stats.totalCards - stats.correctCards}
                </Text>
              </View>
            </View>
          </View>

          {/* Spacer */}
          <View className="flex-1" />

          {/* Buttons */}
          <View className="w-full gap-3">
            <Pressable
              onPress={() => router.replace("/(tabs)" as any)}
              className="bg-surface border border-border rounded-lg py-3 items-center justify-center active:opacity-70"
            >
              <View className="flex-row items-center gap-2">
                <MaterialIcons name="home" size={20} color={colors.foreground} />
                <Text className="font-semibold text-foreground">Back to Home</Text>
              </View>
            </Pressable>
            <Pressable
              onPress={() => {}}
              className="bg-primary rounded-lg py-3 items-center justify-center active:opacity-80"
            >
              <View className="flex-row items-center gap-2">
                <MaterialIcons name="replay" size={20} color="white" />
                <Text className="font-semibold text-white">Review Mistakes</Text>
              </View>
            </Pressable>
          </View>
        </View>
      </ScrollView>
    </ScreenContainer>
  );
}
