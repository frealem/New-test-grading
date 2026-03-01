
import React, { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Camera, X, Loader2, CheckCircle2, AlertCircle, Scan } from 'lucide-react';
import { extractAnswersFromImage } from '../services/geminiService';
import { Exam, StudentResult } from '../types';

interface ScannerProps {
  exam: Exam;
  onComplete: (result: StudentResult) => void;
  onBack: () => void;
}

const Scanner: React.FC<ScannerProps> = ({ exam, onComplete, onBack }) => {
  const [isProcessing, setIsProcessing] = useState(false);
  const [processStep, setProcessStep] = useState<string>('');
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const processImage = async (file: File) => {
    setIsProcessing(true);
    setProcessStep('Initializing Ultra-Scan...');
    setError(null);

    try {
      setProcessStep('Reading Image Data...');
      const reader = new FileReader();
      const base64Promise = new Promise<string>((resolve, reject) => {
        reader.onload = () => resolve(reader.result as string);
        reader.onerror = reject;
      });
      reader.readAsDataURL(file);
      const base64 = await base64Promise;

      setProcessStep('Enhancing & Rotating...');
      const data = await extractAnswersFromImage(base64, exam.masterKey);
      
      setProcessStep('Grading Answers...');
      if (!data || !data.gradedAnswers) {
        throw new Error("No readable answers found on this sheet.");
      }

      const { studentName, department, gradedAnswers } = data;
      
      let earnedPoints = 0;
      let totalPoints = 0;
      const studentAnswersMap: { [key: string]: string } = {};
      const gradingStatusMap: { [key: string]: boolean } = {};

      exam.masterKey.forEach((key) => {
        totalPoints += key.points;
        const aiGraded = gradedAnswers.find(ga => ga.questionId === key.id);
        
        if (aiGraded) {
          studentAnswersMap[key.id] = aiGraded.studentAnswer || "BLANK";
          gradingStatusMap[key.id] = !!aiGraded.isCorrect;
          if (aiGraded.isCorrect) {
            earnedPoints += key.points;
          }
        } else {
          // If model missed a question, we mark it as incorrect/unseen
          studentAnswersMap[key.id] = "";
          gradingStatusMap[key.id] = false;
        }
      });

      const result: StudentResult = {
        id: Math.random().toString(36).substr(2, 9),
        examId: exam.id,
        studentName: studentName || 'Unnamed Student',
        department: department || exam.classDepartment,
        score: earnedPoints,
        totalPoints,
        percentage: totalPoints > 0 ? (earnedPoints / totalPoints) * 100 : 0,
        answers: studentAnswersMap,
        gradingStatus: gradingStatusMap,
        scannedAt: Date.now()
      };

      onComplete(result);
    } catch (err) {
      console.error(err);
      const msg = err instanceof Error ? err.message : "Extraction Failed";
      if (msg.includes("403") || msg.includes("API_KEY") || msg.includes("not found")) {
        setError("System configuration required. Please contact support.");
      } else {
        setError(msg);
      }
    } finally {
      setIsProcessing(false);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      processImage(e.target.files[0]);
    }
  };

  return (
    <div className="bg-white rounded-[2.5rem] shadow-2xl border border-slate-200 overflow-hidden">
      <div className="p-8 bg-orange-600 text-white flex justify-between items-center">
        <div className="flex items-center gap-4">
           <div className="bg-white/20 p-3 rounded-2xl">
             <Camera size={24} strokeWidth={3} />
           </div>
           <div>
             <h2 className="text-2xl font-black tracking-tight leading-none">Ultra-Scan Engine</h2>
             <p className="text-orange-100 text-[10px] font-black uppercase tracking-widest mt-1 opacity-70">
               {exam.title} • High Performance Active
             </p>
           </div>
        </div>
        <button onClick={onBack} className="bg-white/10 hover:bg-white text-orange-600 p-2.5 rounded-xl transition-all border border-white/20">
          <X size={20} strokeWidth={3} />
        </button>
      </div>

      <div className="p-10 flex flex-col items-center justify-center min-h-[480px]">
        <AnimatePresence mode="wait">
          {isProcessing ? (
            <motion.div 
              key="processing"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="text-center space-y-8"
            >
              <div className="relative mx-auto w-24 h-24">
                <div className="absolute inset-0 border-8 border-orange-100 rounded-full"></div>
                <div className="absolute inset-0 border-8 border-orange-600 border-t-transparent rounded-full animate-spin"></div>
              </div>
              <div className="animate-pulse">
                <p className="text-2xl font-black text-slate-900 tracking-tight">{processStep}</p>
                <p className="text-slate-400 mt-2 font-medium">High-performance engine active</p>
              </div>
            </motion.div>
          ) : (
            <motion.div 
              key="ready"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="text-center space-y-10 w-full max-w-sm"
            >
              <div className="bg-orange-50 rounded-[2rem] w-24 h-24 flex items-center justify-center mx-auto border-2 border-orange-100">
                 <Scan className="text-orange-600 w-12 h-12" strokeWidth={3} />
              </div>
              
              <div className="space-y-3">
                <h3 className="text-3xl font-black text-slate-900 tracking-tight leading-tight">Ready for Scan</h3>
                <p className="text-slate-500 font-medium text-sm">Position the sheet clearly in good lighting for the fastest results.</p>
              </div>

              {error && (
                <motion.div 
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="bg-red-50 text-red-700 p-5 rounded-2xl text-sm font-bold border-2 border-red-100 flex items-center gap-3"
                >
                  <AlertCircle className="shrink-0" />
                  {error}
                </motion.div>
              )}

              <button 
                onClick={() => fileInputRef.current?.click()}
                className="w-full bg-orange-600 hover:bg-orange-700 text-white font-black py-5 px-8 rounded-[2rem] flex items-center justify-center gap-4 shadow-2xl transition-all active:scale-95 text-xl tracking-tight"
              >
                <Camera size={28} strokeWidth={3} />
                Start Capture
              </button>

              <div className="flex flex-col gap-2 bg-slate-50 p-4 rounded-2xl border border-slate-200">
                 <div className="flex items-center justify-between">
                   <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Grading Logic</span>
                   <span className="text-[10px] font-black text-green-600">ID-MAPPED OCR ACTIVE</span>
                 </div>
                 <div className="flex items-center justify-between">
                   <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Engine</span>
                   <span className="text-[10px] font-black text-orange-600">V3 PRO</span>
                 </div>
              </div>

              <input type="file" ref={fileInputRef} onChange={handleFileChange} accept="image/*" capture="environment" className="hidden" />
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};

export default Scanner;
