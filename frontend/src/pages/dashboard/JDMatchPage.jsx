import { useState, useRef, useEffect } from "react";
import API from "../../services/api";
import ResultsScreen, { transformJdResults } from "../../components/ResultsScreen";

const styles = `
  @import url('https://fonts.googleapis.com/css2?family=Clash+Display:wght@400;500;600;700&family=Cabinet+Grotesk:wght@300;400;500;600;700&display=swap');
  *, *::before, *::after { margin: 0; padding: 0; box-sizing: border-box; }
  :root {
    --bg: #f5f0e8; --ink: #0f0e0a; --accent: #e84c1e;
    --accent2: #2d6a4f; --muted: #8a8070; --card: #ede8df;
    --border: #d4cdc0; --gold: #c9922a; --white: #ffffff;
  }
  html { scroll-behavior: smooth; }

  .jd-root {
    background: var(--bg); color: var(--ink);
    font-family: 'Cabinet Grotesk', sans-serif;
    min-height: 100vh; position: relative; overflow-x: hidden;
  }
  .jd-root::after {
    content: ''; position: fixed; inset: 0; pointer-events: none; z-index: 9999; opacity: 0.25;
    background-image: url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)' opacity='0.03'/%3E%3C/svg%3E");
  }

  /* BG ACCENT BLOBS */
  .jd-blob1 {
    position: fixed; top: -150px; right: -150px; width: 500px; height: 500px;
    pointer-events: none; z-index: 0;
    background: radial-gradient(circle, rgba(201,146,42,0.08) 0%, transparent 65%);
    animation: blobFloat 9s ease-in-out infinite;
  }
  .jd-blob2 {
    position: fixed; bottom: -100px; left: -100px; width: 400px; height: 400px;
    pointer-events: none; z-index: 0;
    background: radial-gradient(circle, rgba(232,76,30,0.06) 0%, transparent 65%);
    animation: blobFloat 12s ease-in-out infinite reverse;
  }
  .jd-blob3 {
    position: fixed; top: 50%; left: 50%; transform: translate(-50%,-50%);
    width: 300px; height: 300px; pointer-events: none; z-index: 0;
    background: radial-gradient(circle, rgba(45,106,79,0.04) 0%, transparent 70%);
    animation: blobFloat 15s ease-in-out infinite;
  }
  @keyframes blobFloat { 0%,100% { transform: translate(0,0); } 50% { transform: translate(15px,-25px); } }

  /* NAV */
  .jd-nav {
    display: flex; align-items: center; justify-content: space-between;
    padding: 22px 48px; border-bottom: 1px solid var(--border);
    position: relative; z-index: 10; animation: fadeDown 0.5s ease both;
    background: rgba(245,240,232,0.9); backdrop-filter: blur(8px);
    position: sticky; top: 0;
  }
  .jd-logo { font-family: 'Clash Display', sans-serif; font-weight: 700; font-size: 20px; letter-spacing: -0.5px; }
  .jd-logo span { color: var(--accent); }
  .jd-nav-center {
    display: flex; align-items: center; gap: 0;
    background: var(--card); border: 1px solid var(--border); overflow: hidden;
  }
  .jd-step-nav {
    padding: 8px 20px; font-size: 12px; font-weight: 700; letter-spacing: 0.5px;
    display: flex; align-items: center; gap: 8px;
    border-right: 1px solid var(--border);
  }
  .jd-step-nav:last-child { border-right: none; }
  .jd-step-num {
    width: 20px; height: 20px; border-radius: 50%;
    display: flex; align-items: center; justify-content: center;
    font-size: 10px; font-weight: 800; background: var(--border); color: var(--muted);
  }
  .jd-step-num.active { background: var(--accent); color: #fff; }
  .jd-step-num.done { background: var(--accent2); color: #fff; }
  .jd-step-nav .step-label { color: var(--muted); }
  .jd-step-nav.active-step .step-label { color: var(--ink); }
  .jd-nav-right { display: flex; align-items: center; gap: 12px; }
  .jd-back-btn {
    background: transparent; border: 1.5px solid var(--border); color: var(--muted);
    padding: 8px 18px; font-family: 'Cabinet Grotesk', sans-serif; font-size: 13px;
    font-weight: 600; cursor: pointer; transition: all 0.2s;
  }
  .jd-back-btn:hover { border-color: var(--ink); color: var(--ink); }
  .jd-plan-pill {
    background: linear-gradient(135deg, var(--accent) 0%, #c93d14 100%);
    color: #fff; padding: 6px 16px;
    font-size: 11px; font-weight: 700; letter-spacing: 1.5px; text-transform: uppercase;
  }

  /* MAIN */
  .jd-main { max-width: 1120px; margin: 0 auto; padding: 50px 24px 80px; position: relative; z-index: 1; }

  /* HERO */
  .jd-hero { text-align: center; margin-bottom: 44px; animation: fadeUp 0.5s ease 0.1s both; }
  .jd-eyebrow {
    display: inline-flex; align-items: center; gap: 10px;
    background: var(--ink); padding: 7px 18px;
    font-size: 11px; font-weight: 700; letter-spacing: 2px; text-transform: uppercase;
    color: var(--bg); margin-bottom: 22px; position: relative; overflow: hidden;
  }
  .jd-eyebrow::after {
    content: ''; position: absolute; inset: 0;
    background: linear-gradient(90deg, transparent, rgba(232,76,30,0.3), transparent);
    animation: eyebrowShine 3s ease-in-out infinite;
  }
  @keyframes eyebrowShine { 0%,100% { transform: translateX(-100%); } 50% { transform: translateX(100%); } }
  .jd-eyebrow-dot { width: 6px; height: 6px; background: var(--accent); border-radius: 50%; animation: pulse 1.5s infinite; }
  @keyframes pulse { 0%,100% { opacity:1; transform:scale(1); } 50% { opacity:0.4; transform:scale(0.7); } }
  .jd-hero-title {
    font-family: 'Clash Display', sans-serif; font-size: clamp(32px, 5vw, 56px);
    font-weight: 700; letter-spacing: -2px; line-height: 1.0; margin-bottom: 16px;
  }
  .jd-hero-title .line2 { color: var(--gold); }
  .jd-hero-sub { font-size: 16px; color: var(--muted); max-width: 560px; margin: 0 auto; line-height: 1.7; }

  /* SCORE PREVIEW STRIP */
  .jd-preview-strip {
    display: flex; align-items: center; justify-content: center; gap: 20px;
    margin-top: 24px; flex-wrap: wrap;
  }
  .jd-preview-item {
    display: flex; align-items: center; gap: 10px;
    background: var(--white); border: 1px solid var(--border);
    padding: 10px 18px; font-size: 13px;
    animation: fadeUp 0.5s ease both;
  }
  .jd-preview-icon { font-size: 16px; }
  .jd-preview-label { font-weight: 600; }
  .jd-preview-sub { color: var(--muted); font-size: 12px; }

  /* TWO PANEL LAYOUT */
  .jd-panels {
    display: grid; grid-template-columns: 1fr 1fr;
    gap: 20px; margin-bottom: 20px;
  }

  /* PANEL */
  .jd-panel {
    background: var(--white); border: 1.5px solid var(--border);
    position: relative; overflow: hidden; animation: fadeUp 0.5s ease both;
    display: flex; flex-direction: column;
  }
  .jd-panel::before { content: ''; position: absolute; top: 0; left: 0; right: 0; height: 3px; }
  .jd-panel.panel-resume::before { background: var(--ink); }
  .jd-panel.panel-jd::before { background: var(--gold); }

  .jd-panel-header {
    padding: 20px 24px; border-bottom: 1px solid var(--border);
    display: flex; align-items: center; justify-content: space-between;
  }
  .jd-panel-title-row { display: flex; align-items: center; gap: 10px; }
  .jd-panel-icon {
    width: 36px; height: 36px; display: flex; align-items: center; justify-content: center;
    font-size: 18px; background: var(--bg); border: 1px solid var(--border);
  }
  .jd-panel-title { font-family: 'Clash Display', sans-serif; font-weight: 700; font-size: 15px; }
  .jd-panel-sub { font-size: 11px; color: var(--muted); margin-top: 1px; }
  .jd-panel-badge {
    font-size: 10px; font-weight: 700; letter-spacing: 1px; text-transform: uppercase;
    padding: 4px 10px; background: var(--bg); border: 1px solid var(--border); color: var(--muted);
  }
  .jd-panel-badge.gold { background: rgba(201,146,42,0.1); border-color: rgba(201,146,42,0.3); color: var(--gold); }

  .jd-panel-body { padding: 20px 24px; flex: 1; display: flex; flex-direction: column; }

  /* RESUME DROP ZONE */
  .jd-drop-zone {
    flex: 1; border: 2px dashed var(--border); padding: 36px 20px;
    text-align: center; cursor: pointer; transition: all 0.25s;
    background: var(--bg); display: flex; flex-direction: column;
    align-items: center; justify-content: center; min-height: 200px;
    position: relative;
  }
  .jd-drop-zone:hover, .jd-drop-zone.drag-over {
    border-color: var(--accent); background: #fdf7f4; transform: scale(1.01);
  }
  .jd-file-input { position: absolute; inset: 0; opacity: 0; cursor: pointer; }
  .jd-drop-icon { font-size: 40px; margin-bottom: 12px; animation: floatIcon 3s ease-in-out infinite; }
  @keyframes floatIcon { 0%,100% { transform: translateY(0); } 50% { transform: translateY(-5px); } }
  .jd-drop-title { font-family: 'Clash Display', sans-serif; font-weight: 700; font-size: 15px; margin-bottom: 6px; }
  .jd-drop-sub { font-size: 12px; color: var(--muted); margin-bottom: 14px; }
  .jd-drop-cta {
    background: var(--ink); color: var(--bg); padding: 9px 20px;
    font-family: 'Clash Display', sans-serif; font-weight: 600; font-size: 12px;
    letter-spacing: 0.5px; border: none; pointer-events: none;
    transition: background 0.2s;
  }
  .jd-drop-zone:hover .jd-drop-cta { background: var(--accent); }
  .jd-drop-formats { display: flex; gap: 6px; margin-top: 12px; }
  .jd-fmt { font-size: 9px; font-weight: 700; letter-spacing: 1px; text-transform: uppercase; background: var(--card); border: 1px solid var(--border); color: var(--muted); padding: 2px 8px; }

  /* FILE SELECTED STATE */
  .jd-file-selected {
    display: flex; align-items: center; gap: 12px;
    background: rgba(45,106,79,0.06); border: 1.5px solid rgba(45,106,79,0.25);
    padding: 14px 16px; flex: 1;
  }
  .jd-file-ico {
    width: 40px; height: 40px; background: rgba(45,106,79,0.1);
    border: 1px solid rgba(45,106,79,0.2);
    display: flex; align-items: center; justify-content: center; font-size: 20px; flex-shrink: 0;
  }
  .jd-file-info { flex: 1; }
  .jd-file-name { font-size: 13px; font-weight: 700; }
  .jd-file-size { font-size: 11px; color: var(--muted); margin-top: 1px; }
  .jd-file-ok { color: var(--accent2); font-size: 20px; }
  .jd-file-rm {
    background: none; border: none; color: var(--muted); font-size: 16px;
    cursor: pointer; transition: color 0.15s;
  }
  .jd-file-rm:hover { color: var(--accent); }

  /* JD TEXTAREA */
  .jd-textarea-wrap { flex: 1; display: flex; flex-direction: column; }
  .jd-textarea {
    flex: 1; width: 100%; min-height: 220px;
    background: var(--bg); border: 1.5px solid var(--border);
    padding: 16px 18px; font-family: 'Cabinet Grotesk', sans-serif;
    font-size: 13px; color: var(--ink); resize: none; outline: none;
    transition: border-color 0.2s, box-shadow 0.2s; line-height: 1.7;
  }
  .jd-textarea:focus { border-color: var(--gold); box-shadow: 0 0 0 3px rgba(201,146,42,0.08); }
  .jd-textarea::placeholder { color: #bbb; }
  .jd-textarea-footer {
    display: flex; align-items: center; justify-content: space-between;
    margin-top: 10px;
  }
  .jd-char-count { font-size: 11px; color: var(--muted); }
  .jd-char-count.warn { color: var(--accent); }
  .jd-paste-btn {
    display: flex; align-items: center; gap: 6px;
    background: transparent; border: 1px solid var(--border);
    color: var(--muted); padding: 6px 14px; font-size: 11px; font-weight: 600;
    cursor: pointer; transition: all 0.2s; letter-spacing: 0.5px; text-transform: uppercase;
  }
  .jd-paste-btn:hover { background: var(--card); border-color: var(--ink); color: var(--ink); }

  /* JD TIPS */
  .jd-tips {
    display: flex; flex-direction: column; gap: 6px; margin-top: 14px;
  }
  .jd-tip {
    display: flex; align-items: flex-start; gap: 8px; font-size: 11px; color: var(--muted);
  }
  .jd-tip-dot { width: 4px; height: 4px; background: var(--gold); border-radius: 50%; margin-top: 5px; flex-shrink: 0; }

  /* FULL WIDTH ANALYZE SECTION */
  .jd-analyze-section { animation: fadeUp 0.5s ease 0.35s both; }
  .jd-analyze-btn {
    width: 100%; padding: 20px; border: none;
    background: var(--ink); color: var(--bg);
    font-family: 'Clash Display', sans-serif; font-weight: 700;
    font-size: 17px; letter-spacing: 0.5px; cursor: pointer;
    display: flex; align-items: center; justify-content: center; gap: 12px;
    transition: all 0.2s; position: relative; overflow: hidden;
  }
  .jd-analyze-btn::before {
    content: ''; position: absolute; inset: 0;
    background: linear-gradient(135deg, transparent 40%, rgba(201,146,42,0.15) 100%);
  }
  .jd-analyze-btn::after {
    content: ''; position: absolute; inset: 0;
    background: linear-gradient(90deg, transparent, rgba(255,255,255,0.04), transparent);
    transform: translateX(-100%); transition: transform 0.7s;
  }
  .jd-analyze-btn:hover { background: var(--accent); }
  .jd-analyze-btn:hover::after { transform: translateX(100%); }
  .jd-analyze-btn:disabled { background: #2a2a2a; cursor: not-allowed; opacity: 0.6; }
  .jd-analyze-btn:active { transform: scale(0.998); }
  .jd-analyze-sub {
    text-align: center; margin-top: 12px; font-size: 12px; color: var(--muted);
    display: flex; align-items: center; justify-content: center; gap: 16px;
  }
  .jd-analyze-sub-item { display: flex; align-items: center; gap: 5px; }

  /* WHAT YOU GET - PREMIUM VERSION */
  .jd-premium-strip {
    display: grid; grid-template-columns: repeat(4,1fr);
    gap: 2px; background: var(--border);
    border: 1.5px solid var(--border);
    margin-bottom: 20px; animation: fadeUp 0.5s ease 0.28s both;
  }
  .jd-premium-item {
    background: var(--white); padding: 20px 18px;
    display: flex; flex-direction: column; gap: 8px;
    transition: background 0.2s; cursor: default;
    position: relative; overflow: hidden;
  }
  .jd-premium-item::before {
    content: ''; position: absolute; bottom: 0; left: 0; right: 0; height: 2px;
    background: transparent; transition: background 0.2s;
  }
  .jd-premium-item:hover { background: var(--bg); }
  .jd-premium-item:hover::before { background: var(--gold); }
  .jd-premium-icon { font-size: 22px; }
  .jd-premium-label { font-family: 'Clash Display', sans-serif; font-weight: 700; font-size: 13px; }
  .jd-premium-desc { font-size: 11px; color: var(--muted); line-height: 1.5; }

  /* ANALYZING STATE */
  .jd-analyzing-overlay {
    position: fixed; inset: 0; background: rgba(15,14,10,0.85);
    z-index: 500; display: none; align-items: center; justify-content: center;
    animation: fadeIn 0.3s ease both;
  }
  .jd-analyzing-overlay.show { display: flex; }
  @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
  .jd-analyzing-modal {
    background: var(--bg); padding: 48px 40px; max-width: 440px; width: 100%;
    text-align: center; animation: modalUp 0.4s ease both;
    position: relative; overflow: hidden;
  }
  @keyframes modalUp { from { opacity: 0; transform: translateY(24px); } to { opacity: 1; transform: translateY(0); } }
  .jd-analyzing-modal::before {
    content: ''; position: absolute; top: 0; left: 0; right: 0; height: 3px;
    background: linear-gradient(90deg, var(--accent), var(--gold), var(--accent2));
    animation: progressBar 3s ease forwards;
  }
  @keyframes progressBar { from { width: 0; } to { width: 100%; } }
  .jd-modal-ring {
    width: 80px; height: 80px; border: 4px solid var(--card);
    border-top-color: var(--accent); border-right-color: var(--gold);
    border-radius: 50%; animation: spin 1.2s linear infinite; margin: 0 auto 24px;
  }
  @keyframes spin { to { transform: rotate(360deg); } }
  .jd-modal-title { font-family: 'Clash Display', sans-serif; font-weight: 700; font-size: 22px; margin-bottom: 8px; }
  .jd-modal-sub { font-size: 13px; color: var(--muted); margin-bottom: 28px; }
  .jd-modal-steps { display: flex; flex-direction: column; gap: 8px; text-align: left; }
  .jd-modal-step {
    display: flex; align-items: center; gap: 12px; padding: 10px 14px;
    background: var(--card); font-size: 13px; transition: all 0.3s;
  }
  .jd-modal-step.active { background: rgba(232,76,30,0.08); border-left: 3px solid var(--accent); }
  .jd-modal-step.done { background: rgba(45,106,79,0.08); border-left: 3px solid var(--accent2); }
  .jd-modal-step-dot { width: 8px; height: 8px; border-radius: 50%; background: var(--border); flex-shrink: 0; }
  .jd-modal-step.active .jd-modal-step-dot { background: var(--accent); animation: pulse 1s infinite; }
  .jd-modal-step.done .jd-modal-step-dot { background: var(--accent2); }
  .jd-modal-step-text { color: var(--muted); }
  .jd-modal-step.active .jd-modal-step-text, .jd-modal-step.done .jd-modal-step-text { color: var(--ink); }

  @keyframes fadeUp { from { opacity: 0; transform: translateY(18px); } to { opacity: 1; transform: translateY(0); } }
  @keyframes fadeDown { from { opacity: 0; transform: translateY(-12px); } to { opacity: 1; transform: translateY(0); } }

  @media (max-width: 860px) {
    .jd-panels { grid-template-columns: 1fr; }
    .jd-premium-strip { grid-template-columns: repeat(2,1fr); }
    .jd-nav { padding: 16px 20px; }
    .jd-nav-center { display: none; }
    .jd-main { padding: 36px 16px 60px; }
    .jd-hero-title { font-size: clamp(28px, 8vw, 42px) !important; }
    .jd-preview-strip { display: none; }
    .jd-blob1, .jd-blob2, .jd-blob3 { display: none; }
    .jd-back-btn { padding: 10px 14px; font-size: 12px; }
    .jd-textarea { min-height: 160px; font-size: 14px; }
  }
  @media (max-width: 500px) {
    .jd-premium-strip { grid-template-columns: 1fr; }
    .jd-nav-right { gap: 8px; }
  }
`;

