# Mira Novel Studio

AI 长篇小说创作工作台 —— Mira 宿主（[Mira-Harness](../Mira-Harness)）的 wujie 微应用，**纯渲染层**：无 Electron、无 node 运行时依赖，数据与模型能力全部经平台 API 归宿主持有。

- 设计方案：[docs/设计方案-现状对标与蓝图.md](docs/设计方案-现状对标与蓝图.md)
- 技术选型定案：[docs/技术选型-定案.md](docs/技术选型-定案.md)
- 交互原型（视觉与交互规格）：[prototype/index.html](prototype/index.html)（浏览器直接打开）

## 快速开始

```bash
npm install
npm run dev          # http://localhost:5180 —— 以 Mock 平台数据独立运行
npm run typecheck    # vue-tsc + node 配置
npm test             # vitest（领域模块）
npm run build        # 产物 dist/，相对路径，供宿主 wujie 装载
```

CI 门禁即上述三条命令（`.github/workflows/ci.yml`）。

## 目录结构

```
src/
├─ domain/            纯 TS 领域模块（无 DOM，vitest 覆盖）
│  ├─ model.ts             数据契约 v2：卷→章→场景 + 实体库 + 封面 + 快照（宿主共同契约）
│  ├─ cover.ts             封面：色板哈希 + 9 套模板封面清单（对标番茄模板封面）
│  ├─ taxonomy.ts          开书选题：频道 → 主分类 → 标签组（470 个标签全量转载番茄，数据见 taxonomy-data.ts）
│  ├─ context/             上下文组装器：分层优先级 + token 预算裁剪
│  ├─ generation/          伴写生成服务：prompt 组装（复用上下文分层）+ 多候选并行
│  ├─ review/              审阅 diff：段落级对齐（M2 审阅流基础）
│  └─ ingest/              定稿摄取提案（M3，契约先行）
├─ platform/          平台边界
│  ├─ types.ts             PlatformApi 契约（宿主 preload 注入 window.__MIRA_PLATFORM__）
│  ├─ mock.ts              Mock 实现（种子项目《提灯照河山》+ 演示范文库，脱离宿主可跑）
│  └─ wujie.ts             wujie 生命周期（零改造 + unmount 清理）
├─ stores/            Pinia：书架 / 当前作品 / 主题 / 伴写会话
├─ components/
│  ├─ write/               写作区组件：WriteEditor（Milkdown 富文本 + 纯文本）、AiPanel（多候选）
│  └─ ThemeToggle.vue
├─ router/            hash 路由：书架 → 向导 → /book/:id/:section
├─ views/             首页（活动总览 + 书架双视图）、首次引导（笔名/模型分配/欢迎）、开书向导（选题 + 封面）、工作台（写作/编排/设定/审阅）
├─ locale/zh-CN.ts    文案集中（首版仅中文）
└─ styles/            tokens.scss（书卷暖色）+ covers.scss（封面调色板）+ base.scss
```

## 与宿主的边界

| 归宿主（Mira-Harness） | 归本仓库 |
|---|---|
| SQLite v2 分表 + 迁移器 + FTS5 | 四个工作区 UI、书架、向导 |
| 模型 SSE 代理与密钥 | 上下文组装器、生成编排 |
| 平台 API 桥（preload/IPC） | prompt 组装、diff 计算 |
| wujie Shell、应用注册 | Studio 内部导航 |

新平台能力：先在 `src/platform/types.ts` 定契约（宿主实现 + Mock 同步补齐），UI 不绕过此层。

## 里程碑

M1 结构与编辑器（Milkdown、快照）→ M2 设定库与上下文引擎（审阅 diff 流）→ M3 记忆回灌与生成增强（多候选、一致性检查）→ M4 闭环（模板库、导入导出 EPUB）。详见设计方案文档 §4.8。
