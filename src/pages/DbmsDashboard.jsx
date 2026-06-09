import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  User, Plus, Trash2, Search, Printer, Save, RefreshCw, LogOut,
  PlusCircle, ArrowLeft, ArrowRight, Database, BarChart3, Bell,
  Shield, Download, Upload, AlertTriangle, Calendar, Menu,
  History, X, Stethoscope, FlaskConical, ClipboardList, Pill,
  TrendingUp, CheckCircle, Clock, Activity, ChevronRight, Users,
  Zap, FileText, Settings
} from "lucide-react";
import SEO from "../components/SEO";
import { getAllItems, putItem, deleteItem, clearStore, migrateFromLocalStorage } from "../lib/db";

/* ─── HELPERS ───────────────────────────────────────────────────── */
const getDurationString = (d) => {
  if (!d) return "";
  const onset = new Date(d), now = new Date();
  if (isNaN(onset.getTime())) return "";
  onset.setHours(0,0,0,0); now.setHours(0,0,0,0);
  const days = Math.floor((now - onset) / 86400000);
  if (days < 0) return "Future date";
  if (days === 0) return "Today";
  if (days === 1) return "1 day";
  if (days < 30) return `${days} days`;
  const m = Math.floor(days / 30.4);
  if (m < 12) return `${m} month${m > 1 ? "s" : ""}`;
  const y = Math.floor(m / 12), r = m % 12;
  return r === 0 ? `${y}yr` : `${y}y ${r}m`;
};
const calcScore = (prog, complaints) => {
  if (!complaints?.length) return "3";
  let total = 0, count = 0;
  complaints.forEach(c => {
    if (!c.text?.trim()) return;
    const s = prog[c.text.trim()] || "Stable";
    total += s==="Cured"?5:s==="Improved"?4:s==="Stable"?3:1.5; count++;
  });
  return count === 0 ? "3" : String(Math.round(total / count));
};
const fmtDate = (iso) => {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString("en-IN", { day:"2-digit", month:"short", year:"numeric" });
};

/* ─── PRESETS ────────────────────────────────────────────────────── */
const MED_PRESETS = ["Triphala Churna","Chandraprabha Vati","Gandharvahastadi Kashayam","Arogyavardhini Vati","Mahanarayan Tailam","Ashwagandhadi Churna","Kanchanar Guggulu","Kaishore Guggulu","Shatavari Ghrita","Dashmoolarishta","Trikatu Churna","Avipattikar Churna"];
const COMPLAINT_PRESETS = ["Bloating / Ajeerna","Acidity / Amlapitta","Constipation / Vibandha","Cough / Kasa","Joint Pain / Sandhishoola","Lower Back Pain / Katishoola","Insomnia / Anidra","Fatigue / Klama","Skin Rash / Twak Vikara","Headache / Shirashoola","Stress & Anxiety","Hair Loss / Khalitya"];
const LAB_PANELS = {
  Glycemic: [{testName:"Fasting Blood Sugar (FBS)",value:"",range:"70–100",unit:"mg/dL"},{testName:"Post-Prandial Blood Sugar (PPBS)",value:"",range:"<140",unit:"mg/dL"},{testName:"HbA1c",value:"",range:"4.0–5.6",unit:"%"}],
  Lipid: [{testName:"Total Cholesterol",value:"",range:"125–200",unit:"mg/dL"},{testName:"Triglycerides",value:"",range:"<150",unit:"mg/dL"},{testName:"HDL",value:"",range:">40",unit:"mg/dL"},{testName:"LDL",value:"",range:"<100",unit:"mg/dL"}],
  LFT: [{testName:"SGOT (AST)",value:"",range:"5–40",unit:"U/L"},{testName:"SGPT (ALT)",value:"",range:"7–56",unit:"U/L"},{testName:"Total Bilirubin",value:"",range:"0.1–1.2",unit:"mg/dL"},{testName:"ALP",value:"",range:"44–147",unit:"U/L"}],
  KFT: [{testName:"Serum Creatinine",value:"",range:"0.5–1.2",unit:"mg/dL"},{testName:"BUN",value:"",range:"7–20",unit:"mg/dL"},{testName:"Uric Acid",value:"",range:"2.4–6.0",unit:"mg/dL"}],
};
const DEFAULT = {
  patientId:"",name:"",age:"",gender:"Male",mobile:"",occupation:"",
  complaints:[{text:"",onsetDate:""}], complaintsProgress:{},
  kshudha:"Sama",mutra:"Normal",mala:"Normal",koshtha:"Madhya",nidra:"Normal",avastha:"Niraama",
  pastHistory:{diabetes:false,htn:false,thyroid:false,asthma:false,obesity:false,gut:false,others:""},
  drugHistory:{hasHistory:"No",details:""},
  familyHistory:{diabetes:false,htn:false,thyroid:false,others:""},
  addiction:"None",vegaDharana:{mutra:false,mala:false,nidra:false},workType:"Mixed",stressLevel:"Moderate",
  prakriti:"Vata-Pitta",vikriti:"Vata",
  dosha:{vata:true,pitta:false,kapha:false},
  dushya:{rasa:true,rakta:false,mamsa:false,meda:false,asthi:false,majja:false,shukra:false},
  srotas:{annavaha:true,pranavaha:false,rasavaha:false,raktavaha:false,medovaha:false,mutravaha:false,purishavaha:false},
  agni:"Sama",samprapti:"Agnimandya",sampraptiCustom:"",
  diet:"Mixed",appetite:"Normal",sleep:"Good",activity:"Moderate",divaswap:"No",waterIntake:"Adequate",viruddhaAhara:"No",junkFood:"Occasional",
  medicines:[{name:"",dose:"1 tab BD",kala:"After food",anupana:"Warm water"}],
  panchakarma:"None",followUpSymptoms:"Same",followUpAgni:"Same",followUpTreatment:"Continued",
  outcomeScore:"3",labTests:[],notes:"",visitDate:"",visits:[],
};

/* ─── SCORE BADGE ────────────────────────────────────────────────── */
const ScoreBadge = ({ score }) => {
  const s = parseInt(score);
  const cfg = s>=5?{bg:"#d1fae5",color:"#065f46",label:"Cured"}:s===4?{bg:"#dbeafe",color:"#1e40af",label:"Improved"}:s===3?{bg:"#fef3c7",color:"#92400e",label:"Stable"}:s===2?{bg:"#fee2e2",color:"#991b1b",label:"No Relief"}:{bg:"#fee2e2",color:"#991b1b",label:"Worsened"};
  return <span style={{padding:"2px 10px",borderRadius:99,fontSize:10,fontWeight:700,textTransform:"uppercase",letterSpacing:"0.06em",background:cfg.bg,color:cfg.color}}>{s}/5 · {cfg.label}</span>;
};

/* ─── PROGRESS BADGE ─────────────────────────────────────────────── */
const PBadge = ({ s }) => {
  const cfg = {Cured:{bg:"#d1fae5",c:"#065f46"},Improved:{bg:"#dbeafe",c:"#1e40af"},Stable:{bg:"#fef3c7",c:"#92400e"},Worse:{bg:"#fee2e2",c:"#991b1b"}};
  const x = cfg[s]||{bg:"#f3f4f6",c:"#6b7280"};
  return <span style={{padding:"1px 7px",borderRadius:99,fontSize:9,fontWeight:700,textTransform:"uppercase",background:x.bg,color:x.c}}>{s}</span>;
};

/* ─── SECTION HEADER ─────────────────────────────────────────────── */
const SH = ({ num, title, sub, action }) => (
  <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:20}}>
    <div style={{display:"flex",alignItems:"center",gap:12}}>
      {num&&<span style={{width:28,height:28,borderRadius:8,background:"linear-gradient(135deg,#059669,#0d9488)",display:"flex",alignItems:"center",justifyContent:"center",fontSize:12,fontWeight:800,color:"#fff",flexShrink:0}}>{num}</span>}
      <div>
        <h3 style={{fontSize:15,fontWeight:700,color:"#111827",margin:0}}>{title}</h3>
        {sub&&<p style={{fontSize:11,color:"#6b7280",marginTop:2}}>{sub}</p>}
      </div>
    </div>
    {action}
  </div>
);

/* ─── INPUT / SELECT STYLES ─────────────────────────────────────── */
const inp = {background:"#f9fafb",border:"1.5px solid #e5e7eb",borderRadius:10,padding:"10px 14px",fontSize:13,color:"#111827",width:"100%",outline:"none",fontFamily:"Inter,sans-serif",transition:"border-color 0.2s,box-shadow 0.2s"};
const sel = {...inp,appearance:"none",backgroundImage:`url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='%236b7280' stroke-width='2'%3E%3Cpath d='m6 9 6 6 6-6'/%3E%3C/svg%3E")`,backgroundRepeat:"no-repeat",backgroundPosition:"right 14px center",paddingRight:36,cursor:"pointer"};
const lbl = {display:"block",fontSize:10,fontWeight:700,letterSpacing:"0.08em",textTransform:"uppercase",color:"#6b7280",marginBottom:6};
const card = {background:"#fff",border:"1.5px solid #f0f0f0",borderRadius:16,padding:"22px 24px",marginBottom:18,boxShadow:"0 1px 4px rgba(0,0,0,0.06),0 4px 16px rgba(0,0,0,0.04)"};

/* ═══════════════════════════════════════════════════════════════════
   MAIN COMPONENT
   ═══════════════════════════════════════════════════════════════════ */
