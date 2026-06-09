import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { 
  Lock, User, FileText, Activity, ShieldAlert, Heart, Plus, Trash2, 
  Search, Printer, Save, RefreshCw, LogOut, Check, PlusCircle, ArrowLeft, ArrowRight,
  Database, BarChart3, Bell, Shield, Download, Upload, AlertTriangle, Calendar, MessageCircle, Menu, History
} from "lucide-react";
import SEO from "../components/SEO";
import { 
  getAllItems, putItem, deleteItem, clearStore, migrateFromLocalStorage 
} from "../lib/db";

// Helper to calculate duration from onset date
const getDurationString = (dateStr) => {
  if (!dateStr) return "";
  const onset = new Date(dateStr);
  const now = new Date();
  if (isNaN(onset.getTime())) return "";
  
  onset.setHours(0, 0, 0, 0);
  now.setHours(0, 0, 0, 0);
  
  const diffTime = now.getTime() - onset.getTime();
  const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
  
  if (diffDays < 0) return "Future date";
  if (diffDays === 0) return "Starts today";
  if (diffDays === 1) return "1 day ago";
  if (diffDays < 30) return `${diffDays} days ago`;
  
  const diffMonths = Math.floor(diffDays / 30.4);
  if (diffMonths < 12) {
    return `${diffMonths} month${diffMonths > 1 ? "s" : ""} ago`;
  }
  
  const diffYears = Math.floor(diffMonths / 12);
  const remainingMonths = diffMonths % 12;
  if (remainingMonths === 0) {
    return `${diffYears} year${diffYears > 1 ? "s" : ""} ago`;
  }
  return `${diffYears} year${diffYears > 1 ? "s" : ""} and ${remainingMonths} month${remainingMonths > 1 ? "s" : ""} ago`;
};

// Ayurvedic presets for rapid entry
const MEDICINE_PRESETS = [
  "Triphala Churna", "Chandraprabha Vati", "Gandharvahastadi Kashayam", 
  "Arogyavardhini Vati", "Mahanarayan Tailam", "Ashwagandhadi Churna", 
  "Kanchanar Guggulu", "Kaishore Guggulu", "Shatavari Ghrita", 
  "Dashmoolarishta", "Trikatu Churna", "Avipattikar Churna"
];

const LAB_PANELS = {
  Glycemic: [
    { testName: "Fasting Blood Sugar (FBS)", value: "", range: "70-100", unit: "mg/dL" },
    { testName: "Post-Prandial Blood Sugar (PPBS)", value: "", range: "< 140", unit: "mg/dL" },
    { testName: "HbA1c (Glycated Hemoglobin)", value: "", range: "4.0-5.6", unit: "%" }
  ],
  Lipid: [
    { testName: "Total Cholesterol", value: "", range: "125-200", unit: "mg/dL" },
    { testName: "Triglycerides", value: "", range: "< 150", unit: "mg/dL" },
    { testName: "HDL (Good Cholesterol)", value: "", range: "> 40", unit: "mg/dL" },
    { testName: "LDL (Bad Cholesterol)", value: "", range: "< 100", unit: "mg/dL" }
  ],
  LFT: [
    { testName: "SGOT (AST)", value: "", range: "5-40", unit: "U/L" },
    { testName: "SGPT (ALT)", value: "", range: "7-56", unit: "U/L" },
    { testName: "Total Bilirubin", value: "", range: "0.1-1.2", unit: "mg/dL" },
    { testName: "Alkaline Phosphatase (ALP)", value: "", range: "44-147", unit: "U/L" }
  ],
  KFT: [
    { testName: "Serum Creatinine", value: "", range: "0.5-1.2", unit: "mg/dL" },
    { testName: "Blood Urea Nitrogen (BUN)", value: "", range: "7-20", unit: "mg/dL" },
    { testName: "Uric Acid", value: "", range: "2.4-6.0", unit: "mg/dL" }
  ]
};

const DEFAULT_STATE = {
  patientId: "",
  name: "",
  age: "",
  gender: "Male",
  mobile: "",
  occupation: "",
  
  // Chief Complaints (Multiple items)
  complaints: [{ text: "", onsetDate: "" }],
  
  // Ayurvedic Core (Appetite, bowel, sleep)
  kshudha: "Sama",
  mutra: "Normal",
  mala: "Normal",
  koshtha: "Madhya",
  nidra: "Normal",
  avastha: "Niraama",
  
  // Clinical Info
  pastHistory: { diabetes: false, htn: false, thyroid: false, asthma: false, obesity: false, gut: false, others: "" },
  drugHistory: { hasHistory: "No", details: "" },
  familyHistory: { diabetes: false, htn: false, thyroid: false, others: "" },
  addiction: "None",
  vegaDharana: { mutra: false, mala: false, nidra: false, others: "" },
  workType: "Mixed",
  stressLevel: "Moderate",
  
  // Ayurvedic Diagnosis
  prakriti: "Vata-Pitta",
  vikriti: "Vata",
  dosha: { vata: true, pitta: false, kapha: false },
  dushya: { rasa: true, rakta: false, mamsa: false, meda: false, asthi: false, majja: false, shukra: false },
  srotas: { annavaha: true, pranavaha: false, rasavaha: false, raktavaha: false, medovaha: false, mutravaha: false, purishavaha: false },
  agni: "Sama",
  samprapti: "Agnimandya",
  sampraptiCustom: "",
  
  // Lifestyle
  diet: "Mixed",
  appetite: "Normal",
  sleep: "Good",
  activity: "Moderate",
  divaswap: "No",
  waterIntake: "Adequate",
  viruddhaAhara: "No",
  junkFood: "Occasional",
  
  // Treatments
  medicines: [{ name: "", dose: "1 tab BD", kala: "After food", anupana: "Warm water" }],
  panchakarma: "None",
  
  // Follow Up
  followUpSymptoms: "Same",
  followUpAgni: "Same",
  followUpTreatment: "Continued",
  outcomeScore: "3", // default middle
  
  // Labs
  labTests: [],
  notes: "",
  visitDate: "",
  visits: []
};

