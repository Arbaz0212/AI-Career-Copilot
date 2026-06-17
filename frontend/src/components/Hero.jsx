import { useState, useEffect } from "react";
import { motion } from "framer-motion";

const heroMobileStyles = `
@keyframes blink { 0%, 100% { opacity: 1; } 50% { opacity: 0.2; } }
@media (max-width: 860px) {
  section[class] {
    padding: 60px 20px !important;
    flex-direction: column !important;
    text-align: center !important;
    min-height: auto !important;
  }
  section[class] > div:first-child { width: 100% !important; }
  section[class] h1 { font-size: clamp(32px, 10vw, 48px) !important; line-height: 1.1 !important; }
  section[class] p { font-size: clamp(16px, 4vw, 20px) !important; line-height: 1.5 !important; }
  section[class] > div:last-child { display: none; }
}
`;

// Score ring SVG component with animated number
function ScoreRing({ percentage = 72, size = 140, strokeWidth = 8, delay = 500 }) {
  const [displayNum, setDisplayNum] = useState(0);
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (percentage / 100) * circumference;
  const color = percentage >= 80 ? "#059669" : percentage >= 60 ? "#d97706" : "#e84c1e";

  useEffect(() => {
    const timer = setTimeout(() => {
      const startTime = Date.now();
      const duration = 2000;
      const animate = () => {
        const elapsed = Date.now() - startTime;
        const progress = Math.min(elapsed / duration, 1);
        const eased = 1 - Math.pow(1 - progress, 3);
        setDisplayNum(Math.floor(eased * percentage));
        if (progress < 1) requestAnimationFrame(animate);
      };
      requestAnimationFrame(animate);
    }, delay);
    return () => clearTimeout(timer);
  }, [percentage, delay]);

  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
      <circle
        cx={size / 2} cy={size / 2} r={radius}
        fill="none" stroke="#ede8df" strokeWidth={strokeWidth}
      />
      <motion.circle
        cx={size / 2} cy={size / 2} r={radius}
        fill="none" stroke={color} strokeWidth={strokeWidth}
        strokeLinecap="round"
        strokeDasharray={circumference}
        initial={{ strokeDashoffset: circumference }}
        animate={{ strokeDashoffset: offset }}
        transition={{ duration: 1.5, ease: "easeOut", delay: 0.5 }}
        transform={`rotate(-90 ${size / 2} ${size / 2})`}
      />
      <text
        x="50%" y="50%" textAnchor="middle" dominantBaseline="central"
        fill="#0f0e0a" fontSize="32" fontWeight="700"
        fontFamily="'Clash Display', sans-serif"
      >
        {displayNum}%
      </text>
    </svg>
  );
}

