import { View, Text, Pressable, Image, ScrollView, useWindowDimensions } from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { ScreenContainer } from "@/components/screen-container";
import { MaterialIcons } from "@expo/vector-icons";
import { useColors } from "@/hooks/use-colors";
import { useEffect, useState } from "react";
import { Card, StudySession as StudySessionType } from "@/lib/types/quizlet";
import { getCardsByProblemSet } from "@/lib/storage/quizlet-storage";
import { createStudySession, getNextCard, recordCardAttempt, isCycleComplete, startNextCycle } from "@/lib/study/study-session-manager";

export default function StudySessionScreen() {
  const router = useRouter();
  const colors = useColors();
  const { problemSetId } = useLocalSearchParams<{ problemSetId: string }>();
  const { width, height } = useWindowDimensions();
  
  const [cards, setCards] = useState<Card[]>([]);
  const [session, setSession] = useState<StudySessionType | null>(null);
  const [currentCard, setCurrentCard] = useState<Card | null>(null);
  const [difficulty, setDifficulty] = useState(1);
  const [timeSpent, setTimeSpent] = useState(0);
  const [loading, setLoading] = useState(true);
  const [imageError, setImageError] = useState(false);

  // 가로/세로 모드 감지
  const isLandscape = width > height;
  const isTablet = width > 600;

  useEffect(() => {
    initSession();
  }, []);

  useEffect(() => {
    if (!session) return;
    
    const interval = setInterval(() => {
      setTimeSpent((prev) => prev + 1);
    }, 1000);

    return () => clearInterval(interval);
  }, [session]);

  const initSession = async () => {
    if (!problemSetId) return;

    try {
      const fetchedCards = await getCardsByProblemSet(problemSetId);
      setCards(fetchedCards);

      const newSession = createStudySession(problemSetId, fetchedCards, {
        mode: "sequential",
      });
      setSession(newSession);

      const nextCard = getNextCard(newSession, fetchedCards);
      setCurrentCard(nextCard);
      setImageError(false);
    } catch (error) {
      console.error("Failed to initialize session:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleAnswer = (isCorrect: boolean) => {
    if (!session || !currentCard) return;

    // 카드 결과 기록
    const updatedSession = recordCardAttempt(
      session,
      currentCard.id,
      isCorrect,
      timeSpent,
      difficulty,
      cards
    );

    setSession(updatedSession);
    setTimeSpent(0);
    setDifficulty(1);
    setImageError(false);

    // 다음 카드 가져오기
    if (isCycleComplete(updatedSession)) {
      // 사이클 완료
      const nextCycleSession = startNextCycle(updatedSession, cards);
      setSession(nextCycleSession);

      if (nextCycleSession.endedAt) {
        // 세션 완료
        router.replace({
          pathname: "/session-result" as any,
          params: { sessionId: nextCycleSession.id },
        });
      } else {
        const nextCard = getNextCard(nextCycleSession, cards);
        setCurrentCard(nextCard);
      }
    } else {
      const nextCard = getNextCard(updatedSession, cards);
      setCurrentCard(nextCard);
    }
  };

  if (loading || !session || !currentCard) {
    return (
      <ScreenContainer className="bg-background items-center justify-center">
        <Text className="text-muted">Loading...</Text>
      </ScreenContainer>
    );
  }

  const progress = session.completedCards.length;
  const total = session.cardsInCycle.length + session.completedCards.length;
  const progressPercent = total > 0 ? Math.round((progress / total) * 100) : 0;

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  // 반응형 레이아웃
  const headerHeight = 80;
  const controlsHeight = isLandscape ? 120 : 200;
  const imageHeight = height - headerHeight - controlsHeight - 40;

  return (
    <ScreenContainer className="bg-background" edges={["top", "left", "right", "bottom"]}>
      <View className="flex-1">
        {/* Header */}
        <View className="px-4 py-3 border-b border-border bg-surface">
          <View className="flex-row items-center justify-between mb-2">
            <View className="flex-1">
              <Text className="text-lg font-semibold text-foreground" numberOfLines={1}>
                Problem {currentCard.problemNumber}
              </Text>
              <Text className="text-xs text-muted mt-1">
                {progress} / {total}
              </Text>
            </View>
            <Pressable onPress={() => router.back()} className="p-2 active:opacity-60">
              <MaterialIcons name="close" size={24} color={colors.foreground} />
            </Pressable>
          </View>
          {/* Progress Bar */}
          <View className="bg-border rounded-full h-1.5 overflow-hidden">
            <View
              className="bg-primary h-full"
              style={{ width: `${progressPercent}%` }}
            />
          </View>
        </View>

        {/* Main Content - Responsive Layout */}
        {isLandscape ? (
          // 가로 모드: 이미지와 컨트롤 좌우 배치
          <View className="flex-1 flex-row gap-4 p-4">
            {/* Problem Image */}
            <View className="flex-1 bg-surface rounded-lg overflow-hidden border border-border">
              {currentCard.problemImageUri && !imageError ? (
                <Image
                  source={{ uri: currentCard.problemImageUri }}
                  style={{ width: "100%", height: "100%" }}
                  resizeMode="contain"
                  onError={() => setImageError(true)}
                />
              ) : (
                <View className="flex-1 items-center justify-center gap-2">
                  <MaterialIcons name="image-not-supported" size={40} color={colors.muted} />
                  <Text className="text-xs text-muted text-center px-2">
                    {imageError ? "Failed to load image" : "No image available"}
                  </Text>
                </View>
              )}
            </View>

            {/* Controls */}
            <ScrollView className="flex-1 gap-3">
              {/* Timer */}
              <View className="bg-surface rounded-lg p-3 border border-border">
                <Text className="text-xs text-muted mb-1">Time Spent</Text>
                <Text className="text-xl font-bold text-foreground">
                  {formatTime(timeSpent)}
                </Text>
              </View>

              {/* Difficulty */}
              <View className="bg-surface rounded-lg p-3 border border-border">
                <Text className="text-xs text-muted mb-2">Difficulty</Text>
                <View className="flex-row gap-1">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <Pressable
                      key={star}
                      onPress={() => setDifficulty(star)}
                      className="flex-1 p-1 active:opacity-70"
                    >
                      <MaterialIcons
                        name={star <= difficulty ? "star" : "star-outline"}
                        size={24}
                        color={star <= difficulty ? colors.warning : colors.border}
                      />
                    </Pressable>
                  ))}
                </View>
              </View>

              {/* Buttons */}
              <Pressable
                onPress={() => handleAnswer(false)}
                className="bg-error rounded-lg py-2 items-center justify-center active:opacity-80"
              >
                <Text className="text-white text-sm font-semibold">Incorrect</Text>
              </Pressable>
              <Pressable
                onPress={() => handleAnswer(true)}
                className="bg-success rounded-lg py-2 items-center justify-center active:opacity-80"
              >
                <Text className="text-white text-sm font-semibold">Correct</Text>
              </Pressable>

              {/* Solution Button */}
              <Pressable className="py-2 items-center justify-center active:opacity-70 mt-2">
                <Text className="text-primary text-sm font-semibold">View Solution</Text>
              </Pressable>
            </ScrollView>
          </View>
        ) : (
          // 세로 모드: 이미지 위, 컨트롤 아래
          <>
            {/* Problem Image */}
            <View className="flex-1 px-4 py-3 items-center justify-center bg-surface rounded-lg m-4 border border-border overflow-hidden">
              {currentCard.problemImageUri && !imageError ? (
                <Image
                  source={{ uri: currentCard.problemImageUri }}
                  style={{ width: "100%", height: "100%" }}
                  resizeMode="contain"
                  onError={() => setImageError(true)}
                />
              ) : (
                <View className="items-center gap-2">
                  <MaterialIcons name="image-not-supported" size={48} color={colors.muted} />
                  <Text className="text-sm text-muted text-center">
                    {imageError ? "Failed to load image" : "No image available"}
                  </Text>
                </View>
              )}
            </View>

            {/* Controls */}
            <ScrollView className="px-4 pb-4 gap-3">
              {/* Timer & Difficulty Row */}
              <View className="flex-row gap-3">
                <View className="flex-1 bg-surface rounded-lg p-3 border border-border">
                  <Text className="text-xs text-muted mb-1">Time Spent</Text>
                  <Text className="text-lg font-bold text-foreground">
                    {formatTime(timeSpent)}
                  </Text>
                </View>

                <View className="flex-1 bg-surface rounded-lg p-3 border border-border">
                  <Text className="text-xs text-muted mb-2">Difficulty</Text>
                  <View className="flex-row gap-1">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <Pressable
                        key={star}
                        onPress={() => setDifficulty(star)}
                        className="flex-1 p-1 active:opacity-70"
                      >
                        <MaterialIcons
                          name={star <= difficulty ? "star" : "star-outline"}
                          size={20}
                          color={star <= difficulty ? colors.warning : colors.border}
                        />
                      </Pressable>
                    ))}
                  </View>
                </View>
              </View>

              {/* Buttons */}
              <View className="flex-row gap-3">
                <Pressable
                  onPress={() => handleAnswer(false)}
                  className="flex-1 bg-error rounded-lg py-3 items-center justify-center active:opacity-80"
                >
                  <Text className="text-white font-semibold">Incorrect</Text>
                </Pressable>
                <Pressable
                  onPress={() => handleAnswer(true)}
                  className="flex-1 bg-success rounded-lg py-3 items-center justify-center active:opacity-80"
                >
                  <Text className="text-white font-semibold">Correct</Text>
                </Pressable>
              </View>

              {/* Solution Button */}
              <Pressable className="py-3 items-center justify-center active:opacity-70 border border-primary rounded-lg">
                <Text className="text-primary font-semibold">View Solution</Text>
              </Pressable>
            </ScrollView>
          </>
        )}
      </View>
    </ScreenContainer>
  );
}
