import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Mono, GhostBtn } from './Common';
import { ChevronUp, ChevronDown, CheckCircle2 } from 'lucide-react';

// 1. Body Map Input
export function BodyMapInput({ clue, onCorrect }) {
  const [selected, setSelected] = useState(null);
  const [tried, setTried] = useState(false);

  const check = (id) => {
    setSelected(id);
    if (id === clue.answer) {
      setTimeout(onCorrect, 800);
    } else {
      setTried(true);
      setTimeout(() => setTried(false), 2000);
    }
  };

  return (
    <div className="flex flex-col items-center gap-8">
      <div className="relative w-full max-w-[280px] aspect-[1/2] bg-dg-adim/20 rounded-3xl p-6 border border-dg-border overflow-hidden pointer-events-auto">
        {/* Simple SVG Body Outline */}
        <svg viewBox="0 0 100 200" className="w-full h-full text-dg-muted opacity-30 pointer-events-none">
          <path fill="currentColor" d="M50 10c-5 0-9 4-9 9s4 9 9 9 9-4 9-9-4-9-9-9zm-10 20c-8 0-15 7-15 15v40c0 5 4 9 9 9h2v40c0 5 4 9 9 9s9-4 9-9V94h2c5 0 9-4 9-9V45c0-8-7-15-15-15H40zM35 150l5 40h10l5-40H35z" />
        </svg>

        {clue.options.map(opt => (
          <button
            key={opt.id}
            onClick={() => check(opt.id)}
            style={{ left: `${opt.x}%`, top: `${opt.y}%` }}
            className={`absolute w-6 h-6 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 transition-all flex items-center justify-center cursor-pointer z-20 ${selected === opt.id ? 'bg-dg-accent border-dg-accent' : 'bg-dg-bg border-dg-muted'}`}
          >
            <div className={`w-2 h-2 rounded-full ${selected === opt.id ? 'bg-white' : 'bg-dg-muted'}`} />
            <div className="absolute top-full mt-1 px-2 py-0.5 bg-dg-bg/90 border border-dg-border rounded text-[10px] whitespace-nowrap opacity-60 pointer-events-none">
              {opt.label}
            </div>
          </button>
        ))}
      </div>
      {tried && selected !== clue.answer && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-dg-red font-mono text-[12px] lowercase tracking-normal">
          not that one. think of propulsion.
        </motion.div>
      )}
    </div>
  );
}

// 2. Counter Input
export function CounterInput({ clue, onCorrect }) {
  const [val, setVal] = useState(clue.startValue);
  const [tried, setTried] = useState(false);

  const submit = () => {
    if (val === clue.answer) {
      onCorrect();
    } else {
      setTried(true);
      setTimeout(() => setTried(false), 2000);
    }
  };

  return (
    <div className="flex flex-col items-center gap-10">
      <div className="flex items-center gap-10">
        <button onClick={() => setVal(v => Math.max(0, v - 1))} className="w-14 h-14 rounded-full border border-dg-border flex items-center justify-center text-dg-accent hover:border-dg-accent transition-colors cursor-pointer">
          <ChevronDown size={28} />
        </button>
        <div className="w-32 text-center">
          <div className="text-7xl font-serif font-light text-dg-fg transition-all">
            {val}
          </div>
        </div>
        <button onClick={() => setVal(v => v + 1)} className="w-14 h-14 rounded-full border border-dg-border flex items-center justify-center text-dg-accent hover:border-dg-accent transition-colors cursor-pointer">
          <ChevronUp size={28} />
        </button>
      </div>
      <GhostBtn onClick={submit}>submit answer</GhostBtn>
      {tried && <div className="text-dg-red font-mono text-[13px] lowercase animate-in fade-in">not quite...</div>}
    </div>
  );
}

// 3. Selection Slots (Pasta/Cotton)
export function SelectionSlotsInput({ clue, onCorrect }) {
  const [selected, setSelected] = useState([]);
  const [wrong, setWrong] = useState(false);

  const toggle = (opt) => {
    if (selected.includes(opt)) {
      setSelected(p => p.filter(x => x !== opt));
    } else if (selected.length < clue.slots) {
      setSelected(p => [...p, opt]);
    }
    setWrong(false);
  };

  const submit = () => {
    const isCorrect = selected.length === clue.slots && selected.every(x => clue.answers.includes(x));
    if (isCorrect) {
      onCorrect();
    } else {
      setWrong(true);
      setTimeout(() => setWrong(false), 2000);
    }
  };

  return (
    <div className="space-y-10 pointer-events-auto">
      <div className="flex flex-wrap gap-3">
        {clue.options.map(opt => (
          <button
            key={opt}
            onClick={() => toggle(opt)}
            className={`cursor-pointer px-5 py-2.5 rounded-full border text-[15px] font-serif transition-all ${selected.includes(opt) ? 'bg-dg-accent border-dg-accent text-dg-bg' : 'border-dg-border text-dg-fg/60 hover:border-dg-accent hover:text-dg-fg'}`}
          >
            {opt}
          </button>
        ))}
      </div>
      <div className="flex justify-between items-center bg-dg-adim/10 p-6 rounded-2xl border border-dg-border">
        <div className="space-y-1 flex-1 min-w-0 pr-4">
          <Mono size={10} className="block opacity-50 uppercase tracking-widest">Selected</Mono>
          <div className="text-dg-fg text-[17px] italic font-light truncate">
            {selected.length === 0 ? 'choose three items...' : selected.join(', ')}
          </div>
        </div>
        <GhostBtn onClick={submit} className="px-8 shrink-0" disabled={selected.length < clue.slots}>submit</GhostBtn>
      </div>
      {wrong && <div className="text-center text-dg-red font-mono text-[13px] lowercase">those aren&rsquo;t the three. try again.</div>}
    </div>
  );
}

