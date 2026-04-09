import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { db, gameRef, onSnapshot, updateDoc, setDoc, getDoc } from './lib/firebase';
import { CLUES, BASE, REVEAL_PAIRS } from './constants';
import { SteamOverlay } from './components/SteamOverlay';
import { AdminPanel } from './components/AdminPanel';
import { ConfettiCannon } from './components/ConfettiCannon';
import { Shell, Mono, Divider, GhostBtn, StyledInput } from './components/Common';
import { 
  BodyMapInput, CounterInput, SelectionSlotsInput, SlotsInput, 
  DualSliderInput, NumberUnitInput, BuildingsTilesInput 
} from './components/NewInputs';

// --- UTILS ---
const now = () => Date.now();
const getUnlocked = (ts, ms) => !ts ? 0 : Math.min(CLUES.length, Math.floor((now() - ts) / ms) + 1);
const buildPending = (n, s, d) => {
  const p = [];
  for (let i = 1; i <= n; i++) if (!s.includes(i) && !d.includes(i)) p.push(i);
  return p;
};
const fmtMs = ms => {
  if (ms <= 0) return "00:00:00";
  const s = Math.ceil(ms / 1000), h = Math.floor(s / 3600), m = Math.floor((s % 3600) / 60), sc = s % 60;
  return [h, m, sc].map(n => String(n).padStart(2, "0")).join(":");
};
const shuffle = arr => {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
};

// --- SUB-COMPONENTS ---

function StartScreen({ onStart }) {
  const [fading, setFading] = useState(false);
  const handle = () => { setFading(true); setTimeout(onStart, 1100); };

  return (
    <div className="min-h-screen bg-dg-bg flex flex-col items-center justify-center relative overflow-hidden">
      {/* Grainy overlay */}
      <div className="fixed inset-0 pointer-events-none z-0 opacity-40 animate-[grain_8s_steps(10)_infinite]"
           style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)' opacity='0.04'/%3E%3C/svg%3E")`, backgroundRepeat: 'repeat', backgroundSize: '180px' }} />
      
      <div className={`fixed inset-0 bg-black z-[100] pointer-events-none transition-opacity duration-1000 ${fading ? 'opacity-100' : 'opacity-0'}`} />

      <motion.div 
        initial={{ opacity: 0, y: 30 }} 
        animate={{ opacity: 1, y: 0 }} 
        transition={{ duration: 1.2, ease: "easeOut" }}
        className="text-center relative z-10 px-6"
      >
        <Mono size={13} className="block mb-12 opacity-40">ShockDave: Unlock the Gift</Mono>
        
        <h1 className="text-[64px] font-serif font-light text-dg-fg leading-none tracking-tighter mb-16">
          The Journey <br /> <em className="italic opacity-80">Begins Now.</em>
        </h1>

        <div className="flex flex-col items-center gap-12">
          <motion.button 
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={handle}
            disabled={fading}
            className="bg-transparent border border-dg-accent text-dg-accent font-serif text-[22px] font-light px-20 py-6 cursor-pointer rounded-full transition-all duration-500 hover:bg-dg-accent/5 shadow-[0_0_30px_rgba(200,164,90,0.1)] lowercase"
          >
            {fading ? "initiating..." : "start the journey"}
          </motion.button>

          <div className="w-px h-24 bg-gradient-to-b from-dg-accent to-transparent opacity-30" />
        </div>
      </motion.div>
    </div>
  );
}

