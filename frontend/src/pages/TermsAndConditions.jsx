import { Link } from "react-router-dom";

const styles = `
  .policy-page {
    max-width: 800px;
    margin: 0 auto;
    padding: 40px 24px 80px;
    font-family: 'Cabinet Grotesk', sans-serif;
  }
  .policy-back {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    color: var(--muted, #8a8070);
    font-size: 13px;
    font-weight: 500;
    text-decoration: none;
    margin-bottom: 24px;
    transition: color 0.15s;
  }
  .policy-back:hover { color: var(--accent, #e84c1e); }
  .policy-header {
    margin-bottom: 40px;
    border-bottom: 1.5px solid var(--border, #d4cdc0);
    padding-bottom: 24px;
  }
  .policy-header h1 {
    font-family: 'Clash Display', sans-serif;
    font-size: clamp(28px, 5vw, 40px);
    font-weight: 700;
    letter-spacing: -1px;
    margin: 0 0 8px;
    color: var(--ink, #0f0e0a);
  }
  .policy-header .policy-date {
    font-size: 13px;
    color: var(--muted, #8a8070);
  }
  .policy-section {
    margin-bottom: 32px;
  }
  .policy-section h2 {
    font-family: 'Clash Display', sans-serif;
    font-size: 20px;
    font-weight: 700;
    letter-spacing: -0.3px;
    margin: 0 0 12px;
    color: var(--ink, #0f0e0a);
  }
  .policy-section h3 {
    font-size: 16px;
    font-weight: 700;
    margin: 0 0 8px;
    color: var(--ink, #0f0e0a);
  }
  .policy-section p {
    font-size: 15px;
    line-height: 1.8;
    color: #444;
    margin: 0 0 12px;
  }
  .policy-section ul, .policy-section ol {
    margin: 8px 0 16px;
    padding-left: 24px;
  }
  .policy-section li {
    font-size: 15px;
    line-height: 1.8;
    color: #444;
    margin-bottom: 6px;
  }
  .policy-section li strong { color: var(--ink, #0f0e0a); }
  .policy-section .highlight-box {
    background: var(--bg, #f5f0e8);
    border-left: 3px solid var(--accent, #e84c1e);
    padding: 16px 20px;
    margin: 16px 0;
    border-radius: 0 8px 8px 0;
  }
  .policy-section .highlight-box p { margin: 0; font-size: 14px; color: #555; }
  @media (max-width: 640px) {
    .policy-page { padding: 24px 16px 60px; }
    .policy-section h2 { font-size: 18px; }
    .policy-section p, .policy-section li { font-size: 14px; }
  }
`;

