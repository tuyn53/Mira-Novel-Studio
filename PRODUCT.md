# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Users

使用 Mira App 创作中文小说的作者。作者负责故事方向、正文取舍和最终确认，AI 辅助规划、起草、审阅及整理记忆。

## Product Purpose

提供作者主导的小说创作工作台，让作品从想法、规划、正文、审阅持续推进，并让前章确认的事实能够服务后章。

## Positioning

Mira 的专业小说应用。小说领域流程与页面由 Novel Studio 实现；模型、凭据、持久化及执行底层依托 Mira App。

## Operating Context

推荐在 Mira App 内安装使用。GitHub clone 后本地启动仅可浏览界面和示例，不提供编辑、保存、生成或独立模型配置。

## Capabilities and Constraints

- 当前以桌面工作区为目标，保留 Vue 3、TypeScript 和 Vite 技术基础。
- 重建历史文档、交互原型及页面，旧文档不再作为事实来源。
- 宿主能力以 Mira-Harness 当前检出的源代码为依据，必须区分内部实现和向子应用开放的接口。
- 子应用不持有 API key，不直接访问 Electron、宿主数据库、Node 或驱动内部模块。
- 作者主导：AI 结果先供审阅，确认后应用；事实提案与已确认记忆分开。
- 截至 2026-11-03，Mira-Harness 已移除旧小说模块，当前并未开放小说存储或文本生成 SDK。Studio 的 v1 文档及方法是待接入草案；模型目录、流式取消和长任务同样不能虚构已接通。

## Evidence on Hand

Mira-Harness 同级仓库的当前源码可读；实际桌面、安装包、Windows 和供应商模型调用仍需各自验证。页面中的小说及进度数据为明确标注的浏览示例。

## Product Principles

- 写作正文始终是工作台的中心。
- 流程帮助作者推进，也允许回到前面修改。
- 计划、草稿与已确认事实不得混为一谈。
- 不把浏览示例表现成真实运行或持久化成功。
- 产品职责与宿主执行职责通过显式接口隔开。
