import React, { useState } from 'react';
import { Play, Upload, Send, AlertTriangle, CheckCircle, Clock, FileCode, Sparkles, RefreshCw, GitCompare, ArrowRight, X } from 'lucide-react';

/* ── Types (unchanged) ──────────────────────────────────────────────── */
interface StaticIssue {
  line: string;
  severity: string;
  message: string;
}

interface DeltaSummary {
  static_issue_count_change: number;
  original_static_count: number;
  revised_static_count: number;
  severity_changes: Record<string, number>;
  ai_issue_count_change: number;
  original_ai_count: number;
  revised_ai_count: number;
}

interface ReviewResult {
  review_id: string;
  parent_review_id?: string | null;
  language: string;
  issues: StaticIssue[];
  issues_count: number;
  tool_warnings: string[];
  llm_feedback: string;
  structured_feedback?: Array<{
    issue: string;
    line?: number | null;
    explanation: string;
    fix: string;
  }>;
  llm_available: boolean;
  analysis_time_ms: number;
  delta_summary?: DeltaSummary | null;
  line_diff?: string | null;
}

interface ComparisonData {
  original_review: ReviewResult;
  revised_review: ReviewResult;
  delta_summary: DeltaSummary;
  line_diff: string;
}

/* ── Constants (unchanged) ──────────────────────────────────────────── */
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

/* ── Severity badge helper ──────────────────────────────────────────── */
const SeverityBadge: React.FC<{ severity: string }> = ({ severity }) => {
  const s = severity.toLowerCase();
  if (s === 'error' || s === 'high') {
    return <span className="px-1.5 py-0.5 font-mono text-[9px] uppercase font-bold bg-white text-brand-black border border-brand-black">{severity}</span>;
  }
  if (s === 'warning' || s === 'medium') {
    return <span className="px-1.5 py-0.5 font-mono text-[9px] uppercase font-bold border border-brand-gray text-brand-gray">{severity}</span>;
  }
  return <span className="px-1.5 py-0.5 font-mono text-[9px] uppercase font-bold border border-brand-border text-brand-gray">{severity}</span>;
};

