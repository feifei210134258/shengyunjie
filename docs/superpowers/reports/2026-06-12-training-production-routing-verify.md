# 训练入口与生产部署稳定性验证报告

## 范围

覆盖 2026-06-12 前后的训练入口真实页、缓存防复发、Git 拉取式部署脚本、旧 preview/原型清理。

## 验证结果

- **结果**: PASS
- **上线分支**: `deploy/pm`
- **生产验证**: `VERIFY_OK https://pm.imfly.site`

## 本地验证

- `node --experimental-strip-types src/lib/routes.test.mjs` 通过。
- `npm run typecheck` 通过。
- `ESLINT_USE_FLAT_CONFIG=false npx eslint src/ --max-warnings 0` 通过。
- `npm run build` 通过。
- `./init.sh` 通过 `10/10`。

## 生产验证

- 生产目录 `/www/wwwroot/shengyunjie` 已按 Git 拉取式流程部署。
- `/training` 响应头确认为 no-store 动态 HTML。
- `/training` 入口指向 `/training/session`。
- `/training/session` 展示新版真实训练页标记。
- `BASE_URL=https://pm.imfly.site bash scripts/verify-production-training.sh` 返回 `VERIFY_OK https://pm.imfly.site`。

## 关联提交

- `269ed26 fix: force dynamic training routes`
- `bdb5fc5 chore: wait for app health during deploy`
- `55c3b87 chore: clean workspace and remove legacy previews`
