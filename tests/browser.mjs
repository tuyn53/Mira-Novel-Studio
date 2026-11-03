/** Proposed-protocol integration tests. No real Mira backend or model is used. */
import assert from 'node:assert/strict'
import { chromium } from 'playwright'
const base = process.env.STUDIO_URL || 'http://127.0.0.1:5180'
const options = { headless: true, ...(process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE ? { executablePath: process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE } : {}) }
const browser = await chromium.launch(options)
const errors = []
async function mount(mode = 'ready') {
  const page = await browser.newPage({ viewport: { width: 1440, height: 960 } })
  page.on('pageerror', error => errors.push(error.stack))
  await page.route('**/__test_host__', route => route.fulfill({ contentType: 'text/html', body: '<html><body style="margin:0"><iframe id="studio" sandbox="allow-scripts allow-forms" style="width:100vw;height:100vh;border:0"></iframe></body></html>' }))
  await page.goto(base + '/__test_host__')
  await page.evaluate(({ base, mode }) => {
    const id = crypto.randomUUID()
    const chapter = { id: 'chapter-1', title: '第一章', outline: '主角收到一封信。', content: '作者的原始正文。' }
    const project = { version: 1, id, title: '协议测试作品', createdAt: 1, updatedAt: 1, story: { background: '港口', characters: '', relationships: '', plot: '', writingStyle: '第三人称' }, outline: '', chapters: [chapter], knowledge: [], mindMap: { id: 'root', title: '测试', children: [] }, prompts: [], assistantMessages: [], generatedIdeas: [], optimizer: { mode: 'paragraph', iterations: 1 }, splitterSource: '' }
    const state = window.mockHost = { projects: { [id]: project }, prefs: { modelSelection: { providerId: 'mock', modelId: 'fixed-result' } }, requests: [], failSave: false, failPrefs: false, holdModel: false, modelText: '模型提出的新正文。', modelReply: null, port: null, leave: null }
    const frame = document.querySelector('iframe')
    frame.onload = () => {
      const channel = new MessageChannel()
      state.port = channel.port1
      channel.port1.onmessage = async ({ data }) => {
        if (data.type === 'mira:leave-ready') { state.leave = data; return }
        if (data.type !== 'mira:request') return
        state.requests.push(data)
        const reply = (value, error) => channel.port1.postMessage({ type: 'mira:response', id: data.id, ok: !error, ...(error ? { error: { code: 'TEST_FAILURE', message: error } } : { value }) })
        const { method, params } = data
        if (method === 'context.get') return reply({ appId: 'mira-novel-studio', theme: 'light', language: 'zh-CN', apiVersion: { major: 1, minor: 0 }, capabilities: mode === 'unsupported' ? [] : ['storage:novel-projects', 'models:text.generate'] })
        if (method === 'preferences.get') return reply(state.prefs[params.key] ?? null)
        if (method === 'preferences.set') {
          if (state.failPrefs && params.key.startsWith('project.')) return reply(null, '流程记录保存失败')
          state.prefs[params.key] = structuredClone(params.value); return reply(null)
        }
        if (method === 'novel.list') return reply(Object.values(state.projects).map(p => ({ id: p.id, title: p.title, createdAt: p.createdAt, updatedAt: p.updatedAt, chapterCount: p.chapters.length })))
        if (method === 'novel.get') return reply(state.projects[params.id] ?? null)
        if (method === 'novel.save') {
          if (state.failSave) return reply(null, '作品保存失败')
          const saved = { ...structuredClone(params.project), updatedAt: Date.now() }
          state.projects[saved.id] = saved; return reply(saved)
        }
        if (method === 'models.generateText') {
          if (state.holdModel) { state.modelReply = () => reply(state.modelText); return }
          return reply(state.modelText)
        }
        reply(null, '未知方法')
      }
      channel.port1.start()
      frame.contentWindow.postMessage({ type: 'mira:connect', grantId: 'test-grant', apiVersion: { major: 1, minor: 0 } }, '*', [channel.port2])
    }
    frame.src = base + '/'
  }, { base, mode })
  const app = page.frameLocator('#studio')
  return { page, app }
}
async function goto(app, text) { await app.getByRole('link', { name: text, exact: true }).click() }
try {
  // Browser mode permits navigation but no production mutation.
  const preview = await browser.newPage()
  await preview.goto(base + '/#/book/fog-harbor/write')
  await preview.getByRole('heading', { name: '第二章 潮水的方向' }).waitFor()
  assert.equal(await preview.getByRole('textbox', { name: '章节正文' }).count(), 0)
  assert(await preview.getByRole('button', { name: '续写本章' }).isDisabled())
  await preview.getByRole('button', { name: '专注写作' }).click()
  assert(await preview.locator('.app-sidebar').isHidden())
  await preview.getByRole('button', { name: '退出专注' }).click()
  const assistantTab = preview.getByRole('tab', { name: 'AI 伴写', exact: true })
  await assistantTab.focus()
  await assistantTab.press('ArrowRight')
  assert.equal(await preview.getByRole('tab', { name: /上下文/ }).getAttribute('tabindex'), '0')
  assert.equal(await assistantTab.getAttribute('tabindex'), '-1')
  assert(await preview.getByRole('tab', { name: /上下文/ }).evaluate(el => el === document.activeElement))
  await preview.locator('.context-block').first().waitFor()
  await preview.goto(base + '/#/book/fog-harbor/review')
  await preview.getByText('1 处修改 · 当前第 1 处').waitFor()
  assert(await preview.locator('.diff-row.changed').first().isVisible())
  assert(await preview.locator('.diff-scroll').evaluate(el => el.scrollTop) > 0)
  await preview.goto(base + '/#/new')
  assert(await preview.locator('#new-title').getAttribute('readonly') !== null)
  await preview.getByRole('button', { name: '继续浏览' }).click()
  assert(await preview.getByRole('button', { name: '创建作品' }).isDisabled())
  assert.equal(await preview.evaluate(() => localStorage.length), 0)
  await preview.close()

  // Unsupported current host must not attempt proposed methods.
  const unsupported = await mount('unsupported')
  await unsupported.app.getByRole('alert').filter({ hasText: '尚未开放小说作品存储' }).waitFor()
  assert.deepEqual(await unsupported.page.evaluate(() => window.mockHost.requests.map(r => r.method)), ['context.get'])
  await unsupported.page.close()

  const { page, app } = await mount()
  await app.getByRole('heading', { name: '我的作品' }).waitFor()
  await goto(app, '继续写作')
  const editor = app.getByRole('textbox', { name: '章节正文', exact: true })
  await editor.fill('作者编辑后的正文。')
  await app.getByText('已保存到 Mira', { exact: true }).waitFor()
  assert.equal(await page.evaluate(() => Object.values(window.mockHost.projects)[0].chapters[0].content), '作者编辑后的正文。')

  // Partial theme events must preserve granted capabilities.
  await page.evaluate(() => window.mockHost.port.postMessage({ type: 'mira:context', context: { theme: 'dark', language: 'zh-CN' } }))
  assert(await editor.isEditable())
  await page.evaluate(() => window.mockHost.port.postMessage({ type: 'mira:context', context: { theme: 'light' } }))

  // One request at a time; no leave-ready while waiting for the model.
  await page.evaluate(() => { window.mockHost.holdModel = true })
  await app.getByRole('button', { name: '润色全文' }).click()
  await app.getByText('正在生成创作建议', { exact: true }).waitFor()
  assert(await app.getByRole('button', { name: '润色全文' }).isDisabled())
  await page.evaluate(() => window.mockHost.port.postMessage({ type: 'mira:prepare-leave', id: 'leave-running' }))
  await page.waitForFunction(() => window.mockHost.leave?.id === 'leave-running')
  assert.equal(await page.evaluate(() => window.mockHost.leave.ok), false)
  await page.waitForFunction(() => typeof window.mockHost.modelReply === 'function')
  await page.evaluate(() => { window.mockHost.modelReply(); window.mockHost.holdModel = false })
  await app.getByRole('button', { name: '应用所选修改' }).waitFor()
  assert.equal(await page.evaluate(() => Object.values(window.mockHost.projects)[0].chapters[0].content), '作者编辑后的正文。')
  await app.getByRole('button', { name: '应用所选修改' }).click()
  await app.getByText('已保存到 Mira', { exact: true }).waitFor()
  assert.equal(await page.evaluate(() => Object.values(window.mockHost.projects)[0].chapters[0].content), '模型提出的新正文。')

  // Confirmed memory must survive reopening, and partial storage failure must not claim success.
  await goto(app, '正文写作')
  await page.evaluate(() => { window.mockHost.modelText = '主角收到信，决定去码头。' })
  await app.getByRole('button', { name: '定稿并整理记忆' }).click()
  await app.getByRole('button', { name: '确认记忆并定稿' }).waitFor()
  await page.evaluate(() => { window.mockHost.failPrefs = true })
  await app.getByRole('button', { name: '确认记忆并定稿' }).click()
  await app.getByRole('button', { name: '保存失败，重试' }).waitFor()
  assert.equal(await page.evaluate(() => Object.values(window.mockHost.projects)[0].knowledge.length), 1)
  await page.evaluate(() => { window.mockHost.failPrefs = false })
  await app.getByRole('button', { name: '保存失败，重试' }).click()
  await app.getByText('已保存到 Mira', { exact: true }).waitFor()
  await goto(app, '正文写作')
  assert.equal(await app.locator('.manuscript-heading .status-label').textContent(), '已定稿')

  await page.evaluate(() => { window.mockHost.failSave = true })
  await editor.fill('未保存的最新修改。')
  await app.getByRole('button', { name: '保存失败，重试' }).waitFor()
  await goto(app, '创作蓝图')
  assert(await editor.isVisible())
  assert.equal(await editor.inputValue(), '未保存的最新修改。')
  await page.evaluate(() => { window.mockHost.failSave = false })
  await app.getByRole('button', { name: '保存失败，重试' }).click()
  await app.getByText('已保存到 Mira', { exact: true }).waitFor()
  await page.evaluate(() => { window.mockHost.leave = null; window.mockHost.port.postMessage({ type: 'mira:prepare-leave', id: 'leave-saved' }) })
  await page.waitForFunction(() => window.mockHost.leave?.id === 'leave-saved')
  assert.equal(await page.evaluate(() => window.mockHost.leave.ok), true)
  await goto(app, '我的作品')
  await goto(app, '继续写作')
  assert.equal(await editor.inputValue(), '未保存的最新修改。')
  assert.equal(await app.locator('.manuscript-heading .status-label').textContent(), '草稿')
  assert.equal(await page.evaluate(() => Object.values(window.mockHost.projects)[0].knowledge.length), 1)
  assert.equal(await page.evaluate(() => window.mockHost.requests.filter(r => r.method === 'models.generateText').length), 2)
  await goto(app, '新建作品')
  await app.locator('#new-title').fill('新建协议测试')
  await app.locator('#new-premise').fill('一个新的想法')
  await app.getByRole('button', { name: '继续', exact: true }).click()
  await app.locator('#first-direction').fill('先让主角收到信')
  await app.getByRole('button', { name: '创建作品', exact: true }).click()
  await app.getByRole('heading', { name: '创作蓝图', exact: true }).waitFor()
  assert.equal(await page.evaluate(() => Object.values(window.mockHost.projects).length), 2)
  assert.equal(await page.evaluate(() => Object.values(window.mockHost.projects).find(p => p.title === '新建协议测试').chapters[0].outline), '先让主角收到信')
  await page.close()
  assert.deepEqual(errors, [])
  console.log('Browser checks passed: preview locks, missing capabilities, edit/save, theme, generation, leave guard, proposal acceptance, memory, partial failure, retry and reopen.')
} finally { await browser.close() }
