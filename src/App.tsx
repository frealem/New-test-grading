
import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Database, Wifi, WifiOff, AlertTriangle, Sparkles, CheckCircle2, X } from 'lucide-react';
import { db } from './services/db';
import { Exam, StudentResult } from './types';
import MasterKeyForm from './components/MasterKeyForm';
import Scanner from './components/Scanner';
import ResultsTable from './components/ResultsTable';
import Header from './components/Header';

class ErrorBoundary extends React.Component<{children: React.ReactNode}, {hasError: boolean}> {
  constructor(props: {children: React.ReactNode}) {
    super(props);
    this.state = { hasError: false };
  }
  static getDerivedStateFromError() { return { hasError: true }; }
  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-slate-50 p-4">
          <div className="bg-white p-8 rounded-[2.5rem] shadow-2xl border border-slate-200 max-w-md text-center">
            <div className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <AlertTriangle className="text-red-600 w-10 h-10" />
            </div>
            <h1 className="text-2xl font-black text-slate-900 mb-4">Something went wrong</h1>
            <p className="text-slate-600 mb-8 font-medium">The application encountered an unexpected error. Please try refreshing the page.</p>
            <button onClick={() => window.location.reload()} className="w-full bg-orange-600 text-white font-black py-4 rounded-2xl hover:bg-orange-700 transition-all">
              Refresh Application
            </button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}

