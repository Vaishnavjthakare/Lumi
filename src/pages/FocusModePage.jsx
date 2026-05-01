import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { db, auth } from '../services/firebase';
import { collection, addDoc } from 'firebase/firestore';
import { onAuthStateChanged } from 'firebase/auth';

export default function FocusModePage() {
    const navigate = useNavigate();
    const [user, setUser] = useState(null);

    // Settings
    const [focusMinutes, setFocusMinutes] = useState(25);
    const [breakMinutes, setBreakMinutes] = useState(5);
    const [isEditingSettings, setIsEditingSettings] = useState(false);

    // Timer State
    const [mode, setMode] = useState('focus'); // 'focus' or 'break'
    const [timeLeft, setTimeLeft] = useState(focusMinutes * 60);
    const [isRunning, setIsRunning] = useState(false);

    // Distractions
    const [brainDump, setBrainDump] = useState("");
    const [thoughts, setThoughts] = useState([]);

    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, setUser);
        return () => unsubscribe();
    }, []);

    useEffect(() => {
        if (!isRunning) return;

        const timer = setInterval(() => {
            setTimeLeft(prev => {
                if (prev <= 1) {
                    clearInterval(timer);
                    handleSessionComplete();
                    return 0;
                }
                return prev - 1;
            });
        }, 1000);

        return () => clearInterval(timer);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [isRunning, mode]);

    const handleSessionComplete = async () => {
        setIsRunning(false);
        
        // Log to Firebase ONLY if it was a focus session
        if (mode === 'focus') {
            if (user) {
                try {
                    const today = new Date();
                    const offset = today.getTimezoneOffset();
                    const dateStr = new Date(today.getTime() - (offset * 60 * 1000)).toISOString().split("T")[0];
                    
                    await addDoc(collection(db, "planner_events"), {
                        userId: user.uid,
                        date: dateStr,
                        title: `${focusMinutes}m Deep Work`,
                        type: "Study",
                        completed: true,
                        createdAt: new Date().toISOString()
                    });
                } catch (err) {
                    console.error("Error logging focus session:", err);
                }
            }
            // Switch to break
            setMode('break');
            setTimeLeft(breakMinutes * 60);
        } else {
            // Break finished, switch to focus
            setMode('focus');
            setTimeLeft(focusMinutes * 60);
        }
    };

    const toggleTimer = () => setIsRunning(!isRunning);

    const resetTimer = () => {
        setIsRunning(false);
        setTimeLeft(mode === 'focus' ? focusMinutes * 60 : breakMinutes * 60);
    };

    const handleSaveSettings = () => {
        setIsEditingSettings(false);
        if (mode === 'focus') setTimeLeft(focusMinutes * 60);
        if (mode === 'break') setTimeLeft(breakMinutes * 60);
    };

    const handleBrainDumpSubmit = (e) => {
        e.preventDefault();
        if(!brainDump.trim()) return;
        setThoughts([{ id: Date.now(), text: brainDump }, ...thoughts]);
        setBrainDump("");
    };

    const mins = Math.floor(timeLeft / 60).toString().padStart(2, '0');
    const secs = (timeLeft % 60).toString().padStart(2, '0');

    // Calculated percentage for circular progress or glow
    const totalCurrentSeconds = mode === 'focus' ? focusMinutes * 60 : breakMinutes * 60;
    const progressPercent = ((totalCurrentSeconds - timeLeft) / totalCurrentSeconds) * 100;

    return (
        <div className="min-h-screen bg-black text-zinc-900 dark:text-white font-sans relative overflow-hidden flex flex-col items-center justify-center">
            
            {/* Background Zen Glow */}
            <div 
                className="absolute inset-0 transition-all duration-1000 opacity-20 pointer-events-none"
                style={{
                    background: `radial-gradient(circle at center, ${mode === 'focus' ? '#10b981' : '#0ea5e9'} ${progressPercent/2}%, transparent 60%)`
                }}
            />

            {/* Top Navigation */}
            <nav className="absolute top-0 left-0 w-full p-8 flex justify-between items-center z-10">
                <button
                    onClick={() => navigate("/planner")}
                    className="flex items-center gap-2 text-zinc-500 hover:text-zinc-900 dark:text-white transition-colors"
                >
                    <div className="w-10 h-10 rounded-full bg-black/5 dark:bg-white/[0.05] border border-white/[0.1] flex items-center justify-center hover:bg-black/[0.1] dark:bg-white/[0.1] hover:scale-105 active:scale-95 transition-all backdrop-blur-md">
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="19" y1="12" x2="5" y2="12"></line><polyline points="12 19 5 12 12 5"></polyline></svg>
                    </div>
                </button>
                <button 
                    onClick={() => setIsEditingSettings(true)}
                    className="text-zinc-500 hover:text-zinc-900 dark:text-white p-2"
                >
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="3"></circle><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"></path></svg>
                </button>
            </nav>

            {/* Core Timer UI */}
            <main className="relative z-10 flex flex-col items-center justify-center flex-1 w-full max-w-4xl mx-auto px-6">
                
                {/* Session Type Switcher */}
                <div className="flex bg-black/5 dark:bg-white/[0.05] border border-black/5 dark:border-white/[0.05] rounded-full p-1.5 mb-16 shadow-2xl backdrop-blur-md">
                    <button 
                        onClick={() => { setMode('focus'); setIsRunning(false); setTimeLeft(focusMinutes * 60); }}
                        className={`px-6 py-2 rounded-full text-sm font-medium transition-all ${mode === 'focus' ? 'bg-emerald-500/20 text-emerald-400 shadow-[0_0_15px_rgba(16,185,129,0.2)]' : 'text-zinc-500 hover:text-zinc-900 dark:text-white'}`}
                    >
                        Focus Flow
                    </button>
                    <button 
                        onClick={() => { setMode('break'); setIsRunning(false); setTimeLeft(breakMinutes * 60); }}
                        className={`px-6 py-2 rounded-full text-sm font-medium transition-all ${mode === 'break' ? 'bg-sky-500/20 text-sky-400 shadow-[0_0_15px_rgba(14,165,233,0.2)]' : 'text-zinc-500 hover:text-zinc-900 dark:text-white'}`}
                    >
                        Short Break
                    </button>
                </div>

                {/* Massive Timer Display */}
                <div className="relative flex flex-col items-center group">
                    <h1 className="text-[140px] md:text-[200px] leading-none font-bold tracking-tighter text-transparent bg-clip-text bg-gradient-to-b from-white to-white/40 select-none">
                        {mins}:{secs}
                    </h1>
                    {/* Controls overlay that appears on hover/pause */}
                    <div className="absolute -bottom-10 flex gap-4 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                        <button 
                            onClick={toggleTimer} 
                            className="bg-black/10 dark:bg-white/10 hover:bg-black/10 dark:hover:bg-white/20 text-zinc-900 dark:text-white rounded-full p-4 transition-transform active:scale-95 backdrop-blur-xl"
                        >
                            {isRunning ? (
                                <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor" stroke="none"><rect x="6" y="4" width="4" height="16"></rect><rect x="14" y="4" width="4" height="16"></rect></svg>
                            ) : (
                                <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor" stroke="none"><polygon points="5 3 19 12 5 21 5 3"></polygon></svg>
                            )}
                        </button>
                        <button 
                            onClick={resetTimer}
                            className="bg-zinc-900 border border-zinc-800 hover:bg-zinc-800 text-zinc-900 dark:text-white rounded-full p-4 transition-transform active:scale-95"
                        >
                            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"></path><polyline points="3 3 3 8 8 8"></polyline></svg>
                        </button>
                    </div>
                </div>

                {/* Subtext */}
                <p className="mt-20 text-zinc-500 tracking-widest uppercase text-sm">
                    {mode === 'focus' ? 'Deep focus blocks distractions.' : 'Rest your eyes.'}
                </p>

            </main>

            {/* Distraction Blocker (Brain Dump UI) */}
            {mode === 'focus' && (
                <div className="absolute bottom-10 left-10 right-10 md:left-auto md:right-10 md:w-[400px] z-20">
                    <div className="card-hover card-shimmer bg-white/40 dark:bg-black/50 backdrop-blur-xl backdrop-blur-2xl border border-black/5 dark:border-white/[0.05] rounded-3xl p-6 shadow-2xl">
                        <h3 className="text-zinc-600 dark:text-zinc-400 text-xs font-semibold uppercase tracking-wider mb-3 flex items-center gap-2">
                            <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse"></span>
                            Distraction Vault
                        </h3>
                        <form onSubmit={handleBrainDumpSubmit} className="relative">
                            <input 
                                type="text" 
                                value={brainDump}
                                onChange={e => setBrainDump(e.target.value)}
                                placeholder="Dump off-topic thoughts here..."
                                className="w-full bg-black/50 border border-black/5 dark:border-white/[0.05] hover:border-emerald-500/30 focus:border-emerald-500 ring-0 rounded-xl px-4 py-3 text-sm text-zinc-900 dark:text-white placeholder-zinc-600 outline-none transition-colors"
                            />
                            <button type="submit" className="absolute right-2 top-2 bottom-2 bg-emerald-500/20 text-emerald-400 hover:bg-emerald-500 hover:text-zinc-900 dark:text-white px-3 rounded-lg text-xs font-medium transition-colors">
                                Dump
                            </button>
                        </form>
                        
                        {/* List of dumped thoughts */}
                        {thoughts.length > 0 && (
                            <div className="mt-4 flex flex-col gap-2 max-h-[120px] overflow-y-auto custom-scrollbar pr-2">
                                {thoughts.map(t => (
                                    <div key={t.id} className="text-xs text-zinc-500 bg-black/[0.02] dark:bg-white/[0.02] border border-white/[0.02] p-2.5 rounded-lg truncate opacity-60">
                                        • {t.text}
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            )}

            {/* Settings Modal */}
            {isEditingSettings && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
                    <div className="bg-white/40 dark:bg-black/50 backdrop-blur-xl border border-white/[0.1] rounded-3xl p-8 max-w-sm w-full shadow-2xl">
                        <h2 className="text-2xl font-bold tracking-tight text-zinc-900 dark:text-white mb-6">Session Timers</h2>
                        
                        <div className="space-y-6">
                            <div>
                                <label className="block text-xs font-medium text-zinc-600 dark:text-zinc-400 mb-2 uppercase tracking-widest">Focus Duration (mins)</label>
                                <input 
                                    type="number" min="1" max="120" 
                                    value={focusMinutes} 
                                    onChange={e => setFocusMinutes(Number(e.target.value))} 
                                    className="w-full bg-white dark:bg-[#0f0f11] border border-black/5 dark:border-white/[0.08] focus:border-white/[0.2] rounded-xl px-4 py-3 text-zinc-900 dark:text-white outline-none" 
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-medium text-zinc-600 dark:text-zinc-400 mb-2 uppercase tracking-widest">Break Duration (mins)</label>
                                <input 
                                    type="number" min="1" max="30" 
                                    value={breakMinutes} 
                                    onChange={e => setBreakMinutes(Number(e.target.value))} 
                                    className="w-full bg-white dark:bg-[#0f0f11] border border-black/5 dark:border-white/[0.08] focus:border-white/[0.2] rounded-xl px-4 py-3 text-zinc-900 dark:text-white outline-none" 
                                />
                            </div>
                            <button 
                                onClick={handleSaveSettings}
                                className="w-full bg-white text-black hover:bg-zinc-200 font-bold py-3.5 rounded-xl transition-colors active:scale-95"
                            >
                                Save Settings
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
