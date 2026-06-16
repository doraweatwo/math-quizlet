import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  Pressable,
  ScrollView,
  useWindowDimensions,
  Image,
  ActivityIndicator,
} from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { ScreenContainer } from "@/components/screen-container";
import { MaterialIcons } from "@expo/vector-icons";
import { useColors } from "@/hooks/use-colors";
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

      const next = getNextCard(newSession, fetchedCards);
      if (next) {
        setCurrentCard(next);
      }
    } catch (error) {
      console.error("Failed to init session:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleAnswer = (isCorrect: boolean) => {
    if (!session || !currentCard) return;

    const updatedSession = recordCardAttempt(session, currentCard.id, isCorrect, timeSpent, difficulty, cards);
    setSession(updatedSession);
    setTimeSpent(0);
    setDifficulty(1);

    if (isCycleComplete(updatedSession)) {
      const nextCycleSession = startNextCycle(updatedSession, cards);
      setSession(nextCycleSession);
    }

    const next = getNextCard(updatedSession, cards);
    if (next) {
      setCurrentCard(next);
    } else {
      router.push({
        pathname: "/session-result" as any,
        params: { sessionId: updatedSession.id },
      });
    }
  };

  if (loading) {
    return (
      <ScreenContainer className="items-center justify-center">
        <ActivityIndicator size="large" color={colors.primary} />
      </ScreenContainer>
    );
  }

  if (!currentCard) {
    return (
      <ScreenContainer className="items-center justify-center gap-4">
        <Text className="text-lg text-foreground">No cards available</Text>
        <Pressable
          onPress={() => router.back()}
          className="bg-primary px-6 py-3 rounded-lg"
        >
          <Text className="text-white font-semibold">Go Back</Text>
        </Pressable>
      </ScreenContainer>
    );
  }

  return (
    <ScreenContainer className={isLandscape ? "flex-row" : "flex-col"}>
      <ScrollView
        contentContainerStyle={{ flexGrow: 1 }}
        className={isLandscape ? "flex-1 pr-4" : "flex-1"}
      >
        <View className={`flex-1 ${isLandscape ? "justify-center" : "justify-start pt-4"} gap-4`}>
          {/* Problem Image */}
          {currentCard.problemImageUri ? (
            <View className="bg-surface rounded-lg overflow-hidden">
              <Image
                source={{ uri: currentCard.problemImageUri }}
                style={{
                  width: "100%",
                  height: isLandscape ? 300 : 400,
                  resizeMode: "contain",
                }}
                onError={() => setImageError(true)}
              />
            </View>
          ) : imageError ? (
            <View className="bg-surface rounded-lg p-4 items-center justify-center h-64">
              <MaterialIcons name="image-not-supported" size={48} color={colors.muted} />
              <Text className="text-muted mt-2">Image not available</Text>
            </View>
          ) : null}

          {/* Problem Number */}
          <View className="bg-primary bg-opacity-10 rounded-lg p-3 items-center">
            <Text className="text-sm text-muted">Problem</Text>
            <Text className="text-2xl font-bold text-primary">{currentCard.problemNumber}</Text>
          </View>

          {/* Timer & Stats */}
          <View className="flex-row gap-3 justify-between">
            <View className="flex-1 bg-surface rounded-lg p-3 items-center">
              <Text className="text-xs text-muted">Time</Text>
              <Text className="text-lg font-semibold text-foreground">
                {Math.floor(timeSpent / 60)}:{String(timeSpent % 60).padStart(2, "0")}
              </Text>
            </View>
            <View className="flex-1 bg-surface rounded-lg p-3 items-center">
              <Text className="text-xs text-muted">Difficulty</Text>
              <View className="flex-row gap-1 mt-1">
                {[1, 2, 3, 4, 5].map((star) => (
                  <Pressable
                    key={star}
                    onPress={() => setDifficulty(star)}
                  >
                    <MaterialIcons
                      name={star <= difficulty ? "star" : "star-outline"}
                      size={16}
                      color={star <= difficulty ? colors.warning : colors.muted}
                    />
                  </Pressable>
                ))}
              </View>
            </View>
          </View>
        </View>
      </ScrollView>

      {/* Action Buttons */}
      <View className={`${isLandscape ? "w-32 justify-center" : "px-4 py-4 border-t border-border"} gap-3`}>
        <Pressable
          onPress={() => handleAnswer(false)}
          className="bg-error rounded-lg py-3 items-center justify-center active:opacity-80"
        >
          <Text className="text-white font-semibold">Incorrect</Text>
        </Pressable>
        <Pressable
          onPress={() => handleAnswer(true)}
          className="bg-success rounded-lg py-3 items-center justify-center active:opacity-80"
        >
          <Text className="text-white font-semibold">Correct</Text>
        </Pressable>
      </View>
    </ScreenContainer>
  );
}
