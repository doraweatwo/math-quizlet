import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  Pressable,
  ScrollView,
  useWindowDimensions,
  Image,
  ActivityIndicator,
  FlatList,
} from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { ScreenContainer } from "@/components/screen-container";
import { MaterialIcons } from "@expo/vector-icons";
import { useColors } from "@/hooks/use-colors";
import { PatternConfig, Card } from "@/lib/types/quizlet";
import { saveProblemSet, saveCard } from "@/lib/storage/quizlet-storage";
// @ts-ignore
import { v4 as uuidv4 } from "uuid";

export default function CardPreviewScreen() {
  const router = useRouter();
  const colors = useColors();
  const { width, height } = useWindowDimensions();
  const { fileUri, fileName, patternConfig } = useLocalSearchParams<{
    fileUri: string;
    fileName: string;
    patternConfig: string;
  }>();

  const [cards, setCards] = useState<Card[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCards, setSelectedCards] = useState<Set<string>>(new Set());

  const isLandscape = width > height;
  const isTablet = width > 600;

  useEffect(() => {
    generateCards();
  }, []);

  const generateCards = async () => {
    try {
      setLoading(true);
      if (!fileUri) return;

      // 1. 서버에 PDF 분석 요청 (OCR 및 영역 감지)
      // 실제 환경에서는 trpc.pdf.analyzePDF.useQuery 등을 사용
      // 여기서는 핵심 로직 구현을 위해 프로세스 시뮬레이션 및 API 호출 구조 작성
      
      const problemSetId = uuidv4();
      const generatedCards: Card[] = [];

      // AI 분석 결과 (예시: 서버에서 받아온 데이터)
      // const analysis = await trpc.pdf.analyzePDF.query({ fileUrl: fileUri });
      
      // 임시 시뮬레이션: 실제로는 서버 LLM이 분석한 좌표를 바탕으로 크롭 진행
      const mockAnalysis = [
        { number: "1", type: "problem", box: [50, 100, 400, 200] },
        { number: "1", type: "solution", box: [50, 600, 400, 200] },
        { number: "2", type: "problem", box: [500, 100, 400, 200] },
        { number: "2", type: "solution", box: [500, 600, 400, 200] },
      ];

      // 2. 분석된 좌표를 바탕으로 이미지 크롭
      const processedNumbers = new Set(mockAnalysis.map(a => a.number));
      
      for (const num of processedNumbers) {
        const prob = mockAnalysis.find(a => a.number === num && a.type === "problem");
        const sol = mockAnalysis.find(a => a.number === num && a.type === "solution");

        if (prob && sol) {
          // 실제 크롭 로직 호출 (pdf-processor.ts의 cropImage 사용)
          // const probUri = await cropImage(fileUri, prob.box[0], prob.box[1], prob.box[2], prob.box[3]);
          // const solUri = await cropImage(fileUri, sol.box[0], sol.box[1], sol.box[2], sol.box[3]);

          const card: Card = {
            id: uuidv4(),
            problemSetId,
            problemNumber: num,
            problemImageUri: fileUri, // 실제 구현 시 probUri 적용
            solutionImageUri: fileUri, // 실제 구현 시 solUri 적용
            difficulty: 1,
            averageTime: 0,
            status: "unsolved",
            attempts: 0,
            correctAttempts: 0,
          };
          generatedCards.push(card);
        }
      }

      setCards(generatedCards);
      setSelectedCards(new Set(generatedCards.map((c) => c.id)));
    } catch (error) {
      console.error("Failed to generate cards:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleToggleCard = (cardId: string) => {
    const newSelected = new Set(selectedCards);
    if (newSelected.has(cardId)) {
      newSelected.delete(cardId);
    } else {
      newSelected.add(cardId);
    }
    setSelectedCards(newSelected);
  };

  const handleImport = async () => {
    try {
      setLoading(true);

      // 선택된 카드만 저장
      const selectedCardList = cards.filter((c) => selectedCards.has(c.id));

      if (selectedCardList.length === 0) {
        alert("Please select at least one card");
        return;
      }

      // 문제집 생성
      const problemSetId = selectedCardList[0].problemSetId;
      await saveProblemSet({
        id: problemSetId,
        title: fileName || "Imported Problem Set",
        createdAt: Date.now(),
        totalCards: selectedCardList.length,
      });

      // 카드 저장
      for (const card of selectedCardList) {
        await saveCard(card);
      }

      // 홈 화면으로 이동
      router.replace("/" as any);
    } catch (error) {
      console.error("Failed to import cards:", error);
      alert("Failed to import cards");
    } finally {
      setLoading(false);
    }
  };

  const cardHeight = isLandscape ? 120 : 150;
  const numColumns = isTablet ? 2 : 1;

  return (
    <ScreenContainer className="bg-background">
      <View className="flex-1">
        {/* Header */}
        <View className="px-4 py-4 border-b border-border bg-surface">
          <Text className="text-2xl font-bold text-foreground">Preview Cards</Text>
          <Text className="text-sm text-muted mt-1">
            {selectedCards.size} / {cards.length} selected
          </Text>
        </View>

        {/* Cards Grid */}
        {loading ? (
          <View className="flex-1 items-center justify-center">
            <ActivityIndicator size="large" color={colors.primary} />
          </View>
        ) : (
          <FlatList
            data={cards}
            numColumns={numColumns}
            keyExtractor={(item) => item.id}
            contentContainerStyle={{ padding: 12, gap: 12 }}
            columnWrapperStyle={numColumns > 1 ? { gap: 12 } : undefined}
            renderItem={({ item }) => (
              <Pressable
                onPress={() => handleToggleCard(item.id)}
                className={`flex-1 rounded-lg border-2 p-3 items-center justify-center ${
                  selectedCards.has(item.id)
                    ? "bg-primary border-primary"
                    : "bg-surface border-border"
                }`}
                style={{ height: cardHeight }}
              >
                <View className="items-center gap-2">
                  <MaterialIcons
                    name={selectedCards.has(item.id) ? "check-circle" : "radio-button-unchecked"}
                    size={24}
                    color={
                      selectedCards.has(item.id) ? colors.background : colors.muted
                    }
                  />
                  <Text
                    className={`text-lg font-bold ${
                      selectedCards.has(item.id)
                        ? "text-background"
                        : "text-foreground"
                    }`}
                  >
                    Problem {item.problemNumber}
                  </Text>
                </View>
              </Pressable>
            )}
          />
        )}
      </View>

      {/* Bottom Buttons */}
      <View className="px-4 py-4 border-t border-border bg-surface gap-3">
        <Pressable
          onPress={() => router.back()}
          className="bg-surface border border-border rounded-lg py-3 items-center justify-center active:opacity-70"
        >
          <Text className="font-semibold text-foreground">Back</Text>
        </Pressable>
        <Pressable
          onPress={handleImport}
          disabled={selectedCards.size === 0 || loading}
          className={`rounded-lg py-3 items-center justify-center active:opacity-80 ${
            selectedCards.size > 0 && !loading ? "bg-primary" : "bg-muted opacity-50"
          }`}
        >
          <Text className={`font-semibold ${selectedCards.size > 0 && !loading ? "text-white" : "text-muted"}`}>
            Import {selectedCards.size} Card{selectedCards.size !== 1 ? "s" : ""}
          </Text>
        </Pressable>
      </View>
    </ScreenContainer>
  );
}
