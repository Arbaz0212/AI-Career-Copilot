import { useState, useEffect } from "react";
import { User, UserPlus, Menu, X } from "lucide-react";

const navbarMobileStyles = `
@keyframes slideDown { from { opacity: 0; transform: translateY(-8px); } to { opacity: 1; transform: translateY(0); } }
@media (max-width: 860px) {
  nav > div { padding: 14px 20px !important; flex-wrap: nowrap !important; gap: 0 !important; }
  nav h2 { font-size: 17px !important; }
  nav a { display: none !important; }
  nav button { padding: 10px 14px !important; font-size: 13px !important; min-height: 44px; }
  .nav-desktop-links, .nav-desktop-buttons { display: none !important; }
  .nav-hamburger { display: flex !important; }
  .nav-mobile-menu {
    display: flex !important;
    position: fixed;
    top: 62px;
    left: 0;
    right: 0;
    background: rgba(246,242,235,0.98);
    backdrop-filter: blur(16px);
    -webkit-backdrop-filter: blur(16px);
    border-bottom: 1px solid #e5e5e5;
    flex-direction: column;
    padding: 16px 20px 20px;
    z-index: 999;
    animation: slideDown 0.2s ease both;
  }
  .nav-mobile-menu a, .nav-mobile-menu button {
    padding: 14px 0 !important;
    font-size: 15px !important;
    min-height: 48px;
    border-bottom: 1px solid #ede8df;
    width: 100%;
    text-align: left;
  }
  .nav-mobile-menu a { text-decoration: none; color: #111; font-weight: 500; }
  .nav-mobile-menu button:last-child { border-bottom: none; }
  .nav-mobile-menu .mobile-login-btn {
    background: transparent !important;
    border: 1px solid #111 !important;
    border-radius: 10px !important;
    justify-content: center;
    margin-top: 8px;
  }
  .nav-mobile-menu .mobile-signup-btn {
    background: #111 !important;
    color: #fff !important;
    border: none !important;
    border-radius: 10px !important;
    justify-content: center;
  }
}
@media (min-width: 861px) {
  .nav-hamburger { display: none !important; }
  .nav-mobile-menu { display: none !important; }
}
`;

export default function Navbar({ openAuthModal }) {
  const [menuOpen, setMenuOpen] = useState(false);

  if (typeof document !== "undefined" && !document.getElementById("navbar-mobile")) {
    const s = document.createElement("style");
    s.id = "navbar-mobile";
    s.textContent = navbarMobileStyles;
    document.head.appendChild(s);
  }

  const handleNavClick = (href) => {
    setMenuOpen(false);
    if (href.startsWith("#")) {
      const el = document.querySelector(href);
      if (el) el.scrollIntoView({ behavior: "smooth" });
    }
  };

  const handleAuth = () => {
    setMenuOpen(false);
    openAuthModal();
  };

  const navLinks = [
    { label: "Features", href: "#features" },
    { label: "How It Works", href: "#how" },
    { label: "FAQ", href: "#faq" },
  ];

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

        {/* Desktop nav */}
        <div
          className="nav-desktop-links"
          style={{
            display: "flex",
            gap: "35px",
            alignItems: "center",
          }}
        >
          {navLinks.map((item) => (
            <a
              key={item.label}
              href={item.href}
              onClick={() => handleNavClick(item.href)}
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
              {item.label}
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
        </div>

        {/* Desktop buttons */}
        <div
          className="nav-desktop-buttons"
          style={{
            display: "flex",
            gap: "12px",
            alignItems: "center",
          }}
        >
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

        {/* Hamburger */}
        <button
          className="nav-hamburger"
          onClick={() => setMenuOpen(!menuOpen)}
          style={{
            display: "none",
            background: "none",
            border: "none",
            cursor: "pointer",
            padding: "8px",
            color: "#111",
          }}
        >
          {menuOpen ? <X size={24} /> : <Menu size={24} />}
        </button>
      </div>

      {/* Mobile dropdown menu */}
      {menuOpen && (
        <div className="nav-mobile-menu">
          {navLinks.map((item) => (
            <a key={item.label} href={item.href} onClick={() => handleNavClick(item.href)}>
              {item.label}
            </a>
          ))}
          <button className="mobile-login-btn" onClick={handleAuth}>
            <User size={18} style={{ marginRight: "8px" }} /> Login
          </button>
          <button className="mobile-signup-btn" onClick={handleAuth}>
            <UserPlus size={18} style={{ marginRight: "8px" }} /> Sign Up
          </button>
        </div>
      )}
    </nav>
  );
}