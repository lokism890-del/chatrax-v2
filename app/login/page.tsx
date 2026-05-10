"use client"

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '../../lib/supabase'; 
import { User, Key, AlertTriangle, Loader2 } from 'lucide-react';

// ─── AMBIENT STARFIELD ───
function AnimatedStarfield() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationFrameId: number;
    const stars: { 
      x: number; y: number; radius: number; 
      vx: number; vy: number; 
      baseOpacity: number; angle: number; twinkleSpeed: number;
    }[] = [];

    const initStars = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
      stars.length = 0; 
      const numStars = Math.floor((canvas.width * canvas.height) / 1000); 

      for (let i = 0; i < numStars; i++) {
        stars.push({
          x: Math.random() * canvas.width,
          y: Math.random() * canvas.height,
          radius: Math.random() * 1.2 + 0.2,
          vx: (Math.random() - 0.5) * 0.08,
          vy: (Math.random() - 0.5) * 0.08,
          baseOpacity: Math.random() * 0.5 + 0.2,
          angle: Math.random() * Math.PI * 2,
          twinkleSpeed: Math.random() * 0.01 + 0.005
        });
      }
    };

    const animate = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      stars.forEach((star) => {
        star.angle += star.twinkleSpeed;
        const currentOpacity = star.baseOpacity + Math.sin(star.angle) * 0.3;
        
        ctx.globalAlpha = Math.max(0.1, Math.min(1, currentOpacity));
        ctx.fillStyle = '#ffffff';
        ctx.beginPath();
        ctx.arc(star.x, star.y, star.radius, 0, Math.PI * 2);
        ctx.fill();

        star.x += star.vx;
        star.y += star.vy;

        if (star.x < 0) star.x = canvas.width;
        if (star.x > canvas.width) star.x = 0;
        if (star.y < 0) star.y = canvas.height;
        if (star.y > canvas.height) star.y = 0;
      });
      animationFrameId = requestAnimationFrame(animate);
    };

    initStars();
    animate();
    window.addEventListener('resize', initStars);
    return () => {
      cancelAnimationFrame(animationFrameId);
      window.removeEventListener('resize', initStars);
    };
  }, []);

  return <canvas ref={canvasRef} className="fixed inset-0 -z-20 pointer-events-none opacity-80" />;
}

// ─── CINEMATIC SHOOTING STARS ───
function ShootingStars() {
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  if (!mounted) return null;

  return (
    <div className="fixed inset-0 -z-10 pointer-events-none overflow-hidden">
      <div className="shooting-star" style={{ top: '10%', left: '-10%', animationDelay: '0s' }}></div>
      <div className="shooting-star" style={{ top: '35%', left: '-10%', animationDelay: '8s' }}></div>
      <div className="shooting-star" style={{ top: '60%', left: '-10%', animationDelay: '16s' }}></div>
    </div>
  );
}

// ─── SUBTLE NEBULA GLOWS (DARKER) ───
function NebulaBackground() {
  return (
    <div className="fixed inset-0 -z-30 pointer-events-none overflow-hidden">
      {/* Reduced opacity from /20 to /10 for a deeper, darker feel */}
      <div className="absolute top-[-20%] left-[-10%] w-[60vw] h-[60vw] rounded-full bg-blue-800/10 blur-[120px] animate-[pulse-slow_15s_ease-in-out_infinite_alternate]" />
      <div className="absolute bottom-[-20%] right-[-10%] w-[50vw] h-[50vw] rounded-full bg-indigo-800/10 blur-[120px] animate-[pulse-slow_20s_ease-in-out_infinite_alternate-reverse]" />
    </div>
  );
}

