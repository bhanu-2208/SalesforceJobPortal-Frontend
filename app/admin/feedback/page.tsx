'use client'
import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { getValidToken } from "@/lib/api";

const API = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000";

interface FeedbackItem {
  _id: string;
  name: string;
  email: string;
  role?: string;
  category: string;
  rating: number;
  message: string;
  status: "new" | "reviewed" | "resolved";
  createdAt: string;
}

interface User { id: string; name: string; email: string; role: string; }

function timeAgo(date: string): string {
  const diff = Date.now() - new Date(date).getTime();
  const days = Math.floor(diff / 86400000);
  const hours = Math.floor(diff / 3600000);
  if (days === 0) return hours <= 1 ? "Just now" : `${hours}h ago`;
  if (days === 1) return "Yesterday";
  return `${days} days ago`;
}

function initials(name: string): string {
  return name.split(" ").map(w => w[0]).join("").toUpperCase().slice(0, 2);
}

function Stars({ rating }: { rating: number }) {
  return (
    <div className="fbd-stars" aria-label={`${rating} out of 5`}>
      {[1, 2, 3, 4, 5].map(i => (
        <svg key={i} viewBox="0 0 24 24" fill={i <= rating ? "currentColor" : "none"}
          stroke="currentColor" strokeWidth="1.5" className="fbd-star">
          <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
        </svg>
      ))}
    </div>
  );
}

function FeedbackCard({
  item,
  onStatusChange,
  onDelete,
}: {
  item: FeedbackItem;
  onStatusChange: (id: string, status: string) => void;
  onDelete: (id: string) => void;
}) {
  const [updating, setUpdating] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const handleStatus = async (status: string) => {
    setUpdating(true);
    await onStatusChange(item._id, status);
    setUpdating(false);
  };

  const handleDelete = async () => {
    if (!confirm("Delete this feedback permanently?")) return;
    setDeleting(true);
    await onDelete(item._id);
  };

  return (
    <div className={`fbd-card fbd-card--${item.status} ${deleting ? "fbd-card--removing" : ""}`}>
      <div className="fbd-card__status-bar" />

      <div className="fbd-card__body">
        <div className="fbd-card__header">
          <div className="fbd-avatar">{initials(item.name)}</div>
          <div className="fbd-identity">
            <span className="fbd-name">{item.name}</span>
            <span className="fbd-email">{item.email}</span>
          </div>
          <span className={`fbd-status-pill fbd-status-pill--${item.status}`}>
            {item.status}
          </span>
        </div>

        <div className="fbd-card__tags">
          <Stars rating={item.rating} />
          <span className="fbd-tag fbd-tag--category">{item.category}</span>
          {item.role && <span className="fbd-tag fbd-tag--role">{item.role}</span>}
          <span className="fbd-time">{timeAgo(item.createdAt)}</span>
        </div>

        <p className="fbd-message">{item.message}</p>

        <div className="fbd-card__footer">
          <select
            className="fbd-status-select"
            value={item.status}
            disabled={updating}
            onChange={(e) => handleStatus(e.target.value)}
          >
            <option value="new">🔵 New</option>
            <option value="reviewed">⚪ Reviewed</option>
            <option value="resolved">🟢 Resolved</option>
          </select>
          <button className="fbd-delete-btn" onClick={handleDelete} disabled={deleting}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"
              strokeLinecap="round" strokeLinejoin="round" style={{width:13,height:13}}>
              <polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14H6L5 6"/>
              <path d="M10 11v6"/><path d="M14 11v6"/>
            </svg>
            {deleting ? "Deleting…" : "Delete"}
          </button>
        </div>
      </div>
    </div>
  );
}

