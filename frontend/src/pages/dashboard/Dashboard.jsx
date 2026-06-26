import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
// Only the payment modal uses motion.div
import ResumeReviewPage from "./ResumeReviewPage";
import JDMatchPage from "./JDMatchPage";
import API from "../../services/api";
import { hideAuthLoader } from "../../utils/authLoader";

// ── STYLES ──────────────────────────────────────────────────────────────────
const styles = `
  @import url('https://fonts.googleapis.com/css2?family=Clash+Display:wght@400;500;600;700&family=Cabinet+Grotesk:wght@300;400;500;600;700&display=swap');

  *, *::before, *::after { margin: 0; padding: 0; box-sizing: border-box; }

  :root {
    --bg: #f5f0e8;
    --ink: #0f0e0a;
    --accent: #e84c1e;
    --accent2: #2d6a4f;
    --muted: #8a8070;
    --card: #ede8df;
    --border: #d4cdc0;
    --gold: #c9922a;
    --white: #ffffff;
    --sidebar: 260px;
    /* Fluid type scale */
    --text-xs: clamp(11px, 2.5vw, 13px);
    --text-sm: clamp(12px, 2.8vw, 14px);
    --text-base: clamp(14px, 3.2vw, 15px);
    --text-lg: clamp(18px, 4vw, 22px);
    --text-xl: clamp(22px, 5vw, 28px);
    --text-2xl: clamp(26px, 6vw, 38px);
    --text-3xl: clamp(30px, 7vw, 48px);
  }

  html { scroll-behavior: smooth; }

  body {
    background: var(--bg);
    color: var(--ink);
    font-family: 'Cabinet Grotesk', sans-serif;
    font-size: var(--text-base);
    line-height: 1.6;
    overflow-x: hidden;
    min-height: 100vh;
    padding-top: env(safe-area-inset-top, 0);
    padding-bottom: env(safe-area-inset-bottom, 0);
    padding-left: env(safe-area-inset-left, 0);
    padding-right: env(safe-area-inset-right, 0);
  }

  .noise-overlay {
    content: '';
    position: fixed;
    inset: 0;
    background-image: url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)' opacity='0.03'/%3E%3C/svg%3E");
    pointer-events: none;
    z-index: 9999;
    opacity: 0.3;
  }

  /* LAYOUT */
  .layout { display: flex; min-height: 100vh; }

  /* SIDEBAR */
  .sidebar {
    width: var(--sidebar);
    background: var(--ink);
    display: flex;
    flex-direction: column;
    position: fixed;
    top: 0; left: 0; bottom: 0;
    z-index: 100;
  }
  .sidebar-inner { display: flex; flex-direction: column; height: 100%; }
  .sidebar-header { flex-shrink: 0; }
  .sidebar-scroll-area {
    flex: 1; overflow-y: auto; overflow-x: hidden; min-height: 0;
    -webkit-overflow-scrolling: touch;
    overscroll-behavior: contain;
    will-change: scroll-position;
  }
  .sidebar-scroll-area::-webkit-scrollbar { width: 4px; }
  .sidebar-scroll-area::-webkit-scrollbar-thumb { background: #2a2a2a; border-radius: 999px; }
  .sidebar-scroll-area::-webkit-scrollbar-track { background: transparent; }
  .sidebar-footer { flex-shrink: 0; }

  .sidebar-logo { padding: 26px 26px 22px; border-bottom: 1px solid #1e1e1e; }
  .logo-text { font-family: 'Clash Display', sans-serif; font-weight: 700; font-size: 20px; color: var(--bg); letter-spacing: -0.5px; }
  .logo-text span { color: var(--accent); }
  .logo-sub { font-size: 10px; color: #383838; letter-spacing: 2px; text-transform: uppercase; margin-top: 3px; }

  .user-card { padding: 20px 22px; border-bottom: 1px solid #1a1a1a; }
  .user-top { display: flex; align-items: center; gap: 12px; margin-bottom: 14px; }
  .user-avatar {
    width: 42px; height: 42px; min-width: 42px; min-height: 42px; border-radius: 50%;
    background: var(--accent);
    display: flex; align-items: center; justify-content: center;
    font-family: 'Clash Display', sans-serif; font-weight: 700; font-size: 17px; color: #fff;
    flex-shrink: 0; position: relative; aspect-ratio: 1;
  }
  .user-online {
    position: absolute; bottom: 1px; right: 1px;
    width: 9px; height: 9px; min-width: 9px; min-height: 9px; background: #4ade80;
    border-radius: 50%; border: 1.5px solid var(--ink);
  }
  .user-name { font-size: 14px; font-weight: 700; color: var(--bg); }
  .user-email { font-size: 11px; color: #444; margin-top: 1px; word-break: break-all; }
  .user-plan-badge {
    display: inline-flex; align-items: center; gap: 5px;
    background: #111; border: 1px solid #222;
    padding: 4px 10px; font-size: 10px; font-weight: 700;
    letter-spacing: 1px; text-transform: uppercase; color: #555;
  }
  .user-stats {
    display: grid; grid-template-columns: 1fr 1fr;
    gap: 1px; background: #1a1a1a;
    border: 1px solid #1a1a1a; margin-top: 14px;
  }
  .user-stat { background: #0d0d0d; padding: 10px 12px; text-align: center; }
  .user-stat-num { font-family: 'Clash Display', sans-serif; font-weight: 700; font-size: 18px; color: var(--bg); }
  .user-stat-label { font-size: 10px; color: #444; letter-spacing: 0.5px; margin-top: 1px; }

  .sidebar-nav { padding: 14px 0; }
  .nav-label { font-size: 9px; font-weight: 700; letter-spacing: 2.5px; text-transform: uppercase; color: #2a2a2a; padding: 10px 24px 5px; }
  .nav-item {
    display: flex; align-items: center; gap: 11px;
    padding: 10px 22px; color: #555; font-size: 13px; font-weight: 500;
    cursor: pointer; transition: all 0.15s;
    border-left: 3px solid transparent; text-decoration: none;
    background: transparent; border-right: none; border-top: none; border-bottom: none;
    width: 100%; text-align: left;
  }
  .nav-item:hover { color: var(--bg); background: #0a0a0a; }
  .nav-item.active { color: var(--bg); background: #111; border-left-color: var(--accent); }
  .nav-icon { font-size: 15px; width: 18px; text-align: center; flex-shrink: 0; will-change: transform; }
  .nav-badge { margin-left: auto; background: var(--accent); color: #fff; font-size: 9px; font-weight: 700; padding: 2px 6px; }
  .nav-badge.gold { background: var(--gold); }

  .sidebar-bottom { padding: 18px 22px; border-top: 1px solid #1a1a1a; }
  .logout-btn { display: flex; align-items: center; gap: 10px; color: #333; font-size: 13px; cursor: pointer; padding: 8px 0; transition: color 0.15s; background: none; border: none; width: 100%; }
  .logout-btn:hover { color: #555; }

  /* MAIN */
  .main { margin-left: var(--sidebar); flex: 1; display: flex; flex-direction: column; }

  /* TOPBAR */
  .topbar {
    background: var(--bg); border-bottom: 1px solid var(--border);
    padding: 0 40px; height: 62px;
    display: flex; align-items: center; justify-content: space-between;
    position: sticky; top: 0; z-index: 50;
  }
  .page-title { font-family: 'Clash Display', sans-serif; font-weight: 700; font-size: 19px; letter-spacing: -0.5px; }
  .page-sub { font-size: 11px; color: var(--muted); margin-top: 1px; }
  .topbar-right { display: flex; align-items: center; gap: 12px; }

  .hamburger-btn {
    display: none; width: 36px; height: 36px; background: var(--card);
    border: 1px solid var(--border); align-items: center; justify-content: center;
    cursor: pointer; font-size: 18px; transition: background 0.15s;
    border-radius: 8px;
  }
  .hamburger-btn:hover { background: var(--border); }

  .mobile-avatar-btn {
    display: none; width: 36px; height: 36px; min-width: 36px; min-height: 36px; border-radius: 50%;
    background: var(--accent); color: #fff; align-items: center; justify-content: center;
    font-weight: 700; font-size: 15px; cursor: pointer; flex-shrink: 0;
    border: none; font-family: 'Clash Display', sans-serif; aspect-ratio: 1;
  }

  .notif-btn {
    width: 36px; height: 36px; background: var(--card);
    border: 1px solid var(--border); display: flex; align-items: center;
    justify-content: center; cursor: pointer; font-size: 15px;
    position: relative; transition: background 0.15s;
  }
  .notif-btn:hover { background: var(--border); }
  .notif-dot { position: absolute; top: 7px; right: 7px; width: 6px; height: 6px; background: var(--accent); border-radius: 50%; border: 1.5px solid var(--bg); }
  .free-scan-pill { display: flex; align-items: center; gap: 6px; background: var(--card); border: 1px solid var(--border); padding: 6px 14px; font-size: 12px; font-weight: 600; }
  .pill-dot { width: 6px; height: 6px; background: var(--accent2); border-radius: 50%; }

  /* CONTENT */
  .content { padding: 32px 40px; flex: 1; }
  .content > div > * { content-visibility: auto; contain-intrinsic-size: 500px; }

  /* GREETING */
  .greeting { margin-bottom: 32px; }
  .greeting-tag { font-size: 10px; font-weight: 700; letter-spacing: 2px; text-transform: uppercase; color: var(--muted); margin-bottom: 8px; }
  .greeting-title { font-family: 'Clash Display', sans-serif; font-size: clamp(26px, 2.8vw, 38px); font-weight: 700; letter-spacing: -1px; line-height: 1.1; }
  .greeting-title span { color: var(--accent); }
  .greeting-sub { font-size: 14px; color: var(--muted); margin-top: 8px; max-width: 520px; }

  /* FREE BANNER */
  .free-banner {
    display: flex; align-items: center; justify-content: space-between; gap: 20px;
    background: var(--ink); padding: 18px 28px;
    margin-bottom: 32px; border-left: 4px solid var(--accent2);
  }
  .free-banner-title { font-family: 'Clash Display', sans-serif; font-weight: 700; font-size: 15px; color: var(--bg); margin-bottom: 3px; }
  .free-banner-sub { font-size: 12px; color: #555; }
  .free-banner-btn {
    background: var(--accent2); color: #fff; border: none;
    padding: 9px 20px; font-family: 'Clash Display', sans-serif;
    font-weight: 700; font-size: 12px; letter-spacing: 0.5px;
    cursor: pointer; white-space: nowrap; transition: opacity 0.2s; flex-shrink: 0;
  }
  .free-banner-btn:hover { opacity: 0.85; }

  /* SECTION HEAD */
  .section-head { display: flex; align-items: baseline; gap: 12px; margin-bottom: 20px; }
  .section-title { font-family: 'Clash Display', sans-serif; font-weight: 700; font-size: 20px; letter-spacing: -0.5px; }
  .section-sub { font-size: 13px; color: var(--muted); }

  /* WHY SECTION */
  .why-section { margin-bottom: 36px; }
  .why-heading { font-family: 'Clash Display', sans-serif; font-weight: 700; font-size: 20px; letter-spacing: -0.5px; margin-bottom: 4px; }
  .why-heading span { color: var(--accent); }
  .why-sub { font-size: 13px; color: var(--muted); margin-bottom: 20px; }
  .why-grid {
    display: grid; grid-template-columns: repeat(3, 1fr);
    gap: 2px; background: var(--border); border: 1.5px solid var(--border);
  }
  .why-card {
    background: var(--white); padding: 22px;
    display: flex; align-items: flex-start; gap: 14px;
    transition: background 0.18s; position: relative; overflow: hidden;
  }
  .why-card:hover { background: var(--bg); }
  .why-card::before { content: ''; position: absolute; top: 0; left: 0; right: 0; height: 2px; background: transparent; transition: background 0.2s; }
  .why-card:hover::before { background: var(--accent); }
  .why-icon {
    font-size: 20px; flex-shrink: 0;
    width: 42px; height: 42px;
    background: var(--bg); border: 1px solid var(--border);
    display: flex; align-items: center; justify-content: center;
    transition: background 0.18s;
  }
  .why-card:hover .why-icon { background: var(--card); }
  .why-title { font-family: 'Clash Display', sans-serif; font-weight: 700; font-size: 13px; margin-bottom: 4px; }
  .why-desc { font-size: 12px; color: var(--muted); line-height: 1.6; }

  /* PLAN CARDS */
  .plans-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 20px; margin-bottom: 36px; }
  .plan-card {
    background: var(--white); border: 1.5px solid var(--border);
    display: flex; flex-direction: column;
    position: relative; overflow: hidden;
    transition: transform 0.2s, box-shadow 0.2s; cursor: pointer;
    will-change: transform;
  }
  .plan-card:hover { transform: translateY(-3px); box-shadow: 6px 6px 0 var(--border); }
  .plan-card.mid { border-color: var(--accent); }
  .plan-card.last { border-color: var(--gold); }
  .plan-card-top-bar { height: 3px; }
  .plan-card-top-bar.dark-bar { background: var(--ink); }
  .plan-card-top-bar.accent-bar { background: var(--accent); }
  .plan-card-top-bar.gold-bar { background: var(--gold); }
  .plan-badge-tag {
    position: absolute; top: 16px; right: 16px;
    font-size: 9px; font-weight: 700; letter-spacing: 1.5px;
    text-transform: uppercase; padding: 3px 9px; color: #fff;
  }
  .plan-badge-tag.accent-tag { background: var(--accent); }
  .plan-badge-tag.gold-tag { background: var(--gold); }
  .plan-body { padding: 28px 26px; flex: 1; display: flex; flex-direction: column; }
  .plan-icon { font-size: 32px; margin-bottom: 16px; }
  .plan-name { font-family: 'Clash Display', sans-serif; font-weight: 700; font-size: 18px; margin-bottom: 6px; letter-spacing: -0.3px; }
  .plan-tagline { font-size: 13px; color: var(--muted); margin-bottom: 20px; line-height: 1.5; }
  .plan-free-tag {
    display: inline-flex; align-items: center; gap: 6px;
    background: var(--bg); border: 1px solid var(--border);
    padding: 6px 12px; font-size: 11px; font-weight: 700;
    color: var(--muted); margin-bottom: 14px; letter-spacing: 0.5px;
  }
  .plan-free-tag.gold-tag-free { border-color: #e8d5b0; color: var(--gold); }
  .plan-free-dot { width: 5px; height: 5px; background: var(--accent2); border-radius: 50%; }
  .plan-free-dot.gold-dot { background: var(--gold); }
  .plan-features { list-style: none; display: flex; flex-direction: column; gap: 9px; margin-bottom: 24px; flex: 1; }
  .plan-features li { display: flex; align-items: flex-start; gap: 9px; font-size: 13px; color: #555; line-height: 1.4; }
  .feat-check { flex-shrink: 0; margin-top: 1px; }
  .feat-check.green { color: var(--accent2); }
  .feat-check.orange { color: var(--accent); }
  .feat-check.gold { color: var(--gold); }
  .plan-cta {
    display: flex; align-items: center; justify-content: center; gap: 8px;
    padding: 13px; font-family: 'Clash Display', sans-serif;
    font-weight: 700; font-size: 13px; letter-spacing: 0.5px;
    border: none; cursor: pointer; transition: all 0.2s; text-transform: uppercase; width: 100%;
  }
  .plan-cta.dark { background: var(--ink); color: var(--bg); }
  .plan-cta.dark:hover { background: #1a1a1a; }
  .plan-cta.accent { background: var(--accent); color: #fff; }
  .plan-cta.accent:hover { opacity: 0.88; }
  .plan-cta.gold-btn { background: var(--gold); color: #fff; }
  .plan-cta.gold-btn:hover { opacity: 0.88; }
  .plan-footer {
    padding: 14px 26px; background: var(--bg);
    border-top: 1px solid var(--border);
    font-size: 11px; color: var(--muted);
    display: flex; align-items: center; gap: 6px;
  }
  .plan-footer.mid-footer { background: #fff9f7; border-top-color: #f0d0c5; }
  .plan-footer.gold-footer { background: #fdf8f0; border-top-color: #e8d5b0; }

  /* ACTIVITY */
  .activity-card { background: var(--white); border: 1px solid var(--border); padding: 28px; }
  .activity-empty { text-align: center; padding: 40px 20px; color: var(--muted); }
  .activity-empty-icon { font-size: 40px; margin-bottom: 12px; display: block; opacity: 0.4; }
  .activity-empty-text { font-size: 14px; }

  /* MODAL */
  .modal-overlay {
    display: none; position: fixed; inset: 0;
    background: rgba(0,0,0,0.7); z-index: 1000;
    align-items: center; justify-content: center;
  }
  .modal-overlay.show { display: flex; }
  .modal { background: var(--bg); width: 100%; max-width: 440px; margin: 20px; position: relative; }
  .modal-header { background: var(--ink); padding: 24px 28px; display: flex; align-items: center; justify-content: space-between; }
  .modal-title { font-family: 'Clash Display', sans-serif; font-weight: 700; font-size: 18px; color: var(--bg); }
  .modal-close { background: none; border: none; color: #444; font-size: 20px; cursor: pointer; transition: color 0.15s; line-height: 1; }
  .modal-close:hover { color: var(--bg); }
  .modal-body { padding: 28px; }
  .modal-plan-tag {
    display: inline-flex; align-items: center; gap: 8px;
    background: var(--card); border: 1px solid var(--border);
    padding: 6px 14px; font-size: 12px; font-weight: 700;
    letter-spacing: 1px; text-transform: uppercase; color: var(--muted); margin-bottom: 20px;
  }
  .modal-desc { font-size: 14px; color: var(--muted); margin-bottom: 24px; line-height: 1.6; }
  .modal-price-box {
    background: var(--white); border: 1.5px solid var(--border);
    padding: 20px 22px; margin-bottom: 20px;
    display: flex; align-items: center; justify-content: space-between;
  }
  .modal-price { font-family: 'Clash Display', sans-serif; font-weight: 700; font-size: 32px; }
  .modal-price-period { font-size: 14px; font-weight: 400; color: var(--muted); }
  .modal-valid { font-size: 12px; color: var(--muted); margin-top: 3px; }
  .modal-scans { text-align: right; }
  .modal-scans-num { font-family: 'Clash Display', sans-serif; font-weight: 700; font-size: 20px; color: var(--accent); }
  .modal-scans-label { font-size: 11px; color: var(--muted); }
  .modal-features { list-style: none; display: flex; flex-direction: column; gap: 8px; margin-bottom: 24px; }
  .modal-features li { display: flex; align-items: center; gap: 10px; font-size: 13px; color: #555; }
  .modal-features li::before { content: '✓'; color: var(--accent2); font-weight: 700; flex-shrink: 0; }
  .modal-pay-btn {
    width: 100%; background: var(--accent); color: #fff; border: none; padding: 15px;
    font-family: 'Clash Display', sans-serif; font-weight: 700; font-size: 15px;
    cursor: pointer; transition: opacity 0.2s;
    display: flex; align-items: center; justify-content: center; gap: 8px;
  }
  .modal-pay-btn:hover { opacity: 0.88; }
  .modal-pay-btn:disabled { opacity: 0.6; cursor: not-allowed; }
  .modal-note { font-size: 11px; color: var(--muted); text-align: center; margin-top: 12px; }

  /* --- BOTTOM NAV (mobile only) --- */
  .bottom-nav {
    display: none; position: fixed; bottom: 0; left: 0; right: 0;
    height: 64px; background: var(--ink); z-index: 102;
    padding-bottom: env(safe-area-inset-bottom, 0);
    justify-content: space-around; align-items: center;
    border-top: 1px solid #1e1e1e;
  }
  .bottom-nav-item {
    display: flex; flex-direction: column; align-items: center; gap: 2px;
    background: none; border: none; color: #555; font-size: 10px; font-weight: 600;
    padding: 8px 12px; cursor: pointer; font-family: inherit;
    transition: color 0.15s; min-width: 56px; min-height: 48px;
  }
  .bottom-nav-item.active { color: var(--accent); }
  .bottom-nav-icon { font-size: 20px; }

  /* --- Mobile sidebar & overlay --- */
  .sidebar-overlay {
    display: none; position: fixed; inset: 0;
    background: rgba(0,0,0,0.6); z-index: 99;
  }

  @media (max-width: 1100px) { .plans-grid { grid-template-columns: 1fr 1fr; } .why-grid { grid-template-columns: 1fr 1fr; } }
  @media (max-width: 860px) {
    .sidebar {
      width: 85vw; max-width: 320px;
      transform: translateX(-100%);
      transition: transform 0.3s ease;
      z-index: 101;
    }
    .sidebar.open { transform: translateX(0); }
    .sidebar-overlay.open { display: block; }
    .main { margin-left: 0; padding-bottom: 76px; }
    .hamburger-btn { display: flex; }
    .mobile-avatar-btn { display: flex; }
    .bottom-nav { display: flex; }
    .topbar, .content { padding-left: 16px; padding-right: 16px; }
    .plans-grid, .why-grid { grid-template-columns: 1fr; }
    .content { padding-bottom: 84px; }
    .free-banner { flex-direction: column; text-align: center; gap: 14px; }
    .free-banner-btn { width: 100%; }
    .greeting-title { font-size: clamp(22px, 5vw, 28px); }
    .why-card { padding: 18px; }
    .plan-card { padding: 20px; }
    .user-stats { grid-template-columns: 1fr; }
    .section-head { flex-direction: column; gap: 4px; }
    /* Touch targets */
    .nav-item, .plan-cta, .free-banner-btn, .hamburger-btn, .mobile-avatar-btn, .notif-btn {
      min-height: 48px !important;
    }
    .greeting-title { font-size: clamp(22px, 6vw, 28px) !important; }
  }

  @media (max-width: 640px) {
    .free-scan-pill { display: none; }
    .mobile-avatar-btn { display: flex; }
    .content { padding: 16px 12px 80px; }
    .plan-body { padding: 20px 16px !important; }
    .plan-features li { font-size: 12px; }
    .plan-tagline { font-size: 12px; }
    .plan-name { font-size: 16px; }
    .why-card { padding: 16px !important; }
    .greeting-sub { font-size: 13px; }
    .why-icon { width: 36px; height: 36px; font-size: 16px; }
    .why-title { font-size: 12px; }
    .why-desc { font-size: 11px; }
    .plan-price { font-size: 28px !important; }
    .plan-cta { font-size: 12px !important; padding: 10px 16px !important; }
  }
  @media (max-width: 480px) {
    .content { padding: 12px 8px 80px; }
    .topbar { padding-left: 10px; padding-right: 10px; height: 54px; }
    .page-title { font-size: 16px; }
    .greeting-title { font-size: clamp(18px, 5vw, 22px) !important; }
    .greeting-sub { font-size: 12px; }
    .why-card { gap: 10px; }
    .plan-card { border-left: none; border-top: 3px solid var(--border); }
    .plan-card.mid { border-top-color: var(--accent); }
    .plan-card.last { border-top-color: var(--gold); }
    .hamburger-btn, .notif-btn { width: 32px; height: 32px; font-size: 14px; }
    .bottom-nav { height: 56px; }
    .bottom-nav-item { font-size: 9px; min-width: 48px; }
    .bottom-nav-icon { font-size: 17px; }
  }

  @media (max-width: 480px) {
    .modal { margin: 10px !important; max-width: 100% !important; }
    .modal-body { padding: 20px 16px !important; }
    .modal-price { font-size: 28px !important; }
    .modal-header { padding: 18px 20px !important; }
    .modal-features li { font-size: 12px; }
    .sidebar { width: 85vw; }
    .dash-user-stat-num { font-size: 16px; }
    .user-card { padding: 14px 16px !important; }
    .user-top { gap: 10px !important; margin-bottom: 10px !important; }
    .user-avatar { width: 36px !important; height: 36px !important; min-width: 36px !important; min-height: 36px !important; font-size: 14px !important; }
    .user-name { font-size: 13px !important; }
    .user-email { font-size: 10px !important; }
    .user-stats { grid-template-columns: 1fr; margin-top: 10px !important; }
    .user-stat { padding: 8px 10px !important; }
    .user-stat-num { font-size: 16px !important; }
    .user-stat-label { font-size: 9px !important; }
    .sidebar-logo { padding: 18px 16px 16px !important; }
    .logo-text { font-size: 17px !important; }
    .logo-sub { font-size: 9px !important; }
  }

  /* Skeleton shimmer */
  @keyframes skeleton-shimmer {
    0% { background-position: -200% 0; }
    100% { background-position: 200% 0; }
  }
  .skeleton {
    background: linear-gradient(90deg, #1e293b 25%, #2d3a4f 50%, #1e293b 75%);
    background-size: 200% 100%;
    animation: skeleton-shimmer 1.5s ease-in-out infinite;
    border-radius: 8px;
  }

  /* Spinner */
  @keyframes spin { to { transform: rotate(360deg); } }
  @keyframes modalIn {
    from { opacity: 0; transform: translateY(30px) scale(0.95); }
    to { opacity: 1; transform: translateY(0) scale(1); }
  }
  .spinner {
    display: inline-block;
    width: 18px; height: 18px;
    border: 2px solid rgba(255,255,255,0.3);
    border-top-color: #fff;
    border-radius: 50%;
    animation: spin 0.8s linear infinite;
  }
`;

