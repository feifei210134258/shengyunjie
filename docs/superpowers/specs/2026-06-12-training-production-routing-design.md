# 训练入口与生产部署稳定性设计说明

## 背景

训练入口经历了旧 preview 路由、新版真实训练页、生产缓存等多次调整。6 月 12 日前后完成了训练入口真实页对齐、动态渲染防缓存、Git 拉取式生产部署脚本和旧原型清理，但缺少集中设计记录。

## 目标

- 训练入口统一进入 `/training/session`，不再依赖旧 query 参数或 preview 路由。
- `/training` 与 `/training/session` 不生成长期缓存 HTML，避免生产环境继续展示旧页面。
- 生产部署改为可重复的 Git 拉取式流程，减少手动传包和缓存残留问题。
- 清理旧静态原型、旧 preview route 和临时产物，降低维护噪音。

## 实现结果

- `src/app/(app)/training/session/page.tsx` 渲染真实训练页，并保留 `/api/train`、`/api/training/questions`、`/api/training/record`、`/api/training/feedback`、`/api/training/sessions` 等真实数据流。
- 训练相关 segment 设置动态渲染与 no-store 策略，生产响应头确认为 `private, no-cache, no-store, max-age=0, must-revalidate`。
- `scripts/deploy-production.sh` 固化生产部署：拉取 `origin/deploy/pm`、重置 worktree、按 lockfile hash 决定是否安装依赖、重新构建、PM2 重启、健康检查、清理 nginx cache。
- `scripts/verify-production-training.sh` 固化生产训练入口验证。
- `docs/DEPLOYMENT.md` 记录生产目录、分支、PM2 应用、部署命令和验证命令。
- 删除旧 `prototypes/`、`/training/session-ui-preview`、历史临时包等不再使用的产物。

## 验证与部署记录

- `node --experimental-strip-types src/lib/routes.test.mjs` 通过。
- `npm run typecheck` 通过。
- `ESLINT_USE_FLAT_CONFIG=false npx eslint src/ --max-warnings 0` 通过。
- `npm run build` 通过，路由表不再包含 `/training/session-ui-preview`。
- `./init.sh` 通过 `10/10`。
- `BASE_URL=https://pm.imfly.site bash scripts/verify-production-training.sh` 返回 `VERIFY_OK https://pm.imfly.site`。
- 生产已部署提交：`bdb5fc5 chore: wait for app health during deploy`。

## 后续注意

- 后续训练入口相关改动必须同步更新 `scripts/verify-production-training.sh`。
- 如新增需要长期缓存的静态资产，应避免影响 `/training` 和 `/training/session` 的 HTML 响应。
