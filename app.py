import asyncio
try:
    from dotenv import load_dotenv
    load_dotenv()
except ImportError:
    pass
import csv
import hashlib
import io
import json
import os
import re
import subprocess
import tempfile
import time
from collections import defaultdict
from datetime import datetime
from typing import Optional

import uvicorn
from fastapi import FastAPI, File, Form, HTTPException, Request, UploadFile
from fastapi.responses import HTMLResponse, JSONResponse

try:
    from openai import OpenAI
    _openai_available = True
except ImportError:
    _openai_available = False

app = FastAPI(title="AI Code Reviewer")

_review_log: list[dict] = []
_ta_queue: list[dict] = []
_rate_limits: dict[str, list[float]] = defaultdict(list)

CSV_PATH = "reviews.csv"
CSV_HEADERS = [
    "timestamp", "code_hash", "language", "issues_count",
    "llm_suggestions", "rating", "analysis_time_ms", "llm_response_length",
]

HTML_PAGE = r"""<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8"/>
<meta name="viewport" content="width=device-width, initial-scale=1.0"/>
<title>AI Code Reviewer for CS Education Research</title>
<meta name="description" content="Automated code review tool for CS student Python and C++ submissions using static analysis and AI feedback."/>
<link rel="preconnect" href="https://fonts.googleapis.com"/>
<link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=JetBrains+Mono:wght@400;500&display=swap" rel="stylesheet"/>
<link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/prism/1.29.0/themes/prism-tomorrow.min.css"/>
<script src="https://cdnjs.cloudflare.com/ajax/libs/prism/1.29.0/prism.min.js"></script>
<script src="https://cdnjs.cloudflare.com/ajax/libs/prism/1.29.0/components/prism-python.min.js"></script>
<script src="https://cdnjs.cloudflare.com/ajax/libs/prism/1.29.0/components/prism-cpp.min.js"></script>
<style>
*,*::before,*::after{box-sizing:border-box;margin:0;padding:0}
:root{
  --bg:#0f1117;--surface:#1a1d27;--surface2:#22263a;--border:#2e3348;
  --accent:#6366f1;--accent-hover:#4f46e5;--accent-dim:rgba(99,102,241,0.15);
  --text:#e8eaf6;--text-muted:#8b8fa8;--text-dim:#5a5f7a;
  --error:#ef4444;--warn:#f59e0b;--info:#3b82f6;--success:#22c55e;
  --red-dim:rgba(239,68,68,0.12);--yellow-dim:rgba(245,158,11,0.12);--blue-dim:rgba(59,130,246,0.12);
  --radius:10px;--radius-sm:6px;
}
body{font-family:'Inter',sans-serif;background:var(--bg);color:var(--text);min-height:100vh;line-height:1.6}
header{
  background:linear-gradient(135deg,#1a1d27 0%,#12152a 100%);
  border-bottom:1px solid var(--border);padding:20px 32px;
  display:flex;align-items:center;gap:16px;
}
header svg{flex-shrink:0}
header h1{font-size:1.3rem;font-weight:700;background:linear-gradient(135deg,#a5b4fc,#818cf8);-webkit-background-clip:text;-webkit-text-fill-color:transparent;background-clip:text}
header p{font-size:0.78rem;color:var(--text-muted);margin-top:2px}
.badge{font-size:0.65rem;background:var(--accent-dim);color:#a5b4fc;border:1px solid rgba(99,102,241,0.3);padding:2px 8px;border-radius:99px;font-weight:600;letter-spacing:0.05em;margin-left:8px;vertical-align:middle}
main{max-width:1280px;margin:0 auto;padding:28px 24px;display:flex;flex-direction:column;gap:24px}
.card{background:var(--surface);border:1px solid var(--border);border-radius:var(--radius);padding:24px}
.card-title{font-size:0.85rem;font-weight:600;color:var(--text-muted);text-transform:uppercase;letter-spacing:0.08em;margin-bottom:16px;display:flex;align-items:center;gap:8px}
.card-title svg{color:var(--accent)}
.row{display:flex;gap:16px;flex-wrap:wrap}
.col{flex:1;min-width:260px}
label{display:block;font-size:0.82rem;font-weight:500;color:var(--text-muted);margin-bottom:6px}
select,textarea,input[type=text]{
  width:100%;background:var(--surface2);border:1px solid var(--border);border-radius:var(--radius-sm);
  color:var(--text);font-family:inherit;font-size:0.88rem;padding:10px 12px;
  transition:border-color .2s,box-shadow .2s;outline:none;
}
select:focus,textarea:focus,input[type=text]:focus{border-color:var(--accent);box-shadow:0 0 0 3px var(--accent-dim)}
textarea{resize:vertical;font-family:'JetBrains Mono',monospace;font-size:0.82rem;min-height:220px}
.file-zone{
  border:2px dashed var(--border);border-radius:var(--radius-sm);padding:28px;
  text-align:center;cursor:pointer;transition:border-color .2s,background .2s;
  background:var(--surface2);
}
.file-zone:hover,.file-zone.drag{border-color:var(--accent);background:var(--accent-dim)}
.file-zone p{font-size:0.82rem;color:var(--text-muted);margin-top:6px}
.file-zone input{display:none}
.file-name{font-size:0.8rem;color:var(--success);margin-top:8px;font-weight:500}
.btn{
  display:inline-flex;align-items:center;gap:8px;padding:10px 20px;border-radius:var(--radius-sm);
  font-family:inherit;font-size:0.88rem;font-weight:600;cursor:pointer;border:none;
  transition:all .2s;text-decoration:none;
}
.btn-primary{background:linear-gradient(135deg,#6366f1,#4f46e5);color:#fff}
.btn-primary:hover:not(:disabled){background:linear-gradient(135deg,#4f46e5,#4338ca);transform:translateY(-1px);box-shadow:0 4px 16px rgba(99,102,241,0.35)}
.btn-primary:disabled{opacity:0.5;cursor:not-allowed;transform:none}
.btn-ghost{background:var(--surface2);color:var(--text-muted);border:1px solid var(--border)}
.btn-ghost:hover{border-color:var(--accent);color:var(--accent)}
.btn-sm{padding:6px 14px;font-size:0.8rem}
.actions{display:flex;gap:12px;flex-wrap:wrap;align-items:center;margin-top:8px}
.spinner{display:none;width:18px;height:18px;border:2px solid rgba(255,255,255,0.3);border-top-color:#fff;border-radius:50%;animation:spin 0.7s linear infinite}
@keyframes spin{to{transform:rotate(360deg)}}
.results-grid{display:grid;grid-template-columns:1fr 1fr;gap:20px}
@media(max-width:900px){.results-grid{grid-template-columns:1fr}}
.issues-table{width:100%;border-collapse:collapse;font-size:0.82rem}
.issues-table th{text-align:left;padding:8px 10px;color:var(--text-dim);font-weight:600;border-bottom:1px solid var(--border);font-size:0.75rem;text-transform:uppercase;letter-spacing:0.05em}
.issues-table td{padding:8px 10px;border-bottom:1px solid rgba(46,51,72,0.5);vertical-align:top}
.issues-table tr:last-child td{border-bottom:none}
.issues-table tr:hover td{background:rgba(255,255,255,0.02)}
.tag{display:inline-block;padding:2px 8px;border-radius:99px;font-size:0.7rem;font-weight:600;text-transform:uppercase;letter-spacing:0.05em}
.tag-error{background:var(--red-dim);color:var(--error)}
.tag-warning{background:var(--yellow-dim);color:var(--warn)}
.tag-info,.tag-convention,.tag-refactor{background:var(--blue-dim);color:var(--info)}
.tag-default{background:rgba(255,255,255,0.06);color:var(--text-muted)}
.llm-block{font-size:0.88rem;color:var(--text);line-height:1.75}
.llm-block ol{padding-left:20px}
.llm-block li{margin-bottom:12px;padding-left:4px}
.llm-block code{font-family:'JetBrains Mono',monospace;font-size:0.8rem;background:rgba(255,255,255,0.07);padding:1px 5px;border-radius:3px}
.llm-block strong{color:#a5b4fc}
.no-issues{display:flex;flex-direction:column;align-items:center;justify-content:center;padding:32px;gap:8px;color:var(--text-muted)}
.no-issues svg{color:var(--success)}
.rating-bar{display:flex;align-items:center;gap:12px;margin-top:16px;padding-top:16px;border-top:1px solid var(--border)}
.rating-bar span{font-size:0.82rem;color:var(--text-muted)}
.thumb-btn{background:var(--surface2);border:1px solid var(--border);border-radius:var(--radius-sm);padding:6px 14px;cursor:pointer;font-size:1rem;transition:all .2s}
.thumb-btn:hover{border-color:var(--accent);transform:scale(1.08)}
.thumb-btn.active-up{border-color:var(--success);background:rgba(34,197,94,0.12)}
.thumb-btn.active-down{border-color:var(--error);background:rgba(239,68,68,0.12)}
.alert{border-radius:var(--radius-sm);padding:12px 16px;font-size:0.85rem;display:none;margin-bottom:12px}
.alert-error{background:var(--red-dim);border:1px solid rgba(239,68,68,0.3);color:#fca5a5}
.alert-success{background:rgba(34,197,94,0.1);border:1px solid rgba(34,197,94,0.3);color:#86efac}
.stat-bar{display:flex;gap:20px;flex-wrap:wrap;margin-bottom:4px}
.stat{display:flex;flex-direction:column;gap:2px}
.stat-val{font-size:1.1rem;font-weight:700;color:var(--accent)}
.stat-lbl{font-size:0.72rem;color:var(--text-dim);text-transform:uppercase;letter-spacing:0.05em}
.tool-unavail{font-size:0.78rem;color:var(--warn);background:var(--yellow-dim);border:1px solid rgba(245,158,11,0.25);border-radius:var(--radius-sm);padding:6px 10px;margin-top:6px;display:inline-block}
pre[class*="language-"]{border-radius:var(--radius-sm) !important;font-size:0.78rem !important;margin:0 !important}
.review-id{font-size:0.72rem;color:var(--text-dim);font-family:'JetBrains Mono',monospace}
@media print{
  header,form,.actions,.rating-bar,.badge{display:none !important}
  body{background:#fff;color:#000}
  .card{border:1px solid #ccc;break-inside:avoid}
  .results-grid{grid-template-columns:1fr 1fr}
}
</style>
</head>
<body>
<header>
<svg width="36" height="36" viewBox="0 0 36 36" fill="none">
  <rect width="36" height="36" rx="8" fill="url(#g1)"/>
  <path d="M11 14l-4 4 4 4M25 14l4 4-4 4M20 11l-4 14" stroke="#fff" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
  <defs><linearGradient id="g1" x1="0" y1="0" x2="36" y2="36" gradientUnits="userSpaceOnUse"><stop stop-color="#6366f1"/><stop offset="1" stop-color="#4f46e5"/></linearGradient></defs>
</svg>
<div>
  <h1>AI Code Reviewer for CS Education Research <span class="badge">BETA</span></h1>
  <p>Static analysis + NVIDIA NIM AI feedback &middot; Python &amp; C++ &middot; For student user study</p>
</div>
</header>

<main>
<div id="alert-box" class="alert alert-error"></div>

<div class="card">
  <div class="card-title">
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M12 20h9M16.5 3.5a2.121 2.121 0 013 3L7 19l-4 1 1-4 12.5-12.5z"/></svg>
    Submit Code for Review
  </div>
  <form id="review-form">
    <div class="row">
      <div class="col" style="max-width:200px">
        <label for="lang-select">Language</label>
        <select id="lang-select" name="language">
          <option value="python">Python (.py)</option>
          <option value="cpp">C++ (.cpp)</option>
        </select>
      </div>
    </div>
    <br/>
    <div class="row">
      <div class="col">
        <label for="code-area">Paste Code <span style="color:var(--text-dim);font-weight:400">(max 500 lines / 50 KB)</span></label>
        <textarea id="code-area" name="code" placeholder="# Paste your Python or C++ code here..."></textarea>
      </div>
      <div class="col" style="max-width:280px;display:flex;flex-direction:column;gap:12px">
        <div>
          <label>Or Upload File</label>
          <div class="file-zone" id="file-zone" onclick="document.getElementById('file-input').click()">
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" style="color:#6366f1;margin:auto"><path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4M17 8l-5-5-5 5M12 3v12"/></svg>
            <p>Click or drag &amp; drop<br/>.py or .cpp file</p>
            <div class="file-name" id="file-name-display"></div>
            <input type="file" id="file-input" accept=".py,.cpp" style="display:none"/>
          </div>
        </div>
        <div>
          <label for="github-url">GitHub URL <span style="color:var(--text-dim);font-weight:400">(future)</span></label>
          <input type="text" id="github-url" placeholder="https://github.com/user/repo" disabled style="opacity:0.4;cursor:not-allowed"/>
        </div>
      </div>
    </div>
    <div class="actions" style="margin-top:16px">
      <button type="submit" class="btn btn-primary" id="submit-btn">
        <span class="spinner" id="spinner"></span>
        <svg id="submit-icon" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M9 12l2 2 4-4M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>
        Analyze Code
      </button>
      <button type="button" class="btn btn-ghost btn-sm" onclick="clearForm()">Clear</button>
    </div>
  </form>
</div>

<div id="results-section" style="display:none">
  <div class="card" style="margin-bottom:20px">
    <div class="stat-bar" id="stats-bar"></div>
    <div class="review-id" id="review-id-display"></div>
  </div>

  <div class="results-grid">
    <div class="card">
      <div class="card-title">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"/></svg>
        Static Analysis
      </div>
      <div id="static-results"></div>
    </div>
    <div class="card">
      <div class="card-title">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3M6.343 6.343l-.707-.707M12 21v-1M6.343 17.657l.707-.707M17.657 17.657l.707.707M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>
        AI Feedback <span style="font-size:0.7rem;font-weight:400;color:var(--text-dim);text-transform:none;letter-spacing:0">(NVIDIA NIM &middot; LLaMA 3.1 8B)</span>
      </div>
      <div id="llm-results"></div>
      <div class="rating-bar" id="rating-bar" style="display:none">
        <span>Was this helpful?</span>
        <button class="thumb-btn" id="thumb-up" onclick="submitRating(1)">&#128077;</button>
        <button class="thumb-btn" id="thumb-down" onclick="submitRating(-1)">&#128078;</button>
        <button class="btn btn-ghost btn-sm" onclick="submitToTA()" style="margin-left:auto">
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M16 21v-2a4 4 0 00-4-4H6a4 4 0 00-4 4v2M9 11a4 4 0 100-8 4 4 0 000 8zM22 21v-2a4 4 0 00-3-3.87M16 3.13a4 4 0 010 7.75"/></svg>
          Submit for TA Review
        </button>
      </div>
    </div>
  </div>

  <div class="actions" style="margin-top:12px">
    <button class="btn btn-ghost btn-sm" onclick="window.print()">
      <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M6 9V2h12v7M6 18H4a2 2 0 01-2-2v-5a2 2 0 012-2h16a2 2 0 012 2v5a2 2 0 01-2 2h-2M6 14h12v8H6z"/></svg>
      Export as PDF
    </button>
  </div>
</div>
</main>

<script>
var currentReviewId = null;
var currentRating = 0;

var form = document.getElementById('review-form');
var spinner = document.getElementById('spinner');
var submitIcon = document.getElementById('submit-icon');
var submitBtn = document.getElementById('submit-btn');
var fileInput = document.getElementById('file-input');
var fileZone = document.getElementById('file-zone');
var fileNameDisplay = document.getElementById('file-name-display');
var alertBox = document.getElementById('alert-box');

fileInput.addEventListener('change', function() {
  var f = fileInput.files[0];
  if (f) fileNameDisplay.textContent = f.name;
});

fileZone.addEventListener('dragover', function(e) { e.preventDefault(); fileZone.classList.add('drag'); });
fileZone.addEventListener('dragleave', function() { fileZone.classList.remove('drag'); });
fileZone.addEventListener('drop', function(e) {
  e.preventDefault();
  fileZone.classList.remove('drag');
  var f = e.dataTransfer.files[0];
  if (f) { fileNameDisplay.textContent = f.name; }
  var dt = e.dataTransfer;
  var newList = dt.files;
  fileInput.files = newList;
});

function showAlert(msg) {
  alertBox.textContent = msg;
  alertBox.style.display = 'block';
  alertBox.style.background = 'var(--red-dim)';
  alertBox.style.color = '#fca5a5';
  alertBox.style.border = '1px solid rgba(239,68,68,0.3)';
  setTimeout(function() { alertBox.style.display = 'none'; }, 8000);
}
function showSuccess(msg) {
  alertBox.textContent = msg;
  alertBox.style.display = 'block';
  alertBox.style.background = 'rgba(34,197,94,0.1)';
  alertBox.style.color = '#86efac';
  alertBox.style.border = '1px solid rgba(34,197,94,0.3)';
  setTimeout(function() { alertBox.style.display = 'none'; }, 4000);
}

function setLoading(on) {
  submitBtn.disabled = on;
  spinner.style.display = on ? 'block' : 'none';
  submitIcon.style.display = on ? 'none' : 'block';
}

function clearForm() {
  document.getElementById('code-area').value = '';
  fileNameDisplay.textContent = '';
  fileInput.value = '';
  document.getElementById('results-section').style.display = 'none';
  alertBox.style.display = 'none';
}

function severityTag(sev) {
  var s = (sev || '').toLowerCase();
  var cls = 'tag-default';
  if (s === 'error' || s === 'fatal') cls = 'tag-error';
  else if (s === 'warning' || s === 'warn') cls = 'tag-warning';
  else if (s === 'info' || s === 'convention' || s === 'refactor' || s === 'style' || s === 'note') cls = 'tag-info';
  return '<span class="tag ' + cls + '">' + (s || 'note') + '</span>';
}

function renderStaticIssues(issues, toolWarnings) {
  var el = document.getElementById('static-results');
  if (toolWarnings && toolWarnings.length > 0) {
    el.innerHTML += toolWarnings.map(function(w) { return '<div class="tool-unavail">&#9888; ' + escHtml(w) + '</div>'; }).join('');
  }
  if (!issues || issues.length === 0) {
    el.innerHTML += '<div class="no-issues"><svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M22 11.08V12a10 10 0 11-5.93-9.14"/><path d="M22 4L12 14.01l-3-3"/></svg><span>No issues found</span></div>';
    return;
  }
  var rows = issues.map(function(i) {
    return '<tr><td style="color:var(--text-muted);font-family:JetBrains Mono,monospace;font-size:0.78rem">' + escHtml(String(i.line || '\u2014')) + '</td><td>' + severityTag(i.severity) + '</td><td style="font-size:0.8rem">' + escHtml(i.message) + '</td></tr>';
  }).join('');
  el.innerHTML += '<table class="issues-table"><thead><tr><th>Line</th><th>Severity</th><th>Message</th></tr></thead><tbody>' + rows + '</tbody></table>';
}

function renderMarkdown(md) {
  var escaped = escHtml(md);
  escaped = escaped.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>');
  escaped = escaped.replace(/`([^`]+)`/g, '<code>$1</code>');
  var items = escaped.split(/\n\d+\.\s+/).filter(function(s) { return s.trim().length > 0; });
  if (items.length > 1) {
    return '<ol>' + items.map(function(s) { return '<li>' + s.trim() + '</li>'; }).join('') + '</ol>';
  }
  return escaped.replace(/\n\n/g, '</p><p>');
}

function escHtml(s) {
  return (s || '').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
}

function renderLLM(text, unavailable) {
  var el = document.getElementById('llm-results');
  if (unavailable) {
    el.innerHTML = '<div class="tool-unavail" style="display:block">&#9888; AI service unavailable — showing static analysis only.</div>';
    return;
  }
  el.innerHTML = '<div class="llm-block">' + renderMarkdown(text) + '</div>';
  document.getElementById('rating-bar').style.display = 'flex';
}

function renderStats(data) {
  var bar = document.getElementById('stats-bar');
  bar.innerHTML = [
    '<div class="stat"><div class="stat-val">' + data.issues_count + '</div><div class="stat-lbl">Issues Found</div></div>',
    '<div class="stat"><div class="stat-val">' + data.analysis_time_ms + 'ms</div><div class="stat-lbl">Analysis Time</div></div>',
    '<div class="stat"><div class="stat-val">' + data.language.toUpperCase() + '</div><div class="stat-lbl">Language</div></div>',
    '<div class="stat"><div class="stat-val">' + (data.llm_available ? 'AI + Static' : 'Static Only') + '</div><div class="stat-lbl">Analysis Mode</div></div>',
  ].join('');
  document.getElementById('review-id-display').textContent = 'Review ID: ' + (data.review_id || '');
}

form.addEventListener('submit', async function(e) {
  e.preventDefault();
  alertBox.style.display = 'none';
  document.getElementById('results-section').style.display = 'none';
  document.getElementById('static-results').innerHTML = '';
  document.getElementById('llm-results').innerHTML = '';
  document.getElementById('rating-bar').style.display = 'none';
  currentRating = 0;
  document.getElementById('thumb-up').classList.remove('active-up');
  document.getElementById('thumb-down').classList.remove('active-down');

  var code = document.getElementById('code-area').value.trim();
  var file = fileInput.files[0];
  var lang = document.getElementById('lang-select').value;

  if (!code && !file) { showAlert('Please paste code or upload a file.'); return; }

  setLoading(true);
  try {
    var fd = new FormData();
    fd.append('language', lang);
    if (file) fd.append('file', file);
    else fd.append('code', code);

    var res = await fetch('/review', { method: 'POST', body: fd });
    var data = await res.json();

    if (!res.ok) { showAlert(data.detail || 'Server error.'); return; }

    currentReviewId = data.review_id;
    renderStats(data);
    renderStaticIssues(data.issues, data.tool_warnings);
    renderLLM(data.llm_feedback, !data.llm_available);
    document.getElementById('results-section').style.display = 'block';
    document.getElementById('results-section').scrollIntoView({ behavior: 'smooth', block: 'start' });
  } catch(err) {
    showAlert('Network error: ' + err.message);
  } finally {
    setLoading(false);
  }
});

async function submitRating(val) {
  if (!currentReviewId) return;
  currentRating = val;
  document.getElementById('thumb-up').classList.toggle('active-up', val === 1);
  document.getElementById('thumb-down').classList.toggle('active-down', val === -1);
  try {
    await fetch('/rate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ review_id: currentReviewId, rating: val }),
    });
    showSuccess(val === 1 ? 'Thanks for the positive feedback!' : 'Thanks — we will work to improve.');
  } catch(_) {}
}

async function submitToTA() {
  if (!currentReviewId) return;
  try {
    var res = await fetch('/ta-submit', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ review_id: currentReviewId }),
    });
    if (res.ok) showSuccess('Submitted for TA review. A human TA will review your code shortly.');
    else showAlert('Could not submit for TA review.');
  } catch(_) { showAlert('Network error submitting for TA review.'); }
}
</script>
</body>
</html>"""


