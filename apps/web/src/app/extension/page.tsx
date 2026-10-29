"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

export default function ExtensionSetupPage() {
  const [token, setToken] = useState<string | null>("Loading token...");
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    // Safely grab the token from local storage on the client side
    const storedToken = localStorage.getItem("token");
    if (storedToken) {
      setToken(storedToken);
    } else {
      setToken(null);
    }
  }, []);

  const copyToClipboard = () => {
    if (token) {
      navigator.clipboard.writeText(token);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 pb-16">
      {/* Hero Section */}
      <div className="bg-gradient-to-r from-slate-900 to-indigo-900 text-white pt-16 pb-24 px-6 shadow-2xl relative overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-full bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-10 mix-blend-overlay"></div>
        <div className="max-w-4xl mx-auto relative z-10 text-center">
          <h1 className="text-4xl md:text-5xl font-black tracking-tight mb-4">
            JobPilot<span className="text-indigo-400">.AI</span> Copilot
          </h1>
          <p className="text-indigo-200 font-medium text-lg max-w-2xl mx-auto mb-8">
            Take your AI recruitment agent anywhere on the web. Evaluate company trust, check ATS fit, and generate cover letters directly on live job boards.
          </p>
          <div className="flex justify-center gap-4">
            <a 
              href="/jobpilot-extension.zip" 
              download
              className="bg-white text-indigo-900 px-8 py-3.5 rounded-full font-black shadow-lg hover:bg-indigo-50 hover:scale-105 active:scale-95 transition-all flex items-center gap-2"
            >
              <span className="text-xl">⬇️</span> Download Extension (.zip)
            </a>
            <Link href="/" className="bg-white/10 backdrop-blur border border-white/20 text-white px-8 py-3.5 rounded-full font-bold shadow-lg hover:bg-white/20 transition-all">
              Back to Dashboard
            </Link>
          </div>
        </div>
      </div>

      {/* Setup Guide */}
      <div className="max-w-4xl mx-auto px-6 -mt-12 relative z-20">
        <div className="bg-white rounded-3xl p-8 md:p-12 shadow-xl border border-slate-100">
          <h2 className="text-2xl font-black text-slate-900 mb-8 flex items-center gap-3">
            <span className="bg-indigo-100 text-indigo-600 w-10 h-10 rounded-full flex items-center justify-center">⚙️</span>
            Installation Guide
          </h2>

          <div className="space-y-10">
            {/* Step 1 */}
            <div className="flex gap-6">
              <div className="flex-shrink-0">
                <div className="w-12 h-12 rounded-full bg-slate-100 text-slate-600 font-black flex items-center justify-center text-xl border-2 border-slate-200">1</div>
              </div>
              <div>
                <h3 className="text-xl font-bold text-slate-900 mb-2">Extract the Folder</h3>
                <p className="text-slate-600 font-medium leading-relaxed">
                  After downloading the <code className="bg-slate-100 px-2 py-1 rounded text-sm text-indigo-600">.zip</code> file above, extract it to a folder on your computer. Remember where you saved it!
                </p>
              </div>
            </div>

            {/* Step 2 */}
            <div className="flex gap-6">
              <div className="flex-shrink-0">
                <div className="w-12 h-12 rounded-full bg-slate-100 text-slate-600 font-black flex items-center justify-center text-xl border-2 border-slate-200">2</div>
              </div>
              <div>
                <h3 className="text-xl font-bold text-slate-900 mb-2">Enable Developer Mode</h3>
                <p className="text-slate-600 font-medium leading-relaxed mb-3">
                  Open a new tab in Chrome and navigate to your extensions page. Toggle <strong>Developer mode</strong> ON in the top right corner.
                </p>
                <div className="bg-slate-800 text-emerald-400 p-4 rounded-xl font-mono text-sm shadow-inner flex justify-between items-center">
                  <span>chrome://extensions/</span>
                  <button 
                    onClick={() => navigator.clipboard.writeText("chrome://extensions/")}
                    className="text-slate-400 hover:text-white transition-colors"
                    title="Copy to clipboard"
                  >
                    📋 Copy
                  </button>
                </div>
              </div>
            </div>

            {/* Step 3 */}
            <div className="flex gap-6">
              <div className="flex-shrink-0">
                <div className="w-12 h-12 rounded-full bg-slate-100 text-slate-600 font-black flex items-center justify-center text-xl border-2 border-slate-200">3</div>
              </div>
              <div>
                <h3 className="text-xl font-bold text-slate-900 mb-2">Load the Extension</h3>
                <p className="text-slate-600 font-medium leading-relaxed">
                  Click the <strong>Load unpacked</strong> button that appeared in the top left. Select the extracted <code className="bg-slate-100 px-2 py-1 rounded text-sm text-indigo-600">jobpilot-extension</code> folder. The extension icon will appear in your browser toolbar!
                </p>
              </div>
            </div>

            {/* Step 4: JWT Connection */}
            <div className="flex gap-6">
              <div className="flex-shrink-0">
                <div className="w-12 h-12 rounded-full bg-indigo-600 text-white font-black flex items-center justify-center text-xl shadow-md border-4 border-indigo-100">4</div>
              </div>
              <div className="w-full">
                <h3 className="text-xl font-bold text-slate-900 mb-2">Connect Your Account</h3>
                <p className="text-slate-600 font-medium leading-relaxed mb-4">
                  To link the extension to your JobPilot profile, open the extension popup and paste your secure access token below:
                </p>
                
                {token ? (
                  <div className="bg-indigo-50 border-2 border-indigo-100 rounded-2xl p-6 relative group">
                    <p className="text-xs font-bold text-indigo-400 uppercase tracking-widest mb-2">Your Secure JWT Token</p>
                    <div className="font-mono text-sm text-indigo-900 break-all pr-24 leading-relaxed">
                      {token}
                    </div>
                    <button
                      onClick={copyToClipboard}
                      className={`absolute top-1/2 right-6 -translate-y-1/2 px-4 py-2 rounded-lg font-bold shadow-sm transition-all ${
                        copied 
                          ? "bg-emerald-500 text-white" 
                          : "bg-white text-indigo-600 hover:bg-indigo-600 hover:text-white border border-indigo-200"
                      }`}
                    >
                      {copied ? "✓ Copied" : "Copy Token"}
                    </button>
                  </div>
                ) : (
                  <div className="bg-rose-50 border-2 border-rose-100 rounded-2xl p-6 text-center">
                    <p className="text-rose-600 font-bold mb-2">⚠️ You are not logged in.</p>
                    <p className="text-rose-500 text-sm mb-4">Please log in to generate your access token.</p>
                    <Link href="/login" className="bg-rose-600 text-white px-6 py-2 rounded-lg font-bold hover:bg-rose-700 transition-colors">
                      Go to Login
                    </Link>
                  </div>
                )}
              </div>
            </div>

          </div>
        </div>
      </div>
    </div>
  );
}