/* ── Component ──────────────────────────────────────────────────────── */
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

  const [resubmittingParentId, setResubmittingParentId] = useState<string | null>(null);
  const [comparisonData, setComparisonData] = useState<ComparisonData | null>(null);
  const [showComparison, setShowComparison] = useState(false);
  const [loadingComparison, setLoadingComparison] = useState(false);

  /* ── Handlers (all logic unchanged) ─────────────────────────────── */
  const handleLanguageChange = (lang: 'python' | 'cpp') => {
    setLanguage(lang);
    if (!file) setCode(lang === 'python' ? SAMPLE_PYTHON : SAMPLE_CPP);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const selectedFile = e.target.files[0];
      setFile(selectedFile);
      const ext = selectedFile.name.split('.').pop()?.toLowerCase();
      if (ext === 'cpp') setLanguage('cpp');
      else if (ext === 'py') setLanguage('python');
    }
  };

  const handleClearFile = () => {
    setFile(null);
    setCode(language === 'python' ? SAMPLE_PYTHON : SAMPLE_CPP);
  };

  const handleStartResubmit = () => {
    if (!result) return;
    setResubmittingParentId(result.review_id);
    const el = document.getElementById('code-editor-area');
    if (el) el.scrollIntoView({ behavior: 'smooth' });
  };

  const handleCancelResubmit = () => setResubmittingParentId(null);

  const handleSubmitReview = async () => {
    if (!code.trim() && !file) { setError('Please paste code or upload a file.'); return; }
    setLoading(true); setError(null); setResult(null);
    setRatingSubmitted(null); setTaSubmitted(false);
    try {
      const formData = new FormData();
      formData.append('language', language);
      if (file) formData.append('file', file);
      else formData.append('code', code);
      const endpoint = resubmittingParentId
        ? `${API_BASE_URL}/reviews/${resubmittingParentId}/resubmit`
        : `${API_BASE_URL}/review`;
      const res = await fetch(endpoint, { method: 'POST', body: formData });
      if (!res.ok) {
        const errData = await res.json().catch(() => ({ detail: 'Analysis failed.' }));
        throw new Error(errData.detail || 'Server returned error.');
      }
      const data: ReviewResult = await res.json();
      setResult(data);
      setResubmittingParentId(null);
    } catch (err: any) {
      setError(err.message || 'Failed to reach backend analysis server.');
    } finally {
      setLoading(false);
    }
  };

  const handleFetchComparison = async () => {
    if (!result) return;
    setLoadingComparison(true);
    try {
      const res = await fetch(`${API_BASE_URL}/reviews/${result.review_id}/comparison`);
      if (!res.ok) throw new Error('Could not fetch comparison data.');
      const data: ComparisonData = await res.json();
      setComparisonData(data); setShowComparison(true);
    } catch (err: any) {
      setError(err.message || 'Comparison endpoint error.');
    } finally {
      setLoadingComparison(false);
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
      if (res.ok) setRatingSubmitted(ratingVal);
    } catch { setRatingSubmitted(ratingVal); }
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
      if (res.ok) setTaSubmitted(true);
    } catch { setTaSubmitted(true); }
    finally { setTaSubmitting(false); }
  };

  const parseLlmPoints = (text: string) => {
    if (!text) return [];
    const parts = text.split(/(?=\n?\d+[\.)])/g).filter(p => p.trim().length > 0);
    if (parts.length > 1) return parts.map(p => p.replace(/^\n?\d+[\.)] */, '').trim());
    return [text.trim()];
  };

  /* ── Render ──────────────────────────────────────────────────────── */
  return (
    <section id="reviewer-tool" className="bg-brand-nearBlack py-10 px-5 md:px-10 relative min-h-full">
      <div className="max-w-7xl mx-auto">

        {/* ── Section Header ───────────────────────────────────────── */}
        <div className="flex flex-col md:flex-row md:items-end justify-between mb-10 gap-4 border-b border-brand-border pb-6">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="w-1.5 h-1.5 bg-brand-accent animate-pulse" />
              <span className="font-mono text-[9px] text-brand-gray uppercase tracking-widest">
                REVU // ANALYSIS ENGINE v3
              </span>
            </div>
            <h2 className="font-mono text-2xl sm:text-3xl font-bold text-brand-white uppercase tracking-tight">
              Submit Code for Review
            </h2>
          </div>

          {/* Sample preload buttons */}
          <div className="flex items-center gap-2 font-mono text-[10px]">
            <span className="text-brand-gray uppercase">Preload:</span>
            <button
              onClick={() => { setLanguage('python'); setCode(SAMPLE_PYTHON); setFile(null); }}
              className="px-3 py-1.5 border border-brand-border hover:border-brand-white text-brand-gray hover:text-brand-white transition-colors uppercase"
            >
              Python
            </button>
            <button
              onClick={() => { setLanguage('cpp'); setCode(SAMPLE_CPP); setFile(null); }}
              className="px-3 py-1.5 border border-brand-border hover:border-brand-white text-brand-gray hover:text-brand-white transition-colors uppercase"
            >
              C++
            </button>
          </div>
        </div>

        {/* ── Main Grid ─────────────────────────────────────────────── */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">

          {/* ─ Left Column: Input Controls ─────────────────────────── */}
          <div id="code-editor-area" className="lg:col-span-5 flex flex-col gap-4">

            {/* Resubmission mode banner */}
            {resubmittingParentId && (
              <div className="p-3 border border-brand-white bg-brand-surface flex items-center justify-between font-mono text-xs text-brand-white">
                <div className="flex items-center gap-2">
                  <GitCompare className="w-3.5 h-3.5" />
                  <span>Resubmitting for review <strong>#{resubmittingParentId.slice(0, 8)}</strong></span>
                </div>
                <button onClick={handleCancelResubmit} className="text-brand-gray hover:text-brand-white underline text-[10px] uppercase">
                  Cancel
                </button>
              </div>
            )}

            {/* Language toggle */}
            <div className="flex flex-col gap-1.5">
              <label className="font-mono text-[9px] text-brand-gray uppercase tracking-widest">
                01 / Target Language
              </label>
              <div className="grid grid-cols-2 gap-2">
                {(['python', 'cpp'] as const).map((lang) => (
                  <button
                    key={lang}
                    onClick={() => handleLanguageChange(lang)}
                    className={`py-2.5 px-4 font-mono text-[10px] uppercase tracking-wider flex items-center justify-center gap-2 border transition-all duration-200 ${
                      language === lang
                        ? 'bg-brand-white text-brand-black border-brand-white font-bold'
                        : 'bg-transparent text-brand-gray border-brand-border hover:border-brand-gray hover:text-brand-offWhite'
                    }`}
                  >
                    <FileCode className="w-3.5 h-3.5" />
                    <span>{lang === 'python' ? 'Python 3.x' : 'C++ (GCC/Clang)'}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Code input */}
            <div className="flex flex-col gap-1.5 flex-grow">
              <div className="flex items-center justify-between">
                <label className="font-mono text-[9px] text-brand-gray uppercase tracking-widest">
                  02 / Submission Source
                </label>
                {file && (
                  <button onClick={handleClearFile} className="font-mono text-[9px] text-brand-gray hover:text-brand-white underline uppercase">
                    Remove File
                  </button>
                )}
              </div>

              {file ? (
                <div className="p-8 border border-brand-border bg-brand-surface flex flex-col items-center justify-center text-center gap-3 min-h-[280px]">
                  <CheckCircle className="w-7 h-7 text-emerald-400" />
                  <span className="font-mono text-sm text-brand-white font-bold">{file.name}</span>
                  <span className="font-mono text-[10px] text-brand-gray">{(file.size / 1024).toFixed(1)} KB</span>
                </div>
              ) : (
                <div className="flex flex-col flex-grow">
                  <textarea
                    value={code}
                    onChange={(e) => setCode(e.target.value)}
                    placeholder={`// Paste ${language === 'python' ? 'Python' : 'C++'} code here...`}
                    rows={14}
                    spellCheck={false}
                    className="w-full bg-brand-surface border border-brand-border p-4 font-mono text-xs text-brand-offWhite placeholder:text-brand-darkGray focus:outline-none focus:border-brand-white transition-colors resize-y leading-relaxed"
                    style={{ fontFamily: 'var(--font-mono)' }}
                  />
                  <div className="mt-1.5 flex items-center justify-between font-mono text-[9px] text-brand-gray uppercase">
                    <span>Lines: {code.split('\n').length}</span>
                    <span>Max: 500 lines</span>
                  </div>
                </div>
              )}
            </div>

            {/* File upload zone */}
            <div className="border border-dashed border-brand-border p-4 bg-brand-surface/60 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Upload className="w-3.5 h-3.5 text-brand-gray" />
                <span className="font-mono text-[10px] text-brand-gray uppercase tracking-wider">
                  Or upload .py / .cpp file
                </span>
              </div>
              <label className="px-3 py-1.5 border border-brand-border hover:border-brand-white hover:bg-brand-white hover:text-brand-black font-mono text-[10px] text-brand-gray uppercase tracking-wider cursor-pointer transition-all duration-200">
                Browse
                <input type="file" accept=".py,.cpp" onChange={handleFileUpload} className="hidden" />
              </label>
            </div>

            {/* Submit button */}
            <button
              onClick={handleSubmitReview}
              disabled={loading}
              className="w-full py-4 bg-brand-white hover:bg-brand-accent disabled:opacity-40 text-brand-black hover:text-brand-white font-mono text-xs font-bold uppercase tracking-widest flex items-center justify-center gap-3 transition-all duration-300 cursor-pointer active:scale-95 disabled:cursor-not-allowed"
            >
              {loading ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  <span>Analyzing Code...</span>
                </>
              ) : (
                <>
                  <Play className="w-3.5 h-3.5 fill-current" />
                  <span>{resubmittingParentId ? 'Submit Revised Version →' : 'Run Analyzer & AI Review →'}</span>
                </>
              )}
            </button>

            {/* Error */}
            {error && (
              <div className="p-3 border border-brand-white bg-brand-surface font-mono text-xs text-brand-white flex items-start gap-2">
                <AlertTriangle className="w-3.5 h-3.5 flex-shrink-0 mt-0.5" />
                <span>{error}</span>
              </div>
            )}
          </div>

          {/* ─ Right Column: Results ───────────────────────────────── */}
          <div className="lg:col-span-7 border border-brand-border bg-brand-surface p-6 md:p-8 flex flex-col justify-between min-h-[500px]">

            {result ? (
              <div className="space-y-6 animate-fadeIn">

                {/* Result header */}
                <div className="flex flex-wrap items-center justify-between pb-4 border-b border-brand-border gap-3 font-mono text-[10px]">
                  <div className="flex items-center gap-2">
                    <span className="px-2 py-0.5 bg-brand-white text-brand-black font-bold uppercase">
                      {result.language}
                    </span>
                    <span className="text-brand-gray">ID: {result.review_id}</span>
                    {result.parent_review_id && (
                      <span className="px-1.5 py-0.5 border border-brand-gray text-brand-gray text-[9px] uppercase">
                        Revision of #{result.parent_review_id.slice(0, 8)}
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-4 text-brand-gray">
                    <span className="flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      {result.analysis_time_ms} ms
                    </span>
                    <span className="text-brand-white font-bold">
                      Issues: {result.issues_count}
                    </span>
                  </div>
                </div>

                {/* Delta summary (resubmissions) */}
                {result.delta_summary && (
                  <div className="border border-brand-border bg-brand-nearBlack p-4 space-y-3 font-mono text-[10px]">
                    <div className="flex items-center justify-between border-b border-brand-border pb-2">
                      <span className="text-brand-white font-bold uppercase tracking-wider flex items-center gap-2">
                        <GitCompare className="w-3.5 h-3.5" />
                        Resubmission Delta
                      </span>
                      <button
                        onClick={handleFetchComparison}
                        disabled={loadingComparison}
                        className="px-3 py-1 border border-brand-border hover:border-brand-white text-brand-gray hover:text-brand-white uppercase flex items-center gap-1.5 transition-colors duration-200"
                      >
                        {loadingComparison ? <RefreshCw className="w-3 h-3 animate-spin" /> : <GitCompare className="w-3 h-3" />}
                        <span>Side-by-Side Diff</span>
                      </button>
                    </div>
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                      {[
                        { label: 'Static Issues', value: `${result.delta_summary.original_static_count} → ${result.delta_summary.revised_static_count}`, delta: result.delta_summary.static_issue_count_change },
                        { label: 'AI Suggestions', value: `${result.delta_summary.original_ai_count} → ${result.delta_summary.revised_ai_count}`, delta: result.delta_summary.ai_issue_count_change },
                      ].map(({ label, value, delta }) => (
                        <div key={label} className="p-3 border border-brand-border bg-brand-surface">
                          <span className="text-brand-gray uppercase block mb-1">{label}</span>
                          <span className="text-brand-white font-bold">{value}</span>
                          <span className={`ml-2 text-[9px] font-bold ${delta <= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                            ({delta <= 0 ? '' : '+'}{delta})
                          </span>
                        </div>
                      ))}
                      <div className="p-3 border border-brand-border bg-brand-surface col-span-2 sm:col-span-1">
                        <span className="text-brand-gray uppercase block mb-1">Verdict</span>
                        <span className={`font-bold text-[9px] uppercase ${result.delta_summary.static_issue_count_change < 0 ? 'text-emerald-400' : 'text-brand-gray'}`}>
                          {result.delta_summary.static_issue_count_change < 0 ? 'Issues Resolved ✓' : 'Code Modified'}
                        </span>
                      </div>
                    </div>
                  </div>
                )}

                {/* AI unavailable warning */}
                {!result.llm_available && (
                  <div className="p-3 border border-brand-border bg-brand-nearBlack text-brand-gray font-mono text-[10px] flex items-start gap-2">
                    <AlertTriangle className="w-3.5 h-3.5 text-brand-white flex-shrink-0 mt-0.5" />
                    <div>
                      <span className="font-bold text-brand-white block uppercase mb-1">AI Feedback Unavailable</span>
                      <span className="opacity-80">NVIDIA NIM could not be reached. Static findings are shown below. Check your NVIDIA_API_KEY.</span>
                    </div>
                  </div>
                )}

                {/* ─ Static Analysis Findings Table ───────────────── */}
                <div>
                  <h4 className="font-mono text-[10px] font-bold text-brand-white uppercase tracking-widest mb-3 flex items-center gap-2">
                    <span className="w-1.5 h-1.5 bg-brand-white" />
                    Static Checker Findings ({result.issues.length})
                  </h4>

                  {result.issues.length === 0 ? (
                    <div className="p-6 border border-brand-border bg-brand-nearBlack text-center font-mono text-[10px] text-emerald-400 flex flex-col items-center gap-2">
                      <CheckCircle className="w-5 h-5" />
                      <span className="uppercase">No Static Issues Detected — Code Passes Linting ✓</span>
                    </div>
                  ) : (
                    <div className="overflow-x-auto border border-brand-border">
                      <table className="w-full text-left font-mono text-[10px]">
                        <thead className="bg-brand-nearBlack text-brand-gray uppercase border-b border-brand-border">
                          <tr>
                            <th className="py-2 px-3">Line</th>
                            <th className="py-2 px-3">Severity</th>
                            <th className="py-2 px-3">Message</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-brand-border">
                          {result.issues.map((issue, idx) => (
                            <tr key={idx} className="hover:bg-brand-nearBlack transition-colors">
                              <td className="py-2 px-3 text-brand-white font-bold">L{issue.line}</td>
                              <td className="py-2 px-3"><SeverityBadge severity={issue.severity} /></td>
                              <td className="py-2 px-3 text-brand-offWhite">{issue.message}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>

                {/* ─ AI Teaching Feedback ─────────────────────────── */}
                {result.llm_available && result.llm_feedback && (
                  <div className="pt-4 border-t border-brand-border">
                    <h4 className="font-mono text-[10px] font-bold text-brand-white uppercase tracking-widest mb-3 flex items-center gap-2">
                      <Sparkles className="w-3.5 h-3.5" />
                      Pedagogical Teaching Feedback (NVIDIA NIM)
                    </h4>
                    <div className="space-y-3">
                      {parseLlmPoints(result.llm_feedback).map((pt, idx) => (
                        <div
                          key={idx}
                          className="p-4 bg-brand-nearBlack border-l-2 border-l-brand-white border border-brand-border text-sm text-brand-offWhite leading-relaxed"
                          style={{ fontFamily: 'var(--font-body)' }}
                        >
                          <div className="font-mono text-[9px] text-brand-gray font-bold uppercase mb-1.5">
                            Suggestion {String(idx + 1).padStart(2, '0')}
                          </div>
                          <p className="whitespace-pre-line">{pt}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* ─ Rating ───────────────────────────────────────── */}
                {!ratingSubmitted && result && (
                  <div className="pt-4 border-t border-brand-border">
                    <p className="font-mono text-[9px] text-brand-gray uppercase tracking-widest mb-2">
                      Rate this review:
                    </p>
                    <div className="flex gap-2">
                      {[1, 2, 3, 4, 5].map((val) => (
                        <button
                          key={val}
                          onClick={() => handleRating(val)}
                          className="w-8 h-8 border border-brand-border hover:border-brand-white hover:bg-brand-white hover:text-brand-black font-mono text-xs text-brand-gray transition-all duration-200"
                        >
                          {val}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
                {ratingSubmitted && (
                  <div className="font-mono text-[9px] text-brand-gray uppercase pt-2">
                    Rating submitted: {ratingSubmitted}/5 — Thank you.
                  </div>
                )}

                {/* ─ Actions row ──────────────────────────────────── */}
                <div className="pt-4 border-t border-brand-border flex flex-wrap items-center justify-between gap-3 font-mono text-[10px]">
                  <div className="flex items-center gap-2">
                    <button
                      onClick={handleStartResubmit}
                      className="px-4 py-2 bg-brand-white hover:bg-brand-accent text-brand-black hover:text-brand-white uppercase font-bold tracking-wider transition-all duration-200 flex items-center gap-2"
                    >
                      <GitCompare className="w-3.5 h-3.5" />
                      Resubmit Revised Code
                    </button>

                    {(result.parent_review_id || result.delta_summary) && (
                      <button
                        onClick={handleFetchComparison}
                        disabled={loadingComparison}
                        className="px-3 py-2 border border-brand-border hover:border-brand-white text-brand-gray hover:text-brand-white uppercase font-bold tracking-wider transition-all duration-200 flex items-center gap-2"
                      >
                        <ArrowRight className="w-3.5 h-3.5" />
                        Comparison View
                      </button>
                    )}
                  </div>

                  <div>
                    {taSubmitted ? (
                      <div className="inline-flex items-center gap-2 px-3 py-1.5 border border-emerald-500 text-emerald-400 uppercase">
                        <Send className="w-3.5 h-3.5" />
                        Queued for TA Review
                      </div>
                    ) : (
                      <button
                        onClick={handleTaSubmit}
                        disabled={taSubmitting}
                        className="px-4 py-2 border border-brand-border hover:border-brand-white text-brand-gray hover:text-brand-white uppercase font-bold tracking-wider transition-all duration-200 flex items-center gap-2"
                      >
                        <Send className="w-3.5 h-3.5" />
                        Submit for TA Review
                      </button>
                    )}
                  </div>
                </div>

              </div>
            ) : (
              /* Idle empty state */
              <div className="h-full flex flex-col items-center justify-center text-center p-12 gap-4 my-auto">
                <div className="w-14 h-14 border border-brand-border flex items-center justify-center">
                  <Play className="w-6 h-6 ml-0.5 text-brand-gray" />
                </div>
                <h3 className="font-mono text-lg text-brand-white uppercase tracking-wide">
                  Awaiting Code Submission
                </h3>
                <p className="font-mono text-[10px] text-brand-gray max-w-sm leading-relaxed uppercase">
                  Select a language, paste source code or load a sample, then press{' '}
                  <strong className="text-brand-white">Run Analyzer & AI Review</strong> to begin.
                </p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ── Comparison Modal ─────────────────────────────────────────── */}
      {showComparison && comparisonData && (
        <div className="fixed inset-0 z-50 bg-black/85 flex items-center justify-center p-4 md:p-8 animate-fadeIn">
          <div className="bg-brand-surface border border-brand-border max-w-5xl w-full max-h-[90vh] flex flex-col overflow-hidden">

            {/* Modal header */}
            <div className="p-5 border-b border-brand-border flex items-center justify-between bg-brand-nearBlack">
              <div className="flex items-center gap-3">
                <GitCompare className="w-4 h-4 text-brand-white" />
                <h3 className="font-mono text-sm text-brand-white uppercase font-bold">
                  Before / After Comparison
                </h3>
              </div>
              <button
                onClick={() => setShowComparison(false)}
                className="p-1.5 border border-brand-border hover:border-brand-white text-brand-gray hover:text-brand-white transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Modal body */}
            <div className="p-5 overflow-y-auto space-y-5 flex-grow font-mono text-[10px]">

              {/* Delta stats */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {[
                  { label: 'Original Issues', value: `${comparisonData.delta_summary.original_static_count} static / ${comparisonData.delta_summary.original_ai_count} AI`, cls: 'text-brand-white' },
                  { label: 'Revised Issues',  value: `${comparisonData.delta_summary.revised_static_count} static / ${comparisonData.delta_summary.revised_ai_count} AI`,  cls: 'text-emerald-400' },
                  { label: 'Net Change',       value: `${comparisonData.delta_summary.static_issue_count_change <= 0 ? '' : '+'}${comparisonData.delta_summary.static_issue_count_change} total`, cls: comparisonData.delta_summary.static_issue_count_change <= 0 ? 'text-emerald-400' : 'text-red-400' },
                ].map(({ label, value, cls }) => (
                  <div key={label} className="p-4 border border-brand-border bg-brand-nearBlack">
                    <span className="text-brand-gray uppercase block mb-1">{label}</span>
                    <div className={`text-base font-bold ${cls}`}>{value}</div>
                  </div>
                ))}
              </div>

              {/* Line-level diff */}
              <div>
                <h4 className="font-bold text-brand-white uppercase tracking-widest mb-2">Line-Level Unified Diff</h4>
                <pre className="p-4 bg-brand-nearBlack border border-brand-border overflow-x-auto text-[10px] font-mono leading-relaxed max-h-60 text-brand-offWhite">
                  {comparisonData.line_diff.split('\n').map((line, i) => {
                    const isAdd = line.startsWith('+') && !line.startsWith('+++');
                    const isDel = line.startsWith('-') && !line.startsWith('---');
                    return (
                      <div
                        key={i}
                        className={isAdd ? 'text-emerald-300 font-bold px-1' : isDel ? 'text-red-300 font-bold px-1' : 'opacity-60'}
                      >
                        {line}
                      </div>
                    );
                  })}
                </pre>
              </div>

              {/* Side-by-side findings */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {[
                  { label: 'Original Findings', issues: comparisonData.original_review.issues, accent: 'border-l-red-400', emptyMsg: 'No issues in original.', headerCls: 'text-brand-white' },
                  { label: 'Revised Findings',  issues: comparisonData.revised_review.issues,  accent: 'border-l-emerald-400', emptyMsg: 'All static issues resolved! ✓', headerCls: 'text-emerald-400' },
                ].map(({ label, issues, accent, emptyMsg, headerCls }) => (
                  <div key={label}>
                    <h4 className={`font-bold uppercase tracking-widest mb-2 ${headerCls}`}>
                      {label} ({issues.length})
                    </h4>
                    <div className="border border-brand-border bg-brand-nearBlack p-3 space-y-2 max-h-48 overflow-y-auto">
                      {issues.map((iss, idx) => (
                        <div key={idx} className={`p-2 bg-brand-surface border-l-2 ${accent} text-[10px]`}>
                          <span className="font-bold text-brand-white">L{iss.line}:</span>{' '}
                          <span className="text-brand-gray">{iss.message}</span>
                        </div>
                      ))}
                      {issues.length === 0 && <span className="text-brand-gray text-[10px]">{emptyMsg}</span>}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Modal footer */}
            <div className="p-4 border-t border-brand-border bg-brand-nearBlack flex justify-end">
              <button
                onClick={() => setShowComparison(false)}
                className="px-6 py-2 bg-brand-white hover:bg-brand-accent text-brand-black hover:text-brand-white font-mono text-[10px] font-bold uppercase tracking-widest transition-all duration-200"
              >
                Close Comparison
              </button>
            </div>
          </div>
        </div>
      )}
    </section>
  );
};
