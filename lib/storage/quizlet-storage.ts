/**
 * Math Quizlet 로컬 저장소 관리
 * - SQLite: 메타데이터 (문제집, 카드, 세션)
 * - FileSystem: 이미지 파일 (문제, 해설)
 */

import * as SQLite from "expo-sqlite";
import * as FileSystem from "expo-file-system";
import { Card, ProblemSet, StudySession, PatternConfig } from "@/lib/types/quizlet";

const DB_NAME = "math-quizlet.db";
let IMAGES_DIR = "";

let db: SQLite.SQLiteDatabase | null = null;

/** 데이터베이스 초기화 */
export async function initializeDatabase() {
  try {
    // 이미지 디렉토리 경로 설정
    const fs = FileSystem as any;
    IMAGES_DIR = `${fs.documentDirectory || fs.cacheDirectory || ""}quizlet-images/`;
    
    db = await SQLite.openDatabaseAsync(DB_NAME);

    // 테이블 생성
    await db.execAsync(`
      CREATE TABLE IF NOT EXISTS problem_sets (
        id TEXT PRIMARY KEY,
        title TEXT NOT NULL,
        created_at INTEGER NOT NULL,
        total_cards INTEGER DEFAULT 0,
        last_studied_at INTEGER,
        pattern_config TEXT
      );

      CREATE TABLE IF NOT EXISTS cards (
        id TEXT PRIMARY KEY,
        problem_set_id TEXT NOT NULL,
        problem_number TEXT NOT NULL,
        problem_image_uri TEXT NOT NULL,
        solution_image_uri TEXT NOT NULL,
        difficulty INTEGER DEFAULT 1,
        average_time INTEGER DEFAULT 0,
        status TEXT DEFAULT 'unsolved',
        attempts INTEGER DEFAULT 0,
        correct_attempts INTEGER DEFAULT 0,
        FOREIGN KEY(problem_set_id) REFERENCES problem_sets(id)
      );

      CREATE TABLE IF NOT EXISTS study_sessions (
        id TEXT PRIMARY KEY,
        problem_set_id TEXT NOT NULL,
        started_at INTEGER NOT NULL,
        ended_at INTEGER,
        mode TEXT NOT NULL,
        current_cycle INTEGER DEFAULT 1,
        cards_in_cycle TEXT,
        completed_cards TEXT,
        session_stats TEXT,
        FOREIGN KEY(problem_set_id) REFERENCES problem_sets(id)
      );

      CREATE INDEX IF NOT EXISTS idx_cards_problem_set ON cards(problem_set_id);
      CREATE INDEX IF NOT EXISTS idx_sessions_problem_set ON study_sessions(problem_set_id);
    `);

    // 이미지 디렉토리 생성
    try {
      const dirInfo = await FileSystem.getInfoAsync(IMAGES_DIR);
      if (!dirInfo.exists) {
        await FileSystem.makeDirectoryAsync(IMAGES_DIR, { intermediates: true });
      }
    } catch (error) {
      console.warn("Image directory setup:", IMAGES_DIR, error);
    }

    console.log("Database initialized successfully");
  } catch (error) {
    console.error("Failed to initialize database:", error);
    throw error;
  }
}

/** 문제집 저장 */
export async function saveProblemSet(set: ProblemSet): Promise<void> {
  if (!db) throw new Error("Database not initialized");

  const patternJson = set.pattern ? JSON.stringify(set.pattern) : null;

  await db.runAsync(
    `INSERT OR REPLACE INTO problem_sets (id, title, created_at, total_cards, last_studied_at, pattern_config)
     VALUES (?, ?, ?, ?, ?, ?)`,
    [set.id, set.title, set.createdAt, set.totalCards, set.lastStudiedAt || null, patternJson]
  );
}

/** 문제집 조회 */
export async function getProblemSet(id: string): Promise<ProblemSet | null> {
  if (!db) throw new Error("Database not initialized");

  const result = await db.getFirstAsync<any>(
    `SELECT * FROM problem_sets WHERE id = ?`,
    [id]
  );

  if (!result) return null;

  return {
    id: result.id,
    title: result.title,
    createdAt: result.created_at,
    totalCards: result.total_cards,
    lastStudiedAt: result.last_studied_at,
    pattern: result.pattern_config ? JSON.parse(result.pattern_config) : undefined,
  };
}

