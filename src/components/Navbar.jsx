import React, { useState, useEffect, useRef } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { Menu, X, Leaf, Lock, ChevronDown, LogOut, LayoutDashboard } from "lucide-react";

export default function Navbar() {
  const [isOpen, setIsOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const [doctorLogged, setDoctorLogged] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  
  const dropdownRef = useRef(null);

  useEffect(() => {
    setDoctorLogged(localStorage.getItem("ayurkaya_doctor_logged_in") === "true");
  }, [location]);

  // Click outside to close dropdown
  useEffect(() => {
    function handleClickOutside(event) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsProfileOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const toggleMenu = () => setIsOpen(!isOpen);

  const handleLogout = () => {
    localStorage.removeItem("ayurkaya_doctor_logged_in");
    setDoctorLogged(false);
    setIsProfileOpen(false);
    navigate("/");
  };

  return (
    <nav className="sticky top-0 z-50 bg-brand-beige/85 backdrop-blur-md border-b border-brand-light/45 transition-all duration-300">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-20 items-center">
          {/* Logo Section */}
          <Link to="/" className="flex items-center space-x-2 group shrink-0">
            <div className="h-10 w-10 rounded-full bg-brand-primary flex items-center justify-center text-brand-light transition-transform duration-500 group-hover:rotate-12">
              <Leaf size={22} className="fill-brand-light" />
            </div>
            <div>
              <span className="font-serif text-xl sm:text-2xl font-bold tracking-tight text-brand-primary block leading-none">
                Ayurkaya
              </span>
              <span className="text-[9px] tracking-widest text-brand-secondary uppercase font-semibold block mt-0.5">
                Ayurveda Clinic
              </span>
            </div>
          </Link>

          {/* Desktop Nav Links */}
          <div className="hidden md:flex items-center space-x-8">
            <Link
              to="/"
              className={`text-sm font-semibold tracking-wide transition-colors relative py-2 ${
                location.pathname === "/" ? "text-brand-primary" : "text-brand-secondary/85 hover:text-brand-primary"
              }`}
            >
              Home
              {location.pathname === "/" && (
                <motion.div
                  layoutId="navActiveLine"
                  className="absolute bottom-0 left-0 right-0 h-0.5 bg-brand-primary"
                  transition={{ type: "spring", stiffness: 380, damping: 30 }}
                />
              )}
            </Link>
          </div>

          {/* Desktop Session controls */}
          <div className="hidden md:flex items-center space-x-3 shrink-0">
            {doctorLogged ? (
              <div className="relative" ref={dropdownRef}>
                <button
                  onClick={() => setIsProfileOpen(!isProfileOpen)}
                  className="flex items-center gap-2 border border-brand-primary bg-brand-light/35 text-brand-primary hover:bg-brand-light px-4 py-2.5 rounded-full text-xs font-bold uppercase tracking-wider transition-all duration-200 cursor-pointer"
                >
                  <div className="w-5.5 h-5.5 rounded-full bg-brand-primary text-brand-beige flex items-center justify-center font-bold text-[10px] uppercase">
                    DR
                  </div>
                  <span>Dr. Neha</span>
                  <ChevronDown size={14} className={`transition-transform duration-250 ${isProfileOpen ? "rotate-180" : ""}`} />
                </button>

                <AnimatePresence>
                  {isProfileOpen && (
                    <motion.div
                      initial={{ opacity: 0, y: 10, scale: 0.95 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: 10, scale: 0.95 }}
                      transition={{ duration: 0.15 }}
                      className="absolute right-0 mt-2.5 w-52 bg-brand-cream border border-brand-light/75 rounded-2xl shadow-xl py-2 z-50 overflow-hidden"
                    >
                      <div className="px-4 py-2 border-b border-brand-light/30 bg-brand-beige/50">
                        <p className="text-[9px] uppercase font-bold text-brand-secondary">Session Mode</p>
                        <p className="text-xs font-bold text-brand-primary truncate">Dr. Neha Portal</p>
                      </div>
                      <Link
                        to="/doctor"
                        onClick={() => setIsProfileOpen(false)}
                        className="flex items-center gap-2 px-4 py-2.5 text-xs font-semibold text-brand-primary hover:bg-brand-light transition-colors"
                      >
                        <LayoutDashboard size={14} className="text-brand-secondary" />
                        <span>Doctor Dashboard</span>
                      </Link>
                      <div className="border-t border-brand-light/25 my-1"></div>
                      <button
                        onClick={handleLogout}
                        className="w-full text-left flex items-center gap-2 px-4 py-2.5 text-xs font-semibold text-red-600 hover:bg-red-50 transition-colors cursor-pointer"
                      >
                        <LogOut size={14} />
                        <span>Sign Out</span>
                      </button>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            ) : (
              <Link
                to="/login"
                className="flex items-center gap-1.5 border border-brand-secondary/35 hover:border-brand-primary text-brand-primary hover:bg-brand-light px-5 py-2.5 rounded-full text-xs font-bold uppercase tracking-wider transition-all duration-200"
              >
                <Lock size={12} />
                <span>Doctor Portal</span>
              </Link>
            )}
          </div>

          {/* Mobile Menu Button */}
          <div className="flex items-center md:hidden">
            <button
              onClick={toggleMenu}
              className="text-brand-primary hover:text-brand-secondary focus:outline-none p-2 rounded-lg"
              aria-label="Toggle navigation menu"
            >
              {isOpen ? <X size={26} /> : <Menu size={26} />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Nav Menu */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.2 }}
            className="md:hidden border-t border-brand-light/30 bg-brand-cream overflow-hidden"
          >
            <div className="px-4 pt-2 pb-6 space-y-2">
              <Link
                to="/"
                onClick={() => setIsOpen(false)}
                className={`block px-4 py-3 rounded-lg text-base font-semibold transition-colors ${
                  location.pathname === "/"
                    ? "bg-brand-primary text-brand-beige"
                    : "text-brand-secondary hover:bg-brand-light/35"
                }`}
              >
                Home
              </Link>
              
              <div className="pt-4 px-4 space-y-2 border-t border-brand-light/20">
                {doctorLogged ? (
                  <>
                    <Link
                      to="/doctor"
                      onClick={() => setIsOpen(false)}
                      className="flex items-center justify-center gap-1.5 w-full border border-brand-primary bg-brand-primary/10 text-brand-primary hover:bg-brand-light py-3 rounded-full text-sm font-bold tracking-wider uppercase transition-colors"
                    >
                      <LayoutDashboard size={14} /> Dr. Dashboard
                    </Link>
                    <button
                      onClick={() => {
                        setIsOpen(false);
                        handleLogout();
                      }}
                      className="w-full text-center border border-red-200 text-red-600 hover:bg-red-50 py-3 rounded-full text-sm font-bold tracking-wider uppercase transition-colors cursor-pointer"
                    >
                      Sign Out
                    </button>
                  </>
                ) : (
                  <Link
                    to="/login"
                    onClick={() => setIsOpen(false)}
                    className="flex items-center justify-center gap-1.5 w-full border border-brand-secondary/30 text-brand-primary hover:bg-brand-light py-3 rounded-full text-sm font-bold tracking-wider uppercase transition-colors"
                  >
                    <Lock size={14} /> Doctor Portal
                  </Link>
                )}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </nav>
  );
}
