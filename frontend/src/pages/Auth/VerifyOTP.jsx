import { useState } from "react";
import API from "../../services/api";

export default function VerifyOTP({ onSuccess }) {
  const email =
    localStorage.getItem("signup_email");

  const [otp, setOtp] = useState("");
  const [password, setPassword] =
    useState("");
  const [confirmPassword, setConfirmPassword] =
    useState("");

  const verifyOTP = async () => {
    try {
      await API.post("/auth/verify-otp", {
        email,
        otp,
      });

      await API.post("/auth/create-password", {
        email,
        password,
        confirm_password: confirmPassword,
      });

      alert(
        "Account created successfully"
      );

      onSuccess();
    } catch (error) {
      alert(
        error?.response?.data?.message ||
          "Verification failed"
      );
    }
  };

  const resendOTP = async () => {
    try {
      const res = await API.post(
        "/auth/resend-otp",
        {
          email,
        }
      );

      alert(res.data.message);
    } catch {
      alert("Failed to resend OTP");
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
        Verify Email
      </h1>

      <input
        placeholder="Enter OTP"
        value={otp}
        onChange={(e) =>
          setOtp(e.target.value)
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
        type="password"
        placeholder="Create Password"
        value={password}
        onChange={(e) =>
          setPassword(e.target.value)
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
        type="password"
        placeholder="Confirm Password"
        value={confirmPassword}
        onChange={(e) =>
          setConfirmPassword(
            e.target.value
          )
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
        onClick={verifyOTP}
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
        Verify & Create Account
      </button>

      <button
        onClick={resendOTP}
        style={{
          width: "100%",
          padding: "15px",
          marginTop: "10px",
          borderRadius: "12px",
          border: "none",
          cursor: "pointer",
        }}
      >
        Resend OTP
      </button>
    </>
  );
}