import { useState } from "react";
import API from "../../services/api";

export default function Signup({ switchToOTP }) {
  const [full_name, setFullName] = useState("");
  const [email, setEmail] = useState("");

  const handleSignup = async () => {
    try {
      const res = await API.post("/auth/send-otp", {
        full_name,
        email,
      });

      localStorage.setItem(
        "signup_email",
        email
      );

      alert(res.data.message);

      switchToOTP();
    } catch (error) {
      alert(
        error?.response?.data?.message ||
          "Failed to send OTP"
      );
    }
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
        Create Account
      </h1>

      <input
        placeholder="Full Name"
        value={full_name}
        onChange={(e) =>
          setFullName(e.target.value)
        }
        style={{
          width: "100%",
          padding: "15px",
          marginBottom: "15px",
          borderRadius: "12px",
          border: "1px solid rgba(255,255,255,0.3)",
        }}
      />

      <input
        placeholder="Email Address"
        value={email}
        onChange={(e) =>
          setEmail(e.target.value)
        }
        style={{
          width: "100%",
          padding: "15px",
          marginBottom: "20px",
          borderRadius: "12px",
          border: "1px solid rgba(255,255,255,0.3)",
        }}
      />

      <button
        onClick={handleSignup}
        style={{
          width: "100%",
          padding: "15px",
          border: "none",
          borderRadius: "12px",
          background: "#ff7a1a",
          color: "white",
          cursor: "pointer",
        }}
      >
        Send OTP
      </button>
    </>
  );
}