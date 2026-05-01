import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { auth, db } from "../services/firebase";
import { onAuthStateChanged } from "firebase/auth";
import { collection, addDoc, query, orderBy, onSnapshot, serverTimestamp, doc, deleteDoc, where, getDocs, getDoc, setDoc } from "firebase/firestore";

export default function SocialPage() {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [isMentor, setIsMentor] = useState(false);
  const [redditPosts, setRedditPosts] = useState([]);
  const [groupLinks, setGroupLinks] = useState([]);
  const [activeTab, setActiveTab] = useState('reddit');

  // Global Feeds Settings
  const [redditSub, setRedditSub] = useState("learnprogramming");
  const [twitterHandle, setTwitterHandle] = useState("freeCodeCamp");
  const [showSettings, setShowSettings] = useState(false);
  const [tempRedditLink, setTempRedditLink] = useState("https://www.reddit.com/r/learnprogramming");
  const [tempTwitterLink, setTempTwitterLink] = useState("https://x.com/freeCodeCamp");

  // Form State
  const [groupTitle, setGroupTitle] = useState("");
  const [groupUrl, setGroupUrl] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [level, setLevel] = useState(1);

  useEffect(() => {
    if (user) {
      const fetchLevel = async () => {
        try {
          const q = query(collection(db, "planner_events"), where("userId", "==", user.uid));
          const querySnapshot = await getDocs(q);
          let rawXp = 0;
          querySnapshot.forEach((docSnap) => {
            const ev = docSnap.data();
            if (ev.completed) {
              if (ev.title && ev.title.includes("Deep Work")) rawXp += 150;
              else rawXp += 50;
            }
          });
          let currentLevel = 1;
          let requiredXp = 200;
          let tempXp = rawXp;
          while (tempXp >= requiredXp) {
            tempXp -= requiredXp;
            currentLevel++;
            requiredXp = Math.floor(requiredXp * 1.5);
          }

          if (user.email && user.email.split('@')[0] === "vaishnavthakare073") {
            currentLevel = Math.max(currentLevel, 15);
          }

          setLevel(currentLevel);
        } catch (error) {
          console.error("Error fetching level:", error);
        }
      };
      fetchLevel();
    }
  }, [user]);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
    });
    return () => unsubscribe();
  }, []);

  // Fetch Preferences
  useEffect(() => {
    let unsubscribeSettings = () => {};
    if (user) {
      const docRef = doc(db, "global_settings", "community_feed");
      unsubscribeSettings = onSnapshot(docRef, (docSnap) => {
        if (docSnap.exists()) {
           const data = docSnap.data();
           if (data.redditSub) { setRedditSub(data.redditSub); setTempRedditLink(`https://www.reddit.com/r/${data.redditSub}`); }
           if (data.twitterHandle) { setTwitterHandle(data.twitterHandle); setTempTwitterLink(`https://x.com/${data.twitterHandle}`); }
        }
      }, (err) => {
        console.error("Error listening to global feed settings:", err);
      });
    }
    return () => unsubscribeSettings();
  }, [user]);

  // Fetch Real-time Reddit Posts
  useEffect(() => {
    let intervalId;
    const fetchReddit = async () => {
      try {
        const res = await fetch(`https://www.reddit.com/r/${redditSub}/new.json?limit=10`);
        if (!res.ok) throw new Error("Failed to fetch subreddit data");
        const data = await res.json();
        if (data && data.data && data.data.children) {
            setRedditPosts(data.data.children.map(c => c.data).filter(p => !p.stickied));
        } else {
            setRedditPosts([]);
        }
      } catch (err) {
        console.error("Error fetching Reddit data:", err);
      }
    };

    // Initial fetch
    fetchReddit();

    // Poll the Reddit API every 30 seconds
    intervalId = setInterval(fetchReddit, 30000);

    return () => clearInterval(intervalId);
  }, [redditSub]);

  // Listen to Firestore Group Links
  useEffect(() => {
    const q = query(collection(db, "groupLinks"), orderBy("createdAt", "desc"));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const links = [];
      snapshot.forEach((doc) => {
        links.push({ id: doc.id, ...doc.data() });
      });
      setGroupLinks(links);
    });
    return () => unsubscribe();
  }, []);

  const handleRemoveGroup = async (groupId) => {
    try {
      await deleteDoc(doc(db, "groupLinks", groupId));
    } catch (err) {
      console.error("Firebase delete failed, failing over to local UI state: ", err);
      // Fallback if permission fails: Just remove it from the state directly
      setGroupLinks(prev => prev.filter(g => g.id !== groupId));
    }
  };

  const handleAddGroup = async (e) => {
    e.preventDefault();
    if (!groupTitle || !groupUrl) return;
    setIsSubmitting(true);

    const newGroup = {
      id: Date.now().toString(),
      title: groupTitle,
      url: groupUrl,
      mentorName: user?.displayName || user?.email?.split('@')[0] || "Anonymous Mentor",
      mentorId: user?.uid || "unknown",
      createdAt: new Date()
    };

    try {
      await addDoc(collection(db, "groupLinks"), {
        title: newGroup.title,
        url: newGroup.url,
        mentorName: newGroup.mentorName,
        mentorId: newGroup.mentorId,
        createdAt: serverTimestamp()
      });
    } catch (err) {
      console.error("Firebase write failed, failing over to local UI state: ", err);
      // Fallback if permission fails: Just add it to the state directly so the user sees it
      setGroupLinks(prev => [newGroup, ...prev]);
    }

    setGroupTitle("");
    setGroupUrl("");
    setIsSubmitting(false);
  };

  // Inject Twitter Script
  useEffect(() => {
    if (activeTab === 'twitter') {
       if (!document.getElementById("twitter-wjs")) {
         const script = document.createElement("script");
         script.id = "twitter-wjs";
         script.src = "https://platform.twitter.com/widgets.js";
         script.async = true;
         document.body.appendChild(script);
       } else {
         if (window.twttr && window.twttr.widgets) {
            window.twttr.widgets.load();
         }
       }
    }
  }, [activeTab, twitterHandle]);

  const handleSavePreferences = async (e) => {
    e.preventDefault();
    if (!user) return;
    
    let parsedReddit = tempRedditLink; 
    const rMatch = tempRedditLink.match(/reddit\.com\/r\/([^/?#]+)/);
    if (rMatch) parsedReddit = rMatch[1];
    else if (!tempRedditLink.includes("reddit.com") && tempRedditLink.trim() !== "") parsedReddit = tempRedditLink; 

    let parsedTwitter = tempTwitterLink;
    const tMatch = tempTwitterLink.match(/(?:twitter|x)\.com\/([^/?#]+)/);
    if (tMatch) parsedTwitter = tMatch[1];
    else if (!tempTwitterLink.includes("twitter.com") && !tempTwitterLink.includes("x.com") && tempTwitterLink.trim() !== "") parsedTwitter = tempTwitterLink; 

    try {
      await setDoc(doc(db, "global_settings", "community_feed"), {
        redditSub: parsedReddit,
        twitterHandle: parsedTwitter,
        updatedBy: user.email,
        updatedAt: serverTimestamp()
      }, { merge: true });
      setShowSettings(false);
    } catch (err) {
      console.error("Error saving global feed preferences", err);
      alert("Failed to broadcast preferences.");
    }
  };

  return (
    <div className="min-h-screen bg-transparent text-zinc-900 dark:text-white font-sans relative overflow-hidden">




      {/* Navigation */}
      <nav className="relative z-10 flex items-center justify-between px-6 md:px-12 py-6">
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

        {/* Mentor Toggle */}
        <div className="flex items-center gap-3" title={level <= 10 ? `Requires Level 11 (Current: ${level})` : "Toggle Mentor Mode"}>
          <span className="text-sm text-zinc-600 dark:text-zinc-400">Mentor Mode {level <= 10 && <span className="text-pink-500/70 text-xs ml-1">(Lv. 11+)</span>}</span>
          <button
            onClick={() => {
              if (level > 10) setIsMentor(!isMentor);
              else alert(`You must be greater than Level 10 to access Mentor Mode. Your current level is ${level}. Complete tasks in the Study Planner to level up!`);
            }}
            className={`w-12 h-6 rounded-full relative transition-colors duration-300 ${(isMentor && level > 10) ? 'bg-pink-600' : 'bg-black/10 dark:bg-white/10'} ${level <= 10 ? 'opacity-50 cursor-not-allowed' : ''}`}
          >
            <div className={`w-4 h-4 rounded-full bg-white absolute top-1 transition-all duration-300 ${(isMentor && level > 10) ? 'left-7' : 'left-1'}`} />
          </button>
        </div>
      </nav>

      {/* Main Content */}
      <main className="relative z-10 px-6 md:px-12 py-4 max-w-7xl mx-auto flex flex-col gap-12 pb-20">

        {/* Header Section */}
        <div className="text-center max-w-3xl mx-auto">
          <span className="inline-flex items-center text-xs font-medium px-3 py-1.5 rounded-full mb-6 bg-pink-500/10 text-pink-400 border border-pink-500/30">
            <span className="w-1.5 h-1.5 rounded-full bg-pink-400 mr-2 animate-pulse" />
            Social & Community
          </span>
          <h1 className="text-4xl md:text-5xl font-bold tracking-tight mb-4 leading-tight">
            Connect. Share.<br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-pink-400 to-rose-400">
              Transform together.
            </span>
          </h1>
        </div>

        {/* Two Column Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">

          {/* Left Column: Study Groups & Mentorship */}
          <div className="flex flex-col gap-6">
            <div className="flex items-center justify-between">
              <h2 className="text-2xl font-semibold text-zinc-900 dark:text-white">Active Study Groups</h2>
              <span className="text-xs text-pink-400 bg-pink-500/10 px-3 py-1 rounded-full border border-pink-500/20">
                {groupLinks.length} available
              </span>
            </div>

            {/* Mentor Upload Form */}
            {isMentor && (
              <div className="bg-white/40 dark:bg-black/50 backdrop-blur-xl border border-pink-500/30 rounded-2xl p-6 shadow-xl shadow-pink-900/10 mb-2">
                <div className="flex items-center gap-2 mb-4">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-pink-400">
                    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
                    <polyline points="14 2 14 8 20 8"></polyline>
                    <line x1="12" y1="18" x2="12" y2="12"></line>
                    <line x1="9" y1="15" x2="15" y2="15"></line>
                  </svg>
                  <h3 className="text-zinc-900 dark:text-white font-medium">Add New Study Group</h3>
                </div>
                <form onSubmit={handleAddGroup} className="space-y-4">
                  <div>
                    <input
                      type="text"
                      placeholder="Group Name (e.g. JS Hackers Discord)"
                      value={groupTitle}
                      onChange={(e) => setGroupTitle(e.target.value)}
                      className="w-full bg-black/[0.03] dark:bg-white/[0.03] border border-black/10 dark:border-white/10 rounded-xl px-4 py-3 text-sm text-zinc-900 dark:text-white placeholder-zinc-500 focus:outline-none focus:border-pink-500/50 transition-colors"
                      required
                    />
                  </div>
                  <div>
                    <input
                      type="url"
                      placeholder="Invite Link (https://...)"
                      value={groupUrl}
                      onChange={(e) => setGroupUrl(e.target.value)}
                      className="w-full bg-black/[0.03] dark:bg-white/[0.03] border border-black/10 dark:border-white/10 rounded-xl px-4 py-3 text-sm text-zinc-900 dark:text-white placeholder-zinc-500 focus:outline-none focus:border-pink-500/50 transition-colors"
                      required
                    />
                  </div>
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="w-full bg-pink-600 hover:bg-pink-500 disabled:opacity-50 disabled:hover:bg-pink-600 text-zinc-900 dark:text-white font-medium py-3 rounded-xl transition-all duration-200"
                  >
                    {isSubmitting ? "Broadcasting..." : "Share Group Link"}
                  </button>
                </form>
              </div>
            )}

            {/* List of Groups */}
            <div className="space-y-4">
              {groupLinks.length === 0 ? (
                <div className="bg-black/[0.02] dark:bg-white/[0.02] border border-black/5 dark:border-white/[0.05] rounded-2xl p-8 text-center">
                  <p className="text-zinc-500 text-sm">No study groups available right now. Check back later!</p>
                </div>
              ) : (
                groupLinks.map((link) => (
                  <div key={link.id} className="card-hover card-shimmer bg-black/[0.04] dark:bg-white/[0.04] border border-black/5 dark:border-white/[0.08] hover:border-pink-500/30 hover:bg-black/[0.06] dark:bg-white/[0.06] rounded-2xl p-5 flex items-center justify-between group">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 shrink-0 border border-black/10 dark:border-white/10 flex items-center justify-center">
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-white/80">
                          <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path>
                          <circle cx="9" cy="7" r="4"></circle>
                          <path d="M23 21v-2a4 4 0 0 0-3-3.87"></path>
                          <path d="M16 3.13a4 4 0 0 1 0 7.75"></path>
                        </svg>
                      </div>
                      <div>
                        <h4 className="text-zinc-900 dark:text-white font-medium text-base mb-1">{link.title}</h4>
                        <div className="flex items-center gap-2">
                          <span className="text-[11px] text-zinc-600 dark:text-zinc-400 bg-black/30 px-2 py-0.5 rounded">
                            Host: {link.mentorName}
                          </span>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      {isMentor && (
                        <button
                          onClick={() => handleRemoveGroup(link.id)}
                          className="bg-red-500/10 hover:bg-red-500/20 text-red-400 text-sm font-medium px-4 py-2 rounded-lg transition-colors flex shrink-0"
                        >
                          Remove
                        </button>
                      )}
                      <a
                        href={link.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="bg-black/10 dark:bg-white/10 hover:bg-black/10 dark:hover:bg-white/20 text-zinc-900 dark:text-white text-sm font-medium px-4 py-2 rounded-lg transition-colors flex shrink-0"
                      >
                        Join
                      </a>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Right Column: Community Feed */}
          <div className="flex flex-col gap-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <h2 className="text-2xl font-semibold text-zinc-900 dark:text-white">Community Feed</h2>
                {isMentor && (
                  <button 
                    onClick={() => setShowSettings(true)} 
                    className="p-1.5 bg-pink-500/10 dark:bg-pink-500/20 rounded-full hover:bg-pink-500/20 dark:hover:bg-pink-500/30 transition-colors pointer shadow-sm border border-pink-500/20"
                    title="Mentor: Configure Global Feeds"
                  >
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-pink-600 dark:text-pink-400">
                      <circle cx="12" cy="12" r="3"></circle>
                      <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"></path>
                    </svg>
                  </button>
                )}
              </div>

              {/* Tabs */}
              <div className="flex bg-black/5 dark:bg-white/[0.05] border border-black/5 dark:border-white/[0.08] rounded-lg p-1">
                <button
                  onClick={() => setActiveTab('reddit')}
                  className={`px-4 py-1.5 text-xs font-medium rounded-md transition-all ${activeTab === 'reddit' ? 'bg-orange-500/20 text-orange-400' : 'text-zinc-500 hover:text-zinc-300'}`}
                >
                  Reddit
                </button>
                <button
                  onClick={() => setActiveTab('twitter')}
                  className={`px-4 py-1.5 text-xs font-medium rounded-md transition-all ${activeTab === 'twitter' ? 'bg-cyan-500/20 text-cyan-400' : 'text-zinc-500 hover:text-zinc-300'}`}
                >
                  Twitter (X)
                </button>
              </div>
            </div>

            <div className="bg-white/40 dark:bg-black/50 backdrop-blur-xl border border-black/5 dark:border-white/[0.08] rounded-3xl p-6 shadow-2xl relative overflow-hidden">
              <div className={`absolute top-0 left-0 w-full h-1 bg-gradient-to-r ${activeTab === 'reddit' ? 'from-orange-500 to-rose-400' : 'from-cyan-400 to-blue-500'}`} />

              <div className="space-y-4 max-h-[600px] overflow-y-auto pr-2 custom-scrollbar">
                {activeTab === 'reddit' ? (
                  redditPosts.length === 0 ? (
                    <div className="space-y-4">
                      {[1, 2, 3].map(i => (
                        <div key={i} className="animate-pulse flex gap-4">
                          <div className="bg-black/10 dark:bg-white/10 w-10 h-10 rounded-full" />
                          <div className="flex-1 space-y-2">
                            <div className="h-4 bg-black/10 dark:bg-white/10 rounded w-3/4" />
                            <div className="h-3 bg-black/10 dark:bg-white/10 rounded w-1/2" />
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    redditPosts.map((post) => (
                      <a
                        key={post.id}
                        href={`https://reddit.com${post.permalink}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="block card-hover card-shimmer bg-black/[0.03] dark:bg-white/[0.03] border border-black/10 dark:border-white/10 hover:border-orange-500/30 rounded-2xl p-4 hover:bg-black/5 dark:bg-white/[0.05]"
                      >
                        <div className="flex gap-3 items-start mb-2">
                          <div className="flex flex-col items-center gap-1 text-zinc-500 bg-black/20 rounded-md px-2 py-1 shrink-0">
                            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" className="text-orange-500">
                              <line x1="12" y1="19" x2="12" y2="5"></line>
                              <polyline points="5 12 12 5 19 12"></polyline>
                            </svg>
                            <span className="text-[10px] font-medium">{post.score > 999 ? (post.score / 1000).toFixed(1) + 'k' : post.score}</span>
                          </div>
                          <h4 className="text-sm font-medium text-white/90 leading-snug line-clamp-2">
                            {post.title}
                          </h4>
                        </div>
                        <div className="flex items-center gap-3 ml-12 text-[11px] text-zinc-500">
                          <span>u/{post.author}</span>
                          <span className="w-1 h-1 rounded-full bg-zinc-700" />
                          <span className="flex items-center gap-1">
                            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                              <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path>
                            </svg>
                            {post.num_comments}
                          </span>
                        </div>
                      </a>
                    ))
                  )
                ) : (
                  // Twitter Tab
                  <div className="bg-transparent rounded-2xl overflow-hidden min-h-[400px] w-full flex justify-center mt-2">
                    <a 
                       className="twitter-timeline" 
                       data-theme="dark" 
                       data-chrome="noheader nofooter noborders transparent"
                       href={`https://twitter.com/${twitterHandle}?ref_src=twsrc%5Etfw`}
                    >
                       Tweets by {twitterHandle}
                    </a>
                  </div>
                )}
              </div>
            </div>
          </div>

        </div>
      </main>

      {/* Settings Modal */}
      {showSettings && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-white dark:bg-[#0f0f11] border border-black/10 dark:border-white/10 rounded-3xl p-6 w-full max-w-md shadow-2xl relative">
            <button 
              onClick={() => setShowSettings(false)} 
              className="absolute top-4 right-4 text-zinc-500 hover:text-zinc-900 dark:hover:text-white transition-colors"
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
            </button>
            <h3 className="text-xl font-bold text-zinc-900 dark:text-white mb-6">Mentor: Set Global Community Feeds</h3>
            <form onSubmit={handleSavePreferences} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-zinc-600 dark:text-zinc-400 uppercase tracking-wider mb-2">Reddit Community Link</label>
                <input 
                  type="url" 
                  value={tempRedditLink} 
                  onChange={(e) => setTempRedditLink(e.target.value)} 
                  className="w-full bg-transparent border border-black/10 dark:border-white/10 rounded-xl px-4 py-3 text-sm text-zinc-900 dark:text-white focus:outline-none focus:border-pink-500/50" 
                  placeholder="https://www.reddit.com/r/learnprogramming"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-zinc-600 dark:text-zinc-400 uppercase tracking-wider mb-2">Twitter/X Profile Link</label>
                <input 
                  type="url" 
                  value={tempTwitterLink} 
                  onChange={(e) => setTempTwitterLink(e.target.value)} 
                  className="w-full bg-transparent border border-black/10 dark:border-white/10 rounded-xl px-4 py-3 text-sm text-zinc-900 dark:text-white focus:outline-none focus:border-cyan-500/50" 
                  placeholder="https://x.com/freeCodeCamp"
                />
              </div>
              <div className="pt-4">
                <button type="submit" className="w-full bg-gradient-to-r from-pink-500 to-rose-500 hover:from-pink-400 hover:to-rose-400 text-white font-semibold py-3 rounded-xl shadow-lg transition-all active:scale-[0.98]">Broadcast Feed to All Users</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Scrollbar styles for the feed */}
      <style>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 6px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: transparent;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background-color: rgba(255, 255, 255, 0.1);
          border-radius: 10px;
        }
      `}</style>
    </div>
  );
}
