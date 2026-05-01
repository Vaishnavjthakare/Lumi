import { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";

const SmartRoadMap = () => {
  const navigate = useNavigate();
  const [goal, setGoal] = useState("");
  const [level, setLevel] = useState("");
  const [timeframe, setTimeframe] = useState("");
  const [hoursPerWeek, setHoursPerWeek] = useState("");
  const [steps, setSteps] = useState([]);
  const [overviewContext, setOverviewContext] = useState("");
  const [keyStack, setKeyStack] = useState([]);
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(false);
  const [generated, setGenerated] = useState(false);
  const flowchartRef = useRef(null);
  const coursesRef = useRef(null);

  const scrollToCourses = () => {
    if (coursesRef.current) {
      coursesRef.current.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  };

  const colors = [
    { main: "#8b5cf6", glow: "rgba(139, 92, 246, 0.25)", gradient: "linear-gradient(135deg, #8b5cf6, #a78bfa)" },
    { main: "#06b6d4", glow: "rgba(6, 182, 212, 0.25)", gradient: "linear-gradient(135deg, #06b6d4, #67e8f9)" },
    { main: "#ec4899", glow: "rgba(236, 72, 153, 0.25)", gradient: "linear-gradient(135deg, #ec4899, #f9a8d4)" },
    { main: "#10b981", glow: "rgba(16, 185, 129, 0.25)", gradient: "linear-gradient(135deg, #10b981, #6ee7b7)" },
    { main: "#f59e0b", glow: "rgba(245, 158, 11, 0.25)", gradient: "linear-gradient(135deg, #f59e0b, #fcd34d)" },
    { main: "#f43f5e", glow: "rgba(244, 63, 94, 0.25)", gradient: "linear-gradient(135deg, #f43f5e, #fda4af)" },
  ];

  useEffect(() => {
    if (generated && flowchartRef.current) {
      setTimeout(() => {
        flowchartRef.current.scrollIntoView({ behavior: "smooth", block: "start" });
      }, 200);
    }
  }, [generated]);

  const generateRoadmap = async () => {
    if (!goal || !level) {
      alert("Please enter a goal and a difficulty level!");
      return;
    }

    setLoading(true);
    setGenerated(false);
    setSteps([]);
    setOverviewContext("");

    const apiKey = "AIzaSyBr5uDUcjQPsYFlxDIMLT6PslA1KI2lgWs";

    const promptText = `Create a structured learning roadmap for "${goal}" for a ${level} student. 
${timeframe ? `The total allowed timeframe to learn this is ${timeframe}. ` : ""}
${hoursPerWeek ? `The student can study for ${hoursPerWeek} hours per week. ` : ""}
Return ONLY a raw JSON object strictly in this format without markdown wrappers. Do not include markdown code ticks:
{
  "goal_overview": "A brief AI-generated summary of what the goal is, why it's valuable to learn, and the career outlook.",
  "key_stack": ["Language/Tool 1", "Language/Tool 2", "Core Concept"],
  "roadmap": [{"title": "Step 1: Basics", "info": "Detailed description of what to learn...", "duration": "Estimated time", "project": "A small project to build"}],
  "suggested_courses": [{"title": "Course Title", "platform": "Platform Name (Coursera/Udemy/YouTube)", "link": "The URL if known, else empty"}]
}`;

    try {
      const response = await axios.post(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`,
        {
          contents: [
            {
              parts: [
                {
                  text: promptText,
                },
              ],
            },
          ],
        },
        {
          headers: {
            "Content-Type": "application/json",
          },
        }
      );

      let parsedSteps = [];
      let parsedOverview = "";
      let parsedStack = [];
      let parsedCourses = [];
      try {
        let textResponse = response.data.candidates[0].content.parts[0].text;
        textResponse = textResponse.replace(/```json/g, "").replace(/```/g, "").trim();
        const parsedJson = JSON.parse(textResponse);
        parsedSteps = parsedJson.roadmap || [];
        parsedOverview = parsedJson.goal_overview || "";
        parsedStack = parsedJson.key_stack || [];
        parsedCourses = parsedJson.suggested_courses || [];
      } catch (err) {
        console.error("JSON parse failed. Fallback triggered.", err);
        const rawText = response.data.candidates[0].content.parts[0].text;
        const rawSteps = rawText.split("\n").filter(s => s.trim().length > 3);
        parsedSteps = rawSteps.map(s => ({ title: s.replace(/^[0-9.-]+\s*/, ''), info: "" }));
        parsedOverview = `An overarching breakdown of the ${goal} learning path.`;
        parsedStack = [goal, "Basics", "Best Practices"];
        parsedCourses = [];
      }

      setSteps(parsedSteps);
      setOverviewContext(parsedOverview);
      setKeyStack(parsedStack);
      setCourses(parsedCourses);
      setGenerated(true);
    } catch (error) {
      console.error(error);
      const simulatedSteps = [
        { title: `Phase 1: Introduction to ${goal}`, info: `Learn the fundamentals, terminology, and core concepts of ${goal}.`, duration: "1-2 Weeks", project: "Hello World Application" },
        { title: `Phase 2: Core Principles`, info: `Dive deep into the primary mechanisms shaping ${goal}.`, duration: "2-4 Weeks", project: "Interactive Component Demo" },
        { title: `Phase 3: Practical Application`, info: `Build projects tailored to a ${level} understanding.`, duration: "4+ Weeks", project: "Full CRUD Web App" },
      ];
      setSteps(simulatedSteps);
      setOverviewContext(`${goal} is a highly requested learning path. Mastering this unlocks significant modern career opportunities.`);
      setKeyStack([goal, "Fundamentals", "Architecture"]);
      setCourses([
        { title: `${goal} Masterclass`, platform: "Udemy", link: "" },
        { title: `Introduction to ${goal}`, platform: "YouTube", link: "" }
      ]);
      setGenerated(true);
    }

    setLoading(false);
  };

  const levelBadge = {
    beginner: { label: "Beginner", color: "#10b981" },
    intermediate: { label: "Intermediate", color: "#f59e0b" },
    advanced: { label: "Advanced", color: "#f43f5e" },
  };

  return (
    <div className="min-h-screen w-full bg-transparent text-zinc-900 dark:text-white relative overflow-x-hidden">
      {/* Inline styles for custom animations */}
      <style>{`
        @keyframes flowchart-fade-in {
          from { opacity: 0; transform: translateY(30px) scale(0.96); }
          to { opacity: 1; transform: translateY(0) scale(1); }
        }
        @keyframes connector-grow {
          from { transform: scaleY(0); }
          to { transform: scaleY(1); }
        }
        @keyframes dot-pulse {
          0%, 100% { opacity: 0.3; transform: scale(0.8); }
          50% { opacity: 1; transform: scale(1.2); }
        }
        @keyframes dot-travel {
          0% { top: 0; opacity: 0; }
          10% { opacity: 1; }
          90% { opacity: 1; }
          100% { top: calc(100% - 8px); opacity: 0; }
        }
        @keyframes ring-pulse {
          0%, 100% { box-shadow: 0 0 0 0px rgba(139, 92, 246, 0.4); }
          50% { box-shadow: 0 0 0 8px rgba(139, 92, 246, 0); }
        }
        @keyframes shimmer {
          0% { background-position: -200% 0; }
          100% { background-position: 200% 0; }
        }
        .flowchart-node {
          animation: flowchart-fade-in 0.6s cubic-bezier(0.16, 1, 0.3, 1) forwards;
          opacity: 0;
        }
        .connector-line {
          animation: connector-grow 0.5s cubic-bezier(0.16, 1, 0.3, 1) forwards;
          transform-origin: top center;
          transform: scaleY(0);
        }
        .travel-dot {
          animation: dot-travel 2s ease-in-out infinite;
          position: absolute;
          width: 6px;
          height: 6px;
          border-radius: 50%;
          left: 50%;
          transform: translateX(-50%);
        }
        .step-number-ring {
          animation: ring-pulse 2.5s ease-in-out infinite;
        }
      `}</style>

      {/* Glow blobs background */}
      <div className="absolute top-[-100px] left-1/2 -translate-x-1/2 w-[600px] h-[300px] rounded-full bg-violet-700 opacity-10 blur-[130px] pointer-events-none" />

      <div className="relative z-10 w-full max-w-5xl mx-auto px-6 lg:px-12 py-10 lg:py-16">
        {/* Back Button */}
        <button
          onClick={() => navigate("/home")}
          className="flex items-center gap-2 text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:text-white text-sm font-medium mb-8 group transition-colors duration-200"
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="transition-transform duration-200 group-hover:-translate-x-1">
            <line x1="19" y1="12" x2="5" y2="12"></line>
            <polyline points="12 19 5 12 12 5"></polyline>
          </svg>
          Back to Home
        </button>

        {/* Header */}
        <div className="text-center mb-10">
          <h1 className="text-4xl md:text-5xl font-bold tracking-tight mb-4 text-zinc-900 dark:text-white">
            Smart{" "}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-violet-400 to-cyan-400 tracking-tight">
              Roadmap Generator
            </span>
          </h1>
          <p className="text-zinc-600 dark:text-zinc-400 max-w-xl mx-auto">
            Input your goal and let AI map out the exact path you need to take to master your target field.
          </p>
        </div>

        {/* Input Section */}
        <div className="flex flex-col gap-4 mb-12 bg-white/40 dark:bg-black/50 backdrop-blur-xl border border-black/5 dark:border-white/[0.08] p-5 rounded-2xl shadow-2xl w-full max-w-4xl mx-auto">
          <div className="flex flex-col md:flex-row gap-4">
            <input
              type="text"
              placeholder="Enter your goal (e.g. Data Science)"
              value={goal}
              onChange={(e) => setGoal(e.target.value)}
              className="flex-1 bg-black/40 border border-black/10 dark:border-white/10 rounded-xl px-5 py-3.5 text-sm text-zinc-900 dark:text-white placeholder-zinc-500 focus:outline-none focus:border-violet-500/50 transition-colors"
            />
            <select
              value={level}
              onChange={(e) => setLevel(e.target.value)}
              className="w-full md:w-48 bg-white dark:bg-[#0f0f11] border border-black/10 dark:border-white/10 rounded-xl px-4 py-3.5 text-sm text-zinc-900 dark:text-white focus:outline-none focus:border-violet-500/50 transition-colors"
            >
              <option value="" className="text-zinc-500">Select Level</option>
              <option value="beginner">Beginner</option>
              <option value="intermediate">Intermediate</option>
              <option value="advanced">Advanced</option>
            </select>
          </div>
          <div className="flex flex-col md:flex-row gap-4">
            <select
              value={timeframe}
              onChange={(e) => setTimeframe(e.target.value)}
              className="flex-1 bg-white dark:bg-[#0f0f11] border border-black/10 dark:border-white/10 rounded-xl px-4 py-3.5 text-sm text-zinc-900 dark:text-white focus:outline-none focus:border-violet-500/50 transition-colors"
            >
              <option value="" className="text-zinc-500">Timeframe (Optional)</option>
              <option value="1 Month">1 Month</option>
              <option value="3 Months">3 Months</option>
              <option value="6 Months">6 Months</option>
              <option value="1 Year">1 Year</option>
            </select>
            <select
              value={hoursPerWeek}
              onChange={(e) => setHoursPerWeek(e.target.value)}
              className="flex-1 bg-white dark:bg-[#0f0f11] border border-black/10 dark:border-white/10 rounded-xl px-4 py-3.5 text-sm text-zinc-900 dark:text-white focus:outline-none focus:border-violet-500/50 transition-colors"
            >
              <option value="" className="text-zinc-500">Hours / Week (Optional)</option>
              <option value="1-5 Hours">1 - 5 Hours</option>
              <option value="5-10 Hours">5 - 10 Hours</option>
              <option value="10-20 Hours">10 - 20 Hours</option>
              <option value="20+ Hours">20+ Hours</option>
            </select>
            <button
              onClick={generateRoadmap}
              disabled={loading}
              className="bg-violet-600 hover:bg-violet-500 text-zinc-900 dark:text-white font-medium text-sm px-8 py-3.5 rounded-xl transition-all duration-200 active:scale-95 shadow-lg shadow-violet-900/40 whitespace-nowrap min-w-[180px] w-full md:w-auto"
            >
              {loading ? (
                <span className="flex items-center gap-2 justify-center">
                  <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>
                  Generating...
                </span>
              ) : (
                "Generate Flowchart"
              )}
            </button>
          </div>
        </div>

        {/* Flowchart Section — Rendered Below */}
        {!generated && !loading && (
          <div className="w-full max-w-4xl mx-auto min-h-[300px] flex flex-col items-center justify-center text-zinc-600 gap-4 bg-white/40 dark:bg-black/50 backdrop-blur-xl backdrop-blur-sm border border-black/5 dark:border-white/[0.08] rounded-3xl p-12">
            <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round" className="opacity-40">
              <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"></path>
              <polyline points="7.5 4.21 12 6.81 16.5 4.21"></polyline>
              <polyline points="7.5 19.79 7.5 14.6 3 12"></polyline>
              <polyline points="21 12 16.5 14.6 16.5 19.79"></polyline>
              <polyline points="3.27 6.96 12 12.01 20.73 6.96"></polyline>
              <line x1="12" y1="22.08" x2="12" y2="12"></line>
            </svg>
            <p className="font-medium text-sm">Your AI generated flowchart will appear here.</p>
          </div>
        )}

        {/* Loading skeleton */}
        {loading && (
          <div className="w-full max-w-4xl mx-auto flex flex-col items-center gap-6 py-8">
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="flex flex-col items-center gap-4 w-full">
                <div
                  className="w-full max-w-2xl h-24 rounded-2xl bg-white/40 dark:bg-black/50 backdrop-blur-xl border border-black/5 dark:border-white/[0.06]"
                  style={{
                    background: "linear-gradient(90deg, #18181b 25%, #27272a 50%, #18181b 75%)",
                    backgroundSize: "200% 100%",
                    animation: `shimmer 1.5s infinite ${i * 0.15}s`,
                  }}
                />
                {i < 5 && (
                  <div className="w-0.5 h-8 bg-zinc-800 rounded-full" />
                )}
              </div>
            ))}
          </div>
        )}

        {/* Generated Flowchart */}
        {generated && steps.length > 0 && (
          <div ref={flowchartRef} className="w-full max-w-4xl mx-auto flex flex-col items-center pt-4 pb-16">
            {/* Root / Context Node */}
            <div
              className="flowchart-node w-full max-w-2xl"
              style={{ animationDelay: "0s" }}
            >
              <div
                className="relative rounded-2xl p-6 text-center border border-white/15 overflow-hidden"
                style={{
                  background: "linear-gradient(135deg, rgba(139, 92, 246, 0.3), rgba(6, 182, 212, 0.2))",
                  boxShadow: "0 20px 50px -12px rgba(139, 92, 246, 0.3), 0 0 0 1px rgba(255,255,255,0.05) inset",
                }}
              >
                {/* Shimmer overlay */}
                <div className="absolute inset-0 opacity-10 pointer-events-none" style={{
                  background: "linear-gradient(90deg, transparent, rgba(255,255,255,0.1), transparent)",
                  backgroundSize: "200% 100%",
                  animation: "shimmer 3s infinite",
                }} />

                <span className="inline-block bg-black/10 dark:bg-white/10 text-white/70 text-[10px] uppercase font-bold tracking-widest px-3 py-1 rounded-full mb-3">
                  Your Roadmap
                </span>
                <h2 className="text-2xl md:text-3xl font-bold text-zinc-900 dark:text-white capitalize mb-2">{goal}</h2>
                <span
                  className="inline-block text-sm font-semibold px-4 py-1 rounded-full mt-1"
                  style={{
                    color: levelBadge[level]?.color || "#8b5cf6",
                    backgroundColor: `${levelBadge[level]?.color || "#8b5cf6"}15`,
                    border: `1px solid ${levelBadge[level]?.color || "#8b5cf6"}30`,
                  }}
                >
                  {levelBadge[level]?.label || level} Level
                </span>

                {overviewContext && (
                  <div className="mt-6 pt-5 border-t border-white/10 text-center">
                    <p className="text-zinc-600 dark:text-zinc-300 text-sm leading-relaxed max-w-xl mx-auto mb-5">
                      <strong className="text-violet-500 dark:text-violet-400 mr-2 uppercase tracking-wider text-xs">AI Context:</strong>
                      {overviewContext}
                    </p>
                    
                    {keyStack.length > 0 && (
                      <div className="flex flex-wrap items-center justify-center gap-2 mt-4">
                        <span className="text-[10px] uppercase font-bold text-zinc-500 mr-2 tracking-tighter">Key Stack:</span>
                        {keyStack.map((skill, idx) => (
                          <span 
                            key={idx}
                            className="px-3 py-1 bg-violet-500/10 border border-violet-500/20 text-violet-400 rounded-full text-xs font-semibold"
                          >
                            {skill}
                          </span>
                        ))}
                      </div>
                    )}

                    {courses.length > 0 && (
                      <button 
                        onClick={scrollToCourses}
                        className="mt-8 group relative inline-flex items-center gap-2 px-6 py-2.5 rounded-full bg-violet-600/10 hover:bg-violet-600/20 border border-violet-500/30 text-violet-400 text-xs font-bold uppercase tracking-widest transition-all hover:scale-105 active:scale-95"
                      >
                        <span className="relative z-10">Explore Recommended Courses</span>
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="group-hover:translate-y-0.5 transition-transform">
                          <polyline points="7 13 12 18 17 13"></polyline>
                          <polyline points="7 6 12 11 17 6"></polyline>
                        </svg>
                      </button>
                    )}
                  </div>
                )}
              </div>
            </div>

            {/* Connector from root to first step */}
            <div className="flex flex-col items-center connector-line" style={{ animationDelay: "0.2s" }}>
              <div className="relative w-0.5 h-16 overflow-hidden" style={{ background: "linear-gradient(to bottom, rgba(139, 92, 246, 0.6), rgba(139, 92, 246, 0.1))" }}>
                <div className="travel-dot" style={{ backgroundColor: "#8b5cf6", animationDelay: "0s" }} />
              </div>
              <div className="w-0 h-0 border-l-[6px] border-r-[6px] border-t-[8px] border-l-transparent border-r-transparent" style={{ borderTopColor: "rgba(139, 92, 246, 0.5)" }} />
            </div>

            {/* Step Nodes */}
            {steps.map((step, index) => {
              const color = colors[index % colors.length];
              const delay = (index + 1) * 0.15;

              return (
                <div key={index} className="flex flex-col items-center w-full">
                  {/* Step Card */}
                  <div
                    className="flowchart-node w-full max-w-2xl"
                    style={{ animationDelay: `${delay}s` }}
                  >
                    <div
                      className="card-shimmer relative rounded-2xl p-5 border overflow-hidden transition-all duration-300 hover:scale-[1.01] hover:shadow-2xl group cursor-default"
                      style={{
                        backgroundColor: "rgba(24, 24, 27, 0.95)",
                        borderColor: `${color.main}30`,
                        boxShadow: `0 4px 30px -8px ${color.glow}`,
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.borderColor = `${color.main}60`;
                        e.currentTarget.style.boxShadow = `0 8px 40px -8px ${color.main}40`;
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.borderColor = `${color.main}30`;
                        e.currentTarget.style.boxShadow = `0 4px 30px -8px ${color.glow}`;
                      }}
                    >
                      {/* Left accent bar */}
                      <div
                        className="absolute left-0 top-4 bottom-4 w-1 rounded-full"
                        style={{ background: color.gradient }}
                      />

                      <div className="flex items-start gap-4 pl-4">
                        {/* Step number circle */}
                        <div
                          className="step-number-ring flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold mt-0.5"
                          style={{
                            background: `${color.main}15`,
                            color: color.main,
                            border: `2px solid ${color.main}40`,
                            animationDelay: `${index * 0.5}s`,
                          }}
                        >
                          {index + 1}
                        </div>

                        <div className="flex-1 min-w-0 pb-1">
                          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-1.5">
                            <h3 className="text-base md:text-lg font-bold" style={{ color: color.main }}>
                              {step.title}
                            </h3>
                            {step.duration && (
                              <span 
                                className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-semibold whitespace-nowrap shrink-0"
                                style={{ background: `${color.main}15`, color: color.main, border: `1px solid ${color.main}30` }}
                              >
                                ⌛ {step.duration}
                              </span>
                            )}
                          </div>
                          {step.info && (
                            <p className="text-zinc-600 dark:text-zinc-400 text-sm leading-relaxed mb-3">
                              {step.info}
                            </p>
                          )}
                          {step.project && (
                            <div className="mt-2 text-sm bg-black/20 dark:bg-black/40 rounded-xl p-3 border border-white/5 flex items-start gap-3 relative overflow-hidden group/project transition-colors hover:bg-black/30 dark:hover:bg-black/60">
                              <div className="absolute top-0 left-0 w-1 h-full" style={{ background: color.main }}></div>
                              <span className="shrink-0 text-sm mt-0.5">🚀</span>
                              <div>
                                <span className="font-semibold text-zinc-900 dark:text-white/90 block mb-0.5">Project Target</span>
                                <span className="text-zinc-600 dark:text-zinc-300 text-xs leading-snug block">{step.project}</span>
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Connector to next step */}
                  {index < steps.length - 1 && (
                    <div
                      className="flex flex-col items-center connector-line"
                      style={{ animationDelay: `${delay + 0.1}s` }}
                    >
                      <div
                        className="relative w-0.5 h-12 overflow-hidden"
                        style={{
                          background: `linear-gradient(to bottom, ${color.main}60, ${colors[(index + 1) % colors.length].main}60)`,
                        }}
                      >
                        <div
                          className="travel-dot"
                          style={{
                            backgroundColor: color.main,
                            animationDelay: `${index * 0.3}s`,
                          }}
                        />
                      </div>
                      <div
                        className="w-0 h-0 border-l-[5px] border-r-[5px] border-t-[7px] border-l-transparent border-r-transparent"
                        style={{ borderTopColor: `${colors[(index + 1) % colors.length].main}60` }}
                      />
                    </div>
                  )}
                </div>
              );
            })}

            {/* Completion Node */}
            <div
              className="flowchart-node mt-6 w-full max-w-2xl"
              style={{ animationDelay: `${(steps.length + 1) * 0.15}s` }}
            >
              <div
                className="rounded-2xl p-5 text-center border border-emerald-500/20"
                style={{
                  background: "linear-gradient(135deg, rgba(16, 185, 129, 0.15), rgba(6, 182, 212, 0.1))",
                  boxShadow: "0 8px 30px -8px rgba(16, 185, 129, 0.2)",
                }}
              >
                <div className="flex items-center justify-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-emerald-500/20 flex items-center justify-center">
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#10b981" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                      <polyline points="20 6 9 17 4 12"></polyline>
                    </svg>
                  </div>
                  <span className="text-emerald-400 font-semibold text-lg">Goal Achieved!</span>
                </div>
                <p className="text-zinc-500 text-sm mt-2">Complete all phases to master <span className="text-white/70 font-medium capitalize">{goal}</span></p>
              </div>
            </div>

            {/* Courses Section */}
            {courses.length > 0 && (
              <div 
                ref={coursesRef}
                className="flowchart-node mt-12 w-full max-w-4xl"
                style={{ animationDelay: `${(steps.length + 2) * 0.15}s` }}
              >
                <div className="text-center mb-8">
                  <span className="text-violet-500 dark:text-violet-400 text-[10px] uppercase font-bold tracking-[0.2em] mb-2 block">Take the next step</span>
                  <h3 className="text-2xl font-bold text-zinc-900 dark:text-white">Recommended Courses</h3>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {courses.map((course, idx) => (
                    <div 
                      key={idx}
                      className="group bg-white/5 dark:bg-black/40 backdrop-blur-md border border-white/10 rounded-2xl p-5 transition-all duration-300 hover:border-violet-500/50 hover:bg-white/10 dark:hover:bg-black/60 flex flex-col justify-between"
                    >
                      <div>
                        <div className="flex items-center gap-2 mb-3">
                          <span className={`px-2 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider ${
                            course.platform.toLowerCase().includes('youtube') ? 'bg-red-500/10 text-red-500' : 
                            course.platform.toLowerCase().includes('coursera') ? 'bg-blue-500/10 text-blue-500' :
                            'bg-violet-500/10 text-violet-500'
                          }`}>
                            {course.platform}
                          </span>
                        </div>
                        <h4 className="text-zinc-900 dark:text-white font-semibold mb-2 group-hover:text-violet-400 transition-colors">{course.title}</h4>
                      </div>
                      
                      <a 
                        href={course.link || `https://www.youtube.com/results?search_query=${encodeURIComponent(course.title + ' ' + course.platform)}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="mt-4 flex items-center justify-center gap-2 py-2.5 rounded-xl border border-white/10 text-xs font-semibold text-zinc-600 dark:text-zinc-400 hover:bg-violet-600 hover:text-white hover:border-violet-600 transition-all active:scale-[0.98]"
                      >
                        Explore Resource
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="7" y1="17" x2="17" y2="7"></line><polyline points="7 7 17 7 17 17"></polyline></svg>
                      </a>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default SmartRoadMap;