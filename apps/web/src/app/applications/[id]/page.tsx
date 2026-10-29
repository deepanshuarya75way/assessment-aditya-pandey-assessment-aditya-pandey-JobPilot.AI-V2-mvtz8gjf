"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { fetchAPI } from "@/lib/api";
import Link from "next/link";

export default function ApplicationDetailsPage() {
  const params = useParams();
  const appId = params.id as string;
  
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [coverLetterContent, setCoverLetterContent] = useState("");
  const [prepLoading, setPrepLoading] = useState(false);
  const [prepData, setPrepData] = useState<string | null>(null);

  // NEW: State to track checked checklist items per application
  const [checkedItems, setCheckedItems] = useState<{ [key: number]: boolean }>({});

  useEffect(() => {
    fetchAPI(`/jobs/applications/${appId}`)
      .then((res) => {
        const root = res.application || res;
        const aiReport = root.application || root;
        const processedData = {
          ...root,
          analysis: aiReport.analysis || root.analysis,
          tailored_resume: aiReport.tailored_resume || root.tailored_resume,
          cover_letter: aiReport.cover_letter || root.cover_letter,
          checklist: aiReport.checklist || root.checklist,
          status: root.status || "saved",
          job: root.job,
        };
        setData(processedData);
        const rawLetter = processedData.cover_letter;
        const extractedText = typeof rawLetter === "string" 
          ? rawLetter 
          : rawLetter?.content || rawLetter?.body || rawLetter?.letter || "No cover letter generated.";
        setCoverLetterContent(extractedText);
        setLoading(false);

        // Load saved checklist state from localStorage for this specific application
        const savedChecklist = localStorage.getItem(`checklist_${appId}`);
        if (savedChecklist) {
          try {
            setCheckedItems(JSON.parse(savedChecklist));
          } catch (e) {
            console.error("Failed to parse checklist storage");
          }
        }
      })
      .catch((err) => {
        setError(err.message);
        setLoading(false);
      });
  }, [appId]);

  // Handle toggling checklist items and persisting to localStorage
  const handleChecklistToggle = (index: number) => {
    const updated = { ...checkedItems, [index]: !checkedItems[index] };
    setCheckedItems(updated);
    localStorage.setItem(`checklist_${appId}`, JSON.stringify(updated));
  };

  const generateInterviewPrep = async () => {
    setPrepLoading(true);
    try {
      const res = await fetchAPI(`/jobs/applications/${appId}/interview-prep`, { method: "POST" });
      setPrepData(res.prep_guide);
    } catch (err: any) {
      alert(`Failed to generate prep: ${err.message}`);
    } finally {
      setPrepLoading(false);
    }
  };

  if (loading) return (
    <div className="flex flex-col justify-center items-center h-screen bg-gray-50">
      <div className="flex gap-2 mb-4">
        <div className="w-4 h-4 bg-blue-600 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
        <div className="w-4 h-4 bg-indigo-600 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
        <div className="w-4 h-4 bg-purple-600 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
      </div>
      <p className="text-gray-600 font-medium tracking-widest uppercase text-sm animate-pulse">Loading AI Materials...</p>
    </div>
  );
  if (error || !data) return <p className="p-10 text-red-500 font-medium">Error: {error || "Application not found"}</p>;

  const title = data.analysis?.job_title || data.job?.title || "Role";
  const company = data.analysis?.company || data.job?.company || "Company";
  const fitScore = data.analysis?.fit_score ?? data.fit_score ?? 0;
  const checklistItems = data.checklist?.items || (Array.isArray(data.checklist) ? data.checklist : []);
  const summary = data.tailored_resume?.summary;
  const keywords = data.tailored_resume?.keywords_to_emphasize || [];
  const targetJobUrl = data.job?.apply_url || data.job?.source_url || "#";

  return (
    <div className="min-h-screen bg-slate-50 pb-12">
      <div className="max-w-6xl mx-auto p-6 pt-10 text-black print:p-0">
        <div className="flex justify-between items-center mb-8 print:hidden">
          <Link href="/applications" className="group flex items-center gap-2 text-slate-500 hover:text-indigo-600 font-bold transition-colors">
            <span className="transform group-hover:-translate-x-1 transition-transform">&larr;</span> Back to Kanban
          </Link>
          <div className="flex gap-4">
            <a 
              href={targetJobUrl} target="_blank" rel="noopener noreferrer"
              className="bg-gradient-to-r from-orange-500 to-rose-500 text-white px-6 py-2.5 rounded-full shadow-lg hover:shadow-xl hover:scale-105 active:scale-95 transition-all font-bold flex items-center gap-2"
            >
              Apply Now ↗
            </a>
            <button 
              onClick={generateInterviewPrep} disabled={prepLoading}
              className={`px-6 py-2.5 rounded-full shadow-lg font-bold flex items-center gap-2 transition-all ${prepLoading ? 'bg-purple-300 scale-95 cursor-not-allowed' : 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white hover:shadow-xl hover:scale-105 active:scale-95'}`}
            >
              {prepLoading ? <span className="animate-pulse">⏳ Generating...</span> : "🎤 Prep for Interview"}
            </button>
            <button 
              onClick={() => window.print()}
              className="bg-white text-slate-800 border-2 border-slate-200 px-6 py-2.5 rounded-full shadow-sm hover:border-slate-800 hover:bg-slate-50 hover:scale-105 active:scale-95 transition-all font-bold flex items-center gap-2"
            >
              📄 PDF
            </button>
          </div>
        </div>

        <div className="bg-white rounded-3xl p-10 shadow-xl border border-slate-100 mb-8 transform hover:-translate-y-1 transition-transform duration-300 print:shadow-none print:border-none print:px-0">
          <h1 className="text-4xl font-black text-slate-900 mb-2">{title}</h1>
          <p className="text-2xl text-slate-600 font-medium mb-6">{company}</p>
          <div className="flex gap-4 print:hidden">
            <span className="bg-emerald-100/80 text-emerald-800 border border-emerald-200 px-4 py-1.5 rounded-full font-bold tracking-wide">
              ATS Fit: {fitScore}%
            </span>
            <span className="bg-amber-100/80 text-amber-800 border border-amber-200 px-4 py-1.5 rounded-full font-bold capitalize tracking-wide">
              Status: {data.status}
            </span>
          </div>
        </div>

        {prepData && (
          <div className="bg-gradient-to-br from-purple-900 to-indigo-900 rounded-3xl p-8 shadow-2xl mb-8 print:hidden animate-fade-in-up">
            <h2 className="text-2xl font-black mb-6 text-white flex items-center gap-3">
              <span className="bg-white/20 p-2 rounded-xl">🎯</span> Your Custom Interview Guide
            </h2>
            <div className="whitespace-pre-wrap text-slate-800 bg-white/95 backdrop-blur p-8 rounded-2xl shadow-inner leading-relaxed font-medium">
              {prepData}
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <div className="space-y-8">
            <div className="bg-white rounded-3xl p-8 shadow-xl border border-slate-100 hover:shadow-2xl transition-shadow duration-300">
              <div className="flex justify-between items-center mb-6 print:hidden">
                  <h2 className="text-2xl font-bold text-slate-900">Tailored Cover Letter</h2>
                  <button 
                      onClick={() => setIsEditing(!isEditing)}
                      className="text-sm bg-indigo-50 text-indigo-700 px-4 py-2 rounded-full hover:bg-indigo-100 font-bold transition-colors active:scale-95"
                  >
                      {isEditing ? "Save & View" : "✏️ Edit"}
                  </button>
              </div>
              
              {isEditing ? (
                  <textarea 
                      value={coverLetterContent}
                      onChange={(e) => setCoverLetterContent(e.target.value)}
                      className="w-full h-[500px] p-6 border-2 border-indigo-100 rounded-2xl shadow-inner text-slate-700 leading-relaxed focus:outline-none focus:ring-4 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all print:hidden"
                  />
              ) : (
                  <div className="whitespace-pre-wrap text-slate-700 leading-relaxed p-2 font-medium">
                      {coverLetterContent}
                  </div>
              )}
            </div>
          </div>

          <div className="space-y-8 print:hidden">
            <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-3xl p-8 shadow-lg border border-blue-100/50 hover:-translate-y-1 transition-transform duration-300">
              <h2 className="text-2xl font-bold mb-6 text-blue-900 flex items-center gap-2">
                <span className="text-3xl">✨</span> Resume Adjustments
              </h2>
              {summary && (
                <div className="mb-6 bg-white/60 p-6 rounded-2xl shadow-sm border border-white">
                  <h3 className="font-bold text-blue-900 mb-3 uppercase tracking-wider text-xs">Recommended Summary</h3>
                  <p className="text-slate-700 leading-relaxed font-medium">{summary}</p>
                </div>
              )}
              {keywords.length > 0 && (
                <div>
                  <h3 className="font-bold text-blue-900 mb-3 uppercase tracking-wider text-xs">Keywords to Emphasize</h3>
                  <div className="flex flex-wrap gap-2">
                    {keywords.map((kw: string, i: number) => (
                      <span key={i} className="bg-blue-600 text-white text-xs px-3 py-1.5 rounded-full font-bold shadow-sm hover:scale-105 transition-transform cursor-default">
                        {kw}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {checklistItems.length > 0 && (
              <div className="bg-white rounded-3xl p-8 shadow-lg border border-slate-100 hover:-translate-y-1 transition-transform duration-300">
                <h2 className="text-2xl font-bold mb-6 text-slate-900 flex items-center gap-2">
                  <span className="text-indigo-500">☑</span> Pre-Application Checklist
                </h2>
                <ul className="space-y-4">
                  {checklistItems.map((item: string, i: number) => {
                    const isChecked = !!checkedItems[i];
                    return (
                      <li 
                        key={i} 
                        onClick={() => handleChecklistToggle(i)}
                        className="flex items-start gap-4 text-slate-700 font-medium group cursor-pointer select-none"
                      >
                        <div className={`mt-1 w-5 h-5 rounded border-2 flex items-center justify-center transition-colors ${isChecked ? 'bg-indigo-600 border-indigo-600 text-white' : 'border-indigo-200 group-hover:border-indigo-500 group-hover:bg-indigo-50'}`}>
                          {isChecked && <span className="text-xs font-bold">✓</span>}
                        </div>
                        <span className={`flex-1 transition-colors ${isChecked ? 'line-through text-slate-400' : 'group-hover:text-indigo-900'}`}>
                          {item}
                        </span>
                      </li>
                    );
                  })}
                </ul>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}