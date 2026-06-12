#!/usr/bin/env bash
set -euo pipefail

# ==========================================================
# 产品思维提升工具 — 初始化与验证脚本
# ==========================================================
# 用途：每个 AI agent 会话启动时运行，确认环境健康。
# 命令前带 [SKIP] 的行在环境未就绪时自动跳过。
# ==========================================================

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color
PASS=0
FAIL=0

check() {
  local desc="$1"
  shift
  if "$@" > /dev/null 2>&1; then
    echo -e "  ${GREEN}✓${NC} ${desc}"
    PASS=$((PASS + 1))
  else
    echo -e "  ${RED}✗${NC} ${desc}"
    FAIL=$((FAIL + 1))
  fi
}

echo ""
echo "=========================================="
echo "  产品思维提升工具 — 环境验证"
echo "=========================================="
echo ""

# ---- Node.js ----
echo "【Node.js 环境】"
check "Node.js 已安装" node --version
check "npm 已安装" npm --version

# ---- 依赖安装 ----
echo ""
echo "【依赖检查】"
if [ -d "node_modules" ]; then
  check "node_modules 存在" test -d node_modules
  # 验证关键依赖
  check "next 已安装" test -d node_modules/next
  check "typescript 已安装" test -d node_modules/typescript
  check "tailwindcss 已安装" test -d node_modules/tailwindcss
else
  echo -e "  ${YELLOW}[SKIP]${NC} node_modules 不存在 — 跳过依赖检查（可运行 npm install）"
fi

# ---- TypeScript ----
echo ""
echo "【类型检查】"
if [ -f "tsconfig.json" ]; then
  check "TypeScript 编译通过" npx tsc --noEmit
else
  echo -e "  ${YELLOW}[SKIP]${NC} tsconfig.json 不存在 — 跳过类型检查"
fi

# ---- 代码风格 ----
echo ""
echo "【Lint 检查】"
if [ -f ".eslintrc.json" ] || [ -f ".eslintrc.js" ] || [ -f "eslint.config.mjs" ]; then
  check "ESLint 通过" env ESLINT_USE_FLAT_CONFIG=false npx eslint src/ --max-warnings 0
else
  echo -e "  ${YELLOW}[SKIP]${NC} ESLint 配置不存在 — 跳过 lint 检查"
fi

# ---- 环境变量 ----
echo ""
echo "【环境变量】"
if [ -f ".env.local" ]; then
  check ".env.local 存在" test -f .env.local
  check "NEXT_PUBLIC_SUPABASE_URL 已设置" grep -q SUPABASE_URL .env.local 2>/dev/null || grep -q SUPABASE_URL .env 2>/dev/null || true
else
  echo -e "  ${YELLOW}[SKIP]${NC} .env.local 不存在 — 跳过环境变量检查（参考 .env.example 创建）"
fi

# ---- 构建验证 ----
echo ""
echo "【构建验证】"
if [ -f "next.config.js" ] || [ -f "next.config.ts" ] || [ -f "next.config.mjs" ]; then
  check "Next.js 构建通过" npx next build --no-lint 2>&1 | head -5
else
  echo -e "  ${YELLOW}[SKIP]${NC} next.config 不存在 — 跳过构建验证"
fi

# ---- 总结 ----
echo ""
echo "=========================================="
if [ "$FAIL" -eq 0 ]; then
  echo -e "  ${GREEN}全部通过 (${PASS}/${PASS})${NC} — 环境就绪"
  echo ""
  echo "  Next steps:"
  echo "  1. Read AGENTS.md for working rules"
  echo "  2. Read feature_list.json for current feature state"
  echo "  3. Pick ONE unfinished feature to work on"
  echo "  4. Re-run verification before claiming done"
  echo "=========================================="
  exit 0
else
  echo -e "  ${RED}${FAIL} 项失败，${PASS} 项通过${NC}"
  echo "  请修复后再开始编码。"
  echo "=========================================="
  exit 1
fi
