'use client'

interface Testimonial {
  id: number;
  name: string;
  role: string;
  company: string;
  avatar: string;
  rating: number;
  text: string;
  hiredVia: string;
}

const TESTIMONIALS: Testimonial[] = [
  {
    id: 1,
    name: "Priya Sharma",
    role: "Salesforce Developer",
    company: "Accenture",
    avatar: "PS",
    rating: 5,
    text: "I had been searching for a Salesforce role for months on generic job boards with zero luck. TalentCloud was different — every listing was relevant. Within 3 weeks I had two interviews and landed my dream job at Accenture. The filters are incredibly precise.",
    hiredVia: "Found via Remote filter",
  },
  {
    id: 2,
    name: "Rahul Menon",
    role: "Salesforce Architect",
    company: "Capgemini",
    avatar: "RM",
    rating: 5,
    text: "As a senior architect, I needed a platform that understood the Salesforce ecosystem — not just keyword matching. TalentCloud categorises by actual Salesforce roles. I found a senior architect position in Hyderabad within days of signing up.",
    hiredVia: "Found via Architect category",
  },
  {
    id: 3,
    name: "Ananya Reddy",
    role: "Marketing Cloud Developer",
    company: "Cognizant",
    avatar: "AR",
    rating: 5,
    text: "Marketing Cloud roles are rare on regular portals. Here I found 40+ listings in one place. The skill tags made it easy to see exactly what each company needed. Got hired at Cognizant within a month — couldn't be happier!",
    hiredVia: "Found via Marketing Cloud category",
  },
  {
    id: 4,
    name: "Karthik Iyer",
    role: "Salesforce Admin",
    company: "Deloitte",
    avatar: "KI",
    rating: 4,
    text: "Fresh out of my Salesforce Admin certification, I was nervous about finding a job. TalentCloud had fresher-friendly listings with clear experience requirements. The save job feature let me track everything. Landed my first role at Deloitte!",
    hiredVia: "Found via Admin category",
  },
  {
    id: 5,
    name: "Sneha Kulkarni",
    role: "Salesforce Consultant",
    company: "TCS",
    avatar: "SK",
    rating: 5,
    text: "Relocated from Pune to Bengaluru and needed a new role fast. The location filter + hybrid work filter was a lifesaver. Applied to 4 jobs, got 3 callbacks. The job descriptions here are far more detailed than LinkedIn.",
    hiredVia: "Found via Location filter",
  },
  {
    id: 6,
    name: "Vijay Nair",
    role: "Salesforce Developer",
    company: "IBM",
    avatar: "VN",
    rating: 5,
    text: "What I love most is that TalentCloud is 100% Salesforce-focused. No noise, no irrelevant postings. I set up job alerts and within a week got notified about an IBM opening that was a perfect match for my Apex and LWC skills.",
    hiredVia: "Found via Job Alerts",
  },
];

// ── Star rating ───────────────────────────────────────────────────────
function Stars({ rating }: { rating: number }) {
  return (
    <div className="testimonial__stars" aria-label={`${rating} out of 5 stars`}>
      {[1, 2, 3, 4, 5].map((i) => (
        <svg key={i} viewBox="0 0 24 24"
          fill={i <= rating ? "currentColor" : "none"}
          stroke="currentColor" strokeWidth="1.5"
          className={`testimonial__star ${i <= rating ? "testimonial__star--filled" : ""}`}
          aria-hidden="true">
          <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
        </svg>
      ))}
    </div>
  );
}

// ── Single card ───────────────────────────────────────────────────────
function TestimonialCard({ t }: { t: Testimonial }) {
  return (
    <div className="testimonial__card">
      {/* Quote mark */}
      <div className="testimonial__quote-mark" aria-hidden="true">"</div>

      <Stars rating={t.rating} />

      <p className="testimonial__text">{t.text}</p>

      <div className="testimonial__hired-tag">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"
          strokeLinecap="round" strokeLinejoin="round"
          style={{ width: 12, height: 12 }} aria-hidden="true">
          <polyline points="20 6 9 17 4 12" />
        </svg>
        {t.hiredVia}
      </div>

      <div className="testimonial__author">
        <div className="testimonial__avatar" aria-hidden="true">{t.avatar}</div>
        <div className="testimonial__author-info">
          <span className="testimonial__name">{t.name}</span>
          <span className="testimonial__role">
            {t.role} · {t.company}
          </span>
        </div>
      </div>
    </div>
  );
}

// ── Section ───────────────────────────────────────────────────────────
export default function Testimonials() {
  return (
    <section className="testimonials" aria-labelledby="testimonials-heading">
      <div className="section__header">
        <span className="section__eyebrow">Success Stories</span>
        <h2 id="testimonials-heading" className="section__title">
          Hired through TalentCloud
        </h2>
        <p className="section__subtitle">
          Real Salesforce professionals who found their next role right here
        </p>
      </div>

      {/* Stats bar */}
      <div className="testimonials__stats">
        {[
          { value: "2,400+", label: "Professionals hired" },
          { value: "4.9 / 5", label: "Average rating" },
          { value: "18 days", label: "Average time to hire" },
          { value: "96%",     label: "Would recommend us" },
        ].map((s) => (
          <div key={s.label} className="testimonials__stat">
            <span className="testimonials__stat-value">{s.value}</span>
            <span className="testimonials__stat-label">{s.label}</span>
          </div>
        ))}
      </div>

      {/* Cards grid */}
      <div className="testimonials__grid">
        {TESTIMONIALS.map((t) => (
          <TestimonialCard key={t.id} t={t} />
        ))}
      </div>
    </section>
  );
}