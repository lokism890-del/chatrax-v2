"use client"

import React, { useEffect, useState, useRef, useCallback, useMemo, memo } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '../../lib/supabase'; 
import { 
  MessageSquare, ShieldCheck, X, Send, Clock, Trash2, Activity, MessageCircle, UserCheck, 
  ShoppingBag, Loader2, LayoutDashboard, Settings, Search, Star, Zap, Megaphone, AlertTriangle, 
  List, ShieldAlert, Sparkles, Tag, User, FileText, CreditCard, Download, LayoutTemplate, 
  BarChart2, LogOut, Check, Copy, Edit2, CheckCheck, Users, Target, PieChart, TrendingDown, 
  TrendingUp, Bell, Globe, Lock, UploadCloud, Shield, MousePointerClick, StickyNote, Link, Calendar, Eye
} from 'lucide-react';
import { jsPDF } from "jspdf";

// ─── STRICT TYPESCRIPT DEFINITION ───
type ThemeColor = { text: string; bg: string; bgSubtle: string; border: string; borderActive: string; focusBorder: string; hoverBg: string; gradient: string; hoverGradient: string; shadow: string; };

// ─── STATIC CONFIGURATIONS (With New Soothing Themes) ───
const BRAND_COLORS: Record<string, ThemeColor> = {
  emerald: { text: 'text-emerald-400', bg: 'bg-emerald-500', bgSubtle: 'bg-emerald-500/10', border: 'border-emerald-500/20', borderActive: 'border-emerald-500/40', focusBorder: 'focus:border-emerald-500/50', hoverBg: 'hover:bg-emerald-500/20', gradient: 'from-emerald-500 to-teal-500', hoverGradient: 'hover:from-emerald-400 hover:to-teal-400', shadow: 'shadow-[0_0_15px_rgba(16,185,129,0.1)]' },
  blue: { text: 'text-blue-400', bg: 'bg-blue-500', bgSubtle: 'bg-blue-500/10', border: 'border-blue-500/20', borderActive: 'border-blue-500/40', focusBorder: 'focus:border-blue-500/50', hoverBg: 'hover:bg-blue-500/20', gradient: 'from-blue-500 to-indigo-500', hoverGradient: 'hover:from-blue-400 hover:to-indigo-400', shadow: 'shadow-[0_0_15px_rgba(59,130,246,0.1)]' },
  purple: { text: 'text-purple-400', bg: 'bg-purple-500', bgSubtle: 'bg-purple-500/10', border: 'border-purple-500/20', borderActive: 'border-purple-500/40', focusBorder: 'focus:border-purple-500/50', hoverBg: 'hover:bg-purple-500/20', gradient: 'from-purple-500 to-fuchsia-500', hoverGradient: 'hover:from-purple-400 hover:to-fuchsia-400', shadow: 'shadow-[0_0_15px_rgba(168,85,247,0.1)]' },
  rose: { text: 'text-rose-400', bg: 'bg-rose-500', bgSubtle: 'bg-rose-500/10', border: 'border-rose-500/20', borderActive: 'border-rose-500/40', focusBorder: 'focus:border-rose-500/50', hoverBg: 'hover:bg-rose-500/20', gradient: 'from-rose-500 to-pink-500', hoverGradient: 'hover:from-rose-400 hover:to-pink-400', shadow: 'shadow-[0_0_15px_rgba(244,63,94,0.1)]' },
  amber: { text: 'text-amber-400', bg: 'bg-amber-500', bgSubtle: 'bg-amber-500/10', border: 'border-amber-500/20', borderActive: 'border-amber-500/40', focusBorder: 'focus:border-amber-500/50', hoverBg: 'hover:bg-amber-500/20', gradient: 'from-amber-500 to-orange-500', hoverGradient: 'hover:from-amber-400 hover:to-orange-400', shadow: 'shadow-[0_0_15px_rgba(245,158,11,0.1)]' },
  // ✨ NEW SOOTHING THEMES ADDED BELOW ✨
  teal: { text: 'text-teal-400', bg: 'bg-teal-500', bgSubtle: 'bg-teal-500/10', border: 'border-teal-500/20', borderActive: 'border-teal-500/40', focusBorder: 'focus:border-teal-500/50', hoverBg: 'hover:bg-teal-500/20', gradient: 'from-teal-500 to-emerald-400', hoverGradient: 'hover:from-teal-400 hover:to-emerald-300', shadow: 'shadow-[0_0_15px_rgba(20,184,166,0.1)]' },
  cyan: { text: 'text-cyan-400', bg: 'bg-cyan-500', bgSubtle: 'bg-cyan-500/10', border: 'border-cyan-500/20', borderActive: 'border-cyan-500/40', focusBorder: 'focus:border-cyan-500/50', hoverBg: 'hover:bg-cyan-500/20', gradient: 'from-cyan-500 to-sky-400', hoverGradient: 'hover:from-cyan-400 hover:to-sky-300', shadow: 'shadow-[0_0_15px_rgba(6,182,212,0.1)]' },
  indigo: { text: 'text-indigo-400', bg: 'bg-indigo-500', bgSubtle: 'bg-indigo-500/10', border: 'border-indigo-500/20', borderActive: 'border-indigo-500/40', focusBorder: 'focus:border-indigo-500/50', hoverBg: 'hover:bg-indigo-500/20', gradient: 'from-indigo-500 to-violet-500', hoverGradient: 'hover:from-indigo-400 hover:to-violet-400', shadow: 'shadow-[0_0_15px_rgba(99,102,241,0.1)]' },
  slate: { text: 'text-slate-300', bg: 'bg-slate-500', bgSubtle: 'bg-slate-500/10', border: 'border-slate-500/20', borderActive: 'border-slate-500/40', focusBorder: 'focus:border-slate-500/50', hoverBg: 'hover:bg-slate-500/20', gradient: 'from-slate-500 to-gray-500', hoverGradient: 'hover:from-slate-400 hover:to-gray-400', shadow: 'shadow-[0_0_15px_rgba(100,116,139,0.1)]' }
};

const AVAILABLE_TAGS = [
  { id: 'vip', label: 'VIP', color: 'bg-red-500/10 text-red-400 border-red-500/20' },
  { id: 'refund', label: 'Refund', color: 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20' },
  { id: 'wholesale', label: 'Wholesale', color: 'bg-purple-500/10 text-purple-400 border-purple-500/20' },
  { id: 'urgent', label: 'Urgent', color: 'bg-orange-500/10 text-orange-400 border-orange-500/20' }
];

const COLUMN_CONFIG: Record<string, { icon: any, hex: string }> = {
  'NEW_ORDER': { icon: ShoppingBag, hex: '#10b981' },
  'HANDOFF': { icon: UserCheck, hex: '#eab308' },
  'ACTIVE': { icon: Activity, hex: '#0ea5e9' },
  'RESOLVED': { icon: ShieldCheck, hex: '#84cc16' }
};
const COLUMNS = Object.keys(COLUMN_CONFIG);

// ─── BACKGROUND COMPONENTS ───
function AnimatedStarfield() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    const canvas = canvasRef.current; if (!canvas) return; const ctx = canvas.getContext('2d'); if (!ctx) return;
    let animationFrameId: number; const stars: any[] = [];
    const initStars = () => {
      canvas.width = window.innerWidth; canvas.height = window.innerHeight; stars.length = 0; 
      for (let i = 0; i < Math.floor((canvas.width * canvas.height) / 1000); i++) {
        stars.push({ x: Math.random() * canvas.width, y: Math.random() * canvas.height, radius: Math.random() * 1.2 + 0.2, vx: (Math.random() - 0.5) * 0.05, vy: (Math.random() - 0.5) * 0.05, baseOpacity: Math.random() * 0.5 + 0.2, angle: Math.random() * Math.PI * 2, twinkleSpeed: Math.random() * 0.01 + 0.005 });
      }
    };
    const animate = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      stars.forEach((star) => {
        star.angle += star.twinkleSpeed; const currentOpacity = star.baseOpacity + Math.sin(star.angle) * 0.3;
        ctx.globalAlpha = Math.max(0.1, Math.min(1, currentOpacity)); ctx.fillStyle = '#ffffff'; ctx.beginPath(); ctx.arc(star.x, star.y, star.radius, 0, Math.PI * 2); ctx.fill();
        star.x += star.vx; star.y += star.vy;
        if (star.x < 0) star.x = canvas.width; if (star.x > canvas.width) star.x = 0;
        if (star.y < 0) star.y = canvas.height; if (star.y > canvas.height) star.y = 0;
      });
      animationFrameId = requestAnimationFrame(animate);
    };
    initStars(); animate(); window.addEventListener('resize', initStars);
    return () => { cancelAnimationFrame(animationFrameId); window.removeEventListener('resize', initStars); };
  }, []);
  return <canvas ref={canvasRef} className="fixed inset-0 -z-20 pointer-events-none opacity-40" />;
}

function NebulaBackground() {
  return (
    <div className="fixed inset-0 -z-30 pointer-events-none overflow-hidden">
      <div className="absolute top-[-20%] left-[-10%] w-[60vw] h-[60vw] rounded-full bg-blue-500/10 blur-[150px] animate-[pulse_15s_ease-in-out_infinite_alternate]" />
      <div className="absolute bottom-[-20%] right-[-10%] w-[50vw] h-[50vw] rounded-full bg-emerald-500/10 blur-[150px] animate-[pulse_20s_ease-in-out_infinite_alternate-reverse]" />
    </div>
  );
}

// ─── HIGH-PERFORMANCE MEMOIZED CARD COMPONENT ───
const LeadCard = memo(({ lead, config, isSlaBreached, isDragging, isStarred, viewers, onDragStart, onDragEnd, onClick, onToggleStar, userRole, onDeleteLead, activeTheme }: any) => {
  return (
    <div draggable onDragStart={(e) => onDragStart(e, lead.id)} onDragEnd={onDragEnd} onClick={() => onClick(lead)} style={{ contentVisibility: 'auto', containIntrinsicSize: '120px' }}
      className={`p-3.5 bg-[#1F2937]/80 backdrop-blur-md rounded-xl border border-white/5 transition-all duration-300 cursor-grab hover:-translate-y-1 hover:shadow-[0_10px_20px_rgba(0,0,0,0.5)] relative overflow-hidden group ${isDragging ? 'opacity-40 border-dashed border-zinc-500' : ''} ${isSlaBreached ? 'ring-1 ring-red-500/80 shadow-[0_0_15px_rgba(239,68,68,0.3)] animate-[pulse_2s_ease-in-out_infinite]' : ''}`}>
      <div className={`absolute left-0 top-0 bottom-0 w-1 transition-all duration-300 group-hover:w-1.5`} style={{ backgroundColor: config.hex, boxShadow: `0 0 10px ${config.hex}` }} />
      {viewers && viewers.length > 0 && <div className="absolute top-0 right-0 bg-sky-500/20 backdrop-blur-md border-b border-l border-sky-500/30 px-1.5 py-0.5 rounded-bl-lg z-30 flex items-center gap-1 shadow-sm"><Eye className="w-2.5 h-2.5 text-sky-400 animate-pulse" /><span className="text-[8px] font-bold text-sky-400 tracking-wider uppercase">{viewers[0]}</span></div>}
      {lead.tags && lead.tags.length > 0 && <div className="flex flex-wrap gap-1 mb-2 ml-1">{lead.tags.map((tagId: string) => { const tagMeta = AVAILABLE_TAGS.find(t => t.id === tagId); return tagMeta ? <span key={tagId} className={`text-[8px] font-bold uppercase tracking-widest px-1.5 py-[2px] rounded border ${tagMeta.color}`}>{tagMeta.label}</span> : null; })}</div>}
      <div className="flex justify-between items-start mb-0.5 pl-1 pr-8 relative z-10"><span className="font-sans text-sm font-semibold text-white drop-shadow-sm truncate">{lead.full_name || 'Store Customer'}</span>{isSlaBreached && <AlertTriangle className="w-3.5 h-3.5 text-red-400 shrink-0 ml-2" />}</div>
      <span className={`text-[9px] ${activeTheme.text} font-bold tracking-widest drop-shadow-md pl-1`}>+{lead.phone_number}</span>
      <div className="absolute top-2.5 right-2.5 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity z-20">
         <button onClick={(e) => onToggleStar(e, lead.id)} className="p-1 bg-[#111827]/60 hover:bg-[#1F2937] rounded transition-colors text-zinc-400 hover:text-amber-400 border border-white/5"><Star className={`w-3 h-3 ${isStarred ? 'fill-amber-400 text-amber-400' : ''}`} /></button>
         {userRole === 'ADMIN' && <button onClick={(e) => onDeleteLead(e, lead.id, lead.full_name || lead.phone_number)} className="p-1 bg-[#111827]/60 hover:bg-red-500/20 rounded transition-colors text-zinc-400 hover:text-red-400 border border-white/5"><Trash2 className="w-3 h-3" /></button>}
      </div>
    </div>
  );
}, (prev, next) => prev.lead === next.lead && prev.isDragging === next.isDragging && prev.isSlaBreached === next.isSlaBreached && prev.isStarred === next.isStarred && prev.viewers?.length === next.viewers?.length);
LeadCard.displayName = "LeadCard";

