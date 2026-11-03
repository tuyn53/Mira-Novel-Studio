---
name: "Novel Studio"
description: "文学期刊编辑部：白稿居中，鼠尾草导航与墨绿操作陪伴作者推进小说。"
colors:
  green: "#1d5b4c"
  green-deep: "#16483d"
  green-soft: "#e3eee8"
  on-green: "#fff"
  gold: "#825c1d"
  rose: "#9d4d45"
  bg: "#eef1ee"
  surface: "#fff"
  surface-soft: "#f6f8f6"
  sidebar: "#e7eee8"
  ink: "#21302b"
  muted: "#586b60"
  faint: "#56695e"
  line: "#dbe3dd"
  line-strong: "#c3d0c7"
  deletion-bg: "#fff6f4"
  addition-bg: "#f1f7f2"
  dark-green: "#9bc9ae"
  dark-green-deep: "#b8e0c6"
  dark-green-soft: "#293e34"
  dark-on-green: "#14291e"
  dark-gold: "#dfb96f"
  dark-rose: "#eea09a"
  dark-bg: "#15201c"
  dark-surface: "#1d2a25"
  dark-surface-soft: "#23332c"
  dark-sidebar: "#182720"
  dark-ink: "#edf4ef"
  dark-muted: "#afbeb5"
  dark-faint: "#a3b6a9"
  dark-line: "#34483e"
  dark-line-strong: "#4b6154"
  dark-deletion-bg: "#352b29"
  dark-addition-bg: "#253b2e"
typography:
  display:
    fontFamily: "'Noto Serif SC', 'Songti SC', STSong, serif"
    fontSize: "34px"
    fontWeight: 600
    lineHeight: 1.2
    letterSpacing: "-0.025em"
  headline:
    fontFamily: "'Noto Serif SC', 'Songti SC', STSong, serif"
    fontSize: "25px"
    fontWeight: 600
    lineHeight: 1.5
    letterSpacing: "-0.025em"
  title:
    fontFamily: "'PingFang SC', 'Microsoft YaHei', sans-serif"
    fontSize: "17px"
    fontWeight: 650
    lineHeight: 1.55
  body:
    fontFamily: "'PingFang SC', 'Microsoft YaHei', sans-serif"
    fontSize: "13px"
    fontWeight: 400
    lineHeight: 1.55
  manuscript:
    fontFamily: "'Noto Serif SC', 'Songti SC', STSong, serif"
    fontSize: "17px"
    fontWeight: 400
    lineHeight: 2.2
    letterSpacing: "0.015em"
  label:
    fontFamily: "'PingFang SC', 'Microsoft YaHei', sans-serif"
    fontSize: "12px"
    fontWeight: 600
    lineHeight: 1.55
  navigation:
    fontFamily: "'PingFang SC', 'Microsoft YaHei', sans-serif"
    fontSize: "12.5px"
    fontWeight: 400
    lineHeight: 1.55
  tag:
    fontFamily: "'PingFang SC', 'Microsoft YaHei', sans-serif"
    fontSize: "10px"
    fontWeight: 400
    lineHeight: 1.55
rounded:
  flat: "0"
  tag: "4px"
  field: "5px"
  button: "6px"
  navigation: "7px"
  round: "50%"
spacing:
  compact: "4px"
  inline: "6px"
  stack: "8px"
  control: "12px"
  button-inline: "14px"
  panel: "16px"
  panel-wide: "20px"
  section: "24px"
  page: "32px"
