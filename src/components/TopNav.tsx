"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import { cn } from "@/lib/utils";
import {
  LayoutDashboard,
  Brain,
  Dumbbell,
  Rocket,
  Settings,
  LogOut,
  ChevronDown,
  GraduationCap,
  Menu,
  X,
} from "lucide-react";
import { useState, useRef, useEffect } from "react";

const navItems = [
  { href: "/dashboard", label: "工作台", icon: LayoutDashboard },
  { href: "/diagnosis/scale?entry=nav", label: "诊断", icon: Brain },
  { href: "/training", label: "训练", icon: Dumbbell },
  { href: "/bootcamp", label: "特训", icon: Rocket },
];

export default function TopNav() {
  const pathname = usePathname();
  const { signOut } = useAuth();
  const [menuOpen, setMenuOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const profileRef = useRef<HTMLDivElement>(null);

  const isActive = (href: string) => {
    if (href === "/dashboard") return pathname === "/dashboard" || pathname === "/";
    if (href.startsWith("/diagnosis")) return pathname.startsWith("/diagnosis");
    return pathname.startsWith(href);
  };

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (profileRef.current && !profileRef.current.contains(e.target as Node)) {
        setProfileOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  return (
    <header className="sticky top-0 z-50 border-b border-line bg-bg/86 backdrop-blur-xl">
      <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Brand */}
          <Link href="/dashboard" className="flex items-center gap-2.5 shrink-0">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary shadow-glow">
              <GraduationCap className="w-4.5 h-4.5 text-white" strokeWidth={2} />
            </div>
            <span className="hidden text-xl font-bold tracking-[-0.01em] text-ink sm:block">
              升云阶
            </span>
          </Link>

          {/* Desktop Nav */}
          <nav className="hidden md:flex items-center gap-1">
            {navItems.map((item) => {
              const active = isActive(item.href);
              const Icon = item.icon;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    "flex items-center gap-2 rounded-lg px-4 py-2 text-body-md font-medium transition-all duration-200",
                    active
                      ? "bg-primary-soft text-primary"
                      : "text-ink-muted hover:text-ink hover:bg-surface"
                  )}
                >
                  <Icon className="w-[18px] h-[18px]" strokeWidth={active ? 2 : 1.5} />
                  {item.label}
                </Link>
              );
            })}
          </nav>

          {/* Right section */}
          <div className="flex items-center gap-2">
            {/* Profile dropdown */}
            <div className="relative" ref={profileRef}>
              <button
                onClick={() => setProfileOpen(!profileOpen)}
                className="flex items-center gap-2 rounded-lg px-3 py-2 text-ink-muted transition-all hover:bg-surface hover:text-ink"
              >
                <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-gradient-to-br from-primary to-secondary">
                  <span className="text-white text-label font-semibold">PM</span>
                </div>
                <ChevronDown
                  className={cn(
                    "w-3.5 h-3.5 transition-transform hidden sm:block",
                    profileOpen && "rotate-180"
                  )}
                />
              </button>

              {profileOpen && (
                <div className="absolute right-0 top-full mt-2 w-48 animate-slide-down rounded-xl border border-line bg-surface-raised py-1.5 shadow-lg">
                  <Link
                    href="/settings"
                    onClick={() => setProfileOpen(false)}
                    className="flex items-center gap-2.5 px-4 py-2.5 text-body-md text-ink-muted hover:text-ink hover:bg-surface transition-colors"
                  >
                    <Settings className="w-4 h-4" strokeWidth={1.5} />
                    设置
                  </Link>
                  <button
                    onClick={() => {
                      setProfileOpen(false);
                      signOut();
                    }}
                    className="flex items-center gap-2.5 px-4 py-2.5 text-body-md text-ink-muted hover:text-danger hover:bg-danger-soft transition-colors w-full text-left"
                  >
                    <LogOut className="w-4 h-4" strokeWidth={1.5} />
                    退出登录
                  </button>
                </div>
              )}
            </div>

            {/* Mobile menu toggle */}
            <button
              onClick={() => setMenuOpen(!menuOpen)}
              className="rounded-lg p-2 text-ink-muted transition-colors hover:bg-surface md:hidden"
              aria-label={menuOpen ? "关闭导航" : "打开导航"}
            >
              {menuOpen ? (
                <X className="h-5 w-5" strokeWidth={1.5} />
              ) : (
                <Menu className="h-5 w-5" strokeWidth={1.5} />
              )}
            </button>
          </div>
        </div>

        {/* Mobile nav dropdown */}
        {menuOpen && (
          <nav className="md:hidden py-3 border-t border-line animate-slide-down">
            <div className="flex flex-col gap-0.5">
              {navItems.map((item) => {
                const active = isActive(item.href);
                const Icon = item.icon;
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={() => setMenuOpen(false)}
                    className={cn(
                      "flex items-center gap-3 rounded-lg px-4 py-3 text-body-md font-medium transition-all",
                      active
                        ? "bg-primary-soft text-primary"
                        : "text-ink-muted hover:bg-surface"
                    )}
                  >
                    <Icon className="w-5 h-5" strokeWidth={active ? 2 : 1.5} />
                    {item.label}
                  </Link>
                );
              })}
            </div>
          </nav>
        )}
      </div>
    </header>
  );
}
