'use client'
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";

const API = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000";

// ── Types ────────────────────────────────────────────────────────────
interface Category {
  label: string;
  count: number;
  icon: React.ReactNode;
  href: string;
}

interface User {
  id: string;
  name: string;
  email: string;
  role: string;
}

// ── Icons ────────────────────────────────────────────────────────────
const CloudIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"
    strokeLinecap="round" strokeLinejoin="round" className="category__icon-svg">
    <path d="M18 10h-1.26A8 8 0 1 0 9 20h9a5 5 0 0 0 0-10z" />
  </svg>
);
const CodeIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"
    strokeLinecap="round" strokeLinejoin="round" className="category__icon-svg">
    <polyline points="16 18 22 12 16 6" /><polyline points="8 6 2 12 8 18" />
  </svg>
);
const SettingsIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"
    strokeLinecap="round" strokeLinejoin="round" className="category__icon-svg">
    <circle cx="12" cy="12" r="3" />
    <path d="M19.07 4.93a10 10 0 0 1 0 14.14M4.93 4.93a10 10 0 0 0 0 14.14" />
  </svg>
);
const LayersIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"
    strokeLinecap="round" strokeLinejoin="round" className="category__icon-svg">
    <polygon points="12 2 2 7 12 12 22 7 12 2" />
    <polyline points="2 17 12 22 22 17" />
    <polyline points="2 12 12 17 22 12" />
  </svg>
);
const BarChartIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"
    strokeLinecap="round" strokeLinejoin="round" className="category__icon-svg">
    <line x1="18" y1="20" x2="18" y2="10" />
    <line x1="12" y1="20" x2="12" y2="4" />
    <line x1="6"  y1="20" x2="6"  y2="14" />
  </svg>
);
const MailIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"
    strokeLinecap="round" strokeLinejoin="round" className="category__icon-svg">
    <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
    <polyline points="22,6 12,13 2,6" />
  </svg>
);
const CheckCircleIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"
    strokeLinecap="round" strokeLinejoin="round" className="category__icon-svg">
    <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
    <polyline points="22 4 12 14.01 9 11.01" />
  </svg>
);
const TerminalIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"
    strokeLinecap="round" strokeLinejoin="round" className="category__icon-svg">
    <polyline points="4 17 10 11 4 5" />
    <line x1="12" y1="19" x2="20" y2="19" />
  </svg>
);
const UsersIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"
    strokeLinecap="round" strokeLinejoin="round" className="category__icon-svg">
    <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
    <circle cx="9" cy="7" r="4" />
    <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
    <path d="M16 3.13a4 4 0 0 1 0 7.75" />
  </svg>
);
const TagIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"
    strokeLinecap="round" strokeLinejoin="round" className="category__icon-svg">
    <path d="M20.59 13.41 13.41 20.59a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z" />
    <line x1="7" y1="7" x2="7.01" y2="7" />
  </svg>
);
const LinkIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"
    strokeLinecap="round" strokeLinejoin="round" className="category__icon-svg">
    <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" />
    <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" />
  </svg>
);
const DatabaseIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"
    strokeLinecap="round" strokeLinejoin="round" className="category__icon-svg">
    <ellipse cx="12" cy="5" rx="9" ry="3" />
    <path d="M21 12c0 1.66-4 3-9 3s-9-1.34-9-3" />
    <path d="M3 5v14c0 1.66 4 3 9 3s9-1.34 9-3V5" />
  </svg>
);
const MoreIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"
    strokeLinecap="round" strokeLinejoin="round" className="category__icon-svg">
    <circle cx="5" cy="12" r="1.5" />
    <circle cx="12" cy="12" r="1.5" />
    <circle cx="19" cy="12" r="1.5" />
  </svg>
);
const LockIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"
    strokeLinecap="round" strokeLinejoin="round" className="category__lock-icon" aria-hidden="true">
    <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
    <path d="M7 11V7a5 5 0 0 1 10 0v4" />
  </svg>
);

