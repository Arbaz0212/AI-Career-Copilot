import { Upload, ScanSearch, Trophy } from "lucide-react";
import FadeInSection from "./FadeInSection";

export default function HowItWorks() {
  const steps = [
    {
      icon: <Upload size={40} />,
      title: "Upload Resume",
      description:
        "Upload your resume in PDF or DOCX format and let our AI analyze it instantly.",
    },
    {
      icon: <ScanSearch size={40} />,
      title: "AI ATS Analysis",
      description:
        "Receive ATS score, missing keywords, formatting insights and recruiter-focused recommendations.",
    },
    {
      icon: <Trophy size={40} />,
      title: "Get Interview Ready",
      description:
        "Optimize your resume and significantly improve your chances of getting shortlisted.",
    },
  ];

  return (
    <FadeInSection>
      <section
        id="how"
        style={{
          padding: "var(--section-padding) var(--section-padding-x)",
          background: "#ffffff",
        }}
      >
        <h1
          className="heading-1"
          style={{
            textAlign: "center",
            marginBottom: "16px",
          }}
        >
          How It Works
        </h1>

        <p
          style={{
            textAlign: "center",
            color: "#8a8070",
            marginBottom: "60px",
            fontSize: "16px",
          }}
        >
          Three simple steps to improve your hiring chances
        </p>

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(3,1fr)",
            gap: "30px",
          }}
        >
          {steps.map((step, index) => (
            <div
              key={index}
              className="card card-glow"
              style={{
                padding: "48px 36px",
                textAlign: "center",
                cursor: "default",
                borderRadius: "var(--radius-lg)",
                transition: "transform 0.2s ease",
              }}
              onMouseEnter={(e) => { e.currentTarget.style.transform = "translateY(-3px)"; }}
              onMouseLeave={(e) => { e.currentTarget.style.transform = "translateY(0)"; }}
            >
              <div className="icon-pulse"
                style={{
                  display: "flex",
                  justifyContent: "center",
                  marginBottom: "24px",
                  color: "#e84c1e",
                }}
              >
                {step.icon}
              </div>

              <h3
                className="heading-3"
                style={{
                  marginBottom: "12px",
                }}
              >
                {step.title}
              </h3>

              <p
                style={{
                  color: "#8a8070",
                  lineHeight: "1.7",
                  fontSize: "14px",
                  margin: 0,
                }}
              >
                {step.description}
              </p>
            </div>
          ))}
        </div>
      </section>
    </FadeInSection>
  );
}
