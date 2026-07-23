'use client'
import { useState, useEffect, useRef, MouseEvent } from "react";
import { useRouter } from "next/navigation";
// import ProfileModal from "./Profilemodal";
import { resolveAvatarSrc, AvatarValue } from "./avatarPresets";

const API = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000";

// ── Salesforce Cloud Icon ────────────────────────────────────────────
const SalesforceIcon = () => (
  <svg viewBox="0 0 100 67" xmlns="http://www.w3.org/2000/svg"
    className="sf-logo-icon" aria-label="Salesforce logo" role="img">
    <path
      d="M41.4 9.7C44.8 6 49.6 3.8 54.9 3.8c7.3 0 13.6 4.1 17 10.1 2.9-1.3 6.1-2 9.5-2 13.1 0 23.7 10.7 23.7 23.9S94.5 59.7 81.4 59.7H20.5C9.2 59.7 0 50.5 0 39.1c0-10.5 7.8-19.2 18-20.5-.1-.9-.2-1.7-.2-2.6C17.8 7.2 25 0 33.9 0c3.3 0 6.4 1 9 2.7"
      fill="#00A1E0"
    />
    <text x="50" y="42" textAnchor="middle" fontFamily="Arial, sans-serif"
      fontWeight="bold" fontSize="18" fill="#ffffff" letterSpacing="0.5">
      salesforce
    </text>
  </svg>
);

const MenuIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2"
    strokeLinecap="round" strokeLinejoin="round" className="menu-icon" aria-hidden="true">
    <line x1="3" y1="6" x2="21" y2="6" />
    <line x1="3" y1="12" x2="21" y2="12" />
    <line x1="3" y1="18" x2="21" y2="18" />
  </svg>
);

const CloseIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2"
    strokeLinecap="round" strokeLinejoin="round" className="menu-icon" aria-hidden="true">
    <line x1="18" y1="6" x2="6" y2="18" />
    <line x1="6" y1="6" x2="18" y2="18" />
  </svg>
);

const LogoutIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"
    strokeLinecap="round" strokeLinejoin="round" style={{ width: 15, height: 15 }} aria-hidden="true">
    <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
    <polyline points="16 17 21 12 16 7" />
    <line x1="21" y1="12" x2="9" y2="12" />
  </svg>
);

const UserIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"
    strokeLinecap="round" strokeLinejoin="round" style={{ width: 15, height: 15 }} aria-hidden="true">
    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
    <circle cx="12" cy="7" r="4" />
  </svg>
);

const ChevronDown = ({ open }: { open: boolean }) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2"
    strokeLinecap="round" strokeLinejoin="round"
    style={{ width: 14, height: 14, transform: open ? "rotate(180deg)" : "none", transition: "transform 150ms ease" }}
    aria-hidden="true">
    <polyline points="6 9 12 15 18 9" />
  </svg>
);

// ── Nav links ────────────────────────────────────────────────────────
interface NavLink {
  label: string;
  href: string;
  adminOnly?: boolean;
}

const BASE_NAV_LINKS: NavLink[] = [
  { label: "Jobs", href: "/jobs" },
  { label: "Saved Jobs", href: "/saved-jobs" },
  { label: "Applied Jobs", href: "/appliedjobs" }
];

const RECRUITER_NAV_LINKS: NavLink[] = [
  { label: "Find Candidates", href: "/candidates", adminOnly: true }, // reuses the star-badge styling
];

const ADMIN_NAV_LINKS: NavLink[] = [
  { label: "Feedbacks", href: "/admin/feedback", adminOnly: true },
];

// ── User type ────────────────────────────────────────────────────────
interface User {
  id: string;
  name: string;
  email: string;
  role: string;
  avatar?: AvatarValue;
}

// Minimal shape we care about from ProfileModal's onProfileSaved callback.
interface SavedProfile {
  avatar?: AvatarValue;
  [key: string]: unknown;
}

