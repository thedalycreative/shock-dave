import React, { useState, useEffect, useRef } from 'react';
import { Mono, GhostBtn } from './Common';
import { CLUES, BASE } from '../constants';
import { motion, AnimatePresence } from 'framer-motion';

const STATUS_CONFIG = {
  solved: { color: "text-green-700", bg: "bg-green-100", label: "solved" },
  active: { color: "text-amber-700", bg: "bg-amber-100", label: "active" },
  locked: { color: "text-red-700", bg: "bg-red-100", label: "locked" },
  upcoming: { color: "text-slate-500", bg: "bg-slate-100", label: "upcoming" },
};

export function AdminPanel({ open, onClose, gameState, onAction }) {
  const [authed, setAuthed] = useState(false);
  const [pw, setPw] = useState("");
  const [pwShake, setPwShake] = useState(false);
  const [tab, setTab] = useState("progress");
  const modalRef = useRef(null);

  // Local state for timers to avoid jumping inputs
  const [localTimers, setLocalTimers] = useState({ iH: 0, iM: 0, lM: 0, lS: 0 });

  useEffect(() => {
    if (open && gameState.intervalMs) {
      setLocalTimers({
        iH: Math.floor(gameState.intervalMs / 3600000),
        iM: Math.floor((gameState.intervalMs % 3600000) / 60000),
        lM: Math.floor(gameState.lockoutMs / 60000),
        lS: Math.floor((gameState.lockoutMs % 60000) / 1000)
      });
    }
    if (!open) { setAuthed(false); setPw(""); }
  }, [open, gameState.intervalMs, gameState.lockoutMs]);

  // Click-away listener
  useEffect(() => {
    const handleOutsideClick = (e) => {
      if (modalRef.current && !modalRef.current.contains(e.target)) {
        onClose();
      }
    };
    if (open) document.addEventListener("mousedown", handleOutsideClick);
    return () => document.removeEventListener("mousedown", handleOutsideClick);
  }, [open, onClose]);

  if (!open) return null;

  const checkPw = (e) => {
    if (e) e.preventDefault();
    if (pw === BASE.adminPassword) { setAuthed(true); return; }
    setPwShake(true); setPw(""); setTimeout(() => setPwShake(false), 400);
  };

  if (!authed) {
    return (
      <div className="fixed inset-0 bg-black/80 z-[9600] flex items-center justify-center backdrop-blur-sm">
        <motion.div 
          initial={{ opacity: 0, scale: 0.95 }} 
          animate={{ opacity: 1, scale: 1 }}
          ref={modalRef}
          className="bg-white border-2 border-slate-200 p-12 max-w-[400px] w-[90%] shadow-2xl rounded-2xl"
        >
          <div className="flex justify-between items-center mb-8">
            <Mono color="text-slate-900" className="text-sm font-bold opacity-60">admin authentication</Mono>
            <button onClick={onClose} className="text-slate-400 text-2xl hover:text-slate-900 transition-colors">×</button>
          </div>
          <form onSubmit={checkPw}>
            <div className={`mb-8 ${pwShake ? "shake" : ""}`}>
              <input 
                type="password" 
                value={pw} 
                onChange={e => setPw(e.target.value)} 
                placeholder="password" 
                autoFocus
                className="w-full bg-slate-50 border-2 border-slate-100 text-slate-900 font-serif text-lg p-5 text-center outline-none focus:border-slate-900 transition-all rounded-full"
              />
            </div>
            <GhostBtn type="submit" variant="dark" className="w-full rounded-full h-14 lowercase">access panel</GhostBtn>
          </form>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black/80 z-[9600] flex items-center justify-center backdrop-blur-md">
      <motion.div 
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        ref={modalRef}
        className="bg-white text-slate-900 w-full max-w-[800px] h-[90vh] flex flex-col shadow-[0_30px_60px_-15px_rgba(0,0,0,0.3)] rounded-3xl overflow-hidden"
      >
        {/* Header */}
        <div className="px-10 pt-10 pb-8 flex items-center justify-between shrink-0 border-b border-slate-100">
          <div>
            <h2 className="text-3xl font-serif font-bold text-slate-900 leading-tight">Admin Control</h2>
            <div className="flex items-center gap-4 mt-2">
              <div className="flex -space-x-1">
                 {gameState.solved.map(id => <div key={id} className="w-2.5 h-2.5 rounded-full bg-green-500 border-2 border-white" />)}
                 {Array.from({ length: CLUES.length - gameState.solved.length }).map((_, i) => <div key={i} className="w-2.5 h-2.5 rounded-full bg-slate-200 border-2 border-white" />)}
              </div>
              <Mono size={10} color="text-slate-400" className="font-bold">
                {gameState.solved.length} / {CLUES.length} completed
              </Mono>
            </div>
          </div>
          <button onClick={onClose} className="w-12 h-12 flex items-center justify-center text-slate-300 hover:text-slate-900 hover:bg-slate-50 transition-all rounded-full text-3xl">
            ×
          </button>
        </div>

        {/* Tabs */}
        <div className="px-10 flex gap-10 shrink-0 border-b border-slate-100">
          {["progress", "settings"].map(t => (
            <button 
              key={t} 
              onClick={() => setTab(t)}
              className={`font-serif text-[14px] font-bold py-5 transition-all relative ${tab === t ? 'border-slate-900 text-slate-900 border-b-2' : 'border-transparent text-slate-300 hover:text-slate-500'}`}
            >
              {t}
            </button>
          ))}
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto px-10 py-8 admin-scroll bg-white">
          {tab === "progress" && (
            <div className="space-y-1">
              <div className="grid grid-cols-[60px_1fr_120px_60px] gap-4 mb-4 px-4 py-2 opacity-30">
                <Mono size={10} className="font-bold lowercase opacity-30">id</Mono>
                <Mono size={10} className="font-bold text-left lowercase opacity-30">clue & contents</Mono>
                <Mono size={10} className="font-bold text-center lowercase opacity-30">status</Mono>
                <Mono size={10} className="font-bold text-right lowercase opacity-30">active</Mono>
              </div>
              <div className="space-y-2">
                {CLUES.map(clue => (
                  <ClueLine 
                    key={clue.id} 
                    clue={clue} 
                    gameState={gameState} 
                    onAction={onAction} 
                  />
                ))}
              </div>
            </div>
          )}

          {tab === "settings" && (
            <div className="space-y-12">
              <section>
                <h3 className="text-sm font-serif font-bold text-slate-900 mb-6 border-l-4 border-slate-900 pl-4">game timing rules</h3>
                <div className="grid grid-cols-2 gap-8 bg-slate-50 p-8 rounded-2xl border border-slate-100">
                  <div className="space-y-4">
                    <Mono size={11} className="block opacity-50 font-bold">clue interval</Mono>
                    <div className="flex gap-3">
                      <TimeBox label="hours" value={localTimers.iH} onChange={val => setLocalTimers(p => ({ ...p, iH: val }))} />
                      <TimeBox label="mins" value={localTimers.iM} onChange={val => setLocalTimers(p => ({ ...p, iM: val }))} />
                    </div>
                  </div>
                  <div className="space-y-4">
                    <Mono size={11} className="block opacity-50 font-bold">wrong answer lockout</Mono>
                    <div className="flex gap-3">
                      <TimeBox label="mins" value={localTimers.lM} onChange={val => setLocalTimers(p => ({ ...p, lM: val }))} />
                      <TimeBox label="secs" value={localTimers.lS} onChange={val => setLocalTimers(p => ({ ...p, lS: val }))} />
                    </div>
                  </div>
                </div>
              </section>

              <section>
                <h3 className="text-sm font-serif font-bold text-slate-900 mb-6 border-l-4 border-slate-900 pl-4">administrative tools</h3>
                <div className="grid grid-cols-2 gap-4">
                  <AdminTool title="preview greeting" desc="replay the sequence." icon="👋" onRun={() => { onClose(); onAction("testIntro"); }} />
                  <AdminTool title="force gift reveal" desc="unlock the voucher." icon="🎁" onRun={() => { onClose(); onAction("testReveal"); }} />
                </div>
                <div className="mt-8 p-8 border-2 border-red-50 bg-red-50/30 rounded-2xl">
                  <h4 className="text-xs font-serif font-bold text-red-600 mb-2 tracking-tighter">emergency reset</h4>
                  <p className="text-sm text-red-700/60 mb-6 leading-relaxed font-serif">permanently erase all progress.</p>
                  <button onClick={() => { if(confirm("ABSOLUTELY RESET EVERYTHING?")) onAction("reset"); }} className="bg-red-600 text-white font-serif text-[12px] font-bold px-6 py-3 rounded-lg hover:bg-red-700 transition-colors shadow-lg shadow-red-200 lowercase">
                    wipe all data
                  </button>
                </div>
              </section>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-10 py-8 bg-slate-50/50 border-t border-slate-100 flex justify-end gap-3 shrink-0">
          <button 
            onClick={onClose}
            className="px-8 py-3 font-serif text-[14px] font-medium text-slate-400 hover:text-slate-900 transition-colors lowercase"
          >
            cancel
          </button>
          <button 
            onClick={() => {
              const ims = Math.max((Number(localTimers.iH) * 3600 + Number(localTimers.iM) * 60) * 1000, 1000);
              const lms = Math.max((Number(localTimers.lM) * 60 + Number(localTimers.lS)) * 1000, 1000);
              onAction("timersUpdated", { intervalMs: ims, lockoutMs: lms });
            }}
            className="px-12 py-4 bg-slate-900 text-white font-serif text-[16px] font-medium rounded-full shadow-xl shadow-slate-200 hover:bg-black transition-all lowercase"
          >
            save changes
          </button>
        </div>
      </motion.div>
    </div>
  );
}

function ClueLine({ clue, gameState, onAction }) {
  const { solved, disabled, activeClueId, lockoutUntil, lockoutClueId } = gameState;
  const isDisabled = disabled.includes(clue.id);
  
  let status = "upcoming";
  if (solved.includes(clue.id)) status = "solved";
  else if (isDisabled) status = "upcoming"; 
  else if (clue.id === activeClueId) {
    status = (lockoutUntil > Date.now() && lockoutClueId === clue.id) ? "locked" : "active";
  }

  return (
    <div className={`grid grid-cols-[60px_1fr_120px_60px] items-center gap-4 px-4 py-3 rounded-xl transition-all border ${status === 'active' ? 'bg-amber-50 border-amber-100' : 'bg-white border-slate-50 hover:border-slate-100 hover:bg-slate-50/50'}`}>
      <Mono size={14} color="text-slate-400" className="font-bold"># {clue.id}</Mono>
      
      <div className="min-w-0 pr-4">
        <div className="text-[17px] font-serif font-medium text-slate-800 leading-tight truncate">{clue.adminLabel}</div>
        <div className="text-[12px] font-serif text-slate-400 mt-1 flex gap-2 lowercase">
            <span className="opacity-50 underline">ans:</span>
            <span className="font-bold text-slate-500">{clue.adminAnswer}</span>
        </div>
      </div>

      <div className="flex justify-center">
        <StatusPill currentStatus={status} onSelect={(newStatus) => {
          if (newStatus === "solved") onAction("markSolved", clue.id);
          else if (newStatus === "active") onAction("unmarkSolved", clue.id);
          else if (newStatus === "locked") onAction("lockout", clue.id);
        }} />
      </div>

      <div className="flex justify-end">
        <button 
          onClick={() => onAction(isDisabled ? "enable" : "disable", clue.id)}
          className={`w-10 h-6 p-1 rounded-full relative transition-all duration-300 ${isDisabled ? 'bg-slate-200' : 'bg-slate-900 shadow-md shadow-slate-200'}`}
        >
          <div className={`w-4 h-4 bg-white rounded-full transition-all duration-300 ${isDisabled ? 'translate-x-0' : 'translate-x-4'}`} />
        </button>
      </div>
    </div>
  );
}

function StatusPill({ currentStatus, onSelect }) {
  const [isOpen, setIsOpen] = useState(false);
  const dropRef = useRef(null);
  const cfg = STATUS_CONFIG[currentStatus];

  useEffect(() => {
    const close = (e) => { if (dropRef.current && !dropRef.current.contains(e.target)) setIsOpen(false); };
    if (isOpen) document.addEventListener("mousedown", close);
    return () => document.removeEventListener("mousedown", close);
  }, [isOpen]);

  return (
    <div className="relative" ref={dropRef}>
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className={`px-4 py-2 rounded-lg text-[13px] font-serif font-bold transition-all scale-100 hover:scale-105 active:scale-95 ${cfg.color} ${cfg.bg} flex items-center gap-1.5 lowercase`}
      >
        {cfg.label}
        <span className="text-[10px] opacity-40">▼</span>
      </button>
      <AnimatePresence>
        {isOpen && (
          <motion.div 
            initial={{ opacity: 0, scale: 0.95, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 10 }}
            className="absolute left-1/2 -translate-x-1/2 top-full mt-2 z-50 bg-white border border-slate-100 shadow-[0_20px_40px_-5px_rgba(0,0,0,0.15)] rounded-xl min-w-[140px] py-2 overflow-hidden"
          >
            {Object.entries(STATUS_CONFIG).map(([key, item]) => (
              <button 
                key={key}
                onClick={() => { onSelect(key); setIsOpen(false); }}
                className={`w-full text-left px-4 py-2.5 font-serif text-[14px] font-medium leading-tight hover:bg-slate-50 transition-colors ${item.color} ${key === currentStatus ? 'bg-slate-50/50' : ''}`}
              >
                {item.label}
              </button>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function TimeBox({ label, value, onChange }) {
  return (
    <div className="flex-1">
      <Mono size={12} className="block mb-1.5 opacity-40 font-bold lowercase">{label}</Mono>
      <input 
        type="number" 
        value={value} 
        onChange={e => onChange(e.target.value)}
        className="w-full bg-white border border-slate-200 text-slate-900 font-serif text-xl p-3 text-center outline-none focus:border-slate-900 rounded-xl shadow-sm"
      />
    </div>
  );
}

function AdminTool({ title, desc, icon, onRun }) {
  return (
    <button 
      onClick={onRun}
      className="p-6 bg-white border border-slate-100 rounded-2xl text-left hover:border-slate-900 hover:shadow-xl transition-all group flex gap-4 items-start"
    >
      <span className="text-2xl mt-1">{icon}</span>
      <div>
        <div className="text-lg font-serif font-bold text-slate-900 lowercase">{title}</div>
        <div className="text-sm text-slate-400 mt-1 leading-relaxed lowercase">{desc}</div>
        <div className="mt-4 text-[12px] font-serif font-bold text-slate-900 lowercase opacity-0 group-hover:opacity-100 transition-opacity">execute task →</div>
      </div>
    </button>
  );
}