export default function TermsAndConditions() {
  return (
    <div className="policy-page">
      <style>{styles}</style>
      <Link to="/" className="policy-back">← Back to Home</Link>

      <div className="policy-header">
        <h1>Terms &amp; Conditions</h1>
        <p className="policy-date">Last updated: June 15, 2026</p>
      </div>

      <div className="policy-section">
        <h2>1. Acceptance of Terms</h2>
        <p>
          By accessing or using AI Career Copilot ("the Platform"), you agree to be bound by
          these Terms & Conditions. If you do not agree, you may not access or use the Platform.
          These terms constitute a legally binding agreement between you ("User") and
          AI Career Copilot Technologies Pvt Ltd ("Company").
        </p>
      </div>

      <div className="policy-section">
        <h2>2. Description of Service</h2>
        <p>
          AI Career Copilot provides AI-powered resume analysis, ATS scoring, job description
          matching, and career-related insights. The Platform uses artificial intelligence to
          analyze resumes and provide feedback, scores, and recommendations. These outputs are
          informational and should not be treated as the sole determinant of career decisions.
        </p>
      </div>

      <div className="policy-section">
        <h2>3. User Accounts</h2>
        <h3>3.1 Registration</h3>
        <p>
          To use certain features, you must create an account with accurate, complete information.
          You are responsible for maintaining the confidentiality of your login credentials.
        </p>

        <h3>3.2 Account Security</h3>
        <p>
          You are responsible for all activities that occur under your account. Notify us immediately
          at support.aicareercopilot@gmail.com if you suspect unauthorized access.
        </p>

        <h3>3.3 Account Deletion</h3>
        <p>
          You may delete your account at any time by contacting support. Upon deletion, your
          personal data and analysis history will be permanently removed within 30 days.
        </p>
      </div>

      <div className="policy-section">
        <h2>4. Scan Packs & Payments</h2>
        <h3>4.1 Scan Credit System</h3>
        <p>
          The Platform operates on a scan-based credit system. Each analysis (resume review or
          JD match) consumes one scan from your available balance. Scans are non-transferable
          between accounts.
        </p>

        <h3>4.2 Free Scans</h3>
        <p>
          New users receive a limited number of free scans upon registration. Free scans are
          offered at the Company's discretion and may be withdrawn or modified at any time.
        </p>

        <h3>4.3 Paid Scans & Validity</h3>
        <div className="highlight-box">
          <p>
            <strong>Expiry Policy:</strong> Paid scan packs are valid for 30 days from the date of purchase.
            Any unused scans will expire after 30 days. No refunds will be issued for unused scans,
            whether within or beyond the validity period.
          </p>
        </div>

        <h3>4.4 Pricing</h3>
        <p>
          All prices are listed in Indian Rupees (INR) inclusive of applicable taxes. The current
          pricing is:
        </p>
        <ul>
          <li><strong>Resume Reviewer:</strong> ₹49 — 20 scans (valid 30 days)</li>
          <li><strong>JD Match Analyzer:</strong> ₹99 — 60 scans (valid 30 days)</li>
          <li><strong>JobSense AI:</strong> ₹149 — 25 scans (valid 30 days)</li>
        </ul>
        <p>
          Pricing is subject to change. Any price changes will be communicated via email at least
          7 days in advance and will not affect already-purchased scan packs.
        </p>
      </div>

      <div className="policy-section">
        <h2>5. User Conduct</h2>
        <p>You agree not to:</p>
        <ul>
          <li>Upload malicious files, viruses, or any content that could harm the Platform</li>
          <li>Attempt to reverse engineer, decompile, or extract the source code of our AI models</li>
          <li>Use the Platform for any unlawful purpose or in violation of Indian law</li>
          <li>Create multiple accounts to abuse the free scan system</li>
          <li>Upload resumes of individuals without their consent</li>
          <li>Interfere with or disrupt the platform's security or performance</li>
        </ul>
      </div>

      <div className="policy-section">
        <h2>6. Intellectual Property</h2>
        <p>
          All content, features, and functionality of the Platform — including but not limited to
          the AI algorithms, scoring systems, design, text, graphics, and software — are the
          exclusive property of AI Career Copilot Technologies Pvt Ltd and are protected by
          Indian intellectual property laws.
        </p>
        <p>
          You retain full ownership of your resume and personal data. You grant us a limited
          license to process this data solely for the purpose of providing the service.
        </p>
      </div>

      <div className="policy-section">
        <h2>7. Disclaimer of Warranties</h2>
        <p>
          The Platform and all analysis results are provided "as is" and "as available" without
          any warranty, express or implied. We do not guarantee:
        </p>
        <ul>
          <li>That your resume will pass any specific ATS system or result in job interviews</li>
          <li>That our AI analysis is 100% accurate or error-free</li>
          <li>Uninterrupted or error-free operation of the Platform</li>
          <li>That JobSense AI will find matching job opportunities for every user or profile</li>
        </ul>
      </div>

      <div className="policy-section">
        <h2>8. Limitation of Liability</h2>
        <p>
          To the maximum extent permitted by Indian law, AI Career Copilot Technologies Pvt Ltd
          shall not be liable for any indirect, incidental, special, consequential, or punitive
          damages arising out of or relating to your use of the Platform, including but not
          limited to lost employment opportunities, lost earnings, or career impact.
        </p>
        <p>
          Our total liability for any claim arising from these terms shall not exceed the amount
          you have paid to us in the 12 months preceding the claim.
        </p>
      </div>

      <div className="policy-section">
        <h2>9. Indemnification</h2>
        <p>
          You agree to indemnify and hold harmless AI Career Copilot Technologies Pvt Ltd from
          any claims, damages, losses, or expenses arising from your violation of these terms,
          misuse of the Platform, or violation of any applicable law.
        </p>
      </div>

      <div className="policy-section">
        <h2>10. Termination</h2>
        <p>
          We reserve the right to suspend or terminate your account at any time for violation
          of these terms, fraudulent activity, or conduct that harms the Platform or other users.
          Upon termination, your right to use the Platform ceases immediately, and any unused
          scans are forfeited.
        </p>
      </div>

      <div className="policy-section">
        <h2>11. Governing Law</h2>
        <p>
          These Terms shall be governed by and construed in accordance with the laws of India.
          Any disputes arising from these terms shall be subject to the exclusive jurisdiction
          of the courts in [City, State — to be updated].
        </p>
      </div>

      <div className="policy-section">
        <h2>12. Changes to Terms</h2>
        <p>
          We may modify these terms at any time. Changes will be effective immediately upon
          posting. Your continued use of the Platform after changes constitutes acceptance of
          the new terms. We will notify you of material changes via email.
        </p>
      </div>

      <div className="policy-section">
        <h2>13. Contact</h2>
        <p>
          For questions about these terms, contact us at:<br />
          <strong>Email:</strong> support.aicareercopilot@gmail.com<br />
          <strong>Company:</strong> AI Career Copilot Technologies<br />
          <strong>Entity:</strong> AI Career Copilot Technologies
        </p>
      </div>
    </div>
  );
}
