import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";

const features = [
  {
    title: "Smart Roadmap Generator",
    description:
      "Tell the AI your goal and skill level, and it instantly builds a complete learning roadmap with phases, timelines, project targets, and curated course recommendations.",
    howTo: "Enter your goal, select your level, and click Generate.",
    icon: (
      <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="3" />
        <path d="M12 2v3M12 19v3M4.22 4.22l2.12 2.12M17.66 17.66l2.12 2.12M2 12h3M19 12h3M4.22 19.78l2.12-2.12M17.66 6.34l2.12-2.12" />
      </svg>
    ),
    gradient: "from-violet-500 to-purple-600",
    borderGradient: "linear-gradient(135deg, #8b5cf6, #7c3aed, #6d28d9)",
    glow: "rgba(139, 92, 246, 0.2)",
    tag: "AI Powered",
    route: "/roadmap-generator",
    size: "hero", // full-width hero card
  },
  {
    title: "Study Planner",
    description:
      "An interactive calendar with smart time-blocking to build consistent learning habits.",
    howTo: "Click any date to add a session and track study streaks.",
    icon: (
      <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
        <line x1="16" y1="2" x2="16" y2="6" />
        <line x1="8" y1="2" x2="8" y2="6" />
        <line x1="3" y1="10" x2="21" y2="10" />
      </svg>
    ),
    gradient: "from-cyan-500 to-blue-600",
    borderGradient: "linear-gradient(135deg, #06b6d4, #0284c7)",
    glow: "rgba(6, 182, 212, 0.2)",
    tag: "Productivity",
    route: "/study-planner",
    size: "normal",
  },
  {
    title: "Performance Tracker",
    description:
      "Beautiful charts and analytics to visualize your progress and identify strengths.",
    howTo: "Visit to see study hours, completion rates, and skill breakdowns.",
    icon: (
      <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <line x1="18" y1="20" x2="18" y2="10" />
        <line x1="12" y1="20" x2="12" y2="4" />
        <line x1="6" y1="20" x2="6" y2="14" />
      </svg>
    ),
    gradient: "from-emerald-500 to-teal-600",
    borderGradient: "linear-gradient(135deg, #10b981, #0d9488)",
    glow: "rgba(16, 185, 129, 0.2)",
    tag: "Analytics",
    route: "/performance-tracker",
    size: "normal",
  },
  {
    title: "Focus Mode",
    description:
      "Eliminate distractions with a dedicated focus timer. Use Pomodoro or custom intervals for deep work.",
    howTo: "Set your timer duration and let the immersive interface keep you locked in.",
    icon: (
      <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="10" />
        <polyline points="12 6 12 12 16 14" />
      </svg>
    ),
    gradient: "from-amber-500 to-orange-600",
    borderGradient: "linear-gradient(135deg, #f59e0b, #ea580c)",
    glow: "rgba(245, 158, 11, 0.2)",
    tag: "Deep Work",
    route: "/focus",
    size: "wide", // spans 2 columns
  },
  {
    title: "Social Community",
    description:
      "Connect with learners worldwide. Share roadmaps, discuss strategies, and grow together.",
    howTo: "Browse posts, follow learners, and share your study wins.",
    icon: (
      <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
        <circle cx="9" cy="7" r="4" />
        <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
        <path d="M16 3.13a4 4 0 0 1 0 7.75" />
      </svg>
    ),
    gradient: "from-pink-500 to-rose-600",
    borderGradient: "linear-gradient(135deg, #ec4899, #e11d48)",
    glow: "rgba(236, 72, 153, 0.2)",
    tag: "Community",
    route: "/social",
    size: "normal",
  },
  {
    title: "Leaderboard Arena",
    description:
      "Compete with the community! Climb the ranks as you complete roadmaps and earn mastery badges.",
    howTo: "Check the Arena to see where you stand and challenge yourself.",
    icon: (
      <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
      </svg>
    ),
    gradient: "from-fuchsia-500 to-purple-600",
    borderGradient: "linear-gradient(135deg, #d946ef, #9333ea)",
    glow: "rgba(217, 70, 239, 0.2)",
    tag: "Compete",
    route: "/leaderboard",
    size: "normal",
  },
];

