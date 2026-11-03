import { MiraClient, PlatformError, type HostContext } from './client'

export const isPrototype = document.documentElement.hasAttribute('data-prototype')
export const isPreview = window.parent === window || isPrototype
let client: MiraClient | undefined
let contextHandler: ((context: Partial<HostContext>) => void) | undefined
let resolveConnection: (client: MiraClient) => void
const connection = new Promise<MiraClient>(resolve => { resolveConnection = resolve })
window.addEventListener('message', event => {
  if (isPreview || client || event.source !== window.parent || event.data?.type !== 'mira:connect' || event.ports.length !== 1) return
  if (event.data.apiVersion?.major !== 1 || typeof event.data.grantId !== 'string') return
  client = new MiraClient(event.ports[0])
  client.onContext = context => contextHandler?.(context)
  resolveConnection(client)
})
window.addEventListener('pagehide', () => client?.close(), { once: true })
export async function connectToMira() {
  if (isPreview) throw new PlatformError('PREVIEW_ONLY', '此页面仅供浏览，请在 Mira App 中使用创作功能。')
  let timer: ReturnType<typeof setTimeout>
  try {
    return await Promise.race([connection, new Promise<never>((_, reject) => {
      timer = setTimeout(() => reject(new PlatformError('CONNECTION_TIMEOUT', '尚未连接 Mira，请从 Mira 应用入口重新打开。')), 8000)
    })])
  } finally { clearTimeout(timer!) }
}
export function onHostContext(handler: (context: Partial<HostContext>) => void) { contextHandler = handler }
