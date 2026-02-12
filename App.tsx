import React, { useState, useRef } from 'react';
import { createRoot } from 'react-dom/client';
import { QUESTIONS_12TH, QUESTIONS_UG } from './constants';
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



  const handleAnswer = async (value: string) => {
    const questionId = activeQuestions[currentQuestionIndex].id;
    const nextAnswers = { ...answers, [questionId]: value };
    setAnswers(nextAnswers);

    if (currentQuestionIndex < activeQuestions.length - 1) {
      setCurrentQuestionIndex(prev => prev + 1);
    } else {
      setAppStep('LOADING');
      try {
        const result = await analyzeCareerPath(nextAnswers, selectedLevel);
        setAnalysisResult(result);
        setAppStep('RESULTS');
      } catch (err) {
        console.error(err);
        setError("Error: " + (err instanceof Error ? err.message : String(err)));
        setAppStep('WELCOME');
      }
    }
  };

  // 1. WELCOME SCREEN (Deep Corporate Theme)
  if (appStep === 'WELCOME') {
    return (
      <div className="min-h-screen flex items-center justify-center p-6 bg-pink-50 relative overflow-hidden">
        {/* Background Decorations */}
        <div className="absolute top-[-10%] left-[-10%] w-[40rem] h-[40rem] bg-pink-200/40 rounded-full blur-[100px] pointer-events-none"></div>
        <div className="absolute bottom-[-10%] right-[-10%] w-[35rem] h-[35rem] bg-pink-300/30 rounded-full blur-[120px] pointer-events-none"></div>
        <div className="absolute top-[20%] right-[10%] w-[20rem] h-[20rem] bg-white/60 rounded-full blur-[80px] pointer-events-none mix-blend-overlay"></div>
        <div className="max-w-5xl w-full bg-white rounded-3xl shadow-2xl overflow-hidden flex flex-col md:flex-row relative animate-fade-in-up">

          {/* Left Brand Side */}
          <div className="md:w-1/2 bg-white p-12 text-[#1D1D1F] flex flex-col justify-center relative overflow-hidden border-r border-slate-100">
            {/* Abstract geometric accents */}
            <div className="absolute top-0 right-0 w-64 h-64 bg-pink-400 rounded-full blur-[80px] opacity-20 translate-x-1/2 -translate-y-1/2"></div>
            <div className="absolute bottom-0 left-0 w-48 h-48 bg-[#ED1164] rounded-full blur-[60px] opacity-10 -translate-x-1/4 translate-y-1/4"></div>

            <div className="relative z-10">
              <div className="flex items-center gap-3 mb-8">
                <img src="/appli-logo.png" alt="Appli Logo" className="h-14" />
              </div>

              <h1 className="text-5xl font-bold mb-6 leading-tight font-sans">
                Design Your <span className="text-[#ED1164]">Future Career.</span>
              </h1>
              <p className="text-slate-600 text-lg mb-8 leading-relaxed font-light max-w-sm">
                Advanced AI analysis of your skills, passions, and psychological drivers to recommend the perfect academic path.
              </p>

              <div className="flex items-center gap-4 text-sm font-medium opacity-60">
                <span className="flex items-center gap-2"><div className="w-1.5 h-1.5 rounded-full bg-emerald-400"></div> AI-Powered</span>
                <span className="flex items-center gap-2"><div className="w-1.5 h-1.5 rounded-full bg-[#ED1164]"></div> Data-Backed</span>
              </div>
            </div>
          </div>

          {/* Right Action Side */}
          <div className="md:w-1/2 p-12 flex flex-col justify-center items-center text-center bg-white relative">
            <div className="mb-10 max-w-xs">
              <div className="w-16 h-16 rounded-2xl bg-pink-50 flex items-center justify-center mx-auto mb-6">
                <svg className="w-8 h-8 text-[#ED1164]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
              </div>
              <h2 className="text-2xl font-bold text-slate-900 mb-3">Begin Assessment</h2>
              <p className="text-slate-500 text-sm leading-relaxed">
                Discover your professional archetype and ideal degree matches in under 3 minutes.
              </p>
            </div>

            <button
              onClick={handleStart}
              className="w-full bg-[#1D1D1F] hover:bg-[#333] text-white font-bold py-4 px-8 rounded-xl transition-all duration-200 shadow-xl hover:-translate-y-0.5"
            >
              Start Your Journey
            </button>
            {error && <p className="mt-4 text-red-600 text-xs bg-red-50 px-3 py-2 rounded border border-red-100">{error}</p>}
          </div>
        </div>
      </div>
    );
  }

  // 2. LEVEL SELECTION
  if (appStep === 'SELECT_LEVEL') {
    return (
      <div className="min-h-screen flex items-center justify-center p-6 bg-white">
        <div className="max-w-4xl w-full">
          <div className="text-center mb-12 animate-fade-in-up">
            <button onClick={() => setAppStep('WELCOME')} className="text-slate-400 hover:text-[#ED1164] mb-8 text-sm flex items-center justify-center gap-2 mx-auto transition-colors font-medium">
              ← Return Home
            </button>
            <h2 className="text-3xl font-bold text-slate-900 mb-3">Choose the Stream you wish to explore</h2>
            <p className="text-slate-500">We tailor our AI model based on your education level.</p>
          </div>

          <div className="grid md:grid-cols-2 gap-6 mb-12 animate-fade-in-up" style={{ animationDelay: '0.1s' }}>
            <button
              onClick={() => handleLevelSelect('12')}
              className="group relative bg-white p-8 rounded-2xl border border-slate-200 hover:border-[#ED1164] hover:ring-1 hover:ring-[#ED1164] shadow-sm hover:shadow-md transition-all duration-200 text-left"
            >
              <div className="w-12 h-12 bg-pink-50 rounded-xl flex items-center justify-center mb-6 group-hover:bg-[#ED1164] group-hover:text-white transition-colors duration-200">
                <span className="text-2xl">🎓</span>
              </div>
              <h3 className="text-xl font-bold text-slate-800 mb-2">Explore Undergraduate Programs </h3>
              <p className="text-slate-500 text-sm">Ideally for students seeking Undergraduate degrees (B.Tech, B.Des, BBA).</p>
            </button>

            <button
              onClick={() => handleLevelSelect('UG')}
              className="group relative bg-white p-8 rounded-2xl border border-slate-200 hover:border-[#ED1164] hover:ring-1 hover:ring-[#ED1164] shadow-sm hover:shadow-md transition-all duration-200 text-left"
            >
              <div className="w-12 h-12 bg-pink-50 rounded-xl flex items-center justify-center mb-6 group-hover:bg-[#ED1164] group-hover:text-white transition-colors duration-200">
                <span className="text-2xl">🚀</span>
              </div>
              <h3 className="text-xl font-bold text-slate-800 mb-2">Explore Postgraduate Programs</h3>
              <p className="text-slate-500 text-sm">Ideally for graduates seeking Master's programs or career pivots.</p>
            </button>
          </div>


        </div>
      </div>
    );
  }

  // 3. MAIN APP LAYOUT
  return (
    <div id="app-root" className="min-h-screen bg-white text-slate-900 font-sans">
      <header className={`mx-auto px-6 py-6 flex items-center justify-between transition-all duration-300 ${appStep === 'RESULTS' ? 'max-w-7xl' : 'max-w-5xl'}`}>
        <div className="flex items-center gap-2 cursor-pointer" onClick={() => setAppStep('WELCOME')}>
          <img src="/appli-logo.png" alt="Appli Logo" className="h-8" />
        </div>

        <div>
          {appStep === 'QUIZ' && (
            <div className="flex items-center gap-2 px-3 py-1.5 bg-white rounded-full border border-slate-200 shadow-sm">
              <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></div>
              <span className="text-xs font-semibold text-slate-600">
                {selectedLevel === '12' ? 'Undergrad Track' : 'Postgrad Track'}
              </span>
            </div>
          )}
        </div>
      </header>

      <main className={`mx-auto px-6 pb-12 transition-all duration-300 ${appStep === 'RESULTS' ? 'max-w-7xl' : 'max-w-5xl'}`}>
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