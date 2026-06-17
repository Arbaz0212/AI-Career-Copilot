import { useState, useEffect, useRef, useCallback } from "react";

// ── SCROLL REVEAL HOOK ─────────────────────────────────────────────────────
function useScrollReveal(threshold = 0.15) {
  const [revealed, setRevealed] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setRevealed(true);
          observer.unobserve(el);
        }
      },
      { threshold }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [threshold]);

  return [ref, revealed];
}

// ── STYLES ──────────────────────────────────────────────────────────────────
const styles = `
  @import url('https://fonts.googleapis.com/css2?family=Clash+Display:wght@400;500;600;700&family=Cabinet+Grotesk:wght@300;400;500;600;700&display=swap');

  *, *::before, *::after { margin: 0; padding: 0; box-sizing: border-box; }

  :root {
    --bg: #f5f0e8;
    --ink: #0f0e0a;
    --accent: #e84c1e;
    --accent2: #2d6a4f;
    --muted: #8a8070;
    --card: #ede8df;
    --border: #d4cdc0;
    --gold: #c9922a;
    --white: #ffffff;
  }

  .results-root {
    background: var(--bg);
    color: var(--ink);
    font-family: 'Cabinet Grotesk', sans-serif;
    font-size: 15px;
    line-height: 1.6;
    min-height: 100vh;
    padding: 40px;
    position: relative;
    overflow-x: hidden;
  }

  .results-root::after {
    content: '';
    position: fixed;
    inset: 0;
    background-image: url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)' opacity='0.03'/%3E%3C/svg%3E");
    pointer-events: none;
    z-index: 9999;
    opacity: 0.3;
  }

  .container { max-width: 1180px; margin: 0 auto; }

  /* ── HEADER ── */
  .results-header {
    display: flex; justify-content: space-between; align-items: flex-start;
    margin-bottom: 32px; animation: fadeUp 0.5s ease both;
  }
  .results-tag {
    font-size: 11px; font-weight: 700; letter-spacing: 2px;
    text-transform: uppercase; color: var(--muted); margin-bottom: 8px;
  }
  .results-title {
    font-family: 'Clash Display', sans-serif; font-size: clamp(26px, 3vw, 38px);
    font-weight: 700; letter-spacing: -1px; line-height: 1.1;
  }
  .results-title span { color: var(--accent); }
  .results-sub { font-size: 13px; color: var(--muted); margin-top: 6px; }
  .results-actions { display: flex; gap: 10px; }
  .action-btn {
    display: flex; align-items: center; gap: 8px;
    background: var(--ink); color: var(--bg); border: none;
    padding: 11px 20px; font-family: 'Clash Display', sans-serif;
    font-weight: 600; font-size: 13px; letter-spacing: 0.5px;
    cursor: pointer; transition: background 0.2s, transform 0.15s;
  }
  .action-btn:hover { background: var(--accent); transform: translateY(-1px); }
  .action-btn.outline {
    background: transparent; color: var(--ink); border: 1.5px solid var(--border);
  }
  .action-btn.outline:hover { background: var(--white); border-color: var(--ink); }

  /* ── HERO SCORE ── */
  .hero-score {
    background: var(--ink); padding: 40px 48px;
    display: grid; grid-template-columns: 240px 1fr; gap: 40px; align-items: center;
    margin-bottom: 20px; position: relative; overflow: hidden;
    animation: heroIn 0.7s ease both;
  }
  @keyframes heroIn {
    from { opacity: 0; transform: translateY(24px); }
    to { opacity: 1; transform: translateY(0); }
  }
  .hero-score::before {
    content: ''; position: absolute; top: -150px; right: -120px;
    width: 450px; height: 450px;
    background: radial-gradient(circle, var(--hero-glow-color) 0%, transparent 65%);
    animation: pulseGlow 4s ease-in-out infinite;
    opacity: 0.9;
  }
  .hero-score::after {
    content: ''; position: absolute; bottom: -80px; left: -60px;
    width: 250px; height: 250px;
    background: radial-gradient(circle, rgba(255,255,255,0.04) 0%, transparent 60%);
  }
  @keyframes pulseGlow { 0%,100% { opacity: 0.6; transform: scale(1); } 50% { opacity: 1; transform: scale(1.08); } }

  .hero-ring-wrap { display: flex; justify-content: center; position: relative; z-index: 1; }
  .hero-ring { width: 220px; height: 220px; position: relative; }
  .hero-ring svg { transform: rotate(-135deg); }
  .hero-ring circle { fill: none; }
  .ring-track { stroke: #1c1c1c; stroke-width: 10; }
  .ring-progress {
    stroke-linecap: round;
    transition: stroke-dashoffset 1.8s cubic-bezier(0.16, 1, 0.3, 1);
    filter: drop-shadow(0 0 12px var(--hero-glow-color));
    stroke-width: 10;
  }
  .hero-ring-content {
    position: absolute; inset: 0; display: flex; flex-direction: column;
    align-items: center; justify-content: center;
  }
  .hero-score-num {
    font-family: 'Clash Display', sans-serif; font-weight: 700;
    font-size: 60px; color: var(--bg); line-height: 1;
    font-variant-numeric: tabular-nums;
    text-shadow: 0 0 30px var(--hero-glow-color);
  }
  .hero-score-max { font-size: 13px; color: #555; margin-top: 2px; }
  .hero-score-grade {
    margin-top: 8px; font-family: 'Clash Display', sans-serif;
    font-weight: 700; font-size: 13px; letter-spacing: 1px;
    text-transform: uppercase; padding: 4px 16px;
    animation: gradeReveal 0.6s ease 1.6s both;
  }
  @keyframes gradeReveal { from { opacity: 0; transform: scale(0.8); } to { opacity: 1; transform: scale(1); } }
  .grade-good { background: rgba(45,106,79,0.2); color: #4ade80; }
  .grade-mid { background: rgba(201,146,42,0.2); color: var(--gold); }
  .grade-low { background: rgba(232,76,30,0.2); color: var(--accent); }

  .hero-text { position: relative; z-index: 1; }
  .hero-verdict {
    font-family: 'Clash Display', sans-serif; font-weight: 700;
    font-size: 26px; color: var(--bg); margin-bottom: 8px; letter-spacing: -0.5px;
    animation: fadeUp 0.5s ease 0.3s both;
  }
  .hero-summary {
    font-size: 14px; color: #999; line-height: 1.7; max-width: 580px;
    animation: fadeUp 0.5s ease 0.4s both;
  }
  .hero-meta-row { display: flex; gap: 28px; margin-top: 18px; animation: fadeUp 0.5s ease 0.5s both; flex-wrap: wrap; }
  .hero-meta-item { display: flex; flex-direction: column; gap: 2px; }
  .hero-meta-label { font-size: 10px; letter-spacing: 1.5px; text-transform: uppercase; color: #444; }
  .hero-meta-value { font-family: 'Clash Display', sans-serif; font-weight: 700; font-size: 16px; color: var(--bg); }
  .hero-meta-value.green { color: #4ade80; }
  .hero-meta-value.gold { color: var(--gold); }
  .hero-meta-value.accent { color: var(--accent); }

  /* ── PEER COMPARISON STRIP ── */
  .peer-strip {
    display: grid; grid-template-columns: 1fr 1fr 1fr;
    gap: 1px; background: var(--border); border: 1px solid var(--border);
    margin-bottom: 24px; animation: fadeUp 0.6s ease 0.35s both;
  }
  .peer-item {
    background: var(--white); padding: 20px 24px;
    display: flex; flex-direction: column; align-items: center; text-align: center;
  }
  .peer-label { font-size: 10px; font-weight: 700; letter-spacing: 1.5px; text-transform: uppercase; color: var(--muted); margin-bottom: 6px; }
  .peer-value {
    font-family: 'Clash Display', sans-serif; font-weight: 700; font-size: 20px;
    font-variant-numeric: tabular-nums;
  }
  .peer-sub { font-size: 12px; color: var(--muted); margin-top: 4px; }

  /* ── GRADE SCALE ── */
  .grade-scale {
    display: flex; gap: 4px; margin-top: 18px; animation: fadeUp 0.6s ease 0.45s both;
  }
  .grade-tier {
    flex: 1; text-align: center; padding: 8px 4px;
    font-size: 10px; font-weight: 700; letter-spacing: 0.5px;
    color: rgba(255,255,255,0.5); position: relative;
  }
  .grade-tier.active { color: var(--bg); transform: scale(1.05); }
  .grade-tier.active::after {
    content: ''; position: absolute; bottom: -2px; left: 10%; right: 10%;
    height: 2px; background: var(--bg);
  }
  .grade-tier .grade-letter { font-family: 'Clash Display', sans-serif; font-size: 15px; display: block; }
  .grade-tier .grade-range { font-size: 9px; opacity: 0.6; }

  /* ── ATS PREVIEW BAR ── */
  .ats-bar {
    display: grid; grid-template-columns: 1fr auto auto;
    gap: 0; background: var(--border); border: 1px solid var(--border);
    margin-bottom: 24px; animation: fadeUp 0.6s ease 0.4s both;
  }
  .ats-main { background: var(--white); padding: 18px 24px; }
  .ats-label { font-size: 10px; font-weight: 700; letter-spacing: 1.5px; text-transform: uppercase; color: var(--muted); margin-bottom: 8px; }
  .ats-word-bar {
    display: flex; align-items: center; gap: 12px;
  }
  .ats-word-count { font-family: 'Clash Display', sans-serif; font-weight: 700; font-size: 20px; }
  .ats-word-track {
    flex: 1; height: 6px; background: var(--card); border-radius: 999px;
    position: relative; overflow: hidden; max-width: 200px;
  }
  .ats-word-fill {
    height: 100%; border-radius: 999px;
    transition: width 1.2s cubic-bezier(0.16, 1, 0.3, 1);
  }
  .ats-word-range { font-size: 11px; color: var(--muted); }
  .ats-pill {
    display: inline-flex; align-items: center; gap: 6px;
    background: var(--bg); border-left: 1px solid var(--border);
    padding: 18px 24px; font-size: 12px; font-weight: 600;
  }
  .ats-pill-icon { font-size: 14px; }
  .ats-pill-label { font-size: 10px; color: var(--muted); letter-spacing: 0.5px; }
  .ats-pill-value { font-family: 'Clash Display', sans-serif; font-size: 16px; font-weight: 700; }
  .ats-section-grid {
    display: flex; flex-wrap: wrap; gap: 4px; margin-top: 8px;
  }
  .ats-section-pill {
    font-size: 10px; font-weight: 600; padding: 3px 10px;
    border: 1px solid var(--border); border-radius: 999px;
  }
  .ats-section-pill.found { background: rgba(45,106,79,0.08); border-color: rgba(45,106,79,0.25); color: var(--accent2); }
  .ats-section-pill.missing { background: rgba(232,76,30,0.08); border-color: rgba(232,76,30,0.25); color: var(--accent); }

  /* ── SECTION BREAKDOWN ── */
  .sec-breakdown { display: flex; flex-direction: column; gap: 1px; background: var(--border); border: 1px solid var(--border); }
  .sec-row {
    background: var(--white); padding: 18px 22px;
    display: grid; grid-template-columns: 130px 1fr 70px;
    gap: 16px; align-items: center; cursor: pointer;
    transition: background 0.15s;
  }
  .sec-row:hover { background: var(--card); }
  .sec-name { font-family: 'Clash Display', sans-serif; font-weight: 700; font-size: 14px; }
  .sec-bar-track { height: 8px; background: var(--card); border-radius: 999px; position: relative; overflow: hidden; }
  .sec-bar-fill {
    height: 100%; border-radius: 999px;
    transition: width 1.2s cubic-bezier(0.16, 1, 0.3, 1);
  }
  .sec-score { font-family: 'Clash Display', sans-serif; font-weight: 700; font-size: 15px; text-align: right; }
  .sec-detail {
    grid-column: 1 / -1; padding: 0 22px 18px;
    font-size: 13px; color: var(--muted); line-height: 1.6;
    display: none;
  }
  .sec-row.expanded + .sec-detail { display: block; }

  /* ── DIMENSION CARDS ── */
  .dims-grid {
    display: grid; grid-template-columns: repeat(5, 1fr); gap: 16px;
  }
  .dim-card {
    background: var(--white); border: 1px solid var(--border);
    padding: 22px 16px; display: flex; flex-direction: column; align-items: center;
    text-align: center; animation: fadeUp 0.5s ease both;
    transition: transform 0.2s, box-shadow 0.2s;
    position: relative;
  }
  .dim-card:hover { transform: translateY(-3px); box-shadow: 6px 6px 0 var(--border); }
  .dim-ring { width: 84px; height: 84px; position: relative; margin-bottom: 12px; }
  .dim-ring svg { transform: rotate(-90deg); }
  .dim-ring circle { fill: none; stroke-width: 7; }
  .dim-ring-track { stroke: var(--card); }
  .dim-ring-progress {
    stroke-linecap: round;
    transition: stroke-dashoffset 1.4s cubic-bezier(0.16, 1, 0.3, 1);
  }
  .dim-ring-content {
    position: absolute; inset: 0; display: flex; align-items: center; justify-content: center;
    font-family: 'Clash Display', sans-serif; font-weight: 700; font-size: 18px;
    font-variant-numeric: tabular-nums;
  }
  .dim-mini-bar {
    width: 100%; height: 4px; background: var(--card); border-radius: 999px;
    margin-top: 10px; overflow: hidden;
  }
  .dim-mini-fill {
    height: 100%; border-radius: 999px;
    transition: width 1s cubic-bezier(0.16, 1, 0.3, 1);
  }
  .dim-label { font-size: 12px; font-weight: 700; line-height: 1.3; margin-top: 6px; }
  .dim-status { font-size: 10px; color: var(--muted); margin-top: 3px; letter-spacing: 0.5px; text-transform: uppercase; }

  /* ── DIM TOOLTIP ── */
  .dim-tooltip {
    position: absolute; bottom: calc(100% + 8px); left: 50%; transform: translateX(-50%);
    background: var(--ink); color: var(--bg); padding: 12px 16px;
    font-size: 12px; line-height: 1.6; white-space: nowrap;
    opacity: 0; pointer-events: none; transition: opacity 0.2s, transform 0.2s;
    transform: translateX(-50%) translateY(4px);
    z-index: 10; min-width: 180px;
  }
  .dim-card:hover .dim-tooltip { opacity: 1; transform: translateX(-50%) translateY(0); }
  .dim-tooltip-item { display: flex; justify-content: space-between; gap: 16px; }
  .dim-tooltip-label { color: #777; }
  .dim-tooltip-value { font-weight: 700; }

  /* ── TWO COLUMN: STRENGTHS / ISSUES ── */
  .two-col { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; margin-bottom: 28px; }
  .panel {
    background: var(--white); border: 1px solid var(--border); padding: 26px;
    animation: fadeUp 0.5s ease both;
  }
  .panel-head { display: flex; align-items: center; gap: 10px; margin-bottom: 18px; }
  .panel-icon {
    width: 36px; height: 36px; display: flex; align-items: center; justify-content: center;
    font-size: 17px; border: 1px solid var(--border); flex-shrink: 0;
  }
  .panel-icon.green { background: rgba(45,106,79,0.08); border-color: rgba(45,106,79,0.25); }
  .panel-icon.red { background: rgba(232,76,30,0.08); border-color: rgba(232,76,30,0.25); }
  .panel-title { font-family: 'Clash Display', sans-serif; font-weight: 700; font-size: 16px; }
  .panel-list { display: flex; flex-direction: column; gap: 10px; }
  .panel-item {
    display: flex; gap: 10px; align-items: flex-start; font-size: 13px;
    padding: 11px 14px; background: var(--bg); border-left: 3px solid transparent;
    transition: transform 0.15s, background 0.15s;
  }
  .panel-item:hover { transform: translateX(3px); background: var(--card); }
  .panel-item.green-item { border-left-color: var(--accent2); }
  .panel-item.red-item { border-left-color: var(--accent); }
  .panel-item-icon { flex-shrink: 0; margin-top: 1px; }

  /* ── SKILLS MAPPING ── */
  .skills-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 16px; margin-bottom: 28px; }
  .skill-col {
    background: var(--white); border: 1px solid var(--border); padding: 22px;
    animation: fadeUp 0.5s ease both;
  }
  .skill-col-head { display: flex; align-items: center; justify-content: space-between; margin-bottom: 14px; }
  .skill-col-title { font-family: 'Clash Display', sans-serif; font-weight: 700; font-size: 14px; }
  .skill-col-count {
    font-family: 'Clash Display', sans-serif; font-weight: 700; font-size: 20px;
  }
  .skill-tags { display: flex; flex-wrap: wrap; gap: 6px; }
  .skill-tag {
    font-size: 11px; font-weight: 600; padding: 5px 10px;
    border: 1px solid var(--border); background: var(--bg);
    animation: tagPop 0.4s ease both;
  }
  @keyframes tagPop { from { opacity: 0; transform: scale(0.85); } to { opacity: 1; transform: scale(1); } }
  .skill-tag.exact { background: rgba(45,106,79,0.08); border-color: rgba(45,106,79,0.25); color: var(--accent2); }
  .skill-tag.semantic { background: rgba(201,146,42,0.08); border-color: rgba(201,146,42,0.25); color: var(--gold); }
  .skill-tag.semantic .arrow { opacity: 0.5; margin: 0 3px; }
  .skill-tag.missing { background: rgba(232,76,30,0.08); border-color: rgba(232,76,30,0.25); color: var(--accent); }
  .skill-empty { font-size: 12px; color: var(--muted); padding: 8px 0; }

  /* ── KEYWORD CLOUD ── */
  .kw-cloud {
    display: flex; flex-wrap: wrap; gap: 8px; align-items: center;
    padding: 20px; background: var(--white); border: 1px solid var(--border);
  }
  .kw-tag {
    font-weight: 600; border: 1px solid var(--border); background: var(--bg);
    animation: tagPop 0.4s ease both;
    transition: transform 0.15s;
    display: inline-flex; align-items: center; gap: 4px;
  }
  .kw-tag:hover { transform: scale(1.05); }
  .kw-tag-count { font-size: 9px; color: var(--muted); font-weight: 400; }
  .kw-tag.warn { background: rgba(232,76,30,0.06); border-color: rgba(232,76,30,0.2); color: var(--accent); }
  .kw-stats { display: flex; gap: 20px; margin-bottom: 16px; font-size: 13px; color: var(--muted); }
  .kw-stat-num { font-family: 'Clash Display', sans-serif; font-weight: 700; font-size: 18px; color: var(--ink); }

  /* ── SECTION BLOCK HEADERS ── */
  .section-block { margin-bottom: 32px; }
  .section-block-head {
    display: flex; justify-content: space-between; align-items: baseline;
    margin-bottom: 16px; flex-wrap: wrap; gap: 4px;
  }
  .section-block-title {
    font-family: 'Clash Display', sans-serif; font-weight: 700;
    font-size: 20px; letter-spacing: -0.5px; color: var(--ink);
  }
  .section-block-title.rewrites-heading {
    font-size: 24px; letter-spacing: -0.8px;
    background: linear-gradient(135deg, var(--ink), var(--accent2));
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
    background-clip: text;
  }
  .section-block-title.recs-heading {
    font-size: 24px; letter-spacing: -0.8px;
    background: linear-gradient(135deg, var(--ink), var(--accent));
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
    background-clip: text;
  }
  .section-block-sub {
    font-size: 12px; color: var(--muted);
    font-weight: 500; letter-spacing: 0.3px;
  }

  /* ── SCROLL REVEAL ── */
  .scroll-reveal {
    opacity: 0; transform: translateY(28px);
    transition: opacity 0.7s cubic-bezier(0.16, 1, 0.3, 1),
                transform 0.7s cubic-bezier(0.16, 1, 0.3, 1);
  }
  .scroll-reveal.revealed {
    opacity: 1; transform: translateY(0);
  }
  .scroll-reveal-stagger > * {
    opacity: 0; transform: translateY(24px);
    transition: opacity 0.6s cubic-bezier(0.16, 1, 0.3, 1),
                transform 0.6s cubic-bezier(0.16, 1, 0.3, 1);
  }
  .scroll-reveal-stagger.revealed > *:nth-child(1) { opacity: 1; transform: translateY(0); transition-delay: 0.05s; }
  .scroll-reveal-stagger.revealed > *:nth-child(2) { opacity: 1; transform: translateY(0); transition-delay: 0.1s; }
  .scroll-reveal-stagger.revealed > *:nth-child(3) { opacity: 1; transform: translateY(0); transition-delay: 0.15s; }
  .scroll-reveal-stagger.revealed > *:nth-child(4) { opacity: 1; transform: translateY(0); transition-delay: 0.2s; }
  .scroll-reveal-stagger.revealed > *:nth-child(5) { opacity: 1; transform: translateY(0); transition-delay: 0.25s; }
  .scroll-reveal-stagger.revealed > *:nth-child(6) { opacity: 1; transform: translateY(0); transition-delay: 0.3s; }

  /* ── BULLET REWRITES ── Premium ── */
  .rewrite-card {
    background: var(--white); border: 1px solid var(--border);
    margin-bottom: 22px; overflow: hidden; position: relative;
    animation: rewriteCardIn 0.6s ease both;
    box-shadow: 0 1px 3px rgba(0,0,0,0.04);
    transition: box-shadow 0.3s, transform 0.3s;
  }
  .rewrite-card:hover { box-shadow: 0 8px 30px rgba(0,0,0,0.07); transform: translateY(-2px); }
  @keyframes rewriteCardIn {
    from { opacity: 0; transform: translateY(24px) scale(0.97); }
    to { opacity: 1; transform: translateY(0) scale(1); }
  }
  .rewrite-card::before {
    content: ''; position: absolute; top: 0; left: 0; right: 0; height: 3px;
    background: linear-gradient(90deg, var(--accent2), #40916c, var(--accent2));
    z-index: 1;
  }
  .rewrite-body { padding: 26px 24px 22px; }
  .rewrite-row {
    display: grid; grid-template-columns: 1fr 36px 1fr; gap: 0;
    align-items: center; margin-bottom: 14px;
  }
  .rewrite-row:last-child { margin-bottom: 0; }
  .rewrite-label {
    font-size: 10px; font-weight: 700; letter-spacing: 2px; text-transform: uppercase;
    margin-bottom: 8px; display: flex; align-items: center; gap: 6px;
  }
  .rewrite-label.before { color: #b07a6a; }
  .rewrite-label.after { color: var(--accent2); }
  .rewrite-text {
    font-size: 15px; line-height: 1.75; padding: 16px 20px;
    border-radius: 6px; position: relative;
    transition: transform 0.2s, box-shadow 0.2s;
  }
  .rewrite-text:hover { transform: translateX(2px); }
  .rewrite-text.before-text {
    background: linear-gradient(135deg, #fdf5f2 0%, #faf0eb 100%);
    color: #8a7a72; border: 1px solid rgba(232,76,30,0.12);
    font-style: italic; text-decoration: line-through;
    text-decoration-color: rgba(232,76,30,0.25);
    text-decoration-thickness: 1px;
  }
  .rewrite-text.after-text {
    background: linear-gradient(135deg, #f3f8f5 0%, #edf5ef 100%);
    color: var(--ink); font-weight: 700; font-size: 15px;
    border: 1px solid rgba(45,106,79,0.2);
    box-shadow: 0 2px 8px rgba(45,106,79,0.06);
  }
  .rewrite-text.after-text::before {
    content: ''; position: absolute; top: 0; left: 0; bottom: 0; width: 3px;
    background: var(--accent2); border-radius: 3px 0 0 3px;
    box-shadow: 0 0 8px rgba(45,106,79,0.3);
  }
  .rewrite-arrow {
    display: flex; flex-direction: column; align-items: center;
    padding: 0 8px; margin-top: 20px;
    animation: arrowPulse 2s ease-in-out infinite;
  }
  @keyframes arrowPulse {
    0%, 100% { opacity: 0.4; transform: translateY(0); }
    50% { opacity: 0.8; transform: translateY(2px); }
  }
  .rewrite-arrow-line {
    width: 1.5px; height: 18px; background: linear-gradient(180deg, rgba(232,76,30,0.3), rgba(45,106,79,0.3));
  }
  .rewrite-arrow-head {
    width: 0; height: 0; border-left: 6px solid transparent;
    border-right: 6px solid transparent; border-top: 6px solid rgba(45,106,79,0.4);
    margin-top: -1px;
  }
  .rewrite-why {
    font-size: 13px; color: var(--muted); line-height: 1.7;
    margin-top: 14px; padding: 14px 18px;
    background: linear-gradient(135deg, #f8f6f2 0%, #f4f1ec 100%);
    border-radius: 6px; display: flex; gap: 10px; align-items: flex-start;
    border: 1px solid var(--border);
  }
  .rewrite-why-icon {
    flex-shrink: 0; width: 26px; height: 26px; display: flex;
    align-items: center; justify-content: center;
    background: var(--accent2); color: #fff; border-radius: 50%;
    font-size: 12px; margin-top: 1px;
  }

  /* ── RECOMMENDATIONS ── Premium ── */
  .rec-list { display: flex; flex-direction: column; gap: 10px; }
  .rec-item {
    display: flex; gap: 16px; align-items: flex-start;
    background: var(--white); border: 1px solid var(--border);
    padding: 18px 22px;
    animation: recItemIn 0.5s ease both;
    transition: transform 0.25s, box-shadow 0.3s, border-color 0.25s;
    position: relative; overflow: hidden;
  }
  @keyframes recItemIn {
    from { opacity: 0; transform: translateX(-12px); }
    to { opacity: 1; transform: translateX(0); }
  }
  .rec-item:hover { transform: translateX(5px); box-shadow: 8px 8px 0 rgba(0,0,0,0.04); border-color: var(--ink); }
  .rec-item::before {
    content: ''; position: absolute; top: 0; left: 0; bottom: 0; width: 3px;
    transition: width 0.25s;
  }
  .rec-item:hover::before { width: 4px; }
  .rec-item.critical::before { background: var(--accent); box-shadow: 0 0 8px rgba(232,76,30,0.3); }
  .rec-item.high::before { background: var(--accent); opacity: 0.6; }
  .rec-item.medium::before { background: var(--gold); }
  .rec-item.low::before { background: var(--accent2); }
  .rec-icon {
    flex-shrink: 0; width: 28px; height: 28px; display: flex;
    align-items: center; justify-content: center; border-radius: 6px;
    font-size: 13px; margin-top: 2px;
  }
  .rec-icon.critical { background: rgba(232,76,30,0.1); }
  .rec-icon.high { background: rgba(232,76,30,0.08); }
  .rec-icon.medium { background: rgba(201,146,42,0.1); }
  .rec-icon.low { background: rgba(45,106,79,0.08); }
  .rec-content { font-size: 13px; line-height: 1.65; flex: 1; min-width: 0; }
  .rec-category {
    font-weight: 700; font-size: 14px; margin-bottom: 4px;
    display: flex; align-items: center; gap: 6px;
  }
  .rec-category-text { }
  .rec-category-boost {
    font-size: 10px; font-weight: 700; letter-spacing: 0.3px;
    padding: 2px 8px; border-radius: 999px;
    background: var(--accent); color: #fff;
  }
  .rec-action { color: var(--ink); }
  .rec-effort {
    flex-shrink: 0; font-size: 10px; font-weight: 700; padding: 4px 12px;
    white-space: nowrap; letter-spacing: 0.5px; border-radius: 999px;
    margin-top: 1px;
  }
  .rec-effort.quick { background: rgba(45,106,79,0.1); color: var(--accent2); border: 1px solid rgba(45,106,79,0.2); }
  .rec-effort.medium { background: rgba(201,146,42,0.1); color: var(--gold); border: 1px solid rgba(201,146,42,0.2); }
  .rec-effort.long { background: rgba(232,76,30,0.1); color: var(--accent); border: 1px solid rgba(232,76,30,0.2); }

  /* ── INTERVIEW TALKING POINTS ── */
  .talking-points { display: flex; flex-direction: column; gap: 10px; }
  .talking-point {
    display: flex; gap: 14px; align-items: flex-start;
    background: var(--ink); padding: 16px 20px; animation: fadeUp 0.5s ease both;
  }
  .talking-num {
    font-family: 'Clash Display', sans-serif; font-weight: 700; font-size: 18px;
    color: var(--accent); flex-shrink: 0; width: 24px;
  }
  .talking-text { font-size: 13px; color: #ccc; line-height: 1.7; }

  /* ── WEEK 1 ACTION ── */
  .action-banner {
    background: linear-gradient(135deg, var(--accent) 0%, #c93d14 100%);
    padding: 28px 32px; display: flex; align-items: center; gap: 20px;
    margin-bottom: 28px; animation: fadeUp 0.5s ease both;
    position: relative; overflow: hidden;
  }
  .action-banner::before {
    content: ''; position: absolute; top: -50%; right: -10%;
    width: 200px; height: 200px; border-radius: 50%;
    background: rgba(255,255,255,0.08);
  }
  .action-banner-icon { font-size: 36px; flex-shrink: 0; position: relative; z-index: 1; }
  .action-banner-content { position: relative; z-index: 1; }
  .action-banner-label {
    font-size: 10px; font-weight: 700; letter-spacing: 2px; text-transform: uppercase;
    color: rgba(255,255,255,0.7); margin-bottom: 4px;
  }
  .action-banner-text { font-size: 15px; font-weight: 600; color: #fff; line-height: 1.5; }

  /* ── SKELETON LOADER ── */
  @keyframes shimmer { 0% { background-position: -200% 0; } 100% { background-position: 200% 0; } }
  .skeleton {
    background: linear-gradient(90deg, var(--card) 25%, #f8f4ed 50%, var(--card) 75%);
    background-size: 200% 100%;
    animation: shimmer 1.5s ease-in-out infinite;
  }
  .skel-hero { height: 280px; margin-bottom: 28px; }
  .skel-dims { display: grid; grid-template-columns: repeat(5,1fr); gap: 16px; margin-bottom: 28px; }
  .skel-dim { height: 160px; }
  .skel-two { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; margin-bottom: 28px; }
  .skel-panel { height: 220px; }
  .skel-title { width: 240px; height: 28px; margin-bottom: 18px; }

  .skeleton-wrap { animation: fadeIn 0.3s ease both; }
  @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }

  .loading-status {
    text-align: center; padding: 20px; font-family: 'Clash Display', sans-serif;
    font-weight: 700; font-size: 14px; color: var(--muted);
    display: flex; align-items: center; justify-content: center; gap: 10px;
  }
  .loading-dot {
    width: 8px; height: 8px; background: var(--accent); border-radius: 50%;
    animation: loadingPulse 1.4s ease-in-out infinite;
  }
  .loading-dot:nth-child(2) { animation-delay: 0.2s; }
  .loading-dot:nth-child(3) { animation-delay: 0.4s; }
  @keyframes loadingPulse { 0%,80%,100% { opacity: 0.2; transform: scale(0.8); } 40% { opacity: 1; transform: scale(1.2); } }

  /* ── CONFETTI ── */
  .confetti-layer {
    position: fixed; inset: 0; pointer-events: none; z-index: 2000; overflow: hidden;
  }
  .confetti-piece {
    position: absolute; top: -20px; opacity: 0;
    animation: confettiFall linear forwards;
  }
  @keyframes confettiFall {
    0% { opacity: 1; transform: translateY(0) rotate(0deg) translateX(0); }
    100% { opacity: 0; transform: translateY(110vh) rotate(720deg) translateX(var(--drift)); }
  }

  /* ── SCORE CHANGE INDICATOR ── */
  .score-change {
    display: inline-flex; align-items: center; gap: 4px;
    font-family: 'Clash Display', sans-serif; font-weight: 700; font-size: 13px;
    padding: 3px 10px; margin-left: 8px;
    animation: changePop 0.5s ease 2s both;
  }
  @keyframes changePop { from { opacity: 0; transform: scale(0.5); } to { opacity: 1; transform: scale(1); } }
  .score-change.up { background: rgba(45,106,79,0.15); color: #4ade80; }
  .score-change.down { background: rgba(232,76,30,0.15); color: var(--accent); }

  /* ── ANIMATIONS ── */
  @keyframes fadeUp { from { opacity: 0; transform: translateY(18px); } to { opacity: 1; transform: translateY(0); } }

  @media (max-width: 1100px) {
    .dims-grid { grid-template-columns: repeat(3,1fr); }
    .skills-grid { grid-template-columns: 1fr !important; }
    .skel-dims { grid-template-columns: repeat(3,1fr); }
    .peer-strip { grid-template-columns: 1fr 1fr; }
    .ats-bar { grid-template-columns: 1fr; }
    .ats-pill { border-left: none; border-top: 1px solid var(--border); }
  }
  @media (max-width: 760px) {
    .results-root { padding: 14px; }
    .results-header { flex-direction: column; gap: 14px; }
    .results-header .results-actions { width: 100%; }
    .results-actions .action-btn { flex: 1; justify-content: center; }
    .hero-score { grid-template-columns: 1fr; text-align: center; padding: 24px 16px; gap: 20px; }
    .hero-ring-wrap { justify-content: center; }
    .hero-ring { width: 180px; height: 180px; }
    .hero-text .hero-verdict { font-size: 20px; }
    .hero-text .hero-summary { font-size: 13px; }
    .hero-meta-row { justify-content: center; gap: 18px; }
    .hero-score-num { font-size: 48px; }
    .two-col { grid-template-columns: 1fr; }
    .dims-grid, .skel-dims { grid-template-columns: repeat(2,1fr); }
    .peer-strip { grid-template-columns: 1fr; }
    .sec-row { grid-template-columns: 1fr auto; gap: 10px; padding: 14px 16px; }
    .skills-grid { grid-template-columns: 1fr !important; }
    .skill-col { padding: 16px; }
    .ats-bar .ats-main { padding: 14px 16px; }
    .ats-word-count { font-size: 16px; }
    .ats-pill { padding: 14px 16px; }
    .panel { padding: 18px; }
    .kw-cloud { padding: 14px; }
    .kw-tag { font-size: 12px !important; padding: 4px 10px !important; }
    .grade-scale { flex-wrap: wrap; gap: 3px; }
    .grade-tier { min-width: 30px; padding: 6px 2px; }
    .grade-tier .grade-letter { font-size: 12px; }
    .grade-tier .grade-range { font-size: 8px; }
    .rec-item { flex-direction: column; gap: 10px; padding: 14px 16px; }
    .rec-icon { margin-top: 0; align-self: flex-start; }
    .rec-effort { align-self: flex-start; }
    .rewrite-body { padding: 18px 16px; }
    .rewrite-row { grid-template-columns: 1fr !important; gap: 10px !important; }
    .rewrite-arrow { display: none !important; }
    .rewrite-text { font-size: 14px; padding: 12px 16px; }
    .rewrite-why { flex-direction: column; padding: 12px 14px; }
    .rewrite-why-icon { margin-top: 0; }
    .talking-point { padding: 14px 16px; }
    .section-block { margin-bottom: 22px; }
    .section-block-title { font-size: 18px; }
    .section-block-title.rewrites-heading { font-size: 20px; }
    .section-block-title.recs-heading { font-size: 20px; }
    .action-banner { flex-direction: column; text-align: center; padding: 20px 18px; gap: 12px; }
    .action-banner-icon { font-size: 28px; }
    .kw-stats { flex-wrap: wrap; gap: 12px; }
    .sec-breakdown .sec-detail { padding: 0 16px 14px; font-size: 12px; }
  }
  @media (max-width: 480px) {
    .dims-grid, .skel-dims { grid-template-columns: repeat(2,1fr); gap: 10px; }
    .dim-card { padding: 16px 12px; }
    .dim-ring { width: 68px; height: 68px; }
    .results-root { padding: 10px; }
    .hero-score { padding: 18px 12px; }
    .peer-item { padding: 14px 16px; }
    .rec-item { padding: 12px 14px; }
    .skill-tag { font-size: 10px; padding: 4px 8px; }
    .why-card { flex-direction: column; text-align: center; padding: 18px; }
    .why-icon { margin: 0 auto; }
  }
`;