def _check_rate_limit(client_ip: str) -> bool:
    now = time.time()
    window = 60.0
    limit = 10
    timestamps = _rate_limits[client_ip]
    _rate_limits[client_ip] = [t for t in timestamps if now - t < window]
    if len(_rate_limits[client_ip]) >= limit:
        return False
    _rate_limits[client_ip].append(now)
    return True


def _hash_code(code: str) -> str:
    return hashlib.sha256(code.encode()).hexdigest()[:12]


def _validate_code(code: str) -> None:
    if not code.strip():
        raise HTTPException(status_code=400, detail="Code input is empty.")
    lines = code.splitlines()
    if len(lines) > 500:
        raise HTTPException(status_code=400, detail=f"Code exceeds 500-line limit ({len(lines)} lines).")
    if len(code.encode()) > 50 * 1024:
        raise HTTPException(status_code=400, detail="Code exceeds 50 KB limit.")


def _sanitize_code(code: str) -> str:
    return code.strip()


def _run_subprocess(cmd: list, cwd: str, timeout: int = 10) -> tuple:
    try:
        proc = subprocess.run(
            cmd,
            cwd=cwd,
            capture_output=True,
            text=True,
            timeout=timeout,
        )
        return proc.stdout, proc.stderr
    except subprocess.TimeoutExpired:
        return "", "Analysis timed out."
    except FileNotFoundError:
        return "", f"Tool not found: {cmd[0]}"


