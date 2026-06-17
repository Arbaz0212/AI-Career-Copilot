import FadeInSection from "./FadeInSection";
import { ShieldCheck, Brain, Search, Target, Zap, Lock } from "lucide-react";

export default function WhyChooseUs() {
  const features = [
    { icon: <Target size={32} />, title: "ATS Optimization" },
    { icon: <Brain size={32} />, title: "AI Resume Review" },
    { icon: <Search size={32} />, title: "Keyword Matching" },
    { icon: <Zap size={32} />, title: "Fast Analysis" },
    { icon: <ShieldCheck size={32} />, title: "Interview Copilot" },
    { icon: <Lock size={32} />, title: "Privacy First" },
  ];

  return (
    <FadeInSection>
      <section
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
          Why AI Career Copilot
        </h1>

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(3,1fr)",
            gap: "20px",
          }}
        >
          {features.map((feature, index) => (
            <div
              key={index}
              className="card card-glow"
              style={{
                padding: "32px",
                textAlign: "center",
                borderRadius: "var(--radius-lg)",
                cursor: "default",
                transition: "transform 0.2s ease",
              }}
              onMouseEnter={(e) => { e.currentTarget.style.transform = "translateY(-3px)"; }}
              onMouseLeave={(e) => { e.currentTarget.style.transform = "translateY(0)"; }}
            >
              <div
                className="icon-pulse"
                style={{
                  display: "flex",
                  justifyContent: "center",
                  marginBottom: "16px",
                  color: "#e84c1e",
                }}
              >
                {feature.icon}
              </div>
              <h4 className="heading-3" style={{ margin: 0 }}>{feature.title}</h4>
            </div>
          ))}
        </div>
      </section>
    </FadeInSection>
  );
}
