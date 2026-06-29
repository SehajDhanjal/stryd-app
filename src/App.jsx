import React from 'react'
import { useState, useEffect, useRef } from "react";

// ── Google Font ───────────────────────────────────────────────────────────────
if (typeof document !== "undefined" && !document.getElementById("_dmf")) {
  const l = document.createElement("link"); l.id = "_dmf"; l.rel = "stylesheet";
  l.href = "https://fonts.googleapis.com/css2?family=DM+Sans:opsz,wght@9..40,300;9..40,400;9..40,500;9..40,600;9..40,700;9..40,800&display=swap";
  document.head.appendChild(l);
}
const F = "'DM Sans',-apple-system,BlinkMacSystemFont,sans-serif";

// ── SPORTS ────────────────────────────────────────────────────────────────────
const SPORTS = [
  { id:"run",   label:"Run",       tag:"Running", icon:"🏃", img:"https://images.unsplash.com/photo-1571008887538-b36bb32f4571?w=400&q=70" },
  { id:"trail", label:"Trail Run", tag:"Trail",   icon:"⛰️", img:"https://images.unsplash.com/photo-1533240332313-0db49b459ad6?w=400&q=70" },
  { id:"row",   label:"Rowing",    tag:"Rowing",  icon:"🚣", img:"https://images.unsplash.com/photo-1601925228208-7f9b70c2c4b3?w=400&q=70" },
];
const GOALS = [
  { id:"5k",     emoji:"🎯", label:"Complete 5K",        sub:"~30 min goal"      },
  { id:"10k",    emoji:"🏅", label:"Complete 10K",       sub:"~60 min goal"      },
  { id:"half",   emoji:"🥈", label:"Half Marathon",      sub:"~2 hour goal"      },
  { id:"full",   emoji:"🏆", label:"Full Marathon",      sub:"~4 hour goal"      },
  { id:"weight", emoji:"🔥", label:"Lose Weight",        sub:"Burn & move daily" },
  { id:"fit",    emoji:"⚡", label:"Stay Active",        sub:"3–5x per week"     },
  { id:"perf",   emoji:"📈", label:"Improve Performance",sub:"Beat your PBs"     },
];
const TIPS = [
  "💧 Hydration check — sip water right now.",
  "🌬️ In through nose, out through mouth.",
  "👟 Relax your shoulders. Light on your feet.",
  "⚡ Push through the next 500m.",
  "🕐 Short walk break if you need one.",
  "💪 Every step is progress. Keep moving.",
  "👁️ Eyes forward, chin up. Better posture.",
  "🥤 150–200ml water every 20 minutes.",
];
const MOTIV = ["Every step counts.","Run your own race.","One kilometre at a time.","Strong is a mindset.","You didn't come this far to stop."];

