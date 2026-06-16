import { useWindowDimensions } from "react-native";

export function useResponsive() {
  const { width, height } = useWindowDimensions();
  
  const isLandscape = width > height;
  const isTablet = width > 600;
  const isDesktop = width > 1024;
  
  // 기기별 여백 및 크기 자동 계산
  const spacing = isTablet ? 24 : 16;
  const cardWidth = isTablet ? (width - spacing * 3) / 2 : width - spacing * 2;
  
  return {
    width,
    height,
    isLandscape,
    isTablet,
    isDesktop,
    spacing,
    cardWidth,
    // 폰/탭 대응 그리드 컬럼 수
    numColumns: isDesktop ? 3 : isTablet ? 2 : 1,
  };
}
