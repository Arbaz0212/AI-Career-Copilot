import FadeInSection from "./FadeInSection";

const features = [
  { label: "ATS Scoring (4 dimensions)", us: true, others: false },
  { label: "Semantic skill matching", us: true, others: false },
  { label: "Industry-aware scoring weights", us: true, others: false },
  { label: "AI bullet rewrites", us: true, others: "⚠️" },
  { label: "JD match analysis", us: true, others: false },
  { label: "Interview preparation kit", us: true, others: false },
  { label: "Personalised cover letters", us: true, others: "⚠️" },
  { label: "Indian market focus", us: true, others: false },
  { label: "Free scan — no credit card", us: true, others: false },
  { label: "Works when AI is unavailable", us: true, others: false },
];

export default function ComparisonTable() {
  return (
    <FadeInSection>
      <section
        style={{
          padding: "var(--section-padding) var(--section-padding-x)",
          background: "#f5f0e8",
        }}
      >
        <div style={{ textAlign: "center", marginBottom: "var(--space-11)" }}>
          <div
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "8px",
              background: "#0f0e0a",
              padding: "4px 12px",
              borderRadius: "6px",
              fontSize: "10px",
              fontWeight: 700,
              letterSpacing: "1px",
              textTransform: "uppercase",
              color: "#f5f0e8",
              marginBottom: "16px",
            }}
          >
            Why We're Different
          </div>
          <h2 className="heading-1" style={{ marginBottom: "12px" }}>
            See what you get <span style={{ color: "#e84c1e" }}>with AI Career Copilot</span>
          </h2>
          <p className="body" style={{ color: "#8a8070", maxWidth: "500px", margin: "0 auto" }}>
            Most resume tools only do basic keyword matching. Here's what makes us different.
          </p>
        </div>

        {/* Mobile view */}
        <div style={{ display: "none" }} className="comparison-mobile">
          <div
            style={{
              background: "#fff",
              borderRadius: "var(--radius-lg)",
              border: "1.5px solid #d4cdc0",
              overflow: "hidden",
            }}
          >
            {features.map((f, i) => (
              <div
                key={i}
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  padding: "14px 18px",
                  borderBottom: i < features.length - 1 ? "1px solid #ede8df" : "none",
                  background: i % 2 === 0 ? "#fff" : "#faf8f5",
                }}
              >
                <span style={{ fontSize: "13px", color: "#0f0e0a", fontWeight: 500, flex: 1 }}>{f.label}</span>
                <div style={{ display: "flex", gap: "12px", alignItems: "center", flexShrink: 0 }}>
                  <div style={{ textAlign: "center" }}>
                    <div style={{ fontSize: "9px", fontWeight: 700, color: "#8a8070", marginBottom: "2px", letterSpacing: "0.5px" }}>COPILOT</div>
                    <span style={{ fontSize: "16px" }}>{f.us === true ? "✅" : f.us}</span>
                  </div>
                  <div style={{ textAlign: "center" }}>
                    <div style={{ fontSize: "9px", fontWeight: 700, color: "#8a8070", marginBottom: "2px", letterSpacing: "0.5px" }}>OTHERS</div>
                    <span style={{ fontSize: "16px" }}>{f.others === true ? "✅" : f.others}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Desktop table */}
        <div
          style={{
            maxWidth: "800px",
            margin: "0 auto",
            borderRadius: "var(--radius-lg)",
            border: "1.5px solid #d4cdc0",
            overflow: "hidden",
          }}
          className="comparison-desktop"
        >
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "13px" }}>
            <thead>
              <tr style={{ background: "#0f0e0a" }}>
                <th style={{ padding: "14px 20px", textAlign: "left", color: "#f5f0e8", fontFamily: "var(--font-display)", fontWeight: 700, fontSize: "13px" }}>
                  Feature
                </th>
                <th style={{ padding: "14px 20px", textAlign: "center", color: "#e84c1e", fontFamily: "var(--font-display)", fontWeight: 700, fontSize: "13px" }}>
                  AI Career Copilot
                </th>
                <th style={{ padding: "14px 20px", textAlign: "center", color: "#6b7280", fontFamily: "var(--font-display)", fontWeight: 700, fontSize: "13px" }}>
                  Other Tools
                </th>
              </tr>
            </thead>
            <tbody>
              {features.map((f, i) => (
                <tr
                  key={i}
                  style={{
                    background: i % 2 === 0 ? "#fff" : "#faf8f5",
                    borderBottom: "1px solid #ede8df",
                    transition: "background 0.15s ease",
                    cursor: "default",
                  }}
                  onMouseEnter={(e) => { e.currentTarget.style.background = "#f5f0e8"; }}
                  onMouseLeave={(e) => { e.currentTarget.style.background = i % 2 === 0 ? "#fff" : "#faf8f5"; }}
                >
                  <td style={{ padding: "12px 20px", fontWeight: 500, color: "#0f0e0a" }}>{f.label}</td>
                  <td style={{ padding: "12px 20px", textAlign: "center", fontSize: "18px", background: "rgba(232,76,30,0.03)", transition: "background 0.15s ease" }}
                    onMouseEnter={(e) => { e.currentTarget.style.background = "rgba(232,76,30,0.08)"; }}
                    onMouseLeave={(e) => { e.currentTarget.style.background = "rgba(232,76,30,0.03)"; }}
                  >
                    {f.us === true ? "✅" : f.us}
                  </td>
                  <td style={{ padding: "12px 20px", textAlign: "center", fontSize: "18px", color: "#8a8070" }}>
                    {f.others === true ? "✅" : f.others === false ? "❌" : f.others}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <style>{`
          @media (max-width: 860px) {
            .comparison-desktop { display: none !important; }
            .comparison-mobile { display: block !important; }
          }
        `}</style>

        <div style={{ textAlign: "center", marginTop: "24px" }}>
          <p style={{ fontSize: "12px", color: "#8a8070", margin: 0 }}>
            ✅ — Available &nbsp;·&nbsp; ⚠️ — Limited &nbsp;·&nbsp; ❌ — Not available
          </p>
        </div>
      </section>
    </FadeInSection>
  );
}
