'use client'
// app/register/page.tsx

import { useState, useEffect, FormEvent } from "react";
import { useRouter }                     from "next/navigation";
import Link                              from "next/link";

const API = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000";


// ── Icons ────────────────────────────────────────────────────────────
const EyeIcon = ({ off }: { off?: boolean }) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"
    strokeLinecap="round" strokeLinejoin="round" className="auth__eye-svg" aria-hidden="true">
    {off ? (
      <>
        <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94" />
        <path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19" />
        <line x1="1" y1="1" x2="23" y2="23" />
      </>
    ) : (
      <>
        <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
        <circle cx="12" cy="12" r="3" />
      </>
    )}
  </svg>
);


const SfIcon = () => (
  <svg viewBox="0 0 100 67" xmlns="http://www.w3.org/2000/svg"
    className="auth__brand-icon" aria-hidden="true">
    <path d="M41.4 9.7C44.8 6 49.6 3.8 54.9 3.8c7.3 0 13.6 4.1 17 10.1 2.9-1.3 6.1-2 9.5-2 13.1 0 23.7 10.7 23.7 23.9S94.5 59.7 81.4 59.7H20.5C9.2 59.7 0 50.5 0 39.1c0-10.5 7.8-19.2 18-20.5-.1-.9-.2-1.7-.2-2.6C17.8 7.2 25 0 33.9 0c3.3 0 6.4 1 9 2.7"
      fill="#00A1E0" />
    <text x="50" y="42" textAnchor="middle" fontFamily="Arial, sans-serif"
      fontWeight="bold" fontSize="18" fill="#ffffff" letterSpacing="0.5">Salesforce</text>
  </svg>
);


// ── Password strength ────────────────────────────────────────────────
function getStrength(pw: string): { score: number; label: string; color: string } {
  let score = 0;
  if (pw.length >= 8)                    score++;
  if (pw.length >= 12)                   score++;
  if (/[A-Z]/.test(pw))                  score++;
  if (/[0-9]/.test(pw))                  score++;
  if (/[^A-Za-z0-9]/.test(pw))          score++;

  const levels = [
    { label: "",          color: "transparent" },
    { label: "Weak",      color: "#E53E3E" },
    { label: "Fair",      color: "#ED8936" },
    { label: "Good",      color: "#ECC94B" },
    { label: "Strong",    color: "#48BB78" },
    { label: "Very Strong", color: "#38A169" },
  ];
  return { score, ...levels[score] };
}


// ── Validation ───────────────────────────────────────────────────────
function validate(fields: {
  name: string; email: string; password: string; confirm: string;
}): Record<string, string> {
  const e: Record<string, string> = {};
  if (!fields.name.trim())                                   e.name     = "Full name is required.";
  if (!fields.email)                                         e.email    = "Email is required.";
  else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(fields.email)) e.email   = "Enter a valid email.";
  if (!fields.password)                                      e.password = "Password is required.";
  else if (fields.password.length < 8)                       e.password = "At least 8 characters required.";
  if (!fields.confirm)                                       e.confirm  = "Please confirm your password.";
  else if (fields.confirm !== fields.password)               e.confirm  = "Passwords do not match.";
  return e;
}


// ── Rotating feature spotlight content ───────────────────────────────
const SPOTLIGHT_FEATURES = [
  {
    title: "ATS Score in 10 seconds",
    desc: "Instantly see how your resume matches any Salesforce JD — before you apply.",
    accent: "#00A1E0",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" width="22" height="22">
        <circle cx="12" cy="12" r="10" /><circle cx="12" cy="12" r="6" /><circle cx="12" cy="12" r="2" />
      </svg>
    ),
  },
  {
    title: "AI Resume Builder",
    desc: "Paste a JD → get an ATS-optimized resume + cover letter + 20 interview questions in 60 seconds.",
    accent: "#7B61FF",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" width="22" height="22">
        <path d="M12 3l2 5 5 .8-3.6 3.6.8 5L12 15l-4.2 2.4.8-5L5 8.8l5-.8z" />
      </svg>
    ),
  },
  {
    title: "Get Discovered by Recruiters",
    desc: "Top Salesforce employers search verified profiles daily. Flip visibility on with one toggle.",
    accent: "#00C48C",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" width="22" height="22">
        <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
        <circle cx="9" cy="7" r="4" />
        <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
        <path d="M16 3.13a4 4 0 0 1 0 7.75" />
      </svg>
    ),
  },
  {
    title: "Verified Certification Badge",
    desc: "Enter your Webassessor ID — we verify your Salesforce certs and add a Verified badge.",
    accent: "#F5A623",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" width="22" height="22">
        <path d="M9 12l2 2 4-4" />
        <path d="M21 12c0 4.97-4.03 9-9 9s-9-4.03-9-9 4.03-9 9-9 9 4.03 9 9z" />
      </svg>
    ),
  },
];


