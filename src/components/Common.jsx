import React, { useState } from 'react';
import { motion } from 'framer-motion';

export function Shell({ children, center = true }) {
  return (
    <div className={`min-h-screen bg-dg-bg flex flex-col items-center ${center ? 'justify-center' : 'justify-start'} px-6 py-8 pb-32 relative overflow-hidden`}>
      {/* Grainy overlay */}
      <div className="fixed inset-0 pointer-events-none z-0 opacity-55 animate-[grain_8s_steps(10)_infinite]"
           style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)' opacity='0.04'/%3E%3C/svg%3E")`, backgroundRepeat: 'repeat', backgroundSize: '180px' }} />
      <div className="w-full max-w-[500px] relative z-10">
        {children}
      </div>
    </div>
  );
}

export function Mono({ children, size = 11, color = "text-dg-muted", spacing = "tracking-normal", className = "" }) {
  return (
    <span className={`font-mono ${color} ${className}`} style={{ fontSize: `${size}px`, letterSpacing: spacing }}>
      {children}
    </span>
  );
}

export function Divider({ my = "my-6", opacity = "opacity-40" }) {
  return <div className={`w-10 h-px bg-dg-accent ${my} ${opacity}`} />;
}

export function GhostBtn({ onClick, children, className = "", variant = "normal", type = "button" }) {
  const styles = {
    normal: "border-dg-border text-dg-muted hover:bg-dg-adim hover:border-dg-accent hover:text-dg-accent",
    green: "border-dg-green text-dg-green hover:bg-dg-green/10",
    red: "border-dg-red text-dg-red hover:bg-dg-red/10",
    dark: "border-dg-bg text-dg-bg hover:bg-dg-bg hover:text-white",
  };
  
  return (
    <motion.button 
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      type={type}
      onClick={onClick}
      className={`border font-serif text-[18px] font-medium px-12 py-4 cursor-pointer rounded-full transition-all duration-300 lowercase ${styles[variant]} ${className}`}
    >
      {children}
    </motion.button>
  );
}

export function StyledInput({ value, onChange, onSubmit, placeholder, shake, autoFocus = true }) {
  return (
    <div className={shake ? "shake" : ""}>
      <input 
        type="text" 
        value={value} 
        onChange={e => onChange(e.target.value)} 
        onKeyDown={e => e.key === "Enter" && onSubmit()} 
        placeholder={placeholder} 
        autoFocus={autoFocus}
        className="w-full bg-transparent border-0 border-b border-dg-border text-dg-fg font-serif text-[15px] py-3 outline-none focus:border-dg-accent transition-colors"
      />
    </div>
  );
}
