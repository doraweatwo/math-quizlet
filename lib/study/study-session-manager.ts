/**
 * 학습 세션 관리
 * - 사이클 시스템 (오답 반복)
 * - 타이머 및 통계
 * - 세션 저장/복구
 */

// @ts-ignore
import { v4 as uuidv4 } from "uuid";
import { Card, StudySession, StudyModeConfig } from "@/lib/types/quizlet";

/** 학습 세션 생성 */
export function createStudySession(
  problemSetId: string,
  cards: Card[],
  config: StudyModeConfig
): StudySession {
  let cardsInCycle = cards.map((c) => c.id);

  // 랜덤 모드: 카드 섞기
  if (config.mode === "random") {
    cardsInCycle = shuffleArray(cardsInCycle);
  }

  // 필터링 (난이도, 상태)
  if (config.includeDifficulty) {
    cardsInCycle = cardsInCycle.filter(
      (cardId) =>
        cards.find((c) => c.id === cardId)?.difficulty === config.includeDifficulty
    );
  }

  if (config.includeStatus && config.includeStatus !== "all") {
    cardsInCycle = cardsInCycle.filter(
      (cardId) => cards.find((c) => c.id === cardId)?.status === config.includeStatus
    );
  }

  return {
    id: uuidv4(),
    problemSetId,
    startedAt: Date.now(),
    mode: config.mode,
    currentCycle: 1,
    cardsInCycle,
    completedCards: [],
    sessionStats: {
      totalCorrect: 0,
      totalIncorrect: 0,
      totalTime: 0,
      cardStats: [],
    },
  };
}

/** 다음 카드 가져오기 */
export function getNextCard(session: StudySession, cards: Card[]): Card | null {
  if (session.cardsInCycle.length === 0) {
    return null; // 사이클 완료
  }

  const nextCardId = session.cardsInCycle[0];
  return cards.find((c) => c.id === nextCardId) || null;
}

/** 카드 풀이 결과 기록 */
export function recordCardAttempt(
  session: StudySession,
  cardId: string,
  isCorrect: boolean,
  timeSpent: number,
  difficulty: number,
  cards: Card[]
): StudySession {
  const updatedSession = { ...session };

  // 통계 업데이트
  if (isCorrect) {
    updatedSession.sessionStats.totalCorrect++;
  } else {
    updatedSession.sessionStats.totalIncorrect++;
  }
  updatedSession.sessionStats.totalTime += timeSpent;

  // 카드 통계 기록
  updatedSession.sessionStats.cardStats.push({
    cardId,
    time: timeSpent,
    isCorrect,
    difficulty,
  });

  // 카드 상태 업데이트
  const card = cards.find((c) => c.id === cardId);
  if (card) {
    card.attempts++;
    if (isCorrect) {
      card.correctAttempts++;
      card.status = "correct";
      // 정답: 사이클에서 제거
      updatedSession.cardsInCycle = updatedSession.cardsInCycle.filter((id) => id !== cardId);
      updatedSession.completedCards.push(cardId);
    } else {
      card.status = "incorrect";
      // 오답: 사이클 끝으로 이동
      updatedSession.cardsInCycle = updatedSession.cardsInCycle.filter((id) => id !== cardId);
      updatedSession.cardsInCycle.push(cardId);
    }

    // 평균 풀이 시간 업데이트
    const totalTime = (card.averageTime * (card.attempts - 1) + timeSpent) / card.attempts;
    card.averageTime = Math.round(totalTime);
    card.difficulty = difficulty;
  }

  return updatedSession;
}

/** 사이클 완료 확인 */
export function isCycleComplete(session: StudySession): boolean {
  return session.cardsInCycle.length === 0;
}

/** 다음 사이클 시작 */
export function startNextCycle(session: StudySession, cards: Card[]): StudySession {
  // 완료되지 않은 카드만 다음 사이클에 포함
  const unsolvedCards = cards.filter((c) => c.status !== "correct").map((c) => c.id);

  if (unsolvedCards.length === 0) {
    // 모든 카드 완료
    return {
      ...session,
      endedAt: Date.now(),
    };
  }

  // 새로운 사이클 시작
  let newCardsInCycle = [...unsolvedCards];
  if (session.mode === "random") {
    newCardsInCycle = shuffleArray(newCardsInCycle);
  }

  return {
    ...session,
    currentCycle: session.currentCycle + 1,
    cardsInCycle: newCardsInCycle,
    completedCards: [],
  };
}

/** 세션 완료 */
export function completeSession(session: StudySession): StudySession {
  return {
    ...session,
    endedAt: Date.now(),
  };
}

/** 배열 섞기 (Fisher-Yates) */
function shuffleArray<T>(array: T[]): T[] {
  const shuffled = [...array];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}

/** 세션 통계 계산 */
export function calculateSessionStats(session: StudySession) {
  const totalCards = session.sessionStats.cardStats.length;
  const correctCards = session.sessionStats.cardStats.filter((s) => s.isCorrect).length;
  const correctRate = totalCards > 0 ? (correctCards / totalCards) * 100 : 0;
  const averageTime =
    totalCards > 0 ? Math.round(session.sessionStats.totalTime / totalCards) : 0;

  return {
    totalCards,
    correctCards,
    correctRate: Math.round(correctRate),
    totalTime: session.sessionStats.totalTime,
    averageTime,
  };
}
