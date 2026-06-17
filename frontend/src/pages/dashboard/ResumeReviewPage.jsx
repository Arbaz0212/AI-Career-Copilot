import { useState, useRef, useEffect } from "react";
import API from "../../services/api";
import ResultsScreen, { transformResumeResults } from "../../components/ResultsScreen";

const styles = `
  @import url('https://fonts.googleapis.com/css2?family=Clash+Display:wght@400;500;600;700&family=Cabinet+Grotesk:wght@300;400;500;600;700&display=swap');
  *, *::before, *::after { margin: 0; padding: 0; box-sizing: border-box; }
  :root {
    --bg: #f5f0e8; --ink: #0f0e0a; --accent: #e84c1e;
    --accent2: #2d6a4f; --muted: #8a8070; --card: #ede8df;
    --border: #d4cdc0; --gold: #c9922a; --white: #ffffff;
  }
  html { scroll-behavior: smooth; }
  body { background: var(--bg); padding: env(safe-area-inset-top, 0) env(safe-area-inset-right, 0) env(safe-area-inset-bottom, 0) env(safe-area-inset-left, 0); }

  .rr-root {
    background: var(--bg); color: var(--ink);
    font-family: 'Cabinet Grotesk', sans-serif;
    min-height: 100vh; position: relative; overflow-x: hidden;
  }
  .rr-root::after {
    content: ''; position: fixed; inset: 0; pointer-events: none; z-index: 9999; opacity: 0.25;
    background-image: url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)' opacity='0.03'/%3E%3C/svg%3E");
  }

  /* BG GLOW */
  .rr-glow {
    position: fixed; top: -200px; right: -200px;
    width: 600px; height: 600px; pointer-events: none; z-index: 0;
    background: radial-gradient(circle, rgba(232,76,30,0.07) 0%, transparent 65%);
    animation: glowFloat 8s ease-in-out infinite;
  }
  .rr-glow2 {
    position: fixed; bottom: -100px; left: -100px;
    width: 400px; height: 400px; pointer-events: none; z-index: 0;
    background: radial-gradient(circle, rgba(45,106,79,0.06) 0%, transparent 65%);
    animation: glowFloat 10s ease-in-out infinite reverse;
  }
  @keyframes glowFloat { 0%,100% { transform: translate(0,0); } 50% { transform: translate(20px,-30px); } }

  /* NAV */
  .rr-nav {
    display: flex; align-items: center; justify-content: space-between;
    padding: 22px 48px; border-bottom: 1px solid var(--border);
    position: relative; z-index: 10; animation: fadeDown 0.5s ease both;
  }
  .rr-logo { font-family: 'Clash Display', sans-serif; font-weight: 700; font-size: 20px; letter-spacing: -0.5px; }
  .rr-logo span { color: var(--accent); }
  .rr-nav-right { display: flex; align-items: center; gap: 16px; }
  .rr-back-btn {
    display: flex; align-items: center; gap: 8px; background: transparent;
    border: 1.5px solid var(--border); color: var(--muted); padding: 8px 18px;
    font-family: 'Cabinet Grotesk', sans-serif; font-size: 13px; font-weight: 600;
    cursor: pointer; transition: all 0.2s;
  }
  .rr-back-btn:hover { border-color: var(--ink); color: var(--ink); }
  .rr-plan-tag {
    background: var(--ink); color: var(--bg); padding: 6px 16px;
    font-size: 11px; font-weight: 700; letter-spacing: 1.5px; text-transform: uppercase;
  }

  /* MAIN */
  .rr-main {
    max-width: 780px; margin: 0 auto; padding: 60px 24px 80px;
    position: relative; z-index: 1;
  }

  /* HERO TEXT */
  .rr-hero { text-align: center; margin-bottom: 48px; animation: fadeUp 0.5s ease 0.1s both; }
  .rr-eyebrow {
    display: inline-flex; align-items: center; gap: 8px;
    background: var(--card); border: 1px solid var(--border);
    padding: 6px 16px; font-size: 11px; font-weight: 700;
    letter-spacing: 1.5px; text-transform: uppercase; color: var(--muted);
    margin-bottom: 24px;
  }
  .rr-eyebrow-dot { width: 6px; height: 6px; background: var(--accent2); border-radius: 50%; animation: pulse 2s infinite; }
  @keyframes pulse { 0%,100% { opacity:1; transform:scale(1); } 50% { opacity:0.4; transform:scale(0.7); } }
  .rr-hero-title {
    font-family: 'Clash Display', sans-serif; font-size: clamp(32px, 5vw, 54px);
    font-weight: 700; letter-spacing: -2px; line-height: 1.0; margin-bottom: 18px;
  }
  .rr-hero-title span { color: var(--accent); }
  .rr-hero-sub { font-size: 16px; color: var(--muted); max-width: 500px; margin: 0 auto; line-height: 1.7; }

  /* FREE SCAN PILL */
  .rr-free-pill {
    display: flex; align-items: center; justify-content: center; gap: 8px;
    margin-top: 20px; font-size: 13px; font-weight: 600;
  }
  .rr-free-pill-badge {
    background: rgba(45,106,79,0.12); border: 1px solid rgba(45,106,79,0.3);
    color: var(--accent2); padding: 4px 12px; font-size: 11px; font-weight: 700;
    letter-spacing: 1px; text-transform: uppercase;
  }

  /* UPLOAD CARD */
  .rr-upload-card {
    background: var(--white); border: 1.5px solid var(--border);
    margin-bottom: 20px; animation: fadeUp 0.5s ease 0.2s both;
    position: relative; overflow: hidden;
  }
  .rr-upload-card::before {
    content: ''; position: absolute; top: 0; left: 0; right: 0; height: 3px;
    background: var(--accent);
  }

  .rr-card-header {
    padding: 24px 28px 0; display: flex; align-items: center; justify-content: space-between;
  }
  .rr-card-title { font-family: 'Clash Display', sans-serif; font-weight: 700; font-size: 17px; }
  .rr-card-step {
    font-size: 10px; font-weight: 700; letter-spacing: 1.5px; text-transform: uppercase;
    color: var(--muted); background: var(--bg); border: 1px solid var(--border);
    padding: 4px 10px;
  }

  /* DROP ZONE */
  .rr-drop-zone {
    margin: 20px 28px 28px;
    border: 2px dashed var(--border);
    padding: 52px 24px; text-align: center; cursor: pointer;
    transition: all 0.25s; position: relative; background: var(--bg);
  }
  .rr-drop-zone:hover, .rr-drop-zone.drag-over {
    border-color: var(--accent); background: #fdf7f4;
    transform: scale(1.005);
  }
  .rr-drop-zone.drag-over { box-shadow: 0 0 0 4px rgba(232,76,30,0.08); }
  .rr-file-input { position: absolute; inset: 0; opacity: 0; cursor: pointer; }
  .rr-drop-icon {
    font-size: 48px; margin-bottom: 16px; display: block;
    animation: floatIcon 3s ease-in-out infinite;
  }
  @keyframes floatIcon { 0%,100% { transform: translateY(0); } 50% { transform: translateY(-6px); } }
  .rr-drop-title {
    font-family: 'Clash Display', sans-serif; font-weight: 700; font-size: 18px; margin-bottom: 8px;
  }
  .rr-drop-sub { font-size: 13px; color: var(--muted); margin-bottom: 16px; }
  .rr-drop-btn {
    display: inline-flex; align-items: center; gap: 6px;
    background: var(--ink); color: var(--bg);
    padding: 10px 22px; font-family: 'Clash Display', sans-serif;
    font-weight: 600; font-size: 13px; letter-spacing: 0.5px;
    border: none; cursor: pointer; transition: background 0.2s;
    pointer-events: none;
  }
  .rr-drop-zone:hover .rr-drop-btn { background: var(--accent); }
  .rr-drop-formats {
    display: flex; align-items: center; justify-content: center; gap: 8px;
    margin-top: 14px;
  }
  .rr-format-tag {
    font-size: 10px; font-weight: 700; letter-spacing: 1px; text-transform: uppercase;
    background: var(--card); border: 1px solid var(--border); color: var(--muted); padding: 3px 9px;
  }

  /* FILE SELECTED STATE */
  .rr-file-selected {
    margin: 0 28px 28px; display: none; align-items: center; gap: 14px;
    background: rgba(45,106,79,0.06); border: 1.5px solid rgba(45,106,79,0.25);
    padding: 16px 18px; animation: fadeUp 0.3s ease both;
  }
  .rr-file-selected.show { display: flex; }
  .rr-file-ico {
    width: 44px; height: 44px; background: rgba(45,106,79,0.1);
    border: 1px solid rgba(45,106,79,0.2);
    display: flex; align-items: center; justify-content: center; font-size: 22px; flex-shrink: 0;
  }
  .rr-file-name { font-size: 14px; font-weight: 700; color: var(--ink); }
  .rr-file-size { font-size: 12px; color: var(--muted); margin-top: 2px; }
  .rr-file-check { margin-left: auto; color: var(--accent2); font-size: 22px; }
  .rr-file-remove {
    background: none; border: none; color: var(--muted); font-size: 18px;
    cursor: pointer; transition: color 0.15s; padding: 4px;
  }
  .rr-file-remove:hover { color: var(--accent); }

  /* WHAT YOU GET */
  .rr-what-card {
    background: var(--white); border: 1.5px solid var(--border);
    padding: 26px 28px; margin-bottom: 20px;
    animation: fadeUp 0.5s ease 0.28s both;
  }
  .rr-what-title { font-family: 'Clash Display', sans-serif; font-weight: 700; font-size: 15px; margin-bottom: 18px; }
  .rr-what-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; }
  .rr-what-item {
    display: flex; align-items: flex-start; gap: 10px; font-size: 13px;
    padding: 11px 14px; background: var(--bg); border-left: 3px solid var(--accent);
    transition: background 0.15s;
  }
  .rr-what-item:hover { background: var(--card); }
  .rr-what-icon { flex-shrink: 0; }
  .rr-what-text {}
  .rr-what-text strong { display: block; font-size: 13px; margin-bottom: 1px; }
  .rr-what-text span { font-size: 11px; color: var(--muted); }

  /* ANALYZE BUTTON */
  .rr-analyze-wrap { animation: fadeUp 0.5s ease 0.35s both; }
  .rr-analyze-btn {
    width: 100%; padding: 18px; border: none;
    background: var(--ink); color: var(--bg);
    font-family: 'Clash Display', sans-serif; font-weight: 700; font-size: 16px;
    letter-spacing: 0.5px; cursor: pointer; transition: all 0.2s;
    display: flex; align-items: center; justify-content: center; gap: 12px;
    position: relative; overflow: hidden;
  }
  .rr-analyze-btn::after {
    content: ''; position: absolute; inset: 0;
    background: linear-gradient(90deg, transparent, rgba(255,255,255,0.05), transparent);
    transform: translateX(-100%); transition: transform 0.6s;
  }
  .rr-analyze-btn:hover { background: var(--accent); }
  .rr-analyze-btn:hover::after { transform: translateX(100%); }
  .rr-analyze-btn:disabled { background: #333; cursor: not-allowed; }
  .rr-analyze-btn:active { transform: scale(0.995); }

  /* ANALYZING STATE — full-screen overlay */
  .rr-analyzing-overlay {
    position: fixed; inset: 0; background: rgba(15,14,10,0.85);
    z-index: 500; display: none; align-items: center; justify-content: center;
    animation: fadeIn 0.3s ease both;
  }
  .rr-analyzing-overlay.show { display: flex; }
  .rr-analyzing-modal {
    background: var(--bg); padding: 48px 40px; max-width: 440px; width: 90%;
    text-align: center; animation: modalUp 0.4s ease both;
    position: relative; overflow: hidden;
  }
  @keyframes modalUp { from { opacity: 0; transform: translateY(24px); } to { opacity: 1; transform: translateY(0); } }
  @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
  .rr-analyzing-modal::before {
    content: ''; position: absolute; top: 0; left: 0; right: 0; height: 3px;
    background: linear-gradient(90deg, var(--accent), var(--accent2), var(--gold));
  }
  .rr-analyzing-steps { display: flex; flex-direction: column; gap: 8px; text-align: left; }
  .rr-analyzing-step {
    display: flex; align-items: center; gap: 12px; padding: 10px 14px;
    background: var(--card); font-size: 13px; transition: all 0.3s;
  }
  .rr-analyzing-step.active { background: rgba(232,76,30,0.08); border-left: 3px solid var(--accent); }
  .rr-analyzing-step.done { background: rgba(45,106,79,0.08); border-left: 3px solid var(--accent2); }
  .rr-step-dot { width: 8px; height: 8px; border-radius: 50%; background: var(--border); flex-shrink: 0; }
  .rr-step-dot.active { background: var(--accent); animation: pulse 1s infinite; }
  .rr-step-dot.done { background: var(--accent2); }
  .rr-spinner-ring {
    width: 80px; height: 80px; border: 4px solid var(--card);
    border-top-color: var(--accent); border-right-color: var(--accent2);
    border-radius: 50%; animation: spin 1.2s linear infinite; margin: 0 auto 24px;
  }

  /* TRUST STRIP */
  .rr-trust {
    display: flex; align-items: center; justify-content: center; gap: 28px;
    margin-top: 32px; padding-top: 28px; border-top: 1px solid var(--border);
    animation: fadeUp 0.5s ease 0.4s both;
  }
  .rr-trust-item { display: flex; align-items: center; gap: 6px; font-size: 12px; color: var(--muted); }
  .rr-trust-icon { font-size: 14px; }

  @keyframes fadeUp { from { opacity: 0; transform: translateY(18px); } to { opacity: 1; transform: translateY(0); } }
  @keyframes fadeDown { from { opacity: 0; transform: translateY(-12px); } to { opacity: 1; transform: translateY(0); } }

  @media (max-width: 860px) {
    .rr-glow, .rr-glow2 { display: none; }
    .rr-hero-title { font-size: clamp(28px, 8vw, 42px) !important; }
    .rr-back-btn { padding: 10px 14px; font-size: 12px; }
  }
  @media (max-width: 600px) {
    .rr-nav { padding: 14px 16px; flex-wrap: wrap; gap: 8px; }
    .rr-nav-right { width: 100%; justify-content: flex-end; }
    .rr-main { padding: 32px 12px 80px; }
    .rr-drop-zone { margin: 12px 12px 16px; padding: 28px 12px; }
    .rr-file-selected { margin: 0 12px 16px; flex-wrap: wrap; }
    .rr-what-grid { grid-template-columns: 1fr; }
    .rr-trust { flex-wrap: wrap; gap: 12px; flex-direction: column; align-items: center; }
    .rr-card-header { padding: 16px 16px 0; flex-wrap: wrap; gap: 8px; }
    .rr-what-card { padding: 16px; }
    .rr-drop-title { font-size: 16px; }
    .rr-drop-sub { font-size: 12px; }
    .rr-hero { margin-bottom: 32px; }
    .rr-analyze-btn { padding: 16px; font-size: 14px; }
    .rr-what-item { padding: 10px 12px; }
    .rr-what-item strong { font-size: 12px; }
    .rr-what-item span { font-size: 10px; }
    .rr-btn, .rr-back-btn, .rr-analyze-btn { min-height: 48px; }
  }
`;

