import { User, UserPlus } from "lucide-react";

const navbarMobileStyles = `
@media (max-width: 860px) {
  nav > div { padding: 16px 20px !important; flex-wrap: wrap !important; gap: 12px !important; }
  nav > div > div { gap: 12px !important; flex-wrap: wrap !important; }
  nav h2 { font-size: 16px !important; }
  nav a { display: none !important; }
  nav button { padding: 10px 14px !important; font-size: 13px !important; min-height: 44px; }
}
`;

export default function Navbar({ openAuthModal }) {
  if (typeof document !== "undefined" && !document.getElementById("navbar-mobile")) {
    const s = document.createElement("style");
    s.id = "navbar-mobile";
    s.textContent = navbarMobileStyles;
    document.head.appendChild(s);
  }

  return (
    <nav
      style={{
        position: "sticky",
        top: 0,
        zIndex: 1000,
        background: "rgba(246,242,235,0.95)",
        backdropFilter: "blur(10px)",
        borderBottom: "1px solid #e5e5e5",
      }}
    >
      <div
        style={{
          maxWidth: "1400px",
          margin: "0 auto",
          padding: "20px 10%",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
        }}
      >
        <h2
          style={{
            margin: 0,
            fontWeight: "700",
            cursor: "pointer",
            fontFamily: "'Clash Display', sans-serif",
            fontSize: "20px",
            letterSpacing: "-0.5px",
          }}
        >
          AI Career <span style={{ color: "#e84c1e", fontStyle: "italic" }}>Copilot</span>
        </h2>

        <div
          style={{
            display: "flex",
            gap: "35px",
            alignItems: "center",
          }}
        >
          {["Features", "How It Works", "FAQ"].map((item) => (
            <a
              key={item}
              href={item === "Features" ? "#features" : item === "How It Works" ? "#how" : "#faq"}
              style={{
                textDecoration: "none",
                color: "#111",
                fontSize: "14px",
                fontWeight: 500,
                position: "relative",
                paddingBottom: "2px",
              }}
              onMouseEnter={(e) => (e.target.style.color = "#e84c1e")}
              onMouseLeave={(e) => (e.target.style.color = "#111")}
            >
              {item}
              <span
                style={{
                  position: "absolute",
                  bottom: 0,
                  left: 0,
                  width: "100%",
                  height: "1.5px",
                  background: "#e84c1e",
                  transform: "scaleX(0)",
                  transition: "transform 0.2s ease",
                  transformOrigin: "left",
                }}
                onMouseEnter={(e) => (e.target.style.transform = "scaleX(1)")}
                onMouseLeave={(e) => (e.target.style.transform = "scaleX(0)")}
              />
            </a>
          ))}

          <button
            onClick={openAuthModal}
            style={{
              padding: "12px 24px",
              border: "1px solid #111",
              background: "transparent",
              borderRadius: "10px",
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              gap: "8px",
            }}
          >
            <User size={18} />
            Login
          </button>

          <button
            onClick={openAuthModal}
            style={{
              padding: "12px 24px",
              border: "none",
              background: "#111",
              color: "white",
              borderRadius: "10px",
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              gap: "8px",
            }}
          >
            <UserPlus size={18} />
            Sign Up
          </button>
        </div>
      </div>
    </nav>
  );
}