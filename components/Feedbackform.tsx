'use client'
import { useState, useEffect, FormEvent } from "react";
import { useRouter } from "next/navigation";
import { getValidToken } from "@/lib/api";

const API = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000";

interface User {
  id: string;
  name: string;
  email: string;
  role: string;
}

const ROLE_OPTIONS = [
  "Salesforce Developer",
  "Salesforce Administrator",
  "Salesforce Architect",
  "Salesforce Consultant",
  "Marketing Cloud Developer",
  "Business Analyst",
  "Other",
];

const CATEGORY_OPTIONS = [
  "General Feedback",
  "Job Listing Quality",
  "Search & Filters",
  "Website Experience",
  "Success Story",
  "Bug Report",
  "Feature Request",
];

const RATING_LABELS: Record<number, string> = {
  1: "Poor", 2: "Fair", 3: "Good", 4: "Very Good", 5: "Excellent",
};

// ── Star picker ───────────────────────────────────────────────────────
function StarPicker({
  value,
  onChange,
}: {
  value: number;
  onChange: (r: number) => void;
}) {
  const [hover, setHover] = useState(0);
  const active = hover || value;

  return (
    <div className="feedback__stars" role="group" aria-label="Rate your experience">
      {[1, 2, 3, 4, 5].map((star) => (
        <button
          key={star}
          type="button"
          className={`feedback__star-btn ${star <= active ? "feedback__star-btn--active" : ""}`}
          onClick={() => onChange(star)}
          onMouseEnter={() => setHover(star)}
          onMouseLeave={() => setHover(0)}
          aria-label={`${star} star${star > 1 ? "s" : ""} — ${RATING_LABELS[star]}`}
          aria-pressed={value === star}
        >
          <svg viewBox="0 0 24 24"
            fill={star <= active ? "currentColor" : "none"}
            stroke="currentColor" strokeWidth="1.5"
            aria-hidden="true">
            <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
          </svg>
        </button>
      ))}
      {active > 0 && (
        <span className="feedback__star-label">{RATING_LABELS[active]}</span>
      )}
    </div>
  );
}

// ── Login-required prompt (shown instead of form when logged out) ─────
function LoginPrompt({ onLogin }: { onLogin: () => void }) {
  return (
    <div className="feedback__login-prompt">
      <div className="navbar__modal-icon" aria-hidden="true" style={{ margin: "0 auto 1rem" }}>
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"
          strokeLinecap="round" strokeLinejoin="round">
          <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
          <path d="M7 11V7a5 5 0 0 1 10 0v4" />
        </svg>
      </div>
      <h3 className="feedback__login-title">Login required to share feedback</h3>
      <p className="feedback__login-sub">
        We ask you to log in so we can follow up if needed and prevent spam submissions.
      </p>
      <button className="btn btn--primary btn--lg" onClick={onLogin}>
        Go to Login
      </button>
    </div>
  );
}

