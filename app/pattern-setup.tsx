import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  Pressable,
  ScrollView,
  useWindowDimensions,
  TextInput,
  Image,
  ActivityIndicator,
} from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { ScreenContainer } from "@/components/screen-container";
import { MaterialIcons } from "@expo/vector-icons";
import { useColors } from "@/hooks/use-colors";
import * as FileSystem from "expo-file-system";
import { PatternConfig } from "@/lib/types/quizlet";

export default function PatternSetupScreen() {
  const router = useRouter();
  const colors = useColors();
  const { width, height } = useWindowDimensions();
  const { fileUri, fileName } = useLocalSearchParams<{
    fileUri: string;
    fileName: string;
  }>();

  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [pagePreview, setPagePreview] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [problemPattern, setProblemPattern] = useState("【(\\d+)】");
  const [solutionPattern, setSolutionPattern] = useState("【(\\d+)】");
  const [extractedProblems, setExtractedProblems] = useState<string[]>([]);
  const [extractedSolutions, setExtractedSolutions] = useState<string[]>([]);

  const isLandscape = width > height;
  const isTablet = width > 600;

  useEffect(() => {
    if (fileUri) {
      loadPDFInfo();
    }
  }, [fileUri]);

  useEffect(() => {
    loadPagePreview();
  }, [currentPage]);

  const loadPDFInfo = async () => {
    try {
      // PDF 파일 정보 로드 (간단한 추정)
      await FileSystem.getInfoAsync(fileUri!);
      // 파일 크기로 대략적인 페이지 수 추정 (실제로는 PDF 라이브러리 필요)
      const estimatedPages = Math.max(1, Math.ceil(100000 / 50000));
      setTotalPages(estimatedPages);
    } catch (error) {
      console.error("Failed to load PDF info:", error);
    }
  };

  const loadPagePreview = async () => {
    if (!fileUri) return;

    setLoading(true);
    try {
      // 실제 PDF 렌더링은 복잡하므로, 여기서는 파일 URI를 직접 사용
      // 실제 구현에서는 pdf-lib 또는 pdfjs를 사용하여 페이지를 이미지로 변환
      setPagePreview(fileUri);
      
      // 패턴 추출 시뮬레이션
      extractNumbersFromPattern();
    } catch (error) {
      console.error("Failed to load page preview:", error);
    } finally {
      setLoading(false);
    }
  };

  const extractNumbersFromPattern = () => {
    // 정규식 기반 번호 추출 시뮬레이션
    try {
      const problemRegex = new RegExp(problemPattern, "g");
      const solutionRegex = new RegExp(solutionPattern, "g");

      // 샘플 텍스트에서 추출 (실제로는 OCR 필요)
      const sampleText = "【1】문제 【2】문제 【3】문제";
      const problems = sampleText.match(problemRegex) || [];
      const solutions = sampleText.match(solutionRegex) || [];

      setExtractedProblems(problems.map((p, i) => String(i + 1)));
      setExtractedSolutions(solutions.map((s, i) => String(i + 1)));
    } catch (error) {
      console.error("Pattern extraction failed:", error);
    }
  };

  const handleContinue = () => {
    const patternConfig: PatternConfig = {
      problemPattern,
      solutionPattern,
    };

    router.push({
      pathname: "/card-preview" as any,
      params: {
        fileUri,
        fileName,
        patternConfig: JSON.stringify(patternConfig),
      },
    });
  };

  const previewHeight = isLandscape ? height * 0.5 : height * 0.4;

  return (
    <ScreenContainer className="bg-background">
      <ScrollView className="flex-1">
        <View className="px-4 py-4 gap-4">
          {/* Header */}
          <View className="gap-2">
            <Text className="text-2xl font-bold text-foreground">Pattern Setup</Text>
            <Text className="text-sm text-muted">{fileName}</Text>
          </View>

          {/* Page Navigator */}
          <View className="bg-surface border border-border rounded-lg p-4 gap-3">
            <Text className="font-semibold text-foreground">Page Navigation</Text>
            <View className="flex-row items-center gap-3">
              <Pressable
                onPress={() => setCurrentPage(Math.max(1, currentPage - 1))}
                disabled={currentPage === 1}
                className="p-2 active:opacity-60"
              >
                <MaterialIcons
                  name="chevron-left"
                  size={24}
                  color={currentPage === 1 ? colors.muted : colors.primary}
                />
              </Pressable>

              <View className="flex-1 flex-row items-center gap-2">
                <TextInput
                  value={String(currentPage)}
                  onChangeText={(text) => {
                    const page = Math.max(1, Math.min(totalPages, parseInt(text) || 1));
                    setCurrentPage(page);
                  }}
                  keyboardType="number-pad"
                  className="flex-1 border border-border rounded px-3 py-2 text-center text-foreground"
                  placeholderTextColor={colors.muted}
                />
                <Text className="text-sm text-muted">/ {totalPages}</Text>
              </View>

              <Pressable
                onPress={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                disabled={currentPage === totalPages}
                className="p-2 active:opacity-60"
              >
                <MaterialIcons
                  name="chevron-right"
                  size={24}
                  color={currentPage === totalPages ? colors.muted : colors.primary}
                />
              </Pressable>
            </View>
          </View>

          {/* Page Preview */}
          <View className="bg-surface border border-border rounded-lg overflow-hidden">
            {loading ? (
              <View
                style={{ height: previewHeight }}
                className="items-center justify-center"
              >
                <ActivityIndicator size="large" color={colors.primary} />
              </View>
            ) : pagePreview ? (
              <Image
                source={{ uri: pagePreview }}
                style={{ height: previewHeight, width: "100%" }}
                resizeMode="contain"
              />
            ) : (
              <View
                style={{ height: previewHeight }}
                className="items-center justify-center bg-muted bg-opacity-10"
              >
                <Text className="text-muted">No preview available</Text>
              </View>
            )}
          </View>

          {/* Pattern Configuration */}
          <View className="gap-4">
            <View className="gap-2">
              <Text className="font-semibold text-foreground">Problem Number Pattern</Text>
              <TextInput
                value={problemPattern}
                onChangeText={setProblemPattern}
                placeholder="e.g., 【(\\d+)】"
                className="border border-border rounded px-3 py-2 text-foreground"
                placeholderTextColor={colors.muted}
              />
              <Text className="text-xs text-muted">
                Detected: {extractedProblems.join(", ") || "No matches"}
              </Text>
            </View>

            <View className="gap-2">
              <Text className="font-semibold text-foreground">Solution Number Pattern</Text>
              <TextInput
                value={solutionPattern}
                onChangeText={setSolutionPattern}
                placeholder="e.g., 【(\\d+)】"
                className="border border-border rounded px-3 py-2 text-foreground"
                placeholderTextColor={colors.muted}
              />
              <Text className="text-xs text-muted">
                Detected: {extractedSolutions.join(", ") || "No matches"}
              </Text>
            </View>

            <Pressable
              onPress={extractNumbersFromPattern}
              className="bg-primary bg-opacity-10 border border-primary rounded px-3 py-2 items-center"
            >
              <Text className="font-semibold text-primary">Test Pattern</Text>
            </Pressable>
          </View>

          {/* Info Box */}
          <View className="bg-primary bg-opacity-10 border border-primary rounded-lg p-3 gap-2">
            <View className="flex-row gap-2">
              <MaterialIcons name="info" size={16} color={colors.primary} />
              <View className="flex-1">
                <Text className="text-xs text-muted">
                  Use regex patterns to match problem and solution numbers. Test the pattern
                  to see detected numbers.
                </Text>
              </View>
            </View>
          </View>
        </View>
      </ScrollView>

      {/* Bottom Buttons */}
      <View className="px-4 py-4 border-t border-border bg-surface gap-3">
        <Pressable
          onPress={() => router.back()}
          className="bg-surface border border-border rounded-lg py-3 items-center justify-center active:opacity-70"
        >
          <Text className="font-semibold text-foreground">Back</Text>
        </Pressable>
        <Pressable
          onPress={handleContinue}
          className="bg-primary rounded-lg py-3 items-center justify-center active:opacity-80"
        >
          <Text className="font-semibold text-white">Continue</Text>
        </Pressable>
      </View>
    </ScreenContainer>
  );
}
