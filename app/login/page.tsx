'use client';

import React, { useState } from 'react';
import { createClient } from '@supabase/supabase-js';
import { useRouter } from 'next/navigation';
import { Eye, EyeOff } from 'lucide-react';

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

    // Direct routing to the main dashboard instead of the inbox section
    router.push('/dashboard');
    router.refresh();
  };

  return (
    <div className="fixed inset-0 w-screen h-screen overflow-hidden bg-[#0a0a0c] flex items-center justify-center p-4 font-sans antialiased select-none touch-none">
      
      {/* Absolute static mesh canvas layer providing the smooth backdrop transition */}
      <div className="absolute inset-0 w-full h-full bg-[radial-gradient(ellipse_at_center,_#16171b_0%,_#090a0c_70%,_#030304_100%)] pointer-events-none z-0" />
      
      {/* Luxury Muted Ambient Lighting Overlays */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-indigo-500/[0.015] rounded-full blur-[140px] pointer-events-none z-0" />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[400px] h-[400px] bg-white/[0.01] rounded-full blur-[100px] pointer-events-none z-0" />

      {/* Floating Application Window Box with Isolated Layout Containers */}
      <div className="w-full max-w-[900px] h-[600px] bg-gradient-to-b from-[#242529] to-[#1c1d20] rounded-[2rem] shadow-[0_30px_80px_-20px_rgba(0,0,0,0.85)] flex overflow-hidden relative border border-white/[0.04] backdrop-blur-xl z-10 animate-in fade-in zoom-in-95 duration-500 ease-out">
        
        {/* Dynamic Sequential Window Controls (Lights up one-by-one slowly) */}
        <div className="absolute top-7 left-7 flex gap-2 z-20">
          <div className="w-2.5 h-2.5 rounded-full bg-white/20 border border-white/[0.01] animate-[pulse_3s_infinite_ease-in-out] shadow-[0_0_8px_rgba(255,255,255,0.1)]"></div>
          <div className="w-2.5 h-2.5 rounded-full bg-white/20 border border-white/[0.01] animate-[pulse_3s_infinite_1s_ease-in-out] shadow-[0_0_8px_rgba(255,255,255,0.1)]"></div>
          <div className="w-2.5 h-2.5 rounded-full bg-white/20 border border-white/[0.01] animate-[pulse_3s_infinite_2s_ease-in-out] shadow-[0_0_8px_rgba(255,255,255,0.1)]"></div>
        </div>

        {/* LEFT COMPONENT LAYER: FORM CONTENT & AUTHORIZATION */}
        <div className="w-1/2 h-full flex flex-col pt-24 px-14 pb-12 relative z-10">
          
          <h1 className="text-[28px] font-semibold text-white/95 mb-9 tracking-tight">
            Sign in
          </h1>

          {errorMsg && (
            <div className="mb-4 text-red-400 text-xs bg-red-950/20 px-3 py-2.5 rounded-xl border border-red-900/30">
              {errorMsg}
            </div>
          )}

          <form onSubmit={handleLogin} className="flex flex-col flex-grow">
            
            {/* Input Segment: Business Email */}
            <div className="mb-5">
              <label htmlFor="email-field" className="text-[11px] text-white/40 mb-2 block font-medium tracking-wide">
                Your email
              </label>
              <input
                id="email-field"
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="name@company.com"
                className="w-full bg-[#151619] text-white/90 text-sm rounded-xl px-4 py-3 border border-white/[0.01] focus:border-white/10 focus:ring-4 focus:ring-white/[0.01] focus:outline-none transition-all placeholder-white/20 font-light select-text"
              />
            </div>

            {/* Input Segment: Security Password */}
            <div className="mb-8">
              <div className="flex justify-between items-end mb-2">
                <label htmlFor="password-field" className="text-[11px] text-white/40 block font-medium tracking-wide">
                  Password
                </label>
                <button type="button" className="text-[11px] text-white/40 hover:text-white/80 transition-colors">
                  Forget password?
                </button>
              </div>
              
              <div className="relative">
                <input
                  id="password-field"
                  type={showPassword ? "text" : "password"}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full bg-[#151619] text-white/90 text-sm rounded-xl pl-4 pr-10 py-3 border border-white/[0.01] focus:border-white/10 focus:ring-4 focus:ring-white/[0.01] focus:outline-none transition-all placeholder-white/20 font-light select-text"
                />
                <button 
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-white/30 hover:text-white/70 transition-colors"
                >
                  {showPassword ? <EyeOff size={15} /> : <Eye size={15} />}
                </button>
              </div>
            </div>

            {/* Matte Action Button with Radial Sheen */}
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-gradient-to-b from-[#4a4d55] to-[#36373d] text-white/90 text-[13px] font-medium rounded-xl py-3.5 hover:from-[#545761] hover:to-[#3e3f46] transition-all shadow-[0_4px_25px_rgba(0,0,0,0.4)] flex justify-center items-center active:scale-[0.99] disabled:opacity-50 border border-white/[0.02]"
            >
              {loading ? (
                <div className="h-4 w-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                'Sign in'
              )}
            </button>

            {/* Account Redirection Footer */}
            <div className="mt-auto text-center">
              <span className="text-[11px] text-white/30">Don't have an account? </span>
              <button type="button" className="text-[11px] text-white/70 hover:text-white hover:underline transition-all">
                Sign up
              </button>
            </div>

          </form>
        </div>

        {/* RIGHT COMPONENT LAYER: ARTWORK INSIDE SOLID ONYX SHIELD */}
        <div className="w-1/2 h-full p-4">
          <div className="w-full h-full bg-[#050506] rounded-[1.5rem] relative overflow-hidden flex flex-col justify-end pb-8 shadow-[inner_0_4px_30px_rgba(0,0,0,0.9)] border border-white/[0.015]">
            
            {/* Fine Geometric Starfield Mapping Layout */}
            <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
              
              {/* Primary Gas Giant Orb Effect */}
              <div className="absolute w-[90px] h-[90px] rounded-full bg-gradient-to-b from-[#a4b5c7] via-[#6581a0] to-transparent shadow-[0_-12px_40px_rgba(147,169,192,0.22)] mt-8" />
              
              {/* Remote Satellite Object */}
              <div className="absolute top-[25%] right-[20%] w-[16px] h-[16px] rounded-full bg-gradient-to-b from-[#7ca1c7] to-[#1e2a38] shadow-[0_0_15px_rgba(124,161,199,0.25)]" />

              {/* Slow Moving Cosmic Stream Tracks Left */}
              <div className="absolute top-[20%] left-[30%] w-[1px] h-[120px] bg-gradient-to-b from-white/60 to-transparent opacity-40" />
              <div className="absolute top-[20%] left-[30%] w-[2.5px] h-[2.5px] bg-white rounded-full translate-x-[-0.75px] shadow-[0_0_6px_#fff]" />

              {/* Slow Moving Cosmic Stream Tracks Right */}
              <div className="absolute top-[45%] right-[25%] w-[1px] h-[100px] bg-gradient-to-b from-white/50 to-transparent opacity-30" />
              <div className="absolute top-[45%] right-[25%] w-[2.5px] h-[2.5px] bg-white rounded-full translate-x-[-0.75px] shadow-[0_0_6px_#fff]" />

              {/* Star Spatial Markers */}
              <div className="absolute top-[40%] left-[20%] w-[1.5px] h-[1.5px] bg-white rounded-full opacity-30" />
              <div className="absolute top-[35%] right-[35%] w-[1.5px] h-[1.5px] bg-white rounded-full opacity-40" />
              <div className="absolute bottom-[35%] left-[35%] w-[1.5px] h-[1.5px] bg-white rounded-full opacity-20" />
              <div className="absolute bottom-[25%] right-[40%] w-[1px] h-[1px] bg-white rounded-full opacity-50" />
            </div>

            {/* Branded Identity Core Wordmark */}
            <div className="relative z-10 w-full flex justify-center items-center">
              <span className="text-white/60 text-xs font-semibold tracking-[0.25em] lowercase select-none pl-[0.25em]">
                chatrax
              </span>
            </div>

          </div>
        </div>

      </div>
    </div>
  );
}