import { motion } from "framer-motion";
import FadeInSection from "./FadeInSection";

const promises = [
  {
    icon: "🎯",
    title: "Know your exact ATS score",
    desc: "Not a vague 'looks good.' A real number out of 100 across 4 dimensions — Completeness, Writing, Format, and Content Depth.",
  },
  {
    icon: "🔁",
    title: "Semantic matching against any JD",
    desc: "Paste any job description. Our engine finds skill overlaps even when you use different words — no more manual keyword hunting.",
  },
  {
    icon: "✍️",
    title: "AI rewrites that sound like you",
    desc: "Every bullet rewrite keeps your voice while adding recruiter-friendly language, action verbs, and quantified impact.",
  },
  {
    icon: "🇮🇳",
    title: "Built for the Indian market",
    desc: "We understand TCS, Infosys, Razorpay, and Zepto. Your resume gets scored against what Indian recruiters actually look for.",
  },
];

export default function StatsSection() {
  return (
    <FadeInSection>
      <section
        style={{
          padding: "var(--section-padding) var(--section-padding-x)",
          background: "#0f0e0a",
          position: "relative",
          overflow: "hidden",
        }}
      >
        {/* Background glow */}
        <div
          style={{
            position: "absolute",
            top: "-200px",
            right: "-200px",
            width: "500px",
            height: "500px",
            borderRadius: "50%",
            background: "radial-gradient(circle, rgba(232,76,30,0.08) 0%, transparent 65%)",
            pointerEvents: "none",
          }}
        />
        <div
          style={{
            position: "absolute",
            bottom: "-150px",
            left: "-150px",
            width: "400px",
            height: "400px",
            borderRadius: "50%",
            background: "radial-gradient(circle, rgba(45,106,79,0.06) 0%, transparent 65%)",
            pointerEvents: "none",
          }}
        />

        <div style={{ position: "relative", zIndex: 1 }}>
          {/* Headline */}
          <div style={{ textAlign: "center", marginBottom: "56px" }}>
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
            >
              <div
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "8px",
                  background: "rgba(255,255,255,0.06)",
                  border: "1px solid rgba(255,255,255,0.1)",
                  padding: "6px 14px",
                  borderRadius: "8px",
                  fontSize: "11px",
                  fontWeight: 700,
                  letterSpacing: "2px",
                  textTransform: "uppercase",
                  color: "#e84c1e",
                  marginBottom: "20px",
                }}
              >
                <span style={{ width: "6px", height: "6px", background: "#e84c1e", borderRadius: "50%" }} />
                Here's What You Get
              </div>
              <h2
                className="heading-1"
                style={{ color: "#f5f0e8", marginBottom: "12px" }}
              >
                Stop guessing. <span style={{ color: "#e84c1e" }}>Start knowing.</span>
              </h2>
              <p
                className="body"
                style={{ color: "#6b7280", maxWidth: "520px", margin: "0 auto" }}
              >
                No fluff, no generic advice. Every scan delivers specific, actionable insights tailored to your resume and target role.
              </p>
            </motion.div>
          </div>

          {/* Promise cards */}
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(2, 1fr)",
              gap: "20px",
              maxWidth: "900px",
              margin: "0 auto",
            }}
          >
            {promises.map((item, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
                style={{
                  background: "rgba(255,255,255,0.03)",
                  border: "1px solid rgba(255,255,255,0.06)",
                  borderRadius: "16px",
                  padding: "28px 24px",
                  cursor: "default",
                  transition: "all 0.3s ease",
                }}
                whileHover={{
                  background: "rgba(255,255,255,0.06)",
                  borderColor: "rgba(232,76,30,0.3)",
                  y: -2,
                }}
              >
                <div style={{ fontSize: "32px", marginBottom: "14px" }}>{item.icon}</div>
                <h4
                  style={{
                    fontFamily: "var(--font-display)",
                    fontWeight: 700,
                    fontSize: "16px",
                    color: "#f5f0e8",
                    marginBottom: "8px",
                  }}
                >
                  {item.title}
                </h4>
                <p style={{ fontSize: "13px", color: "#6b7280", lineHeight: "1.7", margin: 0 }}>
                  {item.desc}
                </p>
              </motion.div>
            ))}
          </div>

          {/* Bottom CTA tag */}
          <motion.div
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            transition={{ delay: 0.5 }}
            style={{
              textAlign: "center",
              marginTop: "40px",
            }}
          >
            <div
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "8px",
                fontSize: "13px",
                color: "#6b7280",
              }}
            >
              <span style={{ color: "#059669" }}>✓</span>
              No credit card needed for your first scan
              <span style={{ color: "#6b7280" }}>·</span>
              <span style={{ color: "#059669" }}>✓</span>
              Results in under 30 seconds
            </div>
          </motion.div>
        </div>
      </section>
    </FadeInSection>
  );
}
