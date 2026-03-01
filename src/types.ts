
export type QuestionType = 'choice' | 'tf' | 'match' | 'fill' | 'explanation';

export interface QuestionKey {
  id: string; // Unique ID for mapping
  localNumber: number; // 1, 2, 3... per type
  type: QuestionType;
  correctAnswer: string;
  points: number;
}

export interface Exam {
  id: string;
  title: string;
  classDepartment: string;
  teacherName: string;
  createdAt: number;
  masterKey: QuestionKey[];
}

export interface StudentResult {
  id: string;
  examId: string;
  studentName: string;
  department: string; // Captured from individual sheet
  score: number;
  totalPoints: number;
  percentage: number;
  answers: { [key: string]: string }; // key is question id
  gradingStatus: { [key: string]: boolean }; // key is question id, tracks AI fuzzy/semantic result
  scannedAt: number;
}

export interface ExtractedAnswer {
  questionId: string;
  studentAnswer: string;
  isCorrect?: boolean; // For AI-determined semantic/fuzzy correctness
}

declare global {
  interface Window {
    aistudio: {
      hasSelectedApiKey: () => Promise<boolean>;
      openSelectKey: () => Promise<void>;
    };
  }
}
