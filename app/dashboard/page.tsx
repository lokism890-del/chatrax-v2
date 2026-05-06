"use client"

import { useEffect, useState, useRef } from 'react';
import { createClient } from '@supabase/supabase-js';
import { MessageSquare, ShieldCheck, X, Send, Phone, Clock, GripVertical, Trash2, Star, Activity, MessageCircle } from 'lucide-react';

// ─── INITIALIZE SUPABASE ───────────────────────────────
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

// ─── MINIMAL 3-COLUMN CONFIG ───────────────────────────
const COLUMN_CONFIG: Record<string, { icon: any, hex: string, twText: string, twBg: string }> = {
  'NEW': { icon: Phone, hex: '#06b6d4', twText: 'text-cyan-400', twBg: 'bg-cyan-500' },
  'ACTIVE': { icon: Activity, hex: '#a855f7', twText: 'text-purple-400', twBg: 'bg-purple-500' },
  'RESOLVED': { icon: ShieldCheck, hex: '#84cc16', twText: 'text-lime-400', twBg: 'bg-lime-500' }
};

const COLUMNS = Object.keys(COLUMN_CONFIG);

// ─── UPGRADED CYBERPUNK BACKGROUND ─────────────────────
function CyberBackground() {
  return (
    <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden bg-[#0a0a0f]">
      {/* 1. Animated Panning Circuit Board */}
      <div 
        className="absolute inset-[-50%] opacity-[0.25] animate-[pan_40s_linear_infinite]"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg width='100' height='100' viewBox='0 0 100 100' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M10 10 h 20 v 20 h -20 z M40 10 h 20 v 20 h -20 z M70 10 h 20 v 20 h -20 z M10 40 h 20 v 20 h -20 z M40 40 h 20 v 20 h -20 z M70 40 h 20 v 20 h -20 z M10 70 h 20 v 20 h -20 z M40 70 h 20 v 20 h -20 z M70 70 h 20 v 20 h -20 z' fill='none' stroke='%234f4f5a' stroke-width='1'/%3E%3Cpath d='M20 20 l 20 20 l 20 -20 M20 50 l 20 20 l 20 -20 M20 80 l 20 -20 l 20 20' fill='none' stroke='%234f4f5a' stroke-width='0.5'/%3E%3Ccircle cx='20' cy='20' r='2' fill='%234f4f5a'/%3E%3Ccircle cx='40' cy='40' r='2' fill='%234f4f5a'/%3E%3Ccircle cx='60' cy='20' r='2' fill='%234f4f5a'/%3E%3C/svg%3E")`,
          backgroundSize: '100px 100px'
        }}
      />
      
      {/* 2. Soft Vertical Scanning Line */}
      <div className="absolute inset-0 bg-[linear-gradient(to_bottom,transparent_0%,rgba(6,182,212,0.08)_50%,transparent_100%)] h-[200%] animate-[scan_10s_linear_infinite]" />

      {/* 3. Brighter Animated Deep Core Glows */}
      <div className="absolute top-[-20%] left-[-10%] w-[60vw] h-[60vw] rounded-full bg-cyan-500/15 blur-[150px] mix-blend-screen animate-[pulse_6s_ease-in-out_infinite]"></div>
      <div className="absolute bottom-[-20%] right-[-10%] w-[60vw] h-[60vw] rounded-full bg-purple-600/15 blur-[150px] mix-blend-screen animate-[pulse_8s_ease-in-out_infinite_alternate]"></div>
      <div className="absolute top-[30%] left-[40%] w-[40vw] h-[40vw] rounded-full bg-lime-500/10 blur-[130px] mix-blend-screen animate-[pulse_10s_ease-in-out_infinite_alternate]"></div>
    </div>
  );
}

