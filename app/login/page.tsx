'use client'
// app/login/page.tsx

import { useState, useEffect, FormEvent } from "react";
import { useRouter }           from "next/navigation";
import Link                    from "next/link";

const API = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000";

// ── Eye icon (show/hide password) ───────────────────────────────────

const EyeIcon = ({ off }: { off?: boolean }) => (
  <svg
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth={2}
    strokeLinecap="round"
    strokeLinejoin="round"
    className="auth__eye-svg"
  >
    {off ? (
      <>
        {/* paths */}
      </>
    ) : (
      <>
        {/* paths */}
      </>
    )}
  </svg>
);

const AtsIcon = () => (
  <svg
    width="20"
    height="20"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth={2}
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d="M3 12h4l2-6 4 12 2-6h6" />
  </svg>
);

const ResumeIcon = () => (
  <svg
    width="20"
    height="20"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth={2}
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
    <path d="M14 2v6h6" />
    <path d="M8 13h8" />
    <path d="M8 17h5" />
  </svg>
);

const RecruiterIcon = () => (
  <svg
    width="20"
    height="20"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth={2}
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <circle cx="9" cy="8" r="4" />
    <path d="M17 11l2 2 4-4" />
    <path d="M3 20a6 6 0 0 1 12 0" />
  </svg>
);

const SPOTLIGHT_FEATURES = [
  {
    title: "ATS Score in 10 seconds",
    desc: "Instantly see how your resume matches any Salesforce JD before you apply.",
    accent: "#00A1E0",
    icon: <AtsIcon />,
  },
  {
    title: "AI Resume Builder",
    desc: "Paste a JD and get an ATS-optimized resume with interview questions.",
    accent: "#7B61FF",
    icon: <ResumeIcon />,
  },
  {
    title: "Get Discovered by Recruiters",
    desc: "Top Salesforce employers search verified profiles daily.",
    accent: "#00C48C",
    icon: <RecruiterIcon />,
  },
  {
    title: "Verified Certification Badge",
    desc: "Verify your Salesforce certifications automatically.",
    accent: "#F5A623",
    icon:  <span>🏆</span>,
  },
];



// ── Salesforce cloud icon ────────────────────────────────────────────
const SfIcon = () => (
  <svg viewBox="0 0 100 67" xmlns="http://www.w3.org/2000/svg"
    className="auth__brand-icon" aria-hidden="true">
    <path d="M41.4 9.7C44.8 6 49.6 3.8 54.9 3.8c7.3 0 13.6 4.1 17 10.1 2.9-1.3 6.1-2 9.5-2 13.1 0 23.7 10.7 23.7 23.9S94.5 59.7 81.4 59.7H20.5C9.2 59.7 0 50.5 0 39.1c0-10.5 7.8-19.2 18-20.5-.1-.9-.2-1.7-.2-2.6C17.8 7.2 25 0 33.9 0c3.3 0 6.4 1 9 2.7"
      fill="#00A1E0" />
    <text x="50" y="42" textAnchor="middle" fontFamily="Arial, sans-serif"
      fontWeight="bold" fontSize="18" fill="#ffffff" letterSpacing="0.5">sf</text>
  </svg>
);

// ── Field validation ─────────────────────────────────────────────────
function validate(email: string, password: string): Record<string, string> {
  const errors: Record<string, string> = {};
  if (!email)                                  errors.email    = "Email is required.";
  else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) errors.email = "Enter a valid email.";
  if (!password)                               errors.password = "Password is required.";
  else if (password.length < 8)                errors.password = "Password must be at least 8 characters.";
  return errors;
}

