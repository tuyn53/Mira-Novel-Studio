# Mira 接入边界

核对日期：2026-11-03。宿主基线：同级 Mira-Harness，本轮最后核对提交 d57a713000dcf309a96ca61bd2b32dbff1f78440。已核对应用清单、请求桥、iframe 框架与 SDK 草案；该提交相对前次核对的 c6ee08e 在应用清单、请求桥与 SDK 草案上没有差异，以下边界不变。本任务未改动任何 Harness 文件。本文以所见源码为事实，文档草案不能替代实现。

## 1. 当前源码事实

- src/config/firstPartyApps.ts 当前只登记 mira-harness，能力白名单只有 harness:workbench；Novel Studio 未登记。
- src/pages/frontend/microAppHost/FirstPartyFrame.vue 使用 sandbox iframe 和转移的 MessagePort 建立第一方连接。
- src/platform/firstPartyBridge.ts 提供 context.get、应用命名空间内 preferences.get/set 等通用能力。
- 旧小说模块已经撤下；当前 bridge 没有 models.generateText、novel.list/get/save，能力白名单也不包含它们的授权项。
- docs/MIRA_FIRST_PARTY_SDK_CONTRACT.md 已明确这些是未来接入草案。宿主模型、驱动、Agent 和工作流内部能力不能被 Studio 直接调用；harness.* 有专属应用身份检查。

因此：当前只能交付 Studio 原型、领域逻辑及待接入适配，不能宣称现在可在 Mira 安装并创作。

## 2. 所有权

| Studio | Mira |
| --- | --- |
| 小说业务文档、创作步骤、提示词与上下文组装 | 应用登记、安装、可信来源、权限与 grant |
| 编辑器、作品与章节导航、提案审阅 | 模型凭据、供应商调用及模型目录 |
| 草稿/计划/记忆的区别与版本校验 | 受控持久化、事务、迁移和存储生命周期 |
| 页面内短时状态和失败提示 | 长任务运行、取消、重连恢复和跨实例冲突规则 |

Studio 不包含独立后端、数据库、API key 输入、直接 fetch 供应商接口或 Node/Electron 桥；不导入 Mira 内部框架。只有 adapter 可以发送宿主方法请求。

## 3. 已对齐的传输

父窗发送 mira:connect，携带 grantId、apiVersion 和唯一 MessagePort。Studio 仅接受 window.parent 的握手。顶级浏览器页面与 prototype/index.html 强制进入只读示例，不等待宿主，也不发模型/存储请求。

端口请求形状：{ type: 'mira:request', id, method, params? }。
响应形状：{ type: 'mira:response', id, ok, value? , error?: { code, message } }。
主题通过 mira:context 更新；离开使用 mira:prepare-leave / mira:leave-ready。Studio 会先保存，有未完成生成或保存失败时拒绝准备完成；实际是否阻止离开仍需宿主验收。

握手等待 8 秒、普通请求默认 15 秒、拟议模型请求 180 秒。超时只说明结果未知，不代表远端取消，不会自动重发模型请求。没有流式输出、远端取消或断点恢复的承诺。

## 4. Studio 拟议适配（尚非现有宿主 API）

| 方法 | Studio 参数/期望结果 | 仍需宿主确认 |
| --- | --- | --- |
| context.get | appId、apiVersion、capabilities、theme | 应用身份和能力登记 |
| models.generateText | role、prompt、selection:{providerId,modelId}；完整文本 | 角色取值、模型目录、长度/费用限制、超时、取消 |
| novel.list | 作品摘要数组 | 数据库/权限/排序规则 |
| novel.get | {id}；版本化作品文档 | 格式校验、迁移与旧作品导入 |
| novel.save | {project}；保存后的作品文档 | 事务写入、并发冲突、版本返回及容量限制 |
| preferences.get/set | 模型选择、project.<id>.workflow | 大文本提案是否应改为专属存储 |

当前 preferences.set 源码限制 JSON 长度 262144 字符。Studio 用 250000 字符预检并提供清理已处理提案；这不是长期稿件仓库的设计。宿主应优先评估专用提案存储，而不是无限扩大偏好字段。

## 5. 数据草案与失败语义

src/domain/model.ts 的 version:1 是 Studio 当前草案，沿用旧文档可表达的 story、outline、chapters、knowledge 等字段，保留未使用字段以避免读取后无意丢弃。**不是当前宿主已承诺的存储格式**。本轮未进行旧数据库导入或迁移。

- novel.save 和 preferences.set 是两次调用，不具备跨方法原子性。作品已写入而流程记录失败时，页面保留 dirty/error，不能显示已全部保存。
- 正文提案在 baseText 相同或内容已等于目标稿时可以应用，后一种情况允许部分写入后的幂等恢复。
- 若当前正文超出上下文预算，Studio 拒绝生成定稿记忆，避免用截断正文确认整章。
- 记忆用提案 ID 去重，附来源章节和正文指纹。指纹只用于本地内容变化判断，不是安全校验、服务端并发版本或审计证明。
- 浏览器刷新或进程退出前没有本地生产持久化兜底；真实耐久性由未来宿主存储与离开握手保障。单页失联保留的内容并不等于可跨重启恢复。
- 尚无多窗口写入协调。正式接入应增加宿主 revision/冲突响应，而不是让最后一次保存覆盖他人修改。

## 6. 接入前置清单

1. Mira 决定并登记 Novel Studio 独立应用与 capability，不借用 harness:workbench。
2. 明确模型目录/选择、文本调用、作品文档、提案存储、容量及并发契约。
3. 在宿主实现授权与受控持久化，Studio 再按最终接口调整 adapter；不得绕过边界直连数据库。
4. 校验 app-manifest.json 与最终安装器 schema、版本范围、资源路径及包摘要。
5. 在真实 Mira 完成安装、授权、保存重开、模型生成、失败与离开验收；分别记录桌面平台结果。

public/app-manifest.json 仅表达拟议包入口和所需能力，不证明宿主已经支持这些能力。此轮没有改动宿主，也没有接入真实模型。
