'use client';

import { useState, useRef, useCallback, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@supabase/supabase-js';

// ─── INITIALIZE SUPABASE ───────────────────────────────
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

// ─── TYPES ─────────────────────────────────────────────
interface TiltState {
  rotateX: number;
  rotateY: number;
}

// ─── TILT HOOK ─────────────────────────────────────────
function useTilt(maxRotation: number = 8) {
  const ref = useRef<HTMLDivElement>(null);
  const [tilt, setTilt] = useState<TiltState>({ rotateX: 0, rotateY: 0 });

  const onMouseMove = useCallback(
    (e: React.MouseEvent<HTMLDivElement>) => {
      if (!ref.current) return;
      const rect = ref.current.getBoundingClientRect();
      const x = (e.clientX - rect.left) / rect.width;
      const y = (e.clientY - rect.top) / rect.height;

      setTilt({
        rotateX: (y - 0.5) * -maxRotation * 2,
        rotateY: (x - 0.5) * maxRotation * 2,
      });
    },
    [maxRotation]
  );

  const onMouseLeave = useCallback(() => {
    setTilt({ rotateX: 0, rotateY: 0 });
  }, []);

  return { ref, tilt, onMouseMove, onMouseLeave };
}

// ─── PARTICLE BACKGROUND ───────────────────────────────
function ParticleBackground() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [opacity, setOpacity] = useState(0);

  useEffect(() => {
    setOpacity(1); // Smooth fade in
    
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationId: number;
    const particles: Array<{
      x: number;
      y: number;
      vx: number;
      vy: number;
      size: number;
      opacity: number;
      color: string;
    }> = [];

    const resize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };

    const createParticles = () => {
      const colors = ['#f97316', '#fb923c', '#fdba74', '#a855f7', '#c084fc'];
      for (let i = 0; i < 80; i++) {
        particles.push({
          x: Math.random() * canvas.width,
          y: Math.random() * canvas.height,
          vx: (Math.random() - 0.5) * 0.5,
          vy: (Math.random() - 0.5) * 0.5,
          size: Math.random() * 3 + 1,
          opacity: Math.random() * 0.6 + 0.2,
          color: colors[Math.floor(Math.random() * colors.length)],
        });
      }
    };

    const draw = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      particles.forEach((p1, i) => {
        particles.slice(i + 1).forEach((p2) => {
          const dx = p1.x - p2.x;
          const dy = p1.y - p2.y;
          const dist = Math.sqrt(dx * dx + dy * dy);

          if (dist < 150) {
            ctx.beginPath();
            ctx.strokeStyle = `rgba(249, 115, 22, ${0.15 * (1 - dist / 150)})`;
            ctx.lineWidth = 0.5;
            ctx.moveTo(p1.x, p1.y);
            ctx.lineTo(p2.x, p2.y);
            ctx.stroke();
          }
        });
      });

      particles.forEach((p) => {
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx.fillStyle = p.color;
        ctx.globalAlpha = p.opacity;
        ctx.fill();
        ctx.globalAlpha = 1;

        p.x += p.vx;
        p.y += p.vy;

        if (p.x < 0 || p.x > canvas.width) p.vx *= -1;
        if (p.y < 0 || p.y > canvas.height) p.vy *= -1;
      });

      animationId = requestAnimationFrame(draw);
    };

    resize();
    createParticles();
    draw();

    window.addEventListener('resize', resize);
    return () => {
      cancelAnimationFrame(animationId);
      window.removeEventListener('resize', resize);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="fixed inset-0 pointer-events-none"
      style={{ 
        zIndex: 1,
        opacity: opacity,
        transition: 'opacity 1.5s ease-in-out' 
      }}
    />
  );
}

