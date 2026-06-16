import { View, Text, Pressable, useWindowDimensions, ScrollView } from "react-native";
import { useRouter } from "expo-router";
import { ScreenContainer } from "@/components/screen-container";
import { MaterialIcons } from "@expo/vector-icons";
import { useColors } from "@/hooks/use-colors";
import * as DocumentPicker from "expo-document-picker";
import { useState } from "react";

export default function PDFUploadScreen() {
  const router = useRouter();
  const colors = useColors();
  const { height } = useWindowDimensions();
  
  const [fileName, setFileName] = useState<string | null>(null);
  const [fileSize, setFileSize] = useState<string | null>(null);

  const handlePickPDF = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: "application/pdf",
      });

      if (result.assets && result.assets.length > 0) {
        const file = result.assets[0];
        setFileName(file.name);
        
        // 파일 크기 포맷팅
        if (file.size) {
          const sizeMB = (file.size / (1024 * 1024)).toFixed(2);
          setFileSize(`${sizeMB} MB`);
        }
        
        // TODO: 패턴 설정 화면으로 이동
        // router.push({
        //   pathname: "/pattern-setup",
        //   params: { fileUri: file.uri, fileName: file.name },
        // });
      }
    } catch (error) {
      console.error("Failed to pick PDF:", error);
    }
  };

  return (
    <ScreenContainer className="bg-background">
      <ScrollView contentContainerStyle={{ flexGrow: 1 }}>
        <View className="flex-1 px-6 py-8 justify-center gap-6">
          {/* Header */}
          <View className="items-center gap-2">
            <MaterialIcons name="upload-file" size={48} color={colors.primary} />
            <Text className="text-2xl font-bold text-foreground">Import Problem Set</Text>
            <Text className="text-sm text-muted text-center">
              Select a PDF file containing math problems
            </Text>
          </View>

          {/* Upload Area */}
          <Pressable
            onPress={handlePickPDF}
            className="bg-surface border-2 border-dashed border-primary rounded-lg p-8 items-center justify-center gap-4 active:opacity-70"
          >
            <MaterialIcons name="cloud-upload" size={48} color={colors.primary} />
            <View className="items-center gap-1">
              <Text className="text-lg font-semibold text-foreground">
                Tap to Select PDF
              </Text>
              <Text className="text-sm text-muted">
                Recommended: Under 50 MB
              </Text>
            </View>
          </Pressable>

          {/* Selected File Info */}
          {fileName && (
            <View className="bg-surface border border-border rounded-lg p-4 gap-3">
              <View className="flex-row items-center gap-3">
                <MaterialIcons name="description" size={28} color={colors.primary} />
                <View className="flex-1">
                  <Text className="font-semibold text-foreground" numberOfLines={1}>
                    {fileName}
                  </Text>
                  {fileSize && (
                    <Text className="text-xs text-muted mt-1">{fileSize}</Text>
                  )}
                </View>
                <Pressable
                  onPress={() => {
                    setFileName(null);
                    setFileSize(null);
                  }}
                  className="p-2 active:opacity-60"
                >
                  <MaterialIcons name="close" size={20} color={colors.error} />
                </Pressable>
              </View>
              <Text className="text-xs text-muted">
                ✓ Ready to import
              </Text>
            </View>
          )}

          {/* Info Box */}
          <View className="bg-primary bg-opacity-10 border border-primary rounded-lg p-4 gap-2">
            <View className="flex-row gap-2">
              <MaterialIcons name="info" size={20} color={colors.primary} />
              <View className="flex-1">
                <Text className="text-sm font-semibold text-foreground">Tips</Text>
                <Text className="text-xs text-muted mt-1">
                  • Use clear, high-quality PDF files{"\n"}
                  • Ensure problem numbers are clearly visible{"\n"}
                  • Separate problem and solution pages
                </Text>
              </View>
            </View>
          </View>
        </View>
      </ScrollView>

      {/* Buttons - Fixed at bottom */}
      <View className="px-6 py-4 border-t border-border bg-surface gap-3">
        <Pressable
          onPress={() => router.back()}
          className="bg-surface border border-border rounded-lg py-3 items-center justify-center active:opacity-70"
        >
          <Text className="font-semibold text-foreground">Cancel</Text>
        </Pressable>
        <Pressable
          onPress={handlePickPDF}
          disabled={!fileName}
          className={`rounded-lg py-3 items-center justify-center active:opacity-80 ${
            fileName ? "bg-primary" : "bg-muted opacity-50"
          }`}
        >
          <Text className={`font-semibold ${fileName ? "text-white" : "text-muted"}`}>
            Continue
          </Text>
        </Pressable>
      </View>
    </ScreenContainer>
  );
}