def _parse_pylint(output: str) -> list:
    issues = []
    pattern = re.compile(r"[^:]+:(\d+):\d+:\s+([A-Z]\d+):\s+(.+)")
    for line in output.splitlines():
        m = pattern.search(line)
        if m:
            code = m.group(2)
            sev_map = {"C": "convention", "R": "refactor", "W": "warning", "E": "error", "F": "fatal"}
            severity = sev_map.get(code[0], "info")
            issues.append({"line": m.group(1), "severity": severity, "message": m.group(3).strip()})
    return issues


def _parse_bandit(output: str) -> list:
    issues = []
    pattern = re.compile(
        r">> Issue: \[([^\]]+)\] (.+)\n\s+Severity: (\w+).+\n\s+Location: [^:]+:(\d+)",
        re.MULTILINE,
    )
    for m in pattern.finditer(output):
        issues.append({
            "line": m.group(4),
            "severity": m.group(3).lower(),
            "message": f"[Security] {m.group(2).strip()} ({m.group(1)})",
        })
    return issues


def _parse_cpplint(stderr: str) -> list:
    issues = []
    pattern = re.compile(r"[^:]+:(\d+):\s+(.+)\s+\[([^\]]+)\]")
    for line in stderr.splitlines():
        m = pattern.search(line)
        if m:
            msg = m.group(2).strip()
            category = m.group(3)
            sev = "warning" if "legal" not in category else "info"
            issues.append({"line": m.group(1), "severity": sev, "message": f"{msg} [{category}]"})
    return issues


