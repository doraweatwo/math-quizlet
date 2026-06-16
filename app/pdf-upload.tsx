import { View, Text, Pressable } from "react-native";
import { useRouter } from "expo-router";
import { ScreenContainer } from "@/components/screen-container";
import { MaterialIcons } from "@expo/vector-icons";
import { useColors } from "@/hooks/use-colors";
import * as DocumentPicker from "expo-document-picker";
import { useState } from "react";

export default function PDFUploadScreen() {
  const router = useRouter();
  const colors = useColors();
  const [fileName, setFileName] = useState<string | null>(null);

  const handlePickPDF = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: "application/pdf",
      });

      if (result.assets && result.assets.length > 0) {
        const file = result.assets[0];
        setFileName(file.name);
        // TODO: 패턴 설정 화면으로 이동 (파일 URI 전달)
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
    <ScreenContainer className="bg-background px-6 py-8">
      <View className="flex-1 items-center justify-center gap-6">
        {/* Header */}
        <View className="items-center gap-2">
          <Text className="text-2xl font-bold text-foreground">Import Problem Set</Text>
          <Text className="text-sm text-muted text-center">
            Select a PDF file containing math problems
          </Text>
        </View>

        {/* Upload Area */}
        <Pressable
          onPress={handlePickPDF}
          className="w-full bg-surface border-2 border-dashed border-primary rounded-lg p-8 items-center justify-center gap-4 active:opacity-70"
        >
          <MaterialIcons name="cloud-upload" size={48} color={colors.primary} />
          <View className="items-center gap-1">
            <Text className="text-lg font-semibold text-foreground">
              Tap to Select PDF
            </Text>
            <Text className="text-sm text-muted">
              or drag and drop your file here
            </Text>
          </View>
        </Pressable>

        {/* Selected File */}
        {fileName && (
          <View className="w-full bg-surface border border-border rounded-lg p-4">
            <View className="flex-row items-center gap-3">
              <MaterialIcons name="description" size={24} color={colors.primary} />
              <View className="flex-1">
                <Text className="font-semibold text-foreground">{fileName}</Text>
              </View>
              <Pressable onPress={() => setFileName(null)}>
                <MaterialIcons name="close" size={24} color={colors.error} />
              </Pressable>
            </View>
          </View>
        )}

        {/* Buttons */}
        <View className="w-full flex-row gap-3 mt-auto">
          <Pressable
            onPress={() => router.back()}
            className="flex-1 bg-surface border border-border rounded-lg py-3 items-center justify-center active:opacity-70"
          >
            <Text className="font-semibold text-foreground">Cancel</Text>
          </Pressable>
          <Pressable
            onPress={handlePickPDF}
            disabled={!fileName}
            className={`flex-1 rounded-lg py-3 items-center justify-center active:opacity-80 ${
              fileName ? "bg-primary" : "bg-muted opacity-50"
            }`}
          >
            <Text className={`font-semibold ${fileName ? "text-white" : "text-muted"}`}>
              Next
            </Text>
          </Pressable>
        </View>
      </View>
    </ScreenContainer>
  );
}
