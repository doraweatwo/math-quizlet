/**
 * 스파링 적분 PDF 특화 설정
 */
export const SparingConfig = {
  // 문제 영역 설정
  problem: {
    numberPattern: "^(\\d+)\\.", // 예: "1.", "2."
    layout: "2-column", // 2단 구성
    headerHeight: 100, // 상단 제목 영역 제외
    footerHeight: 80, // 하단 페이지 번호 영역 제외
  },
  // 해설 영역 설정
  solution: {
    numberPattern: "【(\\d+)】", // 예: "【703】"
    layout: "2-column",
    headerHeight: 50,
    footerHeight: 80,
  },
  // PDF 분석 힌트
  analysis: {
    startPage: 3, // 실제 문제 시작 페이지
    solutionStartPage: 180, // 해설 시작 페이지 추정 (실제론 분석 필요)
  }
};