// ── PLAN DATA ────────────────────────────────────────────────────────────────
const PLAN_DATA = {
  reviewer: {
    title: "Resume Reviewer",
    tag: "📄 Resume Reviewer",
    price: "₹49",
    scans: "15",
    desc: "Your 1 free scan is used up. To continue getting deep resume analysis and ATS scores, pick a scan pack.",
    features: [
      "Full ATS score & grade",
      "Section-by-section breakdown",
      "Missing keyword detection",
      "AI rewrite suggestions",
      "15 scans · valid 1 month",
    ],
  },
  jd: {
    title: "JD Match Pro",
    tag: "🎯 JD Match Pro",
    price: "₹99",
    scans: "30",
    desc: "Your 1 free scan is used up. To keep matching resumes against job descriptions, get a scan pack.",
    features: [
      "Everything in Resume Reviewer",
      "ATS score against any JD",
      "Keyword gap vs job requirements",
      "Role-specific improvement tips",
      "Match percentage with explanation",
      "30 scans · valid 1 month",
    ],
  },
  hunter: {
    title: "JobSense AI",
    tag: "💼 JobSense AI",
    scans: "25",
    comingSoon: true,
    desc: "JobSense AI will scan live job boards and match your resume against real openings. Cover letters + direct apply links included.",
    features: [
      "Full JD Match Analysis included",
      "Top 20–25 live job matches",
      "ATS score per matched job",
      "Skill gap per role",
      "1-click cover letter per job",
      "Direct apply links",
      "25 scans",
    ],
  },
  bundle: {
    title: "Complete Plan",
    tag: "🏆 Complete (All 3)",
    scans: "70",
    comingSoon: true,
    desc: "Get everything — Resume Reviewer, JD Match Pro, and JobSense AI in one bundle. Never expires. Use anytime.",
    features: [
      "All features from every plan",
      "70 scans total across all tools",
      "No expiry — use at your own pace",
      "Best value — save ₹98",
    ],
  },
};

