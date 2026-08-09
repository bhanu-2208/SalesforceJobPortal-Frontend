"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { useSearchParams } from "next/navigation";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { getValidToken } from "@/lib/api";

const API =
  process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000";

// ─────────────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────────────

interface Job {
  _id: string;
  title: string;
  slug: string;
  description: string;
  location?: string;
  country?: string;
  workMode?: "Remote" | "Hybrid" | "Onsite";
  experienceLevel?: string;
  roleCategory?: string;
  skills?: string[];
  salary?: {
    min?: number;
    max?: number;
    currency?: string;
  };
  employmentType?: string;
  applyUrl: string;
  postedAt?: string;
  postedBy?: string;
  company?: {
    name: string;
    logo?: string;
  };
}

interface User {
  id: string;
  name: string;
  email: string;
  role: string;
}

interface Filters {
  q: string;
  country: string;
  role: string;
  workMode: string;
  experienceLevel: string;
  employmentType: string;
  page: number;
}

// ─────────────────────────────────────────────────────────────────────
// Constants
// ─────────────────────────────────────────────────────────────────────

const WORK_MODE_CLASS: Record<string, string> = {
  Remote: "badge--green",
  Hybrid: "badge--blue",
  Onsite: "badge--gray",
};

const WORK_MODES = ["Remote", "Hybrid", "Onsite"];

const EXPERIENCE_LEVELS = [
  "0 Years",
  "1-2 Years",
  "2-6 Years",
  "6-8 Years",
  "8-12 Years",
  "12+ Years",
];

const EMPLOYMENT_TYPES = [
  "Full-time",
  "Part-time",
  "Contract",
  "Internship",
];

const COUNTRIES = [
  "India",
  "USA",
  "UK",
  "Germany",
  "Australia",
  "Canada",
];

const SALESFORCE_ROLES = [
  "CPQ Specialist",
  "Experience Cloud Developer",
  "Field Service Lightning Consultant",
  "Marketing Cloud Architect",
  "Marketing Cloud Consultant",
  "Marketing Cloud Developer",
  "Salesforce Administrator",
  "Salesforce Architect",
  "Salesforce Business Analyst",
  "Salesforce Consultant",
  "Salesforce Data Analyst",
  "Salesforce Data Engineer",
  "Salesforce Developer",
  "Salesforce DevOps Engineer",
  "Salesforce Functional Consultant",
  "Salesforce Integration Developer",
  "Salesforce Intern",
  "Salesforce Platform Engineer",
  "Salesforce Product Owner",
  "Salesforce Project Manager",
  "Salesforce QA Engineer",
  "Salesforce Release Manager",
  "Salesforce Scrum Master",
  "Salesforce Solution Architect",
  "Salesforce Support Engineer",
  "Salesforce Sustainability Cloud Consultant",
  "Salesforce Technical Architect",
  "Salesforce Technical Lead",
  "Salesforce Trainer",
  "Service Cloud Consultant",
];

// ─────────────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────────────

function timeAgo(date?: string): string {
  if (!date) return "Recently";

  const diff = Date.now() - new Date(date).getTime();

  const days = Math.floor(diff / 86400000);
  const hours = Math.floor(diff / 3600000);

  if (days === 0) {
    return hours <= 1 ? "Just now" : `${hours}h ago`;
  }

  if (days === 1) return "Yesterday";

  return `${days} days ago`;
}

function formatSalary(salary?: Job["salary"]): string {
  if (!salary || !salary.min) return "";

  const cur = salary.currency === "USD" ? "$" : "₹";

  const fmt = (n: number) =>
    salary.currency === "USD"
      ? `${cur}${(n / 1000).toFixed(0)}k`
      : `${cur}${(n / 100000).toFixed(1)}L`;

  if (!salary.max) {
    return fmt(salary.min);
  }

  return `${fmt(salary.min)} – ${fmt(salary.max)}`;
}

function initials(name?: string): string {
  if (!name) return "??";

  return name
    .split(" ")
    .map((w) => w[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
}

function canDeleteJob(
  user: User | null,
  job: Job
): boolean {
  if (!user) return false;

  if (user.role === "admin") return true;

  if (user.role === "recruiter") {
    return job.postedBy === user.id;
  }

  return false;
}

// ─────────────────────────────────────────────────────────────────────
// SVG Icons
// ─────────────────────────────────────────────────────────────────────

function ChevronDownIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className="filter-chevron"
    >
      <polyline points="6 9 12 15 18 9" />
    </svg>
  );
}

function CheckIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <polyline points="20 6 9 17 4 12" />
    </svg>
  );
}

function FilterIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <line x1="4" y1="6" x2="20" y2="6" />
      <line x1="7" y1="12" x2="17" y2="12" />
      <line x1="10" y1="18" x2="14" y2="18" />
    </svg>
  );
}

function SearchIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <circle cx="11" cy="11" r="8" />
      <line x1="21" y1="21" x2="16.65" y2="16.65" />
    </svg>
  );
}

function XIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <line x1="18" y1="6" x2="6" y2="18" />
      <line x1="6" y1="6" x2="18" y2="18" />
    </svg>
  );
}

// ─────────────────────────────────────────────────────────────────────
// Job Detail Modal
// ─────────────────────────────────────────────────────────────────────