// ── Component ────────────────────────────────────────────────────────
export default function RegisterPage() {
  const router = useRouter();

  const [name,       setName]      = useState("");
  const [email,      setEmail]     = useState("");
  // NOTE: "admin" is intentionally NOT selectable here — letting anyone
  // pick "admin" at signup is a security hole. Admin accounts should be
  // promoted manually (e.g. directly in MongoDB), never self-assigned.
  const [role, setRole] = useState<"user" | "recruiter">("user");
  const [password,   setPassword]  = useState("");
  const [confirm,    setConfirm]   = useState("");
  const [showPass,   setShowPass]  = useState(false);
  const [showConf,   setShowConf]  = useState(false);
  const [errors,     setErrors]    = useState<Record<string, string>>({});
  const [serverErr,  setServerErr] = useState("");
  const [loading,    setLoading]   = useState(false);
  const [touched,    setTouched]   = useState<Record<string, boolean>>({});
  const [success,    setSuccess]   = useState(false);

  const [step, setStep] = useState<"form" | "otp">("form");
  const [otp, setOtp] = useState("");
  const [otpError, setOtpError] = useState("");
  const [resending, setResending] = useState(false);
  const [resendMsg, setResendMsg] = useState("");

  // ── Left-panel animation state ─────────────────────────────────────
  const [featureIdx, setFeatureIdx] = useState(0);
  const [atsScore, setAtsScore]     = useState(0);

  useEffect(() => {
    const t = setInterval(() => setFeatureIdx((i) => (i + 1) % SPOTLIGHT_FEATURES.length), 3500);
    return () => clearInterval(t);
  }, []);

  useEffect(() => {
    let raf: number;
    let start: number | null = null;
    const animate = (ts: number) => {
      if (start === null) start = ts;
      const p = Math.min((ts - start) / 1800, 1);
      setAtsScore(Math.round(92 * (1 - Math.pow(1 - p, 3))));
      if (p < 1) raf = requestAnimationFrame(animate);
    };
    raf = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(raf);
  }, []);

  const strength = getStrength(password);

  const handleBlur = (field: string) =>
    setTouched((prev) => ({ ...prev, [field]: true }));

  const clearError = (field: string) =>
    setErrors((prev) => ({ ...prev, [field]: "" }));

  // ── Step 1: create account, send OTP. Nothing is stored in
  // localStorage and no redirect happens here — the account only
  // becomes usable once the OTP is verified below.
  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setServerErr("");
    setTouched({ name: true, email: true, password: true, confirm: true });

    const fieldErrors = validate({ name, email, password, confirm });
    setErrors(fieldErrors);
    if (Object.keys(fieldErrors).length > 0) return;

    setLoading(true);
    try {
      const res = await fetch(`${API}/api/auth/register`, {
        method:      "POST",
        headers:     { "Content-Type": "application/json" },
        credentials: "include",
        body:        JSON.stringify({ name, email, password, role }),
      });

      const data = await res.json();

      if (!res.ok) {
        setServerErr(data.message ?? "Registration failed. Please try again.");
        return;
      }

      // Registration only queues the OTP email at this point — the
      // backend should NOT return a usable session token yet.
      setStep("otp");
    } catch {
      setServerErr("Network error. Please check your connection.");
    } finally {
      setLoading(false);
    }
  };

  // ── Step 2: verify the code. Only on success do we get a real
  // session token, which is when we store it and redirect.
  const handleVerifyOtp = async (e: FormEvent) => {
    e.preventDefault();
    setOtpError("");
    if (otp.length !== 6) { setOtpError("Enter the 6-digit code."); return; }
    setLoading(true);
    try {
      const res = await fetch(`${API}/api/auth/verify-otp`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ email, otp }),
      });
      const data = await res.json();
      if (!res.ok) { setOtpError(data.message ?? "Verification failed."); return; }

      localStorage.setItem("tc_token", data.token);
      localStorage.setItem("tc_user", JSON.stringify(data.user));
      setSuccess(true);
      setTimeout(() => router.push("/"), 1500);
    } catch {
      setOtpError("Network error.");
    } finally {
      setLoading(false);
    }
  };

  const handleResendOtp = async () => {
    setResending(true);
    setResendMsg("");
    try {
      const res = await fetch(`${API}/api/auth/resend-otp`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      setResendMsg(res.ok ? "New code sent." : "Could not resend right now.");
    } catch {
      setResendMsg("Network error while resending.");
    } finally {
      setResending(false);
    }
  };

  if (step === "otp" && !success) {
    return (
      <div className="auth-page auth-page--center">
        <div className="auth-success" style={{ maxWidth: 360 }}>
          <div className="navbar__modal-icon" style={{ margin: "0 auto" }}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"
              strokeLinecap="round" strokeLinejoin="round" style={{ width: 26, height: 26 }}>
              <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
              <polyline points="22,6 12,13 2,6" />
            </svg>
          </div>
          <h2 className="auth-success__title">Check your email</h2>
          <p className="auth-success__sub">
            We sent a 6-digit code to <strong>{email}</strong>. It expires in 10 minutes.
          </p>
          <form onSubmit={handleVerifyOtp} style={{ width: "100%", marginTop: "1rem" }}>
            <input
              type="text"
              inputMode="numeric"
              maxLength={6}
              className="auth-input"
              placeholder="000000"
              value={otp}
              onChange={(e) => setOtp(e.target.value.replace(/\D/g, ""))}
              style={{ textAlign: "center", fontSize: "1.5rem", letterSpacing: "0.5rem" }}
            />
            {otpError && <p className="auth-field-error" style={{ marginTop: "0.5rem" }}>{otpError}</p>}
            <button type="submit" className="auth-submit" disabled={loading} style={{ marginTop: "1rem" }}>
              {loading ? "Verifying…" : "Verify & Continue"}
            </button>
          </form>
          <button
            className="auth-switch__link"
            style={{ background: "none", border: "none", marginTop: "1rem", cursor: "pointer" }}
            onClick={handleResendOtp}
            disabled={resending}
          >
            {resending ? "Sending…" : "Resend code"}
          </button>
          {resendMsg && <p className="auth-hint" style={{ marginTop: "0.5rem" }}>{resendMsg}</p>}
        </div>
      </div>
    );
  }

  // Success state
  if (success) {
    return (
      <div className="auth-page auth-page--center">
        <div className="auth-success">
          <div className="auth-success__icon" aria-hidden="true">✓</div>
          <h2 className="auth-success__title">Account verified!</h2>
          <p className="auth-success__sub">Redirecting you to the home page…</p>
        </div>
      </div>
    );
  }

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

          <h1 className="auth-form__title">Create your account</h1>
          <p className="auth-form__sub">Free forever. No credit card needed.</p>

          {/* Server error */}
          {serverErr && (
            <div className="auth-alert auth-alert--error" role="alert">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"
                strokeLinecap="round" strokeLinejoin="round" className="auth-alert__icon" aria-hidden="true">
                <circle cx="12" cy="12" r="10" />
                <line x1="12" y1="8"  x2="12"    y2="12" />
                <line x1="12" y1="16" x2="12.01" y2="16" />
              </svg>
              {serverErr}
            </div>
          )}

          <form onSubmit={handleSubmit} className="auth-form" noValidate>
            {/* Full name */}
            <div className="auth-field">
              <label className="auth-label" htmlFor="name">Full name</label>
              <input
                id="name"
                type="text"
                autoComplete="name"
                className={`auth-input ${touched.name && errors.name ? "auth-input--error" : ""}`}
                value={name}
                onChange={(e) => { setName(e.target.value); clearError("name"); }}
                onBlur={() => handleBlur("name")}
                placeholder="Jane Smith"
                aria-describedby={errors.name ? "name-err" : undefined}
              />
              {touched.name && errors.name && (
                <span id="name-err" className="auth-field-error" role="alert">{errors.name}</span>
              )}
            </div>

            {/* Email */}
            <div className="auth-field">
              <label className="auth-label" htmlFor="email">Email address</label>
              <input
                id="email"
                type="email"
                autoComplete="email"
                className={`auth-input ${touched.email && errors.email ? "auth-input--error" : ""}`}
                value={email}
                onChange={(e) => { setEmail(e.target.value); clearError("email"); }}
                onBlur={() => handleBlur("email")}
                placeholder="you@example.com"
                aria-describedby={errors.email ? "email-err" : undefined}
              />
              {touched.email && errors.email && (
                <span id="email-err" className="auth-field-error" role="alert">{errors.email}</span>
              )}
            </div>

            {/* Role — job seeker vs recruiter only. Admin is never
                self-selectable at signup. */}
            <div className="auth-field">
              <label className="auth-label">I am registering as</label>
              <div style={{ display: "flex", gap: "0.75rem" }}>
                <label
                  className="jobs-sidebar__check"
                  style={{
                    flex: 1,
                    border: role === "user" ? "1.5px solid var(--color-sf-blue)" : "1.5px solid #D8E6F0",
                    borderRadius: 8,
                    padding: "0.625rem",
                  }}
                >
                  <input type="radio" name="role" checked={role === "user"} onChange={() => setRole("user")} />
                  Job Seeker
                </label>
                <label
                  className="jobs-sidebar__check"
                  style={{
                    flex: 1,
                    border: role === "recruiter" ? "1.5px solid var(--color-sf-blue)" : "1.5px solid #D8E6F0",
                    borderRadius: 8,
                    padding: "0.625rem",
                  }}
                >
                  <input type="radio" name="role" checked={role === "recruiter"} onChange={() => setRole("recruiter")} />
                  Recruiter
                </label>
              </div>
            </div>

            {/* Password */}
            <div className="auth-field">
              <label className="auth-label" htmlFor="password">Password</label>
              <div className="auth-input-wrap">
                <input
                  id="password"
                  type={showPass ? "text" : "password"}
                  autoComplete="new-password"
                  className={`auth-input auth-input--has-icon ${touched.password && errors.password ? "auth-input--error" : ""}`}
                  value={password}
                  onChange={(e) => { setPassword(e.target.value); clearError("password"); }}
                  onBlur={() => handleBlur("password")}
                  placeholder="Min. 8 characters"
                  aria-describedby={errors.password ? "pass-err" : "pass-strength"}
                />
                <button type="button" className="auth__eye-btn"
                  onClick={() => setShowPass((p) => !p)}
                  aria-label={showPass ? "Hide password" : "Show password"}>
                  <EyeIcon off={showPass} />
                </button>
              </div>

              {/* Strength meter */}
              {password && (
                <div className="auth-strength" id="pass-strength" aria-live="polite">
                  <div className="auth-strength__bars">
                    {[1, 2, 3, 4, 5].map((i) => (
                      <div
                        key={i}
                        className="auth-strength__bar"
                        style={{ background: i <= strength.score ? strength.color : "#E2E8F0" }}
                      />
                    ))}
                  </div>
                  <span className="auth-strength__label" style={{ color: strength.color }}>
                    {strength.label}
                  </span>
                </div>
              )}

              {touched.password && errors.password && (
                <span id="pass-err" className="auth-field-error" role="alert">{errors.password}</span>
              )}
            </div>

            {/* Confirm password */}
            <div className="auth-field">
              <label className="auth-label" htmlFor="confirm">Confirm password</label>
              <div className="auth-input-wrap">
                <input
                  id="confirm"
                  type={showConf ? "text" : "password"}
                  autoComplete="new-password"
                  className={`auth-input auth-input--has-icon ${touched.confirm && errors.confirm ? "auth-input--error" : ""}`}
                  value={confirm}
                  onChange={(e) => { setConfirm(e.target.value); clearError("confirm"); }}
                  onBlur={() => handleBlur("confirm")}
                  placeholder="Re-enter your password"
                  aria-describedby={errors.confirm ? "conf-err" : undefined}
                />
                <button type="button" className="auth__eye-btn"
                  onClick={() => setShowConf((p) => !p)}
                  aria-label={showConf ? "Hide password" : "Show password"}>
                  <EyeIcon off={showConf} />
                </button>
              </div>
              {touched.confirm && errors.confirm && (
                <span id="conf-err" className="auth-field-error" role="alert">{errors.confirm}</span>
              )}
            </div>

            {/* Terms notice */}
            <p className="auth-terms">
              By creating an account you agree to our{" "}
              <Link href="/terms" className="auth-terms__link">Terms of Service</Link>
              {" "}and{" "}
              <Link href="/privacy" className="auth-terms__link">Privacy Policy</Link>.
            </p>

            {/* Submit */}
            <button type="submit" className="auth-submit" disabled={loading} aria-busy={loading}>
              {loading ? <span className="auth-spinner" aria-hidden="true" /> : null}
              {loading ? "Sending verification code…" : "Create account"}
            </button>
          </form>

          <div className="auth-divider"><span>or</span></div>

          <p className="auth-switch">
            Already have an account?{" "}
            <Link href="/login" className="auth-switch__link">Sign in</Link>
          </p>
        </div>
      </div>
    </div>
  );
}