function IntroScreen({ onComplete }) {
  const [phase, setPhase] = useState(0);
  useEffect(() => {
    const ts = [
      setTimeout(() => setPhase(1), 500),
      setTimeout(() => setPhase(2), 2900),
      setTimeout(() => setPhase(3), 5700),
      setTimeout(() => setPhase(4), 7900),
    ];
    return () => ts.forEach(clearTimeout);
  }, []);

  return (
    <div className="min-h-screen bg-black flex items-center justify-center px-6 py-10 relative overflow-hidden">
       {/* Grainy overlay */}
       <div className="fixed inset-0 pointer-events-none z-0 opacity-30 animate-[grain_8s_steps(10)_infinite]"
           style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)' opacity='0.04'/%3E%3C/svg%3E")`, backgroundRepeat: 'repeat', backgroundSize: '180px' }} />

      <div className="max-w-[600px] w-full text-center flex flex-col items-center relative z-10">
        <div className="h-[80px] mb-8 flex items-center justify-center">
          {phase >= 1 && (
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, filter: 'blur(10px)' }} 
              animate={{ opacity: 1, scale: 1, filter: 'blur(0px)' }}
              transition={{ duration: 1.5, ease: [0.16, 1, 0.3, 1] }}
              className="text-[72px] font-serif font-light leading-none tracking-tighter text-dg-fg"
            >
              Hello David
            </motion.div>
          )}
        </div>

        <div className="h-[28px] mb-[48px] flex items-center justify-center">
          {phase >= 2 && (
            <motion.div 
              initial={{ opacity: 0, y: 15 }} 
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 1.2 }}
              className="text-[24px] font-serif italic text-dg-fg/50 leading-none"
            >
              you've worked so hard on yourself lately
            </motion.div>
          )}
        </div>

        <div className="h-[44px] mb-[80px] flex items-center justify-center">
          {phase >= 3 && (
            <motion.div 
              initial={{ opacity: 0, scale: 1.1 }} 
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 1.5 }}
              className="text-[44px] font-serif text-dg-accent leading-none font-light"
            >
              Wanna play a game?
            </motion.div>
          )}
        </div>

        <div className="h-[70px] flex items-center justify-center">
          {phase >= 4 && (
            <motion.div 
              initial={{ opacity: 0, y: 20 }} 
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 1 }}
            >
              <GhostBtn 
                onClick={() => { setPhase(5); setTimeout(onComplete, 620); }}
                className="px-14 py-5 text-[16px] border-dg-accent text-dg-accent hover:bg-dg-accent/10"
              >
                Begin the Journey →
              </GhostBtn>
            </motion.div>
          )}
        </div>
      </div>
    </div>
  );
}

function PasswordScreen({ onSuccess, sitePassword }) {
  const [val, setVal] = useState("");
  const [shake, setShake] = useState(false);
  const submit = (e) => {
    if (e) e.preventDefault();
    if (val.trim() === sitePassword) { onSuccess(); return; }
    // Case-insensitive check just in case
    if (val.trim().toLowerCase() === sitePassword.toLowerCase()) { onSuccess(); return; }
    setShake(true); setVal(""); setTimeout(() => setShake(false), 420);
  };
  return (
    <Shell>
      <motion.div initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.9 }} className="text-center">
        <Mono spacing="normal" className="block mb-[52px]">ShockDave: Unlock the Gift</Mono>
        <div className="text-[44px] font-light leading-[1.25] tracking-tight mb-2.5">
          Something is<br /><em className="italic font-light">waiting for you.</em>
        </div>
        <Divider my="my-7" />
        <div className="text-[17px] text-dg-muted leading-relaxed mb-14 opacity-70 italic">You were given a password. Enter it below to begin.</div>
        <form onSubmit={submit} className={shake ? "shake" : ""}>
          <input 
            type="password" 
            value={val} 
            onChange={e => setVal(e.target.value)} 
            placeholder="········" 
            autoFocus
            className="w-full bg-transparent border-0 border-b border-dg-border text-dg-accent font-serif text-[28px] py-5 text-center outline-none focus:border-dg-accent transition-all placeholder:opacity-20"
          />
          <div className="mt-14">
            <GhostBtn type="submit" onClick={submit} className="px-16 py-5 text-[16px] border-dg-accent text-dg-accent hover:bg-dg-accent/10">
              Unlock the Journey
            </GhostBtn>
          </div>
        </form>
      </motion.div>
    </Shell>
  );
}

// --- MAIN PROJECT CODE ---

