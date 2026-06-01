"use client"

import React, { useEffect, useState, useRef, useCallback, useMemo, memo } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '../../lib/supabase';
import { 
  LayoutDashboard, Inbox, Users as UsersIcon, Briefcase, Megaphone, Workflow, 
  BarChart2, UserCheck, FileText, Settings, Search, Bell, Send, 
  Bot, Star, Phone, MoreVertical, Flame, Clock, Plus, Activity, 
  CheckCircle2, TrendingUp, TrendingDown, Zap, Paperclip, User, 
  StickyNote, MessageCircle, Globe, Sun, Moon, LogOut, MessageSquare, 
  Palette, X, LayoutTemplate, Trash2, Edit2, Copy, Check, ShieldCheck, 
  ShoppingBag, CheckCheck, List, MousePointerClick, Download, CreditCard, 
  Shield, UploadCloud, Link, Calendar, Target, PieChart, Loader2, AlertTriangle, Eye, Sparkles
} from 'lucide-react';
import { jsPDF } from "jspdf";

// ─── CONSTANTS & CONFIG ───
const LEMON_SQUEEZY_LINKS: Record<string, string> = {
  'Pro': 'https://your-store.lemonsqueezy.com/checkout/buy/YOUR_PRO_VARIANT_ID',
  'Enterprise': 'https://your-store.lemonsqueezy.com/checkout/buy/YOUR_ENTERPRISE_VARIANT_ID'
};

const NAV_MENU = [
  { id: 'dashboard', icon: LayoutDashboard, label: 'Dashboard' },
  { id: 'inbox', icon: Inbox, label: 'Inbox' },
  { id: 'contacts', icon: UsersIcon, label: 'Contacts' },
  { id: 'deals', icon: Briefcase, label: 'Deals' },
  { id: 'campaigns', icon: Megaphone, label: 'Campaigns' },
  { id: 'templates', icon: LayoutTemplate, label: 'Templates' },
  { id: 'automation', icon: Workflow, label: 'Automation' },
  { id: 'analytics', icon: BarChart2, label: 'Analytics' },
  { id: 'team', icon: UserCheck, label: 'Team' },
  { id: 'reports', icon: FileText, label: 'Reports' },
  { id: 'settings', icon: Settings, label: 'Settings' }
];

const MOCK_TEAM = [
  { id: '1', name: 'Nasir Ahmed', active: 15, closed: 89, response: '45s', conv: '24%', status: 'Online' },
  { id: '2', name: 'Sarah Connor', active: 12, closed: 45, response: '1m 20s', conv: '18%', status: 'Online' },
  { id: '3', name: 'Mike Ross', active: 8, closed: 32, response: '2m 15s', conv: '14%', status: 'Away' }
];

type ThemeColor = { name: string; bg: string; text: string; grad: string; sub: string; border: string; borderActive: string; };

const THEMES: Record<string, ThemeColor> = {
  emerald: { name: 'Emerald', bg: 'bg-emerald-500', text: 'text-emerald-500', grad: 'from-emerald-400 to-teal-500', sub: 'bg-emerald-500/10', border: 'border-emerald-500/20', borderActive: 'border-emerald-500/50' },
  midnight: { name: 'Midnight', bg: 'bg-indigo-500', text: 'text-indigo-400', grad: 'from-indigo-500 to-blue-600', sub: 'bg-indigo-500/10', border: 'border-indigo-500/20', borderActive: 'border-indigo-500/50' },
  purple: { name: 'Amethyst', bg: 'bg-purple-500', text: 'text-purple-400', grad: 'from-purple-400 to-fuchsia-500', sub: 'bg-purple-500/10', border: 'border-purple-500/20', borderActive: 'border-purple-500/50' },
  rose: { name: 'Rose', bg: 'bg-rose-500', text: 'text-rose-400', grad: 'from-rose-400 to-pink-500', sub: 'bg-rose-500/10', border: 'border-rose-500/20', borderActive: 'border-rose-500/50' },
  amber: { name: 'Amber', bg: 'bg-amber-500', text: 'text-amber-500', grad: 'from-amber-400 to-orange-500', sub: 'bg-amber-500/10', border: 'border-amber-500/20', borderActive: 'border-amber-500/50' },
  charcoal: { name: 'Charcoal', bg: 'bg-slate-700', text: 'text-slate-300', grad: 'from-slate-600 to-slate-800', sub: 'bg-slate-500/10', border: 'border-slate-500/20', borderActive: 'border-slate-500/50' },
  silver: { name: 'Silver', bg: 'bg-gray-500', text: 'text-gray-400', grad: 'from-gray-400 to-gray-600', sub: 'bg-gray-500/10', border: 'border-gray-500/20', borderActive: 'border-gray-500/50' }
};

const AVAILABLE_TAGS = [
  { id: 'vip', label: 'VIP', color: 'bg-red-100 text-red-600 border-red-200 dark:bg-red-500/20 dark:text-red-400 dark:border-red-500/30' },
  { id: 'refund', label: 'Refund', color: 'bg-amber-100 text-amber-700 border-amber-200 dark:bg-amber-500/20 dark:text-amber-400 dark:border-amber-500/30' },
  { id: 'wholesale', label: 'Wholesale', color: 'bg-purple-100 text-purple-600 border-purple-200 dark:bg-purple-500/20 dark:text-purple-400 dark:border-purple-500/30' },
  { id: 'urgent', label: 'Urgent', color: 'bg-orange-100 text-orange-600 border-orange-200 dark:bg-orange-500/20 dark:text-orange-400 dark:border-orange-500/30' }
];

const COLUMN_CONFIG: Record<string, { icon: any, hex: string, label: string }> = {
  'NEW_ORDER': { icon: ShoppingBag, hex: '#10b981', label: 'New Orders' },
  'HANDOFF': { icon: UserCheck, hex: '#f59e0b', label: 'Handoffs' },
  'ACTIVE': { icon: Activity, hex: '#0ea5e9', label: 'Active Chats' },
  'RESOLVED': { icon: ShieldCheck, hex: '#84cc16', label: 'Resolved' }
};

// ─── BACKGROUND EFFECTS ───
const BgEffects = memo(({ isDark }: { isDark: boolean }) => (
  <div className={`fixed inset-0 -z-30 pointer-events-none overflow-hidden transition-colors duration-700 ${isDark ? 'bg-[#0B0F19]' : 'bg-[#f4f7f9]'}`}>
    <div className={`absolute top-[-10%] left-[-10%] w-[50vw] h-[50vw] rounded-full blur-[120px] animate-[pulse_15s_ease-in-out_infinite_alternate] ${isDark ? 'bg-blue-500/10' : 'bg-blue-200/40'}`} />
    <div className={`absolute bottom-[-10%] right-[-10%] w-[60vw] h-[60vw] rounded-full blur-[150px] animate-[pulse_20s_ease-in-out_infinite_alternate-reverse] ${isDark ? 'bg-emerald-500/10' : 'bg-purple-200/30'}`} />
    {!isDark && <div className="absolute top-[20%] right-[10%] w-[40vw] h-[40vw] rounded-full bg-emerald-200/20 blur-[100px] animate-[pulse_18s_ease-in-out_infinite_alternate]" />}
  </div>
));
BgEffects.displayName = "BgEffects";

