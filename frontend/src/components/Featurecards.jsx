import FadeInSection from "./FadeInSection";
import { ScanSearch, FileText, Mic } from "lucide-react";

export default function Featurecards() {
  const features = [
    {
      icon: <ScanSearch size={36} />,
      title: "ATS Scanner",
      description:
        "Analyze your resume against modern ATS systems used by recruiters and hiring managers.",
    },
    {
      icon: <FileText size={36} />,
      title: "Resume Optimizer",
      description:
        "Improve formatting, keywords, structure and recruiter visibility with AI-powered suggestions.",
    },
    {
      icon: <Mic size={36} />,
      title: "Interview Copilot",
      description:
        "Generate role-specific interview questions and prepare confidently for interviews.",
    },
  ];

  return (
    <FadeInSection>
      <section
        id="features"
        style={{
          padding: "var(--section-padding) var(--section-padding-x)",
          background: "#f6f2eb",
        }}
      >
        <h1
          className="heading-1"
          style={{
            textAlign: "center",
            marginBottom: "var(--space-11)",
          }}
        >
          Everything You Need To Get Hired
        </h1>

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(3,1fr)",
            gap: "24px",
          }}
        >
          {features.map((feature, index) => (
            <div
              key={index}
              className="card card-glow"
              style={{
                padding: "36px",
                borderRadius: "var(--radius-lg)",
                cursor: "default",
                transition: "transform 0.2s ease",
              }}
              onMouseEnter={(e) => { e.currentTarget.style.transform = "translateY(-3px)"; }}
              onMouseLeave={(e) => { e.currentTarget.style.transform = "translateY(0)"; }}
            >
              <div className="icon-pulse" style={{ color: "#e84c1e", marginBottom: "16px" }}>
                {feature.icon}
              </div>

              <h3
                className="heading-3"
                style={{
                  marginBottom: "12px",
                }}
              >
                {feature.title}
              </h3>

              <p
                style={{
                  color: "#8a8070",
                  lineHeight: "1.7",
                  fontSize: "14px",
                  margin: 0,
                }}
              >
                {feature.description}
              </p>
            </div>
          ))}
        </div>
      </section>
    </FadeInSection>
  );
}