export default function App() {
  const [screen, setScreen] = useState("boot");
  const [gameState, setGameState] = useState({
    startTs: null,
    solved: [],
    disabled: [],
    lockoutUntil: 0,
    lockoutClueId: 1,
    intervalMs: BASE.defaultInterval,
    lockoutMs: BASE.defaultLockout,
  });
  const [activeClueId, setActiveClueId] = useState(1);
  const [queue, setQueue] = useState([]);
  const [steam, setSteam] = useState(false);
  const [adminOpen, setAdminOpen] = useState(false);
  const [nowTime, setNowTime] = useState(Date.now());

  // Timer for countdowns
  useEffect(() => {
    const id = setInterval(() => setNowTime(Date.now()), 1000);
    return () => clearInterval(id);
  }, []);

  // Steam wipe helper
  const steamTo = useCallback((fn, delay = 480) => {
    setSteam(true);
    setTimeout(() => { fn(); setTimeout(() => setSteam(false), 650); }, delay);
  }, []);

  // --- PERSISTENCE ---
  
  // 1. Subscribe to Firestore
  useEffect(() => {
    const unsub = onSnapshot(gameRef, (doc) => {
      if (doc.exists()) {
        const data = doc.data();
        setGameState(prev => ({ ...prev, ...data }));
      } else {
        // Init if doc doesn't exist
        setDoc(gameRef, {
          startTs: null,
          solved: [],
          disabled: [],
          lockoutUntil: 0,
          lockoutClueId: 1,
          intervalMs: BASE.defaultInterval,
          lockoutMs: BASE.defaultLockout,
        });
      }
    });
    return () => unsub();
  }, []);

  // 2. Logic to determine screen based on gameState
  const reconcile = useCallback((state) => {
    // 1. If game has started, we are either in clues, countdown, or reveal
    if (state.startTs) {
      if (state.lockoutUntil > now()) {
        setActiveClueId(state.lockoutClueId);
        setScreen("locked");
        return;
      }

      const { solved, disabled, startTs, intervalMs } = state;
      const activeCluesCount = CLUES.filter(c => !disabled.includes(c.id)).length;
      
      if (solved.length >= activeCluesCount) {
        setScreen("reveal");
        return;
      }

      const unlockedCount = getUnlocked(startTs, intervalMs);
      const pending = buildPending(unlockedCount, solved, disabled);

      if (pending.length > 0) {
        const [first, ...rest] = pending;
        setActiveClueId(first);
        setQueue(rest);
        setScreen("clue");
      } else {
        setScreen("countdown");
      }
      return;
    }

    // 2. If game hasn't started, check if we need to show Start, Intro, or Password
    const introSeen = sessionStorage.getItem("dg_intro");
    if (!introSeen) { 
      setScreen("start"); 
    } else {
      setScreen("password");
    }
  }, []);

  // Re-run reconciliation when gameState or intro state changes
  useEffect(() => {
    if (screen === "boot") {
      reconcile(gameState);
    }
  }, [gameState, screen, reconcile]);

  // --- ACTIONS ---

  const reconcileLatest = useCallback(() => {
    reconcile(gameState);
  }, [gameState, reconcile]);

  const handleAction = async (type, payload) => {
    switch (type) {
      case "markSolved": {
        const newSolved = [...new Set([...gameState.solved, payload])].sort((a,b) => a-b);
        const nextPartial = { ...gameState, solved: newSolved, lockoutUntil: 0 };
        setGameState(nextPartial); // Update locally for instant feel
        await updateDoc(gameRef, { solved: newSolved, lockoutUntil: 0 });
        
        const activeCount = CLUES.filter(c => !gameState.disabled.includes(c.id)).length;
        if (newSolved.length >= activeCount) {
          setScreen("reveal");
        } else {
          setScreen("success");
        }
        break;
      }
      case "unmarkSolved": {
        const newSolved = gameState.solved.filter(id => id !== payload);
        await updateDoc(gameRef, { solved: newSolved, lockoutUntil: 0 }); // clear lockout too
        break;
      }
      case "disable": {
        const newDisabled = [...new Set([...gameState.disabled, payload])];
        await updateDoc(gameRef, { disabled: newDisabled });
        break;
      }
      case "enable": {
        const newDisabled = gameState.disabled.filter(id => id !== payload);
        await updateDoc(gameRef, { disabled: newDisabled });
        break;
      }
      case "lockout": {
        const duration = payload?.ms || gameState.lockoutMs;
        const until = now() + duration;
        const targetClueId = payload?.clueId || payload || activeClueId;
        await updateDoc(gameRef, { lockoutUntil: until, lockoutClueId: targetClueId });
        steamTo(() => reconcile({ ...gameState, lockoutUntil: until, lockoutClueId: targetClueId }));
        break;
      }
      case "timersUpdated": {
        await updateDoc(gameRef, payload);
        break;
      }
      case "reset": {
        await setDoc(gameRef, {
          startTs: null,
          solved: [],
          disabled: [],
          lockoutUntil: 0,
          lockoutClueId: 1,
          intervalMs: BASE.defaultInterval,
          lockoutMs: BASE.defaultLockout,
        });
        sessionStorage.removeItem("dg_intro");
        setScreen("start");
        break;
      }
      case "testIntro": steamTo(() => setScreen("intro")); break;
      case "testReveal": steamTo(() => setScreen("reveal")); break;
    }
  };

  const handlePasswordSuccess = async () => {
    const ts = now();
    // 1. Instantly update local state perspective to avoid lag
    const nextState = { ...gameState, startTs: ts, solved: [] };
    
    // 2. Perform the cloud update
    try {
      await updateDoc(gameRef, { startTs: ts, solved: [] });
    } catch (err) {
      console.error("Firebase update failed, continuing locally:", err);
    }

    // 3. Navigate
    steamTo(() => {
      setGameState(nextState);
      reconcile(nextState);
    });
  };

  const handleIntroComplete = () => {
    sessionStorage.setItem("dg_intro", "1");
    steamTo(() => reconcile(gameState));
  };

  const activeClue = CLUES.find(c => c.id === activeClueId);
  const nextUnlockTs = gameState.startTs ? gameState.startTs + gameState.solved.length * gameState.intervalMs : null;

  // --- RENDERING ---

  if (screen === "boot") return null;

  return (
    <>
      <SteamOverlay active={steam} />
      <AnimatePresence mode="wait">
        {screen === "start" && <StartScreen key="start" onStart={() => setScreen("intro")} />}
        {screen === "intro" && <IntroScreen key="intro" onComplete={handleIntroComplete} />}
        {screen === "password" && <PasswordScreen key="password" onSuccess={handlePasswordSuccess} sitePassword={BASE.sitePassword} />}
        
        {screen === "clue" && activeClue && (
          <ClueScreen key={`clue-${activeClueId}`} clue={activeClue} onSolved={() => handleAction("markSolved", activeClueId)} onLockout={(p) => handleAction("lockout", p)} />
        )}
        
        {screen === "success" && activeClue && (
          <SuccessScreen key="success" clue={activeClue} onContinue={reconcileLatest} />
        )}

        {screen === "countdown" && nextUnlockTs && (
          <CountdownScreen key="countdown" nextTs={nextUnlockTs} now={nowTime} onDone={reconcileLatest} />
        )}

        {screen === "locked" && (
          <LockoutScreen key="locked" until={gameState.lockoutUntil} now={nowTime} onDone={reconcileLatest} />
        )}

        {screen === "reveal" && <RevealScreen key="reveal" />}
      </AnimatePresence>

      {!["start", "intro"].includes(screen) && (
        <button 
          onClick={() => setAdminOpen(true)}
          className="fixed bottom-[22px] right-[22px] w-[42px] h-[42px] rounded-full bg-dg-bg border border-dg-border cursor-pointer z-[8000] flex items-center justify-center backdrop-blur-md hover:border-dg-accent group shadow-2xl"
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" className="text-dg-muted group-hover:text-dg-accent transition-all duration-500 group-hover:rotate-90" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z"/><circle cx="12" cy="12" r="3"/>
          </svg>
        </button>
      )}

      <AdminPanel 
        open={adminOpen} 
        onClose={() => setAdminOpen(false)} 
        gameState={{ ...gameState, activeClueId }}
        onAction={handleAction}
      />
    </>
  );
}