// 'use client'
// // app/register/page.tsx

// import { useState, FormEvent } from "react";
// import { useRouter }           from "next/navigation";
// import Link                    from "next/link";

// const API = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000";


// // ── Icons ────────────────────────────────────────────────────────────
// const EyeIcon = ({ off }: { off?: boolean }) => (
//   <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"
//     strokeLinecap="round" strokeLinejoin="round" className="auth__eye-svg" aria-hidden="true">
//     {off ? (
//       <>
//         <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94" />
//         <path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19" />
//         <line x1="1" y1="1" x2="23" y2="23" />
//       </>
//     ) : (
//       <>
//         <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
//         <circle cx="12" cy="12" r="3" />
//       </>
//     )}
//   </svg>
// );


// const SfIcon = () => (
//   <svg viewBox="0 0 100 67" xmlns="http://www.w3.org/2000/svg"
//     className="auth__brand-icon" aria-hidden="true">
//     <path d="M41.4 9.7C44.8 6 49.6 3.8 54.9 3.8c7.3 0 13.6 4.1 17 10.1 2.9-1.3 6.1-2 9.5-2 13.1 0 23.7 10.7 23.7 23.9S94.5 59.7 81.4 59.7H20.5C9.2 59.7 0 50.5 0 39.1c0-10.5 7.8-19.2 18-20.5-.1-.9-.2-1.7-.2-2.6C17.8 7.2 25 0 33.9 0c3.3 0 6.4 1 9 2.7"
//       fill="#00A1E0" />
//     <text x="50" y="42" textAnchor="middle" fontFamily="Arial, sans-serif"
//       fontWeight="bold" fontSize="18" fill="#ffffff" letterSpacing="0.5">Salesforce</text>
//   </svg>
// );