export default function Hero({ openAuthModal }) {
  if (typeof document !== "undefined" && !document.getElementById("hero-mobile")) {
    const s = document.createElement("style");
    s.id = "hero-mobile";
    s.textContent = heroMobileStyles;
    document.head.appendChild(s);
  }

  return (
    <section
      style={{
        minHeight: "90vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        padding: "100px",
        position: "relative",
        overflow: "hidden",
      }}
    >
      {/* Subtle background glow */}
      <div style={{
        position: "absolute", top: "-200px", left: "-200px",
        width: "600px", height: "600px",
        background: "radial-gradient(circle, rgba(232,76,30,0.04) 0%, transparent 65%)",
        pointerEvents: "none",
      }} />

      <div style={{ width: "55%", position: "relative", zIndex: 1 }}>
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
        >
          {/* Branded badge — black + orange box */}
          <div
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "10px",
              background: "#0f0e0a",
              padding: "8px 18px 8px 14px",
              borderRadius: "10px",
              marginBottom: "28px",
              border: "1px solid #2a2a2a",
              boxShadow: "0 2px 12px rgba(0,0,0,0.1)",
            }}
          >
            <span style={{
              width: "8px", height: "8px",
              background: "#e84c1e",
              borderRadius: "50%",
              boxShadow: "0 0 8px rgba(232,76,30,0.5)",
              animation: "blink 1.4s ease-in-out infinite",
            }} />
            <span style={{
              fontSize: "11px",
              fontWeight: 700,
              letterSpacing: "2.5px",
              textTransform: "uppercase",
              color: "#f5f0e8",
            }}>
              AI-Powered
            </span>
            <span style={{ color: "#3a3a3a", fontSize: "14px", fontWeight: 300 }}>·</span>
            <span style={{
              fontSize: "11px",
              fontWeight: 700,
              letterSpacing: "2.5px",
              textTransform: "uppercase",
              color: "#e84c1e",
            }}>
              Built For India
            </span>
          </div>

          <h1
            className="display-1"
            style={{
              marginBottom: "24px",
              maxWidth: "800px",
              lineHeight: "1.05",
            }}
          >
            Most resumes never reach{" "}
            <span style={{ color: "#e84c1e", fontStyle: "italic" }}>recruiters</span>
            <br />
            <span style={{
              background: "linear-gradient(135deg, #0f0e0a 0%, #e84c1e 100%)",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
              backgroundClip: "text",
              fontStyle: "italic",
            }}>
              because ATS filters them
            </span>{" "}
            first.
          </h1>

          <p
            className="body-large"
            style={{
              color: "#666",
              maxWidth: "540px",
              lineHeight: "1.7",
            }}
          >
            AI Career Copilot shows you <strong>exactly</strong> what's wrong with your
            resume, <strong>how to fix it</strong>, and how to increase your chances
            of landing an interview — not generic advice, but real, actionable steps.
          </p>

          <div style={{ display: "flex", gap: "14px", marginTop: "36px", alignItems: "center" }}>
            <button
              onClick={openAuthModal}
              className="btn btn-dark btn-lg"
              style={{
                padding: "18px 36px",
                fontSize: "15px",
                position: "relative",
                overflow: "hidden",
              }}
            >
              Analyze Your Resume Free →
              <span style={{
                position: "absolute", top: "-20px", right: "-10px",
                fontSize: "9px", fontWeight: 700, letterSpacing: "1px",
                background: "#e84c1e", color: "#fff",
                padding: "2px 8px", borderRadius: "4px",
                transform: "rotate(12deg)",
              }}>
                FREE
              </span>
            </button>
            <span style={{ fontSize: "13px", color: "#999" }}>No credit card · Takes 30 seconds</span>
          </div>

        </motion.div>
      </div>

      <motion.div
        initial={{ opacity: 0, x: 30 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.8, delay: 0.2 }}
        style={{ width: "400px" }}
      >
        <div
          className="card"
          style={{
            padding: "32px",
            borderRadius: "20px",
            cursor: "default",
            textAlign: "center",
            border: "1.5px solid #d4cdc0",
          }}
        >
          <div
            style={{
              fontSize: "11px",
              fontWeight: 700,
              letterSpacing: "2px",
              textTransform: "uppercase",
              color: "#8a8070",
              marginBottom: "20px",
            }}
          >
            Live ATS Preview
          </div>

          <div style={{ display: "flex", justifyContent: "center", marginBottom: "16px" }}>
            <ScoreRing percentage={72} />
          </div>

          <div
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "6px",
              background: "#fef2f2",
              border: "1px solid rgba(232,76,30,0.2)",
              padding: "4px 12px",
              borderRadius: "6px",
              fontSize: "11px",
              fontWeight: 700,
              color: "#e84c1e",
              marginBottom: "20px",
            }}
          >
            Needs Work
          </div>

          {/* Score breakdown bars */}
          <div style={{ textAlign: "left" }}>
            {[
              { label: "Completeness", score: 82, color: "#059669" },
              { label: "Writing Quality", score: 65, color: "#d97706" },
              { label: "ATS Format", score: 70, color: "#d97706" },
              { label: "Content Depth", score: 45, color: "#e84c1e" },
            ].map((item, i) => (
              <div key={i} style={{ marginBottom: "10px" }}>
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    fontSize: "12px",
                    marginBottom: "4px",
                  }}
                >
                  <span style={{ color: "#555", fontWeight: 500 }}>{item.label}</span>
                  <span style={{ fontWeight: 700, color: item.color }}>{item.score}%</span>
                </div>
                <div
                  style={{
                    height: "6px",
                    background: "#ede8df",
                    borderRadius: "3px",
                    overflow: "hidden",
                  }}
                >
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${item.score}%` }}
                    transition={{ duration: 1, delay: 0.8 + i * 0.15, ease: "easeOut" }}
                    style={{
                      height: "100%",
                      background: item.color,
                      borderRadius: "3px",
                    }}
                  />
                </div>
              </div>
            ))}
          </div>

          <div
            style={{
              marginTop: "20px",
              padding: "14px",
              background: "#f5f0e8",
              borderRadius: "10px",
              fontSize: "12px",
              color: "#555",
              lineHeight: "1.6",
              textAlign: "left",
            }}
          >
            <div
              style={{
                fontWeight: 700,
                marginBottom: "4px",
                color: "#e84c1e",
                fontSize: "10px",
                textTransform: "uppercase",
                letterSpacing: "1px",
              }}
            >
              Top Missing Keywords
            </div>
            <div style={{ display: "flex", gap: "6px", flexWrap: "wrap" }}>
              {["Python", "FastAPI", "REST APIs", "System Design", "Docker"].map((kw) => (
                <span
                  key={kw}
                  className="icon-pulse"
                  style={{
                    background: "#fff",
                    border: "1px solid #d4cdc0",
                    padding: "2px 8px",
                    borderRadius: "4px",
                    fontSize: "11px",
                    color: "#555",
                    cursor: "default",
                    transition: "all 0.15s ease",
                  }}
                  onMouseEnter={(e) => { e.currentTarget.style.background = "#e84c1e"; e.currentTarget.style.color = "#fff"; e.currentTarget.style.borderColor = "#e84c1e"; }}
                  onMouseLeave={(e) => { e.currentTarget.style.background = "#fff"; e.currentTarget.style.color = "#555"; e.currentTarget.style.borderColor = "#d4cdc0"; }}
                >
                  {kw}
                </span>
              ))}
            </div>
          </div>
        </div>
      </motion.div>
    </section>
  );
}