// --- CLUE COMPONENT ---

function ClueScreen({ clue, onSolved, onLockout }) {
  const [val, setVal] = useState("");
  const [shake, setShake] = useState(false);
  const [wrong, setWrong] = useState(false);

  const submitText = (e) => {
    if (e) e.preventDefault();
    if (!val.trim()) return;
    if (clue.check(val)) { onSolved(); return; }
    setWrong(true); setShake(true); setTimeout(() => setShake(false), 400);
    if (clue.lockoutMs) { setTimeout(() => onLockout({ ms: clue.lockoutMs, clueId: clue.id }), 500); return; }
    setTimeout(() => setWrong(false), 2200); setVal("");
  };

  return (
    <Shell center={false}>
      <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }} className="pt-6">
        <div className="mb-10 font-serif text-dg-accent text-[18px] font-light opacity-60">
          {String(clue.id).padStart(2, '0')} / {String(CLUES.length).padStart(2, '0')}
        </div>
        {clue.quote && (
          <div className="text-[22px] italic font-light leading-relaxed text-dg-fg mb-5 pl-[18px] border-l-2 border-dg-border">
            "{clue.quote}"
          </div>
        )}
        <div className="text-[22px] leading-relaxed font-light text-dg-fg mb-8 whitespace-pre-line">
          {clue.question}
        </div>
        
        {clue.type === "text" && (
          <div className="space-y-4">
            <StyledInput value={val} onChange={setVal} onSubmit={submitText} placeholder={clue.placeholder} shake={shake} />
            <div className="flex justify-between items-start">
              <GhostBtn onClick={submitText}>submit</GhostBtn>
              {clue.hint && <Hint text={clue.hint} />}
            </div>
          </div>
        )}

        {clue.type === "choice" && <ChoiceInput clue={clue} onCorrect={onSolved} onLockout={onLockout} />}
        {clue.type === "slider" && <SliderInput clue={clue} onCorrect={onSolved} />}
        {clue.type === "body_map" && <BodyMapInput clue={clue} onCorrect={onSolved} />}
        {clue.type === "counter" && <CounterInput clue={clue} onCorrect={onSolved} />}
        {clue.type === "selection_slots" && <SelectionSlotsInput clue={clue} onCorrect={onSolved} />}
        {clue.type === "numeral" && <SlotsInput length={clue.digits} answer={clue.answer} onCorrect={onSolved} isNumber />}
        {clue.type === "letter_slots" && <SlotsInput length={clue.answer.length} answer={clue.answer} onCorrect={onSolved} />}
        {clue.type === "dual_slider" && <DualSliderInput clue={clue} onCorrect={onSolved} />}
        {clue.type === "number_unit" && <NumberUnitInput clue={clue} onCorrect={onSolved} />}
        {clue.type === "buildings_tiles" && <BuildingsTilesInput clue={clue} onCorrect={onSolved} />}

        {wrong && !clue.lockout && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="mt-4 text-xs font-mono text-dg-red tracking-wider">
            Not quite. Try again.
          </motion.div>
        )}
      </motion.div>
    </Shell>
  );
}

