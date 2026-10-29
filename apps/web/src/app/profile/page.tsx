"use client";

import { useEffect, useState } from "react";
import { fetchAPI } from "@/lib/api";
import Link from "next/link";

export default function ProfilePage() {
  const [resumeText, setResumeText] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");

  useEffect(() => {
    fetchAPI("/jobs/profile")
      .then((data) => {
        setResumeText(data.resume_text || "");
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  const handleSave = async () => {
    setSaving(true);
    setMessage("");
    try {
      await fetchAPI("/jobs/profile", {
        method: "POST",
        body: JSON.stringify({ resume_text: resumeText }),
      });
      setMessage("✅ Master resume saved successfully!");
    } catch (err: any) {
      setMessage(`❌ Error: ${err.message}`);
    } finally {
      setSaving(false);
    }
  };

  if (loading) return (
    <div className="flex justify-center items-center h-screen bg-slate-50">
       <div className="w-12 h-12 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin"></div>
    </div>
  );

  return (
    <div className="min-h-screen bg-slate-50 pb-12">
      <div className="max-w-4xl mx-auto p-6 pt-12 text-black">
        <div className="flex justify-between items-center mb-10">
          <h1 className="text-4xl font-black text-slate-900 tracking-tight">User Settings</h1>
          <Link href="/applications" className="group flex items-center gap-2 text-indigo-600 hover:text-indigo-800 font-bold transition-all">
            <span className="transform group-hover:-translate-x-1 transition-transform">&larr;</span> Back to Dashboard
          </Link>
        </div>

        <div className="bg-white p-10 rounded-3xl shadow-xl border border-slate-100 transform hover:-translate-y-1 transition-transform duration-500">
          <h2 className="text-2xl font-black mb-3 text-slate-900">Your Master Resume</h2>
          <p className="text-slate-500 mb-8 font-medium">
            Paste your core resume text here once. We will automatically use it to analyze jobs, tailor applications, and prep you for interviews globally across the platform.
          </p>

          <textarea
            value={resumeText}
            onChange={(e) => setResumeText(e.target.value)}
            placeholder="Paste your full resume text here..."
            className="w-full h-[500px] p-6 border-2 border-indigo-100 rounded-2xl shadow-inner text-slate-700 leading-relaxed focus:outline-none focus:ring-4 focus:ring-indigo-500/20 focus:border-indigo-400 transition-all mb-8 font-medium bg-slate-50 hover:bg-white"
          />

          <div className="flex flex-col sm:flex-row items-center gap-6">
            <button
              onClick={handleSave}
              disabled={saving}
              className="w-full sm:w-auto bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white px-10 py-4 rounded-xl font-black tracking-wide shadow-lg hover:shadow-xl hover:-translate-y-0.5 active:scale-95 transition-all disabled:opacity-50"
            >
              {saving ? <span className="animate-pulse">Saving Context...</span> : "Save Global Context"}
            </button>
            {message && (
              <span className={`text-sm font-bold px-4 py-2 rounded-lg ${message.includes('✅') ? 'bg-emerald-50 text-emerald-700' : 'bg-rose-50 text-rose-700'}`}>
                {message}
              </span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}