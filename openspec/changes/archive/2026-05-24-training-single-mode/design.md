# Design: 训练模块单题模式

## 架构决策

### 交互模式：单题流
- 页面维护 `currentIndex`（0-4）指向当前维度
- 每道题完成后可选择"下一题"或"结束训练"
- 5题完成后显示"再来一轮"，重置状态开始新一轮

### 状态管理（客户端）
```typescript
type SessionState = {
  currentIndex: number;        // 当前题号 0-4
  round: number;               // 轮次
  questions: Record<string, { text: string; loading: boolean }>;
  answers: Record<string, { text: string; submitting: boolean }>;
  analyses: Record<string, { text: string; loading: boolean }>;
}
```

### 数据流
1. 进入页面 → 生成当前维度题目（调用 `/api/train` action=generate）
2. 题目生成后 → 自动保存到 `training_sessions`（调用 `/api/training/questions`）
3. 用户答题提交 → AI 分析（调用 `/api/train` action=analyze，使用 thinking model）
4. 分析完成后 → 保存答题记录到 `training_records`（调用 `/api/training/record`）
5. 用户点击"下一题" → currentIndex++，生成下一题

### AI 分析格式
使用 `getThinkingModel`（DeepSeek v4 Flash + 深度思考），prompt 强制要求输出格式：
```markdown
## 诊断
### 核心亮点
- ...
### 思维盲区
- ...

## 建议
- ...
```

### UI 结构
- 顶部：标题 + 轮次/题号 + 结束训练按钮
- 进度条：顶部细条，显示当前进度
- 维度标签：图标 + 名称 + 重新出题按钮
- 题目卡片：Markdown 渲染
- 答题区：textarea + 提交按钮
- 分析结果：诊断卡片（红色主题）+ 建议卡片（绿色主题）
- 操作按钮：结束训练 / 下一题（或再来一轮）