// ── WHY CARDS DATA ───────────────────────────────────────────────────────────
const WHY_CARDS = [
  {
    icon: "🎯",
    title: "Built for ATS — Not General AI",
    desc: "AI models don't know how Naukri, LinkedIn, or Indian ATS filters actually work. We are purpose-built for exactly that.",
  },
  {
    icon: "📊",
    title: "Real Scores, Not Vague Opinions",
    desc: "Generic AI models say 'looks good.' We give you a number, a grade, a section breakdown, and the exact keywords you are missing.",
  },
  {
    icon: "🇮🇳",
    title: "Indian Job Market Intelligence",
    desc: "We know what TCS, Infosys, Razorpay, and Zepto actually look for. No AI model has this Indian market context built in.",
  },
  {
    icon: "🔎",
    title: "Live Job Matching — No AI Can Do This",
    desc: "AI models cannot search real live jobs, score them against your resume, and hand you apply links. Our JobSense AI can.",
  },
  {
    icon: "✉️",
    title: "Cover Letters Tailored Per Job",
    desc: "One click on any matched job generates a cover letter written specifically for that company and JD — not a generic template.",
  },
  {
    icon: "🔒",
    title: "Your Resume Stays Private",
    desc: "We never train on your resume data. When you paste your resume into AI models — you have no such guarantee.",
  },
];