components:
  button-primary:
    backgroundColor: "{colors.green}"
    textColor: "{colors.on-green}"
    typography: "{typography.label}"
    rounded: "{rounded.button}"
    padding: "0 14px"
  button-primary-hover:
    backgroundColor: "{colors.green-deep}"
  button-secondary:
    backgroundColor: "transparent"
    textColor: "{colors.ink}"
    typography: "{typography.label}"
    rounded: "{rounded.button}"
    padding: "0 14px"
  button-text:
    backgroundColor: "transparent"
    textColor: "{colors.green}"
    typography: "{typography.label}"
  button-icon:
    backgroundColor: "transparent"
    textColor: "{colors.muted}"
    rounded: "{rounded.button}"
    size: "30px"
  input:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.ink}"
    typography: "{typography.body}"
    rounded: "{rounded.field}"
    padding: "0 13px"
    height: "43px"
  input-readonly:
    backgroundColor: "{colors.surface-soft}"
  navigation:
    backgroundColor: "transparent"
    textColor: "{colors.muted}"
    typography: "{typography.navigation}"
    rounded: "{rounded.navigation}"
    padding: "0 11px"
  navigation-active:
    backgroundColor: "rgb(255 255 255 / 75%)"
    textColor: "{colors.green-deep}"
  tag:
    backgroundColor: "{colors.surface-soft}"
    textColor: "{colors.muted}"
    typography: "{typography.tag}"
    rounded: "{rounded.tag}"
    padding: "3px 6px"
  form-card:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.ink}"
    rounded: "{rounded.flat}"
    padding: "30px 34px"
  chapter-item:
    backgroundColor: "transparent"
    textColor: "{colors.ink}"
    rounded: "{rounded.field}"
    padding: "13px 8px"
  chapter-item-active:
    backgroundColor: "{colors.green-soft}"
  manuscript:
    backgroundColor: "transparent"
    textColor: "{colors.ink}"
    typography: "{typography.manuscript}"
    rounded: "{rounded.flat}"
    padding: "0"
---

# Design System: Novel Studio

## Overview

**Creative North Star: "文学期刊编辑部"**

Novel Studio 像一间文学期刊编辑部：鼠尾草色的作品导航留在边缘，白色稿件占据主要阅读面，墨绿承载推进动作。细线把目录、文稿与旁注分开，中文衬线赋予书名、章节及正文纸面气质，界面字负责清楚、紧凑的操作。

作品与当前章节是空间的锚点。正文、伴写建议及审阅以相邻栏位组织，专注模式收起目录与伴写栏，让同一稿件获得更多宽度。当前系统面向桌面（1280–1600px）；本地运行仅供浏览示例，Mira 尚未开放真实作品存储与文本生成 SDK，视觉状态不构成能力已接通的承诺。

本记录提取自 src/styles/studio.scss 的最终级联、AppShell、AssistantPanel 及代表页面。前置 YAML 是 token 规范；sidecar 补充元数据与独立组件片段。

**Key Characteristics:**
- 白稿为中心，导航与辅助栏退居两侧。
- 以底色与细分栏线建立层级，常规表面不使用投影。
- 书名、文稿与叙事提示使用中文衬线，操作标签使用界面字。
- 墨绿标示推进与选中，赭金和陶红标示状态及需要注意的信息。
- 浏览示例与待接入边界可见，不伪装保存或生成成功。

## Colors

配色来自灰绿纸面、鼠尾草导航与浓淡墨绿；状态颜色只承担信息区别。所有精确色值以前置 YAML 为准。

### Primary
- **墨绿（green）**：主要按钮、文字操作、焦点、选中项和完成状态。
- **深墨绿（green-deep）**：主按钮悬停、当前导航文字及品牌字。
- **淡绿衬底（green-soft）**：已选章节、筛选项、条目及连接边界提示。
- **绿上文字（on-green）**：主按钮、品牌符号与发送按钮的前景；暗色模式同步切换。

### Secondary
- **赭金（gold）**：浏览提示、写作状态与上下文截取说明。
- **陶红（rose）**：错误、危险文字操作和待审阅计数，配合明确文案。

