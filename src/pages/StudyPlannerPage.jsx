import React, { useState, useEffect, useRef } from "react";
import useScrollReveal from "../hooks/useScrollReveal";
import { useNavigate } from "react-router-dom";
import { db, auth } from "../services/firebase";
import { collection, addDoc, getDocs, deleteDoc, updateDoc, doc, query, where } from "firebase/firestore";
import { onAuthStateChanged } from "firebase/auth";

export default function StudyPlannerPage() {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [currentDate, setCurrentDate] = useState(new Date());
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);

  // Visibility toggle
  const [showPlanner, setShowPlanner] = useState(false);
  const plannerRef = useRef(null);

  // Planner Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedDate, setSelectedDate] = useState(null);
  const [newEvent, setNewEvent] = useState({ title: "", type: "Study" });

  // Flashcards State
  const [decks, setDecks] = useState([]);
  const [isCreatingDeck, setIsCreatingDeck] = useState(false);
  const [newDeckTitle, setNewDeckTitle] = useState("");
  const [newCards, setNewCards] = useState([{ question: "", answer: "" }]);

  const [activeDeck, setActiveDeck] = useState(null);
  const [currentCardIndex, setCurrentCardIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      if (currentUser) {
        fetchEvents(currentUser.uid);
        fetchDecks(currentUser.uid);
      } else {
        setEvents([]);
        setDecks([]);
        setLoading(false);
      }
    });
    return () => unsubscribe();
  }, []);

  const fetchEvents = async (uid) => {
    try {
      const q = query(collection(db, "planner_events"), where("userId", "==", uid));
      const querySnapshot = await getDocs(q);
      const fetchedEvents = [];
      querySnapshot.forEach((docSnap) => {
        fetchedEvents.push({ id: docSnap.id, ...docSnap.data() });
      });
      setEvents(fetchedEvents);
    } catch (err) {
      console.error("Error fetching events:", err);
    } finally {
      setLoading(false);
    }
  };

  const fetchDecks = async (uid) => {
    try {
      const q = query(collection(db, "flashcard_decks"), where("userId", "==", uid));
      const querySnapshot = await getDocs(q);
      const fetchedDecks = [];
      querySnapshot.forEach((docSnap) => {
        fetchedDecks.push({ id: docSnap.id, ...docSnap.data() });
      });
      setDecks(fetchedDecks);
    } catch (err) {
      console.error(err);
    }
  };

  const handleOpenPlanner = () => {
    setShowPlanner(true);
    setTimeout(() => {
      plannerRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, 250);
  };

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const firstDayOfMonth = new Date(year, month, 1).getDay(); // 0 is Sunday

  // Navigation handlers
  const handlePrevMonth = () => setCurrentDate(new Date(year, month - 1, 1));
  const handleNextMonth = () => setCurrentDate(new Date(year, month + 1, 1));
  const goToday = () => setCurrentDate(new Date());

  const openModal = (day) => {
    setSelectedDate(new Date(year, month, day));
    setNewEvent({ title: "", type: "Study" });
    setIsModalOpen(true);
  };

  const handleAddEvent = async (e) => {
    e.preventDefault();
    if (!newEvent.title.trim() || !user) return;
    
    const offset = selectedDate.getTimezoneOffset();
    const targetDate = new Date(selectedDate.getTime() - (offset * 60 * 1000));
    const dateStr = targetDate.toISOString().split("T")[0];

    try {
      const docRef = await addDoc(collection(db, "planner_events"), {
        userId: user.uid,
        date: dateStr,
        title: newEvent.title,
        type: newEvent.type,
        completed: false,
        createdAt: new Date().toISOString()
      });
      setEvents([...events, { id: docRef.id, date: dateStr, title: newEvent.title, type: newEvent.type, completed: false }]);
      setNewEvent({ title: "", type: "Study" });
    } catch (err) {
      console.error("Error adding event:", err);
    }
  };

  const handleDeleteEvent = async (id) => {
    try {
      await deleteDoc(doc(db, "planner_events", id));
      setEvents(events.filter(e => e.id !== id));
    } catch (err) {
      console.error("Error deleting event:", err);
    }
  };

  const handleToggleComplete = async (ev) => {
    try {
      await updateDoc(doc(db, "planner_events", ev.id), {
        completed: !ev.completed
      });
      setEvents(events.map(e => e.id === ev.id ? { ...e, completed: !e.completed } : e));
    } catch(err) {
      console.error("Error updating event:", err);
    }
  };

  const getEventsForDay = (day) => {
    const targetDate = new Date(year, month, day);
    const offset = targetDate.getTimezoneOffset();
    const localDate = new Date(targetDate.getTime() - (offset * 60 * 1000));
    const dStr = localDate.toISOString().split("T")[0];
    return events.filter(e => e.date === dStr);
  };

  const monthNames = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
  const daysOfWeek = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

  const EVENT_COLORS = {
    Exam: "bg-fuchsia-500",
    Study: "bg-cyan-500",
    Break: "bg-emerald-500"
  };

  const EVENT_BADGES = {
    Exam: "bg-fuchsia-500/20 text-fuchsia-400 border border-fuchsia-500/30",
    Study: "bg-cyan-500/20 text-cyan-400 border border-cyan-500/30",
    Break: "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30"
  };

  const renderCalendarDays = () => {
    const blanks = [];
    for (let i = 0; i < firstDayOfMonth; i++) {
        blanks.push(<div key={`blank-${i}`} className="border border-white/[0.03] bg-black/[0.01] dark:bg-white/[0.01] p-3 text-transparent pointer-events-none">0</div>);
    }

    const days = [];
    const todayStr = new Date(new Date().getTime() - (new Date().getTimezoneOffset() * 60000)).toISOString().split("T")[0];

    for (let d = 1; d <= daysInMonth; d++) {
        const targetDate = new Date(year, month, d);
        const offset = targetDate.getTimezoneOffset();
        const localDate = new Date(targetDate.getTime() - (offset * 60 * 1000));
        const currentDStr = localDate.toISOString().split("T")[0];
        
        let isTodayHighlight = false;
        if (currentDStr === todayStr) isTodayHighlight = true;

        const dayEvents = getEventsForDay(d);
        
        days.push(
            <div 
              key={`day-${d}`} 
              onClick={() => openModal(d)}
              className={`min-h-[100px] border border-black/5 dark:border-white/[0.05] bg-white/40 dark:bg-black/50 backdrop-blur-xl p-3 hover:bg-black/[0.03] dark:bg-white/[0.03] transition-colors cursor-pointer group hover:border-cyan-500/50 ${isTodayHighlight ? 'ring-1 ring-cyan-500' : ''}`}
            >
                <div className={`text-sm font-medium mb-1.5 inline-flex w-7 h-7 items-center justify-center rounded-full transition-colors ${isTodayHighlight ? 'bg-cyan-600 text-zinc-900 dark:text-white' : 'text-zinc-600 dark:text-zinc-400 group-hover:text-zinc-900 dark:text-white'}`}>{d}</div>
                <div className="flex flex-col gap-1 mt-1">
                    {dayEvents.slice(0, 3).map((ev, idx) => (
                        <div key={idx} className={`flex items-center gap-1.5 ${ev.completed ? 'opacity-40' : ''}`}>
                            <span className={`w-2 h-2 rounded-full ${EVENT_COLORS[ev.type] || 'bg-white'}`}></span>
                            <span className={`text-[10px] truncate ${ev.completed ? 'text-zinc-500 line-through' : 'text-zinc-100'}`}>{ev.title}</span>
                        </div>
                    ))}
                    {dayEvents.length > 3 && (
                        <span className="text-[10px] text-zinc-500 font-medium">+{dayEvents.length - 3} more</span>
                    )}
                </div>
            </div>
        );
    }

    return [...blanks, ...days];
  };

  // --- Flashcard Operations ---
  const handleAddCardRow = () => {
      setNewCards([...newCards, { question: "", answer: "" }]);
  };

  const handleUpdateCardRow = (index, field, value) => {
      const updated = [...newCards];
      updated[index][field] = value;
      setNewCards(updated);
  };

  const handleSaveDeck = async () => {
      if(!user || !newDeckTitle.trim()) return;
      const validCards = newCards.filter(c => c.question.trim() && c.answer.trim());
      if(validCards.length === 0) return;
      
      try {
          const docRef = await addDoc(collection(db, "flashcard_decks"), {
              userId: user.uid,
              title: newDeckTitle,
              cards: validCards,
              createdAt: new Date().toISOString()
          });
          setDecks([{ id: docRef.id, title: newDeckTitle, cards: validCards }, ...decks]);
          setIsCreatingDeck(false);
          setNewDeckTitle("");
          setNewCards([{ question: "", answer: "" }]);
      } catch(err) {
          console.error("Error creating deck:", err);
      }
  };

  const startStudy = (deck) => {
      if(deck.cards.length === 0) return;
      setActiveDeck(deck);
      setCurrentCardIndex(0);
      setIsFlipped(false);
  };

  const nextCard = () => {
      setIsFlipped(false);
      setTimeout(() => {
          if (currentCardIndex < activeDeck.cards.length - 1) {
             setCurrentCardIndex(currentCardIndex + 1);
          } else {
             // Finished deck
             setActiveDeck(null);
             setIsFlipped(false);
          }
      }, 250); 
  };
  
  const prevCard = () => {
      setIsFlipped(false);
      setTimeout(() => {
          if (currentCardIndex > 0) {
             setCurrentCardIndex(currentCardIndex - 1);
          }
      }, 250);
  };

  return (
    <div className="min-h-screen bg-transparent text-zinc-900 dark:text-white font-sans relative overflow-x-hidden pb-12 custom-scrollbar">
      {/* Background aesthetics */}
      <div className="fixed inset-0 opacity-[0.035] pointer-events-none" style={{ backgroundImage: "linear-gradient(#fff 1px, transparent 1px), linear-gradient(90deg, #fff 1px, transparent 1px)", backgroundSize: "48px 48px" }} />
      
      

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
            Sign in to auto-save to cloud
          </span>
        )}
      </nav>

      {/* Hero Section */}
      <main className="relative z-10 px-6 md:px-12 py-10 max-w-5xl mx-auto mb-10 transition-all duration-700 ease-in-out">
        <div className="flex flex-col md:flex-row gap-12 items-center">
          {/* Left Text */}
          <div className="flex-1">
            <span className="inline-flex items-center text-xs font-medium px-3 py-1.5 rounded-full mb-6 bg-cyan-500/10 text-cyan-400 border border-cyan-500/30">
              <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 mr-2 animate-pulse" />
              Productivity
            </span>
            <h1 className="text-4xl md:text-6xl font-bold tracking-tight mb-6 leading-tight">
              Master your time.<br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-blue-400">
                Unlock Focus.
              </span>
            </h1>
            <p className="text-zinc-600 dark:text-zinc-400 text-lg leading-relaxed mb-8">
              Organize your study sessions intelligently. Our planner uses smart time-blocking
              and spaced repetition to ensure you learn efficiently without burning out. Let
              the system schedule your revisions exactly when you need them.
            </p>

            <div className="flex flex-wrap gap-4">
              <button 
                onClick={handleOpenPlanner}
                className="bg-cyan-600 hover:bg-cyan-500 text-zinc-900 dark:text-white font-medium px-8 py-3.5 rounded-xl transition-all duration-200 active:scale-95 shadow-lg shadow-cyan-900/40"
              >
                Create Schedule
              </button>
              <button onClick={() => navigate("/performance-tracker")} className="bg-black/5 dark:bg-white/[0.05] hover:bg-black/10 dark:hover:bg-white/10 border border-black/5 dark:border-white/[0.08] text-zinc-900 dark:text-white font-medium px-8 py-3.5 rounded-xl transition-all duration-200 active:scale-95">
                View Analytics
              </button>
            </div>
          </div>

          {/* Right Visualizer */}
          <div className="flex-1 w-full max-w-md card-animate card-visible card-hover card-shimmer" style={{ animationDelay: '0.2s' }}>
            <div className="bg-white/40 dark:bg-black/50 backdrop-blur-xl border border-black/5 dark:border-white/[0.08] rounded-3xl p-8 shadow-2xl relative overflow-hidden group">
              <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-cyan-400 to-blue-400" />
              <div className="space-y-6">
                <div className="flex items-center gap-4 bg-black/[0.03] dark:bg-white/[0.03] p-4 rounded-2xl border border-black/5 dark:border-white/[0.05]">
                  <div className="w-10 h-10 rounded-xl bg-cyan-500/20 text-cyan-400 flex items-center justify-center shrink-0 border border-cyan-500/30">
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
                      <line x1="16" y1="2" x2="16" y2="6" />
                      <line x1="8" y1="2" x2="8" y2="6" />
                      <line x1="3" y1="10" x2="21" y2="10" />
                    </svg>
                  </div>
                  <div>
                    <h3 className="text-zinc-900 dark:text-white font-medium text-sm">Today, 10:00 AM</h3>
                    <p className="text-xs text-zinc-500">Deep Work: React Fundamentals</p>
                  </div>
                  <span className="ml-auto text-xs text-emerald-400 bg-emerald-500/10 px-2 py-1 rounded-full">Completed</span>
                </div>
                <div className="flex items-center gap-4 bg-cyan-500/10 p-4 rounded-2xl border border-cyan-500/20 shadow-lg shadow-cyan-900/20">
                  <div className="w-10 h-10 rounded-xl bg-cyan-600 text-zinc-900 dark:text-white flex items-center justify-center shrink-0 shadow-md shadow-cyan-900/50">
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <circle cx="12" cy="12" r="10" />
                      <polyline points="12 6 12 12 16 14" />
                    </svg>
                  </div>
                  <div>
                    <h3 className="text-zinc-900 dark:text-white font-medium text-sm">Now, 2:30 PM</h3>
                    <p className="text-xs text-zinc-600 dark:text-zinc-400">Review: JavaScript Closures</p>
                  </div>
                  <span className="ml-auto flex h-2 w-2 relative">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-cyan-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-cyan-500"></span>
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Hidden/Revealed Section */}
      {showPlanner && (
        <section ref={plannerRef} className="relative z-10 px-6 md:px-12 pb-20 max-w-5xl mx-auto animate-in fade-in slide-in-from-bottom-10 duration-500 pt-10 border-t border-black/5 dark:border-white/[0.05]">
          
          {/* Header */}
          <div className="flex flex-col md:flex-row items-center justify-between mb-8 gap-4">
              <div className="flex items-center gap-6">
                  <div>
                      <h2 className="text-2xl font-bold tracking-tight text-zinc-900 dark:text-white mb-2">Your Dashboard</h2>
                      <p className="text-sm text-zinc-600 dark:text-zinc-400">Organize and track your upcoming learning sessions.</p>
                  </div>
                  <button onClick={() => navigate("/focus")} className="hidden md:flex ml-4 items-center gap-2 bg-emerald-500/20 text-emerald-400 hover:bg-emerald-500 hover:text-zinc-900 dark:text-white px-4 py-2 rounded-xl text-sm font-bold transition-all border border-emerald-500/30">
                      <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
                      Enter Focus Mode
                  </button>
              </div>
              
              {/* Month Controls */}
              <div className="flex items-center gap-3 bg-white/40 dark:bg-black/50 backdrop-blur-xl border border-black/5 dark:border-white/[0.08] rounded-xl p-1.5 shadow-lg">
                  <button onClick={handlePrevMonth} className="p-2 hover:bg-black/5 dark:bg-white/[0.05] rounded-lg transition-colors text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:text-white">
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="15 18 9 12 15 6"></polyline></svg>
                  </button>
                  <div className="w-36 text-center">
                      <span className="font-semibold text-zinc-900 dark:text-white">{monthNames[month]} {year}</span>
                  </div>
                  <button onClick={handleNextMonth} className="p-2 hover:bg-black/5 dark:bg-white/[0.05] rounded-lg transition-colors text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:text-white">
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="9 18 15 12 9 6"></polyline></svg>
                  </button>
                  <button onClick={goToday} className="ml-2 px-3 py-1.5 bg-cyan-600 hover:bg-cyan-500 rounded-lg text-xs font-medium text-zinc-900 dark:text-white transition-colors shadow-lg shadow-cyan-900/40">
                      Today
                  </button>
              </div>
          </div>

          {/* Calendar Grid */}
          <div className="bg-white/40 dark:bg-black/50 backdrop-blur-xl border border-black/5 dark:border-white/[0.08] rounded-2xl overflow-hidden shadow-2xl backdrop-blur-xl">
              <div className="grid grid-cols-7 border-b border-black/5 dark:border-white/[0.08] bg-black/20">
                  {daysOfWeek.map(d => (
                      <div key={d} className="py-4 text-center text-xs font-medium text-zinc-600 dark:text-zinc-400 uppercase tracking-widest">{d}</div>
                  ))}
              </div>
              <div className="grid grid-cols-7">
                  {renderCalendarDays()}
              </div>
          </div>

          {/* Flashcard Vault */}
          <div className="mt-16 pt-12 border-t border-black/5 dark:border-white/[0.05]">
            <div className="flex items-center justify-between mb-8">
                <div>
                   <h2 className="text-2xl font-bold tracking-tight text-zinc-900 dark:text-white mb-2 ml-1">The Flashcard Vault</h2>
                   <p className="text-sm text-zinc-600 dark:text-zinc-400 ml-1">Master active recall with your personal 3D decks.</p>
                </div>
                <button onClick={() => setIsCreatingDeck(!isCreatingDeck)} className={`${isCreatingDeck ? 'bg-black/[0.1] dark:bg-white/[0.1] text-zinc-900 dark:text-white' : 'bg-black/[0.02] dark:bg-white/[0.02] text-zinc-600 dark:text-zinc-400'} hover:bg-black/[0.1] dark:bg-white/[0.1] hover:text-zinc-900 dark:text-white border border-black/5 dark:border-white/[0.08] px-4 py-2 rounded-xl text-sm font-medium transition-colors flex items-center gap-2`}>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="12" y1="5" x2="12" y2="19"></line><line x1="5" y1="12" x2="19" y2="12"></line></svg>
                    Create Deck
                </button>
            </div>

            {/* Deck List & Creator */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {isCreatingDeck && (
                    <div className="bg-white/40 dark:bg-black/50 backdrop-blur-xl border border-fuchsia-500/30 rounded-2xl p-6 shadow-2xl lg:col-span-2 xl:col-span-3 animate-in fade-in zoom-in-95 duration-300">
                        <h3 className="text-sm font-bold text-zinc-900 dark:text-white mb-4 uppercase tracking-widest text-transparent bg-clip-text bg-gradient-to-r from-fuchsia-400 to-pink-500">Builder Mode</h3>
                        <input type="text" placeholder="Deck Title (e.g. DSA)" value={newDeckTitle} onChange={e => setNewDeckTitle(e.target.value)} className="w-full bg-white dark:bg-[#0f0f11] border border-white/[0.1] rounded-xl px-4 py-3 mb-6 text-sm text-zinc-900 dark:text-white outline-none focus:border-fuchsia-500 transition-colors shadow-inner" />
                        
                        <div className="space-y-3 mb-6">
                            {newCards.map((c, idx) => (
                                <div key={idx} className="flex flex-col md:flex-row gap-3 md:items-center bg-black/[0.02] dark:bg-white/[0.02] p-4 rounded-xl border border-black/5 dark:border-white/[0.05]">
                                    <span className="text-xs font-bold text-zinc-500 w-4 hidden md:block">{idx+1}</span>
                                    <input type="text" placeholder="Question" value={c.question} onChange={e => handleUpdateCardRow(idx, 'question', e.target.value)} className="flex-1 bg-transparent border-b border-zinc-700 focus:border-fuchsia-500 px-2 py-2 text-sm text-zinc-900 dark:text-white outline-none transition-colors" />
                                    <input type="text" placeholder="Answer" value={c.answer} onChange={e => handleUpdateCardRow(idx, 'answer', e.target.value)} className="flex-1 bg-transparent border-b border-zinc-700 focus:border-cyan-500 px-2 py-2 text-sm text-zinc-900 dark:text-white outline-none transition-colors" />
                                </div>
                            ))}
                        </div>
                        <div className="flex justify-between items-center">
                            <button onClick={handleAddCardRow} className="text-xs font-medium text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:text-white transition-colors bg-black/5 dark:bg-white/[0.05] hover:bg-black/[0.1] dark:bg-white/[0.1] px-3 py-1.5 rounded-lg border border-black/5 dark:border-white/[0.08]">+ Add Card</button>
                            <button onClick={handleSaveDeck} disabled={!user || !newDeckTitle} className="bg-fuchsia-600 hover:bg-fuchsia-500 text-zinc-900 dark:text-white disabled:opacity-50 disabled:cursor-not-allowed px-6 py-2.5 rounded-xl text-sm font-bold transition-all shadow-lg shadow-fuchsia-900/40 active:scale-95 border border-fuchsia-500/50">Save Deck to Firebase</button>
                        </div>
                    </div>
                )}

                {decks.map((deck, deckIdx) => (
                    <div key={deck.id} onClick={() => startStudy(deck)} className="card-animate card-hover card-shimmer group cursor-pointer bg-white/40 dark:bg-black/50 backdrop-blur-xl hover:bg-white/60 dark:hover:bg-black/70/80 border border-black/5 dark:border-white/[0.05] hover:border-white/[0.15] p-6 rounded-2xl relative overflow-hidden backdrop-blur-sm card-visible" style={{ animationDelay: `${deckIdx * 0.1}s` }}>
                        <div className="absolute top-0 right-0 w-32 h-32 bg-fuchsia-500/10 rounded-full blur-3xl group-hover:bg-fuchsia-500/20 transition-all pointer-events-none"></div>
                        <h3 className="text-xl font-bold text-zinc-900 dark:text-white mb-2 relative z-10">{deck.title}</h3>
                        <p className="text-sm text-zinc-600 dark:text-zinc-400 relative z-10">{deck.cards.length} Cards</p>
                        <div className="mt-6 flex justify-end relative z-10">
                            <div className="bg-black/5 dark:bg-white/[0.05] p-2.5 rounded-full text-zinc-500 group-hover:bg-fuchsia-500/20 group-hover:text-fuchsia-400 transition-colors border border-transparent group-hover:border-fuchsia-500/30">
                              <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" stroke="none"><polygon points="5 3 19 12 5 21 5 3"></polygon></svg>
                            </div>
                        </div>
                    </div>
                ))}
            </div>
          </div>
        </section>
      )}

      {/* 3D Study Modal */}
      {activeDeck && (
          <div className="fixed inset-0 z-[60] bg-black/95 backdrop-blur-3xl flex flex-col items-center justify-center p-6 animate-in fade-in duration-300">
              
              <div className="absolute top-8 left-8 right-8 flex justify-between items-center">
                  <div className="text-zinc-500 font-medium tracking-widest uppercase text-xs flex items-center gap-3">
                     <span className="text-fuchsia-500"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect><line x1="3" y1="9" x2="21" y2="9"></line><line x1="9" y1="21" x2="9" y2="9"></line></svg></span>
                     {activeDeck.title} <span className="text-zinc-900 dark:text-white ml-2">— Card {currentCardIndex + 1} of {activeDeck.cards.length}</span>
                  </div>
                  <button onClick={() => { setActiveDeck(null); setIsFlipped(false); }} className="text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:text-white bg-black/5 dark:bg-white/[0.05] hover:bg-black/[0.1] dark:bg-white/[0.1] rounded-full p-2.5 transition-colors border border-white/[0.1]">
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
                  </button>
              </div>

              {/* The 3D Component */}
              <div 
                  className="relative w-full max-w-2xl h-96 perspective-1000 cursor-pointer group"
                  onClick={() => setIsFlipped(!isFlipped)}
              >
                  <div className={`w-full h-full preserve-3d transition-transform duration-700 ease-out ${isFlipped ? '-rotate-y-180' : ''}`} style={{ transformStyle: 'preserve-3d' }}>
                      
                      {/* Front: Question */}
                      <div className="absolute inset-0 backface-hidden bg-white/40 dark:bg-black/50 backdrop-blur-xl border border-white/[0.1] shadow-2xl rounded-3xl flex flex-col items-center justify-center p-12 hover:border-white/[0.2] transition-colors" style={{ backfaceVisibility: 'hidden' }}>
                          <span className="absolute top-6 left-6 text-[10px] font-bold text-fuchsia-500 tracking-widest uppercase bg-fuchsia-500/10 px-3 py-1.5 rounded-full border border-fuchsia-500/20">Question</span>
                          <h2 className="text-3xl md:text-5xl font-bold text-center text-zinc-900 dark:text-white leading-tight">{activeDeck.cards[currentCardIndex].question}</h2>
                          <div className="absolute bottom-6 flex items-center gap-2 text-zinc-500 opacity-50 group-hover:opacity-100 transition-opacity">
                              <span className="text-xs font-semibold uppercase tracking-widest">Click to flip</span>
                          </div>
                      </div>

                      {/* Back: Answer */}
                      <div className="absolute inset-0 backface-hidden bg-gradient-to-br from-[#0f0f11] to-[#18181b] border border-cyan-500/40 shadow-[0_0_80px_rgba(6,182,212,0.15)] rounded-3xl flex flex-col items-center justify-center p-12" style={{ backfaceVisibility: 'hidden', transform: 'rotateY(180deg)' }}>
                          <span className="absolute top-6 left-6 text-[10px] font-bold text-cyan-400 tracking-widest uppercase bg-cyan-500/10 px-3 py-1.5 rounded-full border border-cyan-500/20">Answer</span>
                          <h2 className="text-2xl md:text-4xl font-semibold text-center text-cyan-50 leading-relaxed">{activeDeck.cards[currentCardIndex].answer}</h2>
                          <div className="absolute bottom-6 flex items-center gap-2 text-zinc-500 opacity-50 group-hover:opacity-100 transition-opacity">
                              <span className="text-xs font-semibold uppercase tracking-widest">Click to flip back</span>
                          </div>
                      </div>
                  </div>
              </div>

              {/* Controls */}
              <div className="mt-16 flex items-center gap-10">
                  <button onClick={(e) => { e.stopPropagation(); prevCard(); }} disabled={currentCardIndex === 0} className="p-4 rounded-full bg-black/5 dark:bg-white/[0.05] hover:bg-black/[0.1] dark:bg-white/[0.1] disabled:opacity-20 disabled:hover:bg-black/5 dark:bg-white/[0.05] text-zinc-900 dark:text-white transition-all active:scale-95 border border-black/5 dark:border-white/[0.05]">
                      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="15 18 9 12 15 6"></polyline></svg>
                  </button>
                  <div className="w-24 md:w-48 h-1.5 bg-black/[0.1] dark:bg-white/[0.1] rounded-full overflow-hidden">
                      <div className="h-full bg-gradient-to-r from-fuchsia-500 to-cyan-500 transition-all duration-300" style={{ width: `${((currentCardIndex + 1) / activeDeck.cards.length) * 100}%` }}></div>
                  </div>
                  <button onClick={(e) => { e.stopPropagation(); nextCard(); }} disabled={currentCardIndex === activeDeck.cards.length - 1} className="p-4 rounded-full bg-black/5 dark:bg-white/[0.05] hover:bg-black/[0.1] dark:bg-white/[0.1] disabled:opacity-20 disabled:hover:bg-black/5 dark:bg-white/[0.05] text-zinc-900 dark:text-white transition-all active:scale-95 border border-black/5 dark:border-white/[0.05]">
                      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="9 18 15 12 9 6"></polyline></svg>
                  </button>
              </div>

          </div>
      )}

      {/* Calendar Modal Overlay */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center px-4 bg-black/60 backdrop-blur-sm transition-all duration-300">
          <div className="bg-white/40 dark:bg-black/50 backdrop-blur-xl border border-black/5 dark:border-white/[0.08] rounded-3xl w-full max-w-md shadow-2xl overflow-hidden relative animate-in fade-in zoom-in-95 duration-200">
            <button onClick={() => setIsModalOpen(false)} className="absolute top-5 right-5 text-zinc-500 hover:text-zinc-900 dark:text-white transition-colors bg-black/5 dark:bg-white/[0.05] hover:bg-black/[0.1] dark:bg-white/[0.1] rounded-full p-1.5 border border-black/5 dark:border-white/[0.08]">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
            </button>
            <div className="p-7">
                <h2 className="text-xl font-semibold text-zinc-900 dark:text-white mb-2">Schedule Activity</h2>
                <p className="text-sm text-zinc-600 dark:text-zinc-400 mb-7">Plan your day for <span className="font-medium text-zinc-200">{monthNames[month]} {selectedDate?.getDate()}, {year}</span></p>
                
                <form onSubmit={handleAddEvent} className="space-y-5">
                    <div>
                        <label className="block text-xs font-medium text-zinc-600 dark:text-zinc-400 mb-2 uppercase tracking-widest">Event Subject</label>
                        <input autoFocus required type="text" value={newEvent.title} onChange={e => setNewEvent({...newEvent, title: e.target.value})} placeholder="e.g. Master React Hooks" className="w-full bg-white dark:bg-[#0f0f11] border border-black/5 dark:border-white/[0.08] hover:border-white/[0.15] focus:border-cyan-500 ring-0 focus:ring-1 focus:ring-cyan-500/20 rounded-xl px-4 py-3.5 text-sm text-zinc-900 dark:text-white placeholder-zinc-600 outline-none transition-all shadow-inner" />
                    </div>
                    <div>
                        <label className="block text-xs font-medium text-zinc-600 dark:text-zinc-400 mb-2 uppercase tracking-widest">Event Type</label>
                        <div className="grid grid-cols-3 gap-2.5">
                           {["Study", "Break", "Exam"].map(type => (
                               <button 
                                 type="button" 
                                 key={type} 
                                 onClick={() => setNewEvent({...newEvent, type})}
                                 className={`py-2.5 rounded-xl text-sm font-medium border transition-colors ${newEvent.type === type ? EVENT_BADGES[type] : 'bg-white dark:bg-[#0f0f11] border-black/5 dark:border-white/[0.08] text-zinc-600 dark:text-zinc-400 hover:border-white/[0.15] hover:text-zinc-200 shadow-inner'}`}
                               >
                                   {type}
                               </button>
                           ))}
                        </div>
                    </div>
                    <button disabled={!user && !newEvent.title} type="submit" className="w-full mt-2 bg-cyan-600 hover:bg-cyan-500 disabled:opacity-50 disabled:cursor-not-allowed text-zinc-900 dark:text-white font-medium py-3.5 rounded-xl transition-colors shadow-lg shadow-cyan-900/40 active:scale-95 border border-cyan-500/50">
                        {user ? "Save Event" : "Sign in to Schedule"}
                    </button>
                </form>

                {/* Existing Day Events List */}
                {selectedDate && getEventsForDay(selectedDate.getDate()).length > 0 && (
                    <div className="mt-8 pt-6 border-t border-black/5 dark:border-white/[0.08]">
                        <h3 className="text-xs font-medium text-zinc-500 uppercase tracking-widest mb-3">Planned Activities</h3>
                        <div className="space-y-2.5 overflow-y-auto max-h-[190px] pr-1 custom-scrollbar">
                            {getEventsForDay(selectedDate.getDate()).map(ev => (
                                <div key={ev.id} className={`flex flex-row items-center justify-between border rounded-xl p-3 shadow-inner transition-colors group ${ev.completed ? 'bg-white dark:bg-[#0f0f11] border-white/[0.02] opacity-60' : 'bg-white/40 dark:bg-black/50 backdrop-blur-xl border-black/5 dark:border-white/[0.08] hover:border-white/[0.15]'}`}>
                                    <div className="flex items-center gap-3">
                                        <button 
                                            onClick={() => handleToggleComplete(ev)}
                                            className={`w-5 h-5 rounded-md flex items-center justify-center border transition-all ${ev.completed ? 'bg-emerald-500 border-emerald-500 text-zinc-900 dark:text-white' : 'border-zinc-600 bg-black/20 text-transparent hover:border-emerald-500'}`}
                                        >
                                            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>
                                        </button>
                                        <div className="flex flex-col">
                                            <span className={`text-sm font-medium ${ev.completed ? 'text-zinc-500 line-through' : 'text-zinc-900 dark:text-white'}`}>{ev.title}</span>
                                            <span className="text-[10px] text-zinc-500 uppercase font-semibold tracking-wider mt-0.5">{ev.type}</span>
                                        </div>
                                    </div>
                                    <button onClick={() => handleDeleteEvent(ev.id)} className="text-zinc-600 hover:text-pink-400 p-2 transition-colors opacity-0 group-hover:opacity-100 bg-black/[0.02] dark:bg-white/[0.02] hover:bg-pink-500/10 rounded-lg">
                                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M3 6h18"></path><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"></path><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"></path></svg>
                                    </button>
                                </div>
                            ))}
                        </div>
                    </div>
                )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