export default function AdminFeedbackPage() {
  const router = useRouter();
  const [user,         setUser]        = useState<User | null>(null);
  const [feedback,     setFeedback]    = useState<FeedbackItem[]>([]);
  const [total,        setTotal]       = useState(0);
  const [totalPages,   setTotalPages]  = useState(1);
  const [page,         setPage]        = useState(1);
  const [statusFilter, setStatusFilter]= useState("");
  const [loading,      setLoading]     = useState(true);
  const [error,        setError]       = useState("");
  const [checkingAuth, setCheckingAuth]= useState(true);

  useEffect(() => {
    (async () => {
      try {
        const raw = localStorage.getItem("tc_user");
        if (!raw) { router.push("/login"); return; }
        const parsed: User = JSON.parse(raw);
        if (parsed.role !== "admin") { router.push("/"); return; }
        setUser(parsed);
      } catch {
        router.push("/login");
      } finally {
        setCheckingAuth(false);
      }
    })();
  }, [router]);

  const fetchFeedback = useCallback(async () => {
    setLoading(true); setError("");
    try {
      const token = await getValidToken();
      if (!token) { router.push("/login"); return; }

      const params = new URLSearchParams({ page: String(page), limit: "9" });
      if (statusFilter) params.set("status", statusFilter);

      const res  = await fetch(`${API}/api/feedback?${params}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message ?? "Failed to load feedback.");

      setFeedback(data.data);
      setTotal(data.total);
      setTotalPages(data.totalPages);
    } catch (e: any) {
      setError(e.message ?? "Failed to load feedback.");
    } finally {
      setLoading(false);
    }
  }, [page, statusFilter, router]);

  useEffect(() => {
    if (!checkingAuth && user) fetchFeedback();
  }, [checkingAuth, user, fetchFeedback]);

  const handleStatusChange = async (id: string, status: string) => {
    const token = await getValidToken();
    if (!token) return;
    try {
      await fetch(`${API}/api/feedback/${id}/status`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ status }),
      });
      setFeedback(prev => prev.map(f => f._id === id ? { ...f, status: status as any } : f));
    } catch {}
  };

  const handleDelete = async (id: string) => {
    const token = await getValidToken();
    if (!token) return;
    try {
      await fetch(`${API}/api/feedback/${id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });
      setFeedback(prev => prev.filter(f => f._id !== id));
      setTotal(prev => prev - 1);
    } catch {}
  };

  if (checkingAuth) return null;

  const avgRating = feedback.length > 0
    ? (feedback.reduce((sum, f) => sum + f.rating, 0) / feedback.length).toFixed(1)
    : "—";
  const newCount = feedback.filter(f => f.status === "new").length;

  return (
    <>
      <Navbar />
      <div className="fbd-page">

        {/* Hero */}
        <div className="fbd-hero">
          <div className="fbd-container">
            <div className="fbd-hero__badge">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"
                strokeLinecap="round" strokeLinejoin="round" style={{width:14,height:14}}>
                <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
              </svg>
              Admin Only
            </div>
            <h1 className="fbd-hero__title">Feedback Dashboard</h1>
            <p className="fbd-hero__sub">
              {total} submission{total !== 1 ? "s" : ""} from your community
            </p>

            {/* Stats */}
            <div className="fbd-stats">
              <div className="fbd-stat">
                <span className="fbd-stat__value">{total}</span>
                <span className="fbd-stat__label">Total</span>
              </div>
              <div className="fbd-stat">
                <span className="fbd-stat__value">{newCount}</span>
                <span className="fbd-stat__label">New</span>
              </div>
              <div className="fbd-stat">
                <span className="fbd-stat__value">{avgRating}</span>
                <span className="fbd-stat__label">Avg Rating</span>
              </div>
            </div>
          </div>
        </div>

        <div className="fbd-container fbd-body">
          {/* Filter toolbar */}
          <div className="fbd-toolbar">
            <span className="fbd-toolbar__label">Filter:</span>
            {["", "new", "reviewed", "resolved"].map(s => (
              <button
                key={s || "all"}
                className={`fbd-filter-btn ${statusFilter === s ? "fbd-filter-btn--active" : ""}`}
                onClick={() => { setStatusFilter(s); setPage(1); }}
              >
                {s === "" ? "All" : s.charAt(0).toUpperCase() + s.slice(1)}
              </button>
            ))}
          </div>

          {/* Feedback list */}
          {loading ? (
            <div className="fbd-grid">
              {[...Array(6)].map((_, i) => <div key={i} className="fbd-skeleton" />)}
            </div>
          ) : error ? (
            <div className="fbd-state">
              <p className="fbd-state__icon">⚠️</p>
              <h3>{error}</h3>
              <button className="fbd-retry-btn" onClick={fetchFeedback}>Retry</button>
            </div>
          ) : feedback.length === 0 ? (
            <div className="fbd-state">
              <p className="fbd-state__icon">📭</p>
              <h3>No feedback yet</h3>
              <p>Submissions will appear here once users start sharing feedback.</p>
            </div>
          ) : (
            <>
              <div className="fbd-grid">
                {feedback.map(item => (
                  <FeedbackCard
                    key={item._id}
                    item={item}
                    onStatusChange={handleStatusChange}
                    onDelete={handleDelete}
                  />
                ))}
              </div>

              {totalPages > 1 && (
                <div className="fbd-pagination">
                  <button className="fbd-page-btn" disabled={page <= 1} onClick={() => setPage(p => p - 1)}>← Prev</button>
                  <span className="fbd-page-info">Page {page} of {totalPages}</span>
                  <button className="fbd-page-btn" disabled={page >= totalPages} onClick={() => setPage(p => p + 1)}>Next →</button>
                </div>
              )}
            </>
          )}
        </div>
      </div>
      <Footer />
    </>
  );
}