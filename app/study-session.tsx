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
import { useResponsive } from "@/hooks/use-responsive";
import { Card, StudySession as StudySessionType } from "@/lib/types/quizlet";
import { getCardsByProblemSet } from "@/lib/storage/quizlet-storage";
import { createStudySession, getNextCard, recordCardAttempt, isCycleComplete, startNextCycle } from "@/lib/study/study-session-manager";

export default function StudySessionScreen() {
  const router = useRouter();
  const colors = useColors();
  const { problemSetId } = useLocalSearchParams<{ problemSetId: string }>();
  const { width, height, isLandscape, isTablet } = useResponsive();
  
  const [cards, setCards] = useState<Card[]>([]);
  const [session, setSession] = useState<StudySessionType | null>(null);
  const [currentCard, setCurrentCard] = useState<Card | null>(null);
  const [difficulty, setDifficulty] = useState(1);
  const [timeSpent, setTimeSpent] = useState(0);
  const [loading, setLoading] = useState(true);
  const [imageError, setImageError] = useState(false);
  const [isFlipped, setIsFlipped] = useState(false);

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
    setIsFlipped(false);

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
    <ScreenContainer className={isLandscape && isTablet ? "flex-row" : "flex-col"}>
      <ScrollView
        contentContainerStyle={{ flexGrow: 1 }}
        className="flex-1"
      >
        <View className={`flex-1 p-4 gap-4 ${isLandscape && isTablet ? "flex-row" : "flex-col"}`}>
          {/* Problem Area */}
          <View className="flex-1 gap-4">
            <View className="bg-surface rounded-xl overflow-hidden border border-border">
              <View className="bg-muted bg-opacity-10 px-4 py-2 flex-row justify-between items-center">
                <Text className="font-bold text-foreground">Problem {currentCard.problemNumber}</Text>
                <Text className="text-xs text-muted">
                  {Math.floor(timeSpent / 60)}:{String(timeSpent % 60).padStart(2, "0")}
                </Text>
              </View>
              <Image
                source={{ uri: currentCard.problemImageUri }}
                style={{
                  width: "100%",
                  height: isLandscape ? height * 0.6 : 350,
                  resizeMode: "contain",
                }}
                // 고해상도 이미지 대응
                progressiveRenderingEnabled={true}
              />
            </View>

            {!isFlipped && (
              <Pressable
                onPress={() => setIsFlipped(true)}
                className="bg-primary rounded-xl py-4 items-center justify-center shadow-sm"
              >
                <Text className="text-white font-bold text-lg">Show Solution</Text>
              </Pressable>
            )}
          </View>

          {/* Solution Area */}
          {isFlipped && (
            <View className="flex-1 gap-4">
              <View className="bg-surface rounded-xl overflow-hidden border border-primary">
                <View className="bg-primary bg-opacity-10 px-4 py-2 flex-row justify-between items-center">
                  <Text className="font-bold text-primary">Solution</Text>
                  <View className="flex-row gap-1">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <Pressable key={star} onPress={() => setDifficulty(star)}>
                        <MaterialIcons
                          name={star <= difficulty ? "star" : "star-outline"}
                          size={18}
                          color={star <= difficulty ? colors.warning : colors.muted}
                        />
                      </Pressable>
                    ))}
                  </View>
                </View>
                <Image
                  source={{ uri: currentCard.solutionImageUri }}
                  style={{
                    width: "100%",
                    height: isLandscape ? height * 0.6 : 350,
                    resizeMode: "contain",
                  }}
                  progressiveRenderingEnabled={true}
                />
              </View>

              <View className="flex-row gap-3">
                <Pressable
                  onPress={() => handleAnswer(false)}
                  className="flex-1 bg-error rounded-xl py-4 items-center justify-center shadow-sm"
                >
                  <Text className="text-white font-bold text-lg">Incorrect</Text>
                </Pressable>
                <Pressable
                  onPress={() => handleAnswer(true)}
                  className="flex-1 bg-success rounded-xl py-4 items-center justify-center shadow-sm"
                >
                  <Text className="text-white font-bold text-lg">Correct</Text>
                </Pressable>
              </View>
            </View>
          )}
        </View>
      </ScrollView>
    </ScreenContainer>
  );
}
