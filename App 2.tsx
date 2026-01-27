import React, { useState, useRef } from 'react';
import { createRoot } from 'react-dom/client';
import { QUESTIONS_12TH, QUESTIONS_UG, parseCoursesFromCSV } from './constants';
import { QuestionCard } from './components/QuestionCard';
import { LoadingScreen } from './components/LoadingScreen';
import { ResultsView } from './components/ResultsView';
import { AnswerMap, AnalysisResult, Course } from './types';
import { analyzeCareerPath } from './services/geminiService';

type Step = 'WELCOME' | 'SELECT_LEVEL' | 'QUIZ' | 'LOADING' | 'RESULTS';
type Level = '12' | 'UG';

const App: React.FC = () => {
  const [appStep, setAppStep] = useState<Step>('WELCOME');
  const [selectedLevel, setSelectedLevel] = useState<Level>('12');
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState<number>(0);
  const [answers, setAnswers] = useState<AnswerMap>({});
  const [analysisResult, setAnalysisResult] = useState<AnalysisResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  const [customCourses, setCustomCourses] = useState<Course[]>([]);
  const [customFileName, setCustomFileName] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const activeQuestions = selectedLevel === '12' ? QUESTIONS_12TH : QUESTIONS_UG;

  const handleStart = () => {
    setAppStep('SELECT_LEVEL');
    setAnswers({});
    setAnalysisResult(null);
    setError(null);
    setCurrentQuestionIndex(0);
  };

  const handleLevelSelect = (level: Level) => {
    setSelectedLevel(level);
    setAppStep('QUIZ');
  };

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      const content = e.target?.result as string;
      if (content) {
        try {
          const parsed = parseCoursesFromCSV(content);
          if (parsed.length > 0) {
            setCustomCourses(parsed);
            setCustomFileName(file.name);
            setError(null);
          } else {
            setError("Could not parse courses from CSV. Please check the format.");
          }
        } catch (err) {
          console.error(err);
          setError("Failed to parse CSV file.");
        }
      }
    };
    reader.readAsText(file);
  };

  const handleAnswer = async (value: string) => {
    const questionId = activeQuestions[currentQuestionIndex].id;
    const nextAnswers = { ...answers, [questionId]: value };
    setAnswers(nextAnswers);

    if (currentQuestionIndex < activeQuestions.length - 1) {
      setCurrentQuestionIndex(prev => prev + 1);
    } else {
      setAppStep('LOADING');
      try {
        const result = await analyzeCareerPath(nextAnswers, selectedLevel, customCourses);
        setAnalysisResult(result);
        setAppStep('RESULTS');
      } catch (err) {
        console.error(err);
        setError("Error: " + (err instanceof Error ? err.message : String(err)));
        setAppStep('WELCOME');
      }
    }
  };

  // 1. WELCOME SCREEN (Light Theme)
  if (appStep === 'WELCOME') {
    return (
      <div className="min-h-screen flex items-center justify-center p-6">
        <div className="max-w-5xl w-full bg-white/80 backdrop-blur-xl rounded-[2.5rem] shadow-2xl border border-white/50 overflow-hidden flex flex-col md:flex-row relative">

          {/* Left Decorative Side */}
          <div className="md:w-1/2 bg-gradient-to-br from-indigo-600 to-violet-700 p-12 text-white flex flex-col justify-center relative overflow-hidden">
            <div className="absolute top-0 left-0 w-full h-full opacity-10 pointer-events-none">
              <svg className="w-full h-full" viewBox="0 0 100 100" preserveAspectRatio="none">
                <path d="M0 100 C 20 0 50 0 100 100 Z" fill="white" fillOpacity="0.2" />
              </svg>
            </div>
            <div className="relative z-10">
              <span className="inline-block px-3 py-1 bg-white/20 rounded-full text-xs font-bold tracking-wider mb-6 border border-white/30 backdrop-blur-md">AI-POWERED GUIDANCE</span>
              <h1 className="text-5xl font-extrabold mb-6 leading-tight tracking-tight">Design Your <br />Future.</h1>
              <p className="text-indigo-100 text-lg mb-8 leading-relaxed font-light">
                Pathfinder AI analyzes your unique skill signature to recommend degrees and careers where you will thrive, not just survive.
              </p>
              <div className="flex items-center gap-3 text-sm font-medium bg-black/10 w-fit px-4 py-2 rounded-xl border border-white/10 backdrop-blur-sm">
                <div className="w-2 h-2 rounded-full bg-green-400 animate-pulse"></div>

              </div>
            </div>
          </div>

          {/* Right Action Side */}
          <div className="md:w-1/2 p-12 flex flex-col justify-center items-center text-center bg-white">
            <div className="mb-10">
              <div className="w-20 h-20 rounded-2xl bg-indigo-50 flex items-center justify-center mx-auto mb-6 shadow-sm border border-indigo-100">
                <svg className="w-10 h-10 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <h2 className="text-3xl font-bold text-slate-800 mb-3">Ready to start?</h2>
              <p className="text-slate-500">Discover your academic archetype in 2 minutes.</p>
            </div>

            <button
              onClick={handleStart}
              className="w-full bg-slate-900 text-white font-bold py-4 px-8 rounded-xl hover:bg-slate-800 hover:scale-[1.02] transition-all duration-200 shadow-xl shadow-slate-200"
            >
              Start Assessment
            </button>
            {error && <p className="mt-4 text-red-600 text-sm bg-red-50 px-4 py-2 rounded-lg border border-red-100">{error}</p>}
          </div>
        </div>
      </div>
    );
  }

  // 2. LEVEL SELECTION (Light Theme)
  if (appStep === 'SELECT_LEVEL') {
    return (
      <div className="min-h-screen flex items-center justify-center p-6">
        <div className="max-w-4xl w-full">
          <div className="text-center mb-12 animate-fade-in-up">
            <button onClick={() => setAppStep('WELCOME')} className="text-slate-400 hover:text-slate-600 mb-6 text-sm flex items-center justify-center gap-2 mx-auto transition-colors font-medium">
              ← Back to Home
            </button>
            <h2 className="text-4xl font-bold text-slate-900 mb-4">Current Education Level</h2>
            <p className="text-slate-500 text-lg">We tailor recommendations based on your journey.</p>
          </div>

          <div className="grid md:grid-cols-2 gap-6 mb-12 animate-fade-in-up" style={{ animationDelay: '0.1s' }}>
            <button
              onClick={() => handleLevelSelect('12')}
              className="group relative bg-white p-8 rounded-3xl border-2 border-transparent hover:border-indigo-500 shadow-xl shadow-slate-200/50 hover:shadow-indigo-500/10 transition-all duration-300 text-left overflow-hidden"
            >
              <div className="w-14 h-14 bg-indigo-50 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300">
                <span className="text-3xl">🎓</span>
              </div>
              <h3 className="text-2xl font-bold text-slate-800 mb-2">After Class 12</h3>
              <p className="text-slate-500">Explore Undergraduate degrees (B.Tech, B.Des, BBA) tailored to your strengths.</p>
            </button>

            <button
              onClick={() => handleLevelSelect('UG')}
              className="group relative bg-white p-8 rounded-3xl border-2 border-transparent hover:border-violet-500 shadow-xl shadow-slate-200/50 hover:shadow-violet-500/10 transition-all duration-300 text-left overflow-hidden"
            >
              <div className="w-14 h-14 bg-violet-50 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300">
                <span className="text-3xl">🚀</span>
              </div>
              <h3 className="text-2xl font-bold text-slate-800 mb-2">Post-Graduation</h3>
              <p className="text-slate-500">Explore Master's programs and specialized career pivots (MBA, M.Tech, etc.).</p>
            </button>
          </div>

          {/* Custom Data Upload */}
          <div className="max-w-lg mx-auto animate-fade-in-up" style={{ animationDelay: '0.2s' }}>
            <div className="bg-white/60 backdrop-blur-md rounded-2xl p-6 border border-white shadow-lg shadow-slate-200/50">
              <div className="flex items-center justify-between mb-4">
                <h4 className="font-semibold text-slate-700 flex items-center gap-2">
                  <svg className="w-5 h-5 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" /></svg>
                  Upload Custom Catalog
                </h4>
                {customFileName && (
                  <span className="text-xs font-bold text-emerald-600 bg-emerald-50 px-2 py-1 rounded border border-emerald-100">
                    Active
                  </span>
                )}
              </div>

              <input type="file" accept=".csv" ref={fileInputRef} onChange={handleFileUpload} className="hidden" />

              <div className="flex gap-3">
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="flex-1 bg-slate-100 hover:bg-slate-200 text-sm text-slate-700 font-medium py-2.5 px-4 rounded-xl transition-colors"
                >
                  {customFileName ? customFileName : 'Choose CSV File'}
                </button>
                {customFileName && (
                  <button
                    onClick={() => {
                      setCustomCourses([]);
                      setCustomFileName(null);
                      if (fileInputRef.current) fileInputRef.current.value = "";
                    }}
                    className="bg-red-50 hover:bg-red-100 text-red-500 px-4 rounded-xl transition-colors"
                  >
                    ✕
                  </button>
                )}
              </div>
              {error && <p className="text-xs text-red-500 mt-3 text-center">{error}</p>}
            </div>
          </div>
        </div>
      </div>
    );
  }

  // 3. MAIN APP LAYOUT (Light Theme)
  return (
    <div id="app-root" className="min-h-screen p-4 md:p-8 relative">
      {/* Background blobs */}
      <div className="fixed top-0 left-0 w-full h-full pointer-events-none z-[-1] overflow-hidden">
        <div className="absolute top-[-10%] right-[-10%] w-[500px] h-[500px] bg-indigo-200/40 rounded-full blur-[100px]"></div>
        <div className="absolute bottom-[-10%] left-[-10%] w-[500px] h-[500px] bg-violet-200/40 rounded-full blur-[100px]"></div>
      </div>

      <header className="max-w-6xl mx-auto mb-8 flex items-center justify-between">
        <div className="flex items-center gap-3 cursor-pointer group" onClick={() => setAppStep('WELCOME')}>
          <div className="bg-white shadow-md w-10 h-10 rounded-xl flex items-center justify-center text-indigo-600 font-bold border border-white group-hover:scale-105 transition-transform">P</div>
          <div>
            <span className="font-bold text-xl text-slate-800 tracking-tight block leading-none">Pathfinder</span>
            <span className="text-xs text-indigo-500 font-semibold tracking-wider">AI GUIDANCE</span>
          </div>
        </div>

        <div className="flex flex-col items-end">
          {appStep === 'QUIZ' && (
            <span className="px-3 py-1 bg-white/60 backdrop-blur rounded-full text-xs text-slate-600 font-medium border border-white shadow-sm">
              {selectedLevel === '12' ? 'Undergrad Track' : 'Postgrad Track'}
            </span>
          )}
        </div>
      </header>

      <main className="max-w-6xl mx-auto">
        {appStep === 'QUIZ' ? (
          <QuestionCard
            question={activeQuestions[currentQuestionIndex]}
            onAnswer={handleAnswer}
            currentStep={currentQuestionIndex + 1}
            totalSteps={activeQuestions.length}
          />
        ) : appStep === 'LOADING' ? (
          <LoadingScreen />
        ) : appStep === 'RESULTS' && analysisResult ? (
          <ResultsView data={analysisResult} onRestart={handleStart} />
        ) : (
          <div className="hidden"></div>
        )}
      </main>
    </div>
  );
};

export default App;