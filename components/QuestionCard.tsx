import React, { useState, useEffect } from 'react';
import { Question } from '../types';

interface QuestionCardProps {
  question: Question;
  onAnswer: (value: string) => void;
  currentStep: number;
  totalSteps: number;
}

export const QuestionCard: React.FC<QuestionCardProps> = ({ question, onAnswer, currentStep, totalSteps }) => {
  const [textAnswer, setTextAnswer] = useState('');

  useEffect(() => {
    setTextAnswer('');
  }, [question.id]);

  const handleTextSubmit = () => {
    if (textAnswer.trim()) {
      onAnswer(textAnswer);
    }
  };

  const isTextInput = question.inputType === 'text';

  return (
    <div className="w-full max-w-3xl mx-auto animate-fade-in-up">
      {/* Progress Bar */}
      <div className="mb-8">
        <div className="flex justify-between items-end mb-2">
          <span className="text-indigo-600 font-bold text-xs tracking-wider uppercase">Question {currentStep}</span>
          <span className="text-slate-400 font-mono text-xs">of {totalSteps}</span>
        </div>
        <div className="w-full bg-slate-200 rounded-full h-2 overflow-hidden">
          <div 
            className="bg-indigo-600 h-full rounded-full transition-all duration-700 ease-out"
            style={{ width: `${(currentStep / totalSteps) * 100}%` }}
          />
        </div>
      </div>

      <div className="bg-white/80 backdrop-blur-xl rounded-[2rem] shadow-2xl shadow-slate-200/50 border border-white relative overflow-hidden">
        {/* Decorative blob */}
        <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-50 rounded-full blur-3xl -mr-16 -mt-16 pointer-events-none"></div>

        <div className="p-8 md:p-12 relative z-10">
          <h2 className="text-3xl md:text-4xl font-bold text-slate-800 mb-4 leading-tight">{question.text}</h2>
          {question.subtext && (
            <p className="text-lg text-slate-500 mb-10 font-normal">{question.subtext}</p>
          )}

          {isTextInput ? (
            <div className="mt-6">
              <textarea
                className="w-full p-6 bg-slate-50 border-2 border-slate-200 rounded-2xl focus:border-indigo-500 focus:bg-white focus:ring-0 transition-all text-xl text-slate-800 placeholder-slate-400 resize-none font-medium shadow-inner"
                rows={4}
                placeholder={question.placeholder || "Type your answer here..."}
                value={textAnswer}
                onChange={(e) => setTextAnswer(e.target.value)}
                autoFocus
                onKeyDown={(e) => {
                  if(e.key === 'Enter' && !e.shiftKey) {
                     e.preventDefault();
                     handleTextSubmit();
                  }
                }}
              />
              <button
                onClick={handleTextSubmit}
                disabled={!textAnswer.trim()}
                className="mt-6 w-full bg-indigo-600 text-white font-bold py-4 rounded-xl hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-lg hover:shadow-indigo-200 hover:scale-[1.01] flex items-center justify-center gap-2 group"
              >
                <span>Continue</span>
                <svg className="w-5 h-5 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" /></svg>
              </button>
              <p className="text-xs text-slate-400 mt-4 text-center">Press <span className="font-mono bg-slate-100 px-1 rounded text-slate-500 border border-slate-200">Enter</span> to continue</p>
            </div>
          ) : (
            <div className="grid gap-4 mt-8">
              {question.options?.map((option, idx) => (
                <button
                  key={option.value}
                  onClick={() => onAnswer(option.value)}
                  className="group relative flex items-center w-full p-5 text-left bg-white border border-slate-200 rounded-xl hover:border-indigo-500 hover:bg-indigo-50 hover:shadow-md transition-all duration-200 ease-out active:scale-[0.99]"
                  style={{ animationDelay: `${idx * 0.1}s` }}
                >
                  <div className="flex-shrink-0 h-10 w-10 rounded-full bg-slate-100 border border-slate-200 group-hover:border-indigo-300 group-hover:bg-white mr-5 flex items-center justify-center transition-colors">
                    <span className="text-sm font-bold text-slate-500 group-hover:text-indigo-600">{String.fromCharCode(65 + idx)}</span>
                  </div>
                  <span className="text-lg text-slate-700 group-hover:text-indigo-900 font-semibold">
                    {option.label}
                  </span>
                  <div className="absolute right-5 opacity-0 group-hover:opacity-100 transition-opacity transform group-hover:translate-x-1 text-indigo-500">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};