"use client";

import { useState } from "react";
import { supabase } from "@/lib/supabase";
import Link from "next/link";
import { AuthShowcase } from "@/components/auth/AuthShowcase";
import { BrandMark } from "@/components/brand/BrandMark";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ArrowRight } from "lucide-react";

export default function RegisterPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

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

    window.location.assign(`/diagnosis/scale?entry=register&t=${Date.now()}`);
  };

  return (
    <div className="min-h-[100dvh] flex">
      <AuthShowcase mode="register" />

      <div className="flex flex-1 items-center justify-center bg-bg p-6 sm:p-8">
        <div className="w-full max-w-[380px] animate-fade-in">
          <div className="lg:hidden flex items-center gap-2.5 mb-10">
            <BrandMark className="h-9 w-9" iconClassName="h-[19px] w-[19px]" />
            <span className="text-xl font-bold text-ink">升云阶</span>
          </div>

          <div className="mb-8">
            <h2 className="text-display-md font-bold text-ink">
              创建账号
            </h2>
            <p className="text-body-md text-ink-muted mt-2">
              先建立能力画像，再开始针对性训练
            </p>
          </div>

          <form onSubmit={handleRegister} className="space-y-5">
            <Input
              label="昵称"
              type="text"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              placeholder="你的名字"
            />

            <Input
              label="邮箱"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="your@email.com"
              required
            />

            <Input
              label="密码"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="至少 6 位"
              required
              minLength={6}
            />

            {error && (
              <div className="px-4 py-2.5 rounded-xl bg-danger-soft text-body-sm text-danger">
                {error}
              </div>
            )}

            <Button
              type="submit"
              fullWidth
              size="lg"
              loading={loading}
              icon={<ArrowRight className="w-4 h-4" />}
            >
              {loading ? "注册中..." : "开始成长之旅"}
            </Button>
          </form>

          <p className="text-center text-body-sm text-ink-muted mt-8">
            已有账号？{" "}
            <Link
              href="/login"
              className="text-primary font-semibold hover:underline underline-offset-2"
            >
              登录
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
