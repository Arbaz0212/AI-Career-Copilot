import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import API from "../services/api";
import "./AuthModal.css";
import toast from "react-hot-toast";

export default function AuthModal({ isOpen, onClose }) {
  const [activeTab, setActiveTab] = useState("login");

  // Signup fields
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [otp, setOtp] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  // Login fields
  const [loginEmail, setLoginEmail] = useState("");
  const [loginPassword, setLoginPassword] = useState("");
  const [rememberMe, setRememberMe] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  // UI state
  const [showVerifyOTP, setShowVerifyOTP] = useState(false);
  const [forgotPasswordMode, setForgotPasswordMode] = useState(false);
  const [resetOtp, setResetOtp] = useState("");
  const [otpVerified, setOtpVerified] = useState(false);
  const [otpCooldown, setOtpCooldown] = useState(0);
  const [resendCooldown, setResendCooldown] = useState(0);
  const [sendingOtp, setSendingOtp] = useState(false);
  const [loggingIn, setLoggingIn] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);

  // Restore saved email + reset loading states on mount
  useEffect(() => {
    setGoogleLoading(false);
    setLoggingIn(false);
    const savedEmail = localStorage.getItem("remember_email");
    if (savedEmail) {
      setLoginEmail(savedEmail);
      setRememberMe(true);
    }
  }, [isOpen]);

  // Cleanup scroll lock
  useEffect(() => {
    if (!isOpen) {
      document.body.style.overflow = "auto";
      return;
    }
    document.body.style.overflow = "hidden";
    return () => { document.body.style.overflow = "auto"; };
  }, [isOpen]);

  // Initialize Google OAuth when modal opens
  useEffect(() => {
    if (isOpen && typeof google !== "undefined" && google.accounts) {
      import("../services/googleAuth");
    }
  }, [isOpen]);

  const startCooldown = (setter) => {
    setter(60);
    const timer = setInterval(() => {
      setter((prev) => {
        if (prev <= 1) { clearInterval(timer); return 0; }
        return prev - 1;
      });
    }, 1000);
  };

  // ── Signup Flow ──

  const sendOtp = async () => {
    try {
      setSendingOtp(true);
      const res = await API.post("/auth/send-otp", { full_name: fullName, email });
      localStorage.setItem("signup_email", email);
      localStorage.setItem("signup_full_name", fullName);
      startCooldown(setOtpCooldown);
      setShowVerifyOTP(true);
      toast.success(res.data.message || "OTP Sent Successfully");
    } catch (error) {
      toast.error(error?.response?.data?.detail || "Failed to send OTP");
    } finally {
      setSendingOtp(false);
    }
  };

  const resendOTP = async () => {
    try {
      const res = await API.post("/auth/resend-otp", { email });
      startCooldown(setResendCooldown);
      toast.error(res.data.message);
    } catch (error) {
      toast.error(error?.response?.data?.detail || "Unable to resend OTP");
    }
  };

  const verifySignupOTP = async () => {
    try {
      await API.post("/auth/verify-otp", { email, otp });
      await API.post("/auth/create-password", { email, password, confirm_password: confirmPassword });
      toast.success("Account Created Successfully");
      setShowVerifyOTP(false);
      setActiveTab("login");
      setFullName(""); setEmail(""); setOtp(""); setPassword(""); setConfirmPassword("");
    } catch (error) {
      toast.error(error?.response?.data?.detail || "Verification Failed");
    }
  };

  // ── Login Flow ──

  const loginUser = async () => {
    if (!loginEmail || !loginPassword) {
      toast.error("Please enter email and password.");
      return;
    }
    try {
      setLoggingIn(true);
      const res = await API.post("/auth/login", { email: loginEmail, password: loginPassword });

      localStorage.setItem("access_token", res.data.access_token);
      localStorage.setItem("user_email", loginEmail);
      localStorage.setItem("user_name", res.data.full_name || loginEmail.split("@")[0]);

      if (rememberMe) {
        localStorage.setItem("remember_email", loginEmail);
      } else {
        localStorage.removeItem("remember_email");
      }

      window.location.href = "/dashboard";
    } catch (error) {
      toast.error(error?.response?.data?.detail || "Login Failed");
    } finally {
      setLoggingIn(false);
    }
  };

  // ── Google OAuth ──

  const handleGoogleLogin = async () => {
    if (typeof google === "undefined" || !google.accounts) {
      toast.error("Google Sign-In is still loading. Please try again.");
      return;
    }

    setGoogleLoading(true);
    try {
      const { googleLogin } = await import("../services/googleAuth");
      const profile = await googleLogin();

      if (!profile || !profile.email) {
        toast.error("Could not retrieve email from Google.");
        setGoogleLoading(false);
        return;
      }

      const res = await API.post("/auth/google", {
        email: profile.email,
        name: profile.name,
      });

      localStorage.setItem("access_token", res.data.access_token);
      localStorage.setItem("user_email", profile.email);
      localStorage.setItem("user_name", res.data.full_name || profile.name);

      window.location.href = "/dashboard";
    } catch (err) {
      if (err.message === "popup_closed" || err.message === "user_cancelled") {
        // User closed the popup — just reset, no error toast
      } else {
        toast.error("Google sign-in failed. Please use email/password.");
      }
      setGoogleLoading(false);
    }
  };

  // ── Password Reset ──

  const sendForgotPasswordOTP = async () => {
    try {
      const res = await API.post("/auth/forgot-password", { email });
      startCooldown(setOtpCooldown);
      toast.error(res.data.message);
    } catch (error) {
      toast.error(error?.response?.data?.detail || "Failed To Send OTP");
    }
  };

  const verifyResetOTP = async () => {
    try {
      await API.post("/auth/verify-otp", { email, otp: resetOtp });
      setOtpVerified(true);
      toast.success("OTP Verified");
    } catch (error) {
      toast.error(error?.response?.data?.detail || "Invalid OTP");
    }
  };

  const resetPassword = async () => {
    try {
      const res = await API.post("/auth/reset-password", { email, password, confirm_password: confirmPassword });
      toast.success(res.data.message);
      setForgotPasswordMode(false);
      setOtpVerified(false);
      setResetOtp(""); setPassword(""); setConfirmPassword("");
      setActiveTab("login");
    } catch (error) {
      toast.error(error?.response?.data?.detail || "Failed To Reset Password");
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          className="auth-overlay"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          <motion.div
            className="auth-modal"
            initial={{ opacity: 0, y: 12, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 12, scale: 0.97 }}
            transition={{ duration: 0.25, ease: "easeOut" }}
          >
            <button className="close-btn" onClick={onClose}>✕</button>

            {/* Header */}
            <div className="auth-header">
              <div className="auth-logo">AI</div>
              <h1 className="auth-title">AI Career Copilot</h1>
              <p className="auth-subtitle">Optimize your resume, land your dream job</p>
            </div>

            {!forgotPasswordMode && !showVerifyOTP && (
              <>
                <div className="tabs">
                  <button className={activeTab === "login" ? "active-tab" : ""} onClick={() => setActiveTab("login")}>Login</button>
                  <button className={activeTab === "signup" ? "active-tab" : ""} onClick={() => setActiveTab("signup")}>Sign Up</button>
                </div>

                {activeTab === "login" ? (
                  <>
                    <div className="input-wrapper">
                      <input type="email" placeholder="Email address" value={loginEmail} onChange={(e) => setLoginEmail(e.target.value)} onKeyDown={(e) => e.key === "Enter" && loginUser()} />
                    </div>
                    <div className="input-wrapper">
                      <input type={showPassword ? "text" : "password"} placeholder="Password" value={loginPassword} onChange={(e) => setLoginPassword(e.target.value)} onKeyDown={(e) => e.key === "Enter" && loginUser()} />
                      <button type="button" className="password-toggle" onClick={() => setShowPassword(!showPassword)} tabIndex={-1}>
                        {showPassword ? "🙈" : "👁"}
                      </button>
                    </div>
                    <div className="auth-row">
                      <label className="remember-me">
                        <input type="checkbox" checked={rememberMe} onChange={(e) => setRememberMe(e.target.checked)} />
                        Remember me
                      </label>
                      <button className="forgot-link" onClick={() => setForgotPasswordMode(true)}>Forgot password?</button>
                    </div>
                    <button className="main-btn" onClick={loginUser} disabled={loggingIn}>
                      {loggingIn ? "Signing in..." : "Sign In"}
                    </button>
                    <div className="divider"><span>or continue with</span></div>
                    <button className="google-btn" onClick={handleGoogleLogin} disabled={googleLoading}>
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                        <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 01-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4"/>
                        <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                        <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                        <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
                      </svg>
                      {googleLoading ? "Opening Google..." : "Continue with Google"}
                    </button>
                  </>
                ) : (
                  <>
                    <div className="input-wrapper"><input type="text" placeholder="Full Name" value={fullName} onChange={(e) => setFullName(e.target.value)} /></div>
                    <div className="input-wrapper"><input type="email" placeholder="Email address" value={email} onChange={(e) => setEmail(e.target.value)} /></div>
                    <button className="main-btn" onClick={sendOtp} disabled={sendingOtp || otpCooldown > 0}>
                      {sendingOtp ? "Sending..." : otpCooldown > 0 ? `Wait ${otpCooldown}s` : "Send OTP"}
                    </button>
                    <div className="divider"><span>or</span></div>
                    <button className="google-btn" onClick={handleGoogleLogin} disabled={googleLoading}>
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                        <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 01-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4"/>
                        <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                        <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                        <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
                      </svg>
                      {googleLoading ? "Opening Google..." : "Continue with Google"}
                    </button>
                  </>
                )}
              </>
            )}

            {showVerifyOTP && (
              <>
                <h2>Verify Email</h2>
                <div className="input-wrapper"><input type="text" placeholder="OTP" value={otp} onChange={(e) => setOtp(e.target.value)} /></div>
                <div className="input-wrapper">
                  <input type={showPassword ? "text" : "password"} placeholder="Password" value={password} onChange={(e) => setPassword(e.target.value)} />
                  <button type="button" className="password-toggle" onClick={() => setShowPassword(!showPassword)} tabIndex={-1}>{showPassword ? "🙈" : "👁"}</button>
                </div>
                <div className="input-wrapper"><input type={showPassword ? "text" : "password"} placeholder="Confirm Password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} /></div>
                <button className="main-btn" onClick={verifySignupOTP}>Verify & Create Account</button>
                <button className="secondary-btn" onClick={resendOTP} disabled={resendCooldown > 0}>
                  {resendCooldown > 0 ? `Resend in ${resendCooldown}s` : "Resend OTP"}
                </button>
              </>
            )}

            {forgotPasswordMode && (
              <>
                <h2>Reset Password</h2>
                <div className="input-wrapper"><input type="email" placeholder="Email" value={email} onChange={(e) => setEmail(e.target.value)} /></div>
                {!otpVerified ? (
                  <>
                    <button className="main-btn" onClick={sendForgotPasswordOTP}>Send OTP</button>
                    <div className="input-wrapper"><input type="text" placeholder="OTP" value={resetOtp} onChange={(e) => setResetOtp(e.target.value)} /></div>
                    <button className="secondary-btn" onClick={verifyResetOTP}>Verify OTP</button>
                  </>
                ) : (
                  <>
                    <div className="input-wrapper"><input type="password" placeholder="New Password" value={password} onChange={(e) => setPassword(e.target.value)} /></div>
                    <div className="input-wrapper"><input type="password" placeholder="Confirm Password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} /></div>
                    <button className="main-btn" onClick={resetPassword}>Update Password</button>
                  </>
                )}
              </>
            )}

            {!forgotPasswordMode && !showVerifyOTP && (
              <p style={{ textAlign: "center", marginTop: "20px", fontSize: "13px", color: "#9ca3af" }}>
                By continuing, you agree to our{" "}
                <span style={{ color: "#ff7a1a", cursor: "pointer" }}>Terms</span> and{" "}
                <span style={{ color: "#ff7a1a", cursor: "pointer" }}>Privacy Policy</span>
              </p>
            )}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
