"use client"

import { useEffect, useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '../../lib/supabase'; 
import { 
  MessageSquare, ShieldCheck, X, Send, Phone, Clock, 
  Trash2, Star, Activity, MessageCircle, 
  AlertTriangle, UserCheck, StickyNote, User, 
  Download 
} from 'lucide-react';
import { jsPDF } from "jspdf";

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
          vx: (Math.random() - 0.5) * 0.05,
          vy: (Math.random() - 0.5) * 0.05,
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

  return <canvas ref={canvasRef} className="fixed inset-0 -z-20 pointer-events-none opacity-60" />;
}

// ─── DEEPER NEBULA GLOWS ───
function NebulaBackground() {
  return (
    <div className="fixed inset-0 -z-30 pointer-events-none overflow-hidden">
      <div className="absolute top-[-20%] left-[-10%] w-[60vw] h-[60vw] rounded-full bg-blue-800/10 blur-[150px] animate-[pulse-slow_15s_ease-in-out_infinite_alternate]" />
      <div className="absolute bottom-[-20%] right-[-10%] w-[50vw] h-[50vw] rounded-full bg-indigo-900/10 blur-[150px] animate-[pulse-slow_20s_ease-in-out_infinite_alternate-reverse]" />
    </div>
  );
}

const COLUMN_CONFIG: Record<string, { icon: any, hex: string, twText: string, twBg: string }> = {
  'NEW': { icon: Phone, hex: '#06b6d4', twText: 'text-cyan-400', twBg: 'bg-cyan-500' },
  'PENDING_AGENT': { icon: AlertTriangle, hex: '#ef4444', twText: 'text-red-400', twBg: 'bg-red-500' },
  'HANDOFF': { icon: UserCheck, hex: '#eab308', twText: 'text-yellow-400', twBg: 'bg-yellow-500' },
  'ACTIVE': { icon: Activity, hex: '#a855f7', twText: 'text-purple-400', twBg: 'bg-purple-500' },
  'RESOLVED': { icon: ShieldCheck, hex: '#84cc16', twText: 'text-lime-400', twBg: 'bg-lime-500' }
};

const COLUMNS = Object.keys(COLUMN_CONFIG);

