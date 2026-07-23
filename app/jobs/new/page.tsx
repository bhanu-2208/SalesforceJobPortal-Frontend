'use client'
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { getValidToken } from "@/lib/api";

const API = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000";

// ── Types ─────────────────────────────────────────────────────────────
interface GeneratedJob {
  title:            string;
  companyName?:     string | null;
  companyLogo?:     string | null;
  location?:        string | null;
  country?:         string | null;
  workMode?:        "Remote" | "Hybrid" | "Onsite" | null;
  employmentType?:  "Full-time" | "Part-time" | "Contract" | "Internship" | null;
  experienceLevel?: | "0 Years"
  | "1-2 Years"
  | "2-6 Years"
  | "6-8 Years"
  | "8-12 Years"
  | "12+ Years"| null;
  roleCategory?:    string | null;
  salaryMin?:       number | null;
  salaryMax?:       number | null;
  currency?:        string | null;
  skills:           string[];
  certifications:   string[];
  responsibilities: string[];
  requirements:     string[];
  benefits:         string[];
  description:      string;
  applyUrl?:        string | null;
}

// ── Reusable field components ─────────────────────────────────────────
const Field = ({ label, id, value, onChange, placeholder = "", type = "text", required = false }: any) => (
  <div className="feedback__field">
    <label className="feedback__label" htmlFor={id}>
      {label}{required && <span style={{ color: "#00A1E0" }}> *</span>}
    </label>
    <input
      id={id} type={type}
      className="feedback__input"
      value={value ?? ""}
      onChange={e => onChange(e.target.value)}
      placeholder={placeholder}
    />
  </div>
);

const Select = ({ label, id, value, onChange, options }: any) => (
  <div className="feedback__field">
    <label className="feedback__label" htmlFor={id}>{label}</label>
    <select id={id} className="feedback__select" value={value ?? ""} onChange={e => onChange(e.target.value)}>
      <option value="">— Select —</option>
      {options.map((o: string) => <option key={o} value={o}>{o}</option>)}
    </select>
  </div>
);

const TextArea = ({ label, id, value, onChange, placeholder = "", rows = 4 }: any) => (
  <div className="feedback__field">
    <label className="feedback__label" htmlFor={id}>{label}</label>
    <textarea
      id={id} rows={rows}
      className="feedback__textarea"
      value={value ?? ""}
      onChange={e => onChange(e.target.value)}
      placeholder={placeholder}
    />
  </div>
);

// ── Array field (skills, responsibilities etc.) ───────────────────────
function ArrayField({ label, items, onChange }: { label: string; items: string[]; onChange: (v: string[]) => void }) {
  const [input, setInput] = useState("");

  const add = () => {
    const trimmed = input.trim();
    if (trimmed && !items.includes(trimmed)) {
      onChange([...items, trimmed]);
      setInput("");
    }
  };

  const remove = (i: number) => onChange(items.filter((_, idx) => idx !== i));

  return (
    <div className="feedback__field">
      <label className="feedback__label">{label}</label>
      <div className="ai-array-field">
        <div className="ai-array-field__tags">
          {items.map((item, i) => (
            <span key={i} className="ai-array-tag">
              {item}
              <button type="button" onClick={() => remove(i)} aria-label={`Remove ${item}`}>✕</button>
            </span>
          ))}
          {items.length === 0 && <span className="ai-array-field__empty">None added yet</span>}
        </div>
        <div className="ai-array-field__input">
          <input
            type="text"
            className="feedback__input"
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={e => { if (e.key === "Enter") { e.preventDefault(); add(); } }}
            placeholder={`Add ${label.toLowerCase()} and press Enter`}
          />
          <button type="button" className="btn btn--ghost btn--sm" onClick={add}>Add</button>
        </div>
      </div>
    </div>
  );
}