// ─── MAIN DASHBOARD COMPONENT ──────────────────────────
export default function Dashboard() {
  const [isMounted, setIsMounted] = useState(false);
  const [leads, setLeads] = useState<any[]>([]);
  const [draggedLead, setDraggedLead] = useState<string | null>(null);
  
  const [selectedLead, setSelectedLead] = useState<any | null>(null);
  const [messages, setMessages] = useState<any[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  useEffect(() => {
    fetchLeads();
    const channel = supabase
      .channel('realtime-customers')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'customers' }, (payload) => setLeads((prev) => [payload.new, ...prev]))
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'customers' }, (payload) => setLeads((prev) => prev.map(lead => lead.id === payload.new.id ? payload.new : lead)))
      .on('postgres_changes', { event: 'DELETE', schema: 'public', table: 'customers' }, (payload) => setLeads((prev) => prev.filter(lead => lead.id !== payload.old.id)))
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, []);

  useEffect(() => {
    if (!selectedLead) return;
    const fetchChatHistory = async () => {
      const { data } = await supabase.from('messages').select('*').eq('customer_id', selectedLead.id).order('created_at', { ascending: true });
      if (data) setMessages(data);
    };
    fetchChatHistory();
    const messageChannel = supabase
      .channel('realtime-messages')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'messages' }, (payload) => {
        if (payload.new.customer_id === selectedLead.id) setMessages((prev) => [...prev, payload.new]);
      }).subscribe();
    return () => { supabase.removeChannel(messageChannel); };
  }, [selectedLead]);

  const fetchLeads = async () => {
    const { data } = await supabase.from('customers').select('*').order('created_at', { ascending: false });
    if (data) setLeads(data);
  };

  const handleDragStart = (e: React.DragEvent, id: string) => {
    setDraggedLead(id);
    if (e.dataTransfer) e.dataTransfer.effectAllowed = 'move';
  };
  const handleDragOver = (e: React.DragEvent) => e.preventDefault();
  
  const handleDrop = async (e: React.DragEvent, newStatus: string) => {
    e.preventDefault();
    if (!draggedLead) return;
    setLeads((prev) => prev.map(lead => lead.id === draggedLead ? { ...lead, status: newStatus } : lead));
    await supabase.from('customers').update({ status: newStatus }).eq('id', draggedLead);
    setDraggedLead(null);
  };

  const handleDelete = async (e: React.MouseEvent, id: string) => {
    e.stopPropagation(); 
    setLeads((prev) => prev.filter(lead => lead.id !== id));
    await supabase.from('customers').delete().eq('id', id);
  };

  const toggleImportant = async (e: React.MouseEvent, id: string, currentStatus: boolean) => {
    e.stopPropagation(); 
    const newStatus = !currentStatus;
    setLeads((prev) => prev.map(lead => lead.id === id ? { ...lead, is_important: newStatus } : lead));
    await supabase.from('customers').update({ is_important: newStatus }).eq('id', id);
  };

  // ─── AUTO-MOVE LOGIC ───
  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || !selectedLead) return;
    
    const messageText = newMessage;
    setNewMessage(''); 

    try {
      const { error: msgError } = await supabase.from('messages').insert({
        customer_id: selectedLead.id, content: messageText, is_outbound: true, status: 'sent'
      });
      if (msgError) throw msgError;

      let newStatus = selectedLead.status;
      if (selectedLead.status === 'NEW') {
        newStatus = 'ACTIVE';
      }

      const { error: custError } = await supabase
        .from('customers')
        .update({ last_message: `You: ${messageText}`, status: newStatus })
        .eq('id', selectedLead.id);
        
      if (!custError) {
        setLeads((prev) => prev.map(lead => 
          lead.id === selectedLead.id 
            ? { ...lead, last_message: `You: ${messageText}`, status: newStatus } 
            : lead
        ));
      }
      await fetch('/api/send', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ to: selectedLead.phone_number, message: messageText })
      });
    } catch (error: any) {
      console.error("Critical Send Error:", error.message);
    }
  };
  // ─── ONE-CLICK RESOLVE LOGIC ───
  const handleResolveChat = async (id: string) => {
    // 1. Instantly update the UI so it feels lightning fast
    setLeads((prev) => prev.map(lead => 
      lead.id === id ? { ...lead, status: 'RESOLVED' } : lead
    ));

    // 2. Slide the chat panel closed
    setSelectedLead(null);

    // 3. Update the Supabase database in the background
    try {
      await supabase
        .from('customers')
        .update({ status: 'RESOLVED' })
        .eq('id', id);
    } catch (error) {
      console.error("Failed to resolve:", error);
    }
  };
  return (
    <div className="min-h-screen bg-[#0a0a0f] text-zinc-300 p-6 md:p-10 font-sans relative overflow-x-hidden selection:bg-cyan-500/30">
      
      <CyberBackground />

      <div className="relative z-30 h-full flex flex-col max-w-[1800px] mx-auto">
        
        {/* Header */}
        <div className={`mb-10 transition-all duration-1000 transform ${isMounted ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-4'}`}>
          <h1 className="text-4xl md:text-5xl font-black tracking-tight text-white flex items-center gap-3 drop-shadow-lg">
            Chatrax
            <span className="h-3 w-3 rounded-full bg-cyan-400 shadow-[0_0_15px_rgba(34,211,238,0.8)] animate-pulse mt-2"></span>
          </h1>
          <p className="text-zinc-400 mt-2 text-sm font-medium tracking-wide drop-shadow-md">Manage and track your incoming WhatsApp conversations.</p>
        </div>

        {/* 3-COLUMN GRID */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 w-full flex-1 pb-8 items-start">
          {COLUMNS.map((status, index) => {
            const config = COLUMN_CONFIG[status];
            const ColumnIcon = config.icon;
            const colLeads = leads.filter(l => l.status === status);

            return (
              <div 
                key={status} 
                onDragOver={handleDragOver} 
                onDrop={(e) => handleDrop(e, status)}
                className={`flex flex-col gap-4 h-full relative group transition-all duration-700 ease-out transform ${isMounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-12'}`}
                style={{ transitionDelay: `${index * 150}ms` }}
              >
                {/* Column Ambient Light Pillar */}
                <div 
                  className="absolute inset-0 pointer-events-none -z-10 rounded-2xl opacity-30 transition-opacity duration-500 group-hover:opacity-60"
                  style={{
                    background: `linear-gradient(to bottom, ${config.hex}25 0%, transparent 100%)`,
                    maskImage: 'linear-gradient(to bottom, black 0%, transparent 100%)'
                  }}
                />

                {/* 1. Header Title & Badge */}
                <div className="flex items-center justify-between px-2">
                  <h2 className="text-xs font-bold tracking-[0.2em] text-white uppercase drop-shadow-[0_0_5px_rgba(255,255,255,0.5)]">{status}</h2>
                  <span className={`text-[10px] font-bold text-white ${config.twBg} bg-opacity-30 px-2.5 py-0.5 rounded-full border border-${config.hex}/50 backdrop-blur-md shadow-[0_0_12px_${config.hex}50]`}>
                    {colLeads.length}
                  </span>
                </div>

                {/* 2. Neon Glowing Header Box */}
                <div 
                  className="flex items-center justify-between p-5 rounded-2xl border-2 transition-all duration-500 relative overflow-hidden shadow-lg group-hover:-translate-y-1 group-hover:scale-[1.01]"
                  style={{
                    borderColor: `${config.hex}80`,
                    boxShadow: `inset 0 0 25px ${config.hex}25, 0 0 25px ${config.hex}40`,
                    backgroundColor: `${config.hex}10`
                  }}
                >
                  <div className="flex items-center gap-3">
                    <ColumnIcon className="w-6 h-6 animate-pulse" style={{ color: config.hex, filter: `drop-shadow(0 0 10px ${config.hex})` }} />
                  </div>
                  <span className="text-2xl font-black tracking-tighter" style={{ color: config.hex, filter: `drop-shadow(0 0 12px ${config.hex})` }}>
                    {colLeads.length}
                  </span>
                  
                  {/* Sweep Reflection */}
                  <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-[150%] group-hover:animate-[sweep_2s_ease-in-out_infinite]" />
                </div>

                {/* 3. Cards Drop Zone Area */}
                <div 
                  className={`flex flex-col gap-4 min-h-[65vh] rounded-2xl p-2 transition-all duration-300 ${draggedLead ? 'bg-white/10 border border-dashed border-white/30' : 'border border-transparent'}`}
                >
                  {colLeads.map((lead) => (
                    <div
                      key={lead.id}
                      draggable
                      onDragStart={(e) => handleDragStart(e, lead.id)}
                      onClick={() => setSelectedLead(lead)} 
                      className="group relative bg-[#121218]/95 backdrop-blur-xl border border-white/10 rounded-2xl p-5 cursor-pointer transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_12px_40px_rgba(0,0,0,0.6)] overflow-hidden"
                      style={{ hover: { borderColor: `${config.hex}60` } } as any}
                    >
                      {/* Neon Edge Strip */}
                      <div className="absolute left-0 top-0 bottom-0 w-1.5 transition-all duration-300 group-hover:w-2.5" style={{ backgroundColor: config.hex, boxShadow: `0 0 20px ${config.hex}` }} />
                      
                      {/* Gradient hover wash */}
                      <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none" style={{ background: `linear-gradient(to right, ${config.hex}15, transparent)` }} />

                      <div className="flex justify-between items-start mb-4 pl-2 relative z-10">
                        <div className="flex items-center gap-2.5">
                          <MessageCircle className="w-4 h-4 text-zinc-400 group-hover:text-white transition-colors" />
                          <span className="font-mono text-sm tracking-widest text-white font-semibold drop-shadow-md">{lead.phone_number}</span>
                          {lead.is_important && <Star className="w-3.5 h-3.5 text-amber-400 fill-amber-400 drop-shadow-[0_0_10px_rgba(251,191,36,0.8)] animate-pulse" />}
                        </div>
                        
                        <div className="flex items-center gap-3 opacity-0 group-hover:opacity-100 transition-opacity">
                          <button onClick={(e) => toggleImportant(e, lead.id, lead.is_important)} className="text-zinc-400 hover:text-amber-400 transition-colors"><Star className="w-4 h-4"/></button>
                          <button onClick={(e) => handleDelete(e, lead.id)} className="text-zinc-400 hover:text-red-500 transition-colors"><Trash2 className="w-4 h-4"/></button>
                          <GripVertical className="w-4 h-4 text-zinc-500 cursor-grab active:cursor-grabbing hover:text-white transition-colors"/>
                        </div>
                      </div>
                      
                      <div className="bg-[#08080a]/80 border border-white/5 rounded-xl p-3.5 ml-2 shadow-inner group-hover:border-white/10 transition-colors">
                        <p className="text-xs text-zinc-300 line-clamp-2 leading-relaxed font-light">
                          {lead.last_message || "No message content."}
                        </p>
                      </div>

                      <div className="mt-4 flex items-center gap-1.5 text-[10px] uppercase tracking-widest text-zinc-500 font-bold pl-2">
                        <Clock className="w-3 h-3" />
                        {new Date(lead.created_at).toLocaleDateString()}
                      </div>
                    </div>
                  ))}

                  {/* Empty state silhouette */}
                  {colLeads.length === 0 && (
                     <div className="bg-[#121218]/40 border border-white/10 rounded-2xl h-28 flex items-center justify-center pointer-events-none">
                        <div className="w-1/3 h-1.5 bg-white/10 rounded-full shadow-inner" />
                     </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* ─── SLIDE-OUT CHAT PANEL ─── */}
      {selectedLead && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-md z-40 transition-opacity duration-500" onClick={() => setSelectedLead(null)}></div>
      )}

      <div className={`fixed top-0 right-0 h-full w-full md:w-[500px] bg-[#0a0a0f]/95 backdrop-blur-3xl border-l border-white/10 z-50 transform transition-transform duration-500 cubic-bezier(0.25, 0.8, 0.25, 1) flex flex-col shadow-[0_0_50px_rgba(0,0,0,0.8)] ${selectedLead ? 'translate-x-0' : 'translate-x-full'}`}>
        {selectedLead && (
          <>
            <div className="flex items-center justify-between p-6 border-b border-white/10 bg-transparent relative overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-r from-cyan-500/10 to-transparent opacity-50"></div>
              <div className="flex items-center gap-4 relative z-10">
                <div className="w-11 h-11 rounded-full bg-gradient-to-tr from-cyan-500 to-cyan-300 flex items-center justify-center shadow-[0_0_20px_rgba(6,182,212,0.5)]">
                  <MessageSquare className="w-5 h-5 text-zinc-900 drop-shadow-sm" />
                </div>
                <div>
                  <h3 className="text-white font-mono font-bold tracking-tight text-base">{selectedLead.phone_number}</h3>
                  <p className="text-[10px] text-cyan-400 font-bold tracking-widest uppercase mt-1 flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 shadow-[0_0_8px_rgba(34,211,238,0.9)] animate-pulse"></span>
                    Encrypted Connection
                  </p>
                </div>
              </div>
            {/* NEW Action Buttons Container */}
            <div className="flex items-center gap-3 relative z-10">
                {/* Glowing Resolve Button */}
                <button 
                  onClick={() => handleResolveChat(selectedLead.id)}
                  className="group flex items-center gap-1.5 px-4 py-2 bg-lime-500/10 hover:bg-lime-500/20 text-lime-400 border border-lime-500/30 hover:border-lime-400 rounded-full transition-all duration-300 shadow-[0_0_15px_rgba(132,204,22,0.1)] hover:shadow-[0_0_20px_rgba(132,204,22,0.4)]"
                >
                  <ShieldCheck className="w-4 h-4 group-hover:scale-110 transition-transform" />
                  <span className="text-xs font-bold tracking-widest uppercase">Resolve</span>
                </button>

                {/* Close Panel Button */}
                <button 
                  onClick={() => setSelectedLead(null)} 
                  className="p-2 bg-white/5 hover:bg-red-500/20 text-zinc-400 hover:text-red-400 rounded-full transition-all duration-300"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto p-6 flex flex-col gap-6 custom-scrollbar bg-[linear-gradient(to_right,#ffffff05_1px,transparent_1px),linear-gradient(to_bottom,#ffffff05_1px,transparent_1px)] bg-[size:20px_20px]">
              {messages.length === 0 ? <div className="flex-1 flex items-center justify-center text-zinc-500 text-xs font-mono tracking-widest uppercase">No conversation history</div> :
                messages.map((msg, idx) => (
                  <div key={idx} className={`flex flex-col max-w-[85%] animate-[fade-in_0.3s_ease-out] ${msg.is_outbound ? 'self-end items-end' : 'self-start items-start'}`}>
                    <div className={`p-4 rounded-2xl text-sm leading-relaxed shadow-lg backdrop-blur-md ${msg.is_outbound ? 'bg-gradient-to-br from-cyan-600 to-cyan-700 text-white rounded-br-sm shadow-[0_8px_25px_rgba(6,182,212,0.25)] border border-cyan-300/30' : 'bg-[#18181f] border border-white/10 text-zinc-200 rounded-bl-sm shadow-[0_8px_25px_rgba(0,0,0,0.5)]'}`}>
                      {msg.content}
                    </div>
                    <span className="text-[10px] text-zinc-500 font-bold tracking-widest uppercase mt-2 px-1">
                      {new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                ))
              }
              <div ref={messagesEndRef} />
            </div>

            <div className="p-6 border-t border-white/10 bg-[#0a0a0f]/95 backdrop-blur-xl">
              <form onSubmit={handleSendMessage} className="relative flex items-center">
                <input type="text" value={newMessage} onChange={(e) => setNewMessage(e.target.value)} placeholder="Draft a secure message..." className="w-full bg-[#16161c] border border-white/10 text-white rounded-full pl-6 pr-14 py-4 text-sm font-light focus:outline-none focus:ring-1 focus:ring-cyan-500/60 focus:border-cyan-500/60 transition-all shadow-inner" />
                <button type="submit" disabled={!newMessage.trim()} className="absolute right-2 p-2.5 bg-gradient-to-r from-cyan-400 to-cyan-600 hover:from-cyan-300 hover:to-cyan-500 text-zinc-900 rounded-full transition-all disabled:opacity-50 disabled:grayscale shadow-[0_0_20px_rgba(6,182,212,0.4)] hover:shadow-[0_0_25px_rgba(6,182,212,0.6)]">
                  <Send className="w-4 h-4 ml-0.5" />
                </button>
              </form>
              <div className="text-center mt-3 text-[10px] text-zinc-500 uppercase tracking-widest font-bold">↵ Press Enter to dispatch</div>
            </div>
          </>
        )}
      </div>

      <style dangerouslySetInnerHTML={{__html: `
        @keyframes sweep {
          0% { transform: translateX(-150%); }
          50% { transform: translateX(150%); }
          100% { transform: translateX(150%); }
        }
        @keyframes fade-in {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes pan {
          0% { transform: translate(0, 0); }
          100% { transform: translate(-100px, -100px); }
        }
        @keyframes scan {
          0% { transform: translateY(-100%); }
          100% { transform: translateY(100%); }
        }
        .custom-scrollbar::-webkit-scrollbar { width: 5px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: rgba(255, 255, 255, 0.15); border-radius: 10px; }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: rgba(255, 255, 255, 0.3); }
      `}} />
    </div>
  );
}