const App: React.FC = () => {
  const [activeExam, setActiveExam] = useState<Exam | null>(null);
  const [view, setView] = useState<'home' | 'create' | 'scan' | 'results'>('home');
  const [exams, setExams] = useState<Exam[]>([]);
  const [results, setResults] = useState<StudentResult[]>([]);
  const [notification, setNotification] = useState<{message: string, type: 'error' | 'success'} | null>(null);
  const [cloudStatus, setCloudStatus] = useState<'connected' | 'disconnected' | 'checking'>('checking');
  const [hasApiKey, setHasApiKey] = useState<boolean>(false);

  // Check API Key status
  useEffect(() => {
    const checkApiKey = async () => {
      if (window.aistudio && typeof window.aistudio.hasSelectedApiKey === 'function') {
        const selected = await window.aistudio.hasSelectedApiKey();
        setHasApiKey(selected);
      }
    };
    checkApiKey();
  }, []);

  const handleOpenApiKeyDialog = async () => {
    if (window.aistudio && typeof window.aistudio.openSelectKey === 'function') {
      await window.aistudio.openSelectKey();
      // Guidelines say: "You MUST assume the key selection was successful after triggering openSelectKey() and proceed to the app."
      setHasApiKey(true); 
    }
  };

  // Check cloud status
  useEffect(() => {
    const checkStatus = async () => {
      try {
        const res = await fetch('/api/health');
        const data = await res.json();
        setCloudStatus(data.database === 'connected' ? 'connected' : 'disconnected');
      } catch (e) {
        setCloudStatus('disconnected');
      }
    };
    checkStatus();
    const interval = setInterval(checkStatus, 10000);
    return () => clearInterval(interval);
  }, []);

  // Load all exams from Cloud on startup
  useEffect(() => {
    const initExams = async () => {
      const cloudExams = await db.getExams();
      setExams(cloudExams);
    };
    initExams();
  }, []);

  const handleCreateExam = async (exam: Exam) => {
    try {
      await db.saveExam(exam);
      // Refresh exam list from DB
      const updatedExams = await db.getExams();
      setExams(updatedExams);
      
      setActiveExam(exam);
      setResults([]);
      setView('scan');
      
      setNotification({ message: "Exam Key Saved Successfully", type: 'success' });
      setTimeout(() => setNotification(null), 3000);
    } catch (e) {
      setNotification({ message: "Saved Locally (Sync Failed)", type: 'error' });
      setTimeout(() => setNotification(null), 5000);
      
      // Still proceed locally
      setActiveExam(exam);
      setResults([]);
      setView('scan');
    }
  };

  const handleSelectExam = async (exam: Exam) => {
    setActiveExam(exam);
    const examResults = await db.getResultsByExam(exam.id);
    setResults(examResults);
    setView('results');
  };

  const onScanComplete = async (result: StudentResult) => {
    const isDuplicate = results.some(r => r.studentName.toLowerCase().trim() === result.studentName.toLowerCase().trim());
    
    if (isDuplicate) {
      setNotification({ message: `Student "${result.studentName}" already graded.`, type: 'error' });
      setTimeout(() => setNotification(null), 4000);
      return;
    }

    try {
      await db.saveResult(result);
      const updatedResults = await db.getResultsByExam(activeExam!.id);
      setResults(updatedResults);
      
      setNotification({ message: `Graded: ${result.studentName} (${result.percentage.toFixed(0)}%)`, type: 'success' });
      setTimeout(() => setNotification(null), 3000);
      setView('results');
    } catch (e) {
      setNotification({ message: "Saved Locally (Sync Failed)", type: 'error' });
      setTimeout(() => setNotification(null), 5000);
      
      // Refresh local results
      const localResults = db.getResultsLocal().filter(r => r.examId === activeExam!.id);
      setResults(localResults);
      setView('results');
    }
  };

  return (
    <ErrorBoundary>
      <div className="min-h-screen bg-slate-50 pb-12">
        <Header 
          setView={setView} 
          activeView={view} 
          resetActiveExam={() => setActiveExam(null)} 
        />

        <AnimatePresence mode="wait">
          {notification && (
            <motion.div 
              initial={{ opacity: 0, x: 100 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 100 }}
              className={`fixed top-24 right-4 z-[200] p-4 rounded-2xl shadow-2xl border flex items-center gap-3 ${notification.type === 'error' ? 'bg-white border-red-200 text-red-700' : 'bg-orange-600 border-orange-500 text-white'}`}
            >
              <div className={`w-8 h-8 rounded-full flex items-center justify-center ${notification.type === 'error' ? 'bg-red-50' : 'bg-white/20'}`}>
                {notification.type === 'error' ? <AlertTriangle size={16} /> : <Sparkles size={16} />}
              </div>
              <p className="font-bold text-sm tracking-tight">{notification.message}</p>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Subtle Cloud Status Indicator */}
        <div className="fixed bottom-4 right-4 z-[200] opacity-20 hover:opacity-100 transition-opacity cursor-default">
          <div className="flex items-center gap-1.5 px-2 py-1 rounded-full bg-slate-200/50 backdrop-blur-sm border border-slate-300/50">
            {cloudStatus === 'connected' ? (
              <Wifi size={10} className="text-green-600" />
            ) : cloudStatus === 'disconnected' ? (
              <WifiOff size={10} className="text-red-600" />
            ) : (
              <div className="w-2.5 h-2.5 rounded-full bg-orange-500 animate-pulse" />
            )}
            <span className="text-[8px] font-medium text-slate-500 uppercase tracking-tighter">
              {cloudStatus === 'connected' ? 'Online' : cloudStatus === 'disconnected' ? 'Offline' : 'Sync'}
            </span>
          </div>
        </div>

        <main className="max-w-7xl mx-auto px-4 mt-8">
          <AnimatePresence mode="wait">
            {view === 'home' && (
              <motion.div 
                key="home"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="space-y-8"
              >
                <div className="bg-white rounded-[2.5rem] p-10 shadow-sm border border-slate-200 text-center md:text-left">
                  <h1 className="text-4xl font-black text-slate-900 mb-3 tracking-tight">New Test Grader <span className="text-orange-600">Pro</span></h1>
                  <p className="text-slate-600 mb-8 text-lg font-medium max-w-xl">High-speed grading with secure persistence for Exam Keys and Results.</p>
                  <button 
                    onClick={() => setView('create')}
                    className="w-full md:w-auto bg-orange-600 hover:bg-orange-700 text-white font-black py-5 px-10 rounded-2xl transition-all shadow-2xl flex items-center justify-center gap-3 text-lg"
                  >
                    <Plus size={24} strokeWidth={3} />
                    New Exam Key
                  </button>
                </div>

                {exams.length > 0 && (
                  <div className="space-y-4">
                    <h2 className="text-xl font-black text-slate-800 flex items-center gap-2 px-2 uppercase tracking-widest text-xs opacity-50">
                      Exam Library
                    </h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {exams.map(exam => (
                        <motion.div 
                          key={exam.id} 
                          whileHover={{ scale: 1.02 }}
                          whileTap={{ scale: 0.98 }}
                          onClick={() => handleSelectExam(exam)}
                          className="bg-white p-6 rounded-[2rem] border border-slate-200 shadow-sm hover:border-orange-400 hover:shadow-xl transition-all cursor-pointer group"
                        >
                          <div className="flex justify-between items-start mb-2">
                            <h3 className="font-black text-xl text-slate-900 group-hover:text-orange-600 transition-colors truncate pr-2">{exam.title}</h3>
                            <span className="text-[10px] font-black text-slate-400 bg-slate-50 px-2 py-1 rounded-full">{new Date(exam.createdAt).toLocaleDateString()}</span>
                          </div>
                          <div className="flex flex-col gap-1 mb-4">
                            <p className="text-xs text-slate-500 flex items-center gap-1.5 font-bold uppercase tracking-wider">{exam.classDepartment}</p>
                          </div>
                          <div className="flex items-center justify-between border-t border-slate-50 pt-4">
                            <span className="text-[10px] font-black text-orange-600 uppercase tracking-widest">{exam.masterKey.length} Items</span>
                            <div className="bg-orange-50 text-orange-700 group-hover:bg-orange-600 group-hover:text-white py-2 px-5 rounded-xl font-black text-xs transition-all">
                              Manage Key
                            </div>
                          </div>
                        </motion.div>
                      ))}
                    </div>
                  </div>
                )}
              </motion.div>
            )}

            {view === 'create' && (
              <motion.div key="create" initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }}>
                <MasterKeyForm onSubmit={handleCreateExam} onCancel={() => setView('home')} />
              </motion.div>
            )}

            {view === 'scan' && activeExam && (
              <motion.div key="scan" initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }}>
                <Scanner 
                  exam={activeExam} 
                  onComplete={onScanComplete} 
                  onBack={() => setView('home')}
                />
              </motion.div>
            )}

            {view === 'results' && activeExam && (
              <motion.div key="results" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }}>
                <ResultsTable 
                  exam={activeExam} 
                  results={results} 
                  onScanMore={() => setView('scan')} 
                />
              </motion.div>
            )}
          </AnimatePresence>
        </main>


      </div>
    </ErrorBoundary>
  );
};

export default App;