// 4. Numeral / Letter Slots Input
export function SlotsInput({ length, answer, onCorrect, isNumber = false }) {
  const [vals, setVals] = useState(Array(length).fill(''));
  const [wrong, setWrong] = useState(false);

  const change = (i, v) => {
    const next = [...vals];
    next[i] = v.slice(-1).toUpperCase();
    setVals(next);
    if (v && i < length - 1) {
      const el = document.getElementById(`slot-${i + 1}`);
      if (el) el.focus();
    }
  };

  const back = (i, e) => {
    if (e.key === 'Backspace' && !vals[i] && i > 0) {
      const el = document.getElementById(`slot-${i - 1}`);
      if (el) el.focus();
    }
  };

  const submit = () => {
    if (vals.join('') === answer.toUpperCase()) {
      onCorrect();
    } else {
      setWrong(true);
      setTimeout(() => setWrong(false), 2000);
    }
  };

  return (
    <div className="flex flex-col items-center gap-10">
      <div className={`flex justify-center gap-3 ${wrong ? 'shake' : ''}`}>
        {vals.map((v, i) => (
          <input
            key={i}
            id={`slot-${i}`}
            type={isNumber ? "number" : "text"}
            value={v}
            onChange={e => change(i, e.target.value)}
            onKeyDown={e => back(i, e)}
            className="w-12 h-16 bg-dg-bg border-b-2 border-dg-border text-dg-accent font-serif text-[32px] text-center outline-none focus:border-dg-accent transition-colors"
            autoFocus={i === 0}
          />
        ))}
      </div>
      <GhostBtn onClick={submit} disabled={vals.some(v => !v)}>submit</GhostBtn>
    </div>
  );
}

// 5. Dual Slider Input
export function DualSliderInput({ clue, onCorrect }) {
  const [vals, setVals] = useState([clue.range[0], clue.range[1]]);
  const [tried, setTried] = useState(false);

  const submit = () => {
    const ok0 = Math.abs(vals[0] - clue.answers[0]) <= clue.tolerance;
    const ok1 = Math.abs(vals[1] - clue.answers[1]) <= clue.tolerance;
    if (ok0 && ok1) onCorrect();
    else { setTried(true); setTimeout(() => setTried(false), 2000); }
  };

  return (
    <div className="space-y-12 pointer-events-auto">
      <div className="space-y-4">
        <div className="flex justify-between items-center px-1">
          <Mono size={12} className="opacity-50">freezes at</Mono>
          <Mono size={24} color="text-dg-accent">{vals[0]}°C</Mono>
        </div>
        <input type="range" min={clue.range[0]} max={clue.range[1]} value={vals[0]} onChange={e => setVals(v => [Number(e.target.value), v[1]])} className="cursor-pointer" />
      </div>
      <div className="space-y-4">
        <div className="flex justify-between items-center px-1">
          <Mono size={12} className="opacity-50">boils at</Mono>
          <Mono size={24} color="text-dg-accent">{vals[1]}°C</Mono>
        </div>
        <input type="range" min={clue.range[0]} max={clue.range[1]} value={vals[1]} onChange={e => setVals(v => [v[0], Number(e.target.value)])} className="cursor-pointer" />
      </div>
      <GhostBtn onClick={submit} className="w-full">verify calibrations</GhostBtn>
      {tried && <div className="text-center text-dg-red font-mono text-[13px] lowercase">the scales are not yet balanced.</div>}
    </div>
  );
}

