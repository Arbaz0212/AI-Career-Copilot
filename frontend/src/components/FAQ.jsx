import { useState } from "react";
import FadeInSection from "./FadeInSection";

export default function FAQ() {
  const [openIndex, setOpenIndex] = useState(null);

  const faqs = [
    {
      question: "Is AI Career Copilot free to try?",
      answer:
        "Yes. Every user gets one free ATS resume analysis after signup. No credit card required. You can see your full score, breakdown, and AI feedback before deciding to purchase.",
    },
    {
      question: "How does ATS scoring work?",
      answer:
        "We analyze keywords, formatting, readability, ATS compatibility, and recruiter expectations across 4 dimensions — completeness, writing quality, ATS format, and content depth. Each dimension is scored 0-100 and weighted for a final grade.",
    },
    {
      question: "Which resume formats are supported?",
      answer:
        "Currently PDF and DOCX formats are fully supported. We extract text preserving layout, section headers, and bullet points for accurate analysis.",
    },
    {
      question: "Do you store my resume?",
      answer:
        "Your resume is securely processed and never sold or shared with third parties. You can delete your data at any time from your account settings.",
    },
  ];

  return (
    <FadeInSection>
      <section
        id="faq"
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
          Frequently Asked Questions
        </h1>

        <div style={{ maxWidth: "700px", margin: "0 auto" }}>
          {faqs.map((faq, index) => (
            <div
              key={index}
              className="card card-glow"
              style={{
                marginBottom: "12px",
                borderRadius: "var(--radius-md)",
                cursor: "pointer",
                overflow: "hidden",
                transition: "transform 0.2s ease",
              }}
              onClick={() => setOpenIndex(openIndex === index ? null : index)}
              onMouseEnter={(e) => { e.currentTarget.style.transform = "translateY(-2px)"; }}
              onMouseLeave={(e) => { e.currentTarget.style.transform = "translateY(0)"; }}
            >
              <div
                style={{
                  padding: "20px 24px",
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  gap: "16px",
                }}
              >
                <h4
                  style={{
                    fontSize: "15px",
                    fontWeight: 600,
                    margin: 0,
                    flex: 1,
                    fontFamily: "var(--font-display)",
                  }}
                >
                  {faq.question}
                </h4>
                <span
                  style={{
                    fontSize: "18px",
                    color: "#e84c1e",
                    transform: openIndex === index ? "rotate(45deg)" : "rotate(0)",
                    transition: "transform 0.2s",
                    flexShrink: 0,
                  }}
                >
                  +
                </span>
              </div>
              {openIndex === index && (
                <div
                  style={{
                    padding: "0 24px 20px",
                    color: "#8a8070",
                    fontSize: "14px",
                    lineHeight: "1.7",
                  }}
                >
                  {faq.answer}
                </div>
              )}
            </div>
          ))}
        </div>
      </section>
    </FadeInSection>
  );
}
