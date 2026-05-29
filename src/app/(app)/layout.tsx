"use client";

import { useAuth } from "@/contexts/AuthContext";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import Sidebar from "@/components/Sidebar";

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading) {
      if (!user) {
        router.replace("/login");
      }
    }
  }, [user, loading, router]);

  // 不阻塞渲染，直接显示页面
  return (
    <div className="flex min-h-screen bg-background">
      <Sidebar />
      <main className="ml-[280px] flex-1 min-h-screen">{children}</main>
    </div>
  );
}
