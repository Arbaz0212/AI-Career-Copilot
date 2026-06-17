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
  .policy-section ul {
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

export default function ShippingPolicy() {
  return (
    <div className="policy-page">
      <style>{styles}</style>
      <Link to="/" className="policy-back">← Back to Home</Link>

      <div className="policy-header">
        <h1>Shipping Policy</h1>
        <p className="policy-date">Last updated: June 15, 2026</p>
      </div>

      <div className="policy-section">
        <div className="highlight-box">
          <p>
            <strong>AI Career Copilot is a digital-only platform.</strong> We do not ship any
            physical goods. All products and services are delivered electronically. This policy
            explains how digital products are delivered.
          </p>
        </div>
      </div>

      <div className="policy-section">
        <h2>1. Nature of Service</h2>
        <p>
          AI Career Copilot provides digital services only — including resume analysis reports,
          ATS scores, job matching insights, and cover letter drafts. These are delivered
          instantly through your web browser upon successful analysis.
        </p>
      </div>

      <div className="policy-section">
        <h2>2. Delivery of Purchases</h2>
        <h3>2.1 Scan Packs</h3>
        <p>
          When you purchase a scan pack, the scans are credited to your account immediately
          upon payment verification. There is no physical delivery. You can view your
          updated scan balance instantly in the dashboard.
        </p>

        <h3>2.2 Analysis Results</h3>
        <p>
          All analysis results — including resume reviews, JD match scores, AI feedback,
          and tailored resumes — are delivered directly within your browser after the
          analysis completes. Results are also saved to your account history for future access.
        </p>

        <h3>2.3 Downloadable Reports</h3>
        <p>
          Tailored resumes are available as HTML documents that can be downloaded from
          your analysis history page. No physical shipment occurs.
        </p>
      </div>

      <div className="policy-section">
        <h2>3. Delivery Timeline</h2>
        <table>
          <thead>
            <tr>
              <th>Product/Service</th>
              <th>Delivery Method</th>
              <th>Delivery Time</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>Scan Pack Credits</td>
              <td>Credit to account</td>
              <td>Instant (upon payment verification)</td>
            </tr>
            <tr>
              <td>Resume Review Report</td>
              <td>Browser dashboard</td>
              <td>5-15 seconds</td>
            </tr>
            <tr>
              <td>JD Match Analysis</td>
              <td>Browser dashboard</td>
              <td>10-30 seconds</td>
            </tr>
            <tr>
              <td>Tailored Resume Download</td>
              <td>HTML file download</td>
              <td>Available immediately after analysis</td>
            </tr>
          </tbody>
        </table>
      </div>

      <div className="policy-section">
        <h2>4. Geographic Availability</h2>
        <p>
          Our services are available to users in India. The Platform is priced in Indian
          Rupees (INR) and is designed for the Indian job market. Users outside India may
          access the Platform but should note that analysis is optimized for Indian ATS
          systems and job market contexts.
        </p>
      </div>

      <div className="policy-section">
        <h2>5. Service Availability</h2>
        <p>
          Our services are delivered over the internet and require an active internet connection.
          We strive for 99.9% uptime but cannot guarantee uninterrupted service due to
          factors beyond our control (network outages, cloud provider downtime, etc.).
        </p>
      </div>

      <div className="policy-section">
        <h2>6. Contact</h2>
        <p>
          For questions about this policy, contact:<br />
          <strong>Email:</strong> support.aicareercopilot@gmail.com<br />
          <strong>Company:</strong> AI Career Copilot Technologies<br />
          <strong>Entity:</strong> AI Career Copilot Technologies
        </p>
      </div>
    </div>
  );
}
