import { motion } from "framer-motion";
import FadeInSection from "./FadeInSection";

export default function ProblemSolution() {
  const items = [
    {
      problem: "Your resume gets parsed by AI before a human sees it",
      problemDesc: "Over 75% of resumes are rejected by ATS before reaching a recruiter. One wrong format or missing keyword and you're out.",
      solution: "We show you exactly what the ATS sees and what to fix",
      solutionDesc: "Our engine scores your resume across 4 dimensions and highlights every missing keyword, formatting issue, and content gap.",
      icon: "🤖",
    },
    {
      problem: "Generic AI feedback doesn't help you improve",
      problemDesc: '"Looks good" from ChatGPT doesn\'t tell you what\'s actually wrong. You need specific, actionable feedback.',
      solution: "You get a numbered score, grade, and prioritized fix list",
      solutionDesc: "Completeness: B · Writing Quality: C+ · ATS Format: B · Content Depth: D — with exact bullet rewrites and skill suggestions.",
      icon: "📊",
    },
    {
      problem: "You apply to jobs without knowing if you match",
      problemDesc: "Each job description is different. What worked for one role won't work for another — but you're sending the same resume everywhere.",
      solution: "Match your resume against any job description in seconds",
      solutionDesc: "Paste any JD and our semantic engine finds skill gaps, suggests bullet rewrites, and generates interview talking points — all specific to that role.",
      icon: "🎯",
    },
  ];

  return (
    <FadeInSection>
      <section
        style={{
          padding: "var(--section-padding) var(--section-padding-x)",
          background: "#ffffff",
        }}
      >
        <div style={{ textAlign: "center", marginBottom: "var(--space-11)" }}>
          <div
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "8px",
              background: "#fef2f2",
              border: "1px solid rgba(232,76,30,0.2)",
              padding: "4px 12px",
              borderRadius: "6px",
              fontSize: "11px",
              fontWeight: 700,
              letterSpacing: "1px",
              textTransform: "uppercase",
              color: "#e84c1e",
              marginBottom: "16px",
            }}
          >
            The Real Problem
          </div>
          <h2 className="heading-1" style={{ marginBottom: "12px" }}>
            Generic AI doesn't know <span style={{ color: "#e84c1e" }}>how hiring works</span>
          </h2>
          <p className="body" style={{ color: "#8a8070", maxWidth: "560px", margin: "0 auto" }}>
            Here's why most resume tools fail — and how we're different.
          </p>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: "24px", maxWidth: "900px", margin: "0 auto" }}>
          {items.map((item, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1 }}
              className="card-glow"
              style={{
                display: "grid",
                gridTemplateColumns: "1fr 1fr",
                gap: "24px",
                background: "#f5f0e8",
                borderRadius: "var(--radius-lg)",
                overflow: "hidden",
                transition: "transform 0.2s ease",
                border: "1.5px solid #d4cdc0",
              }}
              onMouseEnter={(e) => { e.currentTarget.style.transform = "translateY(-2px)"; }}
              onMouseLeave={(e) => { e.currentTarget.style.transform = "translateY(0)"; }}
            >
              {/* Problem side */}
              <div style={{ padding: "32px", borderRight: "1px solid #ede8df" }}>
                <div style={{ fontSize: "28px", marginBottom: "12px" }}>{item.icon}</div>
                <div
                  style={{
                    display: "inline-block",
                    background: "#fef2f2",
                    border: "1px solid rgba(232,76,30,0.2)",
                    padding: "2px 8px",
                    borderRadius: "4px",
                    fontSize: "10px",
                    fontWeight: 700,
                    textTransform: "uppercase",
                    letterSpacing: "1px",
                    color: "#e84c1e",
                    marginBottom: "10px",
                  }}
                >
                  Problem
                </div>
                <h4 className="heading-3" style={{ marginBottom: "8px" }}>{item.problem}</h4>
                <p style={{ fontSize: "13px", color: "#8a8070", lineHeight: "1.7", margin: 0 }}>{item.problemDesc}</p>
              </div>

              {/* Solution side */}
              <div style={{ padding: "32px", background: "#fff" }}>
                <div
                  style={{
                    display: "inline-block",
                    background: "#ecfdf5",
                    border: "1px solid rgba(5,150,105,0.2)",
                    padding: "2px 8px",
                    borderRadius: "4px",
                    fontSize: "10px",
                    fontWeight: 700,
                    textTransform: "uppercase",
                    letterSpacing: "1px",
                    color: "#059669",
                    marginBottom: "10px",
                  }}
                >
                  Solution
                </div>
                <h4 className="heading-3" style={{ marginBottom: "8px", color: "#059669" }}>{item.solution}</h4>
                <p style={{ fontSize: "13px", color: "#8a8070", lineHeight: "1.7", margin: 0 }}>{item.solutionDesc}</p>
              </div>
            </motion.div>
          ))}
        </div>
      </section>
    </FadeInSection>
  );
}
