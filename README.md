# Mira Novel Studio

[![License: MIT](https://img.shields.io/badge/License-MIT-green.svg)](LICENSE)

面向 Mira App 的作者主导型小说创作工作台。新版采用“文学期刊编辑部”界面：鼠尾草导航、白色稿件、墨绿操作、细线分栏。作品从想法、蓝图、章节规划进入正文；AI 只提交建议，作者审阅后落稿，确认的章节摘要再服务后续创作。

**当前状态（2026-11-03）：页面与交互原型已重建；尚不能在当前 Mira 中真实创作。** Mira-Harness 当前源码已删除旧小说模块，尚未开放独立应用的作品存储与文本生成 API，也未登记 Novel Studio。Studio 内的接入适配属于待宿主实现的草案，不能等同于已安装、已接通。未修改 Mira-Harness。

## 本地浏览

Node.js 22 或更高版本。

    git clone https://github.com/tuyn53/Mira-Novel-Studio.git
    cd Mira-Novel-Studio
    npm ci
    npm run dev
    # http://127.0.0.1:5180/
    npm run dev:prototype
    # 同一个应用的 /prototype/index.html，始终强制浏览模式

本地只能浏览示例。搜索、分类、选章、查看章纲、专注阅读及审阅对比可操作；作品编辑、创建、保存、AI 生成、采纳和模型配置保存均关闭。没有 localStorage 数据库、浏览器模型代理或假保存。示例《雾港来信》《春山不必等》为界面演示内容。

## 文档

- [产品与创作流程](docs/产品与创作流程.md)：阶段、输入、输出、作者确认点和本版范围。
- [Mira 接入边界](docs/Mira接入边界.md)：当前源码事实、拟议接口、数据所有权与接入缺口。
- [开源对标](docs/开源对标.md)：四个项目的流程机制与本版取舍，固定到调研提交。
- [原型与验收](docs/原型与验收.md)：页面入口、浏览约束、验证方法和未完成的宿主验收。
- [PRODUCT.md](PRODUCT.md) / [DESIGN.md](DESIGN.md)：产品约束和已实现的视觉系统。

## 代码边界

    src/domain/       Studio v1 草案文档、上下文、提案应用、段落对比
    src/platform/     iframe MessagePort 客户端与明确标注的只读示例
    src/stores/       作品状态、串行保存、生成→提案→确认的业务流程
    src/views/        作品、开书、蓝图、规划、正文、设定、审阅、连接设置
    src/components/   应用框架、伴写面板、本地图标子集
    src/styles/       桌面布局与宿主主题适配
    prototype/        共享真实页面的强制浏览入口
    public/           草案应用清单、字体及许可证

宿主负责模型凭据、授权、持久化和执行运行时；Studio 负责小说业务、上下文和作者交互。禁止导入 Harness 内部驱动、数据库或 Agent 模块。高级检索、跨设备同步、自动连续生成、流式取消、快照历史和导出均未在本版实现。

## 检查与构建

    npm run typecheck
    npm test
    npm run build

开发服务器运行时，可另开终端执行 npm run test:browser。首次使用先运行 npx playwright install chromium；也可通过 PLAYWRIGHT_CHROMIUM_EXECUTABLE 指定本机 Chrome 路径。STUDIO_URL 可指定构建预览地址。测试宿主只存在于 tests/browser.mjs，不会打包进应用。

构建生成相对资源路径的静态页面。public/app-manifest.json 只是拟议应用包声明，不会注册宿主或赋予能力。宿主支持相应 SDK、完成白名单登记和安装器联调后，才可进行真实 Mira 验收。浏览器模拟宿主测试只能验证 Studio 逻辑，不证明 Electron、实际存储、安装或供应商模型可用。

## 许可证

项目代码采用 [MIT License](LICENSE)。随附 Noto Serif SC 字体保留 [SIL Open Font License](public/fonts/OFL.txt)，Lucide 图标保留其 [ISC 与 Feather 许可声明](public/licenses/lucide.txt)；第三方资产按各自许可分发。
