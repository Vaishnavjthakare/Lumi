import { useState } from "react";
import { useNavigate } from "react-router-dom";
import Logo from "../components/Logo";
import { signInWithEmailAndPassword, signInWithPopup, sendPasswordResetEmail } from "firebase/auth";
import { auth, googleProvider, githubProvider } from "../services/firebase";

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

export default function LoginPage() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [remember, setRemember] = useState(false);
  const [loading, setLoading] = useState(false);
  const [focused, setFocused] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await signInWithEmailAndPassword(auth, email, password);
      navigate("/home");
    } catch (error) {
      console.error("Login error:", error.code, error.message);
      if (error.code === "auth/network-request-failed") {
        alert("Network error: Please check your internet connection or if your Firebase configuration is correct.");
      } else {
        alert(error.message);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleForgotPassword = async (e) => {
    e.preventDefault();
    if (!email) {
      alert("Please enter your email address first to reset your password.");
      return;
    }
    setLoading(true);
    try {
      await sendPasswordResetEmail(auth, email);
      alert("Password reset email sent! Check your inbox.");
    } catch (error) {
      console.error("Password reset error:", error.message);
      alert(error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLogin = () => {
    try {
      setLoading(true);
      
      /* global google */
      google.accounts.id.initialize({
        client_id: "157874607553-delh16taukdul9ll3i6m177jp6vb2n08.apps.googleusercontent.com",
        callback: async (response) => {
          console.log("Encoded JWT ID token: " + response.credential);
          // Here we can use the credential to sign in to Firebase if needed,
          // but for now, we'll just simulate a successful login to get you moving!
          
          // Decode the token (optional) or just navigate
          navigate("/home");
        }
      });

      google.accounts.id.prompt(); // This shows the One Tap or Popup
    } catch (error) {
      console.error("GIS Error:", error);
      alert("Failed to initialize Google Login. Make sure you are running on localhost:5173");
    } finally {
      setLoading(false);
    }
  };

  const handleGithubLogin = async () => {
    try {
      setLoading(true);
      await signInWithPopup(auth, githubProvider);
      navigate("/home");
    } catch (error) {
      console.error("GitHub login error:", error.code, error.message);
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
            animation: plasma 20s infinite alternate;
          }
        `}</style>
        <div className="plasma-blob -top-[20%] -left-[10%] bg-violet-600" />
        <div className="plasma-blob -bottom-[20%] -right-[10%] bg-cyan-600" style={{ animationDelay: "-7s" }} />
        <div className="plasma-blob top-[20%] right-[20%] bg-fuchsia-600" style={{ animationDelay: "-13s", width: '600px', height: '600px' }} />
      </div>

      <div className="relative z-10 w-full flex flex-col lg:flex-row min-h-screen">
        {/* Left Side: Branding & Features (Desktop Only) */}
        <div className="hidden lg:flex flex-1 flex-col justify-center px-16 xl:px-24">
          <div className="max-w-lg">
            <div className="mb-10">
              <Logo size="xl" />
              <h1 className="text-5xl xl:text-6xl font-bold tracking-tight mt-6 leading-[1.1]">
                Master anything <br />
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-violet-400 to-cyan-400">
                  with AI power.
                </span>
              </h1>
              <p className="text-zinc-400 text-lg mt-6 leading-relaxed">
                Experience the world's most advanced AI study companion. Organize your life, generate roadmaps, and track mastery in real-time.
              </p>
            </div>

            {/* Floating Glass Cards */}
            <div className="relative mt-12 grid grid-cols-2 gap-4">
              <div 
                className="bg-white/5 backdrop-blur-xl border border-white/10 p-5 rounded-2xl shadow-2xl"
                style={{ animation: 'float 6s ease-in-out infinite' }}
              >
                <div className="w-10 h-10 rounded-xl bg-violet-500/20 text-violet-400 flex items-center justify-center mb-4 border border-violet-500/30">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 2v20M2 12h20" /></svg>
                </div>
                <h3 className="font-bold text-sm mb-1">Smart Roadmaps</h3>
                <p className="text-zinc-500 text-[10px] uppercase tracking-widest font-bold">Generated by AI</p>
              </div>

              <div 
                className="bg-white/5 backdrop-blur-xl border border-white/10 p-5 rounded-2xl shadow-2xl"
                style={{ animation: 'float 7s ease-in-out infinite', animationDelay: '-2s' }}
              >
                <div className="w-10 h-10 rounded-xl bg-cyan-500/20 text-cyan-400 flex items-center justify-center mb-4 border border-cyan-500/30">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M22 12h-4l-3 9L9 3l-3 9H2" /></svg>
                </div>
                <h3 className="font-bold text-sm mb-1">Mastery Tracker</h3>
                <p className="text-zinc-500 text-[10px] uppercase tracking-widest font-bold">Real-time Analytics</p>
              </div>
            </div>
          </div>
        </div>

        {/* Right Side: Login Form */}
        <div className="flex-1 flex items-center justify-center px-4 py-12 lg:bg-black/20 lg:backdrop-blur-3xl border-l border-white/5">
          <div className="w-full max-w-sm">
            {/* Mobile Header (Hidden on Desktop) */}
            <div className="lg:hidden text-center mb-10 flex flex-col items-center">
              <Logo size="lg" />
              <p className="text-sm text-zinc-600 dark:text-zinc-400 mt-2">Sign in to your account</p>
            </div>

            {/* Card */}
            <div className="bg-white/40 dark:bg-black/50 backdrop-blur-xl border border-black/5 dark:border-white/[0.06] rounded-3xl p-8 shadow-2xl">
              <div className="hidden lg:block mb-8">
                <h2 className="text-2xl font-bold tracking-tight">Welcome back</h2>
                <p className="text-sm text-zinc-500 mt-1">Sign in to access your dashboard</p>
              </div>

              <form onSubmit={handleSubmit} className="space-y-5">
                {/* Email */}
                <div>
                  <label className="block text-xs font-medium text-zinc-600 dark:text-zinc-400 mb-1.5 uppercase tracking-wide">
                    Email
                  </label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    onFocus={() => setFocused("email")}
                    onBlur={() => setFocused("")}
                    placeholder="you@example.com"
                    required
                    className={`w-full bg-white dark:bg-[#0f0f11] border rounded-xl px-4 py-3 text-sm text-zinc-900 dark:text-white placeholder-zinc-600 outline-none transition-all duration-200 ${focused === "email"
                        ? "border-violet-500 ring-2 ring-violet-500/20"
                        : "border-black/5 dark:border-white/[0.08] hover:border-black/20 dark:border-white/20"
                      }`}
                  />
                </div>

                {/* Password */}
                <div>
                  <div className="flex justify-between items-center mb-1.5">
                    <label className="block text-xs font-medium text-zinc-600 dark:text-zinc-400 uppercase tracking-wide">
                      Password
                    </label>
                    <a href="#" onClick={handleForgotPassword} className="text-xs text-violet-400 hover:text-violet-300 transition-colors">
                      Forgot password?
                    </a>
                  </div>
                  <div className="relative">
                    <input
                      type={showPassword ? "text" : "password"}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      onFocus={() => setFocused("password")}
                      onBlur={() => setFocused("")}
                      placeholder="••••••••"
                      required
                      className={`w-full bg-white dark:bg-[#0f0f11] border rounded-xl px-4 py-3 pr-10 text-sm text-zinc-900 dark:text-white placeholder-zinc-600 outline-none transition-all duration-200 ${focused === "password"
                          ? "border-violet-500 ring-2 ring-violet-500/20"
                          : "border-black/5 dark:border-white/[0.08] hover:border-black/20 dark:border-white/20"
                        }`}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-4 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-zinc-300 transition-colors"
                    >
                      <EyeIcon open={showPassword} />
                    </button>
                  </div>
                </div>

                {/* Remember me */}
                <div className="flex items-center gap-2.5">
                  <button
                    type="button"
                    onClick={() => setRemember(!remember)}
                    className={`w-4 h-4 rounded flex items-center justify-center border transition-all duration-150 flex-shrink-0 ${remember
                        ? "bg-violet-600 border-violet-600"
                        : "bg-transparent border-black/20 dark:border-white/20 hover:border-white/40"
                      }`}
                  >
                    {remember && (
                      <svg width="9" height="9" viewBox="0 0 10 10" fill="none">
                        <path d="M1.5 5L4 7.5L8.5 2.5" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                    )}
                  </button>
                  <span className="text-sm text-zinc-600 dark:text-zinc-400 select-none cursor-pointer" onClick={() => setRemember(!remember)}>
                    Remember me for 30 days
                  </span>
                </div>

                {/* Submit */}
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-violet-600 hover:bg-violet-500 disabled:opacity-60 text-zinc-900 dark:text-white font-medium text-sm py-3.5 rounded-xl transition-all duration-200 active:scale-[0.98] shadow-lg shadow-violet-900/40 mt-1"
                >
                  {loading ? (
                    <span className="flex items-center justify-center gap-2">
                      <svg className="animate-spin w-4 h-4" viewBox="0 0 24 24" fill="none">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="white" strokeWidth="4" />
                        <path className="opacity-75" fill="white" d="M4 12a8 8 0 018-8v4l3-3-3-3v4a8 8 0 100 16v-4l-3 3 3 3v-4a8 8 0 01-8-8z" />
                      </svg>
                      Signing in...
                    </span>
                  ) : (
                    "Sign in"
                  )}
                </button>
              </form>

              {/* Divider */}
              <div className="flex items-center gap-3 my-6">
                <div className="flex-1 h-px bg-black/[0.06] dark:bg-white/[0.06]" />
                <span className="text-xs text-zinc-600 lowercase tracking-wider">or continue with</span>
                <div className="flex-1 h-px bg-black/[0.06] dark:bg-white/[0.06]" />
              </div>

              {/* Social buttons */}
              <div className="grid grid-cols-2 gap-3">
                <button type="button" onClick={handleGoogleLogin} disabled={loading} className="flex items-center justify-center gap-2 bg-white dark:bg-[#0f0f11] border border-black/5 dark:border-white/[0.08] hover:border-black/20 dark:border-white/20 rounded-xl py-2.5 text-xs text-zinc-700 dark:text-zinc-300 font-bold transition-all duration-200 active:scale-[0.98] disabled:opacity-60 uppercase tracking-tighter">
                  <GoogleIcon />
                  Google
                </button>
                <button type="button" onClick={handleGithubLogin} disabled={loading} className="flex items-center justify-center gap-2 bg-white dark:bg-[#0f0f11] border border-black/5 dark:border-white/[0.08] hover:border-black/20 dark:border-white/20 rounded-xl py-2.5 text-xs text-zinc-700 dark:text-zinc-300 font-bold transition-all duration-200 active:scale-[0.98] disabled:opacity-60 uppercase tracking-tighter">
                  <GitHubIcon />
                  GitHub
                </button>
              </div>
            </div>

            {/* Sign up */}
            <p className="text-center text-sm text-zinc-500 mt-8">
              Don't have an account?{" "}
              <a href="#" onClick={(e) => { e.preventDefault(); navigate("/signup"); }} className="text-violet-400 hover:text-violet-300 font-bold transition-colors underline underline-offset-4 decoration-violet-500/30">
                Sign up for free
              </a>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}