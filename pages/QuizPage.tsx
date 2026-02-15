
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { QUESTIONS_12TH, QUESTIONS_UG } from '../constants';
import { QuestionCard } from '../components/QuestionCard';
import { AnswerMap } from '../types';

type Level = '12' | 'UG';

export const QuizPage: React.FC = () => {
    const [appStep, setAppStep] = useState<'WELCOME' | 'QUIZ'>('WELCOME');
    const [selectedLevel, setSelectedLevel] = useState<Level>('12');
    const [currentQuestionIndex, setCurrentQuestionIndex] = useState<number>(0);
    const [answers, setAnswers] = useState<AnswerMap>({});
    const [error, setError] = useState<string | null>(null);
    const navigate = useNavigate();

    const activeQuestions = selectedLevel === '12' ? QUESTIONS_12TH : QUESTIONS_UG;

    const handleStart = () => {
        setAppStep('QUIZ');
        setAnswers({});
        setError(null);
        setCurrentQuestionIndex(0);
    };

    const handleAnswer = async (value: string) => {
        const questionId = activeQuestions[currentQuestionIndex].id;
        const currentQuestion = activeQuestions[currentQuestionIndex];
        const nextAnswers = { ...answers, [questionId]: value };
        setAnswers(nextAnswers);

        // Check if this is the final step or has a payment link
        if (currentQuestionIndex < activeQuestions.length - 1) {
            setCurrentQuestionIndex(prev => prev + 1);
        } else {
            // 1. SAVE RAW QUIZ STATE (Defer AI Analysis)
            localStorage.setItem('pathfinder_quiz_state', JSON.stringify({
                answers: nextAnswers,
                level: selectedLevel,
                timestamp: Date.now()
            }));

            // 2. CHECK FOR PAYMENT REDIRECT
            if (currentQuestion.paymentLink) {
                // Redirect to Payment Gateway
                window.location.href = currentQuestion.paymentLink;
            } else {
                // No payment link? Go straight to results (Fallback)
                navigate('/results');
            }
        }
    };

    // WELCOME SCREEN
    if (appStep === 'WELCOME') {
        return (
            <div className="min-h-screen flex items-center justify-center p-6 bg-pink-50 relative overflow-hidden">
                <div className="max-w-5xl w-full bg-white rounded-3xl shadow-2xl overflow-hidden flex flex-col md:flex-row relative animate-fade-in-up">
                    {/* Left Brand Side */}
                    <div className="md:w-1/2 bg-white p-12 text-[#1D1D1F] flex flex-col justify-center relative overflow-hidden border-r border-slate-100">
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
                        </div>
                    </div>

                    {/* Right Action Side */}
                    <div className="md:w-1/2 p-12 flex flex-col justify-center items-center text-center bg-white relative">
                        <div className="mb-10 max-w-xs">
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

    const handleBack = () => {
        if (currentQuestionIndex > 0) {
            setCurrentQuestionIndex(prev => prev - 1);
        }
    };

    // QUIZ LAYOUT
    return (
        <div id="app-root" className="min-h-screen bg-white text-slate-900 font-sans">
            <header className="mx-auto px-6 py-6 flex items-center justify-between max-w-5xl">
                <div className="flex items-center gap-2 cursor-pointer" onClick={() => setAppStep('WELCOME')}>
                    <img src="/appli-logo.png" alt="Appli Logo" className="h-8" />
                </div>
                <div>
                    <div className="flex items-center gap-2 px-3 py-1.5 bg-white rounded-full border border-slate-200 shadow-sm">
                        <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></div>
                        <span className="text-xs font-semibold text-slate-600">
                            {selectedLevel === '12' ? 'Undergrad Track' : 'Postgrad Track'}
                        </span>
                    </div>
                </div>
            </header>

            <main className="mx-auto px-6 pb-12 max-w-5xl">
                <QuestionCard
                    question={activeQuestions[currentQuestionIndex]}
                    onAnswer={handleAnswer}
                    onBack={handleBack}
                    currentStep={currentQuestionIndex + 1}
                    totalSteps={activeQuestions.length}
                />
            </main>
        </div>
    );
};
