---
version: 1
slug: "src-app-vue"
primary_target: "src/App.vue"
related_targets: ["prototype/index.html","src/views","src/styles"]
---

# 小说工作台

Mode: Operate。范围：书架、开书、蓝图、章节规划、正文、设定、审阅及宿主连接。桌面 1280–1600px；本地仅供浏览，Mira 内才启用创作。

## Direction contract

THESIS: 文学期刊编辑部。作者沿作品和章节目录工作，在稿件旁边核对建议；不以统计大屏或聊天记录作为首页主体。

OWN-WORLD: 浅鼠尾草导航、纯白稿件、墨绿主操作。细分栏线建立秩序，中文衬线只用于书名和文稿；控件使用清晰的界面字。单个主要任务占据主区域。

STORY: 用户先看到自己的作品与可继续的章节，再在蓝图、规划、写作、审阅间移动。AI 提案和已确认事实分别展示；浏览示例不显示虚假的已保存或模型在线。

FIRST VIEWPORT: 200px 作品导航，56px 工作区标题栏；写作时另有 190px 章目录与约 300px 伴写栏，剩余宽度完整交给白色稿件。主操作在相关内容右上方。书架以一部正在写的作品和简洁列表展开。

FORM: 七个原创方向为编辑台、校样桌、分镜墙、资料索引、文学期刊编辑部、创作地图、排版台。用户选择第五项；seed 0aeebc06。标志性交互为正文与审阅保留同一章节焦点；专注模式收起两侧目录，展开时正文回到原位。运动采用 180ms 分栏展开，尊重 reduced-motion。

FINISH: unreviewed and undocumented is unfinished; this build ends with the finish review, the verdict, DESIGN.md, and every shipping raster carrying its provenance

## Delivery scope

用户确认桌面创作，当前不交付移动端。必需视口为 1440×960 和 1280×800；dark.png 用于宿主暗色适配。代码驱动构建，无批准的栅格设计图或 raster 资产。截图记录在 .impeccable/review/，prototype 与 app 共用页面。
