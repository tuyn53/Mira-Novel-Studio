export class PlatformError extends Error {
  constructor(readonly code: string, message: string) { super(message); this.name = 'PlatformError' }
}
export interface HostContext { appId: string; theme: 'light' | 'dark'; language: string; apiVersion: { major: number; minor: number }; capabilities: string[] }
interface Port {
  postMessage(message: unknown): void
  close(): void
  start(): void
  onmessage: ((event: MessageEvent) => void) | null
  onmessageerror: ((event: MessageEvent) => void) | null
}
export class MiraClient {
  private sequence = 0
  private pending = new Map<string, { resolve(value: unknown): void; reject(error: Error): void; timer: ReturnType<typeof setTimeout> }>()
  private closed = false
  onClose?: () => void
  onContext?: (context: Partial<HostContext>) => void
  prepareLeave?: () => Promise<void>
  constructor(private port: Port) {
    port.onmessage = event => {
      const data = event.data
      if (data?.type === 'mira:context') { this.onContext?.(data.context); return }
      if (data?.type === 'mira:prepare-leave' && typeof data.id === 'string') {
        void Promise.resolve().then(() => this.prepareLeave?.()).then(
          () => this.port.postMessage({ type: 'mira:leave-ready', id: data.id, ok: true }),
          error => this.port.postMessage({ type: 'mira:leave-ready', id: data.id, ok: false, error: String(error) }),
        )
        return
      }
      if (data?.type !== 'mira:response' || typeof data.id !== 'string') return
      const request = this.pending.get(data.id)
      if (!request) return
      clearTimeout(request.timer)
      this.pending.delete(data.id)
      if (data.ok === true) request.resolve(data.value)
      else request.reject(new PlatformError(data.error?.code ?? 'PLATFORM_ERROR', data.error?.message ?? 'Mira 请求失败，请重试。'))
    }
    port.onmessageerror = () => this.close()
    port.start()
  }
  request<T>(method: string, params?: unknown, timeoutMs = 15000): Promise<T> {
    if (this.closed) return Promise.reject(new PlatformError('CONNECTION_CLOSED', '与 Mira 的连接已关闭，请重新打开应用。'))
    const id = `studio-${++this.sequence}`
    return new Promise<T>((resolve, reject) => {
      const timer = setTimeout(() => {
        this.pending.delete(id)
        reject(new PlatformError('TIMEOUT', 'Mira 响应超时。操作结果未知，请先重新读取状态，避免重复提交。'))
      }, timeoutMs)
      this.pending.set(id, { resolve: value => resolve(value as T), reject, timer })
      try { this.port.postMessage({ type: 'mira:request', id, method, ...(params === undefined ? {} : { params }) }) }
      catch { clearTimeout(timer); this.pending.delete(id); reject(new PlatformError('CONNECTION_CLOSED', '无法连接 Mira，请重新打开应用。')) }
    })
  }
  close() {
    if (this.closed) return
    this.onClose?.()
    this.closed = true
    for (const request of this.pending.values()) {
      clearTimeout(request.timer)
      request.reject(new PlatformError('CONNECTION_CLOSED', 'Mira 连接已断开，未确认的内容仍保留在页面。'))
    }
    this.pending.clear()
    this.port.onmessage = null
    this.port.onmessageerror = null
    this.port.close()
  }
}