const WHAT_YOU_GET = [
  { icon: "🎯", title: "ATS Score", desc: "Exact score out of 100 with grade" },
  { icon: "🔍", title: "Keyword Gaps", desc: "Missing words costing you interviews" },
  { icon: "✍️", title: "AI Rewrites", desc: "Better bullets for each section" },
  { icon: "📊", title: "Section Breakdown", desc: "Summary, Skills, Experience, Education" },
  { icon: "⚠️", title: "Critical Issues", desc: "What's actively hurting your score" },
  { icon: "📄", title: "PDF Report", desc: "Shareable full analysis report" },
];

const ANALYZING_STEPS = [
  "Parsing resume content...",
  "Detecting skills and experience level...",
  "Running ATS scoring engine...",
  "Generating AI feedback...",
  "Building your report...",
];

export default function ResumeReviewPage({ onAnalysisComplete, onBack }) {
  const [file, setFile] = useState(null);
  const [isDragging, setIsDragging] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [currentStep, setCurrentStep] = useState(-1);
  const [results, setResults] = useState(null);
  const [resultsLoading, setResultsLoading] = useState(false);
  const [error, setError] = useState("");
  const fileInputRef = useRef(null);

  useEffect(() => {
    const s = document.createElement("style");
    s.innerHTML = styles;
    document.head.appendChild(s);
    return () => document.head.removeChild(s);
  }, []);

  // Prevent body scroll when analyzing
  useEffect(() => {
    if (isAnalyzing) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => { document.body.style.overflow = ''; };
  }, [isAnalyzing]);

  const handleFile = (f) => {
    if (!f) return;
    if (!["application/pdf", "application/vnd.openxmlformats-officedocument.wordprocessingml.document"].includes(f.type) && !f.name.endsWith(".pdf") && !f.name.endsWith(".docx")) {
      alert("Please upload a PDF or DOCX file.");
      return;
    }
    setFile(f);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragging(false);
    handleFile(e.dataTransfer.files[0]);
  };

  const removeFile = () => {
    setFile(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const startAnalysis = async () => {
    if (!file) return;
    setIsAnalyzing(true);
    setError("");

    // Step-through simulation while API call happens
    for (let i = 0; i < ANALYZING_STEPS.length; i++) {
      setCurrentStep(i);
      await new Promise(r => setTimeout(r, 600));
    }

    try {
      const formData = new FormData();
      formData.append("file", file);

      const res = await API.post("/resume-review/upload", formData, {
        headers: { "Content-Type": "multipart/form-data" },
        timeout: 60000,
      });

      const apiData = res.data;
      const transformed = transformResumeResults(apiData);
      setResults(transformed);
      setResultsLoading(true);
      // NOTE: onAnalysisComplete NOT called here — it fires when user
      // clicks "Back to Dashboard" from ResultsScreen, so the results
      // page gets to render before the parent navigates away.

    } catch (err) {
      setError(err?.response?.data?.detail || "Analysis failed. Please try again.");
    } finally {
      setIsAnalyzing(false);
    }
  };

  const formatSize = (bytes) => bytes < 1024 * 1024
    ? `${(bytes / 1024).toFixed(0)} KB`
    : `${(bytes / (1024 * 1024)).toFixed(1)} MB`;

  // Show ResultsScreen if we have results
  if (results) {
    return (
      <ResultsScreen
        data={results}
        loading={resultsLoading}
        type="resume"
        onBack={() => {
          // Mark scan as consumed when user navigates back
          if (onAnalysisComplete) onAnalysisComplete(results);
          if (onBack) onBack();
        }}
        onNewScan={() => {
          setResults(null);
          setFile(null);
          setResultsLoading(false);
          if (fileInputRef.current) fileInputRef.current.value = "";
        }}
      />
    );
  }

  return (
    <div className="rr-root">
      <div className="rr-glow" />
      <div className="rr-glow2" />

      {/* ANALYZING OVERLAY — fixed over everything */}
      <div className={`rr-analyzing-overlay ${isAnalyzing ? "show" : ""}`}>
        <div className="rr-analyzing-modal">
          <div className="rr-spinner-ring" />
          <div style={{ fontFamily: "'Clash Display', sans-serif", fontWeight: 700, fontSize: 22, marginBottom: 8 }}>
            Analyzing your resume
          </div>
          <div style={{ fontSize: 13, color: "var(--muted)", marginBottom: 28 }}>This takes about 20 seconds</div>
          <div className="rr-analyzing-steps">
            {ANALYZING_STEPS.map((step, i) => (
              <div className="rr-analyzing-step" key={i}>
                <div className={`rr-step-dot ${i < currentStep ? "done" : i === currentStep ? "active" : ""}`} />
                <span style={{ color: i <= currentStep ? "var(--ink)" : "var(--muted)" }}>{step}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* NAV */}
      <nav className="rr-nav">
        <div className="rr-logo">AI Career <span>Copilot</span></div>
        <div className="rr-nav-right">
          <button className="rr-back-btn" onClick={() => onBack ? onBack() : window.history.back()}>
            ← Back to Dashboard
          </button>
          <div className="rr-plan-tag">📄 Resume Reviewer</div>
        </div>
      </nav>

      <div className="rr-main">

        {/* HERO */}
        <div className="rr-hero">
          <div className="rr-eyebrow">
            <div className="rr-eyebrow-dot" />
            Free Scan · No Payment Required
          </div>
          <div className="rr-hero-title">
            Find out exactly why<br />your resume gets <span>rejected.</span>
          </div>
          <div className="rr-hero-sub">
            Upload your resume and get a deep AI-powered ATS analysis in under 30 seconds.
            Know your score, your gaps, and exactly what to fix.
          </div>
          <div className="rr-free-pill">
            <div className="rr-free-pill-badge">✓ 1 Free Scan Included</div>
            <span style={{ color: "var(--muted)", fontSize: 13 }}>No credit card needed</span>
          </div>
        </div>

        {/* UPLOAD CARD */}
        <div className="rr-upload-card">
          <div className="rr-card-header">
            <div className="rr-card-title">Upload Your Resume</div>
            <div className="rr-card-step">Step 1 of 1</div>
          </div>

          {!isAnalyzing ? (
            <>
              {/* DROP ZONE */}
              {!file && (
                <div
                  className={`rr-drop-zone ${isDragging ? "drag-over" : ""}`}
                  onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
                  onDragLeave={() => setIsDragging(false)}
                  onDrop={handleDrop}
                  onClick={() => fileInputRef.current?.click()}
                >
                  <input
                    ref={fileInputRef}
                    type="file"
                    className="rr-file-input"
                    accept=".pdf,.docx"
                    onChange={(e) => handleFile(e.target.files[0])}
                    onClick={(e) => e.stopPropagation()}
                  />
                  <span className="rr-drop-icon">📄</span>
                  <div className="rr-drop-title">
                    {isDragging ? "Drop it here!" : "Drag & drop your resume"}
                  </div>
                  <div className="rr-drop-sub">or click anywhere to browse your files</div>
                  <div className="rr-drop-btn">Browse Files →</div>
                  <div className="rr-drop-formats">
                    <span className="rr-format-tag">PDF</span>
                    <span style={{ color: "var(--muted)", fontSize: 12 }}>or</span>
                    <span className="rr-format-tag">DOCX</span>
                    <span style={{ color: "var(--muted)", fontSize: 12 }}>· Max 5MB</span>
                  </div>
                </div>
              )}

              {/* FILE SELECTED */}
              {file && (
                <div className="rr-file-selected show">
                  <div className="rr-file-ico">📄</div>
                  <div>
                    <div className="rr-file-name">{file.name}</div>
                    <div className="rr-file-size">{formatSize(file.size)} · Ready to analyze</div>
                  </div>
                  <div className="rr-file-check">✓</div>
                  <button className="rr-file-remove" onClick={removeFile}>✕</button>
                </div>
              )}
            </>
          ) : null}
        </div>

        {/* WHAT YOU GET */}
        {!isAnalyzing && (
          <div className="rr-what-card">
            <div className="rr-what-title">What you'll get in your free scan</div>
            <div className="rr-what-grid">
              {WHAT_YOU_GET.map((item, i) => (
                <div className="rr-what-item" key={i} style={{ animationDelay: `${0.3 + i * 0.05}s` }}>
                  <span className="rr-what-icon">{item.icon}</span>
                  <div className="rr-what-text">
                    <strong>{item.title}</strong>
                    <span>{item.desc}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ANALYZE BUTTON */}
        {!isAnalyzing && (
          <div className="rr-analyze-wrap">
            <button
              className="rr-analyze-btn"
              onClick={startAnalysis}
              disabled={!file}
              style={!file ? { opacity: 0.5 } : {}}
            >
              {file ? (
                <><span>⚡</span> Analyze My Resume — Get My Score</>
              ) : (
                <><span>📄</span> Upload your resume to continue</>
              )}
            </button>
          </div>
        )}

        {/* TRUST STRIP */}
        {!isAnalyzing && (
          <div className="rr-trust">
            <div className="rr-trust-item"><span className="rr-trust-icon">🔒</span> Resume stays private</div>
            <div className="rr-trust-item"><span className="rr-trust-icon">⚡</span> Results in 30 seconds</div>
            <div className="rr-trust-item"><span className="rr-trust-icon">🇮🇳</span> Built for Indian market</div>
            <div className="rr-trust-item"><span className="rr-trust-icon">✓</span> No credit card needed</div>
          </div>
        )}

        {/* ERROR STATE */}
        {error && (
          <div style={{
            background: "rgba(232,76,30,0.08)",
            border: "1.5px solid var(--accent)",
            padding: "20px 24px",
            borderRadius: "12px",
            fontSize: "14px",
            color: "var(--accent)",
            textAlign: "center",
            marginTop: "20px",
            animation: "fadeUp 0.3s ease both",
          }}>
            {error}
          </div>
        )}

      </div>
    </div>
  );
}