// ─── LOGO ──────────────────────────────────────────────
function FloatingLogo() {
  return (
    <div className="relative flex flex-col items-center gap-1">
      <div className="relative animate-[float_4s_ease-in-out_infinite]">
        <svg
          width="56"
          height="56"
          viewBox="0 0 24 24"
          fill="none"
          style={{ filter: 'drop-shadow(0 0 20px rgba(249, 115, 22, 0.6))' }}
        >
          <defs>
            <linearGradient id="shield-grad" x1="12" y1="2" x2="12" y2="22" gradientUnits="userSpaceOnUse">
              <stop stopColor="#ff8c00" />
              <stop offset="0.5" stopColor="#f97316" />
              <stop offset="1" stopColor="#ea580c" />
            </linearGradient>
          </defs>
          <path
            d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"
            fill="url(#shield-grad)"
            stroke="#ff6b00"
            strokeWidth="1.5"
          />
          <path
            d="M9 12l2 2 4-4"
            stroke="white"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>

        <span className="absolute inset-0 animate-[orbit_4s_linear_infinite]">
          <span
            className="absolute w-2 h-2 rounded-full bg-orange-400"
            style={{ top: '-4px', left: '50%', transform: 'translateX(-50%)', boxShadow: '0 0 10px rgba(249, 115, 22, 0.8)' }}
          />
        </span>
      </div>

      <div className="flex items-center gap-2 mt-5">
        <h1 className="text-4xl font-bold text-white tracking-tight drop-shadow-[0_0_15px_rgba(249,115,22,0.3)]">
          Chatrax
        </h1>
        <span className="relative flex h-3 w-3 mt-1">
          <span className="absolute inline-flex h-full w-full rounded-full bg-green-400 animate-[ping_2s_cubic-bezier(0,0,0.2,1)_infinite]" />
          <span className="relative inline-flex rounded-full h-3 w-3 bg-green-500" />
        </span>
      </div>

      <p className="text-xs uppercase tracking-[0.3em] font-medium mt-1 text-white/50">
        Secure Access Portal
      </p>
    </div>
  );
}

// ─── DEEP DARK GLASS INPUT ─────────────────────────────
function DarkGlassInput({ 
    label, 
    name, 
    type, 
    value, 
    onChange, 
    required,
    showPasswordToggle,
    showPassword,
    onTogglePassword
}: { 
    label: string; 
    name: string; 
    type: string; 
    value: string; 
    onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
    required?: boolean;
    showPasswordToggle?: boolean;
    showPassword?: boolean;
    onTogglePassword?: () => void;
}) {
    return (
        <div className="relative group w-full rounded-[2rem] p-[1.5px] overflow-hidden transition-all duration-300 focus-within:scale-[1.02]">
            
            <div className="absolute inset-0 bg-[linear-gradient(90deg,transparent_0%,rgba(100,150,255,0.2)_50%,transparent_100%)] bg-[length:200%_100%] animate-[sweep_3s_linear_infinite] opacity-50 group-hover:opacity-100 transition-opacity" />
            <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(255,255,255,0.1)_0%,transparent_100%)] rounded-[2rem]" />

            <div className="relative w-full h-full bg-[#0c0c12]/95 backdrop-blur-2xl rounded-[calc(2rem-1.5px)] flex flex-col justify-center px-8 pt-6 pb-4 shadow-[inset_0_10px_30px_rgba(0,0,0,0.8)] group-focus-within:shadow-[inset_0_0_20px_rgba(249,115,22,0.05)] transition-all duration-500">
                
                <label className="absolute top-4 left-8 text-[11px] font-bold tracking-[0.15em] text-[#b36b42] uppercase pointer-events-none transition-colors duration-300 group-focus-within:text-orange-400">
                    {label}
                </label>
                
                <input
                    name={name}
                    type={type}
                    value={value}
                    onChange={onChange}
                    required={required}
                    autoComplete={type === 'password' ? 'current-password' : 'username'}
                    placeholder=" "
                    className={`w-full bg-transparent text-white/90 text-lg outline-none border-none mt-1 font-light tracking-wide ${type === 'password' && !showPassword ? 'tracking-[0.2em] font-medium' : ''}`}
                    style={{ 
                        textShadow: '0 0 10px rgba(255,255,255,0.1)',
                    }}
                />

                {showPasswordToggle && onTogglePassword && (
                    <button
                        type="button"
                        onClick={onTogglePassword}
                        className="absolute right-6 top-[50%] -translate-y-[50%] text-white/20 hover:text-white/60 transition-colors z-20"
                    >
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                            <circle cx="12" cy="12" r="3" />
                        </svg>
                    </button>
                )}
            </div>
        </div>
    );
}