// ── Role → icon + query value mapping ─────────────────────────────────
// "match" is used to count how many jobs in the DB belong to this
// category (case-insensitive substring match against roleCategory,
// same param the /jobs page's own role filter already uses).
//
// Some of these are deliberately broad (e.g. "Consultant" matches
// "Marketing Cloud Consultant", "Service Cloud Consultant", etc. too)
// — that's fine for browse-by-category cards, but it does mean a
// single job can count toward more than one card. Keep that in mind
// if you ever need exact, non-overlapping totals.
const ROLE_DEFS: { label: string; match: string; icon: React.ReactNode }[] = [
  { label: "Salesforce Developer",   match: "Developer",         icon: <CodeIcon />        },
  { label: "Salesforce Admin",       match: "Administrator",     icon: <SettingsIcon />    },
  { label: "Salesforce Architect",   match: "Architect",         icon: <LayersIcon />      },
  { label: "Salesforce Consultant",  match: "Consultant",        icon: <CloudIcon />       },
  { label: "Marketing Cloud",        match: "Marketing Cloud",   icon: <MailIcon />        },
  { label: "Business Analyst",       match: "Business Analyst",  icon: <BarChartIcon />    },
  { label: "QA & Testing",           match: "QA",                icon: <CheckCircleIcon /> },
  { label: "DevOps & Release",       match: "DevOps",            icon: <TerminalIcon />    },
  { label: "Project & Program Mgmt", match: "Project Manager",   icon: <UsersIcon />       },
  { label: "CPQ",                    match: "CPQ",                icon: <TagIcon />         },
  { label: "Integration & MuleSoft", match: "Integration",       icon: <LinkIcon />        },
  { label: "Data & Analytics",       match: "Data",               icon: <DatabaseIcon />    },
];

const OTHER_LABEL = "Other Roles";

// ── Login modal ───────────────────────────────────────────────────────
function LoginModal({
  category,
  onLogin,
  onClose,
}: {
  category: string;
  onLogin: () => void;
  onClose: () => void;
}) {
  return (
    <div
      className="navbar__modal-overlay"
      role="dialog"
      aria-modal="true"
      aria-labelledby="cat-modal-title"
      onClick={onClose}
    >
      <div className="navbar__modal" onClick={(e) => e.stopPropagation()}>
        <div className="navbar__modal-icon" aria-hidden="true">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"
            strokeLinecap="round" strokeLinejoin="round">
            <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
            <path d="M7 11V7a5 5 0 0 1 10 0v4" />
          </svg>
        </div>
        <h2 id="cat-modal-title" className="navbar__modal-title">Login required</h2>
        <p className="navbar__modal-sub">
          Please log in to browse{" "}
          <strong>{category}</strong> jobs.
        </p>
        <div className="navbar__modal-actions">
          <button className="btn btn--primary" onClick={onLogin}>Go to Login</button>
          <button className="btn btn--ghost"   onClick={onClose}>Cancel</button>
        </div>
      </div>
    </div>
  );
}