// 6. Number + Unit Input
export function NumberUnitInput({ clue, onCorrect }) {
  const [val, setVal] = useState(clue.startValue);
  const [unit, setUnit] = useState(clue.units[0]);
  const [tried, setTried] = useState(false);

  const submit = () => {
    if (val === clue.answer.value && unit === clue.answer.unit) {
      onCorrect();
    } else {
      setTried(true);
      setTimeout(() => setTried(false), 2000);
    }
  };

  return (
    <div className="flex flex-col items-center gap-10">
      <div className="flex items-center gap-8">
        <div className="flex flex-col items-center border border-dg-border rounded-full p-2 bg-dg-adim/5">
          <button onClick={() => setVal(v => v + 1)} className="p-2 text-dg-muted hover:text-dg-accent cursor-pointer"><ChevronUp size={24} /></button>
          <div className="text-5xl font-serif text-dg-fg py-2 px-6">{val}</div>
          <button onClick={() => setVal(v => Math.max(0, v - 1))} className="p-2 text-dg-muted hover:text-dg-accent cursor-pointer"><ChevronDown size={24} /></button>
        </div>
        <div className="flex flex-col gap-2">
          {clue.units.map(u => (
            <button
              key={u}
              onClick={() => setUnit(u)}
              className={`px-6 py-2 rounded-full border text-[14px] font-serif transition-all cursor-pointer ${unit === u ? 'bg-dg-accent border-dg-accent text-dg-bg' : 'border-dg-border text-dg-muted hover:border-dg-accent'}`}
            >
              {u}
            </button>
          ))}
        </div>
      </div>
      <GhostBtn onClick={submit} className="px-12">verify duration</GhostBtn>
      {tried && <div className="text-dg-red font-mono text-[13px] lowercase animate-in fade-in">incorrect duration.</div>}
    </div>
  );
}

// 7. Buildings Tiles Input
export function BuildingsTilesInput({ clue, onCorrect }) {
  const [placements, setPlacements] = useState(clue.images.map(() => ({ name: null, city: null })));
  const [selectedTile, setSelectedTile] = useState(null);
  const [failedImages, setFailedImages] = useState([]);
  const cities = ["London", "Paris", "New York", "Vienna"];

  const selectTile = (val) => {
    const isCity = cities.includes(val);
    setSelectedTile({ val, type: isCity ? 'city' : 'name' });
  };

  const place = (index, slotType) => {
    if (!selectedTile || selectedTile.type !== slotType) return;
    const next = [...placements];
    next[index][slotType] = selectedTile.val;
    setPlacements(next);
    setSelectedTile(null);
  };

  const submit = () => {
    const allCorrect = placements.every((p, i) => p.name === clue.images[i].name && p.city === clue.images[i].city);
    if (allCorrect) onCorrect();
    else { setPlacements(clue.images.map(() => ({ name: null, city: null }))); }
  };

  const usedTiles = placements.flatMap(p => [p.name, p.city]).filter(Boolean);
  const remainingTiles = clue.tiles.filter((t, i) => {
    const instanceCount = clue.tiles.slice(0, i + 1).filter(x => x === t).length;
    const usedCount = usedTiles.filter(x => x === t).length;
    return usedCount < instanceCount;
  });

  return (
    <div className="space-y-12 pointer-events-auto">
      <div className="grid grid-cols-1 gap-6">
        {clue.images.map((img, i) => (
          <div key={i} className="flex gap-5 items-center bg-dg-adim/5 p-4 rounded-3xl border border-dg-border">
            <div className="w-20 h-20 rounded-2xl overflow-hidden border border-dg-border shrink-0">
              <div className="relative w-full h-full bg-dg-bg flex items-center justify-center overflow-hidden">
                {!failedImages.includes(i) && (
                  <img
                    src={img.url}
                    className="w-full h-full object-cover"
                    loading="lazy"
                    alt={img.name}
                    onError={() => setFailedImages(prev => (prev.includes(i) ? prev : [...prev, i]))}
                  />
                )}
                {failedImages.includes(i) && (
                  <div className="absolute inset-0 text-[10px] uppercase tracking-[0.2em] text-dg-muted flex items-center justify-center px-2 text-center">
                    image unavailable
                  </div>
                )}
              </div>
            </div>
            <div className="flex flex-col gap-2 flex-1 min-w-0">
              <button onClick={() => place(i, 'name')} className={`h-10 border-b text-left px-2 font-serif text-[14px] transition-all cursor-pointer ${placements[i].name ? 'border-dg-accent text-dg-accent' : 'border-dg-border text-dg-muted opacity-40'}`}>
                {placements[i].name || 'name'}
              </button>
              <button onClick={() => place(i, 'city')} className={`h-10 border-b text-left px-2 font-serif text-[14px] transition-all cursor-pointer ${placements[i].city ? 'border-dg-accent text-dg-accent' : 'border-dg-border text-dg-muted opacity-40'}`}>
                {placements[i].city || 'city'}
              </button>
            </div>
          </div>
        ))}
      </div>
      <div className="space-y-6">
        <Mono size={10} className="block opacity-40 uppercase tracking-widest">Available Labels</Mono>
        <div className="flex flex-wrap gap-2.5">
          {remainingTiles.map((t, i) => (
            <button key={i} onClick={() => selectTile(t)} className={`px-4 py-2 rounded-xl border text-[13px] font-serif transition-all cursor-pointer ${selectedTile?.val === t ? 'bg-dg-accent border-dg-accent text-dg-bg scale-105' : 'border-dg-border text-dg-fg/70 hover:border-dg-accent'}`}>{t}</button>
          ))}
        </div>
      </div>
      <GhostBtn onClick={submit} className="w-full" disabled={placements.some(p => !p.name || !p.city)}>submit identifications</GhostBtn>
    </div>
  );
}
