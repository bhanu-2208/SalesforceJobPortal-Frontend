'use client'
import { useState, useEffect, useCallback } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { getValidToken } from "@/lib/api";
import { resolveAvatarSrc,resolveResumeUrl  } from "@/components/avatarPresets";
import CandidateDetailModal from "@/components/Candidatedetailmodal";
import RankByJDModal from "@/components/RankByJDModal";

const API = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000";

// ── Types ─────────────────────────────────────────────────────────────
interface Candidate {
  userId: string;
  name: string;
  email: string;
  avatar?: { kind: "preset" | "upload"; value: string };
  headline?: string;
  currentDesignation?: string;
  currentCompany?: string;
  location?: { city?: string; state?: string; country?: string };
  totalExperienceYears?: number;
  totalExperienceMonths?: number;
  noticePeriod?: string;
  employmentType?: string;
  expectedSalaryLPA?: number;
  salesforceSkills?: string[];
  skills?: string[];
  trailheadRank?: string;
  willingToRelocate?: boolean;
  resume?: { fileName?: string; url?: string };
  profileCompleteness?: number;
  // Present only when a "Rank by JD" result is active
  matchScore?: number;
  matchedSkills?: string[];
  missingSkills?: string[];
}

interface User { id: string; name: string; email: string; role: string; }

interface JdRequirements {
  roleTitle?: string;
  requiredSkills: string[];
  niceToHaveSkills: string[];
  minExperienceYears: number;
  preferredCertifications: string[];
  responsibilityKeywords: string[];
}

const SALESFORCE_SKILL_OPTIONS = [
  "Apex", "LWC", "Aura", "Flow", "Visualforce", "SOQL", "Integration",
  "Data Cloud", "CPQ", "Marketing Cloud", "Service Cloud", "Sales Cloud",
  "Experience Cloud", "MuleSoft", "Admin", "DevOps",
];

const NOTICE_OPTIONS = [
  { value: "immediate", label: "Immediate" },
  { value: "15_days", label: "15 days" },
  { value: "30_days", label: "30 days" },
  { value: "60_days", label: "60 days" },
  { value: "90_days", label: "90 days" },
];

const EXPERIENCE_BUCKETS = [
  { label: "0-1 Years", min: 0, max: 1 },
  { label: "1-3 Years", min: 1, max: 3 },
  { label: "3-6 Years", min: 3, max: 6 },
  { label: "6-10 Years", min: 6, max: 10 },
  { label: "10+ Years", min: 10, max: undefined },
];

const PAGE_SIZE = 12;

function initials(name?: string): string {
  if (!name) return "??";
  return name.split(" ").map((w) => w[0]).join("").toUpperCase().slice(0, 2);
}

function noticeLabel(np?: string): string {
  return NOTICE_OPTIONS.find((n) => n.value === np)?.label ?? "—";
}

function scoreColor(score: number): string {
  if (score >= 75) return "#38A169";
  if (score >= 50) return "#ED8936";
  return "#E53E3E";
}

function authHeaders(): Record<string, string> {
  const token = typeof window !== "undefined" ? localStorage.getItem("tc_token") : null;
  return token ? { Authorization: `Bearer ${token}` } : {};
}

