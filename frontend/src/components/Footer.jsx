export default function Footer() {
  return (
    <footer
      style={{
        background: "#0f172a",
        color: "white",
        padding: "80px 10%",
      }}
    >
      <div
        style={{
          maxWidth: "1200px",
          margin: "0 auto",
        }}
      >
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "2fr 1fr 1fr 1fr",
            gap: "40px",
            marginBottom: "48px",
          }}
        >
          {/* Brand */}
          <div>
            <h2
              style={{
                fontFamily: "var(--font-display)",
                fontWeight: 700,
                fontSize: "20px",
                marginBottom: "12px",
              }}
            >
              AI Career <span style={{ color: "#e84c1e" }}>Copilot</span>
            </h2>
            <p
              style={{
                color: "#94a3b8",
                lineHeight: "28px",
                fontSize: "14px",
                maxWidth: "300px",
              }}
            >
              AI-powered ATS resume scanner built for students, freshers and job seekers who want more interview calls.
            </p>
          </div>

          {/* Product */}
          <div>
            <h4 style={{ fontSize: "12px", fontWeight: 700, letterSpacing: "2px", textTransform: "uppercase", color: "#475569", marginBottom: "16px" }}>
              Product
            </h4>
            <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
              {["Resume Reviewer", "JD Match Analyzer", "JobSense AI", "Cover Letters"].map((item) => (
                <a
                  key={item}
                  href="#"
                  style={{ color: "#94a3b8", fontSize: "14px", cursor: "pointer", transition: "color 0.2s" }}
                  onMouseEnter={(e) => (e.target.style.color = "#fff")}
                  onMouseLeave={(e) => (e.target.style.color = "#94a3b8")}
                >
                  {item}
                </a>
              ))}
            </div>
          </div>

          {/* Company */}
          <div>
            <h4 style={{ fontSize: "12px", fontWeight: 700, letterSpacing: "2px", textTransform: "uppercase", color: "#475569", marginBottom: "16px" }}>
              Company
            </h4>
            <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
              {[
                { label: "About", href: "#" },
                { label: "Contact", href: "/contact" },
              ].map((item) => (
                <a
                  key={item.label}
                  href={item.href}
                  style={{ color: "#94a3b8", fontSize: "14px", cursor: "pointer", transition: "color 0.2s", textDecoration: "none" }}
                  onMouseEnter={(e) => (e.target.style.color = "#fff")}
                  onMouseLeave={(e) => (e.target.style.color = "#94a3b8")}
                >
                  {item.label}
                </a>
              ))}
            </div>
          </div>

          {/* Legal */}
          <div>
            <h4 style={{ fontSize: "12px", fontWeight: 700, letterSpacing: "2px", textTransform: "uppercase", color: "#475569", marginBottom: "16px" }}>
              Legal
            </h4>
            <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
              {[
                { label: "Privacy Policy", href: "/privacy" },
                { label: "Terms of Service", href: "/terms" },
                { label: "Refund Policy", href: "/refund" },
                { label: "Shipping Policy", href: "/shipping" },
                { label: "Contact Us", href: "/contact" },
              ].map((item) => (
                <a
                  key={item.label}
                  href={item.href}
                  style={{ color: "#94a3b8", fontSize: "14px", cursor: "pointer", transition: "color 0.2s", textDecoration: "none" }}
                  onMouseEnter={(e) => (e.target.style.color = "#fff")}
                  onMouseLeave={(e) => (e.target.style.color = "#94a3b8")}
                >
                  {item.label}
                </a>
              ))}
            </div>
          </div>
        </div>

        <hr style={{ border: "1px solid #1e293b", marginBottom: "32px" }} />

        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            flexWrap: "wrap",
            gap: "16px",
          }}
        >
          <p style={{ color: "#475569", fontSize: "13px" }}>
            © 2026 AI Career Copilot. All rights reserved.
          </p>
          <div style={{ display: "flex", gap: "16px" }}>
            <a
              href="mailto:support.aicareercopilot@gmail.com"
              style={{
                width: "36px",
                height: "36px",
                borderRadius: "50%",
                background: "#1e293b",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: "14px",
                color: "#94a3b8",
                cursor: "pointer",
                transition: "all 0.2s",
                textDecoration: "none",
              }}
              onMouseEnter={(e) => {
                e.target.style.background = "#e84c1e";
                e.target.style.color = "#fff";
              }}
              onMouseLeave={(e) => {
                e.target.style.background = "#1e293b";
                e.target.style.color = "#94a3b8";
              }}
            >
              📧
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
}
