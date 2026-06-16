/**
 * Math Quizlet 핵심 데이터 타입 정의
 */

/** 문제집 (Deck) */
export interface ProblemSet {
  id: string;
  title: string;
  createdAt: number;
  totalCards: number;
  lastStudiedAt?: number;
  pattern?: PatternConfig;
}

/** 패턴 설정 */
export interface PatternConfig {
  problemPattern: string; // 정규식 (예: "\\d+\\.")
  solutionPattern: string; // 정규식 (예: "【\\d+】")
  problemBounds?: {
    x: number;
    y: number;
    width: number;
    height: number;
  };
  solutionBounds?: {
    x: number;
    y: number;
    width: number;
    height: number;
  };
}

/** 개별 카드 */
export interface Card {
  id: string;
  problemSetId: string;
  problemNumber: string;
  problemImageUri: string; // 로컬 파일 경로
  solutionImageUri: string; // 로컬 파일 경로
  difficulty: number; // 1~5 별점
  averageTime: number; // 평균 풀이 시간 (ms)
  status: "unsolved" | "correct" | "incorrect"; // 상태
  attempts: number; // 시도 횟수
  correctAttempts: number; // 정답 횟수
}

/** 학습 세션 */
export interface StudySession {
  id: string;
  problemSetId: string;
  startedAt: number;
  endedAt?: number;
  mode: "sequential" | "random"; // 순차 또는 랜덤
  currentCycle: number; // 현재 사이클
  cardsInCycle: string[]; // 현재 사이클의 카드 ID 리스트
  completedCards: string[]; // 완료된 카드 ID
  sessionStats: {
    totalCorrect: number;
    totalIncorrect: number;
    totalTime: number; // 총 풀이 시간 (ms)
    cardStats: {
      cardId: string;
      time: number;
      isCorrect: boolean;
      difficulty: number;
    }[];
  };
}

/** PDF 업로드 상태 */
export interface PDFUploadState {
  fileUri?: string;
  fileName?: string;
  totalPages?: number;
  currentPage?: number;
  pattern?: PatternConfig;
  previewCards?: Card[];
}

/** 학습 모드 설정 */
export interface StudyModeConfig {
  mode: "sequential" | "random";
  includeDifficulty?: number; // 특정 난이도만 포함 (1~5, undefined = 모두)
  includeStatus?: "unsolved" | "correct" | "incorrect" | "all"; // 특정 상태만 포함
}
