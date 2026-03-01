
import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FileText, Users, TrendingUp, ChevronRight, X, CheckCircle2, XCircle, Search } from 'lucide-react';
import { Exam, StudentResult } from '../types';

interface ResultsTableProps {
  exam: Exam;
  results: StudentResult[];
  onScanMore: () => void;
}

const ResultsTable: React.FC<ResultsTableProps> = ({ exam, results, onScanMore }) => {
  const [selectedResult, setSelectedResult] = useState<StudentResult | null>(null);

  const averageScore = results.length > 0 
    ? (results.reduce((acc, r) => acc + r.percentage, 0) / results.length).toFixed(1) 
    : 0;

  return (
    <div className="space-y-6">
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white p-8 rounded-[2.5rem] shadow-sm border border-slate-200 flex flex-col md:flex-row justify-between items-start md:items-center gap-6"
      >
        <div>
          <h2 className="text-3xl font-black text-slate-900 tracking-tight leading-none mb-2">{exam.title}</h2>
          <div className="flex flex-wrap gap-x-4 gap-y-1">
             <p className="text-orange-600 text-xs font-black uppercase tracking-widest flex items-center gap-1">
               <FileText size={12} strokeWidth={3} />
               {exam.classDepartment}
             </p>
             <p className="text-slate-400 text-xs font-bold italic">Prof. {exam.teacherName}</p>
          </div>
        </div>
        
        <div className="flex gap-4 w-full md:w-auto">
          <div className="bg-orange-50 px-6 py-3 rounded-2xl border border-orange-100 flex flex-col items-center flex-1 md:flex-initial shadow-inner">
             <span className="text-[10px] text-orange-400 font-black uppercase tracking-widest">Average Score</span>
             <span className="text-2xl font-black text-orange-700">{averageScore}%</span>
          </div>
          <button 
            onClick={onScanMore}
            className="bg-orange-600 hover:bg-orange-700 text-white font-black px-8 py-3 rounded-[2rem] shadow-2xl flex items-center gap-3 transition-all ml-auto uppercase text-xs tracking-widest"
          >
            <Search size={20} strokeWidth={3} />
            Next Scan
          </button>
        </div>
      </motion.div>

      <motion.div 
        initial={{ opacity: 0, scale: 0.98 }}
        animate={{ opacity: 1, scale: 1 }}
        className="bg-white rounded-[2.5rem] shadow-sm border border-slate-200 overflow-hidden"
      >
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50/50 border-b border-slate-100">
                <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">Student</th>
                <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">Score</th>
                <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">Grade</th>
                <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">Audit</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {results.length === 0 ? (
                <tr><td colSpan={4} className="px-8 py-20 text-center text-slate-300 italic font-bold">Waiting for scans...</td></tr>
              ) : (
                results.sort((a, b) => b.scannedAt - a.scannedAt).map(result => (
                  <tr key={result.id} className="hover:bg-orange-50/20 transition-colors group">
                    <td className="px-8 py-5">
                      <div className="font-black text-slate-900 group-hover:text-orange-600 transition-colors">{result.studentName}</div>
                      <div className="text-[10px] font-bold text-slate-400 uppercase tracking-tighter">{result.department}</div>
                    </td>
                    <td className="px-8 py-5">
                      <span className="text-slate-900 font-black">{result.score}</span>
                      <span className="text-slate-300 font-bold text-xs ml-1">/ {result.totalPoints}</span>
                    </td>
                    <td className="px-8 py-5">
                      <div className="flex items-center gap-3">
                        <div className="w-20 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                          <div className={`h-full rounded-full ${result.percentage >= 60 ? 'bg-orange-500' : 'bg-red-500'}`} style={{ width: `${result.percentage}%` }}></div>
                        </div>
                        <span className={`font-black text-sm ${result.percentage >= 60 ? 'text-orange-600' : 'text-red-600'}`}>{result.percentage.toFixed(0)}%</span>
                      </div>
                    </td>
                    <td className="px-8 py-5 text-right">
                      <button onClick={() => setSelectedResult(result)} className="bg-slate-100 hover:bg-orange-600 hover:text-white text-slate-500 font-black py-2 px-4 rounded-xl text-[10px] transition-all uppercase tracking-widest">Review</button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </motion.div>

      <AnimatePresence>
        {selectedResult && (
          <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-md">
            <motion.div 
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="bg-white w-full max-w-4xl rounded-[2.5rem] shadow-2xl overflow-hidden"
            >
              <div className="p-8 bg-orange-600 text-white flex justify-between items-center">
                <div>
                  <h3 className="text-2xl font-black tracking-tight">{selectedResult.studentName}</h3>
                  <p className="text-orange-100 text-[10px] font-black uppercase tracking-widest opacity-80">Semantic Audit Mode</p>
                </div>
                <button onClick={() => setSelectedResult(null)} className="bg-white/10 hover:bg-white text-orange-600 p-2 rounded-xl transition-all">
                  <X size={24} strokeWidth={3} />
                </button>
              </div>
              
              <div className="p-8 max-h-[60vh] overflow-y-auto custom-scrollbar space-y-8">
                {['choice', 'tf', 'match', 'fill', 'explanation'].map(type => {
                  const sectionKeys = exam.masterKey.filter(k => k.type === type);
                  if (sectionKeys.length === 0) return null;
                  
                  return (
                    <div key={type} className="space-y-3">
                      <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] border-b border-slate-100 pb-2">{type} Section</h4>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        {sectionKeys.map(key => {
                          const studentAns = selectedResult.answers[key.id] || 'EMPTY';
                          const isCorrect = selectedResult.gradingStatus[key.id] ?? false;
                          
                          return (
                            <div key={key.id} className={`flex items-center justify-between p-3 rounded-2xl border ${isCorrect ? 'bg-green-50 border-green-100' : 'bg-red-50 border-red-100'}`}>
                              <div className="flex items-center gap-3">
                                <span className={`w-8 h-8 flex items-center justify-center rounded-lg text-[10px] font-black border ${isCorrect ? 'bg-white text-green-600 border-green-200' : 'bg-white text-red-400 border-red-200'}`}>#{key.localNumber}</span>
                                <div className="max-w-[120px]">
                                  <div className="text-[8px] text-slate-400 uppercase font-black">Student</div>
                                  <div className={`font-bold text-xs truncate ${isCorrect ? 'text-green-700' : 'text-red-700'}`}>{studentAns}</div>
                                </div>
                              </div>
                              <div className="text-right">
                                <div className="text-[8px] text-slate-400 uppercase font-black">Answer Key</div>
                                <div className="font-black text-slate-900 text-xs truncate">{key.correctAnswer}</div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  );
                })}
              </div>

              <div className="p-8 bg-slate-50 border-t border-slate-100 flex justify-between items-center">
                <div className="text-slate-400 text-[9px] font-black uppercase tracking-wider max-w-xs">
                  Rules Applied: 1-Char Spelling Tolerance & Semantic Explanation Matching.
                </div>
                <button onClick={() => setSelectedResult(null)} className="py-3 px-8 bg-orange-600 text-white font-black rounded-2xl shadow-xl shadow-orange-100 text-xs uppercase tracking-widest">Close Review</button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default ResultsTable;
