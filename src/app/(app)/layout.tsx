"use client";

import { useAuth } from "@/contexts/AuthContext";
import { usePathname, useRouter } from "next/navigation";
import { useEffect } from "react";
import TopNav from "@/components/TopNav";

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const isPublicPreview = pathname === "/training/cases";

  useEffect(() => {
    if (!loading && !user && !isPublicPreview) {
      router.replace("/login");
    }
  }, [user, loading, router, isPublicPreview]);

  return (
    <div className="min-h-[100dvh] bg-bg">
      <TopNav />
      <main className="flex-1">{children}</main>
    </div>
  );
}
