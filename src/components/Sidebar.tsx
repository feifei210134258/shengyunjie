"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";

const navItems = [
  { href: "/dashboard", label: "工作台", icon: "dashboard" },
  { href: "/diagnosis", label: "AI 诊断", icon: "psychology" },
  { href: "/training", label: "日常训练", icon: "fitness_center" },
  { href: "/bootcamp", label: "特训冲刺", icon: "rocket_launch" },
];

export default function Sidebar() {
  const pathname = usePathname();
  const { signOut } = useAuth();

  const isActive = (href: string) => pathname.startsWith(href);

  return (
    <aside className="fixed left-0 top-0 h-full w-sidebar-width bg-surface-container-low border-r border-outline-variant flex flex-col py-gutter z-50">
      {/* Brand */}
      <div className="px-6 mb-10">
        <Link href="/dashboard">
          <h1 className="font-headline-md text-headline-md font-bold text-primary">产品升云阶</h1>
          <p className="font-label-caps text-label-caps text-on-surface-variant mt-1 uppercase tracking-widest">
            专业产品经理成长平台
          </p>
        </Link>
      </div>

      {/* Nav */}
      <nav className="flex-1 space-y-1">
        {navItems.map((item) => {
          const active = isActive(item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-3 px-6 py-3 transition-all duration-200 ${
                active
                  ? "bg-secondary-container text-on-secondary-container font-label-bold rounded-r-full mr-4"
                  : "text-on-surface-variant hover:bg-surface-container-high"
              }`}
            >
              <span
                className="material-symbols-outlined"
                style={active ? { fontVariationSettings: "'FILL' 1, 'wght' 400, 'GRAD' 0, 'opsz' 24" } : undefined}
              >
                {item.icon}
              </span>
              <span className="font-body-md">{item.label}</span>
            </Link>
          );
        })}
      </nav>

      {/* Bottom */}
      <div className="mt-auto px-6 space-y-4">
        <div className="pt-6 border-t border-outline-variant space-y-1">
          <Link
            href="/settings"
            className="flex items-center gap-3 px-2 py-2 text-on-surface-variant hover:text-secondary transition-colors"
          >
            <span className="material-symbols-outlined">settings</span>
            <span className="font-body-md">设置</span>
          </Link>
          <button
            onClick={signOut}
            className="flex items-center gap-3 px-2 py-2 text-on-surface-variant hover:text-secondary transition-colors w-full text-left"
          >
            <span className="material-symbols-outlined">logout</span>
            <span className="font-body-md">退出登录</span>
          </button>
        </div>
      </div>
    </aside>
  );
}