// ── CIRCULAR PROGRESS COMPONENT ───────────────────────────────────────────────
function CircularProgress({ value, size, strokeWidth, color, trackClass, delay = 0 }) {
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const [offset, setOffset] = useState(circumference);

  useEffect(() => {
    const timer = setTimeout(() => {
      setOffset(circumference - (value / 100) * circumference);
    }, delay);
    return () => clearTimeout(timer);
  }, [value, circumference, delay]);

  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
      <circle className={trackClass} cx={size / 2} cy={size / 2} r={radius} />
      <circle
        cx={size / 2}
        cy={size / 2}
        r={radius}
        style={{ stroke: color, strokeDasharray: circumference, strokeDashoffset: offset }}
        className={trackClass.includes("dim") ? "dim-ring-progress" : "ring-progress"}
      />
    </svg>
  );
}

// ── ARC RING (270° speedometer style) ─────────────────────────────────────────
function ArcRing({ value, size, strokeWidth, color, delay = 0 }) {
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  // 270° arc = 3/4 of full circle
  const arcLength = circumference * 0.75;
  // Start at -135° (top-right) and sweep 270° clockwise
  // The SVG is rotated -135deg via CSS, so we use the full arc length
  const [offset, setOffset] = useState(arcLength);

  useEffect(() => {
    const timer = setTimeout(() => {
      const progress = arcLength - (value / 100) * arcLength;
      setOffset(progress);
    }, delay);
    return () => clearTimeout(timer);
  }, [value, arcLength, delay]);

  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
      {/* Background arc (full circle, but clipped via stroke-dasharray) */}
      <circle
        cx={size / 2} cy={size / 2} r={radius}
        fill="none" stroke="#1c1c1c" strokeWidth={strokeWidth}
        strokeDasharray={`${arcLength} ${circumference - arcLength}`}
        strokeLinecap="round"
      />
      {/* Progress arc */}
      <circle
        cx={size / 2} cy={size / 2} r={radius}
        fill="none" stroke={color} strokeWidth={strokeWidth}
        strokeDasharray={`${arcLength} ${circumference - arcLength}`}
        strokeDashoffset={offset}
        strokeLinecap="round"
        style={{
          transition: `stroke-dashoffset 1.8s cubic-bezier(0.16, 1, 0.3, 1)`,
          filter: `drop-shadow(0 0 12px ${color})`,
        }}
      />
    </svg>
  );
}

