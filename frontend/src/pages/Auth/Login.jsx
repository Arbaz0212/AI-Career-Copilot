import { useState } from "react";
import { useNavigate } from "react-router-dom";
import API from "../../services/api";
import { showAuthLoader } from "../../utils/authLoader";

export default function Login({ switchToSignup }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleLogin = async () => {
    setError("");

    if (!email || !password) {
      setError("Please enter email and password.");
      return;
    }

    setLoading(true);

    try {
      const res = await API.post("/auth/login", { email, password });

      const token = res.data.access_token;
      const username = email.split("@")[0];

      // Write to localStorage first
      localStorage.setItem("access_token", token);
      localStorage.setItem("user_email", email);
      localStorage.setItem("user_name", username);

      // Show loader — Dashboard will hide it on mount
      showAuthLoader();
      // Navigate directly — Dashboard will mount fresh and read localStorage correctly
      navigate("/dashboard");

    } catch (err) {
      if (err.response?.status === 401) {
        setError("Invalid email or password. Please try again.");
      } else if (err.response?.data?.detail) {
        setError(err.response.data.detail);
      } else {
        setError("Login failed. Please try again.");
      }
    } finally {
      setLoading(false);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter") handleLogin();
  };

  return (
    <>
      <h1
        style={{
          color: "#ff7a1a",
          fontFamily: "Times New Roman",
          marginBottom: "25px",
        }}
      >
        Welcome Back
      </h1>

      {error && (
        <div
          style={{
            background: "rgba(255, 80, 80, 0.15)",
            border: "1px solid rgba(255, 80, 80, 0.5)",
            color: "#ff5050",
            padding: "10px 14px",
            borderRadius: "10px",
            marginBottom: "15px",
            fontSize: "14px",
          }}
        >
          {error}
        </div>
      )}

      <input
        placeholder="Email Address"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        onKeyDown={handleKeyDown}
        style={{
          width: "100%",
          padding: "15px",
          marginBottom: "15px",
          borderRadius: "12px",
          border: "1px solid rgba(255,255,255,0.3)",
          boxSizing: "border-box",
        }}
      />

      <input
        type="password"
        placeholder="Password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        onKeyDown={handleKeyDown}
        style={{
          width: "100%",
          padding: "15px",
          marginBottom: "20px",
          borderRadius: "12px",
          border: "1px solid rgba(255,255,255,0.3)",
          boxSizing: "border-box",
        }}
      />

      <button
        onClick={handleLogin}
        disabled={loading}
        style={{
          width: "100%",
          padding: "15px",
          border: "none",
          borderRadius: "12px",
          background: loading ? "#cc5500" : "#ff7a1a",
          color: "white",
          cursor: loading ? "not-allowed" : "pointer",
          fontSize: "16px",
          fontWeight: "600",
        }}
      >
        {loading ? "Logging in..." : "Login"}
      </button>

      <p
        style={{
          textAlign: "center",
          marginTop: "20px",
          cursor: "pointer",
          color: "#aaa",
        }}
        onClick={switchToSignup}
      >
        Don't have an account?{" "}
        <span style={{ color: "#ff7a1a", fontWeight: "600" }}>Sign Up</span>
      </p>
    </>
  );
}