// // ── Password strength ────────────────────────────────────────────────
// function getStrength(pw: string): { score: number; label: string; color: string } {
//   let score = 0;
//   if (pw.length >= 8)                    score++;
//   if (pw.length >= 12)                   score++;
//   if (/[A-Z]/.test(pw))                  score++;
//   if (/[0-9]/.test(pw))                  score++;
//   if (/[^A-Za-z0-9]/.test(pw))          score++;

//   const levels = [
//     { label: "",          color: "transparent" },
//     { label: "Weak",      color: "#E53E3E" },
//     { label: "Fair",      color: "#ED8936" },
//     { label: "Good",      color: "#ECC94B" },
//     { label: "Strong",    color: "#48BB78" },
//     { label: "Very Strong", color: "#38A169" },
//   ];
//   return { score, ...levels[score] };
// }

// // ── Validation ───────────────────────────────────────────────────────
// function validate(fields: {
//   name: string; email: string; password: string; confirm: string;
// }): Record<string, string> {
//   const e: Record<string, string> = {};
//   if (!fields.name.trim())                                   e.name     = "Full name is required.";
//   if (!fields.email)                                         e.email    = "Email is required.";
//   else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(fields.email)) e.email   = "Enter a valid email.";
//   if (!fields.password)                                      e.password = "Password is required.";
//   else if (fields.password.length < 8)                       e.password = "At least 8 characters required.";
//   if (!fields.confirm)                                       e.confirm  = "Please confirm your password.";
//   else if (fields.confirm !== fields.password)               e.confirm  = "Passwords do not match.";
//   return e;
// }