def _run_python_analysis(code: str) -> tuple:
    issues = []
    warnings = []
    with tempfile.TemporaryDirectory() as tmpdir:
        fpath = os.path.join(tmpdir, "submission.py")
        with open(fpath, "w", encoding="utf-8") as f:
            f.write(code)

        stdout, stderr = _run_subprocess(
            ["pylint", "--output-format=text", "--score=no", fpath],
            cwd=tmpdir,
        )
        if "Tool not found" in stderr or "Analysis timed out" in stderr:
            warnings.append(f"pylint unavailable: {stderr}")
        else:
            issues.extend(_parse_pylint(stdout + stderr))

        stdout2, stderr2 = _run_subprocess(
            ["bandit", "-r", fpath, "--format", "text"],
            cwd=tmpdir,
        )
        if "Tool not found" in stderr2 or "Analysis timed out" in stderr2:
            warnings.append(f"bandit unavailable: {stderr2}")
        else:
            issues.extend(_parse_bandit(stdout2 + stderr2))

    return issues, warnings


def _run_cpp_analysis(code: str) -> tuple:
    issues = []
    warnings = []
    with tempfile.TemporaryDirectory() as tmpdir:
        fpath = os.path.join(tmpdir, "submission.cpp")
        with open(fpath, "w", encoding="utf-8") as f:
            f.write(code)

        stdout, stderr = _run_subprocess(
            ["cpplint", "--filter=-legal/copyright", fpath],
            cwd=tmpdir,
        )
        if "Tool not found" in stderr or "Analysis timed out" in stderr:
            warnings.append(f"cpplint unavailable: {stderr}")
        else:
            issues.extend(_parse_cpplint(stdout + stderr))

    return issues, warnings


