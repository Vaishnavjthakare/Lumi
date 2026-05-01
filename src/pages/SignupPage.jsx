import { createUserWithEmailAndPassword, signInWithPopup } from "firebase/auth";
import { auth, googleProvider, githubProvider } from "../services/firebase";

import { useState } from "react";
import { useNavigate } from "react-router-dom";

const GoogleIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24">
    <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
    <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
    <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
    <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
  </svg>
);

const GitHubIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
    <path d="M12 0C5.374 0 0 5.373 0 12c0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23A11.509 11.509 0 0 1 12 5.803c1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576C20.566 21.797 24 17.3 24 12c0-6.627-5.373-12-12-12z" />
  </svg>
);

const EyeIcon = ({ open }) =>
  open ? (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
      <circle cx="12" cy="12" r="3" />
    </svg>
  ) : (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94" />
      <path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19" />
      <line x1="1" y1="1" x2="23" y2="23" />
    </svg>
  );

export default function SignupPage() {
  const navigate = useNavigate();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [focused, setFocused] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await createUserWithEmailAndPassword(auth, email, password);
      navigate("/");
    } catch (error) {
      console.error("Signup error:", error.code, error.message);
      if (error.code === "auth/network-request-failed") {
        alert("Network error: Please check your internet connection or if your Firebase configuration is correct.");
      } else {
        alert(error.message);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignup = () => {
    try {
      setLoading(true);
      
      /* global google */
      google.accounts.id.initialize({
        client_id: "157874607553-delh16taukdul9ll3i6m177jp6vb2n08.apps.googleusercontent.com",
        callback: async (response) => {
          console.log("Encoded JWT ID token: " + response.credential);
          // Simulate successful signup/login
          navigate("/");
        }
      });

      google.accounts.id.prompt(); 
    } catch (error) {
      console.error("GIS Error:", error);
      alert("Failed to initialize Google Login.");
    } finally {
      setLoading(false);
    }
  };

  const handleGithubSignup = async () => {
    try {
      setLoading(true);
      await signInWithPopup(auth, githubProvider);
      navigate("/");
    } catch (error) {
      console.error("GitHub signup error:", error.code, error.message);
      if (error.code === "auth/network-request-failed") {
        alert("Network error: Please check your internet connection or if your Firebase configuration is correct.");
      } else {
        alert(error.message);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-transparent text-zinc-900 dark:text-white font-sans relative overflow-hidden">
      {/* Dynamic Background Layer */}
      <div className="absolute inset-0 z-0">
        <style>{`
          @keyframes plasma {
            0% { transform: translate(0, 0) scale(1); }
            33% { transform: translate(10%, 10%) scale(1.1); }
            66% { transform: translate(-10%, 5%) scale(0.9); }
            100% { transform: translate(0, 0) scale(1); }
          }
          @keyframes float {
            0%, 100% { transform: translateY(0) rotate(0deg); }
            50% { transform: translateY(-20px) rotate(5deg); }
          }
          .plasma-blob {
            position: absolute;
            width: 800px;
            height: 800px;
            border-radius: 50%;
            filter: blur(120px);
            opacity: 0.15;
            animation: plasma 25s infinite alternate;
          }
        `}</style>
        <div className="plasma-blob -top-[10%] -left-[10%] bg-indigo-600" />
        <div className="plasma-blob -bottom-[10%] -right-[10%] bg-blue-600" style={{ animationDelay: "-5s" }} />
        <div className="plasma-blob top-[30%] right-[40%] bg-emerald-600" style={{ animationDelay: "-12s", width: '500px', height: '500px' }} />
      </div>

      <div className="relative z-10 w-full flex flex-col lg:flex-row min-h-screen">
        {/* Left Side: Branding & Features (Desktop Only) */}
        <div className="hidden lg:flex flex-1 flex-col justify-center px-16 xl:px-24">
          <div className="max-w-lg">
            <h2 className="text-5xl xl:text-6xl font-bold tracking-tight mb-8">
              Unlock your <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-indigo-400">
                true potential.
              </span>
            </h2>
            <p className="text-zinc-400 text-lg mt-6 leading-relaxed mb-10">
              Join the elite circle of learners who use Lumi to automate their study paths and visualize their mastery in high-definition.
            </p>

            {/* Floating Glass Cards */}
            <div className="relative mt-8 grid grid-cols-2 gap-4">
              <div 
                className="bg-white/5 backdrop-blur-xl border border-white/10 p-5 rounded-2xl shadow-2xl"
                style={{ animation: 'float 6s ease-in-out infinite' }}
              >
                <div className="w-10 h-10 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center mb-4 border border-emerald-500/30">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 2v20M2 12h20" /></svg>
                </div>
                <h3 className="font-bold text-sm mb-1">AI Roadmaps</h3>
                <p className="text-zinc-500 text-[10px] uppercase tracking-widest font-bold">Smart Generation</p>
              </div>

              <div 
                className="bg-white/5 backdrop-blur-xl border border-white/10 p-5 rounded-2xl shadow-2xl"
                style={{ animation: 'float 7s ease-in-out infinite', animationDelay: '-2s' }}
              >
                <div className="w-10 h-10 rounded-xl bg-indigo-500/20 text-indigo-400 flex items-center justify-center mb-4 border border-indigo-500/30">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M22 12h-4l-3 9L9 3l-3 9H2" /></svg>
                </div>
                <h3 className="font-bold text-sm mb-1">Study Planner</h3>
                <p className="text-zinc-500 text-[10px] uppercase tracking-widest font-bold">Interactive Habit</p>
              </div>
            </div>

            <div className="flex items-center gap-4 mt-12 px-2">
              <div className="flex -space-x-3">
                 {[1,2,3,4].map(i => (
                   <div key={i} className={`w-8 h-8 rounded-full border-2 border-[#0f0f11] bg-cover bg-[url('https://api.dicebear.com/7.x/avataaars/svg?seed=${i}')]`} />
                 ))}
              </div>
              <p className="text-xs text-zinc-500 font-medium">Join <span className="text-white font-bold">10,429</span> other learners building their future today.</p>
            </div>
          </div>
        </div>

        {/* Right Side: Signup Form */}
        <div className="flex-1 flex items-center justify-center px-4 py-12 lg:bg-black/20 lg:backdrop-blur-3xl border-l border-white/5 relative">
          <div className="w-full max-w-sm relative">
            <button
              onClick={() => navigate("/")}
              className="absolute -top-16 left-0 flex items-center gap-2 text-zinc-500 hover:text-white transition-colors group z-20"
            >
              <div className="w-8 h-8 rounded-full bg-white/5 border border-white/10 flex items-center justify-center group-hover:bg-white/10 transition-all">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="19" y1="12" x2="5" y2="12"></line><polyline points="12 19 5 12 12 5"></polyline></svg>
              </div>
              <span className="text-xs font-bold uppercase tracking-widest">Back</span>
            </button>

            {/* Mobile Header (Hidden on Desktop) */}
            <div className="lg:hidden text-center mb-10 flex flex-col items-center">
              <h1 className="text-3xl font-bold">Join Lumi</h1>
              <p className="text-sm text-zinc-400 mt-2">Start your mastery journey today.</p>
            </div>

            {/* Card */}
            <div className="bg-white/40 dark:bg-black/50 backdrop-blur-xl border border-black/5 dark:border-white/[0.06] rounded-3xl p-8 shadow-2xl">
              <div className="hidden lg:block mb-8">
                <h2 className="text-2xl font-bold tracking-tight">Create your account</h2>
                <p className="text-sm text-zinc-500 mt-1">Free forever for personal use.</p>
              </div>

              <form onSubmit={handleSubmit} className="space-y-4">
                {/* Name */}
                <div>
                  <label className="block text-[10px] font-bold text-zinc-500 mb-1.5 uppercase tracking-widest">Full Name</label>
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    onFocus={() => setFocused("name")}
                    onBlur={() => setFocused("")}
                    placeholder="John Doe"
                    required
                    className={`w-full bg-white dark:bg-[#0f0f11] border rounded-xl px-4 py-3 text-sm text-zinc-900 dark:text-white placeholder-zinc-600 outline-none transition-all duration-200 ${focused === "name" ? "border-emerald-500 ring-2 ring-emerald-500/20" : "border-white/5 hover:border-white/20"}`}
                  />
                </div>

                {/* Email */}
                <div>
                  <label className="block text-[10px] font-bold text-zinc-500 mb-1.5 uppercase tracking-widest">Email Address</label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    onFocus={() => setFocused("email")}
                    onBlur={() => setFocused("")}
                    placeholder="you@example.com"
                    required
                    className={`w-full bg-white dark:bg-[#0f0f11] border rounded-xl px-4 py-3 text-sm text-zinc-900 dark:text-white placeholder-zinc-600 outline-none transition-all duration-200 ${focused === "email" ? "border-emerald-500 ring-2 ring-emerald-500/20" : "border-white/5 hover:border-white/20"}`}
                  />
                </div>

                {/* Password */}
                <div>
                  <label className="block text-[10px] font-bold text-zinc-500 mb-1.5 uppercase tracking-widest">Password</label>
                  <div className="relative">
                    <input
                      type={showPassword ? "text" : "password"}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      onFocus={() => setFocused("password")}
                      onBlur={() => setFocused("")}
                      placeholder="••••••••"
                      required
                      className={`w-full bg-white dark:bg-[#0f0f11] border rounded-xl px-4 py-3 pr-10 text-sm text-zinc-900 dark:text-white placeholder-zinc-600 outline-none transition-all duration-200 ${focused === "password" ? "border-emerald-500 ring-2 ring-emerald-500/20" : "border-white/5 hover:border-white/20"}`}
                    />
                    <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-4 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-white"><EyeIcon open={showPassword} /></button>
                  </div>
                </div>

                {/* Submit */}
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-emerald-600 hover:bg-emerald-500 disabled:opacity-60 text-white font-bold text-sm py-3.5 rounded-xl transition-all duration-200 active:scale-[0.98] shadow-lg shadow-emerald-900/40 mt-4"
                >
                  {loading ? "Creating account..." : "Start Mastery Journey"}
                </button>
              </form>

              {/* Divider */}
              <div className="flex items-center gap-3 my-6">
                <div className="flex-1 h-px bg-white/[0.06]" />
                <span className="text-[10px] font-bold text-zinc-600 uppercase tracking-widest">Social Signup</span>
                <div className="flex-1 h-px bg-white/[0.06]" />
              </div>

              {/* Social buttons */}
              <div className="grid grid-cols-2 gap-3">
                <button onClick={handleGoogleSignup} className="flex items-center justify-center gap-2 bg-white/5 border border-white/10 hover:bg-white/10 rounded-xl py-2.5 text-xs font-bold uppercase tracking-tighter"><GoogleIcon /> Google</button>
                <button onClick={handleGithubSignup} className="flex items-center justify-center gap-2 bg-white/5 border border-white/10 hover:bg-white/10 rounded-xl py-2.5 text-xs font-bold uppercase tracking-tighter"><GitHubIcon /> GitHub</button>
              </div>
            </div>

            {/* Login Link */}
            <p className="text-center text-sm text-zinc-500 mt-8">
              Already a master? {" "}
              <a href="#" onClick={(e) => { e.preventDefault(); navigate("/login"); }} className="text-emerald-400 hover:text-emerald-300 font-bold transition-all underline underline-offset-4 decoration-emerald-500/30">Sign in</a>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
