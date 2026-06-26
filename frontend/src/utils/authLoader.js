/**
 * DOM-based full-screen auth loader.
 * Injected directly into document.body so it survives React route changes.
 * Show on auth click, dismiss when dashboard mounts.
 */

const LOADER_ID = "ai-copilot-auth-loader";

const STYLES = `
  @keyframes ai-spin {
    0% { transform: rotate(0deg); }
    100% { transform: rotate(360deg); }
  }
  @keyframes ai-pulse {
    0%, 100% { opacity: 0.6; transform: scale(1); }
    50% { opacity: 1; transform: scale(1.05); }
  }
  @keyframes ai-ring-dash {
    0% { stroke-dashoffset: 565; }
    50% { stroke-dashoffset: 141; }
    100% { stroke-dashoffset: 565; }
  }
  @keyframes ai-fade-in {
    from { opacity: 0; }
    to { opacity: 1; }
  }
  @keyframes ai-slide-up {
    from { opacity: 0; transform: translateY(16px); }
    to { opacity: 1; transform: translateY(0); }
  }
  @keyframes ai-dot-bounce {
    0%, 80%, 100% { transform: scale(0); opacity: 0.3; }
    40% { transform: scale(1); opacity: 1; }
  }
  @keyframes ai-progress {
    0% { width: 0%; }
    30% { width: 35%; }
    60% { width: 65%; }
    100% { width: 90%; }
  }
  @keyframes ai-glow {
    0%, 100% { box-shadow: 0 0 20px rgba(232, 76, 30, 0.3); }
    50% { box-shadow: 0 0 40px rgba(232, 76, 30, 0.6); }
  }
  @keyframes ai-float {
    0%, 100% { transform: translateY(0); }
    50% { transform: translateY(-4px); }
  }
`;

export function showAuthLoader() {
  if (document.getElementById(LOADER_ID)) return; // already showing

  const overlay = document.createElement("div");
  overlay.id = LOADER_ID;
  overlay.style.cssText = `
    position: fixed; inset: 0; z-index: 999999;
    display: flex; flex-direction: column;
    align-items: center; justify-content: center;
    background: rgba(15, 14, 10, 0.85);
    backdrop-filter: blur(12px); -webkit-backdrop-filter: blur(12px);
    animation: ai-fade-in 0.35s ease-out;
    font-family: 'Cabinet Grotesk', 'Inter', -apple-system, sans-serif;
    overflow: hidden;
  `;

  overlay.innerHTML = `
    <style>${STYLES}</style>

    <!-- Ambient glow -->
    <div style="
      position: absolute; width: 400px; height: 400px;
      background: radial-gradient(circle, rgba(232,76,30,0.12) 0%, transparent 70%);
      border-radius: 50%;
      animation: ai-pulse 3s ease-in-out infinite;
      pointer-events: none;
    "></div>

    <!-- Logo + Ring -->
    <div style="
      position: relative; width: 100px; height: 100px; margin-bottom: 32px;
      animation: ai-float 2.5s ease-in-out infinite;
    ">
      <!-- Spinning ring -->
      <svg width="100" height="100" viewBox="0 0 200 200" style="position: absolute; inset: 0; animation: ai-spin 1.2s cubic-bezier(0.5, 0, 0.5, 1) infinite;">
        <defs>
          <linearGradient id="ringGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stop-color="#e84c1e" />
            <stop offset="50%" stop-color="#ff7a1a" />
            <stop offset="100%" stop-color="#e84c1e" stop-opacity="0.3" />
          </linearGradient>
        </defs>
        <circle cx="100" cy="100" r="85" fill="none" stroke="rgba(255,255,255,0.06)" stroke-width="6" />
        <circle cx="100" cy="100" r="85" fill="none" stroke="url(#ringGrad)" stroke-width="6"
          stroke-linecap="round" stroke-dasharray="565" stroke-dashoffset="424"
          style="animation: ai-ring-dash 1.8s ease-in-out infinite; transform-origin: center;" />
      </svg>

      <!-- AI Badge -->
      <div style="
        position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%);
        width: 56px; height: 56px;
        background: linear-gradient(135deg, #e84c1e, #c93d14);
        border-radius: 16px; display: flex; align-items: center; justify-content: center;
        font-family: 'Clash Display', 'Inter', sans-serif;
        font-size: 22px; font-weight: 800; color: #fff;
        letter-spacing: -1px;
        animation: ai-glow 2s ease-in-out infinite;
      ">AI</div>
    </div>

    <!-- Brand name -->
    <div style="
      font-size: 22px; font-weight: 700; color: rgba(255,255,255,0.9);
      font-family: 'Clash Display', 'Cabinet Grotesk', sans-serif;
      letter-spacing: -0.3px; margin-bottom: 6px;
      animation: ai-slide-up 0.4s ease 0.15s both;
    ">AI Career Copilot</div>

    <!-- Status text -->
    <div id="ai-loader-status" style="
      font-size: 14px; color: rgba(255,255,255,0.45);
      font-weight: 500; letter-spacing: 0.3px;
      margin-bottom: 28px;
      animation: ai-slide-up 0.4s ease 0.3s both;
    ">Signing you in</div>

    <!-- Animated dots -->
    <div style="display: flex; gap: 6px; animation: ai-slide-up 0.4s ease 0.4s both;">
      <div style="width: 6px; height: 6px; background: #e84c1e; border-radius: 50%; animation: ai-dot-bounce 1.4s ease-in-out infinite both;"></div>
      <div style="width: 6px; height: 6px; background: #e84c1e; border-radius: 50%; animation: ai-dot-bounce 1.4s ease-in-out 0.16s infinite both;"></div>
      <div style="width: 6px; height: 6px; background: #e84c1e; border-radius: 50%; animation: ai-dot-bounce 1.4s ease-in-out 0.32s infinite both;"></div>
    </div>

    <!-- Subtle progress bar -->
    <div style="
      position: fixed; bottom: 0; left: 0; right: 0; height: 3px;
      background: rgba(255,255,255,0.06);
    ">
      <div style="
        height: 100%; background: linear-gradient(90deg, #e84c1e, #ff7a1a);
        border-radius: 0 2px 2px 0;
        animation: ai-progress 2s ease-out forwards;
      "></div>
    </div>
  `;

  document.body.appendChild(overlay);
}

export function hideAuthLoader() {
  const el = document.getElementById(LOADER_ID);
  if (!el) return;
  el.style.opacity = "0";
  el.style.transition = "opacity 0.3s ease";
  setTimeout(() => el.remove(), 350);
}