function Hint({ text }) {
  const [shown, setShown] = useState(false);
  return (
    <div className="mt-2">
      {!shown ? (
        <button onClick={() => setShown(true)} className="bg-none border-none font-mono text-[11px] text-dg-muted cursor-pointer tracking-widest uppercase opacity-50 p-0 hover:opacity-100 transition-opacity">need a hint?</button>
      ) : (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="border-l-2 border-dg-accent pl-3 text-xs font-mono text-dg-muted leading-relaxed">
          {text}
        </motion.div>
      )}
    </div>
  );
}

function ChoiceInput({ clue, onCorrect, onLockout }) {
  const [sel, setSel] = useState(null);
  const [tried, setTried] = useState(false);

  const submit = () => {
    if (!sel) return;
    if (sel === clue.answer) {
      onCorrect();
    } else {
      if (clue.lockoutMs) {
        onLockout({ ms: clue.lockoutMs, clueId: clue.id });
      } else {
        setTried(true);
        setTimeout(() => setTried(false), 2000);
      }
    }
  };

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-2.5">
        {clue.options.map((opt, i) => (
          <motion.button 
            key={i} 
            onClick={() => { setSel(opt); setTried(false); }}
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.05 }}
            className={`text-left font-serif font-medium text-[17px] p-[20px] leading-relaxed border rounded-xl transition-all cursor-pointer ${sel === opt ? 'bg-dg-adim border-dg-accent text-dg-accent' : 'border-dg-border text-dg-fg/70 hover:border-dg-accent hover:bg-dg-adim'}`}
          >
            {opt}
          </motion.button>
        ))}
      </div>
      <div className="flex flex-col items-center gap-4 mt-4">
        <GhostBtn onClick={submit} className="w-full" disabled={!sel}>submit choice</GhostBtn>
        {tried && <div className="text-dg-red font-mono text-[13px] lowercase">not the correct path.</div>}
      </div>
    </div>
  );
}