export default function DbmsDashboard() {
  const navigate = useNavigate();
  const [isAuth, setIsAuth]             = useState(false);
  const [view, setView]                 = useState("clinical");
  const [activeTab, setActiveTab]       = useState("profile");
  const [savedCases, setSavedCases]     = useState([]);
  const [current, setCurrent]           = useState({...DEFAULT});
  const [searchTerm, setSearchTerm]     = useState("");
  const [matches, setMatches]           = useState([]);
  const [isPrint, setIsPrint]           = useState(false);
  const [toast, setToast]               = useState(null); // {msg,type}
  const [sideOpen, setSideOpen]         = useState(true);
  const [histOpen, setHistOpen]         = useState(false);
  const [liveQueue, setLiveQueue]       = useState([]);

  /* Auth */
  useEffect(() => {
    if (localStorage.getItem("ayurkaya_doctor_logged_in")==="true") setIsAuth(true);
    else navigate("/login");
  },[navigate]);

  /* Load data */
  useEffect(() => {
    if (!isAuth) return;
    (async()=>{
      await migrateFromLocalStorage();
      const cases = await getAllItems("cases");
      cases.sort((a,b)=>new Date(b.visitDate||0)-new Date(a.visitDate||0));
      setSavedCases(cases);
      const queue = await getAllItems("queue");
      setLiveQueue(queue);
      const draft = localStorage.getItem("ayurkaya_workspace_draft");
      if (draft) { try { setCurrent(JSON.parse(draft)); notify("Draft restored","info"); } catch{} }
    })();
  },[isAuth]);

  /* Auto-save draft */
  useEffect(() => {
    if (!isAuth) return;
    const hasData = current.name?.trim()||(current.complaints?.length>1||current.complaints?.[0]?.text);
    if (hasData) localStorage.setItem("ayurkaya_workspace_draft",JSON.stringify(current));
    else localStorage.removeItem("ayurkaya_workspace_draft");
  },[current,isAuth]);

  /* Mobile lookup — no auto-fill */
  useEffect(()=>{
    const clean=(current.mobile||"").replace(/\D/g,"");
    if (clean.length===10 && !current.patientId) {
      (async()=>{ try { const r=await getAllItems("registry"); setMatches(r.filter(x=>(x.mobile||"").replace(/\D/g,"")===clean)); } catch{} })();
    } else setMatches([]);
  },[current.mobile,current.patientId]);

  /* Helpers */
  const notify=(msg,type="success")=>{setToast({msg,type});setTimeout(()=>setToast(null),3200);};
  const set=(f,v)=>setCurrent(p=>({...p,[f]:v}));
  const setGrp=(g,k,v)=>setCurrent(p=>({...p,[g]:{...p[g],[k]:v}}));

  /* ID gen */
  const genId=async()=>{
    const c=await getAllItems("cases"),r=await getAllItems("registry");
    const ids=new Set([...c.map(x=>x.patientId),...r.map(x=>x.patientId)]);
    let max=0; ids.forEach(id=>{if(id?.startsWith("PAT-")){const n=parseInt(id.slice(4));if(n>max)max=n;}});
    return `PAT-${String(max+1).padStart(8,"0")}`;
  };

  /* Complaint ops */
  const addC=()=>setCurrent(p=>({...p,complaints:[...p.complaints,{text:"",onsetDate:""}]}));
  const updC=(i,f,v)=>setCurrent(p=>{const a=[...p.complaints];a[i][f]=v;return{...p,complaints:a};});
  const remC=(i)=>setCurrent(p=>({...p,complaints:p.complaints.length>1?p.complaints.filter((_,idx)=>idx!==i):[{text:"",onsetDate:""}]}));
  const preC=(t)=>setCurrent(p=>{const a=[...p.complaints];const today=new Date().toISOString().split("T")[0];const e=a.findIndex(c=>!c.text);if(e!==-1){a[e]={text:t,onsetDate:today};return{...p,complaints:a};}return{...p,complaints:[...a,{text:t,onsetDate:today}]};});

  /* Medicine ops */
  const addM=()=>setCurrent(p=>({...p,medicines:[...p.medicines,{name:"",dose:"1 tab BD",kala:"After food",anupana:"Warm water"}]}));
  const updM=(i,f,v)=>setCurrent(p=>{const a=[...p.medicines];a[i][f]=v;return{...p,medicines:a};});
  const remM=(i)=>setCurrent(p=>({...p,medicines:p.medicines.length>1?p.medicines.filter((_,idx)=>idx!==i):p.medicines}));
  const preM=(n)=>setCurrent(p=>{const a=[...p.medicines];const e=a.findIndex(m=>!m.name);if(e!==-1){a[e].name=n;return{...p,medicines:a};}return{...p,medicines:[...a,{name:n,dose:"1 tab BD",kala:"After food",anupana:"Warm water"}]};});

  /* Lab ops */
  const addPanel=(panel)=>setCurrent(p=>{const ex=new Set(p.labTests.map(t=>t.testName));const nw=(LAB_PANELS[panel]||[]).filter(t=>!ex.has(t.testName));if(!nw.length){notify(`${panel} panel already added`,"info");return p;}notify(`${panel} panel added`);return{...p,labTests:[...p.labTests,...JSON.parse(JSON.stringify(nw))]};});
  const updLab=(i,v)=>setCurrent(p=>{const a=[...p.labTests];a[i].value=v;return{...p,labTests:a};});
  const updLabF=(i,f,v)=>setCurrent(p=>{const a=[...p.labTests];a[i][f]=v;return{...p,labTests:a};});
  const remLab=(i)=>setCurrent(p=>({...p,labTests:p.labTests.filter((_,idx)=>idx!==i)}));

  /* Save case */
  const saveCase=async()=>{
    if(!current.name?.trim()){notify("Patient name is required","error");setActiveTab("profile");return;}
    let cases=[...savedCases];
    let updated={...current};
    const mob=(updated.mobile||"").replace(/\D/g,"");
    if(updated.patientId){
      updated.visitDate=updated.visitDate||new Date().toISOString();
      cases=cases.map(c=>c.patientId===updated.patientId?updated:c);
      await putItem("cases",updated);
      if(mob.length===10) await putItem("registry",{patientId:updated.patientId,name:updated.name,age:updated.age,gender:updated.gender,mobile:mob,occupation:updated.occupation,updatedAt:new Date().toISOString()});
      notify("Record updated ✓");
    } else {
      const id=await genId();
      updated.patientId=id;updated.visitDate=new Date().toISOString();
      await putItem("cases",updated);
      if(mob.length===10) await putItem("registry",{patientId:id,name:updated.name,age:updated.age,gender:updated.gender,mobile:mob,occupation:updated.occupation,updatedAt:new Date().toISOString()});
      cases=[updated,...cases];setCurrent(updated);
      notify(`New record — ${id} ✓`);
    }
    cases.sort((a,b)=>new Date(b.visitDate||0)-new Date(a.visitDate||0));
    setSavedCases(cases);
  };

  /* Follow-up */
  const recordFollowUp=async()=>{
    if(!current.patientId){notify("Save patient first","error");return;}
    try {
      const snap={visitId:"VIS-"+Date.now(),visitDate:current.visitDate||new Date().toISOString(),complaints:JSON.parse(JSON.stringify(current.complaints||[])),complaintsProgress:JSON.parse(JSON.stringify(current.complaintsProgress||{})),kshudha:current.kshudha,mutra:current.mutra,mala:current.mala,koshtha:current.koshtha,nidra:current.nidra,avastha:current.avastha,prakriti:current.prakriti,vikriti:current.vikriti,dosha:JSON.parse(JSON.stringify(current.dosha||{})),dushya:JSON.parse(JSON.stringify(current.dushya||{})),srotas:JSON.parse(JSON.stringify(current.srotas||{})),agni:current.agni,samprapti:current.samprapti,sampraptiCustom:current.sampraptiCustom,diet:current.diet,appetite:current.appetite,sleep:current.sleep,activity:current.activity,divaswap:current.divaswap,waterIntake:current.waterIntake,viruddhaAhara:current.viruddhaAhara,junkFood:current.junkFood,medicines:JSON.parse(JSON.stringify(current.medicines||[])),panchakarma:current.panchakarma,followUpSymptoms:current.followUpSymptoms,followUpAgni:current.followUpAgni,followUpTreatment:current.followUpTreatment,outcomeScore:current.outcomeScore,notes:current.notes,labTests:JSON.parse(JSON.stringify(current.labTests||[]))};
      const carried=(current.complaints||[]).filter(c=>c.text&&(current.complaintsProgress||{})[c.text.trim()]!=="Cured");
      const newState={...current,visitDate:new Date().toISOString(),visits:[snap,...(current.visits||[])],complaints:carried.length?carried.map(c=>({text:c.text,onsetDate:c.onsetDate})):[{text:"",onsetDate:""}],complaintsProgress:{},outcomeScore:"3",notes:"",followUpSymptoms:"Same",followUpAgni:"Same",followUpTreatment:"Continued"};
      setCurrent(newState);
      await putItem("cases",newState);
      const cl=savedCases.map(c=>c.patientId===current.patientId?newState:c);
      cl.sort((a,b)=>new Date(b.visitDate||0)-new Date(a.visitDate||0));
      setSavedCases(cl);
      notify("Follow-up started ✓");setActiveTab("complaints");
    } catch(e){console.error(e);notify("Failed","error");}
  };

  /* Load patient */
  const selectCase=(c)=>{setCurrent({...c});setView("clinical");setActiveTab("profile");setMatches([]);notify(`Loaded — ${c.name}`);};
  const loadFromReg=(p)=>{const ex=savedCases.find(c=>c.patientId===p.patientId);if(ex){selectCase(ex);return;}setCurrent(prev=>({...prev,patientId:p.patientId,name:p.name,age:p.age,gender:p.gender,mobile:p.mobile||prev.mobile,occupation:p.occupation,visits:[]}));setMatches([]);notify(`Profile loaded — ${p.name}`);};
  const updateRegistry=async()=>{const mob=(current.mobile||"").replace(/\D/g,"");if(mob.length!==10){notify("Valid 10-digit mobile needed","error");return;}if(!current.name?.trim()){notify("Name required","error");return;}let pid=current.patientId;if(!pid){pid=await genId();setCurrent(p=>({...p,patientId:pid}));}await putItem("registry",{patientId:pid,name:current.name,age:current.age,gender:current.gender,mobile:mob,occupation:current.occupation,updatedAt:new Date().toISOString()});notify("Registry updated ✓");};

  /* Delete */
  const delCase=async(id,e)=>{e.stopPropagation();if(!window.confirm("Delete this record permanently?"))return;await deleteItem("cases",id);setSavedCases(prev=>prev.filter(c=>c.patientId!==id));if(current.patientId===id)setCurrent({...DEFAULT});notify("Deleted");};

  /* New / family */
  const startNew=()=>{setCurrent({...DEFAULT});setView("clinical");setActiveTab("profile");setMatches([]);notify("Workspace cleared");};
  const startFamily=()=>{const m=current.mobile;setCurrent({...DEFAULT,mobile:m});setMatches([]);notify("New profile — same number");};

  /* Copy visit */
  const copyVisit=(v)=>{setCurrent(p=>({...p,complaints:JSON.parse(JSON.stringify(v.complaints||[])),kshudha:v.kshudha,mutra:v.mutra,mala:v.mala,koshtha:v.koshtha,nidra:v.nidra,avastha:v.avastha,prakriti:v.prakriti,vikriti:v.vikriti,dosha:JSON.parse(JSON.stringify(v.dosha||{})),dushya:JSON.parse(JSON.stringify(v.dushya||{})),srotas:JSON.parse(JSON.stringify(v.srotas||{})),agni:v.agni,samprapti:v.samprapti,sampraptiCustom:v.sampraptiCustom,diet:v.diet,appetite:v.appetite,sleep:v.sleep,activity:v.activity,divaswap:v.divaswap,waterIntake:v.waterIntake,viruddhaAhara:v.viruddhaAhara,junkFood:v.junkFood,medicines:JSON.parse(JSON.stringify(v.medicines||[])),panchakarma:v.panchakarma,labTests:JSON.parse(JSON.stringify(v.labTests||[]))}));notify(`Rx from ${fmtDate(v.visitDate)} copied`);};

  /* Export / Import / Reset */
  const doExport=async()=>{const c=await getAllItems("cases"),r=await getAllItems("registry"),q=await getAllItems("queue");const b=new Blob([JSON.stringify({version:2,exportedAt:new Date().toISOString(),cases:c,registry:r,queue:q},null,2)],{type:"application/json"});const u=URL.createObjectURL(b);const a=document.createElement("a");a.href=u;a.download=`ayurkaya_backup_${new Date().toISOString().split("T")[0]}.json`;a.click();URL.revokeObjectURL(u);notify("Exported ✓");};
  const doImport=async(e)=>{const f=e.target.files?.[0];if(!f)return;const reader=new FileReader();reader.onload=async(ev)=>{try{const d=JSON.parse(ev.target.result);if(!d.version||!Array.isArray(d.cases)){alert("Invalid file");return;}await clearStore("cases");await clearStore("registry");await clearStore("queue");for(const c of d.cases)await putItem("cases",c);if(Array.isArray(d.registry))for(const r of d.registry)await putItem("registry",r);if(Array.isArray(d.queue))for(const q of d.queue)await putItem("queue",q);const cases=await getAllItems("cases");cases.sort((a,b)=>new Date(b.visitDate||0)-new Date(a.visitDate||0));setSavedCases(cases);notify("Restored ✓");e.target.value=null;}catch{alert("Failed to parse file.");}};reader.readAsText(f);};
  const doReset=async()=>{const code=prompt("Enter passcode (1008) to reset:");if(code!=="1008"){if(code!==null)alert("Wrong passcode");return;}if(!window.confirm("Delete ALL records?"))return;await clearStore("cases");await clearStore("registry");await clearStore("queue");setSavedCases([]);setLiveQueue([]);setCurrent({...DEFAULT});notify("Database cleared");};

  /* Analytics */
  const getAnalytics=()=>{const gc={Male:0,Female:0,Other:0},pc={},cc={};savedCases.forEach(c=>{gc[c.gender]=(gc[c.gender]||0)+1;const p=c.prakriti||"Vata-Pitta";pc[p]=(pc[p]||0)+1;(c.complaints||[]).forEach(x=>{if(x.text?.trim()){const t=x.text.trim().toLowerCase();cc[t]=(cc[t]||0)+1;}});});const mobs=new Set(savedCases.map(c=>c.mobile).filter(Boolean));return{total:savedCases.length,patients:mobs.size,gc,pc,topComplaints:Object.entries(cc).sort((a,b)=>b[1]-a[1]).slice(0,6)};};
  const getAlerts=()=>{const alerts=[],followups=[],now=new Date();savedCases.forEach(c=>{(c.labTests||[]).forEach(t=>{const v=parseFloat(t.value);if(isNaN(v))return;if(t.testName.includes("HbA1c")&&v>5.6)alerts.push({name:c.name,param:t.testName,val:`${v}%`,sev:v>=6.5?"Critical":"Warning"});if(t.testName.includes("Total Cholesterol")&&v>200)alerts.push({name:c.name,param:t.testName,val:`${v} mg/dL`,sev:v>=240?"Critical":"Warning"});if(t.testName.includes("Fasting Blood Sugar")&&v>100)alerts.push({name:c.name,param:t.testName,val:`${v} mg/dL`,sev:v>=126?"Critical":"Warning"});if(t.testName.includes("Serum Creatinine")&&v>1.2)alerts.push({name:c.name,param:t.testName,val:`${v} mg/dL`,sev:v>=1.5?"Critical":"Warning"});});if(c.visitDate){const diff=Math.floor((now-new Date(c.visitDate))/86400000);const score=parseInt(c.outcomeScore||"3");if((diff>=21||score<=2)&&!followups.some(f=>f.mobile===c.mobile))followups.push({name:c.name,mobile:c.mobile,daysAgo:diff,score,complaint:c.complaints?.[0]?.text||"General"});}});return{alerts,followups};};

  /* Tabs */
  const TABS=[{id:"profile",icon:User,label:"Profile"},{id:"complaints",icon:ClipboardList,label:"Complaints"},{id:"core",icon:Activity,label:"Ayur Core"},{id:"diagnosis",icon:Stethoscope,label:"Diagnosis"},{id:"lifestyle",icon:TrendingUp,label:"Lifestyle"},{id:"treatment",icon:Pill,label:"Prescription"},{id:"labs",icon:FlaskConical,label:"Labs & F/U"}];
  const tabIdx=TABS.findIndex(t=>t.id===activeTab);
  const prevTab=tabIdx>0?TABS[tabIdx-1].id:null;
  const nextTab=tabIdx<TABS.length-1?TABS[tabIdx+1].id:null;
  const filtered=savedCases.filter(c=>(c.name||"").toLowerCase().includes(searchTerm.toLowerCase())||(c.patientId||"").toLowerCase().includes(searchTerm.toLowerCase()));
  const {alerts,followups}=getAlerts();
  const analytics=getAnalytics();

  if (!isAuth) return <div style={{display:"flex",alignItems:"center",justifyContent:"center",minHeight:"100vh",background:"#f9fafb"}}><div style={{width:36,height:36,border:"3px solid #e5e7eb",borderTopColor:"#059669",borderRadius:"50%",animation:"spin 0.8s linear infinite"}} /></div>;

  /* ── PRINT VIEW ── */
  if (isPrint) return (
    <div className="bg-white text-gray-900 min-h-screen p-8 max-w-3xl mx-auto font-sans space-y-5 print:p-4">
      <SEO title={`Rx — ${current.name}`} description="Prescription" />
      <div className="flex justify-between items-center print:hidden pb-4 border-b">
        <button onClick={()=>setIsPrint(false)} className="text-sm font-bold text-emerald-700">← Back</button>
        <button onClick={()=>window.print()} className="px-5 py-2 bg-emerald-700 text-white rounded-lg text-sm font-bold">Print / PDF</button>
      </div>
      <div className="border-2 border-emerald-800 rounded-xl p-6 space-y-5">
        <div className="flex justify-between border-b pb-4">
          <div><h1 className="text-2xl font-black text-emerald-900">AYURKAYA</h1><p className="text-xs text-gray-500 font-semibold uppercase tracking-wider">Ayurvedic Integrative Wellness Center</p></div>
          <div className="text-right"><p className="font-bold text-emerald-900">Dr. Neha, B.A.M.S</p><p className="text-xs text-gray-500">Chief Consultant</p></div>
        </div>
        <div className="grid grid-cols-4 gap-3 bg-emerald-50 rounded-lg p-3 text-xs">{[["ID",current.patientId||"N/A"],["Name",current.name],["Age/Gender",`${current.age}y/${current.gender}`],["Date",fmtDate(current.visitDate||new Date().toISOString())]].map(([l,v])=><div key={l}><p className="text-gray-400 font-semibold uppercase text-[10px]">{l}</p><p className="font-bold mt-0.5">{v}</p></div>)}</div>
        <div><h4 className="font-bold text-emerald-900 border-b pb-1 mb-2 text-sm uppercase">Chief Complaints</h4><ul className="list-disc pl-4 text-sm text-gray-700 space-y-0.5">{current.complaints.filter(c=>c.text).map((c,i)=><li key={i}><strong>{c.text}</strong>{c.onsetDate?` — since ${getDurationString(c.onsetDate)}`:""}</li>)}</ul></div>
        <div><h4 className="font-bold text-emerald-900 border-b pb-1 mb-2 text-sm uppercase">💊 Prescription</h4><table className="w-full text-xs border-collapse"><thead><tr className="bg-emerald-50 text-emerald-900 font-bold"><th className="p-2 text-left">Medicine</th><th className="p-2">Dose</th><th className="p-2">Kala</th><th className="p-2">Anupana</th></tr></thead><tbody className="divide-y">{current.medicines.filter(m=>m.name).map((m,i)=><tr key={i}><td className="p-2 font-semibold text-emerald-900">{m.name}</td><td className="p-2 text-center">{m.dose}</td><td className="p-2 text-center">{m.kala}</td><td className="p-2 text-center italic">{m.anupana}</td></tr>)}</tbody></table></div>
        {current.notes&&<div className="bg-gray-50 border rounded-lg p-3 text-xs italic text-gray-600">"{current.notes}"</div>}
      </div>
    </div>
  );

  /* ─────────────────────────────────────────
     MAIN RENDER — PREMIUM LIGHT DESIGN
     ───────────────────────────────────────── */
  return (
    <div style={{display:"flex",height:"100vh",overflow:"hidden",background:"#f4f6f8",fontFamily:"Inter,sans-serif",position:"fixed",inset:0}}>
      <SEO title="HMIS — Ayurkaya" description="Ayurkaya clinical management system" />

      {/* ══ TOAST ══ */}
      {toast && (
        <div style={{position:"fixed",top:20,right:24,zIndex:9999,padding:"12px 20px",borderRadius:12,fontSize:13,fontWeight:600,boxShadow:"0 8px 30px rgba(0,0,0,0.12)",background:toast.type==="error"?"#fff1f2":toast.type==="info"?"#eff6ff":"#f0fdf4",color:toast.type==="error"?"#b91c1c":toast.type==="info"?"#1d4ed8":"#065f46",border:`1.5px solid ${toast.type==="error"?"#fecaca":toast.type==="info"?"#bfdbfe":"#a7f3d0"}`,animation:"fadeSlideUp 0.3s ease both"}} className="anim-pop">
          {toast.msg}
        </div>
      )}

      {/* ══ SIDEBAR ══ */}
      {sideOpen && (
        <div style={{width:256,minWidth:256,background:"#fff",borderRight:"1.5px solid #f0f0f0",display:"flex",flexDirection:"column",overflow:"hidden",boxShadow:"2px 0 8px rgba(0,0,0,0.04)"}}>

          {/* Logo */}
          <div style={{padding:"20px 18px 16px",borderBottom:"1.5px solid #f0f0f0"}}>
            <div style={{display:"flex",alignItems:"center",gap:10}}>
              <div style={{width:38,height:38,borderRadius:12,background:"linear-gradient(135deg,#059669,#0d9488)",display:"flex",alignItems:"center",justifyContent:"center",boxShadow:"0 4px 12px rgba(5,150,105,0.3)"}}>
                <Stethoscope size={19} color="#fff" />
              </div>
              <div>
                <p style={{fontSize:14,fontWeight:800,color:"#111827",letterSpacing:"-0.02em"}}>AYURKAYA</p>
                <p style={{fontSize:9,fontWeight:700,color:"#9ca3af",letterSpacing:"0.12em",textTransform:"uppercase"}}>HMIS Portal</p>
              </div>
            </div>
          </div>

          {/* Nav */}
          <div style={{padding:"10px 10px 6px",borderBottom:"1.5px solid #f0f0f0"}}>
            {[{id:"clinical",icon:FileText,label:"Workspace",badge:null},{id:"analytics",icon:BarChart3,label:"Analytics",badge:analytics.total||null},{id:"alerts",icon:Bell,label:"Alerts",badge:(alerts.length+followups.length)||null},{id:"utilities",icon:Database,label:"DB Tools",badge:null}].map(n=>(
              <button key={n.id} onClick={()=>setView(n.id)} style={{display:"flex",alignItems:"center",gap:10,padding:"9px 12px",borderRadius:10,border:"none",cursor:"pointer",width:"100%",marginBottom:3,background:view===n.id?"linear-gradient(135deg,#f0fdf4,#ecfdf5)":"transparent",color:view===n.id?"#065f46":"#6b7280",fontWeight:view===n.id?700:500,fontSize:13,transition:"all 0.15s",boxShadow:view===n.id?"inset 0 0 0 1.5px #a7f3d0":"none"}}>
                <n.icon size={15} />
                <span style={{flex:1,textAlign:"left"}}>{n.label}</span>
                {n.badge&&<span style={{padding:"1px 7px",borderRadius:99,fontSize:9,fontWeight:800,background:n.id==="alerts"?"#fee2e2":"#d1fae5",color:n.id==="alerts"?"#dc2626":"#065f46"}}>{n.badge}</span>}
              </button>
            ))}
          </div>

          {/* Patient list */}
          {view==="clinical" && (
            <div style={{flex:1,display:"flex",flexDirection:"column",overflow:"hidden"}}>
              <div style={{padding:"12px 14px 8px",borderBottom:"1.5px solid #f5f5f5"}}>
                <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:10}}>
                  <span style={{fontSize:10,fontWeight:800,color:"#9ca3af",textTransform:"uppercase",letterSpacing:"0.1em"}}>Patient Records</span>
                  <button onClick={startNew} title="New patient" style={{width:26,height:26,borderRadius:8,background:"#f0fdf4",border:"1.5px solid #a7f3d0",color:"#059669",cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center",fontWeight:700}}>
                    <Plus size={14} />
                  </button>
                </div>
                <div style={{position:"relative"}}>
                  <Search size={13} style={{position:"absolute",left:10,top:"50%",transform:"translateY(-50%)",color:"#9ca3af",pointerEvents:"none"}} />
                  <input value={searchTerm} onChange={e=>setSearchTerm(e.target.value)} placeholder="Search name or ID…" style={{...inp,paddingLeft:32,height:34,fontSize:12,borderRadius:8}} />
                </div>
              </div>
              <div style={{flex:1,overflowY:"auto",padding:"4px 0"}}>
                {filtered.length===0
                  ? <div style={{padding:"20px 14px",textAlign:"center",color:"#9ca3af",fontSize:12}}>{searchTerm?"No matches.":"No records yet."}</div>
                  : filtered.map(c=>(
                    <button key={c.patientId} onClick={()=>selectCase(c)} style={{width:"100%",display:"flex",justifyContent:"space-between",alignItems:"center",padding:"10px 14px",background:current.patientId===c.patientId?"#f0fdf4":"transparent",borderLeft:`3px solid ${current.patientId===c.patientId?"#059669":"transparent"}`,border:"none",cursor:"pointer",textAlign:"left",transition:"all 0.12s"}}>
                      <div style={{flex:1,minWidth:0}}>
                        <p style={{fontSize:13,fontWeight:700,color:current.patientId===c.patientId?"#065f46":"#111827",overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap",marginBottom:1}}>{c.name}</p>
                        <p style={{fontSize:10,color:"#9ca3af",fontFamily:"monospace"}}>{c.patientId}</p>
                        <p style={{fontSize:11,color:"#6b7280"}}>{c.age}y · {c.gender}</p>
                      </div>
                      <button onClick={e=>delCase(c.patientId,e)} style={{padding:4,background:"none",border:"none",color:"#d1d5db",cursor:"pointer",borderRadius:6}} onMouseEnter={e=>e.currentTarget.style.color="#ef4444"} onMouseLeave={e=>e.currentTarget.style.color="#d1d5db"}>
                        <Trash2 size={12} />
                      </button>
                    </button>
                  ))
                }
              </div>
            </div>
          )}

          {/* Footer */}
          <div style={{padding:"12px 16px",borderTop:"1.5px solid #f0f0f0",display:"flex",justifyContent:"space-between",alignItems:"center"}}>
            <div style={{display:"flex",alignItems:"center",gap:8}}>
              <div style={{width:8,height:8,borderRadius:"50%",background:"#10b981"}} />
              <span style={{fontSize:12,color:"#374151",fontWeight:600}}>Dr. Neha</span>
            </div>
            <button onClick={()=>{localStorage.removeItem("ayurkaya_doctor_logged_in");navigate("/login");}} style={{display:"flex",alignItems:"center",gap:5,fontSize:11,color:"#9ca3af",background:"none",border:"none",cursor:"pointer",fontWeight:600}} onMouseEnter={e=>e.currentTarget.style.color="#ef4444"} onMouseLeave={e=>e.currentTarget.style.color="#9ca3af"}>
              <LogOut size={13} /> Logout
            </button>
          </div>
        </div>
      )}

      {/* ══ MAIN CONTENT ══ */}
      <div style={{flex:1,display:"flex",flexDirection:"column",overflow:"hidden",minWidth:0}}>

        {/* Top Bar */}
        <div style={{background:"#fff",borderBottom:"1.5px solid #f0f0f0",padding:"0 24px",display:"flex",alignItems:"center",justifyContent:"space-between",height:60,flexShrink:0,boxShadow:"0 1px 4px rgba(0,0,0,0.04)"}}>
          <div style={{display:"flex",alignItems:"center",gap:14}}>
            <button onClick={()=>setSideOpen(p=>!p)} style={{background:"#f9fafb",border:"1.5px solid #e5e7eb",borderRadius:9,padding:"7px",cursor:"pointer",color:"#6b7280",display:"flex",alignItems:"center"}}>
              <Menu size={16} />
            </button>
            <div>
              {view==="clinical"&&<p style={{fontSize:15,fontWeight:800,color:"#111827"}}>
                {current.name?<>Clinical Record — <span style={{color:"#059669"}}>{current.name}</span></>:"New Consultation"}
              </p>}
              {view==="analytics"&&<p style={{fontSize:15,fontWeight:800,color:"#111827"}}>Clinical Analytics</p>}
              {view==="alerts"&&<p style={{fontSize:15,fontWeight:800,color:"#111827"}}>Alerts & Follow-ups</p>}
              {view==="utilities"&&<p style={{fontSize:15,fontWeight:800,color:"#111827"}}>Database Tools</p>}
              {view==="clinical"&&current.patientId&&<p style={{fontSize:11,color:"#9ca3af",fontWeight:500,marginTop:1}}>{current.patientId} · {current.age}y · {current.gender}{current.mobile?` · ${current.mobile}`:""}</p>}
            </div>
          </div>

          <div style={{display:"flex",alignItems:"center",gap:8}}>
            {view==="clinical"&&<>
              {current.patientId&&<>
                <button onClick={()=>setHistOpen(true)} style={{display:"flex",alignItems:"center",gap:6,background:"#f9fafb",border:"1.5px solid #e5e7eb",borderRadius:9,padding:"7px 14px",fontSize:11,fontWeight:700,color:"#6b7280",cursor:"pointer",letterSpacing:"0.04em",textTransform:"uppercase"}}>
                  <History size={13} /> History
                </button>
                <button onClick={recordFollowUp} style={{display:"flex",alignItems:"center",gap:6,background:"#fffbeb",border:"1.5px solid #fde68a",borderRadius:9,padding:"7px 14px",fontSize:11,fontWeight:700,color:"#92400e",cursor:"pointer",letterSpacing:"0.04em",textTransform:"uppercase"}}>
                  <Plus size={13} /> New Visit
                </button>
              </>}
              <button onClick={saveCase} style={{display:"flex",alignItems:"center",gap:6,background:"linear-gradient(135deg,#059669,#0d9488)",borderRadius:9,padding:"8px 18px",fontSize:11,fontWeight:800,color:"#fff",cursor:"pointer",border:"none",letterSpacing:"0.04em",textTransform:"uppercase",boxShadow:"0 4px 12px rgba(5,150,105,0.3)"}}>
                <Save size={13} /> Save Record
              </button>
              <button onClick={()=>{if(!current.name?.trim()){notify("Save patient first","error");return;}setIsPrint(true);}} style={{display:"flex",alignItems:"center",gap:6,background:"#f9fafb",border:"1.5px solid #e5e7eb",borderRadius:9,padding:"7px 14px",fontSize:11,fontWeight:700,color:"#6b7280",cursor:"pointer",letterSpacing:"0.04em",textTransform:"uppercase"}}>
                <Printer size={13} /> Print Rx
              </button>
            </>}
          </div>
        </div>

        {/* Tab Bar */}
        {view==="clinical"&&(
          <div style={{background:"#fff",borderBottom:"1.5px solid #f0f0f0",display:"flex",overflowX:"auto",flexShrink:0,scrollbarWidth:"none",padding:"0 8px"}}>
            {TABS.map(t=>(
              <button key={t.id} onClick={()=>setActiveTab(t.id)} style={{display:"flex",alignItems:"center",gap:7,padding:"13px 18px",fontSize:11,fontWeight:700,letterSpacing:"0.05em",textTransform:"uppercase",cursor:"pointer",background:"none",border:"none",borderBottom:activeTab===t.id?"2.5px solid #059669":"2.5px solid transparent",color:activeTab===t.id?"#059669":"#9ca3af",whiteSpace:"nowrap",transition:"all 0.15s"}}>
                <t.icon size={13} />{t.label}
              </button>
            ))}
          </div>
        )}

        {/* Scrollable Content */}
        <div style={{flex:1,overflowY:"auto",padding:"28px 32px"}}>

          {/* ══════ CLINICAL WORKSPACE ══════ */}
          {view==="clinical"&&(
            <div style={{maxWidth:880,margin:"0 auto"}} className="anim-up">

              {/* ── PROFILE TAB ── */}
              {activeTab==="profile"&&(
                <div>
                  {/* Demographics */}
                  <div style={card}>
                    <SH num="1" title="Patient Demographics" sub="Core identity fields — auto-generates unique Patient ID on first save" action={
                      <button onClick={updateRegistry} style={{display:"flex",alignItems:"center",gap:6,background:"#f0fdf4",border:"1.5px solid #a7f3d0",borderRadius:9,padding:"7px 14px",fontSize:11,fontWeight:700,color:"#059669",cursor:"pointer",textTransform:"uppercase",letterSpacing:"0.04em"}}>
                        <Save size={12} /> Update Registry
                      </button>
                    } />
                    <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:16}}>
                      <div>
                        <label style={lbl}>Patient ID (Primary Key)</label>
                        <div style={{...inp,color:"#059669",fontFamily:"monospace",fontWeight:700,background:"#f0fdf4",border:"1.5px solid #a7f3d0",cursor:"default"}}>
                          {current.patientId||"Auto-generated on first save"}
                        </div>
                      </div>
                      <div>
                        <label style={lbl}>Full Name *</label>
                        <input style={inp} value={current.name} onChange={e=>set("name",e.target.value)} placeholder="e.g. Aditi Rao"
                          onFocus={e=>{e.target.style.borderColor="#059669";e.target.style.boxShadow="0 0 0 3px rgba(5,150,105,0.12)";}}
                          onBlur={e=>{e.target.style.borderColor="#e5e7eb";e.target.style.boxShadow="none";}} />
                      </div>
                      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12}}>
                        <div>
                          <label style={lbl}>Age (Years)</label>
                          <input type="number" style={inp} value={current.age} onChange={e=>set("age",e.target.value)} placeholder="29"
                            onFocus={e=>{e.target.style.borderColor="#059669";e.target.style.boxShadow="0 0 0 3px rgba(5,150,105,0.12)";}}
                            onBlur={e=>{e.target.style.borderColor="#e5e7eb";e.target.style.boxShadow="none";}} />
                        </div>
                        <div>
                          <label style={lbl}>Gender</label>
                          <select style={sel} value={current.gender} onChange={e=>set("gender",e.target.value)}>
                            <option>Male</option><option>Female</option><option>Other</option>
                          </select>
                        </div>
                      </div>
                      <div style={{position:"relative"}}>
                        <label style={lbl}>Mobile <span style={{color:"#059669",textTransform:"none",fontWeight:500,fontSize:9}}>— type 10 digits to search, click name to load</span></label>
                        <input type="tel" style={inp} value={current.mobile} onChange={e=>set("mobile",e.target.value)} placeholder="e.g. 9876543210"
                          onFocus={e=>{e.target.style.borderColor="#059669";e.target.style.boxShadow="0 0 0 3px rgba(5,150,105,0.12)";}}
                          onBlur={e=>{e.target.style.borderColor="#e5e7eb";e.target.style.boxShadow="none";}} />
                        {matches.length>0&&(
                          <div style={{position:"absolute",zIndex:50,left:0,right:0,top:"calc(100% + 6px)",background:"#fff",border:"1.5px solid #e5e7eb",borderRadius:12,padding:10,boxShadow:"0 16px 48px rgba(0,0,0,0.12)"}} className="anim-pop">
                            <p style={{fontSize:9,fontWeight:800,color:"#9ca3af",textTransform:"uppercase",letterSpacing:"0.1em",marginBottom:8}}>👇 Click to load patient record:</p>
                            {matches.map(p=>(
                              <button key={p.patientId} onClick={()=>loadFromReg(p)} style={{width:"100%",display:"flex",justifyContent:"space-between",alignItems:"center",padding:"8px 10px",borderRadius:8,background:"transparent",border:"none",cursor:"pointer",textAlign:"left",fontSize:13,color:"#111827"}} onMouseEnter={e=>e.currentTarget.style.background="#f0fdf4"} onMouseLeave={e=>e.currentTarget.style.background="transparent"}>
                                <span><strong>{p.name}</strong> — {p.age}y, {p.gender}</span>
                                <span style={{fontFamily:"monospace",fontSize:10,color:"#9ca3af"}}>{p.patientId}</span>
                              </button>
                            ))}
                            <div style={{borderTop:"1.5px solid #f0f0f0",marginTop:6,paddingTop:6}}>
                              <button onClick={startFamily} style={{fontSize:11,color:"#059669",background:"none",border:"none",cursor:"pointer",fontWeight:700,display:"flex",alignItems:"center",gap:4}}>
                                <PlusCircle size={12} /> Register new profile (same mobile)
                              </button>
                            </div>
                          </div>
                        )}
                      </div>
                      <div>
                        <label style={lbl}>Occupation</label>
                        <input style={inp} value={current.occupation} onChange={e=>set("occupation",e.target.value)} placeholder="e.g. Software Engineer"
                          onFocus={e=>{e.target.style.borderColor="#059669";e.target.style.boxShadow="0 0 0 3px rgba(5,150,105,0.12)";}}
                          onBlur={e=>{e.target.style.borderColor="#e5e7eb";e.target.style.boxShadow="none";}} />
                      </div>
                    </div>
                  </div>

                  {/* Consultation Timeline */}
                  {current.patientId&&(
                    <div style={card}>
                      <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:20}}>
                        <div style={{display:"flex",alignItems:"center",gap:10}}>
                          <Calendar size={16} color="#059669" />
                          <h3 style={{fontSize:15,fontWeight:700,color:"#111827"}}>Consultation Timeline</h3>
                          <span style={{padding:"2px 8px",borderRadius:99,background:"#f0fdf4",color:"#065f46",fontSize:10,fontWeight:700}}>{(current.visits?.length||0)+1} visit{(current.visits?.length||0)+1>1?"s":""}</span>
                        </div>
                        <button onClick={recordFollowUp} style={{display:"flex",alignItems:"center",gap:6,background:"#fffbeb",border:"1.5px solid #fde68a",borderRadius:9,padding:"7px 14px",fontSize:11,fontWeight:700,color:"#92400e",cursor:"pointer",textTransform:"uppercase",letterSpacing:"0.04em"}}>
                          <Plus size={12} /> Archive & Start Follow-up
                        </button>
                      </div>
                      <div style={{position:"relative",paddingLeft:28,borderLeft:"2px solid #e5e7eb",marginLeft:6}}>
                        {/* Active visit */}
                        <div style={{position:"relative",marginBottom:20}}>
                          <div style={{position:"absolute",left:-35,top:6,width:14,height:14,borderRadius:"50%",background:"#059669",border:"3px solid #fff",boxShadow:"0 0 0 3px rgba(5,150,105,0.25)"}} />
                          <div style={{background:"linear-gradient(135deg,#f0fdf4,#ecfdf5)",border:"1.5px solid #a7f3d0",borderRadius:14,padding:"16px 18px"}}>
                            <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:12}}>
                              <div>
                                <span style={{fontSize:11,fontWeight:800,color:"#065f46",textTransform:"uppercase",letterSpacing:"0.06em"}}>🟢 Active Consultation</span>
                                <p style={{fontSize:10,color:"#6b7280",marginTop:2}}>{fmtDate(current.visitDate||new Date().toISOString())}</p>
                              </div>
                              <ScoreBadge score={current.outcomeScore} />
                            </div>
                            <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:14,fontSize:12}}>
                              <div>
                                <p style={{fontSize:9,fontWeight:700,color:"#6b7280",textTransform:"uppercase",letterSpacing:"0.08em",marginBottom:5}}>Active Complaints</p>
                                {(current.complaints||[]).filter(c=>c.text).length>0
                                  ?<ul style={{listStyle:"none",padding:0,margin:0}}>{(current.complaints||[]).filter(c=>c.text).map((c,i)=><li key={i} style={{color:"#374151",marginBottom:3}}>• {c.text}{c.onsetDate&&<span style={{color:"#9ca3af",marginLeft:4}}>({getDurationString(c.onsetDate)})</span>}</li>)}</ul>
                                  :<p style={{color:"#9ca3af",fontStyle:"italic"}}>No complaints entered</p>}
                              </div>
                              <div>
                                <p style={{fontSize:9,fontWeight:700,color:"#6b7280",textTransform:"uppercase",letterSpacing:"0.08em",marginBottom:5}}>Current Prescription</p>
                                {(current.medicines||[]).filter(m=>m.name).length>0
                                  ?<ul style={{listStyle:"none",padding:0,margin:0}}>{(current.medicines||[]).filter(m=>m.name).slice(0,3).map((m,i)=><li key={i} style={{color:"#374151",marginBottom:2,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>• {m.name}</li>)}{(current.medicines||[]).filter(m=>m.name).length>3&&<li style={{color:"#9ca3af",fontSize:10}}>+{(current.medicines||[]).filter(m=>m.name).length-3} more</li>}</ul>
                                  :<p style={{color:"#9ca3af",fontStyle:"italic"}}>No medicines yet</p>}
                              </div>
                            </div>
                          </div>
                        </div>

                        {/* Archived visits */}
                        {(current.visits||[]).map((v,idx)=>(
                          <div key={v.visitId||idx} style={{position:"relative",marginBottom:14}}>
                            <div style={{position:"absolute",left:-34,top:6,width:12,height:12,borderRadius:"50%",background:"#fff",border:"2px solid #d1d5db"}} />
                            <div style={{background:"#fff",border:"1.5px solid #f0f0f0",borderRadius:14,padding:"14px 18px",boxShadow:"0 1px 3px rgba(0,0,0,0.05)"}}>
                              <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:8}}>
                                <div style={{display:"flex",alignItems:"center",gap:10}}>
                                  <span style={{fontSize:13,fontWeight:700,color:"#374151"}}>{fmtDate(v.visitDate)}</span>
                                  <span style={{fontSize:10,color:"#9ca3af"}}>{new Date(v.visitDate).toLocaleTimeString("en-IN",{hour:"2-digit",minute:"2-digit"})}</span>
                                </div>
                                <div style={{display:"flex",gap:8,alignItems:"center"}}>
                                  <ScoreBadge score={v.outcomeScore} />
                                  <button onClick={()=>copyVisit(v)} style={{display:"flex",alignItems:"center",gap:4,fontSize:10,fontWeight:700,color:"#6b7280",background:"#f9fafb",border:"1.5px solid #e5e7eb",borderRadius:7,padding:"3px 10px",cursor:"pointer",textTransform:"uppercase"}}>
                                    <RefreshCw size={9} /> Copy Rx
                                  </button>
                                </div>
                              </div>
                              <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10,fontSize:11}}>
                                <div>
                                  <p style={{fontSize:9,fontWeight:700,color:"#9ca3af",textTransform:"uppercase",marginBottom:4}}>Complaints:</p>
                                  {(v.complaints||[]).filter(c=>c.text).map((c,i)=>{const prog=v.complaintsProgress?.[c.text.trim()];return<div key={i} style={{display:"flex",alignItems:"center",gap:6,marginBottom:2,color:"#374151"}}>• {c.text} {prog&&<PBadge s={prog}/>}</div>;})}<p style={{fontSize:10,color:"#9ca3af",marginTop:4}}>{v.prakriti} · {v.vikriti} · {v.agni} Agni</p>
                                </div>
                                <div>
                                  <p style={{fontSize:9,fontWeight:700,color:"#9ca3af",textTransform:"uppercase",marginBottom:4}}>Prescribed:</p>
                                  {(v.medicines||[]).filter(m=>m.name).slice(0,4).map((m,i)=><div key={i} style={{fontFamily:"monospace",fontSize:10,color:"#6b7280",marginBottom:1,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>• {m.name} ({m.dose})</div>)}
                                  {v.notes&&<p style={{fontSize:10,color:"#9ca3af",fontStyle:"italic",marginTop:4}}>"{v.notes}"</p>}
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

              {/* ── COMPLAINTS TAB ── */}
              {activeTab==="complaints"&&(
                <div>
                  {/* Previous visit progress tracker */}
                  {(()=>{
                    if(!current.visits?.length) return null;
                    const last=current.visits[0];
                    const pending=(last.complaints||[]).filter(c=>c.text&&last.complaintsProgress?.[c.text.trim()]!=="Cured");
                    if(!pending.length) return null;
                    return(
                      <div style={{...card,borderColor:"#fde68a",background:"#fffbeb"}} className="anim-up">
                        <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:14}}>
                          <div style={{display:"flex",alignItems:"center",gap:10}}>
                            <RefreshCw size={15} color="#d97706"/>
                            <h3 style={{fontSize:14,fontWeight:700,color:"#92400e"}}>Previous Visit — Complaint Progress</h3>
                          </div>
                          <span style={{fontSize:10,color:"#b45309",fontWeight:600}}>Last: {fmtDate(last.visitDate)}</span>
                        </div>
                        <p style={{fontSize:11,color:"#a16207",marginBottom:14}}>Update the status of each active complaint. Cured ones are automatically excluded from future visits.</p>
                        <div style={{display:"flex",flexDirection:"column",gap:8}}>
                          {pending.map((c,i)=>{
                            const key=c.text.trim();
                            const prog=current.complaintsProgress?.[key]||"Stable";
                            return(
                              <div key={i} style={{display:"flex",justifyContent:"space-between",alignItems:"center",background:"#fff",borderRadius:10,padding:"10px 16px",border:"1.5px solid #fde68a",flexWrap:"wrap",gap:8}}>
                                <span style={{fontSize:13,fontWeight:700,color:"#111827"}}>{c.text}</span>
                                <div style={{display:"flex",gap:6}}>
                                  {["Cured","Improved","Stable","Worse"].map(s=>{
                                    const active=prog===s;
                                    const cfg={Cured:{a:"#d1fae5",ac:"#065f46",i:"#f0fdf4",ic:"#9ca3af"},Improved:{a:"#dbeafe",ac:"#1e40af",i:"#f0f4ff",ic:"#9ca3af"},Stable:{a:"#fef3c7",ac:"#92400e",i:"#fafaf5",ic:"#9ca3af"},Worse:{a:"#fee2e2",ac:"#991b1b",i:"#fff5f5",ic:"#9ca3af"}};
                                    const c2=cfg[s]||{a:"#f3f4f6",ac:"#374151",i:"#f9fafb",ic:"#9ca3af"};
                                    return(
                                      <button key={s} onClick={()=>{const up={...(current.complaintsProgress||{}),[key]:s};const ns=calcScore(up,pending);setCurrent(p=>({...p,complaintsProgress:up,outcomeScore:ns}));}}
                                        style={{padding:"5px 12px",borderRadius:8,border:`1.5px solid ${active?c2.ac+"40":"#e5e7eb"}`,background:active?c2.a:c2.i,color:active?c2.ac:c2.ic,fontSize:10,fontWeight:800,textTransform:"uppercase",letterSpacing:"0.05em",cursor:"pointer",transition:"all 0.15s"}}>
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
                  <div style={{...card,padding:"16px 20px"}}>
                    <p style={lbl}>Quick Add — Common Complaints</p>
                    <div style={{display:"flex",flexWrap:"wrap",gap:7,marginTop:2}}>
                      {COMPLAINT_PRESETS.map(t=>(
                        <button key={t} onClick={()=>preC(t)} style={{padding:"6px 12px",background:"#f9fafb",border:"1.5px solid #e5e7eb",borderRadius:8,fontSize:11,fontWeight:600,color:"#6b7280",cursor:"pointer",transition:"all 0.15s"}} onMouseEnter={e=>{e.currentTarget.style.borderColor="#059669";e.currentTarget.style.color="#059669";e.currentTarget.style.background="#f0fdf4";}} onMouseLeave={e=>{e.currentTarget.style.borderColor="#e5e7eb";e.currentTarget.style.color="#6b7280";e.currentTarget.style.background="#f9fafb";}}>
                          + {t}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Chief Complaints */}
                  <div style={card}>
                    <SH num="2" title="Chief Complaints" sub="Enter each symptom with onset date for duration tracking" action={
                      <button onClick={addC} style={{display:"flex",alignItems:"center",gap:6,background:"#f0fdf4",border:"1.5px solid #a7f3d0",borderRadius:8,padding:"6px 12px",fontSize:11,fontWeight:700,color:"#059669",cursor:"pointer"}}>
                        <Plus size={13} /> Add Complaint
                      </button>
                    } />
                    <div style={{display:"flex",flexDirection:"column",gap:10}}>
                      {current.complaints.map((c,i)=>(
                        <div key={i} style={{display:"flex",gap:12,alignItems:"flex-start",background:"#f9fafb",borderRadius:12,padding:"14px 16px",border:"1.5px solid #f0f0f0"}}>
                          <div style={{flex:1}}>
                            <label style={lbl}>Complaint / Symptom</label>
                            <input style={inp} value={c.text} onChange={e=>updC(i,"text",e.target.value)} placeholder="e.g. Chronic bloating after meals"
                              onFocus={e=>{e.target.style.borderColor="#059669";e.target.style.boxShadow="0 0 0 3px rgba(5,150,105,0.1)";}}
                              onBlur={e=>{e.target.style.borderColor="#e5e7eb";e.target.style.boxShadow="none";}} />
                          </div>
                          <div style={{width:175}}>
                            <label style={lbl}>Onset Date</label>
                            <input type="date" style={inp} value={c.onsetDate||""} onChange={e=>updC(i,"onsetDate",e.target.value)}
                              onFocus={e=>{e.target.style.borderColor="#059669";}}
                              onBlur={e=>{e.target.style.borderColor="#e5e7eb";}} />
                            {c.onsetDate&&<p style={{fontSize:10,color:"#059669",marginTop:4,fontWeight:600}}>⏱ {getDurationString(c.onsetDate)}</p>}
                          </div>
                          <button onClick={()=>remC(i)} disabled={current.complaints.length===1} style={{marginTop:20,padding:6,background:"none",border:"none",color:"#d1d5db",cursor:"pointer",borderRadius:6,transition:"color 0.15s"}} onMouseEnter={e=>e.currentTarget.style.color="#ef4444"} onMouseLeave={e=>e.currentTarget.style.color="#d1d5db"}>
                            <Trash2 size={15} />
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* History cards */}
                  <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:16}}>
                    <div style={card}>
                      <h4 style={{fontSize:13,fontWeight:700,color:"#111827",marginBottom:14}}>Past Medical History</h4>
                      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8,marginBottom:12}}>
                        {["diabetes","htn","thyroid","asthma","obesity","gut"].map(k=>(
                          <label key={k} style={{display:"flex",alignItems:"center",gap:8,fontSize:12,color:"#374151",cursor:"pointer",fontWeight:500}}>
                            <input type="checkbox" checked={current.pastHistory[k]||false} onChange={e=>setGrp("pastHistory",k,e.target.checked)} style={{width:15,height:15,accentColor:"#059669",cursor:"pointer"}} />
                            {k==="htn"?"Hypertension":k==="gut"?"Gut Issues":k.charAt(0).toUpperCase()+k.slice(1)}
                          </label>
                        ))}
                      </div>
                      <label style={lbl}>Other History</label>
                      <input style={inp} value={current.pastHistory.others||""} onChange={e=>setGrp("pastHistory","others",e.target.value)} placeholder="e.g. Migraine, Appendectomy" />
                    </div>
                    <div style={card}>
                      <h4 style={{fontSize:13,fontWeight:700,color:"#111827",marginBottom:14}}>Family History</h4>
                      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8,marginBottom:12}}>
                        {["diabetes","htn","thyroid"].map(k=>(
                          <label key={k} style={{display:"flex",alignItems:"center",gap:8,fontSize:12,color:"#374151",cursor:"pointer",fontWeight:500}}>
                            <input type="checkbox" checked={current.familyHistory[k]||false} onChange={e=>setGrp("familyHistory",k,e.target.checked)} style={{width:15,height:15,accentColor:"#059669",cursor:"pointer"}} />
                            {k==="htn"?"Hypertension":k.charAt(0).toUpperCase()+k.slice(1)}
                          </label>
                        ))}
                      </div>
                      <label style={lbl}>Other Family History</label>
                      <input style={inp} value={current.familyHistory.others||""} onChange={e=>setGrp("familyHistory","others",e.target.value)} placeholder="e.g. Cardiac history" />
                    </div>
                  </div>

                  {/* Drug & addiction */}
                  <div style={card}>
                    <h4 style={{fontSize:13,fontWeight:700,color:"#111827",marginBottom:16}}>Drug History & Lifestyle Habits</h4>
                    <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:14}}>
                      <div><label style={lbl}>Drug History?</label><select style={sel} value={current.drugHistory.hasHistory} onChange={e=>setGrp("drugHistory","hasHistory",e.target.value)}><option>No</option><option>Yes</option></select></div>
                      {current.drugHistory.hasHistory==="Yes"&&<div style={{gridColumn:"span 2"}}><label style={lbl}>Drug Details</label><input style={inp} value={current.drugHistory.details} onChange={e=>setGrp("drugHistory","details",e.target.value)} placeholder="e.g. Metformin 500mg for 2 years" /></div>}
                      <div><label style={lbl}>Addiction / Habits</label><select style={sel} value={current.addiction} onChange={e=>set("addiction",e.target.value)}>{["None","Tobacco","Alcohol","Smoking","Multiple"].map(o=><option key={o}>{o}</option>)}</select></div>
                      <div><label style={lbl}>Stress Level</label><select style={sel} value={current.stressLevel} onChange={e=>set("stressLevel",e.target.value)}>{["Low","Moderate","High","Very High"].map(o=><option key={o}>{o}</option>)}</select></div>
                      <div><label style={lbl}>Work Type</label><select style={sel} value={current.workType} onChange={e=>set("workType",e.target.value)}>{["Sedentary","Mild Active","Mixed","Heavy Physical"].map(o=><option key={o}>{o}</option>)}</select></div>
                    </div>
                  </div>
                </div>
              )}

              {/* ── AYUR CORE TAB ── */}
              {activeTab==="core"&&(
                <div style={card}>
                  <SH num="3" title="Ayurvedic Ashtavidha Pareeksha" sub="Eight-fold examination — core vitals assessment" />
                  <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:16}}>
                    {[["kshudha","Kshudha (Appetite)",["Sama","Manda","Teekshna","Vishama"]],["mutra","Mutra (Urine)",["Normal","Excess","Reduced","Burning"]],["mala","Mala (Bowel)",["Normal","Constipation","Loose","Irregular"]],["koshtha","Koshtha (Gut Type)",["Mridu","Madhya","Krura"]],["nidra","Nidra (Sleep)",["Normal","Excess","Disturbed","Insomnia"]],["avastha","Avastha (Ama Status)",["Niraama","Saaama"]]].map(([f,label,opts])=>(
                      <div key={f}><label style={lbl}>{label}</label><select style={sel} value={current[f]} onChange={e=>set(f,e.target.value)}>{opts.map(o=><option key={o}>{o}</option>)}</select></div>
                    ))}
                  </div>
                  <div style={{marginTop:20,padding:"16px",background:"#f9fafb",borderRadius:12,border:"1.5px solid #f0f0f0"}}>
                    <h4 style={{fontSize:12,fontWeight:700,color:"#374151",marginBottom:12}}>Vega Dharana (Suppressed Urges)</h4>
                    <div style={{display:"flex",gap:24}}>
                      {["mutra","mala","nidra"].map(k=>(
                        <label key={k} style={{display:"flex",alignItems:"center",gap:8,fontSize:12,color:"#374151",cursor:"pointer",fontWeight:500,textTransform:"capitalize"}}>
                          <input type="checkbox" checked={current.vegaDharana[k]||false} onChange={e=>setGrp("vegaDharana",k,e.target.checked)} style={{width:15,height:15,accentColor:"#059669"}} /> {k}
                        </label>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* ── DIAGNOSIS TAB ── */}
              {activeTab==="diagnosis"&&(
                <div>
                  <div style={card}>
                    <SH num="4" title="Ayurvedic Diagnosis" sub="Prakriti, Vikriti, Dosha analysis and Samprapti" />
                    <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:16,marginBottom:16}}>
                      {[["prakriti","Prakriti (Constitution)",["Vata","Pitta","Kapha","Vata-Pitta","Vata-Kapha","Pitta-Kapha","Tridosha"]],["vikriti","Vikriti (Current Imbalance)",["Vata","Pitta","Kapha","Vata-Pitta","Vata-Kapha","Pitta-Kapha","Tridosha"]],["agni","Agni (Digestive Fire)",["Sama","Manda","Teekshna","Vishama"]],["samprapti","Samprapti (Pathogenesis)",["Agnimandya","Ama formation","Srotodushti","Rasa-Dushya","Other"]]].map(([f,label,opts])=>(
                        <div key={f}><label style={lbl}>{label}</label><select style={sel} value={current[f]} onChange={e=>set(f,e.target.value)}>{opts.map(o=><option key={o}>{o}</option>)}</select></div>
                      ))}
                    </div>
                  </div>
                  <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:16}}>
                    {[["dosha","Dosha Involved",["vata","pitta","kapha"]],["dushya","Dushya (Dhatus)",["rasa","rakta","mamsa","meda","asthi","majja","shukra"]],["srotas","Srotas (Channels)",["annavaha","pranavaha","rasavaha","raktavaha","medovaha","mutravaha","purishavaha"]]].map(([group,title,keys])=>(
                      <div key={group} style={card}>
                        <h4 style={{fontSize:12,fontWeight:700,color:"#374151",marginBottom:12}}>{title}</h4>
                        {keys.map(k=>(
                          <label key={k} style={{display:"flex",alignItems:"center",gap:8,fontSize:12,color:"#374151",cursor:"pointer",marginBottom:8,fontWeight:500,textTransform:"capitalize"}}>
                            <input type="checkbox" checked={current[group][k]||false} onChange={e=>setGrp(group,k,e.target.checked)} style={{width:14,height:14,accentColor:"#059669"}} /> {k}
                          </label>
                        ))}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* ── LIFESTYLE TAB ── */}
              {activeTab==="lifestyle"&&(
                <div style={card}>
                  <SH num="5" title="Lifestyle Assessment" sub="Diet, sleep, activity and Ahara Vihara evaluation" />
                  <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:16}}>
                    {[["diet","Diet Type",["Mixed","Vegetarian","Vegan","Non-Veg Dominant"]],["appetite","Appetite",["Normal","Reduced","Excessive","Variable"]],["sleep","Sleep Quality",["Good","Fair","Poor","Insomnia"]],["activity","Physical Activity",["Sedentary","Light","Moderate","Active"]],["divaswap","Day Sleep (Divaswap)",["No","Occasional","Regular"]],["waterIntake","Water Intake",["Adequate","Low","Excess"]],["viruddhaAhara","Incompatible Foods",["No","Occasional","Yes"]],["junkFood","Junk / Processed Food",["Rare","Occasional","Frequent"]]].map(([f,label,opts])=>(
                      <div key={f}><label style={lbl}>{label}</label><select style={sel} value={current[f]} onChange={e=>set(f,e.target.value)}>{opts.map(o=><option key={o}>{o}</option>)}</select></div>
                    ))}
                  </div>
                </div>
              )}

              {/* ── PRESCRIPTION TAB ── */}
              {activeTab==="treatment"&&(
                <div>
                  <div style={{...card,padding:"16px 20px"}}>
                    <p style={lbl}>Quick Add — Rx Formulary</p>
                    <div style={{display:"flex",flexWrap:"wrap",gap:7,marginTop:4}}>
                      {MED_PRESETS.map(n=>(
                        <button key={n} onClick={()=>preM(n)} style={{padding:"6px 12px",background:"#f9fafb",border:"1.5px solid #e5e7eb",borderRadius:8,fontSize:11,fontWeight:600,color:"#6b7280",cursor:"pointer"}} onMouseEnter={e=>{e.currentTarget.style.borderColor="#059669";e.currentTarget.style.color="#059669";e.currentTarget.style.background="#f0fdf4";}} onMouseLeave={e=>{e.currentTarget.style.borderColor="#e5e7eb";e.currentTarget.style.color="#6b7280";e.currentTarget.style.background="#f9fafb";}}>
                          + {n}
                        </button>
                      ))}
                    </div>
                  </div>
                  <div style={card}>
                    <SH num="6" title="Advised Prescription (Rx)" sub="Formulate the complete treatment plan" action={
                      <button onClick={addM} style={{display:"flex",alignItems:"center",gap:6,background:"#f0fdf4",border:"1.5px solid #a7f3d0",borderRadius:8,padding:"6px 12px",fontSize:11,fontWeight:700,color:"#059669",cursor:"pointer"}}>
                        <Plus size={13} /> Add Row
                      </button>
                    } />
                    <div style={{display:"flex",flexDirection:"column",gap:10}}>
                      {current.medicines.map((m,i)=>(
                        <div key={i} style={{display:"grid",gridTemplateColumns:"3fr 2fr 2fr 1fr auto",gap:10,alignItems:"flex-start",background:"#f9fafb",borderRadius:12,padding:"12px 14px",border:"1.5px solid #f0f0f0"}}>
                          <div><label style={lbl}>Medicine Name</label><input style={inp} value={m.name} onChange={e=>updM(i,"name",e.target.value)} placeholder="e.g. Triphala Churna" /></div>
                          <div><label style={lbl}>Dose / Freq</label><input style={inp} value={m.dose} onChange={e=>updM(i,"dose",e.target.value)} placeholder="1 tab BD" /></div>
                          <div><label style={lbl}>Kala</label><input style={inp} value={m.kala} onChange={e=>updM(i,"kala",e.target.value)} placeholder="After food" /></div>
                          <div><label style={lbl}>Anupana</label><input style={inp} value={m.anupana} onChange={e=>updM(i,"anupana",e.target.value)} placeholder="Warm water" /></div>
                          <button onClick={()=>remM(i)} disabled={current.medicines.length===1} style={{marginTop:20,padding:6,background:"none",border:"none",color:"#d1d5db",cursor:"pointer",borderRadius:6}} onMouseEnter={e=>e.currentTarget.style.color="#ef4444"} onMouseLeave={e=>e.currentTarget.style.color="#d1d5db"}><Trash2 size={15} /></button>
                        </div>
                      ))}
                    </div>
                  </div>
                  <div style={card}>
                    <h4 style={{fontSize:13,fontWeight:700,color:"#111827",marginBottom:12}}>Panchakarma Detox Therapy</h4>
                    <select style={{...sel,maxWidth:380}} value={current.panchakarma} onChange={e=>set("panchakarma",e.target.value)}>
                      {["None","Vamana","Virechana","Basti","Nasya","Raktamokshana","Abhyanga-Swedana","Shirodhara"].map(o=><option key={o}>{o}</option>)}
                    </select>
                  </div>
                </div>
              )}

              {/* ── LABS TAB ── */}
              {activeTab==="labs"&&(
                <div>
                  <div style={card}>
                    <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:18}}>
                      <div><h3 style={{fontSize:15,fontWeight:700,color:"#111827"}}>7. Lab Investigations</h3><p style={{fontSize:11,color:"#6b7280",marginTop:2}}>Add panels or individual tests and enter results</p></div>
                      <div style={{display:"flex",gap:7,flexWrap:"wrap"}}>
                        {Object.keys(LAB_PANELS).map(p=>(
                          <button key={p} onClick={()=>addPanel(p)} style={{padding:"5px 12px",background:"#f0f4ff",border:"1.5px solid #c7d2fe",borderRadius:8,fontSize:11,fontWeight:600,color:"#4338ca",cursor:"pointer"}} onMouseEnter={e=>{e.currentTarget.style.background="#e0e7ff";}} onMouseLeave={e=>{e.currentTarget.style.background="#f0f4ff";}}>
                            + {p}
                          </button>
                        ))}
                        <button onClick={()=>setCurrent(p=>({...p,labTests:[...p.labTests,{testName:"",value:"",range:"Custom",unit:"-"}]}))} style={{padding:"5px 12px",background:"#f9fafb",border:"1.5px solid #e5e7eb",borderRadius:8,fontSize:11,fontWeight:600,color:"#6b7280",cursor:"pointer"}}>
                          + Custom
                        </button>
                      </div>
                    </div>
                    {current.labTests.length===0
                      ?<div style={{textAlign:"center",padding:"36px",background:"#f9fafb",borderRadius:12,border:"1.5px dashed #e5e7eb"}}>
                          <FlaskConical size={32} style={{margin:"0 auto 10px",color:"#d1d5db"}} />
                          <p style={{color:"#9ca3af",fontSize:12}}>No lab tests added yet. Click panel buttons above.</p>
                        </div>
                      :<div>
                          <div style={{display:"grid",gridTemplateColumns:"3fr 1fr 1fr 1fr auto",gap:8,padding:"6px 10px",marginBottom:4}}>
                            {["Test Parameter","Result","Ref Range","Unit",""].map(h=><p key={h} style={{fontSize:9,fontWeight:800,color:"#9ca3af",textTransform:"uppercase",letterSpacing:"0.08em"}}>{h}</p>)}
                          </div>
                          <div style={{display:"flex",flexDirection:"column",gap:7}}>
                            {current.labTests.map((t,i)=>{
                              const isCustom=t.range==="Custom";
                              const v=parseFloat(t.value);
                              let vc="#111827";
                              if(!isNaN(v)&&t.range&&t.range!=="Custom"){
                                const r=t.range.replace(/[<>]/g,"").trim();
                                if(t.range.startsWith("<")&&v>parseFloat(r))vc="#dc2626";
                                else if(t.range.startsWith(">")&&v<parseFloat(r))vc="#d97706";
                                else if(t.range.includes("–")){const[lo,hi]=t.range.split("–").map(Number);vc=(v<lo||v>hi)?"#dc2626":"#059669";}
                              }
                              return(
                                <div key={i} style={{display:"grid",gridTemplateColumns:"3fr 1fr 1fr 1fr auto",gap:8,alignItems:"center",background:"#f9fafb",borderRadius:10,padding:"8px 10px",border:"1.5px solid #f0f0f0"}}>
                                  <input style={{...inp,fontSize:12,opacity:isCustom?1:0.85}} value={t.testName} readOnly={!isCustom} onChange={e=>updLabF(i,"testName",e.target.value)} />
                                  <input style={{...inp,fontSize:12,color:vc,fontWeight:700,textAlign:"center"}} value={t.value} onChange={e=>updLab(i,e.target.value)} placeholder="—" />
                                  <input style={{...inp,fontSize:11,textAlign:"center",opacity:isCustom?1:0.6}} value={t.range} readOnly={!isCustom} onChange={e=>updLabF(i,"range",e.target.value)} />
                                  <input style={{...inp,fontSize:11,textAlign:"center",opacity:isCustom?1:0.6}} value={t.unit} readOnly={!isCustom} onChange={e=>updLabF(i,"unit",e.target.value)} />
                                  <button onClick={()=>remLab(i)} style={{padding:6,background:"none",border:"none",color:"#d1d5db",cursor:"pointer"}} onMouseEnter={e=>e.currentTarget.style.color="#ef4444"} onMouseLeave={e=>e.currentTarget.style.color="#d1d5db"}><Trash2 size={14} /></button>
                                </div>
                              );
                            })}
                          </div>
                        </div>
                    }
                  </div>

                  <div style={card}>
                    <h3 style={{fontSize:15,fontWeight:700,color:"#111827",marginBottom:18}}>Clinical Outcomes & Follow-up Notes</h3>
                    <div style={{display:"grid",gridTemplateColumns:"1fr 2fr",gap:18}}>
                      <div>
                        <label style={lbl}>Patient Progress Score</label>
                        <select style={sel} value={current.outcomeScore} onChange={e=>set("outcomeScore",e.target.value)}>
                          <option value="5">5/5 — Complete Recovery</option>
                          <option value="4">4/5 — Significant Improvement</option>
                          <option value="3">3/5 — Stable / Moderate Relief</option>
                          <option value="2">2/5 — No Relief</option>
                          <option value="1">1/5 — Worsened</option>
                        </select>
                        <div style={{marginTop:10}}><ScoreBadge score={current.outcomeScore} /></div>
                      </div>
                      <div>
                        <label style={lbl}>Dietary Advice / Notes (Pathya-Apathya)</label>
                        <textarea rows={4} style={{...inp,resize:"none"}} value={current.notes} onChange={e=>set("notes",e.target.value)} placeholder="e.g. Avoid dairy, warm soup, walk 30 mins daily…" />
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* ── WIZARD NAV ── */}
              <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",padding:"18px 0",borderTop:"1.5px solid #f0f0f0",marginTop:4}}>
                <button onClick={()=>prevTab&&setActiveTab(prevTab)} disabled={!prevTab} style={{display:"flex",alignItems:"center",gap:7,padding:"10px 20px",background:"#fff",border:"1.5px solid #e5e7eb",borderRadius:10,fontSize:11,fontWeight:700,color:prevTab?"#374151":"#d1d5db",cursor:prevTab?"pointer":"default",textTransform:"uppercase",letterSpacing:"0.04em",boxShadow:prevTab?"0 1px 3px rgba(0,0,0,0.06)":"none"}}>
                  <ArrowLeft size={14} /> Back
                </button>
                {nextTab
                  ?<button onClick={()=>setActiveTab(nextTab)} style={{display:"flex",alignItems:"center",gap:7,padding:"10px 22px",background:"linear-gradient(135deg,#059669,#0d9488)",border:"none",borderRadius:10,fontSize:11,fontWeight:800,color:"#fff",cursor:"pointer",textTransform:"uppercase",letterSpacing:"0.04em",boxShadow:"0 4px 14px rgba(5,150,105,0.35)"}}>
                      Next <ArrowRight size={14} />
                    </button>
                  :<button onClick={saveCase} style={{display:"flex",alignItems:"center",gap:7,padding:"10px 22px",background:"linear-gradient(135deg,#059669,#0d9488)",border:"none",borderRadius:10,fontSize:11,fontWeight:800,color:"#fff",cursor:"pointer",textTransform:"uppercase",letterSpacing:"0.04em",boxShadow:"0 4px 14px rgba(5,150,105,0.35)"}}>
                      <Save size={14} /> Save Case File
                    </button>
                }
              </div>
            </div>
          )}

          {/* ══════ ANALYTICS ══════ */}
          {view==="analytics"&&(
            <div style={{maxWidth:880,margin:"0 auto"}} className="anim-up">
              <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:16,marginBottom:20}}>
                {[{label:"Total Cases",val:analytics.total,color:"#059669",bg:"#f0fdf4",bdr:"#a7f3d0"},{label:"Unique Patients",val:analytics.patients,color:"#4338ca",bg:"#f0f4ff",bdr:"#c7d2fe"},{label:"Active Alerts",val:alerts.length+followups.length,color:(alerts.length+followups.length)>0?"#dc2626":"#059669",bg:(alerts.length+followups.length)>0?"#fff1f2":"#f0fdf4",bdr:(alerts.length+followups.length)>0?"#fecaca":"#a7f3d0"}].map(c=>(
                  <div key={c.label} style={{...card,textAlign:"center",borderColor:c.bdr,background:c.bg}}>
                    <p style={{fontSize:10,fontWeight:700,color:"#6b7280",textTransform:"uppercase",letterSpacing:"0.1em",marginBottom:6}}>{c.label}</p>
                    <p style={{fontSize:44,fontWeight:900,color:c.color,lineHeight:1}}>{c.val}</p>
                  </div>
                ))}
              </div>
              <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:16}}>
                <div style={card}>
                  <h4 style={{fontSize:13,fontWeight:700,color:"#111827",marginBottom:16}}>Gender Distribution</h4>
                  {Object.entries(analytics.gc).map(([g,n])=>(
                    <div key={g} style={{marginBottom:10}}>
                      <div style={{display:"flex",justifyContent:"space-between",marginBottom:4}}><span style={{fontSize:12,color:"#6b7280",fontWeight:600}}>{g}</span><span style={{fontSize:12,color:"#111827",fontWeight:800}}>{n}</span></div>
                      <div style={{height:7,background:"#f0f0f0",borderRadius:99}}><div style={{height:"100%",width:`${analytics.total?(n/analytics.total*100):0}%`,background:"linear-gradient(90deg,#059669,#0d9488)",borderRadius:99,transition:"width 0.6s"}} /></div>
                    </div>
                  ))}
                </div>
                <div style={card}>
                  <h4 style={{fontSize:13,fontWeight:700,color:"#111827",marginBottom:16}}>Top Complaints</h4>
                  {analytics.topComplaints.length===0?<p style={{color:"#9ca3af",fontSize:12}}>No data yet.</p>:analytics.topComplaints.map(([txt,count])=>(
                    <div key={txt} style={{marginBottom:8}}>
                      <div style={{display:"flex",justifyContent:"space-between",marginBottom:3}}><span style={{fontSize:11,color:"#6b7280",fontWeight:600,textTransform:"capitalize"}}>{txt}</span><span style={{fontSize:11,color:"#111827",fontWeight:800}}>{count}</span></div>
                      <div style={{height:5,background:"#f0f0f0",borderRadius:99}}><div style={{height:"100%",width:`${analytics.topComplaints[0]?(count/analytics.topComplaints[0][1]*100):0}%`,background:"linear-gradient(90deg,#4338ca,#6366f1)",borderRadius:99}} /></div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* ══════ ALERTS ══════ */}
          {view==="alerts"&&(
            <div style={{maxWidth:880,margin:"0 auto"}} className="anim-up">
              {alerts.length>0&&<div style={{...card,borderColor:"#fecaca",background:"#fff1f2"}}>
                <div style={{display:"flex",alignItems:"center",gap:10,marginBottom:16}}><AlertTriangle size={16} color="#dc2626"/><h3 style={{fontSize:14,fontWeight:700,color:"#991b1b"}}>Lab Value Alerts ({alerts.length})</h3></div>
                {alerts.map((a,i)=>(
                  <div key={i} style={{display:"flex",justifyContent:"space-between",alignItems:"center",background:"#fff",border:"1.5px solid #fecaca",borderRadius:10,padding:"10px 16px",marginBottom:8}}>
                    <div><p style={{fontSize:13,fontWeight:700,color:"#111827"}}>{a.name}</p><p style={{fontSize:11,color:"#6b7280"}}>{a.param}: <strong style={{color:a.sev==="Critical"?"#dc2626":"#d97706"}}>{a.val}</strong></p></div>
                    <span style={{padding:"3px 10px",borderRadius:99,fontSize:10,fontWeight:800,textTransform:"uppercase",background:a.sev==="Critical"?"#fee2e2":"#fef3c7",color:a.sev==="Critical"?"#dc2626":"#92400e"}}>{a.sev}</span>
                  </div>
                ))}
              </div>}
              {followups.length>0&&<div style={card}>
                <div style={{display:"flex",alignItems:"center",gap:10,marginBottom:16}}><Clock size={16} color="#d97706"/><h3 style={{fontSize:14,fontWeight:700,color:"#111827"}}>Follow-ups Required ({followups.length})</h3></div>
                {followups.map((f,i)=>(
                  <div key={i} style={{display:"flex",justifyContent:"space-between",alignItems:"center",background:"#fffbeb",border:"1.5px solid #fde68a",borderRadius:10,padding:"10px 16px",marginBottom:8}}>
                    <div><p style={{fontSize:13,fontWeight:700,color:"#111827"}}>{f.name}</p><p style={{fontSize:11,color:"#6b7280"}}>{f.complaint} · {f.mobile} · {f.daysAgo} days ago</p></div>
                    <ScoreBadge score={f.score} />
                  </div>
                ))}
              </div>}
              {alerts.length===0&&followups.length===0&&<div style={{...card,textAlign:"center",padding:"60px 20px"}}>
                <CheckCircle size={44} style={{margin:"0 auto 14px",color:"#a7f3d0"}} />
                <p style={{color:"#065f46",fontWeight:700,fontSize:14}}>All clear! No alerts or overdue follow-ups.</p>
              </div>}
            </div>
          )}

          {/* ══════ UTILITIES ══════ */}
          {view==="utilities"&&(
            <div style={{maxWidth:720,margin:"0 auto"}} className="anim-up">
              <div style={card}>
                <h3 style={{fontSize:14,fontWeight:700,color:"#111827",marginBottom:18}}>Database Management</h3>
                <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12}}>
                  <button onClick={doExport} style={{display:"flex",flexDirection:"column",alignItems:"center",gap:8,padding:"20px",background:"#f0fdf4",border:"1.5px solid #a7f3d0",borderRadius:14,fontSize:13,fontWeight:700,color:"#065f46",cursor:"pointer"}}>
                    <Download size={22} color="#059669" /> Export Backup (JSON)
                  </button>
                  <label style={{display:"flex",flexDirection:"column",alignItems:"center",gap:8,padding:"20px",background:"#f0f4ff",border:"1.5px solid #c7d2fe",borderRadius:14,fontSize:13,fontWeight:700,color:"#4338ca",cursor:"pointer"}}>
                    <Upload size={22} color="#4338ca" /> Import Backup (JSON)
                    <input type="file" accept=".json" onChange={doImport} style={{display:"none"}} />
                  </label>
                </div>
                <div style={{marginTop:12,padding:"16px",background:"#fff1f2",border:"1.5px solid #fecaca",borderRadius:12}}>
                  <div style={{display:"flex",justifyContent:"space-between",alignItems:"center"}}>
                    <div><p style={{fontSize:13,fontWeight:700,color:"#dc2626"}}>⚠ Reset Entire Database</p><p style={{fontSize:11,color:"#6b7280",marginTop:2}}>Permanently deletes all records. Requires passcode.</p></div>
                    <button onClick={doReset} style={{padding:"8px 16px",background:"#fee2e2",border:"1.5px solid #fca5a5",borderRadius:9,fontSize:11,fontWeight:800,color:"#dc2626",cursor:"pointer"}}>Reset DB</button>
                  </div>
                </div>
              </div>
              <div style={{...card,background:"#f0fdf4",borderColor:"#a7f3d0"}}>
                <div style={{display:"flex",gap:12,alignItems:"flex-start"}}>
                  <Shield size={18} color="#059669" style={{flexShrink:0,marginTop:2}} />
                  <div><p style={{fontSize:13,fontWeight:700,color:"#065f46",marginBottom:5}}>Privacy & Security</p><p style={{fontSize:11,color:"#6b7280",lineHeight:1.7}}>All data is stored exclusively in your browser's IndexedDB. No patient data is transmitted to any external server. Export regularly to create backups.</p></div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* ══ HISTORY DRAWER ══ */}
      {histOpen&&(
        <div style={{position:"fixed",inset:0,zIndex:200}}>
          <div onClick={()=>setHistOpen(false)} style={{position:"absolute",inset:0,background:"rgba(0,0,0,0.25)",backdropFilter:"blur(4px)"}} />
          <div style={{position:"absolute",right:0,top:0,bottom:0,width:480,background:"#fff",borderLeft:"1.5px solid #f0f0f0",display:"flex",flexDirection:"column",boxShadow:"-8px 0 40px rgba(0,0,0,0.1)"}} className="anim-slide">
            <div style={{padding:"18px 22px",borderBottom:"1.5px solid #f0f0f0",display:"flex",justifyContent:"space-between",alignItems:"center"}}>
              <div><h3 style={{fontSize:15,fontWeight:700,color:"#111827"}}>Patient History</h3><p style={{fontSize:11,color:"#9ca3af"}}>{current.name} · {current.patientId}</p></div>
              <button onClick={()=>setHistOpen(false)} style={{padding:8,background:"#f9fafb",border:"1.5px solid #e5e7eb",borderRadius:9,cursor:"pointer",color:"#6b7280",display:"flex",alignItems:"center"}}><X size={16} /></button>
            </div>
            <div style={{flex:1,overflowY:"auto",padding:20}}>
              {/* Registry card */}
              <div style={{background:"#f9fafb",border:"1.5px solid #f0f0f0",borderRadius:12,padding:"14px 16px",marginBottom:14}}>
                <p style={{fontSize:9,fontWeight:800,color:"#9ca3af",textTransform:"uppercase",letterSpacing:"0.1em",marginBottom:10}}>Registry Card</p>
                <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8,fontSize:12}}>
                  <div><p style={{fontSize:9,color:"#9ca3af",fontWeight:700,textTransform:"uppercase"}}>Age / Gender</p><p style={{color:"#111827",fontWeight:700,marginTop:2}}>{current.age}y / {current.gender}</p></div>
                  <div><p style={{fontSize:9,color:"#9ca3af",fontWeight:700,textTransform:"uppercase"}}>Mobile</p><p style={{color:"#111827",fontWeight:700,marginTop:2}}>{current.mobile||"—"}</p></div>
                  <div style={{gridColumn:"span 2"}}>
                    <p style={{fontSize:9,color:"#9ca3af",fontWeight:700,textTransform:"uppercase",marginBottom:6}}>Chronic Conditions</p>
                    <div style={{display:"flex",flexWrap:"wrap",gap:5}}>
                      {Object.entries(current.pastHistory||{}).filter(([k,v])=>v&&k!=="others").map(([k])=><span key={k} style={{padding:"2px 8px",borderRadius:99,fontSize:10,fontWeight:700,textTransform:"uppercase",background:"#fee2e2",color:"#991b1b"}}>{k==="htn"?"HTN":k==="gut"?"Gut Issues":k}</span>)}
                      {current.pastHistory?.others&&<span style={{padding:"2px 8px",borderRadius:99,fontSize:10,fontWeight:700,background:"#f3f4f6",color:"#6b7280"}}>{current.pastHistory.others}</span>}
                      {Object.entries(current.pastHistory||{}).filter(([k,v])=>v&&k!=="others").length===0&&!current.pastHistory?.others&&<span style={{fontSize:11,color:"#9ca3af",fontStyle:"italic"}}>None recorded</span>}
                    </div>
                  </div>
                </div>
              </div>

              {/* All symptoms */}
              <div style={{marginBottom:14}}>
                <p style={{fontSize:9,fontWeight:800,color:"#9ca3af",textTransform:"uppercase",letterSpacing:"0.1em",marginBottom:8}}>All Symptoms Ever Reported</p>
                <div style={{display:"flex",flexWrap:"wrap",gap:6}}>
                  {(()=>{const all=new Set();(current.complaints||[]).forEach(c=>{if(c.text?.trim())all.add(c.text.trim());});(current.visits||[]).forEach(v=>{(v.complaints||[]).forEach(c=>{if(c.text?.trim())all.add(c.text.trim());});});if(all.size===0)return<span style={{fontSize:11,color:"#9ca3af",fontStyle:"italic"}}>No symptoms logged.</span>;return Array.from(all).map((s,i)=><span key={i} style={{padding:"3px 9px",borderRadius:99,fontSize:10,fontWeight:600,background:"#f3f4f6",color:"#374151",textTransform:"capitalize"}}>{s}</span>);})()}
                </div>
              </div>

              {/* Archived visits */}
              <p style={{fontSize:9,fontWeight:800,color:"#9ca3af",textTransform:"uppercase",letterSpacing:"0.1em",marginBottom:10}}>Archived Visits ({current.visits?.length||0})</p>
              {(!current.visits?.length)
                ?<div style={{textAlign:"center",padding:"30px",border:"1.5px dashed #e5e7eb",borderRadius:12,color:"#9ca3af",fontSize:12}}>No archived visits yet. Click "Archive & Start Follow-up" to record one.</div>
                :current.visits.map((v,idx)=>(
                  <div key={v.visitId||idx} style={{background:"#f9fafb",border:"1.5px solid #f0f0f0",borderRadius:12,padding:"14px 16px",marginBottom:10}}>
                    <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:8}}>
                      <span style={{fontSize:13,fontWeight:700,color:"#111827"}}>{fmtDate(v.visitDate)}</span>
                      <div style={{display:"flex",gap:8,alignItems:"center"}}>
                        <ScoreBadge score={v.outcomeScore} />
                        <button onClick={()=>{copyVisit(v);setHistOpen(false);}} style={{fontSize:10,fontWeight:700,color:"#6b7280",background:"#fff",border:"1.5px solid #e5e7eb",borderRadius:7,padding:"3px 8px",cursor:"pointer",display:"flex",alignItems:"center",gap:4}}><RefreshCw size={9} /> Copy</button>
                      </div>
                    </div>
                    <p style={{fontSize:10,color:"#9ca3af",marginBottom:6}}>{v.prakriti} · {v.vikriti} · {v.agni} Agni</p>
                    <div style={{display:"flex",flexWrap:"wrap",gap:4,marginBottom:6}}>
                      {(v.complaints||[]).filter(c=>c.text).map((c,i)=>{const prog=v.complaintsProgress?.[c.text.trim()];return<span key={i} style={{fontSize:11,color:"#374151"}}>• {c.text} {prog&&<PBadge s={prog}/>}</span>;})}
                    </div>
                    {(v.medicines||[]).filter(m=>m.name).length>0&&<div style={{background:"#fff",borderRadius:8,padding:"6px 10px",border:"1.5px solid #f0f0f0",fontFamily:"monospace",fontSize:10,color:"#6b7280"}}>{(v.medicines||[]).filter(m=>m.name).map((m,i)=><div key={i}>• {m.name} ({m.dose})</div>)}</div>}
                  </div>
                ))
              }
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