// ── UTILS ─────────────────────────────────────────────────────────────────────
const p2 = n => String(Math.max(0,Math.floor(n||0))).padStart(2,"0");
const fmtTime = s => { const ss=Math.max(0,Math.floor(s||0)); return `${p2(ss/3600)}:${p2((ss%3600)/60)}:${p2(ss%60)}`; };
const fmtPace = m => { if(!m||!isFinite(m)||m<=0||m>60) return "--:--"; return `${Math.floor(m)}'${p2((m%1)*60)}"`; };
const fmtDist = m => { const v=m||0; return v<1000?`${Math.round(v)}m`:`${(v/1000).toFixed(2)}km`; };
const nowDate = () => new Date().toLocaleDateString("en-GB",{day:"2-digit",month:"short",year:"numeric"});
const nowTime = () => new Date().toLocaleTimeString("en-GB",{hour:"2-digit",minute:"2-digit"});
const haversineM = (a,b) => {
  const R=6371000, dLat=(b.lat-a.lat)*Math.PI/180, dLng=(b.lng-a.lng)*Math.PI/180;
  const x=Math.sin(dLat/2)**2+Math.cos(a.lat*Math.PI/180)*Math.cos(b.lat*Math.PI/180)*Math.sin(dLng/2)**2;
  return R*2*Math.atan2(Math.sqrt(x),Math.sqrt(1-x));
};
// ── WAVEFORM (like reference — smooth ECG line through centre) ────────────────
function Waveform({ data, h=44 }) {
  const W=320, H=h;
  const pts = !data||data.length<2
    ? Array.from({length:20},(_,i)=>`${(i/19)*W},${H/2}`).join(" ")
    : (() => {
        const mn=Math.min(...data), mx=Math.max(...data), r=mx-mn||1;
        return data.map((v,i)=>`${(i/(data.length-1))*W},${H/2-((v-mn)/r-0.5)*(H*0.82)}`).join(" ");
      })();
  return (
    <svg width="100%" viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="none" style={{display:"block"}}>
      <defs>
        <linearGradient id={`wg${h}`} x1="0" y1="0" x2="1" y2="0">
          <stop offset="0%"   stopColor="rgba(255,255,255,0.15)"/>
          <stop offset="40%"  stopColor="rgba(255,255,255,0.85)"/>
          <stop offset="100%" stopColor="rgba(255,255,255,0.15)"/>
        </linearGradient>
      </defs>
      <line x1="0" y1={H/2} x2={W} y2={H/2} stroke="rgba(255,255,255,0.1)" strokeWidth="0.5"/>
      <polyline points={pts} fill="none" stroke={`url(#wg${h})`} strokeWidth="1.8" strokeLinejoin="round" strokeLinecap="round"/>
    </svg>
  );
}
// ── SPLIT BARS (like reference — rounded bottom-aligned bars) ─────────────────
function SplitBars({ splits }) {
  if(!splits||splits.length===0) return (
    <div style={{display:"flex",alignItems:"flex-end",gap:5,height:48}}>
      {Array.from({length:8},(_,i)=>(
        <div key={i} style={{flex:1,height:`${30+i*5}%`,background:"rgba(255,255,255,0.12)",borderRadius:"4px 4px 0 0",minHeight:6}}/>
      ))}
    </div>
  );
  const paces=splits.map(s=>s.pace||0).filter(p=>p>0);
  const mx=Math.max(...paces,1), mn=Math.min(...paces,mx-0.01);
  return (
    <div style={{display:"flex",alignItems:"flex-end",gap:5,height:48}}>
      {splits.map((s,i)=>{
        const pct = paces.length>0 ? 25+(((s.pace||mn)-mn)/(mx-mn||1))*65 : 50;
        return <div key={i} style={{flex:1,height:`${pct}%`,background:`rgba(255,255,255,${0.25+((s.pace||mn)-mn)/(mx-mn||1)*0.55})`,borderRadius:"4px 4px 0 0",minHeight:5,transition:"height 0.4s"}}/>;
      })}
    </div>
  );
}
// ── GPS ROUTE MAP ─────────────────────────────────────────────────────────────
function RouteMap({ path }) {
  if(!path||path.length<2) return (
    <div style={{width:"100%",height:"100%",display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",gap:8}}>
      <div style={{width:34,height:34,borderRadius:"50%",border:"1.5px solid rgba(255,255,255,0.2)",display:"flex",alignItems:"center",justifyContent:"center",animation:"gpsPing 2s ease-in-out infinite"}}>
        <span style={{fontSize:14,opacity:0.5}}>📍</span>
      </div>
      <span style={{fontSize:10,color:"rgba(255,255,255,0.35)",letterSpacing:"0.12em",textTransform:"uppercase",fontFamily:F}}>Acquiring GPS</span>
      <style>{`@keyframes gpsPing{0%,100%{opacity:0.4;transform:scale(1)}50%{opacity:1;transform:scale(1.12)}}`}</style>
    </div>
  );
   const lats=path.map(p=>p.lat), lngs=path.map(p=>p.lng);
  const la=Math.min(...lats), lb=Math.max(...lats);
  const ln=Math.min(...lngs), lx=Math.max(...lngs);
  const pd=0.0002, W=320, H=200;
  const X = g => ((g-ln+pd)/((lx-ln+pd*2)||0.001))*W;
  const Y = l => H - ((l-la+pd)/((lb-la+pd*2)||0.001))*H;
  const pts = path.map(p=>`${X(p.lng).toFixed(2)},${Y(p.lat).toFixed(2)}`).join(" ");
  const last = path[path.length-1];
  const first = path[0];
 // grid lines
  const grid = [];
  for(let i=1;i<4;i++){
    grid.push(`M0,${(H*i/4).toFixed(1)} L${W},${(H*i/4).toFixed(1)}`);
    grid.push(`M${(W*i/4).toFixed(1)},0 L${(W*i/4).toFixed(1)},${H}`);
  }
   return (
    <svg width="100%" viewBox={`0 0 ${W} ${H}`} style={{display:"block"}}>
      <defs>
        <linearGradient id="routeGrad" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0%"   stopColor="rgba(255,255,255,0.3)"/>
          <stop offset="50%"  stopColor="rgba(255,255,255,1)"/>
          <stop offset="100%" stopColor="rgba(255,255,255,0.3)"/>
        </linearGradient>
        <filter id="glow">
          <feGaussianBlur stdDeviation="2" result="blur"/>
          <feMerge><feMergeNode in="blur"/><feMergeNode in="SourceGraphic"/></feMerge>
        </filter>
      </defs>
       {/* grid */}
      <path d={grid.join(" ")} stroke="rgba(255,255,255,0.05)" strokeWidth="0.5" fill="none"/>

      {/* route shadow glow */}
      <polyline points={pts} fill="none" stroke="rgba(255,255,255,0.2)" strokeWidth="6" strokeLinejoin="round" strokeLinecap="round" filter="url(#glow)"/>

      {/* route main line */}
      <polyline points={pts} fill="none" stroke="url(#routeGrad)" strokeWidth="2.5" strokeLinejoin="round" strokeLinecap="round"/>

      {/* start dot */}
      <circle cx={X(first.lng)} cy={Y(first.lat)} r="4" fill="rgba(255,255,255,0.35)" stroke="rgba(255,255,255,0.6)" strokeWidth="1"/>

      {/* current position pulsing */}
      <circle cx={X(last.lng)} cy={Y(last.lat)} r="12" fill="rgba(255,255,255,0.06)"/>
      <circle cx={X(last.lng)} cy={Y(last.lat)} r="7"  fill="rgba(255,255,255,0.15)"/>
      <circle cx={X(last.lng)} cy={Y(last.lat)} r="4"  fill="white"/>
      <circle cx={X(last.lng)} cy={Y(last.lat)} r="2"  fill="rgba(0,0,0,0.5)"/>
    </svg>
  );
}
// ── GLASS CARD ────────────────────────────────────────────────────────────────
const Glass = ({ children, style={}, onClick }) => (
  <div onClick={onClick} style={{
    background:"rgba(255,255,255,0.08)",
    backdropFilter:"blur(24px)",
    WebkitBackdropFilter:"blur(24px)",
    border:"1px solid rgba(255,255,255,0.13)",
    borderRadius:22,
    ...style,
  }}>
    {children}
  </div>
);
// ── STAT LABEL ────────────────────────────────────────────────────────────────
const StatLabel = ({children}) => (
  <div style={{fontSize:11,fontWeight:500,color:"rgba(255,255,255,0.45)",letterSpacing:"0.06em",marginBottom:3,fontFamily:F}}>{children}</div>
);
// ── NAV ───────────────────────────────────────────────────────────────────────
function NavBar({ screen, setScreen }) {
  const tabs=[
    {id:"home",   label:"Home",    icon:"⌂"},
    {id:"track",  label:"Track",   icon:"◉"},
    {id:"runs",   label:"Sessions",icon:"≡"},
    {id:"coach",  label:"Coach",   icon:"⬡"},
    {id:"profile",label:"Profile", icon:"⊙"},
  ];
  return (
    <div style={{position:"fixed",bottom:0,left:"50%",transform:"translateX(-50%)",width:"100%",maxWidth:480,zIndex:200,padding:"0 20px 28px"}}>
      <Glass style={{display:"flex",justifyContent:"space-around",padding:"11px 0",borderRadius:20}}>
        {tabs.map(t=>(
          <button key={t.id} onClick={()=>setScreen(t.id)} style={{display:"flex",flexDirection:"column",alignItems:"center",gap:3,background:"none",border:"none",cursor:"pointer",padding:"4px 14px"}}>
            <span style={{fontSize:t.id==="track"?22:16,color:screen===t.id?"#fff":"rgba(255,255,255,0.28)",lineHeight:1,transition:"color 0.2s"}}>{t.icon}</span>
            <span style={{fontSize:9,color:screen===t.id?"rgba(255,255,255,0.9)":"rgba(255,255,255,0.22)",fontWeight:screen===t.id?600:400,letterSpacing:"0.07em",textTransform:"uppercase",fontFamily:F}}>{t.label}</span>
          </button>
        ))}
      </Glass>
    </div>
  );
}
// ── INPUT ─────────────────────────────────────────────────────────────────────
function Inp({label,value,onChange,placeholder,type="text"}) {
  return (
    <div style={{flex:1}}>
      {label&&<div style={{fontSize:10,fontWeight:600,color:"rgba(255,255,255,0.3)",letterSpacing:"0.12em",textTransform:"uppercase",marginBottom:8,fontFamily:F}}>{label}</div>}
      <input type={type} placeholder={placeholder} value={value} onChange={e=>onChange(e.target.value)}
        style={{width:"100%",padding:"14px 16px",borderRadius:14,border:"1px solid rgba(255,255,255,0.1)",background:"rgba(255,255,255,0.07)",color:"#fff",fontSize:15,outline:"none",boxSizing:"border-box",fontFamily:F,WebkitAppearance:"none",backdropFilter:"blur(10px)"}}
        onFocus={e=>e.target.style.border="1px solid rgba(255,255,255,0.45)"}
        onBlur={e=>e.target.style.border="1px solid rgba(255,255,255,0.1)"}
      />
    </div>
  );
}
// ── UPGRADE MODAL ─────────────────────────────────────────────────────────────
function GateModal({onClose,onUpgrade}) {
  return (
    <div onClick={onClose} style={{position:"fixed",inset:0,background:"rgba(0,0,0,0.75)",backdropFilter:"blur(20px)",zIndex:400,display:"flex",alignItems:"flex-end",justifyContent:"center",fontFamily:F}}>
      <div onClick={e=>e.stopPropagation()} style={{background:"rgba(12,12,12,0.97)",borderRadius:"24px 24px 0 0",border:"1px solid rgba(255,255,255,0.1)",width:"100%",maxWidth:480,padding:"28px 24px 52px"}}>
        <div style={{width:36,height:3,background:"rgba(255,255,255,0.18)",borderRadius:99,margin:"0 auto 26px"}}/>
        <div style={{fontSize:24,fontWeight:800,color:"#fff",marginBottom:6,letterSpacing:"-0.5px"}}>Upgrade to Pro</div>
        <div style={{fontSize:14,color:"rgba(255,255,255,0.4)",marginBottom:22,lineHeight:1.7}}>Unlock your full coaching experience.</div>
        {["Unlimited AI coach messages","Full GPS history & route replay","Advanced pace & split analytics","Custom training plans"].map(f=>(
          <div key={f} style={{display:"flex",alignItems:"center",gap:14,padding:"12px 0",borderBottom:"1px solid rgba(255,255,255,0.06)"}}>
            <div style={{width:5,height:5,borderRadius:"50%",background:"rgba(255,255,255,0.7)",flexShrink:0}}/>
            <span style={{fontSize:14,color:"rgba(255,255,255,0.7)"}}>{f}</span>
          </div>
        ))}
        <button onClick={onUpgrade} style={{width:"100%",marginTop:22,padding:"17px",borderRadius:16,border:"none",background:"#fff",color:"#000",fontWeight:700,fontSize:16,cursor:"pointer",fontFamily:F}>Upgrade — $9.99 / month / month</button>
        <div style={{textAlign:"center",marginTop:12,fontSize:12,color:"rgba(255,255,255,0.22)"}}>Secured by Stripe · Cancel anytime</div>
      </div>
    </div>
  );
}
// ── ONBOARDING ────────────────────────────────────────────────────────────────
function Onboarding({onDone}) {
  const [step,setStep]=useState(0);
  const [fn,setFn]=useState(""); const [ln,setLn]=useState("");
  const [age,setAge]=useState(""); const [em,setEm]=useState("");
  const [pw,setPw]=useState(""); const [ht,setHt]=useState("");
  const [wt,setWt]=useState(""); const [st,setSt]=useState("");
  const [gen,setGen]=useState(""); const [goal,setGoal]=useState(null);
  const [sport,setSport]=useState(null);
  const ok=[fn.trim()&&ln.trim()&&age&&em.includes("@")&&pw.length>=6,ht&&wt,goal!==null,sport!==null][step];
  const bgImg=(sport||SPORTS[0]).img;

  return (
    <div style={{minHeight:"100vh",background:"#000",display:"flex",justifyContent:"center",fontFamily:F,color:"#fff",position:"relative",overflow:"hidden"}}>
      <div style={{position:"fixed",inset:0,zIndex:0}}>
        <img src={bgImg} alt="" style={{width:"100%",height:"100%",objectFit:"cover",opacity:0.2,filter:"blur(24px)",transform:"scale(1.1)",transition:"opacity 0.5s"}}/>
        <div style={{position:"absolute",inset:0,background:"linear-gradient(to bottom,rgba(0,0,0,0.6),rgba(0,0,0,0.96))"}}/>
      </div>
      <div style={{width:"100%",maxWidth:480,padding:"0 24px",display:"flex",flexDirection:"column",minHeight:"100vh",position:"relative",zIndex:1}}>
        <div style={{paddingTop:60,paddingBottom:22}}>
          <div style={{fontSize:10,fontWeight:700,color:"rgba(255,255,255,0.3)",letterSpacing:"0.22em",textTransform:"uppercase"}}>STRYD</div>
          <div style={{fontSize:28,fontWeight:800,letterSpacing:"-0.7px",marginTop:8,lineHeight:1.1}}>{["Create Account","Your Body","Your Goal","Pick Your Sport"][step]}</div>
          <div style={{fontSize:13,color:"rgba(255,255,255,0.38)",marginTop:5}}>{["Set up your account","For accurate tracking","What are you training for?","What's your main activity?"][step]}</div>
          <div style={{display:"flex",gap:4,marginTop:16}}>
            {[0,1,2,3].map(i=><div key={i} style={{flex:1,height:2,borderRadius:99,background:i<=step?"rgba(255,255,255,0.85)":"rgba(255,255,255,0.1)",transition:"background 0.3s"}}/>)}
          </div>
        </div>

<div style={{flex:1,overflowY:"auto",paddingBottom:16}}>
          {step===0&&<div style={{display:"flex",flexDirection:"column",gap:12}}>
            <div style={{display:"flex",gap:10}}><Inp label="First name" value={fn} onChange={setFn} placeholder="Alex"/><Inp label="Last name" value={ln} onChange={setLn} placeholder="Chen"/></div>
            <Inp label="Age" value={age} onChange={setAge} placeholder="26" type="number"/>
            <Inp label="Email" value={em} onChange={setEm} placeholder="alex@email.com" type="email"/>
            <Inp label="Password" value={pw} onChange={setPw} placeholder="Min 6 characters" type="password"/>
          </div>}

          {step===1&&<div style={{display:"flex",flexDirection:"column",gap:12}}>
            <div style={{display:"flex",gap:10}}><Inp label="Height (cm)" value={ht} onChange={setHt} placeholder="178" type="number"/><Inp label="Weight (kg)" value={wt} onChange={setWt} placeholder="72" type="number"/></div>
            <Inp label="Stride length (cm)" value={st} onChange={setSt} placeholder="75 — optional" type="number"/>
            <div>
              <div style={{fontSize:10,fontWeight:600,color:"rgba(255,255,255,0.3)",letterSpacing:"0.12em",textTransform:"uppercase",marginBottom:8}}>Gender</div>
              <div style={{display:"flex",gap:8}}>
                {["Male","Female","Other"].map(g=>(
                  <button key={g} onClick={()=>setGen(g)} style={{flex:1,padding:"13px",borderRadius:12,border:`1px solid ${gen===g?"rgba(255,255,255,0.7)":"rgba(255,255,255,0.1)"}`,background:gen===g?"rgba(255,255,255,0.12)":"rgba(255,255,255,0.04)",color:gen===g?"#fff":"rgba(255,255,255,0.38)",fontSize:14,fontWeight:gen===g?600:400,cursor:"pointer",fontFamily:F,transition:"all 0.15s"}}>{g}</button>
                ))}
              </div>
            </div>
            <Glass style={{padding:"12px 16px",borderRadius:14}}>
              <div style={{fontSize:12,color:"rgba(255,255,255,0.38)",lineHeight:1.7}}>Stride length improves step accuracy. Leave blank to auto-estimate from height.</div>
            </Glass>
          </div>}

          {step===2&&<div style={{display:"flex",flexDirection:"column",gap:8}}>
            {GOALS.map(g=>(
              <button key={g.id} onClick={()=>setGoal(g)} style={{display:"flex",alignItems:"center",justifyContent:"space-between",padding:"15px 18px",borderRadius:16,border:`1px solid ${goal?.id===g.id?"rgba(255,255,255,0.5)":"rgba(255,255,255,0.07)"}`,background:goal?.id===g.id?"rgba(255,255,255,0.1)":"rgba(255,255,255,0.03)",cursor:"pointer",fontFamily:F,transition:"all 0.15s"}}>
                <div style={{display:"flex",alignItems:"center",gap:14}}>
                  <span style={{fontSize:22}}>{g.emoji}</span>
                  <div style={{textAlign:"left"}}>
                    <div style={{fontSize:14,fontWeight:600,color:goal?.id===g.id?"#fff":"rgba(255,255,255,0.75)"}}>{g.label}</div>
                    <div style={{fontSize:12,color:"rgba(255,255,255,0.32)",marginTop:2}}>{g.sub}</div>
                  </div>
                </div>
                {goal?.id===g.id&&<div style={{width:8,height:8,borderRadius:"50%",background:"rgba(255,255,255,0.8)"}}/>}
              </button>
            ))}
          </div>}

          {step===3&&<div style={{display:"flex",flexDirection:"column",gap:10}}>
            {SPORTS.map(s=>(
              <button key={s.id} onClick={()=>setSport(s)} style={{borderRadius:18,border:`2px solid ${sport?.id===s.id?"rgba(255,255,255,0.75)":"transparent"}`,overflow:"hidden",cursor:"pointer",position:"relative",padding:0,background:"none",height:120,transition:"all 0.2s"}}>
                <img src={s.img} alt={s.label} style={{width:"100%",height:"100%",objectFit:"cover",display:"block",filter:sport?.id===s.id?"brightness(0.65)":"brightness(0.4)",transition:"filter 0.2s"}}/>
                <div style={{position:"absolute",inset:0,background:"linear-gradient(to right,rgba(0,0,0,0.7) 0%,rgba(0,0,0,0.05) 100%)"}}/>
                <div style={{position:"absolute",top:0,left:0,bottom:0,padding:"0 22px",display:"flex",alignItems:"center",gap:16}}>
                  <span style={{fontSize:28}}>{s.icon}</span>
                  <div>
                    <div style={{fontSize:17,fontWeight:700,color:"#fff",letterSpacing:"-0.3px",fontFamily:F}}>{s.label}</div>
                    <div style={{fontSize:12,color:"rgba(255,255,255,0.45)",marginTop:3,fontFamily:F}}>{s.tag} · GPS tracking</div>
                  </div>
                </div>
                {sport?.id===s.id&&<div style={{position:"absolute",top:14,right:16,width:22,height:22,borderRadius:"50%",background:"rgba(255,255,255,0.9)",display:"flex",alignItems:"center",justifyContent:"center"}}><span style={{fontSize:11,color:"#000",fontWeight:800}}>✓</span></div>}
              </button>
            ))}
          </div>}
        </div>

        <div style={{paddingBottom:48}}>
          <button onClick={()=>step<3?setStep(s=>s+1):onDone({firstName:fn,lastName:ln,age,email:em,height:ht,weight:wt,stride:st,gender:gen,goal,sport})}
            disabled={!ok}
            style={{width:"100%",padding:"17px",borderRadius:16,border:"none",background:ok?"rgba(255,255,255,0.95)":"rgba(255,255,255,0.08)",color:ok?"#000":"rgba(255,255,255,0.2)",fontWeight:700,fontSize:16,cursor:ok?"pointer":"not-allowed",fontFamily:F,letterSpacing:"-0.2px",transition:"all 0.2s"}}>
            {step<3?"Continue →":"Start Training →"}
          </button>
          {step>0&&<button onClick={()=>setStep(s=>s-1)} style={{width:"100%",padding:"13px",marginTop:8,borderRadius:12,border:"none",background:"transparent",color:"rgba(255,255,255,0.28)",fontSize:14,cursor:"pointer",fontFamily:F}}>← Back</button>}
        </div>
      </div>
    </div>
  );
}

// ── ACTIVE TRACKING ───────────────────────────────────────────────────────────
function ActiveScreen({profile,sport,onStop}) {
  const [elapsed,  setElapsed]  = useState(0);
  const [distM,    setDistM]    = useState(0);
  const [steps,    setSteps]    = useState(0);
  const [path,     setPath]     = useState([]);
  const [paceHist, setPaceHist] = useState([]);
  const [splits,   setSplits]   = useState([]);
  const [tip,      setTip]      = useState(null);
  const [paused,   setPaused]   = useState(false);
  const [gpsMode,  setGpsMode]  = useState("waiting"); // waiting|real|denied

  const distRef=useRef(0), splitRef=useRef(0), pathRef=useRef([]);
  const stepRef=useRef(0), elRef=useRef(0), paceRef=useRef([]);
  const watchRef=useRef(null);

  const strideM = profile?.stride
    ? parseFloat(profile.stride)/100
    : (parseFloat(profile?.height||170)*0.413)/100;

  // Request GPS permission immediately and watch
  useEffect(()=>{
    if(paused){
      if(watchRef.current!=null){ navigator.geolocation.clearWatch(watchRef.current); watchRef.current=null; }
      return;
    }
    if(!navigator.geolocation){ setGpsMode("denied"); return; }
    // Request with high accuracy — browser will show permission prompt
    watchRef.current = navigator.geolocation.watchPosition(
      pos => {
        setGpsMode("real");
        const {latitude:lat, longitude:lng, accuracy} = pos.coords;
        if(accuracy > 60) return; // filter poor readings
        const next = {lat, lng};
        const prev = pathRef.current[pathRef.current.length-1] || null;
        pathRef.current = [...pathRef.current, next];
        setPath([...pathRef.current]);
        if(prev){
          const d = haversineM(prev, next);
          if(d < 0.3) return; // ignore GPS jitter
          distRef.current += d;
          setDistM(distRef.current);
          // km splits
          const kmDone = Math.floor(distRef.current/1000);
          if(kmDone > splitRef.current){
            splitRef.current = kmDone;
            const pace = elRef.current>0&&distRef.current>0 ? (elRef.current/60)/(distRef.current/1000) : 0;
            setSplits(s=>[...s,{km:kmDone, timeS:elRef.current, pace}]);
          }
          // steps
          stepRef.current += Math.max(1, Math.round(d/strideM));
          setSteps(stepRef.current);
          // pace history
          if(distRef.current > 0){
            const pace = (elRef.current/60)/(distRef.current/1000);
            if(pace>0.5&&pace<60){ paceRef.current=[...paceRef.current.slice(-60),pace]; setPaceHist([...paceRef.current]); }
          }
        }
      },
      err => {
        console.warn("GPS:", err.code, err.message);
        setGpsMode("denied");
      },
      { enableHighAccuracy:true, maximumAge:1000, timeout:15000 }
    );
    return ()=>{ if(watchRef.current!=null){ navigator.geolocation.clearWatch(watchRef.current); watchRef.current=null; } };
  },[paused, strideM]);

  // 1s timer
  useEffect(()=>{
    if(paused) return;
    const id=setInterval(()=>{ elRef.current+=1; setElapsed(elRef.current); if(elRef.current%90===0) setTip(TIPS[Math.floor(Math.random()*TIPS.length)]); },1000);
    return ()=>clearInterval(id);
  },[paused]);

  const distKm = distM/1000;
  const pace   = elRef.current>5&&distKm>0.005 ? (elRef.current/60)/distKm : 0;
  const cals   = Math.round((elapsed/60)*(parseFloat(profile?.weight)||70)*0.0175*7);
  const cadence= elapsed>0 ? Math.round((steps/elapsed)*60) : 0;
  const bestPace = paceHist.length>0 ? Math.min(...paceHist.filter(p=>p>0)) : 0;

  const handlePause=()=>setPaused(p=>!p);
  const handleFinish=()=>{
    if(watchRef.current!=null){ navigator.geolocation.clearWatch(watchRef.current); watchRef.current=null; }
    onStop({duration:elRef.current,distM:distRef.current,steps:stepRef.current,path:[...pathRef.current],paceData:[...paceRef.current],splits:[...splits],calories:cals,avgPace:elRef.current>0&&distRef.current>0?(elRef.current/60)/(distRef.current/1000):0});
  };

  return (
    <div style={{minHeight:"100vh",background:"#000",fontFamily:F,color:"#fff",maxWidth:480,margin:"0 auto",position:"relative",overflowY:"auto",overflowX:"hidden"}}>
      <style>{`@keyframes liveDot{0%,100%{opacity:1}50%{opacity:0.2}}`}</style>

      {/* Full-screen blurred athlete background — exactly like reference */}
      <div style={{position:"fixed",inset:0,zIndex:0,maxWidth:480,margin:"0 auto"}}>
        <img src={sport?.img} alt="" style={{width:"100%",height:"100%",objectFit:"cover",objectPosition:"center top",opacity:0.35,filter:"blur(16px)",transform:"scale(1.06)"}}/>
        <div style={{position:"absolute",inset:0,background:"linear-gradient(160deg,rgba(0,0,0,0.25) 0%,rgba(0,0,0,0.55) 40%,rgba(0,0,0,0.88) 80%,rgba(0,0,0,0.98) 100%)"}}/>
      </div>

      <div style={{position:"relative",zIndex:1,minHeight:"100vh",display:"flex",flexDirection:"column",padding:"0 20px"}}>

        {/* ── TOP BAR ── */}
        <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",paddingTop:52,paddingBottom:16}}>
          <div>
            <div style={{fontSize:10,fontWeight:600,color:"rgba(255,255,255,0.35)",letterSpacing:"0.16em",textTransform:"uppercase"}}>{nowDate()}</div>
            <div style={{fontSize:18,fontWeight:700,color:"#fff",marginTop:3,letterSpacing:"-0.3px"}}>{sport?.label} Session</div>
          </div>
          <div style={{display:"flex",alignItems:"center",gap:7,padding:"7px 14px",borderRadius:99,background:"rgba(255,255,255,0.08)",border:"1px solid rgba(255,255,255,0.12)",backdropFilter:"blur(10px)"}}>
            <div style={{width:6,height:6,borderRadius:"50%",background:paused?"rgba(255,255,255,0.25)":"#fff",animation:paused?"none":"liveDot 1.6s infinite"}}/>
            <span style={{fontSize:10,fontWeight:700,color:paused?"rgba(255,255,255,0.3)":"#fff",letterSpacing:"0.12em"}}>{paused?"PAUSED":gpsMode==="waiting"?"LOCATING…":"LIVE"}</span>
          </div>
        </div>

        {/* GPS denied warning */}
        {gpsMode==="denied"&&(
          <Glass style={{padding:"11px 15px",borderRadius:14,marginBottom:10,display:"flex",gap:10,alignItems:"center"}}>
            <span style={{fontSize:15}}>⚠️</span>
            <span style={{fontSize:12,color:"rgba(255,255,255,0.55)",lineHeight:1.5}}>GPS denied. Allow location access in browser settings to track distance. Timer still running.</span>
          </Glass>
        )}

        {/* ── MAIN GLASS CARD — exactly like reference ── */}
        <Glass style={{borderRadius:28,overflow:"hidden",flex:"0 0 auto",marginBottom:12}}>

          {/* Bleed-through: show sport image THROUGH the card at low opacity */}
          <div style={{position:"relative"}}>
            <div style={{position:"absolute",inset:0,overflow:"hidden",borderRadius:28,zIndex:0}}>
              <img src={sport?.img} alt="" style={{width:"100%",height:"100%",objectFit:"cover",opacity:0.18,filter:"blur(4px)"}}/>
            </div>
            <div style={{position:"relative",zIndex:1,padding:"22px 20px 18px"}}>

              {/* Time — top left, large */}
              <div style={{marginBottom:20}}>
                <StatLabel>Time</StatLabel>
                <div style={{fontSize:58,fontWeight:800,color:"#fff",letterSpacing:"-3px",lineHeight:1,fontVariantNumeric:"tabular-nums"}}>{fmtTime(elapsed)}</div>
              </div>

              <div style={{height:"1px",background:"rgba(255,255,255,0.08)",marginBottom:18}}/>

              {/* Distance + waveform */}
              <div style={{marginBottom:4}}>
                <div style={{display:"flex",alignItems:"baseline",justifyContent:"space-between",marginBottom:4}}>
                  <StatLabel>Distance</StatLabel>
                  <span style={{fontSize:10,color:"rgba(255,255,255,0.3)"}}>Steps: {steps.toLocaleString()}</span>
                </div>
                <div style={{fontSize:44,fontWeight:800,color:"#fff",letterSpacing:"-2px",lineHeight:1.05}}>{fmtDist(distM)}</div>
                <div style={{marginTop:10}}><Waveform data={paceHist.length>3?paceHist:null} h={40}/></div>
              </div>

              <div style={{height:"1px",background:"rgba(255,255,255,0.08)",margin:"14px 0"}}/>

              {/* Pace + waveform */}
              <div style={{marginBottom:4}}>
                <div style={{display:"flex",alignItems:"baseline",justifyContent:"space-between",marginBottom:4}}>
                  <StatLabel>Pace</StatLabel>
                  {bestPace>0&&<span style={{fontSize:10,color:"rgba(255,255,255,0.3)"}}>Best: {fmtPace(bestPace)}</span>}
                </div>
                <div style={{fontSize:44,fontWeight:800,color:"#fff",letterSpacing:"-2px",lineHeight:1.05}}>{fmtPace(pace)}<span style={{fontSize:16,fontWeight:400,color:"rgba(255,255,255,0.38)",marginLeft:5}}>/km</span></div>
                <div style={{marginTop:10}}><Waveform data={paceHist.length>3?[...paceHist].map((v,i,a)=>a[a.length-1-i]):null} h={40}/></div>
              </div>
              <div style={{height:"1px",background:"rgba(255,255,255,0.08)",margin:"14px 0"}}/>

              {/* 3 mini stats row */}
              <div style={{display:"flex"}}>
                {[
                  {l:"Calories", v:`${cals}`, u:"kcal"},
                  {l:"Cadence",  v:elapsed>0?`${cadence}`:"--", u:"spm"},
                  {l:"Splits",   v:`${splits.length}`, u:"km done"},
                ].map((m,i)=>(
                  <div key={m.l} style={{flex:1,textAlign:"center",borderRight:i<2?"1px solid rgba(255,255,255,0.07)":"none"}}>
                    <div style={{fontSize:9,color:"rgba(255,255,255,0.3)",letterSpacing:"0.08em",textTransform:"uppercase",marginBottom:4}}>{m.l}</div>
                    <div style={{fontSize:16,fontWeight:700,color:"rgba(255,255,255,0.8)"}}>{m.v}</div>
                    <div style={{fontSize:10,color:"rgba(255,255,255,0.28)",marginTop:1}}>{m.u}</div>
                  </div>
                ))}
              </div>

              <div style={{height:"1px",background:"rgba(255,255,255,0.08)",margin:"14px 0"}}/>

              {/* Split bars — like reference bottom bars */}
              <div>
                <div style={{display:"flex",justifyContent:"space-between",marginBottom:10}}>
                  <StatLabel>Km Splits</StatLabel>
                  {splits.length>0&&<span style={{fontSize:10,color:"rgba(255,255,255,0.28)"}}>{splits.length} completed</span>}
                </div>
                <SplitBars splits={splits}/>
              </div>

            </div>
          </div>
        </Glass>

        {/* ── GPS ROUTE MAP ── */}
        <Glass style={{borderRadius:22,overflow:"hidden",height:180,marginBottom:12,flex:"0 0 auto"}}>
          <RouteMap path={path}/>
        </Glass>

        {/* Health tip */}
        {tip&&(
          <Glass style={{padding:"12px 16px",borderRadius:16,display:"flex",gap:10,alignItems:"flex-start",marginBottom:12,flex:"0 0 auto"}}>
            <span style={{fontSize:15,flexShrink:0}}>💡</span>
            <span style={{fontSize:13,color:"rgba(255,255,255,0.6)",lineHeight:1.55}}>{tip}</span>
          </Glass>
        )}

        {/* Controls */}
        <div style={{display:"flex",gap:10,paddingBottom:36,marginTop:"auto",flex:"0 0 auto"}}>
          <button onClick={handlePause} style={{flex:1,padding:"16px",borderRadius:16,border:"1px solid rgba(255,255,255,0.14)",background:"rgba(255,255,255,0.08)",color:"#fff",fontWeight:600,fontSize:15,cursor:"pointer",fontFamily:F,backdropFilter:"blur(12px)"}}>
            {paused?"▶  Resume":"⏸  Pause"}
          </button>
          <button onClick={handleFinish} style={{flex:1,padding:"16px",borderRadius:16,border:"none",background:"rgba(255,255,255,0.92)",color:"#000",fontWeight:700,fontSize:15,cursor:"pointer",fontFamily:F}}>
            ■  Finish
          </button>
        </div>
      </div>
    </div>
  );
}

// ── SESSION DETAIL ─────────────────────────────────────────────────────────────
function SessionDetail({session,onBack}) {
  const sp = SPORTS.find(s=>s.id===session.sport?.id)||session.sport;
  return (
    <div style={{minHeight:"100vh",background:"#000",fontFamily:F,color:"#fff",maxWidth:480,margin:"0 auto",position:"relative",overflowY:"auto"}}>
      <div style={{position:"fixed",inset:0,zIndex:0,maxWidth:480,margin:"0 auto"}}>
        <img src={sp?.img} alt="" style={{width:"100%",height:"100%",objectFit:"cover",opacity:0.2,filter:"blur(22px)",transform:"scale(1.07)"}}/>
        <div style={{position:"absolute",inset:0,background:"linear-gradient(to bottom,rgba(0,0,0,0.5),rgba(0,0,0,0.97))"}}/>
      </div>
      <div style={{position:"relative",zIndex:1,padding:"52px 20px 40px"}}>

        {/* Back */}
        <div style={{display:"flex",alignItems:"center",gap:12,marginBottom:24}}>
          <button onClick={onBack} style={{width:36,height:36,borderRadius:99,border:"1px solid rgba(255,255,255,0.13)",background:"rgba(255,255,255,0.06)",color:"#fff",fontSize:18,cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0,backdropFilter:"blur(8px)"}}>←</button>
          <div>
            <div style={{fontSize:10,fontWeight:600,color:"rgba(255,255,255,0.3)",letterSpacing:"0.14em",textTransform:"uppercase"}}>STRYD · Session</div>
            <div style={{fontSize:18,fontWeight:700,letterSpacing:"-0.3px",marginTop:2}}>{sp?.label||"Run"}</div>
          </div>
          <div style={{marginLeft:"auto",fontSize:12,color:"rgba(255,255,255,0.3)"}}>{session.date} · {session.time}</div>
        </div>

        {/* Main stat card — matches reference exactly */}
        <Glass style={{borderRadius:26,overflow:"hidden",marginBottom:14,position:"relative"}}>
          <div style={{position:"absolute",inset:0,overflow:"hidden",borderRadius:26,zIndex:0}}>
            <img src={sp?.img} alt="" style={{width:"100%",height:"100%",objectFit:"cover",opacity:0.22,filter:"blur(6px)"}}/>
          </div>
          <div style={{position:"relative",zIndex:1,padding:"22px 20px 20px"}}>

            <div style={{marginBottom:18}}>
              <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-end",marginBottom:4}}>
                <StatLabel>Distance</StatLabel>
                <span style={{fontSize:11,color:"rgba(255,255,255,0.3)"}}>Steps: {session.steps?.toLocaleString()}</span>
              </div>
              <div style={{fontSize:50,fontWeight:800,color:"#fff",letterSpacing:"-2.5px",lineHeight:1}}>{fmtDist(session.distM)}</div>
              {session.paceData&&session.paceData.length>2&&<div style={{marginTop:10}}><Waveform data={session.paceData} h={40}/></div>}
            </div>

            <div style={{height:"1px",background:"rgba(255,255,255,0.08)",marginBottom:16}}/>

            <div style={{marginBottom:18}}>
              <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-end",marginBottom:4}}>
                <StatLabel>Pace</StatLabel>
                {session.splits&&session.splits.length>0&&(
                  <span style={{fontSize:11,color:"rgba(255,255,255,0.3)"}}>Best: {fmtPace(Math.min(...session.splits.map(s=>s.pace||99).filter(p=>p>0)))}</span>
                )}
              </div>
              <div style={{fontSize:50,fontWeight:800,color:"#fff",letterSpacing:"-2.5px",lineHeight:1}}>{fmtPace(session.avgPace)}<span style={{fontSize:16,fontWeight:400,color:"rgba(255,255,255,0.35)",marginLeft:5}}>/km</span></div>
              {session.paceData&&session.paceData.length>2&&<div style={{marginTop:10}}><Waveform data={[...session.paceData].reverse()} h={40}/></div>}
            </div>

            <div style={{height:"1px",background:"rgba(255,255,255,0.08)",marginBottom:16}}/>

            <div style={{marginBottom:18}}>
              <StatLabel>Time</StatLabel>
              <div style={{fontSize:50,fontWeight:800,color:"#fff",letterSpacing:"-2.5px",lineHeight:1}}>{fmtTime(session.duration)}</div>
            </div>

            {session.splits&&session.splits.length>0&&(
              <>
                <div style={{height:"1px",background:"rgba(255,255,255,0.08)",marginBottom:14}}/>
                <StatLabel>Km Splits</StatLabel>
                <SplitBars splits={session.splits}/>
              </>
            )}
          </div>
        </Glass>

        {/* Route map */}
        {session.path&&session.path.length>2&&(
          <Glass style={{borderRadius:22,overflow:"hidden",height:190,marginBottom:14}}>
            <RouteMap path={session.path}/>
          </Glass>
        )}

        {/* Extra stats */}
        <div style={{display:"flex",gap:10}}>
          {[{l:"Calories",v:`${session.calories}`,u:"kcal"},{l:"Cadence",v:session.duration>0?`${Math.round((session.steps/session.duration)*60)}`:"--",u:"spm avg"}].map(s=>(
            <Glass key={s.l} style={{flex:1,padding:"16px",borderRadius:18,textAlign:"center"}}>
              <div style={{fontSize:10,color:"rgba(255,255,255,0.3)",letterSpacing:"0.08em",textTransform:"uppercase",marginBottom:6}}>{s.l}</div>
              <div style={{fontSize:26,fontWeight:700,color:"#fff",letterSpacing:"-0.5px"}}>{s.v}</div>
              <div style={{fontSize:11,color:"rgba(255,255,255,0.28)",marginTop:3}}>{s.u}</div>
            </Glass>
          ))}
        </div>
      </div>
    </div>
  );
}

// ── ROOT APP ──────────────────────────────────────────────────────────────────
export default function App() {
  const [profile,     setProfile]     = useState(null);
  const [screen,      setScreen]      = useState("home");
  const [tracking,    setTracking]    = useState(false);
  const [activeSport, setActiveSport] = useState(null);
  const [sessions,    setSessions]    = useState([]);
  const [detail,      setDetail]      = useState(null);
  const [eFn,setEFn]=useState(""); const [eLn,setELn]=useState("");
  const [eAg,setEAg]=useState(""); const [eHt,setEHt]=useState("");
  const [eWt,setEWt]=useState(""); const [eSt,setESt]=useState("");
  const [editing,setEditing]=useState(false);
  const [msgs,setMsgs]=useState([{role:"ai",text:"Hey! I'm your STRYD coach. Ask me about training plans, pacing, recovery, or nutrition."}]);
  const [chatIn,setChatIn]=useState(""); const [chatLoad,setChatLoad]=useState(false);
  const [uses,setUses]=useState(0); const [isPro,setIsPro]=useState(false);
  const [gate,setGate]=useState(false);
  const chatEnd=useRef();
  const motiv=MOTIV[new Date().getDay()%MOTIV.length];

  useEffect(()=>{chatEnd.current?.scrollIntoView({behavior:"smooth"});},[msgs,chatLoad]);

  const startTracking=s=>{setActiveSport(s);setTracking(true);};
  const stopTracking=data=>{setTracking(false);setSessions(s=>[{id:Date.now(),sport:activeSport,date:nowDate(),time:nowTime(),...data},...s]);setScreen("runs");};

  const sendCoach=async()=>{
    if(!chatIn.trim()||chatLoad) return;
    if(!isPro&&uses>=5){setGate(true);return;}
    const msg=chatIn.trim(); setChatIn("");
    setMsgs(m=>[...m,{role:"user",text:msg}]); setChatLoad(true);
    const ctx=profile?`Athlete: ${profile.firstName}, ${profile.age}y, ${profile.height}cm, ${profile.weight}kg, goal: ${profile.goal?.label}.`:"";
    const rec=sessions.slice(0,3).map(s=>`${s.sport?.label}: ${fmtDist(s.distM)}, ${fmtTime(s.duration)}`).join("; ");
    try{
      // ── YOUR BACKEND URL — update this after deploying to Railway ──────────
      const BACKEND = "https://stryd-backend-production.up.railway.app";
      const r=await fetch(`${BACKEND}/api/coach`,{
        method:"POST",
        headers:{"Content-Type":"application/json"},
        body:JSON.stringify({
          messages:[...msgs.slice(-6),{role:"user",text:msg}],
          profile: profile ? {
            firstName:profile.firstName, age:profile.age,
            height:profile.height, weight:profile.weight,
            goal:profile.goal, sport:profile.sport,
          } : null,
          recentSessions: sessions.slice(0,3).map(s=>({
            sport:s.sport?.label, dist:fmtDist(s.distM), time:fmtTime(s.duration),
          })),
        }),
      });
      if(!r.ok) throw new Error("Backend error");
      const d=await r.json();
      setMsgs(m=>[...m,{role:"ai",text:d.reply||"Try again."}]);
      setUses(u=>u+1);
    }catch(e){
      console.error("Coach error:",e);
      setMsgs(m=>[...m,{role:"ai",text:"⚠️ Could not reach AI coach. Make sure your backend is deployed and the URL is updated in the app."}]);
    }
    setChatLoad(false);
  };

  if(!profile) return <Onboarding onDone={p=>{setProfile(p);setEFn(p.firstName);setELn(p.lastName);setEAg(p.age);setEHt(p.height);setEWt(p.weight);setESt(p.stride||"");}}/>;
  if(tracking)  return <ActiveScreen profile={profile} sport={activeSport} onStop={stopTracking}/>;
  if(detail)    return <SessionDetail session={detail} onBack={()=>setDetail(null)}/>;

  const totalM=sessions.reduce((a,s)=>a+s.distM,0);
  const totalT=sessions.reduce((a,s)=>a+s.duration,0);
  const streak=Math.min(sessions.length+2,21);
  const last=sessions[0];
  const bestP=sessions.filter(s=>s.avgPace>0).length?Math.min(...sessions.map(s=>s.avgPace).filter(p=>p>0)):0;

  const BG = () => (
    <div style={{position:"fixed",inset:0,zIndex:0}}>
      <img src={profile.sport?.img||SPORTS[0].img} alt="" style={{width:"100%",height:"100%",objectFit:"cover",opacity:0.1,filter:"blur(28px)",transform:"scale(1.1)"}}/>
      <div style={{position:"absolute",inset:0,background:"rgba(0,0,0,0.88)"}}/>
    </div>
  );

  const wrap=(children)=>(
    <div style={{minHeight:"100vh",background:"#000",display:"flex",justifyContent:"center",fontFamily:F,color:"#fff"}}>
      {gate&&<GateModal onClose={()=>setGate(false)} onUpgrade={()=>{setIsPro(true);setGate(false);}}/>}
      <div style={{width:"100%",maxWidth:480,minHeight:"100vh",position:"relative",paddingBottom:110}}>
        <BG/>
        <div style={{position:"relative",zIndex:1}}>{children}</div>
        <NavBar screen={screen} setScreen={setScreen}/>
      </div>
    </div>
  );

  // HOME
  if(screen==="home") return wrap(
    <div style={{padding:"56px 20px 0"}}>
      <div style={{fontSize:10,fontWeight:700,color:"rgba(255,255,255,0.25)",letterSpacing:"0.22em",textTransform:"uppercase"}}>STRYD</div>
      <div style={{fontSize:30,fontWeight:800,letterSpacing:"-0.8px",marginTop:6,lineHeight:1.1}}>Good day,<br/>{profile.firstName}</div>
      <div style={{fontSize:13,color:"rgba(255,255,255,0.32)",marginTop:8,fontStyle:"italic"}}>"{motiv}"</div>

      {/* Stats */}
      <div style={{display:"flex",gap:10,marginTop:20}}>
        {[{l:"Distance",v:fmtDist(totalM)},{l:"Active Time",v:fmtTime(totalT)},{l:"Streak",v:`${streak}d 🔥`}].map(s=>(
          <Glass key={s.l} style={{flex:1,padding:"14px 12px",borderRadius:16,textAlign:"center"}}>
            <div style={{fontSize:9,fontWeight:600,color:"rgba(255,255,255,0.3)",letterSpacing:"0.09em",textTransform:"uppercase",marginBottom:6}}>{s.l}</div>
            <div style={{fontSize:17,fontWeight:700,color:"#fff",letterSpacing:"-0.4px"}}>{s.v}</div>
          </Glass>
        ))}
      </div>
      {/* Quick Start */}
      <div style={{marginTop:18}}>
        <div style={{fontSize:10,fontWeight:600,color:"rgba(255,255,255,0.28)",letterSpacing:"0.12em",textTransform:"uppercase",marginBottom:12}}>Start Session</div>
        <div style={{display:"flex",gap:10}}>
          {SPORTS.map(s=>(
            <button key={s.id} onClick={()=>startTracking(s)} style={{flex:1,height:110,borderRadius:18,border:"1px solid rgba(255,255,255,0.07)",overflow:"hidden",cursor:"pointer",padding:0,background:"none",position:"relative"}}
              onTouchStart={e=>e.currentTarget.style.transform="scale(0.96)"}
              onTouchEnd={e=>e.currentTarget.style.transform="scale(1)"}>
              <img src={s.img} alt="" style={{width:"100%",height:"100%",objectFit:"cover",opacity:0.65}}/>
              <div style={{position:"absolute",inset:0,background:"linear-gradient(to top,rgba(0,0,0,0.88) 0%,rgba(0,0,0,0.05) 55%)"}}/>
              <div style={{position:"absolute",bottom:0,left:0,right:0,padding:"8px 10px",textAlign:"center"}}>
                <div style={{fontSize:18,marginBottom:2}}>{s.icon}</div>
                <div style={{fontSize:11,color:"#fff",fontWeight:700}}>{s.label}</div>
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Last session */}
      {last&&(
        <div style={{marginTop:18}}>
          <div style={{fontSize:10,fontWeight:600,color:"rgba(255,255,255,0.28)",letterSpacing:"0.12em",textTransform:"uppercase",marginBottom:12}}>Last Session</div>
          <Glass onClick={()=>setDetail(last)} style={{borderRadius:22,overflow:"hidden",cursor:"pointer"}}>
            {last.path&&last.path.length>2&&<div style={{height:90}}><RouteMap path={last.path}/></div>}
            <div style={{padding:"14px 18px"}}>
              <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:12}}>
                <div style={{display:"flex",alignItems:"center",gap:8}}>
                  <span style={{fontSize:16}}>{last.sport?.icon}</span>
                  <div>
                    <div style={{fontSize:14,fontWeight:600,color:"#fff"}}>{last.sport?.label}</div>
                    <div style={{fontSize:11,color:"rgba(255,255,255,0.3)",marginTop:1}}>{last.date} · {last.time}</div>
                  </div>
                </div>
                <span style={{color:"rgba(255,255,255,0.25)",fontSize:18}}>›</span>
              </div>
              <div style={{display:"flex"}}>
                {[{l:"Distance",v:fmtDist(last.distM)},{l:"Time",v:fmtTime(last.duration)},{l:"Pace",v:`${fmtPace(last.avgPace)}/km`},{l:"kcal",v:`${last.calories}`}].map((m,i)=>(
                  <div key={m.l} style={{flex:1,textAlign:"center",borderRight:i<3?"1px solid rgba(255,255,255,0.06)":"none"}}>
                    <div style={{fontSize:9,color:"rgba(255,255,255,0.28)",textTransform:"uppercase",letterSpacing:"0.07em",marginBottom:3}}>{m.l}</div>
                    <div style={{fontSize:13,fontWeight:600,color:"rgba(255,255,255,0.82)"}}>{m.v}</div>
                  </div>
                ))}
              </div>
            </div>
          </Glass>
        </div>
      )}

      {/* Empty state */}
      {sessions.length===0&&(
        <Glass style={{marginTop:18,padding:"28px 22px",borderRadius:22,textAlign:"center"}}>
          <div style={{fontSize:34,marginBottom:10}}>🏃</div>
          <div style={{fontSize:15,fontWeight:700,color:"#fff",marginBottom:6}}>Ready to run?</div>
          <div style={{fontSize:13,color:"rgba(255,255,255,0.38)",marginBottom:20,lineHeight:1.7}}>Choose a sport above to start your first GPS session.</div>
        </Glass>
      )}

      {/* Goal */}
      {profile.goal&&(
        <Glass style={{marginTop:14,padding:"16px 18px",borderRadius:20}}>
          <div style={{display:"flex",alignItems:"center",gap:12,marginBottom:12}}>
            <span style={{fontSize:20}}>{profile.goal.emoji}</span>
            <div style={{flex:1}}>
              <div style={{fontSize:13,fontWeight:600,color:"#fff"}}>{profile.goal.label}</div>
              <div style={{fontSize:11,color:"rgba(255,255,255,0.32)",marginTop:1}}>{profile.goal.sub}</div>
            </div>
            <div style={{fontSize:12,color:"rgba(255,255,255,0.3)"}}>{sessions.length} sessions</div>
          </div>
          <div style={{height:2,background:"rgba(255,255,255,0.07)",borderRadius:99}}>
            <div style={{width:`${Math.min(sessions.length*15,100)}%`,height:"100%",background:"rgba(255,255,255,0.65)",borderRadius:99,transition:"width 0.5s"}}/>
          </div>
        </Glass>
      )}
    </div>
  );

  // TRACK
  if(screen==="track") return wrap(
    <div style={{padding:"56px 20px 0"}}>
      <div style={{fontSize:10,fontWeight:700,color:"rgba(255,255,255,0.25)",letterSpacing:"0.22em",textTransform:"uppercase"}}>STRYD</div>
      <div style={{fontSize:28,fontWeight:800,letterSpacing:"-0.6px",marginTop:6}}>Track</div>
      <div style={{fontSize:13,color:"rgba(255,255,255,0.38)",marginTop:4}}>GPS · Pace · Steps · Splits</div>
      <div style={{marginTop:20,display:"flex",flexDirection:"column",gap:12}}>
        {SPORTS.map(s=>(
          <button key={s.id} onClick={()=>startTracking(s)} style={{display:"flex",alignItems:"center",borderRadius:20,border:"1px solid rgba(255,255,255,0.07)",overflow:"hidden",cursor:"pointer",padding:0,background:"none",transition:"transform 0.15s"}}
            onTouchStart={e=>e.currentTarget.style.transform="scale(0.98)"}
            onTouchEnd={e=>e.currentTarget.style.transform="scale(1)"}>
            <div style={{width:90,height:82,flexShrink:0,overflow:"hidden"}}>
              <img src={s.img} alt="" style={{width:"100%",height:"100%",objectFit:"cover",opacity:0.75}}/>
            </div>
            <div style={{flex:1,padding:"16px 18px",background:"rgba(255,255,255,0.05)",backdropFilter:"blur(12px)"}}>
              <div style={{fontSize:17,fontWeight:700,color:"#fff",letterSpacing:"-0.2px"}}>{s.icon} {s.label}</div>
              <div style={{fontSize:12,color:"rgba(255,255,255,0.35)",marginTop:4}}>{s.tag} · GPS · Pace · Step tracking</div>
            </div>
            <div style={{padding:"0 18px",background:"rgba(255,255,255,0.05)",alignSelf:"stretch",display:"flex",alignItems:"center",backdropFilter:"blur(12px)"}}>
              <span style={{color:"rgba(255,255,255,0.25)",fontSize:20}}>›</span>
            </div>
          </button>
        ))}
      </div>
    </div>
  );

  // RUNS
  if(screen==="runs") return wrap(
    <div style={{padding:"56px 20px 0"}}>
      <div style={{fontSize:10,fontWeight:700,color:"rgba(255,255,255,0.25)",letterSpacing:"0.22em",textTransform:"uppercase"}}>STRYD</div>
      <div style={{fontSize:28,fontWeight:800,letterSpacing:"-0.6px",marginTop:6}}>Sessions</div>
      <div style={{fontSize:13,color:"rgba(255,255,255,0.38)",marginTop:4}}>{sessions.length} recorded · tap for details</div>
      <div style={{marginTop:18,display:"flex",flexDirection:"column",gap:12}}>
        {sessions.length===0
          ?<Glass style={{padding:"40px 22px",borderRadius:22,textAlign:"center"}}>
            <div style={{fontSize:11,color:"rgba(255,255,255,0.25)",letterSpacing:"0.1em",textTransform:"uppercase",marginBottom:14}}>No sessions yet</div>
            <button onClick={()=>setScreen("track")} style={{padding:"12px 24px",borderRadius:12,border:"1px solid rgba(255,255,255,0.15)",background:"transparent",color:"rgba(255,255,255,0.7)",fontSize:14,fontWeight:600,cursor:"pointer",fontFamily:F}}>Start tracking →</button>
          </Glass>
          :sessions.map(s=>(
            <Glass key={s.id} onClick={()=>setDetail(s)} style={{borderRadius:22,overflow:"hidden",cursor:"pointer"}}>
              <div style={{height:80,position:"relative",overflow:"hidden"}}>
                <img src={s.sport?.img||SPORTS[0].img} alt="" style={{width:"100%",height:"100%",objectFit:"cover",opacity:0.5}}/>
                <div style={{position:"absolute",inset:0,background:"linear-gradient(to right,rgba(0,0,0,0.82),rgba(0,0,0,0.15))"}}/>
                <div style={{position:"absolute",inset:0,padding:"0 18px",display:"flex",alignItems:"center",justifyContent:"space-between"}}>
                  <div style={{display:"flex",alignItems:"center",gap:10}}>
                    <span style={{fontSize:22}}>{s.sport?.icon}</span>
                    <div>
                      <div style={{fontSize:14,fontWeight:700,color:"#fff"}}>{s.sport?.label}</div>
                      <div style={{fontSize:11,color:"rgba(255,255,255,0.4)",marginTop:1}}>{s.date} · {s.time}</div>
                    </div>
                  </div>
                  <span style={{color:"rgba(255,255,255,0.28)",fontSize:18}}>›</span>
                </div>
              </div>
              <div style={{padding:"12px 18px",display:"flex"}}>
                {[{l:"Dist",v:fmtDist(s.distM)},{l:"Time",v:fmtTime(s.duration)},{l:"Pace",v:`${fmtPace(s.avgPace)}/km`},{l:"kcal",v:`${s.calories}`}].map((m,i)=>(
                  <div key={m.l} style={{flex:1,textAlign:"center",borderRight:i<3?"1px solid rgba(255,255,255,0.06)":"none"}}>
                    <div style={{fontSize:9,color:"rgba(255,255,255,0.28)",textTransform:"uppercase",letterSpacing:"0.07em",marginBottom:3}}>{m.l}</div>
                    <div style={{fontSize:13,fontWeight:600,color:"rgba(255,255,255,0.8)"}}>{m.v}</div>
                  </div>
                ))}
              </div>
            </Glass>
          ))
        }
      </div>
    </div>
  );

  // COACH
  if(screen==="coach") return wrap(
    <div style={{display:"flex",flexDirection:"column",height:"100vh"}}>
      <div style={{padding:"56px 20px 16px",borderBottom:"1px solid rgba(255,255,255,0.06)",flexShrink:0}}>
        <div style={{fontSize:10,fontWeight:700,color:"rgba(255,255,255,0.25)",letterSpacing:"0.22em",textTransform:"uppercase"}}>STRYD</div>
        <div style={{display:"flex",alignItems:"flex-end",justifyContent:"space-between",marginTop:6}}>
          <div style={{fontSize:26,fontWeight:800,letterSpacing:"-0.6px"}}>AI Coach</div>
          <Glass style={{padding:"5px 12px",borderRadius:99,fontSize:11,color:"rgba(255,255,255,0.45)"}}>
            {isPro?"∞ unlimited":Math.max(5-uses,0)+" left"}
          </Glass>
        </div>
      </div>
      <div style={{flex:1,overflowY:"auto",padding:"14px 20px",display:"flex",flexDirection:"column",gap:12}}>
        {msgs.map((m,i)=>(
          <div key={i} style={{display:"flex",justifyContent:m.role==="user"?"flex-end":"flex-start",gap:8}}>
            {m.role==="ai"&&<div style={{width:28,height:28,borderRadius:"50%",border:"1px solid rgba(255,255,255,0.1)",background:"rgba(255,255,255,0.06)",display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0,marginTop:4,fontSize:12,backdropFilter:"blur(8px)"}}>⬡</div>}
            <div style={{maxWidth:"82%",padding:"13px 16px",borderRadius:m.role==="user"?"16px 16px 3px 16px":"16px 16px 16px 3px",background:m.role==="user"?"rgba(255,255,255,0.88)":"rgba(255,255,255,0.07)",color:m.role==="user"?"#000":"rgba(255,255,255,0.82)",fontSize:14,lineHeight:1.65,border:m.role==="ai"?"1px solid rgba(255,255,255,0.08)":"none",backdropFilter:m.role==="ai"?"blur(12px)":"none"}}>
              {m.text}
            </div>
          </div>
        ))}
        {chatLoad&&(
          <div style={{display:"flex",gap:8}}>
            <div style={{width:28,height:28,borderRadius:"50%",border:"1px solid rgba(255,255,255,0.1)",background:"rgba(255,255,255,0.06)",display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0,fontSize:12}}>⬡</div>
            <Glass style={{padding:"12px 16px",borderRadius:"16px 16px 16px 3px",display:"flex",gap:4,alignItems:"center"}}>
              {[0,1,2].map(i=><div key={i} style={{width:5,height:5,borderRadius:"50%",background:"rgba(255,255,255,0.35)",animation:`dot 1.2s infinite ${i*0.2}s`}}/>)}
              <style>{`@keyframes dot{0%,80%,100%{opacity:0.2}40%{opacity:1}}`}</style>
            </Glass>
          </div>
        )}
        <div ref={chatEnd}/>
      </div>
      {msgs.length<3&&(
        <div style={{display:"flex",gap:8,overflowX:"auto",padding:"0 20px 10px",flexShrink:0}}>
          {["Build me a training plan","How do I run faster?","Recovery tips","Best nutrition"].map(q=>(
            <button key={q} onClick={()=>setChatIn(q)} style={{flexShrink:0,padding:"8px 14px",borderRadius:99,border:"1px solid rgba(255,255,255,0.1)",background:"rgba(255,255,255,0.04)",color:"rgba(255,255,255,0.45)",fontSize:12,cursor:"pointer",whiteSpace:"nowrap",fontFamily:F}}>{q}</button>
          ))}
        </div>
      )}
      <div style={{display:"flex",gap:10,padding:"10px 20px 16px",borderTop:"1px solid rgba(255,255,255,0.06)",flexShrink:0}}>
        <input placeholder={!isPro&&uses>=5?"Upgrade to continue…":"Ask your coach…"} value={chatIn} onChange={e=>setChatIn(e.target.value)} onKeyDown={e=>e.key==="Enter"&&sendCoach()}
          style={{flex:1,padding:"13px 16px",borderRadius:14,border:"1px solid rgba(255,255,255,0.1)",background:"rgba(255,255,255,0.06)",color:"#fff",fontSize:14,outline:"none",fontFamily:F,backdropFilter:"blur(12px)"}}
          disabled={!isPro&&uses>=5}
        />
        <button onClick={(!isPro&&uses>=5)?()=>setGate(true):sendCoach} style={{width:48,height:48,borderRadius:14,border:"none",background:"rgba(255,255,255,0.9)",color:"#000",fontSize:18,cursor:"pointer",flexShrink:0,fontWeight:700}}>↑</button>
      </div>
    </div>
  );

  // PROFILE
  if(screen==="profile") return wrap(
    <div style={{padding:"56px 20px 0"}}>
      <div style={{display:"flex",alignItems:"flex-start",justifyContent:"space-between",marginBottom:20}}>
        <div>
          <div style={{fontSize:10,fontWeight:700,color:"rgba(255,255,255,0.25)",letterSpacing:"0.22em",textTransform:"uppercase"}}>STRYD</div>
          <div style={{fontSize:28,fontWeight:800,letterSpacing:"-0.6px",marginTop:6}}>Profile</div>
        </div>
        <button onClick={()=>{if(editing)setProfile(p=>({...p,firstName:eFn,lastName:eLn,age:eAg,height:eHt,weight:eWt,stride:eSt}));setEditing(!editing);}}
          style={{padding:"8px 18px",borderRadius:12,border:"1px solid rgba(255,255,255,0.12)",background:editing?"rgba(255,255,255,0.88)":"rgba(255,255,255,0.06)",color:editing?"#000":"rgba(255,255,255,0.65)",fontSize:13,fontWeight:600,cursor:"pointer",fontFamily:F,backdropFilter:"blur(8px)",marginTop:38}}>
          {editing?"Save":"Edit"}
        </button>
      </div>
      <Glass style={{padding:"18px",borderRadius:20,display:"flex",alignItems:"center",gap:14,marginBottom:14}}>
        <div style={{width:52,height:52,borderRadius:"50%",border:"1px solid rgba(255,255,255,0.13)",background:"rgba(255,255,255,0.07)",display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0}}>
          <span style={{fontSize:20,fontWeight:700,color:"rgba(255,255,255,0.55)"}}>{profile.firstName?.[0]?.toUpperCase()}</span>
        </div>
        <div>
          <div style={{fontSize:16,fontWeight:700,color:"#fff"}}>{profile.firstName} {profile.lastName}</div>
          <div style={{fontSize:12,color:"rgba(255,255,255,0.32)",marginTop:2}}>{profile.email}</div>
          <div style={{fontSize:12,color:"rgba(255,255,255,0.32)",marginTop:1}}>{profile.goal?.emoji} {profile.goal?.label} · {profile.sport?.label}</div>
        </div>
      </Glass>

      <div style={{display:"flex",gap:10,marginBottom:14}}>
        {[{l:"Sessions",v:`${sessions.length}`},{l:"Distance",v:fmtDist(totalM)},{l:"Best Pace",v:bestP>0?fmtPace(bestP):"--"}].map(s=>(
          <Glass key={s.l} style={{flex:1,padding:"14px 12px",borderRadius:16,textAlign:"center"}}>
            <div style={{fontSize:9,color:"rgba(255,255,255,0.28)",letterSpacing:"0.08em",textTransform:"uppercase",marginBottom:6}}>{s.l}</div>
            <div style={{fontSize:18,fontWeight:700,color:"#fff",letterSpacing:"-0.4px"}}>{s.v}</div>
          </Glass>
        ))}
      </div>

      <Glass style={{borderRadius:18,overflow:"hidden",marginBottom:14}}>
        <div style={{padding:"12px 18px",borderBottom:"1px solid rgba(255,255,255,0.06)"}}>
          <div style={{fontSize:10,fontWeight:600,color:"rgba(255,255,255,0.28)",letterSpacing:"0.1em",textTransform:"uppercase"}}>Personal Info</div>
        </div>
        <div style={{padding:"14px 18px"}}>
          {editing?(
            <div style={{display:"flex",flexDirection:"column",gap:12}}>
              <div style={{display:"flex",gap:10}}><Inp label="First" value={eFn} onChange={setEFn} placeholder="First"/><Inp label="Last" value={eLn} onChange={setELn} placeholder="Last"/></div>
              <Inp label="Age" value={eAg} onChange={setEAg} placeholder="Age" type="number"/>
              <div style={{display:"flex",gap:10}}><Inp label="Height (cm)" value={eHt} onChange={setEHt} placeholder="cm" type="number"/><Inp label="Weight (kg)" value={eWt} onChange={setEWt} placeholder="kg" type="number"/></div>
              <Inp label="Stride (cm)" value={eSt} onChange={setESt} placeholder="optional" type="number"/>
            </div>
          ):[["Name",`${profile.firstName} ${profile.lastName}`],["Age",`${profile.age} years`],["Height",`${profile.height} cm`],["Weight",`${profile.weight} kg`],["Stride",profile.stride?`${profile.stride} cm`:"Estimated"],["Gender",profile.gender||"—"]].map(([l,v])=>(
            <div key={l} style={{display:"flex",justifyContent:"space-between",padding:"10px 0",borderBottom:"1px solid rgba(255,255,255,0.05)"}}>
              <span style={{fontSize:13,color:"rgba(255,255,255,0.32)"}}>{l}</span>
              <span style={{fontSize:13,fontWeight:600,color:"rgba(255,255,255,0.82)"}}>{v}</span>
            </div>
          ))}
        </div>
      </Glass>

      <Glass style={{padding:"15px 18px",borderRadius:16,display:"flex",alignItems:"center",justifyContent:"space-between"}}>
        <div>
          <div style={{fontSize:13,fontWeight:600,color:"#fff"}}>{isPro?"⚡ Pro Plan":"Free Plan"}</div>
          <div style={{fontSize:12,color:"rgba(255,255,255,0.32)",marginTop:2}}>{isPro?"Unlimited AI coaching":"5 free coach messages"}</div>
        </div>
        {!isPro&&<button onClick={()=>setGate(true)} style={{padding:"9px 16px",borderRadius:10,border:"1px solid rgba(255,255,255,0.18)",background:"transparent",color:"rgba(255,255,255,0.75)",fontSize:12,fontWeight:600,cursor:"pointer",fontFamily:F}}>Upgrade</button>}
      </Glass>
    </div>
  );

  return null;
}
