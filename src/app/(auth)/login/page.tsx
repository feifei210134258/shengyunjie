"use client";

import { useState } from "react";
import { supabase } from "@/lib/supabase";
import Link from "next/link";
import { AuthShowcase } from "@/components/auth/AuthShowcase";
import { BrandMark } from "@/components/brand/BrandMark";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ArrowRight } from "lucide-react";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

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

    const {
      data: { session },
      error: sessionError,
    } = await supabase.auth.getSession();

    if (sessionError || !session) {
      setError("登录成功但会话同步失败，请刷新后重试。");
      setIsLoading(false);
      return;
    }

    window.location.replace("/dashboard");
  };

  return (
    <div className="min-h-[100dvh] flex">
      <AuthShowcase mode="login" />

      <div className="flex flex-1 items-center justify-center bg-bg p-6 sm:p-8">
        <div className="w-full max-w-[380px] animate-fade-in">
          {/* Mobile brand */}
          <div className="lg:hidden flex items-center gap-2.5 mb-10">
            <BrandMark className="h-9 w-9" iconClassName="h-[19px] w-[19px]" />
            <span className="text-xl font-bold text-ink">升云阶</span>
          </div>

          <div className="mb-8">
            <h2 className="text-display-md font-bold text-ink">
              欢迎回来
            </h2>
            <p className="text-body-md text-ink-muted mt-2">
              登录后继续你的诊断、训练和案例拆解
            </p>
          </div>

          <form onSubmit={handleLogin} className="space-y-5">
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
              placeholder="••••••••"
              required
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
              loading={isLoading}
              icon={<ArrowRight className="w-4 h-4" />}
            >
              {isLoading ? "登录中..." : "登录"}
            </Button>
          </form>

          <p className="text-center text-body-sm text-ink-muted mt-8">
            还没有账号？{" "}
            <Link
              href="/register"
              className="text-primary font-semibold hover:underline underline-offset-2"
            >
              创建账号
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