// ── Candidate Card ────────────────────────────────────────────────────
function CandidateCard({
  candidate,
  saved,
  onToggleSave,
  onView,
}: {
  candidate: Candidate;
  saved: boolean;
  onToggleSave: (id: string) => void;
  onView: (id: string) => void;
}) {
  const skills = [...(candidate.salesforceSkills ?? []), ...(candidate.skills ?? [])];
  const hasScore = typeof candidate.matchScore === "number";

  return (
    <div className="job-card cand-card">
      <div className="job-card__header">
        <div className="job-card__logo" style={{ borderRadius: "50%", overflow: "hidden" }}>
          {candidate.avatar ? (
            <img src={resolveAvatarSrc(candidate.avatar, API, 44)} alt="" className="job-card__logo-img" />
          ) : (
            initials(candidate.name)
          )}
        </div>
        <div className="job-card__meta">
          <h3 className="job-card__title">{candidate.name}</h3>
          <span className="job-card__company">
            {candidate.currentDesignation || candidate.headline || "Salesforce Professional"}
            {candidate.currentCompany ? ` @ ${candidate.currentCompany}` : ""}
          </span>
        </div>

        {hasScore ? (
          <div className="cand-match-badge" style={{ "--score-color": scoreColor(candidate.matchScore!) } as React.CSSProperties} title="Match score against the pasted job description">
            {candidate.matchScore}%
          </div>
        ) : (
          <button
            className={`job-card__save-btn ${saved ? "job-card__save-btn--saved" : ""}`}
            onClick={() => onToggleSave(candidate.userId)}
            aria-label={saved ? "Remove from saved" : "Save candidate"}
            title={saved ? "Saved — click to remove" : "Save for later"}
          >
            <svg viewBox="0 0 24 24" fill={saved ? "currentColor" : "none"} stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ width: 15, height: 15 }}>
              <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z" />
            </svg>
          </button>
        )}
      </div>

      <div className="job-card__info">
        {(candidate.location?.city || candidate.location?.country) && (
          <span className="job-card__info-item">
            📍 {[candidate.location?.city, candidate.location?.country].filter(Boolean).join(", ")}
          </span>
        )}
        <span className="job-card__info-item">
          💼 {candidate.totalExperienceYears ?? 0}y {candidate.totalExperienceMonths ?? 0}m
        </span>
        <span className="job-card__info-item">⏳ {noticeLabel(candidate.noticePeriod)}</span>
        {candidate.willingToRelocate && <span className="badge badge--green">Open to relocate</span>}
      </div>

      {/* When ranked: show matched/missing JD skills instead of the generic skill list */}
      {hasScore ? (
        <div className="job-card__skills">
          {(candidate.matchedSkills ?? []).map((s) => <span key={`m-${s}`} className="skill-tag ats-tag--matched">{s}</span>)}
          {(candidate.missingSkills ?? []).slice(0, 3).map((s) => <span key={`x-${s}`} className="skill-tag ats-tag--missing">{s}</span>)}
        </div>
      ) : (
        skills.length > 0 && (
          <div className="job-card__skills">
            {skills.slice(0, 5).map((s) => <span key={s} className="skill-tag">{s}</span>)}
            {skills.length > 5 && <span className="skill-tag">+{skills.length - 5}</span>}
          </div>
        )
      )}

      <div className="job-card__actions">
        <button className="btn btn--primary btn--sm" onClick={() => onView(candidate.userId)}>View Profile</button>
        {candidate.resume?.url && (
          <a href={resolveResumeUrl(candidate.resume.url, API)} target="_blank" rel="noreferrer" className="btn btn--ghost btn--sm">
            📄 Resume
          </a>
        )}
        {hasScore && (
          <button
            className={`job-card__save-btn ${saved ? "job-card__save-btn--saved" : ""}`}
            onClick={() => onToggleSave(candidate.userId)}
            aria-label={saved ? "Remove from saved" : "Save candidate"}
            style={{ marginLeft: "auto" }}
          >
            <svg viewBox="0 0 24 24" fill={saved ? "currentColor" : "none"} stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ width: 15, height: 15 }}>
              <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z" />
            </svg>
          </button>
        )}
      </div>
    </div>
  );
}