function JobDetailModal({
  job,
  onClose,
}: {
  job: Job;
  onClose: () => void;
}) {
  return (
    <div
      className="jd-overlay"
      role="dialog"
      aria-modal="true"
      onClick={onClose}
    >
      <div
        className="jd-modal"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          className="jd-close"
          onClick={onClose}
          aria-label="Close"
        >
          ✕
        </button>

        <div className="jd-header">
          <div className="job-card__logo jd-logo">
            {initials(job.company?.name)}
          </div>

          <div>
            <h2 className="jd-title">{job.title}</h2>
            <p className="jd-company">
              {job.company?.name ?? "Company"}
            </p>
          </div>
        </div>

        <div className="jd-badges">
          {job.workMode && (
            <span
              className={`badge ${WORK_MODE_CLASS[job.workMode]}`}
            >
              {job.workMode}
            </span>
          )}

          {job.employmentType && (
            <span className="badge badge--gray">
              {job.employmentType}
            </span>
          )}

          {job.experienceLevel && (
            <span className="badge badge--blue">
              {job.experienceLevel}
            </span>
          )}
        </div>

        <div className="jd-meta">
          {job.location && (
            <span className="job-card__info-item">
              📍 {job.location}
            </span>
          )}

          {job.experienceLevel && (
            <span className="job-card__info-item">
              💼 {job.experienceLevel}
            </span>
          )}

          {formatSalary(job.salary) && (
            <span className="job-card__info-item">
              💰 {formatSalary(job.salary)}
            </span>
          )}

          <span className="job-card__info-item">
            🕐 {timeAgo(job.postedAt)}
          </span>
        </div>

        {job.skills && job.skills.length > 0 && (
          <div className="jd-section">
            <h3 className="jd-section-title">
              Skills Required
            </h3>

            <div className="job-card__skills">
              {job.skills.map((skill) => (
                <span
                  key={skill}
                  className="skill-tag"
                >
                  {skill}
                </span>
              ))}
            </div>
          </div>
        )}

        <div className="jd-section">
          <h3 className="jd-section-title">
            Job Description
          </h3>

          <div className="jd-description">
            {job.description
              .split("\n")
              .map((line, i) =>
                line.trim() === "" ? (
                  <br key={i} />
                ) : line.startsWith("•") ? (
                  <p
                    key={i}
                    className="jd-bullet"
                  >
                    {line}
                  </p>
                ) : (
                  <p key={i}>{line}</p>
                )
              )}
          </div>
        </div>

        <div className="jd-actions">
          <a
            href={job.applyUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="btn btn--primary btn--lg"
          >
            Apply Now →
          </a>

          <button
            className="btn btn--ghost btn--lg"
            onClick={onClose}
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────
// Form Components
// ─────────────────────────────────────────────────────────────────────

function F({
  label,
  id,
  type = "text",
  value,
  onChange,
  placeholder = "",
}: any) {
  return (
    <div className="feedback__field">
      <label htmlFor={id}>{label}</label>

      <input
        id={id}
        type={type}
        className="feedback__input"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
      />
    </div>
  );
}

function S({
  label,
  id,
  value,
  onChange,
  children,
}: any) {
  return (
    <div className="feedback__field">
      <label htmlFor={id}>{label}</label>

      <select
        id={id}
        className="feedback__select"
        value={value}
        onChange={(e) => onChange(e.target.value)}
      >
        {children}
      </select>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────
// Post Job Modal
// ─────────────────────────────────────────────────────────────────────

function PostJobModal({
  token,
  onClose,
  onSuccess,
}: {
  token: string;
  onClose: () => void;
  onSuccess: () => void;
}) {
  const [form, setForm] = useState({
    title: "",
    description: "",
    companyName: "",
    companyLogo: "",
    location: "",
    country: "India",
    workMode: "Onsite",
    experienceLevel: "0 Years",
    roleCategory: "",
    employmentType: "Full-time",
    applyUrl: "",
    salaryMin: "",
    salaryMax: "",
    currency: "INR",
    skills: "",
    companyWebsite: "",
    companyIndustry: "",
    companySize: "",
    applicationDeadline: "",
    benefits: "",
    responsibilities: "",
    qualifications: "",
    preferredQualifications: "",
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [menuStyle, setMenuStyle] =
  useState<React.CSSProperties>({});

  const set = (key: string, value: string) => {
    setForm((prev) => ({
      ...prev,
      [key]: value,
    }));
  };

  const handleSubmit = async () => {
    if (
      !form.title ||
      !form.description ||
      !form.applyUrl ||
      !form.companyName
    ) {
      setError(
        "Job title, company name, description, and apply URL are required."
      );
      return;
    }

    setLoading(true);
    setError("");

    const validToken = await getValidToken();

    if (!validToken) {
      setError("Session expired. Please log in again.");
      setLoading(false);
      return;
    }

    try {
      const res = await fetch(`${API}/api/jobs`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${validToken}`,
        },
        body: JSON.stringify({
          title: form.title,
          description: form.description,

          companyName: form.companyName,
          companyLogo: form.companyLogo,
          companyWebsite: form.companyWebsite,
          companyIndustry: form.companyIndustry,
          companySize: form.companySize,

          location: form.location,
          country: form.country,

          workMode: form.workMode,
          experienceLevel: form.experienceLevel,
          roleCategory: form.roleCategory,
          employmentType:
            form.employmentType || "Full-time",

          applyUrl: form.applyUrl,
          applicationDeadline:
            form.applicationDeadline,

          responsibilities: form.responsibilities
            .split("\n")
            .map((s) => s.trim())
            .filter(Boolean),

          qualifications: form.qualifications
            .split("\n")
            .map((s) => s.trim())
            .filter(Boolean),

          preferredQualifications:
            form.preferredQualifications
              .split("\n")
              .map((s) => s.trim())
              .filter(Boolean),

          benefits: form.benefits
            .split("\n")
            .map((s) => s.trim())
            .filter(Boolean),

          skills: form.skills
            .split(",")
            .map((s) => s.trim())
            .filter(Boolean),

          salary: form.salaryMin
            ? {
                min: Number(form.salaryMin),
                max: Number(form.salaryMax),
                currency: form.currency,
              }
            : undefined,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(
          data.message ?? "Failed to post job."
        );
        return;
      }

      onSuccess();
    } catch {
      setError("Network error.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className="jd-overlay"
      role="dialog"
      aria-modal="true"
      onClick={onClose}
    >
      <div
        className="jd-modal jd-modal--post"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          className="jd-close"
          onClick={onClose}
          aria-label="Close"
        >
          ✕
        </button>

        <h2
          className="jd-title"
          style={{ marginBottom: "1.5rem" }}
        >
          Post a New Job
        </h2>

        {error && (
          <div
            className="auth-alert auth-alert--error"
            style={{ marginBottom: "1rem" }}
          >
            {error}
          </div>
        )}

        <div className="pj-grid">
          <F
            label="Job Title *"
            id="pj-title"
            value={form.title}
            onChange={(v: string) =>
              set("title", v)
            }
            placeholder="e.g. Salesforce Developer"
          />

          <F
            label="Company Name *"
            id="pj-company"
            value={form.companyName}
            onChange={(v: string) =>
              set("companyName", v)
            }
            placeholder="e.g. Accenture"
          />

          <F
            label="Company Logo URL (optional)"
            id="pj-logo"
            value={form.companyLogo}
            onChange={(v: string) =>
              set("companyLogo", v)
            }
            placeholder="https://yourcompany.com/logo.png"
          />

          <F
            label="Company Website"
            id="pj-company-website"
            value={form.companyWebsite}
            onChange={(v: string) =>
              set("companyWebsite", v)
            }
            placeholder="https://company.com"
          />

          <S
            label="Company Size"
            id="pj-company-size"
            value={form.companySize}
            onChange={(v: string) =>
              set("companySize", v)
            }
          >
            <option value="">Select</option>
            <option>1-10</option>
            <option>11-50</option>
            <option>51-200</option>
            <option>201-500</option>
            <option>501-1000</option>
            <option>1000+</option>
          </S>

          <F
            label="Industry"
            id="pj-industry"
            value={form.companyIndustry}
            onChange={(v: string) =>
              set("companyIndustry", v)
            }
            placeholder="Software"
          />

          <F
            label="Location"
            id="pj-loc"
            value={form.location}
            onChange={(v: string) =>
              set("location", v)
            }
            placeholder="e.g. Hyderabad, India"
          />

          <F
            label="Country"
            id="pj-country"
            value={form.country}
            onChange={(v: string) =>
              set("country", v)
            }
            placeholder="e.g. India"
          />

          <S
            label="Work Mode"
            id="pj-wm"
            value={form.workMode}
            onChange={(v: string) =>
              set("workMode", v)
            }
          >
            {WORK_MODES.map((mode) => (
              <option key={mode}>{mode}</option>
            ))}
          </S>

          <S
            label="Role Category"
            id="pj-role"
            value={form.roleCategory}
            onChange={(v: string) =>
              set("roleCategory", v)
            }
          >
            <option value="">Select Role</option>

            {SALESFORCE_ROLES.map((role) => (
              <option
                key={role}
                value={role}
              >
                {role}
              </option>
            ))}
          </S>

          <S
            label="Experience"
            id="pj-exp"
            value={form.experienceLevel}
            onChange={(v: string) =>
              set("experienceLevel", v)
            }
          >
            {EXPERIENCE_LEVELS.map((level) => (
              <option key={level}>
                {level}
              </option>
            ))}
          </S>

          <S
            label="Employment Type"
            id="pj-et"
            value={form.employmentType}
            onChange={(v: string) =>
              set("employmentType", v)
            }
          >
            {EMPLOYMENT_TYPES.map((type) => (
              <option key={type}>
                {type}
              </option>
            ))}
          </S>

          <S
            label="Currency"
            id="pj-cur"
            value={form.currency}
            onChange={(v: string) =>
              set("currency", v)
            }
          >
            {["INR", "USD", "GBP", "EUR"].map(
              (currency) => (
                <option key={currency}>
                  {currency}
                </option>
              )
            )}
          </S>

          <F
            label="Min Salary"
            id="pj-smin"
            value={form.salaryMin}
            onChange={(v: string) =>
              set("salaryMin", v)
            }
            placeholder="e.g. 800000"
            type="number"
          />

          <F
            label="Max Salary"
            id="pj-smax"
            value={form.salaryMax}
            onChange={(v: string) =>
              set("salaryMax", v)
            }
            placeholder="e.g. 1400000"
            type="number"
          />
        </div>

        <div
          className="feedback__field"
          style={{ marginTop: "1rem" }}
        >
          <label
            className="feedback__label"
            htmlFor="pj-skills"
          >
            Skills (comma separated)
          </label>

          <input
            id="pj-skills"
            type="text"
            className="feedback__input"
            value={form.skills}
            onChange={(e) =>
              set("skills", e.target.value)
            }
            placeholder="Apex, LWC, SOQL"
          />
        </div>

        <div
          className="feedback__field"
          style={{ marginTop: "1rem" }}
        >
          <label
            className="feedback__label"
            htmlFor="pj-url"
          >
            Apply URL *
          </label>

          <input
            id="pj-url"
            type="url"
            className="feedback__input"
            value={form.applyUrl}
            onChange={(e) =>
              set("applyUrl", e.target.value)
            }
            placeholder="https://careers.yourcompany.com/job/123"
          />
        </div>

        <F
          label="Application Deadline"
          id="pj-deadline"
          type="date"
          value={form.applicationDeadline}
          onChange={(v: string) =>
            set("applicationDeadline", v)
          }
        />

        <div
          className="feedback__field"
          style={{ marginTop: "1rem" }}
        >
          <label
            className="feedback__label"
            htmlFor="pj-desc"
          >
            Description *
          </label>

          <textarea
            id="pj-desc"
            className="feedback__textarea"
            rows={7}
            value={form.description}
            onChange={(e) =>
              set("description", e.target.value)
            }
            placeholder="Full job description, responsibilities, requirements..."
          />
        </div>

        <div
          className="feedback__field"
          style={{ marginTop: "1rem" }}
        >
          <label>Responsibilities</label>

          <textarea
            className="feedback__textarea"
            rows={5}
            value={form.responsibilities}
            onChange={(e) =>
              set(
                "responsibilities",
                e.target.value
              )
            }
            placeholder="One responsibility per line"
          />
        </div>

        <div
          className="feedback__field"
          style={{ marginTop: "1rem" }}
        >
          <label>Required Qualifications</label>

          <textarea
            className="feedback__textarea"
            rows={5}
            value={form.qualifications}
            onChange={(e) =>
              set(
                "qualifications",
                e.target.value
              )
            }
            placeholder="One qualification per line"
          />
        </div>

        <div
          className="feedback__field"
          style={{ marginTop: "1rem" }}
        >
          <label>Preferred Qualifications</label>

          <textarea
            className="feedback__textarea"
            rows={4}
            value={form.preferredQualifications}
            onChange={(e) =>
              set(
                "preferredQualifications",
                e.target.value
              )
            }
            placeholder="Optional"
          />
        </div>

        <div
          className="feedback__field"
          style={{ marginTop: "1rem" }}
        >
          <label>Benefits</label>

          <textarea
            className="feedback__textarea"
            rows={4}
            value={form.benefits}
            onChange={(e) =>
              set("benefits", e.target.value)
            }
            placeholder="Health Insurance, Remote Work, Bonus..."
          />
        </div>

        <div
          className="jd-actions"
          style={{ marginTop: "1.5rem" }}
        >
          <button
            className="feedback__submit"
            onClick={handleSubmit}
            disabled={loading}
            style={{ flex: 1 }}
          >
            {loading ? "Posting…" : "Post Job"}
          </button>

          <button
            className="btn btn--ghost btn--lg"
            onClick={onClose}
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────
// Job Card
// ─────────────────────────────────────────────────────────────────────

function JobCard({
  job,
  user,
  onDelete,
}: {
  job: Job;
  user: User | null;
  onDelete: (id: string) => void;
}) {
  const [saved, setSaved] = useState(false);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const handleSave = async (
    e: React.MouseEvent
  ) => {
    e.preventDefault();

    const token = await getValidToken();

    if (!token) {
      window.location.href = "/login";
      return;
    }

    setSaving(true);

    try {
      if (saved) {
        await fetch(
          `${API}/api/saved-jobs/${job._id}`,
          {
            method: "DELETE",
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );

        setSaved(false);
      } else {
        await fetch(
          `${API}/api/saved-jobs/${job._id}`,
          {
            method: "POST",
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );

        setSaved(true);
      }
    } catch {
      // intentionally silent
    }

    setSaving(false);
  };

  const handleDelete = async (
    e: React.MouseEvent
  ) => {
    e.preventDefault();

    if (
      !confirm(
        `Delete "${job.title}"? This cannot be undone.`
      )
    ) {
      return;
    }

    const token = await getValidToken();

    if (!token) {
      window.location.href = "/login";
      return;
    }

    setDeleting(true);

    try {
      const res = await fetch(
        `${API}/api/jobs/${job._id}`,
        {
          method: "DELETE",
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (res.ok) {
        onDelete(job._id);
      }
    } catch {
      // intentionally silent
    }

    setDeleting(false);
  };

  return (
    <div className="job-card">
      <div className="job-card__header">
        <div className="job-card__logo">
          {job.company?.logo ? (
            <img
              src={job.company.logo}
              alt={job.company.name}
              className="job-card__logo-img"
            />
          ) : (
            initials(job.company?.name)
          )}
        </div>

        <div className="job-card__meta">
          <h3 className="job-card__title">
            {job.title}
          </h3>

          <span className="job-card__company">
            {job.company?.name ?? "Company"}
          </span>
        </div>

        {job.workMode && (
          <span
            className={`badge ${WORK_MODE_CLASS[job.workMode]}`}
          >
            {job.workMode}
          </span>
        )}
      </div>

      <div className="job-card__info">
        {job.location && (
          <span className="job-card__info-item">
            <svg
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="job-card__info-icon"
            >
              <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
              <circle
                cx="12"
                cy="10"
                r="3"
              />
            </svg>

            {job.location}
          </span>
        )}

        {job.experienceLevel && (
          <span className="job-card__info-item">
            <svg
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="job-card__info-icon"
            >
              <rect
                x="2"
                y="7"
                width="20"
                height="14"
                rx="2"
                ry="2"
              />
              <path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16" />
            </svg>

            {job.experienceLevel}
          </span>
        )}

        <span className="job-card__info-item">
          <svg
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="job-card__info-icon"
          >
            <circle
              cx="12"
              cy="12"
              r="10"
            />
            <polyline points="12 6 12 12 16 14" />
          </svg>

          {timeAgo(job.postedAt)}
        </span>

        {formatSalary(job.salary) && (
          <span className="job-card__info-item">
            💰 {formatSalary(job.salary)}
          </span>
        )}
      </div>

      {job.skills && job.skills.length > 0 && (
        <div className="job-card__skills">
          {job.skills
            .slice(0, 4)
            .map((skill) => (
              <span
                key={skill}
                className="skill-tag"
              >
                {skill}
              </span>
            ))}

          {job.skills.length > 4 && (
            <span className="skill-tag">
              +{job.skills.length - 4}
            </span>
          )}
        </div>
      )}

      <div className="job-card__actions">
        <a
          href={`/jobs/${job.slug}`}
          className="btn btn--primary btn--sm"
        >
          View Details
        </a>

        <button
          className="btn btn--ghost btn--sm"
          onClick={() => {
            const current =
              window.location.pathname +
              window.location.search;

            window.open(
              job.applyUrl,
              "_blank"
            );

            window.location.href =
              `/apply-confirm?jobId=${job._id}` +
              `&title=${encodeURIComponent(
                job.title
              )}` +
              `&returnUrl=${encodeURIComponent(
                current
              )}`;
          }}
        >
          Apply →
        </button>

        <button
          className={`job-card__save-btn ${
            saved
              ? "job-card__save-btn--saved"
              : ""
          }`}
          onClick={handleSave}
          disabled={saving}
          aria-label={
            saved ? "Unsave job" : "Save job"
          }
          title={saved ? "Unsave" : "Save job"}
        >
          <svg
            viewBox="0 0 24 24"
            fill={
              saved
                ? "currentColor"
                : "none"
            }
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            style={{
              width: 15,
              height: 15,
            }}
          >
            <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z" />
          </svg>
        </button>

        {canDeleteJob(user, job) && (
          <button
            className="job-card__delete-btn"
            onClick={handleDelete}
            disabled={deleting}
            aria-label={`Delete ${job.title}`}
            title={
              user?.role === "admin"
                ? "Delete job (admin)"
                : "Delete your job posting"
            }
          >
            <svg
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              style={{
                width: 15,
                height: 15,
              }}
            >
              <polyline points="3 6 5 6 21 6" />
              <path d="M19 6l-1 14H6L5 6" />
              <path d="M10 11v6" />
              <path d="M14 11v6" />
            </svg>
          </button>
        )}
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────
// LinkedIn-style Filter Dropdown
// ─────────────────────────────────────────────────────────────────────

function FilterDropdown({
  label,
  value,
  options,
  onChange,
  searchable = false,
}: {
  label: string;
  value: string;
  options: string[];
  onChange: (value: string) => void;
  searchable?: boolean;
}) {
  const [menuStyle, setMenuStyle] =
  useState<React.CSSProperties>({});
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");

  const wrapperRef = useRef<HTMLDivElement | null>(null);
const buttonRef = useRef<HTMLButtonElement | null>(null);

  const active = Boolean(value);
  const openDropdown = () => {
  if (window.innerWidth <= 900 && buttonRef.current) {
    const rect =
      buttonRef.current.getBoundingClientRect();

    const menuHeight = 390;
    const gap = 8;

    const spaceAbove = rect.top;
    const spaceBelow =
      window.innerHeight - rect.bottom;

    // Prefer above when there is enough room
    if (spaceAbove >= menuHeight + gap) {
      setMenuStyle({
        position: "fixed",
        left: "12px",
        bottom: "auto",
        top: `${rect.top - menuHeight - gap}px`,
        width: "calc(100vw - 24px)",
        maxHeight: `${Math.min(
          menuHeight,
          spaceAbove - gap
        )}px`,
        zIndex: 9999,
      });
    } else {
      // Otherwise open below
      setMenuStyle({
        position: "fixed",
        left: "12px",
        top: `${rect.bottom + gap}px`,
        bottom: "auto",
        width: "calc(100vw - 24px)",
        maxHeight: `${Math.min(
          menuHeight,
          spaceBelow - gap
        )}px`,
        zIndex: 9999,
      });
    }
  } else {
    setMenuStyle({});
  }

  setOpen((prev) => !prev);
};
  useEffect(() => {
    const handleClickOutside = (
      event: MouseEvent
    ) => {
      if (
        wrapperRef.current &&
        !wrapperRef.current.contains(
          event.target as Node
        )
      ) {
        setOpen(false);
      }
    };

    document.addEventListener(
      "mousedown",
      handleClickOutside
    );

    return () =>
      document.removeEventListener(
        "mousedown",
        handleClickOutside
      );
  }, []);

  useEffect(() => {
    if (!open) {
      setSearch("");
    }
  }, [open]);

  const filteredOptions = searchable
    ? options.filter((option) =>
        option
          .toLowerCase()
          .includes(search.toLowerCase())
      )
    : options;

  const selectValue = (option: string) => {
    onChange(
      value === option ? "" : option
    );
    setOpen(false);
  };

  return (
    <div
      className="li-filter-wrap"
      ref={wrapperRef}
    >
      <button
        ref={buttonRef}
        type="button"
        className={`li-filter ${
          active ? "li-filter--active" : ""
        } ${open ? "li-filter--open" : ""}`}
        onClick={openDropdown}
        aria-expanded={open}
      >
        <span>{value || label}</span>

        {active ? (
          <span
            className="li-filter-count"
            aria-hidden="true"
          >
            1
          </span>
        ) : null}

        <ChevronDownIcon />
      </button>

      {open && (
        <div className="li-filter-menu" style={menuStyle}>
          <div className="li-filter-menu__header">
            <span>{label}</span>

            {active && (
              <button
                type="button"
                className="li-filter-menu__clear"
                onClick={() => {
                  onChange("");
                  setOpen(false);
                }}
              >
                Clear
              </button>
            )}
          </div>

          {searchable && (
            <div className="li-filter-search">
              <SearchIcon />

              <input
                autoFocus
                type="text"
                placeholder={`Search ${label.toLowerCase()}...`}
                value={search}
                onChange={(e) =>
                  setSearch(e.target.value)
                }
              />
            </div>
          )}

          <div className="li-filter-options">
            {filteredOptions.length === 0 ? (
              <div className="li-filter-empty">
                No matching options
              </div>
            ) : (
              filteredOptions.map((option) => {
                const selected =
                  value === option;

                return (
                  <button
                    type="button"
                    key={option}
                    className={`li-filter-option ${
                      selected
                        ? "li-filter-option--selected"
                        : ""
                    }`}
                    onClick={() =>
                      selectValue(option)
                    }
                  >
                    <span>{option}</span>

                    {selected && (
                      <span className="li-check">
                        <CheckIcon />
                      </span>
                    )}
                  </button>
                );
              })
            )}
          </div>
        </div>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────
// Active Filter Chip
// ─────────────────────────────────────────────────────────────────────

function ActiveFilterChip({
  label,
  onClear,
}: {
  label: string;
  onClear: () => void;
}) {
  return (
    <div className="active-filter-chip">
      <span>{label}</span>

      <button
        type="button"
        onClick={onClear}
        aria-label={`Remove ${label} filter`}
      >
        <XIcon />
      </button>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────
// Filter Toolbar
// ─────────────────────────────────────────────────────────────────────

function FilterToolbar({
  filters,
  onChange,
  onClear,
}: {
  filters: Filters;
  onChange: (
    key: string,
    value: string
  ) => void;
  onClear: () => void;
}) {
  const activeFilters = [
    filters.workMode,
    filters.experienceLevel,
    filters.employmentType,
    filters.role,
    filters.country,
  ].filter(Boolean);

  const hasFilters =
    activeFilters.length > 0;

  return (
    <div className="linkedin-filter-section">
      <div className="linkedin-filter-row">
        <FilterDropdown
          label="Work mode"
          value={filters.workMode}
          options={WORK_MODES}
          onChange={(value) =>
            onChange("workMode", value)
          }
        />

        <FilterDropdown
          label="Experience"
          value={filters.experienceLevel}
          options={EXPERIENCE_LEVELS}
          onChange={(value) =>
            onChange(
              "experienceLevel",
              value
            )
          }
        />

        <FilterDropdown
          label="Employment type"
          value={filters.employmentType}
          options={EMPLOYMENT_TYPES}
          onChange={(value) =>
            onChange(
              "employmentType",
              value
            )
          }
        />

        <FilterDropdown
          label="Job role"
          value={filters.role}
          options={SALESFORCE_ROLES}
          searchable
          onChange={(value) =>
            onChange("role", value)
          }
        />

        <FilterDropdown
          label="Country"
          value={filters.country}
          options={COUNTRIES}
          onChange={(value) =>
            onChange("country", value)
          }
        />

        <button
          type="button"
          className={`li-all-filters ${
            hasFilters
              ? "li-all-filters--active"
              : ""
          }`}
          onClick={onClear}
        >
          <FilterIcon />
          <span>All filters</span>

          {hasFilters && (
            <span className="all-filter-count">
              {activeFilters.length}
            </span>
          )}
        </button>
      </div>

      {hasFilters && (
        <div className="active-filter-row">
          <div className="active-filter-label">
            Active filters
          </div>

          {filters.workMode && (
            <ActiveFilterChip
              label={filters.workMode}
              onClear={() =>
                onChange("workMode", "")
              }
            />
          )}

          {filters.experienceLevel && (
            <ActiveFilterChip
              label={filters.experienceLevel}
              onClear={() =>
                onChange(
                  "experienceLevel",
                  ""
                )
              }
            />
          )}

          {filters.employmentType && (
            <ActiveFilterChip
              label={filters.employmentType}
              onClear={() =>
                onChange(
                  "employmentType",
                  ""
                )
              }
            />
          )}

          {filters.role && (
            <ActiveFilterChip
              label={filters.role}
              onClear={() =>
                onChange("role", "")
              }
            />
          )}

          {filters.country && (
            <ActiveFilterChip
              label={filters.country}
              onClear={() =>
                onChange("country", "")
              }
            />
          )}

          <button
            type="button"
            className="active-filter-clear-all"
            onClick={onClear}
          >
            Clear all
          </button>
        </div>
      )}

      <style jsx>{`
        .linkedin-filter-section {
          width: 100%;
          margin-top: 1rem;
          animation: filterSectionIn 0.5s
            cubic-bezier(0.22, 1, 0.36, 1)
            both;
        }

        .linkedin-filter-row { display: flex; align-items: center; justify-content: center; gap: 0.65rem; width: 100%; overflow-x: auto; padding: 0.15rem 0.1rem 0.6rem; scrollbar-width: none; }

        .linkedin-filter-row::-webkit-scrollbar {
          display: none;
        }

        /* Tablet and mobile */
        @media (max-width: 900px) {
          .linkedin-filter-row {
            justify-content: flex-start;
            padding-left: 0.25rem;
            padding-right: 0.5rem;
          }
        }
        @keyframes filterSectionIn {
          from {
            opacity: 0;
            transform: translateY(8px);
          }

          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        .active-filter-row {
          display: flex;
          align-items: center;
          gap: 0.55rem;
          flex-wrap: wrap;
          margin-top: 0.35rem;
          padding: 0.2rem 0.1rem;
          animation: activeFiltersIn
            0.35s
            cubic-bezier(
              0.22,
              1,
              0.36,
              1
            )
            both;
        }

        @keyframes activeFiltersIn {
          from {
            opacity: 0;
            transform: translateY(-4px);
          }

          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        .active-filter-label {
          font-size: 0.72rem;
          font-weight: 700;
          text-transform: uppercase;
          letter-spacing: 0.05em;
          color: #64748b;
          margin-right: 0.15rem;
        }

        .active-filter-chip {
          display: inline-flex;
          align-items: center;
          gap: 0.4rem;
          padding: 0.35rem 0.45rem
            0.35rem 0.75rem;
          border-radius: 999px;
          background: #eef2ff;
          border: 1px solid #c7d2fe;
          color: #3730a3;
          font-size: 0.78rem;
          font-weight: 650;
          animation: chipIn 0.3s
            cubic-bezier(
              0.34,
              1.56,
              0.64,
              1
            )
            both;
        }

        @keyframes chipIn {
          from {
            opacity: 0;
            transform: scale(0.85);
          }

          to {
            opacity: 1;
            transform: scale(1);
          }
        }

        .active-filter-chip button {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          width: 19px;
          height: 19px;
          padding: 0;
          border: none;
          border-radius: 50%;
          background: rgba(
            79,
            70,
            229,
            0.1
          );
          color: #4338ca;
          cursor: pointer;
          transition:
            transform 0.18s ease,
            background 0.18s ease;
        }

        .active-filter-chip button:hover {
          transform: rotate(90deg)
            scale(1.08);
          background: rgba(
            79,
            70,
            229,
            0.2
          );
        }

        .active-filter-chip button :global(svg) {
          width: 11px;
          height: 11px;
        }

        .active-filter-clear-all {
          border: none;
          background: transparent;
          color: #4f46e5;
          font-size: 0.78rem;
          font-weight: 700;
          cursor: pointer;
          padding: 0.35rem 0.5rem;
          transition:
            color 0.2s ease,
            transform 0.2s ease;
        }

        .active-filter-clear-all:hover {
          color: #3730a3;
          transform: translateX(2px);
        }

        @media (max-width: 720px) {
          .linkedin-filter-row {
            gap: 0.5rem;
          }

          .active-filter-row {
            flex-wrap: nowrap;
            overflow-x: auto;
            scrollbar-width: none;
            padding-bottom: 0.35rem;
          }

          .active-filter-row::-webkit-scrollbar {
            display: none;
          }

          .active-filter-label {
            white-space: nowrap;
          }

          .active-filter-chip {
            flex-shrink: 0;
            white-space: nowrap;
          }
        }
      `}</style>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────
// Main Page
// ─────────────────────────────────────────────────────────────────────

export default function JobsPage() {
  const searchParams = useSearchParams();

  const [jobs, setJobs] = useState<Job[]>([]);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] =
    useState(1);

  const [loading, setLoading] =
    useState(true);

  const [error, setError] = useState("");

  const [user, setUser] =
    useState<User | null>(null);

  const [token, setToken] = useState("");

  const [selectedJob, setSelectedJob] =
    useState<Job | null>(null);

  const [showPostJob, setShowPostJob] =
    useState(false);

  const [filters, setFilters] =
    useState<Filters>({
      q:
        searchParams.get("q") ?? "",
      country:
        searchParams.get("country") ?? "",
      role:
        searchParams.get("role") ?? "",
      workMode:
        searchParams.get("workMode") ?? "",
      experienceLevel:
        searchParams.get(
          "experienceLevel"
        ) ?? "",
      employmentType:
        searchParams.get(
          "employmentType"
        ) ?? "",
      page: 1,
    });

  // ───────────────────────────────────────────────────────────────
  // Rehydrate user
  // ───────────────────────────────────────────────────────────────

  useEffect(() => {
    (async () => {
      try {
        const raw =
          localStorage.getItem(
            "tc_user"
          );

        if (raw) {
          setUser(JSON.parse(raw));
        }

        const validToken =
          await getValidToken();

        if (validToken) {
          setToken(validToken);
        }
      } catch {
        // intentionally silent
      }
    })();
  }, []);

  // ───────────────────────────────────────────────────────────────
  // Fetch jobs
  // ───────────────────────────────────────────────────────────────

  const fetchJobs =
    useCallback(async () => {
      setLoading(true);
      setError("");

      try {
        const params =
          new URLSearchParams();

        if (filters.q) {
          params.set(
            "q",
            filters.q
          );
        }

        if (filters.country) {
          params.set(
            "country",
            filters.country
          );
        }

        if (filters.workMode) {
          params.set(
            "workMode",
            filters.workMode
          );
        }

        if (filters.experienceLevel) {
          params.set(
            "experienceLevel",
            filters.experienceLevel
          );
        }

        if (filters.employmentType) {
          params.set(
            "employmentType",
            filters.employmentType
          );
        }

        if (filters.role) {
          params.set(
            "role",
            filters.role.trim()
          );
        }

        params.set(
          "page",
          String(filters.page)
        );

        params.set("limit", "12");

        const res = await fetch(
          `${API}/api/jobs?${params}`
        );

        const data = await res.json();

        if (!res.ok) {
          throw new Error(
            data.message ??
              "Failed to load jobs."
          );
        }

        setJobs(data.data);
        setTotal(data.total);
        setTotalPages(
          data.totalPages
        );
      } catch (e: any) {
        setError(
          e.message ??
            "Failed to load jobs."
        );
      } finally {
        setLoading(false);
      }
    }, [filters]);

  useEffect(() => {
    fetchJobs();
  }, [fetchJobs]);

  // ───────────────────────────────────────────────────────────────
  // Filter handlers
  // ───────────────────────────────────────────────────────────────

  const setFilter = (
    key: string,
    value: string
  ) => {
    setFilters((prev) => ({
      ...prev,
      [key]: value,
      page: 1,
    }));
  };

  const clearFilters = () => {
    setFilters({
      q: "",
      country: "",
      role: "",
      workMode: "",
      experienceLevel: "",
      employmentType: "",
      page: 1,
    });
  };

  const handleJobDeleted = (
    id: string
  ) => {
    setJobs((prev) =>
      prev.filter(
        (job) => job._id !== id
      )
    );

    setTotal((prev) =>
      Math.max(0, prev - 1)
    );
  };

  const hasAnyFilter =
    Boolean(
      filters.q ||
        filters.country ||
        filters.role ||
        filters.workMode ||
        filters.experienceLevel ||
        filters.employmentType
    );

  // ───────────────────────────────────────────────────────────────
  // Render
  // ───────────────────────────────────────────────────────────────

  return (
    <>
      <Navbar />

      <div className="jobs-page">
        {/* ─────────────────────────────────────────────────────────
            HERO
        ───────────────────────────────────────────────────────── */}

        <div className="jobs-hero">
          <div className="jobs-hero__inner">
            <div>
              <h1 className="jobs-hero__title">
                Salesforce Jobs
              </h1>

              <p className="jobs-hero__sub">
                {total > 0
                  ? `${total} opportunities found`
                  : "Browse all Salesforce roles"}
              </p>
            </div>

            {(user?.role === "admin" ||
              user?.role === "recruiter") && (
              <div
                style={{
                  display: "flex",
                  gap: "0.625rem",
                  flexWrap: "wrap",
                }}
              >
                <button
                  className="btn btn--primary jobs-hero__post-btn"
                  onClick={() =>
                    setShowPostJob(true)
                  }
                >
                  <svg
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    style={{
                      width: 16,
                      height: 16,
                    }}
                  >
                    <line
                      x1="12"
                      y1="5"
                      x2="12"
                      y2="19"
                    />
                    <line
                      x1="5"
                      y1="12"
                      x2="19"
                      y2="12"
                    />
                  </svg>

                  Post a Job
                </button>

                <a
                  href="/jobs/new"
                  className="btn btn--ghost jobs-hero__post-btn"
                  style={{
                    background:
                      "rgba(255,255,255,0.15)",
                    color: "#ffffff",
                    borderColor:
                      "rgba(255,255,255,0.4)",
                  }}
                >
                  <svg
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    style={{
                      width: 16,
                      height: 16,
                    }}
                  >
                    <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
                  </svg>

                  Generate with AI
                </a>
              </div>
            )}
          </div>

          {/* ─────────────────────────────────────────────────────
              SEARCH
          ───────────────────────────────────────────────────── */}

          <div className="jobs-search-filter-area">
            <div className="jobs-hero__search">
              <SearchIcon />

              <input
                className="jobs-hero__search-input"
                type="text"
                placeholder="Search by title, skill, or keyword..."
                value={filters.q}
                onChange={(e) =>
                  setFilter(
                    "q",
                    e.target.value
                  )
                }
              />

              {filters.q && (
                <button
                  className="jobs-hero__clear-btn"
                  onClick={() =>
                    setFilter("q", "")
                  }
                  aria-label="Clear search"
                >
                  <XIcon />
                </button>
              )}
            </div>

            {/* ─────────────────────────────────────────────────────
                LINKEDIN-STYLE FILTERS
            ───────────────────────────────────────────────────── */}

            <FilterToolbar
              filters={filters}
              onChange={setFilter}
              onClear={clearFilters}
            />
          </div>
        </div>

        {/* ─────────────────────────────────────────────────────────
            BODY
        ───────────────────────────────────────────────────────── */}

        <div className="jobs-body">
          <main className="jobs-main jobs-main--full">
            {loading ? (
              <div className="jobs-loading">
                {[...Array(6)].map(
                  (_, i) => (
                    <div
                      key={i}
                      className="jobs-skeleton"
                    />
                  )
                )}
              </div>
            ) : error ? (
              <div className="jobs-error">
                <p>⚠️ {error}</p>

                <button
                  className="btn btn--ghost"
                  onClick={fetchJobs}
                >
                  Retry
                </button>
              </div>
            ) : jobs.length === 0 ? (
              <div className="jobs-empty">
                <div className="jobs-empty__icon">
                  🔍
                </div>

                <h3>No jobs found</h3>

                <p>
                  Try adjusting your filters
                  or search term.
                </p>

                {hasAnyFilter && (
                  <button
                    className="btn btn--ghost"
                    onClick={clearFilters}
                  >
                    Clear Filters
                  </button>
                )}
              </div>
            ) : (
              <>
                <div className="jobs-grid">
                  {jobs.map((job) => (
                    <JobCard
                      key={job._id}
                      job={job}
                      user={user}
                      onDelete={
                        handleJobDeleted
                      }
                    />
                  ))}
                </div>

                {totalPages > 1 && (
                  <div className="jobs-pagination">
                    <button
                      className="jobs-page-btn"
                      disabled={
                        filters.page <= 1
                      }
                      onClick={() =>
                        setFilters(
                          (prev) => ({
                            ...prev,
                            page:
                              prev.page - 1,
                          })
                        )
                      }
                    >
                      ← Prev
                    </button>

                    <span className="jobs-page-info">
                      Page {filters.page} of{" "}
                      {totalPages}
                    </span>

                    <button
                      className="jobs-page-btn"
                      disabled={
                        filters.page >=
                        totalPages
                      }
                      onClick={() =>
                        setFilters(
                          (prev) => ({
                            ...prev,
                            page:
                              prev.page + 1,
                          })
                        )
                      }
                    >
                      Next →
                    </button>
                  </div>
                )}
              </>
            )}
          </main>
        </div>
      </div>

      <Footer />

      {selectedJob && (
        <JobDetailModal
          job={selectedJob}
          onClose={() =>
            setSelectedJob(null)
          }
        />
      )}

      {showPostJob && (
        <PostJobModal
          token={token}
          onClose={() =>
            setShowPostJob(false)
          }
          onSuccess={() => {
            setShowPostJob(false);
            fetchJobs();
          }}
        />
      )}

      {/* ───────────────────────────────────────────────────────────
          LINKEDIN-STYLE FILTER CSS
      ─────────────────────────────────────────────────────────── */}

      <style jsx global>{`
        /* =========================================================
           SEARCH + FILTER CONTAINER
        ========================================================= */

        .jobs-search-filter-area {
            width: 100%;
            max-width: 1400px;
            margin: 1.15rem auto 0;
            padding: 0 1rem;
            box-sizing: border-box;
          }
        .jobs-hero__search {
          position: relative;
          display: flex;
          align-items: center;
          gap: 0.7rem;
          width: 100%;
          min-height: 54px;
          padding: 0 1rem;
          width: 100%;
          box-sizing: border-box;
          border-radius: 14px;
          background: rgba(
            255,
            255,
            255,
            0.97
          );
          border: 1px solid
            rgba(15, 23, 42, 0.08);
          box-shadow:
            0 2px 4px
              rgba(15, 23, 42, 0.04),
            0 12px 30px -20px
              rgba(15, 23, 42, 0.2);
          transition:
            border-color 0.25s ease,
            box-shadow 0.25s ease,
            transform 0.25s ease;
        }

        .jobs-hero__search:hover {
          border-color: rgba(
            79,
            70,
            229,
            0.22
          );
          box-shadow:
            0 4px 8px
              rgba(15, 23, 42, 0.05),
            0 18px 40px -22px
              rgba(79, 70, 229, 0.25);
        }

        .jobs-hero__search:focus-within {
          border-color: #6366f1;
          box-shadow:
            0 0 0 4px
              rgba(99, 102, 241, 0.1),
            0 14px 30px -18px
              rgba(79, 70, 229, 0.35);
          transform: translateY(-1px);
        }

        .jobs-hero__search
          :global(svg) {
          width: 19px;
          height: 19px;
          color: #64748b;
          flex-shrink: 0;
        }

        .jobs-hero__search-input {
          flex: 1;
          min-width: 0;
          border: none;
          outline: none;
          background: transparent;
          font-size: 0.94rem;
          color: #172033;
          font-weight: 500;
        }

        .jobs-hero__search-input::placeholder {
          color: #94a3b8;
        }

        .jobs-hero__clear-btn {
          display: flex;
          align-items: center;
          justify-content: center;
          width: 28px;
          height: 28px;
          border: none;
          border-radius: 50%;
          background: #f1f5f9;
          color: #64748b;
          cursor: pointer;
          transition:
            transform 0.2s ease,
            background 0.2s ease,
            color 0.2s ease;
        }

        .jobs-hero__clear-btn:hover {
          transform: rotate(90deg);
          background: #e2e8f0;
          color: #0f172a;
        }

        .jobs-hero__clear-btn
          :global(svg) {
          width: 13px;
          height: 13px;
        }

        /* =========================================================
           FILTER PILL
        ========================================================= */

        .li-filter-wrap {
          position: relative;
          flex: 0 0 auto;
        }

        .li-filter {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          gap: 0.5rem;
          min-height: 40px;
          padding: 0.58rem 0.9rem;
          border-radius: 999px;
          border: 1px solid
            rgba(15, 23, 42, 0.12);
          background: #ffffff;
          color: #334155;
          font-size: 0.82rem;
          font-weight: 650;
          white-space: nowrap;
          cursor: pointer;
          box-shadow:
            0 1px 2px
              rgba(15, 23, 42, 0.04);
          transition:
            transform 0.2s
              cubic-bezier(
                0.34,
                1.56,
                0.64,
                1
              ),
            background 0.22s ease,
            border-color 0.22s ease,
            color 0.22s ease,
            box-shadow 0.22s ease;
        }

        .li-filter:hover {
          transform: translateY(-2px);
          border-color: #818cf8;
          color: #4338ca;
          box-shadow:
            0 6px 15px -9px
              rgba(79, 70, 229, 0.45);
        }

        .li-filter--open {
          background: #f8fafc;
          border-color: #6366f1;
          color: #4338ca;
          box-shadow:
            0 0 0 3px
              rgba(99, 102, 241, 0.09);
        }

        .li-filter--active {
          background: linear-gradient(
            135deg,
            #eef2ff,
            #f5f3ff
          );
          border-color: #a5b4fc;
          color: #3730a3;
        }

        .filter-chevron {
          width: 14px;
          height: 14px;
          flex-shrink: 0;
          transition:
            transform 0.25s ease;
        }

        .li-filter--open
          .filter-chevron {
          transform: rotate(180deg);
        }

        .li-filter-count {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          width: 18px;
          height: 18px;
          border-radius: 50%;
          background: #4f46e5;
          color: white;
          font-size: 0.65rem;
          font-weight: 800;
        }

        /* =========================================================
           DROPDOWN
        ========================================================= */

        .li-filter-menu {
          position: absolute;
          z-index: 100;
          top: calc(100% + 9px);
          left: 0;
          width: 280px;
          max-height: 390px;
          overflow: hidden;
          border-radius: 16px;
          background: #ffffff;
          border: 1px solid
            rgba(15, 23, 42, 0.08);
          box-shadow:
            0 18px 45px -15px
              rgba(15, 23, 42, 0.22),
            0 4px 10px
              rgba(15, 23, 42, 0.06);
          animation: dropdownIn 0.22s
            cubic-bezier(
              0.22,
              1,
              0.36,
              1
            )
            both;
          transform-origin: top left;
        }

        @keyframes dropdownIn {
          from {
            opacity: 0;
            transform: translateY(-5px)
              scale(0.97);
          }

          to {
            opacity: 1;
            transform: translateY(0)
              scale(1);
          }
        }

        .li-filter-menu__header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 0.85rem 0.95rem;
          border-bottom: 1px solid
            #eef2f7;
          font-size: 0.8rem;
          font-weight: 750;
          color: #172033;
        }

        .li-filter-menu__clear {
          border: none;
          background: transparent;
          color: #4f46e5;
          font-size: 0.74rem;
          font-weight: 700;
          cursor: pointer;
        }

        .li-filter-menu__clear:hover {
          text-decoration: underline;
        }

        .li-filter-search {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          margin: 0.7rem;
          padding: 0.6rem 0.7rem;
          border: 1px solid
            #e2e8f0;
          border-radius: 10px;
          background: #f8fafc;
        }

        .li-filter-search
          :global(svg) {
          width: 15px;
          height: 15px;
          color: #64748b;
          flex-shrink: 0;
        }

        .li-filter-search input {
          width: 100%;
          min-width: 0;
          border: none;
          outline: none;
          background: transparent;
          font-size: 0.78rem;
          color: #172033;
        }

        .li-filter-options {
          max-height: 285px;
          overflow-y: auto;
          padding: 0.35rem;
        }

        .li-filter-options::-webkit-scrollbar {
          width: 5px;
        }

        .li-filter-options::-webkit-scrollbar-thumb {
          background: #cbd5e1;
          border-radius: 10px;
        }

        .li-filter-option {
          width: 100%;
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 0.75rem;
          padding: 0.65rem 0.7rem;
          border: none;
          border-radius: 9px;
          background: transparent;
          color: #475569;
          text-align: left;
          font-size: 0.8rem;
          font-weight: 550;
          cursor: pointer;
          transition:
            background 0.17s ease,
            color 0.17s ease,
            transform 0.17s ease;
        }

        .li-filter-option:hover {
          background: #f5f3ff;
          color: #4338ca;
          transform: translateX(2px);
        }

        .li-filter-option--selected {
          background: #eef2ff;
          color: #3730a3;
          font-weight: 700;
        }

        .li-check {
          display: flex;
          align-items: center;
          justify-content: center;
          width: 21px;
          height: 21px;
          border-radius: 50%;
          background: #4f46e5;
          color: white;
          flex-shrink: 0;
        }

        .li-check :global(svg) {
          width: 12px;
          height: 12px;
        }

        .li-filter-empty {
          padding: 1.4rem 0.75rem;
          text-align: center;
          color: #94a3b8;
          font-size: 0.78rem;
        }

        /* =========================================================
           ALL FILTERS BUTTON
        ========================================================= */

        .li-all-filters {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          gap: 0.45rem;
          min-height: 40px;
          padding: 0.58rem 0.9rem;
          border-radius: 999px;
          border: 1px solid
            rgba(15, 23, 42, 0.12);
          background: #ffffff;
          color: #334155;
          font-size: 0.82rem;
          font-weight: 700;
          white-space: nowrap;
          cursor: pointer;
          transition:
            transform 0.2s ease,
            background 0.2s ease,
            border-color 0.2s ease,
            color 0.2s ease;
        }

        .li-all-filters
          :global(svg) {
          width: 15px;
          height: 15px;
        }

        .li-all-filters:hover {
          transform: translateY(-2px);
          background: #f8fafc;
          border-color: #818cf8;
          color: #4338ca;
        }

        .li-all-filters--active {
          background: #f5f3ff;
          border-color: #c4b5fd;
          color: #4c1d95;
        }

        .all-filter-count {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          min-width: 19px;
          height: 19px;
          padding: 0 5px;
          border-radius: 999px;
          background: #4f46e5;
          color: white;
          font-size: 0.64rem;
          font-weight: 800;
          animation: countPop 0.3s
            cubic-bezier(
              0.34,
              1.56,
              0.64,
              1
            );
        }
       @media (max-width: 900px) {
        .li-filter-menu {
          position: fixed;
          width: auto;
          max-width: none;
          overflow: hidden;
          z-index: 9999;
        }

        .li-filter-options {
          overflow-y: auto;
        }
      }

        @keyframes countPop {
          from {
            opacity: 0;
            transform: scale(0.5);
          }

          to {
            opacity: 1;
            transform: scale(1);
          }
        }

        /* =========================================================
           MOBILE
        ========================================================= */

       

        @media (max-width: 600px) {
          .jobs-search-filter-area {
            margin-top: 0.8rem;
          }

          .jobs-hero__search {
            min-height: 50px;
          }

          .linkedin-filter-row {
            gap: 0.45rem;
            margin-left: -0.1rem;
            margin-right: -0.1rem;
          }

          .li-filter,
          .li-all-filters {
            min-height: 38px;
            padding: 0.5rem
              0.78rem;
            font-size: 0.78rem;
          }

          .li-filter-menu {
            left: 0.75rem;
            right: 0.75rem;
            border-radius: 14px;
          }
        }

        /* =========================================================
           REDUCED MOTION
        ========================================================= */
        @media (max-width: 900px) {
        .li-filter-menu {
          position: fixed;
          left: 1rem;
          right: 1rem;
          bottom: 1rem;
          top: auto;

          width: auto;
          max-width: none;

          max-height: calc(100vh - 2rem);
          overflow: hidden;

          z-index: 9999;
        }

        .li-filter-options {
          max-height: calc(100vh - 170px);
          overflow-y: auto;
        }
      }
        
          @media (max-width: 900px) {
          .linkedin-filter-row {
            justify-content: flex-start;
            padding-left: 0.25rem;
            padding-right: 0.5rem;
          }

          .li-filter,
          .li-all-filters {
            flex-shrink: 0;
          }

          .li-filter-menu {
            position: fixed;
            left: 1rem;
            right: 1rem;

            /* Open above the filter buttons */
            bottom: 70px;
            top: auto;

            width: auto;
            max-width: none;

            max-height: calc(100vh - 100px);
            overflow: hidden;
          }
        }
      `}</style>
    </>
  );
}