// ── SCAN STORAGE ─────────────────────────────────────────────────────────────
const SCAN_KEY = "ai_career_copilot_scans";

function loadScans() {
  try {
    const stored = localStorage.getItem(SCAN_KEY);
    if (stored) return JSON.parse(stored);
  } catch {}
  return { reviewer: { freeUsed: false }, jd: { freeUsed: false } };
}
function saveScans(scans) {
  try { localStorage.setItem(SCAN_KEY, JSON.stringify(scans)); } catch {}
}

// ── MAIN COMPONENT ───────────────────────────────────────────────────────────
export default function Dashboard() {
  const navigate = useNavigate();
  const [realScans, setRealScans] = useState(null); // { reviewer: N, jd: N } from backend
  const [scansLoading, setScansLoading] = useState(true);
  const [analysisHistory, setAnalysisHistory] = useState([]);
  const [historyLoading, setHistoryLoading] = useState(false);

  // Hide auth loading overlay — Dashboard has mounted
  useEffect(() => { hideAuthLoader(); }, []);

  const user = {
    name: localStorage.getItem("user_name") || "User",
    email: localStorage.getItem("user_email") || "",
    plan: "free",
  };

  // Fetch real scan balance from backend
  const fetchScanBalance = async () => {
    try {
      const token = localStorage.getItem("access_token");
      if (!token) { setScansLoading(false); return; }
      const { data } = await API.get("/payment/scans");
      setRealScans(data);
    } catch {
      setRealScans(null);
    } finally {
      setScansLoading(false);
    }
  };

  // Fetch analysis history from backend
  const fetchHistory = async () => {
    setHistoryLoading(true);
    try {
      const { data } = await API.get("/history/all");
      setAnalysisHistory(data || []);
    } catch {
      // silently fail
    } finally {
      setHistoryLoading(false);
    }
  };

  useEffect(() => { fetchScanBalance(); }, []);
  useEffect(() => { fetchHistory(); }, []);

  // Active nav section — renders different content
  const [activeNav, setActiveNav] = useState("dashboard");

  // Re-fetch scan balance when user navigates back from a scan page
  useEffect(() => {
    // Trigger re-fetch whenever activeNav changes to "dashboard" or "scans" or "history"
    if (activeNav === "dashboard" || activeNav === "scans" || activeNav === "history") {
      fetchScanBalance();
    }
  }, [activeNav]);

  const handleLogout = () => {
    localStorage.removeItem("access_token");
    localStorage.removeItem("user_email");
    localStorage.removeItem("user_name");
    navigate("/");
  };

  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [scanState, setScanState] = useState(loadScans);
  const [modal, setModal] = useState({ open: false, plan: null });
  const [loadingPlan, setLoadingPlan] = useState(null);
  const [screenWidth, setScreenWidth] = useState(window.innerWidth);
  const [showNotifs, setShowNotifs] = useState(false);

  useEffect(() => {
    const handle = () => setScreenWidth(window.innerWidth);
    window.addEventListener("resize", handle);
    return () => window.removeEventListener("resize", handle);
  }, []);

  useEffect(() => { saveScans(scanState); }, [scanState]);

  // Inject styles once
  useEffect(() => {
    const styleTag = document.createElement("style");
    styleTag.innerHTML = styles;
    document.head.appendChild(styleTag);
    return () => document.head.removeChild(styleTag);
  }, []);

  // Close sidebar on route change & scroll to top
  useEffect(() => {
    setSidebarOpen(false);
    window.scrollTo({ top: 0, behavior: "instant" });
  }, [activeNav]);

  // ── SCAN TRACKING ──
  // Use backend realScans as the single source of truth.
  // localStorage (scanState) is only a cache for the free-scan-completed flag
  // so the page can optimistically show "0 scans" before backend round-trip.
  const hasAnyScan = (planType) => {
    // If backend loaded, use it
    if (realScans) {
      return (realScans[planType] || 0) > 0;
    }
    // Fallback: user hasn't said they used the free scan
    return !scanState[planType]?.freeUsed;
  };

  const totalScansLeft = realScans
    ? (realScans.reviewer || 0) + (realScans.jd || 0)
    : ["reviewer", "jd"].filter((k) => hasAnyScan(k)).length;

  const hasReviewerScans = hasAnyScan("reviewer");
  const hasJdScans = hasAnyScan("jd");

  const getGreeting = () => {
    const h = new Date().getHours();
    if (h < 12) return "Good Morning";
    if (h < 17) return "Good Afternoon";
    return "Good Evening";
  };

  const getDate = () =>
    new Date().toLocaleDateString("en-IN", { weekday: "long", day: "numeric", month: "long", year: "numeric" });

  const getInitial = (name) => name?.charAt(0)?.toUpperCase() || "U";

  // ── NOTIFICATIONS ──
  const notifications = [
    { id: 1, text: "Your free scan is ready!", time: "Just now", read: false },
  ];
  const closeNotifs = () => setShowNotifs(false);

  const handleNavClick = (key) => {
    setActiveNav(key);
    // Loading bar effect
    const bar = document.createElement("div");
    bar.className = "loading-bar";
    document.body.appendChild(bar);
    setTimeout(() => bar.remove(), 1500);
    // If navigating to a paid section from sidebar and no scans left, open payment
    const navToPlan = { "reviewer-page": "reviewer", "jd-page": "jd" };
    const planKey = navToPlan[key];
    if (planKey && !hasAnyScan(planKey)) {
      setTimeout(() => setModal({ open: true, plan: planKey }), 200);
    }
  };

  // When user completes a free scan inside the page
  const handleFreeScanComplete = (planKey) => {
    setScanState((prev) => {
      const updated = { ...prev, [planKey]: { ...prev[planKey], freeUsed: true } };
      saveScans(updated);
      return updated;
    });
    // Refresh scan balance from backend so sidebar stats update immediately
    fetchScanBalance();
    // Do NOT navigate away — let the ResultsScreen render.
    // Navigation happens when user clicks "Back to Dashboard" from ResultsScreen.
  };

  // ── PLAN / SCAN LOGIC ──
  const handlePlanClick = (planKey) => {
    // Coming soon cards — just alert, no modal
    const planInfo = PLAN_DATA[planKey];
    if (planInfo?.comingSoon) {
      alert(`🚀 ${planInfo.title} is coming soon! We're working on it and will notify you when it's ready.`);
      return;
    }
    if (planKey === "hunter") {
      setModal({ open: true, plan: "hunter" });
      return;
    }
    // Free scan NOT consumed yet → open page freely
    if (hasAnyScan(planKey)) {
      setActiveNav(planKey === "reviewer" ? "reviewer-page" : "jd-page");
    } else {
      // Free scan already completed → blurred page + payment modal
      setActiveNav(planKey === "reviewer" ? "reviewer-page" : "jd-page");
      setTimeout(() => setModal({ open: true, plan: planKey }), 200);
    }
  };

  // Close payment modal AND go back to dashboard
  const closeModalAndGoHome = () => {
    setModal({ open: false, plan: null });
    setActiveNav("dashboard");
  };

  const closeModal = () => setModal({ open: false, plan: null });

  // ── RAZORPAY ──
  const loadRazorpayScript = () => new Promise((resolve) => {
    if (window.Razorpay) return resolve(true);
    const script = document.createElement("script");
    script.src = "https://checkout.razorpay.com/v1/checkout.js";
    script.onload = () => resolve(true);
    script.onerror = () => resolve(false);
    document.body.appendChild(script);
  });

  const handlePayment = async () => {
    const planType = modal.plan;
    if (!planType) return;

    setLoadingPlan(planType);

    try {
      // Step 1: Load Razorpay checkout script
      const loaded = await loadRazorpayScript();
      if (!loaded) {
        alert("Failed to load payment gateway. Check your internet and try again.");
        setLoadingPlan(null);
        return;
      }

      // Step 2: Create order on backend
      let order;
      try {
        const { data } = await API.post("/payment/create-order", { plan_type: planType });
        order = data;
      } catch (err) {
        const msg = err?.response?.data?.detail || "Could not initiate payment. Please try again.";
        alert(msg);
        setLoadingPlan(null);
        return;
      }

      // Step 3: Open Razorpay checkout
      const options = {
        key: order.key_id,
        amount: order.amount,
        currency: order.currency,
        name: "AI Career Copilot",
        description: `${order.scans} ${order.plan_type} scans`,
        order_id: order.order_id,
        handler: async function (response) {
          // Step 4: Verify on backend (idempotent)
          try {
            const { data: result } = await API.post("/payment/verify", {
              razorpay_order_id: response.razorpay_order_id,
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_signature: response.razorpay_signature,
            });

            if (result.status === "success" || result.status === "already_credited") {
              // Payment confirmed + scans credited
              closeModalAndGoHome();
              // Small delay to let modal close before toast
              setTimeout(() => {
                alert(`✅ Payment successful! ${result.scans_credited} scans have been added to your account.`);
              }, 300);
            } else {
              alert("Payment verification returned an unexpected result. If your account was charged, contact support.");
            }
          } catch (verifyErr) {
            // Verification failed — but Razorpay has the money.
            // The webhook will process this, so tell user it might be delayed.
            alert(
              "Payment received but verification is taking longer than expected. " +
              "Don't worry — your scans will be credited within a few minutes " +
              "via our backup verification system. Contact support if this persists."
            );
          }
        },
        modal: {
          ondismiss: () => {
            setLoadingPlan(null);
          },
          confirm_close: true,  // warn before closing
        },
        prefill: {
          email: localStorage.getItem("user_email") || "",
          contact: "",
        },
        theme: {
          color: "#e84c1e",
          hide_topbar: false,
        },
        retry: {
          enabled: true,
          max_count: 2,
        },
      };

      const rzp = new window.Razorpay(options);

      rzp.on("payment.failed", function (resp) {
        const errMsg = resp?.error?.description || "Payment failed.";
        alert(`Payment failed: ${errMsg}\nYou can try again or choose a different payment method.`);
        setLoadingPlan(null);
      });

      rzp.open();

    } catch (err) {
      const msg = err?.response?.data?.detail || "Something went wrong. Please try again.";
      alert(msg);
      setLoadingPlan(null);
    }
  };

  const scrollToPlans = () => {
    document.getElementById("plansSection")?.scrollIntoView({ behavior: "smooth" });
  };

  // ── NAV ITEMS ──
  const navItems = [
    { key: "dashboard", icon: "🏠", label: "Dashboard" },
    { key: "scans", icon: "📄", label: "My Scans", badge: scansLoading ? "" : totalScansLeft.toString() },
    { key: "history", icon: "📊", label: "Score History" },
  ];

  const toolItems = [
    { key: "reviewer-page", icon: "🎯", label: "Resume Reviewer" },
    { key: "jd-page", icon: "🔍", label: "JD Analyzer" },
    { key: "jobs", icon: "💼", label: "Job Matcher", badge: "PRO", badgeClass: "gold" },
    { key: "covers", icon: "✉️", label: "Cover Letters", badge: "PRO", badgeClass: "gold" },
  ];

  const accountItems = [
    { key: "settings", icon: "⚙️", label: "Settings" },
    { key: "billing", icon: "💳", label: "Billing" },
  ];

  const activePlan = modal.plan ? PLAN_DATA[modal.plan] : null;

  // ── RENDER PAGE CONTENT ──
  const renderContent = () => {

    switch (activeNav) {
      // ── DASHBOARD HOME ──
      case "dashboard":
        return (
          <div style={{ animation: "dashboardFadeIn 0.25s ease both" }}>
            <style>{`@keyframes dashboardFadeIn { from { opacity: 0; } to { opacity: 1; } }`}</style>
            <div className="greeting">
              <div className="greeting-tag">{getGreeting()}, {user.name} 👋</div>
              <div className="greeting-title">
                What would you like to<br />
                <span>work on today?</span>
              </div>
              <div className="greeting-sub">
                Welcome, <strong>{user.name}</strong>! You have {' '}
                {scansLoading ? (
                  <span className="scans-skeleton" />
                ) : (
                  <strong>{totalScansLeft}</strong>
                )}{' '}
                scan{totalScansLeft !== 1 ? "s" : ""} remaining.
                Use your free scan or pick a plan below.
              </div>
            </div>

            {/* FREE SCAN BANNER */}
            <div className="free-banner">
              <div>
                <div className="free-banner-title">🎁 Your free scan is waiting</div>
                <div className="free-banner-sub">Each plan gives you 1 free scan. No credit card required. See results instantly.</div>
              </div>
              <button className="free-banner-btn" onClick={scrollToPlans}>Explore Plans ↓</button>
            </div>

            {/* WHY SECTION */}
            <div className="why-section">
              <div className="why-heading">
                Why Generic AI Isn't Enough <span>for Job Seekers?</span>
              </div>
              <div className="why-sub">
                Good question. Here's what makes AI Career Copilot different — and better for your job search.
              </div>
              <div className="why-grid">
                {WHY_CARDS.map((card, i) => (
                  <div className="why-card" key={i}>
                    <div className="why-icon">{card.icon}</div>
                    <div>
                      <div className="why-title">{card.title}</div>
                      <div className="why-desc">{card.desc}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* PLANS */}
            <div id="plansSection">
              <div className="section-head">
                <div className="section-title">Choose Your Plan</div>
                <div className="section-sub">1 free scan included per plan</div>
              </div>

              <div className="plans-grid">
                {[
                  { key: "reviewer", cls: "", barCls: "dark-bar", badge: null, btnCls: "dark", footerCls: "", freeText: "1 Free Scan Included",
                    title: "Resume Reviewer", tagline: "Deep resume analysis with actionable feedback to fix what's holding you back.",
                    icon: "📄", features: ["Full ATS score with grade", "Section-by-section breakdown", "Missing keyword detection", "AI rewrite suggestions per bullet", "Detailed feedback report", "Format & readability check"],
                    footer: "🔒 No payment needed for first scan", comingSoon: false },
                  { key: "jd", cls: "mid", barCls: "accent-bar", badge: { text: "Most Popular", cls: "accent-tag" }, btnCls: "accent", footerCls: "mid-footer", freeText: "1 Free Scan Included",
                    title: "JD Match Pro", tagline: "Paste any job description and know exactly how well your resume matches it.",
                    icon: "🎯", features: ["Everything in Resume Reviewer", "ATS score against specific JD", "Keyword gap vs job requirements", "Role-specific improvement tips", "Match percentage with explanation", "Skills you need to highlight"],
                    footer: "🔒 No payment needed for first scan", comingSoon: false },
                  { key: "hunter", cls: "last", barCls: "gold-bar", badge: { text: "Coming Soon", cls: "gold-tag" }, btnCls: "gold-btn", footerCls: "gold-footer", freeText: "Fully Paid — Early Access",
                    title: "JobSense AI", tagline: "AI agent that reads your resume and finds your top 20–25 live job matches automatically.",
                    icon: "💼", features: ["Full JD Match Analysis included", "Top 20–25 live job matches", "ATS score per matched job", "Skill gap per role", "1-click cover letter per job", "Direct apply links"],
                    footer: "🚀 Coming soon", comingSoon: true },
                  { key: "bundle", cls: "", barCls: "dark-bar", badge: { text: "Best Value", cls: "gold-tag" }, btnCls: "dark", footerCls: "", freeText: "Fully Paid — Never Expires",
                    title: "Complete Plan", tagline: "Resume Reviewer + JD Match Pro + JobSense AI — everything in one pack.",
                    icon: "🏆", features: ["All features from every plan", "70 scans total across all tools", "Never expires — use anytime", "Save ₹98 compared to individual plans"],
                    footer: "🚀 Coming soon", comingSoon: true },
                ].map((p, i) => (
                  <div
                    key={p.key}
                    className={`plan-card ${p.cls}`}
                    onClick={() => handlePlanClick(p.key)}
                    style={{ transition: "transform 0.2s ease, box-shadow 0.2s ease" }}
                    onMouseEnter={(e) => { if (!loadingPlan) { e.currentTarget.style.transform = "translateY(-4px)"; e.currentTarget.style.boxShadow = "6px 6px 0 var(--border)"; } }}
                    onMouseLeave={(e) => { e.currentTarget.style.transform = "translateY(0)"; e.currentTarget.style.boxShadow = "none"; }}
                  >
                    <div className={`plan-card-top-bar ${p.barCls}`} />
                    {p.badge && <div className={`plan-badge-tag ${p.badge.cls}`}>{p.badge.text}</div>}
                    <div className="plan-body">
                      <div className="plan-icon">{p.icon}</div>
                      <div className="plan-name">{p.title}</div>
                      <div className="plan-tagline">{p.tagline}</div>
                      {!p.comingSoon && p.key !== "hunter" && p.key !== "bundle" && (
                        <div className="plan-free-tag">
                          <div className="plan-free-dot" /> {p.freeText}
                        </div>
                      )}
                      {!p.comingSoon && p.key === "hunter" && (
                        <div className="plan-free-tag gold-tag-free">
                          <div className="plan-free-dot gold-dot" /> {p.freeText}
                        </div>
                      )}
                      {!p.comingSoon && p.key === "bundle" && (
                        <div className="plan-free-tag gold-tag-free">
                          <div className="plan-free-dot gold-dot" /> {p.freeText}
                        </div>
                      )}
                      <ul className="plan-features">
                        {p.features.map((f, fi) => (
                          <li key={fi}><span className={`feat-check ${p.key === "reviewer" ? "green" : p.key === "jd" ? "orange" : "gold"}`}>✓</span> {f}</li>
                        ))}
                      </ul>
                      <button className={`plan-cta ${p.btnCls}`} disabled={loadingPlan === p.key || p.comingSoon} style={{ opacity: loadingPlan === p.key || p.comingSoon ? 0.7 : 1 }}>
                        {loadingPlan === p.key ? <span className="spinner" /> : null}
                        {loadingPlan === p.key ? "Processing..." : p.comingSoon ? "Coming Soon →" : "Start Free Scan →"}
                      </button>
                    </div>
                    <div className={`plan-footer ${p.footerCls}`}>{p.footer}</div>
                  </div>
                ))}
              </div>
            </div>

            {/* RECENT ACTIVITY */}
            <div className="section-head">
              <div className="section-title">Recent Activity</div>
              <div className="section-sub">Your scan history will appear here</div>
            </div>
            <div className="card" style={{ padding: "28px", borderRadius: "var(--radius-lg)" }}>
              <div className="empty-state">
                <div className="empty-state-icon">📭</div>
                <div className="empty-state-title">No scans yet</div>
                <div className="empty-state-text">Use your free scan above to get started.</div>
              </div>
            </div>
          </div>
        );

      // ── MY SCANS ──
      case "scans":
        return (
          <div>
            <div style={{ marginBottom: "24px" }}>
              <h2 style={{ fontFamily: "'Clash Display', sans-serif", fontWeight: 700, fontSize: "22px", color: "#0f0e0a", margin: "0 0 4px" }}>My Scans</h2>
              <p style={{ fontSize: "13px", color: "#8a8070", margin: 0 }}>View your past resume and JD match analyses</p>
            </div>
            <div style={{ display: "flex", gap: "16px", marginBottom: "24px", flexWrap: "wrap" }}>
              <div style={{ flex: 1, minWidth: "140px", background: "#fff", border: "1.5px solid #d4cdc0", padding: "20px", textAlign: "center" }}>
                <div style={{ fontFamily: "'Clash Display', sans-serif", fontWeight: 700, fontSize: "28px", color: "#e84c1e" }}>
                  {scansLoading ? "—" : (realScans ? realScans.reviewer : (scanState.reviewer?.freeUsed ? 0 : 1))}
                </div>
                <div style={{ fontSize: "12px", color: "#8a8070", marginTop: "4px", textTransform: "uppercase", letterSpacing: "0.5px" }}>Resume Scans</div>
              </div>
              <div style={{ flex: 1, minWidth: "140px", background: "#fff", border: "1.5px solid #d4cdc0", padding: "20px", textAlign: "center" }}>
                <div style={{ fontFamily: "'Clash Display', sans-serif", fontWeight: 700, fontSize: "28px", color: "#c9922a" }}>
                  {scansLoading ? "—" : (realScans ? realScans.jd : (scanState.jd?.freeUsed ? 0 : 1))}
                </div>
                <div style={{ fontSize: "12px", color: "#8a8070", marginTop: "4px", textTransform: "uppercase", letterSpacing: "0.5px" }}>JD Match Scans</div>
              </div>
              <div style={{ flex: 1, minWidth: "140px", background: "#fff", border: "1.5px solid #d4cdc0", padding: "20px", textAlign: "center" }}>
                <div style={{ fontFamily: "'Clash Display', sans-serif", fontWeight: 700, fontSize: "28px", color: "#2d6a4f" }}>
                  {historyLoading ? "—" : analysisHistory.length}
                </div>
                <div style={{ fontSize: "12px", color: "#8a8070", marginTop: "4px", textTransform: "uppercase", letterSpacing: "0.5px" }}>Total Analyses</div>
              </div>
            </div>
            {analysisHistory.length === 0 ? (
              <div className="card" style={{ padding: "28px", borderRadius: "var(--radius-lg)" }}>
                <div className="empty-state">
                  <div className="empty-state-icon">📭</div>
                  <div className="empty-state-title">No scans yet</div>
                  <div className="empty-state-text">Use your free scan above to get started.</div>
                </div>
              </div>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                {analysisHistory.slice(0, 10).map((a, i) => (
                  <div key={a.id || i} style={{
                    background: "#fff", border: "1.5px solid #d4cdc0", padding: "16px 20px",
                    display: "flex", justifyContent: "space-between", alignItems: "center",
                    animation: `fadeUp 0.3s ease ${i * 0.05}s both`,
                  }}>
                    <div>
                      <div style={{ fontFamily: "'Clash Display', sans-serif", fontWeight: 700, fontSize: "14px" }}>
                        {a.title || "Analysis"}
                      </div>
                      <div style={{ fontSize: "12px", color: "#8a8070", marginTop: "2px" }}>
                        {a.created_at ? new Date(a.created_at).toLocaleDateString("en-IN", { month: "short", day: "numeric", year: "numeric" }) : ""}
                        {a.company ? ` · ${a.company}` : ""}
                      </div>
                    </div>
                    <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                      {a.score != null && (
                        <div style={{
                          width: "46px", height: "46px", borderRadius: "50%",
                          display: "flex", alignItems: "center", justifyContent: "center",
                          fontWeight: 700, fontSize: "14px",
                          border: `2px solid ${a.score >= 70 ? "#2d6a4f" : a.score >= 55 ? "#c9922a" : "#e84c1e"}`,
                          color: a.score >= 70 ? "#2d6a4f" : a.score >= 55 ? "#c9922a" : "#e84c1e",
                        }}>
                          {Math.round(a.score)}%
                        </div>
                      )}
                      <span style={{
                        fontSize: "11px", fontWeight: 700, padding: "3px 10px",
                        background: a.status === "completed" ? "rgba(45,106,79,0.1)" : "rgba(232,76,30,0.1)",
                        color: a.status === "completed" ? "#2d6a4f" : "#e84c1e",
                        textTransform: "uppercase", letterSpacing: "0.5px",
                      }}>
                        {a.status === "completed" ? "Completed" : a.status === "processing" ? "Processing..." : "Failed"}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        );

      // ── SCORE HISTORY ──
      case "history":
        const completed = analysisHistory.filter(a => a.status === "completed" && a.score != null);
        return (
          <div>
            <div style={{ marginBottom: "24px" }}>
              <h2 style={{ fontFamily: "'Clash Display', sans-serif", fontWeight: 700, fontSize: "22px", color: "#0f0e0a", margin: "0 0 4px" }}>Score History</h2>
              <p style={{ fontSize: "13px", color: "#8a8070", margin: 0 }}>Track your match score improvement over time</p>
            </div>
            {completed.length === 0 ? (
              <div className="card" style={{ padding: "28px", borderRadius: "var(--radius-lg)" }}>
                <div className="empty-state">
                  <div className="empty-state-icon">📊</div>
                  <div className="empty-state-title">No scores yet</div>
                  <div className="empty-state-text">Complete an analysis to see your first score.</div>
                </div>
              </div>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                {completed.map((a, i) => (
                  <div key={a.id || i} style={{
                    background: "#fff", border: "1.5px solid #d4cdc0", padding: "16px 20px",
                    borderLeft: `4px solid ${a.score >= 70 ? "#2d6a4f" : a.score >= 55 ? "#c9922a" : "#e84c1e"}`,
                    display: "flex", justifyContent: "space-between", alignItems: "center",
                    animation: `fadeUp 0.3s ease ${i * 0.05}s both`,
                  }}>
                    <div>
                      <div style={{ fontFamily: "'Clash Display', sans-serif", fontWeight: 700, fontSize: "14px" }}>
                        {a.title || "Analysis"}
                      </div>
                      <div style={{ fontSize: "12px", color: "#8a8070", marginTop: "2px" }}>
                        {a.completed_at ? new Date(a.completed_at).toLocaleDateString("en-IN", { month: "short", day: "numeric", year: "numeric", hour: "2-digit", minute: "2-digit" }) : ""}
                        {a.company ? ` · ${a.company}` : ""}
                      </div>
                    </div>
                    <div style={{ textAlign: "right" }}>
                      <div style={{
                        fontFamily: "'Clash Display', sans-serif", fontWeight: 700, fontSize: "22px",
                        color: a.score >= 70 ? "#2d6a4f" : a.score >= 55 ? "#c9922a" : "#e84c1e",
                      }}>
                        {Math.round(a.score)}%
                      </div>
                      <div style={{ fontSize: "10px", color: "#8a8070", textTransform: "uppercase", letterSpacing: "0.5px" }}>Match Score</div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        );

      // ── RESUME REVIEWER PAGE ──
      case "reviewer-page":
        // No scans → blurred with payment modal
        if (!hasAnyScan("reviewer")) {
          return (
            <div style={{ position: "relative" }}>
              <div style={{ filter: "blur(4px)", pointerEvents: "none", userSelect: "none" }}>
                <ResumeReviewPage onBack={() => setActiveNav("dashboard")} onAnalysisComplete={() => handleFreeScanComplete("reviewer")} />
              </div>
            </div>
          );
        }
        return <ResumeReviewPage onBack={() => setActiveNav("dashboard")} onAnalysisComplete={() => handleFreeScanComplete("reviewer")} />;

      // ── JD ANALYZER PAGE ──
      case "jd-page":
        if (!hasAnyScan("jd")) {
          return (
            <div style={{ position: "relative" }}>
              <div style={{ filter: "blur(4px)", pointerEvents: "none", userSelect: "none" }}>
                <JDMatchPage onBack={() => setActiveNav("dashboard")} onAnalysisComplete={() => handleFreeScanComplete("jd")} />
              </div>
            </div>
          );
        }
        return <JDMatchPage onBack={() => setActiveNav("dashboard")} onAnalysisComplete={() => handleFreeScanComplete("jd")} />;

      // ── SETTINGS ──
      case "settings":
        return (
          <div>
            <div style={{ marginBottom: "24px" }}>
              <h2 className="heading-2" style={{ margin: "0 0 4px" }}>Settings</h2>
              <p className="body-small" style={{ color: "#8a8070", margin: 0 }}>Manage your account settings and preferences</p>
            </div>
            <div className="card" style={{ padding: "28px", borderRadius: "var(--radius-lg)" }}>
              <h3 className="heading-3" style={{ margin: "0 0 16px" }}>Profile Information</h3>
              <div style={{ marginBottom: "16px" }}>
                <label style={{ display: "block", fontSize: "13px", fontWeight: 600, color: "#555", marginBottom: "6px" }}>Full Name</label>
                <input className="input" type="text" defaultValue={user.name} />
              </div>
              <div style={{ marginBottom: "16px" }}>
                <label style={{ display: "block", fontSize: "13px", fontWeight: 600, color: "#555", marginBottom: "6px" }}>Email</label>
                <input className="input" type="email" value={user.email} disabled style={{ background: "#f5f0e8", color: "#8a8070", cursor: "not-allowed" }} />
              </div>
              <button className="btn btn-primary">💾 Save Changes</button>
            </div>
          </div>
        );

      // ── BILLING ──
      case "billing":
        return (
          <div>
            <div style={{ marginBottom: "24px" }}>
              <h2 className="heading-2" style={{ margin: "0 0 4px" }}>Billing & Plans</h2>
              <p className="body-small" style={{ color: "#8a8070", margin: 0 }}>Purchase scan packs or upgrade your plan</p>
            </div>
            <div className="card" style={{ padding: "28px", borderRadius: "var(--radius-lg)" }}>
              <div className="empty-state">
                <div className="empty-state-icon">💳</div>
                <div className="empty-state-title">No transactions yet</div>
                <div className="empty-state-text">Payment history will appear here once you make a purchase.</div>
              </div>
            </div>
          </div>
        );

      // ── PLACEHOLDER PAGES ──
      case "jobs":
      case "covers":
        return (
          <div>
            <div style={{ marginBottom: "24px" }}>
              <h2 className="heading-2" style={{ margin: "0 0 4px" }}>
                {activeNav === "jobs" ? "Job Matcher" : "Cover Letters"}
              </h2>
              <p className="body-small" style={{ color: "#8a8070", margin: 0 }}>Coming soon</p>
            </div>
            <div className="card" style={{ padding: "28px", borderRadius: "var(--radius-lg)" }}>
              <div className="empty-state">
                <div className="empty-state-icon">{activeNav === "jobs" ? "💼" : "✉️"}</div>
                <div className="empty-state-title">Coming Soon</div>
                <div className="empty-state-text">This feature is under development and will be available soon.</div>
              </div>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  // ── RENDER ──
  return (
    <div className="layout">
      <div className="noise-overlay" />

      {/* Mobile overlay */}
      <div className={`sidebar-overlay ${sidebarOpen ? "open" : ""}`} onClick={() => setSidebarOpen(false)} />

      {/* ── SIDEBAR ── */}
      <aside className={`sidebar ${sidebarOpen ? "open" : ""}`}>
        <div className="sidebar-inner">
          <div className="sidebar-header">
            <div className="sidebar-logo">
              <div className="logo-text">AI Career <span>Copilot</span></div>
              <div className="logo-sub">Career Intelligence</div>
            </div>
            <div className="user-card">
              <div className="user-top">
                <div className="user-avatar">
                  {getInitial(user.name)}
                  <div className="user-online" />
                </div>
                <div>
                  <div className="user-name">{user.name}</div>
                  <div className="user-email">{user.email}</div>
                </div>
              </div>
              <div className="user-plan-badge">⚡ Free Plan — {totalScansLeft} scan{totalScansLeft !== 1 ? "s" : ""} remaining</div>
              <div className="user-stats">
                <div className="user-stat">
                  <div className="user-stat-num">{scansLoading ? "—" : (realScans ? realScans.reviewer : "—")}</div>
                  <div className="user-stat-label">Reviewer Scans</div>
                </div>
                <div className="user-stat">
                  <div className="user-stat-num">{scansLoading ? "—" : (realScans ? realScans.jd : "—")}</div>
                  <div className="user-stat-label">JD Scans</div>
                </div>
              </div>
            </div>
          </div>

          {/* SCROLLABLE NAV */}
          <div className="sidebar-scroll-area">
            <nav className="sidebar-nav">
              <div className="nav-label">Main</div>
              {navItems.map((item) => (
                <button
                  key={item.key}
                  className={`nav-item ${activeNav === item.key ? "active" : ""}`}
                  onClick={() => handleNavClick(item.key)}
                >
                  <span className="nav-icon">{item.icon}</span>
                  {item.label}
                  {item.badge && <span className="nav-badge">{item.badge}</span>}
                </button>
              ))}

              <div className="nav-label" style={{ marginTop: 8 }}>Tools</div>
              {toolItems.map((item) => (
                <button
                  key={item.key}
                  className={`nav-item ${activeNav === item.key ? "active" : ""}`}
                  onClick={() => handleNavClick(item.key)}
                >
                  <span className="nav-icon">{item.icon}</span>
                  {item.label}
                  {item.badge && <span className={`nav-badge ${item.badgeClass || ""}`}>{item.badge}</span>}
                </button>
              ))}

              <div className="nav-label" style={{ marginTop: 8 }}>Account</div>
              {accountItems.map((item) => (
                <button
                  key={item.key}
                  className={`nav-item ${activeNav === item.key ? "active" : ""}`}
                  onClick={() => handleNavClick(item.key)}
                >
                  <span className="nav-icon">{item.icon}</span>
                  {item.label}
                </button>
              ))}
            </nav>
          </div>

          <div className="sidebar-footer">
            <div className="sidebar-bottom">
              <button className="logout-btn" onClick={handleLogout}>
                <span>🚪</span> Log Out
              </button>
            </div>
          </div>
        </div>
      </aside>

      {/* ── MAIN ── */}
      <div className="main">
        <header className="topbar">
          <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
            <button className="hamburger-btn" onClick={() => setSidebarOpen(!sidebarOpen)}>
              {sidebarOpen ? "✕" : "☰"}
            </button>
            <div>
              <div className="page-title">
                {activeNav === "dashboard" ? "Dashboard" :
                 activeNav === "scans" ? "My Scans" :
                 activeNav === "history" ? "Score History" :
                 activeNav === "reviewer-page" ? "Resume Reviewer" :
                 activeNav === "jd-page" ? "JD Analyzer" :
                 activeNav === "jobs" ? "Job Matcher" :
                 activeNav === "covers" ? "Cover Letters" :
                 activeNav === "settings" ? "Settings" :
                 activeNav === "billing" ? "Billing" : "Dashboard"}
              </div>
              <div className="page-sub">{getDate()}</div>
            </div>
          </div>
          <div className="topbar-right">
            <button className="mobile-avatar-btn" onClick={() => setSidebarOpen(!sidebarOpen)}>
              {getInitial(user.name)}
            </button>
            <div className="free-scan-pill">
              <div className="pill-dot" />
              {totalScansLeft} free scan{totalScansLeft !== 1 ? "s" : ""} available
            </div>
            <div className="notif-btn" onClick={() => setShowNotifs(!showNotifs)} style={{ position: "relative" }}>
              🔔<div className="notif-dot" />
              {showNotifs && (
                <div
                  className="notif-dropdown"
                  onClick={(e) => e.stopPropagation()}
                  style={{
                    position: "absolute",
                    top: "calc(100% + 8px)",
                    right: 0,
                    width: "280px",
                    background: "#fff",
                    border: "1.5px solid #d4cdc0",
                    borderRadius: "12px",
                    boxShadow: "0 12px 32px rgba(0,0,0,0.1)",
                    zIndex: 200,
                    overflow: "hidden",
                  }}
                >
                  <div
                    style={{
                      padding: "14px 18px",
                      borderBottom: "1px solid #ede8df",
                      fontSize: "13px",
                      fontWeight: 700,
                      fontFamily: "'Clash Display', sans-serif",
                    }}
                  >
                    Notifications
                  </div>
                  {notifications.length > 0 ? (
                    notifications.map((n) => (
                      <div
                        key={n.id}
                        style={{
                          padding: "12px 18px",
                          borderBottom: "1px solid #ede8df",
                          background: n.read ? "transparent" : "rgba(232,76,30,0.04)",
                          cursor: "pointer",
                          transition: "background 0.15s",
                        }}
                        onMouseEnter={(e) => (e.currentTarget.style.background = "#f5f0e8")}
                        onMouseLeave={(e) =>
                          (e.currentTarget.style.background = n.read
                            ? "transparent"
                            : "rgba(232,76,30,0.04)")
                        }
                      >
                        <div style={{ fontSize: "13px", color: "#0f0e0a" }}>{n.text}</div>
                        <div style={{ fontSize: "11px", color: "#8a8070", marginTop: "2px" }}>{n.time}</div>
                      </div>
                    ))
                  ) : (
                    <div style={{ padding: "24px 18px", textAlign: "center", color: "#8a8070", fontSize: "13px" }}>
                      No notifications
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </header>

        <div className="content">
          <div>
            {renderContent()}
          </div>
        </div>
      </div>

      {/* ── BOTTOM NAV (Mobile) ── */}
      {screenWidth < 860 && (
        <nav className="bottom-nav">
          {[
            { key: "dashboard", icon: "🏠", label: "Home" },
            { key: "scans", icon: "📄", label: "Scans" },
            { key: "reviewer-page", icon: "🎯", label: "Review" },
            { key: "jd-page", icon: "🔍", label: "JD Match" },
          ].map((item) => (
            <button
              key={item.key}
              className={`bottom-nav-item ${activeNav === item.key ? "active" : ""}`}
              onClick={() => handleNavClick(item.key)}
            >
              <span className="bottom-nav-icon">{item.icon}</span>
              {item.label}
            </button>
          ))}
        </nav>
      )}

      {/* ── PAYMENT MODAL ── */}
      <div
        className={`modal-overlay ${modal.open ? "show" : ""}`}
        onClick={(e) => { if (e.target.classList.contains("modal-overlay")) closeModalAndGoHome(); }}
      >
        {activePlan && (
          <div
            className="modal"
            style={{ animation: "modalIn 0.25s ease both" }}
          >
            <div className="modal-header">
              <div className="modal-title">{activePlan.title}</div>
              <button className="modal-close" onClick={closeModalAndGoHome}>✕</button>
            </div>
            <div className="modal-body">
              <div className="modal-plan-tag">{activePlan.tag}</div>
              <div className="modal-desc">{activePlan.desc}</div>
              <div className="modal-price-box">
                <div>
                  <div className="modal-price">{activePlan.price} <span className="modal-price-period">one-time</span></div>
                  <div className="modal-valid">Valid for 1 month</div>
                </div>
                <div className="modal-scans">
                  <div className="modal-scans-num">{activePlan.scans}</div>
                  <div className="modal-scans-label">Scans</div>
                </div>
              </div>
              <ul className="modal-features">
                {activePlan.features.map((f, i) => <li key={i}>{f}</li>)}
              </ul>
              <button className="modal-pay-btn" onClick={handlePayment} disabled={loadingPlan === modal.plan}>
                {loadingPlan === modal.plan ? (
                  <><span className="spinner" /> Processing...</>
                ) : (
                  "💳 Pay & Unlock"
                )}
              </button>
              <div className="modal-note">Secured by Razorpay · Cancel anytime</div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
