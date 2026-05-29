"use client";

import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/contexts/AuthContext";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();
  const { user } = useAuth();

  useEffect(() => {
    if (user) router.push("/diagnosis/scale");
  }, [user, router]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setIsLoading(true);

    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      setError(error.message);
      setIsLoading(false);
      return;
    }

    router.push("/diagnosis/scale");
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="w-full max-w-sm mx-auto">
        <div className="bg-surface-container-lowest border border-outline-variant rounded-xl p-8 shadow-sm">
          <div className="text-center mb-8">
            <h1 className="text-headline-lg font-bold text-primary">产品升云阶</h1>
            <p className="text-body-sm text-on-surface-variant mt-2">B 端产品经理成长平台</p>
          </div>

          <form onSubmit={handleLogin} className="space-y-5">
            <div>
              <label className="block text-label-bold text-on-surface mb-1.5">邮箱</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="your@email.com"
                required
                className="w-full px-4 py-2.5 rounded-lg border border-outline-variant bg-white text-body-md focus:border-primary focus:ring-2 focus:ring-primary/10 outline-none transition-all"
              />
            </div>

            <div>
              <label className="block text-label-bold text-on-surface mb-1.5">密码</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                required
                className="w-full px-4 py-2.5 rounded-lg border border-outline-variant bg-white text-body-md focus:border-primary focus:ring-2 focus:ring-primary/10 outline-none transition-all"
              />
            </div>

            {error && (
              <p className="text-body-sm text-error bg-error-container px-4 py-2 rounded-lg">{error}</p>
            )}

            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-3 bg-primary text-on-primary rounded-lg font-label-bold text-body-md hover:opacity-90 transition-all disabled:opacity-50"
            >
              {isLoading ? "登录中..." : "登录"}
            </button>
          </form>

          <p className="text-center text-body-sm text-on-surface-variant mt-6">
            还没有账号？{" "}
            <Link href="/register" className="text-primary font-bold hover:underline">
              注册
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
