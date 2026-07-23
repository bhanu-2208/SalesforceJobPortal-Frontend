'use client'
// app/login/page.tsx

import { useState, FormEvent } from "react";
import { useRouter }           from "next/navigation";
import Link                    from "next/link";

const API = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000";

// ── Eye icon (show/hide password) ───────────────────────────────────
const EyeIcon     = ({ off }: { off?: boolean }) => (
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

  const [email,      setEmail]      = useState("");
  const [password,   setPassword]   = useState("");
  const [showPass,   setShowPass]   = useState(false);
  const [errors,     setErrors]     = useState<Record<string, string>>({});
  const [serverErr,  setServerErr]  = useState("");
  const [loading,    setLoading]    = useState(false);
  const [touched,    setTouched]    = useState<Record<string, boolean>>({});

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
      {/* Left panel — branding */}
      <div className="auth-panel auth-panel--left" aria-hidden="true">
        <div className="auth-panel__inner">
          <SfIcon />
          <h2 className="auth-panel__title">TalentCloud</h2>
          <p className="auth-panel__subtitle">
            The #1 job board for Salesforce professionals.
          </p>
          <ul className="auth-panel__perks">
            {[
              "500+ live Salesforce jobs",
              "Developers, Admins, Architects",
              "Remote & hybrid roles worldwide",
              "Save and track your applications",
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