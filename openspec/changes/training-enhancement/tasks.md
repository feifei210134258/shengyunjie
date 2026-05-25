## 1. Streak 计算与 Session 闭环

- [x] 1.1 修复 `/api/training/stats` 的 streak 算法：基于 `training_sessions` 表计算跨月连续天数
- [x] 1.2 在 `/api/training/sessions` 增加 POST 接口：完成一轮后创建/更新当日 session
- [x] 1.3 修改 `src/app/(app)/training/session/page.tsx`：第5题完成后调用 session 闭环 API
- [x] 1.4 修改 `src/app/(app)/training/page.tsx`：首页 streak 显示真实数据

## 2. AI 评分体系

- [x] 2.1 修改 `/api/train` 分析 prompt：增加评分指令（要求输出 `【评分：X/10】`）
- [x] 2.2 修改 `session/page.tsx`：提交答案后从 AI 分析中提取评分并展示
- [x] 2.3 修改 `/api/training/record`：保存评分到 `training_records.score` 字段

## 3. 历史答题回顾

- [x] 3.1 新增 `/api/training/history/[id]/route.ts`：查询单条答题记录详情
- [x] 3.2 新增 `src/app/(app)/training/history/[id]/page.tsx`：历史答题详情页（题目+答案+AI分析）
- [x] 3.3 修改 `src/app/(app)/training/page.tsx`：历史记录列表添加点击跳转
- [x] 3.4 新增 `/api/training/history/route.ts`：支持按维度筛选历史记录

## 4. 能力雷达图

- [x] 4.1 修改 `/api/training/stats`：增加各维度平均分聚合查询
- [x] 4.2 安装 recharts 依赖
- [x] 4.3 修改 `src/app/(app)/training/page.tsx`：增加能力雷达图组件（数据充足时展示，不足时显示引导）

## 5. 题目质量优化

- [x] 5.1 修改 `/api/train` 生成 prompt：增加难度标注指令（`【难度：初级/中级/高级】`）
- [x] 5.2 修改 `session/page.tsx`：解析并展示难度标签
- [x] 5.3 实现题目去重逻辑：查询用户最近10题，文本相似度检查（阈值0.7），最多重试2次
- [x] 5.4 创建 `question_feedback` 表（Supabase migration）
- [x] 5.5 新增 `/api/training/feedback/route.ts`：接收并存储题目质量反馈
- [x] 5.6 修改 `session/page.tsx`：题目卡片增加点赞/踩按钮

## 6. 构建与验证

- [x] 6.1 `npm run build` 通过
- [x] 6.2 启动服务器，浏览器验证 streak 显示真实数据
- [x] 6.3 验证完成一轮后 session 正确写入
- [x] 6.4 验证历史详情页可正常访问
- [x] 6.5 验证雷达图在有/无数据时的展示
- [x] 6.6 验证题目难度标签和反馈按钮正常
