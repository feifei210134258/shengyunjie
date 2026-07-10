"use client";

import { BrandMark } from "@/components/brand/BrandMark";
import { useAuth } from "@/contexts/AuthContext";
import { cn } from "@/lib/utils";
import {
  BriefcaseBusiness,
  ChevronDown,
  Dumbbell,
  House,
  LogOut,
  Menu,
  Radar,
  Settings,
  X,
} from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";

const navItems = [
  { href: "/dashboard", label: "今日", icon: House },
  { href: "/training", label: "训练复盘", icon: Dumbbell },
  { href: "/bootcamp", label: "面试证据", icon: BriefcaseBusiness },
  { href: "/diagnosis/scale?entry=nav", label: "能力画像", icon: Radar },
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
    function handleClick(event: MouseEvent) {
      if (profileRef.current && !profileRef.current.contains(event.target as Node)) {
        setProfileOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  const navigation = (mobile = false) => (
    <nav className={cn("grid gap-1", mobile && "py-2")} aria-label="产品导航">
      {navItems.map((item) => {
        const active = isActive(item.href);
        const Icon = item.icon;
        return (
          <Link
            key={item.href}
            href={item.href}
            onClick={() => mobile && setMenuOpen(false)}
            className={cn(
              "group flex min-h-11 items-center gap-3 rounded-md px-3 text-body-sm font-semibold outline-none transition-colors duration-200 focus-visible:ring-2 focus-visible:ring-primary/25",
              active
                ? "bg-primary-soft text-primary"
                : "text-ink-muted hover:bg-surface hover:text-ink"
            )}
          >
            <Icon className="h-[18px] w-[18px]" strokeWidth={active ? 2 : 1.6} />
            <span>{item.label}</span>
          </Link>
        );
      })}
    </nav>
  );

  return (
    <>
      <aside className="sticky top-0 hidden h-[100dvh] w-[208px] shrink-0 border-r border-line bg-surface-raised md:flex md:flex-col">
        <Link
          href="/dashboard"
          className="flex h-[72px] items-center gap-3 border-b border-line px-5 outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-primary/25"
        >
          <BrandMark className="h-8 w-8 rounded-md" iconClassName="h-[18px] w-[18px]" />
          <span className="text-heading-sm font-bold text-ink">升云阶</span>
        </Link>

        <div className="flex-1 px-3 py-5">{navigation()}</div>

        <div className="border-t border-line p-3" ref={profileRef}>
          <Link
            href="/settings"
            className="mb-1 flex min-h-10 items-center gap-3 rounded-md px-3 text-body-sm font-semibold text-ink-muted transition-colors hover:bg-surface hover:text-ink focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/25"
          >
            <Settings className="h-[18px] w-[18px]" strokeWidth={1.6} />
            设置
          </Link>
          <button
            onClick={() => setProfileOpen((open) => !open)}
            className="flex min-h-12 w-full items-center gap-3 rounded-md px-3 text-left text-body-sm font-semibold text-ink outline-none transition-colors hover:bg-surface focus-visible:ring-2 focus-visible:ring-primary/25"
            aria-expanded={profileOpen}
          >
            <span className="flex h-8 w-8 items-center justify-center rounded-md bg-primary text-label font-bold text-white">
              PM
            </span>
            <span className="min-w-0 flex-1 truncate">产品经理</span>
            <ChevronDown
              className={cn("h-4 w-4 text-ink-faint transition-transform", profileOpen && "rotate-180")}
              strokeWidth={1.6}
            />
          </button>
          {profileOpen && (
            <button
              onClick={() => {
                setProfileOpen(false);
                signOut();
              }}
              className="mt-1 flex min-h-10 w-full items-center gap-3 rounded-md px-3 text-body-sm font-semibold text-ink-muted transition-colors hover:bg-danger-soft hover:text-danger focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-danger/20"
            >
              <LogOut className="h-[18px] w-[18px]" strokeWidth={1.6} />
              退出登录
            </button>
          )}
        </div>
      </aside>

      <header className="sticky top-0 z-50 border-b border-line bg-surface-raised/95 backdrop-blur md:hidden">
        <div className="flex h-14 items-center justify-between px-4">
          <Link href="/dashboard" className="flex items-center gap-2.5">
            <BrandMark className="h-8 w-8 rounded-md" iconClassName="h-[18px] w-[18px]" />
            <span className="text-heading-sm font-bold text-ink">升云阶</span>
          </Link>
          <button
            onClick={() => setMenuOpen((open) => !open)}
            className="rounded-md p-2 text-ink-muted outline-none transition-colors hover:bg-surface hover:text-ink focus-visible:ring-2 focus-visible:ring-primary/25"
            aria-label={menuOpen ? "关闭导航" : "打开导航"}
            aria-expanded={menuOpen}
          >
            {menuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>
        {menuOpen && (
          <div className="border-t border-line px-3 pb-3">
            {navigation(true)}
            <div className="mt-2 grid grid-cols-2 gap-2 border-t border-line pt-3">
              <Link
                href="/settings"
                onClick={() => setMenuOpen(false)}
                className="flex min-h-10 items-center justify-center gap-2 rounded-md bg-surface text-body-sm font-semibold text-ink-muted"
              >
                <Settings className="h-4 w-4" />
                设置
              </Link>
              <button
                onClick={() => {
                  setMenuOpen(false);
                  signOut();
                }}
                className="flex min-h-10 items-center justify-center gap-2 rounded-md bg-surface text-body-sm font-semibold text-ink-muted"
              >
                <LogOut className="h-4 w-4" />
                退出
              </button>
            </div>
          </div>
        )}
      </header>
    </>
  );
}