// ─── LOGIN FORM ────────────────────────────────────────
function LoginForm() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    try {
      const { data, error: authError } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (authError) {
        setError(authError.message);
        setIsLoading(false);
        return;
      }

      if (data.session) {
        setTimeout(() => {
          router.push('/dashboard');
        }, 1500);
      }
    } catch (err) {
      setError('An unexpected error occurred.');
      setIsLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-6 w-full mt-2 relative z-10" style={{ transform: 'translateZ(30px)' }}>
      
      <DarkGlassInput 
          label="Agent Identity"
          name="email"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
      />

      <DarkGlassInput 
          label="Passcode"
          name="password"
          type={showPassword ? "text" : "password"}
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
          showPasswordToggle
          showPassword={showPassword}
          onTogglePassword={() => setShowPassword(!showPassword)}
      />

      {error && (
        <p className="text-[11px] text-red-400 text-center uppercase tracking-widest font-mono font-bold animate-[shake_0.5s_ease-in-out]">
          {error}
        </p>
      )}

      <div className="mt-4 group relative w-full">
        <div className="absolute -inset-1 rounded-full opacity-70 group-hover:opacity-100 transition-opacity duration-500 bg-[linear-gradient(90deg,#f97316,#ea580c,#f97316)] bg-[length:200%_100%] animate-[gradientShift_3s_linear_infinite] blur-xl z-[-1]" />
        
        <button
          type="submit"
          disabled={isLoading}
          className="relative overflow-hidden w-full py-4 rounded-full font-semibold text-white bg-[linear-gradient(135deg,#f97316,#ea580c)] shadow-[0_10px_20px_rgba(255,107,0,0.2)] transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_15px_30px_rgba(255,107,0,0.4)] hover:bg-[linear-gradient(135deg,#ea580c,#ff6b00)] disabled:opacity-80 disabled:cursor-not-allowed"
        >
          {isLoading ? (
            <span className="flex items-center justify-center gap-3">
              <svg className="h-5 w-5 animate-[spin_1s_linear_infinite]" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
              </svg>
              <span className="animate-pulse tracking-wide">Authenticating...</span>
            </span>
          ) : (
            <span className="flex items-center justify-center gap-2 tracking-wide">
              Initialize Session
              <svg className="w-4 h-4 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
              </svg>
            </span>
          )}
        </button>
      </div>

      <button
        type="button"
        className="mt-6 text-sm text-center font-medium text-white/40 hover:text-white hover:underline transition-all"
      >
        Forgot authorization code?
      </button>
    </form>
  );
}

// ─── LOGIN CARD (3D Mouse Tilt) ────────────────────────
function LoginCard() {
  const { ref, tilt, onMouseMove, onMouseLeave } = useTilt(8);
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  return (
    <div
      ref={ref}
      onMouseMove={onMouseMove}
      onMouseLeave={onMouseLeave}
      style={{
        transform: isMounted 
          ? `perspective(1000px) rotateX(${tilt.rotateX}deg) rotateY(${tilt.rotateY}deg) translateY(0px)` 
          : 'perspective(1000px) rotateX(0deg) rotateY(0deg) translateY(20px)',
        transformStyle: 'preserve-3d',
        opacity: isMounted ? 1 : 0,
        transition: 'opacity 0.8s ease-out, transform 0.4s cubic-bezier(0.25, 0.8, 0.25, 1)', 
      }}
      className="relative w-[420px] p-10 rounded-[2.5rem] group will-change-transform"
    >
      <div className="absolute inset-0 z-0 overflow-hidden rounded-[2.5rem] bg-[#0c0c10]/80 backdrop-blur-[40px] border border-white/5 shadow-[0_25px_50px_-12px_rgba(0,0,0,0.8)]">
        <div className="absolute inset-[-50%] group-hover:opacity-100 opacity-50 transition-opacity duration-1000 bg-[conic-gradient(from_0deg,transparent_70%,rgba(255,107,0,0.15)_100%)] animate-[rotateGlow_6s_linear_infinite] z-[-1]" />
      </div>

      <div className="relative z-10 flex flex-col items-center w-full">
        <FloatingLogo />
        <LoginForm />
      </div>
    </div>
  );
}

// ─── MAIN PAGE ─────────────────────────────────────────
export default function LoginPage() {
  return (
    <main className="relative min-h-screen overflow-hidden flex items-center justify-center font-sans bg-[linear-gradient(135deg,#050505_0%,#150a0a_25%,#050505_50%,#0a0515_75%,#050505_100%)]">
      
      <ParticleBackground />
      
      <div className="absolute bottom-[-30vh] w-[200vw] h-[80vh] left-[-50vw] pointer-events-none z-0"
          style={{
            backgroundImage: 'linear-gradient(rgba(255, 107, 0, 0.05) 1px, transparent 1px), linear-gradient(90deg, rgba(255, 107, 0, 0.05) 1px, transparent 1px)',
            backgroundSize: '40px 40px',
            transform: 'rotateX(60deg)',
            animation: 'gridScan 4s linear infinite',
            maskImage: 'radial-gradient(ellipse at top, transparent 10%, black 70%, transparent 100%)',
            WebkitMaskImage: 'radial-gradient(ellipse at top, transparent 10%, black 70%, transparent 100%)',
          }}
      />
      
      <LoginCard />
    </main>
  );
}