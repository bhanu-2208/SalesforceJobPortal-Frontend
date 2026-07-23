'use client'
// app/register/page.tsx

import { useState, FormEvent } from "react";
import { useRouter }           from "next/navigation";
import Link                    from "next/link";

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
      {/* Left panel */}
      <div className="auth-panel auth-panel--left" aria-hidden="true">
        <div className="auth-panel__inner">
          <SfIcon />
          <h2 className="auth-panel__title">TalentCloud</h2>
          <p className="auth-panel__subtitle">
            Join thousands of Salesforce professionals finding their next role.
          </p>
          <ul className="auth-panel__perks">
            {[
              "Free to join — always",
              "Get personalised job alerts",
              "One-click save jobs",
              "Track your applications",
              "Connect with top employers",
            ].map((perk) => (
              <li key={perk} className="auth-panel__perk">
                <span className="auth-panel__perk-dot" aria-hidden="true">✓</span>
                {perk}
              </li>
            ))}
          </ul>
        </div>
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