export default function Dashboard() {
  const router = useRouter();
  const [isMounted, setIsMounted] = useState(false);
  const [leads, setLeads] = useState<any[]>([]);
  const [draggedLead, setDraggedLead] = useState<string | null>(null);
  const [selectedLead, setSelectedLead] = useState<any | null>(null);
  const [messages, setMessages] = useState<any[]>([]);
  const [newMessage, setNewMessage] = useState('');
  
  const [isInternal, setIsInternal] = useState(false);
  const [editProfile, setEditProfile] = useState({ full_name: '', email: '', profile_notes: '' });

  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const checkAuth = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) router.push('/login');
    };
    checkAuth();
    setIsMounted(true);
  }, [router]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  useEffect(() => {
    fetchLeads();
    const channel = supabase.channel('realtime-customers')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'customers' }, () => fetchLeads())
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, []);

  useEffect(() => {
    if (!selectedLead) return;
    
    setEditProfile({
        full_name: selectedLead.full_name || '',
        email: selectedLead.email || '',
        profile_notes: selectedLead.profile_notes || ''
    });

    const fetchChatHistory = async () => {
      const { data } = await supabase.from('messages').select('*').eq('customer_id', selectedLead.id).order('created_at', { ascending: true });
      if (data) setMessages(data);
    };
    fetchChatHistory();

    const msgChannel = supabase.channel('realtime-messages')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'messages' }, (payload: any) => {
        if (payload.new.customer_id === selectedLead.id) setMessages((prev) => [...prev, payload.new]);
      }).subscribe();
    return () => { supabase.removeChannel(msgChannel); };
  }, [selectedLead?.id]);

  const fetchLeads = async () => {
    const { data } = await supabase.from('customers').select('*').order('created_at', { ascending: false });
    if (data) setLeads(data);
  };

  const handleUpdateProfile = async () => {
    await supabase.from('customers').update({
      full_name: editProfile.full_name,
      email: editProfile.email,
      profile_notes: editProfile.profile_notes
    }).eq('id', selectedLead.id);
    fetchLeads();
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || !selectedLead) return;
    
    const content = newMessage;
    const internalStatus = isInternal;
    setNewMessage(''); 
    setIsInternal(false);

    try {
      await supabase.from('messages').insert({
        customer_id: selectedLead.id, 
        content, 
        is_outbound: true, 
        is_internal: internalStatus,
        status: 'sent'
      });

      if (!internalStatus) {
        await fetch('/api/send', {
          method: 'POST', headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ to: selectedLead.phone_number, message: content })
        });
      }
    } catch (err) { console.error(err); }
  };

  const handleDeleteMemo = async (memoId: string) => {
    try {
      await supabase.from('messages').delete().eq('id', memoId);
      setMessages(prev => prev.filter(m => m.id !== memoId));
    } catch (err) { console.error("Error deleting memo:", err); }
  };

  const handleDragStart = (e: React.DragEvent, id: string) => { setDraggedLead(id); };
  const handleDragOver = (e: React.DragEvent) => e.preventDefault();
  
  const handleDrop = async (e: React.DragEvent, newStatus: string) => {
    e.preventDefault();
    if (!draggedLead) return;
    const currentDraggedId = draggedLead;
    setLeads(prevLeads => prevLeads.map(lead => lead.id === currentDraggedId ? { ...lead, status: newStatus } : lead));
    setDraggedLead(null);
    try {
      const { error } = await supabase.from('customers').update({ status: newStatus }).eq('id', currentDraggedId);
      if (error) { console.error("Sync error.", error); fetchLeads(); }
    } catch (err) { console.error("Sync failed:", err); fetchLeads(); }
  };

  const handleTakeOver = async (id: string) => { await supabase.from('customers').update({ status: 'HANDOFF' }).eq('id', id); };
  const handleResolveChat = async (id: string) => { await supabase.from('customers').update({ status: 'RESOLVED' }).eq('id', id); setSelectedLead(null); };

  const handleExportPDF = () => {
    if (!selectedLead) return;
    const doc = new jsPDF();
    const name = selectedLead.full_name || selectedLead.phone_number;
    
    doc.setFontSize(20); doc.setTextColor(6, 182, 212); doc.text("Chatrax Pro Intelligence Report", 20, 20);
    doc.setFontSize(10); doc.setTextColor(100); doc.text(`Subject: ${name}`, 20, 30); doc.text(`Generated: ${new Date().toLocaleString()}`, 20, 35); doc.line(20, 40, 190, 40);
    doc.setFontSize(12); doc.setTextColor(0); doc.text("Identity Profile", 20, 50);
    doc.setFontSize(10); doc.text(`Full Name: ${selectedLead.full_name || 'N/A'}`, 20, 60); doc.text(`Phone: ${selectedLead.phone_number}`, 20, 65); doc.text(`Email Hash: ${selectedLead.email || 'N/A'}`, 20, 70); doc.text("Notes:", 20, 80);
    const splitNotes = doc.splitTextToSize(selectedLead.profile_notes || "No notes provided.", 160); doc.text(splitNotes, 20, 85);
    let yPos = 110; doc.setFontSize(12); doc.text("Communication Log", 20, yPos); yPos += 10;
    messages.forEach((msg) => {
      if (yPos > 270) { doc.addPage(); yPos = 20; }
      const type = msg.is_internal ? "[INTERNAL MEMO]" : (msg.is_outbound ? "[AGENT]" : "[CUSTOMER]");
      doc.setFontSize(8); doc.setTextColor(150); doc.text(`${new Date(msg.created_at).toLocaleString()} - ${type}`, 20, yPos); yPos += 5;
      doc.setFontSize(10); doc.setTextColor(msg.is_internal ? 180 : 0); 
      const splitMsg = doc.splitTextToSize(msg.content, 160); doc.text(splitMsg, 20, yPos); yPos += (splitMsg.length * 5) + 5;
    });
    doc.save(`Chatrax_Report_${name.replace(/\s+/g, '_')}.pdf`);
  };

  const chatMessages = messages.filter(m => !m.is_internal);
  const internalMemos = messages.filter(m => m.is_internal);

  return (
    <div className="min-h-screen text-zinc-200 p-6 md:p-10 font-sans relative overflow-x-hidden selection:bg-cyan-500/30">
      
      {/* ─── DEEPER BACKGROUND GRADIENT ─── */}
      <div className="fixed inset-0 -z-50 bg-gradient-to-br from-[#020617] via-[#0a0f24] to-[#161233]" />

      <style dangerouslySetInnerHTML={{__html: `
        @keyframes pulse-slow {
          0%, 100% { opacity: 0.3; transform: scale(1); }
          50% { opacity: 0.6; transform: scale(1.05); }
        }
        @keyframes sweep {
          0% { transform: translateX(-100%) skewX(-15deg); }
          100% { transform: translateX(200%) skewX(-15deg); }
        }
        @keyframes fade-in { 
          from { opacity: 0; transform: translateY(10px); } 
          to { opacity: 1; transform: translateY(0); } 
        }
        .custom-scrollbar::-webkit-scrollbar { width: 5px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: rgba(255, 255, 255, 0.2); border-radius: 10px; }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: rgba(255, 255, 255, 0.4); }
      `}} />

      <NebulaBackground />
      <AnimatedStarfield />

      <div className="relative z-30 h-full flex flex-col max-w-[1800px] mx-auto">
        <div className={`mb-10 transition-all duration-1000 transform ${isMounted ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-4'}`}>
          <h1 className="text-4xl md:text-5xl font-black tracking-tight text-white flex items-center gap-3 drop-shadow-[0_0_15px_rgba(255,255,255,0.1)]">
            ChatRax <span className="text-cyan-400 drop-shadow-[0_0_10px_rgba(34,211,238,0.5)]">Pro</span>
            <span className="h-3 w-3 rounded-full bg-cyan-400 shadow-[0_0_15px_rgba(34,211,238,0.8)] animate-pulse mt-2 inline-block"></span>
          </h1>
          <p className="text-zinc-400 mt-2 text-sm font-medium tracking-wide drop-shadow-md">Enterprise Intelligence & Action Command</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-6 w-full flex-1 pb-8 items-start">
          {COLUMNS.map((status, index) => {
            const config = COLUMN_CONFIG[status];
            const ColumnIcon = config.icon;
            const colLeads = leads.filter(l => l.status === status);

            return (
              <div 
                key={status} onDragOver={handleDragOver} onDrop={(e) => handleDrop(e, status)}
                className={`flex flex-col gap-4 h-full relative group transition-all duration-700 ease-out transform ${isMounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-12'}`}
                style={{ transitionDelay: `${index * 100}ms` }}
              >
                <div className="flex items-center justify-between px-2">
                  <h2 className="text-xs font-bold tracking-[0.15em] text-white uppercase drop-shadow-md">{status.replace('_', ' ')}</h2>
                  <span className={`text-[10px] font-bold text-white ${config.twBg} bg-opacity-30 px-2.5 py-0.5 rounded-full border border-${config.hex}/50 backdrop-blur-md shadow-[0_0_12px_${config.hex}50]`}>
                    {colLeads.length}
                  </span>
                </div>

                <div className="flex items-center justify-between p-5 rounded-2xl border transition-all duration-500 relative overflow-hidden shadow-lg group-hover:-translate-y-1 group-hover:scale-[1.02] backdrop-blur-md"
                  style={{ borderColor: `${config.hex}60`, boxShadow: `0 8px 32px 0 rgba(0, 0, 0, 0.3), inset 0 0 20px ${config.hex}15`, backgroundColor: `rgba(15, 23, 42, 0.4)` }}>
                  <div className="flex items-center gap-3">
                    <ColumnIcon className="w-6 h-6 animate-pulse" style={{ color: config.hex, filter: `drop-shadow(0 0 10px ${config.hex})` }} />
                  </div>
                  <span className="text-2xl font-black tracking-tighter transition-transform duration-300 group-hover:scale-110" style={{ color: config.hex, filter: `drop-shadow(0 0 12px ${config.hex})` }}>
                    {colLeads.length}
                  </span>
                </div>

                <div className={`flex flex-col gap-4 min-h-[65vh] rounded-2xl p-2 transition-all duration-300 ${draggedLead ? 'bg-white/5 border border-dashed border-white/30 backdrop-blur-sm' : 'border border-transparent'}`}>
                  {colLeads.map((lead) => (
                    <div key={lead.id} draggable onDragStart={(e) => handleDragStart(e, lead.id)} onClick={() => setSelectedLead(lead)} 
                      className={`group/card relative bg-[#0f172a]/60 backdrop-blur-xl border border-white/10 rounded-2xl p-5 cursor-pointer transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_15px_40px_rgba(0,0,0,0.5)] hover:border-white/20 overflow-hidden`}>
                      <div className={`absolute left-0 top-0 bottom-0 w-1.5 transition-all duration-300 group-hover/card:w-2.5`} style={{ backgroundColor: config.hex, boxShadow: `0 0 20px ${config.hex}` }} />
                      <div className="absolute inset-0 opacity-0 group-hover/card:opacity-100 transition-opacity duration-500 pointer-events-none" style={{ background: `linear-gradient(to right, ${config.hex}15, transparent)` }} />

                      <div className="flex justify-between items-start mb-4 pl-2 relative z-10">
                        <div className="flex items-center gap-2.5">
                          <MessageCircle className="w-4 h-4 text-zinc-400 group-hover/card:text-white transition-colors duration-300" />
                          <span className="font-sans text-sm tracking-wide text-white font-bold drop-shadow-md line-clamp-1">{lead.full_name || lead.phone_number}</span>
                        </div>
                      </div>
                      
                      <div className="bg-black/30 border border-white/5 rounded-xl p-3.5 ml-2 shadow-inner group-hover/card:border-white/10 transition-colors duration-300">
                        <p className="text-xs text-zinc-300 line-clamp-2 leading-relaxed font-medium">{lead.last_message || "No message content."}</p>
                      </div>

                      <div className="mt-4 flex items-center justify-between text-[10px] uppercase tracking-widest text-zinc-500 font-bold pl-2">
                        <div className="flex items-center gap-1.5"><Clock className="w-3 h-3" />{new Date(lead.created_at).toLocaleDateString()}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* ─── SLIDE-OUT PRO PANEL ─── */}
      <div className={`fixed top-0 right-0 h-full w-full md:w-[850px] bg-[#050b18]/95 backdrop-blur-3xl border-l border-white/10 z-50 transform transition-transform duration-500 flex flex-row shadow-[base_0_0_50px_rgba(0,0,0,0.8)] ${selectedLead ? 'translate-x-0' : 'translate-x-full'}`}>
        {selectedLead && (
          <>
            <div className="flex-1 flex flex-col border-r border-white/5 overflow-hidden">
                <div className="flex items-center justify-between p-6 border-b border-white/10 shrink-0 relative overflow-hidden bg-white/5">
                    <div className="absolute inset-0 bg-gradient-to-r from-cyan-500/10 to-transparent opacity-50"></div>
                    <div className="flex items-center gap-4 relative z-10">
                        <div className="w-11 h-11 rounded-full bg-gradient-to-tr from-cyan-500 to-blue-500 flex items-center justify-center shadow-[0_0_20px_rgba(6,182,212,0.4)] text-white"><MessageSquare className="w-5 h-5"/></div>
                        <div>
                            <h3 className="text-white font-bold text-lg">{selectedLead.full_name || selectedLead.phone_number}</h3>
                            <p className="text-[10px] text-cyan-400 font-bold tracking-widest uppercase mt-0.5 flex items-center gap-1.5">
                                <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 shadow-[0_0_8px_rgba(34,211,238,0.9)] animate-pulse"></span>
                                Encrypted Connection
                            </p>
                        </div>
                    </div>
                    
                    <div className="flex items-center gap-3 relative z-10">
                        {selectedLead.status === 'PENDING_AGENT' && 
                          <button onClick={() => handleTakeOver(selectedLead.id)} className="px-4 py-2 bg-red-500/20 text-red-300 border border-red-500/40 hover:border-red-400 hover:bg-red-500/30 rounded-full text-[10px] font-bold uppercase transition-all duration-300 shadow-[0_0_15px_rgba(239,68,68,0.2)] hover:shadow-[0_0_20px_rgba(239,68,68,0.4)] hover:scale-105 active:scale-95">Take Over</button>
                        }
                        <button onClick={() => handleResolveChat(selectedLead.id)} className="px-4 py-2 bg-lime-500/20 text-lime-300 border border-lime-500/40 hover:border-lime-400 hover:bg-lime-500/30 rounded-full text-[10px] font-bold uppercase transition-all duration-300 shadow-[0_0_15px_rgba(132,204,22,0.2)] hover:shadow-[0_0_20px_rgba(132,204,22,0.4)] hover:scale-105 active:scale-95">Resolve</button>
                        <button onClick={() => setSelectedLead(null)} className="p-2 hover:bg-white/10 hover:rotate-90 rounded-full text-zinc-300 transition-all duration-300"><X className="w-5 h-5"/></button>
                    </div>
                </div>

                <div className="flex-1 overflow-y-auto p-6 flex flex-col gap-6 custom-scrollbar bg-black/20">
                    {chatMessages.length === 0 ? <div className="flex-1 flex items-center justify-center text-zinc-500 text-xs font-sans tracking-widest uppercase">No customer conversation history</div> :
                        chatMessages.map((msg, i) => (
                        <div key={i} className={`flex flex-col max-w-[85%] animate-[fade-in_0.3s_ease-out] ${msg.is_outbound ? 'self-end items-end' : 'self-start items-start'}`}>
                            <div className={`p-4 rounded-2xl text-sm leading-relaxed shadow-xl backdrop-blur-md ${msg.is_outbound ? 'bg-gradient-to-br from-cyan-600 to-blue-600 text-white rounded-br-sm shadow-[0_8px_25px_rgba(6,182,212,0.3)] border border-cyan-400/30' : 'bg-[#1e293b]/80 border border-white/10 text-zinc-100 rounded-bl-sm shadow-[0_8px_25px_rgba(0,0,0,0.3)]'}`}>
                                {msg.content}
                            </div>
                            <span className="text-[10px] text-zinc-500 font-bold tracking-widest uppercase mt-2 px-1">{new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                        </div>
                    ))}
                    <div ref={messagesEndRef} />
                </div>

                <div className="p-6 border-t border-white/10 bg-[#030712]/60 backdrop-blur-xl shrink-0">
                    <div className="flex gap-2 mb-3">
                        <button type="button" onClick={() => setIsInternal(!isInternal)} className={`text-[10px] font-bold px-4 py-1.5 rounded-full border transition-all duration-300 hover:scale-105 active:scale-95 ${isInternal ? 'bg-amber-500 text-black border-amber-500 shadow-[0_0_15px_rgba(245,158,11,0.5)]' : 'text-zinc-500 border-white/20 hover:text-amber-400 hover:border-amber-400/50 hover:bg-amber-500/10'}`}>Internal Note</button>
                    </div>
                    <form onSubmit={handleSendMessage} className="relative flex items-center group/form">
                        <input type="text" value={newMessage} onChange={(e) => setNewMessage(e.target.value)} placeholder={isInternal ? "Add a private team memo..." : "Draft a secure message..."} 
                            className={`w-full bg-black/40 border rounded-full pl-6 pr-14 py-4 text-sm focus:outline-none text-white transition-all duration-300 shadow-inner ${isInternal ? 'border-amber-500/50 focus:ring-1 focus:ring-amber-500/80 placeholder-amber-500/50' : 'border-white/20 focus:ring-1 focus:ring-cyan-500/80 focus:border-cyan-500/80 placeholder-zinc-500'}`} />
                        <button type="submit" disabled={!newMessage.trim()} className={`absolute right-2 p-3 rounded-full transition-all duration-300 disabled:opacity-50 disabled:grayscale disabled:scale-100 hover:scale-110 active:scale-90 ${isInternal ? 'bg-amber-500 text-black shadow-[0_0_15px_rgba(245,158,11,0.5)] hover:bg-amber-400' : 'bg-gradient-to-r from-cyan-400 to-blue-500 hover:from-cyan-300 hover:to-blue-400 text-white shadow-[0_0_20px_rgba(6,182,212,0.5)]'}`}><Send className="w-4 h-4 ml-0.5"/></button>
                    </form>
                </div>
            </div>

            <div className="w-[350px] bg-[#020617]/80 backdrop-blur-xl border-l border-white/5 p-8 flex flex-col gap-8 overflow-hidden shadow-inner">
                <div className="shrink-0">
                    <h4 className="text-[10px] font-black text-white uppercase tracking-widest mb-5 flex items-center gap-2 drop-shadow-md"><User className="w-4 h-4 text-cyan-400"/> Identity Profile</h4>
                    <div className="space-y-4">
                        <div className="space-y-1.5">
                            <label className="text-[9px] font-bold text-cyan-400 uppercase tracking-widest ml-1">Assigned Name</label>
                            <input value={editProfile.full_name} onChange={(e) => setEditProfile({...editProfile, full_name: e.target.value})} onBlur={handleUpdateProfile} className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-xs text-white focus:border-cyan-400 focus:bg-white/10 outline-none transition-all duration-300" placeholder="Enter Full Name" />
                        </div>
                        <div className="space-y-1.5">
                            <label className="text-[9px] font-bold text-cyan-400 uppercase tracking-widest ml-1">Email Hash</label>
                            <input value={editProfile.email} onChange={(e) => setEditProfile({...editProfile, email: e.target.value})} onBlur={handleUpdateProfile} className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-xs text-white focus:border-cyan-400 focus:bg-white/10 outline-none transition-all duration-300" placeholder="email@client.com" />
                        </div>
                        <div className="space-y-1.5">
                            <label className="text-[9px] font-bold text-cyan-400 uppercase tracking-widest ml-1">Deep Notes</label>
                            <textarea rows={3} value={editProfile.profile_notes} onChange={(e) => setEditProfile({...editProfile, profile_notes: e.target.value})} onBlur={handleUpdateProfile} className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-xs text-white focus:border-cyan-400 focus:bg-white/10 outline-none resize-none transition-all duration-300 custom-scrollbar" placeholder="Private notes for team visibility..." />
                        </div>
                    </div>
                </div>

                <div className="flex-1 flex flex-col min-h-0 border-t border-white/10 pt-6">
                    <h4 className="text-[10px] font-black text-amber-400 uppercase tracking-widest mb-4 flex items-center gap-2 drop-shadow-md"><StickyNote className="w-4 h-4"/> Internal Memos</h4>
                    <div className="flex-1 overflow-y-auto custom-scrollbar pr-2 space-y-3 pb-2">
                        {internalMemos.length === 0 ? (
                            <div className="p-4 border border-white/10 rounded-xl bg-white/5 text-center transition-all"><p className="text-[10px] text-zinc-500 uppercase tracking-widest font-bold">No internal memos</p></div>
                        ) : (
                            internalMemos.map((memo, i) => (
                                <div key={memo.id} className="group relative bg-amber-500/10 border border-amber-500/30 hover:border-amber-500/50 hover:bg-amber-500/20 rounded-xl p-3 shadow-lg backdrop-blur-sm transition-all duration-300 hover:-translate-y-0.5">
                                    <button onClick={() => handleDeleteMemo(memo.id)} className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 p-1.5 hover:bg-red-500/30 rounded-lg transition-all duration-300 text-amber-300 hover:text-red-300 hover:scale-110 active:scale-90"><Trash2 className="w-3.5 h-3.5" /></button>
                                    <p className="text-xs text-amber-100 leading-relaxed mb-2 pr-6 font-medium">{memo.content}</p>
                                    <span className="text-[9px] text-amber-400/70 font-bold uppercase tracking-widest block text-right">{new Date(memo.created_at).toLocaleString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}</span>
                                </div>
                            ))
                        )}
                    </div>
                </div>

                <div className="mt-auto shrink-0 pt-6 border-t border-white/10">
                    <button type="button" onClick={handleExportPDF} className="group relative overflow-hidden w-full flex items-center justify-center gap-2 py-4 bg-white/5 hover:bg-cyan-500/20 border border-white/10 hover:border-cyan-400/50 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all duration-300 text-zinc-300 hover:text-white hover:shadow-[0_8px_25px_rgba(6,182,212,0.3)] hover:-translate-y-1 active:translate-y-0 active:scale-95">
                        <div className="absolute inset-0 w-[50%] h-full bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-[150%] group-hover:animate-[sweep_1.5s_ease-in-out_infinite]" />
                        <Download className="w-4 h-4 relative z-10 transition-transform duration-300 group-hover:-translate-y-1"/> <span className="relative z-10">Export Intelligence (PDF)</span>
                    </button>
                </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}