// ── Filter Sidebar ────────────────────────────────────────────────────
function CandidateFilterSidebar({
  filters,
  onChange,
  onClear,
}: {
  filters: any;
  onChange: (k: string, v: any) => void;
  onClear: () => void;
}) {
  const toggleSkill = (skill: string) => {
    const current: string[] = filters.skills;
    onChange("skills", current.includes(skill) ? current.filter((s) => s !== skill) : [...current, skill]);
  };

  return (
    <aside className="jobs-sidebar">
      <div className="jobs-sidebar__header">
        <span className="jobs-sidebar__title">Filters</span>
        <button className="jobs-sidebar__clear" onClick={onClear}>Clear all</button>
      </div>

      <div className="jobs-sidebar__group">
        <label className="jobs-sidebar__label">Experience</label>
        {EXPERIENCE_BUCKETS.map((b) => (
          <label key={b.label} className="jobs-sidebar__check">
            <input
              type="radio"
              name="expBucket"
              checked={filters.expBucket === b.label}
              onChange={() => onChange("expBucket", filters.expBucket === b.label ? "" : b.label)}
            />
            {b.label}
          </label>
        ))}
      </div>

      <div className="jobs-sidebar__group">
        <label className="jobs-sidebar__label">Salesforce Skills</label>
        <div className="cand-skill-chips">
          {SALESFORCE_SKILL_OPTIONS.map((s) => (
            <button
              key={s}
              type="button"
              className={`skill-tag cand-skill-chip ${filters.skills.includes(s) ? "cand-skill-chip--active" : ""}`}
              onClick={() => toggleSkill(s)}
            >
              {s}
            </button>
          ))}
        </div>
      </div>

      <div className="jobs-sidebar__group">
        <label className="jobs-sidebar__label">Notice Period</label>
        {NOTICE_OPTIONS.map((n) => (
          <label key={n.value} className="jobs-sidebar__check">
            <input
              type="radio"
              name="noticePeriod"
              checked={filters.noticePeriod === n.value}
              onChange={() => onChange("noticePeriod", filters.noticePeriod === n.value ? "" : n.value)}
            />
            {n.label}
          </label>
        ))}
      </div>

      <div className="jobs-sidebar__group">
        <label className="jobs-sidebar__label">Country</label>
        <select className="feedback__select" value={filters.country} onChange={(e) => onChange("country", e.target.value)}>
          <option value="">All Countries</option>
          {["India", "USA", "UK", "Germany", "Australia", "Canada"].map((c) => <option key={c}>{c}</option>)}
        </select>
      </div>

      <div className="jobs-sidebar__group">
        <label className="jobs-sidebar__check">
          <input type="checkbox" checked={filters.relocate} onChange={(e) => onChange("relocate", e.target.checked)} />
          Open to relocation only
        </label>
        <label className="jobs-sidebar__check">
          <input type="checkbox" checked={filters.hasResume} onChange={(e) => onChange("hasResume", e.target.checked)} />
          Has resume uploaded
        </label>
      </div>
    </aside>
  );
}

// ── Ranking banner ────────────────────────────────────────────────────
function RankingBanner({ requirements, truncated, count, onClear }: { requirements: JdRequirements; truncated: boolean; count: number; onClear: () => void }) {
  return (
    <div className="cand-ranking-banner">
      <div>
        <p className="cand-ranking-banner__title">
          🎯 Ranking {count} candidate{count !== 1 ? "s" : ""} against: {requirements.roleTitle || "this job description"}
        </p>
        <div className="job-card__skills" style={{ marginTop: "0.5rem" }}>
          {requirements.requiredSkills.map((s) => <span key={s} className="skill-tag">{s}</span>)}
          {requirements.minExperienceYears > 0 && <span className="badge badge--blue">{requirements.minExperienceYears}+ yrs required</span>}
        </div>
        {truncated && (
          <p className="cand-ranking-banner__note">
            Showing the first {count} matching candidates — narrow your filters for a more complete ranking.
          </p>
        )}
      </div>
      <button className="btn btn--ghost btn--sm" onClick={onClear}>Clear Ranking</button>
    </div>
  );
}

