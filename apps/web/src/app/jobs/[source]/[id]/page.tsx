"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { fetchAPI } from "@/lib/api";
import Link from "next/link";

export default function JobDetailPage() {
  const params = useParams();
  const router = useRouter();
  const source = params.source as string;
  const id = params.id as string;

  const [job, setJob] = useState<any>(null);
  const [resumeText, setResumeText] = useState("");
  const [loading, setLoading] = useState(true);
  const [analyzing, setAnalyzing] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [analysisResult, setAnalysisResult] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const [alreadyTracked, setAlreadyTracked] = useState(false); // NEW STATE

  useEffect(() => {
    fetchAPI(`/jobs/detail/${source}/${id}`)
      .then((data) => {
        setJob(data.job);
        setLoading(false);
      })
      .catch((err) => {
        setError(err.message);
        setLoading(false);
      });

    // Check if job is already in Kanban tracker
    fetchAPI("/jobs/applications")
      .then((data) => {
        const apps = data.applications || [];
        const exists = apps.some((a: any) => a.job?.external_id === id || a.external_id === id);
        setAlreadyTracked(exists);
      })
      .catch(() => {});

    const savedResume = sessionStorage.getItem("current_resume");
    if (savedResume) setResumeText(savedResume);
  }, [source, id]);

  const handleRunAnalysis = async () => {
    if (!resumeText.trim()) {
      alert("Please provide resume text to run ATS analysis.");
      return;
    }
    setAnalyzing(true);
    setError(null);
    try {
      const data = await fetchAPI(`/jobs/detail/${source}/${id}/analyze`, {
        method: "POST",
        body: JSON.stringify({ resume_text: resumeText }),
      });
      setAnalysisResult(data);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setAnalyzing(false);
    }
  };

  const handleGenerateApplication = async () => {
    if (!resumeText.trim()) {
      alert("Please provide resume text.");
      return;
    }
    setGenerating(true);
    setError(null);
    try {
      await fetchAPI("/jobs/application", {
        method: "POST",
        body: JSON.stringify({ source, external_id: id, resume_text: resumeText }),
      });
      router.push("/applications");
    } catch (err: any) {
      setError(`Application generation failed: ${err.message}`);
    } finally {
      setGenerating(false);
    }
  };

  if (loading) return (
    <div className="flex flex-col justify-center items-center h-screen bg-slate-50">
      <div className="flex gap-2">
        <div className="w-3 h-3 bg-slate-800 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
        <div className="w-3 h-3 bg-slate-600 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
        <div className="w-3 h-3 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
      </div>
      <p className="mt-4 text-slate-800 font-bold tracking-widest text-sm animate-pulse uppercase">Fetching Job Details...</p>
    </div>
  );
  if (error && !job) return <p className="p-10 text-red-500 font-bold">Error: {error}</p>;

  return (
    <div className="min-h-screen bg-slate-50 pb-12">
      <div className="max-w-5xl mx-auto p-6 pt-10 text-black">
        <div className="flex justify-between items-center mb-8">
          <Link href="/" className="group flex items-center gap-2 text-slate-500 hover:text-indigo-600 font-bold transition-colors">
            <span className="transform group-hover:-translate-x-1 transition-transform">&larr;</span> Back to Search
          </Link>
          <a
            href={job.apply_url}
            target="_blank"
            rel="noopener noreferrer"
            className="bg-white border-2 border-slate-200 text-slate-800 px-6 py-2.5 rounded-full shadow-sm hover:shadow-md hover:border-slate-800 hover:-translate-y-0.5 active:scale-95 transition-all font-bold flex items-center gap-2"
          >
            Original Posting ↗
          </a>
        </div>

        <div className="bg-white rounded-3xl p-10 shadow-xl border border-slate-100 mb-8 transform hover:-translate-y-1 transition-transform duration-500">
          <div className="inline-block bg-indigo-50 text-indigo-700 px-4 py-1.5 rounded-full text-xs font-black tracking-widest uppercase mb-4">
            {job.source}
          </div>
          <h1 className="text-4xl font-black mb-3 text-slate-900">{job.title}</h1>
          <p className="text-2xl text-slate-600 font-bold mb-4">{job.company}</p>
          <p className="text-sm text-slate-500 font-medium flex items-center gap-2">
            <span className="bg-slate-100 p-1.5 rounded-md">📍</span> {job.location}
          </p>
        </div>

        <div className="bg-gradient-to-br from-indigo-900 to-slate-900 rounded-3xl p-10 mb-10 shadow-2xl text-white relative overflow-hidden">
          <div className="absolute -top-24 -right-24 w-64 h-64 bg-indigo-600 rounded-full blur-3xl opacity-20"></div>
          
          <h2 className="text-2xl font-black mb-3 relative z-10">Run ATS Match & Trust Evaluation</h2>
          <p className="text-indigo-200 mb-6 font-medium relative z-10 max-w-2xl">
            Analyze this specific posting against your resume for keyword match, ATS scores, and company credibility before you apply.
          </p>

          <textarea
            placeholder="Paste or update your resume text here..."
            value={resumeText}
            onChange={(e) => setResumeText(e.target.value)}
            className="w-full p-5 border-2 border-indigo-500/30 rounded-2xl h-32 mb-6 bg-white/10 backdrop-blur-md text-white placeholder-indigo-300 focus:outline-none focus:border-indigo-400 focus:ring-4 focus:ring-indigo-500/20 transition-all relative z-10"
          />

          <div className="flex flex-col sm:flex-row gap-4 relative z-10">
            <button
              onClick={handleRunAnalysis}
              disabled={analyzing || generating}
              className="flex-1 bg-white/10 hover:bg-white/20 border border-white/20 text-white px-6 py-4 rounded-xl font-bold shadow-lg hover:shadow-xl hover:-translate-y-1 active:scale-95 transition-all disabled:opacity-50 disabled:cursor-not-allowed backdrop-blur-sm"
            >
              {analyzing ? (
                <span className="flex items-center justify-center gap-2 animate-pulse"><span className="text-xl">⚙️</span> Analyzing...</span>
              ) : "1. Analyze Job Match"}
            </button>

            <button
              onClick={handleGenerateApplication}
              // FIX: Disable button if already tracked
              disabled={analyzing || generating || !resumeText || alreadyTracked}
              className="flex-1 bg-gradient-to-r from-emerald-500 to-teal-500 text-white px-6 py-4 rounded-xl font-bold shadow-lg hover:shadow-xl hover:shadow-emerald-500/20 hover:-translate-y-1 active:scale-95 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {alreadyTracked 
                ? "✓ Application Already in Tracker" 
                : generating 
                  ? <span className="flex items-center justify-center gap-2 animate-pulse"><span className="text-xl">✨</span> Crafting...</span> 
                  : "2. Generate AI Application"}
            </button>
          </div>
          {error && <p className="text-rose-400 mt-4 text-sm font-bold relative z-10 bg-rose-950/50 p-3 rounded-lg inline-block border border-rose-900/50">{error}</p>}
        </div>

        {analysisResult && (
          <div className="space-y-8 mb-10 animate-fade-in-up">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="bg-white border border-emerald-100 p-8 rounded-3xl shadow-xl text-center hover:-translate-y-2 transition-transform duration-300">
                <span className="text-xs uppercase text-emerald-600 font-black tracking-widest">Overall Score</span>
                <p className="text-6xl font-black text-transparent bg-clip-text bg-gradient-to-br from-emerald-400 to-teal-600 mt-4">
                  {analysisResult.ats_match?.overall_score}%
                </p>
              </div>
              <div className="bg-white border border-blue-100 p-8 rounded-3xl shadow-xl text-center hover:-translate-y-2 transition-transform duration-300">
                <span className="text-xs uppercase text-blue-600 font-black tracking-widest">Skill Match</span>
                <p className="text-6xl font-black text-transparent bg-clip-text bg-gradient-to-br from-blue-400 to-indigo-600 mt-4">
                  {analysisResult.ats_match?.skill_score}%
                </p>
              </div>
              <div className="bg-white border border-purple-100 p-8 rounded-3xl shadow-xl text-center hover:-translate-y-2 transition-transform duration-300">
                <span className="text-xs uppercase text-purple-600 font-black tracking-widest">Company Trust</span>
                <p className="text-6xl font-black text-transparent bg-clip-text bg-gradient-to-br from-purple-400 to-fuchsia-600 mt-4">
                  {analysisResult.company_trust?.trust_score ?? "N/A"}
                </p>
                <span className="inline-block mt-3 bg-purple-50 text-purple-700 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider">
                  {analysisResult.company_trust?.recommendation}
                </span>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="bg-emerald-50/50 border border-emerald-200 p-8 rounded-3xl shadow-lg hover:shadow-xl transition-shadow duration-300">
                <h3 className="font-black text-emerald-900 mb-6 flex items-center gap-2"><span className="text-xl">✅</span> Matched Skills</h3>
                <div className="flex flex-wrap gap-2">
                  {analysisResult.ats_match?.matched_skills?.map((s: string, i: number) => (
                    <span key={i} className="bg-white text-emerald-800 border border-emerald-200 px-4 py-2 rounded-xl text-sm font-bold shadow-sm hover:scale-105 transition-transform cursor-default">
                      {s}
                    </span>
                  ))}
                </div>
              </div>

              <div className="bg-rose-50/50 border border-rose-200 p-8 rounded-3xl shadow-lg hover:shadow-xl transition-shadow duration-300">
                <h3 className="font-black text-rose-900 mb-6 flex items-center gap-2"><span className="text-xl">❌</span> Missing Skills</h3>
                <div className="flex flex-wrap gap-2">
                  {analysisResult.ats_match?.missing_skills?.map((s: string, i: number) => (
                    <span key={i} className="bg-white text-rose-800 border border-rose-200 px-4 py-2 rounded-xl text-sm font-bold shadow-sm hover:scale-105 transition-transform cursor-default">
                      {s}
                    </span>
                  ))}
                </div>
              </div>
            </div>

            {analysisResult.company_trust?.red_flags?.length > 0 && (
              <div className="bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-200 p-8 rounded-3xl shadow-lg">
                <h3 className="font-black text-amber-900 mb-4 flex items-center gap-2"><span className="text-2xl">⚠️</span> Due Diligence Notices</h3>
                <ul className="space-y-3">
                  {analysisResult.company_trust.red_flags.map((flag: string, i: number) => (
                    <li key={i} className="flex items-start gap-3 text-amber-900 font-medium bg-white/50 p-4 rounded-xl border border-amber-100">
                      <span className="text-amber-500 mt-0.5">•</span> {flag}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        )}

        <div className="bg-white rounded-3xl p-10 shadow-xl border border-slate-100">
          <h2 className="text-2xl font-black mb-6 text-slate-900">Job Description</h2>
          <div className="text-slate-700 text-sm md:text-base whitespace-pre-wrap leading-relaxed font-medium">
            {job.description || "No full description provided."}
          </div>
        </div>
      </div>
    </div>
  );
}