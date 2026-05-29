"use client";

import { useState } from "react";
import { supabase } from "@/lib/supabase";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function RegisterPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    if (password.length < 6) {
      setError("密码至少需要 6 位");
      setLoading(false);
      return;
    }

    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { display_name: displayName },
      },
    });

    if (error) {
      setError(error.message);
      setLoading(false);
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
            <p className="text-body-sm text-on-surface-variant mt-2">创建你的账号</p>
          </div>

          <form onSubmit={handleRegister} className="space-y-5">
            <div>
              <label className="block text-label-bold text-on-surface mb-1.5">昵称</label>
              <input
                type="text"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                placeholder="你的名字"
                className="w-full px-4 py-2.5 rounded-lg border border-outline-variant bg-white text-body-md focus:border-primary focus:ring-2 focus:ring-primary/10 outline-none transition-all"
              />
            </div>

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
                placeholder="至少 6 位"
                required
                minLength={6}
                className="w-full px-4 py-2.5 rounded-lg border border-outline-variant bg-white text-body-md focus:border-primary focus:ring-2 focus:ring-primary/10 outline-none transition-all"
              />
            </div>

            {error && (
              <p className="text-body-sm text-error bg-error-container px-4 py-2 rounded-lg">{error}</p>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 bg-primary text-on-primary rounded-lg font-label-bold text-body-md hover:opacity-90 transition-all disabled:opacity-50"
            >
              {loading ? "注册中..." : "注册"}
            </button>
          </form>

          <p className="text-center text-body-sm text-on-surface-variant mt-6">
            已有账号？{" "}
            <Link href="/login" className="text-primary font-bold hover:underline">
              登录
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
