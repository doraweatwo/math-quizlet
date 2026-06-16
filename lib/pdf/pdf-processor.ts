/**
 * PDF 처리 및 카드 추출 로직
 * - PDF → 이미지 변환
 * - 패턴 기반 번호 인식
 * - 영역 크롭 및 카드 생성
 */

import * as FileSystem from "expo-file-system";
import * as ImageManipulator from "expo-image-manipulator";
import { Card, PatternConfig } from "@/lib/types/quizlet";
// @ts-ignore
import { v4 as uuidv4 } from "uuid";

/** PDF 페이지를 이미지로 변환 (외부 서비스 필요 - 여기서는 스텁) */
export async function convertPDFPageToImage(
  pdfUri: string,
  pageNumber: number
): Promise<string> {
  // 실제 구현: PDF 라이브러리 사용 필요
  // 여기서는 사용자가 제공한 이미지 경로를 반환하는 스텁
  console.log(`Converting PDF page ${pageNumber} from ${pdfUri}`);
  return pdfUri;
}

/** 이미지에서 지정된 영역 크롭 */
export async function cropImage(
  imageUri: string,
  x: number,
  y: number,
  width: number,
  height: number
): Promise<string> {
  try {
    const result = await ImageManipulator.manipulateAsync(
      imageUri,
      [
        {
          crop: {
            originX: Math.max(0, Math.floor(x)),
            originY: Math.max(0, Math.floor(y)),
            width: Math.max(1, Math.floor(width)),
            height: Math.max(1, Math.floor(height)),
          },
        },
      ],
      { compress: 0.8, format: ImageManipulator.SaveFormat.JPEG }
    );

    return result.uri;
  } catch (error) {
    console.error("Failed to crop image:", error);
    throw error;
  }
}

/** 이미지 리사이징 */
export async function resizeImage(
  imageUri: string,
  width: number,
  height: number
): Promise<string> {
  try {
    const result = await ImageManipulator.manipulateAsync(
      imageUri,
      [{ resize: { width, height } }],
      { compress: 0.8, format: ImageManipulator.SaveFormat.JPEG }
    );

    return result.uri;
  } catch (error) {
    console.error("Failed to resize image:", error);
    throw error;
  }
}

/** 패턴 기반 번호 추출 (정규식 사용) */
export function extractNumbersFromPattern(
  text: string,
  pattern: string
): string[] {
  try {
    const regex = new RegExp(pattern, "g");
    const matches = text.match(regex) || [];
    return matches.map((match) => {
      // 숫자만 추출 (예: "1." → "1", "【642】" → "642")
      return match.replace(/\D/g, "");
    });
  } catch (error) {
    console.error("Failed to extract numbers:", error);
    return [];
  }
}

/** 카드 추출 (이미지 기반) */
export async function extractCardsFromImages(
  problemSetId: string,
  problemImages: Array<{ uri: string; number: string }>,
  solutionImages: Array<{ uri: string; number: string }>
): Promise<Card[]> {
  const cards: Card[] = [];

  // 문제와 해설 매칭
  for (const problem of problemImages) {
    const solution = solutionImages.find((s) => s.number === problem.number);

    if (solution) {
      const card: Card = {
        id: uuidv4(),
        problemSetId,
        problemNumber: problem.number,
        problemImageUri: problem.uri,
        solutionImageUri: solution.uri,
        difficulty: 1, // 기본값
        averageTime: 0,
        status: "unsolved",
        attempts: 0,
        correctAttempts: 0,
      };

      cards.push(card);
    }
  }

  return cards;
}

/** 패턴 설정 미리보기 (1~2페이지) */
export async function previewPatternExtraction(
  imageUri: string,
  pattern: PatternConfig
): Promise<{ problemNumbers: string[]; solutionNumbers: string[] }> {
  // 실제 구현: OCR 또는 이미지 분석 필요
  // 여기서는 스텁 반환
  return {
    problemNumbers: ["1", "2", "3"],
    solutionNumbers: ["1", "2", "3"],
  };
}

/** 이미지 파일을 Base64로 변환 */
export async function imageToBase64(imageUri: string): Promise<string> {
  try {
    const base64 = await FileSystem.readAsStringAsync(imageUri, {
      encoding: 'base64',
    });
    return base64;
  } catch (error) {
    console.error("Failed to convert image to base64:", error);
    throw error;
  }
}

/** Base64를 이미지 파일로 저장 */
export async function base64ToImage(base64: string, filename: string): Promise<string> {
  try {
    const fs = FileSystem as any;
    const dir = fs.documentDirectory || fs.cacheDirectory || "";
    const filepath = `${dir}${filename}`;

    await FileSystem.writeAsStringAsync(filepath, base64, {
      encoding: 'base64',
    });

    return filepath;
  } catch (error) {
    console.error("Failed to save base64 as image:", error);
    throw error;
  }
}
