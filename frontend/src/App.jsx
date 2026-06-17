import { BrowserRouter, Routes, Route } from "react-router-dom";

import Landing from "./pages/Landing/Landing";
import Signup from "./pages/Auth/signup";
import Login from "./pages/Auth/Login";
import VerifyOTP from "./pages/Auth/VerifyOTP";
import Dashboard from "./pages/dashboard/Dashboard";
import GoogleCallback from "./pages/Auth/GoogleCallback";
import PrivacyPolicy from "./pages/PrivacyPolicy";
import TermsAndConditions from "./pages/TermsAndConditions";
import RefundPolicy from "./pages/RefundPolicy";
import ContactUs from "./pages/ContactUs";
import ShippingPolicy from "./pages/ShippingPolicy";

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Landing />} />
        <Route path="/signup" element={<Signup />} />
        <Route path="/verify-otp" element={<VerifyOTP />} />
        <Route path="/login" element={<Login />} />
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/auth/google/callback" element={<GoogleCallback />} />
        <Route path="/privacy" element={<PrivacyPolicy />} />
        <Route path="/terms" element={<TermsAndConditions />} />
        <Route path="/refund" element={<RefundPolicy />} />
        <Route path="/contact" element={<ContactUs />} />
        <Route path="/shipping" element={<ShippingPolicy />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
