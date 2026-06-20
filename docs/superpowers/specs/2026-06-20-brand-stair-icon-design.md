# 升云阶品牌图标设计说明

## 背景

当前产品标志使用 `GraduationCap` 图标，视觉上偏教育/课程工具，无法准确表达“B 端产品经理能力进阶”。本次调整目标是建立一个更贴合产品名“升云阶”的品牌图标，并同步用于浏览器标签页 favicon。

## 选定方向

采用“阶梯 + 平台”方向：

- 主体是清晰的三段上升阶梯，表达从执行层到高阶能力的逐级跃迁。
- 底部平台表示能力基础和产品训练系统，不做单纯箭头或抽象增长线。
- 顶部短横表示目标层级/高阶平台，让图标更稳重，适合 B 端产品语境。
- 颜色以深青色为主色，搭配浅青色强调线，避免毕业帽、校园、泛知识付费的联想。

## 视觉约束

- 图形在 `16px` favicon 尺寸下仍应优先读出“台阶”轮廓。
- 正常导航与登录页使用完整图标：深青色圆角方底 + 白色阶梯 + 浅青强调线。
- 小尺寸 favicon 使用同一图形的简化版本，保留底座和阶梯，弱化或移除顶部强调线。
- 不再使用 `GraduationCap` 作为品牌标志。

## 实现范围

需要替换以下品牌标志位置：

- 顶部导航品牌区。
- 登录页品牌区。
- 注册页品牌区。
- Auth 展示组件中的品牌标志。
- 浏览器标签页 favicon。

建议新增一个复用组件 `BrandMark`，集中管理图形，避免不同页面各自复制 SVG 后出现风格漂移。

## 不在本次范围

- 不重新设计整套视觉系统。
- 不改数据库 schema。
- 不新增业务功能。
- 不调整训练题、训练维度或 AI prompt。

## 验证标准

- 项目中品牌标志位置不再引用 `GraduationCap`。
- 浏览器标签页能加载新的 favicon。
- TypeScript、lint、build 或项目标准启动验证通过。
- 在桌面导航、登录/注册页、小尺寸 favicon 预览中，图标都能识别为“阶梯”。

## 实现结果

- 已新增 `src/components/brand/BrandMark.tsx`，统一承载深青底、白色阶梯、浅青顶部平台线的品牌图形。
- 已新增 `src/app/icon.svg`，并通过 `src/app/layout.tsx` 的 metadata 声明为 `/icon.svg`。
- 已替换 `src/components/TopNav.tsx`、`src/app/(auth)/login/page.tsx`、`src/app/(auth)/register/page.tsx`、`src/components/auth/AuthShowcase.tsx` 中的品牌 `GraduationCap`。
- 已新增 `src/components/brand/brand-mark.test.mjs`，检查品牌位使用 `BrandMark`、不再使用 `GraduationCap`，并确认组件和 favicon 保留阶梯平台图形。
- 已将 `.superpowers/` 加入 `.gitignore`，避免视觉草案工具产物进入正式提交。

## 验证与部署记录

- 本地验证通过：`node --test src/components/brand/brand-mark.test.mjs`。
- 本地验证通过：`npx tsc --noEmit`。
- 本地验证通过：`ESLINT_USE_FLAT_CONFIG=false npx eslint src/components/brand/BrandMark.tsx src/components/TopNav.tsx 'src/app/(auth)/login/page.tsx' 'src/app/(auth)/register/page.tsx' src/components/auth/AuthShowcase.tsx src/app/layout.tsx --max-warnings 0`。
- 本地验证通过：`npm run build`，构建路由包含 `/icon.svg`。
- 标准启动验证通过：`./init.sh` 全部通过 `10/10`。
- 已提交并推送：`27eaba8 feat: replace brand icon with stair mark`。
- 已部署生产：服务器部署脚本输出 `DEPLOY_OK deploy/pm 27eaba8`。
- 生产 smoke check 通过：`https://pm.imfly.site/icon.svg` 返回 `200 image/svg+xml`，`https://pm.imfly.site/login` HTML 包含 `<link rel="icon" href="/icon.svg">`，并渲染新的阶梯标志。