const ANALYZING_STEPS = [
  "Parsing job description structure...",
  "Extracting required skills and keywords...",
  "Running semantic skill alignment...",
  "Computing ATS match score...",
  "Generating AI resume suggestions...",
  "Building your match report...",
];

const PREMIUM_FEATURES = [
  { icon: "🎯", label: "ATS Match Score", desc: "Exact % match against this specific JD" },
  { icon: "🔁", label: "Semantic Matching", desc: "Finds skill overlaps even with different wording" },
  { icon: "📝", label: "Bullet Rewrites", desc: "AI rewrites your bullets using JD language" },
  { icon: "💼", label: "Interview Tips", desc: "Tailored talking points for this exact role" },
];

export default function JDMatchPage({ onAnalysisComplete, onBack }) {
  const [file, setFile] = useState(null);
  const [jdText, setJdText] = useState("");
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

  // Prevent body scroll when analyzing overlay is visible
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
    setFile(f);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragging(false);
    handleFile(e.dataTransfer.files[0]);
  };

  const formatSize = (b) => b < 1024 * 1024 ? `${(b / 1024).toFixed(0)} KB` : `${(b / (1024 * 1024)).toFixed(1)} MB`;

  const canAnalyze = file && jdText.trim().length >= 100;

  const handlePaste = async () => {
    try {
      const text = await navigator.clipboard.readText();
      setJdText(text);
    } catch {
      alert("Paste the job description manually in the text box.");
    }
  };

  const startAnalysis = async () => {
    if (!canAnalyze) return;
    setIsAnalyzing(true);
    setCurrentStep(0);
    setError("");

    // Step-through simulation while API call runs
    for (let i = 0; i < ANALYZING_STEPS.length; i++) {
      setCurrentStep(i);
      await new Promise(r => setTimeout(r, 600));
    }

    try {
      const formData = new FormData();
      formData.append("resume", file);
      formData.append("jd_text", jdText);

      const res = await API.post("/jd-match/upload", formData, {
        headers: { "Content-Type": "multipart/form-data" },
        timeout: 120000,
      });

      const apiData = res.data;
      const transformed = transformJdResults(apiData);
      setResults(transformed);
      setResultsLoading(true);
      // NOTE: onAnalysisComplete NOT called here — fires when user
      // clicks "Back to Dashboard" from ResultsScreen.

    } catch (err) {
      setError(err?.response?.data?.detail || "Analysis failed. Please try again.");
    } finally {
      setIsAnalyzing(false);
    }
  };

  const stepStatus = (i) => {
    if (i < currentStep) return "done";
    if (i === currentStep) return "active";
    return "";
  };

  // Extract job title from JD text for display
  const extractJobInfo = (text) => {
    const lines = text.split("\n").filter((l) => l.trim());
    const firstLine = lines[0]?.trim() || "";
    // Remove common prefixes
    const title = firstLine.replace(/^(job title|title|role|position|hiring for|we are hiring|looking for)\s*[:\-]?\s*/i, "").trim();
    return title.length > 3 ? title : "Job Description";
  };

  // Show ResultsScreen if we have results
  if (results) {
    return (
      <ResultsScreen
        data={results}
        loading={resultsLoading}
        type="jd"
        jobTitle={extractJobInfo(jdText)}
        companyName=""
        onBack={() => {
          // Mark scan as consumed when user navigates back
          if (onAnalysisComplete) onAnalysisComplete(results);
          if (onBack) onBack();
        }}
        onNewScan={() => {
          setResults(null);
          setFile(null);
          setJdText("");
          setResultsLoading(false);
          if (fileInputRef.current) fileInputRef.current.value = "";
        }}
      />
    );
  }

  return (
    <div className="jd-root">
      <div className="jd-blob1" />
      <div className="jd-blob2" />
      <div className="jd-blob3" />

      {/* ANALYZING OVERLAY */}
      <div className={`jd-analyzing-overlay ${isAnalyzing ? "show" : ""}`}>
        <div className="jd-analyzing-modal">
          <div className="jd-modal-ring" />
          <div className="jd-modal-title">Matching your resume</div>
          <div className="jd-modal-sub">Running semantic analysis against the job description...</div>
          <div className="jd-modal-steps">
            {ANALYZING_STEPS.map((step, i) => (
              <div className={`jd-modal-step ${stepStatus(i)}`} key={i}>
                <div className="jd-modal-step-dot" />
                <span className="jd-modal-step-text">{step}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* STICKY NAV */}
      <nav className="jd-nav">
        <div className="jd-logo">AI Career <span>Copilot</span></div>
        <div className="jd-nav-center">
          <div className="jd-step-nav active-step">
            <div className="jd-step-num active">1</div>
            <div>
              <div className="step-label" style={{ fontWeight: 700, fontSize: 11 }}>Upload Resume</div>
            </div>
          </div>
          <div className="jd-step-nav active-step">
            <div className="jd-step-num active">2</div>
            <div>
              <div className="step-label" style={{ fontWeight: 700, fontSize: 11 }}>Paste JD</div>
            </div>
          </div>
          <div className="jd-step-nav">
            <div className="jd-step-num">3</div>
            <div>
              <div className="step-label" style={{ fontSize: 11 }}>Get Match Score</div>
            </div>
          </div>
        </div>
        <div className="jd-nav-right">
          <button className="jd-back-btn" onClick={() => onBack ? onBack() : window.history.back()}>← Dashboard</button>
          <div className="jd-plan-pill">🎯 JD Match Analyzer</div>
        </div>
      </nav>

      <div className="jd-main">

        {/* HERO */}
        <div className="jd-hero">
          <div className="jd-eyebrow">
            <div className="jd-eyebrow-dot" />
            Career Intelligence Engine
          </div>
          <div className="jd-hero-title">
            Know your exact chances<br />
            <span className="line2">before you hit Apply.</span>
          </div>
          <div className="jd-hero-sub">
            Upload your resume and paste any job description. Our AI engine semantically
            matches your skills, finds keyword gaps, rewrites your bullets, and tells you
            exactly how to pitch yourself for this role.
          </div>
          <div className="jd-preview-strip">
            {[
              { icon: "🎯", label: "Match Score", sub: "vs this exact JD" },
              { icon: "🔁", label: "Semantic Alignment", sub: "ChromaDB vectors" },
              { icon: "✍️", label: "AI Rewrites", sub: "Per bullet point" },
              { icon: "💬", label: "Talking Points", sub: "For your interview" },
            ].map((item, i) => (
              <div className="jd-preview-item" key={i} style={{ animationDelay: `${0.2 + i * 0.07}s` }}>
                <span className="jd-preview-icon">{item.icon}</span>
                <div>
                  <div className="jd-preview-label">{item.label}</div>
                  <div className="jd-preview-sub">{item.sub}</div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* TWO PANEL INPUT */}
        <div className="jd-panels">

          {/* PANEL 1 — RESUME */}
          <div className="jd-panel panel-resume" style={{ animationDelay: "0.2s" }}>
            <div className="jd-panel-header">
              <div className="jd-panel-title-row">
                <div className="jd-panel-icon">📄</div>
                <div>
                  <div className="jd-panel-title">Your Resume</div>
                  <div className="jd-panel-sub">PDF or DOCX · Max 5MB</div>
                </div>
              </div>
              <div className="jd-panel-badge">{file ? "✓ Uploaded" : "Required"}</div>
            </div>
            <div className="jd-panel-body">
              {!file ? (
                <div
                  className={`jd-drop-zone ${isDragging ? "drag-over" : ""}`}
                  onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
                  onDragLeave={() => setIsDragging(false)}
                  onDrop={handleDrop}
                  onClick={() => fileInputRef.current?.click()}
                >
                  <input ref={fileInputRef} type="file" className="jd-file-input" accept=".pdf,.docx" onChange={(e) => handleFile(e.target.files[0])} onClick={(e) => e.stopPropagation()} />
                  <span className="jd-drop-icon">{isDragging ? "🎯" : "📄"}</span>
                  <div className="jd-drop-title">{isDragging ? "Drop to upload!" : "Drag & drop here"}</div>
                  <div className="jd-drop-sub">or click to browse your files</div>
                  <div className="jd-drop-cta">Browse Files →</div>
                  <div className="jd-drop-formats">
                    <span className="jd-fmt">PDF</span>
                    <span className="jd-fmt">DOCX</span>
                  </div>
                </div>
              ) : (
                <div className="jd-file-selected">
                  <div className="jd-file-ico">📄</div>
                  <div className="jd-file-info">
                    <div className="jd-file-name">{file.name}</div>
                    <div className="jd-file-size">{formatSize(file.size)} · Ready</div>
                  </div>
                  <span className="jd-file-ok">✓</span>
                  <button className="jd-file-rm" onClick={() => setFile(null)}>✕</button>
                </div>
              )}
            </div>
          </div>

          {/* PANEL 2 — JD */}
          <div className="jd-panel panel-jd" style={{ animationDelay: "0.27s" }}>
            <div className="jd-panel-header">
              <div className="jd-panel-title-row">
                <div className="jd-panel-icon">💼</div>
                <div>
                  <div className="jd-panel-title">Job Description</div>
                  <div className="jd-panel-sub">Paste the full JD text below</div>
                </div>
              </div>
              <div className={`jd-panel-badge ${jdText.length >= 100 ? "gold" : ""}`}>
                {jdText.length >= 100 ? "✓ Ready" : "Required"}
              </div>
            </div>
            <div className="jd-panel-body">
              <div className="jd-textarea-wrap">
                <textarea
                  className="jd-textarea"
                  placeholder={`Paste the full job description here...\n\nInclude:\n• Required skills and qualifications\n• Responsibilities and expectations\n• Experience requirements\n\nThe more detail, the more accurate your match score.`}
                  value={jdText}
                  onChange={(e) => setJdText(e.target.value)}
                />
                <div className="jd-textarea-footer">
                  <span className={`jd-char-count ${jdText.length > 0 && jdText.length < 100 ? "warn" : ""}`}>
                    {jdText.length < 100 ? `${100 - jdText.length} more characters needed` : `${jdText.length} characters ✓`}
                  </span>
                  <button className="jd-paste-btn" onClick={handlePaste}>📋 Paste from clipboard</button>
                </div>
                <div className="jd-tips">
                  <div className="jd-tip"><div className="jd-tip-dot" /><span>Copy the full JD from LinkedIn, Naukri, or company site</span></div>
                  <div className="jd-tip"><div className="jd-tip-dot" /><span>Include requirements, responsibilities, and skills sections</span></div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* WHAT YOU GET STRIP */}
        <div className="jd-premium-strip">
          {PREMIUM_FEATURES.map((f, i) => (
            <div className="jd-premium-item" key={i} style={{ animationDelay: `${0.3 + i * 0.06}s` }}>
              <div className="jd-premium-icon">{f.icon}</div>
              <div className="jd-premium-label">{f.label}</div>
              <div className="jd-premium-desc">{f.desc}</div>
            </div>
          ))}
        </div>

        {/* ANALYZE BUTTON */}
        <div className="jd-analyze-section">
          <button
            className="jd-analyze-btn"
            onClick={startAnalysis}
            disabled={!canAnalyze}
          >
            {!file && !jdText ? (
              <><span>⚡</span> Upload resume and paste JD to continue</>
            ) : !file ? (
              <><span>📄</span> Upload your resume to continue</>
            ) : jdText.length < 100 ? (
              <><span>💼</span> Paste more of the job description ({100 - jdText.length} chars needed)</>
            ) : (
              <><span>🎯</span> Run Semantic Match Analysis →</>
            )}
          </button>
          <div className="jd-analyze-sub">
            <div className="jd-analyze-sub-item">🔒 Private & secure</div>
            <div className="jd-analyze-sub-item">⚡ Results in ~30 seconds</div>
            <div className="jd-analyze-sub-item">🇮🇳 Indian market trained</div>
          </div>
        </div>

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