### Neutral
- **灰绿桌面（bg）／白稿（surface）／柔纸（surface-soft）**：工作区、稿件和浅层输入或辅助底。
- **鼠尾草侧栏（sidebar）**：作品与阶段导航的稳定底色。
- **墨字（ink）／次级墨（muted）／状态墨（faint）**：正文、帮助说明和连接或路径等小文字；保留三个独立角色，不按命名推断明暗次序。
- **细线（line）／结构线（line-strong）**：栏位和列表分隔、字段与按钮边框。
- **删除底（deletion-bg）／新增底（addition-bg）**：审阅前后对照；删除底也用于错误提示。

暗色通过同名 CSS 变量覆盖；前置 dark- token 记录实装值，保持同一栏位语义。浅色导航悬停及选中使用半透明白，暗色使用独立深绿底。

**The 单一推进 Rule.** 墨绿实底用于当前内容附近的主要推进动作；次要操作使用细边框或文字。

## Typography

**Display Font:** Noto Serif SC，回退 Songti SC、STSong、serif。
**Body Font:** 界面使用 PingFang SC、Microsoft YaHei、sans-serif；小说正文使用上述衬线栈。
**Label/Mono Font:** 标签沿用界面字，没有独立等宽字体；字数、章数及保存状态使用等宽数字特性。

**Character:** 衬线体现书稿阅读感，界面字保持工具清晰。自带 Noto Serif SC 文件仅声明中等（500）与半粗（600），并使用 font-display: swap。小说正文继承常规字重请求，实际字体匹配与缺字回退由浏览器完成，不承诺存在单独的常规字重文件。

### Hierarchy
- **Display**：页面标题，使用 typography.display；开书标题局部缩小至（30px）。
- **Headline**：稿件章节标题，使用 typography.headline；书架书名另有（27px）展示样式。
- **Title**：区块标题，使用 typography.title；叙事辅助标题按上下文采用衬线（18–23px）。
- **Body**：界面正文，使用 typography.body；帮助说明常见（12px）。
- **Manuscript**：小说正文使用 typography.manuscript，默认（17px / 2.2），字号控件允许（14–22px），保留段落换行和长文本折行。
- **Label / Navigation / Tag**：分别使用对应 token；控件不使用全大写标签。

**The 双字体分工 Rule.** 书名、章节与文稿使用衬线栈；导航、按钮、状态和数字使用界面字，保留阅读与操作的区别。

## Layout

固定作品导航配合可伸缩主区。最终级联后的外栏为（200px），工作区标题栏为（57px）；方向稿中的估值不覆盖实装。普通内容页宽度为 min(1120px, calc(100% - 72px))，滚动发生在主工作区。

写作区另分章目录、文稿与伴写三栏：宽桌面使用（190px / 剩余空间 / 300px），在（1350px）及以下使用（160px / 剩余空间 / 272px）。文稿通常居中，最大宽度（680px），两侧总余量（64px）；窄桌面总余量（48px）。专注模式隐藏外导航并将内侧两栏收为零，稿件最大宽度放宽到（760px）。

资料索引为（260px）索引与主内容；审阅为（252px）提案索引和左右正文对照；蓝图为主字段和（240px）侧记。前置 spacing 记录重复使用的值，不宣称所有间距都遵循统一倍数。

现有 CSS 包含（1100px）以下的密度回退，收窄侧栏并隐藏部分辅助内容；当前交付仍为桌面（1280–1600px），不构成移动端规范。必需验收视口为（1440×960）与（1280×800）。

分栏展开使用（180ms）和 cubic-bezier(.16,1,.3,1)，导航底色与文字使用（180ms ease）。当前按钮和字段颜色即时切换，不补造过渡。prefers-reduced-motion 会关闭动画、过渡并恢复自动滚动。

## Elevation & Depth

常规工作区、稿件、卡片和表单均为平面，没有实际应用的 box-shadow。深度来自灰绿桌面、白稿、柔纸底与一像素分栏线。源码声明了未被消费的 --shadow，不把它列为既定阴影词汇；sidecar 的 shadows 因此为空。

**The 细线分栏 Rule.** 默认用相邻底色、留白与一像素边线表达结构；不把未使用的阴影变量升级为常规卡片效果。

