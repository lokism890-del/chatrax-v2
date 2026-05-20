"use client"

import { useEffect, useState, useRef, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '../../lib/supabase'; 
import { 
  MessageSquare, ShieldCheck, X, Send, Clock, Trash2, Activity, MessageCircle, UserCheck, 
  ShoppingBag, Loader2, LayoutDashboard, Settings, Search, Star, Zap,
  Megaphone, AlertTriangle, List, ShieldAlert, Sparkles, Tag, User, FileText, CreditCard, Download,
  LayoutTemplate, BarChart2, LogOut, Check, Copy, Edit2, CheckCheck, Users, Target, PieChart, 
  TrendingDown, TrendingUp, Bell, Globe, Lock, UploadCloud, Shield, MousePointerClick, StickyNote
} from 'lucide-react';
import { jsPDF } from "jspdf";

// ─── STRICT TYPESCRIPT DEFINITION ───
type ThemeColor = {
  text: string;
  bg: string;
  bgSubtle: string;
  border: string;
  borderActive: string;
  focusBorder: string;
  hoverBg: string;
  gradient: string;
  shadow: string;
};

// ─── STATIC CONFIGURATIONS ───
const BRAND_COLORS: Record<string, ThemeColor> = {
  emerald: { text: 'text-emerald-400', bg: 'bg-emerald-500', bgSubtle: 'bg-emerald-500/10', border: 'border-emerald-500/20', borderActive: 'border-emerald-500/40', focusBorder: 'focus:border-emerald-500/50', hoverBg: 'hover:bg-emerald-500/20', gradient: 'from-emerald-500 to-teal-500', shadow: 'shadow-[0_0_15px_rgba(16,185,129,0.1)]' },
  blue: { text: 'text-blue-400', bg: 'bg-blue-500', bgSubtle: 'bg-blue-500/10', border: 'border-blue-500/20', borderActive: 'border-blue-500/40', focusBorder: 'focus:border-blue-500/50', hoverBg: 'hover:bg-blue-500/20', gradient: 'from-blue-500 to-indigo-500', shadow: 'shadow-[0_0_15px_rgba(59,130,246,0.1)]' },
  purple: { text: 'text-purple-400', bg: 'bg-purple-500', bgSubtle: 'bg-purple-500/10', border: 'border-purple-500/20', borderActive: 'border-purple-500/40', focusBorder: 'focus:border-purple-500/50', hoverBg: 'hover:bg-purple-500/20', gradient: 'from-purple-500 to-fuchsia-500', shadow: 'shadow-[0_0_15px_rgba(168,85,247,0.1)]' },
  rose: { text: 'text-rose-400', bg: 'bg-rose-500', bgSubtle: 'bg-rose-500/10', border: 'border-rose-500/20', borderActive: 'border-rose-500/40', focusBorder: 'focus:border-rose-500/50', hoverBg: 'hover:bg-rose-500/20', gradient: 'from-rose-500 to-pink-500', shadow: 'shadow-[0_0_15px_rgba(244,63,94,0.1)]' },
  amber: { text: 'text-amber-400', bg: 'bg-amber-500', bgSubtle: 'bg-amber-500/10', border: 'border-amber-500/20', borderActive: 'border-amber-500/40', focusBorder: 'focus:border-amber-500/50', hoverBg: 'hover:bg-amber-500/20', gradient: 'from-amber-500 to-orange-500', shadow: 'shadow-[0_0_15px_rgba(245,158,11,0.1)]' }
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

export default function Dashboard() {
  const router = useRouter();
  const [isMounted, setIsMounted] = useState(false);
  const [activeView, setActiveView] = useState<'dashboard' | 'conversations' | 'templates' | 'campaigns' | 'analytics' | 'billing' | 'settings'>('dashboard');

  // ─── STATE ───
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
  const presenceChannelRef = useRef<ReturnType<typeof supabase.channel> | null>(null);
  const [now, setNow] = useState(Date.now());
  const alertedLeadsRef = useRef<Set<string>>(new Set());
  const [auditLogs, setAuditLogs] = useState<any[]>([]);
  const [isUploadingCSV, setIsUploadingCSV] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // ─── SUBSCRIPTION & BILLING STATE ───
  const [subscription, setSubscription] = useState({
    status: 'trialing', 
    daysLeft: 7,
    plan: 'Free Trial',
    messageLimit: 1000
  });

  const handleUpgrade = async (planType: string) => {
    try {
      alert(`Simulating Stripe Redirect: Purchasing ChatRax ${planType} plan...`);
      setSubscription({ 
         ...subscription, 
         status: 'active', 
         plan: planType, 
         messageLimit: planType === 'Enterprise' ? 10000 : 2500 
      });
      logAudit('SUBSCRIPTION_UPDATE', `Admin upgraded to the ${planType} plan.`);
    } catch (err) {
      console.error("Stripe Error:", err);
    }
  };

  // ─── CORE FUNCTIONS ───
  const fetchLeads = useCallback(async () => { 
      const { data } = await supabase.from('customers').select('*').order('created_at', { ascending: false }); 
      if (data) setLeads(data); 
  }, []);

  const fetchStats = async () => { const { count: outCount } = await supabase.from('messages').select('*', { count: 'exact', head: true }).eq('is_outbound', true); setTotalSent(outCount || 0); const { count: inCount } = await supabase.from('messages').select('*', { count: 'exact', head: true }).eq('is_outbound', false).eq('is_internal', false); setTotalReceived(inCount || 0); };
  const fetchQuickReplies = async () => { const { data } = await supabase.from('quick_replies').select('*').order('created_at', { ascending: false }); if (data) setQuickReplies(data); };
  const fetchAuditLogs = async () => { const { data } = await supabase.from('audit_logs').select('*').order('created_at', { ascending: false }).limit(20); if (data) setAuditLogs(data); };
  const logAudit = async (actionType: string, details: string) => { try { await supabase.from('audit_logs').insert({ agent_name: settings.adminName || 'System', action_type: actionType, details: details }); fetchAuditLogs(); } catch (err) {} };

  // ─── INITIALIZATION EFFECTS ───
  useEffect(() => {
    const checkAuth = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) { router.push('/login'); } 
      else if (session.user?.email) {
        setSettings(prev => ({ ...prev, adminEmail: session.user.email || prev.adminEmail, adminName: session.user.user_metadata?.full_name || prev.adminName }));
      }
    };
    checkAuth();
    setIsMounted(true);

    const savedBranding = localStorage.getItem('chatrax_branding');
    if (savedBranding) {
       try {
           const parsed = JSON.parse(savedBranding);
           setSettings(prev => ({ ...prev, workspaceName: parsed.name || prev.workspaceName, accentColor: parsed.color || prev.accentColor }));
       } catch (err) { localStorage.removeItem('chatrax_branding'); }
    }

    setCurrentTime(new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }));
    const timer = setInterval(() => setCurrentTime(new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })), 1000);
    return () => clearInterval(timer);
  }, [router]);

  useEffect(() => {
    const interval = setInterval(() => {
      const currentNow = Date.now(); setNow(currentNow);
      if (settings.audioAlerts) {
        leads.forEach(lead => {
          if (lead.status === 'NEW_ORDER') {
            if (currentNow - new Date(lead.created_at).getTime() > 900000 && !alertedLeadsRef.current.has(lead.id)) {
              alertedLeadsRef.current.add(lead.id);
              try {
                const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
                const osc = ctx.createOscillator(); const gain = ctx.createGain();
                osc.connect(gain); gain.connect(ctx.destination); osc.type = 'triangle';
                osc.frequency.setValueAtTime(600, ctx.currentTime);
                gain.gain.setValueAtTime(0.1, ctx.currentTime); gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.8);
                osc.start(); osc.stop(ctx.currentTime + 0.8);
              } catch(e) {}
            }
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
      Object.keys(state).forEach((key) => { state[key].forEach((p: any) => {
          if (p.leadId) { if (!newMap[p.leadId]) newMap[p.leadId] = []; if (!newMap[p.leadId].includes(p.agentName)) newMap[p.leadId].push(p.agentName); }
      }); });
      setPresenceState(newMap);
    });
    channel.subscribe(async (status) => { if (status === 'SUBSCRIBED') await channel.track({ agentName: settings.adminName, leadId: selectedLead?.id || null }); });
    return () => { supabase.removeChannel(channel); };
  }, [settings.adminName, selectedLead]);

  useEffect(() => { messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [messages]);

  // ─── ANTI-FLICKER REALTIME LOGIC ───
  useEffect(() => {
    fetchLeads(); fetchStats(); fetchQuickReplies(); fetchAuditLogs();
    const channel = supabase.channel('realtime-customers').on('postgres_changes', { event: '*', schema: 'public', table: 'customers' }, (payload) => {
        if (payload.eventType === 'INSERT') {
            setLeads(prev => { if (prev.find(l => l.id === payload.new.id)) return prev; return [payload.new, ...prev]; });
        } else if (payload.eventType === 'UPDATE') {
            setLeads(prev => prev.map(l => l.id === payload.new.id ? payload.new : l));
        } else if (payload.eventType === 'DELETE') {
            setLeads(prev => prev.filter(l => l.id !== payload.old.id));
        }
    }).subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [fetchLeads]);

  // ─── DRAG & DROP LOGIC (FLICKER FREE) ───
  const handleDragStart = (e: React.DragEvent, id: string) => { 
    setDraggedLead(id); e.dataTransfer.setData('text/plain', id); e.dataTransfer.effectAllowed = 'move';
  };
  const handleDragEnd = () => { setDraggedLead(null); };
  const handleDragOver = (e: React.DragEvent) => { e.preventDefault(); };
  
  const handleDrop = async (e: React.DragEvent, newStatus: string) => {
    e.preventDefault(); const currentDraggedId = e.dataTransfer.getData('text/plain') || draggedLead;
    if (!currentDraggedId) return; setDraggedLead(null); 
    
    // Optimistic Update
    setLeads(prevLeads => prevLeads.map(l => l.id === currentDraggedId ? { ...l, status: newStatus } : l)); 
    try {
      // Server Update
      const { error } = await supabase.from('customers').update({ status: newStatus }).eq('id', currentDraggedId);
      if (!error) { 
          logAudit('MOVE_LEAD', `Moved lead to ${newStatus}`); 
          if (newStatus === 'RESOLVED' && settings.outboundWebhookUrl) {
              const lead = leads.find(l => l.id === currentDraggedId);
              if (lead) fireOutboundWebhook(lead);
          }
      } else { fetchLeads(); }
    } catch (err) { fetchLeads(); }
  };

  // ─── GENERAL EVENT HANDLERS ───
  const updateBranding = (name: string, color: string) => { setSettings(prev => ({ ...prev, workspaceName: name, accentColor: color })); localStorage.setItem('chatrax_branding', JSON.stringify({ name, color })); };
  const handleLogOut = async () => { if (!window.confirm("Are you sure you want to end your session?")) return; try { await supabase.auth.signOut(); router.push('/login'); } catch (err) { router.push('/login'); } };
  const toggleRole = () => { const newRole = userRole === 'ADMIN' ? 'AGENT' : 'ADMIN'; setUserRole(newRole); if (newRole === 'AGENT' && activeView !== 'conversations' && activeView !== 'templates') { setActiveView('conversations'); } };

  const fireOutboundWebhook = async (leadData: any) => {
    if (!settings.outboundWebhookUrl) return;
    try { await fetch('/api/webhook/outbound', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ targetUrl: settings.outboundWebhookUrl, payload: { event: 'LEAD_RESOLVED', lead: { id: leadData.id, phone: leadData.phone_number, name: leadData.full_name, email: leadData.email || '', resolved_at: new Date().toISOString() } } }) }); logAudit('WEBHOOK_FIRED', `Successfully pushed resolved lead +${leadData.phone_number} to external automation.`); } catch (err) { logAudit('WEBHOOK_FAILED', `Failed to push lead +${leadData.phone_number} to external automation.`); }
  };

  const handleCSVUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]; if (!file) return; setIsUploadingCSV(true); const reader = new FileReader();
    reader.onload = async (event) => {
      try { const text = event.target?.result as string; const rows = text.split('\n'); const newLeads = [];
        for (let i = 1; i < rows.length; i++) { const cols = rows[i].split(','); if (cols.length >= 1 && cols[0].trim()) { let phone = cols[0].replace(/\D/g, ''); if (phone) newLeads.push({ phone_number: phone, full_name: cols[1]?.trim() || 'Imported Contact', status: 'ACTIVE', last_message: 'System Migration' }); } }
        if (newLeads.length > 0) { const { error } = await supabase.from('customers').insert(newLeads); if (!error) { alert(`✅ Migration Complete! Imported ${newLeads.length} leads.`); logAudit('SYSTEM_MIGRATION', `Admin imported ${newLeads.length} leads via CSV.`); fetchLeads(); } else { alert("Database Error: Check console."); } } else { alert("No valid phone numbers found in the CSV."); }
      } catch (err) { alert("Failed to parse CSV file."); } setIsUploadingCSV(false); e.target.value = ''; 
    }; reader.readAsText(file);
  };

  useEffect(() => {
    if (!selectedLead) { setShopifyData(null); return; }
    setEditProfile({ full_name: selectedLead.full_name || '', email: selectedLead.email || '', profile_notes: selectedLead.profile_notes || '' });
    const fetchChatHistory = async () => { const { data } = await supabase.from('messages').select('*').eq('customer_id', selectedLead.id).order('created_at', { ascending: true }); if (data) setMessages(data); }; fetchChatHistory();
    const fetchShopifyData = async () => {
      setLoadingShopify(true);
      try { const response = await fetch(`/api/shopify/customer?phone=${encodeURIComponent(selectedLead.phone_number)}`); const contentType = response.headers.get("content-type"); if (!response.ok || !contentType || !contentType.includes("application/json")) { setShopifyData(null); setLoadingShopify(false); return; } const data = await response.json(); setShopifyData(data); } catch (err) { setShopifyData(null); } setLoadingShopify(false);
    };
    if (selectedLead.phone_number) fetchShopifyData();
    const msgChannel = supabase.channel('realtime-messages').on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'messages' }, (payload: any) => { if (payload.new.customer_id === selectedLead.id) { setMessages(prev => prev.map(m => m.id === payload.new.id ? payload.new : m)); } }).on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'messages' }, (payload: any) => { if (payload.new.customer_id === selectedLead.id) setMessages((prev) => [...prev, payload.new]); if (payload.new.is_outbound) setTotalSent(prev => prev + 1); else if (!payload.new.is_internal) setTotalReceived(prev => prev + 1); }).subscribe();
    return () => { supabase.removeChannel(msgChannel); };
  }, [selectedLead?.id]);

  const handleUpdateProfile = async () => { await supabase.from('customers').update({ full_name: editProfile.full_name, email: editProfile.email, profile_notes: editProfile.profile_notes }).eq('id', selectedLead.id); fetchLeads(); };
  
  const handleToggleTag = async (tagId: string) => {
    if (!selectedLead || userRole !== 'ADMIN') return; let newTags = [...(selectedLead.tags || [])]; if (newTags.includes(tagId)) newTags = newTags.filter(t => t !== tagId); else newTags.push(tagId); setSelectedLead({ ...selectedLead, tags: newTags }); setLeads(prev => prev.map(l => l.id === selectedLead.id ? { ...l, tags: newTags } : l)); try { await supabase.from('customers').update({ tags: newTags }).eq('id', selectedLead.id); logAudit('TAG_UPDATE', `Admin updated tags for +${selectedLead.phone_number}`); } catch (err) {}
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => { setNewMessage(e.target.value); const lastWord = e.target.value.split(' ').pop() || ''; if (lastWord.startsWith('/')) { setShowCommandMenu(true); setCommandQuery(lastWord.substring(1).toLowerCase()); } else { setShowCommandMenu(false); } };
  const insertQuickReply = (content: string) => { const words = newMessage.split(' '); words.pop(); setNewMessage((words.join(' ') + (words.length > 0 ? ' ' : '') + content + ' ').trimStart()); setShowCommandMenu(false); };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault(); if (!newMessage.trim() || !selectedLead) return; const content = newMessage; const internalStatus = isInternal; setNewMessage(''); setIsInternal(false); setShowCommandMenu(false);
    try { await supabase.from('messages').insert({ customer_id: selectedLead.id, content, is_outbound: true, is_internal: internalStatus, status: 'sent' }); if (selectedLead.status === 'NEW_ORDER') { await supabase.from('customers').update({ status: 'ACTIVE' }).eq('id', selectedLead.id); setLeads(prev => prev.map(l => l.id === selectedLead.id ? { ...l, status: 'ACTIVE' } : l)); setSelectedLead((prev: any) => prev ? { ...prev, status: 'ACTIVE' } : null); } if (!internalStatus) await fetch('/api/send', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ to: selectedLead.phone_number, message: content }) }); } catch (err) {}
  };

  const handleSendInteractive = async (type: 'button' | 'list') => {
    if (!selectedLead) return; let interactivePayload; let displayMessage = "";
    if (type === 'button') { displayMessage = "🔘 [Sent Quick Reply Buttons]"; interactivePayload = { type: "button", body: { text: "Hi! How can we assist you today?" }, action: { buttons: [ { type: "reply", reply: { id: "btn_sales", title: "Sales" } }, { type: "reply", reply: { id: "btn_support", title: "Support" } } ] } }; } else { displayMessage = "📋 [Sent Interactive Menu List]"; interactivePayload = { type: "list", header: { type: "text", text: "Main Menu" }, body: { text: "Please select an option from the menu below so we can route you correctly:" }, footer: { text: "ChatRax Pro Auto-Menu" }, action: { button: "View Options", sections: [ { title: "Order Help", rows: [ { id: "row_track", title: "Track Order", description: "Check your delivery status" }, { id: "row_return", title: "Returns", description: "Start a return process" } ] } ] } }; }
    try { await supabase.from('messages').insert({ customer_id: selectedLead.id, content: displayMessage, is_outbound: true, is_internal: false, status: 'sent' }); if (selectedLead.status === 'NEW_ORDER') { await supabase.from('customers').update({ status: 'ACTIVE' }).eq('id', selectedLead.id); setLeads(prev => prev.map(l => l.id === selectedLead.id ? { ...l, status: 'ACTIVE' } : l)); setSelectedLead((prev: any) => prev ? { ...prev, status: 'ACTIVE' } : null); } await fetch('/api/send', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ to: selectedLead.phone_number, type: 'interactive', interactive: interactivePayload }) }); } catch (err) {}
  };

  const renderMessageContent = (content: string) => {
    if (content.startsWith('MEDIA::')) { const parts = content.split('::'); const type = parts[1]; const mediaId = parts[2]; if (type === 'image') return (<div className="mt-1"><img src={`/api/media?id=${mediaId}`} alt="Customer Upload" className="max-w-[180px] rounded-lg shadow-sm border border-white/10" /></div>); if (type === 'audio') return (<div className="mt-1"><audio controls className="max-w-[200px] h-8 rounded-full shadow-sm"><source src={`/api/media?id=${mediaId}`} type="audio/ogg" />Your browser does not support the audio element.</audio></div>); if (type === 'video') return (<div className="mt-1"><video controls className="max-w-[200px] rounded-lg shadow-sm border border-white/10"><source src={`/api/media?id=${mediaId}`} /></video></div>); }
    return content;
  };

  const handleAddTemplate = async (e: React.FormEvent) => { e.preventDefault(); if (!newShortcut.trim() || !newTemplateContent.trim()) return; try { const cleanShortcut = newShortcut.replace('/', '').trim().toLowerCase(); const { data, error } = await supabase.from('quick_replies').insert([{ shortcut: cleanShortcut, content: newTemplateContent.trim() }]).select(); if (!error && data) { setQuickReplies([data[0], ...quickReplies]); setNewShortcut(''); setNewTemplateContent(''); } } catch (err) {} };
  const handleDeleteTemplate = async (id: string) => { if (!window.confirm("Delete this template permanently?")) return; try { await supabase.from('quick_replies').delete().eq('id', id); setQuickReplies(quickReplies.filter(q => q.id !== id)); } catch (err) {} };
  const handleCopyTemplate = (id: string, content: string) => { navigator.clipboard.writeText(content); setCopiedId(id); setTimeout(() => setCopiedId(null), 2000); };
  const startEditingTemplate = (template: {id: string, shortcut: string, content: string}) => { setEditingTemplateId(template.id); setEditShortcut(template.shortcut); setEditTemplateContent(template.content); };
  const cancelEditingTemplate = () => { setEditingTemplateId(null); setEditShortcut(''); setEditTemplateContent(''); };
  const handleUpdateTemplate = async (id: string) => { if (!editShortcut.trim() || !editTemplateContent.trim()) return; try { const cleanShortcut = editShortcut.replace('/', '').trim().toLowerCase(); const { error } = await supabase.from('quick_replies').update({ shortcut: cleanShortcut, content: editTemplateContent.trim() }).eq('id', id); if (!error) { setQuickReplies(prev => prev.map(q => q.id === id ? { ...q, shortcut: cleanShortcut, content: editTemplateContent.trim() } : q)); setEditingTemplateId(null); } } catch (err) {} };

  const handleDeleteMemo = async (memoId: string) => { try { await supabase.from('messages').delete().eq('id', memoId); setMessages(prev => prev.filter(m => m.id !== memoId)); } catch (err) {} };
  const handleDeleteMessage = async (msgId: string) => { if (!window.confirm("Delete this message from the system?")) return; try { await supabase.from('messages').delete().eq('id', msgId); setMessages(prev => prev.filter(m => m.id !== msgId)); } catch (err) {} };
  const handleDeleteLead = async (e: React.MouseEvent, id: string, name: string) => { e.stopPropagation(); if (userRole !== 'ADMIN') { alert("Only Admins can delete conversations."); return; } if (!window.confirm('Are you sure you want to completely delete this lead and their conversation?')) return; try { await supabase.from('customers').delete().eq('id', id); logAudit('DELETE_LEAD', `Deleted entire lead record for: ${name}`); setLeads(prev => prev.filter(l => l.id !== id)); if (selectedLead?.id === id) setSelectedLead(null); } catch (err) {} };
  const toggleStar = (e: React.MouseEvent, id: string) => { e.stopPropagation(); setStarredLeads(prev => { const next = new Set(prev); if (next.has(id)) next.delete(id); else next.add(id); return next; }); };

  const handleTakeOver = async (id: string, phone: string) => { await supabase.from('customers').update({ status: 'ACTIVE' }).eq('id', id); logAudit('TAKEOVER', `Agent took over inbound lead: +${phone}`); };
  const handleResolveChat = async (id: string, phone: string) => { await supabase.from('customers').update({ status: 'RESOLVED' }).eq('id', id); logAudit('RESOLVE_LEAD', `Agent resolved lead: +${phone}`); if (settings.outboundWebhookUrl && selectedLead) fireOutboundWebhook(selectedLead); setSelectedLead(null); };
  
  const handleExportPDF = () => {
    if (!selectedLead || userRole !== 'ADMIN') return; logAudit('EXPORT_PDF', `Admin downloaded PDF intelligence report for +${selectedLead.phone_number}`);
    const doc = new jsPDF(); const name = selectedLead.full_name || selectedLead.phone_number;
    doc.setFontSize(20); doc.setTextColor(6, 182, 212); doc.text(`${settings.workspaceName} Intelligence Report`, 20, 20); doc.setFontSize(10); doc.setTextColor(100); doc.text(`Subject: ${name}`, 20, 30); doc.text(`Generated: ${new Date().toLocaleString()}`, 20, 35); doc.line(20, 40, 190, 40); doc.setFontSize(12); doc.setTextColor(0); doc.text("Identity Profile", 20, 50); doc.setFontSize(10); doc.text(`Full Name: ${selectedLead.full_name || 'N/A'}`, 20, 60); doc.text(`Phone: ${selectedLead.phone_number}`, 20, 65); doc.text(`Email Hash: ${selectedLead.email || 'N/A'}`, 20, 70); doc.text("Notes:", 20, 80);
    const splitNotes = doc.splitTextToSize(selectedLead.profile_notes || "No notes provided.", 160); doc.text(splitNotes, 20, 85); let yPos = 110; doc.setFontSize(12); doc.text("Communication Log", 20, yPos); yPos += 10;
    messages.forEach((msg) => { if (yPos > 270) { doc.addPage(); yPos = 20; } const type = msg.is_internal ? "[INTERNAL MEMO]" : (msg.is_outbound ? "[AGENT]" : "[CUSTOMER]"); doc.setFontSize(8); doc.setTextColor(150); doc.text(`${new Date(msg.created_at).toLocaleString()} - ${type}`, 20, yPos); yPos += 5; doc.setFontSize(10); doc.setTextColor(msg.is_internal ? 180 : 0); const splitMsg = doc.splitTextToSize(msg.content, 160); doc.text(splitMsg, 20, yPos); yPos += (splitMsg.length * 5) + 5; });
    doc.save(`${settings.workspaceName.replace(/\s+/g, '_')}_Report_${name.replace(/\s+/g, '_')}.pdf`);
  };

  const handleLaunchCampaign = async (e: React.FormEvent) => {
    e.preventDefault(); if (!campaignName || !campaignTemplateId) { alert("Please fill in all campaign details."); return; } if (!window.confirm(`Are you sure you want to blast this to your ${campaignAudience} audience?`)) return;
    try { const response = await fetch('/api/campaign', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ campaignName, audience: campaignAudience, templateId: campaignTemplateId }) }); const data = await response.json(); if (data.success) { alert(`🚀 Broadcast Complete! Sent to ${data.broadcasted} customers.`); logAudit('LAUNCH_CAMPAIGN', `Launched broadcast '${campaignName}' to ${data.broadcasted} leads.`); setCampaignName(''); setCampaignTemplateId(''); } else { alert(`Error: ${data.error}`); } } catch (err) { alert("Failed to launch campaign."); }
  };

  // ─── RENDER COMPUTATIONS ───
  const chatMessages = messages.filter(m => !m.is_internal);
  const internalMemos = messages.filter(m => m.is_internal);
  const searchedLeads = leads.filter(l => {
    if (!globalSearch) return true;
    const searchLower = globalSearch.toLowerCase();
    return ((l.full_name && l.full_name.toLowerCase().includes(searchLower)) || (l.phone_number && l.phone_number.includes(searchLower)) || (l.last_message && l.last_message.toLowerCase().includes(searchLower)));
  });

  const newOrdersCount = searchedLeads.filter(l => l.status === 'NEW_ORDER').length;
  const activeCount = searchedLeads.filter(l => l.status === 'ACTIVE').length;
  const resolvedCount = searchedLeads.filter(l => l.status === 'RESOLVED').length;
  const handoffCount = searchedLeads.filter(l => l.status === 'HANDOFF').length;

  const activeConversationsCount = leads.filter(l => l.status !== 'RESOLVED').length;
  const filteredReplies = quickReplies.filter(r => r.shortcut.toLowerCase().includes(commandQuery));
  const totalLeads = leads.length || 1; 
  const newOrdersPct = leads.length ? Math.round((leads.filter(l => l.status === 'NEW_ORDER').length / totalLeads) * 100) : 0;
  const activePct = leads.length ? Math.round((leads.filter(l => l.status === 'ACTIVE').length / totalLeads) * 100) : 0;
  const resolvedPct = leads.length ? Math.round((leads.filter(l => l.status === 'RESOLVED').length / totalLeads) * 100) : 0;
  const resolutionRate = leads.length > 0 ? Math.round((leads.filter(l => l.status === 'RESOLVED').length / leads.length) * 100) : 0;
  const totalMessagesUsed = totalSent + totalReceived;

  const activeTheme = BRAND_COLORS[settings.accentColor as keyof typeof BRAND_COLORS] || BRAND_COLORS.emerald;
  const brandNameParts = settings.workspaceName.split(' ');
  const brandLastName = brandNameParts.length > 1 ? brandNameParts.pop() : '';
  const brandFirstName = brandNameParts.join(' ') || settings.workspaceName;

  // ─── MAIN LAYOUT ───
  return (
    <div className="flex h-screen w-screen text-zinc-200 font-sans overflow-hidden bg-[#0A101C]">
      
      <style dangerouslySetInnerHTML={{__html: `
        @keyframes led-breathe { 0%, 100% { box-shadow: 0 0 4px 1px rgba(255, 255, 255, 0.2); transform: scale(1); opacity: 0.8; } 50% { box-shadow: 0 0 12px 3px rgba(255, 255, 255, 0.6); transform: scale(1.1); opacity: 1; } }
        .animate-led { animation: led-breathe 3s ease-in-out infinite; }
        .custom-scrollbar::-webkit-scrollbar { width: 5px; height: 5px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: #374151; border-radius: 10px; }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: #4B5563; }
      `}} />

      {/* ─── LEFT SIDEBAR NAVIGATION ─── */}
      <div className="w-60 border-r border-white/5 bg-[#0F172A] flex flex-col z-40 shrink-0 h-full">
        <div className="h-20 flex items-center px-6 border-b border-white/5 shrink-0">
          <h1 className="text-lg font-extrabold tracking-tight text-white flex items-center gap-2">
            <span className={`w-7 h-7 rounded-lg bg-gradient-to-br ${activeTheme.gradient} flex items-center justify-center`}>
               <MessageCircle className="w-4 h-4 text-white" />
            </span>
            <span className="truncate">{brandFirstName} <span className={activeTheme.text.replace('text-', '')}>{brandLastName}</span></span>
          </h1>
        </div>
        
        <div className="flex-1 py-4 px-3 space-y-1 overflow-y-auto custom-scrollbar">
          {userRole === 'ADMIN' && (
            <button onClick={() => setActiveView('dashboard')} className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors font-medium text-sm ${activeView === 'dashboard' ? 'bg-[#1E293B] text-white' : 'text-zinc-400 hover:bg-[#1E293B]/50 hover:text-white'}`}><LayoutDashboard className="w-4 h-4" /> Dashboard</button>
          )}
          <button onClick={() => setActiveView('conversations')} className={`w-full flex items-center justify-between px-3 py-2.5 rounded-lg transition-colors font-medium text-sm ${activeView === 'conversations' ? 'bg-[#1E293B] text-white' : 'text-zinc-400 hover:bg-[#1E293B]/50 hover:text-white'}`}>
             <div className="flex items-center gap-3"><MessageSquare className="w-4 h-4" /> Conversations</div>
             <span className="bg-[#10b981]/20 text-[#10b981] text-[10px] px-2 py-0.5 rounded-full font-bold">{activeConversationsCount}</span>
          </button>
          
          {userRole === 'ADMIN' && (
             <>
                <button onClick={() => setActiveView('campaigns')} className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors font-medium text-sm ${activeView === 'campaigns' ? 'bg-[#1E293B] text-white' : 'text-zinc-400 hover:bg-[#1E293B]/50 hover:text-white'}`}><Megaphone className="w-4 h-4" /> Campaigns</button>
                <button onClick={() => setActiveView('templates')} className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors font-medium text-sm ${activeView === 'templates' ? 'bg-[#1E293B] text-white' : 'text-zinc-400 hover:bg-[#1E293B]/50 hover:text-white'}`}><LayoutTemplate className="w-4 h-4" /> Templates</button>
                <button onClick={() => setActiveView('analytics')} className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors font-medium text-sm ${activeView === 'analytics' ? 'bg-[#1E293B] text-white' : 'text-zinc-400 hover:bg-[#1E293B]/50 hover:text-white'}`}><BarChart2 className="w-4 h-4" /> Analytics</button>
                <button onClick={() => setActiveView('billing')} className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors font-medium text-sm ${activeView === 'billing' ? 'bg-[#1E293B] text-white' : 'text-zinc-400 hover:bg-[#1E293B]/50 hover:text-white'}`}><CreditCard className="w-4 h-4" /> Billing</button>
                <button onClick={() => setActiveView('settings')} className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors font-medium text-sm ${activeView === 'settings' ? 'bg-[#1E293B] text-white' : 'text-zinc-400 hover:bg-[#1E293B]/50 hover:text-white'}`}><Settings className="w-4 h-4" /> Settings</button>
             </>
          )}
        </div>

        <div className="p-4 border-t border-white/5 bg-[#0F172A] flex flex-col gap-3 shrink-0">
          <div className="flex items-center justify-between px-1 text-[9px] font-bold text-zinc-500 uppercase tracking-widest">
            <span>Access Level</span>
            <span className={userRole === 'ADMIN' ? activeTheme.text : 'text-zinc-400'}>{userRole}</span>
          </div>
          <button onClick={toggleRole} className={`w-full py-2 rounded-lg text-[10px] font-bold uppercase tracking-widest transition-all border ${userRole === 'ADMIN' ? `${activeTheme.bgSubtle} ${activeTheme.text} ${activeTheme.border}` : 'bg-[#1E293B] text-zinc-300 border-transparent hover:bg-white/10'}`}>
             Switch to {userRole === 'ADMIN' ? 'Agent' : 'Admin'} Mode
          </button>
          
          <div className="flex items-center justify-between p-2 rounded-lg bg-[#1E293B]/50 border border-white/5 mt-1">
             <div className="flex items-center gap-2.5 overflow-hidden px-1">
                <div className="w-7 h-7 shrink-0 rounded-full bg-gradient-to-tr from-sky-500 to-blue-600 flex items-center justify-center font-bold text-white text-xs">
                  {settings.adminName ? settings.adminName.charAt(0).toUpperCase() : 'N'}
                </div>
                <div className="overflow-hidden">
                  <p className="text-xs font-bold text-white truncate max-w-[100px]">{settings.adminName || 'Nasir Ahmed'}</p>
                </div>
             </div>
             <button onClick={handleLogOut} className="p-1.5 hover:bg-red-500/10 rounded text-zinc-400 hover:text-red-400 transition-all"><LogOut className="w-3.5 h-3.5" /></button>
          </div>
        </div>
      </div>

      {/* ─── MAIN VIEWPORT (Global Layout unlocked to allow vertical page scrolling) ─── */}
      <div className="flex-1 flex flex-col h-full relative z-30">
        
        {/* DASHBOARD VIEW */}
        {activeView === 'dashboard' && userRole === 'ADMIN' && (
          <div className="flex flex-col h-full bg-[#0A101C]">
            <div className="h-20 flex items-center justify-between px-6 border-b border-white/5 shrink-0 bg-[#0F172A]/50">
              <div>
                <h2 className="text-lg font-bold text-white tracking-tight">Command Center</h2>
                <p className="text-[10px] text-zinc-400 font-medium mt-0.5">Live overview of your Store & CRM activity</p>
              </div>
              <div className="flex items-center gap-3">
                 <div className={`flex items-center gap-2 bg-[#1E293B] border border-white/5 rounded-lg px-3 py-1.5 text-[10px] font-bold tracking-wider ${activeTheme.text}`}>
                    <div className={`w-1.5 h-1.5 rounded-full ${activeTheme.bg} animate-led`}></div>
                    LIVE SYNC • {currentTime || "CONNECTING..."}
                 </div>
              </div>
            </div>

            {/* This is the master layout lock for Kanban scrolling. It lets the whole page scroll. */}
            <div className="flex-1 p-6 flex flex-col overflow-y-auto custom-scrollbar">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6 shrink-0">
                  <div className="bg-[#1E293B]/50 border border-white/5 rounded-xl p-4 relative overflow-hidden">
                     <div className={`absolute top-0 left-0 w-1 h-full ${activeTheme.bg}`} />
                     <div className="flex justify-between items-start mb-2 pl-2">
                        <div className={`w-7 h-7 rounded-lg ${activeTheme.bgSubtle} flex items-center justify-center ${activeTheme.text}`}><ShoppingBag className="w-3.5 h-3.5"/></div>
                        <span className={`text-[9px] font-bold ${activeTheme.text} ${activeTheme.bgSubtle} px-2 py-0.5 rounded flex items-center gap-1`}>{newOrdersPct}%</span>
                     </div>
                     <p className="text-[10px] font-medium text-zinc-500 uppercase tracking-widest mb-0.5 pl-2">New Orders</p>
                     <h3 className="text-xl font-bold text-white pl-2">{newOrdersCount}</h3>
                  </div>

                  <div className="bg-[#1E293B]/50 border border-white/5 rounded-xl p-4 relative overflow-hidden">
                     <div className="absolute top-0 left-0 w-1 h-full bg-sky-500" />
                     <div className="flex justify-between items-start mb-2 pl-2">
                        <div className="w-7 h-7 rounded-lg bg-sky-500/10 flex items-center justify-center text-sky-400"><Activity className="w-3.5 h-3.5"/></div>
                        <span className="text-[9px] font-bold text-sky-400 bg-sky-500/10 px-2 py-0.5 rounded flex items-center gap-1">{activePct}%</span>
                     </div>
                     <p className="text-[10px] font-medium text-zinc-500 uppercase tracking-widest mb-0.5 pl-2">Active Contacts</p>
                     <h3 className="text-xl font-bold text-white pl-2">{activeCount}</h3>
                  </div>

                  <div className="bg-[#1E293B]/50 border border-white/5 rounded-xl p-4 relative overflow-hidden">
                     <div className="absolute top-0 left-0 w-1 h-full bg-lime-500" />
                     <div className="flex justify-between items-start mb-2 pl-2">
                        <div className="w-7 h-7 rounded-lg bg-lime-500/10 flex items-center justify-center text-lime-400"><ShieldCheck className="w-3.5 h-3.5"/></div>
                        <span className="text-[9px] font-bold text-lime-400 bg-lime-500/10 px-2 py-0.5 rounded flex items-center gap-1">{resolvedPct}%</span>
                     </div>
                     <p className="text-[10px] font-medium text-zinc-500 uppercase tracking-widest mb-0.5 pl-2">Resolved Leads</p>
                     <h3 className="text-xl font-bold text-white pl-2">{resolvedCount}</h3>
                  </div>

                  <div className="bg-[#1E293B]/50 border border-white/5 rounded-xl p-4 relative overflow-hidden">
                     <div className="absolute top-0 left-0 w-1 h-full bg-amber-500" />
                     <div className="flex justify-between items-start mb-2 pl-2">
                        <div className="w-7 h-7 rounded-lg bg-amber-500/10 flex items-center justify-center text-amber-400"><Send className="w-3.5 h-3.5 ml-0.5"/></div>
                        <span className="text-[9px] font-bold text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded flex items-center gap-1">Live</span>
                     </div>
                     <p className="text-[10px] font-medium text-zinc-500 uppercase tracking-widest mb-0.5 pl-2">Messages Sent</p>
                     <h3 className="text-xl font-bold text-white pl-2">{totalSent}</h3>
                  </div>
                </div>

                <div className="flex items-center justify-between mb-4 shrink-0">
                  <h3 className="text-sm font-bold text-white drop-shadow-sm">Live Action Board</h3>
                  <div className="relative w-64">
                     <Search className="w-3.5 h-3.5 text-zinc-500 absolute left-3 top-1/2 -translate-y-1/2" />
                     <input type="text" placeholder="Search database..." value={globalSearch} onChange={(e) => setGlobalSearch(e.target.value)} className={`w-full bg-[#1E293B] border border-transparent rounded-lg pl-9 pr-3 py-1.5 text-xs text-white ${activeTheme.focusBorder} outline-none transition-colors placeholder-zinc-500`} />
                  </div>
                </div>

                {/* Removing height locks so columns grow down as far as they need to */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 items-start pb-6">
                  {COLUMNS.map((status) => {
                    const config = COLUMN_CONFIG[status];
                    const ColumnIcon = config.icon;
                    const colLeads = searchedLeads.filter(l => l.status === status);

                    return (
                      <div key={status} onDragOver={handleDragOver} onDrop={(e) => handleDrop(e, status)} className="flex flex-col bg-[#0F172A] rounded-xl border border-white/5 min-h-[300px]">
                        
                        <div className="flex items-center justify-between p-3 border-b border-white/5 shrink-0 bg-[#111827] rounded-t-xl">
                          <div className="flex items-center gap-2">
                             <ColumnIcon className="w-3.5 h-3.5" style={{ color: config.hex }} />
                             <h2 className="text-[10px] font-bold tracking-widest text-zinc-400 uppercase">{status.replace('_', ' ')}</h2>
                          </div>
                          <span className="text-[10px] bg-[#1E293B] text-zinc-300 px-2 py-0.5 rounded-full font-bold">{colLeads.length}</span>
                        </div>

                        <div className="p-2 flex flex-col gap-2">
                             {colLeads.map((lead) => {
                               const isSlaBreached = status === 'NEW_ORDER' && (now - new Date(lead.created_at).getTime() > 900000);
                               const isDragging = draggedLead === lead.id;

                               return (
                                 <div key={lead.id} draggable onDragStart={(e) => handleDragStart(e, lead.id)} onDragEnd={handleDragEnd} onClick={() => setSelectedLead(lead)} 
                                   className={`p-3.5 bg-[#1E293B] rounded-lg border cursor-grab active:cursor-grabbing hover:border-zinc-500 transition-colors ${isDragging ? 'opacity-40 border-dashed border-zinc-500' : 'border-white/5'} ${isSlaBreached ? 'border-red-500/30 bg-red-500/5' : ''}`}>
                                   
                                   {lead.tags && lead.tags.length > 0 && (
                                      <div className="flex flex-wrap gap-1 mb-2">
                                         {lead.tags.map((tagId: string) => {
                                            const tagMeta = AVAILABLE_TAGS.find(t => t.id === tagId);
                                            if (!tagMeta) return null;
                                            return ( <span key={tagId} className={`text-[8px] font-bold uppercase tracking-widest px-1.5 py-[2px] rounded border ${tagMeta.color}`}>{tagMeta.label}</span> );
                                         })}
                                      </div>
                                   )}

                                   <div className="flex justify-between items-start mb-0.5">
                                     <span className="font-sans text-sm font-semibold text-white">{lead.full_name || 'Store Customer'}</span>
                                     {isSlaBreached && <AlertTriangle className="w-3.5 h-3.5 text-red-400" />}
                                   </div>
                                   <span className="text-[10px] text-zinc-500">+{lead.phone_number}</span>
                                 </div>
                               );
                             })}
                        </div>
                      </div>
                    );
                  })}
                </div>
            </div>
          </div>
        )}

        {/* CONVERSATIONS VIEW (Agent & Admin) */}
        {activeView === 'conversations' && (
          <div className="flex flex-col h-full bg-[#0A101C]">
            <div className="h-20 flex items-center justify-between px-6 border-b border-white/5 shrink-0 bg-[#0F172A]/50">
              <div>
                <h2 className="text-lg font-bold text-white">Conversations</h2>
                <p className="text-[10px] text-zinc-400 font-medium mt-0.5">Manage and route your active customer chats</p>
              </div>
              <div className="relative w-64">
                  <Search className="w-3.5 h-3.5 text-zinc-500 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input type="text" placeholder="Search database..." value={globalSearch} onChange={(e) => setGlobalSearch(e.target.value)} className={`w-full bg-[#1E293B] border border-transparent rounded-lg pl-9 pr-3 py-1.5 text-xs text-white ${activeTheme.focusBorder} outline-none transition-colors placeholder-zinc-500`} />
               </div>
            </div>
            
            <div className="flex-1 overflow-y-auto custom-scrollbar p-6">
               <div className="bg-[#111827]/60 backdrop-blur-xl border border-white/10 rounded-2xl p-5 shadow-2xl">
                  <div className="grid grid-cols-1 lg:grid-cols-4 gap-4 items-start">
                    {COLUMNS.map((status) => {
                      const config = COLUMN_CONFIG[status];
                      const ColumnIcon = config.icon;
                      const colLeads = searchedLeads.filter(l => l.status === status);

                      return (
                        <div key={status} onDragOver={handleDragOver} onDrop={(e) => handleDrop(e, status)} className="flex flex-col bg-[#0F172A] rounded-xl border border-white/5 min-h-[300px]">
                          <div className="flex items-center justify-between p-3 border-b border-white/5 shrink-0 bg-[#111827] rounded-t-xl">
                            <div className="flex items-center gap-2">
                               <ColumnIcon className="w-3.5 h-3.5" style={{ color: config.hex }} />
                               <h2 className="text-[10px] font-bold tracking-widest text-zinc-400 uppercase">{status.replace('_', ' ')}</h2>
                            </div>
                            <span className="text-[10px] bg-[#1E293B] text-zinc-300 px-2 py-0.5 rounded-full font-bold">{colLeads.length}</span>
                          </div>
                          
                          <div className="p-2 flex flex-col gap-2">
                               {colLeads.map((lead) => {
                                 const isSlaBreached = status === 'NEW_ORDER' && (now - new Date(lead.created_at).getTime() > 900000);
                                 const isDragging = draggedLead === lead.id;
                                 return (
                                   <div key={lead.id} draggable onDragStart={(e) => handleDragStart(e, lead.id)} onDragEnd={handleDragEnd} onClick={() => setSelectedLead(lead)} 
                                     className={`p-3.5 bg-[#1E293B] rounded-lg border cursor-grab active:cursor-grabbing hover:border-zinc-500 transition-colors ${isDragging ? 'opacity-40 border-dashed border-zinc-500' : 'border-white/5'} ${isSlaBreached ? 'border-red-500/30 bg-red-500/5' : ''}`}>
                                     
                                     {lead.tags && lead.tags.length > 0 && (
                                        <div className="flex flex-wrap gap-1 mb-2">
                                           {lead.tags.map((tagId: string) => {
                                              const tagMeta = AVAILABLE_TAGS.find(t => t.id === tagId);
                                              if (!tagMeta) return null;
                                              return ( <span key={tagId} className={`text-[8px] font-bold uppercase tracking-widest px-1.5 py-[2px] rounded border ${tagMeta.color}`}>{tagMeta.label}</span> );
                                           })}
                                        </div>
                                     )}

                                     <div className="flex justify-between items-start mb-0.5">
                                       <span className="font-sans text-sm font-semibold text-white">{lead.full_name || 'Store Customer'}</span>
                                       {isSlaBreached && <AlertTriangle className="w-3.5 h-3.5 text-red-400" />}
                                     </div>
                                     <span className="text-[10px] text-zinc-500">+{lead.phone_number}</span>
                                   </div>
                                 );
                               })}
                          </div>
                        </div>
                      );
                    })}
                  </div>
               </div>
            </div>
          </div>
        )}

        {/* BILLING VIEW (NEW) */}
        {activeView === 'billing' && userRole === 'ADMIN' && (
          <div className="flex flex-col h-full bg-[#0A101C]">
            <div className="h-20 flex items-center justify-between px-6 border-b border-white/5 shrink-0 bg-[#0F172A]/50">
              <div>
                <h2 className="text-lg font-bold text-white">Billing & Usage</h2>
                <p className="text-[10px] text-zinc-400 font-medium mt-0.5">Manage your workspace subscription and limits</p>
              </div>
            </div>
            <div className="flex-1 overflow-y-auto custom-scrollbar p-6">
               <div className="max-w-4xl mx-auto space-y-6">
                  
                  {/* Current Plan Overview */}
                  <div className="bg-[#0F172A] border border-white/5 rounded-2xl p-6 relative overflow-hidden">
                     <div className="absolute top-0 right-0 p-4 opacity-5"><CreditCard className="w-32 h-32 text-white" /></div>
                     <h3 className={`text-xs font-bold ${activeTheme.text} flex items-center gap-1.5 mb-5 relative z-10`}><CreditCard className="w-4 h-4" /> Subscription Status</h3>
                     
                     <div className="relative z-10 grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="flex flex-col justify-center p-5 bg-[#111827] rounded-xl border border-white/5">
                           <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest mb-1">Current Plan</p>
                           <p className="text-xl font-bold text-white flex items-center gap-2">
                              {subscription.plan} 
                              <span className={`text-[10px] px-2.5 py-1 rounded-full ${subscription.status === 'active' ? 'bg-emerald-500/20 text-emerald-400' : 'bg-amber-500/20 text-amber-400'}`}>
                                 {subscription.status === 'active' ? 'Active' : `${subscription.daysLeft} Days Left`}
                              </span>
                           </p>
                           {subscription.status !== 'active' && (
                              <button onClick={() => handleUpgrade('Pro')} className={`mt-4 w-full py-2 bg-gradient-to-r ${activeTheme.gradient} text-white text-[10px] font-bold uppercase tracking-widest rounded-lg transition-transform hover:scale-[1.02]`}>
                                 Upgrade Now
                              </button>
                           )}
                        </div>

                        <div className="p-5 bg-[#111827] rounded-xl border border-white/5 flex flex-col justify-center">
                           <div className="flex justify-between text-[10px] font-bold text-zinc-400 mb-2">
                              <span>Message Volume Usage</span>
                              <span>{totalMessagesUsed} / {subscription.messageLimit}</span>
                           </div>
                           <div className="w-full bg-[#1E293B] rounded-full h-2.5 overflow-hidden">
                              <div className={`${activeTheme.bg} h-full rounded-full transition-all duration-1000`} style={{ width: `${Math.min((totalMessagesUsed / subscription.messageLimit) * 100, 100)}%` }}></div>
                           </div>
                           <p className="text-[9px] text-zinc-500 mt-2">Volume resets at the end of your billing cycle.</p>
                        </div>
                     </div>
                  </div>

                  {/* Plan Options */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                     <div className="bg-[#0F172A] border border-white/5 rounded-2xl p-6 flex flex-col">
                        <h3 className="text-xl font-bold text-white mb-1">Pro Plan</h3>
                        <p className="text-xs text-zinc-500 mb-4">Perfect for growing stores.</p>
                        <p className="text-3xl font-black text-white mb-6">$99<span className="text-sm text-zinc-500 font-medium">/mo</span></p>
                        <ul className="space-y-3 mb-8 flex-1">
                           <li className="text-xs text-zinc-300 flex items-center gap-2"><Check className="w-4 h-4 text-emerald-400" /> 2,500 messages / month</li>
                           <li className="text-xs text-zinc-300 flex items-center gap-2"><Check className="w-4 h-4 text-emerald-400" /> 1 Agent Seat</li>
                           <li className="text-xs text-zinc-300 flex items-center gap-2"><Check className="w-4 h-4 text-emerald-400" /> Standard Support</li>
                        </ul>
                        <button onClick={() => handleUpgrade('Pro')} disabled={subscription.plan === 'Pro'} className="w-full py-2.5 rounded-lg text-xs font-bold transition-all bg-white/5 text-white hover:bg-white/10 disabled:opacity-50">
                           {subscription.plan === 'Pro' ? 'Current Plan' : 'Select Pro'}
                        </button>
                     </div>

                     <div className={`bg-[#0F172A] border ${activeTheme.border} rounded-2xl p-6 flex flex-col relative overflow-hidden`}>
                        <div className={`absolute top-0 right-0 bg-gradient-to-l ${activeTheme.gradient} text-white text-[9px] font-bold uppercase tracking-widest px-3 py-1 rounded-bl-lg`}>Popular</div>
                        <h3 className="text-xl font-bold text-white mb-1">Enterprise</h3>
                        <p className="text-xs text-zinc-500 mb-4">For high-volume operations.</p>
                        <p className="text-3xl font-black text-white mb-6">$299<span className="text-sm text-zinc-500 font-medium">/mo</span></p>
                        <ul className="space-y-3 mb-8 flex-1">
                           <li className="text-xs text-zinc-300 flex items-center gap-2"><Check className={`w-4 h-4 ${activeTheme.text}`} /> 10,000 messages / month</li>
                           <li className="text-xs text-zinc-300 flex items-center gap-2"><Check className={`w-4 h-4 ${activeTheme.text}`} /> Unlimited Agents</li>
                           <li className="text-xs text-zinc-300 flex items-center gap-2"><Check className={`w-4 h-4 ${activeTheme.text}`} /> Webhook Automations</li>
                           <li className="text-xs text-zinc-300 flex items-center gap-2"><Check className={`w-4 h-4 ${activeTheme.text}`} /> Priority Support</li>
                        </ul>
                        <button onClick={() => handleUpgrade('Enterprise')} disabled={subscription.plan === 'Enterprise'} className={`w-full py-2.5 rounded-lg text-xs font-bold transition-all bg-gradient-to-r ${activeTheme.gradient} text-white disabled:opacity-50`}>
                           {subscription.plan === 'Enterprise' ? 'Current Plan' : 'Select Enterprise'}
                        </button>
                     </div>
                  </div>

               </div>
            </div>
          </div>
        )}

        {/* TEMPLATES VIEW */}
        {activeView === 'templates' && (
          <div className="flex flex-col h-full bg-[#0A101C]">
            <div className="h-20 flex items-center justify-between px-6 border-b border-white/5 shrink-0 bg-[#0F172A]/50">
              <div>
                <h2 className="text-lg font-bold text-white drop-shadow-md">Template & Slash Commands</h2>
                <p className="text-[10px] text-zinc-400 font-medium tracking-wide mt-0.5">Manage your team's quick replies and canned responses</p>
              </div>
            </div>
            <div className="flex-1 overflow-y-auto custom-scrollbar p-6">
               <div className="max-w-5xl mx-auto space-y-6">
                  {userRole === 'ADMIN' && (
                     <div className="bg-[#0F172A] border border-white/5 rounded-2xl p-5">
                        <h3 className={`text-xs font-bold ${activeTheme.text} flex items-center gap-1.5 mb-4`}><Zap className="w-3.5 h-3.5" /> Create New Command</h3>
                        <form onSubmit={handleAddTemplate} className="flex flex-col md:flex-row gap-3">
                           <div className="w-full md:w-1/3">
                              <div className="relative">
                              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500 font-bold text-xs">/</span>
                              <input type="text" value={newShortcut} onChange={(e) => setNewShortcut(e.target.value)} placeholder="shortcut_name" className={`w-full bg-[#1E293B] border border-transparent rounded-lg pl-7 pr-3 py-2.5 text-xs text-white ${activeTheme.focusBorder} outline-none transition-colors`} />
                              </div>
                           </div>
                           <div className="flex-1">
                              <input type="text" value={newTemplateContent} onChange={(e) => setNewTemplateContent(e.target.value)} placeholder="Type the full message content here..." className={`w-full bg-[#1E293B] border border-transparent rounded-lg px-3 py-2.5 text-xs text-white ${activeTheme.focusBorder} outline-none transition-colors`} />
                           </div>
                           <button type="submit" disabled={!newShortcut.trim() || !newTemplateContent.trim()} className={`${activeTheme.bgSubtle} ${activeTheme.text} border ${activeTheme.border} ${activeTheme.hoverBg} disabled:opacity-50 transition-all rounded-lg px-5 py-2.5 text-xs font-bold`}>Save</button>
                        </form>
                     </div>
                  )}
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {quickReplies.length === 0 ? (
                      <div className="col-span-full p-6 text-center bg-[#0F172A] border border-dashed border-white/10 rounded-2xl text-zinc-500 text-xs font-medium">No templates saved yet. Create one above!</div>
                    ) : (
                      quickReplies.map((reply) => (
                        <div key={reply.id} className="group bg-[#0F172A] border border-white/5 hover:border-white/10 rounded-xl p-4 transition-colors relative min-h-[120px]">
                           {editingTemplateId === reply.id ? (
                              <div className="flex flex-col gap-2 h-full">
                                <div className="relative">
                                   <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-zinc-500 font-bold text-[10px]">/</span>
                                   <input type="text" value={editShortcut} onChange={(e) => setEditShortcut(e.target.value)} className={`w-full bg-[#1E293B] border border-transparent rounded-md pl-6 pr-2 py-1.5 text-[10px] text-white ${activeTheme.focusBorder} outline-none transition-colors`} />
                                </div>
                                <textarea value={editTemplateContent} onChange={(e) => setEditTemplateContent(e.target.value)} className={`w-full bg-[#1E293B] border border-transparent rounded-md px-2.5 py-1.5 text-[10px] text-white ${activeTheme.focusBorder} outline-none resize-none transition-colors flex-1 custom-scrollbar`} />
                                <div className="flex gap-1.5 justify-end mt-auto">
                                  <button onClick={cancelEditingTemplate} className="px-2 py-1 rounded text-[10px] font-bold text-zinc-400 hover:text-white hover:bg-white/5 transition-colors">Cancel</button>
                                  <button onClick={() => handleUpdateTemplate(reply.id)} className={`px-2 py-1 rounded text-[10px] font-bold ${activeTheme.bgSubtle} ${activeTheme.text} transition-colors`}>Save</button>
                                </div>
                              </div>
                           ) : (
                              <>
                                 <div className="absolute top-2.5 right-2.5 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                    {userRole === 'ADMIN' && ( <button onClick={() => startEditingTemplate(reply)} className="p-1.5 hover:bg-[#1E293B] rounded transition-colors text-zinc-400 hover:text-white" title="Edit Template"><Edit2 className="w-3 h-3" /></button> )}
                                    <button onClick={() => handleCopyTemplate(reply.id, reply.content)} className={`p-1.5 rounded transition-colors ${copiedId === reply.id ? `${activeTheme.bgSubtle} ${activeTheme.text}` : 'text-zinc-400 hover:text-white hover:bg-[#1E293B]'}`} title="Copy Content">{copiedId === reply.id ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}</button>
                                    {userRole === 'ADMIN' && ( <button onClick={() => handleDeleteTemplate(reply.id)} className="p-1.5 hover:bg-red-500/10 rounded transition-colors text-zinc-400 hover:text-red-400" title="Delete Template"><Trash2 className="w-3 h-3" /></button> )}
                                 </div>
                                 <h4 className={`${activeTheme.text} font-bold text-xs mb-2 flex items-center gap-1`}>/{reply.shortcut}</h4>
                                 <div className="bg-[#1E293B]/50 rounded-lg p-3 min-h-[60px]"><p className="text-[10px] text-zinc-300 leading-relaxed">{reply.content}</p></div>
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

        {/* CAMPAIGNS VIEW */}
        {activeView === 'campaigns' && userRole === 'ADMIN' && (
          <div className="flex flex-col h-full bg-[#0A101C]">
            <div className="h-20 flex items-center justify-between px-6 border-b border-white/5 shrink-0 bg-[#0F172A]/50">
              <div>
                <h2 className="text-lg font-bold text-white">Campaigns & Broadcasts</h2>
                <p className="text-[10px] text-zinc-400 font-medium mt-0.5">Send mass updates, promotions, and recovery messages</p>
              </div>
            </div>
            <div className="flex-1 overflow-y-auto custom-scrollbar p-6">
               <div className="max-w-6xl mx-auto grid grid-cols-1 xl:grid-cols-3 gap-6">
                  <div className="xl:col-span-1 space-y-6">
                    <div className="bg-[#0F172A] border border-white/5 rounded-2xl p-5">
                       <h3 className={`text-xs font-bold ${activeTheme.text} flex items-center gap-1.5 mb-5`}><Megaphone className="w-3.5 h-3.5" /> New Broadcast</h3>
                       <form onSubmit={handleLaunchCampaign} className="space-y-4">
                          <div className="space-y-1.5"><label className="text-[9px] font-bold text-zinc-400 uppercase tracking-widest pl-1">Campaign Name</label><input type="text" value={campaignName} onChange={(e) => setCampaignName(e.target.value)} placeholder="e.g. Eid Flash Sale" className={`w-full bg-[#1E293B] border border-transparent rounded-lg px-3 py-2.5 text-xs text-white ${activeTheme.focusBorder} outline-none transition-colors`} /></div>
                          <div className="space-y-1.5"><label className="text-[9px] font-bold text-zinc-400 uppercase tracking-widest pl-1">Target Audience</label>
                             <select value={campaignAudience} onChange={(e) => setCampaignAudience(e.target.value)} className={`w-full bg-[#1E293B] border border-transparent rounded-lg px-3 py-2.5 text-xs text-white ${activeTheme.focusBorder} outline-none transition-colors appearance-none cursor-pointer`}>
                               <option value="ALL">All Contacts ({leads.length})</option>{COLUMNS.map(status => ( <option key={status} value={status}>{status.replace('_', ' ')} ({leads.filter(l => l.status === status).length})</option> ))}
                             </select>
                          </div>
                          <div className="space-y-1.5"><label className="text-[9px] font-bold text-zinc-400 uppercase tracking-widest pl-1">Meta Template</label>
                             <select value={campaignTemplateId} onChange={(e) => setCampaignTemplateId(e.target.value)} className={`w-full bg-[#1E293B] border border-transparent rounded-lg px-3 py-2.5 text-xs text-white ${activeTheme.focusBorder} outline-none transition-colors appearance-none cursor-pointer`}>
                               <option value="" disabled>Select a template...</option>{quickReplies.map(reply => ( <option key={reply.id} value={reply.id}>/{reply.shortcut}</option> ))}
                             </select>
                          </div>
                          <button type="submit" className={`w-full bg-gradient-to-r ${activeTheme.gradient} text-white font-bold text-xs px-4 py-2.5 rounded-lg transition-opacity hover:opacity-90 flex items-center justify-center gap-1.5 mt-3`}><Send className="w-3.5 h-3.5 ml-1" /> Launch Broadcast</button>
                       </form>
                    </div>
                  </div>
                  <div className="xl:col-span-2">
                    <div className="bg-[#0F172A] border border-white/5 rounded-2xl p-5 h-full">
                       <h3 className="text-xs font-bold text-white flex items-center gap-1.5 mb-5"><Activity className="w-3.5 h-3.5 text-zinc-400" /> Broadcast History</h3>
                       <div className="bg-[#111827] border border-dashed border-white/10 rounded-xl p-8 flex flex-col items-center justify-center text-center h-[200px]">
                          <Users className="w-10 h-10 text-zinc-600 mb-2" />
                          <p className="text-zinc-400 text-xs font-medium">No campaigns launched yet.</p>
                       </div>
                    </div>
                  </div>
               </div>
            </div>
          </div>
        )}

        {/* ANALYTICS VIEW */}
        {activeView === 'analytics' && userRole === 'ADMIN' && (
          <div className="flex flex-col h-full bg-[#0A101C]">
            <div className="h-20 flex items-center justify-between px-6 border-b border-white/5 shrink-0 bg-[#0F172A]/50">
              <div>
                <h2 className="text-lg font-bold text-white">Analytics & Performance</h2>
                <p className="text-[10px] text-zinc-400 font-medium mt-0.5">Real-time metrics on team performance and conversation volume</p>
              </div>
            </div>
            <div className="flex-1 overflow-y-auto custom-scrollbar p-6">
               <div className="max-w-6xl mx-auto space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <div className="bg-[#0F172A] border border-white/5 rounded-xl p-5">
                       <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest mb-1">Resolution Rate</p>
                       <h3 className="text-2xl font-black text-white mb-1.5">{resolutionRate}%</h3>
                       <p className="text-[9px] text-emerald-400 font-semibold flex items-center gap-1"><TrendingUp className="w-2.5 h-2.5"/> +4% from last week</p>
                    </div>
                    <div className="bg-[#0F172A] border border-white/5 rounded-xl p-5">
                       <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest mb-1">Total Contacts</p>
                       <h3 className="text-2xl font-black text-white mb-1.5">{leads.length}</h3>
                       <p className="text-[9px] text-sky-400 font-semibold flex items-center gap-1"><TrendingUp className="w-2.5 h-2.5"/> Active database</p>
                    </div>
                    <div className="bg-[#0F172A] border border-white/5 rounded-xl p-5">
                       <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest mb-1">Avg Response Time</p>
                       <h3 className="text-2xl font-black text-white mb-1.5"><span className="text-lg text-zinc-500">&lt;</span> 2<span className="text-base text-zinc-500">m</span></h3>
                       <p className="text-[9px] text-emerald-400 font-semibold flex items-center gap-1"><TrendingDown className="w-2.5 h-2.5"/> -30s from last week</p>
                    </div>
                    <div className="bg-[#0F172A] border border-white/5 rounded-xl p-5">
                       <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest mb-1">Total Messages</p>
                       <h3 className="text-2xl font-black text-white mb-1.5">{totalSent + totalReceived}</h3>
                       <p className="text-[9px] text-purple-400 font-semibold flex items-center gap-1">In & Outbound</p>
                    </div>
                  </div>
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                     <div className="bg-[#0F172A] border border-white/5 rounded-2xl p-6">
                        <h3 className="text-xs font-bold text-white flex items-center gap-1.5 mb-6"><Search className="w-3.5 h-3.5 text-zinc-400" /> Lead Pipeline Funnel</h3>
                        <div className="space-y-5">
                           <div>
                              <div className="flex justify-between text-[10px] font-bold text-zinc-400 mb-1.5"><span>New Orders (Entry)</span><span>{newOrdersCount}</span></div>
                              <div className="w-full bg-[#1E293B] rounded-full h-2 overflow-hidden"><div className="bg-emerald-500 h-full rounded-full" style={{ width: `${leads.length ? (newOrdersCount / leads.length) * 100 : 0}%` }}></div></div>
                           </div>
                           <div>
                              <div className="flex justify-between text-[10px] font-bold text-zinc-400 mb-1.5"><span>Handoff (Routing)</span><span>{handoffCount}</span></div>
                              <div className="w-full bg-[#1E293B] rounded-full h-2 overflow-hidden"><div className="bg-yellow-500 h-full rounded-full" style={{ width: `${leads.length ? (handoffCount / leads.length) * 100 : 0}%` }}></div></div>
                           </div>
                           <div>
                              <div className="flex justify-between text-[10px] font-bold text-zinc-400 mb-1.5"><span>Active (In Progress)</span><span>{activeCount}</span></div>
                              <div className="w-full bg-[#1E293B] rounded-full h-2 overflow-hidden"><div className="bg-sky-500 h-full rounded-full" style={{ width: `${leads.length ? (activeCount / leads.length) * 100 : 0}%` }}></div></div>
                           </div>
                           <div>
                              <div className="flex justify-between text-[10px] font-bold text-zinc-400 mb-1.5"><span>Resolved (Closed)</span><span>{resolvedCount}</span></div>
                              <div className="w-full bg-[#1E293B] rounded-full h-2 overflow-hidden"><div className="bg-lime-500 h-full rounded-full" style={{ width: `${leads.length ? (resolvedCount / leads.length) * 100 : 0}%` }}></div></div>
                           </div>
                        </div>
                     </div>
                     <div className="bg-[#0F172A] border border-white/5 rounded-2xl p-6 flex flex-col">
                        <h3 className="text-xs font-bold text-white flex items-center gap-1.5 mb-6"><BarChart2 className="w-3.5 h-3.5 text-zinc-400" /> Message Volume Split</h3>
                        <div className="flex-1 flex flex-col justify-center items-center">
                           <div className="w-full flex h-12 rounded-xl overflow-hidden border border-white/5 mb-5">
                              <div className="bg-zinc-600 flex items-center justify-center text-[10px] font-bold text-white transition-all duration-1000" style={{ width: `${(totalSent + totalReceived) === 0 ? 50 : (totalSent / (totalSent + totalReceived)) * 100}%` }}>{totalSent > 0 && `${Math.round((totalSent / (totalSent + totalReceived)) * 100)}%`}</div>
                              <div className="bg-zinc-400 flex items-center justify-center text-[10px] font-bold text-black transition-all duration-1000" style={{ width: `${(totalSent + totalReceived) === 0 ? 50 : (totalReceived / (totalSent + totalReceived)) * 100}%` }}>{totalReceived > 0 && `${Math.round((totalReceived / (totalSent + totalReceived)) * 100)}%`}</div>
                           </div>
                           <div className="flex w-full justify-around mt-2">
                              <div className="text-center">
                                 <div className="flex items-center gap-1.5 mb-1"><div className="w-2.5 h-2.5 rounded-full bg-zinc-600"></div><span className="text-[9px] font-bold text-zinc-500 uppercase tracking-widest">Outbound</span></div>
                                 <p className="text-2xl font-bold text-white">{totalSent}</p>
                              </div>
                              <div className="w-px bg-white/5 h-full mx-4"></div>
                              <div className="text-center">
                                 <div className="flex items-center gap-1.5 mb-1"><div className="w-2.5 h-2.5 rounded-full bg-zinc-400"></div><span className="text-[9px] font-bold text-zinc-500 uppercase tracking-widest">Inbound</span></div>
                                 <p className="text-2xl font-bold text-white">{totalReceived}</p>
                              </div>
                           </div>
                        </div>
                     </div>
                  </div>
               </div>
            </div>
          </div>
        )}

        {/* SETTINGS VIEW */}
        {activeView === 'settings' && userRole === 'ADMIN' && (
          <div className="flex flex-col h-full bg-[#0A101C]">
            <div className="h-20 flex items-center justify-between px-6 border-b border-white/5 shrink-0 bg-[#0F172A]/50">
              <div>
                <h2 className="text-lg font-bold text-white">System Settings</h2>
                <p className="text-[10px] text-zinc-400 font-medium mt-0.5">Manage your CRM integrations and workspace data</p>
              </div>
            </div>
            <div className="flex-1 overflow-y-auto custom-scrollbar p-6">
               <div className="max-w-6xl mx-auto grid grid-cols-1 xl:grid-cols-2 gap-6">
                  
                  {/* Left Column */}
                  <div className="space-y-6">

                    <div className={`bg-[#0F172A] border ${activeTheme.border} rounded-2xl p-6 relative overflow-hidden`}>
                       <h3 className={`text-xs font-bold ${activeTheme.text} flex items-center gap-1.5 mb-5`}><Sparkles className="w-4 h-4" /> Workspace Branding</h3>
                       <div className="space-y-5 relative z-10">
                          <div>
                             <label className="text-[9px] font-bold text-zinc-500 uppercase tracking-widest pl-1">Company / Workspace Name</label>
                             <input type="text" value={settings.workspaceName} onChange={(e) => updateBranding(e.target.value, settings.accentColor)} placeholder="e.g. Acme Corp" className={`w-full mt-1 bg-[#1E293B] border border-transparent rounded-lg px-3 py-2 text-xs text-white ${activeTheme.focusBorder} outline-none transition-colors`} />
                          </div>
                          <div>
                             <label className="text-[9px] font-bold text-zinc-500 uppercase tracking-widest pl-1 mb-2 block">Primary Accent Color</label>
                             <div className="flex items-center gap-3">
                                {Object.keys(BRAND_COLORS).map((colorKey) => (
                                   <button 
                                      key={colorKey} 
                                      onClick={() => updateBranding(settings.workspaceName, colorKey)}
                                      className={`w-6 h-6 rounded-full transition-transform duration-200 border-2 ${settings.accentColor === colorKey ? 'border-white scale-110' : 'border-transparent hover:scale-110 opacity-70 hover:opacity-100'} ${BRAND_COLORS[colorKey as keyof typeof BRAND_COLORS].bg}`}
                                      title={colorKey.charAt(0).toUpperCase() + colorKey.slice(1)}
                                   />
                                ))}
                             </div>
                          </div>
                       </div>
                    </div>

                    <div className="bg-[#0F172A] border border-white/5 rounded-2xl p-6">
                       <h3 className="text-xs font-bold text-white flex items-center gap-1.5 mb-5"><Globe className="w-4 h-4 text-zinc-400" /> API Integrations</h3>
                       <div className="space-y-4">
                          <div className="bg-[#111827] rounded-xl p-4 border border-white/5">
                             <div className="flex items-center justify-between mb-3">
                                <h4 className="text-white font-bold text-xs">WhatsApp / Meta API</h4>
                             </div>
                             <div className="space-y-3">
                                <div><label className="text-[9px] font-bold text-zinc-500 uppercase tracking-widest pl-1">Permanent Access Token</label><input type="text" value={settings.metaToken} onChange={(e) => setSettings({...settings, metaToken: e.target.value})} placeholder="EAAGm0PX4ZCQoBO..." className={`w-full mt-1 bg-[#1E293B] border border-transparent rounded-lg px-3 py-2 text-xs text-white ${activeTheme.focusBorder} outline-none transition-colors`} /></div>
                                <div><label className="text-[9px] font-bold text-zinc-500 uppercase tracking-widest pl-1">Phone Number ID</label><input type="text" value={settings.metaPhoneId} onChange={(e) => setSettings({...settings, metaPhoneId: e.target.value})} placeholder="e.g. 103948273948" className={`w-full mt-1 bg-[#1E293B] border border-transparent rounded-lg px-3 py-2 text-xs text-white ${activeTheme.focusBorder} outline-none transition-colors`} /></div>
                             </div>
                          </div>
                          
                          <div className="bg-[#111827] rounded-xl p-4 border border-white/5">
                             <div className="flex items-center justify-between mb-3">
                                <h4 className="text-white font-bold text-xs">Shopify Store API</h4>
                             </div>
                             <div><label className="text-[9px] font-bold text-zinc-500 uppercase tracking-widest pl-1">Store Domain</label><input type="text" value={settings.shopifyDomain} onChange={(e) => setSettings({...settings, shopifyDomain: e.target.value})} placeholder="my-store.myshopify.com" className={`w-full mt-1 bg-[#1E293B] border border-transparent rounded-lg px-3 py-2 text-xs text-white ${activeTheme.focusBorder} outline-none transition-colors`} /></div>
                          </div>

                          <div className="bg-[#111827] rounded-xl p-4 border border-white/5">
                             <div className="flex items-center justify-between mb-3">
                                <h4 className="text-white font-bold text-xs">Zapier / Make Webhooks</h4>
                                <span className={`px-2 py-0.5 text-[9px] font-bold uppercase rounded ${settings.outboundWebhookUrl ? `${activeTheme.bgSubtle} ${activeTheme.text}` : 'bg-zinc-800 text-zinc-400'}`}>{settings.outboundWebhookUrl ? 'Active' : 'Inactive'}</span>
                             </div>
                             <div>
                                <label className="text-[9px] font-bold text-zinc-500 uppercase tracking-widest pl-1">Outbound Hook URL (Fires on RESOLVED)</label>
                                <input type="text" value={settings.outboundWebhookUrl} onChange={(e) => setSettings({...settings, outboundWebhookUrl: e.target.value})} placeholder="https://hooks.zapier.com/hooks/catch/..." className="w-full mt-1 bg-[#1E293B] border border-transparent rounded-lg px-3 py-2 text-xs text-white focus:border-amber-400 outline-none transition-colors" />
                             </div>
                          </div>
                       </div>
                    </div>

                    <div className="bg-[#0F172A] border border-white/5 rounded-2xl p-6">
                        <h3 className="text-xs font-bold text-white flex items-center gap-1.5 mb-5"><Lock className="w-4 h-4 text-zinc-400" /> Admin Profile</h3>
                        <div className="space-y-3">
                           <div><label className="text-[9px] font-bold text-zinc-500 uppercase tracking-widest pl-1">Display Name</label><input type="text" value={settings.adminName} onChange={(e) => setSettings({...settings, adminName: e.target.value})} className="w-full bg-[#1E293B] border border-transparent rounded-lg px-3 py-2 text-xs text-white mt-1 outline-none focus:border-white/20 transition-colors" /></div>
                           <div><label className="text-[9px] font-bold text-zinc-500 uppercase tracking-widest pl-1">Email Address</label><input type="email" value={settings.adminEmail} onChange={(e) => setSettings({...settings, adminEmail: e.target.value})} className="w-full bg-[#1E293B] border border-transparent rounded-lg px-3 py-2 text-xs text-white mt-1 outline-none focus:border-white/20 transition-colors" /></div>
                           <button onClick={() => alert('Profile Updated Locally!')} className="w-full py-2 bg-white/5 hover:bg-white/10 text-white rounded-lg font-bold text-xs transition-colors mt-2">Update Profile</button>
                        </div>
                     </div>
                  </div>

                  {/* Right Column */}
                  <div className="space-y-6">
                     <div className={`bg-[#0F172A] border ${activeTheme.border} rounded-2xl p-6`}>
                        <h3 className={`text-xs font-bold ${activeTheme.text} flex items-center gap-1.5 mb-2`}><UploadCloud className="w-4 h-4" /> Database Migration</h3>
                        <p className="text-[10px] text-zinc-400 mb-4">Upload a CSV file containing (Phone, Name) to instantly populate your ACTIVE pipeline.</p>
                        
                        <div className={`relative border border-dashed ${activeTheme.border} bg-[#111827] rounded-xl p-8 flex flex-col items-center justify-center text-center transition-all hover:bg-[#1E293B] cursor-pointer`}>
                           <input type="file" accept=".csv" onChange={handleCSVUpload} disabled={isUploadingCSV} className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10" />
                           {isUploadingCSV ? ( <Loader2 className={`w-6 h-6 ${activeTheme.text} animate-spin mb-2`} /> ) : ( <FileText className={`w-6 h-6 ${activeTheme.text} opacity-70 mb-2`} /> )}
                           <span className={`text-xs font-bold ${activeTheme.text}`}>{isUploadingCSV ? "Processing Database..." : "Click or Drag CSV to Import"}</span>
                           <span className="text-[9px] text-zinc-500 mt-1">Required format: Phone Number, Full Name</span>
                        </div>
                     </div>

                     <div className="bg-[#0F172A] border border-white/5 rounded-2xl p-6 flex flex-col h-[380px]">
                        <h3 className="text-xs font-bold text-white flex items-center gap-1.5 mb-2"><Shield className="w-4 h-4 text-zinc-400" /> Security & Audit Console</h3>
                        <p className="text-[10px] text-zinc-400 mb-4">Immutable log of system actions for accountability.</p>
                        
                        <div className="flex-1 bg-[#111827] rounded-xl border border-white/5 p-4 font-mono text-[9px] overflow-y-auto custom-scrollbar">
                           {auditLogs.length === 0 ? (
                              <div className="h-full flex items-center justify-center text-zinc-600">No logs recorded yet.</div>
                           ) : (
                              <div className="space-y-3">
                                 {auditLogs.map((log) => (
                                    <div key={log.id} className="border-l-2 border-zinc-500/50 pl-3 py-0.5">
                                       <div className="flex justify-between items-start mb-0.5">
                                          <span className="text-zinc-300 font-bold uppercase tracking-wider">{log.action_type}</span>
                                          <span className="text-zinc-600">{new Date(log.created_at).toLocaleString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit', second: '2-digit' })}</span>
                                       </div>
                                       <p className="text-zinc-400"><span className="text-white">{log.agent_name}</span> &mdash; {log.details}</p>
                                    </div>
                                 ))}
                              </div>
                           )}
                        </div>
                     </div>

                     <div className="bg-[#0F172A] border border-white/5 rounded-2xl p-6">
                        <div onClick={() => setSettings({...settings, audioAlerts: !settings.audioAlerts})} className="flex items-center justify-between cursor-pointer">
                           <div>
                              <p className="text-xs font-bold text-white flex items-center gap-1.5"><Bell className="w-3.5 h-3.5 text-zinc-400"/> Audio Alerts</p>
                              <p className="text-[9px] text-zinc-500 mt-1">Play a sound for incoming messages</p>
                           </div>
                           <div className={`w-8 h-4 rounded-full relative transition-colors duration-300 ${settings.audioAlerts ? activeTheme.bg : 'bg-zinc-700'}`}><div className={`w-3 h-3 bg-white rounded-full absolute top-[2px] transition-all duration-300 ${settings.audioAlerts ? 'right-[2px]' : 'left-[2px]'}`}></div></div>
                        </div>
                     </div>

                  </div>
               </div>
            </div>
          </div>
        )}
      </div>

      {/* ─── SLIDE-OUT CHAT & PROFILING PANE ─── */}
      <div className={`fixed top-0 right-0 h-full w-full md:w-[90vw] xl:w-[1000px] bg-[#0A101C] border-l border-white/10 z-50 transform transition-transform duration-300 flex flex-row shadow-2xl ${selectedLead ? 'translate-x-0' : 'translate-x-full'}`}>
        {selectedLead && (
          <>
            {/* CHAT AREA */}
            <div className="flex-1 flex flex-col border-r border-white/5 overflow-hidden relative">
                
                {/* CHAT HEADER */}
                <div className="flex items-center justify-between p-5 border-b border-white/5 shrink-0 bg-[#0F172A]">
                    <div className="flex items-center gap-3">
                        <div className={`w-10 h-10 rounded-full bg-gradient-to-tr ${activeTheme.gradient} flex items-center justify-center text-white`}><MessageSquare className="w-4 h-4"/></div>
                        <div>
                            <h3 className="text-white font-bold text-sm">{selectedLead.full_name || selectedLead.phone_number}</h3>
                            <p className={`text-[9px] ${activeTheme.text} font-bold tracking-widest uppercase mt-0.5 flex items-center gap-1.5`}><span className={`w-1.5 h-1.5 rounded-full ${activeTheme.bg} animate-pulse`}></span>Encrypted Connection</p>
                        </div>
                    </div>
                    <div className="flex items-center gap-2">
                        {selectedLead.status === 'NEW_ORDER' && <button onClick={() => handleTakeOver(selectedLead.id, selectedLead.phone_number)} className={`px-3 py-1.5 ${activeTheme.bgSubtle} ${activeTheme.text} border ${activeTheme.border} rounded-md text-[9px] font-bold uppercase transition-colors`}>Take Over</button>}
                        <button onClick={() => handleResolveChat(selectedLead.id, selectedLead.phone_number)} className="px-3 py-1.5 bg-zinc-800 hover:bg-zinc-700 text-white rounded-md text-[9px] font-bold uppercase transition-colors">Resolve</button>
                        <button onClick={() => setSelectedLead(null)} className="p-1.5 hover:bg-white/10 rounded-md text-zinc-400 transition-colors ml-2"><X className="w-4 h-4"/></button>
                    </div>
                </div>

                {/* CHAT MESSAGES */}
                <div className="flex-1 overflow-y-auto p-5 flex flex-col gap-4 custom-scrollbar bg-[#0B1120]">
                    {chatMessages.length === 0 ? <div className="flex-1 flex items-center justify-center text-zinc-600 text-[10px] font-sans tracking-widest uppercase">No conversation history</div> :
                        chatMessages.map((msg, i) => (
                        <div key={msg.id || i} className={`group/msg relative flex flex-col max-w-[85%] ${msg.is_outbound ? 'self-end items-end' : 'self-start items-start'}`}>
                            {userRole === 'ADMIN' && (
                               <button onClick={() => handleDeleteMessage(msg.id)} className={`absolute top-1/2 -translate-y-1/2 ${msg.is_outbound ? '-left-8' : '-right-8'} opacity-0 group-hover/msg:opacity-100 p-1 hover:bg-red-500/20 rounded text-zinc-600 hover:text-red-400`} title="Delete Message"><Trash2 className="w-3 h-3" /></button>
                            )}
                            <div className={`p-3.5 rounded-xl text-sm leading-relaxed ${msg.is_outbound ? `bg-gradient-to-br ${activeTheme.gradient} text-white rounded-tr-sm` : 'bg-[#1E293B] text-zinc-200 rounded-tl-sm'}`}>
                               {renderMessageContent(msg.content)}
                            </div>
                            <span className={`text-[9px] font-medium mt-1 px-1 flex items-center gap-1 ${msg.is_outbound ? 'justify-end text-zinc-500' : 'justify-start text-zinc-500'}`}>
                                {new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                {msg.is_outbound && <CheckCheck className={`w-3 h-3 ${msg.status === 'read' ? 'text-blue-400' : 'text-zinc-600'}`} />}
                            </span>
                        </div>
                    ))}
                    <div ref={messagesEndRef} />
                </div>

                {/* CHAT INPUT */}
                <div className="p-4 border-t border-white/5 bg-[#0F172A] shrink-0">
                    {showCommandMenu && (
                      <div className="absolute bottom-[80px] left-4 mb-2 w-72 max-h-48 overflow-y-auto custom-scrollbar bg-[#1E293B] border border-white/10 rounded-lg shadow-xl z-50">
                        <div className="p-2 border-b border-white/5 bg-[#0F172A] sticky top-0"><p className="text-[9px] font-bold text-zinc-400 uppercase tracking-widest flex items-center gap-1.5"><Zap className="w-3 h-3 text-amber-400" /> Templates</p></div>
                        <div className="p-1 flex flex-col">
                          {filteredReplies.length > 0 ? (
                            filteredReplies.map((reply) => (
                              <button key={reply.id} onClick={() => insertQuickReply(reply.content)} className="flex flex-col items-start p-2 rounded hover:bg-white/5 text-left">
                                <span className={`text-[10px] font-bold ${activeTheme.text}`}>/{reply.shortcut}</span><span className="text-[10px] text-zinc-400 truncate w-full">{reply.content}</span>
                              </button>
                            ))
                          ) : ( <div className="p-3 text-center text-[10px] text-zinc-500">No matches.</div> )}
                        </div>
                      </div>
                    )}
                    <div className="flex gap-2 mb-3">
                        <button type="button" onClick={() => setIsInternal(!isInternal)} className={`text-[9px] font-bold px-2.5 py-1 rounded transition-colors ${isInternal ? 'bg-amber-500/20 text-amber-400' : 'bg-white/5 text-zinc-400 hover:bg-white/10'}`}>Internal Note</button>
                        <button type="button" onClick={() => handleSendInteractive('button')} className="text-[9px] font-bold px-2.5 py-1 rounded bg-white/5 text-zinc-400 hover:bg-white/10 transition-colors flex items-center gap-1"><MousePointerClick className="w-2.5 h-2.5"/> Buttons</button>
                        <button type="button" onClick={() => handleSendInteractive('list')} className="text-[9px] font-bold px-2.5 py-1 rounded bg-white/5 text-zinc-400 hover:bg-white/10 transition-colors flex items-center gap-1"><List className="w-2.5 h-2.5"/> Menu List</button>
                    </div>
                    <form onSubmit={handleSendMessage} className="relative flex items-center">
                        <input type="text" value={newMessage} onChange={handleInputChange} placeholder={isInternal ? "Add a private team memo..." : "Draft message... (Type '/' for templates)"} className={`w-full bg-[#111827] border border-transparent rounded-lg pl-4 pr-12 py-3 text-sm focus:outline-none text-white transition-colors ${isInternal ? 'focus:border-amber-500/50' : activeTheme.focusBorder}`} />
                        <button type="submit" disabled={!newMessage.trim()} className={`absolute right-1.5 p-2 rounded-md transition-opacity disabled:opacity-50 ${isInternal ? 'bg-amber-500 text-black' : `bg-gradient-to-r ${activeTheme.gradient} text-white`}`}><Send className="w-3.5 h-3.5 ml-0.5"/></button>
                    </form>
                </div>
            </div>

            {/* RIGHT PROFILING PANE */}
            <div className="w-[300px] bg-[#0F172A] border-l border-white/5 flex flex-col h-full shrink-0">
                <div className="flex-1 overflow-y-auto custom-scrollbar">
                    
                    {userRole === 'ADMIN' && (
                       <div className="p-5 border-b border-white/5 bg-[#111827]/50">
                          <h4 className="text-[9px] font-bold text-zinc-400 uppercase tracking-widest mb-3 flex items-center gap-1.5"><Tag className="w-3.5 h-3.5"/> CRM Tags</h4>
                          <div className="flex flex-wrap gap-1.5">
                             {AVAILABLE_TAGS.map(tag => {
                                const isAssigned = selectedLead.tags?.includes(tag.id);
                                return (
                                   <button key={tag.id} onClick={() => handleToggleTag(tag.id)} className={`text-[9px] font-bold uppercase tracking-widest px-2 py-1 rounded transition-colors ${isAssigned ? tag.color : 'text-zinc-500 bg-[#1E293B] hover:text-zinc-300'}`}>
                                      {tag.label}
                                   </button>
                                );
                             })}
                          </div>
                       </div>
                    )}

                    <div className="p-5 border-b border-white/5">
                        <h4 className="text-[9px] font-bold text-zinc-400 uppercase tracking-widest mb-4 flex items-center gap-1.5"><User className="w-3.5 h-3.5"/> Identity Profile</h4>
                        <div className="space-y-3">
                            <div className="space-y-1"><label className="text-[8px] font-bold text-zinc-500 uppercase tracking-widest ml-1">Name</label><input value={editProfile.full_name} onChange={(e) => setEditProfile({...editProfile, full_name: e.target.value})} onBlur={handleUpdateProfile} disabled={userRole !== 'ADMIN'} className="w-full bg-[#111827] rounded-md px-3 py-2 text-xs text-white outline-none focus:bg-[#1E293B] transition-colors disabled:opacity-70" placeholder="Enter Name" /></div>
                            <div className="space-y-1"><label className="text-[8px] font-bold text-zinc-500 uppercase tracking-widest ml-1">Email</label><input value={editProfile.email} onChange={(e) => setEditProfile({...editProfile, email: e.target.value})} onBlur={handleUpdateProfile} disabled={userRole !== 'ADMIN'} className="w-full bg-[#111827] rounded-md px-3 py-2 text-xs text-white outline-none focus:bg-[#1E293B] transition-colors disabled:opacity-70" placeholder="email@client.com" /></div>
                            <div className="space-y-1"><label className="text-[8px] font-bold text-zinc-500 uppercase tracking-widest ml-1">Notes</label><textarea rows={3} value={editProfile.profile_notes} onChange={(e) => setEditProfile({...editProfile, profile_notes: e.target.value})} onBlur={handleUpdateProfile} className="w-full bg-[#111827] rounded-md px-3 py-2 text-xs text-white outline-none focus:bg-[#1E293B] resize-none custom-scrollbar transition-colors disabled:opacity-70" placeholder="Private notes..." /></div>
                        </div>
                    </div>

                    <div className="p-5 border-b border-white/5 bg-[#111827]/30">
                        <h4 className="text-[9px] font-bold text-zinc-400 uppercase tracking-widest mb-4 flex items-center gap-1.5"><ShoppingBag className="w-3.5 h-3.5"/> Live Store Sync</h4>
                        {loadingShopify ? ( <div className="p-4 bg-[#111827] rounded-lg flex items-center justify-center gap-2 text-[10px] text-zinc-500"><Loader2 className="w-3.5 h-3.5 animate-spin" /> Fetching Shopify...</div>
                        ) : shopifyData?.found ? (
                            <div className="space-y-3">
                                <div className="bg-[#1E293B] rounded-lg p-3"><p className="text-[8px] text-zinc-400 uppercase tracking-widest font-bold mb-1">Lifetime Value</p><p className={`text-lg font-bold ${activeTheme.text}`}>{shopifyData.totalSpent}</p></div>
                                <div className="space-y-2"><p className="text-[8px] text-zinc-500 uppercase tracking-widest font-bold mb-2 mt-1 pl-1">Recent Orders</p>
                                    {shopifyData.recentOrders.map((order: any, idx: number) => (
                                        <div key={idx} className="bg-[#1E293B] rounded-lg p-2.5 flex justify-between items-center">
                                            <div><p className="text-[10px] font-semibold text-white mb-0.5">{order.orderName}</p><p className="text-[8px] text-zinc-500 uppercase tracking-widest">{order.date} • {order.fulfillmentStatus || 'UNFULFILLED'}</p></div>
                                            <span className={`text-[10px] font-bold ${activeTheme.text}`}>{order.total}</span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        ) : ( <div className="p-4 bg-[#111827] rounded-lg text-center"><p className="text-[9px] text-zinc-500 uppercase tracking-widest font-bold">No Shopify Match</p></div> )}
                    </div>

                    <div className="p-5 min-h-[200px]">
                        <h4 className="text-[9px] font-bold text-amber-400 uppercase tracking-widest mb-3 flex items-center gap-1.5"><StickyNote className="w-3.5 h-3.5"/> Internal Memos</h4>
                        <div className="space-y-2">
                            {internalMemos.length === 0 ? ( <div className="p-3 rounded-lg bg-[#111827]/50 text-center"><p className="text-[9px] text-zinc-600 uppercase tracking-widest font-bold">No internal memos</p></div>
                            ) : (
                                internalMemos.map((memo, i) => (
                                    <div key={memo.id} className="group relative bg-amber-500/10 rounded-lg p-2.5">
                                        {userRole === 'ADMIN' && (
                                           <button onClick={() => handleDeleteMemo(memo.id)} className="absolute top-1.5 right-1.5 opacity-0 group-hover:opacity-100 p-1 hover:bg-red-500/20 rounded text-amber-500 hover:text-red-400 transition-colors"><Trash2 className="w-3 h-3" /></button>
                                        )}
                                        <p className="text-[10px] text-amber-100/90 leading-relaxed mb-1 pr-4">{memo.content}</p>
                                        <span className="text-[8px] text-amber-500/50 font-bold uppercase tracking-widest block text-right">{new Date(memo.created_at).toLocaleString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}</span>
                                    </div>
                                ))
                            )}
                        </div>
                    </div>
                </div>

                {userRole === 'ADMIN' ? (
                   <div className="p-4 shrink-0 border-t border-white/5 bg-[#0F172A]">
                       <button type="button" onClick={handleExportPDF} className="w-full flex items-center justify-center gap-1.5 py-2.5 bg-[#1E293B] hover:bg-white/10 rounded-lg text-[9px] font-bold uppercase tracking-widest text-zinc-300 transition-colors">
                           <Download className="w-3.5 h-3.5"/> Export Intelligence
                       </button>
                   </div>
                ) : (
                   <div className="p-4 shrink-0 border-t border-white/5 bg-[#0F172A] text-center">
                       <span className="text-[9px] font-bold text-zinc-600 uppercase tracking-widest flex justify-center items-center gap-1.5"><ShieldAlert className="w-3.5 h-3.5" /> Agent Mode Active</span>
                   </div>
                )}
            </div>
          </>
        )}

      {/* ─── PAYWALL OVERLAY (Triggers when trial expires) ─── */}
      {subscription.status === 'past_due' && (
         <div className="fixed inset-0 z-[100] bg-[#0A101C]/90 backdrop-blur-xl flex flex-col items-center justify-center p-4">
            <div className="w-full max-w-md bg-[#0F172A] border border-white/10 rounded-2xl shadow-2xl overflow-hidden animate-[fade-in_0.3s_ease-out]">
               <div className={`p-6 border-b border-white/5 bg-gradient-to-br ${activeTheme.gradient} bg-opacity-10 relative overflow-hidden`}>
                  <div className="absolute top-[-50%] right-[-10%] opacity-20"><Lock className="w-48 h-48 text-white" /></div>
                  <h2 className="text-2xl font-bold text-white relative z-10">Trial Expired</h2>
                  <p className="text-sm text-white/80 relative z-10 mt-1">Your 7-day free trial has ended. Select a plan to restore access to your command center.</p>
               </div>
               
               <div className="p-6 space-y-4">
                  <div onClick={() => handleUpgrade('Pro')} className="p-5 rounded-xl border border-white/10 hover:border-emerald-500/50 bg-[#111827] cursor-pointer transition-all group flex items-center justify-between">
                     <div>
                        <h3 className="text-lg font-bold text-white group-hover:text-emerald-400 transition-colors">Pro Plan</h3>
                        <p className="text-[10px] text-zinc-400 mt-1">Up to 2,500 monthly messages. 1 Agent.</p>
                     </div>
                     <div className="text-right">
                        <p className="text-xl font-black text-white">$99<span className="text-sm text-zinc-500 font-medium">/mo</span></p>
                     </div>
                  </div>

                  <div onClick={() => handleUpgrade('Enterprise')} className="p-5 rounded-xl border border-white/10 hover:border-blue-500/50 bg-[#111827] cursor-pointer transition-all group flex items-center justify-between">
                     <div>
                        <h3 className="text-lg font-bold text-white group-hover:text-blue-400 transition-colors">Enterprise</h3>
                        <p className="text-[10px] text-zinc-400 mt-1">Up to 10,000 monthly messages. Unlimited Agents.</p>
                     </div>
                     <div className="text-right">
                        <p className="text-xl font-black text-white">$299<span className="text-sm text-zinc-500 font-medium">/mo</span></p>
                     </div>
                  </div>
               </div>
               
               <div className="p-4 bg-[#111827] border-t border-white/5 text-center">
                  <p className="text-[9px] text-zinc-500 font-medium uppercase tracking-widest flex items-center justify-center gap-1.5"><Shield className="w-3 h-3"/> Secure Stripe Checkout</p>
               </div>
            </div>
         </div>
      )}
      </div>
    </div>
  );
}