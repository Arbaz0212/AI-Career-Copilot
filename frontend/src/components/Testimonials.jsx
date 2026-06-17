import FadeInSection from "./FadeInSection";

export default function Testimonials() {
  const testimonials = [
    {
      name: "Software Engineer",
      role: "Placed at Razorpay",
      text: "Improved my ATS score from 48% to 87% within a few minutes. The keyword gap analysis showed me exactly what I was missing.",
    },
    {
      name: "Data Analyst",
      role: "Placed at TCS",
      text: "Finally understood why recruiters were rejecting my resume. The section breakdown was eye-opening.",
    },
    {
      name: "Frontend Developer",
      role: "Placed at Zepto",
      text: "The ATS suggestions were extremely actionable and useful. Got my first interview call within a week of applying.",
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
        <h1
          className="heading-1"
          style={{
            textAlign: "center",
            marginBottom: "var(--space-11)",
          }}
        >
          What Users Say
        </h1>

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(3,1fr)",
            gap: "24px",
          }}
        >
          {testimonials.map((item, index) => (
            <div
              key={index}
              className="card card-glow"
              style={{
                padding: "32px",
                borderRadius: "var(--radius-lg)",
                cursor: "default",
                transition: "transform 0.2s ease",
              }}
              onMouseEnter={(e) => { e.currentTarget.style.transform = "translateY(-3px)"; }}
              onMouseLeave={(e) => { e.currentTarget.style.transform = "translateY(0)"; }}
            >
              <div className="icon-pulse" style={{ fontSize: "18px", color: "#c9922a", marginBottom: "16px", letterSpacing: "2px" }}>
                ★★★★★
              </div>

              <p
                style={{
                  lineHeight: "1.7",
                  color: "#555",
                  fontSize: "14px",
                  margin: "0 0 20px",
                  fontStyle: "italic",
                }}
              >
                "{item.text}"
              </p>

              <div>
                <div style={{ fontWeight: 700, fontSize: "14px" }}>{item.name}</div>
                <div style={{ fontSize: "12px", color: "#8a8070", marginTop: "2px" }}>{item.role}</div>
              </div>
            </div>
          ))}
        </div>
      </section>
    </FadeInSection>
  );
}
