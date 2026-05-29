# Training UI Bug Fixes

## 问题

代码审查发现 4 个 bug：

1. **训练答题页 - 题目前缀清理失败**：`cleanText` 正则 `^(\*\*?)?\s*题目\s*[：:]?\s*(\*\*?)\s*` 匹配 `**题目：**` 时会残留孤立 `*` 字符

2. **案例详情页 - 切换视角重复请求**：`switchPerspective()` 既直接调 `loadArticle()` 又通过 `router.replace` 触发 `useEffect` 再次调用，产生重复 API 请求

3. **案例 API - product_name 大小写未归一化**：INSERT 使用 URL 参数原始值，unique constraint 大小写敏感，不同大小写可产生重复文章

4. **训练页 - 连击计算时间区 bug**：`calcStreak` 和 API 的 streak 计算使用 `toISOString()`（UTC），但 session_date 是本地日期，跨夜时 streak 计算错误。同时训练页 hero 的 `monthCount` 数据源不准。

## 根因

- 正则粗心导致的边缘情况
- 组件内状态和路由更新未协调
- API 层缺乏输入归一化
- 日期运算未考虑时区差异

## 修复目标

- 清理 AI 输出前缀时正确匹配 `**题目：**`
- 切换视角只触发一次加载
- 存储产品名时统一转为 lowercase
- streak 计算使用本地日期而非 UTC
