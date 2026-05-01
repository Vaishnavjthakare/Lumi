import React, { useState, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { db, auth } from "../services/firebase";
import { collection, query, where, getDocs, addDoc, updateDoc, doc } from "firebase/firestore";
import { onAuthStateChanged } from "firebase/auth";

export default function LeaderboardPage() {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [userScore, setUserScore] = useState(0);

  // Friend System State
  const [viewMode, setViewMode] = useState('global');
  const [friendInput, setFriendInput] = useState('');
  const [friendsList, setFriendsList] = useState([]);
  const [pendingRequests, setPendingRequests] = useState([]);

  // Generate Ghost Users - Memoized
  const ghosts = useMemo(() => {
    return [
        { id: '1', name: 'Alex_Dev', xp: 24500, avatar: 'A' },
        { id: '2', name: 'SarahMed', xp: 21200, avatar: 'S' },
        { id: '3', name: 'CodeNinja99', xp: 18450, avatar: 'C' },
        { id: '4', name: 'FocusMaster', xp: 15300, avatar: 'F' },
        { id: '5', name: 'BioStudent', xp: 12100, avatar: 'B' },
        { id: '6', name: 'MathGeek', xp: 9800, avatar: 'M' },
        { id: '7', name: 'NightOwl', xp: 7400, avatar: 'N' },
        { id: '8', name: 'StudyingMachine', xp: 5200, avatar: 'S' },
        { id: '9', name: 'CoffeeAddict', xp: 3100, avatar: 'C' },
    ];
  }, []);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      if (currentUser) {
        fetchUserScore(currentUser.uid);
        const myUsername = currentUser.email.split('@')[0];
        fetchConnections(myUsername);
      } else {
        setLoading(false);
      }
    });
    return () => unsubscribe();
  }, []);

  const fetchUserScore = async (uid) => {
    try {
      const q = query(collection(db, "planner_events"), where("userId", "==", uid));
      const querySnapshot = await getDocs(q);
      
      let rawXp = 0;
      querySnapshot.forEach((docSnap) => {
        const ev = docSnap.data();
        if (ev.completed) {
            rawXp += ev.title.includes("Deep Work") ? 150 : 50;
        }
      });
      setUserScore(rawXp);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const fetchConnections = async (username) => {
      try {
          const qReceiver = query(collection(db, 'friend_requests'), where('receiver', '==', username));
          const recSnap = await getDocs(qReceiver);
          
          const qSender = query(collection(db, 'friend_requests'), where('sender', '==', username));
          const senSnap = await getDocs(qSender);

          const fetchedFriends = [];
          const fetchedPending = [];

          recSnap.forEach(docSnap => {
              const data = docSnap.data();
              if (data.status === 'accepted') fetchedFriends.push(data.sender);
              if (data.status === 'pending') fetchedPending.push({ id: docSnap.id, ...data });
          });

          senSnap.forEach(docSnap => {
              const data = docSnap.data();
              if (data.status === 'accepted') fetchedFriends.push(data.receiver);
          });

          setFriendsList(fetchedFriends);
          setPendingRequests(fetchedPending);
      } catch (err) {
          console.error("Error fetching connections", err);
      }
  };

  const handleAddFriend = async () => {
      if (!friendInput.trim() || !user) return;
      
      const myUsername = user.email.split('@')[0];
      const targetUsername = friendInput.trim();

      if (myUsername === targetUsername) {
          alert("You cannot send a friend request to yourself.");
          return;
      }

      try {
          await addDoc(collection(db, 'friend_requests'), {
              sender: myUsername,
              receiver: targetUsername,
              status: 'pending'
          });
          setFriendInput('');
          alert(`Friend request securely sent to ${targetUsername}!`);
      } catch (err) {
          console.error("Failed to send request", err);
      }
  };

  const handleAcceptRequest = async (requestId, senderName) => {
      try {
          const reqRef = doc(db, 'friend_requests', requestId);
          await updateDoc(reqRef, { status: 'accepted' });
          
          // Mutate local state instantly to reflect UI
          setPendingRequests(prev => prev.filter(r => r.id !== requestId));
          setFriendsList(prev => [...prev, senderName]);
      } catch (err) {
          console.error("Failed to accept request", err);
      }
  };

  const handleKeyPress = (e) => {
      if (e.key === 'Enter') handleAddFriend();
  };

  // Combine User and Ghosts, applying Filter
  const leaderboard = useMemo(() => {
      const allPlayers = [...ghosts];
      
      if (user) {
          allPlayers.push({
              id: user.uid,
              name: user.email.split('@')[0] + " (You)",
              xp: userScore,
              avatar: user.email.charAt(0).toUpperCase(),
              isUser: true
          });
      }

      // Apply Friends Toggle Logic
      let filteredPlayers = allPlayers;
      if (viewMode === 'friends') {
          filteredPlayers = allPlayers.filter(p => p.isUser || friendsList.includes(p.name));
      }
      
      return filteredPlayers.sort((a, b) => b.xp - a.xp);
  }, [user, userScore, ghosts, viewMode, friendsList]);

  const top3 = leaderboard.slice(0, 3);
  const rest = leaderboard.slice(3);

  return (
    <div className="min-h-screen bg-transparent text-zinc-900 dark:text-white font-sans relative overflow-x-hidden pb-20 custom-scrollbar">
      
      

      {/* Navigation */}
      <nav className="relative z-10 px-6 md:px-12 py-6 flex flex-col md:flex-row gap-4 items-center justify-between">
        <button onClick={() => navigate("/profile")} className="group flex items-center gap-2 text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:text-white transition-colors w-full md:w-auto">
          <div className="w-8 h-8 rounded-full bg-black/5 dark:bg-white/[0.05] border border-black/5 dark:border-white/[0.08] flex items-center justify-center group-hover:bg-black/[0.1] dark:bg-white/[0.1] transition-all">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="19" y1="12" x2="5" y2="12"></line><polyline points="12 19 5 12 12 5"></polyline></svg>
          </div>
          <span className="text-sm font-medium">Player Profile</span>
        </button>

        {/* Add Friend Bar */}
        <div className="flex items-center gap-2 w-full md:w-auto">
            <input 
               value={friendInput}
               onChange={e => setFriendInput(e.target.value)}
               onKeyDown={handleKeyPress}
               placeholder="Add friend (e.g. Alex_Dev)"
               className="bg-white/40 dark:bg-black/50 backdrop-blur-xl border border-white/[0.1] text-sm text-zinc-900 dark:text-white rounded-full px-4 py-2 flex-1 md:w-56 focus:outline-none focus:border-fuchsia-500 focus:ring-1 focus:ring-fuchsia-500 transition-all placeholder:text-zinc-600"
            />
            <button onClick={handleAddFriend} className="bg-fuchsia-500/20 text-fuchsia-400 hover:bg-fuchsia-500 hover:text-zinc-900 dark:text-white px-4 py-2 rounded-full text-sm font-bold transition-all shadow-[0_0_15px_rgba(217,70,239,0.15)] flex items-center gap-1 shrink-0">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><line x1="12" y1="5" x2="12" y2="19"></line><line x1="5" y1="12" x2="19" y2="12"></line></svg>
                <span className="hidden sm:inline">Add</span>
            </button>
        </div>
      </nav>

      {/* Hero */}
      <div className="relative z-10 max-w-4xl mx-auto px-6 mt-2 text-center animate-in fade-in slide-in-from-bottom-8 duration-700">
          <h1 className="text-4xl md:text-6xl font-black uppercase tracking-tight mb-4 text-transparent bg-clip-text bg-gradient-to-r from-fuchsia-400 via-pink-500 to-orange-500 fade-in zoom-in">
              {viewMode === 'global' ? 'The Global Arena' : 'Private Arena'}
          </h1>
          <p className="text-zinc-600 dark:text-zinc-400 mb-8 font-medium">
             {viewMode === 'global' ? 'Study. Produce. Conquer. Compete against students worldwide.' : 'Brutal competition against your closest rivals.'}
          </p>

          {/* Notification Inbox */}
          {pendingRequests.length > 0 && (
             <div className="flex flex-col gap-3 max-w-xl mx-auto mb-10">
                 {pendingRequests.map(req => (
                     <div key={req.id} className="bg-white/40 dark:bg-black/50 backdrop-blur-xl border border-fuchsia-500/30 rounded-2xl p-4 flex items-center justify-between shadow-[0_0_25px_rgba(217,70,239,0.15)] animate-in slide-in-from-top-4 duration-500">
                         <div className="flex items-center gap-4">
                             <div className="w-12 h-12 rounded-full bg-gradient-to-br from-fuchsia-600 to-orange-500 text-zinc-900 dark:text-white flex items-center justify-center font-bold text-xl shadow-inner shadow-white/20">
                                 {req.sender.charAt(0).toUpperCase()}
                             </div>
                             <div className="text-left">
                                 <h4 className="text-base font-bold text-zinc-900 dark:text-white leading-tight">{req.sender}</h4>
                                 <p className="text-xs text-fuchsia-300 font-medium">Sent you a friend request</p>
                             </div>
                         </div>
                         <button onClick={() => handleAcceptRequest(req.id, req.sender)} className="bg-white text-black hover:bg-zinc-200 font-bold text-sm px-6 py-2.5 rounded-full transition-all shadow-[0_0_15px_rgba(255,255,255,0.2)]">
                             Accept
                         </button>
                     </div>
                 ))}
             </div>
          )}

          {/* Core Arena Toggle */}
          <div className="flex justify-center mb-16">
              <div className="bg-white/40 dark:bg-black/50 backdrop-blur-xl p-1.5 rounded-full border border-white/[0.1] flex relative shadow-2xl w-72 h-14">
                   {/* Animated Background slider */}
                   <div 
                      className={`absolute top-1.5 bottom-1.5 w-[calc(50%-6px)] bg-gradient-to-r from-violet-600 to-fuchsia-600 rounded-full transition-all duration-300 ease-out shadow-[0_0_15px_rgba(217,70,239,0.4)]`}
                      style={{ transform: viewMode === 'global' ? 'translateX(0)' : 'translateX(100%)' }}
                   />
                   
                   <button 
                      onClick={() => setViewMode('global')}
                      className={`relative z-10 flex-1 rounded-full text-sm font-bold transition-colors duration-300 flex items-center justify-center gap-2 ${viewMode === 'global' ? 'text-zinc-900 dark:text-white' : 'text-zinc-500 hover:text-zinc-900 dark:text-white'}`}
                   >
                     🌍 Global Rank
                   </button>
                   <button 
                      onClick={() => setViewMode('friends')}
                      className={`relative z-10 flex-1 rounded-full text-sm font-bold transition-colors duration-300 flex items-center justify-center gap-2 ${viewMode === 'friends' ? 'text-zinc-900 dark:text-white' : 'text-zinc-500 hover:text-zinc-900 dark:text-white'}`}
                   >
                     🤝 Friends Only
                   </button>
              </div>
          </div>

          {/* Top 3 Podium */}
          {top3.length > 0 && (
              <div className="flex justify-center items-end gap-2 md:gap-6 mb-16 h-64 border-b border-black/5 dark:border-white/[0.05] pb-8">
                  {/* Rank 2 */}
                  {top3[1] && (
                    <div className="flex flex-col items-center w-28 md:w-32 animate-in fade-in slide-in-from-bottom-12 duration-700 delay-100">
                        <div className={`w-16 h-16 rounded-full flex items-center justify-center text-xl font-bold mb-3 shadow-[0_0_30px_rgba(255,255,255,0.1)] border-2 z-10 ${top3[1].isUser ? 'bg-fuchsia-600 border-fuchsia-400' : 'bg-zinc-800 border-zinc-600'}`}>{top3[1].avatar}</div>
                        <div className="w-full h-32 bg-gradient-to-t from-white/[0.02] to-white/[0.08] border-t border-l border-r border-white/[0.1] rounded-t-lg flex flex-col items-center pt-3 relative overflow-hidden backdrop-blur-md">
                            <span className="text-sm font-bold text-zinc-300">#2</span>
                            <span className="text-xs text-zinc-500 mt-1 truncate w-20 text-center">{top3[1].name}</span>
                            <span className="text-xs font-bold text-fuchsia-400 mt-auto mb-3">{top3[1].xp.toLocaleString()} XP</span>
                        </div>
                    </div>
                  )}

                  {/* Rank 1 */}
                  {top3[0] && (
                    <div className="flex flex-col items-center w-32 md:w-40 animate-in fade-in zoom-in-50 duration-700 relative z-20 mx-2">
                        <div className="absolute -top-10 text-yellow-400 animate-bounce">
                            <svg width="32" height="32" viewBox="0 0 24 24" fill="currentColor" stroke="none"><path d="M5 16L3 5l5.5 5L12 4l3.5 6L21 5l-2 11H5zm14 3c0 .6-.4 1-1 1H6c-.6 0-1-.4-1-1v-1h14v1z"></path></svg>
                        </div>
                        <div className={`w-20 h-20 rounded-full flex items-center justify-center text-2xl font-bold mb-3 shadow-[0_0_50px_rgba(250,204,21,0.2)] border-4 z-10 ${top3[0].isUser ? 'bg-fuchsia-600 border-yellow-400' : 'bg-zinc-800 border-yellow-500'}`}>{top3[0].avatar}</div>
                        <div className="w-full h-40 bg-gradient-to-t from-yellow-500/5 to-yellow-500/20 border-t border-l border-r border-yellow-500/30 rounded-t-lg flex flex-col items-center pt-3 relative overflow-hidden backdrop-blur-md">
                            <span className="text-lg font-black text-yellow-500">#1</span>
                            <span className="text-sm font-bold text-zinc-900 dark:text-white mt-1 truncate w-28 text-center">{top3[0].name}</span>
                            <span className="text-sm font-black text-yellow-400 mt-auto mb-4">{top3[0].xp.toLocaleString()} XP</span>
                        </div>
                    </div>
                  )}

                  {/* Rank 3 */}
                  {top3[2] && (
                    <div className="flex flex-col items-center w-28 md:w-32 animate-in fade-in slide-in-from-bottom-12 duration-700 delay-200">
                        <div className={`w-14 h-14 rounded-full flex items-center justify-center text-lg font-bold mb-3 shadow-[0_0_20px_rgba(255,255,255,0.05)] border-2 z-10 ${top3[2].isUser ? 'bg-fuchsia-600 border-orange-400' : 'bg-zinc-800 border-orange-700/50'}`}>{top3[2].avatar}</div>
                        <div className="w-full h-24 bg-gradient-to-t from-orange-500/5 to-orange-500/10 border-t border-l border-r border-orange-500/20 rounded-t-lg flex flex-col items-center pt-3 relative overflow-hidden backdrop-blur-md">
                            <span className="text-sm font-bold text-orange-400">#3</span>
                            <span className="text-xs text-zinc-500 mt-1 truncate w-20 text-center">{top3[2].name}</span>
                            <span className="text-xs font-bold text-orange-400 mt-auto mb-2">{top3[2].xp.toLocaleString()} XP</span>
                        </div>
                    </div>
                  )}
              </div>
          )}

          {/* Zero State for Friends */}
          {leaderboard.length === 1 && viewMode === 'friends' && (
              <div className="py-12 border border-black/5 dark:border-white/[0.05] rounded-3xl bg-black/[0.01] dark:bg-white/[0.01]">
                  <div className="w-16 h-16 bg-black/5 dark:bg-white/[0.05] rounded-full mx-auto flex items-center justify-center mb-4">
                     <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-zinc-500"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path><circle cx="9" cy="7" r="4"></circle><path d="M23 21v-2a4 4 0 0 0-3-3.87"></path><path d="M16 3.13a4 4 0 0 1 0 7.75"></path></svg>
                  </div>
                  <h3 className="text-xl font-bold text-zinc-900 dark:text-white mb-2">It's quiet in here</h3>
                  <p className="text-zinc-500 max-w-sm mx-auto">Use the search bar at the top to add friends like <span className="text-fuchsia-400">Alex_Dev</span> to construct your private arena.</p>
              </div>
          )}

          {/* List Remaining */}
          {rest.length > 0 && (
            <div className="bg-white/40 dark:bg-black/50 backdrop-blur-xl border border-black/5 dark:border-white/[0.05] rounded-3xl p-4 md:p-8 shadow-2xl animate-in fade-in slide-in-from-bottom-10 duration-700 delay-300">
                <div className="space-y-3">
                    {rest.map((player, idx) => (
                        <div key={player.id} className={`card-hover card-shimmer flex items-center gap-4 p-4 rounded-xl ${player.isUser ? 'bg-fuchsia-500/10 border border-fuchsia-500/30 shadow-lg shadow-fuchsia-900/20' : 'bg-black/[0.02] dark:bg-white/[0.02] border border-white/[0.03] hover:bg-black/5 dark:bg-white/[0.05]'}`}>
                            <span className="text-zinc-500 font-bold w-6 text-center">#{idx + 4}</span>
                            <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm ${player.isUser ? 'bg-fuchsia-600 text-zinc-900 dark:text-white' : 'bg-zinc-800 text-zinc-600 dark:text-zinc-400'}`}>
                                {player.avatar}
                            </div>
                            <span className={`font-semibold md:text-lg flex-1 text-left ${player.isUser ? 'text-zinc-900 dark:text-white' : 'text-zinc-300'}`}>{player.name}</span>
                            <span className={`font-bold tracking-wide ${player.isUser ? 'text-fuchsia-400' : 'text-zinc-500'}`}>{player.xp.toLocaleString()} XP</span>
                        </div>
                    ))}
                </div>
            </div>
          )}

      </div>
    </div>
  );
}