def _build_llm_prompt(code: str, language: str, issues: list) -> str:
    issues_summary = "\n".join(
        f"- Line {i.get('line', '?')} [{i.get('severity', 'info')}]: {i.get('message', '')}"
        for i in issues[:20]
    ) or "No static analysis issues detected."
    lang_label = "Python" if language == "python" else "C++"
    return (
        f"You are a CS teaching assistant reviewing a beginner student's {lang_label} code submission.\n\n"
        f"Static analysis found the following issues:\n{issues_summary}\n\n"
        f"Student code:\n```{lang_label.lower()}\n{code[:3000]}\n```\n\n"
        "Provide exactly 3 to 5 specific, actionable suggestions. "
        "Reference exact line numbers where possible. "
        "Be encouraging but direct. "
        "Prioritize: (1) correctness, (2) readability, (3) efficiency. "
        "Do NOT give generic advice like 'use better variable names' — be specific about which names and why. "
        "Format your response as a numbered list."
    )


def _call_nvidia_nim(prompt: str) -> tuple:
    if not _openai_available:
        return "", False
    api_key = os.environ.get("NVIDIA_API_KEY", "")
    if not api_key:
        return "", False
    try:
        client = OpenAI(base_url="https://integrate.api.nvidia.com/v1", api_key=api_key)
        response = client.chat.completions.create(
            model="meta/llama-3.1-8b-instruct",
            messages=[{"role": "user", "content": prompt}],
            temperature=0.3,
            max_tokens=600,
            timeout=25,
        )
        return response.choices[0].message.content or "", True
    except Exception:
        return "", False


