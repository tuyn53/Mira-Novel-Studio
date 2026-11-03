import { createProject, type NovelProject, type Proposal, type WorkflowState } from '../domain/model'
import { fingerprint } from '../domain/workflow'

export function previewWorkspace(): { projects: NovelProject[]; workflow: WorkflowState } {
  const book = createProject('雾港来信', '一名替亡者投递书信的邮差，在一封寄给明天的信里，看见了自己的死讯。')
  book.id = 'fog-harbor'
  book.createdAt = 1792454400000
  book.updatedAt = 1793664000000
  book.story = {
    background: '常年被海雾包围的临海小城。旧邮局接收无法投递的信件，每封死信都通向一段未完的往事。',
    characters: '林渡，二十七岁，死信投递员。他想找到三年前失踪的妹妹，害怕自己终有一天认不出她的字迹。\n叶笙，灯塔守望者。她能听见海雾里的声音，却从不在日落后走出灯塔。',
    relationships: '林渡与叶笙因一封没有收件人的信相遇。林渡的妹妹曾在灯塔住过一夜，叶笙对此避而不谈。',
    plot: '林渡收到一封寄给明天的信，信中预告他的死亡。他必须在潮水淹没旧邮局之前，查明寄信人和妹妹的去向。',
    writingStyle: '第三人称限知，以林渡为视角。克制、细腻，悬疑感来自日常生活的微小错位。多用动作与具体物件，少解释情绪。',
  }
  book.outline = '开篇：一封无法投递的信，打破林渡重复了三年的日常。\n\n推进：信件将他引向城北灯塔，叶笙知道他妹妹的下落，却要求他先完成三次投递。\n\n转折：所谓死信并非来自过去，而是被潮汐带回的未来。\n\n终点：林渡必须在找回妹妹和保住整座小城的记忆之间作出选择。'
  book.chapters = [
    { id: 'ch-1', title: '第一章 没有地址的信', outline: '建立死信邮局与林渡的日常。雨夜收到一封信，寄信日期是明天。章末让读者看到信封上属于林渡的笔迹。', content: '临海的雨，总比天气预报来得早。\n\n林渡收起门口的信箱时，雨水已经沿着铁皮的裂缝渗了进去。箱底只躺着一封信，信封干燥得像是刚从谁的口袋里取出来。\n\n没有地址，没有邮票。收件人一栏写着他的名字。\n\n他把信翻过来。寄信日期是明天。\n\n林渡在门廊下站了很久。倒不是因为那个日期——这间邮局里什么怪事都发生过。他看的是信封左下角那个被划掉的字。\n\n那是他写错字时才会留下的痕迹。' },
    { id: 'ch-2', title: '第二章 潮水的方向', outline: '林渡循着信里的线索走向旧码头。让叶笙首次出现；通过一盏不会被雨浇灭的灯建立异常。结尾留下灯塔的邀请。', content: '天还没有亮，码头上已经有了收鱼的人。\n\n林渡沿着湿滑的石阶往下走。潮水退得比往常远，露出一排他从未见过的木桩。木头被盐水泡得发白，像一截截竖起的骨头。\n\n有人站在最末一根木桩旁边。\n\n是个穿深绿色雨衣的年轻女人，手里提着一盏旧灯。雨斜斜地打在灯罩上，里面的火苗却没有晃动。\n\n“你来早了。”她说。\n\n林渡停住脚步。他确信自己没见过她，可那个声音，像是在哪里听过。\n\n“你在等我？”\n\n女人没有回答。她低下头，望着退去的潮水。远处的灯塔闪了两下，隔着雾，像一个迟疑的句号。' },
    { id: 'ch-3', title: '第三章 灯塔守望者', outline: '进入灯塔，发现妹妹留下的生活痕迹。叶笙提出三封信的交换条件；主角第一次主动接受风险。', content: '' },
    { id: 'ch-4', title: '第四章 第一位收件人', outline: '近期规划窗口：投递给一位独居老人，信中是他尚未失去的记忆。以小事件呈现未来死信的规则。', content: '' },
    { id: 'ch-5', title: '第五章 被擦去的名字', outline: '', content: '' },
  ]
  book.knowledge = [
    { id: 'person-lin', category: '角色', title: '林渡', content: '27 岁，旧邮局的死信投递员。内敛、敏感，记得城里每条路，却找不到妹妹回家的那一条。\n\n目标：找到妹妹失踪的真相。\n顾虑：面对自己当年没有接到的最后一通电话。\n语言习惯：简短、不正面回答感情问题。', tags: ['主角', '视角人物'] },
    { id: 'person-ye', category: '角色', title: '叶笙', content: '灯塔守望者，总穿一件深绿色旧雨衣。她在等待一个很久以前就失约的人。\n\n已确认：认识林渡的妹妹。\n尚未揭示：为什么无法在日落后离开灯塔。', tags: ['关键人物'] },
    { id: 'place-post', category: '地点', title: '旧邮局', content: '码头东侧，面朝海的砖楼。后院的死信室每到涨潮时就会发出钟表声。柜台上有一只永远慢七分钟的钟。', tags: ['主要场景'] },
    { id: 'rule-letter', category: '规则', title: '死信与潮汐', content: '死信随潮汐回到过去。只能由收件人打开；邮差不能提前得知完整内容。规则必须通过投递事件逐步揭示。', tags: ['世界规则'] },
    { id: 'memory-1', category: '章节摘要', title: '第一章 没有地址的信', content: '林渡在雨夜收到寄给自己的无地址信件。寄信日期是明天；信封上的修改笔迹属于林渡本人。\n待解线索：寄信人身份、未来日期。', tags: ['source:ch-1', `fingerprint:${fingerprint(book.chapters[0]!.content)}`] },
  ]
  const suggestion = `${book.chapters[1]!.content}\n\n女人把灯往他面前送了送。林渡在玻璃上看见一个模糊的影子，不是自己的。\n\n那个人和他妹妹一样，左手戴着一根褪色的红绳。`
  const proposals: Proposal[] = [
    { id: 'review-1', chapterId: 'ch-2', target: 'content', title: '让线索落在一个具体物件上', instruction: '延续当前场景，用一个与妹妹有关的物件推动悬念。', baseText: book.chapters[1]!.content, text: suggestion, sourceHash: fingerprint(book.chapters[1]!.content), createdAt: book.updatedAt, status: 'pending' },
    { id: 'review-2', chapterId: 'ch-3', target: 'outline', title: '细化灯塔内的冲突', instruction: '补全当前章的目标、障碍和结尾悬念。', baseText: book.chapters[2]!.outline, text: '目标：林渡要确认妹妹是否来过灯塔。\n障碍：叶笙拒绝回答，并试图把他赶走。\n转折：楼上传来妹妹习惯哼的旋律，林渡绕过叶笙冲上台阶。\n结尾：房间里空无一人，桌上却有一杯刚倒好的热茶。', sourceHash: fingerprint(''), createdAt: book.updatedAt, status: 'pending' },
  ]
  const second = createProject('春山不必等', '离开城市的园艺师，在外婆留下的花圃里重新学习如何与人告别。')
  second.id = 'spring-mountain'
  second.updatedAt = book.updatedAt - 86400000
  return { projects: [book, second], workflow: { version: 1, receipts: { 'ch-1': fingerprint(book.chapters[0]!.content) }, proposals } }
}
