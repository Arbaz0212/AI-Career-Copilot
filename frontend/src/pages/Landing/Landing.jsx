import { useState, useEffect } from "react";

import Navbar from "../../components/Navbar";
import Hero from "../../components/Hero";
import StatsSection from "../../components/StatsSection";
import FeatureGrid from "../../components/FeatureGrid";
import ProblemSolution from "../../components/ProblemSolution";
import Featurecards from "../../components/Featurecards";
import HowItWorks from "../../components/HowItWorks";
import UseCases from "../../components/UseCases";
import ComparisonTable from "../../components/ComparisonTable";
import WhyChooseUs from "../../components/WhyChooseUs";
// import Testimonials from "../../components/Testimonials";
import FAQ from "../../components/FAQ";
import CTA from "../../components/CTA";
import Footer from "../../components/Footer";

import AuthModal from "../../components/AuthModal";

const landingMobileStyles = `
@media (max-width: 860px) {
  section { padding: 48px 20px !important; }
  h1 { font-size: clamp(28px, 7vw, 38px) !important; margin-bottom: 28px !important; line-height: 1.1 !important; }
  h2 { font-size: clamp(22px, 5vw, 30px) !important; }
  p { font-size: 15px !important; line-height: 1.6 !important; }
  div[style*="gridTemplateColumns: repeat(3,1fr)"],
  div[style*="gridTemplateColumns: repeat(4, 1fr)"],
  div[style*="gridTemplateColumns: repeat(2, 1fr)"] {
    grid-template-columns: 1fr !important;
    gap: 16px !important;
  }
  div[style*="padding: 40px"] { padding: 24px 20px !important; }
  div[style*="padding: 35px"] { padding: 20px !important; }
  div[style*="padding: 50px 40px"] { padding: 28px 20px !important; }
  div[style*="padding: 48px 36px"] { padding: 24px 18px !important; }
  div[style*="padding: 32px"] { padding: 18px !important; }
  section[style*="background: #111827"] { padding: 48px 20px !important; }
  section[style*="background: #111827"] h1 { font-size: clamp(24px, 6vw, 32px) !important; }
  section[style*="background: #111827"] p { font-size: 14px !important; }
  footer { padding: 36px 20px !important; }
  footer > div > div:first-child { grid-template-columns: 1fr !important; gap: 28px !important; }
  footer div[style*="justifyContent: space-between"] { flex-direction: column !important; gap: 12px !important; text-align: center !important; }
  div[style*="padding: 25px"] { padding: 16px !important; }
  /* Problem-solution cards stack */
  div[style*="gridTemplateColumns: 1fr 1fr"][style*="gap: 24px"] { grid-template-columns: 1fr !important; }
  div[style*="gridTemplateColumns: 1fr 1fr"] > div { border-right: none !important; }
}
@media (max-width: 480px) {
  section { padding: 36px 16px !important; }
  h1 { font-size: clamp(24px, 6vw, 30px) !important; }
  p { font-size: 14px !important; }
  section[style*="background: #111827"] { padding: 36px 16px !important; }
}
`;

export default function Landing() {
  const [authModalOpen, setAuthModalOpen] = useState(false);

  // Scroll to top on every mount/refresh
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "instant" });
  }, []);

  useEffect(() => {
    if (document.getElementById("landing-mobile")) return;
    const s = document.createElement("style");
    s.id = "landing-mobile";
    s.textContent = landingMobileStyles;
    document.head.appendChild(s);
    return () => {
      const el = document.getElementById("landing-mobile");
      if (el) el.remove();
    };
  }, []);

  return (
    <>
      <Navbar openAuthModal={() => setAuthModalOpen(true)} />
      <Hero openAuthModal={() => setAuthModalOpen(true)} />
      <StatsSection />
      <FeatureGrid />
      <ProblemSolution />
      <Featurecards />
      <HowItWorks />
      <UseCases />
      <ComparisonTable />
      <WhyChooseUs />
      {/* <Testimonials /> */}
      <FAQ />
      <CTA openAuthModal={() => setAuthModalOpen(true)} />
      <Footer />
      <AuthModal isOpen={authModalOpen} onClose={() => setAuthModalOpen(false)} />
    </>
  );
}
