'use client'
import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { getValidToken } from "@/lib/api";

const API = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000";

interface User { id: string; name: string; email: string; role: string; }

const F = ({ label, id, value, onChange, placeholder = "", type = "text" }: any) => (
  <div className="feedback__field">
    <label className="feedback__label" htmlFor={id}>{label}</label>
    <input id={id} type={type} className="feedback__input" value={value ?? ""} onChange={e => onChange(e.target.value)} placeholder={placeholder} />
  </div>
);

const S = ({ label, id, value, onChange, children }: any) => (
  <div className="feedback__field">
    <label className="feedback__label" htmlFor={id}>{label}</label>
    <select id={id} className="feedback__select" value={value ?? ""} onChange={e => onChange(e.target.value)}>{children}</select>
  </div>
);

export default function EditJobPage() {
  const params = useParams();
  const router = useRouter();
  const jobId  = params?.id as string;

  const [user,     setUser]     = useState<User | null>(null);
  const [loading,  setLoading]  = useState(true);
  const [saving,   setSaving]   = useState(false);
  const [error,    setError]    = useState("");
  const [notFound, setNotFound] = useState(false);
  const [forbidden, setForbidden] = useState(false);

  const [form, setForm] = useState({
    title: "", description: "", location: "", country: "",
    workMode: "Hybrid", experienceLevel: "Mid", roleCategory: "",
    employmentType: "Full-time", applyUrl: "", skills: "",
    salaryMin: "", salaryMax: "", currency: "INR",
  });

  const set = (k: string, v: string) => setForm(p => ({ ...p, [k]: v }));

  // Auth check
  useEffect(() => {
    try {
      const raw = localStorage.getItem("tc_user");
      if (!raw) { router.push("/login"); return; }
      setUser(JSON.parse(raw));
    } catch { router.push("/login"); }
  }, [router]);

  // Fetch the job and pre-fill the form
  useEffect(() => {
    if (!jobId || !user) return;
    (async () => {
      setLoading(true);
      try {
        const token = await getValidToken();
        const res = await fetch(`${API}/api/jobs/id/${jobId}`, {
          headers: token ? { Authorization: `Bearer ${token}` } : {},
        });
        const data = await res.json();

        if (res.status === 404) { setNotFound(true); return; }
        if (!res.ok) throw new Error(data.message ?? "Failed to load job.");

        const job = data.data;

        // Ownership check on the frontend too — belt and suspenders
        const isOwner = job.postedBy === user.id;
        const isAdmin = user.role === "admin";
        if (!isOwner && !isAdmin) { setForbidden(true); return; }

        setForm({
          title: job.title || "",
          description: job.description || "",
          location: job.location || "",
          country: job.country || "",
          workMode: job.workMode || "Hybrid",
          experienceLevel: job.experienceLevel || "Mid",
          roleCategory: job.roleCategory || "",
          employmentType: job.employmentType || "Full-time",
          applyUrl: job.applyUrl || "",
          skills: (job.skills || []).join(", "),
          salaryMin: job.salary?.min?.toString() || "",
          salaryMax: job.salary?.max?.toString() || "",
          currency: job.salary?.currency || "INR",
        });
      } catch (e: any) {
        setError(e.message ?? "Failed to load job.");
      } finally {
        setLoading(false);
      }
    })();
  }, [jobId, user]);

  const handleSave = async () => {
    if (!form.title || !form.description || !form.applyUrl) {
      setError("Title, description, and apply URL are required.");
      return;
    }
    setSaving(true); setError("");

    const token = await getValidToken();
    if (!token) { router.push("/login"); return; }

    try {
      const res = await fetch(`${API}/api/jobs/${jobId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({
          ...form,
          skills: form.skills.split(",").map(s => s.trim()).filter(Boolean),
          salary: form.salaryMin ? { min: Number(form.salaryMin), max: Number(form.salaryMax), currency: form.currency } : undefined,
        }),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.message ?? "Failed to update job."); return; }

      router.push(`/jobs/${data.data.slug}`);
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  if (loading) return (
    <>
      <Navbar />
      <div className="ai-page"><div className="ai-container ai-body">
        <div className="jobs-skeleton" style={{ height: 500, borderRadius: 14 }} />
      </div></div>
      <Footer />
    </>
  );

  if (notFound) return (
    <>
      <Navbar />
      <div className="ai-page"><div className="ai-container ai-body">
        <div className="jobs-empty"><div className="jobs-empty__icon">😕</div><h3>Job not found</h3>
          <button className="btn btn--primary" onClick={() => router.push("/jobs")}>Back to Jobs</button>
        </div>
      </div></div>
      <Footer />
    </>
  );

  if (forbidden) return (
    <>
      <Navbar />
      <div className="ai-page"><div className="ai-container ai-body">
        <div className="jobs-empty"><div className="jobs-empty__icon">🔒</div><h3>Not your job posting</h3>
          <p>You can only edit jobs that you posted yourself.</p>
          <button className="btn btn--primary" onClick={() => router.push("/jobs")}>Back to Jobs</button>
        </div>
      </div></div>
      <Footer />
    </>
  );

  return (
    <>
      <Navbar />
      <div className="ai-page">
        <div className="ai-hero">
          <div className="ai-container">
            <h1 className="ai-hero__title">Edit Job Posting</h1>
            <p className="ai-hero__sub">Update the details below and save your changes.</p>
          </div>
        </div>

        <div className="ai-container ai-body">
          <div className="ai-card">
            {error && <div className="auth-alert auth-alert--error" style={{ marginBottom: "1rem" }}>{error}</div>}

            <div className="ai-section">
              <h3 className="ai-section__title">Basic Information</h3>
              <div className="pj-grid">
                <F label="Job Title *"     id="ej-title"  value={form.title}    onChange={(v: string) => set("title", v)} />
                <F label="Role Category"   id="ej-role"   value={form.roleCategory} onChange={(v: string) => set("roleCategory", v)} />
                <F label="Location"        id="ej-loc"    value={form.location} onChange={(v: string) => set("location", v)} />
                <F label="Country"         id="ej-country" value={form.country} onChange={(v: string) => set("country", v)} />
              </div>
            </div>

            <div className="ai-section">
              <h3 className="ai-section__title">Job Details</h3>
              <div className="pj-grid">
                <S label="Work Mode"       id="ej-wm"  value={form.workMode} onChange={(v: string) => set("workMode", v)}>
                  {["Remote", "Hybrid", "Onsite"].map(o => <option key={o}>{o}</option>)}
                </S>
                <S label="Experience"      id="ej-exp" value={form.experienceLevel} onChange={(v: string) => set("experienceLevel", v)}>
                  {["Intern", "Fresher", "Associate", "Mid", "Senior", "Lead"].map(o => <option key={o}>{o}</option>)}
                </S>
                <S label="Employment Type" id="ej-et"  value={form.employmentType} onChange={(v: string) => set("employmentType", v)}>
                  {["Full-time", "Part-time", "Contract", "Internship"].map(o => <option key={o}>{o}</option>)}
                </S>
                <S label="Currency"        id="ej-cur" value={form.currency} onChange={(v: string) => set("currency", v)}>
                  {["INR", "USD", "GBP", "EUR"].map(o => <option key={o}>{o}</option>)}
                </S>
                <F label="Min Salary" id="ej-smin" value={form.salaryMin} onChange={(v: string) => set("salaryMin", v)} type="number" />
                <F label="Max Salary" id="ej-smax" value={form.salaryMax} onChange={(v: string) => set("salaryMax", v)} type="number" />
              </div>
              <F label="Apply URL *" id="ej-url" value={form.applyUrl} onChange={(v: string) => set("applyUrl", v)} />
            </div>

            <div className="ai-section">
              <h3 className="ai-section__title">Skills & Description</h3>
              <F label="Skills (comma separated)" id="ej-skills" value={form.skills} onChange={(v: string) => set("skills", v)} />
              <div style={{ marginTop: "1rem" }}>
                <label className="feedback__label" htmlFor="ej-desc">Description *</label>
                <textarea id="ej-desc" className="feedback__textarea" rows={8} value={form.description} onChange={e => set("description", e.target.value)} />
              </div>
            </div>

            <div className="ai-publish-bar">
              <button className="btn btn--ghost btn--lg" onClick={() => router.back()}>Cancel</button>
              <button className="ai-publish-btn" onClick={handleSave} disabled={saving}>
                {saving ? "Saving…" : "Save Changes"}
              </button>
            </div>
          </div>
        </div>
      </div>
      <Footer />
    </>
  );
}