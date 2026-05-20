"use client"

import { useEffect, useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '../../lib/supabase';
import { 
  ShoppingBag, MessageCircle, UploadCloud, 
  ArrowRight, CheckCircle2, Loader2, Sparkles, Server, Zap
} from 'lucide-react';

function NebulaBackground() {
  return (
    <div className="fixed inset-0 -z-30 pointer-events-none overflow-hidden bg-[#0F172A]">
      <div className="absolute top-[-20%] left-[-10%] w-[60vw] h-[60vw] rounded-full bg-blue-500/10 blur-[150px] animate-[pulse-slow_15s_ease-in-out_infinite_alternate]" />
      <div className="absolute bottom-[-20%] right-[-10%] w-[50vw] h-[50vw] rounded-full bg-emerald-500/10 blur-[150px] animate-[pulse-slow_20s_ease-in-out_infinite_alternate-reverse]" />
    </div>
  );
}

export default function Onboarding() {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [isSaving, setIsSaving] = useState(false);
  const [isUploadingCSV, setIsUploadingCSV] = useState(false);
  const [csvSuccess, setCsvSuccess] = useState(false);
  const [csvCount, setCsvCount] = useState(0);

  // Form State
  const [shopifyDomain, setShopifyDomain] = useState('');
  const [metaToken, setMetaToken] = useState('');
  const [metaPhoneId, setMetaPhoneId] = useState('');

  // Protect the route
  useEffect(() => {
    const checkAuth = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) router.push('/login');
    };
    checkAuth();
  }, [router]);

  const handleNextStep = async () => {
    if (step === 1) {
      if (!shopifyDomain.trim()) return alert("Please enter your Shopify domain.");
      setStep(2);
    } else if (step === 2) {
      if (!metaToken.trim() || !metaPhoneId.trim()) return alert("Please provide both Meta credentials.");
      setIsSaving(true);
      
      // Save credentials securely to the user's metadata in Supabase
      try {
        await supabase.auth.updateUser({
          data: { 
            shopify_domain: shopifyDomain,
            meta_token: metaToken,
            meta_phone_id: metaPhoneId,
            onboarding_complete: true
          }
        });
        setStep(3);
      } catch (err) {
        alert("Failed to save credentials. Please try again.");
      }
      setIsSaving(false);
    }
  };

  const handleCSVUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]; if (!file) return; 
    setIsUploadingCSV(true); 
    const reader = new FileReader();
    
    reader.onload = async (event) => {
      try {
        const text = event.target?.result as string; 
        const rows = text.split('\n'); 
        const newLeads = [];
        
        for (let i = 1; i < rows.length; i++) {
          const cols = rows[i].split(',');
          if (cols.length >= 1 && cols[0].trim()) {
            let phone = cols[0].replace(/\D/g, ''); 
            if (phone) {
              newLeads.push({ 
                phone_number: phone, 
                full_name: cols[1]?.trim() || 'Imported Contact', 
                status: 'ACTIVE', 
                last_message: 'System Migration' 
              });
            }
          }
        }
        
        if (newLeads.length > 0) {
          const { error } = await supabase.from('customers').insert(newLeads);
          if (!error) { 
             setCsvSuccess(true);
             setCsvCount(newLeads.length);
          } else { 
             alert("Database Error: Could not import leads."); 
          }
        } else { 
          alert("No valid phone numbers found in the CSV."); 
        }
      } catch (err) { alert("Failed to parse CSV file."); }
      setIsUploadingCSV(false); 
      e.target.value = ''; 
    };
    reader.readAsText(file);
  };

  const completeOnboarding = () => {
    router.push('/dashboard');
  };

  return (
    <div className="min-h-screen flex items-center justify-center text-zinc-100 font-sans relative selection:bg-emerald-500/30 p-4">
      <NebulaBackground />

      <div className="w-full max-w-2xl bg-[#111827]/80 backdrop-blur-2xl border border-white/10 rounded-3xl shadow-[0_0_50px_rgba(0,0,0,0.5)] overflow-hidden flex flex-col">
        
        {/* Header & Progress Bar */}
        <div className="px-8 py-6 border-b border-white/10 bg-[#1F2937]/50 flex items-center justify-between">
           <div>
             <h1 className="text-xl font-extrabold tracking-tight text-white flex items-center gap-2">
               <span className="w-8 h-8 rounded-lg bg-gradient-to-br from-emerald-400 to-sky-500 flex items-center justify-center shadow-[0_0_15px_rgba(16,185,129,0.4)]">
                 <Sparkles className="w-4 h-4 text-white" />
               </span>
               Workspace Setup
             </h1>
             <p className="text-xs text-zinc-400 mt-1.5 font-medium">Let's configure your command center in 3 steps.</p>
           </div>
           
           <div className="flex items-center gap-2">
              <div className={`w-8 h-1.5 rounded-full transition-all duration-500 ${step >= 1 ? 'bg-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.5)]' : 'bg-white/10'}`} />
              <div className={`w-8 h-1.5 rounded-full transition-all duration-500 ${step >= 2 ? 'bg-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.5)]' : 'bg-white/10'}`} />
              <div className={`w-8 h-1.5 rounded-full transition-all duration-500 ${step >= 3 ? 'bg-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.5)]' : 'bg-white/10'}`} />
           </div>
        </div>

        {/* Content Area */}
        <div className="p-8">
          
          {/* STEP 1: SHOPIFY */}
          {step === 1 && (
            <div className="animate-[fade-in_0.4s_ease-out]">
               <div className="flex items-center gap-4 mb-6">
                 <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center"><ShoppingBag className="w-6 h-6 text-emerald-400" /></div>
                 <div>
                   <h2 className="text-lg font-bold text-white">Connect Shopify</h2>
                   <p className="text-xs text-zinc-400">Link your storefront to sync live customer data and lifetime value.</p>
                 </div>
               </div>

               <div className="space-y-4 mb-8">
                 <div>
                    <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest pl-1 mb-1.5 block">Store URL</label>
                    <div className="relative">
                      <Server className="w-4 h-4 text-zinc-500 absolute left-4 top-1/2 -translate-y-1/2" />
                      <input 
                         type="text" 
                         value={shopifyDomain}
                         onChange={(e) => setShopifyDomain(e.target.value)}
                         placeholder="my-brand.myshopify.com" 
                         className="w-full bg-[#1F2937] border border-white/10 rounded-xl pl-11 pr-4 py-3.5 text-sm text-white focus:border-emerald-400 outline-none transition-colors shadow-inner"
                      />
                    </div>
                 </div>
               </div>

               <div className="flex justify-end">
                 <button onClick={handleNextStep} className="bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-white font-bold text-sm px-6 py-3 rounded-xl shadow-[0_0_20px_rgba(16,185,129,0.3)] transition-all flex items-center gap-2 hover:-translate-y-0.5">
                   Next Step <ArrowRight className="w-4 h-4" />
                 </button>
               </div>
            </div>
          )}

          {/* STEP 2: META API */}
          {step === 2 && (
            <div className="animate-[fade-in_0.4s_ease-out]">
               <div className="flex items-center gap-4 mb-6">
                 <div className="w-12 h-12 rounded-2xl bg-sky-500/10 border border-sky-500/20 flex items-center justify-center"><MessageCircle className="w-6 h-6 text-sky-400" /></div>
                 <div>
                   <h2 className="text-lg font-bold text-white">Connect WhatsApp API</h2>
                   <p className="text-xs text-zinc-400">Enter your Meta developer credentials to enable encrypted messaging.</p>
                 </div>
               </div>

               <div className="space-y-5 mb-8">
                 <div>
                    <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest pl-1 mb-1.5 block">Permanent Access Token</label>
                    <div className="relative">
                      <Zap className="w-4 h-4 text-zinc-500 absolute left-4 top-1/2 -translate-y-1/2" />
                      <input 
                         type="password" 
                         value={metaToken}
                         onChange={(e) => setMetaToken(e.target.value)}
                         placeholder="EAAGm0PX4ZCQoBO..." 
                         className="w-full bg-[#1F2937] border border-white/10 rounded-xl pl-11 pr-4 py-3.5 text-sm text-white focus:border-sky-400 outline-none transition-colors shadow-inner font-mono"
                      />
                    </div>
                 </div>
                 <div>
                    <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest pl-1 mb-1.5 block">Phone Number ID</label>
                    <div className="relative">
                      <Server className="w-4 h-4 text-zinc-500 absolute left-4 top-1/2 -translate-y-1/2" />
                      <input 
                         type="text" 
                         value={metaPhoneId}
                         onChange={(e) => setMetaPhoneId(e.target.value)}
                         placeholder="e.g. 103948273948" 
                         className="w-full bg-[#1F2937] border border-white/10 rounded-xl pl-11 pr-4 py-3.5 text-sm text-white focus:border-sky-400 outline-none transition-colors shadow-inner font-mono"
                      />
                    </div>
                 </div>
               </div>

               <div className="flex justify-between items-center">
                 <button onClick={() => setStep(1)} className="text-xs font-bold text-zinc-400 hover:text-white transition-colors">Back</button>
                 <button onClick={handleNextStep} disabled={isSaving} className="bg-gradient-to-r from-sky-500 to-blue-600 hover:from-sky-400 hover:to-blue-500 text-white font-bold text-sm px-6 py-3 rounded-xl shadow-[0_0_20px_rgba(14,165,233,0.3)] transition-all flex items-center gap-2 hover:-translate-y-0.5 disabled:opacity-50">
                   {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <>Save & Continue <ArrowRight className="w-4 h-4" /></>}
                 </button>
               </div>
            </div>
          )}

          {/* STEP 3: CSV MIGRATION */}
          {step === 3 && (
            <div className="animate-[fade-in_0.4s_ease-out]">
               <div className="flex items-center gap-4 mb-6">
                 <div className="w-12 h-12 rounded-2xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center"><UploadCloud className="w-6 h-6 text-amber-400" /></div>
                 <div>
                   <h2 className="text-lg font-bold text-white">Import Customer Database</h2>
                   <p className="text-xs text-zinc-400">Instantly populate your pipeline to start marketing immediately.</p>
                 </div>
               </div>

               {csvSuccess ? (
                 <div className="bg-emerald-500/10 border border-emerald-500/30 rounded-2xl p-8 flex flex-col items-center justify-center text-center mb-8">
                    <div className="w-16 h-16 bg-emerald-500/20 rounded-full flex items-center justify-center mb-4">
                       <CheckCircle2 className="w-8 h-8 text-emerald-400" />
                    </div>
                    <h3 className="text-lg font-bold text-white mb-1">Migration Successful!</h3>
                    <p className="text-xs text-emerald-400/80 font-medium">Successfully securely imported {csvCount} leads into your active pipeline.</p>
                 </div>
               ) : (
                 <div className="relative border-2 border-dashed border-white/20 bg-[#1F2937]/50 rounded-2xl p-10 flex flex-col items-center justify-center text-center transition-all hover:border-amber-500/50 hover:bg-[#1F2937] cursor-pointer mb-8">
                   <input type="file" accept=".csv" onChange={handleCSVUpload} disabled={isUploadingCSV} className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10" />
                   {isUploadingCSV ? (
                      <Loader2 className="w-10 h-10 text-amber-400 animate-spin mb-3" />
                   ) : (
                      <UploadCloud className="w-10 h-10 text-amber-400/70 mb-3" />
                   )}
                   <span className="text-sm font-bold text-white mb-1">{isUploadingCSV ? "Processing Database..." : "Click or Drag CSV to Import"}</span>
                   <span className="text-[10px] text-zinc-500 font-medium uppercase tracking-widest">Required format: Phone Number, Full Name</span>
                 </div>
               )}

               <div className="flex justify-between items-center border-t border-white/10 pt-6 mt-2">
                 {!csvSuccess && <button onClick={completeOnboarding} className="text-xs font-bold text-zinc-400 hover:text-white transition-colors">Skip for now</button>}
                 <button onClick={completeOnboarding} className="ml-auto bg-white text-black font-extrabold text-sm px-8 py-3.5 rounded-xl shadow-[0_0_20px_rgba(255,255,255,0.2)] transition-all flex items-center gap-2 hover:-translate-y-0.5 hover:shadow-[0_0_30px_rgba(255,255,255,0.4)]">
                   Launch Command Center <Zap className="w-4 h-4" />
                 </button>
               </div>
            </div>
          )}

        </div>
      </div>
    </div>
  );
}