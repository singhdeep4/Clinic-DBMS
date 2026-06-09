import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  User, Plus, Trash2, Search, Printer, Save, RefreshCw, LogOut,
  PlusCircle, ArrowLeft, ArrowRight, Database, BarChart3, Bell,
  Shield, Download, Upload, AlertTriangle, Calendar, Menu, History,
  X, Stethoscope, FlaskConical, ClipboardList, Pill, TrendingUp,
  CheckCircle, Clock, Activity, ChevronRight, Eye, Users
} from "lucide-react";
import SEO from "../components/SEO";
import { getAllItems, putItem, deleteItem, clearStore, migrateFromLocalStorage } from "../lib/db";

// ─── HELPERS ──────────────────────────────────────────────────────────────────
const getDurationString = (dateStr) => {
  if (!dateStr) return "";
  const onset = new Date(dateStr);
  const now = new Date();
  if (isNaN(onset.getTime())) return "";
  onset.setHours(0, 0, 0, 0);
  now.setHours(0, 0, 0, 0);
  const diffDays = Math.floor((now - onset) / 86400000);
  if (diffDays < 0) return "Future date";
  if (diffDays === 0) return "Today";
  if (diffDays === 1) return "1 day";
  if (diffDays < 30) return `${diffDays} days`;
  const diffMonths = Math.floor(diffDays / 30.4);
  if (diffMonths < 12) return `${diffMonths} month${diffMonths > 1 ? "s" : ""}`;
  const diffYears = Math.floor(diffMonths / 12);
  const rem = diffMonths % 12;
  return rem === 0 ? `${diffYears} yr${diffYears > 1 ? "s" : ""}` : `${diffYears}y ${rem}m`;
};

const calculateAutoOutcomeScore = (progressObj, complaints) => {
  if (!complaints || complaints.length === 0) return "3";
  let total = 0, count = 0;
  complaints.forEach(c => {
    if (!c.text?.trim()) return;
    const s = progressObj[c.text.trim()] || "Stable";
    const score = s === "Cured" ? 5 : s === "Improved" ? 4 : s === "Stable" ? 3 : 1.5;
    total += score; count++;
  });
  if (count === 0) return "3";
  return String(Math.round(total / count));
};

const fmtDate = (iso) => {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" });
};

// ─── PRESETS ──────────────────────────────────────────────────────────────────
const MEDICINE_PRESETS = [
  "Triphala Churna","Chandraprabha Vati","Gandharvahastadi Kashayam",
  "Arogyavardhini Vati","Mahanarayan Tailam","Ashwagandhadi Churna",
  "Kanchanar Guggulu","Kaishore Guggulu","Shatavari Ghrita",
  "Dashmoolarishta","Trikatu Churna","Avipattikar Churna",
];
const COMPLAINT_PRESETS = [
  "Bloating / Ajeerna","Acidity / Amlapitta","Constipation / Vibandha",
  "Cough / Kasa","Joint Pain / Sandhishoola","Lower Back Pain / Katishoola",
  "Insomnia / Anidra","Fatigue / Klama","Skin Rash / Twak Vikara",
  "Headache / Shirashoola","Stress & Anxiety","Hair Loss / Khalitya",
];
const LAB_PANELS = {
  Glycemic: [
    { testName:"Fasting Blood Sugar (FBS)",value:"",range:"70–100",unit:"mg/dL" },
    { testName:"Post-Prandial Blood Sugar (PPBS)",value:"",range:"<140",unit:"mg/dL" },
    { testName:"HbA1c (Glycated Hemoglobin)",value:"",range:"4.0–5.6",unit:"%" },
  ],
  Lipid: [
    { testName:"Total Cholesterol",value:"",range:"125–200",unit:"mg/dL" },
    { testName:"Triglycerides",value:"",range:"<150",unit:"mg/dL" },
    { testName:"HDL (Good Cholesterol)",value:"",range:">40",unit:"mg/dL" },
    { testName:"LDL (Bad Cholesterol)",value:"",range:"<100",unit:"mg/dL" },
  ],
  LFT: [
    { testName:"SGOT (AST)",value:"",range:"5–40",unit:"U/L" },
    { testName:"SGPT (ALT)",value:"",range:"7–56",unit:"U/L" },
    { testName:"Total Bilirubin",value:"",range:"0.1–1.2",unit:"mg/dL" },
    { testName:"Alkaline Phosphatase (ALP)",value:"",range:"44–147",unit:"U/L" },
  ],
  KFT: [
    { testName:"Serum Creatinine",value:"",range:"0.5–1.2",unit:"mg/dL" },
    { testName:"Blood Urea Nitrogen (BUN)",value:"",range:"7–20",unit:"mg/dL" },
    { testName:"Uric Acid",value:"",range:"2.4–6.0",unit:"mg/dL" },
  ],
};

// ─── DEFAULT STATE ─────────────────────────────────────────────────────────────
const DEFAULT_STATE = {
  patientId:"",name:"",age:"",gender:"Male",mobile:"",occupation:"",
  complaints:[{ text:"",onsetDate:"" }],
  complaintsProgress:{},
  kshudha:"Sama",mutra:"Normal",mala:"Normal",koshtha:"Madhya",nidra:"Normal",avastha:"Niraama",
  pastHistory:{ diabetes:false,htn:false,thyroid:false,asthma:false,obesity:false,gut:false,others:"" },
  drugHistory:{ hasHistory:"No",details:"" },
  familyHistory:{ diabetes:false,htn:false,thyroid:false,others:"" },
  addiction:"None",
  vegaDharana:{ mutra:false,mala:false,nidra:false,others:"" },
  workType:"Mixed",stressLevel:"Moderate",
  prakriti:"Vata-Pitta",vikriti:"Vata",
  dosha:{ vata:true,pitta:false,kapha:false },
  dushya:{ rasa:true,rakta:false,mamsa:false,meda:false,asthi:false,majja:false,shukra:false },
  srotas:{ annavaha:true,pranavaha:false,rasavaha:false,raktavaha:false,medovaha:false,mutravaha:false,purishavaha:false },
  agni:"Sama",samprapti:"Agnimandya",sampraptiCustom:"",
  diet:"Mixed",appetite:"Normal",sleep:"Good",activity:"Moderate",
  divaswap:"No",waterIntake:"Adequate",viruddhaAhara:"No",junkFood:"Occasional",
  medicines:[{ name:"",dose:"1 tab BD",kala:"After food",anupana:"Warm water" }],
  panchakarma:"None",
  followUpSymptoms:"Same",followUpAgni:"Same",followUpTreatment:"Continued",
  outcomeScore:"3",
  labTests:[],notes:"",visitDate:"",visits:[],
};

// ─── SUB-COMPONENTS ───────────────────────────────────────────────────────────

/** Reusable section header */
const SectionHead = ({ num, title, action }) => (
  <div className="flex justify-between items-center mb-5">
    <div className="flex items-center gap-3">
      {num && (
        <span className="w-7 h-7 rounded-lg flex items-center justify-center text-xs font-black"
          style={{ background:"rgba(16,185,129,0.15)", color:"#10b981" }}>
          {num}
        </span>
      )}
      <h3 className="font-bold text-base" style={{ color:"#e2e8f0" }}>{title}</h3>
    </div>
    {action}
  </div>
);

/** Progress status badge */
const ProgressBadge = ({ status }) => {
  const map = {
    Cured:    "badge-green",
    Improved: "badge-blue",
    Stable:   "badge-amber",
    Worse:    "badge-rose",
  };
  return <span className={`hm-badge ${map[status] || "badge-slate"}`}>{status}</span>;
};

/** Outcome score badge */
const ScoreBadge = ({ score }) => {
  const s = parseInt(score);
  const cls = s >= 4 ? "badge-green" : s === 3 ? "badge-amber" : "badge-rose";
  const label = s >= 5 ? "Cured" : s === 4 ? "Improved" : s === 3 ? "Stable" : s === 2 ? "No Relief" : "Worsened";
  return <span className={`hm-badge ${cls}`}>{s}/5 · {label}</span>;
};