export default function FeedbackForm() {
  const router = useRouter();

  const [user,  setUser]  = useState<User | null>(null);
  const [ready, setReady] = useState(false);

  const [form, setForm] = useState({
    name: "", email: "", role: "", rating: 0, category: "", message: "",
  });
  const [errors,    setErrors]    = useState<Partial<Record<keyof typeof form, string>>>({});
  const [submitted, setSubmitted] = useState(false);
  const [loading,   setLoading]   = useState(false);
  const [serverErr, setServerErr] = useState("");

  // Rehydrate user + pre-fill name/email if logged in
  useEffect(() => {
    try {
      const raw = localStorage.getItem("tc_user");
      if (raw) {
        const parsed: User = JSON.parse(raw);
        setUser(parsed);
        setForm((prev) => ({ ...prev, name: parsed.name, email: parsed.email }));
      }
    } catch { /* ignore */ }
    setReady(true);
  }, []);

  const set = (field: keyof typeof form, value: string | number) =>
    setForm((prev) => ({ ...prev, [field]: value }));

  const validate = (): boolean => {
    const e: Partial<Record<keyof typeof form, string>> = {};
    if (!form.name.trim())    e.name    = "Name is required.";
    if (!form.email.trim())   e.email   = "Email is required.";
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email))
                              e.email   = "Enter a valid email.";
    if (!form.rating)         e.rating  = "Please select a rating.";
    if (!form.message.trim()) e.message = "Message is required.";
    else if (form.message.trim().length < 20)
                              e.message = "Please write at least 20 characters.";
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setServerErr("");
    if (!validate()) return;

    const token = await getValidToken();
    if (!token) {
      setServerErr("Your session has expired. Please log in again.");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch(`${API}/api/feedback`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(form),
      });
      const data = await res.json();

      if (!res.ok) {
        setServerErr(data.message ?? "Failed to submit feedback. Please try again.");
        setLoading(false);
        return;
      }

      setLoading(false);
      setSubmitted(true);
    } catch {
      setServerErr("Network error. Please try again.");
      setLoading(false);
    }
  };

  // Avoid flash of wrong state before localStorage is checked
  if (!ready) return null;

  // ── Success state ─────────────────────────────────────────────────
  if (submitted) {
    return (
      <section className="feedback" aria-labelledby="feedback-heading">
        <div className="feedback__success">
          <div className="feedback__success-icon" aria-hidden="true">✓</div>
          <h2 className="feedback__success-title">Thank you, {form.name.split(" ")[0]}!</h2>
          <p className="feedback__success-sub">
            Your feedback means a lot to us. We read every submission and use it
            to make TalentCloud better for the entire Salesforce community.
          </p>
          <button
            className="btn btn--ghost"
            onClick={() => {
              setSubmitted(false);
              setForm({
                name: user?.name ?? "", email: user?.email ?? "",
                role: "", rating: 0, category: "", message: "",
              });
            }}
          >
            Submit another response
          </button>
        </div>
      </section>
    );
  }

  return (
    <section className="feedback" aria-labelledby="feedback-heading">
      <div className="section__header">
        <span className="section__eyebrow">We&apos;re Listening</span>
        <h2 id="feedback-heading" className="section__title">
          Share Your Experience
        </h2>
        <p className="section__subtitle">
          Got hired? Have a suggestion? Found a bug? We want to hear it all.
        </p>
      </div>

      {!user ? (
        <div className="feedback__wrap feedback__wrap--locked">
          <LoginPrompt onLogin={() => router.push("/login")} />
        </div>
      ) : (
        <div className="feedback__wrap">
          {/* Left — info panel */}
          <div className="feedback__info">
            <h3 className="feedback__info-title">Why your feedback matters</h3>
            <ul className="feedback__info-list">
              {[
                { icon: "💼", text: "Help us surface better job listings for the community" },
                { icon: "🔍", text: "Improve search and filters based on what you actually need" },
                { icon: "⭐", text: "Share your success story to inspire other job seekers" },
                { icon: "🐛", text: "Report issues so we can fix them fast" },
                { icon: "💡", text: "Suggest features you wish existed" },
              ].map((item) => (
                <li key={item.text} className="feedback__info-item">
                  <span className="feedback__info-emoji" aria-hidden="true">{item.icon}</span>
                  <span>{item.text}</span>
                </li>
              ))}
            </ul>
            <div className="feedback__info-note">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"
                strokeLinecap="round" strokeLinejoin="round"
                style={{ width: 14, height: 14, flexShrink: 0 }} aria-hidden="true">
                <circle cx="12" cy="12" r="10" />
                <line x1="12" y1="8" x2="12" y2="12" />
                <line x1="12" y1="16" x2="12.01" y2="16" />
              </svg>
              All feedback is read by our team within 48 hours.
            </div>
          </div>

          {/* Right — form */}
          <form className="feedback__form" onSubmit={handleSubmit} noValidate>

            {serverErr && (
              <div className="auth-alert auth-alert--error" role="alert">{serverErr}</div>
            )}

            {/* Name + Email */}
            <div className="feedback__row">
              <div className="feedback__field">
                <label className="feedback__label" htmlFor="fb-name">Full name <span aria-hidden="true">*</span></label>
                <input
                  id="fb-name" type="text" className={`feedback__input ${errors.name ? "feedback__input--error" : ""}`}
                  value={form.name} onChange={(e) => set("name", e.target.value)}
                  placeholder="Jane Smith" autoComplete="name"
                />
                {errors.name && <span className="feedback__error" role="alert">{errors.name}</span>}
              </div>

              <div className="feedback__field">
                <label className="feedback__label" htmlFor="fb-email">Email address <span aria-hidden="true">*</span></label>
                <input
                  id="fb-email" type="email" className={`feedback__input ${errors.email ? "feedback__input--error" : ""}`}
                  value={form.email} onChange={(e) => set("email", e.target.value)}
                  placeholder="you@example.com" autoComplete="email"
                />
                {errors.email && <span className="feedback__error" role="alert">{errors.email}</span>}
              </div>
            </div>

            {/* Role + Category */}
            <div className="feedback__row">
              <div className="feedback__field">
                <label className="feedback__label" htmlFor="fb-role">Your Salesforce role</label>
                <select id="fb-role" className="feedback__select"
                  value={form.role} onChange={(e) => set("role", e.target.value)}>
                  <option value="">Select role (optional)</option>
                  {ROLE_OPTIONS.map((r) => <option key={r} value={r}>{r}</option>)}
                </select>
              </div>

              <div className="feedback__field">
                <label className="feedback__label" htmlFor="fb-category">Feedback type</label>
                <select id="fb-category" className="feedback__select"
                  value={form.category} onChange={(e) => set("category", e.target.value)}>
                  <option value="">Select type (optional)</option>
                  {CATEGORY_OPTIONS.map((c) => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
            </div>

            {/* Star rating */}
            <div className="feedback__field">
              <label className="feedback__label">
                Overall rating <span aria-hidden="true">*</span>
              </label>
              <StarPicker
                value={form.rating}
                onChange={(r) => { set("rating", r); setErrors((p) => ({ ...p, rating: "" })); }}
              />
              {errors.rating && <span className="feedback__error" role="alert">{errors.rating}</span>}
            </div>

            {/* Message */}
            <div className="feedback__field">
              <label className="feedback__label" htmlFor="fb-message">
                Your message <span aria-hidden="true">*</span>
              </label>
              <textarea
                id="fb-message"
                className={`feedback__textarea ${errors.message ? "feedback__input--error" : ""}`}
                value={form.message}
                onChange={(e) => set("message", e.target.value)}
                placeholder="Tell us about your experience — how you found TalentCloud, what helped, what could be better, or share your success story..."
                rows={5}
              />
              <div className="feedback__char-count">
                {form.message.length} characters
                {form.message.length > 0 && form.message.length < 20 && (
                  <span style={{ color: "#E53E3E" }}> (min 20)</span>
                )}
              </div>
              {errors.message && <span className="feedback__error" role="alert">{errors.message}</span>}
            </div>

            {/* Submit */}
            <button type="submit" className="feedback__submit" disabled={loading} aria-busy={loading}>
              {loading ? (
                <><span className="auth-spinner" aria-hidden="true" /> Submitting…</>
              ) : (
                <>
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"
                    strokeLinecap="round" strokeLinejoin="round"
                    style={{ width: 16, height: 16 }} aria-hidden="true">
                    <line x1="22" y1="2" x2="11" y2="13" />
                    <polygon points="22 2 15 22 11 13 2 9 22 2" />
                  </svg>
                  Send Feedback
                </>
              )}
            </button>
          </form>
        </div>
      )}
    </section>
  );
}