function SliderInput({ clue, onCorrect }) {
  const mid = Math.round((clue.range[0] + clue.range[1]) / 2);
  const [vals, setVals] = useState(clue.sliders.map(() => mid));
  const [tried, setTried] = useState(false);
  const [ok, setOk] = useState(false);

  const setVal = (i, v) => { setVals(prev => { const n = [...prev]; n[i] = Number(v); return n; }); setTried(false); };
  const submit = () => {
    const isCorrect = clue.sliders.every((s, i) => Math.abs(vals[i] - s.answer) <= clue.tolerance);
    if (isCorrect) { setOk(true); setTimeout(onCorrect, 650); } else setTried(true);
  };

  return (
    <div className="space-y-7">
      {clue.sliders.map((s, i) => (
        <div key={i}>
          <div className="flex justify-between items-center mb-2.5">
            <Mono size={12}>{s.label}</Mono>
            <Mono size={16} color="text-dg-accent" className="font-normal">{vals[i]}{s.unit}</Mono>
          </div>
          <input type="range" min={clue.range[0]} max={clue.range[1]} value={vals[i]} onChange={e => setVal(i, e.target.value)} />
          <div className="flex justify-between opacity-35 text-[10px] uppercase tracking-tighter mt-1.5 font-mono">
            <span>{clue.range[0]}°C</span>
            <span>{clue.range[1]}°C</span>
          </div>
        </div>
      ))}
      <GhostBtn onClick={submit} variant={ok ? "green" : "normal"}>{ok ? "✓ Correct" : "Set temperatures"}</GhostBtn>
      {tried && !ok && <div className="mt-3 text-xs font-mono text-dg-red animate-in fade-in">One or both are off. Adjust and try again.</div>}
    </div>
  );
}



// --- OTHER SCREENS ---

function SuccessScreen({ clue, onContinue }) {
  useEffect(() => {
    const t = setTimeout(() => {
       onContinue();
    }, 3500);
    return () => clearTimeout(t);
  }, [onContinue]);
  return (
    <Shell>
      <div className="text-center">
        <div className="text-[36px] text-dg-accent mb-4 animate-in fade-in">✓</div>
        <Mono className="block mb-5 uppercase animate-in fade-in slide-in-from-bottom-1 delay-150">Correct</Mono>
        <motion.div initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} className="text-[24px] italic font-light leading-relaxed">
          {clue.flavor}
        </motion.div>
      </div>
    </Shell>
  );
}

function CountdownScreen({ nextTs, now }) {
  const remaining = Math.max(0, nextTs - now);
  return (
    <Shell>
      <motion.div initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} className="text-center">
        <Mono className="block mb-9">next clue unlocks in</Mono>
        <div className="font-serif text-7xl font-light text-dg-accent animate-pulse-slow my-6 lowercase">
          {fmtMs(remaining)}
        </div>
        <Divider my="my-10" />
        <div className="text-[17px] italic text-dg-muted leading-relaxed">Come back when you're ready.<br />It'll be here.</div>
      </motion.div>
    </Shell>
  );
}

function LockoutScreen({ until, now, onDone }) {
  const remaining = Math.max(0, until - now);
  useEffect(() => { if (remaining <= 0) onDone(); }, [remaining, onDone]);
  return (
    <Shell>
      <motion.div initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} className="text-center">
        <Mono color="text-dg-red" className="block mb-8 uppercase">Not right.</Mono>
        <div className="font-mono text-7xl font-light text-dg-red tracking-[0.15em] opacity-80 my-8">
          {fmtMs(remaining)}
        </div>
        <Divider my="my-9" />
        <div className="text-[18px] italic text-dg-muted leading-relaxed">Take a moment.<br />Think it over.<br />Come back when the timer ends.</div>
      </motion.div>
    </Shell>
  );
}

