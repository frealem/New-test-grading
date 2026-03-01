
import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Save, X, Plus, Trash2, Hash, Type as TypeIcon, Info } from 'lucide-react';
import { Exam, QuestionKey, QuestionType } from '../types';

interface MasterKeyFormProps {
  onSubmit: (exam: Exam) => void;
  onCancel: () => void;
}

const MasterKeyForm: React.FC<MasterKeyFormProps> = ({ onSubmit, onCancel }) => {
  const [title, setTitle] = useState('');
  const [classDept, setClassDept] = useState('');
  const [teacherName, setTeacherName] = useState('');

  const createInitialKey = () => {
    const key: QuestionKey[] = [];
    const config: { type: QuestionType, count: number, points: number }[] = [
      { type: 'choice', count: 50, points: 1 },
      { type: 'tf', count: 30, points: 1 },
      { type: 'match', count: 20, points: 1 },
      { type: 'fill', count: 20, points: 2 },
      { type: 'explanation', count: 20, points: 5 }
    ];

    config.forEach(group => {
      for (let i = 1; i <= group.count; i++) {
        key.push({
          id: `${group.type}_${i}_${Math.random().toString(36).substr(2, 4)}`,
          localNumber: i,
          type: group.type,
          correctAnswer: '',
          points: group.points
        });
      }
    });
    return key;
  };

  const [questions, setQuestions] = useState<QuestionKey[]>(createInitialKey());
  const [counts, setCounts] = useState<Record<QuestionType, number>>({
    choice: 50,
    tf: 30,
    match: 20,
    fill: 20,
    explanation: 20
  });

  const handleUpdateCount = (type: QuestionType, newCount: number) => {
    const val = Math.max(0, Math.min(200, newCount));
    setCounts({ ...counts, [type]: val });
    
    const otherTypes = questions.filter(q => q.type !== type);
    const currentTypeQuestions = questions.filter(q => q.type === type);
    
    let updatedTypeQuestions: QuestionKey[] = [];
    
    if (val > currentTypeQuestions.length) {
      // Add more
      updatedTypeQuestions = [...currentTypeQuestions];
      const defaultPoints = type === 'explanation' ? 5 : type === 'fill' ? 2 : 1;
      for (let i = currentTypeQuestions.length + 1; i <= val; i++) {
        updatedTypeQuestions.push({
          id: `${type}_${i}_${Math.random().toString(36).substr(2, 4)}`,
          localNumber: i,
          type,
          correctAnswer: '',
          points: defaultPoints
        });
      }
    } else {
      // Truncate
      updatedTypeQuestions = currentTypeQuestions.slice(0, val);
    }
    
    setQuestions([...otherTypes, ...updatedTypeQuestions].sort((a, b) => {
      const order: QuestionType[] = ['choice', 'tf', 'match', 'fill', 'explanation'];
      if (a.type !== b.type) return order.indexOf(a.type) - order.indexOf(b.type);
      return a.localNumber - b.localNumber;
    }));
  };

  const handleUpdateBulkPoints = (type: QuestionType, points: number) => {
    setQuestions(questions.map(q => q.type === type ? { ...q, points } : q));
  };

  const handleRemoveQuestion = (id: string) => {
    const qToRemove = questions.find(q => q.id === id);
    if (!qToRemove) return;
    
    const filtered = questions.filter(q => q.id !== id);
    
    // Crucial: Renumber local numbers within the same type to maintain 1, 2, 3... order
    const updated = filtered.map(q => {
      if (q.type === qToRemove.type) {
        const typeGroup = filtered.filter(f => f.type === q.type);
        const indexInGroup = typeGroup.indexOf(q) + 1;
        return { ...q, localNumber: indexInGroup };
      }
      return q;
    });
    setQuestions(updated);
  };

  const updateQuestion = (id: string, field: keyof QuestionKey, value: any) => {
    setQuestions(questions.map(q => q.id === id ? { ...q, [field]: value } : q));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title || !classDept || !teacherName) return alert("Please complete the exam metadata.");
    
    const exam: Exam = {
      id: Math.random().toString(36).substr(2, 9),
      title,
      classDepartment: classDept,
      teacherName,
      createdAt: Date.now(),
      masterKey: questions
    };
    onSubmit(exam);
  };

  const grouped = {
    choice: questions.filter(q => q.type === 'choice'),
    tf: questions.filter(q => q.type === 'tf'),
    match: questions.filter(q => q.type === 'match'),
    fill: questions.filter(q => q.type === 'fill'),
    explanation: questions.filter(q => q.type === 'explanation'),
  };

  const labels: Record<QuestionType, string> = {
    choice: "Multiple Choice",
    tf: "True / False",
    match: "Matching",
    fill: "Fill in the Blank",
    explanation: "Explanation / Concept"
  };

  return (
    <div className="bg-white rounded-[2.5rem] shadow-2xl border border-slate-200 overflow-hidden">
      <div className="p-8 bg-orange-600 text-white sticky top-0 z-10 shadow-lg flex justify-between items-center">
        <div>
          <h2 className="text-3xl font-black tracking-tight leading-none">Master Key Config</h2>
          <p className="text-orange-100 mt-2 font-bold text-xs uppercase tracking-widest">Sectioned Pro Template</p>
        </div>
        <div className="text-right">
          <div className="text-[10px] font-black uppercase opacity-60">Total Questions</div>
          <div className="text-3xl font-black">{questions.length}</div>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="p-8 space-y-12">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="md:col-span-1">
            <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Exam Title</label>
            <input type="text" value={title} onChange={e => setTitle(e.target.value)} required placeholder="Exam Title" className="w-full px-5 py-3.5 bg-slate-50 border border-slate-200 rounded-2xl font-bold focus:ring-4 focus:ring-orange-100 outline-none" />
          </div>
          <div>
            <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Department</label>
            <input type="text" value={classDept} onChange={e => setClassDept(e.target.value)} required placeholder="Department" className="w-full px-5 py-3.5 bg-slate-50 border border-slate-200 rounded-2xl font-bold focus:ring-4 focus:ring-orange-100 outline-none" />
          </div>
          <div>
            <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Teacher Name</label>
            <input type="text" value={teacherName} onChange={e => setTeacherName(e.target.value)} required placeholder="Teacher Name" className="w-full px-5 py-3.5 bg-slate-50 border border-slate-200 rounded-2xl font-bold focus:ring-4 focus:ring-orange-100 outline-none" />
          </div>
        </div>

        {(Object.keys(grouped) as QuestionType[]).map(type => (
          <div key={type} className="space-y-6">
            <div className="flex items-center justify-between border-b-2 border-slate-100 pb-3">
              <div className="flex items-center gap-3">
                <div className="w-2.5 h-6 bg-orange-600 rounded-full"></div>
                <h3 className="text-lg font-black text-slate-900 uppercase tracking-tight">{labels[type]}</h3>
              </div>
              <div className="flex items-center gap-6">
                <div className="flex items-center gap-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Count:</label>
                  <input 
                    type="number" 
                    value={counts[type]} 
                    onChange={e => handleUpdateCount(type, parseInt(e.target.value) || 0)}
                    className="w-16 px-2 py-1 bg-orange-50 border border-orange-100 rounded-lg text-xs font-black text-orange-600 focus:ring-2 focus:ring-orange-500 outline-none"
                  />
                </div>
                <div className="flex items-center gap-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Points/Q:</label>
                  <input 
                    type="number" 
                    placeholder="Pts"
                    onChange={e => handleUpdateBulkPoints(type, parseInt(e.target.value) || 0)}
                    className="w-14 px-2 py-1 bg-slate-50 border border-slate-200 rounded-lg text-xs font-black text-slate-600 focus:ring-2 focus:ring-orange-500 outline-none"
                  />
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {grouped[type].map(q => (
                <div key={q.id} className="group relative bg-white border border-slate-100 p-4 rounded-2xl hover:border-orange-400 hover:shadow-xl transition-all shadow-sm">
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-[10px] font-black text-slate-400 uppercase">#{q.localNumber}</span>
                    <button 
                      type="button" 
                      onClick={() => handleRemoveQuestion(q.id)} 
                      className="text-slate-300 hover:text-red-500 transition-colors opacity-0 group-hover:opacity-100"
                    >
                      <Trash2 size={14} strokeWidth={3} />
                    </button>
                  </div>
                  <input 
                    type="text" 
                    value={q.correctAnswer} 
                    onChange={e => updateQuestion(q.id, 'correctAnswer', e.target.value)}
                    placeholder={type === 'explanation' ? "Keywords/Core Concept" : "Correct Answer"}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-100 rounded-xl text-xs font-bold outline-none focus:ring-2 focus:ring-orange-500"
                  />
                  <div className="mt-3 flex items-center justify-between px-1">
                    <span className="text-[9px] font-black text-slate-400 uppercase">Weight</span>
                    <input 
                      type="number" 
                      value={q.points} 
                      onChange={e => updateQuestion(q.id, 'points', parseInt(e.target.value) || 0)}
                      className="w-10 text-right text-xs font-black text-orange-600 bg-transparent outline-none"
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}

        <div className="flex gap-4 pt-10 sticky bottom-8 z-10">
          <button type="button" onClick={onCancel} className="flex-1 py-5 bg-slate-100 text-slate-600 font-black rounded-[2rem] hover:bg-slate-200 transition-all uppercase tracking-widest text-xs flex items-center justify-center gap-2">
            <X size={16} strokeWidth={3} />
            Cancel
          </button>
          <button type="submit" className="flex-1 py-5 bg-orange-600 text-white font-black rounded-[2rem] shadow-2xl shadow-orange-100 hover:bg-orange-700 transition-all uppercase tracking-widest text-xs flex items-center justify-center gap-2">
            <Save size={16} strokeWidth={3} />
            Save & Finalize
          </button>
        </div>
      </form>
    </div>
  );
};

export default MasterKeyForm;
