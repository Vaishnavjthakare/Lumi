import React, { useState, useEffect, useRef } from "react";
import useScrollReveal from "../hooks/useScrollReveal";
import { useNavigate } from "react-router-dom";
import { db, auth } from "../services/firebase";
import { collection, getDocs, query, where } from "firebase/firestore";
import { onAuthStateChanged } from "firebase/auth";
import { toBlob } from "html-to-image";

export default function PerformanceTrackerPage() {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [logs, setLogs] = useState([]);

  const [showDashboard, setShowDashboard] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [showShareModal, setShowShareModal] = useState(false);
  const [capturedBlob, setCapturedBlob] = useState(null);
  const dashboardRef = useRef(null);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      if (currentUser) {
        fetchLogs(currentUser.uid);
      } else {
        setLogs([]);
        setLoading(false);
      }
    });
    return () => unsubscribe();
  }, []);

  const fetchLogs = async (uid) => {
    try {
      const q = query(collection(db, "planner_events"), where("userId", "==", uid));
      const querySnapshot = await getDocs(q);
      const fetchedLogs = [];
      querySnapshot.forEach((docSnap) => {
        fetchedLogs.push({ id: docSnap.id, ...docSnap.data() });
      });
      setLogs(fetchedLogs);
    } catch (err) {
      console.error("Error fetching logs:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenDashboard = () => {
    setShowDashboard(true);
    setTimeout(() => {
      dashboardRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, 100);
  };

  const handleExportData = async () => {
    if (!showDashboard) {
      alert("Please open the dashboard first to export your data image!");
      return;
    }

    setIsExporting(true);
    try {
      // Small delay to ensure any animations settle
      await new Promise(r => setTimeout(r, 500));

      const blob = await toBlob(dashboardRef.current, {
        backgroundColor: "#0f0f11", // Force a clean dark background for the capture
        style: {
          transform: 'scale(1)', // Ensure no zoom/scaling issues
          opacity: '1',
          visibility: 'visible',
        }
      });

      if (!blob) throw new Error("Failed to generate image");

      setCapturedBlob(blob);

      // Try Native Share if available
      if (navigator.share && navigator.canShare && navigator.canShare({ files: [new File([blob], 'dashboard.png', { type: 'image/png' })] })) {
        const file = new File([blob], 'lumi-mastery.png', { type: 'image/png' });
        try {
          await navigator.share({
            files: [file],
            title: 'My Learning Mastery on Lumi',
            text: 'Check out my weekly progress on Lumi! 🔥',
          });
          setIsExporting(false);
          return;
        } catch (shareErr) {
          console.log("Native share failed, falling back to modal", shareErr);
        }
      }

      // Fallback: Open our custom share modal
      setShowShareModal(true);
    } catch (err) {
      console.error("Export failed:", err);
      alert("Could not generate dashboard image. Please try again.");
    } finally {
      setIsExporting(false);
    }
  };

  const downloadImage = () => {
    if (!capturedBlob) {
      alert("No image data found. Please try exporting again.");
      return;
    }
    const url = URL.createObjectURL(capturedBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'lumi-performance-dashboard.png';
    document.body.appendChild(link); // Append for better browser compatibility
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  // State for preview URL to manage lifecycle
  const [previewUrl, setPreviewUrl] = useState(null);

  useEffect(() => {
    if (capturedBlob) {
      const url = URL.createObjectURL(capturedBlob);
      setPreviewUrl(url);
      return () => URL.revokeObjectURL(url);
    }
  }, [capturedBlob]);

  // Trailing Date Math
  const getTrailingDays = () => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const result = [];
    const dayNames = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

    for (let i = 6; i >= 0; i--) {
      const d = new Date(today.getTime());
      d.setDate(d.getDate() - i);
      const offset = d.getTimezoneOffset();
      const dStr = new Date(d.getTime() - (offset * 60 * 1000)).toISOString().split("T")[0];
      result.push({
        date: dStr,
        name: i === 0 ? "Today" : dayNames[d.getDay()]
      });
    }
    return result;
  };

  const trailingDays = getTrailingDays();

  // 14-Day Trailing Context for Growth Calculation
  const get14DayStats = () => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const oneWeekAgo = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);
    const twoWeeksAgo = new Date(today.getTime() - 14 * 24 * 60 * 60 * 1000);

    let currentWeekSum = 0;
    let previousWeekSum = 0;

    logs.forEach(log => {
      const logDate = new Date(log.date);
      if (log.completed) {
        if (logDate >= oneWeekAgo) {
          currentWeekSum++;
        } else if (logDate >= twoWeeksAgo) {
          previousWeekSum++;
        }
      }
    });

    const growthVal = previousWeekSum === 0 
      ? (currentWeekSum > 0 ? 100 : 0) 
      : Math.round(((currentWeekSum - previousWeekSum) / previousWeekSum) * 100);

    return { thisWeekTotal: currentWeekSum, prevWeekTotal: previousWeekSum, growth: growthVal };
  };

  const { thisWeekTotal, prevWeekTotal, growth } = get14DayStats();

  // Aggregate daily sum limits
  const completedTasks = logs.filter(log => log.completed === true);
  const tasksPerDay = {};
  trailingDays.forEach(d => { tasksPerDay[d.date] = 0; });
  let maxTasks = 0;

  completedTasks.forEach(log => {
    if (tasksPerDay[log.date] !== undefined) {
      tasksPerDay[log.date] += 1;
    }
  });

  const chartData = trailingDays.map(d => {
    const c = tasksPerDay[d.date];
    if (c > maxTasks) maxTasks = c;
    return { ...d, count: c };
  });

  // Calculate subject breakdown for the trail
  const typeTotals = {};
  let totalCompletedTrail = 0;

  completedTasks.forEach(log => {
    if (tasksPerDay[log.date] !== undefined) {
      typeTotals[log.type] = (typeTotals[log.type] || 0) + 1;
      totalCompletedTrail += 1;
    }
  });

  const totalCompleted = thisWeekTotal; // Use 7-day total for main stats
  const sortedTypes = Object.entries(typeTotals).sort((a, b) => b[1] - a[1]);

  // Streak Calculation (Iterate backwards through chartData starting from today)
  let currentStreak = 0;
  for (let i = chartData.length - 1; i >= 0; i--) {
    if (chartData[i].count > 0) {
      currentStreak++;
    } else if (i < chartData.length - 1) {
      break;
    }
  }

  // Focus Distribution Percentages
  const focusPercentages = sortedTypes.map(([type, count]) => ({
    type,
    percent: totalCompletedTrail === 0 ? 0 : Math.round((count / totalCompletedTrail) * 100)
  }));

  // Mentor Advice Base Logic
  const getMentorAdvice = () => {
    const advice = [];
    const peakDay = chartData.reduce((prev, curr) => (curr.count > prev.count ? curr : prev), { count: 0 });
    
    // 1. Mastery Breakthrough
    if (growth > 30 && thisWeekTotal > 5) {
      advice.push({
        title: "Mastery Surge!",
        text: `You're growing at a massive ${growth}% rate compared to last week. This is a breakthrough phase—keep the fire burning!`,
        icon: "🚀"
      });
    }

    // 2. Peak Performance day
    if (peakDay.count > 0) {
      advice.push({
        title: "Peak Performance",
        text: `You were a beast on ${peakDay.name}! Plan your "Deep Work" sessions for ${peakDay.name}s to maximize efficiency.`,
        icon: "⚡"
      });
    }

    // 3. Streak Metrics
    if (currentStreak >= 7) {
      advice.push({
        title: "The 7-Day Habit",
        text: "You've hit the gold standard! A 7-day streak means your learning is becoming a subconscious habit. Build on this foundation.",
        icon: "👑"
      });
    } else if (currentStreak > 2) {
      advice.push({
        title: "Unstoppable Momentum",
        text: `You're on a ${currentStreak}-day streak! Consistency is the number one predictor of success. Keep showing up.`,
        icon: "🔥"
      });
    }

    // 4. Weekend vs Weekday analysis
    const weekendCount = chartData.filter(d => d.name === "Sat" || d.name === "Sun").reduce((acc, d) => acc + d.count, 0);
    if (weekendCount > (thisWeekTotal * 0.6) && thisWeekTotal > 0) {
      advice.push({
        title: "Weekend Warrior",
        text: "Most of your mastery happens on weekends. Try sprinkling 20 mins of review on weekdays to keep the memory fresh.",
        icon: "🛡️"
      });
    }

    // 5. Burnout & Diversity check
    const breakCount = typeTotals['Break'] || 0;
    const studyCount = typeTotals['Study'] || 0;
    const topSubjectCount = sortedTypes[0]?.[1] || 0;

    if (studyCount > 8 && (topSubjectCount / studyCount) > 0.8) {
      advice.push({
        title: "Topic Fatigue Alert",
        text: `You've focused heavily on ${sortedTypes[0][0]}. Consider a "Cross-Training" session in a different subject to refresh your brain.`,
        icon: "🧠"
      });
    }

    if (studyCount > 5 && breakCount < 2) {
      advice.push({
        title: "Burnout Warning",
        text: "You've been studying hard with very few breaks. Remember: retention happens during rest!",
        icon: "🧘"
      });
    } else if (totalCompleted > 0 && advice.length < 3) {
      advice.push({
        title: "Subject Diversity",
        text: `You mastered ${sortedTypes.length} different topics this week. Great variety!`,
        icon: "📚"
      });
    }

    // 6. Supportive Reset (Decline check)
    if (growth < -20 && prevWeekTotal > 5) {
      advice.push({
        title: "The Gentle Reset",
        text: "Your pace has slowed compared to last week. Don't worry—progress isn't always a straight line. Start with one small task today.",
        icon: "🌱"
      });
    }

    return advice;
  };

  const mentorAdvice = getMentorAdvice();

  return (
    <div className="min-h-screen bg-transparent text-zinc-900 dark:text-white font-sans relative overflow-x-hidden pb-12 custom-scrollbar">




      {/* Navigation */}
      <nav className="relative z-10 px-6 md:px-12 py-6 flex items-center justify-between">
        <button
          onClick={() => navigate("/home")}
          className="group flex items-center gap-2 text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:text-white transition-colors"
        >
          <div className="w-8 h-8 rounded-full bg-black/5 dark:bg-white/[0.05] border border-black/5 dark:border-white/[0.08] flex items-center justify-center group-hover:bg-black/[0.1] dark:bg-white/[0.1] transition-all">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="19" y1="12" x2="5" y2="12"></line>
              <polyline points="12 19 5 12 12 5"></polyline>
            </svg>
          </div>
          <span className="text-sm font-medium">Back to Home</span>
        </button>
        {!user && !loading && (
          <span className="text-sm text-pink-400 bg-pink-500/10 px-3 py-1.5 rounded-full border border-pink-500/20 shadow-lg shadow-pink-900/20">
            Sign in to view real-time data
          </span>
        )}
      </nav>

      {/* Hero Content */}
      <main className="relative z-10 px-6 md:px-12 py-10 max-w-5xl mx-auto mb-10">
        <div className="flex flex-col md:flex-row gap-12 items-center">
          {/* Left Text */}
          <div className="flex-1">
            <span className="inline-flex items-center text-xs font-medium px-3 py-1.5 rounded-full mb-6 bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 mr-2 animate-pulse" />
              Analytics
            </span>
            <h1 className="text-4xl md:text-6xl font-bold tracking-tight mb-6 leading-tight">
              Measure your.<br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-teal-400">
                Mastery.
              </span>
            </h1>
            <p className="text-zinc-600 dark:text-zinc-400 text-lg leading-relaxed mb-8">
              Visualize your progress with real-time analytics mapped natively from your Study Planner.
              We instantly pull data based on tasks you check off, showing exactly what topics you mastered this week.
            </p>

            <div className="flex flex-wrap gap-4">
              <button
                onClick={handleOpenDashboard}
                className="bg-emerald-600 hover:bg-emerald-500 text-zinc-900 dark:text-white font-medium px-8 py-3.5 rounded-xl transition-all duration-200 active:scale-95 shadow-lg shadow-emerald-900/40"
              >
                View Dashboard
              </button>
              <button
                onClick={handleExportData}
                disabled={isExporting}
                className="bg-black/5 dark:bg-white/[0.05] hover:bg-black/10 dark:hover:bg-white/10 border border-black/5 dark:border-white/[0.08] text-zinc-900 dark:text-white font-medium px-8 py-3.5 rounded-xl transition-all duration-200 active:scale-95 disabled:opacity-50"
              >
                {isExporting ? "Capturing..." : "Export Image"}
              </button>
            </div>
          </div>

          {/* Right Visualizer (Static Mockup for Hero) */}
          <div className="flex-1 w-full max-w-md card-animate card-visible card-hover card-shimmer pointer-events-none opacity-50 blur-[2px] md:opacity-100 md:blur-none" style={{ animationDelay: '0.3s' }}>
            <div className="bg-white/40 dark:bg-black/50 backdrop-blur-xl border border-black/5 dark:border-white/[0.08] rounded-3xl p-8 shadow-2xl relative overflow-hidden group">
              <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-emerald-400 to-teal-400" />
              <div className="flex justify-between items-center mb-6">
                <div>
                  <h3 className="text-zinc-900 dark:text-white font-medium">Weekly Activity</h3>
                  <p className="text-xs text-zinc-500">Live preview</p>
                </div>
                <div className="bg-emerald-500/20 text-emerald-400 text-xs font-semibold px-2.5 py-1 rounded-lg">
                  Top 5% Learner
                </div>
              </div>

              {/* Bar Chart Mockup */}
              <div className="flex items-end justify-between gap-2 h-40 pt-4 border-b border-black/5 dark:border-white/[0.05] relative">
                <div className="w-1/6 bg-black/5 dark:bg-white/[0.05] rounded-t-md h-[40%]" />
                <div className="w-1/6 bg-emerald-500/40 rounded-t-lg h-[60%] shadow-[0_0_15px_rgba(16,185,129,0.3)]" />
                <div className="w-1/6 bg-black/5 dark:bg-white/[0.05] rounded-t-md h-[35%]" />
                <div className="w-1/6 bg-emerald-500/80 rounded-t-xl h-[85%] shadow-[0_0_20px_rgba(16,185,129,0.5)] relative"></div>
                <div className="w-1/6 bg-emerald-500/20 rounded-t-md h-[50%]" />
              </div>

              {/* X Axis Labels */}
              <div className="flex justify-between text-[10px] text-zinc-600 font-medium mt-3">
                <span>Mon</span><span>Tue</span><span>Wed</span><span>Thu</span><span>Fri</span>
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Hidden/Revealed Dashboard Section */}
      {showDashboard && (
        <section ref={dashboardRef} className="relative z-10 px-6 md:px-12 pb-20 max-w-6xl mx-auto flex flex-col lg:flex-row gap-8 animate-in fade-in slide-in-from-bottom-10 duration-500 pt-10 border-t border-black/5 dark:border-white/[0.05]">

          {/* Left Panel: Insights Panel */}
          <div className="lg:w-1/3">
            <h2 className="text-2xl font-bold tracking-tight text-zinc-900 dark:text-white mb-2">Automated Insights</h2>
            <p className="text-sm text-zinc-600 dark:text-zinc-400 mb-8">Data synced live from your Study Planner.</p>

            <div className="bg-white/40 dark:bg-black/50 backdrop-blur-xl border border-black/5 dark:border-white/[0.08] rounded-3xl p-6 shadow-2xl space-y-5">

              <div className="bg-black/[0.02] dark:bg-white/[0.02] border border-black/5 dark:border-white/[0.05] rounded-xl p-5 flex items-center justify-between card-hover card-shimmer">
                <div>
                  <h3 className="text-[10px] uppercase tracking-widest text-zinc-500 font-bold mb-1">Weekly Growth</h3>
                  <p className={`text-3xl font-bold leading-none ${growth >= 0 ? 'text-emerald-400' : 'text-orange-500'}`}>
                    {growth >= 0 ? '+' : ''}{growth}%
                  </p>
                </div>
                <div className={`w-12 h-12 rounded-full flex items-center justify-center border ${growth >= 0 ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400' : 'bg-orange-500/10 border-orange-500/20 text-orange-400'}`}>
                  {growth >= 0 ? (
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="23 6 13.5 15.5 8.5 10.5 1 18"></polyline><polyline points="17 6 23 6 23 12"></polyline></svg>
                  ) : (
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="23 18 13.5 8.5 8.5 13.5 1 6"></polyline><polyline points="17 18 23 18 23 12"></polyline></svg>
                  )}
                </div>
              </div>

              <div className="bg-black/[0.02] dark:bg-white/[0.02] border border-black/5 dark:border-white/[0.05] rounded-xl p-5 flex items-center justify-between card-hover card-shimmer">
                <div>
                  <h3 className="text-[10px] uppercase tracking-widest text-zinc-500 font-bold mb-1">Total Quests Done</h3>
                  <p className="text-3xl font-bold text-zinc-900 dark:text-white leading-none">{totalCompleted}</p>
                </div>
                <div className="w-12 h-12 bg-emerald-500/10 rounded-full flex items-center justify-center border border-emerald-500/20 text-emerald-400">
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>
                </div>
              </div>

              <div className="bg-black/[0.02] dark:bg-white/[0.02] border border-black/5 dark:border-white/[0.05] rounded-xl p-5 flex items-center justify-between card-hover card-shimmer">
                <div>
                  <h3 className="text-[10px] uppercase tracking-widest text-zinc-500 font-bold mb-1">Mastery Streak</h3>
                  <p className="text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-orange-400 to-red-500 leading-none">{currentStreak} Days</p>
                </div>
                <div className="w-12 h-12 bg-orange-500/10 rounded-full flex items-center justify-center border border-orange-500/20 text-orange-400">
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M8.5 14.5A2.5 2.5 0 0 0 11 12c0-1.38-.5-2-1-3-1.072-2.143-.224-4.054 2-6 .5 2.5 2 4.5 3.5 6.5 1.5 2 2 4.5 2 7a6 6 0 1 1-12 0c0-1.38.5-2 1-3 1.072-2.143.224-1.054 2 1z"></path></svg>
                </div>
              </div>

              {/* Donut Chart / Focus Dist */}
              {totalCompleted > 0 && (
                <div className="pt-4 mt-6 border-t border-black/5 dark:border-white/[0.05]">
                  <h3 className="text-[10px] uppercase tracking-widest text-zinc-500 font-bold mb-4">Focus Distribution</h3>
                  <div className="flex items-center gap-6">
                    <div
                      className="w-20 h-20 rounded-full relative shrink-0"
                      style={{
                        background: `conic-gradient(
                            #06b6d4 0% ${focusPercentages[0]?.percent || 0}%, 
                            #10b981 ${focusPercentages[0]?.percent || 0}% ${(focusPercentages[0]?.percent || 0) + (focusPercentages[1]?.percent || 0)}%, 
                            #8b5cf6 ${(focusPercentages[0]?.percent || 0) + (focusPercentages[1]?.percent || 0)}% 100%
                          )`
                      }}
                    >
                      <div className="absolute inset-4 bg-[#18181b] rounded-full flex items-center justify-center text-[10px] font-bold text-zinc-500">
                        {totalCompleted}
                      </div>
                    </div>
                    <div className="space-y-1.5 flex-1">
                      {focusPercentages.slice(0, 3).map((fp, i) => {
                        const colors = ["text-cyan-400", "text-emerald-400", "text-violet-400"];
                        return (
                          <div key={i} className="flex items-center justify-between text-[11px]">
                            <span className="text-zinc-500 flex items-center gap-1.5">
                              <span className={`w-1.5 h-1.5 rounded-full ${colors[i].replace('text', 'bg')}`} />
                              {fp.type}
                            </span>
                            <span className="font-bold text-zinc-300">{fp.percent}%</span>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>
              )}

            </div>
          </div>

          {/* Right Panel: Functional Analytics Chart */}
          <div className="lg:w-2/3">
            <h2 className="text-2xl font-bold tracking-tight text-transparent mb-2 select-none pointer-events-none">_</h2>
            <p className="text-sm text-zinc-600 dark:text-zinc-400 mb-8">Trailing 7 days completion analysis.</p>

            <div className="bg-white/40 dark:bg-black/50 backdrop-blur-xl border border-black/5 dark:border-white/[0.08] rounded-3xl p-6 md:p-8 shadow-2xl relative overflow-hidden group">
              <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-emerald-400 to-teal-400" />

              <div className="flex justify-between items-center mb-10">
                <div>
                  <h3 className="text-zinc-900 dark:text-white font-medium text-lg">Weekly Task Completions</h3>
                  <p className="text-sm text-zinc-500 mt-1">{totalCompleted} Total Completed Tasks</p>
                </div>
                <div className="flex items-center gap-6">
                  {/* Mini Comparison */}
                  <div className="hidden md:flex flex-col items-end gap-1">
                    <span className="text-[10px] text-zinc-500 uppercase font-bold tracking-widest">Vs Last Week</span>
                    <div className="flex items-end gap-1.5 h-6">
                      <div className="w-2 bg-white/10 rounded-t-sm" style={{ height: `${prevWeekTotal === 0 ? 10 : Math.max(10, (prevWeekTotal / Math.max(thisWeekTotal, prevWeekTotal)) * 100)}%` }} />
                      <div className="w-2 bg-emerald-500 rounded-t-sm" style={{ height: `${thisWeekTotal === 0 ? 10 : Math.max(10, (thisWeekTotal / Math.max(thisWeekTotal, prevWeekTotal)) * 100)}%` }} />
                    </div>
                  </div>
                  {totalCompleted > 5 && (
                    <div className="bg-emerald-500/20 border border-emerald-500/30 text-emerald-400 text-xs font-semibold px-3 py-1.5 rounded-lg shadow-inner">
                      Momentum Built 🔥
                    </div>
                  )}
                </div>
              </div>

              {/* Functional Dynamic Bar Chart */}
              <div className="flex justify-between items-end gap-1.5 md:gap-3 h-52 pt-4 border-b border-white/[0.1] relative">
                {/* Y-Axis scale marks */}
                <div className="absolute left-0 bottom-0 top-0 w-full flex flex-col justify-between pointer-events-none">
                  <div className="border-t border-white/[0.03] w-full mt-4"></div>
                  <div className="border-t border-white/[0.03] w-full"></div>
                  <div className="border-t border-white/[0.03] w-full"></div>
                </div>

                {chartData.map((dataObj, index) => {
                  const heightPercent = maxTasks === 0 ? 0 : Math.max(10, (dataObj.count / maxTasks) * 95);
                  const isZero = dataObj.count === 0;
                  const finalH = isZero ? 5 : heightPercent; // 5% for empty days
                  const isPeak = dataObj.count === maxTasks && maxTasks > 0;

                  return (
                    <div key={index} className="w-1/7 flex-1 flex justify-center group/bar relative h-full items-end pb-px">
                      <div
                        style={{ height: `${finalH}%` }}
                        className={`w-full max-w-[40px] rounded-t-xl transition-all duration-700 ease-out relative
                                ${isZero ? 'bg-black/[0.03] dark:bg-white/[0.03]' : isPeak ? 'bg-emerald-500/80 shadow-[0_0_20px_rgba(16,185,129,0.5)]' : 'bg-emerald-500/30'}
                                hover:bg-emerald-400/60
                                `}
                      >
                        <div className="absolute -top-7 left-1/2 -translate-x-1/2 bg-[#27272a] border border-white/[0.1] text-zinc-900 dark:text-white text-[10px] font-medium px-2 py-1 rounded shadow-xl whitespace-nowrap opacity-0 group-hover/bar:opacity-100 transition-opacity pointer-events-none">
                          {dataObj.count} tasks
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* X Axis Labels */}
              <div className="flex justify-between text-[10px] md:text-xs text-zinc-500 font-medium mt-4 px-2">
                {chartData.map((d, i) => <span key={i} className="flex-1 text-center truncate">{d.name}</span>)}
              </div>

              {/* Subject Breakdown Aggregation Area */}
              {sortedTypes.length > 0 ? (
                <div className="mt-10 pt-8 border-t border-black/5 dark:border-white/[0.05] grid grid-cols-1 md:grid-cols-2 gap-4">
                  {sortedTypes.slice(0, 4).map(([typeStr, total], idx) => {
                    const colors = ["bg-cyan-500", "bg-emerald-400", "bg-fuchsia-500", "bg-violet-500"];
                    const c = colors[idx % colors.length];
                    return (
                      <div key={typeStr} className="flex items-center justify-between text-sm bg-black/[0.02] dark:bg-white/[0.02] border border-black/5 dark:border-white/[0.05] p-3.5 rounded-xl card-hover">
                        <span className="text-zinc-300 flex items-center gap-2.5 font-medium">
                          <span className={`w-2.5 h-2.5 rounded-full ${c} shadow-[0_0_10px_rgba(255,255,255,0.2)]`} />
                          {typeStr}
                        </span>
                        <span className="text-zinc-900 dark:text-white font-bold bg-black/5 dark:bg-white/[0.05] px-2 py-0.5 rounded-md">{total} quests</span>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="mt-10 pt-8 border-t border-black/5 dark:border-white/[0.05] text-center text-zinc-500 text-sm">
                  No tasks marked complete for this week.
                </div>
              )}
            </div>

            {/* Mentor Suggestions */}
            <div className="mt-8">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-8 h-8 rounded-lg bg-violet-500/10 border border-violet-500/20 flex items-center justify-center text-violet-400">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="16" x2="12" y2="12"></line><line x1="12" y1="8" x2="12.01" y2="8"></line></svg>
                </div>
                <h3 className="text-lg font-bold text-zinc-900 dark:text-white">Lumi Mentor Tips</h3>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {mentorAdvice.map((advice, idx) => (
                  <div key={idx} className="bg-white/40 dark:bg-black/50 backdrop-blur-xl border border-black/5 dark:border-white/[0.08] p-5 rounded-2xl flex gap-4 card-hover">
                    <div className="text-2xl pt-1">{advice.icon}</div>
                    <div>
                      <h4 className="text-sm font-bold text-zinc-900 dark:text-white mb-1">{advice.title}</h4>
                      <p className="text-xs text-zinc-600 dark:text-zinc-400 leading-relaxed">{advice.text}</p>
                    </div>
                  </div>
                ))}
                {mentorAdvice.length === 0 && (
                  <div className="md:col-span-2 py-8 text-center bg-black/[0.02] dark:bg-white/[0.02] border border-dashed border-white/10 rounded-2xl text-zinc-500 text-sm">
                    Complete more tasks to unlock personalized AI suggestions!
                  </div>
                )}
              </div>
            </div>
          </div>
        </section>
      )}

      {/* Share Modal Fallback */}
      {showShareModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-300">
          <div className="bg-[#18181b] border border-white/10 rounded-3xl p-6 w-full max-w-md shadow-2xl">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xl font-bold">Share Mastery</h3>
              <button
                onClick={() => setShowShareModal(false)}
                className="text-zinc-500 hover:text-white transition-colors"
              >
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
              </button>
            </div>

            <div className="aspect-video w-full bg-black/40 rounded-xl mb-6 overflow-hidden border border-white/5 relative">
              {previewUrl && (
                <img
                  src={previewUrl}
                  alt="Dashboard Preview"
                  className="w-full h-full object-cover opacity-80"
                />
              )}
              <div className="absolute inset-0 flex items-center justify-center">
                <button
                  onClick={downloadImage}
                  className="bg-white text-black px-4 py-2 rounded-full font-bold text-xs shadow-xl hover:scale-105 transition-transform"
                >
                  Download PNG
                </button>
              </div>
            </div>

            <div className="space-y-3">
              <p className="text-xs text-zinc-500 font-medium uppercase tracking-widest mb-2">Share to</p>

              <a
                href={`https://wa.me/?text=${encodeURIComponent("Check out my weekly mastery progress on Lumi! 🔥 Join me at: " + window.location.origin)}`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-between p-4 bg-emerald-500/10 border border-emerald-500/20 rounded-2xl hover:bg-emerald-500/20 transition-all group"
              >
                <div className="flex items-center gap-3">
                  <span className="text-emerald-400">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor"><path d="M12.031 6.172c-2.32 0-4.591.547-6.578 1.578-.188.094-.391.125-.578.078l-2.422-.641c-.266-.078-.531.063-.609.313-.031.094-.031.188.016.281l.688 2.453c.047.172.031.375-.063.547-1.125 2.125-1.734 4.516-1.734 6.906 0 7.828 6.516 11.891 11.219 11.891 7.422 0 11.234-4.875 11.234-11.891.016-7.828-6.516-11.419-11.172-11.419zm7.063 15.672c-1.859 1.578-4.328 2.375-6.953 2.375-5.047 0-9.141-3.609-9.141-8.047 0-1.844.594-3.641 1.719-5.188.031-.047.047-.094.047-.141l-.422-1.5 1.484.391c.047.016.094.016.141 0 1.625-.797 3.422-1.219 5.25-1.219 4.953 0 9.063 3.438 9.063 8.047 0 1.953-.781 3.828-2.188 5.281zm-2.438-5.359c-.438-.156-.813-.297-.844-.313-.047-.031-.094-.063-.125-.109-.031-.047-.391-.531-.484-.656-.047-.063-.109-.094-.188-.094s-.141.031-.188.078l-.688.75c-.047.063-.109.078-.172.063-.328-.109-.641-.25-1-.422-.484-.234-.953-.516-1.375-.859-.047-.047-.078-.109-.063-.172l.141-.219.266-.344c.047-.047.063-.125.047-.188-.016-.063-.094-.25-.172-.453-.078-.188-.172-.406-.281-.594-.031-.063-.094-.109-.156-.125h-.156c-.094.016-.188.047-.266.109-.594.438-.859 1.156-.641 1.844.172.547.484 1.125.922 1.703a8.216 8.216 0 0 0 2.219 1.984c.641.359 1.25.563 1.844.609h.203c.516 0 1.047-.281 1.344-.688.094-.125.125-.266.125-.406-.016-.078-.016-.141-.047-.203z" /></svg>
                  </span>
                  <div>
                    <p className="text-zinc-200 font-bold text-sm">WhatsApp</p>
                    <p className="text-[10px] text-zinc-500">Send to your status or friends</p>
                  </div>
                </div>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-zinc-600 group-hover:translate-x-1 transition-transform"><line x1="5" y1="12" x2="19" y2="12"></line><polyline points="12 5 19 12 12 19"></polyline></svg>
              </a>

              <a
                href={`https://www.reddit.com/r/learnprogramming/submit?title=${encodeURIComponent("My Weekly Progress on Lumi 🔥")}&url=${encodeURIComponent(window.location.origin)}`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-between p-4 bg-orange-500/10 border border-orange-500/20 rounded-2xl hover:bg-orange-500/20 transition-all group"
              >
                <div className="flex items-center gap-3">
                  <span className="text-orange-400">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor"><path d="M12 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0zm5.01 4.744c.688 0 1.25.561 1.25 1.249a1.25 1.25 0 0 1-2.498.056l-2.597-.547-.8 3.747c1.824.07 3.48.632 4.674 1.488.308-.309.73-.491 1.207-.491.965 0 1.75.783 1.75 1.75 0 .612-.315 1.141-.787 1.45.013.123.021.248.021.373 0 2.417-3.23 4.384-7.208 4.384-3.978 0-7.208-1.967-7.208-4.384 0-.125.008-.25.021-.373a1.742 1.742 0 0 1-.787-1.45c0-.967.783-1.75 1.75-1.75.477 0 .899.182 1.207.491 1.192-.856 2.846-1.417 4.671-1.488l.926-4.321 3.23.681c.01-.1.025-.198.05-.294zM8.5 11.235c.691 0 1.25.559 1.25 1.25 0 .691-.559 1.25-1.25 1.25-.691 0-1.25-.559-1.25-1.25 0-.691.559-1.25 1.25-1.25zm7 0c.691 0 1.25.559 1.25 1.25 0 .691-.559 1.25-1.25 1.25-.691 0-1.25-.559-1.25-1.25 0-.691.559-1.25 1.25-1.25zm-3.69 4.156c1.614 0 2.863-.122 3.863-.338.077-.013.155.039.172.116l.044.204c.018.083-.039.164-.122.181-1.026.222-2.316.347-3.957.347-1.64 0-2.932-.125-3.957-.347-.083-.017-.139-.098-.122-.181l.044-.204c.017-.077.095-.129.172-.116 1 .216 2.249.338 3.863.338z" /></svg>
                  </span>
                  <div>
                    <p className="text-zinc-200 font-bold text-sm">Reddit</p>
                    <p className="text-[10px] text-zinc-500">Post to r/learnprogramming</p>
                  </div>
                </div>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-zinc-600 group-hover:translate-x-1 transition-transform"><line x1="5" y1="12" x2="19" y2="12"></line><polyline points="12 5 19 12 12 19"></polyline></svg>
              </a>
            </div>

            <p className="mt-6 text-[10px] text-zinc-600 text-center uppercase tracking-widest leading-loose">
              <span className="text-zinc-400">Pro Tip:</span> Download your dashboard image first, then attach it manually when sharing!
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
