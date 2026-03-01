
import React from 'react';
import { CheckSquare } from 'lucide-react';

interface HeaderProps {
  setView: (view: 'home' | 'create' | 'scan' | 'results') => void;
  activeView: string;
  resetActiveExam: () => void;
}

const Header: React.FC<HeaderProps> = ({ setView, activeView, resetActiveExam }) => {
  return (
    <header className="bg-white border-b border-slate-200 sticky top-0 z-[150] shadow-sm">
      <div className="max-w-7xl mx-auto px-4 h-20 flex items-center justify-between">
        <div 
          className="flex items-center gap-3 cursor-pointer group" 
          onClick={() => { resetActiveExam(); setView('home'); }}
        >
          <div className="bg-orange-600 p-2 rounded-xl group-hover:rotate-12 transition-transform shadow-lg shadow-orange-100">
            <CheckSquare size={24} strokeWidth={3} color="white" />
          </div>
          <div className="flex flex-col">
            <span className="text-xl font-black tracking-tight text-slate-900 leading-none uppercase">New Test Grader</span>
            <span className="text-[10px] font-black text-orange-600 uppercase tracking-widest leading-none mt-1">Pro Edition</span>
          </div>
        </div>
        
        <nav className="flex items-center gap-3 md:gap-6">
          <button 
            onClick={() => { resetActiveExam(); setView('home'); }}
            className={`text-sm font-bold transition-all ${activeView === 'home' ? 'text-orange-600 border-b-2 border-orange-600 pb-1' : 'text-slate-500 hover:text-slate-900 pb-1'}`}
          >
            Dashboard
          </button>
          
          <div className="flex items-center gap-2">
          </div>
        </nav>
      </div>
    </header>
  );
};

export default Header;