export default function Login() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    
    try {
      const { data, error: authError } = await supabase.auth.signInWithPassword({ email, password });
      
      if (authError) {
        setError(authError.message);
        setLoading(false);
      } else if (data?.session) {
        router.push('/dashboard');
      } else {
        setError("Login failed. No session returned.");
        setLoading(false);
      }
    } catch (err: any) {
      setError(err.message || "Connection failure. Check network.");
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-6 relative overflow-x-hidden font-sans">
      
      {/* ─── DEEPER, DARKER GRADIENT BACKGROUND ─── */}
      <div className="fixed inset-0 -z-50 bg-gradient-to-b from-[#020617] via-[#0f172a] to-[#1e1b4b]" />

      <style dangerouslySetInnerHTML={{__html: `
        input:-webkit-autofill,
        input:-webkit-autofill:hover, 
        input:-webkit-autofill:focus, 
        input:-webkit-autofill:active {
            -webkit-box-shadow: 0 0 0 1000px transparent inset !important;
            -webkit-text-fill-color: #ffffff !important;
            transition: background-color 5000s ease-in-out 0s !important;
            caret-color: #10b981 !important;
        }

        @keyframes pulse-slow {
          0% { transform: scale(0.9); opacity: 0.6; }
          100% { transform: scale(1.1); opacity: 1; }
        }

        .shooting-star {
          position: absolute;
          width: 4px;
          height: 4px;
          background: #ffffff;
          border-radius: 50%;
          box-shadow: 0 0 15px 3px rgba(255, 255, 255, 0.8), 0 0 30px 6px rgba(16, 185, 129, 0.4);
          animation: shoot 20s linear infinite;
          opacity: 0;
        }

        .shooting-star::after {
          content: '';
          position: absolute;
          top: 50%;
          right: 50%;
          transform: translateY(-50%);
          width: 120px;
          height: 1.5px;
          background: linear-gradient(to left, rgba(255, 255, 255, 0.6), transparent);
          border-radius: 999px;
        }

        @keyframes shoot {
          0% { transform: translate(0, 0) rotate(15deg); opacity: 0; }
          2% { opacity: 1; }
          12% { transform: translate(120vw, 35vh) rotate(15deg); opacity: 0; }
          100% { transform: translate(120vw, 35vh) rotate(15deg); opacity: 0; }
        }

        @keyframes sweep {
          0% { transform: translateX(-100%) skewX(-15deg); }
          100% { transform: translateX(200%) skewX(-15deg); }
        }

        @keyframes float-logo {
          0%, 100% { transform: translateY(0px); }
          50% { transform: translateY(-8px); }
        }
      `}} />

      <NebulaBackground />
      <AnimatedStarfield />
      <ShootingStars />

      <div className="w-full max-w-[360px] relative z-20 flex flex-col items-center backdrop-blur-2xl p-10 rounded-[2.5rem] border border-white/10 bg-[#0f172a]/50 shadow-[0_30px_80px_rgba(0,0,0,0.8)]">
        
        <div className="relative w-[90px] h-[90px] mb-4 flex items-center justify-center animate-[float-logo_6s_ease-in-out_infinite]">
          <svg viewBox="0 0 100 100" className="w-full h-full drop-shadow-[0_0_20px_rgba(16,185,129,0.5)]" xmlns="http://www.w3.org/2000/svg">
            <defs>
              <linearGradient id="bubble-grad" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#34d399" />
                <stop offset="100%" stopColor="#059669" />
              </linearGradient>
            </defs>
            <path d="M50 10 C 27.9 10 10 27.9 10 50 C 10 58.5 12.6 66.4 17.1 73 L 12 88 L 27.4 83.9 C 34.1 88.5 41.8 90 50 90 C 72.1 90 90 72.1 90 50 C 90 27.9 72.1 10 50 10 Z" fill="url(#bubble-grad)" />
            <path d="M 32 50 L 45 63 L 70 32" fill="none" stroke="#0f172a" strokeWidth="9" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </div>

        <h1 className="text-[36px] font-bold text-white tracking-tight mb-10 drop-shadow-xl font-sans">
          ChatRax
        </h1>

        {error && (
          <div className="mb-6 w-full p-3 bg-red-500/10 border border-red-500/30 rounded-xl flex items-center justify-center gap-2 text-red-400 text-[10px] font-black uppercase tracking-widest animate-pulse text-center">
            <AlertTriangle className="w-4 h-4 shrink-0" /> 
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleLogin} className="w-full space-y-6">
          <div className="relative flex items-center border-b border-[#10b981]/30 focus-within:border-[#10b981] transition-colors duration-500 pb-2 group">
            <User className="w-4 h-4 text-[#10b981]/50 group-focus-within:text-[#10b981] mr-4 shrink-0 transition-colors duration-500" strokeWidth={2.5} />
            <input type="email" name="email" value={email} onChange={(e) => setEmail(e.target.value)} required
              className="w-full bg-transparent text-white placeholder-zinc-500 text-sm focus:outline-none tracking-wide" placeholder="email address" />
          </div>

          <div className="relative flex items-center border-b border-[#10b981]/30 focus-within:border-[#10b981] transition-colors duration-500 pb-2 group">
            <Key className="w-4 h-4 text-[#10b981]/50 group-focus-within:text-[#10b981] mr-4 shrink-0 transition-colors duration-500" strokeWidth={2.5} />
            <input type="password" name="password" value={password} onChange={(e) => setPassword(e.target.value)} required
              className="w-full bg-transparent text-white placeholder-zinc-500 text-sm focus:outline-none tracking-wide" placeholder="password" />
          </div>

          <div className="pt-6">
            <button type="submit" disabled={loading}
              className="relative overflow-hidden w-full bg-[#10b981] hover:bg-[#059669] text-white font-bold text-xs tracking-widest py-4 rounded-xl shadow-[0_8px_25px_rgba(16,185,129,0.25)] transition-all duration-300 hover:shadow-[0_15px_35px_rgba(16,185,129,0.4)] hover:-translate-y-0.5 active:translate-y-1 active:scale-[0.98] disabled:opacity-50 flex items-center justify-center group"
            >
              <div className="absolute inset-0 w-[50%] h-full bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-[150%] group-hover:animate-[sweep_2s_ease-in-out_infinite]" />
              <span className="relative z-10 flex items-center gap-2 drop-shadow-md">
                {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'LOG IN'}
              </span>
            </button>
          </div>
          
          <div className="text-center pt-2">
              <button type="button" className="group relative text-[9px] font-bold uppercase tracking-[0.15em] text-zinc-500 hover:text-white transition-colors duration-500 pb-1">
                  Forgotten password?
                  <span className="absolute left-1/2 bottom-0 w-0 h-[1px] bg-[#10b981] transition-all duration-500 ease-out group-hover:w-full group-hover:left-0"></span>
              </button>
          </div>
        </form>
      </div>
    </div>
  );
}