def _append_csv(record: dict) -> None:
    file_exists = os.path.isfile(CSV_PATH)
    try:
        with open(CSV_PATH, "a", newline="", encoding="utf-8") as f:
            writer = csv.DictWriter(f, fieldnames=CSV_HEADERS)
            if not file_exists:
                writer.writeheader()
            writer.writerow({k: record.get(k, "") for k in CSV_HEADERS})
    except OSError:
        pass


@app.get("/", response_class=HTMLResponse)
async def index() -> HTMLResponse:
    return HTMLResponse(content=HTML_PAGE)


@app.post("/review")
async def review_code(
    request: Request,
    language: str = Form(...),
    code: Optional[str] = Form(None),
    file: Optional[UploadFile] = File(None),
) -> JSONResponse:
    client_ip = request.client.host if request.client else "unknown"
    if not _check_rate_limit(client_ip):
        raise HTTPException(
            status_code=429,
            detail="Rate limit exceeded. Please wait a minute before retrying.",
        )

    if language not in ("python", "cpp"):
        raise HTTPException(status_code=400, detail="Unsupported language. Choose 'python' or 'cpp'.")

    raw_code = ""
    if file is not None:
        filename = file.filename or ""
        ext = os.path.splitext(filename)[1].lower()
        if ext not in (".py", ".cpp"):
            raise HTTPException(status_code=400, detail="Invalid file type. Only .py and .cpp are accepted.")
        content_bytes = await file.read()
        if len(content_bytes) > 50 * 1024:
            raise HTTPException(status_code=400, detail="File exceeds 50 KB limit.")
        try:
            raw_code = content_bytes.decode("utf-8")
        except UnicodeDecodeError:
            raise HTTPException(status_code=400, detail="File must be valid UTF-8 text.")
    elif code:
        raw_code = code
    else:
        raise HTTPException(status_code=400, detail="No code submitted.")

    _validate_code(raw_code)
    clean_code = _sanitize_code(raw_code)
    code_hash = _hash_code(clean_code)

    t_start = time.monotonic()

    if language == "python":
        issues, tool_warnings = _run_python_analysis(clean_code)
    else:
        issues, tool_warnings = _run_cpp_analysis(clean_code)

    prompt = _build_llm_prompt(clean_code, language, issues)
    llm_feedback, llm_available = _call_nvidia_nim(prompt)
    llm_text = llm_feedback if llm_available else ""

    analysis_time_ms = int((time.monotonic() - t_start) * 1000)
    review_id = f"{code_hash}-{int(time.time())}"

    record = {
        "timestamp": datetime.utcnow().isoformat(),
        "code_hash": code_hash,
        "language": language,
        "issues_count": len(issues),
        "llm_suggestions": llm_text[:500] if llm_text else "",
        "rating": "",
        "analysis_time_ms": analysis_time_ms,
        "llm_response_length": len(llm_text),
        "review_id": review_id,
        "code_snippet": clean_code[:300],
        "issues": issues,
        "llm_full": llm_text,
    }
    _review_log.append(record)
    _append_csv(record)

    return JSONResponse({
        "review_id": review_id,
        "language": language,
        "issues": issues,
        "issues_count": len(issues),
        "tool_warnings": tool_warnings,
        "llm_feedback": llm_text,
        "llm_available": llm_available,
        "analysis_time_ms": analysis_time_ms,
    })