// ─── MAIN APP COMPONENT ───
export default function Dashboard() {
  const router = useRouter();
  const [isMounted, setIsMounted] = useState(false);
  const [activeView, setActiveView] = useState<'dashboard' | 'conversations' | 'templates' | 'campaigns' | 'analytics' | 'billing' | 'settings'>('dashboard');

  // ─── STATE ───
  const [theme, setTheme] = useState('nebula'); 
  const [userRole, setUserRole] = useState<'ADMIN' | 'AGENT'>('ADMIN');
  const [globalSearch, setGlobalSearch] = useState('');
  const [leads, setLeads] = useState<any[]>([]);
  const [totalSent, setTotalSent] = useState(0);
  const [totalReceived, setTotalReceived] = useState(0);
  const [draggedLead, setDraggedLead] = useState<string | null>(null);
  const [selectedLead, setSelectedLead] = useState<any | null>(null);
  const [messages, setMessages] = useState<any[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [isInternal, setIsInternal] = useState(false);
  const [editProfile, setEditProfile] = useState({ full_name: '', email: '', profile_notes: '' });
  const [shopifyData, setShopifyData] = useState<any | null>(null);
  const [loadingShopify, setLoadingShopify] = useState(false);
  const [starredLeads, setStarredLeads] = useState<Set<string>>(new Set());

  const [settings, setSettings] = useState({
    metaToken: '', metaPhoneId: '', shopifyDomain: '', adminName: 'Nasir Ahmed', adminEmail: 'admin@chatrax.com',
    audioAlerts: true, desktopNotifications: false, outboundWebhookUrl: '', workspaceName: 'ChatRax Pro', accentColor: 'emerald'
  });

  const [quickReplies, setQuickReplies] = useState<{id: string, shortcut: string, content: string}[]>([]);
  const [showCommandMenu, setShowCommandMenu] = useState(false);
  const [commandQuery, setCommandQuery] = useState('');
  const [newShortcut, setNewShortcut] = useState('');
  const [newTemplateContent, setNewTemplateContent] = useState('');
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [editingTemplateId, setEditingTemplateId] = useState<string | null>(null);
  const [editShortcut, setEditShortcut] = useState('');
  const [editTemplateContent, setEditTemplateContent] = useState('');
  const [campaignName, setCampaignName] = useState('');
  const [campaignAudience, setCampaignAudience] = useState('ALL');
  const [campaignTemplateId, setCampaignTemplateId] = useState('');
  const [currentTime, setCurrentTime] = useState("");
  const [presenceState, setPresenceState] = useState<Record<string, string[]>>({});
  const presenceChannelRef = useRef<any>(null);
  const [now, setNow] = useState(Date.now());
  const alertedLeadsRef = useRef<Set<string>>(new Set());
  const [auditLogs, setAuditLogs] = useState<any[]>([]);
  const [isUploadingCSV, setIsUploadingCSV] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const [subscription, setSubscription] = useState({ status: 'trialing', daysLeft: 7, plan: 'Free Trial', messageLimit: 1000 });

  // ─── CORE FUNCTIONS ───
  const fetchAuditLogs = async () => { const { data } = await supabase.from('audit_logs').select('*').order('created_at', { ascending: false }).limit(20); if (data) setAuditLogs(data); };
  const logAudit = async (actionType: string, details: string) => { try { await supabase.from('audit_logs').insert({ agent_name: settings.adminName || 'System', action_type: actionType, details: details }); fetchAuditLogs(); } catch (err) {} };
  const handleUpgrade = (planType: string) => { alert(`Redirecting to Lemon Squeezy Checkout for the ${planType} plan...`); setSubscription(prev => ({ ...prev, status: 'active', plan: planType, messageLimit: planType === 'Enterprise' ? 10000 : 2500 })); logAudit('SUBSCRIPTION_UPDATE', `Admin upgraded to the ${planType} plan via Lemon Squeezy.`); };
  const fetchLeads = useCallback(async () => { const { data } = await supabase.from('customers').select('*').order('created_at', { ascending: false }); if (data) setLeads(data); }, []);
  const fetchStats = async () => { const { count: outCount } = await supabase.from('messages').select('*', { count: 'exact', head: true }).eq('is_outbound', true); setTotalSent(outCount || 0); const { count: inCount } = await supabase.from('messages').select('*', { count: 'exact', head: true }).eq('is_outbound', false).eq('is_internal', false); setTotalReceived(inCount || 0); };
  const fetchQuickReplies = async () => { const { data } = await supabase.from('quick_replies').select('*').order('created_at', { ascending: false }); if (data) setQuickReplies(data); };

  // ─── INITIALIZATION EFFECTS ───
  useEffect(() => {
    const checkAuth = async () => { const { data: { session } } = await supabase.auth.getSession(); if (!session) { router.push('/login'); } else if (session.user?.email) { setSettings((prev: any) => ({ ...prev, adminEmail: session.user.email || prev.adminEmail, adminName: session.user.user_metadata?.full_name || prev.adminName })); } };
    checkAuth(); setIsMounted(true);
    const savedTheme = localStorage.getItem('chatrax_theme'); if (savedTheme) setTheme(savedTheme);
    const savedBranding = localStorage.getItem('chatrax_branding'); if (savedBranding) { try { const parsed = JSON.parse(savedBranding); setSettings((prev: any) => ({ ...prev, workspaceName: parsed.name || prev.workspaceName, accentColor: parsed.color || prev.accentColor })); } catch (err) {} }
    setCurrentTime(new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }));
    const timer = setInterval(() => setCurrentTime(new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })), 1000);
    return () => clearInterval(timer);
  }, [router]);

  useEffect(() => {
    const interval = setInterval(() => {
      const currentNow = Date.now(); setNow(currentNow);
      if (settings.audioAlerts) {
        leads.forEach((lead: any) => {
          if (lead.status === 'NEW_ORDER' && (currentNow - new Date(lead.created_at).getTime() > 900000) && !alertedLeadsRef.current.has(lead.id)) {
            alertedLeadsRef.current.add(lead.id);
            try {
              const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
              const osc = ctx.createOscillator(); const gain = ctx.createGain();
              osc.connect(gain); gain.connect(ctx.destination); osc.type = 'triangle';
              osc.frequency.setValueAtTime(600, ctx.currentTime); gain.gain.setValueAtTime(0.1, ctx.currentTime); gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.8);
              osc.start(); osc.stop(ctx.currentTime + 0.8);
            } catch(e) {}
          }
        });
      }
    }, 5000);
    return () => clearInterval(interval);
  }, [leads, settings.audioAlerts]);

  useEffect(() => {
    if (!settings.adminName) return;
    const channel = supabase.channel('chatrax_team_presence', { config: { presence: { key: settings.adminName } } });
    presenceChannelRef.current = channel;
    channel.on('presence', { event: 'sync' }, () => {
      const state = channel.presenceState(); const newMap: Record<string, string[]> = {};
      Object.keys(state).forEach((key) => { state[key].forEach((p: any) => { if (p.leadId) { if (!newMap[p.leadId]) newMap[p.leadId] = []; if (!newMap[p.leadId].includes(p.agentName)) newMap[p.leadId].push(p.agentName); } }); });
      setPresenceState(newMap);
    });
    channel.subscribe(async (status: string) => { if (status === 'SUBSCRIBED') await channel.track({ agentName: settings.adminName, leadId: selectedLead?.id || null }); });
    return () => { supabase.removeChannel(channel); };
  }, [settings.adminName, selectedLead]);

  useEffect(() => { messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [messages]);

  useEffect(() => {
    fetchLeads(); fetchStats(); fetchQuickReplies(); fetchAuditLogs();
    const channel = supabase.channel('realtime-customers').on('postgres_changes', { event: '*', schema: 'public', table: 'customers' }, (payload: any) => {
        if (payload.eventType === 'INSERT') setLeads((prev: any[]) => prev.find(l => l.id === payload.new.id) ? prev : [payload.new, ...prev]);
        else if (payload.eventType === 'UPDATE') setLeads((prev: any[]) => prev.map(l => l.id === payload.new.id ? payload.new : l));
        else if (payload.eventType === 'DELETE') setLeads((prev: any[]) => prev.filter(l => l.id !== payload.old.id));
    }).subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [fetchLeads]);

  // ─── CALLBACKS ───
  const handleDragStart = useCallback((e: React.DragEvent, id: string) => { setDraggedLead(id); e.dataTransfer.setData('text/plain', id); e.dataTransfer.effectAllowed = 'move'; }, []);
  const handleDragEnd = useCallback(() => { setDraggedLead(null); }, []);
  const handleDragOver = useCallback((e: React.DragEvent) => { e.preventDefault(); }, []);
  
  const handleDrop = useCallback(async (e: React.DragEvent, newStatus: string) => {
    e.preventDefault(); const currentDraggedId = e.dataTransfer.getData('text/plain') || draggedLead;
    if (!currentDraggedId) return; setDraggedLead(null); 
    setLeads((prevLeads: any[]) => prevLeads.map(l => l.id === currentDraggedId ? { ...l, status: newStatus } : l)); 
    try {
      const { error } = await supabase.from('customers').update({ status: newStatus }).eq('id', currentDraggedId);
      if (!error && newStatus === 'RESOLVED' && settings.outboundWebhookUrl) { const lead = leads.find(l => l.id === currentDraggedId); if (lead) fireOutboundWebhook(lead); } else if (error) { fetchLeads(); }
    } catch (err) { fetchLeads(); }
  }, [draggedLead, settings.outboundWebhookUrl, leads, fetchLeads]);

  const handleCardClick = useCallback((lead: any) => setSelectedLead(lead), []);
  const toggleStar = useCallback((e: React.MouseEvent, id: string) => { e.stopPropagation(); setStarredLeads((prev: Set<string>) => { const next = new Set(prev); if (next.has(id)) next.delete(id); else next.add(id); return next; }); }, []);
  const handleDeleteLead = useCallback(async (e: React.MouseEvent, id: string, name: string) => { e.stopPropagation(); if (userRole !== 'ADMIN') return; if (!window.confirm('Delete lead?')) return; try { await supabase.from('customers').delete().eq('id', id); setLeads((prev: any[]) => prev.filter(l => l.id !== id)); setSelectedLead((prev: any) => prev?.id === id ? null : prev); } catch (err) {} }, [userRole]);

  const updateBranding = (name: string, color: string) => { setSettings((prev: any) => ({ ...prev, workspaceName: name, accentColor: color })); localStorage.setItem('chatrax_branding', JSON.stringify({ name, color })); };
  const handleLogOut = async () => { if (!window.confirm("Are you sure you want to end your session?")) return; try { await supabase.auth.signOut(); router.push('/login'); } catch (err) { router.push('/login'); } };
  const toggleRole = () => { const newRole = userRole === 'ADMIN' ? 'AGENT' : 'ADMIN'; setUserRole(newRole); if (newRole === 'AGENT' && activeView !== 'conversations' && activeView !== 'templates') { setActiveView('conversations'); } };
  const fireOutboundWebhook = async (leadData: any) => { if (!settings.outboundWebhookUrl) return; try { await fetch('/api/webhook/outbound', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ targetUrl: settings.outboundWebhookUrl, payload: { event: 'LEAD_RESOLVED', lead: { id: leadData.id, phone: leadData.phone_number, name: leadData.full_name, email: leadData.email || '', resolved_at: new Date().toISOString() } } }) }); logAudit('WEBHOOK_FIRED', `Successfully pushed resolved lead +${leadData.phone_number}`); } catch (err) { logAudit('WEBHOOK_FAILED', `Failed to push lead +${leadData.phone_number}`); } };
  
  const handleCSVUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]; if (!file) return; setIsUploadingCSV(true); const reader = new FileReader();
    reader.onload = async (event) => {
      try { const text = event.target?.result as string; const rows = text.split('\n'); const newLeads = [];
        for (let i = 1; i < rows.length; i++) { const cols = rows[i].split(','); if (cols.length >= 1 && cols[0].trim()) { let phone = cols[0].replace(/\D/g, ''); if (phone) newLeads.push({ phone_number: phone, full_name: cols[1]?.trim() || 'Imported Contact', status: 'ACTIVE', last_message: 'System Migration' }); } }
        if (newLeads.length > 0) { const { error } = await supabase.from('customers').insert(newLeads); if (!error) { alert(`✅ Migration Complete! Imported ${newLeads.length} leads.`); logAudit('SYSTEM_MIGRATION', `Admin imported ${newLeads.length} leads via CSV.`); fetchLeads(); } }
      } catch (err) { alert("Failed to parse CSV file."); } setIsUploadingCSV(false); e.target.value = ''; 
    }; reader.readAsText(file);
  };

  useEffect(() => {
    if (!selectedLead) { setShopifyData(null); return; }
    setEditProfile({ full_name: selectedLead.full_name || '', email: selectedLead.email || '', profile_notes: selectedLead.profile_notes || '' });
    const fetchChatHistory = async () => { const { data } = await supabase.from('messages').select('*').eq('customer_id', selectedLead.id).order('created_at', { ascending: true }); if (data) setMessages(data); }; fetchChatHistory();
    const fetchShopifyData = async () => { setLoadingShopify(true); try { const response = await fetch(`/api/shopify/customer?phone=${encodeURIComponent(selectedLead.phone_number)}`); const contentType = response.headers.get("content-type"); if (!response.ok || !contentType || !contentType.includes("application/json")) { setShopifyData(null); setLoadingShopify(false); return; } const data = await response.json(); setShopifyData(data); } catch (err) { setShopifyData(null); } setLoadingShopify(false); };
    if (selectedLead.phone_number) fetchShopifyData();
    const msgChannel = supabase.channel('realtime-messages').on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'messages' }, (payload: any) => { if (payload.new.customer_id === selectedLead.id) { setMessages((prev: any[]) => prev.map((m: any) => m.id === payload.new.id ? payload.new : m)); } }).on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'messages' }, (payload: any) => { if (payload.new.customer_id === selectedLead.id) setMessages((prev: any[]) => [...prev, payload.new]); if (payload.new.is_outbound) setTotalSent((prev: number) => prev + 1); else if (!payload.new.is_internal) setTotalReceived((prev: number) => prev + 1); }).subscribe();
    return () => { supabase.removeChannel(msgChannel); };
  }, [selectedLead?.id]);

  const handleUpdateProfile = async () => { await supabase.from('customers').update({ full_name: editProfile.full_name, email: editProfile.email, profile_notes: editProfile.profile_notes }).eq('id', selectedLead.id); fetchLeads(); };
  const handleToggleTag = async (tagId: string) => { if (!selectedLead || userRole !== 'ADMIN') return; let newTags = [...(selectedLead.tags || [])]; if (newTags.includes(tagId)) newTags = newTags.filter((t: string) => t !== tagId); else newTags.push(tagId); setSelectedLead((prev: any) => ({ ...prev, tags: newTags })); setLeads((prev: any[]) => prev.map((l: any) => l.id === selectedLead.id ? { ...l, tags: newTags } : l)); try { await supabase.from('customers').update({ tags: newTags }).eq('id', selectedLead.id); logAudit('TAG_UPDATE', `Admin updated tags for +${selectedLead.phone_number}`); } catch (err) {} };
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => { setNewMessage(e.target.value); const lastWord = e.target.value.split(' ').pop() || ''; if (lastWord.startsWith('/')) { setShowCommandMenu(true); setCommandQuery(lastWord.substring(1).toLowerCase()); } else { setShowCommandMenu(false); } };
  const insertQuickReply = (content: string) => { const words = newMessage.split(' '); words.pop(); setNewMessage((words.join(' ') + (words.length > 0 ? ' ' : '') + content + ' ').trimStart()); setShowCommandMenu(false); };
  const handleSendMessage = async (e: React.FormEvent) => { e.preventDefault(); if (!newMessage.trim() || !selectedLead) return; const content = newMessage; const internalStatus = isInternal; setNewMessage(''); setIsInternal(false); setShowCommandMenu(false); try { await supabase.from('messages').insert({ customer_id: selectedLead.id, content, is_outbound: true, is_internal: internalStatus, status: 'sent' }); if (selectedLead.status === 'NEW_ORDER') { await supabase.from('customers').update({ status: 'ACTIVE' }).eq('id', selectedLead.id); setLeads((prev: any[]) => prev.map((l: any) => l.id === selectedLead.id ? { ...l, status: 'ACTIVE' } : l)); setSelectedLead((prev: any) => prev ? { ...prev, status: 'ACTIVE' } : null); } if (!internalStatus) await fetch('/api/send', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ to: selectedLead.phone_number, message: content }) }); } catch (err) {} };
  
  const handleSendInteractive = async (type: 'button' | 'list') => {
    if (!selectedLead) return; let interactivePayload; let displayMessage = "";
    if (type === 'button') { displayMessage = "🔘 [Sent Quick Reply Buttons]"; interactivePayload = { type: "button", body: { text: "Hi! How can we assist you today?" }, action: { buttons: [ { type: "reply", reply: { id: "btn_sales", title: "Sales" } }, { type: "reply", reply: { id: "btn_support", title: "Support" } } ] } }; } else { displayMessage = "📋 [Sent Interactive Menu List]"; interactivePayload = { type: "list", header: { type: "text", text: "Main Menu" }, body: { text: "Please select an option from the menu below so we can route you correctly:" }, footer: { text: "ChatRax Pro Auto-Menu" }, action: { button: "View Options", sections: [ { title: "Order Help", rows: [ { id: "row_track", title: "Track Order", description: "Check your delivery status" }, { id: "row_return", title: "Returns", description: "Start a return process" } ] } ] } }; }
    try { await supabase.from('messages').insert({ customer_id: selectedLead.id, content: displayMessage, is_outbound: true, is_internal: false, status: 'sent' }); if (selectedLead.status === 'NEW_ORDER') { await supabase.from('customers').update({ status: 'ACTIVE' }).eq('id', selectedLead.id); setLeads((prev: any[]) => prev.map((l: any) => l.id === selectedLead.id ? { ...l, status: 'ACTIVE' } : l)); setSelectedLead((prev: any) => prev ? { ...prev, status: 'ACTIVE' } : null); } await fetch('/api/send', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ to: selectedLead.phone_number, type: 'interactive', interactive: interactivePayload }) }); } catch (err) {}
  };

  const renderMessageContent = (content: string) => {
    if (content.startsWith('MEDIA::')) { const parts = content.split('::'); const type = parts[1]; const mediaId = parts[2]; if (type === 'image') return (<div className="mt-1"><img src={`/api/media?id=${mediaId}`} alt="Upload" className="max-w-[180px] rounded-lg shadow-sm border border-white/10" /></div>); if (type === 'audio') return (<div className="mt-1"><audio controls className="max-w-[200px] h-8 rounded-full shadow-sm"><source src={`/api/media?id=${mediaId}`} type="audio/ogg" /></audio></div>); if (type === 'video') return (<div className="mt-1"><video controls className="max-w-[200px] rounded-lg shadow-sm border border-white/10"><source src={`/api/media?id=${mediaId}`} /></video></div>); }
    return content;
  };

  const handleAddTemplate = async (e: React.FormEvent) => { e.preventDefault(); if (!newShortcut.trim() || !newTemplateContent.trim()) return; try { const cleanShortcut = newShortcut.replace('/', '').trim().toLowerCase(); const { data, error } = await supabase.from('quick_replies').insert([{ shortcut: cleanShortcut, content: newTemplateContent.trim() }]).select(); if (!error && data) { setQuickReplies((prev: any[]) => [data[0], ...prev]); setNewShortcut(''); setNewTemplateContent(''); } } catch (err) {} };
  const handleDeleteTemplate = async (id: string) => { if (!window.confirm("Delete template?")) return; try { await supabase.from('quick_replies').delete().eq('id', id); setQuickReplies((prev: any[]) => prev.filter((q: any) => q.id !== id)); } catch (err) {} };
  const handleCopyTemplate = (id: string, content: string) => { navigator.clipboard.writeText(content); setCopiedId(id); setTimeout(() => setCopiedId(null), 2000); };
  const startEditingTemplate = (template: {id: string, shortcut: string, content: string}) => { setEditingTemplateId(template.id); setEditShortcut(template.shortcut); setEditTemplateContent(template.content); };
  const cancelEditingTemplate = () => { setEditingTemplateId(null); setEditShortcut(''); setEditTemplateContent(''); };
  const handleUpdateTemplate = async (id: string) => { if (!editShortcut.trim() || !editTemplateContent.trim()) return; try { const cleanShortcut = editShortcut.replace('/', '').trim().toLowerCase(); const { error } = await supabase.from('quick_replies').update({ shortcut: cleanShortcut, content: editTemplateContent.trim() }).eq('id', id); if (!error) { setQuickReplies((prev: any[]) => prev.map((q: any) => q.id === id ? { ...q, shortcut: cleanShortcut, content: editTemplateContent.trim() } : q)); setEditingTemplateId(null); } } catch (err) {} };

  const handleDeleteMemo = async (memoId: string) => { try { await supabase.from('messages').delete().eq('id', memoId); setMessages((prev: any[]) => prev.filter((m: any) => m.id !== memoId)); } catch (err) {} };
  const handleDeleteMessage = async (msgId: string) => { if (!window.confirm("Delete this message?")) return; try { await supabase.from('messages').delete().eq('id', msgId); setMessages((prev: any[]) => prev.filter((m: any) => m.id !== msgId)); } catch (err) {} };
  const handleTakeOver = async (id: string, phone: string) => { await supabase.from('customers').update({ status: 'ACTIVE' }).eq('id', id); logAudit('TAKEOVER', `Agent took over inbound lead: +${phone}`); };
  const handleResolveChat = async (id: string, phone: string) => { await supabase.from('customers').update({ status: 'RESOLVED' }).eq('id', id); logAudit('RESOLVE_LEAD', `Agent resolved lead: +${phone}`); if (settings.outboundWebhookUrl && selectedLead) fireOutboundWebhook(selectedLead); setSelectedLead(null); };
  
  const handleExportPDF = () => {
    if (!selectedLead || userRole !== 'ADMIN') return; logAudit('EXPORT_PDF', `Admin downloaded PDF report for +${selectedLead.phone_number}`);
    const doc = new jsPDF(); const name = selectedLead.full_name || selectedLead.phone_number;
    doc.setFontSize(20); doc.setTextColor(6, 182, 212); doc.text(`${settings.workspaceName} Intelligence Report`, 20, 20); doc.setFontSize(10); doc.setTextColor(100); doc.text(`Subject: ${name}`, 20, 30); doc.text(`Generated: ${new Date().toLocaleString()}`, 20, 35); doc.line(20, 40, 190, 40);
    doc.text("Identity Profile", 20, 50); doc.text(`Full Name: ${selectedLead.full_name || 'N/A'}`, 20, 60); doc.text(`Phone: ${selectedLead.phone_number}`, 20, 65); doc.text(`Email Hash: ${selectedLead.email || 'N/A'}`, 20, 70);
    doc.save(`${settings.workspaceName.replace(/\s+/g, '_')}_Report_${name.replace(/\s+/g, '_')}.pdf`);
  };

  const handleLaunchCampaign = async (e: React.FormEvent) => {
    e.preventDefault(); if (!campaignName || !campaignTemplateId) { alert("Please fill in all campaign details."); return; } if (!window.confirm(`Launch broadcast?`)) return;
    try { const response = await fetch('/api/campaign', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ campaignName, audience: campaignAudience, templateId: campaignTemplateId }) }); const data = await response.json(); if (data.success) { alert(`Sent to ${data.broadcasted} customers.`); setCampaignName(''); setCampaignTemplateId(''); } } catch (err) {}
  };

  // ─── OPTIMIZED DATA COMPUTATIONS ───
  const chatMessages = messages.filter((m: any) => !m.is_internal);
  const internalMemos = messages.filter((m: any) => m.is_internal);
  
  const searchedLeads = useMemo(() => {
    if (!globalSearch) return leads;
    const searchLower = globalSearch.toLowerCase();
    return leads.filter((l: any) => 
       (l.full_name && l.full_name.toLowerCase().includes(searchLower)) || 
       (l.phone_number && l.phone_number.includes(searchLower)) || 
       (l.last_message && l.last_message.toLowerCase().includes(searchLower))
    );
  }, [leads, globalSearch]);

  const groupedLeads = useMemo(() => {
    const groups: Record<string, any[]> = { 'NEW_ORDER': [], 'HANDOFF': [], 'ACTIVE': [], 'RESOLVED': [] };
    for (let i = 0; i < searchedLeads.length; i++) {
       const lead = searchedLeads[i];
       if (groups[lead.status]) groups[lead.status].push(lead);
    }
    return groups;
  }, [searchedLeads]);

  const newOrdersCount = groupedLeads['NEW_ORDER'].length;
  const activeCount = groupedLeads['ACTIVE'].length;
  const resolvedCount = groupedLeads['RESOLVED'].length;
  const handoffCount = groupedLeads['HANDOFF'].length;

  const activeConversationsCount = leads.filter((l: any) => l.status !== 'RESOLVED').length;
  const filteredReplies = quickReplies.filter((r: any) => r.shortcut.toLowerCase().includes(commandQuery));
  const totalLeads = leads.length || 1; 
  const newOrdersPct = leads.length ? Math.round((newOrdersCount / totalLeads) * 100) : 0;
  const activePct = leads.length ? Math.round((activeCount / totalLeads) * 100) : 0;
  const resolvedPct = leads.length ? Math.round((resolvedCount / totalLeads) * 100) : 0;
  const resolutionRate = leads.length > 0 ? Math.round((resolvedCount / leads.length) * 100) : 0;
  const totalMessagesUsed = totalSent + totalReceived;

  const activeTheme = BRAND_COLORS[settings.accentColor as keyof typeof BRAND_COLORS] || BRAND_COLORS.emerald;
  const brandNameParts = settings.workspaceName.split(' ');
  const brandLastName = brandNameParts.length > 1 ? brandNameParts.pop() : '';
  const brandFirstName = brandNameParts.join(' ') || settings.workspaceName;

  // ─── RENDER HELPER FUNCTIONS ───

  const renderSidebar = () => (
    <div className="w-60 border-r border-white/10 bg-[#111827]/80 backdrop-blur-3xl flex flex-col z-40 shadow-[10px_0_30px_rgba(0,0,0,0.3)] shrink-0 h-full">
      <div className="h-20 flex items-center px-6 border-b border-white/10 shrink-0">
        <h1 className="text-xl font-extrabold tracking-tight text-white flex items-center gap-2 drop-shadow-[0_0_10px_rgba(255,255,255,0.1)]">
          <span className={`w-8 h-8 rounded-lg bg-gradient-to-br ${activeTheme.gradient} flex items-center justify-center ${activeTheme.shadow}`}><MessageCircle className="w-5 h-5 text-white" /></span>
          <span className="truncate">{brandFirstName} <span className={activeTheme.text.replace('text-', '')}>{brandLastName}</span></span>
        </h1>
      </div>
      <div className="flex-1 py-4 px-3 space-y-1 overflow-y-auto custom-scrollbar">
        {userRole === 'ADMIN' && <button onClick={() => setActiveView('dashboard')} className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors font-medium text-sm ${activeView === 'dashboard' ? 'bg-[#1E293B] text-white' : 'text-zinc-400 hover:bg-[#1E293B]/50 hover:text-white'}`}><LayoutDashboard className="w-4 h-4" /> Dashboard</button>}
        <button onClick={() => setActiveView('conversations')} className={`w-full flex items-center justify-between px-3 py-2.5 rounded-lg transition-colors font-medium text-sm ${activeView === 'conversations' ? 'bg-[#1E293B] text-white' : 'text-zinc-400 hover:bg-[#1E293B]/50 hover:text-white'}`}><div className="flex items-center gap-3"><MessageSquare className="w-4 h-4" /> Conversations</div><span className="bg-[#10b981]/20 text-[#10b981] text-[10px] px-2 py-0.5 rounded-full font-bold">{activeConversationsCount}</span></button>
        {userRole === 'ADMIN' && (
           <>
              <button onClick={() => setActiveView('campaigns')} className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors font-medium text-sm ${activeView === 'campaigns' ? 'bg-[#1E293B] text-white' : 'text-zinc-400 hover:bg-[#1E293B]/50 hover:text-white'}`}><Megaphone className="w-4 h-4" /> Campaigns</button>
              <button onClick={() => setActiveView('templates')} className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors font-medium text-sm ${activeView === 'templates' ? 'bg-[#1E293B] text-white' : 'text-zinc-400 hover:bg-[#1E293B]/50 hover:text-white'}`}><LayoutTemplate className="w-4 h-4" /> Templates</button>
              <button onClick={() => setActiveView('analytics')} className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors font-medium text-sm ${activeView === 'analytics' ? 'bg-[#1E293B] text-white' : 'text-zinc-400 hover:bg-[#1E293B]/50 hover:text-white'}`}><BarChart2 className="w-4 h-4" /> Analytics</button>
              <button onClick={() => setActiveView('billing')} className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors font-medium text-sm ${activeView === 'billing' ? 'bg-[#1E293B] text-white' : 'text-zinc-400 hover:bg-[#1E293B]/50 hover:text-white'}`}><CreditCard className="w-4 h-4" /> Billing</button>
              <button onClick={() => setActiveView('settings')} className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors font-medium text-sm ${activeView === 'settings' ? 'bg-[#10b981]/20 text-[#10b981]' : 'text-zinc-400 hover:bg-[#1E293B]/50 hover:text-white'}`}><Settings className="w-4 h-4" /> Settings</button>
           </>
        )}
      </div>
      <div className="p-4 border-t border-white/5 bg-[#0F172A] flex flex-col gap-3 shrink-0">
        <div className="flex items-center justify-between px-1 text-[9px] font-bold text-zinc-500 uppercase tracking-widest"><span>Access Level</span><span className={userRole === 'ADMIN' ? activeTheme.text : 'text-zinc-400'}>{userRole}</span></div>
        <button onClick={toggleRole} className={`w-full py-2 rounded-lg text-[10px] font-bold uppercase tracking-widest transition-all border ${userRole === 'ADMIN' ? `${activeTheme.bgSubtle} ${activeTheme.text} ${activeTheme.border}` : 'bg-[#1E293B] text-zinc-300 border-transparent hover:bg-white/10'}`}>Switch to {userRole === 'ADMIN' ? 'Agent' : 'Admin'} Mode</button>
        <div className="flex items-center justify-between p-2 rounded-lg bg-[#1E293B]/50 border border-white/5 mt-1">
           <div className="flex items-center gap-2.5 overflow-hidden px-1"><div className="w-7 h-7 shrink-0 rounded-full bg-gradient-to-tr from-sky-500 to-blue-600 flex items-center justify-center font-bold text-white text-xs">{settings.adminName ? settings.adminName.charAt(0).toUpperCase() : 'N'}</div><div className="overflow-hidden"><p className="text-xs font-bold text-white truncate max-w-[100px]">{settings.adminName || 'Nasir Ahmed'}</p></div></div>
           <button onClick={handleLogOut} className="p-1.5 hover:bg-red-500/10 rounded text-zinc-400 hover:text-red-400 transition-all"><LogOut className="w-3.5 h-3.5" /></button>
        </div>
      </div>
    </div>
  );

  const renderDashboardKanban = () => (
    <div className="flex flex-col h-full animate-[fade-in_0.3s_ease-out]">
      <div className="h-20 flex items-center justify-between px-6 border-b border-white/10 bg-[#111827]/80 backdrop-blur-xl shrink-0">
        <div>
          <h2 className="text-lg font-bold text-white drop-shadow-md">{activeView === 'dashboard' ? 'Command Center' : 'Conversations'}</h2>
          <p className="text-[10px] text-zinc-400 font-medium tracking-wide mt-0.5">{activeView === 'dashboard' ? 'Live overview of your Store & CRM activity' : 'Manage and route your active customer chats'}</p>
        </div>
        <div className="flex items-center gap-3">
           {activeView === 'dashboard' ? (
              <div className={`flex items-center gap-2 bg-[#1F2937]/80 border border-white/10 rounded-lg px-3 py-1.5 text-[10px] font-bold tracking-wider ${activeTheme.text} shadow-inner`}><div className={`w-1.5 h-1.5 rounded-full ${activeTheme.bg} animate-led border border-white/20`}></div>LIVE SYNC • {currentTime}</div>
           ) : (
              <div className="relative w-64"><Search className="w-3.5 h-3.5 text-zinc-400 absolute left-3 top-1/2 -translate-y-1/2" /><input type="text" placeholder="Search database..." value={globalSearch} onChange={(e) => setGlobalSearch(e.target.value)} className={`w-full bg-[#1F2937] border border-white/10 rounded-lg pl-9 pr-3 py-1.5 text-xs text-white ${activeTheme.focusBorder} outline-none transition-all shadow-inner placeholder-zinc-500`} /></div>
           )}
        </div>
      </div>

      <div className="flex-1 p-6 flex flex-col overflow-y-auto custom-scrollbar">
          {activeView === 'dashboard' && userRole === 'ADMIN' && (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6 shrink-0">
                <div className="bg-[#1F2937]/70 backdrop-blur-2xl border border-white/10 rounded-2xl p-5 shadow-xl relative overflow-hidden transition-all duration-300 hover:-translate-y-1 hover:shadow-2xl">
                   <div className={`absolute top-0 left-0 w-1 h-full ${activeTheme.bg} shadow-[0_0_15px_${activeTheme.bg}]`} /><div className="flex justify-between items-start mb-3 pl-2"><div className={`w-8 h-8 rounded-xl ${activeTheme.bgSubtle} border ${activeTheme.border} flex items-center justify-center ${activeTheme.text}`}><ShoppingBag className="w-4 h-4"/></div><span className={`text-[9px] font-bold ${activeTheme.text} ${activeTheme.bgSubtle} px-2 py-0.5 rounded-full flex items-center gap-1`}><TrendingUp className="w-2.5 h-2.5"/> {newOrdersPct}%</span></div>
                   <p className="text-[10px] font-semibold tracking-widest text-zinc-400 uppercase mb-0.5 pl-2">New Orders</p><h3 className="text-2xl font-bold text-white tracking-tight pl-2 mt-0.5">{newOrdersCount}</h3>
                </div>
                <div className="bg-[#1F2937]/70 backdrop-blur-2xl border border-white/10 rounded-2xl p-5 shadow-xl relative overflow-hidden transition-all duration-300 hover:-translate-y-1 hover:shadow-2xl">
                   <div className="absolute top-0 left-0 w-1 h-full bg-sky-500 shadow-[0_0_15px_#0ea5e9]" /><div className="flex justify-between items-start mb-3 pl-2"><div className="w-8 h-8 rounded-xl bg-sky-500/10 border border-sky-500/20 flex items-center justify-center text-sky-400"><Activity className="w-4 h-4"/></div><span className="text-[9px] font-bold text-sky-400 bg-sky-500/10 px-2 py-0.5 rounded-full flex items-center gap-1">{activePct}%</span></div>
                   <p className="text-[10px] font-semibold tracking-widest text-zinc-400 uppercase mb-0.5 pl-2">Active Contacts</p><h3 className="text-2xl font-bold text-white tracking-tight pl-2 mt-0.5">{activeCount}</h3>
                </div>
                <div className="bg-[#1F2937]/70 backdrop-blur-2xl border border-white/10 rounded-2xl p-5 shadow-xl relative overflow-hidden transition-all duration-300 hover:-translate-y-1 hover:shadow-2xl">
                   <div className="absolute top-0 left-0 w-1 h-full bg-lime-500 shadow-[0_0_15px_#84cc16]" /><div className="flex justify-between items-start mb-3 pl-2"><div className="w-8 h-8 rounded-xl bg-lime-500/10 border border-lime-500/20 flex items-center justify-center text-lime-400"><ShieldCheck className="w-4 h-4"/></div><span className="text-[9px] font-bold text-lime-400 bg-lime-500/10 px-2 py-0.5 rounded-full flex items-center gap-1">{resolvedPct}%</span></div>
                   <p className="text-[10px] font-semibold tracking-widest text-zinc-400 uppercase mb-0.5 pl-2">Resolved Leads</p><h3 className="text-2xl font-bold text-white tracking-tight pl-2 mt-0.5">{resolvedCount}</h3>
                </div>
                <div className="bg-[#1F2937]/70 backdrop-blur-2xl border border-white/10 rounded-2xl p-5 shadow-xl relative overflow-hidden transition-all duration-300 hover:-translate-y-1 hover:shadow-2xl">
                   <div className="absolute top-0 left-0 w-1 h-full bg-amber-500 shadow-[0_0_15px_#f59e0b]" /><div className="flex justify-between items-start mb-3 pl-2"><div className="w-8 h-8 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400"><Send className="w-4 h-4 ml-0.5"/></div><span className="text-[9px] font-bold text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded-full flex items-center gap-1">Live</span></div>
                   <p className="text-[10px] font-semibold tracking-widest text-zinc-400 uppercase mb-0.5 pl-2">Messages Sent</p><h3 className="text-2xl font-bold text-white tracking-tight pl-2 mt-0.5">{totalSent}</h3>
                </div>
              </div>
          )}

          {activeView === 'dashboard' && (
              <div className="flex items-center justify-between mb-4 shrink-0 px-1">
                <h3 className="text-sm font-bold text-white drop-shadow-sm">Live Action Board</h3>
                <div className="relative w-64"><Search className="w-3.5 h-3.5 text-zinc-400 absolute left-3 top-1/2 -translate-y-1/2" /><input type="text" placeholder="Search database..." value={globalSearch} onChange={(e) => setGlobalSearch(e.target.value)} className={`w-full bg-[#1F2937] border border-white/10 rounded-lg pl-9 pr-3 py-1.5 text-xs text-white ${activeTheme.focusBorder} outline-none transition-all shadow-inner placeholder-zinc-500`} /></div>
              </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 items-start pb-6">
            {COLUMNS.map((status) => {
              const config = COLUMN_CONFIG[status];
              const colLeads = groupedLeads[status] || [];
              return (
                <div key={status} onDragOver={handleDragOver} onDrop={(e) => handleDrop(e, status)} className="flex flex-col bg-[#111827]/60 backdrop-blur-xl rounded-xl border border-white/10 shadow-2xl h-full min-h-[300px]">
                  <div className="flex items-center justify-between p-3 border-b border-white/10 shrink-0 bg-[#1F2937]/80 rounded-t-xl">
                    <div className="flex items-center gap-2"><config.icon className="w-3.5 h-3.5" style={{ color: config.hex, filter: `drop-shadow(0 0 5px ${config.hex})` }} /><h2 className="text-[10px] font-bold tracking-widest text-white uppercase">{status.replace('_', ' ')}</h2></div>
                    <span className={`text-[9px] font-bold text-white bg-opacity-20 px-2 py-0.5 rounded-full border border-${config.hex}/30`} style={{ backgroundColor: config.hex }}>{colLeads.length}</span>
                  </div>
                  <div className="p-2 flex flex-col gap-2.5">
                       {colLeads.map((lead) => {
                         const isSlaBreached = status === 'NEW_ORDER' && (now - new Date(lead.created_at).getTime() > 900000);
                         const isDragging = draggedLead === lead.id;
                         const isStarred = starredLeads.has(lead.id);
                         const viewers = presenceState[lead.id]?.filter((name: string) => name !== settings.adminName) || [];
                         return (
                           <LeadCard key={lead.id} lead={lead} config={config} isSlaBreached={isSlaBreached} isDragging={isDragging} isStarred={isStarred} viewers={viewers} onDragStart={handleDragStart} onDragEnd={handleDragEnd} onClick={handleCardClick} onToggleStar={toggleStar} userRole={userRole} onDeleteLead={handleDeleteLead} activeTheme={activeTheme} />
                         );
                       })}
                  </div>
                </div>
              );
            })}
          </div>
      </div>
    </div>
  );

  const renderBilling = () => (
    <div className="flex flex-col h-full animate-[fade-in_0.3s_ease-out]">
      <div className="h-20 flex items-center justify-between px-6 border-b border-white/10 bg-[#111827]/80 backdrop-blur-xl shrink-0">
        <div><h2 className="text-lg font-bold text-white drop-shadow-md">Billing & Usage</h2><p className="text-[10px] text-zinc-400 font-medium tracking-wide mt-0.5">Manage your workspace subscription and limits</p></div>
      </div>
      <div className="flex-1 overflow-y-auto custom-scrollbar p-6">
         <div className="max-w-4xl mx-auto space-y-6">
            <div className={`bg-[#1F2937]/60 backdrop-blur-xl border ${activeTheme.border} rounded-2xl p-6 relative overflow-hidden shadow-2xl`}>
               <div className="absolute top-0 right-0 p-4 opacity-10"><CreditCard className="w-32 h-32 text-white" /></div>
               <h3 className={`text-xs font-bold ${activeTheme.text} flex items-center gap-1.5 mb-5 relative z-10`}><CreditCard className="w-4 h-4" /> Subscription Status</h3>
               <div className="relative z-10 grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="flex flex-col justify-center p-5 bg-[#111827]/60 border border-white/5 rounded-xl shadow-inner">
                     <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest mb-1">Current Plan</p>
                     <p className="text-xl font-bold text-white flex items-center gap-2">{subscription.plan} <span className={`text-[10px] px-2.5 py-1 rounded-full border ${subscription.status === 'active' ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30' : 'bg-amber-500/20 text-amber-400 border-amber-500/30'}`}>{subscription.status === 'active' ? 'Active' : `${subscription.daysLeft} Days Left`}</span></p>
                     {subscription.status !== 'active' && ( <button onClick={() => handleUpgrade('Pro')} className={`mt-4 w-full py-2 bg-gradient-to-r ${activeTheme.gradient} text-white text-[10px] font-bold uppercase tracking-widest rounded-lg transition-all hover:scale-[1.02] shadow-lg`}>Upgrade Now</button> )}
                  </div>
                  <div className="p-5 bg-[#111827]/60 border border-white/5 rounded-xl flex flex-col justify-center shadow-inner">
                     <div className="flex justify-between text-[10px] font-bold text-zinc-400 mb-2"><span>Message Volume Usage</span><span>{totalMessagesUsed} / {subscription.messageLimit}</span></div>
                     <div className="w-full bg-[#1E293B] rounded-full h-2.5 overflow-hidden"><div className={`${activeTheme.bg} h-full rounded-full transition-all duration-1000 shadow-[0_0_10px_rgba(255,255,255,0.5)]`} style={{ width: `${Math.min((totalMessagesUsed / subscription.messageLimit) * 100, 100)}%` }}></div></div>
                     <p className="text-[9px] text-zinc-500 mt-2">Volume resets at the end of your billing cycle.</p>
                  </div>
               </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
               <div className="bg-[#1F2937]/60 backdrop-blur-xl border border-white/10 rounded-2xl p-6 flex flex-col shadow-2xl transition-transform hover:-translate-y-1">
                  <h3 className="text-xl font-bold text-white mb-1">Pro Plan</h3><p className="text-xs text-zinc-400 mb-4">Perfect for growing stores.</p><p className="text-3xl font-black text-white mb-6">$99<span className="text-sm text-zinc-500 font-medium">/mo</span></p>
                  <ul className="space-y-3 mb-8 flex-1">
                     <li className="text-xs text-zinc-300 flex items-center gap-2"><Check className="w-4 h-4 text-emerald-400" /> 2,500 messages / month</li>
                     <li className="text-xs text-zinc-300 flex items-center gap-2"><Check className="w-4 h-4 text-emerald-400" /> 1 Agent Seat</li>
                     <li className="text-xs text-zinc-300 flex items-center gap-2"><Check className="w-4 h-4 text-emerald-400" /> Standard Support</li>
                  </ul>
                  <button onClick={() => handleUpgrade('Pro')} disabled={subscription.plan === 'Pro'} className="w-full py-2.5 rounded-lg text-xs font-bold transition-all bg-white/10 text-white hover:bg-white/20 disabled:opacity-50">{subscription.plan === 'Pro' ? 'Current Plan' : 'Select Pro'}</button>
               </div>
               <div className={`bg-[#1F2937]/60 backdrop-blur-xl border ${activeTheme.border} rounded-2xl p-6 flex flex-col relative overflow-hidden shadow-[0_0_30px_rgba(0,0,0,0.3)] transition-transform hover:-translate-y-1`}>
                  <div className={`absolute top-0 right-0 bg-gradient-to-l ${activeTheme.gradient} text-white text-[9px] font-bold uppercase tracking-widest px-3 py-1 rounded-bl-lg shadow-md`}>Popular</div>
                  <h3 className="text-xl font-bold text-white mb-1">Enterprise</h3><p className="text-xs text-zinc-400 mb-4">For high-volume operations.</p><p className="text-3xl font-black text-white mb-6">$299<span className="text-sm text-zinc-500 font-medium">/mo</span></p>
                  <ul className="space-y-3 mb-8 flex-1">
                     <li className="text-xs text-zinc-300 flex items-center gap-2"><Check className={`w-4 h-4 ${activeTheme.text}`} /> 10,000 messages / month</li>
                     <li className="text-xs text-zinc-300 flex items-center gap-2"><Check className={`w-4 h-4 ${activeTheme.text}`} /> Unlimited Agents</li>
                     <li className="text-xs text-zinc-300 flex items-center gap-2"><Check className={`w-4 h-4 ${activeTheme.text}`} /> Webhook Automations</li>
                     <li className="text-xs text-zinc-300 flex items-center gap-2"><Check className={`w-4 h-4 ${activeTheme.text}`} /> Priority Support</li>
                  </ul>
                  <button onClick={() => handleUpgrade('Enterprise')} disabled={subscription.plan === 'Enterprise'} className={`w-full py-2.5 rounded-lg text-xs font-bold transition-all bg-gradient-to-r ${activeTheme.gradient} text-white shadow-lg hover:shadow-xl disabled:opacity-50`}>{subscription.plan === 'Enterprise' ? 'Current Plan' : 'Select Enterprise'}</button>
               </div>
            </div>
         </div>
      </div>
    </div>
  );

  const renderTemplates = () => (
    <div className="flex flex-col h-full animate-[fade-in_0.3s_ease-out]">
      <div className="h-20 flex items-center justify-between px-6 border-b border-white/10 bg-[#111827]/80 backdrop-blur-xl shrink-0">
        <div><h2 className="text-lg font-bold text-white drop-shadow-md">Template & Slash Commands</h2><p className="text-[10px] text-zinc-400 font-medium tracking-wide mt-0.5">Manage your team's quick replies and canned responses</p></div>
      </div>
      <div className="flex-1 overflow-y-auto custom-scrollbar p-6">
         <div className="max-w-5xl mx-auto space-y-6">
            {userRole === 'ADMIN' && (
               <div className="bg-[#1F2937]/60 backdrop-blur-xl border border-white/10 rounded-2xl p-5 shadow-2xl">
                  <h3 className={`text-xs font-bold ${activeTheme.text} flex items-center gap-1.5 mb-4`}><Zap className="w-3.5 h-3.5" /> Create New Command</h3>
                  <form onSubmit={handleAddTemplate} className="flex flex-col md:flex-row gap-3">
                     <div className="w-full md:w-1/3"><div className="relative"><span className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500 font-bold text-xs">/</span><input type="text" value={newShortcut} onChange={(e) => setNewShortcut(e.target.value)} placeholder="shortcut_name" className={`w-full bg-[#111827]/80 border border-white/10 rounded-lg pl-7 pr-3 py-2.5 text-xs text-white ${activeTheme.focusBorder} outline-none transition-colors shadow-inner`} /></div></div>
                     <div className="flex-1"><input type="text" value={newTemplateContent} onChange={(e) => setNewTemplateContent(e.target.value)} placeholder="Type the full message content here..." className={`w-full bg-[#111827]/80 border border-white/10 rounded-lg px-3 py-2.5 text-xs text-white ${activeTheme.focusBorder} outline-none transition-colors shadow-inner`} /></div>
                     <button type="submit" disabled={!newShortcut.trim() || !newTemplateContent.trim()} className={`${activeTheme.bgSubtle} ${activeTheme.text} border ${activeTheme.border} ${activeTheme.hoverBg} disabled:opacity-50 transition-all rounded-lg px-5 py-2.5 text-xs font-bold shadow-md`}>Save</button>
                  </form>
               </div>
            )}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {quickReplies.length === 0 ? ( <div className="col-span-full p-6 text-center bg-[#1F2937]/30 border border-dashed border-white/10 rounded-2xl text-zinc-500 text-xs font-medium backdrop-blur-sm">No templates saved yet. Create one above!</div>
              ) : (
                quickReplies.map((reply: any) => (
                  <div key={reply.id} className="group bg-[#1F2937]/80 backdrop-blur-xl border border-white/10 hover:border-white/20 rounded-xl p-4 transition-all duration-300 hover:-translate-y-0.5 relative min-h-[120px] shadow-lg">
                     {editingTemplateId === reply.id ? (
                        <div className="flex flex-col gap-2 h-full">
                          <div className="relative"><span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-zinc-500 font-bold text-[10px]">/</span><input type="text" value={editShortcut} onChange={(e) => setEditShortcut(e.target.value)} className={`w-full bg-[#111827]/80 border border-white/10 rounded-md pl-6 pr-2 py-1.5 text-[10px] text-white ${activeTheme.focusBorder} outline-none transition-colors`} /></div>
                          <textarea value={editTemplateContent} onChange={(e) => setEditTemplateContent(e.target.value)} className={`w-full bg-[#111827]/80 border border-white/10 rounded-md px-2.5 py-1.5 text-[10px] text-white ${activeTheme.focusBorder} outline-none resize-none transition-colors flex-1 custom-scrollbar`} />
                          <div className="flex gap-1.5 justify-end mt-auto"><button onClick={cancelEditingTemplate} className="px-2 py-1 rounded text-[10px] font-bold text-zinc-400 hover:text-white hover:bg-white/5 transition-colors">Cancel</button><button onClick={() => handleUpdateTemplate(reply.id)} className={`px-2 py-1 rounded text-[10px] font-bold ${activeTheme.bgSubtle} ${activeTheme.text} transition-colors border ${activeTheme.border}`}>Save</button></div>
                        </div>
                     ) : (
                        <>
                           <div className="absolute top-2.5 right-2.5 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                              {userRole === 'ADMIN' && ( <button onClick={() => startEditingTemplate(reply)} className="p-1.5 bg-[#111827]/60 hover:bg-[#1E293B] rounded transition-colors text-zinc-400 hover:text-white border border-white/5"><Edit2 className="w-3 h-3" /></button> )}
                              <button onClick={() => handleCopyTemplate(reply.id, reply.content)} className={`p-1.5 rounded transition-colors border ${copiedId === reply.id ? `${activeTheme.bgSubtle} ${activeTheme.text} ${activeTheme.border}` : 'bg-[#111827]/60 text-zinc-400 hover:text-white border-white/5 hover:border-white/20'}`}>{copiedId === reply.id ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}</button>
                              {userRole === 'ADMIN' && ( <button onClick={() => handleDeleteTemplate(reply.id)} className="p-1.5 bg-[#111827]/60 hover:bg-red-500/10 rounded transition-colors text-zinc-400 hover:text-red-400 border border-white/5"><Trash2 className="w-3 h-3" /></button> )}
                           </div>
                           <h4 className={`${activeTheme.text} font-bold text-xs mb-2 flex items-center gap-1 drop-shadow-md`}>/{reply.shortcut}</h4>
                           <div className="bg-[#111827]/50 rounded-lg p-3 min-h-[60px] shadow-inner border border-white/5"><p className="text-[10px] text-zinc-300 leading-relaxed">{reply.content}</p></div>
                        </>
                     )}
                  </div>
                ))
              )}
            </div>
         </div>
      </div>
    </div>
  );

  const renderCampaigns = () => (
    <div className="flex flex-col h-full animate-[fade-in_0.3s_ease-out]">
      <div className="h-20 flex items-center justify-between px-6 border-b border-white/10 bg-[#111827]/80 backdrop-blur-xl shrink-0">
        <div><h2 className="text-lg font-bold text-white drop-shadow-md">Campaigns & Broadcasts</h2><p className="text-[10px] text-zinc-400 font-medium tracking-wide mt-0.5">Send mass updates, promotions, and recovery messages</p></div>
      </div>
      <div className="flex-1 overflow-y-auto custom-scrollbar p-6">
         <div className="max-w-6xl mx-auto grid grid-cols-1 xl:grid-cols-3 gap-6">
            <div className="xl:col-span-1 space-y-6">
              <div className="bg-[#1F2937]/60 backdrop-blur-xl border border-white/10 rounded-2xl p-5 shadow-2xl">
                 <h3 className={`text-xs font-bold ${activeTheme.text} flex items-center gap-1.5 mb-5`}><Megaphone className="w-3.5 h-3.5" /> New Broadcast</h3>
                 <form onSubmit={handleLaunchCampaign} className="space-y-4">
                    <div className="space-y-1.5"><label className="text-[9px] font-bold text-zinc-400 uppercase tracking-widest pl-1">Campaign Name</label><input type="text" value={campaignName} onChange={(e) => setCampaignName(e.target.value)} placeholder="e.g. Eid Flash Sale" className={`w-full bg-[#111827]/80 border border-white/10 rounded-lg px-3 py-2.5 text-xs text-white ${activeTheme.focusBorder} outline-none transition-colors`} /></div>
                    <div className="space-y-1.5"><label className="text-[9px] font-bold text-zinc-400 uppercase tracking-widest pl-1">Target Audience</label>
                       <select value={campaignAudience} onChange={(e) => setCampaignAudience(e.target.value)} className={`w-full bg-[#111827]/80 border border-white/10 rounded-lg px-3 py-2.5 text-xs text-white ${activeTheme.focusBorder} outline-none transition-colors appearance-none cursor-pointer`}>
                         <option value="ALL">All Contacts ({leads.length})</option>{COLUMNS.map(status => ( <option key={status} value={status}>{status.replace('_', ' ')} ({groupedLeads[status]?.length || 0})</option> ))}
                       </select>
                    </div>
                    <div className="space-y-1.5"><label className="text-[9px] font-bold text-zinc-400 uppercase tracking-widest pl-1">Meta Template</label>
                       <select value={campaignTemplateId} onChange={(e) => setCampaignTemplateId(e.target.value)} className={`w-full bg-[#111827]/80 border border-white/10 rounded-lg px-3 py-2.5 text-xs text-white ${activeTheme.focusBorder} outline-none transition-colors appearance-none cursor-pointer`}>
                         <option value="" disabled>Select a template...</option>{quickReplies.map((reply: any) => ( <option key={reply.id} value={reply.id}>/{reply.shortcut}</option> ))}
                       </select>
                    </div>
                    <button type="submit" className={`w-full bg-gradient-to-r ${activeTheme.gradient} ${activeTheme.hoverGradient} text-white font-bold text-xs px-4 py-2.5 rounded-lg shadow-sm transition-all flex items-center justify-center gap-1.5 hover:-translate-y-0.5 active:translate-y-0 mt-3`}><Send className="w-3.5 h-3.5 ml-1" /> Launch Broadcast</button>
                 </form>
              </div>
            </div>
            <div className="xl:col-span-2">
              <div className="bg-[#1F2937]/60 backdrop-blur-xl border border-white/10 rounded-2xl p-5 shadow-2xl h-full">
                 <h3 className="text-xs font-bold text-white flex items-center gap-1.5 mb-5"><Activity className="w-3.5 h-3.5 text-cyan-400" /> Broadcast History</h3>
                 <div className="bg-[#1F2937]/50 border border-dashed border-white/10 rounded-xl p-8 flex flex-col items-center justify-center text-center h-[200px]">
                    <Users className="w-10 h-10 text-zinc-600 mb-2" />
                    <p className="text-zinc-400 text-xs font-medium">No campaigns launched yet.</p>
                 </div>
              </div>
            </div>
         </div>
      </div>
    </div>
  );

  const renderAnalytics = () => (
    <div className="flex flex-col h-full animate-[fade-in_0.3s_ease-out]">
      <div className="h-20 flex items-center justify-between px-6 border-b border-white/10 bg-[#111827]/80 backdrop-blur-xl shrink-0">
        <div><h2 className="text-lg font-bold text-white drop-shadow-md">Analytics & Performance</h2><p className="text-[10px] text-zinc-400 font-medium tracking-wide mt-0.5">Real-time metrics on team performance and conversation volume</p></div>
        <div className="flex items-center gap-3"><div className={`bg-[#1F2937] border border-white/10 rounded-lg px-3 py-1.5 flex items-center gap-1.5 text-[10px] font-semibold text-zinc-200 shadow-inner`}><Calendar className={`w-3 h-3 ${activeTheme.text}`} /> Last 30 Days</div></div>
      </div>
      <div className="flex-1 overflow-y-auto custom-scrollbar p-6">
         <div className="max-w-6xl mx-auto space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="bg-[#1F2937]/60 backdrop-blur-xl border border-white/10 rounded-2xl p-5 shadow-2xl relative overflow-hidden"><div className="absolute top-0 right-0 p-3 opacity-10"><Target className="w-16 h-16 text-emerald-500" /></div><p className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest mb-1">Resolution Rate</p><h3 className="text-2xl font-black text-white mb-1.5">{resolutionRate}%</h3><p className="text-[9px] text-emerald-400 font-semibold flex items-center gap-1"><TrendingUp className="w-2.5 h-2.5"/> +4% from last week</p></div>
              <div className="bg-[#1F2937]/60 backdrop-blur-xl border border-white/10 rounded-2xl p-5 shadow-2xl relative overflow-hidden"><div className="absolute top-0 right-0 p-3 opacity-10"><MessageCircle className="w-16 h-16 text-sky-500" /></div><p className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest mb-1">Total Contacts</p><h3 className="text-2xl font-black text-white mb-1.5">{leads.length}</h3><p className="text-[9px] text-sky-400 font-semibold flex items-center gap-1"><TrendingUp className="w-2.5 h-2.5"/> Active database</p></div>
              <div className="bg-[#1F2937]/60 backdrop-blur-xl border border-white/10 rounded-2xl p-5 shadow-2xl relative overflow-hidden"><div className="absolute top-0 right-0 p-3 opacity-10"><Activity className="w-16 h-16 text-amber-500" /></div><p className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest mb-1">Avg Response Time</p><h3 className="text-2xl font-black text-white mb-1.5"><span className="text-lg text-zinc-400">&lt;</span> 2<span className="text-base text-zinc-400">m</span></h3><p className="text-[9px] text-emerald-400 font-semibold flex items-center gap-1"><TrendingDown className="w-2.5 h-2.5"/> -30s from last week</p></div>
              <div className="bg-[#1F2937]/60 backdrop-blur-xl border border-white/10 rounded-2xl p-5 shadow-2xl relative overflow-hidden"><div className="absolute top-0 right-0 p-3 opacity-10"><PieChart className="w-16 h-16 text-purple-500" /></div><p className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest mb-1">Total Messages</p><h3 className="text-2xl font-black text-white mb-1.5">{totalSent + totalReceived}</h3><p className="text-[9px] text-purple-400 font-semibold flex items-center gap-1">In & Outbound</p></div>
            </div>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
               <div className="bg-[#1F2937]/60 backdrop-blur-xl border border-white/10 rounded-2xl p-6 shadow-2xl">
                  <h3 className="text-xs font-bold text-white flex items-center gap-1.5 mb-6"><Search className={`w-3.5 h-3.5 ${activeTheme.text}`} /> Lead Pipeline Funnel</h3>
                  <div className="space-y-5">
                     <div><div className="flex justify-between text-[10px] font-bold text-zinc-300 mb-1.5"><span>New Orders (Entry)</span><span>{newOrdersCount}</span></div><div className="w-full bg-white/5 rounded-full h-2 overflow-hidden border border-white/5"><div className="bg-emerald-500 h-full rounded-full shadow-[0_0_8px_rgba(16,185,129,0.8)]" style={{ width: `${leads.length ? (newOrdersCount / leads.length) * 100 : 0}%` }}></div></div></div>
                     <div><div className="flex justify-between text-[10px] font-bold text-zinc-300 mb-1.5"><span>Handoff (Routing)</span><span>{handoffCount}</span></div><div className="w-full bg-white/5 rounded-full h-2 overflow-hidden border border-white/5"><div className="bg-yellow-500 h-full rounded-full shadow-[0_0_8px_rgba(234,179,8,0.8)]" style={{ width: `${leads.length ? (handoffCount / leads.length) * 100 : 0}%` }}></div></div></div>
                     <div><div className="flex justify-between text-[10px] font-bold text-zinc-300 mb-1.5"><span>Active (In Progress)</span><span>{activeCount}</span></div><div className="w-full bg-white/5 rounded-full h-2 overflow-hidden border border-white/5"><div className="bg-sky-500 h-full rounded-full shadow-[0_0_8px_rgba(14,165,233,0.8)]" style={{ width: `${leads.length ? (activeCount / leads.length) * 100 : 0}%` }}></div></div></div>
                     <div><div className="flex justify-between text-[10px] font-bold text-zinc-300 mb-1.5"><span>Resolved (Closed)</span><span>{resolvedCount}</span></div><div className="w-full bg-white/5 rounded-full h-2 overflow-hidden border border-white/5"><div className="bg-lime-500 h-full rounded-full shadow-[0_0_8px_rgba(132,204,22,0.8)]" style={{ width: `${leads.length ? (resolvedCount / leads.length) * 100 : 0}%` }}></div></div></div>
                  </div>
               </div>
               <div className="bg-[#1F2937]/60 backdrop-blur-xl border border-white/10 rounded-2xl p-6 shadow-2xl flex flex-col">
                  <h3 className="text-xs font-bold text-white flex items-center gap-1.5 mb-6"><BarChart2 className={`w-3.5 h-3.5 ${activeTheme.text}`} /> Message Volume Split</h3>
                  <div className="flex-1 flex flex-col justify-center items-center">
                     <div className="w-full flex h-12 rounded-xl overflow-hidden border border-white/10 shadow-inner mb-5">
                        <div className="bg-amber-500 flex items-center justify-center text-[10px] font-bold text-black transition-all duration-1000" style={{ width: `${(totalSent + totalReceived) === 0 ? 50 : (totalSent / (totalSent + totalReceived)) * 100}%` }}>{totalSent > 0 && `${Math.round((totalSent / (totalSent + totalReceived)) * 100)}%`}</div>
                        <div className="bg-sky-500 flex items-center justify-center text-[10px] font-bold text-black transition-all duration-1000" style={{ width: `${(totalSent + totalReceived) === 0 ? 50 : (totalReceived / (totalSent + totalReceived)) * 100}%` }}>{totalReceived > 0 && `${Math.round((totalReceived / (totalSent + totalReceived)) * 100)}%`}</div>
                     </div>
                     <div className="flex w-full justify-around mt-2">
                        <div className="text-center"><div className="flex items-center gap-1.5 mb-1"><div className="w-2.5 h-2.5 rounded-full bg-amber-500 shadow-[0_0_8px_rgba(245,158,11,0.8)]"></div><span className="text-[9px] font-bold text-zinc-400 uppercase tracking-widest">Outbound</span></div><p className="text-2xl font-bold text-white">{totalSent}</p></div>
                        <div className="w-px bg-white/10 h-full mx-4"></div>
                        <div className="text-center"><div className="flex items-center gap-1.5 mb-1"><div className="w-2.5 h-2.5 rounded-full bg-sky-500 shadow-[0_0_8px_rgba(14,165,233,0.8)]"></div><span className="text-[9px] font-bold text-zinc-400 uppercase tracking-widest">Inbound</span></div><p className="text-2xl font-bold text-white">{totalReceived}</p></div>
                     </div>
                  </div>
               </div>
            </div>
         </div>
      </div>
    </div>
  );

  const renderSettings = () => (
    <div className="flex flex-col h-full animate-[fade-in_0.3s_ease-out]">
      <div className="h-20 flex items-center justify-between px-6 border-b border-white/10 bg-[#111827]/80 backdrop-blur-xl shrink-0">
        <div><h2 className="text-lg font-bold text-white drop-shadow-md">System Settings</h2><p className="text-[10px] text-zinc-400 font-medium tracking-wide mt-0.5">Manage your CRM integrations and workspace data</p></div>
      </div>
      <div className="flex-1 overflow-y-auto custom-scrollbar p-6">
         <div className="max-w-6xl mx-auto grid grid-cols-1 xl:grid-cols-2 gap-6">
            <div className="space-y-6">
              <div className={`bg-[#1F2937]/60 backdrop-blur-xl border ${activeTheme.border} rounded-2xl p-6 relative overflow-hidden shadow-2xl`}>
                 <div className={`absolute top-0 right-0 w-32 h-32 ${activeTheme.bgSubtle} blur-[50px] pointer-events-none`}></div>
                 <h3 className={`text-xs font-bold ${activeTheme.text} flex items-center gap-1.5 mb-5 relative z-10`}><Sparkles className="w-4 h-4" /> Workspace Branding</h3>
                 <div className="space-y-5 relative z-10">
                    <div><label className="text-[9px] font-bold text-zinc-400 uppercase tracking-widest pl-1">Company / Workspace Name</label><input type="text" value={settings.workspaceName} onChange={(e) => updateBranding(e.target.value, settings.accentColor)} placeholder="e.g. Acme Corp" className={`w-full mt-1 bg-[#111827]/80 border border-white/10 rounded-lg px-3 py-2 text-xs text-white ${activeTheme.focusBorder} outline-none transition-colors shadow-inner`} /></div>
                    <div><label className="text-[9px] font-bold text-zinc-400 uppercase tracking-widest pl-1 mb-2 block">Primary Accent Color</label>
                       <div className="flex items-center gap-3">
                          {Object.keys(BRAND_COLORS).map((colorKey) => (
                             <button key={colorKey} onClick={() => updateBranding(settings.workspaceName, colorKey)} className={`w-6 h-6 rounded-full transition-all duration-300 border-2 ${settings.accentColor === colorKey ? `border-white scale-110 shadow-[0_0_15px_${BRAND_COLORS[colorKey].bg}]` : 'border-transparent hover:scale-110 opacity-70 hover:opacity-100'} ${BRAND_COLORS[colorKey as keyof typeof BRAND_COLORS].bg}`} />
                          ))}
                       </div>
                    </div>
                 </div>
              </div>
              <div className="bg-[#1F2937]/60 backdrop-blur-xl border border-white/10 rounded-2xl p-6 shadow-2xl">
                 <h3 className="text-xs font-bold text-white flex items-center gap-1.5 mb-5"><Globe className="w-4 h-4 text-sky-400" /> API Integrations</h3>
                 <div className="space-y-4">
                    <div className="bg-[#111827]/60 rounded-xl p-4 border border-white/5 shadow-inner">
                       <div className="flex items-center justify-between mb-3"><h4 className="text-white font-bold text-xs flex items-center gap-1.5">WhatsApp / Meta API</h4><span className={`px-2.5 py-0.5 ${activeTheme.bgSubtle} ${activeTheme.text} text-[9px] font-bold uppercase rounded border ${activeTheme.border}`}>Configured</span></div>
                       <div className="space-y-3">
                          <div><label className="text-[9px] font-bold text-zinc-400 uppercase tracking-widest pl-1">Permanent Access Token</label><input type="text" value={settings.metaToken} onChange={(e) => setSettings((prev: any) => ({...prev, metaToken: e.target.value}))} placeholder="EAAGm0PX4ZCQoBO..." className={`w-full mt-1 bg-[#1F2937]/80 border border-white/10 rounded-lg px-3 py-2 text-xs text-white ${activeTheme.focusBorder} outline-none transition-colors`} /></div>
                          <div><label className="text-[9px] font-bold text-zinc-400 uppercase tracking-widest pl-1">Phone Number ID</label><input type="text" value={settings.metaPhoneId} onChange={(e) => setSettings((prev: any) => ({...prev, metaPhoneId: e.target.value}))} placeholder="e.g. 103948273948" className={`w-full mt-1 bg-[#1F2937]/80 border border-white/10 rounded-lg px-3 py-2 text-xs text-white ${activeTheme.focusBorder} outline-none transition-colors`} /></div>
                       </div>
                    </div>
                    <div className="bg-[#111827]/60 rounded-xl p-4 border border-white/5 shadow-inner">
                       <div className="flex items-center justify-between mb-3"><h4 className="text-white font-bold text-xs flex items-center gap-1.5">Shopify Store API</h4><span className={`px-2.5 py-0.5 ${activeTheme.bgSubtle} ${activeTheme.text} text-[9px] font-bold uppercase rounded border ${activeTheme.border}`}>Configured</span></div>
                       <div><label className="text-[9px] font-bold text-zinc-400 uppercase tracking-widest pl-1">Store Domain</label><input type="text" value={settings.shopifyDomain} onChange={(e) => setSettings((prev: any) => ({...prev, shopifyDomain: e.target.value}))} placeholder="my-store.myshopify.com" className={`w-full mt-1 bg-[#1F2937]/80 border border-white/10 rounded-lg px-3 py-2 text-xs text-white ${activeTheme.focusBorder} outline-none transition-colors`} /></div>
                    </div>
                    <div className="bg-[#111827]/60 rounded-xl p-4 border border-white/5 shadow-inner">
                       <div className="flex items-center justify-between mb-3"><h4 className="text-white font-bold text-xs flex items-center gap-1.5"><Link className="w-3.5 h-3.5 text-amber-400"/> Zapier / Make Webhooks</h4><span className={`px-2.5 py-0.5 text-[9px] font-bold uppercase rounded border ${settings.outboundWebhookUrl ? `${activeTheme.bgSubtle} ${activeTheme.text} ${activeTheme.border}` : 'bg-zinc-500/20 text-zinc-400 border-zinc-500/30'}`}>{settings.outboundWebhookUrl ? 'Active' : 'Inactive'}</span></div>
                       <div><label className="text-[9px] font-bold text-zinc-400 uppercase tracking-widest pl-1">Outbound Hook URL (Fires on RESOLVED)</label><input type="text" value={settings.outboundWebhookUrl} onChange={(e) => setSettings((prev: any) => ({...prev, outboundWebhookUrl: e.target.value}))} placeholder="https://hooks.zapier.com/hooks/catch/..." className="w-full mt-1 bg-[#1F2937]/80 border border-white/10 rounded-lg px-3 py-2 text-xs text-white focus:border-amber-400 outline-none transition-colors" /></div>
                    </div>
                 </div>
              </div>
            </div>
            <div className="space-y-6">
               <div className={`bg-[#1F2937]/60 backdrop-blur-xl border ${activeTheme.border} rounded-2xl p-6 shadow-[0_0_30px_rgba(16,185,129,0.05)] relative overflow-hidden`}>
                  <div className={`absolute top-0 right-0 w-32 h-32 ${activeTheme.bgSubtle} blur-[50px] pointer-events-none`}></div>
                  <h3 className={`text-xs font-bold ${activeTheme.text} flex items-center gap-1.5 mb-2 relative z-10`}><UploadCloud className="w-4 h-4" /> Database Migration</h3>
                  <p className="text-[10px] text-zinc-400 mb-4 relative z-10">Upload a CSV file containing (Phone, Name) to instantly populate your ACTIVE pipeline.</p>
                  <div className={`relative border-2 border-dashed ${activeTheme.border} bg-[#111827]/60 rounded-xl p-8 flex flex-col items-center justify-center text-center transition-all ${activeTheme.hoverBg} cursor-pointer shadow-inner`}>
                     <input type="file" accept=".csv" onChange={handleCSVUpload} disabled={isUploadingCSV} className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10" />
                     {isUploadingCSV ? ( <Loader2 className={`w-8 h-8 ${activeTheme.text} animate-spin mb-2`} /> ) : ( <FileText className={`w-8 h-8 ${activeTheme.text} opacity-70 mb-2`} /> )}
                     <span className={`text-xs font-bold ${activeTheme.text}`}>{isUploadingCSV ? "Processing Database..." : "Click or Drag CSV to Import"}</span>
                     <span className="text-[9px] text-zinc-500 mt-1">Required format: Phone Number, Full Name</span>
                  </div>
               </div>
               <div className="bg-[#1F2937]/60 backdrop-blur-xl border border-white/10 rounded-2xl p-6 shadow-2xl flex flex-col h-[380px]">
                  <h3 className="text-xs font-bold text-white flex items-center gap-1.5 mb-2"><Shield className="w-4 h-4 text-blue-400" /> Security & Audit Console</h3>
                  <p className="text-[10px] text-zinc-400 mb-4">Immutable log of system actions for accountability.</p>
                  <div className="flex-1 bg-black/60 rounded-xl border border-white/5 p-4 font-mono text-[9px] overflow-y-auto custom-scrollbar shadow-inner relative">
                     {auditLogs.length === 0 ? ( <div className="h-full flex items-center justify-center text-zinc-600">No logs recorded yet.</div> ) : (
                        <div className="space-y-3">
                           {auditLogs.map((log) => (
                              <div key={log.id} className="border-l-2 border-blue-500/50 pl-3 py-0.5">
                                 <div className="flex justify-between items-start mb-0.5"><span className="text-blue-400 font-bold uppercase tracking-wider">{log.action_type}</span><span className="text-zinc-500">{new Date(log.created_at).toLocaleString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit', second: '2-digit' })}</span></div>
                                 <p className="text-zinc-300"><span className={activeTheme.text}>{log.agent_name}</span> &mdash; {log.details}</p>
                              </div>
                           ))}
                        </div>
                     )}
                  </div>
               </div>
               <div className="bg-[#1F2937]/60 backdrop-blur-xl border border-white/10 rounded-2xl p-6 shadow-2xl">
                  <div onClick={() => setSettings((prev: any) => ({...prev, audioAlerts: !prev.audioAlerts}))} className="flex items-center justify-between p-3 bg-[#111827]/50 rounded-lg border border-white/5 hover:border-white/10 transition-colors cursor-pointer shadow-inner">
                     <div><p className="text-xs font-bold text-white flex items-center gap-1.5"><Bell className="w-3.5 h-3.5 text-amber-400"/> Audio Alerts</p><p className="text-[9px] text-zinc-400 mt-0.5">Play a sound for incoming messages</p></div>
                     <div className={`w-8 h-5 rounded-full relative transition-colors duration-300 ${settings.audioAlerts ? `${activeTheme.bg} ${activeTheme.shadow}` : 'bg-zinc-600'}`}><div className={`w-3.5 h-3.5 bg-white rounded-full absolute top-[3px] transition-all duration-300 ${settings.audioAlerts ? 'right-[3px]' : 'left-[3px]'}`}></div></div>
                  </div>
               </div>
            </div>
         </div>
      </div>
    </div>
  );

  const renderChatPane = () => (
    <div className={`fixed top-0 right-0 h-full w-full md:w-[90vw] xl:w-[1200px] bg-[#111827]/95 backdrop-blur-3xl border-l border-white/10 z-50 transform transition-transform duration-500 flex flex-row shadow-[-20px_0_50px_rgba(0,0,0,0.5)] ${selectedLead ? 'translate-x-0' : 'translate-x-full'}`}>
      {selectedLead && (
        <>
          <div className="flex-1 flex flex-col border-r border-white/10 overflow-hidden relative">
              <div className="flex items-center justify-between p-5 border-b border-white/10 shrink-0 relative overflow-hidden bg-[#1F2937]/50">
                  <div className={`absolute inset-0 bg-gradient-to-r ${activeTheme.gradient} opacity-5`}></div>
                  <div className="flex items-center gap-3 relative z-10">
                      <div className={`w-10 h-10 rounded-full bg-gradient-to-tr ${activeTheme.gradient} flex items-center justify-center ${activeTheme.shadow} text-white`}><MessageSquare className="w-4 h-4"/></div>
                      <div><h3 className="text-white font-bold text-base drop-shadow-sm">{selectedLead.full_name || selectedLead.phone_number}</h3><p className={`text-[9px] ${activeTheme.text} font-bold tracking-widest uppercase mt-0.5 flex items-center gap-1.5 drop-shadow-md`}><span className={`w-1.5 h-1.5 rounded-full ${activeTheme.bg} animate-pulse`}></span>Encrypted Connection</p></div>
                  </div>
                  <div className="flex items-center gap-2.5 relative z-10">
                      {selectedLead.status === 'NEW_ORDER' && <button onClick={() => handleTakeOver(selectedLead.id, selectedLead.phone_number)} className={`px-3 py-1.5 ${activeTheme.bgSubtle} ${activeTheme.text} border ${activeTheme.border} ${activeTheme.hoverBg} rounded-full text-[9px] font-bold uppercase transition-all shadow-sm`}>Take Over</button>}
                      <button onClick={() => handleResolveChat(selectedLead.id, selectedLead.phone_number)} className="px-3 py-1.5 bg-lime-500/20 text-lime-300 border border-lime-500/40 hover:border-lime-400 hover:bg-lime-500/30 rounded-full text-[9px] font-bold uppercase transition-all shadow-sm">Resolve</button>
                      <button onClick={() => setSelectedLead(null)} className="p-1.5 hover:bg-white/10 hover:rotate-90 rounded-full text-zinc-300 transition-all"><X className="w-4 h-4"/></button>
                  </div>
              </div>
              <div className="flex-1 overflow-y-auto p-5 flex flex-col gap-5 custom-scrollbar bg-[#0B1120]/40 shadow-inner">
                  {chatMessages.length === 0 ? <div className="flex-1 flex items-center justify-center text-zinc-500 text-[10px] font-sans tracking-widest uppercase">No customer conversation history</div> :
                      chatMessages.map((msg: any, i: number) => (
                      <div key={msg.id || i} className={`group/msg relative flex flex-col max-w-[85%] animate-[fade-in_0.3s_ease-out] ${msg.is_outbound ? 'self-end items-end' : 'self-start items-start'}`}>
                          {userRole === 'ADMIN' && <button onClick={() => handleDeleteMessage(msg.id)} className={`absolute top-1/2 -translate-y-1/2 ${msg.is_outbound ? '-left-8' : '-right-8'} opacity-0 group-hover/msg:opacity-100 p-1.5 hover:bg-red-500/20 rounded-full transition-all text-zinc-500 hover:text-red-400`}><Trash2 className="w-3 h-3" /></button>}
                          <div className={`p-3.5 rounded-2xl text-xs leading-relaxed shadow-lg backdrop-blur-md border ${msg.is_outbound ? `bg-gradient-to-br ${activeTheme.gradient} text-white rounded-br-sm border-white/20 shadow-[0_5px_20px_rgba(0,0,0,0.2)]` : 'bg-[#1F2937] text-zinc-100 rounded-bl-sm border-white/10 shadow-[0_5px_20px_rgba(0,0,0,0.2)]'}`}>{renderMessageContent(msg.content)}</div>
                          <span className={`text-[9px] font-bold tracking-widest uppercase mt-1.5 px-1 flex items-center gap-1 ${msg.is_outbound ? 'justify-end text-white/50' : 'justify-start text-zinc-500'}`}>{new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}{msg.is_outbound && <CheckCheck className={`w-3 h-3 ${msg.status === 'read' ? 'text-blue-400' : 'text-white/30'}`} />}</span>
                      </div>
                  ))}
                  <div ref={messagesEndRef} />
              </div>
              <div className="p-5 border-t border-white/10 bg-[#111827]/90 backdrop-blur-xl shrink-0">
                  {showCommandMenu && (
                    <div className="absolute bottom-[90px] left-5 mb-2 w-72 max-h-60 overflow-y-auto custom-scrollbar bg-[#1F2937]/95 backdrop-blur-xl border border-white/10 rounded-xl shadow-2xl z-50 animate-[fade-in_0.2s_ease-out]">
                      <div className="p-2.5 border-b border-white/5 bg-[#111827]/50 sticky top-0"><p className="text-[9px] font-bold text-zinc-400 uppercase tracking-widest flex items-center gap-1.5"><Zap className="w-3 h-3 text-amber-400" /> Command Engine</p></div>
                      <div className="p-1.5 flex flex-col gap-1">
                        {filteredReplies.length > 0 ? filteredReplies.map((reply: any) => (<button key={reply.id} onClick={() => insertQuickReply(reply.content)} className="flex flex-col items-start p-2.5 rounded-lg hover:bg-white/5 transition-colors border border-transparent hover:border-white/5 text-left"><span className={`text-[11px] font-bold ${activeTheme.text} mb-0.5`}>/{reply.shortcut}</span><span className="text-[10px] text-zinc-400 line-clamp-2">{reply.content}</span></button>)) : ( <div className="p-3 text-center text-[10px] text-zinc-500 font-medium">No matches.</div> )}
                      </div>
                    </div>
                  )}
                  <div className="flex gap-2 mb-2.5">
                      <button type="button" onClick={() => setIsInternal(!isInternal)} className={`text-[9px] font-bold px-3 py-1.5 rounded-full border transition-all ${isInternal ? 'bg-amber-500 text-black border-amber-500 shadow-[0_0_10px_rgba(245,158,11,0.4)]' : 'text-zinc-400 border-white/20 hover:text-amber-400 hover:border-amber-400/50 hover:bg-amber-500/10'}`}>Internal Note</button>
                      <button type="button" onClick={() => handleSendInteractive('button')} className="text-[9px] font-bold px-3 py-1.5 rounded-full border border-sky-500/50 text-sky-400 hover:bg-sky-500/10 transition-all flex items-center gap-1"><MousePointerClick className="w-2.5 h-2.5"/> Buttons</button>
                      <button type="button" onClick={() => handleSendInteractive('list')} className="text-[9px] font-bold px-3 py-1.5 rounded-full border border-purple-500/50 text-purple-400 hover:bg-purple-500/10 transition-all flex items-center gap-1"><List className="w-2.5 h-2.5"/> Menu List</button>
                  </div>
                  <form onSubmit={handleSendMessage} className="relative flex items-center group/form">
                      <input type="text" value={newMessage} onChange={handleInputChange} placeholder={isInternal ? "Add a private team memo..." : "Draft a secure message... (Type '/' for templates)"} className={`w-full bg-[#1F2937]/80 border rounded-full pl-5 pr-12 py-3 text-xs focus:outline-none text-white transition-all shadow-inner ${isInternal ? 'border-amber-500/50 focus:ring-1 focus:ring-amber-500/80 placeholder-amber-500/50' : `border-white/20 focus:ring-1 ${activeTheme.focusBorder} placeholder-zinc-400`}`} />
                      <button type="submit" disabled={!newMessage.trim()} className={`absolute right-1.5 p-2 rounded-full transition-all disabled:opacity-50 disabled:grayscale ${isInternal ? 'bg-amber-500 text-black' : `bg-gradient-to-r ${activeTheme.gradient} text-white shadow-md`}`}><Send className="w-3.5 h-3.5 ml-0.5"/></button>
                  </form>
              </div>
          </div>
          <div className="w-[300px] bg-[#111827]/90 backdrop-blur-xl border-l border-white/10 flex flex-col h-full shadow-inner shrink-0">
              <div className="flex-1 overflow-y-auto custom-scrollbar">
                  {userRole === 'ADMIN' && (
                     <div className="p-6 pb-4 border-b border-white/10 bg-[#1F2937]/30">
                        <h4 className={`text-[9px] font-bold text-white uppercase tracking-widest mb-3 flex items-center gap-1.5 drop-shadow-md`}><Tag className={`w-3.5 h-3.5 ${activeTheme.text}`}/> CRM Tags</h4>
                        <div className="flex flex-wrap gap-2">
                           {AVAILABLE_TAGS.map(tag => {
                              const isAssigned = selectedLead.tags?.includes(tag.id);
                              return <button key={tag.id} onClick={() => handleToggleTag(tag.id)} className={`text-[9px] font-bold uppercase tracking-widest px-2 py-1 rounded border transition-all ${isAssigned ? tag.color : 'text-zinc-500 border-white/10 hover:border-white/30 hover:text-zinc-300 bg-[#111827]/50'}`}>{tag.label}</button>;
                           })}
                        </div>
                     </div>
                  )}
                  <div className="p-6 pb-5 border-b border-white/10">
                      <h4 className="text-[9px] font-bold text-white uppercase tracking-widest mb-4 flex items-center gap-1.5 drop-shadow-md"><User className={`w-3.5 h-3.5 ${activeTheme.text}`}/> Identity Profile</h4>
                      <div className="space-y-3">
                          <div className="space-y-1"><label className={`text-[8px] font-bold ${activeTheme.text} uppercase tracking-widest ml-1`}>Assigned Name</label><input value={editProfile.full_name} onChange={(e) => setEditProfile({...editProfile, full_name: e.target.value})} onBlur={handleUpdateProfile} disabled={userRole !== 'ADMIN'} className={`w-full bg-[#1F2937] border border-white/10 rounded-lg px-3 py-2 text-[11px] text-white ${activeTheme.focusBorder} focus:bg-[#374151] outline-none transition-all disabled:opacity-70 shadow-inner`} placeholder="Enter Name" /></div>
                          <div className="space-y-1"><label className={`text-[8px] font-bold ${activeTheme.text} uppercase tracking-widest ml-1`}>Email Hash</label><input value={editProfile.email} onChange={(e) => setEditProfile({...editProfile, email: e.target.value})} onBlur={handleUpdateProfile} disabled={userRole !== 'ADMIN'} className={`w-full bg-[#1F2937] border border-white/10 rounded-lg px-3 py-2 text-[11px] text-white ${activeTheme.focusBorder} focus:bg-[#374151] outline-none transition-all disabled:opacity-70 shadow-inner`} placeholder="email@client.com" /></div>
                          <div className="space-y-1"><label className={`text-[8px] font-bold ${activeTheme.text} uppercase tracking-widest ml-1`}>Deep Notes</label><textarea rows={3} value={editProfile.profile_notes} onChange={(e) => setEditProfile({...editProfile, profile_notes: e.target.value})} onBlur={handleUpdateProfile} className={`w-full bg-[#1F2937] border border-white/10 rounded-lg px-3 py-2 text-[11px] text-white ${activeTheme.focusBorder} focus:bg-[#374151] outline-none resize-none custom-scrollbar transition-colors disabled:opacity-70 shadow-inner`} placeholder="Private notes..." /></div>
                      </div>
                  </div>
                  <div className="p-6 py-5 border-b border-white/10 bg-gradient-to-b from-[#111827] to-[#1F2937]/20">
                      <h4 className={`text-[9px] font-bold ${activeTheme.text} uppercase tracking-widest mb-4 flex items-center gap-1.5 drop-shadow-md`}><ShoppingBag className={`w-3.5 h-3.5 ${activeTheme.text}`}/> Live Store Sync</h4>
                      {loadingShopify ? ( <div className="p-4 bg-[#1F2937]/50 border border-white/10 rounded-lg flex items-center justify-center gap-2 text-[10px] text-zinc-400 animate-pulse shadow-inner"><Loader2 className={`w-3.5 h-3.5 animate-spin ${activeTheme.text}`} /> Fetching Shopify...</div>
                      ) : shopifyData?.found ? (
                          <div className="space-y-3 animate-[fade-in_0.4s_ease-out]">
                              <div className={`${activeTheme.bgSubtle} border ${activeTheme.border} rounded-lg p-4 shadow-sm backdrop-blur-sm`}><p className={`text-[8px] ${activeTheme.text} opacity-80 uppercase tracking-widest font-bold mb-1`}>Lifetime Value</p><p className={`text-lg font-bold ${activeTheme.text} drop-shadow-md`}>{shopifyData.totalSpent}</p></div>
                              <div className="space-y-2"><p className="text-[8px] text-zinc-400 uppercase tracking-widest font-bold mb-2 mt-1 pl-1">Recent Orders</p>
                                  {shopifyData.recentOrders.map((order: any, idx: number) => (
                                      <div key={idx} className="bg-[#1F2937] border border-white/10 rounded-lg p-2.5 flex justify-between items-center hover:bg-[#374151] transition-colors shadow-sm">
                                          <div><p className="text-[10px] font-semibold text-white mb-0.5">{order.orderName}</p><p className="text-[8px] text-zinc-400 uppercase tracking-widest">{order.date} • <span className={`${activeTheme.text} opacity-80`}>{order.fulfillmentStatus || 'UNFULFILLED'}</span></p></div>
                                          <span className={`text-[10px] font-bold ${activeTheme.text}`}>{order.total}</span>
                                      </div>
                                  ))}
                              </div>
                          </div>
                      ) : ( <div className="p-4 bg-[#1F2937]/50 border border-white/10 rounded-lg text-center shadow-inner"><p className="text-[9px] text-zinc-400 uppercase tracking-widest font-bold">No Shopify Match</p></div> )}
                  </div>
                  <div className="p-6 pt-5 min-h-[250px]">
                      <h4 className="text-[9px] font-bold text-amber-400 uppercase tracking-widest mb-3 flex items-center gap-1.5 drop-shadow-md"><StickyNote className="w-3.5 h-3.5"/> Internal Memos</h4>
                      <div className="space-y-2.5">
                          {internalMemos.length === 0 ? ( <div className="p-3 border border-white/10 rounded-lg bg-[#1F2937]/50 text-center transition-all"><p className="text-[9px] text-zinc-400 uppercase tracking-widest font-bold">No internal memos</p></div>
                          ) : (
                              internalMemos.map((memo: any, i: number) => (
                                  <div key={memo.id} className="group relative bg-amber-500/10 border border-amber-500/30 hover:border-amber-500/50 hover:bg-amber-500/20 rounded-lg p-2.5 shadow-sm backdrop-blur-sm transition-all hover:-translate-y-0.5">
                                      {userRole === 'ADMIN' && <button onClick={() => handleDeleteMemo(memo.id)} className="absolute top-1.5 right-1.5 opacity-0 group-hover:opacity-100 p-1 hover:bg-red-500/30 rounded transition-all text-amber-300 hover:text-red-300"><Trash2 className="w-3 h-3" /></button>}
                                      <p className="text-[10px] text-amber-100/90 leading-relaxed mb-1.5 pr-5 font-medium">{memo.content}</p>
                                      <span className="text-[8px] text-amber-500/50 font-bold uppercase tracking-widest block text-right">{new Date(memo.created_at).toLocaleString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}</span>
                                  </div>
                              ))
                          )}
                      </div>
                  </div>
              </div>
              {userRole === 'ADMIN' ? (
                 <div className="p-5 shrink-0 border-t border-white/10 bg-[#111827]/90 backdrop-blur-md">
                     <button type="button" onClick={handleExportPDF} className={`group relative overflow-hidden w-full flex items-center justify-center gap-1.5 py-3 bg-[#1F2937] hover:bg-emerald-500/20 border border-white/10 hover:border-emerald-400/50 rounded-xl text-[9px] font-bold uppercase tracking-widest transition-all text-zinc-300 hover:text-white hover:shadow-[0_5px_15px_rgba(16,185,129,0.2)] hover:-translate-y-0.5 active:translate-y-0`}>
                         <div className="absolute inset-0 w-[50%] h-full bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-[150%] group-hover:animate-[sweep_1.5s_ease-in-out_infinite]" />
                         <Download className="w-3.5 h-3.5 relative z-10 transition-transform duration-300 group-hover:-translate-y-0.5"/> <span className="relative z-10">Export Intelligence</span>
                     </button>
                 </div>
              ) : (
                 <div className="p-5 shrink-0 border-t border-white/10 bg-[#111827]/90 backdrop-blur-md text-center"><span className="text-[9px] font-bold text-zinc-500 uppercase tracking-widest flex justify-center items-center gap-1.5"><ShieldAlert className="w-3.5 h-3.5" /> Agent Mode Active</span></div>
              )}
          </div>
        </>
      )}
    </div>
  );

  const renderPaywall = () => {
    if (subscription.status !== 'past_due') return null;
    return (
      <div className="fixed inset-0 z-[100] bg-[#0A101C]/90 backdrop-blur-xl flex flex-col items-center justify-center p-4">
        <div className="w-full max-w-md bg-[#0F172A] border border-white/10 rounded-2xl shadow-2xl overflow-hidden animate-[fade-in_0.3s_ease-out]">
            <div className={`p-6 border-b border-white/5 bg-gradient-to-br ${activeTheme.gradient} bg-opacity-10 relative overflow-hidden`}>
              <div className="absolute top-[-50%] right-[-10%] opacity-20"><Lock className="w-48 h-48 text-white" /></div>
              <h2 className="text-2xl font-bold text-white relative z-10 drop-shadow-md">Trial Expired</h2>
              <p className="text-sm text-white/80 relative z-10 mt-1">Your 7-day free trial has ended. Select a plan to restore access to your command center.</p>
            </div>
            <div className="p-6 space-y-4">
              <div onClick={() => handleUpgrade('Pro')} className="p-5 rounded-xl border border-white/10 hover:border-emerald-500/50 bg-[#111827] cursor-pointer transition-all duration-300 hover:-translate-y-1 shadow-lg group flex items-center justify-between">
                  <div><h3 className="text-lg font-bold text-white group-hover:text-emerald-400 transition-colors">Pro Plan</h3><p className="text-[10px] text-zinc-400 mt-1">Up to 2,500 monthly messages. 1 Agent.</p></div>
                  <div className="text-right"><p className="text-xl font-black text-white">$99<span className="text-sm text-zinc-500 font-medium">/mo</span></p></div>
              </div>
              <div onClick={() => handleUpgrade('Enterprise')} className="p-5 rounded-xl border border-white/10 hover:border-blue-500/50 bg-[#111827] cursor-pointer transition-all duration-300 hover:-translate-y-1 shadow-lg group flex items-center justify-between">
                  <div><h3 className="text-lg font-bold text-white group-hover:text-blue-400 transition-colors">Enterprise</h3><p className="text-[10px] text-zinc-400 mt-1">Up to 10,000 monthly messages. Unlimited Agents.</p></div>
                  <div className="text-right"><p className="text-xl font-black text-white">$299<span className="text-sm text-zinc-500 font-medium">/mo</span></p></div>
              </div>
            </div>
            <div className="p-4 bg-[#111827] border-t border-white/5 text-center"><p className="text-[9px] text-zinc-500 font-medium uppercase tracking-widest flex items-center justify-center gap-1.5"><Shield className="w-3 h-3"/> Secure Lemon Squeezy Checkout</p></div>
        </div>
      </div>
    );
  };

  // ─── FINAL RUNTIME LAYOUT ASSEMBLY ───
  return (
    <div className={`flex h-screen w-screen text-zinc-100 font-sans relative overflow-hidden selection:bg-white/20 ${theme === 'grey' ? 'theme-grey' : theme === 'black' ? 'theme-black' : ''}`}>
      {theme === 'nebula' && <div className="fixed inset-0 -z-50 bg-[#0F172A]" />}
      {theme === 'grey' && <div className="fixed inset-0 -z-50 bg-[#1e1e24]" />}
      {theme === 'black' && <div className="fixed inset-0 -z-50 bg-black" />}
      <AnimatedStarfield />
      <NebulaBackground />

      <style dangerouslySetInnerHTML={{__html: `
        @keyframes led-breathe { 0%, 100% { box-shadow: 0 0 4px 1px rgba(255, 255, 255, 0.2); transform: scale(1); opacity: 0.8; } 50% { box-shadow: 0 0 12px 3px rgba(255, 255, 255, 0.6); transform: scale(1.1); opacity: 1; } }
        .animate-led { animation: led-breathe 3s ease-in-out infinite; }
        @keyframes sweep { 0% { transform: translateX(-100%) skewX(-15deg); } 100% { transform: translateX(200%) skewX(-15deg); } }
        @keyframes fade-in { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
        .custom-scrollbar::-webkit-scrollbar { width: 6px; height: 6px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: rgba(255, 255, 255, 0.1); border-radius: 10px; }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: rgba(255, 255, 255, 0.25); }
        .theme-grey .bg-\\[\\#111827\\]\\/80 { background-color: rgba(43, 43, 54, 0.8) !important; }
        .theme-grey .bg-\\[\\#1F2937\\]\\/70 { background-color: rgba(56, 56, 70, 0.7) !important; }
        .theme-grey .bg-\\[\\#1F2937\\]\\/60 { background-color: rgba(56, 56, 70, 0.6) !important; }
        .theme-grey .bg-\\[\\#1F2937\\]\\/80 { background-color: rgba(56, 56, 70, 0.8) !important; }
        .theme-grey .bg-\\[\\#1F2937\\]\\/95 { background-color: rgba(56, 56, 70, 0.95) !important; }
        .theme-grey .bg-\\[\\#1F2937\\] { background-color: #383846 !important; }
        .theme-black .bg-\\[\\#111827\\]\\/80 { background-color: rgba(10, 10, 10, 0.8) !important; }
        .theme-black .bg-\\[\\#1F2937\\]\\/70 { background-color: rgba(20, 20, 20, 0.7) !important; }
        .theme-black .bg-\\[\\#1F2937\\]\\/60 { background-color: rgba(20, 20, 20, 0.6) !important; }
        .theme-black .bg-\\[\\#1F2937\\]\\/80 { background-color: rgba(20, 20, 20, 0.8) !important; }
        .theme-black .bg-\\[\\#1F2937\\]\\/95 { background-color: rgba(20, 20, 20, 0.95) !important; }
        .theme-black .bg-\\[\\#1F2937\\] { background-color: #141414 !important; }
      `}} />
      
      {renderSidebar()}
      <div className="flex-1 flex flex-col h-full relative z-30 overflow-hidden">
        {(activeView === 'dashboard' || activeView === 'conversations') && renderDashboardKanban()}
        {activeView === 'billing' && userRole === 'ADMIN' && renderBilling()}
        {activeView === 'templates' && renderTemplates()}
        {activeView === 'settings' && userRole === 'ADMIN' && renderSettings()}
        {activeView === 'campaigns' && userRole === 'ADMIN' && renderCampaigns()}
        {activeView === 'analytics' && userRole === 'ADMIN' && renderAnalytics()}
      </div>
      {renderChatPane()}
      {renderPaywall()}
    </div>
  );
}