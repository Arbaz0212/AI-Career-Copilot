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
  .policy-section table {
    width: 100%;
    border-collapse: collapse;
    margin: 16px 0;
    font-size: 14px;
  }
  .policy-section th {
    text-align: left;
    padding: 10px 12px;
    background: var(--card, #ede8df);
    font-weight: 700;
    color: var(--ink, #0f0e0a);
    border: 1px solid var(--border, #d4cdc0);
  }
  .policy-section td {
    padding: 10px 12px;
    border: 1px solid var(--border, #d4cdc0);
    color: #444;
  }
  @media (max-width: 640px) {
    .policy-page { padding: 24px 16px 60px; }
    .policy-section h2 { font-size: 18px; }
    .policy-section p, .policy-section li { font-size: 14px; }
  }
`;

export default function PrivacyPolicy() {
  return (
    <div className="policy-page">
      <style>{styles}</style>
      <Link to="/" className="policy-back">← Back to Home</Link>

      <div className="policy-header">
        <h1>Privacy Policy</h1>
        <p className="policy-date">Last updated: June 15, 2026</p>
      </div>

      <div className="policy-section">
        <h2>1. Introduction</h2>
        <p>
          AI Career Copilot Technologies Pvt Ltd ("AI Career Copilot", "we", "us", or "our")
          is committed to protecting your privacy. This Privacy Policy explains how we collect,
          use, disclose, and safeguard your information when you use our resume analysis and
          job matching platform.
        </p>
        <p>
          By using the Service, you agree to the collection and use of information in accordance
          with this policy. If you do not agree, please discontinue use immediately.
        </p>
      </div>

      <div className="policy-section">
        <h2>2. Information We Collect</h2>

        <h3>2.1 Personal Information</h3>
        <p>When you create an account or use our services, we may collect:</p>
        <ul>
          <li><strong>Identity Data:</strong> Full name, email address, phone number</li>
          <li><strong>Resume Data:</strong> Your uploaded resume including work history, education, skills, projects, certifications, and any other information contained in your resume document</li>
          <li><strong>Account Credentials:</strong> Hashed password, authentication provider information (for Google OAuth users)</li>
          <li><strong>Payment Data:</strong> Payment transaction records. <em>Note: We do not store credit/debit card numbers, UPI IDs, or bank account details. All payment processing is handled securely by Razorpay.</em></li>
        </ul>

        <h3>2.2 Automatically Collected Information</h3>
        <ul>
          <li><strong>Usage Data:</strong> Pages visited, features used, analysis history, scan usage</li>
          <li><strong>Device Data:</strong> Browser type, operating system, device type</li>
          <li><strong>Log Data:</strong> IP address, access times, error logs</li>
        </ul>
      </div>

      <div className="policy-section">
        <h2>3. How We Use Your Information</h2>
        <p>We use the collected information for the following purposes:</p>
        <ul>
          <li><strong>Service Delivery:</strong> To analyze your resume, match it against job descriptions, generate ATS scores, and provide feedback and recommendations</li>
          <li><strong>Account Management:</strong> To create and maintain your account, authenticate your identity, and manage your subscription</li>
          <li><strong>Payment Processing:</strong> To process your transactions via our payment partner Razorpay</li>
          <li><strong>Improvement:</strong> To analyze usage patterns and improve our AI models and platform features</li>
          <li><strong>Communication:</strong> To send service-related emails (OTP verification, payment confirmations, password resets)</li>
          <li><strong>Security:</strong> To detect and prevent fraudulent or unauthorized use of our platform</li>
        </ul>
      </div>

      <div className="policy-section">
        <h2>4. How We Share Your Information</h2>
        <p>We do not sell your personal information. We may share your data only in the following circumstances:</p>
        <ul>
          <li><strong>Service Providers:</strong> With trusted third parties who help us operate our platform — including Razorpay (payment processing), Google Cloud (hosting), and Gemini AI (resume analysis). These providers are contractually bound to protect your data</li>
          <li><strong>Legal Compliance:</strong> When required by law, court order, or government regulation</li>
          <li><strong>Business Transfers:</strong> In the event of a merger, acquisition, or sale of assets, your data may be transferred to the acquiring entity</li>
        </ul>
        <div className="highlight-box">
          <p><strong>Important:</strong> Your resume data is never used to train or improve third-party AI models. Our use of Gemini AI is limited to real-time analysis of your specific resume and is not retained by the AI provider for training purposes.</p>
        </div>
      </div>

      <div className="policy-section">
        <h2>5. Data Retention</h2>
        <p>
          We retain your personal information for as long as your account is active or as needed
          to provide you with our services. Resume files and analysis results are retained
          for the duration of your account plus 30 days after account deletion.
        </p>
        <p>
          Payment records are retained for 6 years as required by Indian tax laws.
        </p>
      </div>

      <div className="policy-section">
        <h2>6. Data Security</h2>
        <p>
          We implement industry-standard security measures to protect your data:
        </p>
        <ul>
          <li>Encryption in transit (TLS 1.3) for all data transmitted between your browser and our servers</li>
          <li>Passwords are hashed using bcrypt — we never store plain-text passwords</li>
          <li>Access to production databases is restricted to authorized personnel only</li>
          <li>Regular security audits and dependency vulnerability scanning</li>
          <li>Token-based authentication with automatic expiry</li>
        </ul>
        <p>
          However, no method of electronic storage or transmission is 100% secure. We cannot
          guarantee absolute security but will promptly notify you of any data breach as required
          by applicable law.
        </p>
      </div>

      <div className="policy-section">
        <h2>7. Your Rights</h2>
        <p>You have the following rights regarding your personal data:</p>
        <ul>
          <li><strong>Access:</strong> Request a copy of the personal data we hold about you</li>
          <li><strong>Correction:</strong> Update or correct inaccurate information</li>
          <li><strong>Deletion:</strong> Request deletion of your account and associated data</li>
          <li><strong>Data Portability:</strong> Request a copy of your data in a machine-readable format</li>
        </ul>
        <p>
          To exercise any of these rights, contact us at <strong>support.aicareercopilot@gmail.com</strong>.
          We will respond within 30 days.
        </p>
      </div>

      <div className="policy-section">
        <h2>8. Cookies</h2>
        <p>
          We use only essential cookies required for authentication and platform functionality.
          We do not use tracking cookies, advertising cookies, or third-party analytics cookies.
        </p>
      </div>

      <div className="policy-section">
        <h2>9. Third-Party Services</h2>
        <p>Our platform integrates with the following third-party services:</p>
        <table>
          <thead>
            <tr>
              <th>Service</th>
              <th>Purpose</th>
              <th>Data Shared</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>Google Gemini AI</td>
              <td>Resume analysis and feedback generation</td>
              <td>Resume text (not stored or used for training)</td>
            </tr>
            <tr>
              <td>Razorpay</td>
              <td>Payment processing</td>
              <td>Order details, amount, user ID</td>
            </tr>
            <tr>
              <td>Google OAuth</td>
              <td>Social login</td>
              <td>Email, name (only if you choose Google login)</td>
            </tr>
          </tbody>
        </table>
      </div>

      <div className="policy-section">
        <h2>10. Children's Privacy</h2>
        <p>
          Our Service is not intended for individuals under the age of 18. We do not knowingly
          collect personal information from children. If we become aware that a child has provided
          us with personal data, we will delete it immediately.
        </p>
      </div>

      <div className="policy-section">
        <h2>11. Changes to This Policy</h2>
        <p>
          We may update this Privacy Policy from time to time. We will notify you of any material
          changes by posting the new policy on this page and updating the "Last updated" date.
          For significant changes, we may also send an email notification.
        </p>
      </div>

      <div className="policy-section">
        <h2>12. Contact</h2>
        <p>
          If you have any questions about this Privacy Policy, please contact us:
        </p>
        <p>
          <strong>Email:</strong> support.aicareercopilot@gmail.com<br />
          <strong>Company:</strong> AI Career Copilot Technologies<br />
          <strong>Registered Address:</strong> [Registered Office Address — to be updated]
        </p>
      </div>
    </div>
  );
}