// ── Component ─────────────────────────────────────────────────────────
export default function PopularCategories() {
  const router = useRouter();
  const [user,           setUser]           = useState<User | null>(null);
  const [showModal,      setShowModal]      = useState(false);
  const [activeCategory, setActiveCategory] = useState("");
  const [categories,     setCategories]     = useState<Category[]>(
    // Start with zero counts so layout doesn't jump once real data loads.
    // "Other Roles" is appended up front too (count fills in once the
    // overall total is known) so the grid size never shifts.
    [
      ...ROLE_DEFS.map(r => ({
        label: r.label,
        count: 0,
        icon:  r.icon,
        href:  `/jobs?role=${encodeURIComponent(r.match)}`,
      })),
      { label: OTHER_LABEL, count: 0, icon: <MoreIcon />, href: "/jobs" },
    ]
  );
  const [loading, setLoading] = useState(true);

  // Rehydrate user from localStorage on mount
  useEffect(() => {
    try {
      const raw = localStorage.getItem("tc_user");
      if (raw) setUser(JSON.parse(raw));
    } catch { /* ignore */ }
  }, []);

  // Fetch real job counts per category from the backend, then bucket
  // whatever's left over (jobs that didn't match any listed category)
  // into "Other Roles".
  useEffect(() => {
    (async () => {
      setLoading(true);
      try {
        const [categoryResults, overallRes] = await Promise.all([
          Promise.all(
            ROLE_DEFS.map(async (r) => {
              const params = new URLSearchParams({ role: r.match, limit: "1" });
              const res  = await fetch(`${API}/api/jobs?${params}`);
              const data = await res.json();
              return { label: r.label, count: res.ok ? (data.total ?? 0) : 0 };
            })
          ),
          fetch(`${API}/api/jobs?limit=1`).then(r => r.json()).catch(() => null),
        ]);

        const overallTotal: number = overallRes?.total ?? 0;
        const sumOfCategoryCounts = categoryResults.reduce((sum, r) => sum + r.count, 0);
        // Categories can overlap (see comment on ROLE_DEFS), so this is
        // an approximation, not an exact count — clamped at 0 so it
        // never shows a negative number if overlap pushes it below.
        const otherCount = Math.max(0, overallTotal - sumOfCategoryCounts);

        setCategories(prev =>
          prev.map(cat => {
            if (cat.label === OTHER_LABEL) return { ...cat, count: otherCount };
            const found = categoryResults.find(r => r.label === cat.label);
            return found ? { ...cat, count: found.count } : cat;
          })
        );
      } catch {
        // Silently keep zero counts if backend is unreachable —
        // cards still render and remain clickable.
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const handleCategoryClick = (
    e: React.MouseEvent<HTMLAnchorElement>,
    cat: Category
  ) => {
    if (!user) {
      e.preventDefault();
      setActiveCategory(cat.label);
      setShowModal(true);
      return;
    }
    // Logged in — let the anchor navigate normally to /jobs?role=...
    // ("Other Roles" just goes to /jobs with no filter, since there's
    // no backend concept of "role not in this list" to link to.)
  };

  return (
    <>
      <section className="categories" aria-labelledby="categories-heading">
        <div className="section__header">
          <span className="section__eyebrow">Browse by Role</span>
          <h2 id="categories-heading" className="section__title">
            Popular Categories
          </h2>
          <p className="section__subtitle">
            Explore jobs by the most in-demand Salesforce roles
          </p>
        </div>

        <div className="categories__grid">
          {categories.map((cat) => (
            <a
              key={cat.label}
              href={user ? cat.href : "#"}
              className={`category__card ${!user ? "category__card--locked" : ""}`}
              onClick={(e) => handleCategoryClick(e, cat)}
              aria-label={
                user
                  ? `Browse ${cat.label} jobs`
                  : `Login required to browse ${cat.label} jobs`
              }
            >
              <div className="category__icon-wrap" aria-hidden="true">
                {cat.icon}
              </div>
              <span className="category__label">{cat.label}</span>
              <span className="category__count">
                {loading ? "…" : `${cat.count} job${cat.count !== 1 ? "s" : ""}`}
              </span>

              {/* Show lock icon if not logged in, arrow if logged in */}
              {user ? (
                <span className="category__arrow" aria-hidden="true">→</span>
              ) : (
                <LockIcon />
              )}
            </a>
          ))}
        </div>

        {/* Hint shown only when logged out */}
        {!user && (
          <p className="categories__login-hint">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"
              strokeLinecap="round" strokeLinejoin="round"
              style={{ width: 14, height: 14, display: "inline", marginRight: 5 }} aria-hidden="true">
              <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
              <path d="M7 11V7a5 5 0 0 1 10 0v4" />
            </svg>
            <a href="/login" className="categories__login-link">Log in</a>
            {" "}or{" "}
            <a href="/register" className="categories__login-link">create a free account</a>
            {" "}to browse jobs by category.
          </p>
        )}
      </section>

      {showModal && (
        <LoginModal
          category={activeCategory}
          onLogin={() => { setShowModal(false); router.push("/login"); }}
          onClose={() => setShowModal(false)}
        />
      )}
    </>
  );
}