// ─── Animated Card ───
function BentoCard({ feature, index, className = "" }) {
  const navigate = useNavigate();
  const cardRef = useRef(null);
  const [tilt, setTilt] = useState({ x: 0, y: 0 });
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) setIsVisible(true);
      },
      { threshold: 0.1 }
    );
    if (cardRef.current) observer.observe(cardRef.current);
    return () => observer.disconnect();
  }, []);

  const handleMouseMove = (e) => {
    if (!cardRef.current) return;
    const rect = cardRef.current.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width - 0.5) * 12;
    const y = ((e.clientY - rect.top) / rect.height - 0.5) * -12;
    setTilt({ x, y });
  };

  const handleMouseLeave = () => setTilt({ x: 0, y: 0 });

  const isHero = feature.size === "hero";

  return (
    <div
      ref={cardRef}
      onClick={() => navigate(feature.route)}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      className={`group relative cursor-pointer rounded-3xl overflow-hidden transition-all duration-700 ${className}`}
      style={{
        opacity: isVisible ? 1 : 0,
        transform: isVisible
          ? `perspective(1000px) rotateX(${tilt.y}deg) rotateY(${tilt.x}deg) translateY(0)`
          : "perspective(1000px) rotateX(0deg) rotateY(0deg) translateY(50px)",
        transitionDelay: `${index * 120}ms`,
      }}
    >
      {/* Animated gradient border */}
      <div
        className="absolute inset-0 rounded-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-500"
        style={{
          background: feature.borderGradient,
          padding: "1px",
        }}
      />

      {/* Inner card */}
      <div
        className="absolute inset-[1px] rounded-3xl bg-zinc-950/90 backdrop-blur-xl"
        style={{
          boxShadow: `inset 0 1px 0 0 rgba(255,255,255,0.05)`,
        }}
      />

      {/* Hover glow */}
      <div
        className="absolute inset-0 rounded-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-700 pointer-events-none"
        style={{
          boxShadow: `0 0 80px 0 ${feature.glow}, inset 0 0 80px -40px ${feature.glow}`,
        }}
      />

      {/* Subtle border */}
      <div className="absolute inset-0 rounded-3xl border border-white/[0.06] group-hover:border-white/[0.12] transition-colors duration-500 pointer-events-none" />

      {/* Content */}
      <div className={`relative z-10 ${isHero ? "p-10 md:p-12" : "p-7"}`}>
        {/* Top row: icon + tag */}
        <div className="flex items-start justify-between mb-5">
          <div
            className={`${isHero ? "w-18 h-18" : "w-14 h-14"} rounded-2xl bg-gradient-to-br ${feature.gradient} flex items-center justify-center text-white shadow-xl group-hover:scale-110 group-hover:rotate-[6deg] transition-transform duration-500`}
            style={{ width: isHero ? "4.5rem" : "3.5rem", height: isHero ? "4.5rem" : "3.5rem" }}
          >
            {feature.icon}
          </div>
          <span
            className={`text-[10px] uppercase tracking-[0.15em] font-bold px-3 py-1 rounded-full border bg-gradient-to-br ${feature.gradient} bg-clip-text text-transparent border-white/10`}
          >
            {feature.tag}
          </span>
        </div>

        {/* Title */}
        <h3 className={`${isHero ? "text-2xl md:text-3xl" : "text-lg"} font-bold mb-3 text-white`}>
          {feature.title}
        </h3>

        {/* Description */}
        <p className={`text-zinc-400 ${isHero ? "text-base" : "text-sm"} leading-relaxed mb-5`}>
          {feature.description}
        </p>

        {/* How-to chip */}
        <div className="bg-white/[0.04] rounded-xl p-3.5 border border-white/[0.06] mb-5 group-hover:bg-white/[0.07] transition-colors duration-300">
          <div className="flex items-center gap-2 mb-1.5">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="text-zinc-500">
              <circle cx="12" cy="12" r="10" /><path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3" /><line x1="12" y1="17" x2="12.01" y2="17" />
            </svg>
            <span className="text-[10px] uppercase tracking-[0.15em] font-bold text-zinc-500">How to use</span>
          </div>
          <p className="text-zinc-300 text-xs leading-relaxed">{feature.howTo}</p>
        </div>

        {/* CTA arrow */}
        <div className="flex items-center gap-2 text-sm font-semibold text-zinc-600 group-hover:text-white transition-colors duration-300">
          <span>Try it now</span>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="group-hover:translate-x-2 transition-transform duration-300">
            <path d="M5 12h14M12 5l7 7-7 7" />
          </svg>
        </div>
      </div>
    </div>
  );
}

