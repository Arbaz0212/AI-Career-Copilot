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

export default function RefundPolicy() {
  return (
    <div className="policy-page">
      <style>{styles}</style>
      <Link to="/" className="policy-back">← Back to Home</Link>

      <div className="policy-header">
        <h1>Refund & Cancellation Policy</h1>
        <p className="policy-date">Last updated: June 15, 2026</p>
      </div>

      <div className="policy-section">
        <h2>1. Overview</h2>
        <p>
          AI Career Copilot sells digital scan packs that are consumed upon use. Because our
          service involves digital processing and AI analysis that begins at the time of purchase,
          this policy governs the terms under which refunds are considered.
        </p>
      </div>

      <div className="policy-section">
        <h2>2. No Refund Policy — Scan Packs</h2>
        <div className="highlight-box">
          <p>
            <strong>All purchases of scan packs are final and non-refundable.</strong> This includes
            both used and unused scans. Once a scan pack is purchased, the scans are credited to
            your account and cannot be converted back to cash.
          </p>
        </div>
        <p>This policy applies because:</p>
        <ul>
          <li>Scan packs are digital goods that are delivered instantly upon payment verification</li>
          <li>Each scan has a fixed validity period of 30 days, giving you adequate time to use them</li>
          <li>The value of scans is consumed incrementally and cannot be returned partially</li>
          <li>AI processing costs are incurred per scan, making pro-rata refunds unviable</li>
        </ul>
      </div>

      <div className="policy-section">
        <h2>3. Scan Expiry</h2>
        <p>
          All purchased scan packs are valid for 30 days from the date of purchase. Once the
          30-day period has elapsed, any unused scans will expire and cannot be reinstated or
          refunded. The expiry date is clearly displayed at the time of purchase.
        </p>
      </div>

      <div className="policy-section">
        <h2>4. Exceptions</h2>
        <p>
          Refunds may be considered only in the following exceptional circumstances, determined
          at the sole discretion of AI Career Copilot Technologies Pvt Ltd:
        </p>
        <ul>
          <li><strong>Duplicate Purchase:</strong> If you accidentally purchase the same plan twice within a short period, we may refund the duplicate</li>
          <li><strong>Technical Failure:</strong> If a verified payment is not credited to your account due to a technical error on our side, and the webhook backup also fails, we will investigate and may issue a refund</li>
          <li><strong>Platform Error:</strong> If you are charged an incorrect amount due to a pricing display error on the Platform</li>
        </ul>
        <p>
          All exception requests must be submitted within 7 days of purchase with supporting
          evidence (payment receipt, screenshots, etc.).
        </p>
      </div>

      <div className="policy-section">
        <h2>5. How to Request an Exception</h2>
        <p>
          To request a refund under the exceptions listed above:
        </p>
        <ol>
          <li>Email us at <strong>support.aicareercopilot@gmail.com</strong> with the subject "Refund Request"</li>
          <li>Include your registered email address and Razorpay payment ID</li>
          <li>Provide a clear explanation of the issue</li>
          <li>Attach any supporting documents (payment screenshot, error messages)</li>
        </ol>
        <p>
          We will review your request and respond within 5-7 business days. Approved refunds
          will be processed to the original payment method within 10 business days.
        </p>
      </div>

      <div className="policy-section">
        <h2>6. Chargebacks</h2>
        <p>
          If you initiate a chargeback with your bank or payment provider without first contacting
          us, your account will be immediately suspended, and you will forfeit all remaining
          scans. We actively dispute invalid chargebacks by providing proof of delivery
          (payment records and scan usage logs) to Razorpay.
        </p>
      </div>

      <div className="policy-section">
        <h2>7. Free Scans</h2>
        <p>
          Free scans provided at registration carry no monetary value and are not eligible for
          refund. They cannot be exchanged for cash, credit, or other products.
        </p>
      </div>

      <div className="policy-section">
        <h2>8. Contact</h2>
        <p>
          For refund-related inquiries, contact:<br />
          <strong>Email:</strong> support.aicareercopilot@gmail.com<br />
          <strong>Company:</strong> AI Career Copilot Technologies<br />
          <strong>Founder:</strong> Allabakash Arbaz<br />
          <strong>Response Time:</strong> 5-7 business days
        </p>
      </div>
    </div>
  );
}
