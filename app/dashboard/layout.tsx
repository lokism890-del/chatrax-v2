"use client"

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const router = useRouter();
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const checkSession = async () => {
      // Ask Supabase if we have a valid logged-in user
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        // NO USER? KICK THEM TO LOGIN!
        router.push('/login');
      } else {
        // Valid user! Let them see the dashboard.
        setLoading(false);
      }
    };

    checkSession();
  }, [router]);

  // Show a cool loading screen while checking the vault
  if (loading) {
    return (
      <div className="h-screen bg-[#050505] flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="h-4 w-4 rounded-full bg-orange-500 shadow-[0_0_20px_rgba(249,115,22,0.8)] animate-bounce"></div>
          <p className="text-zinc-500 font-mono text-sm tracking-widest uppercase animate-pulse">Decrypting access...</p>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}