// ── COUNT UP HOOK ──────────────────────────────────────────────────────────────
function useCountUp(target, duration = 1600, delay = 0) {
  const [count, setCount] = useState(0);
  useEffect(() => {
    let raf;
    const startTimer = setTimeout(() => {
      const start = performance.now();
      const step = (now) => {
        const progress = Math.min((now - start) / duration, 1);
        const eased = 1 - Math.pow(1 - progress, 3);
        setCount(Math.round(eased * target));
        if (progress < 1) raf = requestAnimationFrame(step);
      };
      raf = requestAnimationFrame(step);
    }, delay);
    return () => { clearTimeout(startTimer); if (raf) cancelAnimationFrame(raf); };
  }, [target, duration, delay]);
  return count;
}

// ── CONFETTI COMPONENT ───────────────────────────────────────────────────────
function Confetti({ trigger, score }) {
  const [pieces, setPieces] = useState([]);

  useEffect(() => {
    if (!trigger) return;
    const colors = ["#e84c1e", "#c9922a", "#2d6a4f", "#f5f0e8", "#0f0e0a"];
    // Gold for 95%+, more pieces for higher scores
    if (score >= 95) colors.unshift("#ffd700", "#ffec8b");
    const count = score >= 85 ? 120 : score >= 70 ? 80 : 60;
    const shapes = ["circle", "square", "star", "triangle"];
    const newPieces = Array.from({ length: count }, (_, i) => {
      const shape = shapes[Math.floor(Math.random() * shapes.length)];
      let borderRadius, clipPath;
      if (shape === "circle") borderRadius = "50%";
      else if (shape === "square") borderRadius = "2px";
      else if (shape === "star") clipPath = "polygon(50% 0%, 61% 35%, 98% 35%, 68% 57%, 79% 91%, 50% 70%, 21% 91%, 32% 57%, 2% 35%, 39% 35%)";
      else borderRadius = "0";
      return {
        id: i,
        left: Math.random() * 100,
        delay: Math.random() * 0.6,
        duration: 2.5 + Math.random() * 1.5,
        size: 6 + Math.random() * 10,
        color: colors[Math.floor(Math.random() * colors.length)],
        drift: (Math.random() - 0.5) * 220,
        borderRadius,
        clipPath,
        willChange: "transform, opacity",
      };
    });
    setPieces(newPieces);
    const clear = setTimeout(() => setPieces([]), 4500);
    return () => clearTimeout(clear);
  }, [trigger, score]);

  if (pieces.length === 0) return null;

  return (
    <div className="confetti-layer">
      {pieces.map((p) => (
        <div
          key={p.id}
          className="confetti-piece"
          style={{
            left: `${p.left}%`,
            width: p.size,
            height: p.size,
            background: p.clipPath ? "transparent" : p.color,
            borderRadius: p.borderRadius || undefined,
            clipPath: p.clipPath || undefined,
            backgroundColor: p.clipPath ? p.color : undefined,
            animationDuration: `${p.duration}s`,
            animationDelay: `${p.delay}s`,
            "--drift": `${p.drift}px`,
            willChange: p.willChange,
          }}
        />
      ))}
    </div>
  );
}

