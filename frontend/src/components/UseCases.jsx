import { motion } from "framer-motion";
import FadeInSection from "./FadeInSection";

const cases = [
  {
    emoji: "👩‍🎓",
    title: "Students & Freshers",
    desc: "No work experience? We help you highlight projects, internships, and academic achievements to build a compelling resume from scratch.",
    wins: ["ATS-optimised fresher templates", "Project description rewrites", "Skill gap analysis for entry-level roles"],
    color: "#e84c1e",
  },
  {
    emoji: "👨‍💻",
    title: "Software Engineers",
    desc: "Tech roles are the most competitive. Our semantic matching engine finds exact skill overlaps and suggests technologies to learn next.",
    wins: ["250+ tech skill database", "Semantic keyword matching", "Role-specific interview prep"],
    color: "#059669",
  },
  {
    emoji: "📈",
    title: "Career Switchers",
    desc: "Switching industries? We identify transferable skills and show you exactly how to reframe your experience for a new domain.",
    wins: ["Industry-aware scoring", "Transferable skill detection", "Cover letter tailored to new field"],
    color: "#d97706",
  },
  {
    emoji: "👔",
    title: "Mid-Career Professionals",
    desc: "5-15 years in? Your resume needs to show impact, not just responsibilities. Our content depth scoring catches weak bullets.",
    wins: ["Quantified achievement rewriting", "Seniority-appropriate language", "Peer comparison vs similar profiles"],
    color: "#e84c1e",
  },
];

export default function UseCases() {
  return (
    <FadeInSection>
      <section
        style={{
          padding: "var(--section-padding) var(--section-padding-x)",
          background: "#f5f0e8",
        }}
      >
        <div style={{ textAlign: "center", marginBottom: "var(--space-11)" }}>
          <h2 className="heading-1" style={{ marginBottom: "12px" }}>
            Built for <span style={{ color: "#e84c1e" }}>every stage</span> of your career
          </h2>
          <p className="body" style={{ color: "#8a8070", maxWidth: "520px", margin: "0 auto" }}>
            Whether you're a fresher or a senior professional — our AI adapts to your experience level.
          </p>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: "20px" }}>
          {cases.map((item, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.08 }}
              className="card card-glow"
              style={{
                padding: "28px",
                borderRadius: "var(--radius-lg)",
                cursor: "default",
                borderTop: `3px solid ${item.color}`,
                transition: "transform 0.2s ease",
              }}
              onMouseEnter={(e) => { e.currentTarget.style.transform = "translateY(-3px)"; }}
              onMouseLeave={(e) => { e.currentTarget.style.transform = "translateY(0)"; }}
            >
              <div style={{ display: "flex", alignItems: "flex-start", gap: "16px" }}>
                <div
                  style={{
                    fontSize: "36px",
                    width: "56px",
                    height: "56px",
                    background: "#f5f0e8",
                    borderRadius: "14px",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    flexShrink: 0,
                    border: "1px solid #ede8df",
                    transition: "transform 0.2s ease",
                  }}
                  className="icon-pulse"
                >
                  {item.emoji}
                </div>
                <div>
                  <h4 className="heading-3" style={{ marginBottom: "8px" }}>{item.title}</h4>
                  <p style={{ fontSize: "13px", color: "#8a8070", lineHeight: "1.7", marginBottom: "14px" }}>{item.desc}</p>
                  <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                    {item.wins.map((w, j) => (
                      <div key={j} style={{ display: "flex", alignItems: "center", gap: "8px", fontSize: "12px", color: "#555" }}>
                        <span style={{ color: item.color, fontWeight: 700 }}>✓</span>
                        {w}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </section>
    </FadeInSection>
  );
}