// ─── Page ───
export default function GuidePage() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen w-full bg-transparent text-white font-sans">
      {/* Inline animations */}
      <style>{`
        @keyframes float-slow {
          0%, 100% { transform: translateY(0) rotate(0deg); }
          50% { transform: translateY(-15px) rotate(2deg); }
        }
        @keyframes gradient-shift {
          0% { background-position: 0% 50%; }
          50% { background-position: 100% 50%; }
          100% { background-position: 0% 50%; }
        }
        .animate-float-slow { animation: float-slow 8s ease-in-out infinite; }
        .animate-gradient-shift {
          background-size: 200% 200%;
          animation: gradient-shift 6s ease infinite;
        }
      `}</style>

      {/* Ambient blobs */}
      <div className="fixed inset-0 z-0 pointer-events-none overflow-hidden">
        <div className="absolute top-[-20%] left-[-15%] w-[600px] h-[600px] rounded-full blur-[180px] animate-float-slow" style={{ background: "rgba(139, 92, 246, 0.1)" }} />
        <div className="absolute bottom-[-20%] right-[-15%] w-[600px] h-[600px] rounded-full blur-[180px] animate-float-slow" style={{ background: "rgba(6, 182, 212, 0.1)", animationDelay: "-4s" }} />
        <div className="absolute top-[40%] left-[50%] w-[400px] h-[400px] rounded-full blur-[150px] animate-float-slow" style={{ background: "rgba(236, 72, 153, 0.06)", animationDelay: "-7s" }} />
      </div>

      <div className="relative z-10 max-w-6xl mx-auto px-6 lg:px-12 py-10 lg:py-16">
        {/* Back button */}
        <button
          onClick={() => navigate("/home")}
          className="flex items-center gap-2 text-zinc-500 hover:text-white text-sm font-medium mb-12 group transition-colors"
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="group-hover:-translate-x-1 transition-transform">
            <line x1="19" y1="12" x2="5" y2="12" />
            <polyline points="12 19 5 12 12 5" />
          </svg>
          Back to Dashboard
        </button>

        {/* Header */}
        <div className="text-center mb-20">
          <div className="inline-flex items-center gap-2 bg-white/[0.05] border border-white/[0.08] rounded-full px-4 py-1.5 text-xs text-zinc-400 mb-6">
            <span className="w-1.5 h-1.5 rounded-full bg-violet-400 inline-block animate-pulse" />
            Platform Guide
          </div>
          <h1 className="text-4xl md:text-6xl font-bold tracking-tight mb-6">
            Everything{" "}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-violet-400 via-fuchsia-400 to-cyan-400 animate-gradient-shift" style={{ backgroundSize: "200% 200%" }}>
              Lumi
            </span>{" "}
            can do
          </h1>
          <p className="text-zinc-500 text-lg max-w-2xl mx-auto leading-relaxed">
            Explore every feature. Click any card to jump straight into the tool.
          </p>
        </div>

        {/* ─── Bento Grid ─── */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5 auto-rows-auto">
          {/* Row 1: Hero card spans 2 cols */}
          <BentoCard
            feature={features[0]}
            index={0}
            className="md:col-span-2 lg:col-span-2 lg:row-span-2"
          />

          {/* Row 1 right: 2 stacked cards */}
          <BentoCard
            feature={features[1]}
            index={1}
            className="lg:col-span-2"
          />
          <BentoCard
            feature={features[2]}
            index={2}
            className="lg:col-span-2"
          />

          {/* Row 3: Wide card + normal */}
          <BentoCard
            feature={features[3]}
            index={3}
            className="md:col-span-2 lg:col-span-2"
          />
          <BentoCard
            feature={features[4]}
            index={4}
            className="lg:col-span-1"
          />
          <BentoCard
            feature={features[5]}
            index={5}
            className="lg:col-span-1"
          />
        </div>

        {/* Bottom CTA */}
        <div className="text-center mt-24 mb-12">
          <p className="text-zinc-600 text-sm mb-6">
            Ready to start your learning journey?
          </p>
          <button
            onClick={() => navigate("/home")}
            className="px-8 py-3.5 bg-violet-600 hover:bg-violet-500 rounded-xl font-medium text-sm text-white transition-all hover:scale-105 active:scale-95 shadow-lg shadow-violet-900/30"
          >
            Go to Dashboard
          </button>
        </div>
      </div>
    </div>
  );
}