// ── SKELETON LOADER ───────────────────────────────────────────────────────────
function SkeletonResults() {
  return (
    <div className="skeleton-wrap">
      <div className="skeleton skel-hero" />
      <div className="skeleton skel-title" />
      <div className="skel-dims">
        {[1, 2, 3, 4, 5].map((i) => <div key={i} className="skeleton skel-dim" />)}
      </div>
      <div className="skeleton skel-title" />
      <div className="skel-two">
        <div className="skeleton skel-panel" />
        <div className="skeleton skel-panel" />
      </div>
      <div className="loading-status">
        Analyzing your resume
        <span className="loading-dot" />
        <span className="loading-dot" />
        <span className="loading-dot" />
      </div>
    </div>
  );
}

// ── GRADE HELPER ──────────────────────────────────────────────────────────────
function getGrade(score) {
  if (score >= 90) return { label: "Outstanding", className: "grade-good" };
  if (score >= 80) return { label: "Excellent", className: "grade-good" };
  if (score >= 70) return { label: "Good Match", className: "grade-good" };
  if (score >= 55) return { label: "Needs Work", className: "grade-mid" };
  return { label: "Low Match", className: "grade-low" };
}

function getDimColor(score) {
  if (score >= 80) return "#2d6a4f";
  if (score >= 60) return "#c9922a";
  return "#e84c1e";
}