@app.post("/rate")
async def rate_review(request: Request) -> JSONResponse:
    body = await request.json()
    review_id = body.get("review_id", "")
    rating = body.get("rating", 0)
    if rating not in (-1, 1):
        raise HTTPException(status_code=400, detail="Rating must be 1 or -1.")
    for entry in _review_log:
        if entry.get("review_id") == review_id:
            entry["rating"] = rating
            _append_csv({**entry, "rating": rating})
            return JSONResponse({"status": "ok"})
    raise HTTPException(status_code=404, detail="Review not found.")


@app.post("/ta-submit")
async def ta_submit(request: Request) -> JSONResponse:
    body = await request.json()
    review_id = body.get("review_id", "")
    for entry in _review_log:
        if entry.get("review_id") == review_id:
            if not any(q.get("review_id") == review_id for q in _ta_queue):
                _ta_queue.append(entry)
            return JSONResponse({"status": "queued"})
    raise HTTPException(status_code=404, detail="Review not found.")


@app.get("/metrics")
async def get_metrics() -> JSONResponse:
    total = len(_review_log)
    rated = [e for e in _review_log if e.get("rating") in (-1, 1)]
    avg_rating = sum(e["rating"] for e in rated) / len(rated) if rated else None
    avg_time = int(sum(e.get("analysis_time_ms", 0) for e in _review_log) / total) if total else 0
    avg_issues = round(sum(e.get("issues_count", 0) for e in _review_log) / total, 2) if total else 0
    avg_llm_len = int(sum(e.get("llm_response_length", 0) for e in _review_log) / total) if total else 0
    return JSONResponse({
        "total_reviews": total,
        "rated_reviews": len(rated),
        "avg_rating": avg_rating,
        "avg_analysis_time_ms": avg_time,
        "avg_issues_per_review": avg_issues,
        "avg_llm_response_length": avg_llm_len,
        "ta_queue_size": len(_ta_queue),
    })


@app.get("/ta-queue")
async def get_ta_queue() -> JSONResponse:
    safe = [
        {
            "review_id": e.get("review_id"),
            "timestamp": e.get("timestamp"),
            "language": e.get("language"),
            "issues_count": e.get("issues_count"),
            "rating": e.get("rating"),
            "code_snippet": e.get("code_snippet", "")[:200],
            "llm_suggestions": e.get("llm_full", "")[:400],
        }
        for e in _ta_queue
    ]
    return JSONResponse({"queue": safe, "total": len(safe)})


if __name__ == "__main__":
    uvicorn.run("app:app", host="0.0.0.0", port=7860, reload=False)
