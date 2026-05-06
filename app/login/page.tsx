"use client"

import { useState, useEffect, useRef } from 'react';
import { ShieldCheck, Eye, EyeOff, ArrowRight } from 'lucide-react';

// ─── PARTICLE BACKGROUND ───────────────────────────────
function ParticleBackground() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationId: number;
    const particles: Array<{
      x: number; y: number; size: number;
      speedX: number; speedY: number;
      opacity: number; color: string;
    }> = [];

    const colors = ['#f97316', '#a855f7', '#eab308', '#ffffff'];

    const resize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };

    const createParticles = () => {
      for (let i = 0; i < 80; i++) {
        particles.push({
          x: Math.random() * canvas.width,
          y: Math.random() * canvas.height,
          size: Math.random() * 2.5 + 0.5,
          speedX: (Math.random() - 0.5) * 0.3,
          speedY: (Math.random() - 0.5) * 0.3,
          opacity: Math.random() * 0.5 + 0.1,
          color: colors[Math.floor(Math.random() * colors.length)]
        });
      }
    };

    const draw = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      particles.forEach((p) => {
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx.fillStyle = p.color;
        ctx.globalAlpha = p.opacity;
        ctx.fill();
        ctx.globalAlpha = 1;

        p.x += p.speedX;
        p.y += p.speedY;

        if (p.x < 0) p.x = canvas.width;
        if (p.x > canvas.width) p.x = 0;
        if (p.y < 0) p.y = canvas.height;
        if (p.y > canvas.height) p.y = 0;
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
      className="fixed inset-0 pointer-events-none z-0"
    />
  );
}

// ─── LOGIN PAGE ───────────────────────────────
export default function LoginPage() {
  const [email, setEmail] = useState('shahnavi2002@gmail.com');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    // Simulate login
    await new Promise(resolve => setTimeout(resolve, 1500));
    setIsLoading(false);
    // Redirect to dashboard would happen here
    window.location.href = '/dashboard';
  };

  return (
    <div className="min-h-screen bg-[#0a0a0f] flex items-center justify-center relative overflow-hidden font-sans">
      {/* Dark base background */}
      <div className="fixed inset-0 bg-gradient-to-b from-[#0a0a0f] via-[#0f0f15] to-[#0a0a0f] z-0"></div>

      {/* Ambient glow orbs - STATIC (no flicker) */}
      <div className="fixed inset-0 pointer-events-none z-0">
        <div className="absolute top-1/4 left-1/4 w-[500px] h-[500px] rounded-full bg-orange-600/8 blur-[120px]"></div>
        <div className="absolute bottom-1/4 right-1/4 w-[400px] h-[400px] rounded-full bg-purple-600/8 blur-[100px]"></div>
      </div>

      {/* Particle animation */}
      <ParticleBackground />

      {/* Login Card */}
      <div 
        className={`relative z-10 w-full max-w-[420px] mx-4 transition-all duration-1000 ${
          isMounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
        }`}
      >
        {/* Card container - glassmorphism WITHOUT flickering sweep */}
        <div 
          className="relative rounded-3xl p-8 md:p-10 overflow-hidden"
          style={{
            background: 'rgba(15, 15, 25, 0.6)',
            backdropFilter: 'blur(40px)',
            WebkitBackdropFilter: 'blur(40px)',
            border: '1px solid rgba(255, 255, 255, 0.06)',
            boxShadow: '0 25px 80px rgba(0, 0, 0, 0.5), inset 0 1px 0 rgba(255, 255, 255, 0.05)'
          }}
        >
          {/* Subtle static gradient overlay - NO ANIMATION, NO FLICKER */}
          <div 
            className="absolute inset-0 pointer-events-none opacity-30"
            style={{
              background: 'radial-gradient(ellipse at 50% 0%, rgba(249, 115, 22, 0.08), transparent 60%)'
            }}
          ></div>

          {/* Content */}
          <div className="relative z-10">
            {/* Shield Icon */}
            <div className="flex justify-center mb-6">
              <div 
                className="w-14 h-14 rounded-2xl flex items-center justify-center"
                style={{
                  background: 'linear-gradient(135deg, #f97316, #ea580c)',
                  boxShadow: '0 8px 30px rgba(249, 115, 22, 0.3)'
                }}
              >
                <ShieldCheck className="w-7 h-7 text-white" />
              </div>
            </div>

            {/* Title */}
            <div className="text-center mb-8">
              <div className="flex items-center justify-center gap-2 mb-2">
                <h1 className="text-3xl font-bold text-white tracking-tight">Chatrax</h1>
                <span className="relative flex h-2.5 w-2.5">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-green-500"></span>
                </span>
              </div>
              <p className="text-xs text-zinc-500 uppercase tracking-[0.25em] font-medium">
                Secure Access Portal
              </p>
            </div>

            {/* Form */}
            <form onSubmit={handleSubmit} className="space-y-5">
              {/* Email Field */}
              <div className="group">
                <label className="block text-[10px] text-orange-400 uppercase tracking-[0.2em] font-semibold mb-2 ml-1">
                  Agent Identity
                </label>
                <div 
                  className="relative rounded-2xl overflow-hidden transition-all duration-300 focus-within:ring-1 focus-within:ring-orange-500/30"
                  style={{
                    background: 'rgba(10, 10, 15, 0.8)',
                    border: '1px solid rgba(255, 255, 255, 0.06)'
                  }}
                >
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full bg-transparent text-white px-5 py-4 text-sm outline-none placeholder-zinc-600"
                    placeholder="Enter your email"
                  />
                </div>
              </div>

              {/* Password Field */}
              <div className="group">
                <label className="block text-[10px] text-orange-400 uppercase tracking-[0.2em] font-semibold mb-2 ml-1">
                  Passcode
                </label>
                <div 
                  className="relative rounded-2xl overflow-hidden transition-all duration-300 focus-within:ring-1 focus-within:ring-orange-500/30"
                  style={{
                    background: 'rgba(10, 10, 15, 0.8)',
                    border: '1px solid rgba(255, 255, 255, 0.06)'
                  }}
                >
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full bg-transparent text-white px-5 py-4 text-sm outline-none placeholder-zinc-600 pr-12"
                    placeholder="Enter your passcode"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-zinc-600 hover:text-zinc-400 transition-colors"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={isLoading}
                className="w-full relative group overflow-hidden rounded-full py-4 px-6 text-white font-semibold text-sm transition-all duration-300 hover:shadow-lg active:scale-[0.98] disabled:opacity-70"
                style={{
                  background: 'linear-gradient(135deg, #f97316, #ea580c)',
                  boxShadow: '0 8px 30px rgba(249, 115, 22, 0.35)'
                }}
              >
                <span className="relative z-10 flex items-center justify-center gap-2">
                  {isLoading ? (
                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  ) : (
                    <>
                      Initialize Session
                      <ArrowRight className="w-4 h-4 transition-transform duration-300 group-hover:translate-x-1" />
                    </>
                  )}
                </span>
              </button>
            </form>

            {/* Forgot link */}
            <div className="text-center mt-6">
              <button className="text-xs text-zinc-600 hover:text-zinc-400 transition-colors">
                Forgot authorization code?
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom left logo */}
      <div className="fixed bottom-6 left-6 z-10">
        <div 
          className="w-8 h-8 rounded-lg flex items-center justify-center text-white text-xs font-bold"
          style={{
            background: 'rgba(255, 255, 255, 0.05)',
            border: '1px solid rgba(255, 255, 255, 0.08)'
          }}
        >
          N
        </div>
      </div>
    </div>
  );
}