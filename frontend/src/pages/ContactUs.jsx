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
  .policy-header .policy-sub {
    font-size: 15px;
    color: #555;
    line-height: 1.6;
    max-width: 560px;
  }
  .contact-grid {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 24px;
    margin-bottom: 40px;
  }
  .contact-card {
    background: var(--white, #ffffff);
    border: 1.5px solid var(--border, #d4cdc0);
    padding: 28px;
    transition: transform 0.2s, box-shadow 0.2s;
  }
  .contact-card:hover {
    transform: translateY(-2px);
    box-shadow: 4px 4px 0 var(--border, #d4cdc0);
  }
  .contact-icon {
    font-size: 28px;
    margin-bottom: 12px;
    display: block;
  }
  .contact-card h3 {
    font-family: 'Clash Display', sans-serif;
    font-size: 16px;
    font-weight: 700;
    margin: 0 0 6px;
    color: var(--ink, #0f0e0a);
  }
  .contact-card p {
    font-size: 14px;
    line-height: 1.6;
    color: #555;
    margin: 0;
  }
  .contact-card a {
    color: var(--accent, #e84c1e);
    text-decoration: none;
    font-weight: 600;
  }
  .contact-card a:hover { text-decoration: underline; }
  .contact-card .contact-detail {
    display: block;
    margin-top: 8px;
    font-size: 14px;
    color: var(--ink, #0f0e0a);
    font-weight: 500;
  }
  .faq-contact-section {
    background: var(--bg, #f5f0e8);
    border: 1.5px solid var(--border, #d4cdc0);
    padding: 28px;
    margin-bottom: 24px;
  }
  .faq-contact-section h2 {
    font-family: 'Clash Display', sans-serif;
    font-size: 18px;
    font-weight: 700;
    margin: 0 0 16px;
    color: var(--ink, #0f0e0a);
  }
  .faq-item {
    margin-bottom: 16px;
  }
  .faq-item:last-child { margin-bottom: 0; }
  .faq-question {
    font-weight: 700;
    font-size: 14px;
    color: var(--ink, #0f0e0a);
    margin-bottom: 4px;
  }
  .faq-answer {
    font-size: 14px;
    color: #555;
    line-height: 1.6;
    margin: 0;
  }
  @media (max-width: 640px) {
    .policy-page { padding: 24px 16px 60px; }
    .contact-grid { grid-template-columns: 1fr; }
  }
`;

export default function ContactUs() {
  return (
    <div className="policy-page">
      <style>{styles}</style>
      <Link to="/" className="policy-back">← Back to Home</Link>

      <div className="policy-header">
        <h1>Contact Us</h1>
        <p className="policy-sub">
          Have a question, feedback, or need help? We'd love to hear from you.
          Here's how you can reach us.
        </p>
      </div>

      <div className="contact-grid">
        <div className="contact-card">
          <span className="contact-icon">📧</span>
          <h3>Email Support</h3>
          <p>For account issues, billing questions, and general inquiries.</p>
          <a href="mailto:support.aicareercopilot@gmail.com" className="contact-detail">
            support.aicareercopilot@gmail.com
          </a>
        </div>

        <div className="contact-card">
          <span className="contact-icon">⏱️</span>
          <h3>Response Time</h3>
          <p>We aim to respond to all inquiries within:</p>
          <p className="contact-detail" style={{ color: "var(--accent, #e84c1e)" }}>
            <strong>24-48 hours (business days)</strong>
          </p>
        </div>
      </div>

      <div className="faq-contact-section">
        <h2>Frequently Asked Inquiries</h2>

        <div className="faq-item">
          <div className="faq-question">🔒 I can't log into my account</div>
          <p className="faq-answer">
            Try resetting your password via the login page. If you used Google OAuth,
            ensure you're using the same email address. If issues persist, email us
            with your registered email address.
          </p>
        </div>

        <div className="faq-item">
          <div className="faq-question">💳 My payment went through but scans weren't credited</div>
          <p className="faq-answer">
            This is rare — our payment system has automatic backup verification.
            In most cases, scans are credited within 2 minutes. If not, email us
            your Razorpay payment ID and order ID, and we'll manually credit your account.
          </p>
        </div>

        <div className="faq-item">
          <div className="faq-question">🗑️ How do I delete my account?</div>
          <p className="faq-answer">
            Email us at support.aicareercopilot@gmail.com with the subject
            "Account Deletion Request" from your registered email. We'll process
            it within 7 business days.
          </p>
        </div>

        <div className="faq-item">
          <div className="faq-question">📝 I have a feature request or bug report</div>
          <p className="faq-answer">
            We'd love to hear it! Email us with the subject "Feature Request" or
            "Bug Report" and include as much detail as possible, including screenshots
            if applicable.
          </p>
        </div>
      </div>

      <div style={{ fontSize: "14px", color: "#777", textAlign: "center", marginTop: "16px" }}>
        AI Career Copilot Technologies<br />
        Email: support.aicareercopilot@gmail.com<br />
        <span style={{ color: "#999", fontSize: "13px" }}>
          Founded by <span style={{ color: "#e84c1e", fontWeight: 600 }}>Allabakash Arbaz</span>
        </span>
      </div>
    </div>
  );
}