// ── Main Page ─────────────────────────────────────────────────────────
export default function CandidatesPage() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [user, setUser] = useState<User | null>(null);
  const [authChecked, setAuthChecked] = useState(false);

  const [candidates, setCandidates] = useState<Candidate[]>([]);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [savedIds, setSavedIds] = useState<Set<string>>(new Set());
  const [showSavedOnly, setShowSavedOnly] = useState(false);
  const [selectedCandidateId, setSelectedCandidateId] = useState<string | null>(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [showRankModal, setShowRankModal] = useState(false);

  // ── Ranking state — separate from the normal search results ──────
  const [rankedAll, setRankedAll] = useState<Candidate[] | null>(null);
  const [rankedRequirements, setRankedRequirements] = useState<JdRequirements | null>(null);
  const [rankedTruncated, setRankedTruncated] = useState(false);
  const rankingActive = rankedAll !== null;

  const [filters, setFilters] = useState({
    q: searchParams.get("q") ?? "",
    skills: [] as string[],
    expBucket: "",
    noticePeriod: "",
    employmentType: "",
    country: "",
    relocate: false,
    hasResume: false,
    page: 1,
  });

  useEffect(() => {
    try {
      const raw = localStorage.getItem("tc_user");
      if (raw) setUser(JSON.parse(raw));
    } catch {}
    setAuthChecked(true);
  }, []);

  const fetchSavedIds = useCallback(async () => {
    const token = await getValidToken();
    if (!token) return;
    try {
      const res = await fetch(`${API}/api/saved-candidates/ids`, { headers: { Authorization: `Bearer ${token}` } });
      const data = await res.json();
      if (data.success) setSavedIds(new Set(data.data));
    } catch {}
  }, []);

  useEffect(() => {
    if (user?.role === "admin" || user?.role === "recruiter") fetchSavedIds();
  }, [user, fetchSavedIds]);

  // Builds the query params shared by both the normal search AND the
  // rank-by-JD request, so ranking always respects whatever filters
  // are currently active.
  const buildQueryParams = useCallback(() => {
    const params = new URLSearchParams();
    if (filters.q) params.set("q", filters.q);
    if (filters.skills.length) params.set("skills", filters.skills.join(","));
    if (filters.noticePeriod) params.set("noticePeriod", filters.noticePeriod);
    if (filters.country) params.set("country", filters.country);
    if (filters.relocate) params.set("relocate", "true");
    if (filters.hasResume) params.set("hasResume", "true");
    if (filters.expBucket) {
      const bucket = EXPERIENCE_BUCKETS.find((b) => b.label === filters.expBucket);
      if (bucket) {
        params.set("minExp", String(bucket.min));
        if (bucket.max !== undefined) params.set("maxExp", String(bucket.max));
      }
    }
    return params;
  }, [filters]);

  const fetchCandidates = useCallback(async () => {
    if (!(user?.role === "admin" || user?.role === "recruiter")) return;
    if (rankingActive) return; // ranking has its own data source — don't overwrite it
    setLoading(true);
    setError("");
    try {
      const token = await getValidToken();
      const params = buildQueryParams();
      params.set("page", String(filters.page));
      params.set("limit", String(PAGE_SIZE));

      const res = await fetch(`${API}/api/candidates?${params}`, {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message);
      setCandidates(data.data);
      setTotal(data.total);
      setTotalPages(data.totalPages);
    } catch (e: any) {
      setError(e.message ?? "Failed to load candidates.");
    } finally {
      setLoading(false);
    }
  }, [filters, user, rankingActive, buildQueryParams]);

  useEffect(() => { fetchCandidates(); }, [fetchCandidates]);

  const setFilter = (k: string, v: any) => setFilters((p) => ({ ...p, [k]: v, page: 1 }));
  const clearFilters = () =>
    setFilters({ q: "", skills: [], expBucket: "", noticePeriod: "", employmentType: "", country: "", relocate: false, hasResume: false, page: 1 });

  const handleToggleSave = async (candidateId: string) => {
    const token = await getValidToken();
    if (!token) return;
    const isSaved = savedIds.has(candidateId);

    setSavedIds((prev) => {
      const next = new Set(prev);
      isSaved ? next.delete(candidateId) : next.add(candidateId);
      return next;
    });

    try {
      await fetch(`${API}/api/saved-candidates/${candidateId}`, {
        method: isSaved ? "DELETE" : "POST",
        headers: { Authorization: `Bearer ${token}` },
      });
    } catch {
      setSavedIds((prev) => {
        const next = new Set(prev);
        isSaved ? next.add(candidateId) : next.delete(candidateId);
        return next;
      });
    }
  };

  const handleRanked = (result: { data: Candidate[]; requirements: JdRequirements; truncated: boolean }) => {
    setRankedAll(result.data);
    setRankedRequirements(result.requirements);
    setRankedTruncated(result.truncated);
    setShowRankModal(false);
    setShowSavedOnly(false);
    setFilters((p) => ({ ...p, page: 1 }));
  };

  const clearRanking = () => {
    setRankedAll(null);
    setRankedRequirements(null);
    setRankedTruncated(false);
    setFilters((p) => ({ ...p, page: 1 }));
  };

  // ── Derive what's actually shown, whether ranking is active or not ──
  const sourceList = rankingActive ? rankedAll! : candidates;
  const filteredBySaved = showSavedOnly ? sourceList.filter((c) => savedIds.has(c.userId)) : sourceList;

  const visibleCandidates = rankingActive
    ? filteredBySaved.slice((filters.page - 1) * PAGE_SIZE, filters.page * PAGE_SIZE)
    : filteredBySaved;

  const effectiveTotalPages = rankingActive ? Math.max(1, Math.ceil(filteredBySaved.length / PAGE_SIZE)) : totalPages;
  const effectiveTotal = rankingActive ? filteredBySaved.length : total;

  // ── Access gate ──────────────────────────────────────────────────
  if (authChecked && !(user?.role === "admin" || user?.role === "recruiter")) {
    return (
      <>
        <Navbar />
        <div className="jobs-page">
          <div className="jobs-body">
            <div className="jobs-empty">
              <div className="jobs-empty__icon">🔒</div>
              <h3>Recruiter access only</h3>
              <p>This page is only available to recruiter and admin accounts.</p>
              <button className="btn btn--ghost" onClick={() => router.push("/jobs")}>Back to Jobs</button>
            </div>
          </div>
        </div>
        <Footer />
      </>
    );
  }

  return (
    <>
      <Navbar />
      <div className="jobs-page">
        {/* ── Page Header ── */}
        <div className="jobs-hero">
          <div className="jobs-hero__inner">
            <div>
              <h1 className="jobs-hero__title">Find Candidates</h1>
              <p className="jobs-hero__sub">
                {rankingActive
                  ? `Ranked by job description match`
                  : total > 0 ? `${total} Salesforce professionals` : "Search all candidate profiles"}
              </p>
            </div>
            <div style={{ display: "flex", gap: "0.625rem", flexWrap: "wrap" }}>
              <button
                className="btn btn--primary jobs-hero__post-btn"
                onClick={() => setShowRankModal(true)}
              >
                🎯 Rank by Job Description
              </button>
              <button
                className={`btn jobs-hero__post-btn ${showSavedOnly ? "btn--primary" : "btn--ghost"}`}
                style={!showSavedOnly ? { background: "rgba(255,255,255,0.15)", color: "#ffffff", borderColor: "rgba(255,255,255,0.4)" } : undefined}
                onClick={() => setShowSavedOnly((v) => !v)}
              >
                <svg viewBox="0 0 24 24" fill={showSavedOnly ? "currentColor" : "none"} stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ width: 16, height: 16 }}>
                  <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z" />
                </svg>
                {showSavedOnly ? `Saved (${savedIds.size})` : "Show Saved Only"}
              </button>
            </div>
          </div>

          {/* Global search bar — disabled while ranking is active since
              ranking already fixed the pool being scored */}
          {!rankingActive && (
            <div className="jobs-hero__search">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ width: 18, height: 18, color: "#5E6E82", flexShrink: 0 }}><circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" /></svg>
              <input
                className="jobs-hero__search-input"
                type="text"
                placeholder="Search by name, skill, designation, or company..."
                value={filters.q}
                onChange={(e) => setFilter("q", e.target.value)}
              />
              {filters.q && <button className="jobs-hero__clear-btn" onClick={() => setFilter("q", "")}>✕</button>}
            </div>
          )}
        </div>

        {/* ── Body ── */}
        <div className="jobs-body">
          {rankingActive && rankedRequirements && (
            <RankingBanner
              requirements={rankedRequirements}
              truncated={rankedTruncated}
              count={rankedAll!.length}
              onClear={clearRanking}
            />
          )}

          {!rankingActive && (
            <button className="jobs-filter-toggle" onClick={() => setSidebarOpen((p) => !p)}>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ width: 16, height: 16 }}><line x1="4" y1="6" x2="20" y2="6" /><line x1="8" y1="12" x2="16" y2="12" /><line x1="11" y1="18" x2="13" y2="18" /></svg>
              {sidebarOpen ? "Hide Filters" : "Show Filters"}
            </button>
          )}

          <div className={`jobs-layout ${sidebarOpen ? "jobs-layout--open" : ""} ${rankingActive ? "jobs-layout--full" : ""}`}>
            {!rankingActive && (
              <CandidateFilterSidebar filters={filters} onChange={setFilter} onClear={clearFilters} />
            )}

            <main className="jobs-main">
              {loading && !rankingActive ? (
                <div className="jobs-loading">
                  {[...Array(6)].map((_, i) => <div key={i} className="jobs-skeleton" />)}
                </div>
              ) : error && !rankingActive ? (
                <div className="jobs-error">
                  <p>⚠️ {error}</p>
                  <button className="btn btn--ghost" onClick={fetchCandidates}>Retry</button>
                </div>
              ) : visibleCandidates.length === 0 ? (
                <div className="jobs-empty">
                  <div className="jobs-empty__icon">{showSavedOnly ? "🔖" : "🔍"}</div>
                  <h3>{showSavedOnly ? "No saved candidates yet" : "No candidates found"}</h3>
                  <p>{showSavedOnly ? "Bookmark candidates from the search results to see them here." : "Try adjusting your filters or search term."}</p>
                  {!showSavedOnly && !rankingActive && <button className="btn btn--ghost" onClick={clearFilters}>Clear Filters</button>}
                </div>
              ) : (
                <>
                  <div className="jobs-grid">
                    {visibleCandidates.map((c) => (
                      <CandidateCard
                        key={c.userId}
                        candidate={c}
                        saved={savedIds.has(c.userId)}
                        onToggleSave={handleToggleSave}
                        onView={setSelectedCandidateId}
                      />
                    ))}
                  </div>

                  {effectiveTotalPages > 1 && (
                    <div className="jobs-pagination">
                      <button className="jobs-page-btn" disabled={filters.page <= 1} onClick={() => setFilters((p) => ({ ...p, page: p.page - 1 }))}>← Prev</button>
                      <span className="jobs-page-info">Page {filters.page} of {effectiveTotalPages}</span>
                      <button className="jobs-page-btn" disabled={filters.page >= effectiveTotalPages} onClick={() => setFilters((p) => ({ ...p, page: p.page + 1 }))}>Next →</button>
                    </div>
                  )}
                </>
              )}
            </main>
          </div>
        </div>
      </div>

      <Footer />

      {selectedCandidateId && (
        <CandidateDetailModal
          userId={selectedCandidateId}
          saved={savedIds.has(selectedCandidateId)}
          onClose={() => setSelectedCandidateId(null)}
          onToggleSave={handleToggleSave}
        />
      )}

      {showRankModal && (
        <RankByJDModal
          onClose={() => setShowRankModal(false)}
          onRanked={handleRanked}
          buildQueryParams={buildQueryParams}
          authHeaders={authHeaders}
          apiBase={API}
        />
      )}
    </>
  );
}