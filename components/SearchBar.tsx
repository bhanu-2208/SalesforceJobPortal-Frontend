'use client'
import { useState } from "react";

interface SearchBarProps {
  onSearch?: (query: string, location: string) => void;
  placeholder?: string;
}

export default function SearchBar({
  onSearch,
  placeholder = "Job title, skill, or company...",
}: SearchBarProps) {
  const [query, setQuery] = useState("");
  const [location, setLocation] = useState("");

  const handleSearch = () => {
    onSearch?.(query, location);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") handleSearch();
  };

  return (
    <div className="searchbar">
      {/* Keyword input */}
      <div className="searchbar__field">
        <span className="searchbar__field-icon" aria-hidden="true">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="11" cy="11" r="8" />
            <line x1="21" y1="21" x2="16.65" y2="16.65" />
          </svg>
        </span>
        <input
          className="searchbar__input"
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          aria-label="Search jobs by title or keyword"
        />
      </div>

      <div className="searchbar__divider" aria-hidden="true" />

      {/* Location select */}
      <div className="searchbar__field">
        <span className="searchbar__field-icon" aria-hidden="true">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
            <circle cx="12" cy="10" r="3" />
          </svg>
        </span>
        <select
          className="searchbar__select"
          value={location}
          onChange={(e) => setLocation(e.target.value)}
          aria-label="Filter by location"
        >
          <option value="">All Locations</option>
          <option value="india">India</option>
          <option value="usa">USA</option>
          <option value="uk">UK</option>
          <option value="germany">Germany</option>
          <option value="australia">Australia</option>
          <option value="remote">Remote</option>
        </select>
      </div>

      {/* Search button */}
      <button
        className="searchbar__btn"
        type="button"
        onClick={handleSearch}
        aria-label="Submit search"
      >
        Search Jobs
      </button>
    </div>
  );
}