import React, { useState } from 'react';
import { AnalysisResult } from '../types';
import { Radar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, ResponsiveContainer } from 'recharts';

interface ResultsViewProps {
  data: AnalysisResult;
  onRestart: () => void;
}

// Helper to strip Markdown and clean text
const cleanText = (text: string | undefined) => {
  if (!text) return "";
  return text
    .replace(/[*_`#]/g, '') // Remove Markdown characters
    .replace(/\s+/g, ' ')   // Normalize whitespace
    .trim();
};

export const ResultsView: React.FC<ResultsViewProps> = ({ data, onRestart }) => {
  const [isGeneratingPdf, setIsGeneratingPdf] = useState(false);
  const shareUrl = window.location.href;
  const archetypeTitle = cleanText(data.archetype.title);
  const shareText = `I just discovered my professional archetype is "${archetypeTitle}" on Pathfinder AI! 🚀`;
  
  const twitterLink = `https://twitter.com/intent/tweet?text=${encodeURIComponent(shareText)}&url=${encodeURIComponent(shareUrl)}`;
  const linkedInLink = `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(shareUrl)}`;
  const whatsappLink = `https://wa.me/?text=${encodeURIComponent(shareText + " " + shareUrl)}`;

  const handlePrint = () => {
    window.print();
  };

  const handleDownloadPDF = async () => {
    setIsGeneratingPdf(true);
    
    // 1. Target the LIVE element (not a clone) to ensure charts/content are rendered
    const element = document.getElementById('results-container');
    if (!element) {
      setIsGeneratingPdf(false);
      return;
    }

    // 2. Save current state
    const originalScrollPos = window.scrollY;
    
    // 3. Scroll top to ensure html2canvas starts from 0,0
    window.scrollTo(0, 0);

    // 4. Apply PDF class to LIVE element (Overlay hides the glitch from user)
    element.classList.add('pdf-export-mode');

    const opt = {
      margin:       [10, 10, 10, 10], // mm
      filename:     `Pathfinder_Report_${archetypeTitle.replace(/\s+/g, '_')}.pdf`,
      image:        { type: 'jpeg', quality: 0.98 },
      html2canvas:  { 
        scale: 2, 
        useCORS: true, 
        logging: false,
        scrollY: 0,
        windowWidth: 1100, // Matches the forced CSS width
        height: 1600, // Capture enough height for A4
        x: 0,
        y: 0
      },
      jsPDF:        { unit: 'mm', format: 'a4', orientation: 'portrait' },
      pagebreak:    { mode: ['avoid-all', 'css', 'legacy'] }
    };

    const html2pdf = (window as any).html2pdf;

    if (html2pdf) {
      try {
        // Wait for CSS changes to repaint (removing glassmorphism, disabling animations)
        await new Promise(resolve => setTimeout(resolve, 800)); 
        await html2pdf().set(opt).from(element).save();
      } catch (err) {
        console.error("PDF generation failed:", err);
        alert("Could not generate PDF. Please use the Print option (Ctrl+P) instead.");
      } finally {
        // 5. Restore State
        element.classList.remove('pdf-export-mode');
        window.scrollTo(0, originalScrollPos);
        setIsGeneratingPdf(false);
      }
    } else {
      alert("PDF Generator is initializing...");
      element.classList.remove('pdf-export-mode');
      setIsGeneratingPdf(false);
    }
  };

  const handleInstagramShare = () => {
    const caption = `${shareText}\n\nCheck it out here: ${shareUrl}`;
    navigator.clipboard.writeText(caption).then(() => {
      alert("Caption copied to clipboard! Open Instagram to paste it in your Story or Post.");
    });
  };

  return (
    <>
      {/* OVERLAY: Hides the UI shift during PDF generation */}
      {isGeneratingPdf && (
        <div className="fixed inset-0 z-[10000] bg-white flex flex-col items-center justify-center">
          <div className="w-16 h-16 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin mb-4"></div>
          <h2 className="text-xl font-bold text-slate-800">Generating Report...</h2>
          <p className="text-slate-500">Please wait while we format your PDF.</p>
        </div>
      )}

      <div id="results-container" className="max-w-6xl mx-auto space-y-8 animate-fade-in pb-12 print:space-y-4 print:pb-0">
        
        {/* Header Section - Archetype */}
        <div className="bg-white/80 backdrop-blur-xl rounded-[2rem] shadow-2xl shadow-slate-200/50 overflow-hidden border border-white relative">
          <div className="absolute top-0 right-0 w-96 h-96 bg-indigo-100/50 rounded-full blur-[80px] pointer-events-none"></div>
          
          <div className="p-8 md:p-12 relative z-10">
            <div className="header-flex flex flex-col md:flex-row justify-between items-start md:items-center gap-8">
              <div className="header-content flex-1">
                <div className="flex items-center gap-3 mb-4">
                   <span className="px-3 py-1 bg-indigo-50 text-indigo-700 text-xs font-bold uppercase tracking-widest rounded-full border border-indigo-100">Archetype Identified</span>
                </div>
                <h1 className="text-4xl md:text-6xl font-extrabold text-slate-900 mb-6 tracking-tight">{archetypeTitle}</h1>
                <p className="text-lg md:text-xl text-slate-600 max-w-3xl leading-relaxed font-light">
                  {cleanText(data.archetype.description)}
                </p>
              </div>
              {/* Score Card */}
              <div className="hidden md:flex flex-col items-center justify-center bg-white rounded-2xl p-6 border border-slate-100 shadow-xl shadow-slate-200 w-32 h-32 no-print">
                <span className="text-4xl font-bold text-indigo-600">98%</span>
                <span className="text-xs text-slate-400 uppercase text-center mt-1 font-semibold">Match Score</span>
              </div>
            </div>
          </div>

          {/* Drivers Grid */}
          <div className="drivers-grid grid grid-cols-2 md:grid-cols-5 divide-y md:divide-y-0 md:divide-x divide-slate-100 border-t border-slate-100 bg-slate-50/50">
            {[
              { label: "Academic Driver", value: data.archetype.drivers.academic, icon: "📚" },
              { label: "Passion Driver", value: data.archetype.drivers.passion, icon: "🔥" },
              { label: "Cognitive Style", value: data.archetype.drivers.cognitive, icon: "🧠" },
              { label: "Preferred Domain", value: data.archetype.drivers.domain, icon: "🌍" },
              { label: "Core Motivation", value: data.archetype.drivers.motivation, icon: "⭐" },
            ].map((item, idx) => (
              <div key={idx} className="p-6 hover:bg-white transition-colors">
                <div className="text-2xl mb-3 no-print">{item.icon}</div>
                <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">{item.label}</h4>
                <p className="text-slate-800 font-semibold text-sm leading-snug">{cleanText(item.value)}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Vision Board Section */}
        <div className="bg-gradient-to-br from-indigo-50 to-white backdrop-blur-xl rounded-[2rem] shadow-xl shadow-indigo-100/50 p-8 md:p-10 border border-white relative overflow-hidden">
          <div className="relative z-10">
            <div className="flex items-center gap-3 mb-8">
              <div className="p-2 bg-indigo-600 rounded-lg shadow-lg shadow-indigo-200">
                 <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>
              </div>
              <h3 className="text-2xl font-bold text-slate-900 tracking-tight">Your Career Vision Board</h3>
            </div>
            
            <div className="vision-grid grid md:grid-cols-3 gap-8">
              <div className="md:col-span-2">
                <div className="bg-white rounded-2xl p-8 border border-slate-100 shadow-sm h-full">
                  <h4 className="text-indigo-600 text-xs font-bold uppercase mb-4 tracking-widest">A Day in Your Future Life</h4>
                  <p className="text-xl leading-relaxed text-slate-700 font-light italic">
                    "{cleanText(data.visionBoard.futureSelf)}"
                  </p>
                </div>
              </div>
              
              <div className="flex flex-col gap-4">
                 <div className="bg-white rounded-2xl p-6 border border-slate-100 shadow-sm flex-1 flex flex-col justify-center">
                   <h4 className="text-indigo-600 text-xs font-bold uppercase mb-4 text-center tracking-widest">Core Themes</h4>
                   <div className="flex flex-wrap justify-center gap-2">
                     {data.visionBoard.keyThemes.map((theme, i) => (
                       <span key={i} className="px-4 py-2 bg-slate-50 rounded-lg text-sm font-semibold border border-slate-100 text-slate-600">
                         {cleanText(theme)}
                       </span>
                     ))}
                   </div>
                 </div>
                 <div className="bg-indigo-600 rounded-2xl p-6 shadow-lg shadow-indigo-200 flex items-center justify-center text-center">
                    <p className="text-lg font-serif italic text-white/90">"{cleanText(data.visionBoard.quote)}"</p>
                 </div>
              </div>
            </div>
          </div>
        </div>

        {/* Main Content Grid */}
        <div className="content-grid grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* Left Col: Skill Signature Chart */}
          <div className="skill-section lg:col-span-1 bg-white rounded-[2rem] shadow-xl shadow-slate-200/50 p-8 flex flex-col border border-white">
            <h3 className="text-xl font-bold text-slate-900 mb-2">Skill Signature</h3>
            <p className="text-slate-500 text-sm mb-8">A visual map of your core aptitudes.</p>
            
            <div className="chart-container flex-grow h-72 w-full relative">
              <ResponsiveContainer width="100%" height="100%">
                <RadarChart cx="50%" cy="50%" outerRadius="80%" data={data.skillSignature}>
                  <PolarGrid stroke="#cbd5e1" />
                  <PolarAngleAxis dataKey="subject" tick={{ fill: '#475569', fontSize: 11, fontWeight: 600 }} />
                  <PolarRadiusAxis angle={30} domain={[0, 100]} tick={false} axisLine={false} />
                  <Radar
                    name="Aptitude"
                    dataKey="A"
                    stroke="#4f46e5"
                    strokeWidth={3}
                    fill="#6366f1"
                    fillOpacity={0.3}
                    isAnimationActive={false} 
                  />
                </RadarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Right Col: Recommendations */}
          <div className="rec-section lg:col-span-2 space-y-6">
             <div className="flex items-center gap-3 mb-2">
               <span className="bg-emerald-100 text-emerald-600 p-2 rounded-lg border border-emerald-100">
                 <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
               </span>
               <h3 className="text-2xl font-bold text-slate-900">Top Recommendations</h3>
             </div>

             <div className="space-y-4">
               {data.recommendations.map((course, idx) => (
                 <div key={idx} className="rec-card bg-white rounded-2xl shadow-lg shadow-slate-200/50 p-6 border-l-4 border-indigo-500 border-y border-r border-slate-100 hover:border-indigo-300 transition-all duration-300 group shadow-sm">
                   <div className="flex justify-between items-start mb-4">
                     <div>
                       {course.degree && (
                         <span className="text-xs font-bold text-indigo-600 uppercase tracking-widest mb-1 block">
                           {cleanText(course.degree)}
                         </span>
                       )}
                       <h4 className="text-xl font-bold text-slate-900">{cleanText(course.courseName)}</h4>
                     </div>
                     <span className="bg-indigo-50 text-indigo-700 border border-indigo-100 text-xs font-bold px-3 py-1 rounded-full">
                       {course.relevanceScore}% Match
                     </span>
                   </div>
                   <p className="text-slate-600 mb-5 leading-relaxed">{cleanText(course.matchReason)}</p>
                   <div className="bg-slate-50 rounded-xl p-4 flex items-start gap-3 border border-slate-100">
                     <svg className="w-5 h-5 text-indigo-500 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                     <div>
                       <p className="text-xs font-bold text-slate-400 uppercase mb-1">AI Insight</p>
                       <p className="text-sm text-slate-500 italic">{cleanText(course.dataInsight)}</p>
                     </div>
                   </div>
                 </div>
               ))}
             </div>
             
             {/* Alternative Pathways */}
             <div className="bg-white rounded-2xl p-8 border border-slate-100 shadow-md shadow-slate-200/30 mt-8">
               <h4 className="text-lg font-bold text-slate-900 mb-6">Alternative Pathways</h4>
               <div className="pathways-grid grid md:grid-cols-2 gap-4">
                  {data.alternativePathways.map((path, idx) => (
                    <div key={idx} className="bg-slate-50 p-5 rounded-xl border border-slate-100 hover:bg-slate-100 transition-colors">
                      <span className="text-xs font-bold text-indigo-600 uppercase tracking-wide mb-2 block">{cleanText(path.focus)}</span>
                      <h5 className="font-bold text-slate-800 mb-1">{cleanText(path.courseName)}</h5>
                      <p className="text-xs text-slate-500">{cleanText(path.insight)}</p>
                    </div>
                  ))}
               </div>
             </div>
          </div>
        </div>

        {/* Community Insights */}
        <div className="stats-grid bg-white rounded-[2rem] shadow-xl shadow-slate-200/50 p-10 border border-slate-100">
          <div className="flex items-center gap-3 mb-8">
            <span className="text-2xl no-print">👥</span>
            <h3 className="text-2xl font-bold text-slate-900">Community Insights</h3>
          </div>
          <p className="text-slate-500 mb-10 border-l-2 border-indigo-500 pl-4">{cleanText(data.communityStats.headline)}</p>

          <div className="grid md:grid-cols-2 gap-12">
            {/* Careers */}
            <div>
              <h4 className="font-bold text-slate-400 uppercase text-xs tracking-wider mb-6">Common Career Paths</h4>
              <div className="space-y-5">
                {data.communityStats.topCareers.map((career, i) => (
                  <div key={i}>
                    <div className="flex justify-between text-sm mb-2">
                      <span className="font-medium text-slate-700">{cleanText(career.name)}</span>
                      <span className="font-bold text-indigo-600">{career.percentage}%</span>
                    </div>
                    <div className="w-full bg-slate-100 rounded-full h-2">
                      <div 
                        className="bg-indigo-500 h-2 rounded-full transition-all duration-1000 ease-out" 
                        style={{ width: `${career.percentage}%` }}
                      ></div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Interests */}
            <div>
              <h4 className="font-bold text-slate-400 uppercase text-xs tracking-wider mb-6">Shared Interests</h4>
              <div className="flex flex-wrap gap-2 mb-8">
                {data.communityStats.commonInterests.map((interest, i) => (
                  <span key={i} className="px-3 py-1.5 bg-slate-50 rounded-lg text-sm border border-slate-200 text-slate-600">
                    {cleanText(interest)}
                  </span>
                ))}
              </div>
              <div className="p-4 bg-indigo-50 rounded-xl border border-indigo-100 no-print">
                  <div className="flex gap-3">
                    <span className="text-xl">💡</span>
                    <p className="text-sm text-slate-600 leading-relaxed">
                      <strong>Did you know?</strong> This data compares you with thousands of other successful professionals who started with a similar profile.
                    </p>
                  </div>
              </div>
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="flex flex-col items-center justify-center pt-8 gap-4 no-print print:hidden">
          <div className="flex gap-4">
            <button 
               onClick={handleDownloadPDF} 
               disabled={isGeneratingPdf}
               className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-3 px-8 rounded-xl transition-all shadow-lg hover:shadow-indigo-200 flex items-center gap-2 disabled:opacity-50"
            >
              {isGeneratingPdf ? 'Generating PDF...' : 'Download Report'}
            </button>
            <button
              onClick={onRestart}
              className="bg-white border border-slate-200 text-slate-600 hover:bg-slate-50 font-bold py-3 px-8 rounded-xl transition-all flex items-center gap-2 shadow-sm"
            >
              Start New Assessment
            </button>
          </div>
          <p className="text-slate-400 text-xs">Pathfinder AI v2.5 </p>
        </div>

      </div>
    </>
  );
};