## Shapes

稿件、主容器与对照面保持直角；控件轻微圆角。按钮、字段、导航和标签分别使用 rounded 对应角色。上下文标签是浅底细框小矩形；状态点、计数和流程序号使用圆形。书封及书脊保留出版物窄长轮廓。

线条通常为实线（1px），边框色按结构强弱分工。图标使用统一的内联描边 SVG；不以字符或 emoji 代替操作图标。书封以字排为主体，无栅格插画要求。

## Components

### Buttons

克制的操作，以填色区别主次。主次按钮轻微圆角，最小高度（36px）；主按钮墨绿底、on-green 前景，悬停深墨绿，边框沿用墨绿。次按钮透明细框，悬停柔纸底与墨绿边。文字按钮只加深文字；图标按钮（30×30px），悬停柔纸底。

键盘可见焦点为墨绿外描边（2px，偏移 3px）。禁用透明度（0.45）及禁止指针。没有独立按下变形、阴影或按钮过渡；危险文字用陶红。

### Chips

紧凑的上下文标记，柔纸底、细框和次级墨字。静态标签没有悬停、按下或焦点状态。分类与审阅筛选另用按钮，选中采用淡绿底、墨绿字。

### Cards / Containers

白面、直角、细线，常态无投影。开书表单内边距见 components.form-card。书架续写容器组合字排书封、内容与流程侧记；普通作品行以底线组织，悬停补白底。静态容器不增加点击反馈。

### Inputs / Fields

白底细框、轻微圆角；开书字段高度（43px），设置字段（40px），多行字段行高（1.85）。焦点边框改墨绿并保留可见焦点环；只读采用柔纸底，允许阅读与选择。占位文字使用次级墨；错误以陶红说明呈现，没有独立错误边框或抖动。

搜索字段使用透明底与底线，内部聚焦时底线改墨绿。小说正文输入保留无边框稿纸感，取消输入外描边；这是局部特例。

### Navigation

鼠尾草外栏组织品牌、作品、阶段及连接状态。导航最小行高（38px），默认次级墨字；悬停半透明白，当前项更实的白底与深墨绿半粗字。暗色模式使用对应深绿悬停和选中底；保留键盘焦点环。当前没有移动菜单规范。

### Chapter List

序号、衬线章名与小号状态组成目录，默认透明、悬停柔纸、选中淡绿。正文与审阅保留章节焦点。浏览模式允许选章节；写入和生成入口依赖真实宿主能力。

### Manuscript And Companion

白色正文面以衬线长段落、宽松行距、留白和细线组织。伴写与上下文紧邻稿件，以墨绿文字和底部细线标出当前标签；快捷操作为浅底细框按钮，提示、上下文标签和输入区顺序清楚。浏览正文是静态阅读面，伴写不能承诺真实生成。

### Review

提案索引与双栏校样相邻，原文和建议分别使用删除底与新增底。变更导航、逐段选择和文字状态辅助颜色。保留原文与应用修改遵循次/主按钮关系；当前采纳和保存仍为待接入方案。

## Do's and Don'ts

### Do:
- Do 保持白稿与两侧目录的主次关系，宽度变化优先交给正文。
- Do 复用 token 和宿主暗色覆盖，绿色按钮文字使用 on-green。
- Do 保留键盘焦点环、禁用透明度与只读软底。
- Do 以衬线排书名、章节和正文，以界面字排导航、控件和状态。
- Do 明确浏览示例与待接入边界，区分提案与已确认内容。

### Don't:
- Don't 把窄桌面回退描述为移动端已交付。
- Don't 将投影、渐变、漂浮卡片或统计大屏加入细线白稿体系。
- Don't 把紧凑上下文标签扩成大胶囊。
- Don't 虚构保存、模型在线、作品持久化或生成成功。
- Don't 将单个书封装饰色或未消费变量推广为全局规则。
