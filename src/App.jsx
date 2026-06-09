import React, { useEffect } from "react";
import { BrowserRouter as Router, Routes, Route, useLocation, Navigate } from "react-router-dom";
import Navbar from "./components/Navbar";
import Footer from "./components/Footer";
import Home from "./pages/Home";
import DbmsDashboard from "./pages/DbmsDashboard";
import Login from "./pages/Login";

function ScrollToTop() {
  const { pathname, search } = useLocation();
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "instant" });
  }, [pathname, search]);
  return null;
}

// Wrapper: Only show Navbar+Footer on public pages, not on doctor portal
function AppShell({ children, publicPage }) {
  if (publicPage) {
    return (
      <div className="flex flex-col min-h-screen bg-brand-beige text-brand-dark font-sans">
        <Navbar />
        <main className="flex-grow">{children}</main>
        <Footer />
      </div>
    );
  }
  return <>{children}</>;
}

export default function App() {
  return (
    <Router>
      <ScrollToTop />
      <Routes>
        <Route path="/" element={<AppShell publicPage><Home /></AppShell>} />
        <Route path="/login" element={<AppShell publicPage><Login /></AppShell>} />
        <Route path="/doctor" element={<AppShell><DbmsDashboard /></AppShell>} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Router>
  );
}
