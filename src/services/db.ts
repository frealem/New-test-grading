
import { Exam, StudentResult } from '../types';

const API_BASE = '/api';

const STORAGE_KEYS = {
  EXAMS: 'test_grader_exams',
  RESULTS_CACHE: 'test_grader_results_cache'
};

export const db = {
  saveExam: async (exam: Exam): Promise<void> => {
    const localExams = db.getExamsLocal();
    localExams.push(exam);
    localStorage.setItem(STORAGE_KEYS.EXAMS, JSON.stringify(localExams));

    try {
      const res = await fetch(`${API_BASE}/exams`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(exam)
      });
      if (!res.ok) throw new Error(await res.text());
      console.log("Sync: Exam saved.");
    } catch (e) {
      console.error("Sync error:", e);
      throw e; // Re-throw to notify UI
    }
  },

  getExamsLocal: (): Exam[] => {
    const data = localStorage.getItem(STORAGE_KEYS.EXAMS);
    return data ? JSON.parse(data) : [];
  },

  getExams: async (): Promise<Exam[]> => {
    try {
      const response = await fetch(`${API_BASE}/exams`);
      if (response.ok) {
        const cloudExams = await response.json();
        localStorage.setItem(STORAGE_KEYS.EXAMS, JSON.stringify(cloudExams));
        return cloudExams;
      }
    } catch (e) {
      console.warn("Using local library.");
    }
    return db.getExamsLocal();
  },

  saveResult: async (result: StudentResult) => {
    const cached = db.getResultsLocal();
    cached.push(result);
    localStorage.setItem(STORAGE_KEYS.RESULTS_CACHE, JSON.stringify(cached));

    try {
      const res = await fetch(`${API_BASE}/results`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(result)
      });
      if (!res.ok) throw new Error(await res.text());
      console.log("Sync: Result saved.");
    } catch (e) {
      console.error("Sync error:", e);
      throw e; // Re-throw to notify UI
    }
  },

  getResultsLocal: (): StudentResult[] => {
    const data = localStorage.getItem(STORAGE_KEYS.RESULTS_CACHE);
    return data ? JSON.parse(data) : [];
  },

  getResultsByExam: async (examId: string): Promise<StudentResult[]> => {
    try {
      const response = await fetch(`${API_BASE}/results/${examId}`);
      if (response.ok) {
        return await response.json();
      }
    } catch (e) {
      console.warn("Using local cache.");
    }
    return db.getResultsLocal().filter(r => r.examId === examId);
  }
};
