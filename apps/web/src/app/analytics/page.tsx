"use client";

import { useEffect, useState } from "react";
import { fetchAPI } from "@/lib/api";
import Link from "next/link";

export default function AnalyticsDashboard() {
  const [applications, setApplications] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchAPI("/jobs/applications")
      .then((data) => {
        setApplications(data.applications || []);
        setLoading(false);
      })
      .catch((err) => {
        setError(err.message);
        setLoading(false);
      });
  }, []);

  if (loading) return (
    <div className="flex flex-col justify-center items-center h-screen bg-gray-50">
      <div className="flex gap-2">
        <div className="w-4 h-4 bg-indigo-600 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
        <div className="w-4 h-4 bg-purple-600 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
        <div className="w-4 h-4 bg-blue-600 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
      </div>
      <p className="mt-4 text-indigo-900 font-semibold tracking-wide animate-pulse">Crunching your application data...</p>
    </div>
  );
  if (error) return <p className="p-10 text-red-500 font-medium">Error: {error}</p>;

  const totalJobs = applications.length;
  
  const statusCounts = applications.reduce((acc, app) => {
    const status = app.status || "saved";
    acc[status] = (acc[status] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const applied = statusCounts["applied"] || 0;
  const interviews = statusCounts["interview"] || 0;
  const offers = statusCounts["offer"] || 0;
  const rejections = statusCounts["rejected"] || 0;

  const interviewRate = applied > 0 ? Math.round((interviews / applied) * 100) : 0;
  
  const totalScore = applications.reduce((sum, app) => {
    const aiReport = app.application || app;
    const score = aiReport.analysis?.fit_score ?? app.fit_score ?? 0;
    return sum + score;
  }, 0);
  const avgFitScore = totalJobs > 0 ? Math.round(totalScore / totalJobs) : 0;

  return (
    <div className="min-h-screen bg-[#f8fafc] text-black pb-12">
      <div className="max-w-7xl mx-auto p-6 pt-12">
        <div className="flex justify-between items-center mb-10">
          <h1 className="text-4xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-indigo-900 to-purple-700">
            Performance Analytics
          </h1>
          <Link href="/applications" className="group flex items-center gap-2 text-indigo-600 hover:text-indigo-800 font-semibold transition-all">
            <span className="transform group-hover:-translate-x-1 transition-transform">&larr;</span> 
            Back to Kanban
          </Link>
        </div>

        {totalJobs === 0 ? (
          <div className="bg-white/80 backdrop-blur-lg p-16 rounded-3xl shadow-xl border border-white text-center transform transition-all duration-500 hover:scale-[1.02]">
            <div className="text-6xl mb-4">📊</div>
            <h2 className="text-2xl font-bold text-gray-800">No data yet!</h2>
            <p className="text-gray-500 mt-2 text-lg">Generate some AI applications to see your stats.</p>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-10">
              {[
                { label: "Total Tracked", val: totalJobs, color: "text-gray-900", bg: "bg-white" },
                { label: "Avg. ATS Fit", val: `${avgFitScore}%`, color: "text-green-600", bg: "bg-green-50/50" },
                { label: "Active Interviews", val: interviews, color: "text-purple-600", bg: "bg-purple-50/50" },
                { label: "Offers Received", val: offers, color: "text-blue-600", bg: "bg-blue-50/50" }
              ].map((stat, i) => (
                <div key={i} className={`p-8 rounded-3xl shadow-lg border border-white/60 backdrop-blur-md transform transition-all duration-300 hover:-translate-y-2 hover:shadow-2xl ${stat.bg}`}>
                  <p className="text-sm font-bold text-gray-500 uppercase tracking-wider">{stat.label}</p>
                  <p className={`text-5xl font-black mt-3 ${stat.color}`}>{stat.val}</p>
                </div>
              ))}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              <div className="bg-white p-8 rounded-3xl shadow-lg border border-gray-100 hover:shadow-xl transition-shadow duration-300">
                <h2 className="text-2xl font-bold text-gray-900 mb-8 flex items-center gap-2">
                  <span className="bg-blue-100 p-2 rounded-lg">📈</span> Application Pipeline
                </h2>
                <div className="space-y-6">
                  <FunnelBar label="Saved" count={statusCounts["saved"] || 0} total={totalJobs} color="from-gray-400 to-gray-500" />
                  <FunnelBar label="Applied" count={applied} total={totalJobs} color="from-blue-400 to-blue-600" />
                  <FunnelBar label="Assessment" count={statusCounts["assessment"] || 0} total={totalJobs} color="from-yellow-400 to-yellow-500" />
                  <FunnelBar label="Interviewing" count={interviews} total={totalJobs} color="from-purple-400 to-purple-600" />
                  <FunnelBar label="Offers" count={offers} total={totalJobs} color="from-green-400 to-green-600" />
                  <FunnelBar label="Rejected" count={rejections} total={totalJobs} color="from-red-400 to-red-600" />
                </div>
              </div>

              <div className="bg-gradient-to-br from-indigo-900 to-slate-900 p-8 rounded-3xl shadow-2xl border border-indigo-700/50 text-white hover:shadow-indigo-500/20 transition-shadow duration-500">
                <h2 className="text-2xl font-bold mb-8 flex items-center gap-2">
                  <span className="bg-indigo-800 p-2 rounded-lg">✨</span> AI Insights
                </h2>
                <ul className="space-y-6">
                  <li className="flex items-start gap-4 bg-white/5 p-4 rounded-2xl hover:bg-white/10 transition-colors">
                    <span className="text-2xl">💡</span>
                    <p className="text-indigo-100 leading-relaxed">
                      Your average ATS match is <strong className="text-white">{avgFitScore}%</strong>. {avgFitScore < 50 ? "Try tailoring your resume summary more aggressively using the AI suggestions to boost this score." : "Great job targeting roles that match your skill set!"}
                    </p>
                  </li>
                  <li className="flex items-start gap-4 bg-white/5 p-4 rounded-2xl hover:bg-white/10 transition-colors">
                    <span className="text-2xl">🎯</span>
                    <p className="text-indigo-100 leading-relaxed">
                      You have converted <strong className="text-white">{interviewRate}%</strong> of your applications into interviews. {interviewRate > 20 ? "Your profile is highly competitive in the current market!" : "If this number is low, consider leveraging the cold-email networking templates."}
                    </p>
                  </li>
                  <li className="flex items-start gap-4 bg-white/5 p-4 rounded-2xl hover:bg-white/10 transition-colors">
                    <span className="text-2xl">🚀</span>
                    <p className="text-indigo-100 leading-relaxed">
                      You currently have <strong className="text-white">{totalJobs}</strong> opportunities in your pipeline. Keep dropping jobs into the Kanban board to maintain momentum.
                    </p>
                  </li>
                </ul>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

function FunnelBar({ label, count, total, color }: { label: string, count: number, total: number, color: string }) {
  const percentage = total > 0 ? Math.round((count / total) * 100) : 0;
  return (
    <div className="group">
      <div className="flex justify-between text-sm mb-2 font-bold text-gray-700">
        <span>{label} <span className="text-gray-400 font-medium">({count})</span></span>
        <span className="text-indigo-600">{percentage}%</span>
      </div>
      <div className="w-full bg-gray-100 rounded-full h-4 overflow-hidden shadow-inner">
        <div 
          className={`bg-gradient-to-r ${color} h-full rounded-full transition-all duration-1000 ease-out group-hover:opacity-80`} 
          style={{ width: `${percentage}%` }}
        ></div>
      </div>
    </div>
  );
}