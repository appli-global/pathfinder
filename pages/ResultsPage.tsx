import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { LoadingScreen } from '../components/LoadingScreen';
import { ResultsView } from '../components/ResultsView';
import { AnalysisResult } from '../types';
import { analyzeCareerPath } from '../services/geminiService';

export const ResultsPage: React.FC = () => {
    const [analysisResult, setAnalysisResult] = useState<AnalysisResult | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();

    useEffect(() => {
        // 1. Check for saved result first (Persistence from refresh)
        const savedResult = localStorage.getItem('pathfinder_analysis_result');
        if (savedResult) {
            try {
                const parsed = JSON.parse(savedResult);
                setAnalysisResult(parsed.data);
                setLoading(false);
                return; // We have results, no need to re-run AI
            } catch (e) {
                console.error("Failed to parse saved result", e);
            }
        }

        // 2. If no result, check if we have a quiz state to process (Post-Payment)
        const quizState = localStorage.getItem('pathfinder_quiz_state');
        if (quizState) {
            // 2. STRICT PAYMENT CHECK
            const paymentId = searchParams.get('razorpay_payment_id');

            if (paymentId) {
                // Proceed to analysis
                try {
                    const parsedState = JSON.parse(quizState);
                    setLoading(true);

                    // TRIGGER AI ANALYSIS
                    analyzeCareerPath(parsedState.answers, parsedState.level)
                        .then(result => {
                            // Save Result
                            localStorage.setItem('pathfinder_analysis_result', JSON.stringify({
                                timestamp: Date.now(),
                                data: result
                            }));
                            // Clear Quiz State
                            localStorage.removeItem('pathfinder_quiz_state');

                            setAnalysisResult(result);
                            setLoading(false);
                        })
                        .catch(err => {
                            console.error("Analysis Error:", err);
                            setError("Analysis failed. Please try again.");
                            setLoading(false);
                        });
                } catch (e) {
                    console.error("Failed to parse quiz state", e);
                    setError("Invalid session data.");
                    setLoading(false);
                }
            } else {
                // Payment Missing -> Redirect Home
                navigate('/');
            }
        } else {
            // No Quiz State -> Redirect Home
            navigate('/');
        }
    }, [navigate]);

    const handleRestart = () => {
        localStorage.removeItem('pathfinder_analysis_result');
        localStorage.removeItem('pathfinder_quiz_state');
        navigate('/');
    };

    if (loading) return <LoadingScreen />;

    if (error) {
        return (
            <div className="min-h-screen flex items-center justify-center p-6 bg-white">
                <div className="text-center">
                    <h2 className="text-2xl font-bold text-red-600 mb-4">Something went wrong</h2>
                    <p className="text-slate-600 mb-8">{error}</p>
                    <button
                        onClick={handleRestart}
                        className="px-6 py-3 bg-slate-900 text-white rounded-xl hover:bg-slate-700"
                    >
                        Return Home
                    </button>
                </div>
            </div>
        );
    }

    if (!analysisResult) return null; // Should redirect before this

    return (
        <div className="min-h-screen bg-white text-slate-900 font-sans">
            <header className="mx-auto px-6 py-6 flex items-center justify-between max-w-7xl">
                <div className="flex items-center gap-2 cursor-pointer" onClick={handleRestart}>
                    <img src="/appli-logo.png" alt="Appli Logo" className="h-8" />
                </div>
            </header>

            <main className="mx-auto px-6 pb-12 max-w-7xl">
                <ResultsView data={analysisResult} onRestart={handleRestart} />
            </main>
        </div>
    );
};