// ─── MAIN COMPONENT ───
export default function CRMDashboard() {
  const router = useRouter();
  const [isMounted, setIsMounted] = useState(false);
  const [activeView, setActiveView] = useState('inbox'); 
  const [isDarkMode, setIsDarkMode] = useState(true);
  const [userRole, setUserRole] = useState<'ADMIN' | 'AGENT'>('ADMIN');
  
  // UI Display States
  const [showNotifications, setShowNotifications] = useState(false);
  const [showThemePicker, setShowThemePicker] = useState(false);
  
  // App State
  const [leads, setLeads] = useState<any[]>([]);
  const [messages, setMessages] = useState<any[]>([]);
  const [selectedLead, setSelectedLead] = useState<any | null>(null);
  const [chatInput, setChatInput] = useState('');
  const [globalSearch, setGlobalSearch] = useState('');
  const [chatFilter, setChatFilter] = useState('All');
  const [isInternal, setIsInternal] = useState(false);
  const [editProfile, setEditProfile] = useState({ full_name: '', email: '', profile_notes: '' });
  
  const [showTagInput, setShowTagInput] = useState(false);
  const [newTag, setNewTag] = useState('');

  const [totalSent, setTotalSent] = useState(0);
  const [totalReceived, setTotalReceived] = useState(0);

  // Tools & Modules State
  const [settings, setSettings] = useState({ 
    metaToken: '', metaPhoneId: '', shopifyDomain: '', adminName: 'Agent', adminEmail: '', 
    audioAlerts: true, outboundWebhookUrl: '', workspaceName: 'ChatRax Pro', accentColor: 'emerald' 
  });
  
  const [quickReplies, setQuickReplies] = useState<any[]>([]);
  const [showCommandMenu, setShowCommandMenu] = useState(false);
  const [commandQuery, setCommandQuery] = useState('');
  const [newShortcut, setNewShortcut] = useState('');
  const [newTemplateContent, setNewTemplateContent] = useState('');
  const [editingTemplateId, setEditingTemplateId] = useState<string | null>(null);
  const [editShortcut, setEditShortcut] = useState('');
  const [editTemplateContent, setEditTemplateContent] = useState('');
  const [copiedId, setCopiedId] = useState<string | null>(null);
  
  const [campaignName, setCampaignName] = useState('');
  const [campaignAudience, setCampaignAudience] = useState('ALL');
  const [campaignTemplateId, setCampaignTemplateId] = useState('');
  
  const [isUploadingCSV, setIsUploadingCSV] = useState(false);
  const [auditLogs, setAuditLogs] = useState<any[]>([]);
  const [subscription, setSubscription] = useState({ status: 'active', daysLeft: 7, plan: 'Pro', messageLimit: 2500 });
  const [presenceState, setPresenceState] = useState<Record<string, string[]>>({});
  
  const [now, setNow] = useState(Date.now());
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const presenceChannelRef = useRef<any>(null);
  const alertedLeadsRef = useRef<Set<string>>(new Set());

  // ─── THEME & UI ENGINE ───
  const ui = useMemo(() => ({
    bgMain: isDarkMode ? 'bg-[#0B101E]' : 'bg-slate-50',
    bgSidebar: isDarkMode ? 'bg-[#111827]' : 'bg-white',
    card: isDarkMode ? 'bg-[#1F2937] border-slate-700/50' : 'bg-white border-slate-200',
    bgCard: isDarkMode ? 'bg-[#1F2937]' : 'bg-white',
    textMain: isDarkMode ? 'text-slate-100' : 'text-slate-800',
    text: isDarkMode ? 'text-slate-100' : 'text-slate-800',
    muted: isDarkMode ? 'text-slate-400' : 'text-slate-500',
    textMuted: isDarkMode ? 'text-slate-400' : 'text-slate-500',
    border: isDarkMode ? 'border-slate-800' : 'border-slate-200',
    input: isDarkMode ? 'bg-[#111827] border-slate-700 text-slate-100 placeholder-slate-500 focus:border-slate-500' : 'bg-slate-50 border-slate-200 text-slate-800 placeholder-slate-400 focus:border-slate-400',
    hover: isDarkMode ? 'hover:bg-[#374151]' : 'hover:bg-slate-100',
    glass: isDarkMode ? 'bg-[#0f172a]/80 backdrop-blur-3xl border-slate-800' : 'bg-white/70 backdrop-blur-3xl border-white/60',
    accentText: 'text-amber-500',
    accent: 'bg-amber-500 text-slate-900',
    neonShadow: 'shadow-[0_0_15px_rgba(245,158,11,0.15)]'
  }), [isDarkMode]);

  const t = THEMES[settings.accentColor] || THEMES.emerald;
  const brandNameParts = settings.workspaceName.split(' ');
  const brandLastName = brandNameParts.length > 1 ? brandNameParts.pop() : '';
  const brandFirstName = brandNameParts.join(' ') || settings.workspaceName;

  // ─── DERIVED DATA COMPUTATIONS ───
  const chatMessages = messages.filter((m: any) => !m.is_internal);
  const internalMemos = messages.filter((m: any) => m.is_internal).sort((a,b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
  
  const filteredReplies = useMemo(() => quickReplies.filter((r: any) => r.shortcut.toLowerCase().includes(commandQuery)), [quickReplies, commandQuery]);
  
  const filteredLeads = useMemo(() => {
    if (!globalSearch) return leads; 
    const searchLower = globalSearch.toLowerCase();
    return leads.filter((l: any) => 
      (l.full_name?.toLowerCase().includes(searchLower)) || 
      (l.phone_number?.includes(searchLower)) || 
      (l.last_message?.toLowerCase().includes(searchLower))
    );
  }, [leads, globalSearch]);

  const inboxLeads = useMemo(() => {
    return filteredLeads.filter(l => {
      if (chatFilter === 'Open') return l.status === 'ACTIVE' || l.status === 'NEW_ORDER';
      if (chatFilter === 'Follow-up') return l.status === 'HANDOFF';
      if (chatFilter === 'Resolved') return l.status === 'RESOLVED';
      return true;
    });
  }, [filteredLeads, chatFilter]);

  const groupedLeads = useMemo(() => {
    const groups: Record<string, any[]> = { 'NEW_ORDER': [], 'HANDOFF': [], 'ACTIVE': [], 'RESOLVED': [] };
    for (let i = 0; i < filteredLeads.length; i++) { 
      const lead = filteredLeads[i]; 
      if (groups[lead.status]) groups[lead.status].push(lead); 
    }
    return groups;
  }, [filteredLeads]);

  const newLeads = leads.filter((l: any) => l.status === 'NEW_ORDER');
  const resolutionRate = leads.length > 0 ? Math.round(((groupedLeads['RESOLVED']?.length || 0) / leads.length) * 100) : 0;
  const totalMessagesUsed = totalSent + totalReceived;

  // ─── SUPABASE API & EFFECTS ───
  const fetchAuditLogs = async () => { 
    const { data } = await supabase.from('audit_logs').select('*').order('created_at', { ascending: false }).limit(20); 
    if (data) setAuditLogs(data); 
  };

  const logAudit = async (action: string, details: string) => { 
    try { 
      await supabase.from('audit_logs').insert({ agent_name: settings.adminName || 'System', action_type: action, details }); 
      fetchAuditLogs(); 
    } catch (err) {} 
  };

  const fetchLeads = useCallback(async () => { 
    const { data } = await supabase.from('customers').select('*').order('created_at', { ascending: false }); 
    if (data) setLeads(data); 
  }, []);

  const fetchQuickReplies = async () => { 
    const { data } = await supabase.from('quick_replies').select('*').order('created_at', { ascending: false }); 
    if (data) setQuickReplies(data); 
  };

  const fetchStats = async () => { 
    const { count: outCount } = await supabase.from('messages').select('*', { count: 'exact', head: true }).eq('is_outbound', true); 
    setTotalSent(outCount || 0); 
    const { count: inCount } = await supabase.from('messages').select('*', { count: 'exact', head: true }).eq('is_outbound', false).eq('is_internal', false); 
    setTotalReceived(inCount || 0); 
  };

  useEffect(() => {
    const init = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) router.push('/login');
      else setSettings((s: any) => ({ ...s, adminEmail: session.user.email || '', adminName: session.user.user_metadata?.full_name || 'Agent' }));
      
      const savedDark = localStorage.getItem('chatrax_darkmode'); if (savedDark) setIsDarkMode(savedDark === 'true');
      const savedTheme = localStorage.getItem('chatrax_theme'); if (savedTheme) setSettings((s: any) => ({ ...s, accentColor: savedTheme }));
      const savedBrand = localStorage.getItem('chatrax_brand'); if (savedBrand) setSettings((s: any) => ({ ...s, workspaceName: savedBrand }));
      
      setIsMounted(true);
    }; init();
  }, [router]);

  useEffect(() => {
    const timer = setInterval(() => {
      const currentNow = Date.now(); setNow(currentNow);
      if (settings.audioAlerts) {
        leads.forEach((lead: any) => {
          if (lead.status === 'NEW_ORDER' && (currentNow - new Date(lead.created_at).getTime() > 900000) && !alertedLeadsRef.current.has(lead.id)) {
            alertedLeadsRef.current.add(lead.id);
            try { 
              const ctx = new (window.AudioContext || (window as any).webkitAudioContext)(); 
              const osc = ctx.createOscillator(); 
              const gain = ctx.createGain(); 
              osc.connect(gain); gain.connect(ctx.destination); osc.type = 'triangle'; 
              osc.frequency.setValueAtTime(600, ctx.currentTime); gain.gain.setValueAtTime(0.1, ctx.currentTime); 
              gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.8); osc.start(); osc.stop(ctx.currentTime + 0.8); 
            } catch(e) {}
          }
        });
      }
    }, 5000); 
    return () => clearInterval(timer);
  }, [leads, settings.audioAlerts]);

  useEffect(() => {
    if (!settings.adminName) return;
    const channel = supabase.channel('presence', { config: { presence: { key: settings.adminName } } });
    presenceChannelRef.current = channel;
    channel.on('presence', { event: 'sync' }, () => {
      const state = channel.presenceState(); const newMap: Record<string, string[]> = {};
      Object.keys(state).forEach(k => { state[k].forEach((p: any) => { if (p.leadId) { if (!newMap[p.leadId]) newMap[p.leadId] = []; if (!newMap[p.leadId].includes(p.agentName)) newMap[p.leadId].push(p.agentName); } }); });
      setPresenceState(newMap);
    });
    channel.subscribe(async (status) => { if (status === 'SUBSCRIBED') await channel.track({ agentName: settings.adminName, leadId: selectedLead?.id || null }); });
    return () => { supabase.removeChannel(channel); };
  }, [settings.adminName, selectedLead]);

  useEffect(() => { messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [messages]);

  useEffect(() => {
    fetchLeads(); fetchStats(); fetchQuickReplies(); fetchAuditLogs();
    const sub = supabase.channel('realtime').on('postgres_changes', { event: '*', schema: 'public', table: 'customers' }, (p: any) => {
        if (p.eventType === 'INSERT') setLeads((pr: any[]) => pr.find((l: any) => l.id === p.new.id) ? pr : [p.new, ...pr]);
        else if (p.eventType === 'UPDATE') setLeads((pr: any[]) => pr.map((l: any) => l.id === p.new.id ? p.new : l));
        else if (p.eventType === 'DELETE') setLeads((pr: any[]) => pr.filter((l: any) => l.id !== p.old.id));
    }).subscribe(); 
    return () => { supabase.removeChannel(sub); };
  }, [fetchLeads]);

  useEffect(() => {
    if (!selectedLead) return;
    setEditProfile({ full_name: selectedLead.full_name || '', email: selectedLead.email || '', profile_notes: selectedLead.profile_notes || '' });
    const getChat = async () => { 
      const { data } = await supabase.from('messages').select('*').eq('customer_id', selectedLead.id).order('created_at', { ascending: true }); 
      if (data) setMessages(data); 
    }; getChat();

    const msgSub = supabase.channel('msgs').on('postgres_changes', { event: '*', schema: 'public', table: 'messages' }, (p: any) => {
       if(p.eventType === 'INSERT' && p.new.customer_id === selectedLead.id) {
         setMessages((pr: any[]) => [...pr, p.new]);
         if (p.new.is_outbound) setTotalSent((pr: number) => pr + 1); else if (!p.new.is_internal) setTotalReceived((pr: number) => pr + 1);
       }
       if(p.eventType === 'UPDATE' && p.new.customer_id === selectedLead.id) { setMessages((pr: any[]) => pr.map((m: any) => m.id === p.new.id ? p.new : m)); }
    }).subscribe(); 
    return () => { supabase.removeChannel(msgSub); };
  }, [selectedLead?.id]);

  // ─── HANDLERS ───
  const handleCSVUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]; if (!file) return; setIsUploadingCSV(true); const reader = new FileReader();
    reader.onload = async (ev) => { 
      try { 
        const rows = (ev.target?.result as string).split('\n'); const nL = []; 
        for (let i = 1; i < rows.length; i++) { 
          const cols = rows[i].split(','); 
          if (cols.length >= 1 && cols[0].trim()) { let phone = cols[0].replace(/\D/g, ''); if (phone) nL.push({ phone_number: phone, full_name: cols[1]?.trim() || 'Imported Contact', status: 'ACTIVE', last_message: '' }); } 
        } 
        if (nL.length > 0) { await supabase.from('customers').insert(nL); logAudit('SYSTEM_MIGRATION', `Imported ${nL.length} leads via CSV.`); fetchLeads(); alert(`Imported ${nL.length} leads.`); } 
      } catch (err) { alert("Failed CSV parse."); } 
      setIsUploadingCSV(false); e.target.value = ''; 
    }; reader.readAsText(file);
  };

  const handleChatInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setChatInput(e.target.value);
    const lastWord = e.target.value.split(' ').pop() || '';
    if (lastWord.startsWith('/')) { setShowCommandMenu(true); setCommandQuery(lastWord.substring(1).toLowerCase()); } 
    else { setShowCommandMenu(false); }
  };

  const handleSendMessage = async (e: React.FormEvent) => { 
    e.preventDefault(); if (!chatInput.trim() || !selectedLead) return; 
    const content = chatInput; const isInt = isInternal; setChatInput(''); setIsInternal(false); setShowCommandMenu(false); 
    try { 
      await supabase.from('messages').insert({ customer_id: selectedLead.id, content, is_outbound: true, is_internal: isInt, status: 'sent' }); 
      if (selectedLead.status === 'NEW_ORDER') { 
        await supabase.from('customers').update({ status: 'ACTIVE', last_message: content }).eq('id', selectedLead.id); 
        setLeads((pr: any[]) => pr.map(l => l.id === selectedLead.id ? { ...l, status: 'ACTIVE', last_message: content } : l)); 
        setSelectedLead((pr: any) => pr ? { ...pr, status: 'ACTIVE', last_message: content } : null); 
      } else {
        await supabase.from('customers').update({ last_message: content }).eq('id', selectedLead.id); 
        setLeads((pr: any[]) => pr.map(l => l.id === selectedLead.id ? { ...l, last_message: content } : l)); 
      }
      logAudit(isInt ? 'INTERNAL_NOTE' : 'MESSAGE_SENT', `To: +${selectedLead.phone_number}`);
      if (!isInt) await fetch('/api/send', { method: 'POST', body: JSON.stringify({ to: selectedLead.phone_number, message: content }) }); 
    } catch (err) {} 
  };
  
  const handleDeleteMessage = async (msgId: string) => { 
    if (!window.confirm("Delete this message?")) return; 
    try { 
      await supabase.from('messages').delete().eq('id', msgId); 
      setMessages((pr: any[]) => pr.filter(m => m.id !== msgId)); 
      logAudit('MESSAGE_DELETED', `Deleted a message for +${selectedLead.phone_number}`);
    } catch (err) {} 
  };

  const handleAddTemplate = async (e: React.FormEvent) => { 
    e.preventDefault(); if (!newShortcut.trim() || !newTemplateContent.trim()) return; 
    try { 
      const clean = newShortcut.replace('/', '').trim().toLowerCase(); 
      const { data, error } = await supabase.from('quick_replies').insert([{ shortcut: clean, content: newTemplateContent.trim() }]).select(); 
      if (!error && data) { setQuickReplies((pr: any[]) => [data[0], ...pr]); setNewShortcut(''); setNewTemplateContent(''); logAudit('TEMPLATE_CREATED', `Created /${clean}`); } 
    } catch (err) {} 
  };

  const handleUpdateTemplate = async (id: string) => { 
    if (!editShortcut.trim() || !editTemplateContent.trim()) return; 
    try { 
      const clean = editShortcut.replace('/', '').trim().toLowerCase(); 
      const { error } = await supabase.from('quick_replies').update({ shortcut: clean, content: editTemplateContent.trim() }).eq('id', id); 
      if (!error) { setQuickReplies((pr: any[]) => pr.map((q: any) => q.id === id ? { ...q, shortcut: clean, content: editTemplateContent.trim() } : q)); setEditingTemplateId(null); logAudit('TEMPLATE_UPDATED', `Updated /${clean}`); } 
    } catch (err) {} 
  };

  const handleDeleteTemplate = async (id: string) => { 
    if (!window.confirm("Delete template?")) return; 
    try { await supabase.from('quick_replies').delete().eq('id', id); setQuickReplies((pr: any[]) => pr.filter((q: any) => q.id !== id)); logAudit('TEMPLATE_DELETED', `Deleted a template.`); } catch (err) {} 
  };

  const handleLaunchCampaign = async (e: React.FormEvent) => { 
    e.preventDefault(); if (!campaignName || !campaignTemplateId) { alert("Fill all details."); return; } 
    if (!window.confirm(`Launch broadcast?`)) return; 
    try { 
      const res = await fetch('/api/campaign', { method: 'POST', body: JSON.stringify({ campaignName, audience: campaignAudience, templateId: campaignTemplateId }) }); 
      const data = await res.json(); 
      if (data.success) { alert(`Broadcast Complete!`); setCampaignName(''); setCampaignTemplateId(''); logAudit('CAMPAIGN', `Launched ${campaignName}`); } 
      else alert(`Error: ${data.error}`); 
    } catch (err) {} 
  };

  const handleAddTagSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTag.trim()) { setShowTagInput(false); return; }
    let nT = [...(selectedLead.tags||[])];
    if (!nT.includes(newTag.trim().toLowerCase())) {
       nT.push(newTag.trim().toLowerCase());
       setSelectedLead((pr:any)=>({...pr,tags:nT}));
       setLeads((pr:any[])=>pr.map(l=>l.id===selectedLead.id?{...l,tags:nT}:l));
       await supabase.from('customers').update({tags:nT}).eq('id',selectedLead.id);
       logAudit('TAG_ADDED', `Added tag '${newTag}' to +${selectedLead.phone_number}`);
    }
    setNewTag('');
    setShowTagInput(false);
  };

  if (!isMounted) return null;

  // ─── MAIN RETURN (FULLY FLATTENED) ───
  return (
    <div className={`flex h-screen w-screen font-sans ${ui.bgMain} overflow-hidden selection:bg-amber-500/30 transition-colors duration-500`}>
      
      {/* Background & Scrolbar Overrides */}
      <BgEffects isDark={isDarkMode} />
      <style dangerouslySetInnerHTML={{__html: `
        .hover-scroll::-webkit-scrollbar { width: 0px; height: 0px; background: transparent; transition: all 0.3s; }
        .hover-scroll:hover::-webkit-scrollbar { width: 6px; height: 6px; }
        .hover-scroll::-webkit-scrollbar-thumb { background: transparent; border-radius: 10px; }
        .hover-scroll:hover::-webkit-scrollbar-thumb { background: rgba(156, 163, 175, 0.4); } 
        .custom-scrollbar::-webkit-scrollbar { width: 6px; height: 6px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: rgba(251, 191, 36, 0.4); border-radius: 10px; }
        .hide-scrollbar::-webkit-scrollbar { display: none; }
      `}} />

      {/* ─── SIDEBAR ─── */}
      <div className={`w-[240px] m-4 mr-0 rounded-2xl ${ui.bgSidebar} border ${ui.border} flex flex-col z-40 shadow-xl shrink-0 transition-colors duration-300`}>
        <div className={`h-20 flex items-center px-6 shrink-0 border-b ${ui.border}`}>
          <h1 className={`text-2xl font-black tracking-tight ${ui.textMain} flex items-center gap-2`}>
            <MessageSquare className={`w-6 h-6 ${t.text}`} /> 
            <span className="truncate">{brandFirstName} <span className={t.text}>{brandLastName}</span></span>
          </h1>
        </div>
        <div className="flex-1 py-6 px-4 space-y-1 overflow-y-auto hover-scroll">
          <p className={`text-[10px] font-bold uppercase tracking-widest ${ui.textMuted} px-3 mb-3 mt-2`}>Main Menu</p>
          {NAV_MENU.slice(0, 6).map((item) => (
            <button key={item.id} onClick={() => { setActiveView(item.id); if (item.id === 'inbox') setSelectedLead(null); }} className={`w-full flex items-center justify-between px-4 py-3 rounded-xl transition-all duration-300 font-bold text-xs ${activeView === item.id ? `${t.bg} text-white shadow-md` : `${ui.textMuted} ${ui.hover}`}`}>
               <div className="flex items-center gap-3"><item.icon className={`w-4 h-4 ${activeView === item.id ? '' : 'opacity-70'}`} /> {item.label}</div>
               {item.id === 'inbox' && <span className={`text-[9px] px-2 py-0.5 rounded-md ${activeView === item.id ? 'bg-white/20 text-white' : 'bg-slate-200 dark:bg-slate-800 text-amber-500'} font-black`}>{leads.filter(l=>l.status!=='RESOLVED').length}</span>}
            </button>
          ))}
          <p className={`text-[10px] font-bold uppercase tracking-widest ${ui.textMuted} px-3 mb-3 mt-6`}>Management</p>
          {NAV_MENU.slice(6).map((item) => (
            <button key={item.id} onClick={() => { setActiveView(item.id); if (item.id === 'inbox') setSelectedLead(null); }} className={`w-full flex items-center justify-between px-4 py-3 rounded-xl transition-all duration-300 font-bold text-xs ${activeView === item.id ? `${t.bg} text-white shadow-md` : `${ui.textMuted} ${ui.hover}`}`}>
               <div className="flex items-center gap-3"><item.icon className={`w-4 h-4 ${activeView === item.id ? '' : 'opacity-70'}`} /> {item.label}</div>
            </button>
          ))}
        </div>
        <div className={`p-4 border-t ${ui.border}`}>
          <div className={`flex items-center justify-between p-3 rounded-xl ${ui.card} border ${ui.border} transition-colors`}>
             <div className="flex items-center gap-3 overflow-hidden">
                <div className={`w-8 h-8 shrink-0 rounded-full ${t.bg} text-white flex items-center justify-center font-bold text-xs`}>{settings.adminName.charAt(0)}</div>
                <div className="overflow-hidden"><p className={`text-xs font-bold ${ui.textMain} truncate`}>{settings.adminName}</p><p className={`text-[9px] ${t.text} uppercase tracking-widest mt-0.5`}>{userRole}</p></div>
             </div>
             <button onClick={async () => { if (window.confirm("End session?")) { await supabase.auth.signOut(); router.push('/login'); } }} className={`p-1.5 rounded-lg ${ui.textMuted} hover:text-red-500 hover:bg-red-500/10 transition-colors`}><LogOut className="w-4 h-4"/></button>
          </div>
        </div>
      </div>

      {/* ─── DYNAMIC CONTENT AREA ─── */}
      <div className="flex-1 flex flex-col h-full overflow-hidden p-4 pb-4">
        
        {/* TOP HEADER (Fixed Z-Index & Dropdowns) */}
        <div className={`relative z-50 h-16 mb-4 rounded-2xl ${ui.card} border ${ui.border} flex items-center justify-between px-6 shrink-0 shadow-sm transition-colors duration-300`}>
           <h2 className={`text-lg font-bold ${ui.textMain} capitalize`}>{activeView}</h2>
           <div className="flex items-center gap-2">
              <div className="relative">
                 <button onClick={() => setShowThemePicker(!showThemePicker)} className={`p-2 rounded-full ${ui.textMuted} ${ui.hover} transition-colors`}><Palette className="w-4 h-4" /></button>
                 {showThemePicker && (
                   <div className={`absolute top-full mt-2 right-0 ${ui.card} border ${ui.border} rounded-2xl p-4 shadow-2xl z-[100] flex gap-3`}>
                     {Object.keys(THEMES).map(k => ( <button key={k} onClick={() => { setSettings((s: any) => ({ ...s, accentColor: k })); localStorage.setItem('chatrax_theme', k); setShowThemePicker(false); }} className={`w-6 h-6 rounded-full shadow-sm hover:scale-110 transition-transform ${THEMES[k].bg} ${settings.accentColor === k ? 'ring-2 ring-white ring-offset-2 ring-offset-slate-900' : ''}`} title={THEMES[k].name} /> ))}
                   </div>
                 )}
              </div>
              <button onClick={() => { const n = !isDarkMode; setIsDarkMode(n); localStorage.setItem('chatrax_darkmode', String(n)); }} className={`p-2 rounded-full ${ui.textMuted} ${ui.hover} transition-colors`}>{isDarkMode ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}</button>
              <div className="relative">
                <button onClick={() => setShowNotifications(!showNotifications)} className={`p-2 rounded-full ${ui.textMuted} ${ui.hover} relative transition-colors`}>
                  <Bell className="w-4 h-4" />
                  {newLeads.length > 0 && <span className="absolute top-1.5 right-2 w-2 h-2 bg-red-500 rounded-full border border-[#1F2937]"></span>}
                </button>
                {showNotifications && (
                   <div className={`absolute top-full mt-2 right-0 w-72 ${ui.card} border ${ui.border} rounded-2xl p-2 shadow-2xl z-[100]`}>
                     <div className={`p-3 border-b ${ui.border}`}><p className={`text-xs font-bold ${ui.textMain}`}>Recent Alerts</p></div>
                     <div className="max-h-60 overflow-y-auto hover-scroll p-1">
                        {newLeads.length === 0 ? <p className={`p-4 text-center text-xs ${ui.textMuted}`}>All caught up!</p> : newLeads.slice(0,5).map((l: any) => (
                          <div key={l.id} onClick={() => { setSelectedLead(l); setActiveView('inbox'); setShowNotifications(false); }} className={`p-3 rounded-xl ${ui.hover} cursor-pointer flex flex-col gap-1`}>
                            <p className={`text-xs font-bold ${ui.textMain}`}>{l.full_name || l.phone_number}</p>
                            <p className={`text-[10px] ${ui.textMuted} truncate`}>New inbound message waiting.</p>
                          </div>
                        ))}
                     </div>
                   </div>
                )}
              </div>
           </div>
        </div>

        {/* INLINED VIEW ROUTER TO PREVENT COMPONENT RECREATION & FOCUS LOSS */}
        <div className="flex-1 overflow-hidden relative z-0">
          
          {/* DASHBOARD */}
          {activeView === 'dashboard' && (
            <div className="flex flex-col h-full animate-[fade-in_0.3s_ease-out] mr-4 mb-4 mt-6">
              <div className={`${ui.glass} rounded-3xl p-8 shadow-sm h-full flex flex-col transition-colors duration-300`}>
                <div className="flex items-center justify-between mb-8 shrink-0">
                  <div>
                    <h2 className={`text-xl font-bold ${ui.textMain} tracking-tight mb-2`}>Welcome, {settings.adminName.split(' ')[0]} 👋</h2>
                    <p className={`text-[11px] ${ui.textMuted} font-medium`}>Here's what happening today.</p>
                  </div>
                </div>
                <div className="flex-1 overflow-y-auto custom-scrollbar pr-2 space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                    {[
                      { label: 'Total Conversations', value: leads.length.toString(), icon: MessageSquare, trend: '+12%', up: true },
                      { label: 'New Leads Today', value: newLeads.length.toString(), icon: Zap, trend: '+5%', up: true },
                      { label: 'Avg Response Time', value: '1m 12s', icon: Clock, trend: '-18s', up: true },
                      { label: 'Conversion Rate', value: '18.4%', icon: TrendingUp, trend: '+2.1%', up: true }
                    ].map((stat, i) => (
                      <div key={i} className={`${ui.card} p-6 rounded-2xl border ${ui.border} relative overflow-hidden shadow-sm`}>
                        <div className={`absolute top-0 right-0 p-4 opacity-10 ${t.text}`}><stat.icon className="w-16 h-16" /></div>
                        <p className={`text-xs font-bold uppercase tracking-widest ${ui.textMuted} mb-2`}>{stat.label}</p>
                        <h3 className={`text-3xl font-black ${ui.textMain} mb-2`}>{stat.value}</h3>
                        <p className={`text-xs font-bold ${stat.up ? 'text-emerald-500' : 'text-rose-500'} flex items-center gap-1`}><TrendingUp className="w-3 h-3"/> {stat.trend}</p>
                      </div>
                    ))}
                  </div>
                  <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    <div className={`lg:col-span-2 ${ui.card} p-6 rounded-2xl border ${ui.border} min-h-[400px] flex flex-col shadow-sm`}>
                      <h3 className={`text-sm font-bold ${ui.textMain} mb-6 flex items-center gap-2`}><Activity className="w-4 h-4"/> Chat Volume Trend</h3>
                      <div className={`flex-1 flex items-end justify-between gap-2 border-b ${ui.border} pb-4`}>
                        {[40, 70, 45, 90, 65, 100, 85].map((h, i) => (
                          <div key={i} className={`w-full ${isDarkMode?'bg-slate-800':'bg-slate-200'} rounded-t-md relative group transition-colors`} style={{ height: `${h}%` }}>
                            <div className={`absolute bottom-0 w-full rounded-t-md bg-gradient-to-t ${t.grad} transition-all opacity-80 group-hover:opacity-100`} style={{ height: `${h * 0.7}%` }}></div>
                          </div>
                        ))}
                      </div>
                      <div className={`flex justify-between mt-4 text-xs font-bold ${ui.textMuted}`}><span>Mon</span><span>Tue</span><span>Wed</span><span>Thu</span><span>Fri</span><span>Sat</span><span>Sun</span></div>
                    </div>
                    <div className={`${ui.card} p-6 rounded-2xl border ${ui.border} flex flex-col shadow-sm`}>
                      <h3 className={`text-sm font-bold ${ui.textMain} mb-6 flex items-center gap-2`}><UserCheck className="w-4 h-4"/> Team Performance</h3>
                      <div className="space-y-4">
                        {MOCK_TEAM.map((m: any) => (
                          <div key={m.id} className={`p-4 rounded-xl border ${ui.border} ${ui.bgMain} flex items-center justify-between`}>
                            <div className="flex items-center gap-3">
                              <div className="relative">
                                <div className={`w-8 h-8 rounded-full ${t.bg} text-white flex items-center justify-center font-bold text-xs`}>{m.name.charAt(0)}</div>
                                <span className={`absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full border-2 ${ui.border} ${m.status === 'Online' ? 'bg-emerald-500' : 'bg-amber-500'}`}></span>
                              </div>
                              <div><p className={`text-xs font-bold ${ui.textMain}`}>{m.name}</p><p className={`text-[10px] ${ui.textMuted}`}>{m.active} active chats</p></div>
                            </div>
                            <div className="text-right"><p className={`text-xs font-bold ${ui.textMain}`}>{m.conv}</p><p className={`text-[9px] ${ui.textMuted} uppercase tracking-widest`}>Conv Rate</p></div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* INBOX (The 3-Pane View) */}
          {activeView === 'inbox' && (
            <div className="flex h-full overflow-hidden animate-[fade-in_0.3s_ease-out] relative">
              
              {/* 1. CONTACT LIST (Left Pane) */}
              <div className={`w-full md:w-80 flex flex-col ${ui.bgSidebar} border-r ${ui.border} shrink-0 h-full`}>
                <div className={`p-4 border-b ${ui.border}`}>
                  <div className="relative mb-3">
                    <Search className={`absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 ${ui.textMuted}`} />
                    <input type="text" placeholder="Search messages..." value={globalSearch} onChange={e=>setGlobalSearch(e.target.value)} className={`w-full ${ui.input} text-sm rounded-xl pl-9 pr-4 py-2.5 outline-none transition-colors focus:border-amber-400`} />
                  </div>
                  <div className="flex gap-2 overflow-x-auto hide-scrollbar pb-1">
                    {['All', 'Open', 'Follow-up', 'Resolved'].map(f => (
                      <button key={f} onClick={() => setChatFilter(f)} className={`whitespace-nowrap px-3 py-1.5 rounded-lg text-[10px] font-bold tracking-wider uppercase border ${chatFilter === f ? `${t.bg} text-white border-transparent shadow-sm` : `bg-transparent ${ui.textMuted} ${ui.border} ${ui.hover}`}`}>{f}</button>
                    ))}
                  </div>
                </div>
                <div className="flex-1 overflow-y-auto hover-scroll">
                  {inboxLeads.map((contact: any) => (
                    <div key={contact.id} onClick={() => setSelectedLead(contact)} className={`p-4 border-b ${ui.border} cursor-pointer transition-colors ${selectedLead?.id === contact.id ? (isDarkMode ? 'bg-slate-800' : 'bg-slate-100') : ui.hover}`}>
                      <div className="flex justify-between items-start mb-1">
                        <span className={`text-sm font-bold ${ui.textMain} truncate pr-2`}>{contact.full_name || contact.phone_number}</span>
                        <span className={`text-[9px] ${ui.textMuted} shrink-0`}>{new Date(contact.created_at).toLocaleTimeString([],{hour:'2-digit',minute:'2-digit'})}</span>
                      </div>
                      <p className={`text-[11px] ${ui.textMuted} truncate mb-2`}>{contact.last_message || 'No recent messages'}</p>
                      <div className="flex items-center gap-2">
                        <span className={`text-[9px] font-bold px-2 py-0.5 rounded-md ${contact.status === 'ACTIVE' ? 'bg-sky-500/10 text-sky-500' : contact.status === 'NEW_ORDER' ? 'bg-emerald-500/10 text-emerald-500' : 'bg-slate-500/10 text-slate-500'}`}>{contact.status.replace('_', ' ')}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* CLICK-OUTSIDE BACKDROP FOR MOBILE */}
              {selectedLead && (
                <div className="fixed inset-0 z-40 bg-slate-900/40 backdrop-blur-sm lg:hidden" onClick={() => setSelectedLead(null)} />
              )}

              {/* 2 & 3. CHAT WINDOW & PROFILE (Center & Right Pane) */}
              <div className={`absolute lg:relative right-0 top-0 bottom-0 z-50 flex h-full w-[95vw] lg:w-auto lg:flex-1 transform transition-transform duration-500 ${selectedLead ? 'translate-x-0' : 'translate-x-full lg:translate-x-0'} ${ui.bgMain}`}>
                {selectedLead ? (
                  <>
                    {/* CENTER: CHAT WINDOW */}
                    <div className={`flex-1 flex flex-col ${ui.bgMain} relative`}>
                      <div className={`p-4 border-b ${ui.border} flex justify-between items-center ${ui.bgSidebar}`}>
                        <div className="flex items-center gap-3">
                          <div className={`w-10 h-10 rounded-full ${t.bg} text-white flex items-center justify-center font-bold`}>{selectedLead.full_name?.charAt(0) || <User className="w-5 h-5"/>}</div>
                          <div>
                            <h3 className={`text-sm font-bold ${ui.textMain}`}>{selectedLead.full_name || 'Unknown Contact'}</h3>
                            <p className={`text-[10px] ${ui.textMuted} font-mono tracking-wider`}>+{selectedLead.phone_number}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          {selectedLead.status === 'NEW_ORDER' && <button onClick={async () => { await supabase.from('customers').update({status:'ACTIVE'}).eq('id',selectedLead.id); setLeads((pr:any[])=>pr.map(l=>l.id===selectedLead.id?{...l,status:'ACTIVE'}:l)); setSelectedLead((pr:any)=>pr?{...pr,status:'ACTIVE'}:null); logAudit('TAKEOVER', `Agent took over chat +${selectedLead.phone_number}`); }} className={`px-3 py-1.5 rounded-lg border border-sky-500/30 text-sky-500 hover:bg-sky-500/10 text-xs font-bold flex items-center gap-1.5 transition-colors`}><CheckCircle2 className="w-4 h-4" /> Take Over</button>}
                          <button onClick={async () => { await supabase.from('customers').update({status:'RESOLVED'}).eq('id',selectedLead.id); setLeads((pr:any[])=>pr.map(l=>l.id===selectedLead.id?{...l,status:'RESOLVED'}:l)); setSelectedLead(null); logAudit('RESOLVED', `Chat resolved +${selectedLead.phone_number}`); }} className={`px-3 py-1.5 rounded-lg border border-emerald-500/30 text-emerald-500 hover:bg-emerald-500/10 text-xs font-bold flex items-center gap-1.5 transition-colors`}><CheckCircle2 className="w-4 h-4" /> Resolve</button>
                          <button onClick={() => setSelectedLead(null)} className={`p-2 rounded-lg border ${ui.border} ${ui.textMuted} ${ui.hover} lg:hidden`}><X className="w-4 h-4" /></button>
                        </div>
                      </div>
                      
                      <div className={`flex-1 p-6 overflow-y-auto hover-scroll flex flex-col gap-4 ${ui.bgMain}`}>
                        {chatMessages.length === 0 ? <div className={`flex-1 flex items-center justify-center text-xs font-bold tracking-widest uppercase ${ui.textMuted}`}>Start the conversation</div> : 
                         chatMessages.map((msg: any) => (
                          <div key={msg.id} className={`group/msg relative flex flex-col max-w-[75%] ${msg.is_outbound ? 'self-end items-end' : 'self-start items-start'}`}>
                            {userRole === 'ADMIN' && <button onClick={() => handleDeleteMessage(msg.id)} className={`absolute top-1/2 -translate-y-1/2 ${msg.is_outbound ? '-left-12' : '-right-12'} opacity-0 group-hover/msg:opacity-100 p-2 rounded-xl transition-all ${isDarkMode ? 'hover:bg-red-500/20 text-slate-400 hover:text-red-400' : 'hover:bg-red-50 text-slate-400 hover:text-red-500'}`}><Trash2 className="w-4 h-4" /></button>}
                            <div className={`p-3.5 rounded-2xl text-[13px] leading-relaxed shadow-sm ${msg.is_outbound ? `${t.bg} text-white rounded-br-sm` : `${ui.card} ${ui.textMain} border ${ui.border} rounded-bl-sm`}`}>
                              {msg.content.startsWith('MEDIA::') ? <img src={`/api/media?id=${msg.content.split('::')[2]}`} className={`max-w-[200px] rounded-2xl shadow-sm border ${isDarkMode ? 'border-slate-700' : 'border-slate-200'}`} /> : msg.content}
                            </div>
                            <span className={`text-[9px] font-bold uppercase tracking-widest mt-1.5 px-1 ${ui.textMuted}`}>{new Date(msg.created_at).toLocaleTimeString([],{hour:'2-digit',minute:'2-digit'})} {msg.is_outbound && <CheckCheck className={`w-3 h-3 inline ml-1 ${msg.status === 'read' ? 'text-blue-500' : ui.textMuted}`} />}</span>
                          </div>
                        ))}
                        <div ref={messagesEndRef} />
                      </div>

                      <div className={`p-4 ${ui.bgSidebar} border-t ${ui.border}`}>
                        {showCommandMenu && (
                          <div className={`absolute bottom-[100px] left-6 mb-2 w-80 max-h-60 overflow-y-auto hover-scroll ${ui.glass} border ${ui.border} rounded-2xl shadow-2xl z-50 animate-[fade-in_0.2s_ease-out]`}>
                            <div className={`p-3 border-b ${ui.border} sticky top-0`}><p className={`text-[10px] font-bold ${ui.textMuted} uppercase tracking-widest flex items-center gap-2`}><Zap className="w-3.5 h-3.5 text-amber-500" /> Command Engine</p></div>
                            <div className="p-2 flex flex-col gap-1">
                              {filteredReplies.length > 0 ? filteredReplies.map((reply: any) => (<button key={reply.id} type="button" onClick={() => { const w = chatInput.split(' '); w.pop(); setChatInput((w.join(' ') + (w.length>0?' ':'') + reply.content + ' ').trimStart()); setShowCommandMenu(false); }} className={`flex flex-col items-start p-3 rounded-xl transition-colors border border-transparent text-left ${ui.hover}`}><span className={`text-xs font-bold ${ui.textMain} mb-1`}>/{reply.shortcut}</span><span className={`text-[11px] ${ui.textMuted} line-clamp-2`}>{reply.content}</span></button>)) : ( <div className={`p-4 text-center text-xs ${ui.textMuted} font-medium`}>No matches.</div> )}
                            </div>
                          </div>
                        )}
                        <div className="flex items-center gap-2 mb-3">
                          <button onClick={()=>setIsInternal(!isInternal)} className={`text-[10px] font-bold px-3 py-1.5 rounded-md border transition-colors flex items-center gap-1 ${isInternal ? 'bg-amber-500/20 border-amber-500/40 text-amber-500' : `${ui.border} ${ui.textMuted} ${ui.hover}`}`}><StickyNote className="w-3 h-3"/> Internal Note</button>
                          <button onClick={async () => { const payload = { type: "button", body: { text: "Hi! How can we assist?" }, action: { buttons: [ { type: "reply", reply: { id: "btn_sales", title: "Sales" } }, { type: "reply", reply: { id: "btn_support", title: "Support" } } ] } }; await supabase.from('messages').insert({ customer_id: selectedLead.id, content: "🔘 [Sent Buttons]", is_outbound: true, is_internal: false, status: 'sent' }); await fetch('/api/send', { method: 'POST', body: JSON.stringify({ to: selectedLead.phone_number, type: 'interactive', interactive: payload }) }); logAudit('INTERACTIVE_SENT', `Sent buttons to +${selectedLead.phone_number}`); }} className={`text-[10px] font-bold px-3 py-1.5 rounded-md border transition-colors flex items-center gap-1 ${isDarkMode ? 'border-sky-500/30 text-sky-400 hover:bg-sky-500/10' : 'border-sky-200 text-sky-600 hover:bg-sky-50'}`}><MousePointerClick className="w-3 h-3"/> Buttons</button>
                          <button onClick={async () => { const payload = { type: "list", header: { type: "text", text: "Main Menu" }, body: { text: "Select an option:" }, footer: { text: "ChatRax Pro" }, action: { button: "Options", sections: [ { title: "Help", rows: [ { id: "track", title: "Track Order", description: "Status" }, { id: "return", title: "Returns", description: "Process return" } ] } ] } }; await supabase.from('messages').insert({ customer_id: selectedLead.id, content: "📋 [Sent Menu]", is_outbound: true, is_internal: false, status: 'sent' }); await fetch('/api/send', { method: 'POST', body: JSON.stringify({ to: selectedLead.phone_number, type: 'interactive', interactive: payload }) }); logAudit('INTERACTIVE_SENT', `Sent menu to +${selectedLead.phone_number}`); }} className={`text-[10px] font-bold px-3 py-1.5 rounded-md border transition-colors flex items-center gap-1 ${isDarkMode ? 'border-purple-500/30 text-purple-400 hover:bg-purple-500/10' : 'border-purple-200 text-purple-600 hover:bg-purple-50'}`}><List className="w-3 h-3"/> Menu List</button>
                        </div>
                        <form onSubmit={handleSendMessage} className="relative flex items-center">
                          <button type="button" className={`absolute left-3 p-1.5 ${ui.textMuted} hover:${ui.textMain}`}><Paperclip className="w-4 h-4" /></button>
                          <input type="text" value={chatInput} onChange={handleChatInputChange} placeholder={isInternal ? "Type an internal note..." : "Message customer... (Type '/' for templates)"} className={`w-full ${isInternal ? 'bg-amber-500/10 border-amber-500/30 text-amber-500 placeholder-amber-500/50' : ui.input} border rounded-xl pl-10 pr-14 py-3.5 text-sm focus:outline-none transition-colors`} />
                          <button type="submit" disabled={!chatInput.trim()} className={`absolute right-2 p-2.5 rounded-lg ${t.bg} text-white shadow-md disabled:opacity-50 hover:scale-105 transition-transform`}><Send className="w-4 h-4 ml-0.5" /></button>
                        </form>
                      </div>
                    </div>

                    {/* RIGHT: CUSTOMER PROFILE (Hidden on small screens) */}
                    <div className={`hidden xl:flex w-72 flex-col border-l ${ui.border} ${ui.bgSidebar} overflow-y-auto hover-scroll shrink-0`}>
                      <div className={`p-6 border-b ${ui.border} text-center`}>
                        <div className={`w-16 h-16 mx-auto rounded-full ${t.bg} text-white flex items-center justify-center text-2xl font-black mb-3 shadow-lg`}>{selectedLead.full_name?.charAt(0) || <User/>}</div>
                        <h3 className={`text-base font-bold ${ui.textMain}`}>{selectedLead.full_name || 'Unknown'}</h3>
                        <p className={`text-xs ${ui.textMuted} mt-1 flex items-center justify-center gap-1`}><Flame className="w-3 h-3 text-amber-500"/> Lead Score: {selectedLead.status === 'NEW_ORDER' ? 'Hot' : 'Warm'}</p>
                      </div>
                      <div className="p-5 space-y-6">
                        <div>
                          <h4 className={`text-[10px] font-bold uppercase tracking-widest ${ui.textMuted} mb-3`}>Contact Info</h4>
                          <div className="space-y-3">
                            <div className="flex items-center gap-3"><Phone className={`w-4 h-4 ${ui.textMuted}`}/><span className={`text-xs ${ui.textMain}`}>+{selectedLead.phone_number}</span></div>
                            <div className="flex items-center gap-3"><Globe className={`w-4 h-4 ${ui.textMuted}`}/><span className={`text-xs ${ui.textMain}`}>{selectedLead.email || 'No email provided'}</span></div>
                          </div>
                        </div>
                        <div>
                          <h4 className={`text-[10px] font-bold uppercase tracking-widest ${ui.textMuted} mb-3`}>Tags</h4>
                          <div className="flex flex-wrap gap-2 items-center">
                            {selectedLead.tags?.map((tg: string) => (
                               <span key={tg} className={`group relative px-2.5 py-1 rounded-md border ${ui.border} ${ui.card} text-[10px] font-bold ${ui.textMuted} flex items-center gap-1`}>
                                  {tg}
                                  <button onClick={async (e) => { e.stopPropagation(); let nT = selectedLead.tags.filter((t:string)=>t!==tg); setSelectedLead((pr:any)=>({...pr,tags:nT})); setLeads((pr:any[])=>pr.map(l=>l.id===selectedLead.id?{...l,tags:nT}:l)); await supabase.from('customers').update({tags:nT}).eq('id',selectedLead.id); logAudit('TAG_REMOVED', `Removed tag from +${selectedLead.phone_number}`); }} className="opacity-0 group-hover:opacity-100 text-red-500 hover:text-red-400"><X className="w-2.5 h-2.5"/></button>
                               </span>
                            ))}
                            {showTagInput ? (
                               <form onSubmit={handleAddTagSubmit} className="flex items-center">
                                  <input autoFocus type="text" value={newTag} onChange={e=>setNewTag(e.target.value)} onBlur={handleAddTagSubmit} placeholder="Add tag..." className={`w-20 ${ui.input} text-[10px] px-2 py-1 rounded-md outline-none focus:border-amber-500`} />
                               </form>
                            ) : (
                               <button onClick={() => setShowTagInput(true)} className={`px-2.5 py-1 rounded-md border border-dashed ${ui.border} text-[10px] font-bold ${ui.textMuted} hover:border-amber-500 hover:${ui.accentText} transition-colors`}><Plus className="w-3 h-3"/></button>
                            )}
                          </div>
                        </div>
                        <div>
                          <h4 className={`text-[10px] font-bold uppercase tracking-widest ${ui.textMuted} mb-3`}>Internal Notes</h4>
                          <div className={`p-1 rounded-xl border ${ui.border} ${ui.card} shadow-sm focus-within:border-amber-500 transition-colors`}>
                            <textarea value={selectedLead.profile_notes || ''} onChange={(e) => { setSelectedLead((pr:any)=>({...pr, profile_notes: e.target.value})); }} onBlur={async () => { await supabase.from('customers').update({profile_notes: selectedLead.profile_notes}).eq('id', selectedLead.id); logAudit('PROFILE_UPDATED', `Updated notes for +${selectedLead.phone_number}`); }} placeholder="Add a new note..." className={`w-full bg-transparent px-3 py-2 text-xs outline-none resize-none hover-scroll h-20 ${ui.textMain}`} />
                          </div>
                          <div className="mt-4 space-y-3 max-h-48 overflow-y-auto hover-scroll">
                             {internalMemos.map((memo: any) => (
                                 <div key={memo.id} className={`group relative p-3 rounded-xl border ${isDarkMode ? 'bg-amber-500/10 border-amber-500/20' : 'bg-amber-50 border-amber-200'}`}>
                                     {userRole === 'ADMIN' && <button onClick={async () => { await supabase.from('messages').delete().eq('id', memo.id); setMessages((pr: any[]) => pr.filter(m => m.id !== memo.id)); }} className={`absolute top-2 right-2 opacity-0 group-hover:opacity-100 p-1 rounded-md transition-all ${isDarkMode ? 'hover:bg-red-500/20 text-amber-500 hover:text-red-400' : 'hover:bg-red-100 text-amber-500 hover:text-red-500'}`}><Trash2 className="w-3 h-3" /></button>}
                                     <p className={`text-xs ${isDarkMode ? 'text-amber-200' : 'text-amber-900'} leading-relaxed pr-5`}>{memo.content}</p>
                                     <span className={`text-[9px] ${isDarkMode ? 'text-amber-500/60' : 'text-amber-600/70'} block mt-2`}>{new Date(memo.created_at).toLocaleString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}</span>
                                 </div>
                             ))}
                          </div>
                        </div>
                      </div>
                    </div>
                  </>
                ) : (
                  <div className={`hidden lg:flex flex-1 flex-col items-center justify-center ${ui.bgMain} text-center px-6`}>
                    <MessageCircle className={`w-16 h-16 ${ui.textMuted} mb-4 opacity-20`} />
                    <h3 className={`text-xl font-bold ${ui.textMain} mb-2`}>No Conversation Selected</h3>
                    <p className={`text-sm ${ui.textMuted}`}>Select a contact from the inbox to view their chat history.</p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* CONTACTS DIRECTORY */}
          {activeView === 'contacts' && (
            <div className="flex flex-col h-full animate-[fade-in_0.3s_ease-out] mr-4 mb-4 mt-6">
              <div className={`${ui.glass} rounded-3xl p-8 shadow-sm h-full flex flex-col transition-colors duration-300`}>
                <div className="flex items-center justify-between mb-8 shrink-0">
                  <div>
                    <h2 className={`text-xl font-bold ${ui.textMain} tracking-tight mb-2`}>Lead Directory</h2>
                    <p className={`text-[11px] ${ui.textMuted} font-medium`}>Manage all your contacts and leads.</p>
                  </div>
                </div>
                <div className="flex-1 overflow-y-auto custom-scrollbar pr-2">
                  <div className="flex justify-between items-center mb-6">
                    <div className="relative w-72">
                      <Search className={`absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 ${ui.textMuted}`} />
                      <input type="text" placeholder="Search contacts..." value={globalSearch} onChange={e=>setGlobalSearch(e.target.value)} className={`w-full ${ui.input} text-sm rounded-xl pl-9 pr-4 py-2.5 outline-none transition-colors focus:border-amber-400`} />
                    </div>
                    <button className={`px-4 py-2.5 rounded-xl ${t.bg} text-white shadow-md text-sm font-bold flex items-center gap-2`}><Plus className="w-4 h-4"/> Add Contact</button>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-6">
                    {filteredLeads.map((contact: any) => (
                      <div key={contact.id} onClick={() => { setSelectedLead(contact); setActiveView('inbox'); }} className={`${ui.card} p-6 rounded-2xl border ${ui.border} hover:border-amber-500/50 transition-colors group cursor-pointer shadow-sm`}>
                        <div className="flex justify-between items-start mb-4">
                          <div className={`w-12 h-12 rounded-2xl ${t.sub} flex items-center justify-center font-bold text-lg ${t.text}`}>{contact.full_name?.charAt(0) || <User/>}</div>
                          <button className={`p-1.5 rounded-lg ${ui.textMuted} ${ui.hover}`}><MoreVertical className="w-4 h-4"/></button>
                        </div>
                        <h3 className={`text-sm font-bold ${ui.textMain} mb-1 truncate`}>{contact.full_name || 'Store Customer'}</h3>
                        <p className={`text-xs font-mono ${ui.textMuted} mb-4`}>+{contact.phone_number}</p>
                        <div className={`flex items-center justify-between pt-4 border-t ${ui.border}`}>
                          <span className={`flex items-center gap-1.5 text-[10px] font-bold px-2 py-1 rounded-md ${contact.status === 'NEW_ORDER' ? 'text-amber-500 bg-amber-500/10' : 'text-sky-500 bg-sky-500/10'}`}><Flame className="w-3 h-3"/> {contact.status.replace('_',' ')}</span>
                          <span className={`text-[9px] font-bold uppercase tracking-widest ${ui.textMuted}`}>{new Date(contact.created_at).toLocaleDateString()}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TEMPLATES */}
          {activeView === 'templates' && (
             <div className="flex flex-col h-full animate-[fade-in_0.3s_ease-out] mr-4 mb-4 mt-6">
               <div className={`${ui.glass} rounded-3xl p-8 shadow-sm h-full flex flex-col transition-colors duration-300`}>
                 <div className="flex items-center justify-between mb-8 shrink-0">
                   <div>
                     <h2 className={`text-xl font-bold ${ui.textMain} tracking-tight mb-2`}>Template Commands</h2>
                     <p className={`text-[11px] ${ui.textMuted} font-medium`}>Manage your team's quick replies.</p>
                   </div>
                 </div>
                 <div className="flex-1 overflow-y-auto custom-scrollbar pr-2">
                   <div className={`${isDarkMode ? 'bg-slate-900/50' : 'bg-slate-50'} rounded-2xl p-6 border ${ui.border} mb-8 shadow-inner transition-colors duration-300`}>
                      <h3 className={`text-sm font-bold ${ui.textMain} flex items-center gap-2 mb-4`}><Zap className="w-4 h-4 text-amber-500" /> Create Command</h3>
                      <form onSubmit={handleAddTemplate} className="flex flex-col md:flex-row gap-4">
                         <div className="w-full md:w-1/4"><div className="relative"><span className={`absolute left-4 top-1/2 -translate-y-1/2 ${ui.textMuted} font-bold text-sm`}>/</span><input type="text" value={newShortcut} onChange={(e) => setNewShortcut(e.target.value)} placeholder="shortcut" className={`w-full ${ui.input} rounded-xl pl-8 pr-4 py-3 text-sm outline-none transition-colors shadow-sm`} /></div></div>
                         <div className="flex-1"><input type="text" value={newTemplateContent} onChange={(e) => setNewTemplateContent(e.target.value)} placeholder="Full message content..." className={`w-full ${ui.input} rounded-xl px-4 py-3 text-sm outline-none transition-colors shadow-sm`} /></div>
                         <button type="submit" disabled={!newShortcut.trim() || !newTemplateContent.trim()} className={`${t.bg} text-white disabled:opacity-50 transition-all rounded-xl px-8 py-3 text-sm font-bold shadow-md hover:scale-[1.02]`}>Save</button>
                      </form>
                   </div>
                   <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                      {quickReplies.length === 0 ? ( <div className={`col-span-full p-10 text-center ${ui.card} border-dashed rounded-3xl ${ui.textMuted} text-sm font-medium`}>No templates yet.</div>
                      ) : ( quickReplies.map((reply: any) => (
                          <div key={reply.id} className={`group ${ui.card} rounded-3xl p-6 transition-all duration-300 hover:-translate-y-1 relative min-h-[140px] shadow-sm hover:shadow-md`}>
                             {editingTemplateId === reply.id ? (
                                <div className="flex flex-col gap-3 h-full">
                                  <div className="relative"><span className={`absolute left-3 top-1/2 -translate-y-1/2 ${ui.textMuted} font-bold text-xs`}>/</span><input type="text" value={editShortcut} onChange={(e) => setEditShortcut(e.target.value)} className={`w-full ${ui.input} rounded-lg pl-7 pr-3 py-2 text-xs outline-none transition-colors`} /></div>
                                  <textarea value={editTemplateContent} onChange={(e) => setEditTemplateContent(e.target.value)} className={`w-full ${ui.input} rounded-lg px-3 py-2 text-xs outline-none resize-none transition-colors flex-1 hover-scroll`} />
                                  <div className="flex gap-2 justify-end mt-auto"><button onClick={() => setEditingTemplateId(null)} className={`px-3 py-1.5 rounded-lg text-xs font-bold ${ui.textMuted} ${ui.hover} transition-colors`}>Cancel</button><button onClick={() => handleUpdateTemplate(reply.id)} className={`px-3 py-1.5 rounded-lg text-xs font-bold ${t.bg} text-white transition-colors`}>Save</button></div>
                                </div>
                             ) : (
                                <>
                                   <div className="absolute top-4 right-4 flex items-center gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
                                      <button onClick={() => { setEditingTemplateId(reply.id); setEditShortcut(reply.shortcut); setEditTemplateContent(reply.content); }} className={`p-2 ${ui.bgMain} shadow-sm rounded-lg transition-colors ${ui.textMuted} hover:text-blue-500`}><Edit2 className="w-3.5 h-3.5" /></button>
                                      <button onClick={() => { navigator.clipboard.writeText(reply.content); setCopiedId(reply.id); setTimeout(() => setCopiedId(null), 2000); }} className={`p-2 rounded-lg transition-colors shadow-sm ${copiedId === reply.id ? `${t.sub} ${t.text}` : `${ui.bgMain} ${ui.textMuted} hover:${ui.textMain}`}`}>{copiedId === reply.id ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}</button>
                                      <button onClick={() => handleDeleteTemplate(reply.id)} className={`p-2 ${ui.bgMain} shadow-sm rounded-lg transition-colors ${ui.textMuted} hover:text-red-500`}><Trash2 className="w-3.5 h-3.5" /></button>
                                   </div>
                                   <h4 className={`${ui.textMain} font-extrabold text-sm mb-3 flex items-center gap-1`}>/{reply.shortcut}</h4>
                                   <div className={`${isDarkMode ? 'bg-slate-900/50' : 'bg-slate-100/50'} rounded-xl p-4 shadow-inner min-h-[70px]`}><p className={`text-xs ${ui.textMuted} leading-relaxed`}>{reply.content}</p></div>
                                </>
                             )}
                          </div>
                        ))
                      )}
                   </div>
                 </div>
               </div>
             </div>
          )}

          {/* TEAM */}
          {activeView === 'team' && (
            <div className="flex flex-col h-full animate-[fade-in_0.3s_ease-out] mr-4 mb-4 mt-6">
              <div className={`${ui.glass} rounded-3xl p-8 shadow-sm h-full flex flex-col transition-colors duration-300`}>
                <div className="flex items-center justify-between mb-8 shrink-0">
                  <div>
                    <h2 className={`text-xl font-bold ${ui.textMain} tracking-tight mb-2`}>Team Management</h2>
                    <p className={`text-[11px] ${ui.textMuted} font-medium`}>Monitor agent performance and routing.</p>
                  </div>
                </div>
                <div className="flex-1 overflow-y-auto custom-scrollbar pr-2">
                   <div className={`${ui.card} rounded-3xl p-8 border ${ui.border} shadow-sm`}>
                     <div className="flex items-center justify-between mb-8">
                        <div><h2 className={`text-xl font-bold ${ui.textMain} tracking-tight`}>Team Management</h2><p className={`text-[11px] ${ui.textMuted} font-medium mt-1`}>Monitor agent performance.</p></div>
                        <button className={`px-4 py-2.5 rounded-xl ${t.bg} text-white shadow-md text-sm font-bold flex items-center gap-2`}><Plus className="w-4 h-4"/> Invite Agent</button>
                     </div>
                     <div className="w-full overflow-x-auto">
                        <table className="w-full text-left border-collapse">
                           <thead>
                              <tr className={`border-b ${ui.border}`}>
                                 <th className={`pb-4 px-4 text-[10px] font-bold uppercase tracking-widest ${ui.textMuted}`}>Agent</th>
                                 <th className={`pb-4 px-4 text-[10px] font-bold uppercase tracking-widest ${ui.textMuted}`}>Status</th>
                                 <th className={`pb-4 px-4 text-[10px] font-bold uppercase tracking-widest ${ui.textMuted}`}>Active Chats</th>
                                 <th className={`pb-4 px-4 text-[10px] font-bold uppercase tracking-widest ${ui.textMuted}`}>Closed Chats</th>
                                 <th className={`pb-4 px-4 text-[10px] font-bold uppercase tracking-widest ${ui.textMuted}`}>Avg Response</th>
                                 <th className={`pb-4 px-4 text-[10px] font-bold uppercase tracking-widest ${ui.textMuted}`}>Actions</th>
                              </tr>
                           </thead>
                           <tbody>
                              {MOCK_TEAM.map((m: any) => (
                                 <tr key={m.id} className={`border-b ${ui.border} ${ui.hover} transition-colors`}>
                                    <td className="py-4 px-4">
                                       <div className="flex items-center gap-3">
                                          <div className={`w-8 h-8 rounded-full ${t.bg} text-white flex items-center justify-center font-bold text-xs`}>{m.name.charAt(0)}</div>
                                          <span className={`text-sm font-bold ${ui.textMain}`}>{m.name}</span>
                                       </div>
                                    </td>
                                    <td className="py-4 px-4"><span className={`text-[10px] font-bold px-2 py-1 rounded-md ${m.status === 'Online' ? 'bg-emerald-500/10 text-emerald-500' : 'bg-amber-500/10 text-amber-500'}`}>{m.status}</span></td>
                                    <td className={`py-4 px-4 text-sm font-bold ${ui.textMain}`}>{m.active}</td>
                                    <td className={`py-4 px-4 text-sm font-bold ${ui.textMain}`}>{m.closed}</td>
                                    <td className={`py-4 px-4 text-sm font-bold ${ui.textMain}`}>{m.response}</td>
                                    <td className="py-4 px-4"><button className={`p-1.5 rounded-lg ${ui.textMuted} hover:${ui.textMain}`}><MoreVertical className="w-4 h-4"/></button></td>
                                 </tr>
                              ))}
                           </tbody>
                        </table>
                     </div>
                   </div>
                </div>
              </div>
            </div>
          )}

          {/* CAMPAIGNS */}
          {activeView === 'campaigns' && userRole === 'ADMIN' && (
             <div className="flex flex-col h-full animate-[fade-in_0.3s_ease-out] mr-4 mb-4 mt-6">
               <div className={`${ui.glass} rounded-3xl p-8 shadow-sm h-full flex flex-col transition-colors duration-300`}>
                 <div className="flex items-center justify-between mb-8 shrink-0">
                   <div>
                     <h2 className={`text-xl font-bold ${ui.textMain} tracking-tight mb-2`}>Campaigns</h2>
                     <p className={`text-[11px] ${ui.textMuted} font-medium`}>Send mass updates.</p>
                   </div>
                 </div>
                 <div className="flex-1 overflow-y-auto custom-scrollbar pr-2">
                   <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
                       <div className="xl:col-span-1 space-y-6">
                         <div className={`${ui.card} rounded-3xl p-8 border ${ui.border} shadow-sm`}>
                            <h3 className={`text-sm font-bold ${ui.textMain} flex items-center gap-2 mb-6`}><Megaphone className={`w-5 h-5 ${ui.textMuted}`} /> New Broadcast</h3>
                            <form onSubmit={handleLaunchCampaign} className="space-y-5">
                               <div className="space-y-2"><label className={`text-[10px] font-bold ${ui.textMuted} uppercase tracking-widest pl-1`}>Name</label><input type="text" value={campaignName} onChange={(e) => setCampaignName(e.target.value)} placeholder="e.g. Flash Sale" className={`w-full ${ui.input} rounded-xl px-4 py-3 text-sm shadow-inner`} /></div>
                               <div className="space-y-2"><label className={`text-[10px] font-bold ${ui.textMuted} uppercase tracking-widest pl-1`}>Audience</label><select value={campaignAudience} onChange={(e) => setCampaignAudience(e.target.value)} className={`w-full ${ui.input} rounded-xl px-4 py-3 text-sm appearance-none shadow-inner`}><option value="ALL">All Contacts ({leads.length})</option></select></div>
                               <div className="space-y-2"><label className={`text-[10px] font-bold ${ui.textMuted} uppercase tracking-widest pl-1`}>Template</label><select value={campaignTemplateId} onChange={(e) => setCampaignTemplateId(e.target.value)} className={`w-full ${ui.input} rounded-xl px-4 py-3 text-sm appearance-none shadow-inner`}><option value="" disabled>Select...</option>{quickReplies.map((r: any) => ( <option key={r.id} value={r.id}>/{r.shortcut}</option> ))}</select></div>
                               <button type="submit" className={`w-full ${t.bg} text-white font-bold text-sm px-4 py-3.5 rounded-xl shadow-md transition-all flex items-center justify-center gap-2 hover:-translate-y-0.5 mt-4`}><Send className="w-4 h-4 ml-1" /> Launch</button>
                            </form>
                         </div>
                       </div>
                       <div className="xl:col-span-2">
                         <div className={`${ui.card} rounded-3xl p-8 border ${ui.border} shadow-sm h-full`}>
                            <h3 className={`text-sm font-bold ${ui.textMain} flex items-center gap-2 mb-6`}><Activity className="w-5 h-5 text-sky-500" /> History</h3>
                            <div className={`${ui.bgMain} border border-dashed ${ui.border} rounded-2xl p-10 flex flex-col items-center justify-center text-center h-[250px]`}><UsersIcon className={`w-12 h-12 ${ui.textMuted} mb-3`} /><p className={`text-sm font-bold ${ui.textMuted}`}>No campaigns yet.</p></div>
                         </div>
                       </div>
                   </div>
                 </div>
               </div>
             </div>
          )}

          {/* ANALYTICS */}
          {activeView === 'analytics' && (
             <div className="flex flex-col h-full animate-[fade-in_0.3s_ease-out] mr-4 mb-4 mt-6">
               <div className={`${ui.glass} rounded-3xl p-8 shadow-sm h-full flex flex-col transition-colors duration-300`}>
                 <div className="flex items-center justify-between mb-8 shrink-0">
                   <div>
                     <h2 className={`text-xl font-bold ${ui.textMain} tracking-tight mb-2`}>Analytics</h2>
                     <p className={`text-[11px] ${ui.textMuted} font-medium`}>Performance metrics.</p>
                   </div>
                   <div className={`${ui.card} rounded-xl px-4 py-2 border ${ui.border} flex items-center gap-2 text-xs font-bold ${ui.textMuted} shadow-sm`}><Calendar className="w-4 h-4" /> 30 Days</div>
                 </div>
                 <div className="flex-1 overflow-y-auto custom-scrollbar pr-2">
                   <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
                     <div className={`${ui.card} rounded-3xl p-6 border ${ui.border} shadow-sm relative overflow-hidden`}><div className="absolute top-0 right-0 p-4 opacity-10"><Target className={`w-20 h-20 ${t.text}`} /></div><p className={`text-[11px] font-bold ${ui.textMuted} uppercase tracking-widest mb-1`}>Resolution Rate</p><h3 className={`text-3xl font-extrabold ${ui.textMain} mb-2`}>{resolutionRate}%</h3></div>
                     <div className={`${ui.card} rounded-3xl p-6 border ${ui.border} shadow-sm relative overflow-hidden`}><div className="absolute top-0 right-0 p-4 opacity-10"><MessageCircle className="w-20 h-20 text-sky-500" /></div><p className={`text-[11px] font-bold ${ui.textMuted} uppercase tracking-widest mb-1`}>Total Contacts</p><h3 className={`text-3xl font-extrabold ${ui.textMain} mb-2`}>{leads.length}</h3></div>
                     <div className={`${ui.card} rounded-3xl p-6 border ${ui.border} shadow-sm relative overflow-hidden`}><div className="absolute top-0 right-0 p-4 opacity-10"><Activity className="w-20 h-20 text-amber-500" /></div><p className={`text-[11px] font-bold ${ui.textMuted} uppercase tracking-widest mb-1`}>Avg Response</p><h3 className={`text-3xl font-extrabold ${ui.textMain} mb-2`}><span className={`text-xl ${ui.textMuted}`}>&lt;</span> 2<span className={`text-xl ${ui.textMuted}`}>m</span></h3></div>
                     <div className={`${ui.card} rounded-3xl p-6 border ${ui.border} shadow-sm relative overflow-hidden`}><div className="absolute top-0 right-0 p-4 opacity-10"><PieChart className="w-20 h-20 text-purple-500" /></div><p className={`text-[11px] font-bold ${ui.textMuted} uppercase tracking-widest mb-1`}>Total Messages</p><h3 className={`text-3xl font-extrabold ${ui.textMain} mb-2`}>{totalSent + totalReceived}</h3></div>
                   </div>
                   <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                      <div className={`${ui.card} rounded-3xl p-8 border ${ui.border} shadow-sm flex flex-col`}>
                         <h3 className={`text-sm font-bold ${ui.textMain} flex items-center gap-2 mb-8`}><BarChart2 className={`w-5 h-5 ${ui.textMuted}`} /> Volume Split</h3>
                         <div className="flex-1 flex flex-col justify-center items-center">
                            <div className={`w-full flex h-14 rounded-2xl overflow-hidden shadow-inner ${ui.bgMain} mb-8 border border-transparent`}>
                               <div className="bg-amber-400 flex items-center justify-center text-[11px] font-bold text-amber-900 transition-all duration-1000" style={{ width: `${(totalSent + totalReceived) === 0 ? 50 : (totalSent / (totalSent + totalReceived)) * 100}%` }}>{totalSent > 0 && `${Math.round((totalSent / (totalSent + totalReceived)) * 100)}%`}</div>
                               <div className="bg-sky-400 flex items-center justify-center text-[11px] font-bold text-sky-900 transition-all duration-1000" style={{ width: `${(totalSent + totalReceived) === 0 ? 50 : (totalReceived / (totalSent + totalReceived)) * 100}%` }}>{totalReceived > 0 && `${Math.round((totalReceived / (totalSent + totalReceived)) * 100)}%`}</div>
                            </div>
                            <div className="flex w-full justify-around mt-4">
                               <div className="text-center"><div className="flex items-center gap-2 mb-2"><div className="w-3 h-3 rounded-full bg-amber-400 shadow-sm"></div><span className={`text-[10px] font-bold ${ui.textMuted} uppercase tracking-widest`}>Outbound</span></div><p className={`text-3xl font-extrabold ${ui.textMain}`}>{totalSent}</p></div>
                               <div className={`w-px ${ui.border} h-full mx-6`}></div>
                               <div className="text-center"><div className="flex items-center gap-2 mb-2"><div className="w-3 h-3 rounded-full bg-sky-400 shadow-sm"></div><span className={`text-[10px] font-bold ${ui.textMuted} uppercase tracking-widest`}>Inbound</span></div><p className={`text-3xl font-extrabold ${ui.textMain}`}>{totalReceived}</p></div>
                            </div>
                         </div>
                      </div>
                   </div>
                 </div>
               </div>
             </div>
          )}

          {/* SETTINGS */}
          {activeView === 'settings' && userRole === 'ADMIN' && (
             <div className="flex flex-col h-full animate-[fade-in_0.3s_ease-out] mr-4 mb-4 mt-6">
               <div className={`${ui.glass} rounded-3xl p-8 shadow-sm h-full flex flex-col transition-colors duration-300`}>
                 <div className="flex items-center justify-between mb-8 shrink-0">
                   <div>
                     <h2 className={`text-xl font-bold ${ui.textMain} tracking-tight mb-2`}>Settings</h2>
                     <p className={`text-[11px] ${ui.textMuted} font-medium`}>Manage your workspace.</p>
                   </div>
                 </div>
                 <div className="flex-1 overflow-y-auto custom-scrollbar pr-2">
                   <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
                      <div className="space-y-8">
                        <div className={`${ui.card} rounded-3xl p-8 border ${ui.border} relative overflow-hidden shadow-sm`}>
                           <div className={`absolute top-0 right-0 w-48 h-48 ${t.sub} blur-[60px] pointer-events-none`}></div>
                           <h3 className={`text-sm font-bold ${t.text} flex items-center gap-2 mb-6 relative z-10`}><Sparkles className="w-5 h-5" /> Workspace Branding</h3>
                           <div className="space-y-6 relative z-10">
                              <div><label className={`text-[10px] font-bold ${ui.textMuted} uppercase tracking-widest pl-1`}>Workspace Name</label><input type="text" value={settings.workspaceName} onChange={(e) => {setSettings(s => ({ ...s, workspaceName: e.target.value })); localStorage.setItem('chatrax_brand', e.target.value);}} className={`w-full mt-2 ${ui.input} rounded-xl px-4 py-3 text-sm transition-colors shadow-inner`} /></div>
                           </div>
                        </div>
                        <div className={`${ui.card} rounded-3xl p-8 border ${ui.border} shadow-sm`}>
                           <h3 className={`text-sm font-bold ${ui.textMain} flex items-center gap-2 mb-6`}><Globe className="w-5 h-5 text-sky-500" /> API Integrations</h3>
                           <div className="space-y-5">
                              <div className={`${ui.bgMain} rounded-2xl p-5 shadow-inner`}>
                                 <div className="flex items-center justify-between mb-4"><h4 className={`${ui.textMain} font-bold text-sm`}>WhatsApp API</h4><span className={`px-2.5 py-1 ${t.sub} ${t.text} text-[9px] font-bold uppercase rounded-md border ${t.border}`}>Configured</span></div>
                                 <div className="space-y-4">
                                    <div><label className={`text-[9px] font-bold ${ui.textMuted} uppercase tracking-widest pl-1`}>Access Token</label><input type="password" value={settings.metaToken} onChange={(e) => setSettings((prev: any) => ({...prev, metaToken: e.target.value}))} className={`w-full mt-1.5 ${ui.input} rounded-xl px-4 py-3 text-sm transition-colors`} /></div>
                                    <div><label className={`text-[9px] font-bold ${ui.textMuted} uppercase tracking-widest pl-1`}>Phone ID</label><input type="text" value={settings.metaPhoneId} onChange={(e) => setSettings((prev: any) => ({...prev, metaPhoneId: e.target.value}))} className={`w-full mt-1.5 ${ui.input} rounded-xl px-4 py-3 text-sm transition-colors`} /></div>
                                 </div>
                              </div>
                              <div className={`${ui.bgMain} rounded-2xl p-5 shadow-inner`}>
                                 <div className="flex items-center justify-between mb-4"><h4 className={`${ui.textMain} font-bold text-sm`}>Shopify API</h4><span className={`px-2.5 py-1 ${t.sub} ${t.text} text-[9px] font-bold uppercase rounded-md border ${t.border}`}>Configured</span></div>
                                 <div><label className={`text-[9px] font-bold ${ui.textMuted} uppercase tracking-widest pl-1`}>Store Domain</label><input type="text" value={settings.shopifyDomain} onChange={(e) => setSettings((prev: any) => ({...prev, shopifyDomain: e.target.value}))} className={`w-full mt-1.5 ${ui.input} rounded-xl px-4 py-3 text-sm transition-colors`} /></div>
                              </div>
                              <div className={`${ui.bgMain} rounded-2xl p-5 shadow-inner`}>
                                 <div className="flex items-center justify-between mb-4"><h4 className={`${ui.textMain} font-bold text-sm flex items-center gap-2`}><Link className="w-4 h-4 text-amber-500"/> Webhooks</h4><span className={`px-2.5 py-1 text-[9px] font-bold uppercase rounded-md border ${settings.outboundWebhookUrl ? `${t.sub} ${t.text} ${t.border}` : `${isDarkMode ? 'bg-slate-700 text-slate-400 border-slate-600' : 'bg-slate-200 text-slate-500 border-slate-300'}`}`}>{settings.outboundWebhookUrl ? 'Active' : 'Inactive'}</span></div>
                                 <div><label className={`text-[9px] font-bold ${ui.textMuted} uppercase tracking-widest pl-1`}>Outbound Hook URL</label><input type="text" value={settings.outboundWebhookUrl} onChange={(e) => setSettings((prev: any) => ({...prev, outboundWebhookUrl: e.target.value}))} className={`w-full mt-1.5 ${ui.input} rounded-xl px-4 py-3 text-sm transition-colors`} /></div>
                              </div>
                           </div>
                        </div>
                      </div>
                      <div className="space-y-8">
                         <div className={`${ui.card} rounded-3xl p-8 border ${ui.border} relative overflow-hidden shadow-sm`}>
                            <h3 className={`text-sm font-bold ${ui.textMain} flex items-center gap-2 mb-3 relative z-10`}><UploadCloud className="w-5 h-5 text-blue-500" /> Database Migration</h3>
                            <p className={`text-xs ${ui.textMuted} mb-6 relative z-10`}>Upload a CSV file containing (Phone, Name) to instantly populate.</p>
                            <div className={`relative border-2 border-dashed ${isDarkMode ? 'border-slate-600 bg-slate-800 hover:bg-slate-700' : 'border-slate-300 bg-slate-50 hover:bg-slate-100'} rounded-2xl p-10 flex flex-col items-center justify-center text-center transition-all cursor-pointer shadow-inner`}>
                               <input type="file" accept=".csv" onChange={handleCSVUpload} disabled={isUploadingCSV} className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10" />
                               {isUploadingCSV ? <Loader2 className={`w-10 h-10 ${ui.textMuted} animate-spin mb-3`} /> : <FileText className={`w-10 h-10 ${ui.textMuted} mb-3`} />}
                               <span className={`text-sm font-bold ${ui.textMain}`}>{isUploadingCSV ? "Processing..." : "Click or Drag CSV"}</span>
                            </div>
                         </div>
                         <div className={`${ui.card} rounded-3xl p-8 border ${ui.border} shadow-sm flex flex-col h-[400px]`}>
                            <h3 className={`text-sm font-bold ${ui.textMain} flex items-center gap-2 mb-3`}><Shield className="w-5 h-5 text-emerald-500" /> Security Console</h3>
                            <div className={`flex-1 ${ui.bgMain} rounded-2xl border ${ui.border} p-5 font-mono text-[10px] overflow-y-auto hover-scroll shadow-inner`}>
                               {auditLogs.length === 0 ? ( <div className="h-full flex items-center justify-center text-slate-500">No logs yet.</div> ) : ( <div className="space-y-4">{auditLogs.map((log: any) => ( <div key={log.id} className="border-l-2 border-blue-500/50 pl-3 py-0.5"><div className="flex justify-between items-start mb-1"><span className="text-blue-400 font-bold uppercase tracking-wider">{log.action_type}</span><span className="text-slate-400">{new Date(log.created_at).toLocaleString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}</span></div><p className="text-slate-400"><span className={t.text}>{log.agent_name}</span> &mdash; {log.details}</p></div> ))}</div> )}
                            </div>
                         </div>
                      </div>
                   </div>
                 </div>
               </div>
             </div>
          )}

          {/* PLACEHOLDERS */}
          {['deals'].includes(activeView) && (
            <div className="flex flex-col h-full animate-[fade-in_0.3s_ease-out] mr-4 mb-4 mt-6">
               <div className={`${ui.glass} rounded-3xl p-8 shadow-sm h-full flex flex-col transition-colors duration-300`}>
                 <div className="flex items-center justify-between mb-8 shrink-0">
                   <div>
                     <h2 className={`text-xl font-bold ${ui.textMain} tracking-tight mb-2 capitalize`}>{activeView} Module</h2>
                     <p className={`text-[11px] ${ui.textMuted} font-medium`}>This module is currently being configured.</p>
                   </div>
                 </div>
                 <div className="flex-1 overflow-y-auto custom-scrollbar pr-2 flex flex-col items-center justify-center text-center">
                    <div className={`w-24 h-24 rounded-full ${t.sub} flex items-center justify-center mb-6`}><Settings className={`w-10 h-10 ${t.text}`} /></div>
                    <h2 className={`text-2xl font-bold ${ui.textMain} mb-3 capitalize`}>{activeView} Module</h2>
                    <p className={`text-sm ${ui.textMuted} max-w-md leading-relaxed`}>This module is currently being configured.</p>
                 </div>
               </div>
            </div>
          )}

        </div>
      </div>
    </div>
  );
}