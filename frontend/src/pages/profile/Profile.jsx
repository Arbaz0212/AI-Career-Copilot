import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import API from "../../services/api";

export default function Profile() {
  const navigate = useNavigate();
  const [analyses, setAnalyses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [selectedAnalysis, setSelectedAnalysis] = useState(null);
  const [downloading, setDownloading] = useState(false);

  const userEmail = localStorage.getItem("user_email") || "User";
  const userName = localStorage.getItem("user_name") || "User";

  useEffect(() => {
    fetchHistory();
  }, []);

  const fetchHistory = async () => {
    setLoading(true);
    setError("");
    try {
      const res = await API.get("/jd-match/history");
      setAnalyses(res.data || []);
    } catch (err) {
      if (err.response?.status === 401) {
        setError("Please login to view your history.");
      } else {
        setError("Failed to load analysis history.");
      }
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem("access_token");
    localStorage.removeItem("user_email");
    localStorage.removeItem("user_name");
    navigate("/");
  };

  const handleDownload = async (analysisId) => {
    setDownloading(true);
    try {
      const res = await API.get(`/jd-match/download/${analysisId}`, {
        responseType: "blob",
      });
      const url = window.URL.createObjectURL(new Blob([res.data]));
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute("download", `tailored_resume_${analysisId}.html`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch (err) {
      setError("Failed to download tailored resume.");
    } finally {
      setDownloading(false);
    }
  };

  const getScoreColor = (score) => {
    if (score >= 80) return "#22c55e";
    if (score >= 60) return "#eab308";
    return "#ef4444";
  };

  const getStatusBadge = (status) => {
    if (status === "completed") return { text: "Completed", color: "#22c55e", bg: "#052e16" };
    if (status === "processing") return { text: "Processing...", color: "#eab308", bg: "#422006" };
    return { text: "Failed", color: "#ef4444", bg: "#450a0a" };
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return "";
    const d = new Date(dateStr);
    return d.toLocaleDateString("en-US", {
      month: "short", day: "numeric", year: "numeric",
      hour: "2-digit", minute: "2-digit",
    });
  };

  const truncate = (str, len) => str?.length > len ? str.slice(0, len) + "..." : str || "Untitled";

  return (
    <div style={styles.container}>
      {/* Header */}
      <div style={styles.header}>
        <div>
          <h1 style={styles.title}>My Profile</h1>
          <p style={styles.subtitle}>{userEmail}</p>
        </div>
        <div style={styles.headerActions}>
          <button onClick={fetchHistory} style={styles.refreshBtn} title="Refresh">
            &#x21bb; Refresh
          </button>
          <button onClick={handleLogout} style={styles.logoutBtn}>
            Logout
          </button>
        </div>
      </div>

      {/* Stats Card */}
      {!loading && analyses.length > 0 && (
        <div style={styles.statsRow}>
          <div style={styles.statCard}>
            <span style={styles.statNumber}>{analyses.length}</span>
            <span style={styles.statLabel}>Total Analyses</span>
          </div>
          <div style={styles.statCard}>
            <span style={styles.statNumber}>
              {analyses.filter(a => a.match_percentage >= 70).length}
            </span>
            <span style={styles.statLabel}>Strong Matches</span>
          </div>
          <div style={styles.statCard}>
            <span style={styles.statNumber}>
              {analyses.filter(a => a.status === "completed").length}
            </span>
            <span style={styles.statLabel}>Completed</span>
          </div>
        </div>
      )}

      {/* Error */}
      {error && (
        <div style={styles.errorBox}>
          {error}
          {error.includes("login") && (
            <button onClick={() => navigate("/")} style={styles.retryBtn}>
              Go to Login
            </button>
          )}
        </div>
      )}

      {/* Loading */}
      {loading && !error && (
        <div style={styles.loadingState}>
          <div style={styles.spinner}></div>
          <p>Loading your analysis history...</p>
        </div>
      )}

      {/* Empty State */}
      {!loading && !error && analyses.length === 0 && (
        <div style={styles.emptyState}>
          <div style={styles.emptyIcon}>&#x1F50D;</div>
          <h3 style={styles.emptyTitle}>No Analyses Yet</h3>
          <p style={styles.emptyText}>
            Your JD match analysis history will appear here once you start analyzing resumes.
          </p>
          <button
            onClick={() => navigate("/resume-jd-analysis")}
            style={styles.primaryBtn}
          >
            Analyze Your First Resume
          </button>
        </div>
      )}

      {/* Analysis List */}
      {!loading && !error && analyses.length > 0 && (
        <div style={styles.listContainer}>
          <h2 style={styles.sectionTitle}>Previous Analyses</h2>
          {analyses.map((a) => {
            const badge = getStatusBadge(a.status);
            return (
              <div
                key={a.id}
                style={{
                  ...styles.analysisCard,
                  borderLeft: a.status === "completed"
                    ? `4px solid ${getScoreColor(a.match_percentage)}`
                    : "4px solid #555",
                }}
                onClick={() => a.status === "completed" && setSelectedAnalysis(a)}
              >
                <div style={styles.cardMain}>
                  <div style={styles.cardInfo}>
                    <h3 style={styles.cardTitle}>
                      {a.job_title || "Job Description Analysis"}
                    </h3>
                    <p style={styles.cardMeta}>
                      {a.company_name ? `${a.company_name} · ` : ""}
                      {formatDate(a.created_at)}
                    </p>
                  </div>
                  <div style={styles.cardRight}>
                    {a.status === "completed" ? (
                      <>
                        <div style={{
                          ...styles.scoreBadge,
                          color: getScoreColor(a.match_percentage),
                          border: `2px solid ${getScoreColor(a.match_percentage)}`,
                        }}>
                          {Math.round(a.match_percentage)}%
                        </div>
                        <span style={styles.verdictText}>
                          {truncate(a.verdict?.split("—")[0]?.trim(), 20)}
                        </span>
                      </>
                    ) : (
                      <span style={{ ...styles.statusText, color: badge.color, background: badge.bg }}>
                        {badge.text}
                      </span>
                    )}
                  </div>
                </div>
                {a.status === "completed" && (
                  <div style={styles.cardActions}>
                    <button
                      onClick={(e) => { e.stopPropagation(); handleDownload(a.id); }}
                      style={styles.downloadBtn}
                      disabled={downloading}
                    >
                      &#x1F4E5; Download Tailored Resume
                    </button>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Analysis Detail Modal */}
      {selectedAnalysis && (
        <div style={styles.modalOverlay} onClick={() => setSelectedAnalysis(null)}>
          <div style={styles.modal} onClick={(e) => e.stopPropagation()}>
            <button style={styles.modalClose} onClick={() => setSelectedAnalysis(null)}>
              &times;
            </button>
            <h2 style={styles.modalTitle}>Analysis Details</h2>
            <div style={styles.modalBody}>
              <div style={styles.modalRow}>
                <span style={styles.modalLabel}>Job Title:</span>
                <span>{selectedAnalysis.job_title || "N/A"}</span>
              </div>
              <div style={styles.modalRow}>
                <span style={styles.modalLabel}>Company:</span>
                <span>{selectedAnalysis.company_name || "N/A"}</span>
              </div>
              <div style={styles.modalRow}>
                <span style={styles.modalLabel}>Match Score:</span>
                <span style={{ color: getScoreColor(selectedAnalysis.match_percentage), fontWeight: 600 }}>
                  {Math.round(selectedAnalysis.match_percentage)}%
                </span>
              </div>
              <div style={styles.modalRow}>
                <span style={styles.modalLabel}>Verdict:</span>
                <span>{selectedAnalysis.verdict || "N/A"}</span>
              </div>
              <div style={styles.modalRow}>
                <span style={styles.modalLabel}>Analyzed on:</span>
                <span>{formatDate(selectedAnalysis.completed_at)}</span>
              </div>
            </div>
            <button
              onClick={() => handleDownload(selectedAnalysis.id)}
              style={styles.primaryBtn}
              disabled={downloading}
            >
              {downloading ? "Downloading..." : "Download Tailored Resume"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

const styles = {
  container: {
    maxWidth: "900px",
    margin: "0 auto",
    padding: "30px 20px",
    minHeight: "100vh",
    color: "#e2e8f0",
  },
  header: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: "30px",
    flexWrap: "wrap",
    gap: "16px",
  },
  title: {
    fontSize: "28px",
    fontWeight: 700,
    margin: 0,
    color: "#f1f5f9",
  },
  subtitle: {
    color: "#94a3b8",
    fontSize: "14px",
    margin: "4px 0 0",
  },
  headerActions: {
    display: "flex",
    gap: "10px",
  },
  refreshBtn: {
    padding: "10px 20px",
    borderRadius: "10px",
    border: "1px solid #475569",
    background: "transparent",
    color: "#e2e8f0",
    cursor: "pointer",
    fontSize: "14px",
  },
  logoutBtn: {
    padding: "10px 20px",
    borderRadius: "10px",
    border: "none",
    background: "#dc2626",
    color: "white",
    cursor: "pointer",
    fontSize: "14px",
  },
  statsRow: {
    display: "flex",
    gap: "16px",
    marginBottom: "30px",
    flexWrap: "wrap",
  },
  statCard: {
    flex: 1,
    minWidth: "120px",
    background: "#1e293b",
    borderRadius: "12px",
    padding: "20px",
    textAlign: "center",
    border: "1px solid #334155",
  },
  statNumber: {
    display: "block",
    fontSize: "28px",
    fontWeight: 700,
    color: "#ff7a1a",
  },
  statLabel: {
    display: "block",
    fontSize: "12px",
    color: "#94a3b8",
    marginTop: "4px",
    textTransform: "uppercase",
    letterSpacing: "0.5px",
  },
  errorBox: {
    background: "rgba(239, 68, 68, 0.15)",
    border: "1px solid rgba(239, 68, 68, 0.4)",
    padding: "16px",
    borderRadius: "12px",
    marginBottom: "20px",
    color: "#fca5a5",
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
  },
  retryBtn: {
    padding: "8px 16px",
    borderRadius: "8px",
    border: "none",
    background: "#ff7a1a",
    color: "white",
    cursor: "pointer",
    fontSize: "13px",
  },
  loadingState: {
    textAlign: "center",
    padding: "60px 20px",
    color: "#94a3b8",
  },
  spinner: {
    width: "40px",
    height: "40px",
    border: "4px solid #334155",
    borderTop: "4px solid #ff7a1a",
    borderRadius: "50%",
    animation: "spin 0.8s linear infinite",
    margin: "0 auto 16px",
  },
  emptyState: {
    textAlign: "center",
    padding: "80px 20px",
    background: "#1e293b",
    borderRadius: "16px",
    border: "1px solid #334155",
  },
  emptyIcon: {
    fontSize: "48px",
    marginBottom: "16px",
  },
  emptyTitle: {
    fontSize: "22px",
    fontWeight: 600,
    color: "#f1f5f9",
    margin: "0 0 8px",
  },
  emptyText: {
    color: "#94a3b8",
    maxWidth: "400px",
    margin: "0 auto 24px",
    lineHeight: "1.5",
  },
  primaryBtn: {
    padding: "12px 28px",
    borderRadius: "10px",
    border: "none",
    background: "#ff7a1a",
    color: "white",
    cursor: "pointer",
    fontSize: "15px",
    fontWeight: 600,
  },
  listContainer: {
    marginTop: "10px",
  },
  sectionTitle: {
    fontSize: "20px",
    fontWeight: 600,
    marginBottom: "16px",
    color: "#f1f5f9",
  },
  analysisCard: {
    background: "#1e293b",
    borderRadius: "12px",
    padding: "18px 20px",
    marginBottom: "12px",
    border: "1px solid #334155",
    cursor: "pointer",
    transition: "all 0.2s",
  },
  cardMain: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    gap: "16px",
  },
  cardInfo: {
    flex: 1,
    minWidth: 0,
  },
  cardTitle: {
    fontSize: "16px",
    fontWeight: 600,
    margin: "0 0 4px",
    color: "#f1f5f9",
  },
  cardMeta: {
    fontSize: "13px",
    color: "#64748b",
    margin: 0,
  },
  cardRight: {
    display: "flex",
    alignItems: "center",
    gap: "12px",
    flexShrink: 0,
  },
  scoreBadge: {
    width: "50px",
    height: "50px",
    borderRadius: "50%",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontWeight: 700,
    fontSize: "16px",
  },
  verdictText: {
    fontSize: "13px",
    color: "#94a3b8",
    maxWidth: "140px",
    textAlign: "right",
  },
  statusText: {
    fontSize: "12px",
    padding: "4px 12px",
    borderRadius: "6px",
    fontWeight: 600,
  },
  cardActions: {
    marginTop: "12px",
    paddingTop: "12px",
    borderTop: "1px solid #334155",
    display: "flex",
    gap: "8px",
  },
  downloadBtn: {
    padding: "8px 16px",
    borderRadius: "8px",
    border: "1px solid #475569",
    background: "transparent",
    color: "#e2e8f0",
    cursor: "pointer",
    fontSize: "13px",
  },
  modalOverlay: {
    position: "fixed",
    top: 0, left: 0, right: 0, bottom: 0,
    background: "rgba(0, 0, 0, 0.7)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    zIndex: 1000,
  },
  modal: {
    background: "#1e293b",
    borderRadius: "16px",
    padding: "30px",
    maxWidth: "500px",
    width: "90%",
    border: "1px solid #334155",
    position: "relative",
  },
  modalClose: {
    position: "absolute",
    top: "16px",
    right: "20px",
    background: "none",
    border: "none",
    color: "#94a3b8",
    fontSize: "28px",
    cursor: "pointer",
  },
  modalTitle: {
    fontSize: "22px",
    fontWeight: 600,
    color: "#f1f5f9",
    margin: "0 0 20px",
  },
  modalBody: {
    marginBottom: "24px",
  },
  modalRow: {
    display: "flex",
    justifyContent: "space-between",
    padding: "10px 0",
    borderBottom: "1px solid #334155",
    fontSize: "14px",
    gap: "12px",
  },
  modalLabel: {
    color: "#94a3b8",
    flexShrink: 0,
  },
};

// Inject spinner animation keyframes
const styleSheet = document.createElement("style");
styleSheet.textContent = `@keyframes spin { to { transform: rotate(360deg); } }`;
document.head.appendChild(styleSheet);
