import React, { useState } from 'react';
import { Play, Upload, ThumbsUp, ThumbsDown, Send, AlertTriangle, CheckCircle, Clock, FileCode, Sparkles, RefreshCw } from 'lucide-react';

interface StaticIssue {
  line: string;
  severity: string;
  message: string;
}

interface ReviewResult {
  review_id: string;
  language: string;
  issues: StaticIssue[];
  issues_count: number;
  tool_warnings: string[];
  llm_feedback: string;
  llm_available: boolean;
  analysis_time_ms: number;
}

const API_BASE_URL = (import.meta as any).env?.VITE_API_BASE_URL || '';

const SAMPLE_PYTHON = `def calculate_average(numbers):
    total = 0
    for i in range(len(numbers)):
        total = total + numbers[i]
    res = total / len(numbers)
    return res

nums = [10, 20, 30]
print("Average:", calculate_average(nums))`;

const SAMPLE_CPP = `#include <iostream>

int main() {
    int* arr = new int[10];
    for (int i = 0; i <= 10; i++) {
        arr[i] = i * 2;
    }
    std::cout << "Done" << std::endl;
}`;

export const ReviewTool: React.FC = () => {
  const [language, setLanguage] = useState<'python' | 'cpp'>('python');
  const [code, setCode] = useState<string>(SAMPLE_PYTHON);
  const [file, setFile] = useState<File | null>(null);
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<ReviewResult | null>(null);
  
  const [ratingSubmitted, setRatingSubmitted] = useState<number | null>(null);
  const [taSubmitted, setTaSubmitted] = useState(false);
  const [taSubmitting, setTaSubmitting] = useState(false);

  const handleLanguageChange = (lang: 'python' | 'cpp') => {
    setLanguage(lang);
    if (!file) {
      setCode(lang === 'python' ? SAMPLE_PYTHON : SAMPLE_CPP);
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const selectedFile = e.target.files[0];
      setFile(selectedFile);
      const ext = selectedFile.name.split('.').pop()?.toLowerCase();
      if (ext === 'cpp') {
        setLanguage('cpp');
      } else if (ext === 'py') {
        setLanguage('python');
      }
    }
  };

  const handleClearFile = () => {
    setFile(null);
    setCode(language === 'python' ? SAMPLE_PYTHON : SAMPLE_CPP);
  };

  const handleSubmitReview = async () => {
    if (!code.trim() && !file) {
      setError("Please paste code or upload a file.");
      return;
    }

    setLoading(true);
    setError(null);
    setResult(null);
    setRatingSubmitted(null);
    setTaSubmitted(false);

    try {
      const formData = new FormData();
      formData.append('language', language);
      if (file) {
        formData.append('file', file);
      } else {
        formData.append('code', code);
      }

      const res = await fetch(`${API_BASE_URL}/review`, {
        method: 'POST',
        body: formData,
      });

      if (!res.ok) {
        const errData = await res.json().catch(() => ({ detail: 'Analysis failed.' }));
        throw new Error(errData.detail || 'Server returned error.');
      }

      const data: ReviewResult = await res.json();
      setResult(data);
    } catch (err: any) {
      setError(err.message || "Failed to reach backend analysis server.");
    } finally {
      setLoading(false);
    }
  };

  const handleRating = async (ratingVal: number) => {
    if (!result) return;
    try {
      const res = await fetch(`${API_BASE_URL}/rate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ review_id: result.review_id, rating: ratingVal }),
      });
      if (res.ok) {
        setRatingSubmitted(ratingVal);
      }
    } catch {
      // Keep optimistic rating
      setRatingSubmitted(ratingVal);
    }
  };

  const handleTaSubmit = async () => {
    if (!result) return;
    setTaSubmitting(true);
    try {
      const res = await fetch(`${API_BASE_URL}/ta-submit`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ review_id: result.review_id }),
      });
      if (res.ok) {
        setTaSubmitted(true);
      }
    } catch {
      setTaSubmitted(true);
    } finally {
      setTaSubmitting(false);
    }
  };

  // Helper to parse LLM feedback into distinct numbered editorial points
  const parseLlmPoints = (text: string) => {
    if (!text) return [];
    // Split by numbered list pattern like 1., 2., 3. or linebreaks with numbers
    const parts = text.split(/(?=\n?\d+[\.\)])/g).filter(p => p.trim().length > 0);
    if (parts.length > 1) {
      return parts.map(p => p.replace(/^\n?\d+[\.\)]\s*/, '').trim());
    }
    return [text.trim()];
  };

  return (
    <section id="reviewer-tool" className="bg-brand-dark py-24 px-6 md:px-12 border-t border-white/10 relative">
      <div className="max-w-7xl mx-auto">
        
        {/* Section Title */}
        <div className="flex flex-col md:flex-row md:items-end justify-between mb-12 gap-6 border-b border-white/10 pb-8">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <span className="w-2.5 h-2.5 bg-brand-red animate-pulse"></span>
              <span className="font-mono text-xs text-brand-red uppercase tracking-widest font-bold">
                LIVE INTERACTIVE ENGINE
              </span>
            </div>
            <h2 className="font-serif text-4xl sm:text-6xl font-normal text-white uppercase">
              SUBMIT CODE FOR REVIEW
            </h2>
          </div>

          {/* Preset Buttons */}
          <div className="flex items-center gap-2 font-mono text-xs">
            <span className="text-brand-gray">PRELOAD SAMPLE:</span>
            <button
              onClick={() => { setLanguage('python'); setCode(SAMPLE_PYTHON); setFile(null); }}
              className="px-3 py-1.5 border border-white/20 hover:border-brand-red text-brand-cream hover:text-white transition-colors"
            >
              PYTHON SAMPLE
            </button>
            <button
              onClick={() => { setLanguage('cpp'); setCode(SAMPLE_CPP); setFile(null); }}
              className="px-3 py-1.5 border border-white/20 hover:border-brand-red text-brand-cream hover:text-white transition-colors"
            >
              C++ SAMPLE
            </button>
          </div>
        </div>

        {/* Live Code Input Workspace Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          
          {/* Left Column: Code Input & Controls (5 cols) */}
          <div className="lg:col-span-5 flex flex-col gap-6">
            
            {/* Language Selection Toggle */}
            <div className="flex flex-col gap-2">
              <label className="font-mono text-xs text-brand-gray uppercase tracking-wider">
                01 / TARGET LANGUAGE
              </label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => handleLanguageChange('python')}
                  className={`py-3 px-4 font-mono text-xs uppercase tracking-wider flex items-center justify-center gap-2 border transition-all ${
                    language === 'python'
                      ? 'bg-brand-red text-white border-brand-red font-bold'
                      : 'bg-brand-surface text-brand-gray border-white/10 hover:border-white/30'
                  }`}
                >
                  <FileCode className="w-4 h-4" />
                  <span>PYTHON 3.x</span>
                </button>
                <button
                  type="button"
                  onClick={() => handleLanguageChange('cpp')}
                  className={`py-3 px-4 font-mono text-xs uppercase tracking-wider flex items-center justify-center gap-2 border transition-all ${
                    language === 'cpp'
                      ? 'bg-brand-red text-white border-brand-red font-bold'
                      : 'bg-brand-surface text-brand-gray border-white/10 hover:border-white/30'
                  }`}
                >
                  <FileCode className="w-4 h-4" />
                  <span>C++ (GCC/CLANG)</span>
                </button>
              </div>
            </div>

            {/* Code Input / File Upload Area */}
            <div className="flex flex-col gap-2 flex-grow">
              <div className="flex items-center justify-between">
                <label className="font-mono text-xs text-brand-gray uppercase tracking-wider">
                  02 / SUBMISSION SOURCE
                </label>
                {file && (
                  <button onClick={handleClearFile} className="font-mono text-[10px] text-brand-red underline">
                    REMOVE FILE
                  </button>
                )}
              </div>

              {file ? (
                <div className="p-8 border border-emerald-500/40 bg-emerald-950/20 flex flex-col items-center justify-center text-center gap-3 min-h-[300px]">
                  <CheckCircle className="w-8 h-8 text-emerald-400" />
                  <span className="font-mono text-sm text-emerald-300 font-bold">{file.name}</span>
                  <span className="font-mono text-xs text-brand-gray">({(file.size / 1024).toFixed(1)} KB)</span>
                </div>
              ) : (
                <div className="relative flex flex-col flex-grow">
                  <textarea
                    value={code}
                    onChange={(e) => setCode(e.target.value)}
                    placeholder={`// Paste student ${language === 'python' ? 'Python' : 'C++'} code here...`}
                    rows={12}
                    className="w-full bg-brand-surface border border-white/15 p-4 font-mono text-xs text-brand-cream placeholder:text-brand-muted/50 focus:outline-none focus:border-brand-red transition-colors resize-y leading-relaxed"
                  />
                  <div className="mt-2 flex items-center justify-between text-[11px] font-mono text-brand-gray">
                    <span>LINES: {code.split('\n').length}</span>
                    <span>MAX LIMIT: 500 LINES</span>
                  </div>
                </div>
              )}
            </div>

            {/* File Upload Zone */}
            <div className="border border-dashed border-white/20 p-4 bg-brand-surface/50 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Upload className="w-4 h-4 text-brand-gray" />
                <span className="font-mono text-xs text-brand-cream">OR UPLOAD .PY / .CPP FILE</span>
              </div>
              <label className="px-3 py-1.5 bg-white/10 hover:bg-white/20 font-mono text-xs text-white uppercase tracking-wider cursor-pointer transition-colors border border-white/15">
                <span>BROWSE</span>
                <input type="file" accept=".py,.cpp" onChange={handleFileUpload} className="hidden" />
              </label>
            </div>

            {/* Submit Action Button */}
            <button
              onClick={handleSubmitReview}
              disabled={loading}
              className="w-full py-4 bg-brand-red hover:bg-brand-darkRed disabled:opacity-50 text-white font-mono text-sm font-bold uppercase tracking-widest flex items-center justify-center gap-3 transition-all cursor-pointer shadow-lg shadow-brand-red/30 active:scale-95"
            >
              {loading ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin text-white" />
                  <span>ANALYZING CODE...</span>
                </>
              ) : (
                <>
                  <Play className="w-4 h-4 fill-white" />
                  <span>RUN ANALYZER &amp; AI REVIEW →</span>
                </>
              )}
            </button>

            {error && (
              <div className="p-4 border border-brand-red bg-brand-red/10 font-mono text-xs text-red-300 flex items-center gap-3">
                <AlertTriangle className="w-4 h-4 text-brand-red flex-shrink-0" />
                <span>{error}</span>
              </div>
            )}

          </div>

          {/* Right Column: Review Results Output Display (7 cols) */}
          <div className="lg:col-span-7 border border-white/15 bg-brand-surface p-6 md:p-8 flex flex-col justify-between min-h-[500px]">
            
            {result ? (
              <div className="space-y-8 animate-fadeIn">
                
                {/* Result Header Bar */}
                <div className="flex flex-wrap items-center justify-between pb-4 border-b border-white/10 gap-4 font-mono text-xs">
                  <div className="flex items-center gap-3">
                    <span className="px-2 py-0.5 bg-brand-red text-white uppercase font-bold">
                      {result.language}
                    </span>
                    <span className="text-brand-gray">ID: {result.review_id}</span>
                  </div>
                  <div className="flex items-center gap-4 text-brand-gray">
                    <span className="flex items-center gap-1">
                      <Clock className="w-3.5 h-3.5 text-brand-red" />
                      {result.analysis_time_ms} ms
                    </span>
                    <span className="text-white font-bold">
                      ISSUES FOUND: {result.issues_count}
                    </span>
                  </div>
                </div>

                {/* AI Unavailable Warning Banner if applicable */}
                {!result.llm_available && (
                  <div className="p-4 border border-amber-500/40 bg-amber-950/20 text-amber-300 font-mono text-xs flex items-center gap-3">
                    <AlertTriangle className="w-4 h-4 text-amber-400 flex-shrink-0" />
                    <div>
                      <span className="font-bold block">NVIDIA NIM AI FEEDBACK OFFLINE</span>
                      <span className="text-[11px] opacity-80">Showing deterministic static analysis findings below. Set NVIDIA_API_KEY to enable LLM explanations.</span>
                    </div>
                  </div>
                )}

                {/* Tool Warnings */}
                {result.tool_warnings && result.tool_warnings.length > 0 && (
                  <div className="space-y-1">
                    {result.tool_warnings.map((w, idx) => (
                      <div key={idx} className="text-[11px] font-mono text-amber-400/80 bg-amber-950/10 px-3 py-1 border-l border-amber-500">
                        {w}
                      </div>
                    ))}
                  </div>
                )}

                {/* Section 1: Static Analysis Findings Table */}
                <div>
                  <h4 className="font-mono text-xs font-bold text-white uppercase tracking-wider mb-4 flex items-center gap-2">
                    <span className="w-2 h-2 bg-brand-red"></span>
                    <span>STATIC CHECKER FINDINGS ({result.issues.length})</span>
                  </h4>

                  {result.issues.length === 0 ? (
                    <div className="p-6 border border-white/10 bg-brand-dark/50 text-center font-mono text-xs text-emerald-400 flex flex-col items-center justify-center gap-2">
                      <CheckCircle className="w-6 h-6 text-emerald-400" />
                      <span>NO STATIC ANALYSIS ISSUES DETECTED. CODE CLEANS UP!</span>
                    </div>
                  ) : (
                    <div className="overflow-x-auto border border-white/10">
                      <table className="w-full text-left font-mono text-xs">
                        <thead className="bg-brand-dark text-brand-gray uppercase text-[10px] border-b border-white/10">
                          <tr>
                            <th className="py-2.5 px-3">LINE</th>
                            <th className="py-2.5 px-3">SEVERITY</th>
                            <th className="py-2.5 px-3">MESSAGE</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-white/5 bg-brand-dark/40">
                          {result.issues.map((issue, idx) => (
                            <tr key={idx} className="hover:bg-white/5">
                              <td className="py-2.5 px-3 text-brand-red font-bold">L{issue.line}</td>
                              <td className="py-2.5 px-3">
                                <span className={`px-2 py-0.5 text-[10px] uppercase font-bold ${
                                  issue.severity === 'error' || issue.severity === 'high'
                                    ? 'bg-red-950 text-red-400 border border-red-800'
                                    : issue.severity === 'warning' || issue.severity === 'medium'
                                    ? 'bg-amber-950 text-amber-400 border border-amber-800'
                                    : 'bg-blue-950 text-blue-400 border border-blue-800'
                                }`}>
                                  {issue.severity}
                                </span>
                              </td>
                              <td className="py-2.5 px-3 text-brand-cream">{issue.message}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>

                {/* Section 2: AI Teaching Feedback */}
                {result.llm_available && result.llm_feedback && (
                  <div className="pt-4 border-t border-white/10">
                    <div className="flex items-center justify-between mb-4">
                      <h4 className="font-mono text-xs font-bold text-white uppercase tracking-wider flex items-center gap-2">
                        <Sparkles className="w-4 h-4 text-brand-red" />
                        <span>PEDAGOGICAL TEACHING FEEDBACK (NVIDIA NIM)</span>
                      </h4>
                    </div>

                    <div className="space-y-4">
                      {parseLlmPoints(result.llm_feedback).map((pt, idx) => (
                        <div 
                          key={idx} 
                          className="p-4 bg-brand-dark/80 border-l-2 border-l-brand-red border border-white/10 font-sans text-sm text-brand-cream leading-relaxed"
                        >
                          <div className="font-mono text-[10px] text-brand-red font-bold uppercase mb-1">
                            SUGGESTION 0{idx + 1}
                          </div>
                          <p className="whitespace-pre-line">{pt}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Actions & Feedback Row */}
                <div className="pt-6 border-t border-white/10 flex flex-wrap items-center justify-between gap-4 font-mono text-xs">
                  
                  {/* Thumb Ratings */}
                  <div className="flex items-center gap-3">
                    <span className="text-brand-gray">WAS THIS HELPFUL?</span>
                    <button
                      onClick={() => handleRating(1)}
                      className={`p-2 border transition-all ${
                        ratingSubmitted === 1
                          ? 'bg-emerald-950 border-emerald-500 text-emerald-400'
                          : 'border-white/15 hover:border-white/40 text-brand-gray hover:text-white'
                      }`}
                      title="Helpful"
                    >
                      <ThumbsUp className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleRating(-1)}
                      className={`p-2 border transition-all ${
                        ratingSubmitted === -1
                          ? 'bg-red-950 border-red-500 text-red-400'
                          : 'border-white/15 hover:border-white/40 text-brand-gray hover:text-white'
                      }`}
                      title="Not Helpful"
                    >
                      <ThumbsDown className="w-4 h-4" />
                    </button>
                    {ratingSubmitted && (
                      <span className="text-emerald-400 text-[11px]">RATING SAVED</span>
                    )}
                  </div>

                  {/* TA Queue Submission */}
                  <div>
                    {taSubmitted ? (
                      <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-emerald-950/40 border border-emerald-500/40 text-emerald-400">
                        <Send className="w-4 h-4" />
                        <span>QUEUED FOR TA REVIEW</span>
                      </div>
                    ) : (
                      <button
                        onClick={handleTaSubmit}
                        disabled={taSubmitting}
                        className="px-4 py-2 bg-white/10 hover:bg-white/20 border border-white/20 text-white uppercase font-bold tracking-wider transition-colors flex items-center gap-2"
                      >
                        <span>SUBMIT FOR TA REVIEW</span>
                      </button>
                    )}
                  </div>

                </div>

              </div>
            ) : (
              /* Idle Empty State */
              <div className="h-full flex flex-col items-center justify-center text-center p-12 gap-4 my-auto">
                <div className="w-16 h-16 border border-white/15 flex items-center justify-center text-brand-red">
                  <Play className="w-8 h-8 ml-1" />
                </div>
                <h3 className="font-serif text-2xl text-white uppercase tracking-wide">
                  AWAITING CODE SUBMISSION
                </h3>
                <p className="font-mono text-xs text-brand-gray max-w-sm leading-relaxed">
                  Select a language, paste your source code or load a sample above, then press <strong className="text-white">RUN ANALYZER &amp; AI REVIEW</strong> to evaluate AST warnings and pedagogical guidance.
                </p>
              </div>
            )}

          </div>

        </div>

      </div>
    </section>
  );
};
