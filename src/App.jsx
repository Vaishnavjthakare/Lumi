import React from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";

import LoginPage from "./pages/LoginPage";
import LandingPage from "./pages/LandingPage";
import SmartRoadmapPage from "./pages/SmartRoadmapPage";
import StudyPlannerPage from "./pages/StudyPlannerPage";
import PerformanceTrackerPage from "./pages/PerformanceTrackerPage";
import FocusModePage from "./pages/FocusModePage";
import SocialPage from "./pages/SocialPage";
import SignupPage from "./pages/SignupPage";
import ProfilePage from "./pages/ProfilePage";
import LeaderboardPage from "./pages/LeaderboardPage";
import GuidePage from "./pages/GuidePage";
import ThemeToggle from "./components/ThemeToggle";
import DynamicBackground from "./components/DynamicBackground";

function App() {
  return (
    <Router>
      <DynamicBackground />
      <ThemeToggle />
      <Routes>
        <Route path="/" element={<LoginPage />} />
        <Route path="/home" element={<LandingPage />} />
        <Route path="/signup" element={<SignupPage />} />
        <Route path="/guide" element={<GuidePage />} />
        <Route path="/roadmap-generator" element={<SmartRoadmapPage />} />
        <Route path="/study-planner" element={<StudyPlannerPage />} />
        <Route path="/performance-tracker" element={<PerformanceTrackerPage />} />
        <Route path="/focus" element={<FocusModePage />} />
        <Route path="/social" element={<SocialPage />} />
        <Route path="/profile" element={<ProfilePage />} />
        <Route path="/leaderboard" element={<LeaderboardPage />} />
      </Routes>
    </Router>
  );
}

export default App;
