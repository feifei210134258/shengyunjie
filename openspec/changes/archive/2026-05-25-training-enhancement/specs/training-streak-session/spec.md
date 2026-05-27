## ADDED Requirements

### Requirement: Streak 计算基于真实训练数据
系统 SHALL 根据用户 `training_sessions` 表中的历史记录计算连续训练天数（streak）。

#### Scenario: 用户连续训练3天后查看首页
- **WHEN** 用户已连续3天完成训练（`training_sessions` 表中有最近3天的记录）
- **THEN** 首页显示 "已连续训练 3 天"

#### Scenario: 用户中断训练后查看首页
- **WHEN** 用户连续训练5天后中断1天
- **THEN** 首页 streak 重置为 0

### Requirement: 训练 session 自动闭环
系统 SHALL 在用户完成一轮（5维度各1题）训练后，自动在 `training_sessions` 表中创建或更新当日记录。

#### Scenario: 用户完成第5题
- **WHEN** 用户完成第5题并收到 AI 分析
- **THEN** `training_sessions` 表中生成当日记录，包含5道题的题目文本

#### Scenario: 用户在同一天进行第二轮训练
- **WHEN** 用户当天已完成一轮，继续第二轮
- **THEN** 当日 `training_sessions` 记录追加第二轮的题目（不创建新日期记录）
