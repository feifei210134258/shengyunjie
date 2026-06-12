# 生产部署说明

## 当前方式

生产环境采用 Git 拉取式部署：

- GitHub 仓库：`git@github.com:feifei210134258/shengyunjie.git`
- 部署分支：`deploy/pm`
- 服务器目录：`/www/wwwroot/shengyunjie`
- PM2 应用名：`shengyunjie`
- 应用端口：`3001`
- 线上域名：`https://pm.imfly.site`

服务器目录是 Git checkout。发布时先把本地变更提交并推送到 `deploy/pm`，再在服务器执行部署脚本。

## 部署命令

```bash
cd /www/wwwroot/shengyunjie
bash scripts/deploy-production.sh
```

脚本会执行：

1. 拉取 `origin/deploy/pm`
2. `git reset --hard origin/deploy/pm`
3. 保留 `.env.local`、`node_modules`、`.deploy`、`.next`、`tmp`
4. 按 `package-lock.json` hash 决定是否运行 `npm ci`
5. 删除旧 `.next`
6. 运行 `npm run build`
7. 用 PM2 删除并重新启动 `shengyunjie`
8. 等待本机 `/training` 健康检查
9. 清理 nginx proxy/fastcgi cache 后 reload nginx
10. 运行生产训练页验证脚本

## 验证命令

```bash
BASE_URL=https://pm.imfly.site bash scripts/verify-production-training.sh
```

验证项：

- `/training` 不再返回长期 `s-maxage=31536000` HTML 缓存
- `/training` 入口指向 `/training/session`
- `/training/session` 展示新版训练页标记
- 页面不包含旧 preview 文案

## 注意事项

- 本地清理或提交不会自动部署生产。
- 不再使用历史 `tmp/*.tar.gz` 手动传包流程。
- `/training/session-ui-preview` 已作为旧 preview URL 移除，生产训练入口固定为 `/training/session`。
