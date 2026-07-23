'use client'
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";

const API = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000";

interface User {
  id: string;
  name: string;
  email: string;
  role: string;
}

interface Stats {
  liveJobs:  number;
  companies: number;
  cities:    number;
}

// ── Login required modal ─────────────────────────────────────────────
function LoginModal({
  onLogin,
  onClose,
}: {
  onLogin: () => void;
  onClose: () => void;
}) {
  return (
    <div
      className="navbar__modal-overlay"
      role="dialog"
      aria-modal="true"
      aria-labelledby="hero-modal-title"
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
        <h2 id="hero-modal-title" className="navbar__modal-title">Login required</h2>
        <p className="navbar__modal-sub">Please log in to search Salesforce jobs.</p>
        <div className="navbar__modal-actions">
          <button className="btn btn--primary" onClick={onLogin}>Go to Login</button>
          <button className="btn btn--ghost"   onClick={onClose}>Cancel</button>
        </div>
      </div>
    </div>
  );
}

export default function HeroSection() {
  const router = useRouter();

  const [user,       setUser]       = useState<User | null>(null);
  const [query,      setQuery]      = useState("");
  const [location,   setLocation]   = useState("");
  const [showModal,  setShowModal]  = useState(false);
  const [stats,      setStats]      = useState<Stats>({ liveJobs: 0, companies: 0, cities: 0 });

  // Rehydrate user from localStorage
  useEffect(() => {
    try {
      const raw = localStorage.getItem("tc_user");
      if (raw) setUser(JSON.parse(raw));
    } catch { /* ignore */ }
  }, []);

  // Fetch real stats — total jobs, companies, and distinct locations
  useEffect(() => {
    (async () => {
      try {
        const [jobsRes, companiesRes] = await Promise.all([
          fetch(`${API}/api/jobs?limit=1`),
          fetch(`${API}/api/companies`),
        ]);
        const jobsData      = await jobsRes.json();
        const companiesData = await companiesRes.json();

        // Count distinct cities from the job list we already fetch on the page —
        // fall back gracefully to 0 if the endpoint shape differs.
        setStats({
          liveJobs:  jobsRes.ok ? (jobsData.total ?? 0) : 0,
          companies: companiesRes.ok ? (companiesData.data?.length ?? companiesData.total ?? 0) : 0,
          cities:    0, // filled in below if job data includes locations
        });

        // Second pass — pull a larger page just to count unique locations client-side.
        // Cheap enough for a homepage stat and avoids needing a dedicated backend endpoint.
        const bigRes  = await fetch(`${API}/api/jobs?limit=100`);
        const bigData = await bigRes.json();
        if (bigRes.ok && Array.isArray(bigData.data)) {
          const uniqueLocations = new Set(
            bigData.data.map((j: any) => j.location).filter(Boolean)
          );
          setStats(prev => ({ ...prev, cities: uniqueLocations.size }));
        }
      } catch {
        // Keep zeros if backend is unreachable — hero still renders fine
      }
    })();
  }, []);

  // ── Search handlers ──────────────────────────────────────────────
  const runSearch = () => {
    if (!user) {
      setShowModal(true);
      return;
    }

    const params = new URLSearchParams();
    if (query.trim())    params.set("q", query.trim());
    if (location.trim()) params.set("country", location.trim());

    const qs = params.toString();
    router.push(qs ? `/jobs?${qs}` : "/jobs");
  };

  const handleSearchClick = () => runSearch();

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      e.preventDefault();
      runSearch();
    }
  };

  const handleQuickTag = (tag: string) => {
    if (!user) {
      setShowModal(true);
      return;
    }

    // "Remote" is a work mode, everything else is treated as a role keyword
    if (tag === "Remote") {
      router.push("/jobs?workMode=Remote");
    } else {
      router.push(`/jobs?role=${encodeURIComponent(tag)}`);
    }
  };

  const formatStat = (n: number): string => {
    if (n === 0) return "0";
    if (n >= 1000) return `${(n / 1000).toFixed(1)}k+`;
    return `${n}+`;
  };

  return (
    <>
      <section className="hero">
        {/* Background cloud decoration */}
        <div className="hero__bg-cloud" aria-hidden="true">
          <svg viewBox="0 0 200 134" xmlns="http://www.w3.org/2000/svg">
            <path
              d="M82.8 19.4C89.6 12 99.2 7.6 109.8 7.6c14.6 0 27.2 8.2 34 20.2 5.8-2.6 12.2-4 19-4 26.2 0 47.4 21.4 47.4 47.8S176.8 119.4 149.2 119.4H41C18.4 119.4 0 101 0 78.2c0-21 15.6-38.4 36-41-.2-1.8-.4-3.4-.4-5.2C35.6 14.4 50 0 67.8 0c6.6 0 12.8 2 18 5.4"
              fill="currentColor"
            />
          </svg>
        </div>

        <div className="hero__content">
          <div className="hero__badge">
            <span className="hero__badge-dot" />
            {stats.liveJobs > 0 ? `${formatStat(stats.liveJobs)} Salesforce Jobs Live` : "Salesforce Jobs Live"}
          </div>

          <h1 className="hero__title">
            Find Your Dream
            <span className="hero__title-highlight"> Salesforce </span>
            Job
          </h1>

          <p className="hero__subtitle">
            The #1 job board dedicated to Salesforce professionals. Developers,
            Admins, Architects and Consultants — your next role is here.
          </p>

          {/* Search bar */}
          <div className="hero__search">
            <div className="hero__search-icon" aria-hidden="true">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="11" cy="11" r="8" />
                <line x1="21" y1="21" x2="16.65" y2="16.65" />
              </svg>
            </div>
            <input
              className="hero__search-input"
              type="text"
              placeholder="Job title, skill, or company..."
              aria-label="Search jobs"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={handleKeyDown}
            />
            <select
              className="hero__search-select"
              aria-label="Filter by location"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
            >
              <option value="">All Locations</option>
              <option value="India">India</option>
              <option value="USA">USA</option>
              <option value="UK">UK</option>
              <option value="Germany">Germany</option>
              <option value="Remote">Remote</option>
            </select>
            <button className="hero__search-btn" type="button" onClick={handleSearchClick}>
              Search Jobs
            </button>
          </div>

          {/* Quick filters */}
          <div className="hero__quick-filters">
            <span className="hero__quick-label">Popular:</span>
            {["Developer", "Admin", "Architect", "Marketing Cloud", "Remote"].map((tag) => (
              <button
                key={tag}
                className="hero__quick-tag"
                type="button"
                onClick={() => handleQuickTag(tag)}
              >
                {tag}
              </button>
            ))}
          </div>

          {/* Stats */}
          <div className="hero__stats">
            {[
              { value: formatStat(stats.liveJobs),  label: "Live Jobs" },
              { value: formatStat(stats.companies), label: "Companies" },
              { value: formatStat(stats.cities),    label: "Cities" },
            ].map((stat) => (
              <div key={stat.label} className="hero__stat">
                <span className="hero__stat-value">{stat.value}</span>
                <span className="hero__stat-label">{stat.label}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {showModal && (
        <LoginModal
          onLogin={() => { setShowModal(false); router.push("/login"); }}
          onClose={() => setShowModal(false)}
        />
      )}
    </>
  );
}