// // ── Component ────────────────────────────────────────────────────────
// export default function RegisterPage() {
//   const router = useRouter();

//   const [name,       setName]      = useState("");
//   const [email,      setEmail]     = useState("");
//   // NOTE: "admin" is intentionally NOT selectable here — letting anyone
//   // pick "admin" at signup is a security hole. Admin accounts should be
//   // promoted manually (e.g. directly in MongoDB), never self-assigned.
//   const [role, setRole] = useState<"user" | "recruiter">("user");
//   const [password,   setPassword]  = useState("");
//   const [confirm,    setConfirm]   = useState("");
//   const [showPass,   setShowPass]  = useState(false);
//   const [showConf,   setShowConf]  = useState(false);
//   const [errors,     setErrors]    = useState<Record<string, string>>({});
//   const [serverErr,  setServerErr] = useState("");
//   const [loading,    setLoading]   = useState(false);
//   const [touched,    setTouched]   = useState<Record<string, boolean>>({});
//   const [success,    setSuccess]   = useState(false);

//   const [step, setStep] = useState<"form" | "otp">("form");
//   const [otp, setOtp] = useState("");
//   const [otpError, setOtpError] = useState("");
//   const [resending, setResending] = useState(false);
//   const [resendMsg, setResendMsg] = useState("");

