import { z } from "zod";
import { router, publicProcedure } from "./_core/trpc";
import { invokeLLM } from "./_core/llm";
import { storage } from "./storage";

export const pdfRouter = router({
  analyzePDF: publicProcedure
    .input(
      z.object({
        fileUrl: z.string(),
        pageRange: z.array(z.number()).optional(),
      })
    )
    .query(async ({ input }) => {
      const prompt = `
        이 수학 문제집 PDF는 2단(2-column) 레이아웃으로 구성되어 있어.
        각 페이지에서 문제(Problem)와 해설(Solution)의 영역을 정밀하게 분석해줘.
        
        분석 규칙:
        1. 문제 번호 형식: 문제는 "1.", "2." 처럼 숫자로 시작하고, 해설은 "【숫자】" 형식을 사용해.
        2. 좌표 체계: [x, y, width, height] 형식이며, 0~1000 사이의 정규화된 값을 사용해.
        3. 영역 크롭: 문제 텍스트, 수식, 선택지(①~⑤)를 모두 포함하는 최소 사각형 영역을 잡아줘.
        
        반환 형식 (JSON 배열):
        - number: 추출된 문제 번호 (순수 숫자만)
        - type: "problem" 또는 "solution"
        - box: [x, y, width, height]
        
        반드시 JSON 배열 형식으로만 응답해.
      `;

      const result = await invokeLLM({
        messages: [
          {
            role: "user",
            content: [
              { type: "text", text: prompt },
              {
                type: "file_url",
                file_url: {
                  url: input.fileUrl,
                  mime_type: "application/pdf",
                },
              },
            ],
          },
        ],
        response_format: { type: "json_object" },
      });

      return JSON.parse(result.content);
    }),
});
