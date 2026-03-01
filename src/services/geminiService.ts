
import { GoogleGenAI, Type } from "@google/genai";
import { ExtractedAnswer, QuestionKey } from "../types";

/**
 * OPTIMIZED PRE-PROCESSING
 * High contrast + 1200px width for maximum OCR speed.
 */
async function enhanceImage(base64: string): Promise<string> {
  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => {
      const canvas = document.createElement('canvas');
      // High resolution for OCR accuracy
      const MAX_DIM = 2048; 
      let width = img.width;
      let height = img.height;

      if (width > height) {
        if (width > MAX_DIM) {
          height *= MAX_DIM / width;
          width = MAX_DIM;
        }
      } else {
        if (height > MAX_DIM) {
          width *= MAX_DIM / height;
          height = MAX_DIM;
        }
      }

      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext('2d');
      if (!ctx) return resolve(base64);
      
      // OCR-optimized filters: high contrast, no color, normalized brightness
      ctx.filter = 'contrast(1.6) grayscale(1) brightness(1.02)'; 
      ctx.imageSmoothingEnabled = true;
      ctx.imageSmoothingQuality = 'high';
      ctx.drawImage(img, 0, 0, width, height);
      
      resolve(canvas.toDataURL('image/jpeg', 0.9));
    };
    img.src = base64;
  });
}

export const extractAnswersFromImage = async (
  rawBase64: string, 
  masterKey: QuestionKey[]
): Promise<{ studentName: string; department: string; gradedAnswers: ExtractedAnswer[] }> => {
  
  const apiKey = process.env.API_KEY || process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error("System configuration required. Please contact support.");
  }

  const ai = new GoogleGenAI({ apiKey });
  const enhancedBase64 = await enhanceImage(rawBase64);

  const keyReference = masterKey
    .filter(k => k.correctAnswer.trim() !== '')
    .map(k => `ID:${k.id} | Q:${k.localNumber} | TYPE:${k.type} | KEY:${k.correctAnswer}`)
    .join("\n");

  const prompt = `
    ULTRA-FAST VISION OCR & GRADING TASK:
    - INPUT: An image of an exam sheet (may be blurred, rotated, or low-res).
    - TASK 1: Extract 'studentName' and 'department' from the header area.
    - TASK 2: Grade handwritten answers against the Master Key.
    - RULES:
      1. Be extremely lenient with handwriting recognition.
      2. For Choice/TF/Match: Exact match required.
      3. For Fill/Explanation: Use semantic/fuzzy logic. If it means the same thing, it is CORRECT.
      4. If a question is unreadable, return studentAnswer: "UNREADABLE" and isCorrect: false.
    - OUTPUT: Return ONLY a valid JSON object matching the schema.

    MASTER KEY:
    ${keyReference}
  `;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: [
        {
          parts: [
            { inlineData: { mimeType: 'image/jpeg', data: enhancedBase64.split(',')[1] } },
            { text: prompt }
          ]
        }
      ],
      config: {
        responseMimeType: "application/json",
        thinkingConfig: { thinkingBudget: 0 },
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            studentName: { type: Type.STRING },
            department: { type: Type.STRING },
            gradedAnswers: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  questionId: { type: Type.STRING },
                  studentAnswer: { type: Type.STRING },
                  isCorrect: { type: Type.BOOLEAN }
                },
                required: ["questionId", "studentAnswer", "isCorrect"],
              },
            },
          },
          required: ["studentName", "department", "gradedAnswers"],
        },
      },
    });

    const text = response.text;
    if (!text) throw new Error("The scan engine returned an empty response. Please try again.");
    
    try {
      // Attempt to find JSON block if the model included conversational text
      const jsonMatch = text.match(/\{[\s\S]*\}/);
      const jsonString = jsonMatch ? jsonMatch[0] : text;
      return JSON.parse(jsonString);
    } catch (parseError) {
      console.error("Parse Error:", text);
      throw new Error("Failed to interpret scan results. The image might be too distorted.");
    }
  } catch (error: any) {
    console.error("Scan Error:", error);
    
    // Provide more helpful error messages
    if (error.message?.includes("API_KEY")) {
      throw new Error("System configuration required.");
    }
    if (error.message?.includes("safety")) {
      throw new Error("The image could not be processed. Please ensure it only contains exam content.");
    }
    
    throw new Error("Scan failed. Try a clearer photo or better lighting.");
  }
};