//   const strength = getStrength(password);

//   const handleBlur = (field: string) =>
//     setTouched((prev) => ({ ...prev, [field]: true }));

//   const clearError = (field: string) =>
//     setErrors((prev) => ({ ...prev, [field]: "" }));

//   // ── Step 1: create account, send OTP. Nothing is stored in
//   // localStorage and no redirect happens here — the account only
//   // becomes usable once the OTP is verified below.
//   const handleSubmit = async (e: FormEvent) => {
//     e.preventDefault();
//     setServerErr("");
//     setTouched({ name: true, email: true, password: true, confirm: true });

//     const fieldErrors = validate({ name, email, password, confirm });
//     setErrors(fieldErrors);
//     if (Object.keys(fieldErrors).length > 0) return;

//     setLoading(true);
//     try {
//       const res = await fetch(`${API}/api/auth/register`, {
//         method:      "POST",
//         headers:     { "Content-Type": "application/json" },
//         credentials: "include",
//         body:        JSON.stringify({ name, email, password, role }),
//       });

//       const data = await res.json();

//       if (!res.ok) {
//         setServerErr(data.message ?? "Registration failed. Please try again.");
//         return;
//       }

//       // Registration only queues the OTP email at this point — the
//       // backend should NOT return a usable session token yet.
//       setStep("otp");
//     } catch {
//       setServerErr("Network error. Please check your connection.");
//     } finally {
//       setLoading(false);
//     }
//   };

//   // ── Step 2: verify the code. Only on success do we get a real
//   // session token, which is when we store it and redirect.
//   const handleVerifyOtp = async (e: FormEvent) => {
//     e.preventDefault();
//     setOtpError("");
//     if (otp.length !== 6) { setOtpError("Enter the 6-digit code."); return; }
//     setLoading(true);
//     try {
//       const res = await fetch(`${API}/api/auth/verify-otp`, {
//         method: "POST",
//         headers: { "Content-Type": "application/json" },
//         credentials: "include",
//         body: JSON.stringify({ email, otp }),
//       });
//       const data = await res.json();
//       if (!res.ok) { setOtpError(data.message ?? "Verification failed."); return; }

//       localStorage.setItem("tc_token", data.token);
//       localStorage.setItem("tc_user", JSON.stringify(data.user));
//       setSuccess(true);
//       setTimeout(() => router.push("/"), 1500);
//     } catch {
//       setOtpError("Network error.");
//     } finally {
//       setLoading(false);
//     }
//   };

//   const handleResendOtp = async () => {
//     setResending(true);
//     setResendMsg("");
//     try {
//       const res = await fetch(`${API}/api/auth/resend-otp`, {
//         method: "POST",
//         headers: { "Content-Type": "application/json" },
//         body: JSON.stringify({ email }),
//       });
//       setResendMsg(res.ok ? "New code sent." : "Could not resend right now.");
//     } catch {
//       setResendMsg("Network error while resending.");
//     } finally {
//       setResending(false);
//     }
//   };

//   if (step === "otp" && !success) {
//     return (
//       <div className="auth-page auth-page--center">
//         <div className="auth-success" style={{ maxWidth: 360 }}>
//           <div className="navbar__modal-icon" style={{ margin: "0 auto" }}>
//             <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"
//               strokeLinecap="round" strokeLinejoin="round" style={{ width: 26, height: 26 }}>
//               <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
//               <polyline points="22,6 12,13 2,6" />
//             </svg>
//           </div>
//           <h2 className="auth-success__title">Check your email</h2>
//           <p className="auth-success__sub">
//             We sent a 6-digit code to <strong>{email}</strong>. It expires in 10 minutes.
//           </p>
//           <form onSubmit={handleVerifyOtp} style={{ width: "100%", marginTop: "1rem" }}>
//             <input
//               type="text"
//               inputMode="numeric"
//               maxLength={6}
//               className="auth-input"
//               placeholder="000000"
//               value={otp}
//               onChange={(e) => setOtp(e.target.value.replace(/\D/g, ""))}
//               style={{ textAlign: "center", fontSize: "1.5rem", letterSpacing: "0.5rem" }}
//             />
//             {otpError && <p className="auth-field-error" style={{ marginTop: "0.5rem" }}>{otpError}</p>}
//             <button type="submit" className="auth-submit" disabled={loading} style={{ marginTop: "1rem" }}>
//               {loading ? "Verifying…" : "Verify & Continue"}
//             </button>
//           </form>
//           <button
//             className="auth-switch__link"
//             style={{ background: "none", border: "none", marginTop: "1rem", cursor: "pointer" }}
//             onClick={handleResendOtp}
//             disabled={resending}
//           >
//             {resending ? "Sending…" : "Resend code"}
//           </button>
//           {resendMsg && <p className="auth-hint" style={{ marginTop: "0.5rem" }}>{resendMsg}</p>}
//         </div>
//       </div>
//     );
//   }