function getDimStatus(score) {
  if (score >= 80) return "Strong";
  if (score >= 60) return "Average";
  return "Needs Work";
}

function getHeroGlowColor(score) {
  if (score >= 80) return "rgba(45, 106, 79, 0.5)";
  if (score >= 60) return "rgba(201, 146, 42, 0.5)";
  return "rgba(232, 76, 30, 0.5)";
}

function getEffortClass(minutes) {
  if (!minutes) return "";
  const num = parseInt(minutes);
  if (num <= 5) return "quick";
  if (num <= 15) return "quick";
  if (num <= 30) return "medium";
  return "long";
}

function formatEffort(minutes) {
  if (!minutes) return null;
  const num = parseInt(minutes);
  if (num <= 1) return "⚡ 1 min";
  if (num <= 15) return `⚡ ${num} min`;
  if (num <= 60) return `⏱ ${num} min`;
  return `⏳ ${num} min`;
}

// ── GRADE SCALE ────────────────────────────────────────────────────────────────
const GRADE_TIERS = [
  { letter: "A+", range: "90-100", color: "#2d6a4f", label: "Exceptional" },
  { letter: "A", range: "80-89", color: "#40916c", label: "Strong" },
  { letter: "B+", range: "70-79", color: "#c9922a", label: "Good" },
  { letter: "B", range: "60-69", color: "#e0a800", label: "Average" },
  { letter: "C", range: "50-59", color: "#e84c1e", label: "Below Avg" },
  { letter: "D/F", range: "0-49", color: "#c93d14", label: "Needs Work" },
];

function GradeScale({ score, grade }) {
  if (!score && score !== 0) return null;

  return (
    <div className="grade-scale">
      {GRADE_TIERS.map((tier) => {
        const letterMatch = grade && (tier.letter.startsWith(grade) || (grade === "F" && tier.letter === "D/F"));
        return (
          <div
            key={tier.letter}
            className={`grade-tier ${letterMatch ? "active" : ""}`}
            style={{ background: letterMatch ? tier.color : "transparent" }}
          >
            <span className="grade-letter">{tier.letter}</span>
            <span className="grade-range">{tier.range}</span>
          </div>
        );
      })}
    </div>
  );
}

