export default function AboutUs() {
  return (
    <div style={styles.wrapper}>
      <div style={styles.container}>
        {/* Header */}
        <div style={styles.header}>
          <h1 style={styles.title}>About <span style={{ color: "#e84c1e" }}>AI Career Copilot</span></h1>
          <p style={styles.subtitle}>
            We're on a mission to level the playing field for every job seeker in India.
          </p>
        </div>

        {/* The Problem */}
        <div style={styles.card}>
          <h2 style={styles.cardTitle}>The Problem We Saw</h2>
          <p style={styles.cardText}>
            Most job seekers never hear back — not because they aren't qualified, but because their
            resumes get filtered out by ATS before any human reads them. Generic AI tools give vague
            advice like "looks good." We knew we could do better.
          </p>
        </div>

        {/* Our Solution */}
        <div style={styles.card}>
          <h2 style={styles.cardTitle}>What We Built</h2>
          <p style={styles.cardText}>
            AI Career Copilot is a purpose-built ATS resume analyzer and job-matching platform
            designed specifically for the Indian job market. Unlike generic AI tools, we:
          </p>
          <ul style={styles.list}>
            <li style={styles.listItem}>Score your resume across 4 critical ATS dimensions</li>
            <li style={styles.listItem}>Match your resume against real job descriptions</li>
            <li style={styles.listItem}>Detect missing keywords that ATS filters look for</li>
            <li style={styles.listItem}>Generate tailored cover letters per job</li>
            <li style={styles.listItem}>Match you with live job openings via JobSense AI</li>
          </ul>
        </div>

        {/* Why India-First */}
        <div style={styles.card}>
          <h2 style={styles.cardTitle}>Why India-First?</h2>
          <p style={styles.cardText}>
            The Indian job market is unique — companies like TCS, Infosys, Razorpay, and Zepto use
            different ATS filters, expect different keywords, and prioritize different skills than
            their Western counterparts. We baked that intelligence directly into our engine so
            you're not fighting a system built for another country.
          </p>
        </div>

        {/* Founder */}
        <div style={styles.founderSection}>
          <div style={styles.founderAvatar}>
            <span style={styles.founderInitials}>AA</span>
          </div>
          <div style={styles.founderInfo}>
            <h3 style={styles.founderName}>Allabakash Arbaz</h3>
            <p style={styles.founderRole}>Founder & Developer</p>
            <p style={styles.founderBio}>
              Allabakash is a full-stack developer and startup founder who experienced the
              frustration of ATS rejection firsthand. He built AI Career Copilot to solve a
              problem he lived — not a trend he chased. Every feature ships because it helps
              someone get an interview.
            </p>
          </div>
        </div>

        {/* Our Promise */}
        <div style={styles.card}>
          <h2 style={styles.cardTitle}>Our Promise to You</h2>
          <ul style={styles.list}>
            <li style={styles.listItem}><strong>No fake stats</strong> — every score is real and explainable</li>
            <li style={styles.listItem}><strong>Your data stays yours</strong> — we never train on your resume</li>
            <li style={styles.listItem}><strong>Free to start</strong> — no credit card needed for your first scan</li>
            <li style={styles.listItem}><strong>Built for India</strong> — not a Western tool with a coat of paint</li>
          </ul>
        </div>

        {/* Contact CTA */}
        <div style={styles.ctaSection}>
          <p style={styles.ctaText}>
            Have questions? Want to partner? Just want to say hi?
          </p>
          <a href="/contact" style={styles.ctaBtn}>Get in Touch →</a>
        </div>
      </div>
    </div>
  );
}

const styles = {
  wrapper: {
    minHeight: "100vh",
    background: "#f5f0e8",
    padding: "60px 20px",
  },
  container: {
    maxWidth: "760px",
    margin: "0 auto",
  },
  header: {
    textAlign: "center",
    marginBottom: "48px",
  },
  title: {
    fontFamily: "'Clash Display', 'Cabinet Grotesk', sans-serif",
    fontSize: "clamp(32px, 5vw, 44px)",
    fontWeight: 800,
    color: "#0f0e0a",
    margin: "0 0 16px",
    lineHeight: "1.1",
    letterSpacing: "-1px",
  },
  subtitle: {
    fontSize: "18px",
    color: "#666",
    lineHeight: "1.6",
    maxWidth: "520px",
    margin: "0 auto",
  },
  card: {
    background: "#ffffff",
    border: "1px solid #d4cdc0",
    padding: "32px",
    marginBottom: "20px",
  },
  cardTitle: {
    fontFamily: "'Clash Display', 'Cabinet Grotesk', sans-serif",
    fontSize: "20px",
    fontWeight: 700,
    color: "#0f0e0a",
    margin: "0 0 12px",
  },
  cardText: {
    fontSize: "15px",
    color: "#555",
    lineHeight: "1.7",
    margin: 0,
  },
  list: {
    margin: "12px 0 0",
    padding: "0 0 0 20px",
  },
  listItem: {
    fontSize: "15px",
    color: "#555",
    lineHeight: "1.8",
  },
  founderSection: {
    background: "#0f0e0a",
    padding: "36px",
    marginBottom: "20px",
    display: "flex",
    gap: "24px",
    alignItems: "flex-start",
    flexWrap: "wrap",
  },
  founderAvatar: {
    width: "72px",
    height: "72px",
    borderRadius: "50%",
    background: "#e84c1e",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
  },
  founderInitials: {
    fontFamily: "'Clash Display', sans-serif",
    fontWeight: 700,
    fontSize: "24px",
    color: "#fff",
  },
  founderInfo: {
    flex: 1,
    minWidth: "200px",
  },
  founderName: {
    fontFamily: "'Clash Display', sans-serif",
    fontSize: "20px",
    fontWeight: 700,
    color: "#f5f0e8",
    margin: "0 0 2px",
  },
  founderRole: {
    fontSize: "13px",
    color: "#e84c1e",
    fontWeight: 600,
    margin: "0 0 10px",
    textTransform: "uppercase",
    letterSpacing: "1px",
  },
  founderBio: {
    fontSize: "14px",
    color: "#888",
    lineHeight: "1.7",
    margin: 0,
  },
  ctaSection: {
    textAlign: "center",
    padding: "40px 20px",
  },
  ctaText: {
    fontSize: "16px",
    color: "#666",
    marginBottom: "20px",
  },
  ctaBtn: {
    display: "inline-block",
    padding: "14px 32px",
    background: "#e84c1e",
    color: "#fff",
    textDecoration: "none",
    fontSize: "15px",
    fontWeight: 600,
    fontFamily: "'Cabinet Grotesk', sans-serif",
    transition: "opacity 0.2s",
  },
};
