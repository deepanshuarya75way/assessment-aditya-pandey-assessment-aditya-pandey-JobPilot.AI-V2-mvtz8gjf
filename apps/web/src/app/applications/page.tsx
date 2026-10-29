"use client";
import { useState, useEffect } from "react";
import { fetchAPI } from "@/lib/api";
import Link from "next/link";

const COLUMNS = [
  { id: "saved", title: "Saved", headerColor: "bg-slate-800 text-white", bodyColor: "bg-slate-100/50" },
  { id: "applied", title: "Applied", headerColor: "bg-blue-600 text-white", bodyColor: "bg-blue-50/50" },
  { id: "assessment", title: "Assessment", headerColor: "bg-yellow-500 text-white", bodyColor: "bg-yellow-50/50" },
  { id: "interview", title: "Interview", headerColor: "bg-purple-600 text-white", bodyColor: "bg-purple-50/50" },
  { id: "offer", title: "Offer", headerColor: "bg-emerald-600 text-white", bodyColor: "bg-emerald-50/50" },
  { id: "rejected", title: "Rejected", headerColor: "bg-red-500 text-white", bodyColor: "bg-red-50/50" },
];

export default function Applications() {
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
        setError("Failed to load applications.");
        setLoading(false);
      });
  }, []);

  const handleDragStart = (e: React.DragEvent, appId: string) => {
    e.dataTransfer.setData("applicationId", appId);
  };

  const handleDragOver = (e: React.DragEvent) => e.preventDefault();

  const handleDrop = async (e: React.DragEvent, newStatus: string) => {
    e.preventDefault();
    const appId = e.dataTransfer.getData("applicationId");
    if (!appId) return;

    const previousApps = [...applications];
    setApplications((prev) =>
      prev.map((app) =>
        app._id === appId || app.id === appId ? { ...app, status: newStatus } : app
      )
    );

    try {
      await fetchAPI(`/jobs/applications/${appId}/status`, {
        method: "PATCH",
        body: JSON.stringify({ status: newStatus }),
      });
    } catch (err: any) {
      alert(`Failed to update status: ${err.message}`);
      setApplications(previousApps);
    }
  };

  if (loading) return (
    <div className="flex flex-col justify-center items-center h-screen bg-slate-50">
      <div className="flex gap-3">
        <div className="w-5 h-5 bg-indigo-500 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
        <div className="w-5 h-5 bg-indigo-500 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
        <div className="w-5 h-5 bg-indigo-500 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
      </div>
      <p className="mt-4 text-indigo-900 font-bold uppercase tracking-widest text-sm animate-pulse">Loading Kanban Board...</p>
    </div>
  );
  if (error) return <p className="p-10 text-red-500 font-bold">{error}</p>;

  return (
    <div className="max-w-[1400px] mx-auto p-6 h-screen flex flex-col text-black bg-slate-50">
      <div className="flex justify-between items-center mb-10 shrink-0 pt-6">
        <h1 className="text-4xl font-black text-transparent bg-clip-text bg-gradient-to-r from-slate-900 to-indigo-900">
          Application Tracker
        </h1>
        <div className="flex gap-4">
          <Link href="/analytics" className="bg-white border-2 border-indigo-100 text-indigo-700 px-6 py-2.5 rounded-full font-bold shadow-sm hover:shadow-lg hover:border-indigo-300 hover:-translate-y-0.5 active:scale-95 transition-all">
            📊 View Analytics
          </Link>
          <Link href="/" className="bg-indigo-600 text-white px-6 py-2.5 rounded-full font-bold shadow-md hover:shadow-xl hover:bg-indigo-700 hover:-translate-y-0.5 active:scale-95 transition-all">
            &larr; Discover Jobs
          </Link>
        </div>
      </div>

      <div className="flex gap-6 overflow-x-auto pb-8 h-full items-start snap-x custom-scrollbar">
        {COLUMNS.map((col) => {
          const columnJobs = applications.filter((app) => (app.status || "saved") === col.id);

          return (
            <div
              key={col.id}
              onDragOver={handleDragOver}
              onDrop={(e) => handleDrop(e, col.id)}
              className={`flex flex-col rounded-3xl w-[340px] min-w-[340px] h-full max-h-[75vh] border border-white shadow-xl snap-center transition-colors duration-300 ${col.bodyColor} backdrop-blur-xl`}
            >
              <div className={`px-6 py-4 rounded-t-3xl font-black tracking-wide flex justify-between items-center shadow-sm ${col.headerColor}`}>
                <span className="uppercase text-sm tracking-widest">{col.title}</span>
                <span className="bg-white/20 text-white text-xs px-3 py-1 rounded-full backdrop-blur-md">
                  {columnJobs.length}
                </span>
              </div>

              <div className="p-4 overflow-y-auto flex-1 space-y-4">
                {columnJobs.map((app, idx) => {
                  const appId = app._id || app.id; 
                  
                  // FIX: Safely extract deeply nested LangGraph data
                  const aiReport = app.application || app;
                  const analysis = aiReport.analysis || app.analysis;
                  
                  const jobTitle = app.job?.title || analysis?.job_title || "Saved Job";
                  const companyName = app.job?.company || analysis?.company || "Company";
                  const fitScore = analysis?.fit_score || analysis?.overall_score || app.fit_score || 0;

                  return (
                    <div
                      key={idx}
                      draggable
                      onDragStart={(e) => handleDragStart(e, appId)}
                      className="group bg-white p-5 rounded-2xl shadow-sm border border-slate-100 cursor-grab active:cursor-grabbing hover:shadow-xl hover:-translate-y-1 hover:border-indigo-200 transition-all duration-300"
                    >
                      <h3 className="font-bold text-slate-900 text-lg leading-tight truncate group-hover:text-indigo-600 transition-colors">
                        {jobTitle}
                      </h3>
                      <p className="text-sm font-semibold text-slate-500 mb-4 truncate">
                        {companyName}
                      </p>
                      
                      <div className="flex justify-between items-center mt-2 border-t pt-4">
                        <span className="bg-slate-100 text-slate-700 px-3 py-1 rounded-full font-bold text-xs border border-slate-200 group-hover:bg-indigo-50 group-hover:text-indigo-700 transition-colors">
                          Fit: {fitScore}%
                        </span>
                        <Link 
                           href={`/applications/${appId}`} 
                           className="text-indigo-600 hover:text-indigo-800 font-bold text-sm bg-indigo-50 px-3 py-1 rounded-full hover:bg-indigo-100 transition-colors"
                        >
                          Details &rarr;
                        </Link>
                      </div>
                    </div>
                  );
                })}
                
                {columnJobs.length === 0 && (
                  <div className="text-center p-8 border-2 border-dashed border-slate-300/50 rounded-2xl text-slate-400 font-medium">
                    Drop jobs here
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}