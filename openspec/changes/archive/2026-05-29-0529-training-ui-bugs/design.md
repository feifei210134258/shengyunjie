# 修复方案

## Bug 1: 题目前缀清理 regex
- 文件：`src/app/(app)/training/session/page.tsx`
- 修复：简化正则，统一匹配 `**题目：**`、`**题目：`、`题目：` 等变体
- 方案：使用更宽松的 `replace` 链，先清 `**` 再清 `题目：` 前缀

## Bug 2: 切换视角重复请求
- 文件：`src/app/(app)/training/cases/[product]/page.tsx`
- 修复：`switchPerspective` 中只保留 `router.replace`，移除直接调 `loadArticle`，让 `useEffect` 统一处理加载

## Bug 3: product_name 大小写归一化
- 文件：`src/app/api/cases/route.ts`
- 修复：从 URL 参数读取 `productName` 后立即 `toLowerCase()`，保证所有匹配和存储用统一大小写

## Bug 4: 训练页连击/天数数据不准确
- 文件：`src/app/(app)/training/page.tsx` + `/api/training/sessions/route.ts`
- 修复： 
  - 训练页 hero 改用 `stats.streak`（API 端的连续训练天数），而非 `monthCount`（仅 session 记录）
  - 移除 `calcStreak` 死代码
  - API 端 streak 计算修正时区处理
