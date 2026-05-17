"use client"

import { useEffect, useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '../../lib/supabase'; 
import { 
  MessageSquare, ShieldCheck, X, Send, Clock, 
  Trash2, Activity, MessageCircle, UserCheck, 
  StickyNote, User, Download, ShoppingBag, Loader2,
  LayoutDashboard, LayoutTemplate, BarChart2, Settings, 
  TrendingUp, Search, Calendar, Plus, Star, Zap,
  Copy, Check, CheckCheck, Edit2, Megaphone, Users, Target, PieChart, TrendingDown,
  Key, Bell, Globe, Lock, Palette, LogOut, Eye, AlertTriangle, MousePointerClick, List
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

  return <canvas ref={canvasRef} className="fixed inset-0 -z-20 pointer-events-none opacity-40" />;
}

function NebulaBackground() {
  return (
    <div className="fixed inset-0 -z-30 pointer-events-none overflow-hidden">
      <div className="absolute top-[-20%] left-[-10%] w-[60vw] h-[60vw] rounded-full bg-blue-500/15 blur-[150px] animate-[pulse-slow_15s_ease-in-out_infinite_alternate]" />
      <div className="absolute bottom-[-20%] right-[-10%] w-[50vw] h-[50vw] rounded-full bg-emerald-500/10 blur-[150px] animate-[pulse-slow_20s_ease-in-out_infinite_alternate-reverse]" />
    </div>
  );
}

const COLUMN_CONFIG: Record<string, { icon: any, hex: string, twText: string, twBg: string }> = {
  'NEW_ORDER': { icon: ShoppingBag, hex: '#10b981', twText: 'text-emerald-400', twBg: 'bg-emerald-500' },
  'HANDOFF': { icon: UserCheck, hex: '#eab308', twText: 'text-yellow-400', twBg: 'bg-yellow-500' },
  'ACTIVE': { icon: Activity, hex: '#0ea5e9', twText: 'text-sky-400', twBg: 'bg-sky-500' },
  'RESOLVED': { icon: ShieldCheck, hex: '#84cc16', twText: 'text-lime-400', twBg: 'bg-lime-500' }
};

const COLUMNS = Object.keys(COLUMN_CONFIG);

export default function Dashboard() {
  const router = useRouter();
  const [isMounted, setIsMounted] = useState(false);
  
  const [activeView, setActiveView] = useState<'dashboard' | 'conversations' | 'templates' | 'campaigns' | 'analytics' | 'settings'>('dashboard');

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
    metaToken: '',
    metaPhoneId: '',
    shopifyDomain: '',
    adminName: 'Nasir Ahmed',
    adminEmail: 'admin@chatrax.com',
    audioAlerts: true,
    desktopNotifications: false
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
  const [theme, setTheme] = useState('nebula'); 

  const [presenceState, setPresenceState] = useState<Record<string, string[]>>({});
  const presenceChannelRef = useRef<ReturnType<typeof supabase.channel> | null>(null);
  const [now, setNow] = useState(Date.now());
  const alertedLeadsRef = useRef<Set<string>>(new Set());

  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const checkAuth = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        router.push('/login');
      } else if (session.user?.email) {
        setSettings(prev => ({
          ...prev,
          adminEmail: session.user.email || prev.adminEmail,
          adminName: session.user.user_metadata?.full_name || prev.adminName
        }));
      }
    };
    checkAuth();
    setIsMounted(true);

    const savedTheme = localStorage.getItem('chatrax_theme');
    if (savedTheme) setTheme(savedTheme);

    setCurrentTime(new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }));
    const timer = setInterval(() => {
      setCurrentTime(new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }));
    }, 1000);
    return () => clearInterval(timer);
  }, [router]);

  useEffect(() => {
    const interval = setInterval(() => {
      const currentNow = Date.now();
      setNow(currentNow);

      if (settings.audioAlerts) {
        leads.forEach(lead => {
          if (lead.status === 'NEW_ORDER') {
            const timeDiff = currentNow - new Date(lead.created_at).getTime();
            if (timeDiff > 900000 && !alertedLeadsRef.current.has(lead.id)) {
              alertedLeadsRef.current.add(lead.id);
              try {
                const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
                const osc = ctx.createOscillator();
                const gain = ctx.createGain();
                osc.connect(gain);
                gain.connect(ctx.destination);
                osc.type = 'triangle';
                osc.frequency.setValueAtTime(600, ctx.currentTime);
                gain.gain.setValueAtTime(0.1, ctx.currentTime);
                gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.8);
                osc.start();
                osc.stop(ctx.currentTime + 0.8);
              } catch(e) { console.warn("Audio alert blocked by browser policy"); }
            }
          }
        });
      }
    }, 5000);
    return () => clearInterval(interval);
  }, [leads, settings.audioAlerts]);

  useEffect(() => {
    if (!settings.adminName) return;

    const channel = supabase.channel('chatrax_team_presence', {
      config: { presence: { key: settings.adminName } }
    });
    presenceChannelRef.current = channel;

    channel.on('presence', { event: 'sync' }, () => {
      const state = channel.presenceState();
      const newPresenceMap: Record<string, string[]> = {};
      
      Object.keys(state).forEach((key) => {
        state[key].forEach((presence: any) => {
          if (presence.leadId) {
            if (!newPresenceMap[presence.leadId]) newPresenceMap[presence.leadId] = [];
            if (!newPresenceMap[presence.leadId].includes(presence.agentName)) {
              newPresenceMap[presence.leadId].push(presence.agentName);
            }
          }
        });
      });
      setPresenceState(newPresenceMap);
    });

    channel.subscribe(async (status) => {
      if (status === 'SUBSCRIBED') {
        await channel.track({ agentName: settings.adminName, leadId: selectedLead?.id || null });
      }
    });

    return () => { supabase.removeChannel(channel); };
  }, [settings.adminName]);

  useEffect(() => {
    if (presenceChannelRef.current?.state === 'joined') {
      presenceChannelRef.current.track({ agentName: settings.adminName, leadId: selectedLead?.id || null });
    }
  }, [selectedLead, settings.adminName]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  useEffect(() => {
    fetchLeads();
    fetchStats();
    fetchQuickReplies();
    const channel = supabase.channel('realtime-customers')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'customers' }, () => fetchLeads())
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, []);

  const handleThemeChange = (newTheme: string) => {
    setTheme(newTheme);
    localStorage.setItem('chatrax_theme', newTheme);
  };

  const handleLogOut = async () => {
    if (!window.confirm("Are you sure you want to end your session?")) return;
    try {
      await supabase.auth.signOut();
      router.push('/login');
    } catch (err) {
      console.error("Failed to safely sign out:", err);
      router.push('/login');
    }
  };

  const fetchStats = async () => {
    const { count: outCount } = await supabase.from('messages').select('*', { count: 'exact', head: true }).eq('is_outbound', true);
    setTotalSent(outCount || 0);
    const { count: inCount } = await supabase.from('messages').select('*', { count: 'exact', head: true }).eq('is_outbound', false).eq('is_internal', false);
    setTotalReceived(inCount || 0);
  };

  const fetchQuickReplies = async () => {
    const { data } = await supabase.from('quick_replies').select('*').order('created_at', { ascending: false });
    if (data) setQuickReplies(data);
  };

  useEffect(() => {
    if (!selectedLead) {
      setShopifyData(null);
      return;
    }
    
    setEditProfile({ full_name: selectedLead.full_name || '', email: selectedLead.email || '', profile_notes: selectedLead.profile_notes || '' });

    const fetchChatHistory = async () => {
      const { data } = await supabase.from('messages').select('*').eq('customer_id', selectedLead.id).order('created_at', { ascending: true });
      if (data) setMessages(data);
    };
    fetchChatHistory();

    const fetchShopifyData = async () => {
      setLoadingShopify(true);
      try {
        const response = await fetch(`/api/shopify/customer?phone=${encodeURIComponent(selectedLead.phone_number)}`);
        const contentType = response.headers.get("content-type");
        if (!response.ok || !contentType || !contentType.includes("application/json")) {
          setShopifyData(null); setLoadingShopify(false); return; 
        }
        const data = await response.json();
        setShopifyData(data);
      } catch (err) { setShopifyData(null); }
      setLoadingShopify(false);
    };
    if (selectedLead.phone_number) fetchShopifyData();

    const msgChannel = supabase.channel('realtime-messages')
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'messages' }, (payload: any) => {
         if (payload.new.customer_id === selectedLead.id) {
           setMessages(prev => prev.map(m => m.id === payload.new.id ? payload.new : m));
         }
      })
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'messages' }, (payload: any) => {
        if (payload.new.customer_id === selectedLead.id) setMessages((prev) => [...prev, payload.new]);
        if (payload.new.is_outbound) setTotalSent(prev => prev + 1);
        else if (!payload.new.is_internal) setTotalReceived(prev => prev + 1);
      }).subscribe();
    return () => { supabase.removeChannel(msgChannel); };
  }, [selectedLead?.id]);

  const fetchLeads = async () => {
    const { data } = await supabase.from('customers').select('*').order('created_at', { ascending: false });
    if (data) setLeads(data);
  };

  const handleUpdateProfile = async () => {
    await supabase.from('customers').update({ full_name: editProfile.full_name, email: editProfile.email, profile_notes: editProfile.profile_notes }).eq('id', selectedLead.id);
    fetchLeads();
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setNewMessage(val);
    const lastWord = val.split(' ').pop() || '';
    if (lastWord.startsWith('/')) {
      setShowCommandMenu(true); setCommandQuery(lastWord.substring(1).toLowerCase());
    } else {
      setShowCommandMenu(false);
    }
  };

  const insertQuickReply = (content: string) => {
    const words = newMessage.split(' ');
    words.pop(); 
    setNewMessage((words.join(' ') + (words.length > 0 ? ' ' : '') + content + ' ').trimStart());
    setShowCommandMenu(false);
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || !selectedLead) return;
    
    const content = newMessage;
    const internalStatus = isInternal;
    setNewMessage(''); setIsInternal(false); setShowCommandMenu(false);

    try {
      await supabase.from('messages').insert({ customer_id: selectedLead.id, content, is_outbound: true, is_internal: internalStatus, status: 'sent' });

      if (selectedLead.status === 'NEW_ORDER') {
        await supabase.from('customers').update({ status: 'ACTIVE' }).eq('id', selectedLead.id);
        setLeads(prev => prev.map(l => l.id === selectedLead.id ? { ...l, status: 'ACTIVE' } : l));
        setSelectedLead((prev: any) => prev ? { ...prev, status: 'ACTIVE' } : null);
      }
      
      if (!internalStatus) {
        await fetch('/api/send', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ to: selectedLead.phone_number, message: content }) });
      }
    } catch (err) { console.error(err); }
  };

  const handleSendInteractive = async (type: 'button' | 'list') => {
    if (!selectedLead) return;
    
    let interactivePayload;
    let displayMessage = "";

    if (type === 'button') {
      displayMessage = "🔘 [Sent Quick Reply Buttons: Support/Sales]";
      interactivePayload = {
        type: "button",
        body: { text: "Hi! How can we assist you today?" },
        action: {
          buttons: [
            { type: "reply", reply: { id: "btn_sales", title: "Sales" } },
            { type: "reply", reply: { id: "btn_support", title: "Support" } }
          ]
        }
      };
    } else {
      displayMessage = "📋 [Sent Interactive Menu List: Order Options]";
      interactivePayload = {
        type: "list",
        header: { type: "text", text: "Main Menu" },
        body: { text: "Please select an option from the menu below so we can route you correctly:" },
        footer: { text: "ChatRax Pro Auto-Menu" },
        action: {
          button: "View Options",
          sections: [
            {
              title: "Order Help",
              rows: [
                { id: "row_track", title: "Track Order", description: "Check your delivery status" },
                { id: "row_return", title: "Returns", description: "Start a return process" }
              ]
            }
          ]
        }
      };
    }

    try {
      await supabase.from('messages').insert({ customer_id: selectedLead.id, content: displayMessage, is_outbound: true, is_internal: false, status: 'sent' });

      if (selectedLead.status === 'NEW_ORDER') {
        await supabase.from('customers').update({ status: 'ACTIVE' }).eq('id', selectedLead.id);
        setLeads(prev => prev.map(l => l.id === selectedLead.id ? { ...l, status: 'ACTIVE' } : l));
        setSelectedLead((prev: any) => prev ? { ...prev, status: 'ACTIVE' } : null);
      }

      await fetch('/api/send', { 
          method: 'POST', 
          headers: { 'Content-Type': 'application/json' }, 
          body: JSON.stringify({ to: selectedLead.phone_number, type: 'interactive', interactive: interactivePayload }) 
      });
    } catch (err) { console.error(err); }
  };

  const renderMessageContent = (content: string) => {
    if (content.startsWith('MEDIA::')) {
      const parts = content.split('::');
      const type = parts[1];
      const mediaId = parts[2];

      if (type === 'image') {
        return (
          <div className="mt-1">
            <img src={`/api/media?id=${mediaId}`} alt="Customer Upload" className="max-w-[180px] rounded-lg shadow-sm border border-white/10" />
          </div>
        );
      }
      if (type === 'audio') {
        return (
          <div className="mt-1">
            <audio controls className="max-w-[200px] h-8 rounded-full shadow-sm">
              <source src={`/api/media?id=${mediaId}`} type="audio/ogg" />
              Your browser does not support the audio element.
            </audio>
          </div>
        );
      }
      if (type === 'video') {
        return (
          <div className="mt-1">
            <video controls className="max-w-[200px] rounded-lg shadow-sm border border-white/10">
              <source src={`/api/media?id=${mediaId}`} />
            </video>
          </div>
        );
      }
    }
    return content;
  };

  const handleAddTemplate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newShortcut.trim() || !newTemplateContent.trim()) return;
    try {
      const cleanShortcut = newShortcut.replace('/', '').trim().toLowerCase();
      const { data, error } = await supabase.from('quick_replies').insert([{ shortcut: cleanShortcut, content: newTemplateContent.trim() }]).select();
      if (!error && data) { setQuickReplies([data[0], ...quickReplies]); setNewShortcut(''); setNewTemplateContent(''); }
    } catch (err) { console.error("Error adding template:", err); }
  };

  const handleDeleteTemplate = async (id: string) => {
    if (!window.confirm("Delete this template permanently?")) return;
    try { await supabase.from('quick_replies').delete().eq('id', id); setQuickReplies(quickReplies.filter(q => q.id !== id)); } catch (err) { console.error(err); }
  };

  const handleCopyTemplate = (id: string, content: string) => {
    navigator.clipboard.writeText(content); setCopiedId(id); setTimeout(() => setCopiedId(null), 2000);
  };

  const startEditingTemplate = (template: {id: string, shortcut: string, content: string}) => {
    setEditingTemplateId(template.id); setEditShortcut(template.shortcut); setEditTemplateContent(template.content);
  };

  const cancelEditingTemplate = () => { setEditingTemplateId(null); setEditShortcut(''); setEditTemplateContent(''); };

  const handleUpdateTemplate = async (id: string) => {
    if (!editShortcut.trim() || !editTemplateContent.trim()) return;
    try {
      const cleanShortcut = editShortcut.replace('/', '').trim().toLowerCase();
      const { error } = await supabase.from('quick_replies').update({ shortcut: cleanShortcut, content: editTemplateContent.trim() }).eq('id', id);
      if (!error) { setQuickReplies(prev => prev.map(q => q.id === id ? { ...q, shortcut: cleanShortcut, content: editTemplateContent.trim() } : q)); setEditingTemplateId(null); }
    } catch (err) { console.error("Error updating template:", err); }
  };

  const handleDeleteMemo = async (memoId: string) => {
    try { await supabase.from('messages').delete().eq('id', memoId); setMessages(prev => prev.filter(m => m.id !== memoId)); } catch (err) { console.error(err); }
  };

  const handleDeleteMessage = async (msgId: string) => {
    if (!window.confirm("Delete this message from the system?")) return;
    try { await supabase.from('messages').delete().eq('id', msgId); setMessages(prev => prev.filter(m => m.id !== msgId)); } catch (err) { console.error(err); }
  };

  const handleDeleteLead = async (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    if (!window.confirm('Are you sure you want to completely delete this lead and their conversation?')) return;
    try { await supabase.from('customers').delete().eq('id', id); setLeads(prev => prev.filter(l => l.id !== id)); if (selectedLead?.id === id) setSelectedLead(null); } catch (err) { console.error(err); }
  };

  const toggleStar = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    setStarredLeads(prev => { const next = new Set(prev); if (next.has(id)) next.delete(id); else next.add(id); return next; });
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

  const handleLaunchCampaign = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!campaignName || !campaignTemplateId) { alert("Please fill in all campaign details."); return; }
    if (!window.confirm(`Are you sure you want to blast this to your ${campaignAudience} audience?`)) return;

    try {
      const response = await fetch('/api/campaign', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ campaignName, audience: campaignAudience, templateId: campaignTemplateId }) });
      const data = await response.json();
      if (data.success) { alert(`🚀 Broadcast Complete! Sent to ${data.broadcasted} customers. Failed: ${data.failed}`); setCampaignName(''); setCampaignTemplateId(''); } 
      else { alert(`Error: ${data.error}`); }
    } catch (err) { alert("Failed to launch campaign. Check console."); }
  };

  const chatMessages = messages.filter(m => !m.is_internal);
  const internalMemos = messages.filter(m => m.is_internal);

  const newOrdersCount = leads.filter(l => l.status === 'NEW_ORDER').length;
  const activeCount = leads.filter(l => l.status === 'ACTIVE').length;
  const resolvedCount = leads.filter(l => l.status === 'RESOLVED').length;
  const handoffCount = leads.filter(l => l.status === 'HANDOFF').length;

  const activeConversationsCount = leads.filter(l => l.status !== 'RESOLVED').length;
  const filteredReplies = quickReplies.filter(r => r.shortcut.toLowerCase().includes(commandQuery));

  const totalLeads = leads.length || 1; 
  const newOrdersPct = leads.length ? Math.round((newOrdersCount / totalLeads) * 100) : 0;
  const activePct = leads.length ? Math.round((activeCount / totalLeads) * 100) : 0;
  const resolvedPct = leads.length ? Math.round((resolvedCount / totalLeads) * 100) : 0;
  const resolutionRate = leads.length > 0 ? Math.round((resolvedCount / leads.length) * 100) : 0;

  return (
    <div className={`flex h-screen text-zinc-100 font-sans relative overflow-hidden selection:bg-emerald-500/30 ${theme === 'grey' ? 'theme-grey' : theme === 'black' ? 'theme-black' : ''}`}>
      
      {theme === 'nebula' && <div className="fixed inset-0 -z-50 bg-gradient-to-br from-[#0F172A] via-[#1E293B] to-[#0F172A]" />}
      {theme === 'grey' && <div className="fixed inset-0 -z-50 bg-[#1e1e24]" />}
      {theme === 'black' && <div className="fixed inset-0 -z-50 bg-black" />}

      <style dangerouslySetInnerHTML={{__html: `
        @keyframes led-breathe { 0%, 100% { box-shadow: 0 0 4px 1px rgba(16, 185, 129, 0.2); transform: scale(1); opacity: 0.8; } 50% { box-shadow: 0 0 12px 3px rgba(16, 185, 129, 0.6); transform: scale(1.1); opacity: 1; } }
        .animate-led { animation: led-breathe 3s ease-in-out infinite; }
        
        @keyframes sweep { 0% { transform: translateX(-100%) skewX(-15deg); } 100% { transform: translateX(200%) skewX(-15deg); } }
        @keyframes fade-in { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
        .custom-scrollbar::-webkit-scrollbar { width: 4px; height: 4px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: rgba(255, 255, 255, 0.15); border-radius: 10px; }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: rgba(255, 255, 255, 0.25); }

        /* THEME OVERRIDES */
        .theme-grey .bg-\\[\\#111827\\]\\/80 { background-color: rgba(43, 43, 54, 0.8) !important; }
        .theme-grey .bg-\\[\\#1F2937\\]\\/70 { background-color: rgba(56, 56, 70, 0.7) !important; }
        .theme-grey .bg-\\[\\#1F2937\\]\\/60 { background-color: rgba(56, 56, 70, 0.6) !important; }
        .theme-grey .bg-\\[\\#1F2937\\]\\/80 { background-color: rgba(56, 56, 70, 0.8) !important; }
        .theme-grey .bg-\\[\\#1F2937\\]\\/95 { background-color: rgba(56, 56, 70, 0.95) !important; }
        .theme-grey .bg-\\[\\#1F2937\\] { background-color: #383846 !important; }
        .theme-grey .bg-\\[\\#374151\\]\\/60 { background-color: rgba(69, 69, 86, 0.6) !important; }
        .theme-grey .bg-\\[\\#111827\\]\\/40 { background-color: rgba(43, 43, 54, 0.4) !important; }
        .theme-grey .bg-\\[\\#111827\\]\\/50 { background-color: rgba(43, 43, 54, 0.5) !important; }
        .theme-grey .bg-\\[\\#111827\\]\\/60 { background-color: rgba(43, 43, 54, 0.6) !important; }
        .theme-grey .bg-\\[\\#111827\\]\\/90 { background-color: rgba(43, 43, 54, 0.9) !important; }
        .theme-grey .bg-\\[\\#111827\\]\\/95 { background-color: rgba(43, 43, 54, 0.95) !important; }

        .theme-black .bg-\\[\\#111827\\]\\/80 { background-color: rgba(10, 10, 10, 0.8) !important; }
        .theme-black .bg-\\[\\#1F2937\\]\\/70 { background-color: rgba(20, 20, 20, 0.7) !important; }
        .theme-black .bg-\\[\\#1F2937\\]\\/60 { background-color: rgba(20, 20, 20, 0.6) !important; }
        .theme-black .bg-\\[\\#1F2937\\]\\/80 { background-color: rgba(20, 20, 20, 0.8) !important; }
        .theme-black .bg-\\[\\#1F2937\\]\\/95 { background-color: rgba(20, 20, 20, 0.95) !important; }
        .theme-black .bg-\\[\\#1F2937\\] { background-color: #141414 !important; }
        .theme-black .bg-\\[\\#374151\\]\\/60 { background-color: rgba(30, 30, 30, 0.6) !important; }
        .theme-black .bg-\\[\\#111827\\]\\/40 { background-color: rgba(10, 10, 10, 0.4) !important; }
        .theme-black .bg-\\[\\#111827\\]\\/50 { background-color: rgba(10, 10, 10, 0.5) !important; }
        .theme-black .bg-\\[\\#111827\\]\\/60 { background-color: rgba(10, 10, 10, 0.6) !important; }
        .theme-black .bg-\\[\\#111827\\]\\/90 { background-color: rgba(10, 10, 10, 0.9) !important; }
        .theme-black .bg-\\[\\#111827\\]\\/95 { background-color: rgba(10, 10, 10, 0.95) !important; }
      `}} />

      {/* ─── LEFT SIDEBAR NAVIGATION ─── */}
      <div className="w-64 border-r border-white/10 bg-[#111827]/80 backdrop-blur-3xl flex flex-col z-40 shadow-[10px_0_30px_rgba(0,0,0,0.3)] shrink-0">
        <div className="h-20 flex items-center px-6 border-b border-white/10">
          <h1 className="text-xl font-extrabold tracking-tight text-white flex items-center gap-2 drop-shadow-[0_0_10px_rgba(255,255,255,0.1)]">
            <span className="w-8 h-8 rounded-lg bg-gradient-to-br from-emerald-400 to-sky-500 flex items-center justify-center shadow-[0_0_15px_rgba(16,185,129,0.4)]">
               <MessageCircle className="w-5 h-5 text-white" />
            </span>
            ChatRax <span className="text-emerald-400">Pro</span>
          </h1>
        </div>
        
        <div className="flex-1 py-6 px-4 space-y-2">
          <button onClick={() => setActiveView('dashboard')} className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-300 font-medium text-sm ${activeView === 'dashboard' ? 'bg-white/10 text-emerald-400 border border-white/10 shadow-inner font-semibold' : 'text-zinc-300 hover:bg-white/5 hover:text-white'}`}><LayoutDashboard className="w-4 h-4" /> Dashboard</button>
          <button onClick={() => setActiveView('conversations')} className={`w-full flex items-center justify-between px-4 py-3 rounded-xl transition-all duration-300 font-medium text-sm ${activeView === 'conversations' ? 'bg-white/10 text-emerald-400 border border-white/10 shadow-inner font-semibold' : 'text-zinc-300 hover:bg-white/5 hover:text-white'}`}>
             <div className="flex items-center gap-3"><MessageSquare className="w-4 h-4" /> Conversations</div>
             <span className="bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 text-[10px] px-2 py-0.5 rounded-full font-bold">{activeConversationsCount}</span>
          </button>
          <button onClick={() => setActiveView('campaigns')} className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-300 font-medium text-sm ${activeView === 'campaigns' ? 'bg-white/10 text-emerald-400 border border-white/10 shadow-inner font-semibold' : 'text-zinc-300 hover:bg-white/5 hover:text-white'}`}><Megaphone className="w-4 h-4" /> Campaigns</button>
          <button onClick={() => setActiveView('templates')} className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-300 font-medium text-sm ${activeView === 'templates' ? 'bg-white/10 text-emerald-400 border border-white/10 shadow-inner font-semibold' : 'text-zinc-300 hover:bg-white/5 hover:text-white'}`}><LayoutTemplate className="w-4 h-4" /> Templates</button>
          <button onClick={() => setActiveView('analytics')} className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-300 font-medium text-sm ${activeView === 'analytics' ? 'bg-white/10 text-emerald-400 border border-white/10 shadow-inner font-semibold' : 'text-zinc-300 hover:bg-white/5 hover:text-white'}`}><BarChart2 className="w-4 h-4" /> Analytics</button>
          <button onClick={() => setActiveView('settings')} className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-300 font-medium text-sm ${activeView === 'settings' ? 'bg-white/10 text-emerald-400 border border-white/10 shadow-inner font-semibold' : 'text-zinc-300 hover:bg-white/5 hover:text-white'}`}><Settings className="w-4 h-4" /> Settings</button>
        </div>

        <div className="p-4 border-t border-white/10 bg-[#0F172A]/40">
          <div className="flex items-center justify-between p-2.5 rounded-xl bg-white/5 border border-white/5 hover:border-white/10 group/profile transition-all duration-300">
             <div className="flex items-center gap-3 overflow-hidden">
                <div className="w-9 h-9 shrink-0 rounded-full bg-gradient-to-tr from-sky-500 to-blue-600 flex items-center justify-center font-bold text-white shadow-[0_0_10px_rgba(14,165,233,0.4)]">
                  {settings.adminName ? settings.adminName.charAt(0).toUpperCase() : 'N'}
                </div>
                <div className="overflow-hidden">
                  <p className="text-xs font-bold text-white truncate max-w-[110px]">{settings.adminName || 'Nasir Ahmed'}</p>
                  <p className="text-[9px] text-zinc-400 uppercase tracking-widest font-semibold mt-0.5">Admin</p>
                </div>
             </div>
             <button onClick={handleLogOut} className="p-2 ml-1 rounded-lg text-zinc-400 hover:text-red-400 hover:bg-red-500/10 border border-transparent hover:border-red-500/20 transition-all duration-200" title="Log Out Session"><LogOut className="w-4 h-4" /></button>
          </div>
        </div>
      </div>

      {/* ─── MAIN CONTENT AREA ─── */}
      <div className="flex-1 flex flex-col h-full overflow-hidden relative z-30">
        
        {/* VIEW: DASHBOARD (Overview) */}
        {activeView === 'dashboard' && (
          <div className="flex flex-col h-full animate-[fade-in_0.3s_ease-out]">
            <div className="h-20 flex items-center justify-between px-6 border-b border-white/10 bg-[#111827]/80 backdrop-blur-xl shrink-0">
              <div>
                <h2 className="text-lg font-bold text-white drop-shadow-md">Command Center</h2>
                <p className="text-[10px] text-zinc-400 font-medium tracking-wide mt-0.5">Live overview of your Store & CRM activity</p>
              </div>
              <div className="flex items-center gap-3">
                 <div className="flex items-center gap-2 bg-[#1F2937]/80 border border-white/10 rounded-lg px-3 py-1.5 text-[10px] font-bold tracking-wider text-emerald-400 shadow-inner">
                    <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-led border border-emerald-400/50"></div>
                    LIVE SYNC • {currentTime || "CONNECTING..."}
                 </div>
                 <button onClick={() => setActiveView('campaigns')} className="bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-white font-semibold text-xs px-4 py-1.5 rounded-lg shadow-[0_0_20px_rgba(16,185,129,0.3)] hover:shadow-[0_0_25px_rgba(16,185,129,0.5)] transition-all flex items-center gap-1.5 hover:-translate-y-0.5 active:translate-y-0">
                    <Plus className="w-3.5 h-3.5" /> New Campaign
                 </button>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto custom-scrollbar p-6">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
                  <div className="bg-[#1F2937]/70 backdrop-blur-2xl border border-white/10 rounded-2xl p-5 shadow-xl relative overflow-hidden group hover:bg-[#1F2937]/90 transition-colors">
                     <div className="absolute top-0 left-0 w-1 h-full bg-emerald-500 shadow-[0_0_20px_rgba(16,185,129,0.8)]" />
                     <div className="flex justify-between items-start mb-3 pl-2">
                        <div className="w-8 h-8 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400 group-hover:scale-110 transition-transform"><ShoppingBag className="w-4 h-4"/></div>
                        <span className="text-[9px] font-bold text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 rounded-full flex items-center gap-1"><TrendingUp className="w-2.5 h-2.5"/> {newOrdersPct}%</span>
                     </div>
                     <p className="text-[10px] font-semibold tracking-widest text-zinc-400 uppercase mb-0.5 pl-2">New Orders</p>
                     <h3 className="text-2xl font-bold text-white tracking-tight drop-shadow-sm pl-2 mt-0.5">{newOrdersCount}</h3>
                  </div>

                  <div className="bg-[#1F2937]/70 backdrop-blur-2xl border border-white/10 rounded-2xl p-5 shadow-xl relative overflow-hidden group hover:bg-[#1F2937]/90 transition-colors">
                     <div className="absolute top-0 left-0 w-1 h-full bg-sky-500 shadow-[0_0_20px_rgba(14,165,233,0.8)]" />
                     <div className="flex justify-between items-start mb-3 pl-2">
                        <div className="w-8 h-8 rounded-xl bg-sky-500/10 border border-sky-500/20 flex items-center justify-center text-sky-400 group-hover:scale-110 transition-transform"><Activity className="w-4 h-4"/></div>
                        <span className="text-[9px] font-bold text-sky-400 bg-sky-500/10 border border-sky-500/20 px-2 py-0.5 rounded-full flex items-center gap-1"><TrendingUp className="w-2.5 h-2.5"/> {activePct}%</span>
                     </div>
                     <p className="text-[10px] font-semibold tracking-widest text-zinc-400 uppercase mb-0.5 pl-2">Active Contacts</p>
                     <h3 className="text-2xl font-bold text-white tracking-tight drop-shadow-sm pl-2 mt-0.5">{activeCount}</h3>
                  </div>

                  <div className="bg-[#1F2937]/70 backdrop-blur-2xl border border-white/10 rounded-2xl p-5 shadow-xl relative overflow-hidden group hover:bg-[#1F2937]/90 transition-colors">
                     <div className="absolute top-0 left-0 w-1 h-full bg-lime-500 shadow-[0_0_20px_rgba(132,204,22,0.8)]" />
                     <div className="flex justify-between items-start mb-3 pl-2">
                        <div className="w-8 h-8 rounded-xl bg-lime-500/10 border border-lime-500/20 flex items-center justify-center text-lime-400 group-hover:scale-110 transition-transform"><ShieldCheck className="w-4 h-4"/></div>
                        <span className="text-[9px] font-bold text-lime-400 bg-lime-500/10 border border-lime-500/20 px-2 py-0.5 rounded-full flex items-center gap-1"><TrendingUp className="w-2.5 h-2.5"/> {resolvedPct}%</span>
                     </div>
                     <p className="text-[10px] font-semibold tracking-widest text-zinc-400 uppercase mb-0.5 pl-2">Resolved Leads</p>
                     <h3 className="text-2xl font-bold text-white tracking-tight drop-shadow-sm pl-2 mt-0.5">{resolvedCount}</h3>
                  </div>

                  <div className="bg-[#1F2937]/70 backdrop-blur-2xl border border-white/10 rounded-2xl p-5 shadow-xl relative overflow-hidden group hover:bg-[#1F2937]/90 transition-colors">
                     <div className="absolute top-0 left-0 w-1 h-full bg-amber-500 shadow-[0_0_20px_rgba(245,158,11,0.8)]" />
                     <div className="flex justify-between items-start mb-3 pl-2">
                        <div className="w-8 h-8 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400 group-hover:scale-110 transition-transform"><Send className="w-4 h-4 ml-0.5"/></div>
                        <span className="text-[9px] font-bold text-amber-400 bg-amber-500/10 border border-amber-500/20 px-2 py-0.5 rounded-full flex items-center gap-1"><TrendingUp className="w-2.5 h-2.5"/> Live</span>
                     </div>
                     <p className="text-[10px] font-semibold tracking-widest text-zinc-400 uppercase mb-0.5 pl-2">Messages Sent</p>
                     <h3 className="text-2xl font-bold text-white tracking-tight drop-shadow-sm pl-2 mt-0.5">{totalSent}</h3>
                  </div>
                </div>

                <div className="bg-[#111827]/60 backdrop-blur-xl border border-white/10 rounded-2xl p-5 shadow-2xl flex flex-col h-[calc(100vh-220px)]">
                  <div className="flex items-center justify-between mb-4 px-1 shrink-0">
                     <h3 className="text-sm font-bold text-white drop-shadow-sm">Live Action Board</h3>
                     <div className="flex gap-2">
                        <div className="bg-[#1F2937] border border-white/10 hover:bg-[#374151] cursor-pointer transition-colors rounded-lg px-3 py-1.5 flex items-center gap-1.5 text-[10px] font-semibold text-zinc-300"><Search className="w-3 h-3 text-zinc-400"/> Filter</div>
                     </div>
                  </div>

                  <div className="grid grid-cols-1 lg:grid-cols-4 gap-4 items-start flex-1 overflow-hidden">
                    {COLUMNS.map((status, index) => {
                      const config = COLUMN_CONFIG[status];
                      const ColumnIcon = config.icon;
                      const colLeads = leads.filter(l => l.status === status);

                      return (
                        <div key={status} onDragOver={handleDragOver} onDrop={(e) => handleDrop(e, status)}
                          className={`flex flex-col gap-3 h-full relative group transition-all duration-700 ease-out transform ${isMounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-12'}`} style={{ transitionDelay: `${index * 100}ms` }}>
                          
                          <div className="flex items-center justify-between p-3 rounded-xl border border-white/10 transition-all duration-500 relative overflow-hidden shadow-sm bg-[#1F2937]/80 backdrop-blur-md shrink-0">
                            <div className="flex items-center gap-2">
                               <ColumnIcon className="w-3.5 h-3.5" style={{ color: config.hex, filter: `drop-shadow(0 0 5px ${config.hex})` }} />
                               <h2 className="text-[10px] font-bold tracking-widest text-white uppercase">{status.replace('_', ' ')}</h2>
                            </div>
                            <span className={`text-[9px] font-bold text-white ${config.twBg} bg-opacity-20 px-2 py-0.5 rounded-full border border-${config.hex}/30`}>{colLeads.length}</span>
                          </div>

                          <div className={`flex flex-col gap-2.5 flex-1 overflow-y-auto rounded-xl p-1 transition-all duration-300 custom-scrollbar ${draggedLead ? 'bg-white/5 border border-dashed border-white/20' : 'border border-transparent'}`}>
                            {colLeads.map((lead) => {
                              const isSlaBreached = status === 'NEW_ORDER' && (now - new Date(lead.created_at).getTime() > 900000);
                              const viewers = presenceState[lead.id]?.filter(name => name !== settings.adminName) || [];
                              const slaClasses = isSlaBreached ? 'ring-1 ring-red-500/80 shadow-[0_0_15px_rgba(239,68,68,0.3)] animate-[pulse_2s_ease-in-out_infinite]' : 'border-white/10';

                              return (
                                <div key={lead.id} draggable onDragStart={(e) => handleDragStart(e, lead.id)} onClick={() => setSelectedLead(lead)} 
                                  className={`group/card shrink-0 relative bg-[#374151]/60 backdrop-blur-md rounded-xl p-3.5 cursor-pointer transition-all duration-300 hover:-translate-y-0.5 hover:shadow-[0_8px_20px_rgba(0,0,0,0.4)] hover:bg-[#4B5563]/60 overflow-hidden ${slaClasses}`}>
                                  <div className={`absolute left-0 top-0 bottom-0 w-[3px] transition-all duration-300 group-hover/card:w-1`} style={{ backgroundColor: config.hex, boxShadow: `0 0 10px ${config.hex}` }} />
                                  
                                  {viewers.length > 0 && (
                                    <div className="absolute top-0 right-0 bg-sky-500/20 backdrop-blur-md border-b border-l border-sky-500/30 px-1.5 py-0.5 rounded-bl-lg z-30 flex items-center gap-1 shadow-sm">
                                      <Eye className="w-2.5 h-2.5 text-sky-400 animate-pulse" />
                                      <span className="text-[8px] font-bold text-sky-400 tracking-wider uppercase">{viewers[0]}</span>
                                    </div>
                                  )}

                                  <div className="absolute top-2.5 right-2.5 flex items-center gap-1 opacity-0 group-hover/card:opacity-100 transition-opacity duration-300 z-20">
                                     <button onClick={(e) => toggleStar(e, lead.id)} className="p-1 bg-[#111827]/60 hover:bg-[#1F2937] rounded transition-colors text-zinc-400 hover:text-amber-400 border border-white/5 hover:border-amber-500/30" title="Star Lead"><Star className={`w-3 h-3 ${starredLeads.has(lead.id) ? 'fill-amber-400 text-amber-400' : ''}`} /></button>
                                     <button onClick={(e) => handleDeleteLead(e, lead.id)} className="p-1 bg-[#111827]/60 hover:bg-red-500/20 rounded transition-colors text-zinc-400 hover:text-red-400 border border-white/5 hover:border-red-500/30" title="Delete Conversation"><Trash2 className="w-3 h-3" /></button>
                                  </div>
                                  
                                  <div className="flex flex-col items-start mb-2.5 pl-1 pr-10 relative z-10">
                                    <span className="font-sans text-xs tracking-wide text-white font-bold drop-shadow-sm line-clamp-1">{lead.full_name || 'Store Customer'}</span>
                                    <span className="text-[9px] text-emerald-400 font-bold tracking-widest mt-0.5 drop-shadow-md">+{lead.phone_number}</span>
                                  </div>
                                  
                                  <div className="bg-[#111827]/40 rounded-md p-2.5 ml-1 border border-white/5 group-hover/card:border-white/10 transition-colors duration-300 shadow-inner">
                                    <p className="text-[10px] text-zinc-300 line-clamp-2 leading-snug">{lead.last_message || "No message content."}</p>
                                  </div>
                                  
                                  <div className="mt-2.5 flex items-center justify-between text-[8px] uppercase tracking-widest text-zinc-400 font-bold pl-1">
                                    <div className="flex items-center gap-1">
                                       {isSlaBreached ? (
                                          <span className="text-red-400 flex items-center gap-1 font-bold bg-red-500/10 px-1 py-0.5 rounded border border-red-500/20"><AlertTriangle className="w-2.5 h-2.5" /> SLA BREACH</span>
                                       ) : (
                                          <><Clock className="w-2.5 h-2.5 text-zinc-500" />{new Date(lead.created_at).toLocaleDateString()}</>
                                       )}
                                    </div>
                                  </div>
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

        {/* ─── VIEW: CONVERSATIONS ─── */}
        {activeView === 'conversations' && (
          <div className="flex flex-col h-full animate-[fade-in_0.3s_ease-out]">
            <div className="h-20 flex items-center justify-between px-6 border-b border-white/10 bg-[#111827]/80 backdrop-blur-xl shrink-0">
              <div>
                <h2 className="text-lg font-bold text-white drop-shadow-md">Conversations</h2>
                <p className="text-[10px] text-zinc-400 font-medium tracking-wide mt-0.5">Manage and route your active customer chats</p>
              </div>
              <div className="flex items-center gap-3">
                 <div className="bg-[#1F2937] border border-white/10 hover:bg-[#374151] cursor-pointer transition-colors rounded-lg px-3 py-1.5 flex items-center gap-1.5 text-[10px] font-semibold text-zinc-200 shadow-inner">
                    <Search className="w-3.5 h-3.5 text-zinc-400" /> Filter
                 </div>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto custom-scrollbar p-6">
               <div className="bg-[#111827]/60 backdrop-blur-xl border border-white/10 rounded-2xl p-5 shadow-2xl flex flex-col h-full">
                  <div className="grid grid-cols-1 lg:grid-cols-4 gap-4 items-start flex-1 overflow-hidden">
                    {COLUMNS.map((status, index) => {
                      const config = COLUMN_CONFIG[status];
                      const ColumnIcon = config.icon;
                      const colLeads = leads.filter(l => l.status === status);

                      return (
                        <div key={status} onDragOver={handleDragOver} onDrop={(e) => handleDrop(e, status)}
                          className={`flex flex-col gap-3 h-full relative group transition-all duration-700 ease-out transform ${isMounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-12'}`} style={{ transitionDelay: `${index * 100}ms` }}>
                          
                          <div className="flex items-center justify-between p-3 rounded-xl border border-white/10 transition-all duration-500 relative overflow-hidden shadow-sm bg-[#1F2937]/80 backdrop-blur-md shrink-0">
                            <div className="flex items-center gap-2">
                               <ColumnIcon className="w-3.5 h-3.5" style={{ color: config.hex, filter: `drop-shadow(0 0 5px ${config.hex})` }} />
                               <h2 className="text-[10px] font-bold tracking-widest text-white uppercase">{status.replace('_', ' ')}</h2>
                            </div>
                            <span className={`text-[9px] font-bold text-white ${config.twBg} bg-opacity-20 px-2 py-0.5 rounded-full border border-${config.hex}/30`}>{colLeads.length}</span>
                          </div>

                          <div className={`flex flex-col gap-2.5 flex-1 overflow-y-auto rounded-xl p-1 transition-all duration-300 custom-scrollbar ${draggedLead ? 'bg-white/5 border border-dashed border-white/20' : 'border border-transparent'}`}>
                            {colLeads.map((lead) => {
                              const isSlaBreached = status === 'NEW_ORDER' && (now - new Date(lead.created_at).getTime() > 900000);
                              const viewers = presenceState[lead.id]?.filter(name => name !== settings.adminName) || [];
                              const slaClasses = isSlaBreached ? 'ring-1 ring-red-500/80 shadow-[0_0_15px_rgba(239,68,68,0.3)] animate-[pulse_2s_ease-in-out_infinite]' : 'border-white/10';

                              return (
                                <div key={lead.id} draggable onDragStart={(e) => handleDragStart(e, lead.id)} onClick={() => setSelectedLead(lead)} 
                                  className={`group/card shrink-0 relative bg-[#374151]/60 backdrop-blur-md rounded-xl p-3.5 cursor-pointer transition-all duration-300 hover:-translate-y-0.5 hover:shadow-[0_8px_20px_rgba(0,0,0,0.4)] hover:bg-[#4B5563]/60 overflow-hidden ${slaClasses}`}>
                                  <div className={`absolute left-0 top-0 bottom-0 w-[3px] transition-all duration-300 group-hover/card:w-1`} style={{ backgroundColor: config.hex, boxShadow: `0 0 10px ${config.hex}` }} />
                                  
                                  {viewers.length > 0 && (
                                    <div className="absolute top-0 right-0 bg-sky-500/20 backdrop-blur-md border-b border-l border-sky-500/30 px-1.5 py-0.5 rounded-bl-lg z-30 flex items-center gap-1 shadow-sm">
                                      <Eye className="w-2.5 h-2.5 text-sky-400 animate-pulse" />
                                      <span className="text-[8px] font-bold text-sky-400 tracking-wider uppercase">{viewers[0]}</span>
                                    </div>
                                  )}

                                  <div className="absolute top-2.5 right-2.5 flex items-center gap-1 opacity-0 group-hover/card:opacity-100 transition-opacity duration-300 z-20">
                                     <button onClick={(e) => toggleStar(e, lead.id)} className="p-1 bg-[#111827]/60 hover:bg-[#1F2937] rounded transition-colors text-zinc-400 hover:text-amber-400 border border-white/5 hover:border-amber-500/30" title="Star Lead"><Star className={`w-3 h-3 ${starredLeads.has(lead.id) ? 'fill-amber-400 text-amber-400' : ''}`} /></button>
                                     <button onClick={(e) => handleDeleteLead(e, lead.id)} className="p-1 bg-[#111827]/60 hover:bg-red-500/20 rounded transition-colors text-zinc-400 hover:text-red-400 border border-white/5 hover:border-red-500/30" title="Delete Conversation"><Trash2 className="w-3 h-3" /></button>
                                  </div>
                                  
                                  <div className="flex flex-col items-start mb-2.5 pl-1 pr-10 relative z-10">
                                    <span className="font-sans text-xs tracking-wide text-white font-bold drop-shadow-sm line-clamp-1">{lead.full_name || 'Store Customer'}</span>
                                    <span className="text-[9px] text-emerald-400 font-bold tracking-widest mt-0.5 drop-shadow-md">+{lead.phone_number}</span>
                                  </div>
                                  
                                  <div className="bg-[#111827]/40 rounded-md p-2.5 ml-1 border border-white/5 group-hover/card:border-white/10 transition-colors duration-300 shadow-inner">
                                    <p className="text-[10px] text-zinc-300 line-clamp-2 leading-snug">{lead.last_message || "No message content."}</p>
                                  </div>
                                  
                                  <div className="mt-2.5 flex items-center justify-between text-[8px] uppercase tracking-widest text-zinc-400 font-bold pl-1">
                                    <div className="flex items-center gap-1">
                                       {isSlaBreached ? (
                                          <span className="text-red-400 flex items-center gap-1 font-bold bg-red-500/10 px-1 py-0.5 rounded border border-red-500/20"><AlertTriangle className="w-2.5 h-2.5" /> SLA BREACH</span>
                                       ) : (
                                          <><Clock className="w-2.5 h-2.5 text-zinc-500" />{new Date(lead.created_at).toLocaleDateString()}</>
                                       )}
                                    </div>
                                  </div>
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

        {/* ─── VIEW: TEMPLATES HUB ─── */}
        {activeView === 'templates' && (
          <div className="flex flex-col h-full animate-[fade-in_0.3s_ease-out]">
            <div className="h-20 flex items-center justify-between px-6 border-b border-white/10 bg-[#111827]/80 backdrop-blur-xl shrink-0">
              <div>
                <h2 className="text-lg font-bold text-white drop-shadow-md">Template & Slash Commands</h2>
                <p className="text-[10px] text-zinc-400 font-medium tracking-wide mt-0.5">Manage your team's quick replies and canned responses</p>
              </div>
            </div>
            <div className="flex-1 overflow-y-auto custom-scrollbar p-6">
               <div className="max-w-5xl mx-auto space-y-6">
                  <div className="bg-[#1F2937]/60 backdrop-blur-xl border border-white/10 rounded-2xl p-5 shadow-2xl">
                     <h3 className="text-xs font-bold text-white flex items-center gap-1.5 mb-4"><Zap className="w-3.5 h-3.5 text-emerald-400" /> Create New Command</h3>
                     <form onSubmit={handleAddTemplate} className="flex flex-col md:flex-row gap-3">
                        <div className="w-full md:w-1/3">
                           <div className="relative">
                             <span className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500 font-bold text-xs">/</span>
                             <input type="text" value={newShortcut} onChange={(e) => setNewShortcut(e.target.value)} placeholder="shortcut_name" className="w-full bg-[#111827]/80 border border-white/10 rounded-lg pl-7 pr-3 py-2.5 text-xs text-white focus:border-emerald-400 outline-none transition-colors" />
                           </div>
                        </div>
                        <div className="flex-1">
                           <input type="text" value={newTemplateContent} onChange={(e) => setNewTemplateContent(e.target.value)} placeholder="Type the full message content here..." className="w-full bg-[#111827]/80 border border-white/10 rounded-lg px-3 py-2.5 text-xs text-white focus:border-emerald-400 outline-none transition-colors" />
                        </div>
                        <button type="submit" disabled={!newShortcut.trim() || !newTemplateContent.trim()} className="bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 hover:bg-emerald-500/30 hover:border-emerald-400 disabled:opacity-50 disabled:grayscale transition-all rounded-lg px-5 py-2.5 text-xs font-bold shadow-sm">Save</button>
                     </form>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {quickReplies.length === 0 ? (
                      <div className="col-span-full p-6 text-center bg-[#1F2937]/30 border border-dashed border-white/10 rounded-2xl text-zinc-500 text-xs font-medium">No templates saved yet. Create one above!</div>
                    ) : (
                      quickReplies.map((reply) => (
                        <div key={reply.id} className="group bg-[#1F2937]/80 border border-white/10 hover:border-white/20 rounded-xl p-4 shadow-sm backdrop-blur-md transition-all duration-300 hover:-translate-y-0.5 relative min-h-[120px]">
                           {editingTemplateId === reply.id ? (
                              <div className="flex flex-col gap-2 h-full animate-[fade-in_0.2s_ease-out]">
                                <div className="relative">
                                   <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-zinc-500 font-bold text-[10px]">/</span>
                                   <input type="text" value={editShortcut} onChange={(e) => setEditShortcut(e.target.value)} className="w-full bg-[#111827]/80 border border-white/10 rounded-md pl-6 pr-2 py-1.5 text-[10px] text-white focus:border-emerald-400 outline-none transition-colors" />
                                </div>
                                <textarea value={editTemplateContent} onChange={(e) => setEditTemplateContent(e.target.value)} className="w-full bg-[#111827]/80 border border-white/10 rounded-md px-2.5 py-1.5 text-[10px] text-white focus:border-emerald-400 outline-none resize-none transition-colors flex-1 custom-scrollbar" />
                                <div className="flex gap-1.5 justify-end mt-auto">
                                  <button onClick={cancelEditingTemplate} className="px-2 py-1 rounded text-[10px] font-bold text-zinc-400 hover:text-white hover:bg-white/5 transition-colors">Cancel</button>
                                  <button onClick={() => handleUpdateTemplate(reply.id)} className="px-2 py-1 rounded text-[10px] font-bold bg-emerald-500/20 text-emerald-400 hover:bg-emerald-500/30 transition-colors">Save</button>
                                </div>
                              </div>
                           ) : (
                              <>
                                 <div className="absolute top-2.5 right-2.5 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                    <button onClick={() => startEditingTemplate(reply)} className="p-1.5 bg-[#111827]/60 hover:bg-blue-500/20 rounded transition-colors text-zinc-400 hover:text-blue-400 border border-white/5 hover:border-blue-500/30" title="Edit Template"><Edit2 className="w-3 h-3" /></button>
                                    <button onClick={() => handleCopyTemplate(reply.id, reply.content)} className={`p-1.5 rounded transition-colors border ${copiedId === reply.id ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/40' : 'bg-[#111827]/60 text-zinc-400 hover:text-white border-white/5 hover:border-white/20'}`} title="Copy Content">{copiedId === reply.id ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}</button>
                                    <button onClick={() => handleDeleteTemplate(reply.id)} className="p-1.5 bg-[#111827]/60 hover:bg-red-500/20 rounded transition-colors text-zinc-400 hover:text-red-400 border border-white/5 hover:border-red-500/30" title="Delete Template"><Trash2 className="w-3 h-3" /></button>
                                 </div>
                                 <h4 className="text-emerald-400 font-bold text-xs mb-2 flex items-center gap-1">/{reply.shortcut}</h4>
                                 <div className="bg-[#111827]/50 rounded-lg p-3 border border-white/5 shadow-inner min-h-[60px]">
                                   <p className="text-[10px] text-zinc-300 leading-relaxed">{reply.content}</p>
                                 </div>
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

        {/* ─── VIEW: CAMPAIGNS HUB ─── */}
        {activeView === 'campaigns' && (
          <div className="flex flex-col h-full animate-[fade-in_0.3s_ease-out]">
            <div className="h-20 flex items-center justify-between px-6 border-b border-white/10 bg-[#111827]/80 backdrop-blur-xl shrink-0">
              <div>
                <h2 className="text-lg font-bold text-white drop-shadow-md">Campaigns & Broadcasts</h2>
                <p className="text-[10px] text-zinc-400 font-medium tracking-wide mt-0.5">Send mass updates, promotions, and recovery messages</p>
              </div>
            </div>
            <div className="flex-1 overflow-y-auto custom-scrollbar p-6">
               <div className="max-w-6xl mx-auto grid grid-cols-1 xl:grid-cols-3 gap-6">
                  <div className="xl:col-span-1 space-y-6">
                    <div className="bg-[#1F2937]/60 backdrop-blur-xl border border-white/10 rounded-2xl p-5 shadow-2xl">
                       <h3 className="text-xs font-bold text-white flex items-center gap-1.5 mb-5"><Megaphone className="w-3.5 h-3.5 text-emerald-400" /> New Broadcast</h3>
                       <form onSubmit={handleLaunchCampaign} className="space-y-4">
                          <div className="space-y-1.5">
                             <label className="text-[9px] font-bold text-zinc-400 uppercase tracking-widest pl-1">Campaign Name</label>
                             <input type="text" value={campaignName} onChange={(e) => setCampaignName(e.target.value)} placeholder="e.g. Eid Flash Sale" className="w-full bg-[#111827]/80 border border-white/10 rounded-lg px-3 py-2.5 text-xs text-white focus:border-emerald-400 outline-none transition-colors" />
                          </div>
                          <div className="space-y-1.5">
                             <label className="text-[9px] font-bold text-zinc-400 uppercase tracking-widest pl-1">Target Audience</label>
                             <select value={campaignAudience} onChange={(e) => setCampaignAudience(e.target.value)} className="w-full bg-[#111827]/80 border border-white/10 rounded-lg px-3 py-2.5 text-xs text-white focus:border-emerald-400 outline-none transition-colors appearance-none cursor-pointer">
                               <option value="ALL">All Contacts ({leads.length})</option>
                               {COLUMNS.map(status => (
                                 <option key={status} value={status}>{status.replace('_', ' ')} ({leads.filter(l => l.status === status).length})</option>
                               ))}
                             </select>
                          </div>
                          <div className="space-y-1.5">
                             <label className="text-[9px] font-bold text-zinc-400 uppercase tracking-widest pl-1">Meta Template</label>
                             <select value={campaignTemplateId} onChange={(e) => setCampaignTemplateId(e.target.value)} className="w-full bg-[#111827]/80 border border-white/10 rounded-lg px-3 py-2.5 text-xs text-white focus:border-emerald-400 outline-none transition-colors appearance-none cursor-pointer">
                               <option value="" disabled>Select a template...</option>
                               {quickReplies.map(reply => (
                                 <option key={reply.id} value={reply.id}>/{reply.shortcut}</option>
                               ))}
                             </select>
                             <p className="text-[9px] text-amber-400/80 mt-1 pl-1 italic">Note: Only pre-approved templates can be broadcasted.</p>
                          </div>
                          <button type="submit" className="w-full bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-white font-bold text-xs px-4 py-2.5 rounded-lg shadow-sm transition-all flex items-center justify-center gap-1.5 hover:-translate-y-0.5 active:translate-y-0 mt-3"><Send className="w-3.5 h-3.5 ml-1" /> Launch Broadcast</button>
                       </form>
                    </div>
                  </div>
                  <div className="xl:col-span-2">
                    <div className="bg-[#111827]/60 backdrop-blur-xl border border-white/10 rounded-2xl p-5 shadow-2xl h-full">
                       <h3 className="text-xs font-bold text-white flex items-center gap-1.5 mb-5"><Activity className="w-3.5 h-3.5 text-cyan-400" /> Broadcast History</h3>
                       <div className="bg-[#1F2937]/50 border border-dashed border-white/10 rounded-xl p-8 flex flex-col items-center justify-center text-center h-[200px]">
                          <Users className="w-10 h-10 text-zinc-600 mb-2" />
                          <p className="text-zinc-400 text-xs font-medium">No campaigns launched yet.</p>
                          <p className="text-[10px] text-zinc-500 mt-1">Your past broadcast metrics will appear here.</p>
                       </div>
                    </div>
                  </div>
               </div>
            </div>
          </div>
        )}

        {/* ─── VIEW: ANALYTICS HUB ─── */}
        {activeView === 'analytics' && (
          <div className="flex flex-col h-full animate-[fade-in_0.3s_ease-out]">
            <div className="h-20 flex items-center justify-between px-6 border-b border-white/10 bg-[#111827]/80 backdrop-blur-xl shrink-0">
              <div>
                <h2 className="text-lg font-bold text-white drop-shadow-md">Analytics & Performance</h2>
                <p className="text-[10px] text-zinc-400 font-medium tracking-wide mt-0.5">Real-time metrics on team performance and conversation volume</p>
              </div>
              <div className="flex items-center gap-3">
                 <div className="bg-[#1F2937] border border-white/10 cursor-pointer transition-colors rounded-lg px-3 py-1.5 flex items-center gap-1.5 text-[10px] font-semibold text-zinc-200 shadow-inner">
                    <Calendar className="w-3 h-3 text-emerald-400" /> Last 30 Days
                 </div>
              </div>
            </div>
            <div className="flex-1 overflow-y-auto custom-scrollbar p-6">
               <div className="max-w-6xl mx-auto space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <div className="bg-[#1F2937]/60 backdrop-blur-xl border border-white/10 rounded-2xl p-5 shadow-2xl relative overflow-hidden">
                       <div className="absolute top-0 right-0 p-3 opacity-10"><Target className="w-16 h-16 text-emerald-500" /></div>
                       <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest mb-1">Resolution Rate</p>
                       <h3 className="text-2xl font-black text-white mb-1.5">{resolutionRate}%</h3>
                       <p className="text-[9px] text-emerald-400 font-semibold flex items-center gap-1"><TrendingUp className="w-2.5 h-2.5"/> +4% from last week</p>
                    </div>
                    <div className="bg-[#1F2937]/60 backdrop-blur-xl border border-white/10 rounded-2xl p-5 shadow-2xl relative overflow-hidden">
                       <div className="absolute top-0 right-0 p-3 opacity-10"><MessageCircle className="w-16 h-16 text-sky-500" /></div>
                       <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest mb-1">Total Contacts</p>
                       <h3 className="text-2xl font-black text-white mb-1.5">{leads.length}</h3>
                       <p className="text-[9px] text-sky-400 font-semibold flex items-center gap-1"><TrendingUp className="w-2.5 h-2.5"/> Active database</p>
                    </div>
                    <div className="bg-[#1F2937]/60 backdrop-blur-xl border border-white/10 rounded-2xl p-5 shadow-2xl relative overflow-hidden">
                       <div className="absolute top-0 right-0 p-3 opacity-10"><Activity className="w-16 h-16 text-amber-500" /></div>
                       <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest mb-1">Avg Response Time</p>
                       <h3 className="text-2xl font-black text-white mb-1.5"><span className="text-lg text-zinc-400">&lt;</span> 2<span className="text-base text-zinc-400">m</span></h3>
                       <p className="text-[9px] text-emerald-400 font-semibold flex items-center gap-1"><TrendingDown className="w-2.5 h-2.5"/> -30s from last week</p>
                    </div>
                    <div className="bg-[#1F2937]/60 backdrop-blur-xl border border-white/10 rounded-2xl p-5 shadow-2xl relative overflow-hidden">
                       <div className="absolute top-0 right-0 p-3 opacity-10"><PieChart className="w-16 h-16 text-purple-500" /></div>
                       <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest mb-1">Total Messages</p>
                       <h3 className="text-2xl font-black text-white mb-1.5">{totalSent + totalReceived}</h3>
                       <p className="text-[9px] text-purple-400 font-semibold flex items-center gap-1">In & Outbound</p>
                    </div>
                  </div>
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                     <div className="bg-[#1F2937]/60 backdrop-blur-xl border border-white/10 rounded-2xl p-6 shadow-2xl">
                        <h3 className="text-xs font-bold text-white flex items-center gap-1.5 mb-6"><Search className="w-3.5 h-3.5 text-emerald-400" /> Lead Pipeline Funnel</h3>
                        <div className="space-y-5">
                           <div>
                              <div className="flex justify-between text-[10px] font-bold text-zinc-300 mb-1.5"><span>New Orders (Entry)</span><span>{newOrdersCount}</span></div>
                              <div className="w-full bg-white/5 rounded-full h-2 overflow-hidden border border-white/5"><div className="bg-emerald-500 h-full rounded-full shadow-[0_0_8px_rgba(16,185,129,0.8)]" style={{ width: `${leads.length ? (newOrdersCount / leads.length) * 100 : 0}%` }}></div></div>
                           </div>
                           <div>
                              <div className="flex justify-between text-[10px] font-bold text-zinc-300 mb-1.5"><span>Handoff (Routing)</span><span>{handoffCount}</span></div>
                              <div className="w-full bg-white/5 rounded-full h-2 overflow-hidden border border-white/5"><div className="bg-yellow-500 h-full rounded-full shadow-[0_0_8px_rgba(234,179,8,0.8)]" style={{ width: `${leads.length ? (handoffCount / leads.length) * 100 : 0}%` }}></div></div>
                           </div>
                           <div>
                              <div className="flex justify-between text-[10px] font-bold text-zinc-300 mb-1.5"><span>Active (In Progress)</span><span>{activeCount}</span></div>
                              <div className="w-full bg-white/5 rounded-full h-2 overflow-hidden border border-white/5"><div className="bg-sky-500 h-full rounded-full shadow-[0_0_8px_rgba(14,165,233,0.8)]" style={{ width: `${leads.length ? (activeCount / leads.length) * 100 : 0}%` }}></div></div>
                           </div>
                           <div>
                              <div className="flex justify-between text-[10px] font-bold text-zinc-300 mb-1.5"><span>Resolved (Closed)</span><span>{resolvedCount}</span></div>
                              <div className="w-full bg-white/5 rounded-full h-2 overflow-hidden border border-white/5"><div className="bg-lime-500 h-full rounded-full shadow-[0_0_8px_rgba(132,204,22,0.8)]" style={{ width: `${leads.length ? (resolvedCount / leads.length) * 100 : 0}%` }}></div></div>
                           </div>
                        </div>
                     </div>
                     <div className="bg-[#1F2937]/60 backdrop-blur-xl border border-white/10 rounded-2xl p-6 shadow-2xl flex flex-col">
                        <h3 className="text-xs font-bold text-white flex items-center gap-1.5 mb-6"><BarChart2 className="w-3.5 h-3.5 text-sky-400" /> Message Volume Split</h3>
                        <div className="flex-1 flex flex-col justify-center items-center">
                           <div className="w-full flex h-12 rounded-xl overflow-hidden border border-white/10 shadow-inner mb-5">
                              <div className="bg-amber-500 flex items-center justify-center text-[10px] font-bold text-black transition-all duration-1000" style={{ width: `${(totalSent + totalReceived) === 0 ? 50 : (totalSent / (totalSent + totalReceived)) * 100}%` }}>{totalSent > 0 && `${Math.round((totalSent / (totalSent + totalReceived)) * 100)}%`}</div>
                              <div className="bg-sky-500 flex items-center justify-center text-[10px] font-bold text-black transition-all duration-1000" style={{ width: `${(totalSent + totalReceived) === 0 ? 50 : (totalReceived / (totalSent + totalReceived)) * 100}%` }}>{totalReceived > 0 && `${Math.round((totalReceived / (totalSent + totalReceived)) * 100)}%`}</div>
                           </div>
                           <div className="flex w-full justify-around mt-2">
                              <div className="text-center">
                                 <div className="flex items-center gap-1.5 mb-1"><div className="w-2.5 h-2.5 rounded-full bg-amber-500 shadow-[0_0_8px_rgba(245,158,11,0.8)]"></div><span className="text-[9px] font-bold text-zinc-400 uppercase tracking-widest">Outbound</span></div>
                                 <p className="text-2xl font-bold text-white">{totalSent}</p>
                              </div>
                              <div className="w-px bg-white/10 h-full mx-4"></div>
                              <div className="text-center">
                                 <div className="flex items-center gap-1.5 mb-1"><div className="w-2.5 h-2.5 rounded-full bg-sky-500 shadow-[0_0_8px_rgba(14,165,233,0.8)]"></div><span className="text-[9px] font-bold text-zinc-400 uppercase tracking-widest">Inbound</span></div>
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

        {/* ─── VIEW: SETTINGS HUB ─── */}
        {activeView === 'settings' && (
          <div className="flex flex-col h-full animate-[fade-in_0.3s_ease-out]">
            <div className="h-20 flex items-center justify-between px-6 border-b border-white/10 bg-[#111827]/80 backdrop-blur-xl shrink-0">
              <div>
                <h2 className="text-lg font-bold text-white drop-shadow-md">System Settings</h2>
                <p className="text-[10px] text-zinc-400 font-medium tracking-wide mt-0.5">Manage your CRM integrations, team, and preferences</p>
              </div>
            </div>
            <div className="flex-1 overflow-y-auto custom-scrollbar p-6">
               <div className="max-w-4xl mx-auto space-y-6">
                  <div className="bg-[#1F2937]/60 backdrop-blur-xl border border-white/10 rounded-2xl p-6 shadow-2xl">
                     <h3 className="text-xs font-bold text-white flex items-center gap-1.5 mb-5"><Palette className="w-4 h-4 text-pink-400" /> Interface Appearance</h3>
                     <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                        <button onClick={() => handleThemeChange('nebula')} className={`flex flex-col items-center justify-center gap-2 px-3 py-5 rounded-xl border font-bold text-[10px] transition-all duration-300 ${theme === 'nebula' ? 'border-pink-400 bg-pink-500/10 text-white shadow-sm' : 'border-white/10 text-zinc-400 hover:bg-white/5'}`}>
                          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#0F172A] via-[#1E293B] to-[#0F172A] border border-white/20"></div> Nebula Dark
                        </button>
                        <button onClick={() => handleThemeChange('grey')} className={`flex flex-col items-center justify-center gap-2 px-3 py-5 rounded-xl border font-bold text-[10px] transition-all duration-300 ${theme === 'grey' ? 'border-pink-400 bg-pink-500/10 text-white shadow-sm' : 'border-white/10 text-zinc-400 hover:bg-white/5'}`}>
                          <div className="w-10 h-10 rounded-full bg-[#1e1e24] border border-white/20"></div> Soothing Grey
                        </button>
                        <button onClick={() => handleThemeChange('black')} className={`flex flex-col items-center justify-center gap-2 px-3 py-5 rounded-xl border font-bold text-[10px] transition-all duration-300 ${theme === 'black' ? 'border-pink-400 bg-pink-500/10 text-white shadow-sm' : 'border-white/10 text-zinc-400 hover:bg-white/5'}`}>
                          <div className="w-10 h-10 rounded-full bg-black border border-white/20"></div> Pure Black
                        </button>
                     </div>
                  </div>
                  <div className="bg-[#1F2937]/60 backdrop-blur-xl border border-white/10 rounded-2xl p-6 shadow-2xl">
                     <h3 className="text-xs font-bold text-white flex items-center gap-1.5 mb-5"><Globe className="w-4 h-4 text-sky-400" /> API Integrations</h3>
                     <div className="space-y-5">
                        <div className="bg-[#111827]/60 rounded-xl p-5 border border-white/5">
                           <div className="flex items-center justify-between mb-3">
                              <h4 className="text-white font-bold text-xs flex items-center gap-1.5">WhatsApp / Meta API</h4>
                              <span className="px-2.5 py-0.5 bg-emerald-500/20 text-emerald-400 text-[9px] font-bold uppercase rounded border border-emerald-500/30">Configured</span>
                           </div>
                           <div className="space-y-3">
                              <div>
                                 <label className="text-[9px] font-bold text-zinc-400 uppercase tracking-widest pl-1">Permanent Access Token</label>
                                 <input type="text" value={settings.metaToken} onChange={(e) => setSettings({...settings, metaToken: e.target.value})} placeholder="EAAGm0PX4ZCQoBO..." className="w-full mt-1 bg-[#1F2937]/80 border border-white/10 rounded-lg px-3 py-2 text-xs text-white focus:border-sky-400 outline-none transition-colors" />
                              </div>
                              <div>
                                 <label className="text-[9px] font-bold text-zinc-400 uppercase tracking-widest pl-1">Phone Number ID</label>
                                 <input type="text" value={settings.metaPhoneId} onChange={(e) => setSettings({...settings, metaPhoneId: e.target.value})} placeholder="e.g. 103948273948" className="w-full mt-1 bg-[#1F2937]/80 border border-white/10 rounded-lg px-3 py-2 text-xs text-white focus:border-sky-400 outline-none transition-colors" />
                              </div>
                           </div>
                        </div>
                        <div className="bg-[#111827]/60 rounded-xl p-5 border border-white/5">
                           <div className="flex items-center justify-between mb-3">
                              <h4 className="text-white font-bold text-xs flex items-center gap-1.5">Shopify Store API</h4>
                              <span className="px-2.5 py-0.5 bg-emerald-500/20 text-emerald-400 text-[9px] font-bold uppercase rounded border border-emerald-500/30">Configured</span>
                           </div>
                           <div className="space-y-3">
                              <div>
                                 <label className="text-[9px] font-bold text-zinc-400 uppercase tracking-widest pl-1">Store Domain</label>
                                 <input type="text" value={settings.shopifyDomain} onChange={(e) => setSettings({...settings, shopifyDomain: e.target.value})} placeholder="my-store.myshopify.com" className="w-full mt-1 bg-[#1F2937]/80 border border-white/10 rounded-lg px-3 py-2 text-xs text-white focus:border-sky-400 outline-none transition-colors" />
                              </div>
                           </div>
                        </div>
                     </div>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                     <div className="bg-[#1F2937]/60 backdrop-blur-xl border border-white/10 rounded-2xl p-6 shadow-2xl">
                        <h3 className="text-xs font-bold text-white flex items-center gap-1.5 mb-5"><Bell className="w-4 h-4 text-amber-400" /> Notifications</h3>
                        <div className="space-y-3">
                           <div onClick={() => setSettings({...settings, audioAlerts: !settings.audioAlerts})} className="flex items-center justify-between p-3 bg-[#111827]/50 rounded-lg border border-white/5 hover:border-white/10 transition-colors cursor-pointer">
                              <div><p className="text-xs font-bold text-white">Audio Alerts</p><p className="text-[9px] text-zinc-400 mt-0.5">Play a sound for incoming messages</p></div>
                              <div className={`w-8 h-5 rounded-full relative transition-colors duration-300 ${settings.audioAlerts ? 'bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.4)]' : 'bg-zinc-600'}`}><div className={`w-3.5 h-3.5 bg-white rounded-full absolute top-[3px] transition-all duration-300 ${settings.audioAlerts ? 'right-[3px]' : 'left-[3px]'}`}></div></div>
                           </div>
                           <div onClick={() => setSettings({...settings, desktopNotifications: !settings.desktopNotifications})} className="flex items-center justify-between p-3 bg-[#111827]/50 rounded-lg border border-white/5 hover:border-white/10 transition-colors cursor-pointer">
                              <div><p className="text-xs font-bold text-white">Desktop Notifications</p><p className="text-[9px] text-zinc-400 mt-0.5">Show browser push notifications</p></div>
                              <div className={`w-8 h-5 rounded-full relative transition-colors duration-300 ${settings.desktopNotifications ? 'bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.4)]' : 'bg-zinc-600'}`}><div className={`w-3.5 h-3.5 bg-white rounded-full absolute top-[3px] transition-all duration-300 ${settings.desktopNotifications ? 'right-[3px]' : 'left-[3px]'}`}></div></div>
                           </div>
                        </div>
                     </div>
                     <div className="bg-[#1F2937]/60 backdrop-blur-xl border border-white/10 rounded-2xl p-6 shadow-2xl">
                        <h3 className="text-xs font-bold text-white flex items-center gap-1.5 mb-5"><Lock className="w-4 h-4 text-purple-400" /> Admin Profile</h3>
                        <div className="space-y-3">
                           <div><label className="text-[9px] font-bold text-zinc-400 uppercase tracking-widest pl-1">Display Name</label><input type="text" value={settings.adminName} onChange={(e) => setSettings({...settings, adminName: e.target.value})} className="w-full bg-[#111827]/80 border border-white/10 rounded-lg px-3 py-2 text-xs text-white mt-1 outline-none focus:border-purple-400 transition-colors" /></div>
                           <div><label className="text-[9px] font-bold text-zinc-400 uppercase tracking-widest pl-1">Email Address</label><input type="email" value={settings.adminEmail} onChange={(e) => setSettings({...settings, adminEmail: e.target.value})} className="w-full bg-[#111827]/80 border border-white/10 rounded-lg px-3 py-2 text-xs text-white mt-1 outline-none focus:border-purple-400 transition-colors" /></div>
                           <button onClick={() => alert('Profile Updated Locally!')} className="w-full py-2.5 bg-purple-500/20 text-purple-400 border border-purple-500/40 rounded-lg font-bold text-xs hover:bg-purple-500/30 transition-colors mt-2 shadow-sm">Update Profile</button>
                        </div>
                     </div>
                  </div>
               </div>
            </div>
          </div>
        )}
      </div>

      {/* ─── SLIDE-OUT CHAT & PROFILING PANE (WIDE) ─── */}
      <div className={`fixed top-0 right-0 h-full w-full md:w-[90vw] xl:w-[1200px] bg-[#111827]/95 backdrop-blur-3xl border-l border-white/10 z-50 transform transition-transform duration-500 flex flex-row shadow-[-20px_0_50px_rgba(0,0,0,0.5)] ${selectedLead ? 'translate-x-0' : 'translate-x-full'}`}>
        {selectedLead && (
          <>
            <div className="flex-1 flex flex-col border-r border-white/10 overflow-hidden relative">
                <div className="flex items-center justify-between p-5 border-b border-white/10 shrink-0 relative overflow-hidden bg-[#1F2937]/50">
                    <div className="absolute inset-0 bg-gradient-to-r from-emerald-500/5 to-transparent opacity-50"></div>
                    <div className="flex items-center gap-3 relative z-10">
                        <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-emerald-500 to-teal-500 flex items-center justify-center shadow-[0_0_15px_rgba(16,185,129,0.4)] text-white"><MessageSquare className="w-4 h-4"/></div>
                        <div>
                            <h3 className="text-white font-bold text-base">{selectedLead.full_name || selectedLead.phone_number}</h3>
                            <p className="text-[9px] text-emerald-400 font-bold tracking-widest uppercase mt-0.5 flex items-center gap-1.5"><span className="w-1.5 h-1.5 rounded-full bg-emerald-400 shadow-[0_0_8px_rgba(16,185,129,0.9)] animate-pulse"></span>Encrypted Connection</p>
                        </div>
                    </div>
                    <div className="flex items-center gap-2.5 relative z-10">
                        {selectedLead.status === 'NEW_ORDER' && <button onClick={() => handleTakeOver(selectedLead.id)} className="px-3 py-1.5 bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 hover:border-emerald-400 hover:bg-emerald-500/30 rounded-full text-[9px] font-bold uppercase transition-all shadow-sm">Take Over</button>}
                        <button onClick={() => handleResolveChat(selectedLead.id)} className="px-3 py-1.5 bg-lime-500/20 text-lime-300 border border-lime-500/40 hover:border-lime-400 hover:bg-lime-500/30 rounded-full text-[9px] font-bold uppercase transition-all shadow-sm">Resolve</button>
                        <button onClick={() => setSelectedLead(null)} className="p-1.5 hover:bg-white/10 hover:rotate-90 rounded-full text-zinc-300 transition-all"><X className="w-4 h-4"/></button>
                    </div>
                </div>

                <div className="flex-1 overflow-y-auto p-5 flex flex-col gap-5 custom-scrollbar bg-[#0B1120]/40">
                    {chatMessages.length === 0 ? <div className="flex-1 flex items-center justify-center text-zinc-500 text-[10px] font-sans tracking-widest uppercase">No customer conversation history</div> :
                        chatMessages.map((msg, i) => (
                        <div key={msg.id || i} className={`group/msg relative flex flex-col max-w-[85%] animate-[fade-in_0.3s_ease-out] ${msg.is_outbound ? 'self-end items-end' : 'self-start items-start'}`}>
                            <button onClick={() => handleDeleteMessage(msg.id)} className={`absolute top-1/2 -translate-y-1/2 ${msg.is_outbound ? '-left-8' : '-right-8'} opacity-0 group-hover/msg:opacity-100 p-1.5 hover:bg-red-500/20 rounded-full transition-all text-zinc-500 hover:text-red-400`} title="Delete Message"><Trash2 className="w-3 h-3" /></button>
                            <div className={`p-3.5 rounded-2xl text-xs leading-relaxed shadow-lg backdrop-blur-md ${msg.is_outbound ? 'bg-gradient-to-br from-emerald-600 to-teal-600 text-white rounded-br-sm shadow-[0_5px_20px_rgba(16,185,129,0.2)] border border-emerald-400/30' : 'bg-[#1F2937] border border-white/10 text-zinc-100 rounded-bl-sm shadow-[0_5px_20px_rgba(0,0,0,0.2)]'}`}>
                               {renderMessageContent(msg.content)}
                            </div>
                            <span className={`text-[9px] font-bold tracking-widest uppercase mt-1.5 px-1 flex items-center gap-1 ${msg.is_outbound ? 'justify-end text-emerald-200/70' : 'justify-start text-zinc-500'}`}>
                                {new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                {msg.is_outbound && <CheckCheck className={`w-3 h-3 ${msg.status === 'read' ? 'text-blue-400' : 'text-emerald-200/50'}`} />}
                            </span>
                        </div>
                    ))}
                    <div ref={messagesEndRef} />
                </div>

                <div className="p-5 border-t border-white/10 bg-[#111827]/90 backdrop-blur-xl shrink-0">
                    {showCommandMenu && (
                      <div className="absolute bottom-[90px] left-5 mb-2 w-72 max-h-60 overflow-y-auto custom-scrollbar bg-[#1F2937]/95 backdrop-blur-xl border border-white/10 rounded-xl shadow-2xl z-50 animate-[fade-in_0.2s_ease-out]">
                        <div className="p-2.5 border-b border-white/5 bg-[#111827]/50 sticky top-0"><p className="text-[9px] font-bold text-zinc-400 uppercase tracking-widest flex items-center gap-1.5"><Zap className="w-3 h-3 text-amber-400" /> Command Engine</p></div>
                        <div className="p-1.5 flex flex-col gap-1">
                          {filteredReplies.length > 0 ? (
                            filteredReplies.map((reply) => (
                              <button key={reply.id} onClick={() => insertQuickReply(reply.content)} className="flex flex-col items-start p-2.5 rounded-lg hover:bg-white/5 transition-colors border border-transparent hover:border-white/5 text-left">
                                <span className="text-[11px] font-bold text-emerald-400 mb-0.5">/{reply.shortcut}</span><span className="text-[10px] text-zinc-400 line-clamp-2">{reply.content}</span>
                              </button>
                            ))
                          ) : ( <div className="p-3 text-center text-[10px] text-zinc-500 font-medium">No commands found.</div> )}
                        </div>
                      </div>
                    )}
                    <div className="flex gap-2 mb-2.5">
                        <button type="button" onClick={() => setIsInternal(!isInternal)} className={`text-[9px] font-bold px-3 py-1.5 rounded-full border transition-all ${isInternal ? 'bg-amber-500 text-black border-amber-500 shadow-[0_0_10px_rgba(245,158,11,0.4)]' : 'text-zinc-400 border-white/20 hover:text-amber-400 hover:border-amber-400/50 hover:bg-amber-500/10'}`}>Internal Note</button>
                        <button type="button" onClick={() => handleSendInteractive('button')} className="text-[9px] font-bold px-3 py-1.5 rounded-full border border-sky-500/50 text-sky-400 hover:bg-sky-500/10 transition-all flex items-center gap-1"><MousePointerClick className="w-2.5 h-2.5"/> Buttons</button>
                        <button type="button" onClick={() => handleSendInteractive('list')} className="text-[9px] font-bold px-3 py-1.5 rounded-full border border-purple-500/50 text-purple-400 hover:bg-purple-500/10 transition-all flex items-center gap-1"><List className="w-2.5 h-2.5"/> Menu List</button>
                    </div>
                    <form onSubmit={handleSendMessage} className="relative flex items-center group/form">
                        <input type="text" value={newMessage} onChange={handleInputChange} placeholder={isInternal ? "Add a private team memo..." : "Draft a secure message... (Type '/' for templates)"} className={`w-full bg-[#1F2937]/80 border rounded-full pl-5 pr-12 py-3 text-xs focus:outline-none text-white transition-all shadow-inner ${isInternal ? 'border-amber-500/50 focus:ring-1 focus:ring-amber-500/80 placeholder-amber-500/50' : 'border-white/20 focus:ring-1 focus:ring-emerald-500/80 focus:border-emerald-500/80 placeholder-zinc-400'}`} />
                        <button type="submit" disabled={!newMessage.trim()} className={`absolute right-1.5 p-2 rounded-full transition-all disabled:opacity-50 disabled:grayscale ${isInternal ? 'bg-amber-500 text-black' : 'bg-gradient-to-r from-emerald-500 to-teal-500 text-white'}`}><Send className="w-3.5 h-3.5 ml-0.5"/></button>
                    </form>
                </div>
            </div>

            {/* ─── RIGHT PANE (SCROLLABLE PROFILING & E-COMMERCE) ─── */}
            <div className="w-[300px] bg-[#111827]/90 backdrop-blur-xl border-l border-white/10 flex flex-col h-full shadow-inner shrink-0">
                <div className="flex-1 overflow-y-auto custom-scrollbar">
                    <div className="p-6 pb-5 border-b border-white/10">
                        <h4 className="text-[9px] font-bold text-white uppercase tracking-widest mb-4 flex items-center gap-1.5 drop-shadow-md"><User className="w-3.5 h-3.5 text-emerald-400"/> Identity Profile</h4>
                        <div className="space-y-3">
                            <div className="space-y-1"><label className="text-[8px] font-bold text-emerald-400 uppercase tracking-widest ml-1">Assigned Name</label><input value={editProfile.full_name} onChange={(e) => setEditProfile({...editProfile, full_name: e.target.value})} onBlur={handleUpdateProfile} className="w-full bg-[#1F2937] border border-white/10 rounded-lg px-3 py-2 text-[11px] text-white focus:border-emerald-400 focus:bg-[#374151] outline-none transition-all" placeholder="Enter Full Name" /></div>
                            <div className="space-y-1"><label className="text-[8px] font-bold text-emerald-400 uppercase tracking-widest ml-1">Email Hash</label><input value={editProfile.email} onChange={(e) => setEditProfile({...editProfile, email: e.target.value})} onBlur={handleUpdateProfile} className="w-full bg-[#1F2937] border border-white/10 rounded-lg px-3 py-2 text-[11px] text-white focus:border-emerald-400 focus:bg-[#374151] outline-none transition-all" placeholder="email@client.com" /></div>
                            <div className="space-y-1"><label className="text-[8px] font-bold text-emerald-400 uppercase tracking-widest ml-1">Deep Notes</label><textarea rows={2} value={editProfile.profile_notes} onChange={(e) => setEditProfile({...editProfile, profile_notes: e.target.value})} onBlur={handleUpdateProfile} className="w-full bg-[#1F2937] border border-white/10 rounded-lg px-3 py-2 text-[11px] text-white focus:border-emerald-400 focus:bg-[#374151] outline-none resize-none transition-all custom-scrollbar" placeholder="Private notes..." /></div>
                        </div>
                    </div>

                    <div className="p-6 py-5 border-b border-white/10 bg-gradient-to-b from-[#111827] to-emerald-950/20">
                        <h4 className="text-[9px] font-bold text-emerald-400 uppercase tracking-widest mb-4 flex items-center gap-1.5 drop-shadow-md"><ShoppingBag className="w-3.5 h-3.5 text-emerald-400"/> Live Store Sync</h4>
                        {loadingShopify ? ( <div className="p-4 bg-[#1F2937]/50 border border-white/10 rounded-lg flex items-center justify-center gap-2 text-[10px] text-zinc-400 animate-pulse shadow-inner"><Loader2 className="w-3.5 h-3.5 animate-spin text-emerald-500" /> Fetching Shopify History...</div>
                        ) : shopifyData?.found ? (
                            <div className="space-y-3 animate-[fade-in_0.4s_ease-out]">
                                <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-lg p-4 shadow-sm backdrop-blur-sm"><p className="text-[8px] text-emerald-400/80 uppercase tracking-widest font-bold mb-1">Lifetime Value</p><p className="text-xl font-bold text-emerald-300 drop-shadow-md">{shopifyData.totalSpent}</p></div>
                                <div className="space-y-2"><p className="text-[8px] text-zinc-400 uppercase tracking-widest font-bold mb-2 mt-1 pl-1">Recent Orders</p>
                                    {shopifyData.recentOrders.map((order: any, idx: number) => (
                                        <div key={idx} className="bg-[#1F2937] border border-white/10 rounded-lg p-3 flex justify-between items-center hover:bg-[#374151] transition-colors shadow-sm">
                                            <div><p className="text-[11px] font-semibold text-white mb-0.5">{order.orderName}</p><p className="text-[8px] text-zinc-400 uppercase tracking-widest">{order.date} • <span className="text-emerald-400/80">{order.fulfillmentStatus || 'UNFULFILLED'}</span></p></div>
                                            <span className="text-xs font-bold text-emerald-400">{order.total}</span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        ) : ( <div className="p-4 bg-[#1F2937]/50 border border-white/10 rounded-lg text-center shadow-inner"><p className="text-[9px] text-zinc-400 uppercase tracking-widest font-bold">No linked Shopify customer found</p></div> )}
                    </div>

                    <div className="p-6 pt-5 min-h-[250px]">
                        <h4 className="text-[9px] font-bold text-amber-400 uppercase tracking-widest mb-3 flex items-center gap-1.5 drop-shadow-md"><StickyNote className="w-3.5 h-3.5"/> Internal Memos</h4>
                        <div className="space-y-2.5">
                            {internalMemos.length === 0 ? ( <div className="p-3 border border-white/10 rounded-lg bg-[#1F2937]/50 text-center transition-all"><p className="text-[9px] text-zinc-400 uppercase tracking-widest font-bold">No internal memos</p></div>
                            ) : (
                                internalMemos.map((memo, i) => (
                                    <div key={memo.id} className="group relative bg-amber-500/10 border border-amber-500/30 hover:border-amber-500/50 hover:bg-amber-500/20 rounded-lg p-2.5 shadow-sm backdrop-blur-sm transition-all hover:-translate-y-0.5">
                                        <button onClick={() => handleDeleteMemo(memo.id)} className="absolute top-1.5 right-1.5 opacity-0 group-hover:opacity-100 p-1 hover:bg-red-500/30 rounded transition-all text-amber-300 hover:text-red-300"><Trash2 className="w-3 h-3" /></button>
                                        <p className="text-[11px] text-amber-100 leading-relaxed mb-1.5 pr-5 font-medium">{memo.content}</p>
                                        <span className="text-[8px] text-amber-400/70 font-bold uppercase tracking-widest block text-right">{new Date(memo.created_at).toLocaleString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}</span>
                                    </div>
                                ))
                            )}
                        </div>
                    </div>
                </div>

                <div className="p-5 shrink-0 border-t border-white/10 bg-[#111827]/90 backdrop-blur-md">
                    <button type="button" onClick={handleExportPDF} className="group relative overflow-hidden w-full flex items-center justify-center gap-1.5 py-3 bg-[#1F2937] hover:bg-emerald-500/20 border border-white/10 hover:border-emerald-400/50 rounded-xl text-[9px] font-bold uppercase tracking-widest transition-all text-zinc-300 hover:text-white hover:shadow-[0_5px_15px_rgba(16,185,129,0.2)] hover:-translate-y-0.5 active:translate-y-0">
                        <div className="absolute inset-0 w-[50%] h-full bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-[150%] group-hover:animate-[sweep_1.5s_ease-in-out_infinite]" />
                        <Download className="w-3.5 h-3.5 relative z-10 transition-transform duration-300 group-hover:-translate-y-0.5"/> <span className="relative z-10">Export Intelligence</span>
                    </button>
                </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}