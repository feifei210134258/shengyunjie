# 会话交接记录

> 当一个会话结束时留下的上下文快照，供下个会话（或另一个 agent）快速恢复。

## 交接摘要

**日期：** 2026-06-12
**交接人：** Codex
**接棒人：** 下一位 agent / 用户

**一句话总结：** 训练入口旧版页问题已通过 `deploy/pm` 部署到生产并完成公网只读验证；本轮正在整理工作区、删除旧前端原型和修复验证脚本可信度。

**Next Session:** 先运行 `./init.sh`，再看 `progress.md` 与 `feature_list.json`；若继续生产验证，使用 Kimi WebBridge 打开 `https://pm.imfly.site/training`，再用 Computer Use 真实鼠标点击“开始今日训练”。

## 当前状态

- **当前功能 ID：** `training-001`
- **功能状态：** `in-progress`
- **当前分支：** `deploy/pm`
- **生产部署：** 已部署到 `https://pm.imfly.site`，公网脚本返回 `VERIFY_OK https://pm.imfly.site`
- **未提交的变更：** 工作区清理、旧 preview 路由删除、验证脚本和文档更新

## 关键上下文 / Key Context

### 架构决策
- 生产训练入口固定为 `/training/session`。
- `/training/session-ui-preview` 已作为旧 preview URL 删除，不再作为别名保留。
- 生产部署采用 Git 拉取式流程：本地推 `deploy/pm`，服务器 `/www/wwwroot/shengyunjie` 执行 `bash scripts/deploy-production.sh`。
- `.agents/`、`.codex/`、`skills-lock.json` 保留为项目 agent 工作流资产。

### 尚未解决的问题
- 生产真实鼠标点击回归仍建议补做：登录后从 `/training` 点击“开始今日训练”，确认进入 `/training/session` 新版页。
- 当前不做新的生产部署；本轮仅整理仓库。

### 已知风险 / 技术债务
- `AGENTS.md` 仍写“部署：Vercel”，与当前 PM2 + nginx 生产方式不一致；本轮通过 `docs/DEPLOYMENT.md` 记录实际流程，后续可统一更新架构文档。
- `training-001` 仍标记为 `in-progress`，因为用户画像推荐闭环相关工作未完全完成。

## 待办事项

### 必须完成（阻塞后续）
1. [ ] 提交本轮清理变更。

### 建议完成（当前功能的一部分）
1. [ ] 用真实鼠标点击方式补做生产训练入口回归。

### 可推迟（但别忘了）
1. [ ] 统一 `AGENTS.md` / 设计文档里的部署描述。

## 关键文件索引

| 文件 | 最后修改 | 说明 |
|------|---------|------|
| `src/components/auth/AuthShowcase.tsx` | 2026-06-12 | `<img>` 改为 `next/image` |
| `init.sh` | 2026-06-12 | 修复 ESLint 检查计数 |
| `scripts/verify-production-training.sh` | 2026-06-12 | 移除 deleted preview route 检查 |
| `docs/DEPLOYMENT.md` | 2026-06-12 | 记录当前 Git 拉取式部署流程 |
| `progress.md` | 2026-06-12 | 更新部署状态与清理记录 |
| `feature_list.json` | 2026-06-12 | 同步训练入口和部署状态 |

## 验证状态

- [x] `node --experimental-strip-types src/lib/routes.test.mjs`
- [x] `npm run typecheck`
- [x] `ESLINT_USE_FLAT_CONFIG=false npx eslint src/ --max-warnings 0`
- [x] `npm run build`
- [x] `./init.sh`
- [x] `BASE_URL=https://pm.imfly.site bash scripts/verify-production-training.sh`

## 下个会话启动提示

```bash
pwd
cat AGENTS.md
cat progress.md
cat feature_list.json
./init.sh
git log --oneline -5
```