export default function DbmsDashboard() {
  const navigate = useNavigate();
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  
  // Main view navigation: "clinical" | "analytics" | "followups" | "utilities"
  const [viewMode, setViewMode] = useState("clinical");
  
  const [activeTab, setActiveTab] = useState("profile"); // active clinical tab
  const [savedCases, setSavedCases] = useState([]);
  const [matchingPatients, setMatchingPatients] = useState([]);
  const [currentCase, setCurrentCase] = useState({ ...DEFAULT_STATE });
  const [searchTerm, setSearchTerm] = useState("");
  const [isPrintMode, setIsPrintMode] = useState(false);
  const [notification, setNotification] = useState("");
  const [showSidebar, setShowSidebar] = useState(window.innerWidth >= 1024);
  const [showHistoryDrawer, setShowHistoryDrawer] = useState(false);

  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth >= 1024) {
        setShowSidebar(true);
      }
    };
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  // Live queue state (kept empty/unused)
  const [liveQueue, setLiveQueue] = useState([]);
  const [queueName, setQueueName] = useState("");
  const [queueAge, setQueueAge] = useState("");
  const [queueGender, setQueueGender] = useState("Male");
  const [queueMobile, setQueueMobile] = useState("");
  const [queueReason, setQueueReason] = useState("");

  // Check doctor authentication session
  useEffect(() => {
    const isDocLogged = localStorage.getItem("ayurkaya_doctor_logged_in");
    if (isDocLogged === "true") {
      setIsAuthenticated(true);
    } else {
      navigate("/login");
    }
  }, [navigate]);

  // Load cases, queue, and migrate from LocalStorage once on mount
  useEffect(() => {
    if (!isAuthenticated) return;
    
    async function loadData() {
      // 1. One-time auto migration from LocalStorage to IndexedDB
      await migrateFromLocalStorage();
      
      // 2. Fetch Cases
      const cases = await getAllItems("cases");
      // Sort cases by visitDate descending (newest first)
      cases.sort((a, b) => new Date(b.visitDate || 0) - new Date(a.visitDate || 0));
      setSavedCases(cases);

      // 3. Fetch Live Queue
      const queue = await getAllItems("queue");
      setLiveQueue(queue);
    }
    loadData();
  }, [isAuthenticated]);

  // Sequential Patient ID Generator
  const generateNextPatientId = async () => {
    try {
      const cases = await getAllItems("cases");
      const registry = await getAllItems("registry");
      const ids = new Set([
        ...cases.map(c => c.patientId),
        ...registry.map(r => r.patientId)
      ]);
      let maxNum = 0;
      for (const id of ids) {
        if (id && id.startsWith("PAT-")) {
          const numStr = id.substring(4);
          const num = parseInt(numStr, 10);
          if (!isNaN(num) && num > maxNum) {
            maxNum = num;
          }
        }
      }
      const nextNum = maxNum + 1;
      return `PAT-${String(nextNum).padStart(8, "0")}`;
    } catch (err) {
      console.error("Error generating next patient ID:", err);
      return `PAT-${Date.now()}`;
    }
  };

  // Auto-fill or find matching patient profiles when 10-digit mobile is typed
  useEffect(() => {
    const cleanMobile = (currentCase.mobile || "").replace(/[^0-9]/g, "");
    if (cleanMobile.length === 10) {
      async function checkRegistry() {
        try {
          const registry = await getAllItems("registry");
          const matches = registry.filter(r => (r.mobile || "").replace(/[^0-9]/g, "") === cleanMobile);
          setMatchingPatients(matches);
          
          // If there is exactly 1 match and form fields are empty, auto-fill it
          if (matches.length === 1 && !currentCase.patientId && !currentCase.name.trim()) {
            const patient = matches[0];
            
            // Try to find if there's an existing case sheet in savedCases to load full clinical data
            const existingCase = savedCases.find(c => c.patientId === patient.patientId);
            if (existingCase) {
              setCurrentCase({ ...existingCase });
              triggerNotification(`Loaded patient record for ${patient.name}.`);
            } else {
              setCurrentCase(prev => ({
                ...prev,
                patientId: patient.patientId,
                name: patient.name || "",
                age: patient.age || "",
                gender: patient.gender || "Male",
                occupation: patient.occupation || ""
              }));
              triggerNotification(`Loaded profile details for ${patient.name}.`);
            }
          }
        } catch (err) {
          console.error("Error reading registry:", err);
        }
      }
      checkRegistry();
    } else {
      setMatchingPatients([]);
    }
  }, [currentCase.mobile, savedCases]);

  const triggerNotification = (msg) => {
    setNotification(msg);
    setTimeout(() => setNotification(""), 3500);
  };

  const handleLogout = () => {
    localStorage.removeItem("ayurkaya_doctor_logged_in");
    navigate("/login");
  };

  // Text state handlers
  const handleTextChange = (field, value) => {
    setCurrentCase({ ...currentCase, [field]: value });
  };

  const handleCheckboxChange = (group, key, val) => {
    setCurrentCase({
      ...currentCase,
      [group]: { ...currentCase[group], [key]: val }
    });
  };

  // Complaint wizard handlers
  const addComplaint = () => {
    const updated = [...currentCase.complaints, { text: "", onsetDate: "" }];
    setCurrentCase({ ...currentCase, complaints: updated });
  };

  const updateComplaint = (index, field, value) => {
    const updated = [...currentCase.complaints];
    updated[index][field] = value;
    setCurrentCase({ ...currentCase, complaints: updated });
  };

  const removeComplaint = (index) => {
    if (currentCase.complaints.length === 1) return;
    const updated = currentCase.complaints.filter((_, i) => i !== index);
    setCurrentCase({ ...currentCase, complaints: updated });
  };

  // Prescription medicines handlers
  const addMedicine = () => {
    const updated = [...currentCase.medicines, { name: "", dose: "1 tab BD", kala: "After food", anupana: "Warm water" }];
    setCurrentCase({ ...currentCase, medicines: updated });
  };

  const updateMedicine = (index, field, value) => {
    const updated = [...currentCase.medicines];
    updated[index][field] = value;
    setCurrentCase({ ...currentCase, medicines: updated });
  };

  const removeMedicine = (index) => {
    if (currentCase.medicines.length === 1) return;
    const updated = currentCase.medicines.filter((_, i) => i !== index);
    setCurrentCase({ ...currentCase, medicines: updated });
  };

  const addMedicinePreset = (name) => {
    const existsEmpty = currentCase.medicines.findIndex(m => m.name === "");
    if (existsEmpty !== -1) {
      updateMedicine(existsEmpty, "name", name);
    } else {
      const updated = [...currentCase.medicines, { name, dose: "1 tab BD", kala: "After food", anupana: "Warm water" }];
      setCurrentCase({ ...currentCase, medicines: updated });
    }
  };

  // Investigation Lab panel handlers
  const addLabPanel = (panelName) => {
    const panelTests = LAB_PANELS[panelName];
    if (!panelTests) return;
    
    const currentTestNames = currentCase.labTests.map(t => t.testName);
    const newTests = panelTests.filter(t => !currentTestNames.includes(t.testName));
    
    if (newTests.length === 0) {
      triggerNotification(`${panelName} panel items already loaded.`);
      return;
    }
    
    setCurrentCase({
      ...currentCase,
      labTests: [...currentCase.labTests, ...JSON.parse(JSON.stringify(newTests))]
    });
    triggerNotification(`Added ${panelName} Panel tests.`);
  };

  const updateLabTestValue = (index, val) => {
    const updated = [...currentCase.labTests];
    updated[index].value = val;
    setCurrentCase({ ...currentCase, labTests: updated });
  };

  const removeLabTest = (index) => {
    const updated = currentCase.labTests.filter((_, i) => i !== index);
    setCurrentCase({ ...currentCase, labTests: updated });
  };

  const addCustomLabRow = () => {
    setCurrentCase({
      ...currentCase,
      labTests: [...currentCase.labTests, { testName: "", value: "", range: "Custom", unit: "-" }]
    });
  };

  const updateCustomLabField = (index, field, val) => {
    const updated = [...currentCase.labTests];
    updated[index][field] = val;
    setCurrentCase({ ...currentCase, labTests: updated });
  };

  // Update Permanent Registry basic profile manually
  const updateRegistryProfile = async () => {
    const cleanMobile = (currentCase.mobile || "").replace(/[^0-9]/g, "");
    if (cleanMobile.length !== 10) {
      triggerNotification("Valid 10-digit Mobile Number is required to update registry profile.");
      return;
    }
    if (!currentCase.name.trim()) {
      triggerNotification("Patient Name is required.");
      return;
    }

    try {
      let patientId = currentCase.patientId;
      if (!patientId) {
        patientId = await generateNextPatientId();
        setCurrentCase(prev => ({ ...prev, patientId }));
      }

      const patientData = {
        patientId,
        name: currentCase.name,
        age: currentCase.age,
        gender: currentCase.gender,
        mobile: cleanMobile,
        occupation: currentCase.occupation,
        updatedAt: new Date().toISOString()
      };
      await putItem("registry", patientData);

      // Check if there is an existing case for this patientId, and update its demographic details too
      const existingCaseIndex = savedCases.findIndex(c => c.patientId === patientId);
      if (existingCaseIndex !== -1) {
        const updatedCase = {
          ...savedCases[existingCaseIndex],
          name: currentCase.name,
          age: currentCase.age,
          gender: currentCase.gender,
          mobile: cleanMobile,
          occupation: currentCase.occupation
        };
        await putItem("cases", updatedCase);
        
        // Update both states so the case list updates immediately
        const newCases = [...savedCases];
        newCases[existingCaseIndex] = updatedCase;
        setSavedCases(newCases);
        setCurrentCase(updatedCase);
      } else {
        // Just update active state demographics in case they save it later
        setCurrentCase(prev => ({
          ...prev,
          patientId,
          mobile: cleanMobile
        }));
      }

      triggerNotification(`Permanent profile and case file for ${currentCase.name} updated successfully.`);
    } catch (err) {
      console.error(err);
      triggerNotification("Failed to update patient profile.");
    }
  };

  // Save Case Sheet to IndexedDB
  const saveCase = async () => {
    if (!currentCase.name.trim()) {
      triggerNotification("Patient Name is required to save case.");
      setActiveTab("profile");
      return;
    }

    let cases = [...savedCases];
    let updatedCase = { ...currentCase };
    
    if (currentCase.patientId) {
      // Edit existing case
      updatedCase.visitDate = updatedCase.visitDate || new Date().toISOString();
      cases = cases.map(c => c.patientId === currentCase.patientId ? updatedCase : c);
      await putItem("cases", updatedCase);

      // Keep registry synced
      const cleanMobile = (updatedCase.mobile || "").replace(/[^0-9]/g, "");
      if (cleanMobile.length === 10) {
        const patientData = {
          patientId: updatedCase.patientId,
          name: updatedCase.name,
          age: updatedCase.age,
          gender: updatedCase.gender,
          mobile: cleanMobile,
          occupation: updatedCase.occupation,
          updatedAt: new Date().toISOString()
        };
        await putItem("registry", patientData);
      }
      triggerNotification("Patient Case Record Updated.");
    } else {
      // New case - generate sequential ID
      const newId = await generateNextPatientId();
      updatedCase.patientId = newId;
      updatedCase.visitDate = new Date().toISOString();
      cases = [updatedCase, ...cases];
      setCurrentCase(updatedCase);
      await putItem("cases", updatedCase);

      // Auto-register to registry if valid mobile
      const cleanMobile = (updatedCase.mobile || "").replace(/[^0-9]/g, "");
      if (cleanMobile.length === 10) {
        const patientData = {
          patientId: newId,
          name: updatedCase.name,
          age: updatedCase.age,
          gender: updatedCase.gender,
          mobile: cleanMobile,
          occupation: updatedCase.occupation,
          updatedAt: new Date().toISOString()
        };
        await putItem("registry", patientData);
      }
      triggerNotification(`New Case Record Created (ID: ${newId}).`);
    }

    cases.sort((a, b) => new Date(b.visitDate || 0) - new Date(a.visitDate || 0));
    setSavedCases(cases);
  };

  // Archive active session details to visits history, reset active visit parameters
  const handleRecordNewVisit = async () => {
    if (!currentCase.patientId) {
      triggerNotification("Please save the patient case first before recording a follow-up visit.");
      return;
    }
    
    try {
      // 1. Create a historical visit record from the active fields
      const activeVisit = {
        visitId: "VIS-" + Date.now(),
        visitDate: currentCase.visitDate || new Date().toISOString(),
        complaints: JSON.parse(JSON.stringify(currentCase.complaints || [])),
        kshudha: currentCase.kshudha || "Sama",
        mutra: currentCase.mutra || "Normal",
        mala: currentCase.mala || "Normal",
        koshtha: currentCase.koshtha || "Madhya",
        nidra: currentCase.nidra || "Normal",
        avastha: currentCase.avastha || "Niraama",
        prakriti: currentCase.prakriti || "Vata-Pitta",
        vikriti: currentCase.vikriti || "Vata",
        dosha: JSON.parse(JSON.stringify(currentCase.dosha || {})),
        dushya: JSON.parse(JSON.stringify(currentCase.dushya || {})),
        srotas: JSON.parse(JSON.stringify(currentCase.srotas || {})),
        agni: currentCase.agni || "Sama",
        samprapti: currentCase.samprapti || "Agnimandya",
        sampraptiCustom: currentCase.sampraptiCustom || "",
        diet: currentCase.diet || "Mixed",
        appetite: currentCase.appetite || "Normal",
        sleep: currentCase.sleep || "Good",
        activity: currentCase.activity || "Moderate",
        divaswap: currentCase.divaswap || "No",
        waterIntake: currentCase.waterIntake || "Adequate",
        viruddhaAhara: currentCase.viruddhaAhara || "No",
        junkFood: currentCase.junkFood || "Occasional",
        medicines: JSON.parse(JSON.stringify(currentCase.medicines || [])),
        panchakarma: currentCase.panchakarma || "None",
        followUpSymptoms: currentCase.followUpSymptoms || "Same",
        followUpAgni: currentCase.followUpAgni || "Same",
        followUpTreatment: currentCase.followUpTreatment || "Continued",
        outcomeScore: currentCase.outcomeScore || "3",
        notes: currentCase.notes || "",
        labTests: JSON.parse(JSON.stringify(currentCase.labTests || []))
      };

      const updatedVisits = [activeVisit, ...(currentCase.visits || [])];

      // 2. Prepare the new active case state
      const updatedCase = {
        ...currentCase,
        visitDate: new Date().toISOString(),
        outcomeScore: "3",
        notes: "",
        followUpSymptoms: "Same",
        followUpAgni: "Same",
        followUpTreatment: "Continued",
        visits: updatedVisits
      };

      // 3. Save to database
      setCurrentCase(updatedCase);
      await putItem("cases", updatedCase);

      // 4. Update state list
      const casesList = savedCases.map(c => c.patientId === currentCase.patientId ? updatedCase : c);
      casesList.sort((a, b) => new Date(b.visitDate || 0) - new Date(a.visitDate || 0));
      setSavedCases(casesList);

      triggerNotification("Current session archived to history. Started follow-up visit.");
      setActiveTab("complaints");
    } catch (err) {
      console.error("Error creating follow-up visit:", err);
      triggerNotification("Failed to record follow-up visit.");
    }
  };

  // Copy details of a past visit into the active clinical sheet
  const copyPastVisitDetails = (pastVisit) => {
    setCurrentCase(prev => ({
      ...prev,
      complaints: JSON.parse(JSON.stringify(pastVisit.complaints || [])),
      kshudha: pastVisit.kshudha,
      mutra: pastVisit.mutra,
      mala: pastVisit.mala,
      koshtha: pastVisit.koshtha,
      nidra: pastVisit.nidra,
      avastha: pastVisit.avastha,
      prakriti: pastVisit.prakriti,
      vikriti: pastVisit.vikriti,
      dosha: JSON.parse(JSON.stringify(pastVisit.dosha || {})),
      dushya: JSON.parse(JSON.stringify(pastVisit.dushya || {})),
      srotas: JSON.parse(JSON.stringify(pastVisit.srotas || {})),
      agni: pastVisit.agni,
      samprapti: pastVisit.samprapti,
      sampraptiCustom: pastVisit.sampraptiCustom,
      diet: pastVisit.diet,
      appetite: pastVisit.appetite,
      sleep: pastVisit.sleep,
      activity: pastVisit.activity,
      divaswap: pastVisit.divaswap,
      waterIntake: pastVisit.waterIntake,
      viruddhaAhara: pastVisit.viruddhaAhara,
      junkFood: pastVisit.junkFood,
      medicines: JSON.parse(JSON.stringify(pastVisit.medicines || [])),
      panchakarma: pastVisit.panchakarma,
      labTests: JSON.parse(JSON.stringify(pastVisit.labTests || []))
    }));
    triggerNotification(`Copied remedies & diagnoses from visit on ${new Date(pastVisit.visitDate).toLocaleDateString()}`);
  };

  // Load selected case into active editor
  const selectCase = (c) => {
    setCurrentCase({ ...c });
    setViewMode("clinical");
    setActiveTab("profile");
    triggerNotification(`Loaded record of ${c.name}`);
  };

  const loadSelectedPatientProfile = (patient) => {
    const existingCase = savedCases.find(c => c.patientId === patient.patientId);
    if (existingCase) {
      setCurrentCase({ ...existingCase });
      triggerNotification(`Loaded patient record for ${patient.name}.`);
    } else {
      setCurrentCase(prev => ({
        ...prev,
        patientId: patient.patientId,
        name: patient.name || "",
        age: patient.age || "",
        gender: patient.gender || "Male",
        occupation: patient.occupation || "",
        mobile: patient.mobile || prev.mobile,
        visits: []
      }));
      triggerNotification(`Loaded profile details for ${patient.name}.`);
    }
    setMatchingPatients([]);
  };

  const startNewFamilyMemberProfile = () => {
    const activeMobile = currentCase.mobile;
    setCurrentCase({
      ...DEFAULT_STATE,
      mobile: activeMobile
    });
    setMatchingPatients([]);
    triggerNotification("Cleared form to register a new family member under this mobile number.");
  };

  // Clear case sheets for a new patient
  const startNewCase = () => {
    setCurrentCase({ ...DEFAULT_STATE });
    setViewMode("clinical");
    setActiveTab("profile");
    triggerNotification("Cleared workspace editor.");
  };

  // Delete Case from database
  const deleteCaseRecord = async (id, e) => {
    e.stopPropagation();
    if (window.confirm("Are you sure you want to delete this patient record?")) {
      await deleteItem("cases", id);
      const filtered = savedCases.filter(c => c.patientId !== id);
      setSavedCases(filtered);
      if (currentCase.patientId === id) {
        setCurrentCase({ ...DEFAULT_STATE });
      }
      triggerNotification("Patient record removed from database.");
    }
  };

  // Consulting a queue patient
  const consultQueuePatient = async (patient) => {
    setCurrentCase({
      ...DEFAULT_STATE,
      name: patient.name,
      age: patient.age,
      gender: patient.gender || "Male",
      mobile: patient.mobile,
      occupation: patient.occupation || "",
      complaints: [{ text: patient.reason || "", onsetDate: new Date().toISOString().split("T")[0] }]
    });
    
    const updatedQueue = liveQueue.map(q => q.id === patient.id ? { ...q, status: "In-Consult" } : q);
    setLiveQueue(updatedQueue);
    
    // Save state in IndexedDB
    await putItem("queue", { ...patient, status: "In-Consult" });
    
    setActiveTab("profile");
    triggerNotification(`Consultation initialized for ${patient.name}`);
  };

  // Re-order queue (Mark late / push back)
  const pushBackPatient = async (index) => {
    if (index >= liveQueue.length - 1) {
      triggerNotification("Patient is already at the end of the queue.");
      return;
    }
    
    const updatedQueue = [...liveQueue];
    const patient = updatedQueue[index];
    
    updatedQueue.splice(index, 1);
    updatedQueue.splice(index + 1, 0, patient);
    setLiveQueue(updatedQueue);
    
    // Rewrite live queue store in IndexedDB
    await clearStore("queue");
    for (const q of updatedQueue) {
      await putItem("queue", q);
    }
    triggerNotification(`Pushed ${patient.name} back in queue.`);
  };

  // Remove patient from waiting list
  const completeQueuePatient = async (id) => {
    const updatedQueue = liveQueue.filter(q => q.id !== id);
    setLiveQueue(updatedQueue);
    await deleteItem("queue", id);
    triggerNotification("Patient checked out from waiting list.");
  };

  // Add patient to queue
  const addToQueue = async (e) => {
    e.preventDefault();
    if (!queueName.trim()) return;
    
    const newItem = {
      id: "Q-" + Date.now(),
      name: queueName,
      age: queueAge,
      gender: queueGender,
      mobile: queueMobile,
      reason: queueReason,
      status: "Waiting",
      timestamp: new Date().toISOString(),
      preferredTime: "Walk-in"
    };
    
    const updated = [...liveQueue, newItem];
    setLiveQueue(updated);
    await putItem("queue", newItem);
    
    setQueueName("");
    setQueueAge("");
    setQueueGender("Male");
    setQueueMobile("");
    setQueueReason("");
    
    triggerNotification(`Added ${newItem.name} to waiting list.`);
  };

  // JSON Database Export
  const handleExportBackup = async () => {
    try {
      const cases = await getAllItems("cases");
      const registry = await getAllItems("registry");
      const queue = await getAllItems("queue");
      
      const backupData = {
        version: 2,
        exportedAt: new Date().toISOString(),
        cases,
        registry,
        queue
      };
      
      const blob = new Blob([JSON.stringify(backupData, null, 2)], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `ayurkaya_dbms_backup_${new Date().toISOString().split("T")[0]}.json`;
      link.click();
      URL.revokeObjectURL(url);
      triggerNotification("Database backup file generated successfully.");
    } catch (err) {
      console.error(err);
      triggerNotification("Failed to export backup.");
    }
  };

  // JSON Database Import
  const handleImportBackup = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (event) => {
      try {
        const data = JSON.parse(event.target.result);
        if (data.version && Array.isArray(data.cases)) {
          // Clear current stores first
          await clearStore("cases");
          await clearStore("registry");
          await clearStore("queue");

          // Insert cases
          for (const c of data.cases) {
            await putItem("cases", c);
          }
          // Insert registry profiles
          if (Array.isArray(data.registry)) {
            for (const r of data.registry) {
              await putItem("registry", r);
            }
          }
          // Insert queue
          if (Array.isArray(data.queue)) {
            for (const q of data.queue) {
              await putItem("queue", q);
            }
          }

          // Reload React States from IndexedDB
          const loadedCases = await getAllItems("cases");
          loadedCases.sort((a, b) => new Date(b.visitDate || 0) - new Date(a.visitDate || 0));
          setSavedCases(loadedCases);
          
          const loadedQueue = await getAllItems("queue");
          setLiveQueue(loadedQueue);

          triggerNotification("All database records restored successfully!");
          e.target.value = null; // reset input
        } else {
          alert("Invalid backup file structure. Import aborted.");
        }
      } catch (err) {
        console.error(err);
        alert("Failed to parse JSON backup file.");
      }
    };
    reader.readAsText(file);
  };

  // Reset entire database
  const handleResetDatabase = async () => {
    const passcode = prompt("Enter doctor authentication passcode (1008) to reset database:");
    if (passcode === "1008") {
      if (confirm("WARNING: This will permanently delete ALL patient records, registries, and queue history. This action cannot be undone. Proceed?")) {
        await clearStore("cases");
        await clearStore("registry");
        await clearStore("queue");
        
        setSavedCases([]);
        setLiveQueue([]);
        setCurrentCase({ ...DEFAULT_STATE });
        triggerNotification("DBMS database fully cleared and reset.");
      }
    } else if (passcode !== null) {
      alert("Incorrect passcode. Database reset cancelled.");
    }
  };

  // Compile visual stats metrics
  const getAnalytics = () => {
    const totalCases = savedCases.length;
    const uniqueMobiles = new Set(savedCases.map(c => c.mobile).filter(Boolean));
    const totalPatients = uniqueMobiles.size;

    const genderCounts = { Male: 0, Female: 0, Other: 0 };
    const ageCounts = { "0-18": 0, "19-35": 0, "36-50": 0, "51-65": 0, "66+": 0 };
    const prakritiCounts = {};
    const agniCounts = {};
    const malaCounts = {};
    const complaintCounts = {};

    savedCases.forEach(c => {
      // Gender
      if (genderCounts[c.gender] !== undefined) genderCounts[c.gender]++;
      else genderCounts.Male++;

      // Age
      const age = parseInt(c.age);
      if (!isNaN(age)) {
        if (age <= 18) ageCounts["0-18"]++;
        else if (age <= 35) ageCounts["19-35"]++;
        else if (age <= 50) ageCounts["36-50"]++;
        else if (age <= 65) ageCounts["51-65"]++;
        else ageCounts["66+"]++;
      }

      // Prakriti
      const prak = c.prakriti || "Vata-Pitta";
      prakritiCounts[prak] = (prakritiCounts[prak] || 0) + 1;

      // Agni
      const agn = c.agni || "Sama";
      agniCounts[agn] = (agniCounts[agn] || 0) + 1;

      // Bowel (mala)
      const bowel = c.mala || "Normal";
      malaCounts[bowel] = (malaCounts[bowel] || 0) + 1;

      // Complaints
      if (Array.isArray(c.complaints)) {
        c.complaints.forEach(comp => {
          if (comp.text && comp.text.trim()) {
            const txt = comp.text.trim().toLowerCase();
            complaintCounts[txt] = (complaintCounts[txt] || 0) + 1;
          }
        });
      }
    });

    return {
      totalCases,
      totalPatients,
      genderCounts,
      ageCounts,
      prakritiCounts,
      agniCounts,
      malaCounts,
      complaintCounts: Object.entries(complaintCounts)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 5) // top 5
    };
  };

  // Identify patients with critical lab vitals or due follow-ups
  const getFollowupsAndAlerts = () => {
    const alerts = [];
    const followups = [];
    const now = new Date();

    savedCases.forEach(c => {
      // 1. Vitals Lab Alerts
      if (Array.isArray(c.labTests)) {
        c.labTests.forEach(t => {
          const val = parseFloat(t.value);
          if (!isNaN(val)) {
            if (t.testName.includes("HbA1c") && val > 5.6) {
              alerts.push({
                patientName: c.name,
                mobile: c.mobile,
                parameter: t.testName,
                measured: `${val}%`,
                normalRange: "4.0 - 5.6%",
                severity: val >= 6.5 ? "Critical" : "Warning",
                visitDate: c.visitDate
              });
            }
            if (t.testName.includes("Total Cholesterol") && val > 200) {
              alerts.push({
                patientName: c.name,
                mobile: c.mobile,
                parameter: t.testName,
                measured: `${val} mg/dL`,
                normalRange: "< 200 mg/dL",
                severity: val >= 240 ? "Critical" : "Warning",
                visitDate: c.visitDate
              });
            }
            if (t.testName.includes("Fasting Blood Sugar") && val > 100) {
              alerts.push({
                patientName: c.name,
                mobile: c.mobile,
                parameter: t.testName,
                measured: `${val} mg/dL`,
                normalRange: "70 - 100 mg/dL",
                severity: val >= 126 ? "Critical" : "Warning",
                visitDate: c.visitDate
              });
            }
            if (t.testName.includes("Serum Creatinine") && val > 1.2) {
              alerts.push({
                patientName: c.name,
                mobile: c.mobile,
                parameter: t.testName,
                measured: `${val} mg/dL`,
                normalRange: "0.5 - 1.2 mg/dL",
                severity: val >= 1.5 ? "Critical" : "Warning",
                visitDate: c.visitDate
              });
            }
          }
        });
      }

      // 2. Follow-ups required
      // If patient has visitDate, and visited more than 21 days ago, and outcome score was low (< 3)
      if (c.visitDate) {
        const visit = new Date(c.visitDate);
        const diffTime = now.getTime() - visit.getTime();
        const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
        const score = parseInt(c.outcomeScore || "3");

        if (diffDays >= 21 || score <= 2) {
          // Check if this patient is already listed (keep newest sheet only)
          if (!followups.some(f => f.mobile === c.mobile)) {
            followups.push({
              name: c.name,
              mobile: c.mobile,
              lastVisit: c.visitDate,
              daysAgo: diffDays,
              outcome: score,
              reason: c.complaints?.[0]?.text || "Routine Consultation"
            });
          }
        }
      }
    });

    return { alerts, followups };
  };

  // Filtered cases list sidebar search
  const filteredCasesList = savedCases.filter(c => 
    (c.name || "").toLowerCase().includes(searchTerm.toLowerCase()) || 
    (c.mobile || "").includes(searchTerm) ||
    (c.patientId || "").toLowerCase().includes(searchTerm.toLowerCase())
  );

  const wizardTabs = [
    { id: "profile", label: "Patient Profile" },
    { id: "complaints", label: "Complaints & History" },
    { id: "core", label: "Ayur Core" },
    { id: "diagnosis", label: "Diagnosis" },
    { id: "lifestyle", label: "Lifestyle" },
    { id: "treatment", label: "Prescription" },
    { id: "labs", label: "Labs & Follow-up" }
  ];

  const getNextTab = () => {
    const idx = wizardTabs.findIndex(t => t.id === activeTab);
    if (idx < wizardTabs.length - 1) return wizardTabs[idx + 1].id;
    return null;
  };

  const getPrevTab = () => {
    const idx = wizardTabs.findIndex(t => t.id === activeTab);
    if (idx > 0) return wizardTabs[idx - 1].id;
    return null;
  };

  if (!isAuthenticated) {
    return (
      <div className="min-h-[85vh] flex items-center justify-center bg-brand-cream/40 px-4 py-12">
        <SEO title="Redirecting..." description="Authenticating Doctor..." />
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-brand-primary" />
      </div>
    );
  }

  // Print Prescription View Mode
  if (isPrintMode) {
    return (
      <div className="bg-white text-black min-h-screen p-8 md:p-16 max-w-4xl mx-auto font-sans print:p-0 print:m-0 space-y-8 animate-fadeIn">
        <SEO title={`Case Print - ${currentCase.name || "Patient"}`} description="Ayurkaya Case Record Prescription Printout Form." />
        
        {/* Actions bar for printing */}
        <div className="flex justify-between items-center bg-brand-cream border border-brand-light/60 p-4 rounded-2xl print:hidden shadow-sm">
          <button
            onClick={() => setIsPrintMode(false)}
            className="flex items-center text-xs font-bold text-brand-primary hover:text-brand-secondary uppercase tracking-wider"
          >
            ← Back to System Editor
          </button>
          <div className="flex gap-3">
            <button
              onClick={() => window.print()}
              className="flex items-center gap-1.5 bg-brand-primary text-brand-beige hover:bg-brand-secondary px-5 py-2.5 rounded-xl text-xs font-bold uppercase tracking-wider transition-colors shadow-sm"
            >
              <Printer size={14} /> Send to Print / PDF
            </button>
          </div>
        </div>

        {/* Print Content Area */}
        <div className="border-4 border-double border-emerald-950 p-6 md:p-8 space-y-8">
          {/* Clinic Header */}
          <div className="flex justify-between items-start border-b border-brand-primary/25 pb-6">
            <div className="space-y-1">
              <span className="font-serif text-3xl font-extrabold text-emerald-900 tracking-tight block">
                AYURKAYA
              </span>
              <span className="text-[10px] tracking-widest text-emerald-800 uppercase font-bold block">
                Ayurvedic Integrative Wellness Center
              </span>
              <p className="text-xs text-gray-600 font-medium">
                108 Lotus Pavilion Rd, Wellness Suite 500, Bangalore • +91 80 2345 6789
              </p>
            </div>
            <div className="text-right space-y-1 shrink-0">
              <h3 className="font-serif text-lg font-bold text-emerald-900">Dr. Neha, B.A.M.S</h3>
              <p className="text-[10px] uppercase font-bold text-gray-500 tracking-wider">Chief Consultant Physician</p>
              <p className="text-xs text-gray-600">Reg No: AYUSH-A-2014-9023</p>
            </div>
          </div>

          {/* Patient Details Info Block */}
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-4 bg-emerald-50/50 p-4 rounded-xl text-xs border border-emerald-100">
            <div>
              <span className="text-gray-500 font-semibold uppercase block text-[10px]">Patient ID</span>
              <span className="font-bold text-gray-900 mt-0.5 block font-mono">{currentCase.patientId || "N/A"}</span>
            </div>
            <div>
              <span className="text-gray-500 font-semibold uppercase block text-[10px]">Patient Name</span>
              <span className="font-bold text-gray-900 text-sm mt-0.5 block">{currentCase.name || "N/A"}</span>
            </div>
            <div>
              <span className="text-gray-500 font-semibold uppercase block text-[10px]">Age / Gender</span>
              <span className="font-bold text-gray-900 mt-0.5 block">{currentCase.age || "N/A"} Yrs / {currentCase.gender}</span>
            </div>
            <div>
              <span className="text-gray-500 font-semibold uppercase block text-[10px]">Contact Mobile</span>
              <span className="font-bold text-gray-900 mt-0.5 block">{currentCase.mobile || "N/A"}</span>
            </div>
            <div>
              <span className="text-gray-500 font-semibold uppercase block text-[10px]">Consultation Date</span>
              <span className="font-bold text-gray-900 mt-0.5 block">{currentCase.visitDate ? new Date(currentCase.visitDate).toLocaleDateString() : new Date().toLocaleDateString()}</span>
            </div>
          </div>

          {/* Chief Complaints */}
          <div className="space-y-2">
            <h4 className="font-serif text-sm font-bold uppercase tracking-wider text-emerald-900 border-b border-gray-200 pb-1">
              Chief Complaints
            </h4>
            <ul className="list-disc pl-5 text-xs text-gray-800 space-y-1">
              {currentCase.complaints.map((c, i) => (
                c.text.trim() && (
                  <li key={i}>
                    <span className="font-semibold text-gray-900">{c.text}</span>
                    {c.onsetDate ? (
                      <span> — Onset: <span className="italic">{c.onsetDate} ({getDurationString(c.onsetDate)})</span></span>
                    ) : (
                      <span> — Onset: <span className="italic">N/A</span></span>
                    )}
                  </li>
                )
              ))}
            </ul>
          </div>

          {/* Clinical Summaries Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-xs">
            {/* Ayurvedic Diagnostics (Prakriti, Agni, etc) */}
            <div className="border border-gray-100 p-4 rounded-xl space-y-2.5">
              <h5 className="font-serif text-xs font-bold uppercase tracking-wide text-emerald-900 border-b border-gray-200 pb-1">
                Ayurvedic Diagnostic Assessment
              </h5>
              <div className="grid grid-cols-2 gap-y-2 gap-x-4">
                <div>
                  <span className="text-gray-500 block">Prakriti (Constitutional):</span>
                  <span className="font-bold text-gray-900">{currentCase.prakriti}</span>
                </div>
                <div>
                  <span className="text-gray-500 block">Vikriti (Imbalance):</span>
                  <span className="font-bold text-gray-900">{currentCase.vikriti}</span>
                </div>
                <div>
                  <span className="text-gray-500 block">Jatharagni (Digestive):</span>
                  <span className="font-bold text-gray-900">{currentCase.agni}</span>
                </div>
                <div>
                  <span className="text-gray-500 block">Koshtha (Gut Nature):</span>
                  <span className="font-bold text-gray-900">{currentCase.koshtha}</span>
                </div>
                <div>
                  <span className="text-gray-500 block">Avastha (Metabolism):</span>
                  <span className="font-bold text-gray-900">{currentCase.avastha}</span>
                </div>
                <div>
                  <span className="text-gray-500 block">Dushya Affected:</span>
                  <span className="font-bold text-gray-900">
                    {Object.entries(currentCase.dushya).filter(([_, v]) => v).map(([k]) => k.toUpperCase()).join(", ") || "None"}
                  </span>
                </div>
              </div>
            </div>

            {/* General Vitals & Additional History */}
            <div className="border border-gray-100 p-4 rounded-xl space-y-2.5">
              <h5 className="font-serif text-xs font-bold uppercase tracking-wide text-emerald-900 border-b border-gray-200 pb-1">
                Clinical Vitals & Medical History
              </h5>
              <div className="space-y-1.5 text-gray-800">
                <p>
                  <span className="text-gray-500">Past History: </span>
                  <span className="font-semibold">
                    {Object.entries(currentCase.pastHistory).filter(([k, v]) => v && k !== "others").map(([k]) => k.toUpperCase()).join(", ")}
                    {currentCase.pastHistory.others ? `, ${currentCase.pastHistory.others}` : ""}
                  </span>
                </p>
                <p>
                  <span className="text-gray-500">Family History: </span>
                  <span className="font-semibold">
                    {Object.entries(currentCase.familyHistory).filter(([k, v]) => v && k !== "others").map(([k]) => k.toUpperCase()).join(", ")}
                    {currentCase.familyHistory.others ? `, ${currentCase.familyHistory.others}` : ""}
                  </span>
                </p>
                <p>
                  <span className="text-gray-500">Drug History: </span>
                  <span className="font-semibold">{currentCase.drugHistory.hasHistory === "Yes" ? currentCase.drugHistory.details : "No significant details"}</span>
                </p>
                <p>
                  <span className="text-gray-500">Panchakarma Advised: </span>
                  <span className="font-bold text-emerald-800">{currentCase.panchakarma !== "None" ? currentCase.panchakarma.toUpperCase() : "None"}</span>
                </p>
              </div>
            </div>
          </div>

          {/* Medicines Prescription Table */}
          <div className="space-y-3">
            <h4 className="font-serif text-sm font-bold uppercase tracking-wider text-emerald-900 border-b border-gray-200 pb-1 flex items-center gap-1">
              💊 Advised Rx (Prescription)
            </h4>
            
            <table className="w-full text-xs text-left border-collapse">
              <thead>
                <tr className="bg-emerald-50 text-emerald-900 border-b border-emerald-250 font-bold uppercase">
                  <th className="py-2.5 px-3">#</th>
                  <th className="py-2.5 px-3">Medicine Name</th>
                  <th className="py-2.5 px-3">Dosage / Frequency</th>
                  <th className="py-2.5 px-3">Administration (Kala)</th>
                  <th className="py-2.5 px-3">Anupana (Vehicle)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 text-gray-800">
                {currentCase.medicines.map((med, idx) => (
                  med.name.trim() && (
                    <tr key={idx} className="hover:bg-gray-50/50">
                      <td className="py-3 px-3 font-semibold text-gray-400">{idx + 1}</td>
                      <td className="py-3 px-3 font-bold text-emerald-900">{med.name}</td>
                      <td className="py-3 px-3">{med.dose}</td>
                      <td className="py-3 px-3 font-medium">{med.kala}</td>
                      <td className="py-3 px-3 italic">{med.anupana}</td>
                    </tr>
                  )
                ))}
              </tbody>
            </table>
          </div>

          {/* Lab Investigations Table (Only render if there are tests) */}
          {currentCase.labTests.length > 0 && (
            <div className="space-y-3 pt-4">
              <h4 className="font-serif text-sm font-bold uppercase tracking-wider text-emerald-900 border-b border-gray-200 pb-1">
                🔬 Investigation Reports (Lab Panels)
              </h4>
              
              <table className="w-full text-xs text-left border-collapse">
                <thead>
                  <tr className="bg-gray-50 text-gray-800 border-b border-gray-200 font-bold">
                    <th className="py-2.5 px-3">Test Parameters</th>
                    <th className="py-2.5 px-3 text-center">Measured Value</th>
                    <th className="py-2.5 px-3 text-center">Reference Range</th>
                    <th className="py-2.5 px-3 text-center">Unit</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 text-gray-700">
                  {currentCase.labTests.map((t, idx) => (
                    t.testName.trim() && (
                      <tr key={idx}>
                        <td className="py-2 px-3 font-medium">{t.testName}</td>
                        <td className="py-2 px-3 text-center font-bold text-gray-900">{t.value || "—"}</td>
                        <td className="py-2 px-3 text-center text-gray-500">{t.range}</td>
                        <td className="py-2 px-3 text-center text-gray-500">{t.unit}</td>
                      </tr>
                    )
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* General Notes */}
          {currentCase.notes && (
            <div className="bg-gray-50 p-4 rounded-xl border border-gray-100 text-xs">
              <h5 className="font-serif font-bold text-gray-800 mb-1">Additional Advice / Pathya-Apathya:</h5>
              <p className="text-gray-700 leading-relaxed italic">"{currentCase.notes}"</p>
            </div>
          )}

          {/* Signature Area */}
          <div className="pt-12 flex justify-between items-end text-xs text-gray-700">
            <div>
              <p className="font-semibold text-emerald-900">Ayurkaya Clinic</p>
              <p className="text-[10px] text-gray-400">Electronic case record generation</p>
            </div>
            <div className="text-center w-48 space-y-1">
              <div className="h-0.5 bg-gray-300 w-full mb-1" />
              <p className="font-bold text-gray-900">Dr. Neha</p>
              <p className="text-[10px] uppercase font-bold text-gray-400">Consultant Signature</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const { alerts, followups } = getFollowupsAndAlerts();
  const analytics = getAnalytics();

  return (
    <div className="min-h-screen bg-brand-beige flex flex-col lg:flex-row font-sans relative">
      <SEO title="Clinical DBMS Portal" description="Ayurkaya Clinical Data Management System dashboard for Dr. Neha." />

      {/* Main Switcher Sidebar */}
      {showSidebar && (
        <div className="w-full lg:w-72 bg-brand-cream border-b lg:border-b-0 lg:border-r border-brand-light/60 flex flex-col shrink-0">
        
        {/* Module Switcher Buttons */}
        <div className="p-4 border-b border-brand-light/60 space-y-2">
          <div className="flex items-center space-x-2 pb-2">
            <span className="text-[10px] font-bold text-brand-secondary uppercase tracking-widest block">
              Ayurkaya DBMS
            </span>
          </div>
          <div className="grid grid-cols-2 lg:grid-cols-1 gap-1.5">
            <button
              onClick={() => setViewMode("clinical")}
              className={`flex items-center gap-2.5 px-4.5 py-3.5 rounded-xl text-xs font-bold uppercase tracking-wider transition-all cursor-pointer ${
                viewMode === "clinical" 
                  ? "bg-brand-primary text-brand-beige shadow-sm" 
                  : "bg-brand-beige text-brand-primary hover:bg-brand-light/45"
              }`}
            >
              <User size={15} />
              <span>Workspace</span>
            </button>
            <button
              onClick={() => setViewMode("analytics")}
              className={`flex items-center gap-2.5 px-4.5 py-3.5 rounded-xl text-xs font-bold uppercase tracking-wider transition-all cursor-pointer ${
                viewMode === "analytics" 
                  ? "bg-brand-primary text-brand-beige shadow-sm" 
                  : "bg-brand-beige text-brand-primary hover:bg-brand-light/45"
              }`}
            >
              <BarChart3 size={15} />
              <span>Analytics</span>
              {analytics.totalCases > 0 && (
                <span className="ml-auto bg-brand-accent/25 text-brand-primary text-[10px] px-2 py-0.5 rounded-full font-bold">
                  {analytics.totalCases}
                </span>
              )}
            </button>
            <button
              onClick={() => setViewMode("followups")}
              className={`flex items-center gap-2.5 px-4.5 py-3.5 rounded-xl text-xs font-bold uppercase tracking-wider transition-all cursor-pointer relative ${
                viewMode === "followups" 
                  ? "bg-brand-primary text-brand-beige shadow-sm" 
                  : "bg-brand-beige text-brand-primary hover:bg-brand-light/45"
              }`}
            >
              <Bell size={15} />
              <span>Alerts Hub</span>
              {(alerts.length > 0 || followups.length > 0) && (
                <span className="ml-auto bg-red-500 text-white text-[10px] px-2 py-0.5 rounded-full font-bold animate-pulse">
                  {alerts.length + followups.length}
                </span>
              )}
            </button>
            <button
              onClick={() => setViewMode("utilities")}
              className={`flex items-center gap-2.5 px-4.5 py-3.5 rounded-xl text-xs font-bold uppercase tracking-wider transition-all cursor-pointer ${
                viewMode === "utilities" 
                  ? "bg-brand-primary text-brand-beige shadow-sm" 
                  : "bg-brand-beige text-brand-primary hover:bg-brand-light/45"
              }`}
            >
              <Database size={15} />
              <span>Database Tools</span>
            </button>
          </div>
        </div>

        {/* Sidebar Case Sheets list (Only show when in clinical workspace) */}
        {viewMode === "clinical" ? (
          <div className="flex-grow flex flex-col min-h-0">
            <div className="p-4 border-b border-brand-light/60 space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-[10px] font-bold text-brand-primary uppercase tracking-widest">
                  Patient Case Files
                </span>
                <button
                  onClick={startNewCase}
                  className="bg-brand-primary text-brand-beige hover:bg-brand-secondary p-1.5 rounded-lg text-xs font-bold uppercase transition-colors"
                  title="New consultation"
                >
                  <Plus size={15} />
                </button>
              </div>
              <div className="relative">
                <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-brand-secondary/80 pointer-events-none" />
                <input
                  type="text"
                  placeholder="Search Name/Mobile..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full bg-brand-beige border border-brand-light/60 pl-8 pr-4 py-2 rounded-lg text-xs focus:outline-none focus:border-brand-secondary"
                />
              </div>
            </div>

            <div className="flex-grow overflow-y-auto max-h-[30vh] lg:max-h-none divide-y divide-brand-light/35">
              {filteredCasesList.length === 0 ? (
                <div className="p-6 text-center text-xs text-brand-dark/50 font-sans">
                  No cases saved yet.
                </div>
              ) : (
                filteredCasesList.map((c) => (
                  <button
                    key={c.patientId}
                    onClick={() => selectCase(c)}
                    className={`w-full text-left p-4 hover:bg-brand-light/25 flex justify-between items-start transition-colors ${
                      currentCase.patientId === c.patientId ? "bg-brand-light/30 border-l-4 border-brand-primary" : ""
                    }`}
                  >
                    <div className="space-y-1 pr-2">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <h4 className="font-serif font-bold text-brand-primary text-sm line-clamp-1">
                          {c.name}
                        </h4>
                        <span className="font-mono text-[9px] font-semibold text-brand-secondary bg-brand-light/25 px-1.5 py-0.5 rounded">
                          {c.patientId}
                        </span>
                      </div>
                      <p className="text-[10px] text-brand-secondary font-semibold uppercase">
                        {c.age} Yrs • {c.gender}
                      </p>
                      <p className="text-[10px] text-brand-dark/60 font-medium">
                        {c.mobile || "No mobile"}
                      </p>
                    </div>
                    <button
                      onClick={(e) => deleteCaseRecord(c.patientId, e)}
                      className="text-brand-dark/30 hover:text-red-500 p-1 rounded transition-colors"
                      title="Delete case sheet"
                    >
                      <Trash2 size={13} />
                    </button>
                  </button>
                ))
              )}
            </div>
          </div>
        ) : (
          <div className="flex-grow hidden lg:block p-6 text-center text-xs text-brand-secondary/65 leading-relaxed border-b border-brand-light/30">
            <Shield size={36} className="mx-auto text-brand-secondary/30 mb-2" />
            <p><strong>Secure Connection</strong></p>
            <p className="text-[10px] mt-1">IndexedDB capacity provides local workspace data storage without external network delays.</p>
          </div>
        )}

        {/* Footer actions inside sidebar */}
        <div className="p-4 border-t border-brand-light/60 bg-brand-beige/40 flex justify-between items-center text-xs text-brand-secondary font-semibold shrink-0">
          <div className="flex items-center gap-1.5">
            <div className="h-2 w-2 rounded-full bg-green-500 animate-pulse" />
            <span>Dr. Neha Portal</span>
          </div>
          <button
            onClick={handleLogout}
            className="flex items-center gap-1 text-brand-primary hover:text-brand-accent transition-colors cursor-pointer"
            title="Log out Portal"
          >
            <LogOut size={14} /> Log out
          </button>
        </div>
      </div>
      )}

      {/* Main Workspace Frame */}
      <div className="flex-grow flex flex-col min-h-0 bg-brand-cream/30">
        
        {/* Module views header */}
        <div className="p-4 bg-brand-cream border-b border-brand-light/60 flex justify-between items-center shrink-0 flex-wrap gap-3">
          <div className="flex items-center space-x-3">
            <button
              onClick={() => setShowSidebar(!showSidebar)}
              className="p-2.5 bg-brand-beige border border-brand-light/60 rounded-xl hover:bg-brand-light/45 active:scale-95 transition-all cursor-pointer text-brand-primary flex items-center justify-center"
              title={showSidebar ? "Hide Menu Sidebar" : "Show Menu Sidebar"}
            >
              <Menu size={16} />
            </button>
            <span className="font-serif font-bold text-brand-primary text-lg">
              {viewMode === "clinical" && (currentCase.name ? `Clinical Record: ${currentCase.name}` : "New Consultation Case Sheet")}
              {viewMode === "analytics" && "DBMS Clinical Analytics"}
              {viewMode === "followups" && "Alerts & Follow-ups Hub"}
              {viewMode === "utilities" && "DBMS Database Management Tools"}
            </span>
          </div>

          <div className="flex items-center space-x-3">
            {notification && (
              <span className="text-xs font-semibold text-brand-accent bg-brand-light/65 px-3 py-1.5 rounded-lg animate-pulse">
                {notification}
              </span>
            )}
            {viewMode === "clinical" && (
              <>
                {currentCase.patientId && (
                  <button
                    onClick={() => setShowHistoryDrawer(true)}
                    className="flex items-center gap-1.5 bg-brand-cream border border-brand-light/60 text-brand-primary hover:bg-brand-light/35 px-5 py-2.5 rounded-xl text-xs font-bold uppercase tracking-wider transition-all shadow-sm cursor-pointer"
                  >
                    <History size={14} /> History Summary
                  </button>
                )}
                <button
                  onClick={saveCase}
                  className="flex items-center gap-1.5 bg-brand-secondary text-brand-beige hover:bg-brand-primary px-5 py-2.5 rounded-xl text-xs font-bold uppercase tracking-wider transition-colors shadow-sm cursor-pointer"
                >
                  <Save size={14} /> Save Record
                </button>
                <button
                  onClick={() => {
                    if (!currentCase.name.trim()) {
                      triggerNotification("Must save patient profile with a name first!");
                      return;
                    }
                    setIsPrintMode(true);
                  }}
                  className="flex items-center gap-1.5 bg-brand-primary text-brand-beige hover:bg-brand-secondary px-5 py-2.5 rounded-xl text-xs font-bold uppercase tracking-wider transition-colors shadow-sm cursor-pointer"
                >
                  <Printer size={14} /> Generate Rx / Print
                </button>
              </>
            )}
          </div>
        </div>

        {/* Wizard tabs container (Only show in clinical mode) */}
        {viewMode === "clinical" && (
          <div className="flex overflow-x-auto bg-brand-cream/80 border-b border-brand-light/45 shrink-0 select-none scrollbar-none">
            {wizardTabs.map((t) => (
              <button
                key={t.id}
                onClick={() => setActiveTab(t.id)}
                className={`px-5 py-4 text-xs font-bold uppercase tracking-wider border-b-2 transition-all whitespace-nowrap cursor-pointer ${
                  activeTab === t.id
                    ? "border-brand-primary text-brand-primary bg-brand-light/10"
                    : "border-transparent text-brand-secondary/80 hover:text-brand-primary"
                }`}
              >
                {t.label}
              </button>
            ))}
          </div>
        )}

        {/* Dynamic Inner Panel View Router */}
        <div className="flex-grow overflow-y-auto p-6 md:p-8 max-w-5xl w-full mx-auto">
          
          {/* ==================== VIEW 1: CLINICAL WORKSPACE ==================== */}
          {viewMode === "clinical" && (
            <div className="animate-fadeIn">

              {/* Tab 1: Patient Profile */}
              {activeTab === "profile" && (
                <div className="space-y-6">
                  {/* Demographic Card */}
                  <div className="bg-brand-cream border border-brand-light/60 p-6 rounded-3xl space-y-6 shadow-sm">
                    <div className="flex justify-between items-center border-b border-brand-light/40 pb-2 flex-wrap gap-2">
                      <h3 className="font-serif text-xl font-bold text-brand-primary">
                        1. Patient Demographic Profile
                      </h3>
                      {currentCase.mobile && currentCase.mobile.replace(/[^0-9]/g, "").length === 10 && (
                        <button
                          onClick={updateRegistryProfile}
                          className="flex items-center gap-1.5 bg-brand-secondary text-brand-beige hover:bg-brand-primary px-3.5 py-1.5 rounded-lg text-xs font-bold uppercase tracking-wider transition-colors shadow-sm cursor-pointer"
                          title="Save details permanently"
                        >
                          <Save size={13} /> Update Registry Card
                        </button>
                      )}
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div>
                        <label className="block text-xs font-bold text-brand-primary uppercase tracking-wider mb-2">Patient ID (Primary Key)</label>
                        <div className="w-full bg-brand-light/10 border border-brand-light/45 px-4 py-3 rounded-xl text-sm font-mono text-brand-primary font-semibold select-all">
                          {currentCase.patientId || "Auto-generated on save"}
                        </div>
                      </div>

                      <div>
                        <label className="block text-xs font-bold text-brand-primary uppercase tracking-wider mb-2">Patient Full Name</label>
                        <input
                          type="text"
                          value={currentCase.name}
                          onChange={(e) => handleTextChange("name", e.target.value)}
                          placeholder="e.g. Aditi Rao"
                          className="w-full bg-brand-beige border border-brand-light/50 px-4 py-3 rounded-xl text-sm focus:outline-none focus:border-brand-secondary"
                        />
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="block text-xs font-bold text-brand-primary uppercase tracking-wider mb-2">Age (Years)</label>
                          <input
                            type="number"
                            value={currentCase.age}
                            onChange={(e) => handleTextChange("age", e.target.value)}
                            placeholder="e.g. 29"
                            className="w-full bg-brand-beige border border-brand-light/50 px-4 py-3 rounded-xl text-sm focus:outline-none"
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-bold text-brand-primary uppercase tracking-wider mb-2">Gender</label>
                          <select
                            value={currentCase.gender}
                            onChange={(e) => handleTextChange("gender", e.target.value)}
                            className="w-full bg-brand-beige border border-brand-light/50 px-4 py-3 rounded-xl text-sm focus:outline-none"
                          >
                            <option value="Male">Male</option>
                            <option value="Female">Female</option>
                            <option value="Other">Other</option>
                          </select>
                        </div>
                      </div>

                      <div className="relative">
                        <label className="block text-xs font-bold text-brand-primary uppercase tracking-wider mb-2">Mobile Number (Registry Lookup)</label>
                        <input
                          type="tel"
                          value={currentCase.mobile}
                          onChange={(e) => handleTextChange("mobile", e.target.value)}
                          placeholder="e.g. 9876543210"
                          className="w-full bg-brand-beige border border-brand-light/50 px-4 py-3 rounded-xl text-sm focus:outline-none focus:border-brand-secondary"
                        />
                        
                        {/* Inline Multiple Patient Picker */}
                        {matchingPatients.length > 0 && (
                          <div className="absolute z-20 left-0 right-0 mt-2 bg-brand-cream border border-brand-light p-4 rounded-2xl shadow-xl space-y-2 animate-fadeIn max-h-[220px] overflow-y-auto">
                            <div className="text-[10px] font-bold text-brand-primary/80 uppercase tracking-wide border-b border-brand-light/45 pb-1">
                              Registered profiles sharing this number:
                            </div>
                            <div className="space-y-1">
                              {matchingPatients.map(p => (
                                <button
                                  key={p.patientId}
                                  type="button"
                                  onClick={() => loadSelectedPatientProfile(p)}
                                  className={`w-full text-left p-2 rounded-lg text-xs font-sans flex justify-between items-center transition-all hover:bg-brand-light/35 ${
                                    currentCase.patientId === p.patientId ? "bg-brand-light/45 font-bold" : "text-brand-dark/95"
                                  }`}
                                >
                                  <span>{p.name} ({p.age} Yrs, {p.gender})</span>
                                  <span className="font-mono text-[10px] text-brand-secondary bg-brand-light/20 px-2 py-0.5 rounded">{p.patientId}</span>
                                </button>
                              ))}
                            </div>
                            <div className="border-t border-brand-light/45 pt-1.5 flex justify-end">
                              <button
                                type="button"
                                onClick={startNewFamilyMemberProfile}
                                className="text-[10px] font-bold text-brand-secondary hover:text-brand-primary flex items-center gap-1 uppercase transition-colors"
                              >
                                <PlusCircle size={12} /> Register New Patient Profile
                              </button>
                            </div>
                          </div>
                        )}
                      </div>

                      <div>
                        <label className="block text-xs font-bold text-brand-primary uppercase tracking-wider mb-2">Occupation</label>
                        <input
                          type="text"
                          value={currentCase.occupation}
                          onChange={(e) => handleTextChange("occupation", e.target.value)}
                          placeholder="e.g. Software Engineer"
                          className="w-full bg-brand-beige border border-brand-light/50 px-4 py-3 rounded-xl text-sm focus:outline-none"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Visit History Timeline card */}
                  {currentCase.patientId && (
                    <div className="bg-brand-cream border border-brand-light/60 p-6 rounded-3xl space-y-6 shadow-sm animate-fadeIn">
                      <div className="flex justify-between items-center border-b border-brand-light/40 pb-3 flex-wrap gap-3">
                        <div className="space-y-1">
                          <h3 className="font-serif text-lg font-bold text-brand-primary flex items-center gap-2">
                            <Calendar size={18} /> Visit History & Consultation Timeline
                          </h3>
                          <p className="text-[10px] text-brand-dark/50">
                            Track patient progress across consult sheets and repeat prescriptions.
                          </p>
                        </div>
                        <button
                          type="button"
                          onClick={handleRecordNewVisit}
                          className="flex items-center gap-1.5 bg-brand-primary text-brand-beige hover:bg-brand-secondary px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-wider transition-colors shadow-sm cursor-pointer"
                        >
                          <Plus size={14} /> Record Follow-up Visit
                        </button>
                      </div>

                      {(!currentCase.visits || currentCase.visits.length === 0) ? (
                        <div className="text-center py-6 text-xs text-brand-dark/40 font-sans italic">
                          No previous visits archived yet. (Click "Record Follow-up Visit" to archive current details and start a new consult).
                        </div>
                      ) : (
                        <div className="relative border-l-2 border-brand-light/70 ml-2.5 pl-6 space-y-6 py-2">
                          {currentCase.visits.map((v, idx) => (
                            <div key={v.visitId || idx} className="relative group">
                              {/* Timeline dot */}
                              <div className="absolute -left-[31px] top-1.5 h-3 w-3 rounded-full border-2 border-brand-primary bg-brand-beige group-hover:bg-brand-primary transition-colors" />
                              
                              <div className="bg-brand-beige/35 border border-brand-light/50 rounded-2xl p-4 space-y-3 hover:shadow-md transition-shadow">
                                <div className="flex justify-between items-center flex-wrap gap-2">
                                  <div className="flex items-center gap-2">
                                    <span className="font-serif font-bold text-brand-primary text-sm">
                                      {new Date(v.visitDate).toLocaleDateString("en-US", { day: 'numeric', month: 'short', year: 'numeric' })}
                                    </span>
                                    <span className="text-[10px] bg-brand-light/35 text-brand-secondary px-2 py-0.5 rounded-full font-semibold">
                                      {new Date(v.visitDate).toLocaleTimeString("en-US", { hour: '2-digit', minute: '2-digit' })}
                                    </span>
                                  </div>
                                  <div className="flex items-center gap-3">
                                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                                      v.outcomeScore >= 4 ? "bg-green-100 text-green-700" :
                                      v.outcomeScore === 3 ? "bg-amber-100 text-amber-700" :
                                      "bg-rose-100 text-rose-700"
                                    }`}>
                                      Progress: {v.outcomeScore}/5
                                    </span>
                                    <button
                                      type="button"
                                      onClick={() => copyPastVisitDetails(v)}
                                      className="text-[10px] font-bold text-brand-primary hover:text-brand-secondary border border-brand-primary/30 px-2 py-0.5 rounded-lg transition-colors bg-white shadow-sm flex items-center gap-1 uppercase"
                                    >
                                      <RefreshCw size={10} /> Copy remedies
                                    </button>
                                  </div>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs font-sans leading-relaxed">
                                  <div className="space-y-1.5">
                                    <h4 className="font-bold text-brand-primary text-[10px] uppercase tracking-wider">Chief Complaints:</h4>
                                    <ul className="list-disc list-inside text-brand-dark/80 space-y-0.5 pl-1">
                                      {(v.complaints || []).filter(c => c.text).map((c, i) => (
                                        <li key={i} className="list-item">
                                          {c.text} {c.onsetDate ? `(since ${getDurationString(c.onsetDate)})` : ""}
                                        </li>
                                      ))}
                                      {(v.complaints || []).filter(c => c.text).length === 0 && (
                                        <li className="list-item italic text-brand-dark/50">Routine consult / General follow-up</li>
                                      )}
                                    </ul>
                                    <div className="mt-2 text-brand-dark/85">
                                      <span className="font-bold text-brand-primary text-[10px] uppercase tracking-wider block">Ayurvedic Diagnosis:</span>
                                      Prakriti: <span className="font-semibold">{v.prakriti}</span> • Vikriti: <span className="font-semibold">{v.vikriti}</span> • Agni: <span className="font-semibold">{v.agni}</span>
                                    </div>
                                  </div>

                                  <div className="space-y-1.5">
                                    <h4 className="font-bold text-brand-primary text-[10px] uppercase tracking-wider">Prescribed Remedies:</h4>
                                    <div className="text-brand-dark/85 font-mono text-[11px] bg-white border border-brand-light/35 p-2 rounded-xl space-y-1 max-h-[80px] overflow-y-auto">
                                      {(v.medicines || []).filter(m => m.name).map((m, i) => (
                                        <div key={i} className="truncate">
                                          • {m.name} ({m.dose} - {m.kala})
                                        </div>
                                      ))}
                                      {(v.medicines || []).filter(m => m.name).length === 0 && (
                                        <div className="italic text-brand-dark/40">No specific formulations prescribed</div>
                                      )}
                                    </div>
                                    {v.notes && (
                                      <div className="mt-2 text-[11px] text-brand-dark/80 italic">
                                        <strong className="text-brand-primary not-italic text-[10px] uppercase tracking-wider block">Advice & Notes:</strong>
                                        "{v.notes}"
                                      </div>
                                    )}
                                  </div>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}

              {/* Tab 2: Complaints & History */}
              {activeTab === "complaints" && (
                <div className="space-y-6">
                  <div className="bg-brand-cream border border-brand-light/60 p-6 rounded-3xl space-y-4 shadow-sm">
                    <div className="flex justify-between items-center border-b border-brand-light/40 pb-2">
                      <h3 className="font-serif text-xl font-bold text-brand-primary">
                        2. Chief Complaints
                      </h3>
                      <button
                        onClick={addComplaint}
                        className="flex items-center gap-1 bg-brand-primary text-brand-beige px-3 py-1.5 rounded-lg text-xs font-bold uppercase tracking-wider cursor-pointer"
                      >
                        <Plus size={14} /> Add Complaint
                      </button>
                    </div>

                    <div className="space-y-4">
                      {currentCase.complaints.map((c, index) => (
                        <div key={index} className="flex gap-4 items-center flex-wrap md:flex-nowrap bg-brand-beige/30 p-3 rounded-xl border border-brand-light/30">
                          <div className="flex-grow min-w-[200px]">
                            <label className="block text-[9px] uppercase tracking-wider text-brand-secondary font-bold mb-1">Complaint / symptom</label>
                            <input
                              type="text"
                              value={c.text}
                              onChange={(e) => updateComplaint(index, "text", e.target.value)}
                              placeholder="e.g. Chronic bloating / Indigestion after meals"
                              className="w-full bg-brand-beige border border-brand-light/50 px-4 py-2.5 rounded-lg text-xs focus:outline-none"
                            />
                          </div>
                          <div className="w-52">
                            <label className="block text-[9px] uppercase tracking-wider text-brand-secondary font-bold mb-1">Onset Date</label>
                            <input
                              type="date"
                              value={c.onsetDate || ""}
                              onChange={(e) => updateComplaint(index, "onsetDate", e.target.value)}
                              className="w-full bg-brand-beige border border-brand-light/50 px-3 py-2.5 rounded-lg text-xs focus:outline-none"
                            />
                            {c.onsetDate && (
                              <span className="text-[10px] text-brand-secondary font-medium mt-1 block">
                                Duration: {getDurationString(c.onsetDate)}
                              </span>
                            )}
                          </div>
                          <button
                            onClick={() => removeComplaint(index)}
                            disabled={currentCase.complaints.length === 1}
                            className="text-brand-dark/40 hover:text-red-500 p-2 disabled:opacity-30 transition-colors cursor-pointer"
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Past History */}
                    <div className="bg-brand-cream border border-brand-light/60 p-6 rounded-3xl space-y-4 shadow-sm">
                      <h4 className="font-serif text-lg font-bold text-brand-primary border-b border-brand-light/40 pb-2">
                        Past History
                      </h4>
                      <div className="grid grid-cols-2 gap-3 text-xs">
                        {["diabetes", "htn", "thyroid", "asthma", "obesity", "gut"].map((key) => (
                          <label key={key} className="flex items-center space-x-2.5 cursor-pointer uppercase font-bold text-brand-primary/80">
                            <input
                              type="checkbox"
                              checked={currentCase.pastHistory[key] || false}
                              onChange={(e) => handleCheckboxChange("pastHistory", key, e.target.checked)}
                              className="rounded text-brand-primary focus:ring-brand-secondary h-4 w-4"
                            />
                            <span>{key === "htn" ? "HTN" : key === "gut" ? "Gut Issues" : key}</span>
                          </label>
                        ))}
                      </div>
                      <div className="pt-2">
                        <label className="block text-[11px] font-bold text-brand-primary uppercase tracking-wider mb-1">Other Past History</label>
                        <input
                          type="text"
                          value={currentCase.pastHistory.others || ""}
                          onChange={(e) => handleCheckboxChange("pastHistory", "others", e.target.value)}
                          placeholder="e.g. Migraine / Appendectomy"
                          className="w-full bg-brand-beige border border-brand-light/50 px-3 py-2 rounded-lg text-xs focus:outline-none"
                        />
                      </div>
                    </div>

                    {/* Family History */}
                    <div className="bg-brand-cream border border-brand-light/60 p-6 rounded-3xl space-y-4 shadow-sm">
                      <h4 className="font-serif text-lg font-bold text-brand-primary border-b border-brand-light/40 pb-2">
                        Family History
                      </h4>
                      <div className="grid grid-cols-2 gap-3 text-xs">
                        {["diabetes", "htn", "thyroid"].map((key) => (
                          <label key={key} className="flex items-center space-x-2.5 cursor-pointer uppercase font-bold text-brand-primary/80">
                            <input
                              type="checkbox"
                              checked={currentCase.familyHistory[key] || false}
                              onChange={(e) => handleCheckboxChange("familyHistory", key, e.target.checked)}
                              className="rounded text-brand-primary focus:ring-brand-secondary h-4 w-4"
                            />
                            <span>{key === "htn" ? "HTN" : key}</span>
                          </label>
                        ))}
                      </div>
                      <div className="pt-2">
                        <label className="block text-[11px] font-bold text-brand-primary uppercase tracking-wider mb-1">Other Family History</label>
                        <input
                          type="text"
                          value={currentCase.familyHistory.others || ""}
                          onChange={(e) => handleCheckboxChange("familyHistory", "others", e.target.value)}
                          placeholder="e.g. Cardiac history"
                          className="w-full bg-brand-beige border border-brand-light/50 px-3 py-2 rounded-lg text-xs focus:outline-none"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Drug history & lifestyle indicators */}
                  <div className="bg-brand-cream border border-brand-light/60 p-6 rounded-3xl space-y-4 shadow-sm">
                    <h4 className="font-serif text-lg font-bold text-brand-primary border-b border-brand-light/40 pb-2">
                      Clinical Parameters
                    </h4>
                    
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                      <div className="space-y-2">
                        <label className="block text-xs font-bold text-brand-primary uppercase tracking-wider">Drug History</label>
                        <div className="flex gap-2">
                          {["Yes", "No"].map(option => (
                            <button
                              key={option}
                              type="button"
                              onClick={() => setCurrentCase({
                                ...currentCase,
                                drugHistory: { ...currentCase.drugHistory, hasHistory: option }
                              })}
                              className={`flex-grow py-2 rounded-lg text-xs font-bold uppercase tracking-wider cursor-pointer border ${
                                currentCase.drugHistory.hasHistory === option
                                  ? "bg-brand-primary text-brand-beige border-brand-primary"
                                  : "bg-brand-beige text-brand-primary border-brand-light"
                              }`}
                            >
                              {option}
                            </button>
                          ))}
                        </div>
                        {currentCase.drugHistory.hasHistory === "Yes" && (
                          <input
                            type="text"
                            value={currentCase.drugHistory.details || ""}
                            onChange={(e) => setCurrentCase({
                              ...currentCase,
                              drugHistory: { ...currentCase.drugHistory, details: e.target.value }
                            })}
                            placeholder="Details of drugs..."
                            className="w-full bg-brand-beige border border-brand-light/50 px-3 py-2 rounded-lg text-xs mt-2"
                          />
                        )}
                      </div>

                      <div className="space-y-2">
                        <label className="block text-xs font-bold text-brand-primary uppercase tracking-wider">Addictions</label>
                        <select
                          value={currentCase.addiction || "None"}
                          onChange={(e) => handleTextChange("addiction", e.target.value)}
                          className="w-full bg-brand-beige border border-brand-light/50 px-3 py-2.5 rounded-lg text-xs focus:outline-none"
                        >
                          <option value="None">None</option>
                          <option value="Tobacco">Tobacco</option>
                          <option value="Smoking">Smoking</option>
                          <option value="Alcohol">Alcohol</option>
                          <option value="Multiple">Multiple Habits</option>
                        </select>
                      </div>

                      <div className="space-y-2">
                        <label className="block text-xs font-bold text-brand-primary uppercase tracking-wider">Stress Level</label>
                        <select
                          value={currentCase.stressLevel || "Moderate"}
                          onChange={(e) => handleTextChange("stressLevel", e.target.value)}
                          className="w-full bg-brand-beige border border-brand-light/50 px-3 py-2.5 rounded-lg text-xs focus:outline-none"
                        >
                          <option value="Low">Low</option>
                          <option value="Moderate">Moderate</option>
                          <option value="High">High / Severe</option>
                        </select>
                      </div>
                    </div>
                  </div>

                </div>
              )}

              {/* Tab 3: Ayur Core (Kshudha, Mala, sleep) */}
              {activeTab === "core" && (
                <div className="bg-brand-cream border border-brand-light/60 p-6 rounded-3xl space-y-6 shadow-sm">
                  <h3 className="font-serif text-xl font-bold text-brand-primary border-b border-brand-light/40 pb-2">
                    3. Ayurvedic Physiological Assessment (Koshtha & Sleep)
                  </h3>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-4">
                      <div>
                        <label className="block text-xs font-bold text-brand-primary uppercase tracking-wider mb-2">Kshudha (Appetite)</label>
                        <select
                          value={currentCase.kshudha}
                          onChange={(e) => handleTextChange("kshudha", e.target.value)}
                          className="w-full bg-brand-beige border border-brand-light/50 px-4 py-3 rounded-xl text-sm focus:outline-none"
                        >
                          <option value="Sama">Sama (Normal & Balanced)</option>
                          <option value="Manda">Manda (Slow/Low Digestion)</option>
                          <option value="Tikshna">Tikshna (Intense & Sharp)</option>
                          <option value="Vishama">Vishama (Irregular/Fluctuating)</option>
                        </select>
                      </div>

                      <div>
                        <label className="block text-xs font-bold text-brand-primary uppercase tracking-wider mb-2">Mutra (Urine)</label>
                        <select
                          value={currentCase.mutra}
                          onChange={(e) => handleTextChange("mutra", e.target.value)}
                          className="w-full bg-brand-beige border border-brand-light/50 px-4 py-3 rounded-xl text-sm focus:outline-none"
                        >
                          <option value="Normal">Normal Clear / Pale Yellow</option>
                          <option value="Alpa">Alpa (Scanty & Concentrated)</option>
                          <option value="Bahu">Bahu (Excessive Frequency)</option>
                          <option value="Daha">Daha (Burning Sensation)</option>
                        </select>
                      </div>

                      <div>
                        <label className="block text-xs font-bold text-brand-primary uppercase tracking-wider mb-2">Mala (Bowel Habits)</label>
                        <select
                          value={currentCase.mala}
                          onChange={(e) => handleTextChange("mala", e.target.value)}
                          className="w-full bg-brand-beige border border-brand-light/50 px-4 py-3 rounded-xl text-sm focus:outline-none"
                        >
                          <option value="Normal">Normal formed stool</option>
                          <option value="Baddha">Baddha (Constipated / Hard)</option>
                          <option value="Sristra">Sristra (Loose / Frequent)</option>
                          <option value="Grathita">Grathita (Scattered dry pellets)</option>
                        </select>
                      </div>
                    </div>

                    <div className="space-y-4">
                      <div>
                        <label className="block text-xs font-bold text-brand-primary uppercase tracking-wider mb-2">Koshtha (Gut Constitution)</label>
                        <select
                          value={currentCase.koshtha}
                          onChange={(e) => handleTextChange("koshtha", e.target.value)}
                          className="w-full bg-brand-beige border border-brand-light/50 px-4 py-3 rounded-xl text-sm focus:outline-none"
                        >
                          <option value="Madhya">Madhya (Moderate / Normal)</option>
                          <option value="Mridu">Mridu (Soft / Sensitive bowel)</option>
                          <option value="Kroora">Kroora (Hard bowel / Constipated)</option>
                        </select>
                      </div>

                      <div>
                        <label className="block text-xs font-bold text-brand-primary uppercase tracking-wider mb-2">Nidra (Sleep Quality)</label>
                        <select
                          value={currentCase.nidra}
                          onChange={(e) => handleTextChange("nidra", e.target.value)}
                          className="w-full bg-brand-beige border border-brand-light/50 px-4 py-3 rounded-xl text-sm focus:outline-none"
                        >
                          <option value="Normal">Normal Sound Sleep</option>
                          <option value="Alpa">Alpa Nidra (Insomnia/Disturbed)</option>
                          <option value="Ati">Ati Nidra (Excessive sleepiness)</option>
                        </select>
                      </div>

                      <div>
                        <label className="block text-xs font-bold text-brand-primary uppercase tracking-wider mb-2">Avastha (Metabolic State)</label>
                        <select
                          value={currentCase.avastha}
                          onChange={(e) => handleTextChange("avastha", e.target.value)}
                          className="w-full bg-brand-beige border border-brand-light/50 px-4 py-3 rounded-xl text-sm focus:outline-none"
                        >
                          <option value="Niraama">Niraama (Detoxified / No Ama)</option>
                          <option value="Saama">Saama (Toxin accumulation present)</option>
                        </select>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Tab 4: Diagnosis */}
              {activeTab === "diagnosis" && (
                <div className="bg-brand-cream border border-brand-light/60 p-6 rounded-3xl space-y-6 shadow-sm">
                  <h3 className="font-serif text-xl font-bold text-brand-primary border-b border-brand-light/40 pb-2">
                    4. Ayurvedic Diagnostic Assessment
                  </h3>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-xs font-bold text-brand-primary uppercase tracking-wider mb-2">Prakriti (Natural Constitution)</label>
                      <select
                        value={currentCase.prakriti}
                        onChange={(e) => handleTextChange("prakriti", e.target.value)}
                        className="w-full bg-brand-beige border border-brand-light/50 px-4 py-3 rounded-xl text-sm focus:outline-none"
                      >
                        <option value="Vata">Vata</option>
                        <option value="Pitta">Pitta</option>
                        <option value="Kapha">Kapha</option>
                        <option value="Vata-Pitta">Vata-Pitta</option>
                        <option value="Pitta-Kapha">Pitta-Kapha</option>
                        <option value="Vata-Kapha">Vata-Kapha</option>
                        <option value="Tridoshaja">Tridoshaja</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-brand-primary uppercase tracking-wider mb-2">Vikriti (Imbalance)</label>
                      <select
                        value={currentCase.vikriti}
                        onChange={(e) => handleTextChange("vikriti", e.target.value)}
                        className="w-full bg-brand-beige border border-brand-light/50 px-4 py-3 rounded-xl text-sm focus:outline-none"
                      >
                        <option value="Vata">Vata Imbalance</option>
                        <option value="Pitta">Pitta Imbalance</option>
                        <option value="Kapha">Kapha Imbalance</option>
                        <option value="Vata-Pitta">Vata-Pitta Imbalance</option>
                        <option value="Pitta-Kapha">Pitta-Kapha Imbalance</option>
                        <option value="Vata-Kapha">Vata-Kapha Imbalance</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-brand-primary uppercase tracking-wider mb-2">Samprapti (Pathogenesis)</label>
                      <select
                        value={currentCase.samprapti}
                        onChange={(e) => handleTextChange("samprapti", e.target.value)}
                        className="w-full bg-brand-beige border border-brand-light/50 px-4 py-3 rounded-xl text-sm focus:outline-none"
                      >
                        <option value="Agnimandya">Agnimandya (Weakened digestion fire)</option>
                        <option value="Ama-Sanchaya">Ama-Sanchaya (Toxin build up)</option>
                        <option value="Srotorodha">Srotorodha (Channel blockage)</option>
                        <option value="Dhatu-Kshaya">Dhatu-Kshaya (Tissue depletion)</option>
                        <option value="Custom">Other Custom Diagnosis</option>
                      </select>
                    </div>

                    {currentCase.samprapti === "Custom" && (
                      <div>
                        <label className="block text-xs font-bold text-brand-primary uppercase tracking-wider mb-2">Enter Custom Pathogenesis</label>
                        <input
                          type="text"
                          value={currentCase.sampraptiCustom || ""}
                          onChange={(e) => handleTextChange("sampraptiCustom", e.target.value)}
                          placeholder="e.g. Rasa-Vaha Srotas Dusti"
                          className="w-full bg-brand-beige border border-brand-light/50 px-4 py-3 rounded-xl text-sm focus:outline-none"
                        />
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Tab 5: Lifestyle */}
              {activeTab === "lifestyle" && (
                <div className="bg-brand-cream border border-brand-light/60 p-6 rounded-3xl space-y-6 shadow-sm">
                  <h3 className="font-serif text-xl font-bold text-brand-primary border-b border-brand-light/40 pb-2">
                    5. Lifestyle & Diet Habits
                  </h3>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-xs font-bold text-brand-primary uppercase tracking-wider mb-2">Diet Type</label>
                      <select
                        value={currentCase.diet || "Mixed"}
                        onChange={(e) => handleTextChange("diet", e.target.value)}
                        className="w-full bg-brand-beige border border-brand-light/50 px-4 py-3 rounded-xl text-sm focus:outline-none"
                      >
                        <option value="Vegetarian">Strict Vegetarian</option>
                        <option value="Mixed">Mixed (Non-Veg / Egg)</option>
                        <option value="Vegan">Vegan</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-brand-primary uppercase tracking-wider mb-2">Water Intake</label>
                      <select
                        value={currentCase.waterIntake || "Adequate"}
                        onChange={(e) => handleTextChange("waterIntake", e.target.value)}
                        className="w-full bg-brand-beige border border-brand-light/50 px-4 py-3 rounded-xl text-sm focus:outline-none"
                      >
                        <option value="Adequate">Adequate (~2-3 Litres)</option>
                        <option value="Low">Low / Insufficient</option>
                        <option value="Excessive">Excessive (&gt;4 Litres)</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-brand-primary uppercase tracking-wider mb-2">Viruddha Ahara (Incompatible Diet)</label>
                      <select
                        value={currentCase.viruddhaAhara || "No"}
                        onChange={(e) => handleTextChange("viruddhaAhara", e.target.value)}
                        className="w-full bg-brand-beige border border-brand-light/50 px-4 py-3 rounded-xl text-sm focus:outline-none"
                      >
                        <option value="No">No / Rarely</option>
                        <option value="Yes">Yes (Regular combinations e.g. milk+fish, cold+hot)</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-brand-primary uppercase tracking-wider mb-2">Divaswap (Day Sleep)</label>
                      <select
                        value={currentCase.divaswap || "No"}
                        onChange={(e) => handleTextChange("divaswap", e.target.value)}
                        className="w-full bg-brand-beige border border-brand-light/50 px-4 py-3 rounded-xl text-sm focus:outline-none"
                      >
                        <option value="No">No / Never</option>
                        <option value="Yes">Yes (Regular day sleep post meals)</option>
                      </select>
                    </div>
                  </div>
                </div>
              )}

              {/* Tab 6: Prescription */}
              {activeTab === "treatment" && (
                <div className="space-y-6 animate-fadeIn">
                  
                  {/* Ayurvedic presets panel */}
                  <div className="bg-brand-cream border border-brand-light/60 p-5 rounded-3xl space-y-3 shadow-sm">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-brand-primary block">
                      Rapid Entry Presets (Rx Formulary)
                    </span>
                    <div className="flex flex-wrap gap-2">
                      {MEDICINE_PRESETS.map((name) => (
                        <button
                          key={name}
                          type="button"
                          onClick={() => addMedicinePreset(name)}
                          className="bg-brand-beige hover:bg-brand-light border border-brand-light/65 text-brand-primary px-3 py-2 rounded-xl text-xs font-semibold transition-all cursor-pointer"
                        >
                          + {name}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Medicines table */}
                  <div className="bg-brand-cream border border-brand-light/60 p-6 rounded-3xl space-y-4 shadow-sm">
                    <div className="flex justify-between items-center border-b border-brand-light/40 pb-2">
                      <h3 className="font-serif text-xl font-bold text-brand-primary">
                        6. Advised Prescription (Rx Formulation)
                      </h3>
                      <button
                        onClick={addMedicine}
                        className="flex items-center gap-1 bg-brand-primary text-brand-beige px-3.5 py-1.5 rounded-lg text-xs font-bold uppercase tracking-wider cursor-pointer"
                      >
                        <Plus size={14} /> Add Row
                      </button>
                    </div>

                    <div className="space-y-4">
                      {currentCase.medicines.map((med, index) => (
                        <div key={index} className="grid grid-cols-1 md:grid-cols-12 gap-3 bg-brand-beige/25 p-3.5 rounded-2xl border border-brand-light/35 items-center">
                          
                          <div className="md:col-span-4">
                            <label className="block text-[9px] uppercase tracking-wider font-bold text-brand-secondary mb-1">Medicine Name</label>
                            <input
                              type="text"
                              value={med.name}
                              onChange={(e) => updateMedicine(index, "name", e.target.value)}
                              placeholder="e.g. Triphala Churna"
                              className="w-full bg-brand-beige border border-brand-light/50 px-3.5 py-2.5 rounded-xl text-xs focus:outline-none"
                            />
                          </div>

                          <div className="md:col-span-3">
                            <label className="block text-[9px] uppercase tracking-wider font-bold text-brand-secondary mb-1">Dosage Frequency</label>
                            <input
                              type="text"
                              value={med.dose}
                              onChange={(e) => updateMedicine(index, "dose", e.target.value)}
                              placeholder="e.g. 1 tab BD / 5gm HS"
                              className="w-full bg-brand-beige border border-brand-light/50 px-3 py-2.5 rounded-xl text-xs focus:outline-none"
                            />
                          </div>

                          <div className="md:col-span-3">
                            <label className="block text-[9px] uppercase tracking-wider font-bold text-brand-secondary mb-1">Administration (Kala)</label>
                            <input
                              type="text"
                              value={med.kala}
                              onChange={(e) => updateMedicine(index, "kala", e.target.value)}
                              placeholder="e.g. After meals / Early morning"
                              className="w-full bg-brand-beige border border-brand-light/50 px-3 py-2.5 rounded-xl text-xs focus:outline-none"
                            />
                          </div>

                          <div className="md:col-span-1.5">
                            <label className="block text-[9px] uppercase tracking-wider font-bold text-brand-secondary mb-1">Anupana</label>
                            <input
                              type="text"
                              value={med.anupana}
                              onChange={(e) => updateMedicine(index, "anupana", e.target.value)}
                              placeholder="Warm water"
                              className="w-full bg-brand-beige border border-brand-light/50 px-3 py-2.5 rounded-xl text-xs focus:outline-none"
                            />
                          </div>

                          <div className="md:col-span-0.5 justify-self-center pt-3 md:pt-0">
                            <button
                              onClick={() => removeMedicine(index)}
                              disabled={currentCase.medicines.length === 1}
                              className="text-brand-dark/40 hover:text-red-500 p-2 disabled:opacity-30 cursor-pointer"
                            >
                              <Trash2 size={16} />
                            </button>
                          </div>

                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Panchakarma advise */}
                  <div className="bg-brand-cream border border-brand-light/60 p-6 rounded-3xl space-y-4 shadow-sm">
                    <h4 className="font-serif text-lg font-bold text-brand-primary border-b border-brand-light/40 pb-2">
                      Panchakarma Detox Therapy Advice
                    </h4>
                    <div>
                      <select
                        value={currentCase.panchakarma || "None"}
                        onChange={(e) => handleTextChange("panchakarma", e.target.value)}
                        className="w-full bg-brand-beige border border-brand-light/50 px-4 py-3 rounded-xl text-sm focus:outline-none"
                      >
                        <option value="None">No Panchakarma Advised</option>
                        <option value="Vamana">Vamana (Therapeutic emesis)</option>
                        <option value="Virechana">Virechana (Purgation therapy)</option>
                        <option value="Basti">Basti (Enema therapies - Anuvasana / Niruha)</option>
                        <option value="Nasya">Nasya (Nasal instillations)</option>
                        <option value="Raktamokshana">Raktamokshana (Blood letting)</option>
                        <option value="Abhyanga-Swedana">Abhyanga & Swedana (Oleation & Sudation)</option>
                        <option value="Shirodhara">Shirodhara (Oil pouring on forehead)</option>
                      </select>
                    </div>
                  </div>

                </div>
              )}

              {/* Tab 7: Labs & Follow-up */}
              {activeTab === "labs" && (
                <div className="space-y-6">
                  
                  {/* Lab Investigation Panels */}
                  <div className="bg-brand-cream border border-brand-light/60 p-6 rounded-3xl space-y-4 shadow-sm">
                    <div className="flex justify-between items-center border-b border-brand-light/40 pb-2 flex-wrap gap-2">
                      <h3 className="font-serif text-xl font-bold text-brand-primary">
                        7. Lab Investigations & Blood Chemistry
                      </h3>
                      <div className="flex gap-2">
                        <button
                          type="button"
                          onClick={() => addLabPanel("Glycemic")}
                          className="bg-brand-beige border border-brand-light/60 hover:bg-brand-light text-brand-primary px-3 py-1.5 rounded-lg text-xs font-semibold cursor-pointer"
                        >
                          + Glycemic Panel
                        </button>
                        <button
                          type="button"
                          onClick={() => addLabPanel("Lipid")}
                          className="bg-brand-beige border border-brand-light/60 hover:bg-brand-light text-brand-primary px-3 py-1.5 rounded-lg text-xs font-semibold cursor-pointer"
                        >
                          + Lipid Panel
                        </button>
                        <button
                          type="button"
                          onClick={addCustomLabRow}
                          className="bg-brand-primary text-brand-beige hover:bg-brand-secondary px-3 py-1.5 rounded-lg text-xs font-semibold cursor-pointer"
                        >
                          + Custom Test
                        </button>
                      </div>
                    </div>

                    {currentCase.labTests.length === 0 ? (
                      <div className="text-center py-8 text-xs text-brand-dark/50 italic font-sans">
                        No lab parameters added. Click a panel preset above or add a custom test.
                      </div>
                    ) : (
                      <div className="space-y-3">
                        {currentCase.labTests.map((t, index) => {
                          const isCustom = t.range === "Custom";
                          return (
                            <div key={index} className="flex gap-4 items-center flex-wrap md:flex-nowrap bg-brand-beige/25 p-3 rounded-xl border border-brand-light/35">
                              <div className="flex-grow min-w-[200px]">
                                <label className="block text-[8px] uppercase tracking-wider font-bold text-brand-secondary mb-1">Test Parameter</label>
                                <input
                                  type="text"
                                  value={t.testName}
                                  readOnly={!isCustom}
                                  onChange={(e) => updateCustomLabField(index, "testName", e.target.value)}
                                  className="w-full bg-brand-beige border border-brand-light/50 px-3 py-2 rounded-lg text-xs focus:outline-none read-only:opacity-80"
                                />
                              </div>

                              <div className="w-32">
                                <label className="block text-[8px] uppercase tracking-wider font-bold text-brand-secondary mb-1">Measured Value</label>
                                <input
                                  type="text"
                                  value={t.value}
                                  onChange={(e) => updateLabTestValue(index, e.target.value)}
                                  placeholder="e.g. 98.4"
                                  className="w-full bg-brand-beige border border-brand-light/50 px-3 py-2 rounded-lg text-xs font-bold focus:outline-none"
                                />
                              </div>

                              <div className="w-28">
                                <label className="block text-[8px] uppercase tracking-wider font-bold text-brand-secondary mb-1">Normal Range</label>
                                <input
                                  type="text"
                                  value={t.range}
                                  readOnly={!isCustom}
                                  onChange={(e) => updateCustomLabField(index, "range", e.target.value)}
                                  className="w-full bg-brand-beige border border-brand-light/50 px-3 py-2 rounded-lg text-[10px] focus:outline-none read-only:opacity-85 text-center"
                                />
                              </div>

                              <div className="w-20">
                                <label className="block text-[8px] uppercase tracking-wider font-bold text-brand-secondary mb-1">Unit</label>
                                <input
                                  type="text"
                                  value={t.unit}
                                  readOnly={!isCustom}
                                  onChange={(e) => updateCustomLabField(index, "unit", e.target.value)}
                                  className="w-full bg-brand-beige border border-brand-light/50 px-2 py-2 rounded-lg text-[10px] focus:outline-none read-only:opacity-85 text-center"
                                />
                              </div>

                              <button
                                onClick={() => removeLabTest(index)}
                                className="text-brand-dark/40 hover:text-red-500 p-2 cursor-pointer"
                              >
                                <Trash2 size={15} />
                              </button>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>

                  {/* Follow up outcomes */}
                  <div className="bg-brand-cream border border-brand-light/60 p-6 rounded-3xl space-y-4 shadow-sm">
                    <h3 className="font-serif text-lg font-bold text-brand-primary border-b border-brand-light/40 pb-2">
                      Clinical Vitals & Follow-Up Outcomes
                    </h3>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div>
                        <label className="block text-xs font-bold text-brand-primary uppercase tracking-wider mb-2">Patient Progress Score (Clinical Outcomes)</label>
                        <select
                          value={currentCase.outcomeScore}
                          onChange={(e) => handleTextChange("outcomeScore", e.target.value)}
                          className="w-full bg-brand-beige border border-brand-light/50 px-4 py-3 rounded-xl text-sm focus:outline-none"
                        >
                          <option value="5">5/5 - Complete Recovery / Cured</option>
                          <option value="4">4/5 - Significant Improvement</option>
                          <option value="3">3/5 - Stable / Moderate Relief</option>
                          <option value="2">2/5 - No Relief / Same status</option>
                          <option value="1">1/5 - Worsened Symptom status</option>
                        </select>
                      </div>

                      <div>
                        <label className="block text-xs font-bold text-brand-primary uppercase tracking-wider mb-2">Dietary Advice / Notes (Pathya-Apathya)</label>
                        <textarea
                          rows={3}
                          value={currentCase.notes}
                          onChange={(e) => handleTextChange("notes", e.target.value)}
                          placeholder="e.g. Avoid dairy, take warm soup, walk 30 mins..."
                          className="w-full bg-brand-beige border border-brand-light/50 px-4 py-3 rounded-xl text-sm focus:outline-none resize-none"
                        />
                      </div>
                    </div>
                  </div>

                </div>
              )}

              {/* Next / Prev Tab buttons */}
              <div className="flex justify-between items-center py-6 border-t border-brand-light/40 mt-8">
                <button
                  onClick={() => setActiveTab(getPrevTab())}
                  disabled={!getPrevTab()}
                  className="flex items-center gap-1 bg-brand-beige hover:bg-brand-light border border-brand-light px-5 py-3 rounded-xl text-xs font-bold uppercase tracking-wider transition-colors disabled:opacity-30 cursor-pointer"
                >
                  <ArrowLeft size={14} /> Back
                </button>
                {getNextTab() ? (
                  <button
                    onClick={() => setActiveTab(getNextTab())}
                    className="flex items-center gap-1.5 bg-brand-primary text-brand-beige hover:bg-brand-secondary px-6 py-3 rounded-xl text-xs font-bold uppercase tracking-wider transition-colors shadow-md cursor-pointer"
                  >
                    Next <ArrowRight size={14} />
                  </button>
                ) : (
                  <button
                    onClick={() => saveCase()}
                    className="flex items-center gap-1.5 bg-brand-secondary text-brand-beige hover:bg-brand-primary px-6 py-3 rounded-xl text-xs font-bold uppercase tracking-wider transition-colors shadow-md cursor-pointer"
                  >
                    <Save size={14} /> Save Patient Case File
                  </button>
                )}
              </div>

            </div>
          )}

          {/* ==================== VIEW 2: DATABASE ANALYTICS ==================== */}
          {viewMode === "analytics" && (
            <div className="space-y-8 animate-fadeIn">
              
              {/* Stat Cards Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                <div className="bg-brand-cream border border-brand-light/60 p-6 rounded-3xl shadow-sm text-center relative overflow-hidden">
                  <div className="absolute top-0 left-0 w-2 h-full bg-brand-primary" />
                  <span className="text-[10px] uppercase font-bold tracking-widest text-brand-secondary block mb-1">Total Consultations</span>
                  <span className="font-serif text-4xl font-extrabold text-brand-primary block">{analytics.totalCases}</span>
                  <span className="text-[10px] text-brand-dark/50 mt-1 block">Case files saved in database</span>
                </div>

                <div className="bg-brand-cream border border-brand-light/60 p-6 rounded-3xl shadow-sm text-center relative overflow-hidden">
                  <div className="absolute top-0 left-0 w-2 h-full bg-brand-secondary" />
                  <span className="text-[10px] uppercase font-bold tracking-widest text-brand-secondary block mb-1">Unique Patients</span>
                  <span className="font-serif text-4xl font-extrabold text-brand-primary block">{analytics.totalPatients}</span>
                  <span className="text-[10px] text-brand-dark/50 mt-1 block">Registered in clinic registry</span>
                </div>
              </div>

              {/* Charts grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                
                {/* Age & Gender Distribution */}
                <div className="bg-brand-cream border border-brand-light/60 p-6 rounded-3xl space-y-6 shadow-sm">
                  <h3 className="font-serif text-lg font-bold text-brand-primary border-b border-brand-light/40 pb-2">
                    Demographic Distribution
                  </h3>

                  {/* Gender Progress Bars */}
                  <div className="space-y-3">
                    <span className="text-[11px] font-bold text-brand-secondary uppercase tracking-wider block">Gender Distribution</span>
                    {Object.entries(analytics.genderCounts).map(([gender, count]) => {
                      const percentage = analytics.totalCases > 0 ? Math.round((count / analytics.totalCases) * 100) : 0;
                      return (
                        <div key={gender} className="space-y-1">
                          <div className="flex justify-between text-xs font-semibold text-brand-dark">
                            <span>{gender}</span>
                            <span>{count} ({percentage}%)</span>
                          </div>
                          <div className="w-full bg-brand-beige rounded-full h-2.5 overflow-hidden border border-brand-light/35">
                            <div 
                              className={`h-full rounded-full ${gender === "Male" ? "bg-brand-primary" : gender === "Female" ? "bg-brand-secondary" : "bg-brand-accent"}`} 
                              style={{ width: `${percentage}%` }}
                            />
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  {/* Age Groups progress bars */}
                  <div className="space-y-3 pt-2">
                    <span className="text-[11px] font-bold text-brand-secondary uppercase tracking-wider block">Age Groups</span>
                    {Object.entries(analytics.ageCounts).map(([group, count]) => {
                      const percentage = analytics.totalCases > 0 ? Math.round((count / analytics.totalCases) * 100) : 0;
                      return (
                        <div key={group} className="space-y-1">
                          <div className="flex justify-between text-xs font-semibold text-brand-dark">
                            <span>{group} Yrs</span>
                            <span>{count} ({percentage}%)</span>
                          </div>
                          <div className="w-full bg-brand-beige rounded-full h-2 overflow-hidden border border-brand-light/30">
                            <div 
                              className="bg-brand-secondary/85 h-full rounded-full" 
                              style={{ width: `${percentage}%` }}
                            />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Prakriti & Agni Constitutions */}
                <div className="bg-brand-cream border border-brand-light/60 p-6 rounded-3xl space-y-6 shadow-sm">
                  <h3 className="font-serif text-lg font-bold text-brand-primary border-b border-brand-light/40 pb-2">
                    Ayurvedic Constitution Analysis
                  </h3>

                  {/* Prakriti distribution bars */}
                  <div className="space-y-3">
                    <span className="text-[11px] font-bold text-brand-secondary uppercase tracking-wider block">Prakriti (Metabolic Type)</span>
                    {Object.keys(analytics.prakritiCounts).length === 0 ? (
                      <p className="text-xs text-brand-dark/50 italic">No Prakriti data recorded yet.</p>
                    ) : (
                      Object.entries(analytics.prakritiCounts).map(([prak, count]) => {
                        const percentage = analytics.totalCases > 0 ? Math.round((count / analytics.totalCases) * 100) : 0;
                        return (
                          <div key={prak} className="space-y-1">
                            <div className="flex justify-between text-xs font-semibold text-brand-dark">
                              <span className="font-medium text-emerald-950">{prak}</span>
                              <span>{count} case{count > 1 ? "s" : ""} ({percentage}%)</span>
                            </div>
                            <div className="w-full bg-brand-beige rounded-full h-2 overflow-hidden border border-brand-light/30">
                              <div 
                                className="bg-brand-primary h-full rounded-full" 
                                style={{ width: `${percentage}%` }}
                              />
                            </div>
                          </div>
                        );
                      })
                    )}
                  </div>

                  {/* Agni distribution */}
                  <div className="space-y-3 pt-2">
                    <span className="text-[11px] font-bold text-brand-secondary uppercase tracking-wider block">Jatharagni (Digestive Power)</span>
                    {Object.keys(analytics.agniCounts).length === 0 ? (
                      <p className="text-xs text-brand-dark/50 italic">No Agni data recorded yet.</p>
                    ) : (
                      Object.entries(analytics.agniCounts).map(([agni, count]) => {
                        const percentage = analytics.totalCases > 0 ? Math.round((count / analytics.totalCases) * 100) : 0;
                        return (
                          <div key={agni} className="space-y-1">
                            <div className="flex justify-between text-xs font-semibold text-brand-dark">
                              <span>{agni} Agni</span>
                              <span>{count} ({percentage}%)</span>
                            </div>
                            <div className="w-full bg-brand-beige rounded-full h-2 overflow-hidden border border-brand-light/30">
                              <div 
                                className="bg-brand-accent h-full rounded-full" 
                                style={{ width: `${percentage}%` }}
                              />
                            </div>
                          </div>
                        );
                      })
                    )}
                  </div>
                </div>
              </div>

              {/* Top Complaints Card */}
              <div className="bg-brand-cream border border-brand-light/60 p-6 rounded-3xl shadow-sm">
                <h3 className="font-serif text-lg font-bold text-brand-primary border-b border-brand-light/40 pb-2 mb-4">
                  Top Symptoms & Health Complaints
                </h3>
                {analytics.complaintCounts.length === 0 ? (
                  <p className="text-xs text-brand-dark/50 italic text-center py-6">No patient complaints registered in database yet.</p>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {analytics.complaintCounts.map(([complaint, count], idx) => {
                      const pct = Math.round((count / analytics.totalCases) * 100);
                      return (
                        <div key={complaint} className="flex justify-between items-center bg-brand-beige/35 border border-brand-light/45 px-4 py-3 rounded-2xl">
                          <div className="flex items-center space-x-3">
                            <span className="h-7 w-7 rounded-full bg-brand-primary/10 border border-brand-light flex items-center justify-center font-bold text-xs text-brand-primary">
                              #{idx + 1}
                            </span>
                            <span className="text-xs font-bold text-brand-primary capitalize">{complaint}</span>
                          </div>
                          <span className="text-xs font-bold text-brand-secondary bg-brand-light/50 px-3 py-1 rounded-full border border-brand-secondary/15">
                            {count} occurrence{count > 1 ? "s" : ""} ({pct}%)
                          </span>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

            </div>
          )}

          {/* ==================== VIEW 3: ALERTS & FOLLOW-UPS ==================== */}
          {viewMode === "followups" && (
            <div className="space-y-8 animate-fadeIn">
              
              {/* Vitals & Lab Chemistry Alerts */}
              <div className="bg-brand-cream border border-brand-light/60 p-6 rounded-3xl space-y-4 shadow-sm">
                <h3 className="font-serif text-lg font-bold text-red-800 border-b border-brand-light/40 pb-2 flex items-center gap-2">
                  <AlertTriangle className="text-red-500 animate-pulse" size={20} />
                  <span>Clinical Lab alerts & Borderline Vitals</span>
                </h3>

                {alerts.length === 0 ? (
                  <div className="text-center py-8 text-xs text-brand-dark/55 italic font-sans">
                    No critical lab elevations or alerts flagged in patient database.
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {alerts.map((al, idx) => (
                      <div key={idx} className={`p-4 rounded-2xl border flex flex-col justify-between space-y-3 shadow-sm ${
                        al.severity === "Critical" ? "bg-red-50/50 border-red-200" : "bg-amber-50/40 border-amber-250"
                      }`}>
                        <div className="flex justify-between items-start">
                          <div>
                            <h4 className="font-serif font-bold text-brand-primary text-sm">{al.patientName}</h4>
                            <p className="text-[10px] text-brand-secondary font-semibold uppercase">{al.mobile}</p>
                          </div>
                          <span className={`text-[9px] font-extrabold uppercase px-2 py-0.5 rounded-full border ${
                            al.severity === "Critical" ? "bg-red-100 text-red-800 border-red-300 animate-pulse" : "bg-amber-100 text-amber-800 border-amber-300"
                          }`}>
                            {al.severity}
                          </span>
                        </div>
                        <div className="bg-brand-cream/80 border border-brand-light/60 p-2.5 rounded-xl text-xs space-y-1">
                          <p className="text-brand-dark/70">
                            <strong>Parameter:</strong> {al.parameter}
                          </p>
                          <p className="text-brand-primary font-bold">
                            <strong>Measured Value:</strong> <span className={al.severity === "Critical" ? "text-red-600" : "text-amber-600"}>{al.measured}</span>
                          </p>
                          <p className="text-brand-dark/60 text-[10px]">
                            Normal Reference: {al.normalRange}
                          </p>
                        </div>
                        <div className="text-[10px] text-brand-dark/55 flex justify-between items-center">
                          <span>Reported: {new Date(al.visitDate).toLocaleDateString()}</span>
                          <a
                            href={`https://wa.me/91${al.mobile}?text=Hello%20${encodeURIComponent(al.patientName)}%2C%20this%20is%20Dr.%20Neha's%20clinic.%20We%20are%20reviewing%20your%20recent%20lab%20report%20for%20${encodeURIComponent(al.parameter)}.%20The%20measured%20value%20is%20${encodeURIComponent(al.measured)}.%20Please%20let%20us%20know%20when%20you%20can%20schedule%20a%20follow-up%20review.`}
                            target="_blank"
                            rel="noreferrer"
                            className="flex items-center gap-1 text-green-700 hover:text-green-800 font-bold uppercase tracking-wider"
                          >
                            <MessageCircle size={12} /> Contact Patient
                          </a>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Follow-up Reminders */}
              <div className="bg-brand-cream border border-brand-light/60 p-6 rounded-3xl space-y-4 shadow-sm">
                <h3 className="font-serif text-lg font-bold text-brand-primary border-b border-brand-light/40 pb-2 flex items-center gap-2">
                  <Calendar className="text-brand-secondary" size={20} />
                  <span>Clinical Follow-Up Reminders</span>
                </h3>

                {followups.length === 0 ? (
                  <div className="text-center py-8 text-xs text-brand-dark/55 italic font-sans">
                    No patients currently marked due for clinical follow-up reviews.
                  </div>
                ) : (
                  <div className="space-y-3">
                    {followups.map((f, idx) => (
                      <div key={idx} className="p-4 bg-brand-beige/25 border border-brand-light/40 rounded-2xl flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 hover:shadow-md transition-all">
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <h4 className="font-serif font-bold text-brand-primary text-base">{f.name}</h4>
                            <span className="text-[9px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-brand-light text-brand-primary border border-brand-secondary/15">
                              Last Visit: {f.daysAgo} Days Ago
                            </span>
                            {f.outcome <= 2 && (
                              <span className="text-[9px] font-extrabold uppercase px-2 py-0.5 rounded-full bg-red-50 text-red-700 border border-red-250">
                                Low Outcome Score ({f.outcome}/5)
                              </span>
                            )}
                          </div>
                          <p className="text-xs text-brand-secondary font-semibold uppercase">{f.mobile}</p>
                          <p className="text-xs text-brand-dark/75">
                            <strong>Chief Complaint:</strong> {f.reason}
                          </p>
                        </div>
                        <a
                          href={`https://wa.me/91${f.mobile}?text=Hello%20${encodeURIComponent(f.name)}%2C%20this%20is%20Dr.%20Neha's%20clinic%20(Ayurkaya).%20We%20are%20reviewing%20your%20recent%20consultation%20record%20for%20${encodeURIComponent(f.reason)}.%20How%20is%20your%20progress%20with%20your%20treatments%3F%20Please%20let%20us%20know%20if%20you%20need%20to%20coordinate%20a%20follow-up%20review.`}
                          target="_blank"
                          rel="noreferrer"
                          className="bg-green-600 hover:bg-green-700 text-white px-4 py-2.5 rounded-xl text-xs font-bold uppercase tracking-wider transition-colors inline-flex items-center gap-2 shadow-sm shrink-0 cursor-pointer self-stretch sm:self-center text-center justify-center"
                        >
                          <MessageCircle size={14} /> Send WhatsApp Reminder
                        </a>
                      </div>
                    ))}
                  </div>
                )}
              </div>

            </div>
          )}

          {/* ==================== VIEW 4: DATABASE TOOLS ==================== */}
          {viewMode === "utilities" && (
            <div className="bg-brand-cream border border-brand-light/60 p-6 md:p-10 rounded-3xl space-y-8 shadow-sm animate-fadeIn">
              
              <div className="border-b border-brand-light/45 pb-4 space-y-2">
                <h3 className="font-serif text-2xl font-bold text-brand-primary flex items-center gap-2">
                  <Database size={24} className="text-brand-secondary" />
                  <span>DBMS Backup, Restore & Clear Utilities</span>
                </h3>
                <p className="text-xs text-brand-dark/70 font-sans leading-relaxed">
                  IndexedDB stores data securely in your local browser sandbox. To protect against browser cleaning or disk failures, we highly recommend exporting regular JSON backups.
                </p>
              </div>

              {/* Utility grid */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                
                {/* 1. Export */}
                <div className="bg-brand-beige/20 border border-brand-light/45 p-6 rounded-2xl space-y-4 flex flex-col justify-between">
                  <div className="space-y-2">
                    <Download className="text-brand-primary" size={28} />
                    <h4 className="font-serif font-bold text-base text-brand-primary">1. Backup Database</h4>
                    <p className="text-xs text-brand-dark/65 leading-relaxed font-sans">
                      Download all saved case sheets, registries, and waiting list patients as a single JSON file.
                    </p>
                  </div>
                  <button
                    onClick={handleExportBackup}
                    className="w-full bg-brand-primary text-brand-beige hover:bg-brand-secondary py-3 rounded-xl text-xs font-bold uppercase tracking-wider transition-colors shadow-sm cursor-pointer mt-4"
                  >
                    Export JSON Backup
                  </button>
                </div>

                {/* 2. Import */}
                <div className="bg-brand-beige/20 border border-brand-light/45 p-6 rounded-2xl space-y-4 flex flex-col justify-between relative">
                  <div className="space-y-2">
                    <Upload className="text-brand-secondary" size={28} />
                    <h4 className="font-serif font-bold text-base text-brand-primary">2. Restore Database</h4>
                    <p className="text-xs text-brand-dark/65 leading-relaxed font-sans">
                      Select a previously exported JSON backup file to override the database and restore files.
                    </p>
                  </div>
                  <div className="relative mt-4">
                    <input
                      type="file"
                      accept=".json"
                      onChange={handleImportBackup}
                      className="absolute inset-0 opacity-0 w-full h-full cursor-pointer"
                      id="db-backup-file-selector"
                    />
                    <button
                      type="button"
                      className="w-full bg-brand-secondary text-brand-beige hover:bg-brand-primary py-3 rounded-xl text-xs font-bold uppercase tracking-wider transition-colors shadow-sm pointer-events-none text-center"
                    >
                      Import JSON Restore
                    </button>
                  </div>
                </div>

                {/* 3. Clear */}
                <div className="bg-brand-beige/20 border border-brand-light/45 p-6 rounded-2xl space-y-4 flex flex-col justify-between">
                  <div className="space-y-2">
                    <AlertTriangle className="text-red-500 animate-pulse" size={28} />
                    <h4 className="font-serif font-bold text-base text-brand-primary">3. Reset Database</h4>
                    <p className="text-xs text-brand-dark/65 leading-relaxed font-sans">
                      Delete all patient data records and registries. Passcode verification required.
                    </p>
                  </div>
                  <button
                    onClick={handleResetDatabase}
                    className="w-full bg-red-600 hover:bg-red-700 text-white py-3 rounded-xl text-xs font-bold uppercase tracking-wider transition-colors shadow-sm cursor-pointer mt-4"
                  >
                    Clear Database Sheets
                  </button>
                </div>

              </div>

              {/* Status Info box */}
              <div className="bg-brand-beige/40 border border-brand-light/45 p-4.5 rounded-2xl flex items-start space-x-3 text-xs text-brand-dark/85 leading-relaxed">
                <Shield className="text-brand-secondary shrink-0 mt-0.5" size={16} />
                <div>
                  <strong>DBMS Security & Privacy Notice:</strong> All data transactions occur strictly client-side inside the local IndexedDB container. No patient case sheets, symptoms, diagnostics, or prescriptions are uploaded to any external server. To backup or transfer data, use the Export/Import tool above.
                </div>
              </div>

            </div>
          )}

        </div>

      </div>

      {/* Floating Action Buttons for iPad / Touch Convenience */}
      {viewMode === "clinical" && (
        <div className="fixed bottom-6 right-6 flex flex-col gap-3 z-30 lg:hidden print:hidden">
          <button
            onClick={() => {
              if (!currentCase.name.trim()) {
                triggerNotification("Must save patient profile with a name first!");
                return;
              }
              setIsPrintMode(true);
            }}
            className="h-12 w-12 rounded-full bg-brand-primary text-brand-beige shadow-xl flex items-center justify-center hover:scale-105 active:scale-95 transition-transform cursor-pointer border border-brand-light/35 animate-fadeIn"
            title="Generate Rx / Print"
          >
            <Printer size={20} />
          </button>
          <button
            onClick={saveCase}
            className="h-12 w-12 rounded-full bg-brand-secondary text-brand-beige shadow-xl flex items-center justify-center hover:scale-105 active:scale-95 transition-transform cursor-pointer border border-brand-light/35 animate-fadeIn"
            title="Save Record"
          >
            <Save size={20} />
          </button>
        </div>
      )}

      {/* Patient History Collapsible Drawer */}
      {showHistoryDrawer && (
        <div 
          className="fixed inset-0 bg-brand-dark/25 backdrop-blur-xs z-40 transition-opacity duration-300"
          onClick={() => setShowHistoryDrawer(false)}
        />
      )}

      <div className={`fixed inset-y-0 right-0 z-50 w-full sm:w-[460px] bg-brand-cream border-l border-brand-light/60 shadow-2xl flex flex-col transition-transform duration-300 ease-in-out ${
        showHistoryDrawer ? "translate-x-0" : "translate-x-full"
      }`}>
        {/* Drawer Header */}
        <div className="p-5 border-b border-brand-light/60 flex justify-between items-center bg-brand-cream/95 backdrop-blur-xs sticky top-0 z-10 shrink-0">
          <div>
            <h3 className="font-serif font-bold text-brand-primary text-base">Patient Clinical History</h3>
            <p className="text-[10px] text-brand-secondary font-semibold uppercase">{currentCase.name} ({currentCase.patientId})</p>
          </div>
          <button 
            onClick={() => setShowHistoryDrawer(false)}
            className="text-brand-dark hover:text-red-600 p-2 cursor-pointer font-bold text-xs uppercase tracking-widest transition-colors"
          >
            ✕ Close
          </button>
        </div>

        {/* Drawer Content */}
        <div className="flex-grow overflow-y-auto p-5 space-y-6">
          
          {/* 1. Demographics & Chronics Lock */}
          <div className="bg-brand-beige/20 border border-brand-light/45 p-4.5 rounded-2xl space-y-3 shadow-xs">
            <span className="text-[9px] font-extrabold uppercase tracking-widest text-brand-secondary block">
              Patient Registry Card
            </span>
            <div className="grid grid-cols-2 gap-2 text-xs">
              <div>
                <span className="text-gray-400 block text-[9px] uppercase font-bold">Age & Gender</span>
                <span className="font-bold text-brand-primary">{currentCase.age || "N/A"} Yrs / {currentCase.gender}</span>
              </div>
              <div>
                <span className="text-gray-400 block text-[9px] uppercase font-bold">Contact Mobile</span>
                <span className="font-bold text-brand-primary">{currentCase.mobile || "N/A"}</span>
              </div>
              <div className="col-span-2 pt-1.5 border-t border-brand-light/20 mt-1">
                <span className="text-gray-400 block text-[9px] uppercase font-bold">Past Chronic History Checklist</span>
                <div className="flex flex-wrap gap-1.5 mt-1.5">
                  {Object.entries(currentCase.pastHistory || {})
                    .filter(([key, val]) => val && key !== "others")
                    .map(([key]) => (
                      <span key={key} className="bg-red-50 text-red-700 border border-red-200 px-2 py-0.5 rounded-full text-[9px] font-extrabold uppercase">
                        {key === "htn" ? "Hypertension" : key}
                      </span>
                    ))}
                  {currentCase.pastHistory?.others && (
                    <span className="bg-brand-light/35 text-brand-primary border border-brand-secondary/15 px-2 py-0.5 rounded-full text-[9px] font-bold">
                      {currentCase.pastHistory.others}
                    </span>
                  )}
                  {Object.entries(currentCase.pastHistory || {}).filter(([k, v]) => v).length === 0 && (
                    <span className="text-gray-400 italic text-[11px]">No active conditions in checklist</span>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* 2. All Historical Problems (Extracted from all visits) */}
          <div className="space-y-2">
            <span className="text-[9px] font-extrabold uppercase tracking-widest text-brand-secondary block">
              All Symptoms & Complaints (Aggregated)
            </span>
            <div className="flex flex-wrap gap-1.5">
              {(() => {
                const uniqueProblems = new Set();
                
                // Add current active complaints
                (currentCase.complaints || []).forEach(c => {
                  if (c.text?.trim()) uniqueProblems.add(c.text.trim().toLowerCase());
                });

                // Add past visit complaints
                (currentCase.visits || []).forEach(v => {
                  (v.complaints || []).forEach(c => {
                    if (c.text?.trim()) uniqueProblems.add(c.text.trim().toLowerCase());
                  });
                });

                if (uniqueProblems.size === 0) {
                  return <span className="text-xs text-brand-dark/50 italic font-sans">No complaints logged yet.</span>;
                }

                return Array.from(uniqueProblems).map((problem, idx) => (
                  <span 
                    key={idx} 
                    className="bg-brand-primary/10 border border-brand-light text-brand-primary px-2.5 py-1 rounded-xl text-xs font-bold capitalize"
                  >
                    {problem}
                  </span>
                ));
              })()}
            </div>
          </div>

          {/* 3. Detailed Visit History Timeline */}
          <div className="space-y-3.5">
            <span className="text-[9px] font-extrabold uppercase tracking-widest text-brand-secondary block">
              Archived Visit Timeline ({currentCase.visits?.length || 0})
            </span>
            
            {(!currentCase.visits || currentCase.visits.length === 0) ? (
              <div className="text-center py-8 border border-dashed border-brand-light/60 rounded-2xl text-xs text-brand-dark/40 font-sans italic">
                No historical visits recorded. Follow-up entries appear here once archived.
              </div>
            ) : (
              <div className="space-y-4">
                {currentCase.visits.map((v, idx) => (
                  <div key={v.visitId || idx} className="bg-brand-beige/15 border border-brand-light/35 p-4 rounded-2xl space-y-3 hover:shadow-xs transition-shadow">
                    
                    <div className="flex justify-between items-center flex-wrap gap-1.5 border-b border-brand-light/20 pb-1.5">
                      <span className="font-serif font-bold text-brand-primary text-xs">
                        {new Date(v.visitDate).toLocaleDateString("en-US", { day: 'numeric', month: 'short', year: 'numeric' })}
                      </span>
                      <div className="flex items-center gap-2">
                        <span className={`text-[9px] font-extrabold px-1.5 py-0.5 rounded-full ${
                          v.outcomeScore >= 4 ? "bg-green-50 text-green-700 border border-green-200" :
                          v.outcomeScore === 3 ? "bg-amber-50 text-amber-700 border border-amber-250" :
                          "bg-rose-50 text-rose-700 border border-rose-250"
                        }`}>
                          Progress: {v.outcomeScore}/5
                        </span>
                        <button
                          type="button"
                          onClick={() => copyPastVisitDetails(v)}
                          className="text-[9px] font-extrabold text-brand-primary hover:text-brand-secondary border border-brand-primary/20 px-2 py-0.5 rounded-lg transition-colors bg-white flex items-center gap-1 uppercase cursor-pointer"
                          title="Copy prescriptions to active editor"
                        >
                          <RefreshCw size={8} /> Copy Rx
                        </button>
                      </div>
                    </div>

                    <div className="space-y-2 text-xs font-sans">
                      <div>
                        <strong className="text-[9px] uppercase tracking-wider text-brand-secondary block">Diagnosis:</strong>
                        <span className="font-semibold text-brand-dark/85">
                          {v.prakriti} ({v.vikriti} Imbalance) • {v.agni} Agni • {v.avastha}
                        </span>
                      </div>

                      {v.complaints && v.complaints.filter(c => c.text).length > 0 && (
                        <div>
                          <strong className="text-[9px] uppercase tracking-wider text-brand-secondary block">Complaints:</strong>
                          <ul className="list-disc pl-4 text-brand-dark/80 space-y-0.5">
                            {v.complaints.map((c, i) => (
                              <li key={i}>{c.text}</li>
                            ))}
                          </ul>
                        </div>
                      )}

                      {v.medicines && v.medicines.filter(m => m.name).length > 0 && (
                        <div>
                          <strong className="text-[9px] uppercase tracking-wider text-brand-secondary block">Advised Rx:</strong>
                          <div className="bg-white/80 border border-brand-light/30 rounded-xl p-2 font-mono text-[10px] text-brand-dark/90 mt-1 max-h-[100px] overflow-y-auto space-y-0.5">
                            {v.medicines.map((m, i) => (
                              <div key={i} className="truncate">
                                • {m.name} ({m.dose} — {m.kala})
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {v.notes && (
                        <div>
                          <strong className="text-[9px] uppercase tracking-wider text-brand-secondary block">Diet & Notes:</strong>
                          <p className="italic text-brand-dark/75">"{v.notes}"</p>
                        </div>
                      )}
                    </div>

                  </div>
                ))}
              </div>
            )}
          </div>

        </div>
      </div>
    </div>
  );
}