//   // Success state
//   if (success) {
//     return (
//       <div className="auth-page auth-page--center">
//         <div className="auth-success">
//           <div className="auth-success__icon" aria-hidden="true">✓</div>
//           <h2 className="auth-success__title">Account verified!</h2>
//           <p className="auth-success__sub">Redirecting you to the home page…</p>
//         </div>
//       </div>
//     );
//   }

//   return (
//     <div className="auth-page">
//       {/* Left panel */}
//       <div className="auth-panel auth-panel--left" aria-hidden="true">
//         <div className="auth-panel__inner">
//           <SfIcon />
//           <h2 className="auth-panel__title">TalentCloud</h2>
//           <p className="auth-panel__subtitle">
//             Join thousands of Salesforce professionals finding their next role.
//           </p>
//           <ul className="auth-panel__perks">
//             {[
//               "Free to join — always",
//               "Get personalised job alerts",
//               "One-click save jobs",
//               "Track your applications",
//               "Connect with top employers",
//             ].map((perk) => (
//               <li key={perk} className="auth-panel__perk">
//                 <span className="auth-panel__perk-dot" aria-hidden="true">✓</span>
//                 {perk}
//               </li>
//             ))}
//           </ul>
//         </div>
//       </div>

//       {/* Right panel — form */}
//       <div className="auth-panel auth-panel--right">
//         <div className="auth-form-wrap">
//           {/* Mobile logo */}
//           <div className="auth-mobile-logo">
//             <SfIcon />
//             <span>TalentCloud</span>
//           </div>

//           <h1 className="auth-form__title">Create your account</h1>
//           <p className="auth-form__sub">Free forever. No credit card needed.</p>

//           {/* Server error */}
//           {serverErr && (
//             <div className="auth-alert auth-alert--error" role="alert">
//               <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"
//                 strokeLinecap="round" strokeLinejoin="round" className="auth-alert__icon" aria-hidden="true">
//                 <circle cx="12" cy="12" r="10" />
//                 <line x1="12" y1="8"  x2="12"    y2="12" />
//                 <line x1="12" y1="16" x2="12.01" y2="16" />
//               </svg>
//               {serverErr}
//             </div>
//           )}

//           <form onSubmit={handleSubmit} className="auth-form" noValidate>
//             {/* Full name */}
//             <div className="auth-field">
//               <label className="auth-label" htmlFor="name">Full name</label>
//               <input
//                 id="name"
//                 type="text"
//                 autoComplete="name"
//                 className={`auth-input ${touched.name && errors.name ? "auth-input--error" : ""}`}
//                 value={name}
//                 onChange={(e) => { setName(e.target.value); clearError("name"); }}
//                 onBlur={() => handleBlur("name")}
//                 placeholder="Jane Smith"
//                 aria-describedby={errors.name ? "name-err" : undefined}
//               />
//               {touched.name && errors.name && (
//                 <span id="name-err" className="auth-field-error" role="alert">{errors.name}</span>
//               )}
//             </div>

//             {/* Email */}
//             <div className="auth-field">
//               <label className="auth-label" htmlFor="email">Email address</label>
//               <input
//                 id="email"
//                 type="email"
//                 autoComplete="email"
//                 className={`auth-input ${touched.email && errors.email ? "auth-input--error" : ""}`}
//                 value={email}
//                 onChange={(e) => { setEmail(e.target.value); clearError("email"); }}
//                 onBlur={() => handleBlur("email")}
//                 placeholder="you@example.com"
//                 aria-describedby={errors.email ? "email-err" : undefined}
//               />
//               {touched.email && errors.email && (
//                 <span id="email-err" className="auth-field-error" role="alert">{errors.email}</span>
//               )}
//             </div>