// ── Component ────────────────────────────────────────────────────────
export default function Navbar() {
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);
  const [user, setUser] = useState<User | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [pendingHref, setPendingHref] = useState("");
  // const [showProfileModal, setShowProfileModal] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  // Rehydrate user from localStorage on mount
  useEffect(() => {
    try {
      const raw = localStorage.getItem("tc_user");
      if (raw) setUser(JSON.parse(raw));
    } catch { /* ignore */ }
  }, []);
  useEffect(() => {
    console.log("Logged in user:", user);
    console.log("Role:", user?.role);
  }, [user]);

  // Close the avatar dropdown on outside click
  useEffect(() => {
    const handler = (e: globalThis.MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) setShowUserMenu(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const navLinks: NavLink[] = user?.role === "admin"
    ? [...BASE_NAV_LINKS, ...RECRUITER_NAV_LINKS, ...ADMIN_NAV_LINKS]
    : user?.role === "recruiter"
    ? [...BASE_NAV_LINKS, ...RECRUITER_NAV_LINKS]
    : BASE_NAV_LINKS;

  // ── Logout ───────────────────────────────────────────────────────
  const handleLogout = async () => {
    await fetch(`${API}/api/auth/logout`, { method: "POST", credentials: "include" });
    localStorage.removeItem("tc_token");
    localStorage.removeItem("tc_user");
    setUser(null);
    window.location.href = "/";
  };

  // Called by ProfileModal whenever avatar/profile is saved, so the
  // navbar bubble updates immediately without a full page reload.
  const handleProfileSaved = (updatedProfile: SavedProfile) => {
    setUser((prev) => {
      if (!prev) return prev;
      const next: User = { ...prev, avatar: updatedProfile.avatar ?? prev.avatar };
      localStorage.setItem("tc_user", JSON.stringify(next));
      return next;
    });
  };

  // ── Nav link click — guard if not logged in ───────────────────────
  const handleNavClick = (e: MouseEvent<HTMLAnchorElement>, href: string) => {
    if (!user) {
      e.preventDefault();
      setPendingHref(href);
      setShowModal(true);
      setIsOpen(false);
    }
  };

  const goToLogin = () => {
    setShowModal(false);
    router.push("/login");
  };

  const toggleMenu = () => setIsOpen((prev) => !prev);

  const avatarSrc = user ? resolveAvatarSrc(user.avatar, API, 40) : "";

  return (
    <>
      <header className="navbar">
        <div className="navbar__inner">

          {/* Logo */}
          <a href="/" className="navbar__brand" aria-label="Go to homepage">
            <SalesforceIcon />
            <span className="navbar__brand-name">TalentCloud</span>
          </a>

          {/* Desktop nav links */}
          <nav className="navbar__links" aria-label="Primary navigation">
            {navLinks.map((link) => (
              <a
                key={link.href}
                href={link.href}
                className={`navbar__link ${link.adminOnly ? "navbar__link--admin" : ""}`}
                onClick={(e) => handleNavClick(e, link.href)}
              >
                {link.adminOnly && (
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"
                    strokeLinecap="round" strokeLinejoin="round"
                    style={{ width: 13, height: 13, marginRight: 4, display: "inline" }} aria-hidden="true">
                    <path d="M12 2l3 6 6 1-4.5 4.5L18 20l-6-3-6 3 1.5-6.5L3 9l6-1z" />
                  </svg>
                )}
                {link.label}
              </a>
            ))}
          </nav>

          {/* Desktop auth */}
          <div className="navbar__auth">
            {user ? (
              <div className="navbar__user" ref={menuRef}>
                <button
                  className="navbar__user-btn"
                  onClick={() => setShowUserMenu((v) => !v)}
                  aria-haspopup="menu"
                  aria-expanded={showUserMenu}
                >
                  <img src={avatarSrc} alt="" className="navbar__avatar" />
                  <span className="navbar__user-name">
                    {user.name.split(" ")[0]}
                    {user.role === "admin" && <span className="navbar__admin-badge">Admin</span>}
                  </span>
                  <ChevronDown open={showUserMenu} />
                </button>

                {showUserMenu && (
                  <div className="navbar__user-menu" role="menu">
                    <div className="navbar__user-menu__header">
                      <img src={avatarSrc} alt="" className="navbar__avatar navbar__avatar--lg" />
                      <div>
                        <div className="navbar__user-menu__name">{user.name}</div>
                        <div className="navbar__user-menu__email">{user.email}</div>
                      </div>
                    </div>
                    <button
                      className="navbar__user-menu__item"
                      // onClick={() => { setShowProfileModal(true); setShowUserMenu(false); }}
                      onClick={() => router.push("/profile")}
                    >
                      <UserIcon /> My Profile
                    </button>
                    <button className="navbar__user-menu__item navbar__user-menu__item--danger" onClick={handleLogout}>
                      <LogoutIcon /> Logout
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <>
                <a href="/login" className="btn btn--ghost">Login</a>
                <a href="/register" className="btn btn--primary">Register</a>
              </>
            )}
          </div>

          {/* Hamburger */}
          <button
            className="navbar__hamburger"
            onClick={toggleMenu}
            aria-expanded={isOpen}
            aria-controls="mobile-menu"
            aria-label={isOpen ? "Close menu" : "Open menu"}
          >
            {isOpen ? <CloseIcon /> : <MenuIcon />}
          </button>
        </div>

        {/* Mobile menu */}
        {isOpen && (
        <div
          id="mobile-menu"
          className="navbar__mobile navbar__mobile--open"
        >
          <nav className="navbar__mobile-links" aria-label="Mobile navigation">
            {navLinks.map((link) => (
              <a
                key={link.href}
                href={link.href}
                className="navbar__mobile-link"
                onClick={(e) => {
                  handleNavClick(e, link.href);
                  if (user) setIsOpen(false);
                }}
              >
                {link.adminOnly && "⭐ "}{link.label}
              </a>
            ))}
          </nav>

          <div className="navbar__mobile-auth">
            {user ? (
              <>
                <div className="navbar__mobile-user">
                  <img src={avatarSrc} alt="" className="navbar__avatar" />
                  <div>
                    <div className="navbar__user-menu__name">{user.name}</div>
                    {user.role === "admin" && <span className="navbar__admin-badge">Admin</span>}
                  </div>
                </div>
                <button
                  className="btn btn--ghost w-full text-center"
                  // onClick={() => { setShowProfileModal(true); setIsOpen(false); }}
                  onClick={() => router.push("/profile")}
                >
                  <UserIcon /> My Profile
                </button>
                <button
                  className="btn btn--ghost w-full text-center"
                  onClick={() => { handleLogout(); setIsOpen(false); }}
                >
                  <LogoutIcon /> Logout
                </button>
              </>
            ) : (
              <>
                <a href="/login" className="btn btn--ghost w-full text-center">Login</a>
                <a href="/register" className="btn btn--primary w-full text-center">Register</a>
              </>
            )}
          </div>
        </div>
      )}
      </header>

      {/* ── Login required modal ─────────────────────────────────── */}
      {showModal && (
        <div className="navbar__modal-overlay" role="dialog" aria-modal="true"
          aria-labelledby="modal-title" onClick={() => setShowModal(false)}>
          <div className="navbar__modal" onClick={(e) => e.stopPropagation()}>
            <div className="navbar__modal-icon" aria-hidden="true">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"
                strokeLinecap="round" strokeLinejoin="round">
                <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                <path d="M7 11V7a5 5 0 0 1 10 0v4" />
              </svg>
            </div>
            <h2 id="modal-title" className="navbar__modal-title">Login required</h2>
            <p className="navbar__modal-sub">
              You need to be logged in to access{" "}
              <strong>{[...BASE_NAV_LINKS, ...ADMIN_NAV_LINKS].find(l => l.href === pendingHref)?.label ?? "this page"}</strong>.
            </p>
            <div className="navbar__modal-actions">
              <button className="btn btn--primary" onClick={goToLogin}>Go to Login</button>
              <button className="btn btn--ghost" onClick={() => setShowModal(false)}>Cancel</button>
            </div>
          </div>
        </div>
      )}

      {/* ── Profile modal ─────────────────────────────────────────── */}
      {/* <ProfileModal
        isOpen={showProfileModal}
        onClose={() => setShowProfileModal(false)}
        onProfileSaved={handleProfileSaved}
      /> */}
    </>
  );
}