// ── Component ────────────────────────────────────────────────────────
export default function LoginPage() {
  const router = useRouter();
  // Left panel animation
  const [featureIdx, setFeatureIdx] = useState(0);
  const [atsScore, setAtsScore] = useState(0);
  const [email,      setEmail]      = useState("");
  const [password,   setPassword]   = useState("");
  const [showPass,   setShowPass]   = useState(false);
  const [errors,     setErrors]     = useState<Record<string, string>>({});
  const [serverErr,  setServerErr]  = useState("");
  const [loading,    setLoading]    = useState(false);
  const [touched,    setTouched]    = useState<Record<string, boolean>>({});


  useEffect(() => {
    const t = setInterval(() => {
      setFeatureIdx((i) => (i + 1) % SPOTLIGHT_FEATURES.length);
    }, 3500);

    return () => clearInterval(t);
  }, []);

  useEffect(() => {
    let raf: number;
    let start: number | null = null;

    const animate = (ts: number) => {
      if (start === null) start = ts;

      const p = Math.min((ts - start) / 1800, 1);

      setAtsScore(Math.round(92 * (1 - Math.pow(1 - p, 3))));

      if (p < 1) {
        raf = requestAnimationFrame(animate);
      }
    };

    raf = requestAnimationFrame(animate);

    return () => cancelAnimationFrame(raf);
  }, []);

  const handleBlur = (field: string) =>
    setTouched((prev) => ({ ...prev, [field]: true }));

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setServerErr("");

    // Mark all touched on submit
    setTouched({ email: true, password: true });

    const fieldErrors = validate(email, password);
    setErrors(fieldErrors);
    if (Object.keys(fieldErrors).length > 0) return;

    setLoading(true);
    try {
      const res = await fetch(`${API}/api/auth/login`, {
        method:      "POST",
        headers:     { "Content-Type": "application/json" },
        credentials: "include",   // sends/receives cookies
        body:        JSON.stringify({ email, password }),
      });

      const data = await res.json();

      if (!res.ok) {
        setServerErr(data.message ?? "Login failed. Please try again.");
        return;
      }

      // Store access token (short-lived) in localStorage
      localStorage.setItem("tc_token", data.token);
      localStorage.setItem("tc_user",  JSON.stringify(data.user));

      router.push("/");
    } catch {
      setServerErr("Network error. Please check your connection.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page">
      {/* Left panel — Animated feature showcase */}
      <div className="auth-panel auth-panel--left" aria-hidden="true" style={{ position: "relative", overflow: "hidden" }}>
        {/* Animated gradient orbs */}
        <div style={{
          position: "absolute", top: "-100px", left: "-100px", width: "400px", height: "400px",
          borderRadius: "50%", background: "radial-gradient(circle, rgba(0,161,224,0.45), transparent 70%)",
          filter: "blur(40px)", animation: "tcOrb1 12s ease-in-out infinite", pointerEvents: "none",
        }} />
        <div style={{
          position: "absolute", bottom: "-100px", right: "-80px", width: "380px", height: "380px",
          borderRadius: "50%", background: "radial-gradient(circle, rgba(123,97,255,0.45), transparent 70%)",
          filter: "blur(40px)", animation: "tcOrb2 14s ease-in-out infinite", pointerEvents: "none",
        }} />

        <div className="auth-panel__inner" style={{ position: "relative", zIndex: 2, display: "flex", flexDirection: "column", gap: "1.75rem", maxWidth: 460 }}>
          {/* Brand */}
          <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
            <SfIcon />
            <div>
              <div style={{ fontSize: "1.5rem", fontWeight: 800, letterSpacing: "-0.02em", color: "#fff", lineHeight: 1 }}>TalentCloud</div>
              <div style={{ fontSize: "0.72rem", color: "rgba(255,255,255,0.7)", letterSpacing: "0.08em", textTransform: "uppercase", marginTop: 4 }}>AI Careers · For Salesforce</div>
            </div>
          </div>

          {/* Headline */}
          <div>
            <h2 style={{ fontSize: "2rem", fontWeight: 800, color: "#fff", lineHeight: 1.15, letterSpacing: "-0.02em", margin: 0 }}>
              Join <span style={{ background: "linear-gradient(90deg,#7FDBFF,#B061FF)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", backgroundClip: "text" }}>12,000+</span> Salesforce pros landing offers 3× faster.
            </h2>
            <p style={{ marginTop: "0.75rem", fontSize: "0.95rem", color: "rgba(255,255,255,0.75)", lineHeight: 1.55 }}>
              Everything you need to get hired — in one platform.
            </p>
          </div>

          {/* Rotating feature spotlight */}
          <div style={{
            position: "relative", background: "rgba(255,255,255,0.08)", backdropFilter: "blur(12px)",
            WebkitBackdropFilter: "blur(12px)", border: "1px solid rgba(255,255,255,0.15)",
            borderRadius: 16, padding: "1.25rem", minHeight: 150, overflow: "hidden",
          }}>
            {SPOTLIGHT_FEATURES.map((f, i) => (
              <div key={i} style={{
                position: i === featureIdx ? "relative" : "absolute",
                inset: i === featureIdx ? undefined : 0,
                padding: i === featureIdx ? 0 : "1.25rem",
                opacity: i === featureIdx ? 1 : 0,
                transform: i === featureIdx ? "translateY(0)" : "translateY(10px)",
                transition: "opacity 0.6s ease, transform 0.6s ease",
                pointerEvents: i === featureIdx ? "auto" : "none",
              }}>
                <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", marginBottom: "0.5rem" }}>
                  <div style={{
                    width: 40, height: 40, borderRadius: 10, display: "flex", alignItems: "center", justifyContent: "center",
                    background: `linear-gradient(135deg, ${f.accent}, ${f.accent}99)`, color: "#fff",
                    boxShadow: `0 8px 24px -8px ${f.accent}`,
                  }}>{f.icon}</div>
                  <div style={{ fontSize: "1.05rem", fontWeight: 700, color: "#fff", lineHeight: 1.2 }}>{f.title}</div>
                </div>
                <p style={{ margin: 0, fontSize: "0.88rem", color: "rgba(255,255,255,0.78)", lineHeight: 1.5, paddingLeft: "3.25rem" }}>{f.desc}</p>
              </div>
            ))}

            {/* Progress dots */}
            <div style={{ position: "absolute", bottom: 12, right: 14, display: "flex", gap: 5 }}>
              {SPOTLIGHT_FEATURES.map((_, i) => (
                <div key={i} style={{
                  width: i === featureIdx ? 18 : 6, height: 6, borderRadius: 3,
                  background: i === featureIdx ? "#fff" : "rgba(255,255,255,0.35)",
                  transition: "width 0.4s ease, background 0.4s ease",
                }} />
              ))}
            </div>
          </div>

          {/* Mini live ATS score demo */}
          <div style={{
            display: "flex", alignItems: "center", gap: "1rem",
            background: "linear-gradient(135deg, rgba(255,255,255,0.12), rgba(255,255,255,0.04))",
            border: "1px solid rgba(255,255,255,0.15)", borderRadius: 16, padding: "1rem 1.25rem",
          }}>
            <div style={{ position: "relative", width: 70, height: 70, flexShrink: 0 }}>
              <svg viewBox="0 0 100 100" style={{ width: "100%", height: "100%", transform: "rotate(-90deg)" }}>
                <circle cx="50" cy="50" r="42" fill="none" stroke="rgba(255,255,255,0.15)" strokeWidth="10" />
                <circle
                  cx="50" cy="50" r="42" fill="none" stroke="url(#tcGrad)" strokeWidth="10" strokeLinecap="round"
                  strokeDasharray="264"
                  strokeDashoffset={264 - (264 * atsScore) / 100}
                  style={{ transition: "stroke-dashoffset 0.1s linear" }}
                />
                <defs>
                  <linearGradient id="tcGrad" x1="0" y1="0" x2="1" y2="1">
                    <stop offset="0%" stopColor="#7FDBFF" /><stop offset="100%" stopColor="#B061FF" />
                  </linearGradient>
                </defs>
              </svg>
              <div style={{
                position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center",
                fontSize: "1.1rem", fontWeight: 800, color: "#fff",
              }}>{atsScore}%</div>
            </div>
            <div>
              <div style={{ fontSize: "0.72rem", textTransform: "uppercase", letterSpacing: "0.08em", color: "rgba(255,255,255,0.65)", fontWeight: 600 }}>Live ATS Match</div>
              <div style={{ fontSize: "1rem", fontWeight: 700, color: "#fff", marginTop: 2 }}>Sr. Salesforce Developer</div>
              <div style={{ display: "flex", alignItems: "center", gap: 5, marginTop: 4 }}>
                <span style={{ width: 6, height: 6, borderRadius: "50%", background: "#00C48C", boxShadow: "0 0 8px #00C48C" }} />
                <span style={{ fontSize: "0.75rem", color: "#B4F0D4", fontWeight: 600 }}>Strong match · Ready to apply</span>
              </div>
            </div>
          </div>

          {/* Trust bar / stats */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "0.75rem" }}>
            {[
              { v: "12k+", l: "Hired" },
              { v: "60s",  l: "Resume" },
              { v: "87%",  l: "Avg boost" },
            ].map((s) => (
              <div key={s.l} style={{
                background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.12)",
                borderRadius: 12, padding: "0.75rem", textAlign: "center",
              }}>
                <div style={{ fontSize: "1.25rem", fontWeight: 800, color: "#fff", lineHeight: 1 }}>{s.v}</div>
                <div style={{ fontSize: "0.7rem", color: "rgba(255,255,255,0.65)", marginTop: 4, letterSpacing: "0.04em" }}>{s.l}</div>
              </div>
            ))}
          </div>

          {/* Social proof ribbon */}
          <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
            <div style={{ display: "flex" }}>
              {["#FF9F43", "#EE5A6F", "#7B61FF", "#00A1E0"].map((c, i) => (
                <div key={i} style={{
                  width: 32, height: 32, borderRadius: "50%", background: c,
                  border: "2px solid rgba(255,255,255,0.9)", marginLeft: i === 0 ? 0 : -10,
                  display: "flex", alignItems: "center", justifyContent: "center",
                  color: "#fff", fontWeight: 700, fontSize: "0.75rem",
                }}>{["P", "M", "A", "D"][i]}</div>
              ))}
            </div>
            <div>
              <div style={{ display: "flex", gap: 2, color: "#FFC94A" }}>
                {[...Array(5)].map((_, i) => (
                  <svg key={i} viewBox="0 0 24 24" fill="currentColor" width="14" height="14"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" /></svg>
                ))}
              </div>
              <div style={{ fontSize: "0.75rem", color: "rgba(255,255,255,0.75)", marginTop: 2 }}>Loved by Salesforce professionals worldwide</div>
            </div>
          </div>
        </div>

        {/* Keyframes */}
        <style>{`
          @keyframes tcOrb1 {
            0%,100% { transform: translate(0,0) scale(1); }
            50% { transform: translate(60px,40px) scale(1.15); }
          }
          @keyframes tcOrb2 {
            0%,100% { transform: translate(0,0) scale(1); }
            50% { transform: translate(-50px,-30px) scale(1.1); }
          }
        `}</style>
      </div>

      {/* Right panel — form */}
      <div className="auth-panel auth-panel--right">
        <div className="auth-form-wrap">
          {/* Mobile logo */}
          <div className="auth-mobile-logo">
            <SfIcon />
            <span>TalentCloud</span>
          </div>

          <h1 className="auth-form__title">Welcome back</h1>
          <p className="auth-form__sub">Sign in to your account to continue</p>

          {/* Server error banner */}
          {serverErr && (
            <div className="auth-alert auth-alert--error" role="alert">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"
                strokeLinecap="round" strokeLinejoin="round" className="auth-alert__icon" aria-hidden="true">
                <circle cx="12" cy="12" r="10" />
                <line x1="12" y1="8" x2="12" y2="12" />
                <line x1="12" y1="16" x2="12.01" y2="16" />
              </svg>
              {serverErr}
            </div>
          )}

          <form onSubmit={handleSubmit} className="auth-form" noValidate>
            {/* Email */}
            <div className="auth-field">
              <label className="auth-label" htmlFor="email">Email address</label>
              <input
                id="email"
                type="email"
                autoComplete="email"
                className={`auth-input ${touched.email && errors.email ? "auth-input--error" : ""}`}
                value={email}
                onChange={(e) => { setEmail(e.target.value); setErrors((p) => ({ ...p, email: "" })); }}
                onBlur={() => handleBlur("email")}
                placeholder="you@example.com"
                aria-describedby={errors.email ? "email-err" : undefined}
              />
              {touched.email && errors.email && (
                <span id="email-err" className="auth-field-error" role="alert">{errors.email}</span>
              )}
            </div>

            {/* Password */}
            <div className="auth-field">
              <div className="auth-label-row">
                <label className="auth-label" htmlFor="password">Password</label>
                <Link href="/forgot-password" className="auth-forgot">Forgot password?</Link>
              </div>
              <div className="auth-input-wrap">
                <input
                  id="password"
                  type={showPass ? "text" : "password"}
                  autoComplete="current-password"
                  className={`auth-input auth-input--has-icon ${touched.password && errors.password ? "auth-input--error" : ""}`}
                  value={password}
                  onChange={(e) => { setPassword(e.target.value); setErrors((p) => ({ ...p, password: "" })); }}
                  onBlur={() => handleBlur("password")}
                  placeholder="••••••••"
                  aria-describedby={errors.password ? "pass-err" : undefined}
                />
                <button
                  type="button"
                  className="auth__eye-btn"
                  onClick={() => setShowPass((p) => !p)}
                  aria-label={showPass ? "Hide password" : "Show password"}
                >
                  <EyeIcon off={showPass} />
                </button>
              </div>
              {touched.password && errors.password && (
                <span id="pass-err" className="auth-field-error" role="alert">{errors.password}</span>
              )}
            </div>

            {/* Submit */}
            <button
              type="submit"
              className="auth-submit"
              disabled={loading}
              aria-busy={loading}
            >
              {loading ? (
                <span className="auth-spinner" aria-hidden="true" />
              ) : null}
              {loading ? "Signing in…" : "Sign in"}
            </button>
          </form>

          {/* Divider */}
          <div className="auth-divider"><span>or</span></div>

          <p className="auth-switch">
            Don&apos;t have an account?{" "}
            <Link href="/register" className="auth-switch__link">Create one free</Link>
          </p>
        </div>
      </div>
    </div>
  );
}