//             {/* Role — job seeker vs recruiter only. Admin is never
//                 self-selectable at signup. */}
//             <div className="auth-field">
//               <label className="auth-label">I am registering as</label>
//               <div style={{ display: "flex", gap: "0.75rem" }}>
//                 <label
//                   className="jobs-sidebar__check"
//                   style={{
//                     flex: 1,
//                     border: role === "user" ? "1.5px solid var(--color-sf-blue)" : "1.5px solid #D8E6F0",
//                     borderRadius: 8,
//                     padding: "0.625rem",
//                   }}
//                 >
//                   <input type="radio" name="role" checked={role === "user"} onChange={() => setRole("user")} />
//                   Job Seeker
//                 </label>
//                 <label
//                   className="jobs-sidebar__check"
//                   style={{
//                     flex: 1,
//                     border: role === "recruiter" ? "1.5px solid var(--color-sf-blue)" : "1.5px solid #D8E6F0",
//                     borderRadius: 8,
//                     padding: "0.625rem",
//                   }}
//                 >
//                   <input type="radio" name="role" checked={role === "recruiter"} onChange={() => setRole("recruiter")} />
//                   Recruiter
//                 </label>
//               </div>
//             </div>

//             {/* Password */}
//             <div className="auth-field">
//               <label className="auth-label" htmlFor="password">Password</label>
//               <div className="auth-input-wrap">
//                 <input
//                   id="password"
//                   type={showPass ? "text" : "password"}
//                   autoComplete="new-password"
//                   className={`auth-input auth-input--has-icon ${touched.password && errors.password ? "auth-input--error" : ""}`}
//                   value={password}
//                   onChange={(e) => { setPassword(e.target.value); clearError("password"); }}
//                   onBlur={() => handleBlur("password")}
//                   placeholder="Min. 8 characters"
//                   aria-describedby={errors.password ? "pass-err" : "pass-strength"}
//                 />
//                 <button type="button" className="auth__eye-btn"
//                   onClick={() => setShowPass((p) => !p)}
//                   aria-label={showPass ? "Hide password" : "Show password"}>
//                   <EyeIcon off={showPass} />
//                 </button>
//               </div>

//               {/* Strength meter */}
//               {password && (
//                 <div className="auth-strength" id="pass-strength" aria-live="polite">
//                   <div className="auth-strength__bars">
//                     {[1, 2, 3, 4, 5].map((i) => (
//                       <div
//                         key={i}
//                         className="auth-strength__bar"
//                         style={{ background: i <= strength.score ? strength.color : "#E2E8F0" }}
//                       />
//                     ))}
//                   </div>
//                   <span className="auth-strength__label" style={{ color: strength.color }}>
//                     {strength.label}
//                   </span>
//                 </div>
//               )}

//               {touched.password && errors.password && (
//                 <span id="pass-err" className="auth-field-error" role="alert">{errors.password}</span>
//               )}
//             </div>

//             {/* Confirm password */}
//             <div className="auth-field">
//               <label className="auth-label" htmlFor="confirm">Confirm password</label>
//               <div className="auth-input-wrap">
//                 <input
//                   id="confirm"
//                   type={showConf ? "text" : "password"}
//                   autoComplete="new-password"
//                   className={`auth-input auth-input--has-icon ${touched.confirm && errors.confirm ? "auth-input--error" : ""}`}
//                   value={confirm}
//                   onChange={(e) => { setConfirm(e.target.value); clearError("confirm"); }}
//                   onBlur={() => handleBlur("confirm")}
//                   placeholder="Re-enter your password"
//                   aria-describedby={errors.confirm ? "conf-err" : undefined}
//                 />
//                 <button type="button" className="auth__eye-btn"
//                   onClick={() => setShowConf((p) => !p)}
//                   aria-label={showConf ? "Hide password" : "Show password"}>
//                   <EyeIcon off={showConf} />
//                 </button>
//               </div>
//               {touched.confirm && errors.confirm && (
//                 <span id="conf-err" className="auth-field-error" role="alert">{errors.confirm}</span>
//               )}
//             </div>

//             {/* Terms notice */}
//             <p className="auth-terms">
//               By creating an account you agree to our{" "}
//               <Link href="/terms" className="auth-terms__link">Terms of Service</Link>
//               {" "}and{" "}
//               <Link href="/privacy" className="auth-terms__link">Privacy Policy</Link>.
//             </p>

//             {/* Submit */}
//             <button type="submit" className="auth-submit" disabled={loading} aria-busy={loading}>
//               {loading ? <span className="auth-spinner" aria-hidden="true" /> : null}
//               {loading ? "Sending verification code…" : "Create account"}
//             </button>
//           </form>

//           <div className="auth-divider"><span>or</span></div>

//           <p className="auth-switch">
//             Already have an account?{" "}
//             <Link href="/login" className="auth-switch__link">Sign in</Link>
//           </p>
//         </div>
//       </div>
//     </div>
//   );
// }