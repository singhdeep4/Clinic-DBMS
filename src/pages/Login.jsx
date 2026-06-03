import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { Mail, Lock, Eye, EyeOff, ShieldAlert, CheckCircle, MailCheck, AlertCircle } from "lucide-react";
import SEO from "../components/SEO";

export default function Login() {
  const navigate = useNavigate();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  
  const [mode, setMode] = useState("signin"); // "signin" | "forgot"
  const [forgotStep, setForgotStep] = useState(1); // 1: Enter email, 2: Code, 3: Success info
  const [enteredCode, setEnteredCode] = useState("");
  const [sentCode, setSentCode] = useState("");
  const [mockEmailInbox, setMockEmailInbox] = useState(null);

  const [errorMsg, setErrorMsg] = useState("");
  const [successMsg, setSuccessMsg] = useState("");

  // Seed Doctor Account if not present
  useEffect(() => {
    const docAccount = localStorage.getItem("ayurkaya_doctor_account");
    if (!docAccount) {
      localStorage.setItem(
        "ayurkaya_doctor_account",
        JSON.stringify({
          email: "drneha@ayurkaya.com",
          password: "DrNehaAyurkaya1@",
          name: "Dr. Neha",
          passcode: "1008"
        })
      );
    }
  }, []);

  // Clear states when mode changes
  useEffect(() => {
    setErrorMsg("");
    setSuccessMsg("");
    setPassword("");
    setForgotStep(1);
    setMockEmailInbox(null);
  }, [mode]);

  const handleSignIn = (e) => {
    e.preventDefault();
    setErrorMsg("");
    setSuccessMsg("");

    if (!email || !password) {
      setErrorMsg("Please fill in all fields.");
      return;
    }

    const docAccount = JSON.parse(localStorage.getItem("ayurkaya_doctor_account") || "{}");
    const storedEmail = docAccount.email || "drneha@ayurkaya.com";
    const storedPassword = docAccount.password || "DrNehaAyurkaya1@";

    if (email.toLowerCase() === storedEmail.toLowerCase() && password === storedPassword) {
      localStorage.setItem("ayurkaya_doctor_logged_in", "true");
      setSuccessMsg("Doctor authenticated successfully!");
      setTimeout(() => {
        navigate("/doctor");
      }, 1000);
    } else {
      setErrorMsg("Invalid doctor email or password credentials.");
    }
  };

  const handleForgotSubmit = (e) => {
    e.preventDefault();
    setErrorMsg("");
    setSuccessMsg("");

    if (!email) {
      setErrorMsg("Please enter your email address.");
      return;
    }

    const docAccount = JSON.parse(localStorage.getItem("ayurkaya_doctor_account") || "{}");
    const storedEmail = docAccount.email || "drneha@ayurkaya.com";

    if (email.toLowerCase() !== storedEmail.toLowerCase()) {
      setErrorMsg("No doctor account registered under that email address.");
      return;
    }

    // Code is always 1008 or a randomized one
    const code = docAccount.passcode || "1008";
    setSentCode(code);
    setForgotStep(2);

    setMockEmailInbox({
      to: email,
      subject: "Ayurkaya Doctor Portal Recovery",
      body: `Hello Dr. Neha,\n\nYour portal passcode verification code is ${code}.\nYour current doctor login password is: "${docAccount.password || "DrNehaAyurkaya1@"}"`
    });
    setSuccessMsg("Verification code sent to your doctor email! Check the Mock Email Inbox popup.");
  };

  const handleVerifyCode = (e) => {
    e.preventDefault();
    setErrorMsg("");
    setSuccessMsg("");

    if (enteredCode !== sentCode) {
      setErrorMsg("Invalid verification code. Please try again.");
      return;
    }

    const docAccount = JSON.parse(localStorage.getItem("ayurkaya_doctor_account") || "{}");
    setSuccessMsg(`Access verified! Your password is: ${docAccount.password || "DrNehaAyurkaya1@"}`);
    setForgotStep(3);
    setMockEmailInbox(null);
  };

  return (
    <div className="min-h-[85vh] flex items-center justify-center bg-brand-cream/30 px-4 py-12 font-sans relative">
      <SEO 
        title="Doctor Portal Access" 
        description="Doctor-only login area for the Ayurkaya Clinical Patient Records System."
      />
      
      {/* Grid Pattern Background */}
      <div className="absolute inset-0 bg-[radial-gradient(#e8f5e9_1px,transparent_1px)] [background-size:20px_20px] opacity-40 pointer-events-none" />

      {/* On-Screen Mock Email Inbox simulator popup */}
      <AnimatePresence>
        {mockEmailInbox && (
          <motion.div
            initial={{ opacity: 0, y: -50, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -20, scale: 0.95 }}
            className="fixed top-24 right-4 z-50 max-w-sm w-full bg-slate-900 text-slate-100 rounded-2xl shadow-2xl p-5 border border-slate-700 text-xs font-mono"
          >
            <div className="flex justify-between items-center border-b border-slate-700 pb-2 mb-3">
              <span className="text-amber-400 font-bold uppercase tracking-wider text-[9px] flex items-center gap-1">
                <MailCheck size={12} /> [MOCK MAIL INBOX]
              </span>
              <button 
                onClick={() => setMockEmailInbox(null)}
                className="text-slate-400 hover:text-white font-bold"
              >
                ✕
              </button>
            </div>
            <div className="space-y-2">
              <div>
                <span className="text-slate-400">To:</span> {mockEmailInbox.to}
              </div>
              <div>
                <span className="text-slate-400">Subject:</span> {mockEmailInbox.subject}
              </div>
              <div className="bg-slate-950 p-3 rounded-lg border border-slate-800 text-[11px] whitespace-pre-line leading-relaxed text-slate-200">
                {mockEmailInbox.body}
              </div>
              <div className="text-[10px] text-amber-500 font-bold text-center mt-1">
                💡 Copy the code or password above to log in!
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Main card panel */}
      <div className="bg-brand-cream border border-brand-light/70 w-full max-w-md rounded-3xl p-6 md:p-10 shadow-lg relative z-10 space-y-6">
        
        {/* Logo Section */}
        <div className="text-center">
          <span className="text-[10px] text-brand-secondary font-bold uppercase tracking-widest block">
            Ayurkaya Clinic
          </span>
          <h2 className="font-serif text-3xl font-bold text-brand-primary mt-1">
            Doctor Portal
          </h2>
          <p className="text-xs text-brand-dark/65 mt-1 font-sans">
            Secure Access for Clinical Administration & Patient Records
          </p>
        </div>

        {/* Errors and Success alerts */}
        {errorMsg && (
          <div className="bg-red-50 border border-red-100 p-3 rounded-xl flex items-center gap-2.5 text-xs text-red-700 font-semibold">
            <AlertCircle size={16} className="shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}
        {successMsg && (
          <div className="bg-emerald-50 border border-emerald-100 p-3 rounded-xl flex items-center gap-2.5 text-xs text-emerald-700 font-semibold">
            <CheckCircle size={16} className="shrink-0" />
            <span>{successMsg}</span>
          </div>
        )}

        {/* forms */}
        {mode === "signin" ? (
          <form onSubmit={handleSignIn} className="space-y-4">
            <div className="relative">
              <label className="block text-[10px] font-bold text-brand-primary uppercase tracking-wider mb-2">Doctor Email Address</label>
              <div className="relative">
                <Mail size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-brand-secondary/70" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="drneha@ayurkaya.com"
                  className="w-full bg-brand-beige border border-brand-light/50 pl-11 pr-4 py-3 rounded-xl text-sm focus:outline-none focus:border-brand-secondary transition-all"
                  required
                />
              </div>
            </div>

            <div className="relative">
              <div className="flex justify-between items-center mb-2">
                <label className="block text-[10px] font-bold text-brand-primary uppercase tracking-wider">Password</label>
                <button
                  type="button"
                  onClick={() => setMode("forgot")}
                  className="text-[10px] font-bold text-brand-secondary hover:text-brand-primary uppercase tracking-wider"
                >
                  Forgot?
                </button>
              </div>
              <div className="relative">
                <Lock size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-brand-secondary/70" />
                <input
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full bg-brand-beige border border-brand-light/50 pl-11 pr-10 py-3 rounded-xl text-sm focus:outline-none focus:border-brand-secondary transition-all"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-brand-secondary/60 hover:text-brand-primary"
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              className="w-full bg-brand-primary text-brand-beige hover:bg-brand-secondary py-3.5 rounded-xl text-xs font-bold uppercase tracking-wider transition-colors shadow-md mt-2 cursor-pointer"
            >
              Sign In to DBMS Dashboard
            </button>
          </form>
        ) : (
          <div className="space-y-4">
            <h3 className="font-serif text-lg font-bold text-brand-primary border-b border-brand-light/20 pb-1 text-center">
              Password Recovery
            </h3>

            {forgotStep === 1 && (
              <form onSubmit={handleForgotSubmit} className="space-y-4">
                <div className="relative">
                  <label className="block text-[10px] font-bold text-brand-primary uppercase tracking-wider mb-2">Enter Doctor Email</label>
                  <div className="relative">
                    <Mail size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-brand-secondary/70" />
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="drneha@ayurkaya.com"
                      className="w-full bg-brand-beige border border-brand-light/50 pl-11 pr-4 py-3 rounded-xl text-sm focus:outline-none focus:border-brand-secondary"
                      required
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  className="w-full bg-brand-primary text-brand-beige hover:bg-brand-secondary py-3.5 rounded-xl text-xs font-bold uppercase tracking-wider transition-colors shadow-sm cursor-pointer"
                >
                  Request Verification Code
                </button>
              </form>
            )}

            {forgotStep === 2 && (
              <form onSubmit={handleVerifyCode} className="space-y-4">
                <div className="bg-brand-beige/40 p-4 rounded-xl border border-brand-light/35 text-center text-xs text-brand-dark/80">
                  Retrieving passcode code for <strong>{email}</strong>.
                  <br />Please retrieve it from the <strong>Mock Email Inbox popup</strong> at the top right.
                </div>

                <div className="relative">
                  <label className="block text-[10px] font-bold text-brand-primary uppercase tracking-wider mb-2">Enter 4-Digit Auth Code</label>
                  <input
                    type="text"
                    maxLength={4}
                    value={enteredCode}
                    onChange={(e) => setEnteredCode(e.target.value.replace(/[^0-9]/g, ""))}
                    placeholder="1008"
                    className="w-full text-center bg-brand-beige border border-brand-light/50 py-3 rounded-xl text-lg font-bold tracking-widest focus:outline-none focus:border-brand-secondary"
                    required
                  />
                </div>

                <button
                  type="submit"
                  className="w-full bg-brand-primary text-brand-beige hover:bg-brand-secondary py-3.5 rounded-xl text-xs font-bold uppercase tracking-wider transition-colors shadow-sm cursor-pointer"
                >
                  Verify Code
                </button>
              </form>
            )}

            {forgotStep === 3 && (
              <div className="space-y-4 text-center">
                <p className="text-xs text-brand-dark/75">
                  You can now copy your password and sign back in.
                </p>
                <button
                  type="button"
                  onClick={() => setMode("signin")}
                  className="w-full bg-brand-primary text-brand-beige hover:bg-brand-secondary py-3 rounded-xl text-xs font-bold uppercase tracking-wider transition-colors shadow-sm cursor-pointer"
                >
                  Go to Sign In
                </button>
              </div>
            )}

            {forgotStep !== 3 && (
              <div className="text-center pt-2">
                <button
                  type="button"
                  onClick={() => setMode("signin")}
                  className="text-xs text-brand-secondary hover:text-brand-primary underline font-medium"
                >
                  Back to Sign In
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