// ── SECTION BREAKDOWN ACCORDION ───────────────────────────────────────────────
function SectionBreakdown({ breakdown }) {
  const [expanded, setExpanded] = useState(null);

  if (!breakdown || Object.keys(breakdown).length === 0) return null;

  const sections = Object.entries(breakdown).map(([key, val]) => {
    const rawScore = val.score || 0;
    const rawMax = val.max || 20;
    // Normalize to percentage so bars look meaningful
    const pct = Math.round((rawScore / rawMax) * 100);
    return {
      key,
      label: key.charAt(0).toUpperCase() + key.slice(1),
      score: rawScore,
      max: rawMax,
      pct: Math.min(pct, 100),
      feedback: val.feedback || "",
    };
  });

  // Vibrant gradient colors per section for visual variety
  const sectionColors = [
    "linear-gradient(135deg, #2d6a4f, #40916c)",   // Summary - green
    "linear-gradient(135deg, #e84c1e, #f7673e)",   // Experience - orange
    "linear-gradient(135deg, #c9922a, #e0b045)",   // Education - gold
    "linear-gradient(135deg, #3b82f6, #60a5fa)",   // Skills - blue
    "linear-gradient(135deg, #8b5cf6, #a78bfa)",   // Projects - purple
  ];

  return (
    <div className="section-block">
      <div className="section-block-head">
        <div className="section-block-title">Section Breakdown</div>
        <div className="section-block-sub">Click for details</div>
      </div>
      <div className="sec-breakdown">
        {sections.map((s, i) => {
          const barColor = sectionColors[i % sectionColors.length];
          return (
            <div key={s.key}>
              <div
                className={`sec-row ${expanded === s.key ? "expanded" : ""}`}
                onClick={() => setExpanded(expanded === s.key ? null : s.key)}
                style={{ animationDelay: `${0.45 + i * 0.06}s` }}
              >
                <div className="sec-name">{s.label}</div>
                <div className="sec-bar-track">
                  <div
                    className="sec-bar-fill"
                    style={{
                      width: `${s.pct}%`,
                      background: barColor,
                      boxShadow: `0 0 8px ${barColor.includes("2d6a4f") ? "rgba(45,106,79,0.3)" : barColor.includes("e84c") ? "rgba(232,76,30,0.3)" : barColor.includes("c992") ? "rgba(201,146,42,0.3)" : barColor.includes("3b82") ? "rgba(59,130,246,0.3)" : "rgba(139,92,246,0.3)"}`,
                    }}
                  />
                </div>
                <div className="sec-score" style={{
                  background: barColor,
                  WebkitBackgroundClip: "text",
                  WebkitTextFillColor: "transparent",
                  backgroundClip: "text",
                }}>
                  {s.score}/{s.max}
                </div>
              </div>
              <div className="sec-detail">{s.feedback}</div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ── KEYWORD CLOUD ──────────────────────────────────────────────────────────────
function KeywordCloud({ keywordData }) {
  if (!keywordData || !keywordData.most_used || keywordData.most_used.length === 0) return null;

  const { most_used, overused_words, total_unique_keywords } = keywordData;
  const maxCount = most_used[0]?.count || 1;
  const overusedSet = new Set((overused_words || []).map((w) => w.word));

  return (
    <div className="section-block" style={{ animationDelay: "0.65s" }}>
      <div className="section-block-head">
        <div className="section-block-title">Keyword Density</div>
        <div className="section-block-sub">{total_unique_keywords || 0} unique keywords found</div>
      </div>
      <div className="kw-stats">
        <div>
          <div className="kw-stat-num">{total_unique_keywords || 0}</div>
          <div style={{ fontSize: "11px", color: "var(--muted)" }}>Unique Keywords</div>
        </div>
        <div>
          <div className="kw-stat-num">{most_used.length}</div>
          <div style={{ fontSize: "11px", color: "var(--muted)" }}>Most Frequent</div>
        </div>
        {overused_words?.length > 0 && (
          <div>
            <div className="kw-stat-num" style={{ color: "var(--accent)" }}>{overused_words.length}</div>
            <div style={{ fontSize: "11px", color: "var(--muted)" }}>Overused (avoid)</div>
          </div>
        )}
      </div>
      <div className="kw-cloud">
        {most_used.map((kw, i) => {
          const size = 11 + (kw.count / maxCount) * 10;
          const isWarn = overusedSet.has(kw.word);
          return (
            <span
              key={i}
              className={`kw-tag ${isWarn ? "warn" : ""}`}
              style={{
                fontSize: `${size}px`,
                padding: `${4 + (kw.count / maxCount) * 4}px ${8 + (kw.count / maxCount) * 6}px`,
                animationDelay: `${0.7 + i * 0.04}s`,
              }}
            >
              {kw.word}
              <span className="kw-tag-count">×{kw.count}</span>
            </span>
          );
        })}
      </div>
    </div>
  );
}

// ── TRANSFORMERS ──────────────────────────────────────────────────────────────
function transformResumeResults(apiData) {
  const dimScores = {};
  const detailData = apiData._dim_detail || apiData.dimension_scores || {};
  if (apiData.dimension_scores) {
    Object.entries(apiData.dimension_scores).forEach(([key, val]) => {
      const score = typeof val === "number" ? val : (val.score || 0);
      const detail = detailData[key] || {};
      dimScores[key] = {
        score,
        label: key.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase()),
        metrics: detail.metrics || {},
        breakdown: detail.breakdown || {},
      };
    });
  }
  if (!dimScores.role_coherence) {
    const avg = Math.round(
      (Object.values(dimScores).reduce((s, d) => s + d.score, 0) /
        Math.max(Object.keys(dimScores).length, 1))
    );
    dimScores.role_coherence = { score: avg, label: "Role Coherence", metrics: {}, breakdown: {} };
  }

  return {
    match_percentage: apiData.ats_score?.final_score || apiData.ats_score?.score || 0,
    grade: apiData.ats_score?.grade || "",
    verdict: apiData.ats_score?.verdict || "Analysis Complete",
    dimension_scores: dimScores,
    peer_comparison: apiData.peer_comparison || null,
    section_breakdown: apiData.section_breakdown || null,
    keyword_density: apiData.keyword_density || null,
    ats_preview: apiData.ats_preview || null,
    top_strengths: apiData.ai_review?.top_strengths || apiData.what_you_did_well || [],
    critical_issues: apiData.ai_review?.critical_issues || apiData.issues_to_fix || [],
    skills_mapping: {
      exact_matches: apiData.skills_found || [],
      semantic_matches: [],
      missing_skills: [],
    },
    bullet_rewrites: apiData.ai_review?.bullet_rewrites || [],
    recommendations: (apiData.score_boosts || []).map((b) => ({
      category: b.action,
      priority: b.priority === 1 ? "high" : b.priority === 2 ? "medium" : "low",
      action: `${b.action} (boost: ${b.score_boost})`,
      effort: b.effort || null,
    })),
    interview_talking_points: [],
    week_1_action: apiData.ai_review?.week_1_action || "Review your resume based on the AI feedback above to improve your ATS score.",
    previous_score: null,
  };
}

function transformJdResults(apiData) {
  const summary = apiData.summary || {};
  const sectionScores = apiData.section_scores || {};
  const skillAnalysis = apiData.skill_analysis || {};
  const adjustments = apiData.resume_adjustments || [];
  const improvement = apiData.improvement_path || {};
  const interviewKit = apiData.interview_kit || {};
  const recommendationsList = apiData.recommendations || [];

  const dimScores = {};
  if (Object.keys(sectionScores).length > 0) {
    Object.entries(sectionScores).forEach(([key, val]) => {
      dimScores[key] = {
        score: val.score || 0,
        label: val.label || key.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase()),
        metrics: {},
        breakdown: {},
      };
    });
  }

  const bulletRewrites = adjustments.map((adj) => ({
    section: adj.section || "Experience",
    original: adj.original_bullet || "",
    rewritten: adj.optimized_bullet || "",
    why: adj.reason_for_change || "",
  }));

  const recs = recommendationsList.length > 0
    ? recommendationsList.map((r) => ({
        category: r.category || "Suggestion",
        priority: r.priority || "medium",
        action: r.action || r.recommendation || "",
        effort: r.effort || null,
      }))
    : (improvement.steps || []).map((step) => ({
        category: "Improvement",
        priority: step.priority || "medium",
        action: step.action || "",
        effort: null,
      }));

  const exactSkills = [...(skillAnalysis.exact_matches || [])];
  const semantic = skillAnalysis.semantic_matches || [];
  semantic.forEach((sm) => {
    const skillName = sm.matched_with || sm.required || "";
    if (skillName && !exactSkills.includes(skillName)) {
      exactSkills.push(skillName);
    }
  });

  // Build section_breakdown from JD section_scores (5 dimensions with score/max/description)
  const breakdown = {};
  if (Object.keys(sectionScores).length > 0) {
    Object.entries(sectionScores).forEach(([key, val]) => {
      breakdown[key] = {
        score: val.score || 0,
        max: val.max || 100,
        feedback: val.description || '',
      };
    });
  }

  return {
    match_percentage: summary.overall_score || improvement.current_score || 0,
    grade: summary.grade || "",
    verdict: summary.verdict || "Analysis Complete",
    dimension_scores: dimScores,
    peer_comparison: null,
    section_breakdown: Object.keys(breakdown).length > 0 ? breakdown : null,
    keyword_density: apiData.keyword_density || null,
    ats_preview: apiData.ats_preview || null,
    top_strengths: skillAnalysis.strengths || [],
    critical_issues: (improvement.steps || []).slice(0, 3).map((s) => s.action),
    skills_mapping: {
      exact_matches: exactSkills,
      semantic_matches: [],
      missing_skills: skillAnalysis.missing_skills || [],
    },
    bullet_rewrites: bulletRewrites,
    recommendations: recs,
    interview_talking_points: interviewKit.talking_points || [],
    week_1_action: improvement.steps?.[0]?.action || "Review your results and apply the suggested improvements.",
    previous_score: null,
  };
}

// ── MAIN COMPONENT ───────────────────────────────────────────────────────────
export default function ResultsScreen({
  data,
  loading = false,
  type = "resume",
  jobTitle = "",
  companyName = "",
  onBack,
  onNewScan,
}) {
  const [showConfetti, setShowConfetti] = useState(false);
  const [isLoading, setIsLoading] = useState(loading);
  const normalizedData = data || {};

  useEffect(() => {
    const styleTag = document.createElement("style");
    styleTag.innerHTML = styles;
    document.head.appendChild(styleTag);
    return () => document.head.removeChild(styleTag);
  }, []);

  useEffect(() => {
    if (loading) {
      const t = setTimeout(() => setIsLoading(false), 2200);
      return () => clearTimeout(t);
    } else {
      setIsLoading(false);
    }
  }, [loading]);

  useEffect(() => {
    if (!isLoading && normalizedData.match_percentage >= 70) {
      const t = setTimeout(() => setShowConfetti(true), 1900);
      return () => clearTimeout(t);
    }
  }, [isLoading, normalizedData.match_percentage]);

  const animatedScore = useCountUp(isLoading ? 0 : normalizedData.match_percentage, 1800, 200);
  const grade = getGrade(normalizedData.match_percentage);
  const heroGlow = getHeroGlowColor(normalizedData.match_percentage);

  const ARC_SIZE = 220;
  const ARC_STROKE = 10;

  const subtitle = type === "jd"
    ? `Generated just now · ${jobTitle || "Job"}${companyName ? ` @ ${companyName}` : ""}`
    : "Generated just now · Resume ATS Analysis";

  const strengths = normalizedData.top_strengths || [];
  const issues = normalizedData.critical_issues || [];
  const dimScores = normalizedData.dimension_scores || {};
  const skillsMap = normalizedData.skills_mapping || {};
  const rewrites = normalizedData.bullet_rewrites || [];
  const recs = normalizedData.recommendations || [];
  const talkingPoints = normalizedData.interview_talking_points || [];
  const peerComparison = normalizedData.peer_comparison || null;
  const atsPreview = normalizedData.ats_preview || null;
  const previousScore = normalizedData.previous_score || null;

  if (isLoading) {
    return (
      <div className="results-root">
        <div className="container">
          <SkeletonResults />
        </div>
      </div>
    );
  }

  return (
    <div className="results-root">
      <Confetti trigger={showConfetti} score={normalizedData.match_percentage} />

      <div className="container">

        {/* HEADER */}
        <div className="results-header">
          <div>
            <div className="results-tag">Analysis Complete</div>
            <div className="results-title">
              {type === "jd" ? "Your Match " : "Your Resume "}
              <span>Report</span>
            </div>
            <div className="results-sub">{subtitle}</div>
          </div>
          <div className="results-actions">
            {onBack && (
              <button className="action-btn outline" onClick={onBack}>
                ← Dashboard
              </button>
            )}
            {onNewScan && (
              <button className="action-btn" onClick={onNewScan}>
                🔄 New Scan
              </button>
            )}
          </div>
        </div>

        {/* HERO SCORE */}
        <div className="hero-score" style={{ "--hero-glow-color": heroGlow }}>
          <div className="hero-ring-wrap">
            <div className="hero-ring">
              <ArcRing
                size={ARC_SIZE}
                strokeWidth={ARC_STROKE}
                value={normalizedData.match_percentage}
                color={normalizedData.match_percentage >= 80 ? "#4ade80" : normalizedData.match_percentage >= 60 ? "#c9922a" : "#e84c1e"}
                delay={300}
              />
              <div className="hero-ring-content">
                <div className="hero-score-num">{animatedScore}</div>
                <div className="hero-score-max">out of 100</div>
                <div className={`hero-score-grade ${grade.className}`}>{grade.label}</div>
                {previousScore && (
                  <div className={`score-change ${normalizedData.match_percentage >= previousScore ? "up" : "down"}`}>
                    {normalizedData.match_percentage >= previousScore ? "↑" : "↓"}
                    +{Math.abs(normalizedData.match_percentage - previousScore)}
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className="hero-text">
            <div className="hero-verdict">
              {normalizedData.verdict || "Analysis Complete"}
              {normalizedData.grade && (
                <span className={`hero-score-grade ${grade.className}`} style={{ display: "inline-block", marginLeft: "12px", verticalAlign: "middle" }}>
                  Grade {normalizedData.grade}
                </span>
              )}
            </div>
            <div className="hero-summary">
              {type === "jd"
                ? "We analyzed your resume against the job description across skills, experience, writing quality, and ATS compatibility. Here's your complete breakdown with AI-powered suggestions to improve your match."
                : "We analyzed your resume across 4 dimensions — completeness, writing quality, ATS format, and content depth. Here's your complete breakdown with AI-powered suggestions."}
            </div>
            <div className="hero-meta-row">
              <div className="hero-meta-item">
                <div className="hero-meta-label">Matched Skills</div>
                <div className="hero-meta-value green">{(skillsMap.exact_matches || []).length}</div>
              </div>
              {type === "jd" && (
              <div className="hero-meta-item">
                <div className="hero-meta-label">Missing Skills</div>
                <div className="hero-meta-value accent">{(skillsMap.missing_skills || []).length}</div>
              </div>
              )}
              <div className="hero-meta-item">
                <div className="hero-meta-label">Score</div>
                <div className="hero-meta-value green">{normalizedData.match_percentage}%</div>
              </div>
              {peerComparison && (
                <div className="hero-meta-item">
                  <div className="hero-meta-label">vs Peers</div>
                  <div className="hero-meta-value gold">{peerComparison.percentile}</div>
                </div>
              )}
            </div>

            {/* GRADE SCALE */}
            {type === "resume" && (
              <GradeScale score={normalizedData.match_percentage} grade={normalizedData.grade} />
            )}
          </div>
        </div>

        {/* PEER COMPARISON STRIP */}
        {peerComparison && (
          <div className="peer-strip">
            <div className="peer-item">
              <div className="peer-label">Peer Group</div>
              <div className="peer-value" style={{ color: "var(--muted)", fontSize: "16px" }}>{peerComparison.peer_group || "N/A"}</div>
              <div className="peer-sub">{peerComparison.summary || ""}</div>
            </div>
            <div className="peer-item">
              <div className="peer-label">Your Score</div>
              <div className="peer-value" style={{ color: peerComparison.your_score >= 70 ? "var(--accent2)" : "var(--accent)" }}>
                {peerComparison.your_score || 0}
              </div>
              <div className="peer-sub">out of 100</div>
            </div>
            <div className="peer-item">
              <div className="peer-label">vs Average</div>
              <div className="peer-value" style={{
                color: (peerComparison.above_average_by || 0) > 0 ? "var(--accent2)" : "var(--accent)",
              }}>
                {peerComparison.above_average_by > 0 ? "+" : ""}{peerComparison.above_average_by || 0}
              </div>
              <div className="peer-sub">
                {peerComparison.above_average_by > 0 ? "Above average" : "Below average"}
              </div>
            </div>
          </div>
        )}

        {/* ATS PREVIEW BAR */}
        {atsPreview && (
          <div className="ats-bar" style={{ animationDelay: "0.4s" }}>
            <div className="ats-main">
              <div className="ats-label">ATS Preview</div>
              <div className="ats-word-bar">
                <span className="ats-word-count">{atsPreview.word_count || 0}</span>
                <span className="ats-word-range">words</span>
                <div className="ats-word-track">
                  <div
                    className="ats-word-fill"
                    style={{
                      width: `${Math.min(((atsPreview.word_count || 0) / 800) * 100, 100)}%`,
                      background: (atsPreview.word_count || 0) >= 350 && (atsPreview.word_count || 0) <= 800
                        ? "var(--accent2)" : "var(--accent)",
                    }}
                  />
                </div>
                <span className="ats-word-range">Ideal: 350–800</span>
              </div>
              {atsPreview.sections_detected && (
                <div className="ats-section-grid">
                  {["summary", "experience", "education", "skills", "projects", "certifications"].map((s) => {
                    const found = (atsPreview.sections_detected || []).includes(s);
                    const missing = (atsPreview.missing_sections || []).includes(s);
                    return (
                      <span key={s} className={`ats-section-pill ${found ? "found" : missing ? "missing" : ""}`}>
                        {found ? "✓" : missing ? "✗" : "○"} {s.charAt(0).toUpperCase() + s.slice(1)}
                      </span>
                    );
                  })}
                </div>
              )}
            </div>
            <div className="ats-pill">
              <div>
                <div className="ats-pill-label">Reading Time</div>
                <div className="ats-pill-value">{atsPreview.reading_time_seconds || 0}s</div>
              </div>
            </div>
            {normalizedData.grade && (
              <div className="ats-pill">
                <div>
                  <div className="ats-pill-label">Grade</div>
                  <div className="ats-pill-value" style={{
                    color: normalizedData.match_percentage >= 80 ? "var(--accent2)" : normalizedData.match_percentage >= 60 ? "var(--gold)" : "var(--accent)",
                  }}>
                    {normalizedData.grade}
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* DIMENSION BREAKDOWN */}
        {Object.keys(dimScores).length > 0 && (
          <div className="section-block">
            <div className="section-block-head">
              <div className="section-block-title">Score Breakdown</div>
              <div className="section-block-sub">{Object.keys(dimScores).length} dimensions analyzed</div>
            </div>
            <div className="dims-grid">
              {Object.entries(dimScores).map(([key, dim], i) => (
                <DimCard key={key} dim={dim} delay={350 + i * 100} />
              ))}
            </div>
          </div>
        )}

        {/* SECTION BREAKDOWN (RR + JD) */}
        {normalizedData.section_breakdown && (
          <SectionBreakdown breakdown={normalizedData.section_breakdown} />
        )}

        {/* STRENGTHS / ISSUES */}
        <div className="two-col">
          <div className="panel" style={{ animationDelay: "0.5s" }}>
            <div className="panel-head">
              <div className="panel-icon green">✅</div>
              <div className="panel-title">Top Strengths</div>
            </div>
            <div className="panel-list">
              {strengths.length === 0 ? (
                <div className="panel-item" style={{ color: "var(--muted)", fontStyle: "italic" }}>
                  <span className="panel-item-icon">▸</span>
                  <span>No specific strengths identified</span>
                </div>
              ) : (
                strengths.map((s, i) => (
                  <div className="panel-item green-item" key={i} style={{ animationDelay: `${0.55 + i * 0.07}s` }}>
                    <span className="panel-item-icon">▸</span>
                    <span>{s}</span>
                  </div>
                ))
              )}
            </div>
          </div>

          <div className="panel" style={{ animationDelay: "0.55s" }}>
            <div className="panel-head">
              <div className="panel-icon red">⚠️</div>
              <div className="panel-title">Critical Issues</div>
            </div>
            <div className="panel-list">
              {issues.length === 0 ? (
                <div className="panel-item" style={{ color: "var(--muted)", fontStyle: "italic" }}>
                  <span className="panel-item-icon">▸</span>
                  <span>No critical issues found — great job!</span>
                </div>
              ) : (
                issues.map((s, i) => (
                  <div className="panel-item red-item" key={i} style={{ animationDelay: `${0.6 + i * 0.07}s` }}>
                    <span className="panel-item-icon">▸</span>
                    <span>{s}</span>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        {/* SKILLS MAPPING — only for JD match */}
        {type === "jd" && (skillsMap.exact_matches?.length > 0 ||
          skillsMap.missing_skills?.length > 0) && (
          <div className="section-block">
            <div className="section-block-head">
              <div className="section-block-title">Skills Mapping</div>
              <div className="section-block-sub">Matched and missing skills vs job description</div>
            </div>
            <div className="skills-grid" style={{ gridTemplateColumns: "1fr 1fr" }}>
              <div className="skill-col" style={{ animationDelay: "0.6s" }}>
                <div className="skill-col-head">
                  <div className="skill-col-title">✅ Matched Skills</div>
                  <div className="skill-col-count" style={{ color: "var(--accent2)" }}>
                    {(skillsMap.exact_matches || []).length}
                  </div>
                </div>
                <div className="skill-tags">
                  {(skillsMap.exact_matches || []).length === 0 ? (
                    <div className="skill-empty">None found</div>
                  ) : (
                    skillsMap.exact_matches.map((s, i) => (
                      <span className="skill-tag exact" key={i} style={{ animationDelay: `${0.65 + i * 0.04}s` }}>{s}</span>
                    ))
                  )}
                </div>
              </div>

              <div className="skill-col" style={{ animationDelay: "0.65s" }}>
                <div className="skill-col-head">
                  <div className="skill-col-title">❌ Missing Skills</div>
                  <div className="skill-col-count" style={{ color: "var(--accent)" }}>
                    {(skillsMap.missing_skills || []).length}
                  </div>
                </div>
                <div className="skill-tags">
                  {(skillsMap.missing_skills || []).length === 0 ? (
                    <div className="skill-empty">None — full coverage!</div>
                  ) : (
                    skillsMap.missing_skills.map((s, i) => (
                      <span className="skill-tag missing" key={i} style={{ animationDelay: `${0.7 + i * 0.04}s` }}>{s}</span>
                    ))
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* KEYWORD DENSITY CLOUD (RR + JD) */}
        {normalizedData.keyword_density && (
          <KeywordCloud keywordData={normalizedData.keyword_density} />
        )}

        {/* WEEK 1 ACTION BANNER */}
        {normalizedData.week_1_action && (
          <div className="action-banner" style={{ animationDelay: "0.75s" }}>
            <div className="action-banner-icon">🎯</div>
            <div className="action-banner-content">
              <div className="action-banner-label">Your Week 1 Priority Action</div>
              <div className="action-banner-text">{normalizedData.week_1_action}</div>
            </div>
          </div>
        )}

        {/* BULLET REWRITES — Premium */}
        {rewrites.length > 0 && (() => {
          const RewritesSection = () => {
            const [ref, revealed] = useScrollReveal(0.12);
            return (
              <div className="section-block" ref={ref}>
                <div className="section-block-head">
                  <div className="section-block-title rewrites-heading">AI Bullet Rewrites</div>
                  <div className="section-block-sub">Before & after — optimized for impact</div>
                </div>
                <div className={`scroll-reveal-stagger ${revealed ? "revealed" : ""}`}>
                  {rewrites.map((b, i) => (
                    <div className="rewrite-card" key={i}>
                      <div className="rewrite-body">
                        <div className="rewrite-row" style={{ gridTemplateColumns: i === rewrites.length - 1 ? "1fr" : "1fr 36px 1fr" }}>
                          <div>
                            {i < rewrites.length - 1 && (
                              <div className="rewrite-label before">
                                <span>✕</span> Original
                              </div>
                            )}
                            <div className={`rewrite-text ${i < rewrites.length - 1 ? "before-text" : ""}`}
                              style={i === rewrites.length - 1 ? { background: "linear-gradient(135deg,#f3f8f5 0%,#edf5ef 100%)", color: "var(--ink)", fontWeight: 700, border: "1px solid rgba(45,106,79,0.2)", borderLeft: "3px solid var(--accent2)", padding: "16px 20px", borderRadius: "6px" } : {}}
                            >{b.original}</div>
                          </div>

                          {i < rewrites.length - 1 && (
                            <div className="rewrite-arrow">
                              <div className="rewrite-arrow-line" />
                              <div className="rewrite-arrow-head" />
                            </div>
                          )}

                          {i < rewrites.length - 1 && (
                            <div>
                              <div className="rewrite-label after">
                                <span>✓</span> Optimized
                              </div>
                              <div className="rewrite-text after-text">{b.rewritten}</div>
                            </div>
                          )}
                        </div>
                        <div className="rewrite-why">
                          <span className="rewrite-why-icon">💡</span>
                          <span>{b.why}</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            );
          };
          return <RewritesSection />;
        })()}

        {/* RECOMMENDATIONS — Premium */}
        {recs.length > 0 && (() => {
          const RecsSection = () => {
            const [ref, revealed] = useScrollReveal(0.12);
            return (
              <div className="section-block" ref={ref}>
                <div className="section-block-head">
                  <div className="section-block-title recs-heading">Prioritized Recommendations</div>
                  <div className="section-block-sub">Ranked by impact</div>
                </div>
                <div className={`rec-list scroll-reveal-stagger ${revealed ? "revealed" : ""}`}>
                  {recs.map((r, i) => {
                    const priorityMap = {
                      critical: { icon: "🔴", label: "Critical", cls: "critical" },
                      high: { icon: "⚡", label: "High Priority", cls: "high" },
                      medium: { icon: "📈", label: "Medium", cls: "medium" },
                      low: { icon: "✅", label: "Low", cls: "low" },
                    };
                    const p = priorityMap[r.priority] || priorityMap.medium;
                    // Detect portfolio/deploy/live-link recommendations for special icon
                    const isPortfolioRec = /portfolio|live link|deploy/i.test(r.action || r.category || "");
                    const icon = isPortfolioRec ? "🚀" : p.icon;
                    // Extract boost from action string if present
                    const boostMatch = r.action?.match(/\(boost:\s*\+\d+\s*points\)/i);
                    const boostText = boostMatch ? boostMatch[0].replace(/[()]/g, '') : null;
                    const cleanAction = boostText ? r.action.replace(/\s*\(boost:\s*\+\d+\s*points\)/i, '') : r.action;
                    return (
                      <div className={`rec-item ${p.cls}`} key={i}>
                        <div className={`rec-icon ${p.cls}`}>{icon}</div>
                        <div className="rec-content">
                          <div className="rec-category">
                            <span className="rec-category-text">{r.category || "Suggestion"}</span>
                            {boostText && boostText.includes("+") && (
                              <span className="rec-category-boost">{boostText.replace("boost: ", "")}</span>
                            )}
                          </div>
                          <div className="rec-action">{cleanAction}</div>
                        </div>
                        {r.effort && (
                          <span className={`rec-effort ${getEffortClass(r.effort)}`}>
                            {formatEffort(r.effort)}
                          </span>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          };
          return <RecsSection />;
        })()}

        {/* INTERVIEW TALKING POINTS */}
        {talkingPoints.length > 0 && (
          <div className="section-block">
            <div className="section-block-head">
              <div className="section-block-title">Interview Talking Points</div>
              <div className="section-block-sub">How to pitch yourself for this role</div>
            </div>
            <div className="talking-points">
              {talkingPoints.map((t, i) => (
                <div className="talking-point" key={i} style={{ animationDelay: `${0.9 + i * 0.07}s` }}>
                  <div className="talking-num">{String(i + 1).padStart(2, "0")}</div>
                  <div className="talking-text">{t}</div>
                </div>
              ))}
            </div>
          </div>
        )}

      </div>
    </div>
  );
}

// ── HERO RING ──
function CircularRing({ size, radius, circumference, value, delay }) {
  const [offset, setOffset] = useState(circumference);
  useEffect(() => {
    const t = setTimeout(() => {
      setOffset(circumference - (value / 100) * circumference);
    }, delay);
    return () => clearTimeout(t);
  }, [value, circumference, delay]);

  return (
    <circle
      className="ring-progress"
      cx={size / 2} cy={size / 2} r={radius}
      style={{ strokeDasharray: circumference, strokeDashoffset: offset }}
    />
  );
}

// ── DIMENSION CARD ──
function DimCard({ dim, delay }) {
  const SIZE = 84;
  const STROKE = 7;
  const radius = (SIZE - STROKE) / 2;
  const circumference = 2 * Math.PI * radius;
  const [offset, setOffset] = useState(circumference);
  const animatedVal = useCountUp(dim.score, 1200, delay);
  const color = getDimColor(dim.score);
  const metrics = dim.metrics || {};

  useEffect(() => {
    const t = setTimeout(() => {
      setOffset(circumference - (dim.score / 100) * circumference);
    }, delay);
    return () => clearTimeout(t);
  }, [dim.score, circumference, delay]);

  // Build tooltip content from metrics
  const metricLines = [];
  if (metrics.total_bullets != null) metricLines.push({ label: "Bullets", value: metrics.total_bullets });
  if (metrics.strong_verb_count != null) metricLines.push({ label: "Strong Verbs", value: metrics.strong_verb_count });
  if (metrics.good_verb_count != null) metricLines.push({ label: "Good Verbs", value: metrics.good_verb_count });
  if (metrics.quantification_rate_pct != null) metricLines.push({ label: "Quantified", value: `${metrics.quantification_rate_pct}%` });
  if (metrics.verb_rate_pct != null) metricLines.push({ label: "Verb Rate", value: `${metrics.verb_rate_pct}%` });
  if (metrics.weak_language_count != null) metricLines.push({ label: "Weak Phrases", value: metrics.weak_language_count });

  return (
    <div className="dim-card" style={{ animationDelay: `${delay / 1000}s` }}>
      {/* Tooltip */}
      {metricLines.length > 0 && (
        <div className="dim-tooltip">
          {metricLines.map((m, i) => (
            <div className="dim-tooltip-item" key={i}>
              <span className="dim-tooltip-label">{m.label}</span>
              <span className="dim-tooltip-value">{m.value}</span>
            </div>
          ))}
        </div>
      )}
      <div className="dim-ring">
        <svg width={SIZE} height={SIZE} viewBox={`0 0 ${SIZE} ${SIZE}`}>
          <circle className="dim-ring-track" cx={SIZE/2} cy={SIZE/2} r={radius} />
          <circle
            className="dim-ring-progress"
            cx={SIZE/2} cy={SIZE/2} r={radius}
            style={{ stroke: color, strokeDasharray: circumference, strokeDashoffset: offset }}
          />
        </svg>
        <div className="dim-ring-content" style={{ color }}>{animatedVal}</div>
      </div>
      {/* Mini progress bar below ring */}
      <div className="dim-mini-bar">
        <div className="dim-mini-fill" style={{
          width: `${Math.min(dim.score, 100)}%`,
          background: color,
        }} />
      </div>
      <div className="dim-label">{dim.label}</div>
      <div className="dim-status">{getDimStatus(dim.score)}</div>
    </div>
  );
}

// Export transformers for use by parent pages
export { transformResumeResults, transformJdResults };