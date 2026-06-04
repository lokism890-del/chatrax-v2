'use client';

import React, { useState, useEffect } from 'react';
import { createClient } from '@supabase/supabase-js';
import { useRouter } from 'next/navigation';
import { Eye, EyeOff, Check, AlertCircle } from 'lucide-react';

// Initialize core Supabase client directly
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';
const supabase = createClient(supabaseUrl, supabaseKey);

export default function LoginPage() {
  const router = useRouter();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [isEmailValid, setIsEmailValid] = useState(false);

  useEffect(() => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    setIsEmailValid(emailRegex.test(email));
  }, [email]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErrorMsg(null);

    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      setErrorMsg(error.message);
      setLoading(false);
      return;
    }

    router.push('/dashboard');
    router.refresh();
  };

  return (
    // DEEPER, HIGH-CONTRAST FLUID GRADIENT BACKGROUND SHELL
    <div className="fixed inset-0 w-screen h-screen overflow-hidden bg-[#0a0a0f] flex items-center justify-center p-4 font-sans antialiased select-none touch-none">
      
      {/* 400% Scaled Cosmic Layer - Shifting smoothly between deep charcoal, midnight obsidian, and matte slate */}
      <div className="absolute inset-0 w-full h-full bg-[linear-gradient(135deg,#161722_0%,#050507_35%,#222533_70%,#090a0e_100%)] bg-[size:400%_400%] animate-[bgFluid_20s_ease_infinite] pointer-events-none z-0" />
      
      {/* Central Ambient Glow Pass */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[750px] h-[750px] bg-white/[0.015] rounded-full blur-[140px] pointer-events-none z-0 animate-[pulse_8s_infinite_ease-in-out]" />

      {/* STYLING ENGINES FOR KINETIC COSMIC GRAPHICS */}
      <style dangerouslySetInnerHTML={{__html: `
        @keyframes bgFluid {
          0% { background-position: 0% 50%; }
          50% { background-position: 100% 50%; }
          100% { background-position: 0% 50%; }
        }
        @keyframes starAscend {
          0% { transform: translateY(120px); opacity: 0; }
          15% { opacity: 1; }
          85% { opacity: 1; }
          100% { transform: translateY(-140px); opacity: 0; }
        }
        @keyframes whitePulse {
          0%, 100% { text-shadow: 0 0 8px rgba(255,255,255,0.2); opacity: 0.75; filter: drop-shadow(0 0 2px rgba(255,255,255,0.1)); }
          50% { text-shadow: 0 0 25px rgba(255,255,255,0.9), 0 0 40px rgba(255,255,255,0.4); opacity: 1; filter: drop-shadow(0 0 12px rgba(255,255,255,0.8)); }
        }
        @keyframes controlGlow {
          0%, 100% { background-color: rgba(255, 255, 255, 0.15); box-shadow: 0 0 4px rgba(255, 255, 255, 0.05); }
          50% { background-color: rgba(255, 255, 255, 0.7); box-shadow: 0 0 12px 2px rgba(255, 255, 255, 0.4); }
        }
        @keyframes moonLight {
          0%, 100% { box-shadow: 0 0 35px 2px rgba(255,255,255,0.15); filter: brightness(1); }
          50% { box-shadow: 0 0 65px 15px rgba(255,255,255,0.35); filter: brightness(1.2); }
        }
        @keyframes btnShine {
          0% { transform: translateX(-150%) skewX(-25deg); }
          100% { transform: translateX(250%) skewX(-25deg); }
        }
        .flow-star-slow { animation: starAscend 7s infinite linear; }
        .flow-star-medium { animation: starAscend 5s infinite linear; }
        .flow-star-fast { animation: starAscend 3.5s infinite linear; }
        .pulsate-white-glow { animation: whitePulse 4s infinite ease-in-out; }
        .moon-shining-core { animation: moonLight 6s infinite ease-in-out; }
        .control-dot-1 { animation: controlGlow 4s infinite ease-in-out; }
        .control-dot-2 { animation: controlGlow 4s infinite ease-in-out 1.2s; }
        .control-dot-3 { animation: controlGlow 4s infinite ease-in-out 2.4s; }
        .delay-s1 { animation-delay: 1.5s; }
        .delay-s2 { animation-delay: 3.2s; }
        .delay-s3 { animation-delay: 0.8s; }
      `}} />

      {/* 40% / 60% GLASSMORPHISM PANEL CONTAINER */}
      <div className="w-full max-w-[1020px] h-[640px] bg-[#121318]/70 rounded-[2.5rem] shadow-[0_30px_100px_-20px_rgba(0,0,0,0.85)] flex overflow-hidden relative border border-white/[0.06] backdrop-blur-2xl z-10 animate-in fade-in zoom-in-95 duration-500">
        
        {/* WINDOW CONTROLS: Cascading sequential soft white pulses */}
        <div className="absolute top-6 left-7 flex gap-2 z-30">
          <div className="w-2 h-2 rounded-full control-dot-1"></div>
          <div className="w-2 h-2 rounded-full control-dot-2"></div>
          <div className="w-2 h-2 rounded-full control-dot-3"></div>
        </div>

        {/* ─── LEFT PANEL: MINIMAL FORM LAYER (40%) ─── */}
        <div className="w-[40%] h-full flex flex-col justify-center px-11 relative border-r border-white/[0.02] z-10 animate-in fade-in slide-in-from-bottom-4 duration-700 delay-100">
          
          <div className="mb-10">
            <h1 className="text-2xl font-semibold text-white/95 tracking-tight">Sign in</h1>
          </div>

          {errorMsg && (
            <div className="mb-4 text-red-400 text-xs bg-red-950/20 px-3 py-2.5 rounded-xl border border-red-900/20 flex items-center gap-2">
              <AlertCircle size={14} className="shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          <form onSubmit={handleLogin} className="flex flex-col space-y-5">
            
            {/* Input Component Element: Email Input */}
            <div className="relative group">
              <input
                id="email-input"
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder=" "
                className="w-full bg-white/[0.01] text-zinc-100 text-sm rounded-xl pl-4 pr-10 pt-5 pb-2 border border-white/[0.05] group-hover:border-white/10 focus:border-blue-500/60 focus:ring-4 focus:ring-blue-500/[0.01] focus:outline-none transition-all peer placeholder-shown:placeholder-transparent select-text"
              />
              <label 
                htmlFor="email-input"
                className="absolute left-4 top-3.5 text-xs text-zinc-500 transition-all pointer-events-none origin-[0_0] transform peer-placeholder-shown:scale-100 peer-placeholder-shown:translate-y-0 peer-focus:scale-75 peer-focus:-translate-y-2.5 peer-focus:text-blue-400 font-medium -translate-y-2.5 scale-75"
              >
                Email address
              </label>
              {isEmailValid && (
                <div className="absolute right-3.5 top-1/2 -translate-y-1/2 text-blue-400 animate-in fade-in zoom-in-75 duration-200">
                  <Check size={14} strokeWidth={3} />
                </div>
              )}
            </div>

            {/* Input Component Element: Password Input */}
            <div className="relative group">
              <input
                id="password-input"
                type={showPassword ? "text" : "password"}
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder=" "
                className="w-full bg-white/[0.01] text-zinc-100 text-sm rounded-xl pl-4 pr-12 pt-5 pb-2 border border-white/[0.05] group-hover:border-white/10 focus:border-blue-500/60 focus:ring-4 focus:ring-blue-500/[0.01] focus:outline-none transition-all peer placeholder-shown:placeholder-transparent select-text"
              />
              <label 
                htmlFor="password-input"
                className="absolute left-4 top-3.5 text-xs text-zinc-500 transition-all pointer-events-none origin-[0_0] transform peer-placeholder-shown:scale-100 peer-placeholder-shown:translate-y-0 peer-focus:scale-75 peer-focus:-translate-y-2.5 peer-focus:text-blue-400 font-medium -translate-y-2.5 scale-75"
              >
                Password
              </label>
              <button 
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3.5 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-zinc-300 transition-colors"
              >
                {showPassword ? <EyeOff size={14} /> : <Eye size={14} />}
              </button>
            </div>

            <div className="flex justify-end pt-1">
              <button type="button" className="text-[11px] text-zinc-500 hover:text-blue-400 transition-colors">
                Forgot password details?
              </button>
            </div>

            {/* Dynamic Sign-In Button */}
            <div className="pt-3 relative group/btn overflow-hidden rounded-xl">
              <button
                type="submit"
                disabled={loading}
                className="w-full relative overflow-hidden bg-gradient-to-r from-blue-600 via-indigo-600 to-blue-600 text-white text-xs font-semibold py-4 transition-all shadow-[0_4px_25px_rgba(37,99,235,0.15)] hover:shadow-[0_4px_35px_rgba(37,99,235,0.35)] flex justify-center items-center active:scale-[0.995] hover:-translate-y-0.5 duration-200"
              >
                <div className="absolute inset-0 w-1/3 h-full bg-gradient-to-r from-transparent via-white/20 to-transparent skew-x-[-25deg] animate-[btnShine_3.5s_infinite_linear]" />
                
                {loading ? (
                  <div className="h-4 w-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : (
                  'Sign in to Workspace'
                )}
              </button>
            </div>

          </form>
        </div>

        {/* ─── RIGHT PANEL: COSMIC PREVIEW CANVAS (60%) ─── */}
        <div className="w-[60%] h-full p-4 relative overflow-hidden bg-[#030305] flex flex-col justify-end pb-14 shadow-[inner_0_4px_40px_rgba(0,0,0,0.95)]">
          
          {/* Spatial Mapping Framework Area */}
          <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
            
            {/* CENTRAL MOON OBJECT: Emits sharp white lighting glow loops */}
            <div className="absolute w-[98px] h-[98px] rounded-full bg-gradient-to-b from-[#cadcf2] via-[#6a8bb0] to-[#1a232d] z-10 moon-shining-core" />
            
            {/* Secondary Satellite System Orbit */}
            <div className="absolute top-[22%] right-[24%] w-[16px] h-[16px] rounded-full bg-gradient-to-br from-[#8db3db] via-[#324a63] to-[#0d141c] shadow-[0_0_12px_rgba(141,179,219,0.25)]" />

            {/* ─── HARDWARE-ACCELERATED CONTINUOUS UPWARD STAR CONDUITS ─── */}
            
            {/* Star Pathway 1: Left Node Lane */}
            <div className="absolute left-[28%] top-[10%] h-[240px] w-px bg-gradient-to-b from-white/25 via-white/5 to-transparent">
              <div className="w-1 h-1 bg-white rounded-full shadow-[0_0_10px_#fff] flow-star-slow" />
            </div>

            {/* Star Pathway 2: Right Node Lane */}
            <div className="absolute right-[26%] top-[30%] h-[180px] w-px bg-gradient-to-b from-white/20 via-white/5 to-transparent">
              <div className="w-1 h-1 bg-white rounded-full shadow-[0_0_12px_#fff] flow-star-fast delay-s1" />
            </div>

            {/* Star Pathway 3: Inner Mid Left Node Lane */}
            <div className="absolute left-[42%] bottom-[32%] h-[110px] w-px bg-gradient-to-b from-white/10 to-transparent">
              <div className="w-[1.5px] h-[1.5px] bg-white rounded-full shadow-[0_0_6px_#fff] flow-star-medium delay-s2" />
            </div>

            {/* Star Pathway 4: Lower Outer Right Node Lane */}
            <div className="absolute right-[15%] bottom-[20%] h-[140px] w-px bg-gradient-to-b from-white/15 to-transparent">
              <div className="w-[1.5px] h-[1.5px] bg-white rounded-full shadow-[0_0_6px_#fff] flow-star-slow delay-s3" />
            </div>

            {/* Fixed Backdrop Coordinates */}
            <div className="absolute top-[48%] left-[18%] w-[1.5px] h-[1.5px] bg-white rounded-full opacity-30 animate-pulse" />
            <div className="absolute top-[38%] right-[42%] w-[1px] h-[1px] bg-white rounded-full opacity-50" />
            <div className="absolute bottom-[35%] left-[24%] w-[1.5px] h-[1.5px] bg-white rounded-full opacity-20" />
          </div>

          {/* ─── BRANDING TEXT PANEL: WHITE RADIANT PULSATING WORDMARK ─── */}
          <div className="relative z-20 w-full flex flex-col items-center gap-2 text-center px-6 transform-gpu tracking-wide select-none pointer-events-none">
            <span className="text-white text-base font-bold tracking-[0.35em] uppercase p-1 pb-0.5 pl-[0.35em] pulsate-white-glow">
              chatrax
            </span>
          </div>

        </div>

      </div>
    </div>
  );
}
