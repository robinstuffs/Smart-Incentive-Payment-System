import React, { useEffect, useRef } from 'react';
import { useLocation } from 'wouter';
import {
  Heart,
  TrendingUp,
  Shield,
  Users,
  CheckCircle,
  ArrowRight,
  Zap,
  Lock,
  Compass,
} from 'lucide-react';
import './Home.css';

function useScrollReveal() {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const els = document.querySelectorAll<HTMLElement>('.reveal');
    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((e) => {
          if (e.isIntersecting) {
            e.target.classList.add('visible');
            io.unobserve(e.target);
          }
        });
      },
      { threshold: 0.12 }
    );
    els.forEach((el) => io.observe(el));
    return () => io.disconnect();
  }, []);

  return ref;
}

export default function Home() {
  const [, setLocation] = useLocation();
  useScrollReveal();

  const steps = [
    { icon: Users,       label: 'Register',   desc: 'Create your account in under two minutes' },
    { icon: CheckCircle, label: 'Apply',       desc: 'Fill out the simple online application form' },
    { icon: Zap,         label: 'Assessment',  desc: 'Receive an instant AI-powered eligibility result' },
    { icon: TrendingUp,  label: 'Receive',     desc: 'Eligible applicants get their payment directly' },
  ];

  const benefits = [
    {
      icon: Shield,
      glowColor: 'rgba(6, 182, 212, 0.15)',
      iconColor: '#06b6d4',
      title: 'Secure & private',
      desc: 'Personal data is encrypted end-to-end and never shared with third parties.',
    },
    {
      icon: Zap,
      glowColor: 'rgba(139, 92, 246, 0.15)',
      iconColor: '#8b5cf6',
      title: 'Fast & paperless',
      desc: 'No queues, no forms to post. The whole process runs in your browser.',
    },
    {
      icon: Heart,
      glowColor: 'rgba(236, 72, 153, 0.15)',
      iconColor: '#ec4899',
      title: 'Fully transparent',
      desc: 'Clear eligibility criteria upfront. You always know exactly where you stand.',
    },
  ];

  return (
    <div className="page-wrapper">
      <div className="grid-overlay" />

      {/* ── Navigation ─────────────────────────────────────────────────── */}
      <nav className="navbar">
        <div className="nav-container">
          <div className="logo-group">
            <div className="logo-icon">
              <span>SI</span>
            </div>
            <span className="logo-text">Smart Incentive</span>
          </div>

          <div className="nav-actions">
            <button
              onClick={() => setLocation('/user/login')}
              className="btn-text"
            >
              Sign in
            </button>
            <button
              onClick={() => setLocation('/admin/login')}
              className="btn-nav-accent"
            >
              Admin Portal
            </button>
          </div>
        </div>
      </nav>

      {/* ── Hero ───────────────────────────────────────────────────────── */}
      <section className="hero-section">
        <div className="hero-glow-1" />
        <div className="hero-glow-2" />

        <div className="hero-container">
          <div className="hero-grid">

            {/* Left Column */}
            <div className="hero-left">
              <span className="hero-badge">
                <span className="pulse-dot" />
                <span className="badge-text">AI-Enabled Incentive System</span>
              </span>

              <h1 className="hero-headline">
                Benefits you've earned, <span className="gradient-text">delivered instantly.</span>
              </h1>

              <p className="hero-subheading">
                Apply for government incentives in minutes. Our instant assessment engine 
                evaluates applications on the spot—no queues, zero paper trail.
              </p>

              <div className="cta-group">
                <button className="btn-primary" onClick={() => setLocation('/user/register')}>
                  Apply Now
                  <ArrowRight size={16} />
                </button>
                <button className="btn-secondary" onClick={() => setLocation('/user/login')}>
                  Track Status
                </button>
              </div>

              <div className="trust-strip">
                <span className="trust-pill">
                  <Shield size={14} className="cyan-glow-text" />
                  End-to-End Encrypted
                </span>
                <span className="trust-pill">
                  <CheckCircle size={14} className="green-glow-text" />
                  Instant Decisiveness
                </span>
                <span className="trust-pill">
                  <Lock size={14} className="violet-glow-text" />
                  Zero-Knowledge Privacy
                </span>
              </div>
            </div>

            {/* Right Column (Floating Stat Panel) */}
            <div className="hero-panel-wrap">
              <div className="hero-panel">
                <div className="panel-header">
                  <Compass size={16} className="cyan-glow-text" />
                  <span>SYSTEM FEED</span>
                </div>

                <div className="stat-list">
                  {[
                    { icon: Users,       glow: 'cyan',   label: 'Biometric Verification',  sub: 'Instant digital passport sync' },
                    { icon: Zap,         glow: 'violet', label: 'AI Risk Engine Run',      sub: 'Algorithmic check' },
                    { icon: TrendingUp,  glow: 'green',  label: 'Direct Ledger Transfer',  sub: 'Instant verification' },
                  ].map(({ icon: Icon, glow, label, sub }, i) => (
                    <div key={i} className="stat-card">
                      <div className={`stat-icon-wrap glow-${glow}`}>
                        <Icon size={18} />
                      </div>
                      <div className="stat-details">
                        <p className="stat-label">{label}</p>
                        <p className="stat-sub">{sub}</p>
                      </div>
                      <div className="status-indicator">
                        <span className="dot-active" />
                      </div>
                    </div>
                  ))}
                </div>

                <div className="panel-footer">
                  <div className="avatar-stack">
                    {['#06b6d4','#8b5cf6','#ec4899'].map((bg, i) => (
                      <div key={i} className="avatar-node" style={{ backgroundColor: bg }} />
                    ))}
                  </div>
                  <p className="footer-stat-text">
                    <strong>12,400+</strong> applications processed today
                  </p>
                </div>
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* ── How It Works ───────────────────────────────────────────────── */}
      <section className="steps-section">
        <div className="section-container">
          <div className="section-header reveal">
            <span className="section-tag">ENGINE ARCHITECTURE</span>
            <h2 className="section-title">Four Steps to Access Funding</h2>
          </div>

          <div className="steps-grid">
            {steps.map(({ icon: Icon, label, desc }, i) => (
              <div key={i} className={`step-card reveal reveal-delay-${i + 1}`}>
                <div className="step-card-glow" />
                <span className="step-number">0{i + 1}</span>
                <div className="step-icon-box">
                  <Icon size={24} />
                </div>
                <h3 className="step-title">{label}</h3>
                <p className="step-desc">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Benefits ───────────────────────────────────────────────────── */}
      <section className="benefits-section">
        <div className="section-container">
          <div className="section-header reveal">
            <span className="section-tag">SYSTEM INTEGRITY</span>
            <h2 className="section-title">Why Smart Incentive</h2>
          </div>

          <div className="benefits-grid">
            {benefits.map(({ icon: Icon, glowColor, iconColor, title, desc }, i) => (
              <div key={i} className={`benefit-card reveal reveal-delay-${i + 1}`} style={{ '--glow-color': glowColor } as React.CSSProperties}>
                <div className="benefit-icon-box" style={{ color: iconColor }}>
                  <Icon size={24} />
                </div>
                <h3 className="benefit-title">{title}</h3>
                <p className="benefit-desc">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA Banner ─────────────────────────────────────────────────── */}
      <section className="cta-section">
        <div className="cta-container reveal">
          <div className="cta-inner">
            <div className="cta-glow" />
            <span className="cta-tag">SECURE YOUR ACCESS</span>
            <h2 className="cta-headline">Determine your eligibility instantly</h2>
            <p className="cta-body">
              Join thousands of citizens receiving rapid financial support backed by secure state architecture.
            </p>
            <button
              className="btn-primary"
              onClick={() => setLocation('/user/register')}
            >
              Initialize Assessment
              <ArrowRight size={16} />
            </button>
          </div>
        </div>
      </section>

      {/* ── Footer ─────────────────────────────────────────────────────── */}
      <footer className="footer">
        <div className="footer-container">
          <div className="footer-grid">
            <div className="footer-brand-side">
              <div className="logo-group">
                <div className="logo-icon">
                  <span>SI</span>
                </div>
                <span className="logo-text">Smart Incentive</span>
              </div>
              <p className="brand-description">
                Supporting citizens with modern, frictionless, and secure financial disbursement technology.
              </p>
            </div>

            {[
              {
                heading: 'Citizens',
                links: [
                  { label: 'Register', path: '/user/register' },
                  { label: 'Sign in',  path: '/user/login'     },
                ],
              },
              {
                heading: 'Admins',
                links: [
                  { label: 'Admin portal', path: '/admin/login' },
                ],
              },
              {
                heading: 'Support',
                links: [
                  { label: 'Help Centre', path: '#' },
                  { label: 'Contact',  path: '#' },
                  { label: 'Privacy Protocol',     path: '#' },
                ],
              },
            ].map(({ heading, links }) => (
              <div key={heading} className="footer-link-group">
                <p className="footer-heading">{heading}</p>
                <ul className="footer-links">
                  {links.map(({ label, path }) => (
                    <li key={label}>
                      <button
                        onClick={() => path !== '#' && setLocation(path)}
                        className="footer-btn"
                      >
                        {label}
                      </button>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>

          <div className="footer-base">
            <p>© 2026 Smart Incentive Payment System. Cryptographically secured and audited.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}