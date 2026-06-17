import { useEffect, useState } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import API from "../../services/api";

export default function GoogleCallback() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [status, setStatus] = useState("authenticating");

  useEffect(() => {
    const code = searchParams.get("code");
    const verifier = sessionStorage.getItem("google_code_verifier");

    if (!code || !verifier) {
      navigate("/");
      return;
    }

    API.post("/auth/google/callback", {
      code,
      code_verifier: verifier,
      redirect_uri: window.location.origin + "/auth/google/callback",
    })
      .then((res) => {
        localStorage.setItem("access_token", res.data.access_token);
        localStorage.setItem("user_email", res.data.email);
        localStorage.setItem("user_name", res.data.full_name);
        sessionStorage.removeItem("google_code_verifier");
        setStatus("redirecting");
        setTimeout(() => { window.location.href = "/dashboard"; }, 400);
      })
      .catch(() => {
        navigate("/");
      });
  }, [searchParams, navigate]);

  return (
    <div style={{
      display: "flex", justifyContent: "center", alignItems: "center",
      height: "100vh", background: "#0f0e0a",
      fontFamily: "'Cabinet Grotesk', 'Inter', sans-serif",
      overflow: "hidden",
    }}>
      <style>{`
        @keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }
        @keyframes fadeSlideUp { from { opacity: 0; transform: translateY(12px); } to { opacity: 1; transform: translateY(0); } }
        @keyframes glowPulse { 0%, 100% { opacity: 0.4; } 50% { opacity: 1; } }
        .loader-ring {
          width: 60px; height: 60px; border: 3px solid rgba(255,255,255,0.08);
          border-top-color: #e84c1e; border-radius: 50%;
          animation: spin 0.8s cubic-bezier(0.16, 1, 0.3, 1) infinite;
        }
        .loader-text {
          color: rgba(255,255,255,0.5); font-size: 14px; letter-spacing: 1px;
          text-transform: uppercase; margin-top: 24px; font-weight: 600;
          animation: fadeSlideUp 0.5s ease 0.3s both;
        }
        .loader-dots {
          display: inline-flex; gap: 4px; margin-left: 6px;
        }
        .loader-dot {
          width: 5px; height: 5px; background: #e84c1e; border-radius: 50%;
          animation: glowPulse 1.4s ease-in-out infinite;
        }
        .loader-dot:nth-child(2) { animation-delay: 0.2s; }
        .loader-dot:nth-child(3) { animation-delay: 0.4s; }
        .brand-logo {
          width: 48px; height: 48px; border-radius: 12px;
          background: linear-gradient(135deg, #e84c1e, #c93d14);
          display: flex; align-items: center; justify-content: center;
          font-size: 18px; font-weight: 800; color: #fff;
          font-family: 'Clash Display', sans-serif; letter-spacing: -1px;
          margin-bottom: 12px; animation: fadeSlideUp 0.5s ease both;
        }
        .brand-name {
          color: rgba(255,255,255,0.8); font-size: 20px; font-weight: 700;
          font-family: 'Clash Display', sans-serif; letter-spacing: -0.5px;
          animation: fadeSlideUp 0.5s ease 0.15s both;
        }
      `}</style>
      <div style={{ textAlign: "center" }}>
        <div style={{ animation: "fadeSlideUp 0.5s ease both" }}>
          <div className="brand-logo">AI</div>
          <div className="brand-name">AI Career Copilot</div>
        </div>
        <div style={{ marginTop: "40px", display: "flex", justifyContent: "center" }}>
          <div className="loader-ring" />
        </div>
        <div className="loader-text">
          {status === "authenticating" ? "Signing in" : "Redirecting"}
          <span className="loader-dots">
            <span className="loader-dot" />
            <span className="loader-dot" />
            <span className="loader-dot" />
          </span>
        </div>
      </div>
    </div>
  );
}