/** 모든 문제집 조회 */
export async function getAllProblemSets(): Promise<ProblemSet[]> {
  if (!db) throw new Error("Database not initialized");

  const results = await db.getAllAsync<any>(
    `SELECT * FROM problem_sets ORDER BY last_studied_at DESC`
  );

  return results.map((r: any) => ({
    id: r.id,
    title: r.title,
    createdAt: r.created_at,
    totalCards: r.total_cards,
    lastStudiedAt: r.last_studied_at,
    pattern: r.pattern_config ? JSON.parse(r.pattern_config) : undefined,
  }));
}

/** 카드 저장 */
export async function saveCard(card: Card): Promise<void> {
  if (!db) throw new Error("Database not initialized");

  await db.runAsync(
    `INSERT OR REPLACE INTO cards 
     (id, problem_set_id, problem_number, problem_image_uri, solution_image_uri, difficulty, average_time, status, attempts, correct_attempts)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      card.id,
      card.problemSetId,
      card.problemNumber,
      card.problemImageUri,
      card.solutionImageUri,
      card.difficulty,
      card.averageTime,
      card.status,
      card.attempts,
      card.correctAttempts,
    ]
  );
}

/** 문제집의 모든 카드 조회 */
export async function getCardsByProblemSet(problemSetId: string): Promise<Card[]> {
  if (!db) throw new Error("Database not initialized");

  const results = await db.getAllAsync<any>(
    `SELECT * FROM cards WHERE problem_set_id = ? ORDER BY problem_number`,
    [problemSetId]
  );

  return results.map((r: any) => ({
    id: r.id,
    problemSetId: r.problem_set_id,
    problemNumber: r.problem_number,
    problemImageUri: r.problem_image_uri,
    solutionImageUri: r.solution_image_uri,
    difficulty: r.difficulty,
    averageTime: r.average_time,
    status: r.status,
    attempts: r.attempts,
    correctAttempts: r.correct_attempts,
  }));
}

/** 학습 세션 저장 */
export async function saveStudySession(session: StudySession): Promise<void> {
  if (!db) throw new Error("Database not initialized");

  await db.runAsync(
    `INSERT OR REPLACE INTO study_sessions 
     (id, problem_set_id, started_at, ended_at, mode, current_cycle, cards_in_cycle, completed_cards, session_stats)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      session.id,
      session.problemSetId,
      session.startedAt,
      session.endedAt || null,
      session.mode,
      session.currentCycle,
      JSON.stringify(session.cardsInCycle),
      JSON.stringify(session.completedCards),
      JSON.stringify(session.sessionStats),
    ]
  );
}

/** 문제집 삭제 (카드 및 이미지 포함) */
export async function deleteProblemSet(id: string): Promise<void> {
  if (!db) throw new Error("Database not initialized");

  // 카드 조회 (이미지 삭제용)
  const cards = await getCardsByProblemSet(id);

  // 이미지 파일 삭제
  for (const card of cards) {
    try {
      await FileSystem.deleteAsync(card.problemImageUri, { idempotent: true });
      await FileSystem.deleteAsync(card.solutionImageUri, { idempotent: true });
    } catch (error) {
      console.warn("Failed to delete image:", error);
    }
  }

  // 데이터베이스 삭제
  await db.runAsync(`DELETE FROM cards WHERE problem_set_id = ?`, [id]);
  await db.runAsync(`DELETE FROM problem_sets WHERE id = ?`, [id]);
  await db.runAsync(`DELETE FROM study_sessions WHERE problem_set_id = ?`, [id]);
}

/** 이미지 저장 */
export async function saveImage(imageData: string, filename: string): Promise<string> {
  const filepath = `${IMAGES_DIR}${filename}`;
  await FileSystem.writeAsStringAsync(filepath, imageData, {
    encoding: 'base64',
  });
  return filepath;
}

/** 데이터베이스 종료 */
export async function closeDatabase(): Promise<void> {
  if (db) {
    await db.closeAsync();
    db = null;
  }
}
