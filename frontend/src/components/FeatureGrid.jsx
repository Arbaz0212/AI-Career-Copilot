import FadeInSection from "./FadeInSection";

const features = [
  { icon: "📄", title: "Upload Resume", desc: "PDF or DOCX in seconds", color: "#e84c1e" },
  { icon: "🎯", title: "Get ATS Score", desc: "4-dimension analysis with grade", color: "#059669" },
  { icon: "🔍", title: "Find Keyword Gaps", desc: "Missing terms costing you interviews", color: "#d97706" },
  { icon: "✍️", title: "AI Bullet Rewrites", desc: "Stronger action verbs, quantified impact", color: "#e84c1e" },
  { icon: "📊", title: "Section Breakdown", desc: "Summary, Skills, Experience scored", color: "#059669" },
  { icon: "💼", title: "JD Match", desc: "Semantic alignment with any job", color: "#d97706" },
  { icon: "💬", title: "Interview Kit", desc: "Talking points + tech questions", color: "#e84c1e" },
  { icon: "✉️", title: "Cover Letter", desc: "Personalised per company + role", color: "#059669" },
];

export default function FeatureGrid() {
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
            What you get with <span style={{ color: "#e84c1e" }}>every scan</span>
          </h2>
          <p className="body" style={{ color: "#8a8070", maxWidth: "500px", margin: "0 auto" }}>
            8 powerful features in one platform — from ATS scoring to AI cover letters.
          </p>
        </div>

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(4, 1fr)",
            gap: "16px",
          }}
        >
          {features.map((f, i) => (
            <div
              key={i}
              className="card card-glow"
              style={{
                padding: "28px 24px",
                borderRadius: "var(--radius-md)",
                cursor: "default",
                textAlign: "center",
                borderTop: `3px solid ${f.color}`,
                transition: "transform 0.2s ease",
              }}
              onMouseEnter={(e) => { e.currentTarget.style.transform = "translateY(-3px)"; }}
              onMouseLeave={(e) => { e.currentTarget.style.transform = "translateY(0)"; }}
            >
              <div className="icon-pulse" style={{ fontSize: "36px", marginBottom: "12px" }}>{f.icon}</div>
              <h4 className="heading-3" style={{ marginBottom: "6px", fontSize: "15px" }}>{f.title}</h4>
              <p style={{ fontSize: "12px", color: "#8a8070", margin: 0, lineHeight: "1.5" }}>{f.desc}</p>
            </div>
          ))}
        </div>
      </section>
    </FadeInSection>
  );
}