// ── Main Page ─────────────────────────────────────────────────────────
export default function AdminNewJobPage() {
  const router = useRouter();

  // Auth
  const [user,  setUser]  = useState<any>(null);
  const [token, setToken] = useState("");

  // Step state
  const [step, setStep] = useState<"paste" | "review" | "success">("paste");
  const currentStep: "paste" | "review" | "success" = step;   // ← add this line

  // JD input
  const [jd,          setJd]          = useState("");
  const [generating,  setGenerating]  = useState(false);
  const [genError,    setGenError]    = useState("");

  // Generated + editable form
  const [form, setForm] = useState<GeneratedJob>({
    title: "", companyName: "", companyLogo: "", location: "", country: "",
    workMode: null, employmentType: null, experienceLevel: null,
    roleCategory: "", salaryMin: null, salaryMax: null, currency: "INR",
    skills: [], certifications: [], responsibilities: [], requirements: [], benefits: [],
    description: "", applyUrl: "",
  });

  const [publishing,  setPublishing]  = useState(false);
  const [publishError, setPublishError] = useState("");

  // Rehydrate
  useEffect(() => {
    (async () => {
      try {
        const raw = localStorage.getItem("tc_user");
        if (raw) setUser(JSON.parse(raw));
        const t = await getValidToken();
        if (!t) { router.push("/login"); return; }
        setToken(t);
      } catch { router.push("/login"); }
    })();
  }, [router]);

  const setField = (key: keyof GeneratedJob, value: any) =>
    setForm(p => ({ ...p, [key]: value }));

  // ── Generate ──────────────────────────────────────────────────────
  const handleGenerate = async () => {
    if (jd.trim().length < 50) {
      setGenError("Please paste a longer job description (at least 50 characters)."); return;
    }
    setGenerating(true); setGenError("");
    try {
      const res  = await fetch(`${API}/api/jobs/generate`, {
        method:  "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body:    JSON.stringify({ jobDescription: jd }),
      });
      const data = await res.json();
      if (!res.ok) { setGenError(data.message ?? "AI generation failed."); return; }

      // Merge generated fields into form
      setForm({
        title:            data.job.title            ?? "",
        companyName:      data.job.companyName       ?? "",
        companyLogo:      data.job.companyLogo       ?? "",
        location:         data.job.location          ?? "",
        country:          data.job.country           ?? "",
        workMode:         data.job.workMode          ?? null,
        employmentType:   data.job.employmentType    ?? null,
        experienceLevel:  data.job.experienceLevel   ?? null,
        roleCategory:     data.job.roleCategory      ?? "",
        salaryMin:        data.job.salaryMin         ?? null,
        salaryMax:        data.job.salaryMax         ?? null,
        currency:         data.job.currency          ?? "INR",
        skills:           data.job.skills            ?? [],
        certifications:   data.job.certifications    ?? [],
        responsibilities: data.job.responsibilities  ?? [],
        requirements:     data.job.requirements      ?? [],
        benefits:         data.job.benefits          ?? [],
        description:      data.job.description       ?? "",
        applyUrl:         data.job.applyUrl          ?? "",
      });
      setStep("review");
    } catch { setGenError("Network error. Make sure your backend is running."); }
    finally  { setGenerating(false); }
  };

  // ── Publish ───────────────────────────────────────────────────────
  const handlePublish = async () => {
    if (!form.title || !form.description || !form.applyUrl) {
      setPublishError("Title, description, and apply URL are required."); return;
    }
    setPublishing(true); setPublishError("");

    // Build description from structured fields if description is short
    const fullDescription = [
      form.description,
      form.responsibilities.length ? `\nResponsibilities:\n${form.responsibilities.map(r => `• ${r}`).join("\n")}` : "",
      form.requirements.length     ? `\nRequirements:\n${form.requirements.map(r => `• ${r}`).join("\n")}` : "",
      form.benefits.length         ? `\nBenefits:\n${form.benefits.map(b => `• ${b}`).join("\n")}` : "",
      form.certifications.length   ? `\nCertifications: ${form.certifications.join(", ")}` : "",
    ].filter(Boolean).join("\n");

    try {
      const validToken = await getValidToken();
      if (!validToken) { router.push("/login"); return; }

      const res  = await fetch(`${API}/api/jobs`, {
        method:  "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${validToken}` },
        body: JSON.stringify({
          title:          form.title,
          description:    fullDescription,
          companyName:    form.companyName  || undefined,
          companyLogo:    form.companyLogo  || undefined,
          location:       form.location     || undefined,
          country:        form.country      || undefined,
          workMode:       form.workMode     || undefined,
          employmentType: form.employmentType || undefined,
          experienceLevel: form.experienceLevel || undefined,
          roleCategory:   form.roleCategory || undefined,
          skills:         form.skills,
          applyUrl:       form.applyUrl,
          salary: (form.salaryMin || form.salaryMax) ? {
            min:      form.salaryMin      ?? undefined,
            max:      form.salaryMax      ?? undefined,
            currency: form.currency       ?? "INR",
          } : undefined,
        }),
      });
      const data = await res.json();
      if (!res.ok) { setPublishError(data.message ?? "Failed to publish job."); return; }
      setStep("success");
    } catch { setPublishError("Network error."); }
    finally  { setPublishing(false); }
  };

  // ── Success screen ────────────────────────────────────────────────
  if (step === "success") return (
    <>
      <Navbar />
      <div className="ai-page">
        <div className="ai-container">
          <div className="feedback__success" style={{ paddingTop: "5rem" }}>
            <div className="feedback__success-icon">✓</div>
            <h2 className="feedback__success-title">Job Published!</h2>
            <p className="feedback__success-sub">
              The job has been saved to your database and is now live on the jobs page.
            </p>
            <div style={{ display:"flex", gap:"0.75rem", flexWrap:"wrap", justifyContent:"center", marginTop:"0.5rem" }}>
              <button className="btn btn--primary" onClick={() => { setStep("paste"); setJd(""); }}>
                Parse Another JD
              </button>
              <a href="/jobs" className="btn btn--ghost">View Jobs →</a>
            </div>
          </div>
        </div>
      </div>
      <Footer />
    </>
  );

  return (
    <>
      <Navbar />
      <div className="ai-page">

        {/* ── Hero ── */}
        <div className="ai-hero">
          <div className="ai-container">
            <div className="ai-hero__badge">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"
                strokeLinecap="round" strokeLinejoin="round" style={{width:14,height:14}} aria-hidden="true">
                <path d="M12 2a10 10 0 1 0 10 10A10 10 0 0 0 12 2z"/>
                <path d="M12 8v4l3 3"/>
              </svg>
              AI-Powered Job Parser
            </div>
            <h1 className="ai-hero__title">
              {step === "paste" ? "Paste a Job Description" : "Review & Edit Extracted Fields"}
            </h1>
            <p className="ai-hero__sub">
              {step === "paste"
                ? "Our AI reads any Salesforce JD and extracts all structured fields automatically."
                : "Review what the AI extracted. Edit anything that needs correction, then publish."}
            </p>

            {/* Step indicators */}
            <div className="ai-steps">
              {[
                { key:"paste",   label:"1. Paste JD" },
                { key:"review",  label:"2. Review"   },
                { key:"success", label:"3. Publish"  },
              ].map(s => (
                <div key={s.key} className={`ai-step ${currentStep === s.key ? "ai-step--active" : ""} ${currentStep === "success" && s.key !== "success" ? "ai-step--done" : ""}`}>
                  {s.label}
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="ai-container ai-body">

          {/* ── STEP 1 — Paste JD ── */}
          {step === "paste" && (
            <div className="ai-card">
              <h2 className="ai-card__title">Paste Job Description</h2>
              <p className="ai-card__sub">
                Copy the full JD from any source — job boards, emails, PDFs. The more detail, the better the extraction.
              </p>

              {genError && (
                <div className="auth-alert auth-alert--error" style={{ marginBottom:"1rem" }}>
                  {genError}
                </div>
              )}

              <textarea
                className="feedback__textarea ai-jd-textarea"
                rows={14}
                value={jd}
                onChange={e => setJd(e.target.value)}
                placeholder={`Paste the full job description here...\n\nExample:\nWe are looking for an experienced Salesforce Developer to join our team at Accenture.\nLocation: Hyderabad, India | Work Mode: Hybrid\n\nResponsibilities:\n• Design and develop Apex classes and LWC components\n• Integrate Salesforce with external APIs\n...\n\nRequirements:\n• 3-5 years Salesforce development experience\n• Strong Apex, LWC, SOQL skills\n• Salesforce PD1 certification preferred`}
              />

              <div className="ai-jd-meta">
                <span className="ai-jd-meta__count">{jd.length} characters</span>
                {jd.length > 0 && jd.length < 50 && (
                  <span style={{ color:"#E53E3E", fontSize:"0.8125rem" }}>Too short — please paste a full JD</span>
                )}
              </div>

              <button
                className="ai-generate-btn"
                onClick={handleGenerate}
                disabled={generating || jd.trim().length < 50}
                aria-busy={generating}
              >
                {generating ? (
                  <>
                    <span className="auth-spinner" aria-hidden="true" />
                    Analysing JD with AI…
                  </>
                ) : (
                  <>
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"
                      strokeLinecap="round" strokeLinejoin="round" style={{width:18,height:18}}>
                      <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/>
                    </svg>
                    Generate with AI
                  </>
                )}
              </button>

              {/* Tips */}
              <div className="ai-tips">
                <p className="ai-tips__title">Tips for best results:</p>
                <ul className="ai-tips__list">
                  <li>Include the full JD — title, company, responsibilities, requirements</li>
                  <li>Salary, location, and work mode will be auto-detected if mentioned</li>
                  <li>Salesforce skills and certifications are extracted automatically</li>
                  <li>You can edit every field before publishing</li>
                </ul>
              </div>
            </div>
          )}

          {/* ── STEP 2 — Review & Edit ── */}
          {step === "review" && (
            <div className="ai-review">

              {/* Left — back button + original JD */}
              <div className="ai-review__sidebar">
                <button className="btn btn--ghost btn--sm" style={{marginBottom:"1rem"}} onClick={() => setStep("paste")}>
                  ← Back to JD
                </button>
                <div className="ai-original-jd">
                  <p className="ai-original-jd__label">Original JD</p>
                  <div className="ai-original-jd__text">{jd}</div>
                </div>
              </div>

              {/* Right — editable form */}
              <div className="ai-review__form">
                <div className="ai-card">
                  <div className="ai-card__header">
                    <h2 className="ai-card__title">Review Extracted Fields</h2>
                    <span className="ai-extracted-badge">AI Extracted</span>
                  </div>
                  <p className="ai-card__sub">Edit anything that's incorrect before publishing.</p>

                  {publishError && (
                    <div className="auth-alert auth-alert--error" style={{ marginBottom:"1rem" }}>
                      {publishError}
                    </div>
                  )}

                  {/* Basic info */}
                  <div className="ai-section">
                    <h3 className="ai-section__title">Basic Information</h3>
                    <div className="pj-grid">
                      <Field label="Job Title" id="ai-title" value={form.title} onChange={(v: string) => setField("title", v)} placeholder="e.g. Salesforce Developer" required />
                      <Field label="Company Name" id="ai-company" value={form.companyName} onChange={(v: string) => setField("companyName", v)} placeholder="e.g. Accenture" />
                      <Field label="Company Logo URL" id="ai-logo" value={form.companyLogo} onChange={(v: string) => setField("companyLogo", v)} placeholder="https://..." />
                      <Field label="Role Category" id="ai-role" value={form.roleCategory} onChange={(v: string) => setField("roleCategory", v)} placeholder="e.g. Developer" />
                      <Field label="Location" id="ai-location" value={form.location} onChange={(v: string) => setField("location", v)} placeholder="e.g. Hyderabad, India" />
                      <Field label="Country" id="ai-country" value={form.country} onChange={(v: string) => setField("country", v)} placeholder="e.g. India" />
                    </div>
                  </div>

                  {/* Job details */}
                  <div className="ai-section">
                    <h3 className="ai-section__title">Job Details</h3>
                    <div className="pj-grid">
                      <Select label="Work Mode" id="ai-wm" value={form.workMode} onChange={(v: string) => setField("workMode", v)} options={["Remote","Hybrid","Onsite"]} />
                      <Select label="Employment Type" id="ai-et" value={form.employmentType} onChange={(v: string) => setField("employmentType", v)} options={["Full-time","Part-time","Contract","Internship"]} />
                      <Select
                          label="Experience Level"
                          id="ai-exp"
                          value={form.experienceLevel}
                          onChange={(v: string) => setField("experienceLevel", v)}
                          options={[
                            "0 Years",
                            "1-2 Years",
                            "2-6 Years",
                            "6-8 Years",
                            "8-12 Years",
                            "12+ Years"
                          ]}
                        />
                      <Select label="Currency" id="ai-cur" value={form.currency} onChange={(v: string) => setField("currency", v)} options={["INR","USD","GBP","EUR"]} />
                      <Field label="Min Salary" id="ai-smin" value={form.salaryMin ?? ""} onChange={(v: string) => setField("salaryMin", v ? Number(v) : null)} type="number" placeholder="e.g. 800000" />
                      <Field label="Max Salary" id="ai-smax" value={form.salaryMax ?? ""} onChange={(v: string) => setField("salaryMax", v ? Number(v) : null)} type="number" placeholder="e.g. 1400000" />
                    </div>
                    <Field label="Apply URL" id="ai-url" value={form.applyUrl} onChange={(v: string) => setField("applyUrl", v)} placeholder="https://careers.company.com/job/123" required />
                  </div>

                  {/* Skills & certs */}
                  <div className="ai-section">
                    <h3 className="ai-section__title">Skills & Certifications</h3>
                    <ArrayField label="Skills" items={form.skills} onChange={v => setField("skills", v)} />
                    <div style={{ marginTop:"1rem" }}>
                      <ArrayField label="Certifications" items={form.certifications} onChange={v => setField("certifications", v)} />
                    </div>
                  </div>

                  {/* Description */}
                  <div className="ai-section">
                    <h3 className="ai-section__title">Description & Details</h3>
                    <TextArea label="Description" id="ai-desc" value={form.description} onChange={(v: string) => setField("description", v)} rows={5} placeholder="Role description..." />
                    <div style={{ marginTop:"1rem" }}>
                      <ArrayField label="Responsibilities" items={form.responsibilities} onChange={v => setField("responsibilities", v)} />
                    </div>
                    <div style={{ marginTop:"1rem" }}>
                      <ArrayField label="Requirements" items={form.requirements} onChange={v => setField("requirements", v)} />
                    </div>
                    <div style={{ marginTop:"1rem" }}>
                      <ArrayField label="Benefits" items={form.benefits} onChange={v => setField("benefits", v)} />
                    </div>
                  </div>

                  {/* Publish */}
                  <div className="ai-publish-bar">
                    <button className="btn btn--ghost btn--lg" onClick={() => setStep("paste")}>← Edit JD</button>
                    <button
                      className="ai-publish-btn"
                      onClick={handlePublish}
                      disabled={publishing}
                      aria-busy={publishing}
                    >
                      {publishing ? (
                        <><span className="auth-spinner" aria-hidden="true" /> Publishing…</>
                      ) : (
                        <>
                          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"
                            strokeLinecap="round" strokeLinejoin="round" style={{width:16,height:16}}>
                            <polyline points="20 6 9 17 4 12"/>
                          </svg>
                          Publish Job
                        </>
                      )}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

        </div>
      </div>
      <Footer />
    </>
  );
}