## ADDED Requirements

### Requirement: AI 分析包含维度评分
系统 SHALL 在 AI 分析输出中包含对用户答案的 1-10 分评分，评分按能力维度独立计算。

#### Scenario: 用户提交答案后获得评分
- **WHEN** 用户提交答案并收到 AI 分析
- **THEN** 分析内容中包含该维度的评分（如 "【评分：8/10】"）

#### Scenario: 评分被持久化
- **WHEN** AI 分析完成
- **THEN** 评分被提取并随 `training_records` 记录保存

### Requirement: 能力雷达图展示
系统 SHALL 在训练首页展示用户各维度的能力雷达图，基于历史评分数据。

#### Scenario: 有足够数据时展示雷达图
- **WHEN** 用户在各维度均有至少1次评分记录
- **THEN** 首页显示各维度平均分的雷达图

#### Scenario: 数据不足时展示引导
- **WHEN** 用户某维度无评分记录
- **THEN** 雷达图该区域显示为0，并提示"完成更多训练以解锁完整分析"
