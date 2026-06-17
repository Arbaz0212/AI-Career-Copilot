import FadeInSection from "./FadeInSection";

export default function CTA({ openAuthModal }) {
  return (
    <FadeInSection>
      <section
        style={{
          padding: "100px var(--section-padding-x)",
          background: "#111827",
          color: "white",
          textAlign: "center",
        }}
      >
        <h1
          className="display-2"
          style={{
            marginBottom: "16px",
          }}
        >
          Ready To Beat ATS?
        </h1>

        <p
          style={{
            fontSize: "clamp(16px, 3vw, 20px)",
            color: "#d1d5db",
            maxWidth: "600px",
            margin: "0 auto 36px auto",
            lineHeight: "1.7",
          }}
        >
          Get your first ATS analysis free and discover exactly what recruiters
          and applicant tracking systems see before you apply.
        </p>

        <button
          onClick={openAuthModal}
          className="btn btn-lg"
          style={{
            background: "#ffffff",
            color: "#111827",
            animation: "ctaPulse 2s ease-in-out infinite",
          }}
          onMouseEnter={(e) => { e.currentTarget.style.animation = "none"; e.currentTarget.style.transform = "scale(1.03)"; }}
          onMouseLeave={(e) => { e.currentTarget.style.animation = "ctaPulse 2s ease-in-out infinite"; e.currentTarget.style.transform = "scale(1)"; }}
        >
          Try Free Analysis →
        </button>
        <style>{`@keyframes ctaPulse { 0%,100% { box-shadow: 0 0 0 0 rgba(255,255,255,0.15); } 50% { box-shadow: 0 0 0 12px rgba(255,255,255,0); } }`}</style>
      </section>
    </FadeInSection>
  );
}