// ─── MAIN COMPONENT ───────────────────────────────────────────────────────────
export default function DbmsDashboard() {
  const navigate = useNavigate();
  const [isAuth, setIsAuth] = useState(false);
  const [view, setView] = useState("clinical"); // clinical | analytics | alerts | utilities
  const [activeTab, setActiveTab] = useState("profile");
  const [savedCases, setSavedCases] = useState([]);
  const [current, setCurrent] = useState({ ...DEFAULT_STATE });
  const [searchTerm, setSearchTerm] = useState("");
  const [matchingPatients, setMatchingPatients] = useState([]);
  const [isPrint, setIsPrint] = useState(false);
  const [toast, setToast] = useState("");
  const [sidebarOpen, setSidebarOpen] = useState(window.innerWidth >= 1024);
  const [historyOpen, setHistoryOpen] = useState(false);
  const [liveQueue, setLiveQueue] = useState([]);
  const [queueForm, setQueueForm] = useState({ name:"",age:"",gender:"Male",mobile:"",reason:"" });

  // ── Auth ──────────────────────────────────────────────────────────────────
  useEffect(() => {
    if (localStorage.getItem("ayurkaya_doctor_logged_in") === "true") setIsAuth(true);
    else navigate("/login");
  }, [navigate]);

  useEffect(() => {
    const onResize = () => { if (window.innerWidth >= 1024) setSidebarOpen(true); };
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);

  // ── Load data ─────────────────────────────────────────────────────────────
  useEffect(() => {
    if (!isAuth) return;
    (async () => {
      await migrateFromLocalStorage();
      const cases = await getAllItems("cases");
      cases.sort((a, b) => new Date(b.visitDate || 0) - new Date(a.visitDate || 0));
      setSavedCases(cases);
      const queue = await getAllItems("queue");
      setLiveQueue(queue);
      const draft = localStorage.getItem("ayurkaya_workspace_draft");
      if (draft) {
        try { setCurrent(JSON.parse(draft)); notify("Draft workspace restored."); }
        catch {}
      }
    })();
  }, [isAuth]);

  // ── Auto-save draft ───────────────────────────────────────────────────────
  useEffect(() => {
    if (!isAuth) return;
    const hasData = current.name?.trim() || current.mobile?.trim() ||
      (current.complaints?.length > 1 || current.complaints?.[0]?.text);
    if (hasData) localStorage.setItem("ayurkaya_workspace_draft", JSON.stringify(current));
    else localStorage.removeItem("ayurkaya_workspace_draft");
  }, [current, isAuth]);

  // ── Mobile registry lookup (no auto-fill) ────────────────────────────────
  useEffect(() => {
    const clean = (current.mobile || "").replace(/\D/g, "");
    if (clean.length === 10 && !current.patientId) {
      (async () => {
        try {
          const reg = await getAllItems("registry");
          setMatchingPatients(reg.filter(r => (r.mobile || "").replace(/\D/g, "") === clean));
        } catch {}
      })();
    } else {
      setMatchingPatients([]);
    }
  }, [current.mobile, current.patientId]);

  // ── Helpers ───────────────────────────────────────────────────────────────
  const notify = (msg) => { setToast(msg); setTimeout(() => setToast(""), 3500); };
  const set = (field, val) => setCurrent(p => ({ ...p, [field]: val }));
  const setGroup = (group, key, val) => setCurrent(p => ({ ...p, [group]: { ...p[group], [key]: val } }));

  // ── Patient ID generator ──────────────────────────────────────────────────
  const genId = async () => {
    const cases = await getAllItems("cases");
    const reg   = await getAllItems("registry");
    const ids   = new Set([...cases.map(c => c.patientId), ...reg.map(r => r.patientId)]);
    let max = 0;
    ids.forEach(id => { if (id?.startsWith("PAT-")) { const n = parseInt(id.slice(4)); if (n > max) max = n; } });
    return `PAT-${String(max + 1).padStart(8, "0")}`;
  };

  // ── Complaint handlers ────────────────────────────────────────────────────
  const addComplaint = () => setCurrent(p => ({ ...p, complaints: [...p.complaints, { text:"",onsetDate:"" }] }));
  const updateComplaint = (i, f, v) => setCurrent(p => {
    const arr = [...p.complaints]; arr[i][f] = v; return { ...p, complaints: arr };
  });
  const removeComplaint = (i) => setCurrent(p => ({
    ...p, complaints: p.complaints.filter((_, idx) => idx !== i).length ? p.complaints.filter((_, idx) => idx !== i) : [{ text:"",onsetDate:"" }]
  }));
  const addComplaintPreset = (text) => setCurrent(p => {
    const arr = [...p.complaints];
    const empty = arr.findIndex(c => !c.text);
    const today = new Date().toISOString().split("T")[0];
    if (empty !== -1) { arr[empty] = { text, onsetDate: today }; return { ...p, complaints: arr }; }
    return { ...p, complaints: [...arr, { text, onsetDate: today }] };
  });

  // ── Medicine handlers ─────────────────────────────────────────────────────
  const addMedicine = () => setCurrent(p => ({ ...p, medicines: [...p.medicines, { name:"",dose:"1 tab BD",kala:"After food",anupana:"Warm water" }] }));
  const updateMed = (i, f, v) => setCurrent(p => { const arr = [...p.medicines]; arr[i][f] = v; return { ...p, medicines: arr }; });
  const removeMed = (i) => setCurrent(p => ({ ...p, medicines: p.medicines.length > 1 ? p.medicines.filter((_,idx) => idx !== i) : p.medicines }));
  const addMedPreset = (name) => setCurrent(p => {
    const arr = [...p.medicines];
    const empty = arr.findIndex(m => !m.name);
    if (empty !== -1) { arr[empty].name = name; return { ...p, medicines: arr }; }
    return { ...p, medicines: [...arr, { name, dose:"1 tab BD", kala:"After food", anupana:"Warm water" }] };
  });

  // ── Lab handlers ──────────────────────────────────────────────────────────
  const addLabPanel = (panel) => setCurrent(p => {
    const existing = new Set(p.labTests.map(t => t.testName));
    const newTests = (LAB_PANELS[panel] || []).filter(t => !existing.has(t.testName));
    if (!newTests.length) { notify(`${panel} panel already loaded.`); return p; }
    notify(`Added ${panel} panel.`);
    return { ...p, labTests: [...p.labTests, ...JSON.parse(JSON.stringify(newTests))] };
  });
  const updateLabVal = (i, v) => setCurrent(p => { const arr = [...p.labTests]; arr[i].value = v; return { ...p, labTests: arr }; });
  const updateLabField = (i, f, v) => setCurrent(p => { const arr = [...p.labTests]; arr[i][f] = v; return { ...p, labTests: arr }; });
  const removeLabTest = (i) => setCurrent(p => ({ ...p, labTests: p.labTests.filter((_,idx) => idx !== i) }));
  const addCustomLab = () => setCurrent(p => ({ ...p, labTests: [...p.labTests, { testName:"",value:"",range:"Custom",unit:"-" }] }));

  // ── Save case ─────────────────────────────────────────────────────────────
  const saveCase = async () => {
    if (!current.name?.trim()) { notify("Patient name is required."); setActiveTab("profile"); return; }
    let cases = [...savedCases];
    let updated = { ...current };
    const cleanMobile = (updated.mobile || "").replace(/\D/g, "");

    if (updated.patientId) {
      updated.visitDate = updated.visitDate || new Date().toISOString();
      cases = cases.map(c => c.patientId === updated.patientId ? updated : c);
      await putItem("cases", updated);
      if (cleanMobile.length === 10) {
        await putItem("registry", { patientId: updated.patientId, name: updated.name, age: updated.age, gender: updated.gender, mobile: cleanMobile, occupation: updated.occupation, updatedAt: new Date().toISOString() });
      }
      notify("Patient record updated ✓");
    } else {
      const newId = await genId();
      updated.patientId = newId;
      updated.visitDate = new Date().toISOString();
      await putItem("cases", updated);
      if (cleanMobile.length === 10) {
        await putItem("registry", { patientId: newId, name: updated.name, age: updated.age, gender: updated.gender, mobile: cleanMobile, occupation: updated.occupation, updatedAt: new Date().toISOString() });
      }
      cases = [updated, ...cases];
      setCurrent(updated);
      notify(`New record created — ${newId} ✓`);
    }
    cases.sort((a, b) => new Date(b.visitDate || 0) - new Date(a.visitDate || 0));
    setSavedCases(cases);
  };

  // ── Record follow-up visit ────────────────────────────────────────────────
  const recordFollowUp = async () => {
    if (!current.patientId) { notify("Save the patient record first."); return; }
    try {
      const snapshot = {
        visitId: "VIS-" + Date.now(),
        visitDate: current.visitDate || new Date().toISOString(),
        complaints: JSON.parse(JSON.stringify(current.complaints || [])),
        complaintsProgress: JSON.parse(JSON.stringify(current.complaintsProgress || {})),
        kshudha: current.kshudha, mutra: current.mutra, mala: current.mala,
        koshtha: current.koshtha, nidra: current.nidra, avastha: current.avastha,
        prakriti: current.prakriti, vikriti: current.vikriti,
        dosha: JSON.parse(JSON.stringify(current.dosha || {})),
        dushya: JSON.parse(JSON.stringify(current.dushya || {})),
        srotas: JSON.parse(JSON.stringify(current.srotas || {})),
        agni: current.agni, samprapti: current.samprapti, sampraptiCustom: current.sampraptiCustom,
        diet: current.diet, appetite: current.appetite, sleep: current.sleep, activity: current.activity,
        divaswap: current.divaswap, waterIntake: current.waterIntake, viruddhaAhara: current.viruddhaAhara, junkFood: current.junkFood,
        medicines: JSON.parse(JSON.stringify(current.medicines || [])),
        panchakarma: current.panchakarma,
        followUpSymptoms: current.followUpSymptoms, followUpAgni: current.followUpAgni, followUpTreatment: current.followUpTreatment,
        outcomeScore: current.outcomeScore, notes: current.notes,
        labTests: JSON.parse(JSON.stringify(current.labTests || [])),
      };

      // Only carry forward complaints NOT marked Cured
      const carried = (current.complaints || []).filter(c => {
        if (!c.text) return false;
        return (current.complaintsProgress || {})[c.text.trim()] !== "Cured";
      });

      const newState = {
        ...current,
        visitDate: new Date().toISOString(),
        visits: [snapshot, ...(current.visits || [])],
        complaints: carried.length ? carried.map(c => ({ text: c.text, onsetDate: c.onsetDate })) : [{ text:"",onsetDate:"" }],
        complaintsProgress: {},
        outcomeScore: "3", notes: "",
        followUpSymptoms: "Same", followUpAgni: "Same", followUpTreatment: "Continued",
      };

      setCurrent(newState);
      await putItem("cases", newState);
      const casesList = savedCases.map(c => c.patientId === current.patientId ? newState : c);
      casesList.sort((a, b) => new Date(b.visitDate || 0) - new Date(a.visitDate || 0));
      setSavedCases(casesList);
      notify("Visit archived. Follow-up consultation started ✓");
      setActiveTab("complaints");
    } catch (err) {
      console.error(err);
      notify("Failed to record follow-up.");
    }
  };

  // ── Load patient ──────────────────────────────────────────────────────────
  const selectCase = (c) => {
    setCurrent({ ...c });
    setView("clinical");
    setActiveTab("profile");
    setMatchingPatients([]);
    notify(`Loaded — ${c.name}`);
  };
  const loadFromRegistry = (p) => {
    const existing = savedCases.find(c => c.patientId === p.patientId);
    if (existing) { selectCase(existing); return; }
    setCurrent(prev => ({ ...prev, patientId: p.patientId, name: p.name, age: p.age, gender: p.gender, mobile: p.mobile || prev.mobile, occupation: p.occupation, visits: [] }));
    setMatchingPatients([]);
    notify(`Profile loaded — ${p.name}`);
  };

  // ── Update permanent registry profile ─────────────────────────────────────
  const updateRegistry = async () => {
    const clean = (current.mobile || "").replace(/\D/g, "");
    if (clean.length !== 10) { notify("Valid 10-digit mobile required."); return; }
    if (!current.name?.trim()) { notify("Patient name required."); return; }
    let pid = current.patientId;
    if (!pid) { pid = await genId(); setCurrent(p => ({ ...p, patientId: pid })); }
    await putItem("registry", { patientId: pid, name: current.name, age: current.age, gender: current.gender, mobile: clean, occupation: current.occupation, updatedAt: new Date().toISOString() });
    notify("Registry profile updated ✓");
  };

  // ── Delete ────────────────────────────────────────────────────────────────
  const deleteCase = async (id, e) => {
    e.stopPropagation();
    if (!window.confirm("Delete this patient record permanently?")) return;
    await deleteItem("cases", id);
    setSavedCases(prev => prev.filter(c => c.patientId !== id));
    if (current.patientId === id) setCurrent({ ...DEFAULT_STATE });
    notify("Record deleted.");
  };

  // ── Start new / family ────────────────────────────────────────────────────
  const startNew = () => { setCurrent({ ...DEFAULT_STATE }); setView("clinical"); setActiveTab("profile"); setMatchingPatients([]); notify("Workspace cleared."); };
  const startFamilyMember = () => { const m = current.mobile; setCurrent({ ...DEFAULT_STATE, mobile: m }); setMatchingPatients([]); notify("New profile — same mobile number."); };

  // ── Copy past visit ───────────────────────────────────────────────────────
  const copyVisit = (v) => {
    setCurrent(p => ({ ...p, complaints: JSON.parse(JSON.stringify(v.complaints || [])), kshudha: v.kshudha, mutra: v.mutra, mala: v.mala, koshtha: v.koshtha, nidra: v.nidra, avastha: v.avastha, prakriti: v.prakriti, vikriti: v.vikriti, dosha: JSON.parse(JSON.stringify(v.dosha || {})), dushya: JSON.parse(JSON.stringify(v.dushya || {})), srotas: JSON.parse(JSON.stringify(v.srotas || {})), agni: v.agni, samprapti: v.samprapti, sampraptiCustom: v.sampraptiCustom, diet: v.diet, appetite: v.appetite, sleep: v.sleep, activity: v.activity, divaswap: v.divaswap, waterIntake: v.waterIntake, viruddhaAhara: v.viruddhaAhara, junkFood: v.junkFood, medicines: JSON.parse(JSON.stringify(v.medicines || [])), panchakarma: v.panchakarma, labTests: JSON.parse(JSON.stringify(v.labTests || [])) }));
    notify(`Prescription from ${fmtDate(v.visitDate)} copied.`);
  };

  // ── Export / Import ───────────────────────────────────────────────────────
  const handleExport = async () => {
    const cases = await getAllItems("cases");
    const registry = await getAllItems("registry");
    const queue = await getAllItems("queue");
    const blob = new Blob([JSON.stringify({ version:2, exportedAt: new Date().toISOString(), cases, registry, queue }, null, 2)], { type:"application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url; a.download = `ayurkaya_backup_${new Date().toISOString().split("T")[0]}.json`; a.click();
    URL.revokeObjectURL(url);
    notify("Backup exported ✓");
  };
  const handleImport = async (e) => {
    const file = e.target.files?.[0]; if (!file) return;
    const reader = new FileReader();
    reader.onload = async (ev) => {
      try {
        const data = JSON.parse(ev.target.result);
        if (!data.version || !Array.isArray(data.cases)) { alert("Invalid backup file."); return; }
        await clearStore("cases"); await clearStore("registry"); await clearStore("queue");
        for (const c of data.cases) await putItem("cases", c);
        if (Array.isArray(data.registry)) for (const r of data.registry) await putItem("registry", r);
        if (Array.isArray(data.queue)) for (const q of data.queue) await putItem("queue", q);
        const cases = await getAllItems("cases");
        cases.sort((a, b) => new Date(b.visitDate || 0) - new Date(a.visitDate || 0));
        setSavedCases(cases);
        notify("Database restored ✓");
        e.target.value = null;
      } catch { alert("Failed to parse backup file."); }
    };
    reader.readAsText(file);
  };
  const handleReset = async () => {
    const code = prompt("Enter passcode (1008) to reset database:");
    if (code !== "1008") { if (code !== null) alert("Wrong passcode."); return; }
    if (!window.confirm("WARNING: Delete ALL records permanently?")) return;
    await clearStore("cases"); await clearStore("registry"); await clearStore("queue");
    setSavedCases([]); setLiveQueue([]); setCurrent({ ...DEFAULT_STATE });
    notify("Database cleared.");
  };

  // ── Analytics ─────────────────────────────────────────────────────────────
  const getAnalytics = () => {
    const gc = { Male:0, Female:0, Other:0 };
    const pc = {}; const cc = {};
    savedCases.forEach(c => {
      gc[c.gender] = (gc[c.gender] || 0) + 1;
      const p = c.prakriti || "Vata-Pitta"; pc[p] = (pc[p] || 0) + 1;
      (c.complaints || []).forEach(x => { if (x.text?.trim()) { const t = x.text.trim().toLowerCase(); cc[t] = (cc[t] || 0) + 1; } });
    });
    const uniqueMobiles = new Set(savedCases.map(c => c.mobile).filter(Boolean));
    return { total: savedCases.length, patients: uniqueMobiles.size, gc, pc, topComplaints: Object.entries(cc).sort((a,b)=>b[1]-a[1]).slice(0,6) };
  };

  const getAlerts = () => {
    const alerts = []; const followups = []; const now = new Date();
    savedCases.forEach(c => {
      (c.labTests || []).forEach(t => {
        const v = parseFloat(t.value);
        if (isNaN(v)) return;
        if (t.testName.includes("HbA1c") && v > 5.6) alerts.push({ name: c.name, param: t.testName, val: `${v}%`, sev: v >= 6.5 ? "Critical":"Warning" });
        if (t.testName.includes("Total Cholesterol") && v > 200) alerts.push({ name: c.name, param: t.testName, val: `${v} mg/dL`, sev: v >= 240 ? "Critical":"Warning" });
        if (t.testName.includes("Fasting Blood Sugar") && v > 100) alerts.push({ name: c.name, param: t.testName, val: `${v} mg/dL`, sev: v >= 126 ? "Critical":"Warning" });
        if (t.testName.includes("Serum Creatinine") && v > 1.2) alerts.push({ name: c.name, param: t.testName, val: `${v} mg/dL`, sev: v >= 1.5 ? "Critical":"Warning" });
      });
      if (c.visitDate) {
        const diff = Math.floor((now - new Date(c.visitDate)) / 86400000);
        const score = parseInt(c.outcomeScore || "3");
        if ((diff >= 21 || score <= 2) && !followups.some(f => f.mobile === c.mobile)) {
          followups.push({ name: c.name, mobile: c.mobile, daysAgo: diff, score, complaint: c.complaints?.[0]?.text || "General" });
        }
      }
    });
    return { alerts, followups };
  };

  // ── Tabs ──────────────────────────────────────────────────────────────────
  const TABS = [
    { id:"profile",    icon:User,          label:"Profile"      },
    { id:"complaints", icon:ClipboardList, label:"Complaints"   },
    { id:"core",       icon:Activity,      label:"Ayur Core"    },
    { id:"diagnosis",  icon:Stethoscope,   label:"Diagnosis"    },
    { id:"lifestyle",  icon:TrendingUp,    label:"Lifestyle"    },
    { id:"treatment",  icon:Pill,          label:"Prescription" },
    { id:"labs",       icon:FlaskConical,  label:"Labs & F/U"   },
  ];
  const tabIdx = TABS.findIndex(t => t.id === activeTab);
  const prevTab = tabIdx > 0 ? TABS[tabIdx - 1].id : null;
  const nextTab = tabIdx < TABS.length - 1 ? TABS[tabIdx + 1].id : null;

  // Filtered sidebar list — search by NAME or PATIENT ID only (not mobile)
  const filtered = savedCases.filter(c =>
    (c.name || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
    (c.patientId || "").toLowerCase().includes(searchTerm.toLowerCase())
  );

  // ── Alerts / analytics computed ───────────────────────────────────────────
  const { alerts, followups } = getAlerts();
  const analytics = getAnalytics();

  // ── Auth guard ────────────────────────────────────────────────────────────
  if (!isAuth) return (
    <div className="hmis-root flex items-center justify-center">
      <div className="w-8 h-8 border-2 border-transparent rounded-full animate-spin" style={{ borderTopColor:"#10b981" }} />
    </div>
  );

  // ─────────────────────────────────────────────────────────────────────────
  // PRINT VIEW
  // ─────────────────────────────────────────────────────────────────────────
  if (isPrint) return (
    <div className="bg-white text-gray-900 min-h-screen p-8 max-w-3xl mx-auto font-sans print:p-4 space-y-6">
      <SEO title={`Rx – ${current.name}`} description="Ayurkaya Prescription" />
      <div className="flex justify-between items-center print:hidden pb-4 border-b border-gray-200">
        <button onClick={() => setIsPrint(false)} className="text-sm font-bold text-emerald-700 hover:text-emerald-900">← Back to HMIS</button>
        <button onClick={() => window.print()} className="px-5 py-2 rounded-lg bg-emerald-700 text-white text-sm font-bold hover:bg-emerald-800">Print / PDF</button>
      </div>
      <div className="border-2 border-emerald-900 rounded-xl p-6 space-y-5">
        <div className="flex justify-between items-start border-b border-gray-200 pb-4">
          <div>
            <h1 className="text-2xl font-black text-emerald-900 tracking-tight">AYURKAYA</h1>
            <p className="text-xs text-gray-500 font-semibold uppercase tracking-wider">Ayurvedic Integrative Wellness Center</p>
            <p className="text-xs text-gray-500 mt-0.5">108 Lotus Pavilion Rd, Bangalore • +91 80 2345 6789</p>
          </div>
          <div className="text-right">
            <p className="font-bold text-emerald-900">Dr. Neha, B.A.M.S</p>
            <p className="text-xs text-gray-500">Chief Consultant Physician</p>
            <p className="text-xs text-gray-400">Reg No: AYUSH-A-2014-9023</p>
          </div>
        </div>
        <div className="grid grid-cols-4 gap-3 bg-emerald-50 rounded-lg p-3 text-xs">
          {[["Patient ID", current.patientId || "N/A"], ["Name", current.name], ["Age / Gender", `${current.age} Yrs / ${current.gender}`], ["Date", fmtDate(current.visitDate || new Date().toISOString())]].map(([l, v]) => (
            <div key={l}><p className="text-gray-400 font-semibold uppercase text-[10px]">{l}</p><p className="font-bold text-gray-900 mt-0.5">{v}</p></div>
          ))}
        </div>
        <div>
          <h4 className="font-bold text-emerald-900 border-b border-gray-200 pb-1 mb-2 text-sm uppercase tracking-wider">Chief Complaints</h4>
          <ul className="list-disc pl-4 text-sm text-gray-700 space-y-0.5">
            {current.complaints.filter(c => c.text).map((c, i) => (
              <li key={i}><strong>{c.text}</strong>{c.onsetDate ? ` — since ${getDurationString(c.onsetDate)}` : ""}</li>
            ))}
          </ul>
        </div>
        <div className="grid grid-cols-2 gap-4 text-xs">
          <div className="border rounded-lg p-3">
            <h5 className="font-bold text-emerald-900 text-[10px] uppercase tracking-wider border-b pb-1 mb-2">Ayurvedic Diagnosis</h5>
            <div className="space-y-1 text-gray-700">
              <p>Prakriti: <strong>{current.prakriti}</strong></p>
              <p>Vikriti: <strong>{current.vikriti}</strong></p>
              <p>Agni: <strong>{current.agni}</strong></p>
              <p>Koshtha: <strong>{current.koshtha}</strong></p>
            </div>
          </div>
          <div className="border rounded-lg p-3">
            <h5 className="font-bold text-emerald-900 text-[10px] uppercase tracking-wider border-b pb-1 mb-2">Medical History</h5>
            <div className="space-y-1 text-gray-700">
              <p>Past: <strong>{Object.entries(current.pastHistory).filter(([k,v])=>v&&k!=="others").map(([k])=>k.toUpperCase()).join(", ")||"None"}</strong></p>
              <p>Family: <strong>{Object.entries(current.familyHistory).filter(([k,v])=>v&&k!=="others").map(([k])=>k.toUpperCase()).join(", ")||"None"}</strong></p>
            </div>
          </div>
        </div>
        <div>
          <h4 className="font-bold text-emerald-900 border-b border-gray-200 pb-1 mb-2 text-sm uppercase tracking-wider">💊 Prescription (Rx)</h4>
          <table className="w-full text-xs border-collapse">
            <thead><tr className="bg-emerald-50 text-emerald-900 font-bold"><th className="p-2 text-left">Medicine</th><th className="p-2">Dose</th><th className="p-2">Kala</th><th className="p-2">Anupana</th></tr></thead>
            <tbody className="divide-y divide-gray-100">
              {current.medicines.filter(m => m.name).map((m, i) => (
                <tr key={i}><td className="p-2 font-semibold text-emerald-900">{m.name}</td><td className="p-2 text-center">{m.dose}</td><td className="p-2 text-center">{m.kala}</td><td className="p-2 text-center italic">{m.anupana}</td></tr>
              ))}
            </tbody>
          </table>
        </div>
        {current.labTests.length > 0 && (
          <div>
            <h4 className="font-bold text-emerald-900 border-b border-gray-200 pb-1 mb-2 text-sm uppercase tracking-wider">🔬 Lab Results</h4>
            <table className="w-full text-xs border-collapse">
              <thead><tr className="bg-gray-50 font-bold text-gray-700"><th className="p-2 text-left">Test</th><th className="p-2">Result</th><th className="p-2">Range</th><th className="p-2">Unit</th></tr></thead>
              <tbody className="divide-y divide-gray-100">
                {current.labTests.filter(t => t.testName).map((t, i) => <tr key={i}><td className="p-2">{t.testName}</td><td className="p-2 text-center font-bold">{t.value || "—"}</td><td className="p-2 text-center text-gray-500">{t.range}</td><td className="p-2 text-center text-gray-500">{t.unit}</td></tr>)}
              </tbody>
            </table>
          </div>
        )}
        {current.notes && <div className="bg-gray-50 border rounded-lg p-3 text-xs"><p className="font-bold text-gray-700 mb-1">Dietary Advice / Notes:</p><p className="italic text-gray-600">"{current.notes}"</p></div>}
        {current.panchakarma && current.panchakarma !== "None" && <div className="text-xs"><p><strong>Panchakarma Advised:</strong> {current.panchakarma}</p></div>}
        <div className="pt-8 flex justify-between text-xs text-gray-500 border-t border-gray-200">
          <p>Ayurkaya HMIS · Electronic Record</p>
          <div className="text-center w-40"><div className="border-t border-gray-400 mb-1" /><p className="font-bold text-gray-900">Dr. Neha</p><p className="text-[10px] uppercase tracking-wider">Consultant</p></div>
        </div>
      </div>
    </div>
  );

  // ─────────────────────────────────────────────────────────────────────────
  // MAIN HMIS RENDER
  // ─────────────────────────────────────────────────────────────────────────
  const S = {
    root: { display:"flex", height:"100vh", overflow:"hidden", background:"#0b0e18", color:"#e2e8f0", fontFamily:"Inter, sans-serif", position:"fixed", inset:0 },
    sidebar: { width:260, minWidth:260, background:"#111827", borderRight:"1px solid #2a3a55", display:"flex", flexDirection:"column", overflow:"hidden" },
    sidebarNarrow: { width:62, minWidth:62 },
    topbar: { background:"#111827", borderBottom:"1px solid #2a3a55", padding:"0 20px", display:"flex", alignItems:"center", justifyContent:"space-between", height:60, shrink:0, flexShrink:0 },
    content: { flex:1, display:"flex", flexDirection:"column", overflow:"hidden" },
    scrollArea: { flex:1, overflowY:"auto", padding:"28px 32px" },
    card: { background:"#1a2236", border:"1px solid #2a3a55", borderRadius:16, padding:"20px 24px", marginBottom:16 },
    input: { background:"#111827", border:"1px solid #2a3a55", borderRadius:10, padding:"10px 14px", fontSize:13, color:"#e2e8f0", width:"100%", outline:"none", fontFamily:"Inter, sans-serif" },
    label: { display:"block", fontSize:10, fontWeight:700, letterSpacing:"0.08em", textTransform:"uppercase", color:"#64748b", marginBottom:6 },
    select: { background:"#111827", border:"1px solid #2a3a55", borderRadius:10, padding:"10px 14px", fontSize:13, color:"#e2e8f0", width:"100%", outline:"none", fontFamily:"Inter, sans-serif" },
  };

  return (
    <div style={S.root} className="hmis-root">
      <SEO title="HMIS Portal — Ayurkaya" description="Ayurkaya clinical data management system." />

      {/* ── SIDEBAR ── */}
      {sidebarOpen && (
        <div style={S.sidebar}>
          {/* Logo */}
          <div style={{ padding:"18px 16px", borderBottom:"1px solid #2a3a55", flexShrink:0 }}>
            <div style={{ display:"flex", alignItems:"center", gap:10 }}>
              <div style={{ width:34, height:34, borderRadius:10, background:"linear-gradient(135deg,#10b981,#059669)", display:"flex", alignItems:"center", justifyContent:"center", flexShrink:0 }}>
                <Stethoscope size={18} color="#fff" />
              </div>
              <div>
                <p style={{ fontSize:13, fontWeight:800, color:"#e2e8f0", letterSpacing:"0.02em" }}>AYURKAYA</p>
                <p style={{ fontSize:9, fontWeight:600, color:"#64748b", letterSpacing:"0.1em", textTransform:"uppercase" }}>HMIS Portal</p>
              </div>
            </div>
          </div>

          {/* Navigation */}
          <div style={{ padding:"12px 10px", borderBottom:"1px solid #2a3a55", flexShrink:0, display:"flex", flexDirection:"column", gap:4 }}>
            {[
              { id:"clinical",   icon:User,      label:"Workspace",   badge: null },
              { id:"analytics",  icon:BarChart3,  label:"Analytics",   badge: analytics.total > 0 ? analytics.total : null },
              { id:"alerts",     icon:Bell,       label:"Alerts Hub",  badge: (alerts.length + followups.length) || null },
              { id:"utilities",  icon:Database,   label:"DB Tools",    badge: null },
            ].map(n => (
              <button key={n.id} onClick={() => setView(n.id)}
                style={{ display:"flex", alignItems:"center", gap:10, padding:"9px 12px", borderRadius:10, border:"none", cursor:"pointer", background: view === n.id ? "rgba(16,185,129,0.12)" : "transparent", color: view === n.id ? "#10b981" : "#64748b", fontSize:12, fontWeight:600, letterSpacing:"0.03em", width:"100%", transition:"all 0.2s" }}>
                <n.icon size={15} />
                <span style={{ flex:1, textAlign:"left" }}>{n.label}</span>
                {n.badge && (
                  <span style={{ padding:"1px 7px", borderRadius:99, fontSize:9, fontWeight:800, background: n.id === "alerts" ? "rgba(244,63,94,0.2)" : "rgba(16,185,129,0.15)", color: n.id === "alerts" ? "#f43f5e" : "#10b981" }}>
                    {n.badge}
                  </span>
                )}
              </button>
            ))}
          </div>

          {/* Patient List (clinical mode only) */}
          {view === "clinical" && (
            <div style={{ flex:1, display:"flex", flexDirection:"column", overflow:"hidden" }}>
              <div style={{ padding:"12px 14px", borderBottom:"1px solid #2a3a55", flexShrink:0 }}>
                <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:8 }}>
                  <span style={{ fontSize:9, fontWeight:800, letterSpacing:"0.1em", color:"#64748b", textTransform:"uppercase" }}>Patient Records</span>
                  <button onClick={startNew} title="New Patient"
                    style={{ width:26, height:26, borderRadius:8, background:"rgba(16,185,129,0.15)", border:"none", color:"#10b981", cursor:"pointer", display:"flex", alignItems:"center", justifyContent:"center" }}>
                    <Plus size={14} />
                  </button>
                </div>
                <div style={{ position:"relative" }}>
                  <Search size={12} style={{ position:"absolute", left:10, top:"50%", transform:"translateY(-50%)", color:"#64748b", pointerEvents:"none" }} />
                  <input value={searchTerm} onChange={e => setSearchTerm(e.target.value)}
                    placeholder="Search name or ID…"
                    style={{ ...S.input, paddingLeft:30, fontSize:12, height:34 }} />
                </div>
              </div>
              <div style={{ flex:1, overflowY:"auto" }}>
                {filtered.length === 0 ? (
                  <div style={{ padding:"24px 14px", textAlign:"center", color:"#64748b", fontSize:11 }}>
                    {searchTerm ? "No matches found." : "No records saved yet."}
                  </div>
                ) : filtered.map(c => (
                  <button key={c.patientId} onClick={() => selectCase(c)}
                    style={{ width:"100%", display:"flex", justifyContent:"space-between", alignItems:"center", padding:"10px 14px", background: current.patientId === c.patientId ? "rgba(16,185,129,0.08)" : "transparent", borderLeft: current.patientId === c.patientId ? "3px solid #10b981" : "3px solid transparent", border:"none", cursor:"pointer", textAlign:"left", transition:"all 0.15s" }}>
                    <div style={{ flex:1, minWidth:0 }}>
                      <p style={{ fontSize:13, fontWeight:700, color: current.patientId === c.patientId ? "#10b981" : "#e2e8f0", marginBottom:2, overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>{c.name}</p>
                      <p style={{ fontSize:9, color:"#64748b", fontWeight:600, fontFamily:"monospace" }}>{c.patientId}</p>
                      <p style={{ fontSize:10, color:"#64748b" }}>{c.age}y · {c.gender}</p>
                    </div>
                    <button onClick={(e) => deleteCase(c.patientId, e)}
                      style={{ padding:4, background:"none", border:"none", color:"#334155", cursor:"pointer", borderRadius:6, flexShrink:0 }}
                      onMouseEnter={e => e.currentTarget.style.color="#f43f5e"}
                      onMouseLeave={e => e.currentTarget.style.color="#334155"}>
                      <Trash2 size={12} />
                    </button>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Footer */}
          <div style={{ padding:"12px 14px", borderTop:"1px solid #2a3a55", flexShrink:0, display:"flex", justifyContent:"space-between", alignItems:"center" }}>
            <div style={{ display:"flex", alignItems:"center", gap:8 }}>
              <div style={{ width:8, height:8, borderRadius:"50%", background:"#10b981", animation:"pulse 2s infinite" }} />
              <span style={{ fontSize:11, color:"#64748b", fontWeight:600 }}>Dr. Neha</span>
            </div>
            <button onClick={() => { localStorage.removeItem("ayurkaya_doctor_logged_in"); navigate("/login"); }}
              style={{ display:"flex", alignItems:"center", gap:5, fontSize:11, color:"#64748b", background:"none", border:"none", cursor:"pointer", fontWeight:600 }}
              onMouseEnter={e => e.currentTarget.style.color="#f43f5e"}
              onMouseLeave={e => e.currentTarget.style.color="#64748b"}>
              <LogOut size={13} /> Logout
            </button>
          </div>
        </div>
      )}

      {/* ── MAIN CONTENT ── */}
      <div style={S.content}>

        {/* Top Bar */}
        <div style={S.topbar}>
          <div style={{ display:"flex", alignItems:"center", gap:12 }}>
            <button onClick={() => setSidebarOpen(p => !p)}
              style={{ background:"#1a2236", border:"1px solid #2a3a55", borderRadius:10, padding:"7px", cursor:"pointer", color:"#64748b", display:"flex", alignItems:"center" }}>
              <Menu size={16} />
            </button>
            <div>
              {view === "clinical" && (
                <p style={{ fontSize:15, fontWeight:800, color:"#e2e8f0" }}>
                  {current.name ? <>Clinical Record — <span style={{ color:"#10b981" }}>{current.name}</span></> : "New Consultation"}
                </p>
              )}
              {view === "analytics" && <p style={{ fontSize:15, fontWeight:800, color:"#e2e8f0" }}>Clinical Analytics</p>}
              {view === "alerts" && <p style={{ fontSize:15, fontWeight:800, color:"#e2e8f0" }}>Alerts & Follow-ups Hub</p>}
              {view === "utilities" && <p style={{ fontSize:15, fontWeight:800, color:"#e2e8f0" }}>Database Management Tools</p>}
              {view === "clinical" && current.patientId && (
                <p style={{ fontSize:11, color:"#64748b", fontWeight:600 }}>
                  {current.patientId} · {current.age}y · {current.gender} {current.mobile ? `· ${current.mobile}` : ""}
                </p>
              )}
            </div>
          </div>

          <div style={{ display:"flex", alignItems:"center", gap:8 }}>
            {toast && (
              <div style={{ background:"rgba(16,185,129,0.12)", border:"1px solid rgba(16,185,129,0.3)", borderRadius:8, padding:"6px 12px", fontSize:11, color:"#10b981", fontWeight:600 }}>
                {toast}
              </div>
            )}
            {view === "clinical" && (
              <>
                {current.patientId && (
                  <>
                    <button onClick={() => setHistoryOpen(true)}
                      style={{ display:"flex", alignItems:"center", gap:6, background:"#1a2236", border:"1px solid #2a3a55", borderRadius:10, padding:"7px 14px", fontSize:11, fontWeight:700, color:"#94a3b8", cursor:"pointer", letterSpacing:"0.04em", textTransform:"uppercase" }}>
                      <History size={13} /> History
                    </button>
                    <button onClick={recordFollowUp}
                      style={{ display:"flex", alignItems:"center", gap:6, background:"rgba(245,158,11,0.12)", border:"1px solid rgba(245,158,11,0.3)", borderRadius:10, padding:"7px 14px", fontSize:11, fontWeight:700, color:"#f59e0b", cursor:"pointer", letterSpacing:"0.04em", textTransform:"uppercase" }}>
                      <Plus size={13} /> New Visit
                    </button>
                  </>
                )}
                <button onClick={saveCase}
                  style={{ display:"flex", alignItems:"center", gap:6, background:"#10b981", borderRadius:10, padding:"8px 16px", fontSize:11, fontWeight:800, color:"#0b0e18", cursor:"pointer", border:"none", letterSpacing:"0.04em", textTransform:"uppercase" }}>
                  <Save size={13} /> Save Record
                </button>
                <button onClick={() => { if (!current.name?.trim()) { notify("Save patient first."); return; } setIsPrint(true); }}
                  style={{ display:"flex", alignItems:"center", gap:6, background:"#1a2236", border:"1px solid #2a3a55", borderRadius:10, padding:"7px 14px", fontSize:11, fontWeight:700, color:"#94a3b8", cursor:"pointer", letterSpacing:"0.04em", textTransform:"uppercase" }}>
                  <Printer size={13} /> Print Rx
                </button>
              </>
            )}
          </div>
        </div>

        {/* Tab Bar (clinical only) */}
        {view === "clinical" && (
          <div style={{ background:"#111827", borderBottom:"1px solid #2a3a55", display:"flex", overflowX:"auto", flexShrink:0, scrollbarWidth:"none" }}>
            {TABS.map((t, i) => (
              <button key={t.id} onClick={() => setActiveTab(t.id)}
                style={{ display:"flex", alignItems:"center", gap:7, padding:"13px 20px", fontSize:11, fontWeight:700, letterSpacing:"0.05em", textTransform:"uppercase", cursor:"pointer", background:"none", border:"none", borderBottom: activeTab === t.id ? "2px solid #10b981" : "2px solid transparent", color: activeTab === t.id ? "#10b981" : "#64748b", whiteSpace:"nowrap", transition:"all 0.2s" }}>
                <t.icon size={13} />
                {t.label}
              </button>
            ))}
          </div>
        )}

        {/* ── SCROLLABLE CONTENT ── */}
        <div style={S.scrollArea}>

          {/* ══════════ CLINICAL WORKSPACE ══════════ */}
          {view === "clinical" && (
            <div style={{ maxWidth:860, margin:"0 auto" }} className="animate-fade-up">

              {/* ── TAB: PROFILE ── */}
              {activeTab === "profile" && (
                <div>
                  {/* Demographics */}
                  <div style={S.card}>
                    <SectionHead num="1" title="Patient Demographics" action={
                      <button onClick={updateRegistry}
                        style={{ display:"flex", alignItems:"center", gap:6, background:"rgba(16,185,129,0.1)", border:"1px solid rgba(16,185,129,0.25)", borderRadius:9, padding:"6px 12px", fontSize:11, fontWeight:700, color:"#10b981", cursor:"pointer", textTransform:"uppercase", letterSpacing:"0.04em" }}>
                        <Save size={12} /> Update Registry
                      </button>
                    } />
                    <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:16 }}>
                      <div>
                        <label style={S.label}>Patient ID (Primary Key)</label>
                        <div style={{ ...S.input, color:"#10b981", fontFamily:"monospace", fontWeight:700, background:"rgba(16,185,129,0.05)", border:"1px solid rgba(16,185,129,0.2)" }}>
                          {current.patientId || "Auto-generated on save"}
                        </div>
                      </div>
                      <div>
                        <label style={S.label}>Full Name *</label>
                        <input style={S.input} value={current.name} onChange={e => set("name", e.target.value)} placeholder="e.g. Aditi Rao" />
                      </div>
                      <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:12 }}>
                        <div>
                          <label style={S.label}>Age (Years)</label>
                          <input type="number" style={S.input} value={current.age} onChange={e => set("age", e.target.value)} placeholder="e.g. 29" />
                        </div>
                        <div>
                          <label style={S.label}>Gender</label>
                          <select style={S.select} value={current.gender} onChange={e => set("gender", e.target.value)}>
                            <option>Male</option><option>Female</option><option>Other</option>
                          </select>
                        </div>
                      </div>
                      <div style={{ position:"relative" }}>
                        <label style={S.label}>Mobile — <span style={{ color:"#10b981", textTransform:"none", fontWeight:500, fontSize:9 }}>type to search registry, click to load</span></label>
                        <input type="tel" style={S.input} value={current.mobile} onChange={e => set("mobile", e.target.value)} placeholder="e.g. 9876543210" />
                        {matchingPatients.length > 0 && (
                          <div style={{ position:"absolute", zIndex:50, left:0, right:0, top:"calc(100% + 6px)", background:"#1a2236", border:"1px solid #2a3a55", borderRadius:12, padding:10, boxShadow:"0 20px 60px rgba(0,0,0,0.5)" }} className="animate-fade-in">
                            <p style={{ fontSize:9, fontWeight:800, color:"#64748b", textTransform:"uppercase", letterSpacing:"0.1em", marginBottom:6 }}>👇 Click to load patient record:</p>
                            {matchingPatients.map(p => (
                              <button key={p.patientId} onClick={() => loadFromRegistry(p)}
                                style={{ width:"100%", display:"flex", justifyContent:"space-between", alignItems:"center", padding:"8px 10px", borderRadius:8, background:"transparent", border:"none", cursor:"pointer", textAlign:"left", color:"#e2e8f0", fontSize:12 }}
                                onMouseEnter={e => e.currentTarget.style.background="#2a3a55"}
                                onMouseLeave={e => e.currentTarget.style.background="transparent"}>
                                <span><strong>{p.name}</strong> — {p.age}y, {p.gender}</span>
                                <span style={{ fontFamily:"monospace", fontSize:10, color:"#64748b" }}>{p.patientId}</span>
                              </button>
                            ))}
                            <div style={{ borderTop:"1px solid #2a3a55", marginTop:6, paddingTop:6 }}>
                              <button onClick={startFamilyMember}
                                style={{ fontSize:11, color:"#10b981", background:"none", border:"none", cursor:"pointer", fontWeight:700, display:"flex", alignItems:"center", gap:4 }}>
                                <PlusCircle size={12} /> Register new profile (same mobile)
                              </button>
                            </div>
                          </div>
                        )}
                      </div>
                      <div>
                        <label style={S.label}>Occupation</label>
                        <input style={S.input} value={current.occupation} onChange={e => set("occupation", e.target.value)} placeholder="e.g. Software Engineer" />
                      </div>
                    </div>
                  </div>

                  {/* Visit Timeline — ALWAYS shows current active visit + archived */}
                  {current.patientId && (
                    <div style={S.card}>
                      <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:16 }}>
                        <div style={{ display:"flex", alignItems:"center", gap:10 }}>
                          <Calendar size={16} color="#10b981" />
                          <h3 style={{ fontSize:14, fontWeight:800, color:"#e2e8f0" }}>Consultation Timeline</h3>
                          <span style={{ fontSize:10, color:"#64748b", fontWeight:600 }}>({(current.visits?.length || 0) + 1} visit{(current.visits?.length || 0) + 1 > 1 ? "s" : ""})</span>
                        </div>
                        <button onClick={recordFollowUp}
                          style={{ display:"flex", alignItems:"center", gap:6, background:"rgba(245,158,11,0.1)", border:"1px solid rgba(245,158,11,0.3)", borderRadius:9, padding:"6px 12px", fontSize:11, fontWeight:700, color:"#f59e0b", cursor:"pointer", textTransform:"uppercase", letterSpacing:"0.04em" }}>
                          <Plus size={12} /> Archive & Start Follow-up
                        </button>
                      </div>
                      <div style={{ position:"relative", marginLeft:8, paddingLeft:24, borderLeft:"2px solid #2a3a55" }}>

                        {/* Current / Active Visit */}
                        <div style={{ position:"relative", marginBottom:20 }}>
                          <div style={{ position:"absolute", left:-33, top:4, width:16, height:16, borderRadius:"50%", background:"#10b981", border:"3px solid #0b0e18", boxShadow:"0 0 0 3px rgba(16,185,129,0.3)" }} />
                          <div style={{ background:"rgba(16,185,129,0.06)", border:"1px solid rgba(16,185,129,0.2)", borderRadius:12, padding:"14px 16px" }}>
                            <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:10 }}>
                              <div>
                                <span style={{ fontSize:11, fontWeight:800, color:"#10b981", textTransform:"uppercase", letterSpacing:"0.06em" }}>🟢 Active Consultation</span>
                                <p style={{ fontSize:10, color:"#64748b", marginTop:2 }}>{fmtDate(current.visitDate || new Date().toISOString())}</p>
                              </div>
                              <ScoreBadge score={current.outcomeScore} />
                            </div>
                            <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:12, fontSize:12 }}>
                              <div>
                                <p style={{ fontSize:9, fontWeight:700, color:"#64748b", textTransform:"uppercase", letterSpacing:"0.08em", marginBottom:4 }}>Active Complaints</p>
                                {(current.complaints || []).filter(c => c.text).length > 0 ? (
                                  <ul style={{ listStyle:"none", padding:0, margin:0 }}>
                                    {(current.complaints || []).filter(c => c.text).map((c, i) => (
                                      <li key={i} style={{ color:"#94a3b8", marginBottom:2 }}>• {c.text}{c.onsetDate ? <span style={{ color:"#64748b", marginLeft:4 }}>({getDurationString(c.onsetDate)})</span> : ""}</li>
                                    ))}
                                  </ul>
                                ) : <p style={{ color:"#64748b", fontStyle:"italic" }}>No complaints entered</p>}
                              </div>
                              <div>
                                <p style={{ fontSize:9, fontWeight:700, color:"#64748b", textTransform:"uppercase", letterSpacing:"0.08em", marginBottom:4 }}>Current Prescription</p>
                                {(current.medicines || []).filter(m => m.name).length > 0 ? (
                                  <ul style={{ listStyle:"none", padding:0, margin:0 }}>
                                    {(current.medicines || []).filter(m => m.name).slice(0, 3).map((m, i) => (
                                      <li key={i} style={{ color:"#94a3b8", marginBottom:2, whiteSpace:"nowrap", overflow:"hidden", textOverflow:"ellipsis" }}>• {m.name}</li>
                                    ))}
                                    {(current.medicines || []).filter(m => m.name).length > 3 && <li style={{ color:"#64748b", fontSize:10 }}>+{(current.medicines || []).filter(m => m.name).length - 3} more</li>}
                                  </ul>
                                ) : <p style={{ color:"#64748b", fontStyle:"italic" }}>No medicines prescribed</p>}
                              </div>
                            </div>
                          </div>
                        </div>

                        {/* Archived Visits */}
                        {(current.visits || []).map((v, idx) => (
                          <div key={v.visitId || idx} style={{ position:"relative", marginBottom:16 }}>
                            <div style={{ position:"absolute", left:-33, top:4, width:14, height:14, borderRadius:"50%", background:"#1a2236", border:"2px solid #2a3a55" }} />
                            <div style={{ background:"#111827", border:"1px solid #2a3a55", borderRadius:12, padding:"12px 16px" }}>
                              <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:8 }}>
                                <div style={{ display:"flex", alignItems:"center", gap:10 }}>
                                  <span style={{ fontSize:12, fontWeight:700, color:"#e2e8f0" }}>{fmtDate(v.visitDate)}</span>
                                  <span style={{ fontSize:9, color:"#64748b" }}>{new Date(v.visitDate).toLocaleTimeString("en-IN", { hour:"2-digit", minute:"2-digit" })}</span>
                                </div>
                                <div style={{ display:"flex", alignItems:"center", gap:8 }}>
                                  <ScoreBadge score={v.outcomeScore} />
                                  <button onClick={() => copyVisit(v)}
                                    style={{ display:"flex", alignItems:"center", gap:4, fontSize:10, fontWeight:700, color:"#64748b", background:"#1a2236", border:"1px solid #2a3a55", borderRadius:7, padding:"3px 8px", cursor:"pointer", textTransform:"uppercase", letterSpacing:"0.04em" }}>
                                    <RefreshCw size={9} /> Copy Rx
                                  </button>
                                </div>
                              </div>
                              <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:10, fontSize:11 }}>
                                <div>
                                  <p style={{ fontSize:9, fontWeight:700, color:"#64748b", textTransform:"uppercase", letterSpacing:"0.08em", marginBottom:3 }}>Complaints:</p>
                                  {(v.complaints || []).filter(c => c.text).map((c, i) => {
                                    const prog = v.complaintsProgress?.[c.text.trim()];
                                    return (
                                      <div key={i} style={{ color:"#94a3b8", marginBottom:2, display:"flex", alignItems:"center", gap:6 }}>
                                        <span>• {c.text}</span>
                                        {prog && <ProgressBadge status={prog} />}
                                      </div>
                                    );
                                  })}
                                  {!(v.complaints || []).filter(c => c.text).length && <p style={{ color:"#64748b", fontStyle:"italic" }}>—</p>}
                                  <p style={{ marginTop:5, fontSize:10, color:"#64748b" }}>
                                    {v.prakriti} · {v.vikriti} · {v.agni} Agni
                                  </p>
                                </div>
                                <div>
                                  <p style={{ fontSize:9, fontWeight:700, color:"#64748b", textTransform:"uppercase", letterSpacing:"0.08em", marginBottom:3 }}>Prescribed:</p>
                                  <div style={{ fontFamily:"monospace", fontSize:10, color:"#94a3b8" }}>
                                    {(v.medicines || []).filter(m => m.name).slice(0, 4).map((m, i) => (
                                      <div key={i} style={{ overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap", marginBottom:1 }}>• {m.name} ({m.dose})</div>
                                    ))}
                                    {(v.medicines || []).filter(m => m.name).length === 0 && <span style={{ fontStyle:"italic", color:"#64748b" }}>—</span>}
                                  </div>
                                  {v.notes && <p style={{ marginTop:4, fontSize:10, color:"#64748b", fontStyle:"italic" }}>"{v.notes}"</p>}
                                </div>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* ── TAB: COMPLAINTS ── */}
              {activeTab === "complaints" && (
                <div>
                  {/* Previous Visit Progress Tracker (only if visits exist AND there are pending complaints) */}
                  {(() => {
                    if (!current.visits?.length) return null;
                    const last = current.visits[0];
                    const pending = (last.complaints || []).filter(c => c.text && last.complaintsProgress?.[c.text.trim()] !== "Cured");
                    if (!pending.length) return null;
                    return (
                      <div style={{ ...S.card, borderColor:"rgba(245,158,11,0.3)" }} className="animate-fade-up">
                        <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:14 }}>
                          <div style={{ display:"flex", alignItems:"center", gap:10 }}>
                            <RefreshCw size={15} color="#f59e0b" />
                            <h3 style={{ fontSize:13, fontWeight:800, color:"#e2e8f0" }}>Previous Visit — Complaint Progress</h3>
                          </div>
                          <span style={{ fontSize:10, color:"#64748b", fontWeight:600 }}>Last visit: {fmtDate(last.visitDate)}</span>
                        </div>
                        <p style={{ fontSize:11, color:"#64748b", marginBottom:12 }}>Update the status of each complaint from the last visit. Cured complaints are auto-excluded.</p>
                        <div style={{ display:"flex", flexDirection:"column", gap:8 }}>
                          {pending.map((c, i) => {
                            const key = c.text.trim();
                            const prog = current.complaintsProgress?.[key] || "Stable";
                            return (
                              <div key={i} style={{ display:"flex", justifyContent:"space-between", alignItems:"center", background:"#111827", borderRadius:10, padding:"10px 14px", flexWrap:"wrap", gap:8 }}>
                                <span style={{ fontSize:13, fontWeight:700, color:"#e2e8f0" }}>{c.text}</span>
                                <div style={{ display:"flex", gap:6 }}>
                                  {["Cured","Improved","Stable","Worse"].map(s => {
                                    const active = prog === s;
                                    const colors = { Cured:["rgba(16,185,129,0.15)","#10b981","rgba(16,185,129,0.3)"], Improved:["rgba(129,140,248,0.15)","#818cf8","rgba(129,140,248,0.3)"], Stable:["rgba(245,158,11,0.15)","#f59e0b","rgba(245,158,11,0.3)"], Worse:["rgba(244,63,94,0.15)","#f43f5e","rgba(244,63,94,0.3)"] };
                                    const [bg, text, bdr] = active ? colors[s] : ["transparent","#64748b","#2a3a55"];
                                    return (
                                      <button key={s} onClick={() => {
                                        const up = { ...(current.complaintsProgress || {}), [key]: s };
                                        const newScore = calculateAutoOutcomeScore(up, pending);
                                        setCurrent(p => ({ ...p, complaintsProgress: up, outcomeScore: newScore }));
                                      }} style={{ padding:"5px 12px", borderRadius:8, border:`1px solid ${bdr}`, background:bg, color:text, fontSize:10, fontWeight:800, textTransform:"uppercase", letterSpacing:"0.05em", cursor:"pointer", transition:"all 0.15s" }}>
                                        {s}
                                      </button>
                                    );
                                  })}
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    );
                  })()}

                  {/* Presets */}
                  <div style={S.card}>
                    <p style={S.label}>Quick Add — Common Complaints</p>
                    <div style={{ display:"flex", flexWrap:"wrap", gap:7 }}>
                      {COMPLAINT_PRESETS.map(t => (
                        <button key={t} onClick={() => addComplaintPreset(t)}
                          style={{ padding:"6px 12px", background:"#111827", border:"1px solid #2a3a55", borderRadius:8, fontSize:11, fontWeight:600, color:"#94a3b8", cursor:"pointer", transition:"all 0.15s" }}
                          onMouseEnter={e => { e.currentTarget.style.borderColor="#10b981"; e.currentTarget.style.color="#10b981"; }}
                          onMouseLeave={e => { e.currentTarget.style.borderColor="#2a3a55"; e.currentTarget.style.color="#94a3b8"; }}>
                          + {t}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Chief Complaints */}
                  <div style={S.card}>
                    <SectionHead num="2" title="Chief Complaints" action={
                      <button onClick={addComplaint} style={{ display:"flex", alignItems:"center", gap:5, background:"rgba(16,185,129,0.1)", border:"1px solid rgba(16,185,129,0.25)", borderRadius:8, padding:"6px 12px", fontSize:11, fontWeight:700, color:"#10b981", cursor:"pointer" }}>
                        <Plus size={13} /> Add
                      </button>
                    } />
                    <div style={{ display:"flex", flexDirection:"column", gap:10 }}>
                      {current.complaints.map((c, i) => (
                        <div key={i} style={{ display:"flex", gap:12, alignItems:"flex-start", background:"#111827", borderRadius:10, padding:"12px 14px", border:"1px solid #2a3a55" }}>
                          <div style={{ flex:1 }}>
                            <label style={S.label}>Complaint / Symptom</label>
                            <input style={S.input} value={c.text} onChange={e => updateComplaint(i, "text", e.target.value)} placeholder="e.g. Chronic bloating after meals" />
                          </div>
                          <div style={{ width:170 }}>
                            <label style={S.label}>Onset Date</label>
                            <input type="date" style={S.input} value={c.onsetDate || ""} onChange={e => updateComplaint(i, "onsetDate", e.target.value)} />
                            {c.onsetDate && <p style={{ fontSize:10, color:"#10b981", marginTop:4, fontWeight:600 }}>Duration: {getDurationString(c.onsetDate)}</p>}
                          </div>
                          <button onClick={() => removeComplaint(i)} disabled={current.complaints.length === 1}
                            style={{ marginTop:20, padding:6, background:"none", border:"none", color:"#334155", cursor:"pointer", borderRadius:6 }}
                            onMouseEnter={e => e.currentTarget.style.color="#f43f5e"}
                            onMouseLeave={e => e.currentTarget.style.color="#334155"}>
                            <Trash2 size={15} />
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Past & Family History */}
                  <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:16 }}>
                    <div style={S.card}>
                      <h4 style={{ fontSize:13, fontWeight:800, color:"#e2e8f0", marginBottom:14 }}>Past History</h4>
                      <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:8 }}>
                        {["diabetes","htn","thyroid","asthma","obesity","gut"].map(k => (
                          <label key={k} style={{ display:"flex", alignItems:"center", gap:8, fontSize:11, fontWeight:700, color:"#94a3b8", cursor:"pointer", textTransform:"uppercase" }}>
                            <input type="checkbox" className="hm-checkbox" checked={current.pastHistory[k] || false} onChange={e => setGroup("pastHistory", k, e.target.checked)} />
                            {k === "htn" ? "Hypertension" : k === "gut" ? "Gut Issues" : k}
                          </label>
                        ))}
                      </div>
                      <div style={{ marginTop:10 }}>
                        <label style={S.label}>Other Past History</label>
                        <input style={S.input} value={current.pastHistory.others || ""} onChange={e => setGroup("pastHistory","others",e.target.value)} placeholder="e.g. Migraine, Appendectomy" />
                      </div>
                    </div>
                    <div style={S.card}>
                      <h4 style={{ fontSize:13, fontWeight:800, color:"#e2e8f0", marginBottom:14 }}>Family History</h4>
                      <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:8 }}>
                        {["diabetes","htn","thyroid"].map(k => (
                          <label key={k} style={{ display:"flex", alignItems:"center", gap:8, fontSize:11, fontWeight:700, color:"#94a3b8", cursor:"pointer", textTransform:"uppercase" }}>
                            <input type="checkbox" className="hm-checkbox" checked={current.familyHistory[k] || false} onChange={e => setGroup("familyHistory", k, e.target.checked)} />
                            {k === "htn" ? "Hypertension" : k}
                          </label>
                        ))}
                      </div>
                      <div style={{ marginTop:10 }}>
                        <label style={S.label}>Other Family History</label>
                        <input style={S.input} value={current.familyHistory.others || ""} onChange={e => setGroup("familyHistory","others",e.target.value)} placeholder="e.g. Cardiac history" />
                      </div>
                    </div>
                  </div>

                  {/* Drug History */}
                  <div style={S.card}>
                    <h4 style={{ fontSize:13, fontWeight:800, color:"#e2e8f0", marginBottom:14 }}>Drug History & Addictions</h4>
                    <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr 1fr", gap:14 }}>
                      <div>
                        <label style={S.label}>Previous Drug History?</label>
                        <select style={S.select} value={current.drugHistory.hasHistory} onChange={e => setGroup("drugHistory","hasHistory",e.target.value)}>
                          <option>No</option><option>Yes</option>
                        </select>
                      </div>
                      {current.drugHistory.hasHistory === "Yes" && (
                        <div style={{ gridColumn:"span 2" }}>
                          <label style={S.label}>Details</label>
                          <input style={S.input} value={current.drugHistory.details} onChange={e => setGroup("drugHistory","details",e.target.value)} placeholder="e.g. Metformin 500mg for 2 years" />
                        </div>
                      )}
                      <div>
                        <label style={S.label}>Addiction / Habits</label>
                        <select style={S.select} value={current.addiction} onChange={e => set("addiction",e.target.value)}>
                          {["None","Tobacco","Alcohol","Smoking","Multiple"].map(o => <option key={o}>{o}</option>)}
                        </select>
                      </div>
                      <div>
                        <label style={S.label}>Stress Level</label>
                        <select style={S.select} value={current.stressLevel} onChange={e => set("stressLevel",e.target.value)}>
                          {["Low","Moderate","High","Very High"].map(o => <option key={o}>{o}</option>)}
                        </select>
                      </div>
                      <div>
                        <label style={S.label}>Work Type</label>
                        <select style={S.select} value={current.workType} onChange={e => set("workType",e.target.value)}>
                          {["Sedentary","Mild Active","Mixed","Heavy Physical"].map(o => <option key={o}>{o}</option>)}
                        </select>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* ── TAB: AYUR CORE ── */}
              {activeTab === "core" && (
                <div style={S.card}>
                  <SectionHead num="3" title="Ayurvedic Ashtavidha Pareeksha (Core Vitals)" />
                  <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr 1fr", gap:14 }}>
                    {[
                      ["kshudha","Kshudha (Appetite)",["Sama","Manda","Teekshna","Vishama"]],
                      ["mutra","Mutra (Urine)",["Normal","Excess","Reduced","Burning"]],
                      ["mala","Mala (Bowel)",["Normal","Constipation","Loose","Irregular"]],
                      ["koshtha","Koshtha (Gut Nature)",["Mridu","Madhya","Krura"]],
                      ["nidra","Nidra (Sleep)",["Normal","Excess","Disturbed","Insomnia"]],
                      ["avastha","Avastha (Ama Status)",["Niraama","Saaama"]],
                    ].map(([field, label, opts]) => (
                      <div key={field}>
                        <label style={S.label}>{label}</label>
                        <select style={S.select} value={current[field]} onChange={e => set(field, e.target.value)}>
                          {opts.map(o => <option key={o}>{o}</option>)}
                        </select>
                      </div>
                    ))}
                  </div>
                  <div style={{ marginTop:16 }}>
                    <h4 style={{ fontSize:12, fontWeight:700, color:"#e2e8f0", marginBottom:10 }}>Vega Dharana (Suppressed Urges)</h4>
                    <div style={{ display:"flex", gap:20 }}>
                      {["mutra","mala","nidra"].map(k => (
                        <label key={k} style={{ display:"flex", alignItems:"center", gap:8, fontSize:11, fontWeight:700, color:"#94a3b8", cursor:"pointer", textTransform:"uppercase" }}>
                          <input type="checkbox" className="hm-checkbox" checked={current.vegaDharana[k] || false} onChange={e => setGroup("vegaDharana", k, e.target.checked)} />
                          {k}
                        </label>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* ── TAB: DIAGNOSIS ── */}
              {activeTab === "diagnosis" && (
                <div>
                  <div style={S.card}>
                    <SectionHead num="4" title="Ayurvedic Diagnosis" />
                    <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:14, marginBottom:16 }}>
                      {[
                        ["prakriti","Prakriti (Constitution)",["Vata","Pitta","Kapha","Vata-Pitta","Vata-Kapha","Pitta-Kapha","Tridosha"]],
                        ["vikriti","Vikriti (Current Imbalance)",["Vata","Pitta","Kapha","Vata-Pitta","Vata-Kapha","Pitta-Kapha","Tridosha"]],
                        ["agni","Agni (Digestive Fire)",["Sama","Manda","Teekshna","Vishama"]],
                        ["samprapti","Samprapti (Pathogenesis)",["Agnimandya","Ama formation","Srotodushti","Rasa-Dushya","Other"]],
                      ].map(([field, label, opts]) => (
                        <div key={field}>
                          <label style={S.label}>{label}</label>
                          <select style={S.select} value={current[field]} onChange={e => set(field, e.target.value)}>
                            {opts.map(o => <option key={o}>{o}</option>)}
                          </select>
                        </div>
                      ))}
                    </div>
                  </div>
                  <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr 1fr", gap:16 }}>
                    <div style={S.card}>
                      <h4 style={{ fontSize:12, fontWeight:700, color:"#e2e8f0", marginBottom:10 }}>Dosha Involved</h4>
                      {["vata","pitta","kapha"].map(k => (
                        <label key={k} style={{ display:"flex", alignItems:"center", gap:8, fontSize:12, color:"#94a3b8", cursor:"pointer", textTransform:"capitalize", marginBottom:8 }}>
                          <input type="checkbox" className="hm-checkbox" checked={current.dosha[k] || false} onChange={e => setGroup("dosha",k,e.target.checked)} /> {k}
                        </label>
                      ))}
                    </div>
                    <div style={S.card}>
                      <h4 style={{ fontSize:12, fontWeight:700, color:"#e2e8f0", marginBottom:10 }}>Dushya (Affected Dhatus)</h4>
                      {["rasa","rakta","mamsa","meda","asthi","majja","shukra"].map(k => (
                        <label key={k} style={{ display:"flex", alignItems:"center", gap:8, fontSize:11, color:"#94a3b8", cursor:"pointer", textTransform:"capitalize", marginBottom:6 }}>
                          <input type="checkbox" className="hm-checkbox" checked={current.dushya[k] || false} onChange={e => setGroup("dushya",k,e.target.checked)} /> {k}
                        </label>
                      ))}
                    </div>
                    <div style={S.card}>
                      <h4 style={{ fontSize:12, fontWeight:700, color:"#e2e8f0", marginBottom:10 }}>Srotas (Channels)</h4>
                      {["annavaha","pranavaha","rasavaha","raktavaha","medovaha","mutravaha","purishavaha"].map(k => (
                        <label key={k} style={{ display:"flex", alignItems:"center", gap:8, fontSize:11, color:"#94a3b8", cursor:"pointer", textTransform:"capitalize", marginBottom:6 }}>
                          <input type="checkbox" className="hm-checkbox" checked={current.srotas[k] || false} onChange={e => setGroup("srotas",k,e.target.checked)} /> {k}
                        </label>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* ── TAB: LIFESTYLE ── */}
              {activeTab === "lifestyle" && (
                <div style={S.card}>
                  <SectionHead num="5" title="Lifestyle Assessment" />
                  <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr 1fr", gap:14 }}>
                    {[
                      ["diet","Diet Type",["Mixed","Vegetarian","Vegan","Non-Veg Dominant"]],
                      ["appetite","Appetite",["Normal","Reduced","Excessive","Variable"]],
                      ["sleep","Sleep Quality",["Good","Fair","Poor","Insomnia"]],
                      ["activity","Physical Activity",["Sedentary","Light","Moderate","Active"]],
                      ["divaswap","Divaswap (Day Sleep)",["No","Occasional","Regular"]],
                      ["waterIntake","Water Intake",["Adequate","Low","Excess"]],
                      ["viruddhaAhara","Viruddha Ahara (Incompatible Food)",["No","Occasional","Yes"]],
                      ["junkFood","Junk / Processed Food",["Rare","Occasional","Frequent"]],
                    ].map(([field, label, opts]) => (
                      <div key={field}>
                        <label style={S.label}>{label}</label>
                        <select style={S.select} value={current[field]} onChange={e => set(field, e.target.value)}>
                          {opts.map(o => <option key={o}>{o}</option>)}
                        </select>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* ── TAB: PRESCRIPTION ── */}
              {activeTab === "treatment" && (
                <div>
                  <div style={S.card}>
                    <p style={S.label}>Quick Add — Rx Formulary</p>
                    <div style={{ display:"flex", flexWrap:"wrap", gap:7 }}>
                      {MEDICINE_PRESETS.map(n => (
                        <button key={n} onClick={() => addMedPreset(n)}
                          style={{ padding:"6px 12px", background:"#111827", border:"1px solid #2a3a55", borderRadius:8, fontSize:11, fontWeight:600, color:"#94a3b8", cursor:"pointer" }}
                          onMouseEnter={e => { e.currentTarget.style.borderColor="#10b981"; e.currentTarget.style.color="#10b981"; }}
                          onMouseLeave={e => { e.currentTarget.style.borderColor="#2a3a55"; e.currentTarget.style.color="#94a3b8"; }}>
                          + {n}
                        </button>
                      ))}
                    </div>
                  </div>
                  <div style={S.card}>
                    <SectionHead num="6" title="Advised Prescription (Rx)" action={
                      <button onClick={addMedicine} style={{ display:"flex", alignItems:"center", gap:5, background:"rgba(16,185,129,0.1)", border:"1px solid rgba(16,185,129,0.25)", borderRadius:8, padding:"6px 12px", fontSize:11, fontWeight:700, color:"#10b981", cursor:"pointer" }}>
                        <Plus size={13} /> Add Row
                      </button>
                    } />
                    <div style={{ display:"flex", flexDirection:"column", gap:10 }}>
                      {current.medicines.map((m, i) => (
                        <div key={i} style={{ display:"grid", gridTemplateColumns:"3fr 2fr 2fr 1fr auto", gap:10, alignItems:"flex-start", background:"#111827", borderRadius:10, padding:"12px 14px", border:"1px solid #2a3a55" }}>
                          <div>
                            <label style={S.label}>Medicine Name</label>
                            <input style={S.input} value={m.name} onChange={e => updateMed(i,"name",e.target.value)} placeholder="e.g. Triphala Churna" />
                          </div>
                          <div>
                            <label style={S.label}>Dose / Freq</label>
                            <input style={S.input} value={m.dose} onChange={e => updateMed(i,"dose",e.target.value)} placeholder="e.g. 1 tab BD" />
                          </div>
                          <div>
                            <label style={S.label}>Kala</label>
                            <input style={S.input} value={m.kala} onChange={e => updateMed(i,"kala",e.target.value)} placeholder="After food" />
                          </div>
                          <div>
                            <label style={S.label}>Anupana</label>
                            <input style={S.input} value={m.anupana} onChange={e => updateMed(i,"anupana",e.target.value)} placeholder="Warm water" />
                          </div>
                          <button onClick={() => removeMed(i)} disabled={current.medicines.length === 1}
                            style={{ marginTop:20, padding:6, background:"none", border:"none", color:"#334155", cursor:"pointer", borderRadius:6 }}
                            onMouseEnter={e => e.currentTarget.style.color="#f43f5e"}
                            onMouseLeave={e => e.currentTarget.style.color="#334155"}>
                            <Trash2 size={15} />
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                  <div style={S.card}>
                    <h4 style={{ fontSize:13, fontWeight:800, color:"#e2e8f0", marginBottom:10 }}>Panchakarma Detox Therapy</h4>
                    <select style={{ ...S.select, maxWidth:360 }} value={current.panchakarma} onChange={e => set("panchakarma",e.target.value)}>
                      {["None","Vamana","Virechana","Basti","Nasya","Raktamokshana","Abhyanga-Swedana","Shirodhara"].map(o => <option key={o}>{o}</option>)}
                    </select>
                  </div>
                </div>
              )}

              {/* ── TAB: LABS & FOLLOW-UP ── */}
              {activeTab === "labs" && (
                <div>
                  <div style={S.card}>
                    <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:14 }}>
                      <h3 style={{ fontSize:14, fontWeight:800, color:"#e2e8f0" }}>7. Lab Investigations</h3>
                      <div style={{ display:"flex", gap:8 }}>
                        {Object.keys(LAB_PANELS).map(p => (
                          <button key={p} onClick={() => addLabPanel(p)}
                            style={{ padding:"5px 12px", background:"#111827", border:"1px solid #2a3a55", borderRadius:8, fontSize:11, fontWeight:600, color:"#94a3b8", cursor:"pointer" }}
                            onMouseEnter={e => { e.currentTarget.style.borderColor="#818cf8"; e.currentTarget.style.color="#818cf8"; }}
                            onMouseLeave={e => { e.currentTarget.style.borderColor="#2a3a55"; e.currentTarget.style.color="#94a3b8"; }}>
                            + {p}
                          </button>
                        ))}
                        <button onClick={addCustomLab}
                          style={{ padding:"5px 12px", background:"#111827", border:"1px solid #2a3a55", borderRadius:8, fontSize:11, fontWeight:600, color:"#64748b", cursor:"pointer" }}>
                          + Custom
                        </button>
                      </div>
                    </div>
                    {current.labTests.length === 0 ? (
                      <div style={{ textAlign:"center", padding:"32px 0", color:"#64748b", fontSize:12 }}>
                        <FlaskConical size={28} style={{ margin:"0 auto 8px", opacity:0.3 }} />
                        <p>No lab tests added. Click panel buttons above to add.</p>
                      </div>
                    ) : (
                      <div style={{ display:"flex", flexDirection:"column", gap:8 }}>
                        <div style={{ display:"grid", gridTemplateColumns:"3fr 1fr 1fr 1fr auto", gap:8, padding:"6px 10px" }}>
                          {["Test Parameter","Result","Ref Range","Unit",""].map(h => <p key={h} style={{ fontSize:9, fontWeight:800, color:"#64748b", textTransform:"uppercase", letterSpacing:"0.08em" }}>{h}</p>)}
                        </div>
                        {current.labTests.map((t, i) => {
                          const isCustom = t.range === "Custom";
                          const val = parseFloat(t.value);
                          let valColor = "#e2e8f0";
                          if (!isNaN(val) && t.range && t.range !== "Custom") {
                            const r = t.range.replace(/[<>]/g, "").trim();
                            if (t.range.startsWith("<") && val > parseFloat(r)) valColor = "#f43f5e";
                            else if (t.range.startsWith(">") && val < parseFloat(r)) valColor = "#f59e0b";
                            else if (t.range.includes("–")) {
                              const [lo, hi] = t.range.split("–").map(Number);
                              if (val < lo || val > hi) valColor = "#f43f5e";
                              else valColor = "#10b981";
                            }
                          }
                          return (
                            <div key={i} style={{ display:"grid", gridTemplateColumns:"3fr 1fr 1fr 1fr auto", gap:8, alignItems:"center", background:"#111827", borderRadius:9, padding:"8px 10px", border:"1px solid #2a3a55" }}>
                              <input style={{ ...S.input, fontSize:12 }} value={t.testName} readOnly={!isCustom} onChange={e => updateLabField(i,"testName",e.target.value)} />
                              <input style={{ ...S.input, fontSize:12, color:valColor, fontWeight:700, textAlign:"center" }} value={t.value} onChange={e => updateLabVal(i, e.target.value)} placeholder="—" />
                              <input style={{ ...S.input, fontSize:11, textAlign:"center", opacity: isCustom ? 1 : 0.6 }} value={t.range} readOnly={!isCustom} onChange={e => updateLabField(i,"range",e.target.value)} />
                              <input style={{ ...S.input, fontSize:11, textAlign:"center", opacity: isCustom ? 1 : 0.6 }} value={t.unit} readOnly={!isCustom} onChange={e => updateLabField(i,"unit",e.target.value)} />
                              <button onClick={() => removeLabTest(i)}
                                style={{ padding:6, background:"none", border:"none", color:"#334155", cursor:"pointer" }}
                                onMouseEnter={e => e.currentTarget.style.color="#f43f5e"}
                                onMouseLeave={e => e.currentTarget.style.color="#334155"}>
                                <Trash2 size={14} />
                              </button>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>

                  <div style={S.card}>
                    <h3 style={{ fontSize:14, fontWeight:800, color:"#e2e8f0", marginBottom:14 }}>Clinical Outcomes & Notes</h3>
                    <div style={{ display:"grid", gridTemplateColumns:"1fr 2fr", gap:16 }}>
                      <div>
                        <label style={S.label}>Patient Progress Score</label>
                        <select style={S.select} value={current.outcomeScore} onChange={e => set("outcomeScore", e.target.value)}>
                          <option value="5">5/5 — Complete Recovery / Cured</option>
                          <option value="4">4/5 — Significant Improvement</option>
                          <option value="3">3/5 — Stable / Moderate Relief</option>
                          <option value="2">2/5 — No Relief / Same</option>
                          <option value="1">1/5 — Worsened</option>
                        </select>
                        <div style={{ marginTop:10 }}>
                          <ScoreBadge score={current.outcomeScore} />
                        </div>
                      </div>
                      <div>
                        <label style={S.label}>Dietary Advice / Notes (Pathya-Apathya)</label>
                        <textarea rows={4} style={{ ...S.input, resize:"none" }} value={current.notes} onChange={e => set("notes", e.target.value)} placeholder="e.g. Avoid dairy, warm soup, walk 30 mins daily…" />
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* ── WIZARD NAV BUTTONS ── */}
              <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", padding:"16px 0", borderTop:"1px solid #2a3a55", marginTop:8 }}>
                <button onClick={() => prevTab && setActiveTab(prevTab)} disabled={!prevTab}
                  style={{ display:"flex", alignItems:"center", gap:7, padding:"9px 18px", background:prevTab ? "#1a2236" : "transparent", border:"1px solid", borderColor:prevTab ? "#2a3a55" : "transparent", borderRadius:10, fontSize:11, fontWeight:700, color:prevTab ? "#94a3b8" : "transparent", cursor:prevTab ? "pointer" : "default", textTransform:"uppercase", letterSpacing:"0.04em" }}>
                  <ArrowLeft size={14} /> Back
                </button>
                {nextTab ? (
                  <button onClick={() => setActiveTab(nextTab)}
                    style={{ display:"flex", alignItems:"center", gap:7, padding:"9px 20px", background:"#10b981", border:"none", borderRadius:10, fontSize:11, fontWeight:800, color:"#0b0e18", cursor:"pointer", textTransform:"uppercase", letterSpacing:"0.04em" }}>
                    Next <ArrowRight size={14} />
                  </button>
                ) : (
                  <button onClick={saveCase}
                    style={{ display:"flex", alignItems:"center", gap:7, padding:"9px 20px", background:"#10b981", border:"none", borderRadius:10, fontSize:11, fontWeight:800, color:"#0b0e18", cursor:"pointer", textTransform:"uppercase", letterSpacing:"0.04em" }}>
                    <Save size={14} /> Save Case File
                  </button>
                )}
              </div>
            </div>
          )}

          {/* ══════════ ANALYTICS ══════════ */}
          {view === "analytics" && (
            <div style={{ maxWidth:860, margin:"0 auto" }} className="animate-fade-up">
              <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr 1fr", gap:16, marginBottom:24 }}>
                {[
                  { label:"Total Cases", value: analytics.total, color:"#10b981" },
                  { label:"Unique Patients", value: analytics.patients, color:"#818cf8" },
                  { label:"Alerts Active", value: alerts.length + followups.length, color: alerts.length + followups.length > 0 ? "#f43f5e" : "#10b981" },
                ].map(card => (
                  <div key={card.label} style={{ ...S.card, textAlign:"center", borderColor:`${card.color}30`, background:`rgba(0,0,0,0.2)` }}>
                    <p style={{ fontSize:10, fontWeight:700, color:"#64748b", textTransform:"uppercase", letterSpacing:"0.1em", marginBottom:6 }}>{card.label}</p>
                    <p style={{ fontSize:40, fontWeight:900, color:card.color, lineHeight:1 }}>{card.value}</p>
                  </div>
                ))}
              </div>
              <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:16 }}>
                <div style={S.card}>
                  <h4 style={{ fontSize:13, fontWeight:800, color:"#e2e8f0", marginBottom:14 }}>Gender Distribution</h4>
                  {Object.entries(analytics.gc).map(([g, n]) => (
                    <div key={g} style={{ marginBottom:10 }}>
                      <div style={{ display:"flex", justifyContent:"space-between", marginBottom:4 }}>
                        <span style={{ fontSize:11, color:"#94a3b8", fontWeight:600 }}>{g}</span>
                        <span style={{ fontSize:11, color:"#e2e8f0", fontWeight:800 }}>{n}</span>
                      </div>
                      <div style={{ height:6, background:"#2a3a55", borderRadius:99 }}>
                        <div style={{ height:"100%", width:`${analytics.total ? (n/analytics.total*100) : 0}%`, background:"#10b981", borderRadius:99, transition:"width 0.5s" }} />
                      </div>
                    </div>
                  ))}
                </div>
                <div style={S.card}>
                  <h4 style={{ fontSize:13, fontWeight:800, color:"#e2e8f0", marginBottom:14 }}>Top Complaints</h4>
                  {analytics.topComplaints.length === 0 ? <p style={{ color:"#64748b", fontSize:12 }}>No data yet.</p> : analytics.topComplaints.map(([txt, count]) => (
                    <div key={txt} style={{ marginBottom:8 }}>
                      <div style={{ display:"flex", justifyContent:"space-between", marginBottom:3 }}>
                        <span style={{ fontSize:11, color:"#94a3b8", fontWeight:600, textTransform:"capitalize" }}>{txt}</span>
                        <span style={{ fontSize:11, color:"#e2e8f0", fontWeight:800 }}>{count}</span>
                      </div>
                      <div style={{ height:5, background:"#2a3a55", borderRadius:99 }}>
                        <div style={{ height:"100%", width:`${analytics.topComplaints[0] ? (count/analytics.topComplaints[0][1]*100) : 0}%`, background:"#818cf8", borderRadius:99 }} />
                      </div>
                    </div>
                  ))}
                </div>
                <div style={{ ...S.card, gridColumn:"span 2" }}>
                  <h4 style={{ fontSize:13, fontWeight:800, color:"#e2e8f0", marginBottom:14 }}>Prakriti Distribution</h4>
                  <div style={{ display:"flex", flexWrap:"wrap", gap:8 }}>
                    {Object.entries(analytics.pc).map(([p, n]) => (
                      <div key={p} style={{ background:"rgba(129,140,248,0.1)", border:"1px solid rgba(129,140,248,0.25)", borderRadius:8, padding:"8px 14px", textAlign:"center" }}>
                        <p style={{ fontSize:13, fontWeight:800, color:"#818cf8" }}>{n}</p>
                        <p style={{ fontSize:10, color:"#64748b", fontWeight:600 }}>{p}</p>
                      </div>
                    ))}
                    {Object.keys(analytics.pc).length === 0 && <p style={{ color:"#64748b", fontSize:12 }}>No data yet.</p>}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ══════════ ALERTS HUB ══════════ */}
          {view === "alerts" && (
            <div style={{ maxWidth:860, margin:"0 auto" }} className="animate-fade-up">
              {alerts.length > 0 && (
                <div style={{ ...S.card, borderColor:"rgba(244,63,94,0.3)" }}>
                  <div style={{ display:"flex", alignItems:"center", gap:10, marginBottom:14 }}>
                    <AlertTriangle size={16} color="#f43f5e" />
                    <h3 style={{ fontSize:14, fontWeight:800, color:"#e2e8f0" }}>Lab Value Alerts ({alerts.length})</h3>
                  </div>
                  <div style={{ display:"flex", flexDirection:"column", gap:8 }}>
                    {alerts.map((a, i) => (
                      <div key={i} style={{ display:"flex", justifyContent:"space-between", alignItems:"center", background:"rgba(244,63,94,0.06)", border:"1px solid rgba(244,63,94,0.2)", borderRadius:10, padding:"10px 14px" }}>
                        <div>
                          <p style={{ fontSize:12, fontWeight:700, color:"#e2e8f0" }}>{a.name}</p>
                          <p style={{ fontSize:11, color:"#94a3b8" }}>{a.param}: <strong style={{ color: a.sev === "Critical" ? "#f43f5e" : "#f59e0b" }}>{a.val}</strong></p>
                        </div>
                        <span style={{ padding:"3px 10px", borderRadius:99, fontSize:10, fontWeight:800, textTransform:"uppercase", background: a.sev === "Critical" ? "rgba(244,63,94,0.15)" : "rgba(245,158,11,0.15)", color: a.sev === "Critical" ? "#f43f5e" : "#f59e0b", border:`1px solid ${a.sev === "Critical" ? "rgba(244,63,94,0.4)" : "rgba(245,158,11,0.4)"}` }}>{a.sev}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
              {followups.length > 0 && (
                <div style={S.card}>
                  <div style={{ display:"flex", alignItems:"center", gap:10, marginBottom:14 }}>
                    <Clock size={16} color="#f59e0b" />
                    <h3 style={{ fontSize:14, fontWeight:800, color:"#e2e8f0" }}>Follow-up Required ({followups.length})</h3>
                  </div>
                  <div style={{ display:"flex", flexDirection:"column", gap:8 }}>
                    {followups.map((f, i) => (
                      <div key={i} style={{ display:"flex", justifyContent:"space-between", alignItems:"center", background:"rgba(245,158,11,0.06)", border:"1px solid rgba(245,158,11,0.2)", borderRadius:10, padding:"10px 14px" }}>
                        <div>
                          <p style={{ fontSize:12, fontWeight:700, color:"#e2e8f0" }}>{f.name}</p>
                          <p style={{ fontSize:11, color:"#94a3b8" }}>{f.complaint} · {f.mobile} · {f.daysAgo} days ago</p>
                        </div>
                        <ScoreBadge score={f.score} />
                      </div>
                    ))}
                  </div>
                </div>
              )}
              {alerts.length === 0 && followups.length === 0 && (
                <div style={{ ...S.card, textAlign:"center", padding:"60px 20px" }}>
                  <CheckCircle size={40} style={{ margin:"0 auto 12px", color:"#10b981", opacity:0.5 }} />
                  <p style={{ color:"#94a3b8", fontWeight:700 }}>All clear! No pending alerts or overdue follow-ups.</p>
                </div>
              )}
            </div>
          )}

          {/* ══════════ DB UTILITIES ══════════ */}
          {view === "utilities" && (
            <div style={{ maxWidth:720, margin:"0 auto" }} className="animate-fade-up">
              <div style={S.card}>
                <h3 style={{ fontSize:14, fontWeight:800, color:"#e2e8f0", marginBottom:16 }}>Database Management</h3>
                <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:12 }}>
                  <button onClick={handleExport}
                    style={{ display:"flex", alignItems:"center", justifyContent:"center", gap:8, padding:"14px", background:"rgba(16,185,129,0.1)", border:"1px solid rgba(16,185,129,0.25)", borderRadius:12, fontSize:12, fontWeight:700, color:"#10b981", cursor:"pointer", flexDirection:"column" }}>
                    <Download size={20} />
                    Export Backup (JSON)
                  </button>
                  <label style={{ display:"flex", alignItems:"center", justifyContent:"center", gap:8, padding:"14px", background:"rgba(129,140,248,0.1)", border:"1px solid rgba(129,140,248,0.25)", borderRadius:12, fontSize:12, fontWeight:700, color:"#818cf8", cursor:"pointer", flexDirection:"column" }}>
                    <Upload size={20} />
                    Import Backup (JSON)
                    <input type="file" accept=".json" onChange={handleImport} style={{ display:"none" }} />
                  </label>
                </div>
                <div style={{ marginTop:12, padding:"14px", background:"rgba(244,63,94,0.06)", border:"1px solid rgba(244,63,94,0.2)", borderRadius:12 }}>
                  <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center" }}>
                    <div>
                      <p style={{ fontSize:12, fontWeight:700, color:"#f43f5e" }}>⚠ Reset Entire Database</p>
                      <p style={{ fontSize:11, color:"#64748b", marginTop:2 }}>Permanently deletes all patient records. Requires passcode.</p>
                    </div>
                    <button onClick={handleReset}
                      style={{ padding:"8px 16px", background:"rgba(244,63,94,0.15)", border:"1px solid rgba(244,63,94,0.3)", borderRadius:9, fontSize:11, fontWeight:800, color:"#f43f5e", cursor:"pointer" }}>
                      Reset DB
                    </button>
                  </div>
                </div>
              </div>
              <div style={{ ...S.card, borderColor:"rgba(16,185,129,0.2)", background:"rgba(16,185,129,0.03)" }}>
                <div style={{ display:"flex", gap:10, alignItems:"flex-start" }}>
                  <Shield size={18} color="#10b981" style={{ flexShrink:0, marginTop:2 }} />
                  <div>
                    <p style={{ fontSize:12, fontWeight:700, color:"#10b981", marginBottom:4 }}>Privacy & Security</p>
                    <p style={{ fontSize:11, color:"#64748b", lineHeight:1.6 }}>All data is stored exclusively in your browser's IndexedDB. No patient data is transmitted to any external server. Use Export to create backups before clearing browser data.</p>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* ── HISTORY DRAWER ── */}
      {historyOpen && (
        <div style={{ position:"fixed", inset:0, zIndex:100 }}>
          <div onClick={() => setHistoryOpen(false)}
            style={{ position:"absolute", inset:0, background:"rgba(0,0,0,0.6)", backdropFilter:"blur(4px)" }} />
          <div style={{ position:"absolute", right:0, top:0, bottom:0, width:480, background:"#111827", borderLeft:"1px solid #2a3a55", display:"flex", flexDirection:"column", zIndex:1 }} className="animate-slide-in">
            <div style={{ padding:"18px 20px", borderBottom:"1px solid #2a3a55", display:"flex", justifyContent:"space-between", alignItems:"center", flexShrink:0 }}>
              <div>
                <h3 style={{ fontSize:14, fontWeight:800, color:"#e2e8f0" }}>Patient History Summary</h3>
                <p style={{ fontSize:10, color:"#64748b", fontWeight:600 }}>{current.name} · {current.patientId}</p>
              </div>
              <button onClick={() => setHistoryOpen(false)}
                style={{ padding:8, background:"#1a2236", border:"1px solid #2a3a55", borderRadius:9, cursor:"pointer", color:"#94a3b8", display:"flex", alignItems:"center" }}>
                <X size={16} />
              </button>
            </div>
            <div style={{ flex:1, overflowY:"auto", padding:20 }}>
              {/* Registry Card */}
              <div style={{ background:"#1a2236", border:"1px solid #2a3a55", borderRadius:12, padding:"14px 16px", marginBottom:14 }}>
                <p style={{ fontSize:9, fontWeight:800, color:"#64748b", textTransform:"uppercase", letterSpacing:"0.1em", marginBottom:10 }}>Patient Registry Card</p>
                <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:8, fontSize:12 }}>
                  <div><p style={{ fontSize:9, color:"#64748b", fontWeight:700, textTransform:"uppercase" }}>Age / Gender</p><p style={{ color:"#e2e8f0", fontWeight:700 }}>{current.age}y / {current.gender}</p></div>
                  <div><p style={{ fontSize:9, color:"#64748b", fontWeight:700, textTransform:"uppercase" }}>Mobile</p><p style={{ color:"#e2e8f0", fontWeight:700 }}>{current.mobile || "—"}</p></div>
                  <div style={{ gridColumn:"span 2" }}>
                    <p style={{ fontSize:9, color:"#64748b", fontWeight:700, textTransform:"uppercase", marginBottom:5 }}>Chronic Conditions</p>
                    <div style={{ display:"flex", flexWrap:"wrap", gap:5 }}>
                      {Object.entries(current.pastHistory || {}).filter(([k,v]) => v && k !== "others").map(([k]) => (
                        <span key={k} className="hm-badge badge-rose">{k === "htn" ? "Hypertension" : k}</span>
                      ))}
                      {current.pastHistory?.others && <span className="hm-badge badge-slate">{current.pastHistory.others}</span>}
                      {Object.entries(current.pastHistory || {}).filter(([k,v]) => v).length === 0 && <span style={{ fontSize:11, color:"#64748b", fontStyle:"italic" }}>None</span>}
                    </div>
                  </div>
                </div>
              </div>
              {/* All symptoms aggregated */}
              <div style={{ marginBottom:14 }}>
                <p style={{ fontSize:9, fontWeight:800, color:"#64748b", textTransform:"uppercase", letterSpacing:"0.1em", marginBottom:8 }}>All Symptoms Ever Reported</p>
                <div style={{ display:"flex", flexWrap:"wrap", gap:6 }}>
                  {(() => {
                    const all = new Set();
                    (current.complaints || []).forEach(c => { if (c.text?.trim()) all.add(c.text.trim()); });
                    (current.visits || []).forEach(v => { (v.complaints || []).forEach(c => { if (c.text?.trim()) all.add(c.text.trim()); }); });
                    if (all.size === 0) return <span style={{ fontSize:11, color:"#64748b", fontStyle:"italic" }}>No symptoms logged.</span>;
                    return Array.from(all).map((s, i) => <span key={i} className="hm-badge badge-slate" style={{ textTransform:"capitalize" }}>{s}</span>);
                  })()}
                </div>
              </div>
              {/* Visit History */}
              <p style={{ fontSize:9, fontWeight:800, color:"#64748b", textTransform:"uppercase", letterSpacing:"0.1em", marginBottom:10 }}>
                Archived Visits ({current.visits?.length || 0})
              </p>
              {(!current.visits?.length) ? (
                <div style={{ textAlign:"center", padding:"30px", border:"1px dashed #2a3a55", borderRadius:12, color:"#64748b", fontSize:11 }}>
                  No archived visits yet. Click "Archive & Start Follow-up" to record one.
                </div>
              ) : current.visits.map((v, idx) => (
                <div key={v.visitId || idx} style={{ background:"#1a2236", border:"1px solid #2a3a55", borderRadius:12, padding:"14px 16px", marginBottom:10 }}>
                  <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:8 }}>
                    <span style={{ fontSize:12, fontWeight:800, color:"#e2e8f0" }}>{fmtDate(v.visitDate)}</span>
                    <div style={{ display:"flex", gap:8, alignItems:"center" }}>
                      <ScoreBadge score={v.outcomeScore} />
                      <button onClick={() => { copyVisit(v); setHistoryOpen(false); }}
                        style={{ fontSize:10, fontWeight:700, color:"#64748b", background:"#111827", border:"1px solid #2a3a55", borderRadius:7, padding:"3px 8px", cursor:"pointer", display:"flex", alignItems:"center", gap:4 }}>
                        <RefreshCw size={9} /> Copy Rx
                      </button>
                    </div>
                  </div>
                  <p style={{ fontSize:10, color:"#64748b", marginBottom:6 }}>{v.prakriti} · {v.vikriti} · {v.agni} Agni</p>
                  {(v.complaints || []).filter(c => c.text).length > 0 && (
                    <div style={{ marginBottom:6 }}>
                      {(v.complaints || []).filter(c => c.text).map((c, i) => {
                        const prog = v.complaintsProgress?.[c.text.trim()];
                        return (
                          <span key={i} style={{ display:"inline-flex", alignItems:"center", gap:5, marginRight:8, marginBottom:4, fontSize:11, color:"#94a3b8" }}>
                            • {c.text} {prog && <ProgressBadge status={prog} />}
                          </span>
                        );
                      })}
                    </div>
                  )}
                  {(v.medicines || []).filter(m => m.name).length > 0 && (
                    <div style={{ background:"#111827", borderRadius:8, padding:"6px 10px", fontFamily:"monospace", fontSize:10, color:"#64748b" }}>
                      {(v.medicines || []).filter(m => m.name).map((m, i) => <div key={i}>• {m.name} ({m.dose})</div>)}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
