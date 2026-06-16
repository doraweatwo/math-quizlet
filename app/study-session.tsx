import { View, Text, Pressable, Image } from "react-native";
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
  
  const [cards, setCards] = useState<Card[]>([]);
  const [session, setSession] = useState<StudySessionType | null>(null);
  const [currentCard, setCurrentCard] = useState<Card | null>(null);
  const [difficulty, setDifficulty] = useState(1);
  const [timeSpent, setTimeSpent] = useState(0);
  const [loading, setLoading] = useState(true);

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

  return (
    <ScreenContainer className="bg-background">
      <View className="flex-1">
        {/* Header */}
        <View className="px-6 py-4 border-b border-border">
          <View className="flex-row items-center justify-between mb-2">
            <Text className="text-lg font-semibold text-foreground">
              Problem {currentCard.problemNumber}
            </Text>
            <Pressable onPress={() => router.back()}>
              <MaterialIcons name="close" size={24} color={colors.foreground} />
            </Pressable>
          </View>
          <View className="bg-border rounded-full h-2 overflow-hidden">
            <View
              className="bg-primary h-full"
              style={{ width: `${progressPercent}%` }}
            />
          </View>
          <Text className="text-xs text-muted mt-2">
            {progress} / {total}
          </Text>
        </View>

        {/* Problem Image */}
        <View className="flex-1 px-6 py-6 items-center justify-center">
          {currentCard.problemImageUri ? (
            <Image
              source={{ uri: currentCard.problemImageUri }}
              className="w-full h-full rounded-lg"
              resizeMode="contain"
            />
          ) : (
            <View className="items-center gap-2">
              <MaterialIcons name="image-not-supported" size={48} color={colors.muted} />
              <Text className="text-muted">Problem image not available</Text>
            </View>
          )}
        </View>

        {/* Timer & Difficulty */}
        <View className="px-6 py-4 border-t border-border gap-4">
          {/* Timer */}
          <View className="flex-row items-center justify-between">
            <Text className="text-sm text-muted">Time Spent:</Text>
            <Text className="text-lg font-semibold text-foreground">
              {formatTime(timeSpent)}
            </Text>
          </View>

          {/* Difficulty Stars */}
          <View className="gap-2">
            <Text className="text-sm text-muted">Difficulty:</Text>
            <View className="flex-row gap-2">
              {[1, 2, 3, 4, 5].map((star) => (
                <Pressable
                  key={star}
                  onPress={() => setDifficulty(star)}
                  className="active:opacity-70"
                >
                  <MaterialIcons
                    name={star <= difficulty ? "star" : "star-outline"}
                    size={32}
                    color={star <= difficulty ? colors.warning : colors.border}
                  />
                </Pressable>
              ))}
            </View>
          </View>

          {/* Buttons */}
          <View className="flex-row gap-3 mt-4">
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

          {/* Show Solution */}
          <Pressable className="py-2 items-center justify-center active:opacity-70">
            <Text className="text-primary font-semibold">View Solution</Text>
          </Pressable>
        </View>
      </View>
    </ScreenContainer>
  );
}
