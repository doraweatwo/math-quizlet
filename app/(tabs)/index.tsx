import { ScrollView, View, Text, Pressable, FlatList } from "react-native";
import { useEffect, useState } from "react";
import { ScreenContainer } from "@/components/screen-container";
import { useRouter } from "expo-router";
import { ProblemSet } from "@/lib/types/quizlet";
import { getAllProblemSets, deleteProblemSet, initializeDatabase } from "@/lib/storage/quizlet-storage";
import { MaterialIcons } from "@expo/vector-icons";
import { useColors } from "@/hooks/use-colors";

export default function HomeScreen() {
  const router = useRouter();
  const colors = useColors();
  const [problemSets, setProblemSets] = useState<ProblemSet[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    initDB();
  }, []);

  const initDB = async () => {
    try {
      await initializeDatabase();
      await loadProblemSets();
    } catch (error) {
      console.error("Failed to initialize database:", error);
    } finally {
      setLoading(false);
    }
  };

  const loadProblemSets = async () => {
    try {
      const sets = await getAllProblemSets();
      setProblemSets(sets);
    } catch (error) {
      console.error("Failed to load problem sets:", error);
    }
  };

  const handleAddProblemSet = () => {
    router.push("/pdf-upload" as any);
  };

  const handleStudy = (setId: string) => {
    router.push({
      pathname: "/study-session" as any,
      params: { problemSetId: setId },
    });
  };

  const handleDelete = async (setId: string) => {
    try {
      await deleteProblemSet(setId);
      await loadProblemSets();
    } catch (error) {
      console.error("Failed to delete problem set:", error);
    }
  };

  const formatDate = (timestamp: number) => {
    const date = new Date(timestamp);
    return date.toLocaleDateString("ko-KR", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  return (
    <ScreenContainer className="bg-background">
      <View className="flex-1">
        {/* Header */}
        <View className="px-6 py-4 border-b border-border">
          <Text className="text-3xl font-bold text-foreground">My Problem Sets</Text>
          <Text className="text-sm text-muted mt-1">
            {problemSets.length} {problemSets.length === 1 ? "set" : "sets"}
          </Text>
        </View>

        {/* Problem Sets List */}
        {loading ? (
          <View className="flex-1 items-center justify-center">
            <Text className="text-muted">Loading...</Text>
          </View>
        ) : problemSets.length === 0 ? (
          <ScrollView
            contentContainerStyle={{ flexGrow: 1 }}
            className="flex-1 px-6 py-8"
          >
            <View className="flex-1 items-center justify-center gap-4">
              <MaterialIcons name="description" size={64} color={colors.muted} />
              <Text className="text-lg font-semibold text-foreground">
                No Problem Sets Yet
              </Text>
              <Text className="text-sm text-muted text-center">
                Import a PDF to get started with your math practice
              </Text>
              <Pressable
                onPress={handleAddProblemSet}
                className="mt-4 bg-primary px-8 py-3 rounded-full active:opacity-80"
              >
                <Text className="text-white font-semibold">Import PDF</Text>
              </Pressable>
            </View>
          </ScrollView>
        ) : (
          <FlatList
            data={problemSets}
            keyExtractor={(item) => item.id}
            contentContainerStyle={{ padding: 16, gap: 12 }}
            renderItem={({ item }) => (
              <Pressable
                onPress={() => handleStudy(item.id)}
                className="bg-surface rounded-lg p-4 border border-border active:opacity-70"
              >
                <View className="flex-row items-center justify-between">
                  <View className="flex-1">
                    <Text className="text-lg font-semibold text-foreground">
                      {item.title}
                    </Text>
                    <Text className="text-sm text-muted mt-1">
                      {item.totalCards} cards
                    </Text>
                    {item.lastStudiedAt && (
                      <Text className="text-xs text-muted mt-1">
                        Last studied: {formatDate(item.lastStudiedAt)}
                      </Text>
                    )}
                  </View>
                  <Pressable
                    onPress={() => handleDelete(item.id)}
                    className="p-2 active:opacity-60"
                  >
                    <MaterialIcons name="delete-outline" size={24} color={colors.error} />
                  </Pressable>
                </View>
              </Pressable>
            )}
          />
        )}

        {/* Add Button */}
        <View className="px-6 py-4 border-t border-border">
          <Pressable
            onPress={handleAddProblemSet}
            className="bg-primary rounded-lg py-3 items-center justify-center active:opacity-80"
          >
            <View className="flex-row items-center gap-2">
              <MaterialIcons name="add" size={24} color="white" />
              <Text className="text-white font-semibold">Import New PDF</Text>
            </View>
          </Pressable>
        </View>
      </View>
    </ScreenContainer>
  );
}