function RevealScreen() {
  const [step, setStep] = useState(0);
  const [phase, setPhase] = useState("lines"); // lines -> bridge -> message -> gift
  const [confetti, setConfetti] = useState(false);

  useEffect(() => {
    if (phase === "lines") {
      if (step < REVEAL_PAIRS.length) { setTimeout(() => setStep(s => s + 1), 840); }
      else { setTimeout(() => setPhase("bridge"), 1300); }
    } else if (phase === "bridge") {
       setTimeout(() => setPhase("message"), 2900);
    } else if (phase === "message") {
       setTimeout(() => setPhase("gift"), 2900);
    } else if (phase === "gift") {
       setTimeout(() => setConfetti(true), 900);
    }
  }, [step, phase]);

  return (
    <Shell center={false}>
      <ConfettiCannon active={confetti} />
      <div className="pt-8">
        {phase === "lines" && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
            <Mono className="block mb-10 uppercase text-center">Let's look at what you found.</Mono>
            <div className="flex flex-col gap-[18px]">
              {REVEAL_PAIRS.slice(0, step).map(([a, b], i) => (
                <motion.div key={i} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} className="pl-4 border-l-2 border-dg-accent">
                  <div className="text-[18px] font-normal leading-snug">{a}</div>
                  <Mono size={11} color="text-dg-muted" spacing="0.05em" className="block mt-1 leading-relaxed">{b}</Mono>
                </motion.div>
              ))}
            </div>
          </motion.div>
        )}
        {(phase === "bridge" || phase === "message" || phase === "gift") && (
          <div className="pt-16 text-center space-y-7 animate-in fade-in duration-1000">
            {phase === "bridge" && (
              <div className="text-[28px] italic font-light leading-relaxed text-dg-fg">
                You've done a lot of thinking<br />for someone who just needs to stop.
              </div>
            )}
            {(phase === "message" || phase === "gift") && (
              <div className="space-y-6">
                <div className="text-[30px] italic font-light leading-relaxed text-dg-fg">
                  Here's $350 to finally<br />do something about that.
                </div>
                <Divider my="my-6 mx-auto" />
                <Mono size={13} spacing="0.18em">— Tim</Mono>
              </div>
            )}
            {phase === "gift" && (
              <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} className="p-10 border border-dg-border bg-dg-bg2 text-center mt-10 shadow-2xl">
                <Mono size={10} color="text-dg-accent" className="block mb-5 uppercase tracking-widest">Your Gift</Mono>
                <div className="text-[40px] font-light tracking-tight mb-1">Sense of Self</div>
                <div className="text-[15px] text-dg-muted italic mb-8">Collingwood, Melbourne</div>
                
                <div className="p-6 border border-dg-accent/20 bg-dg-accent/5 mb-7 text-center">
                   <Mono size={9} className="block mb-2.5 uppercase opacity-60">Voucher Code</Mono>
                   <div className="font-mono text-[20px] text-dg-accent tracking-widest mb-5 break-all">UJOBLHPQOBPJ</div>
                   <div className="flex justify-between items-center pt-4 border-t border-dg-border">
                      <div className="text-left">
                         <Mono size={9} className="block mb-1 border-b-none uppercase opacity-60">Value</Mono>
                         <div className="text-lg text-dg-fg tracking-tight">A$350.00</div>
                      </div>
                      <div className="text-right">
                         <Mono size={9} className="block mb-1 border-b-none uppercase opacity-60">Expires</Mono>
                         <div className="text-sm text-dg-fg">5 Apr 2029</div>
                      </div>
                   </div>
                </div>

                <div className="text-[16px] text-dg-muted leading-relaxed mb-8">
                  A mineral pool. A Finnish sauna. A cold plunge.<br />
                  A Hammam. A massage. A robe and a towel.<br />
                  Or anything else. It's yours.<br />
                  <em>Take your time with it.</em>
                </div>

                <a href="https://www.sos-senseofself.com/" target="_blank" rel="noopener noreferrer"
                   className="inline-block border border-dg-accent text-dg-accent font-mono text-[12px] tracking-widest px-8 py-3.5 uppercase transition-all hover:bg-dg-adim">
                  Book now →
                </a>
              </motion.div>
            )}
          </div>
        )}
      </div>
    </Shell>
  );
}
