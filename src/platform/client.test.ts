import { describe, expect, it, vi } from 'vitest'
import { MiraClient } from './client'
function fixture() {
  const port = { postMessage: vi.fn(), close: vi.fn(), start: vi.fn(), onmessage: null as ((event: MessageEvent) => void) | null, onmessageerror: null as ((event: MessageEvent) => void) | null }
  return { port, client: new MiraClient(port), reply: (data: unknown) => port.onmessage?.({ data } as MessageEvent) }
}
describe('Mira request lifecycle', () => {
  it('correlates out of order responses and preserves stable error codes', async () => {
    const f = fixture()
    const first = f.client.request('novel.list')
    const second = f.client.request('novel.get', { id: 'x' })
    f.reply({ type: 'mira:response', id: 'studio-2', ok: true, value: 'second' })
    expect(await second).toBe('second')
    f.reply({ type: 'mira:response', id: 'studio-1', ok: false, error: { code: 'CAPABILITY_DENIED', message: '未授权' } })
    await expect(first).rejects.toMatchObject({ code: 'CAPABILITY_DENIED' })
    f.client.close()
  })
  it('rejects pending calls on disconnect', async () => {
    const f = fixture()
    const result = f.client.request('novel.save', {})
    f.client.close()
    await expect(result).rejects.toMatchObject({ code: 'CONNECTION_CLOSED' })
    expect(f.port.close).toHaveBeenCalledOnce()
  })
  it('reports timeout without claiming remote cancellation or retrying', async () => {
    vi.useFakeTimers()
    const f = fixture()
    const result = f.client.request('models.generateText', {}, 100)
    const check = expect(result).rejects.toMatchObject({ code: 'TIMEOUT' })
    await vi.advanceTimersByTimeAsync(100)
    await check
    expect(f.port.postMessage).toHaveBeenCalledOnce()
    f.client.close()
    vi.useRealTimers()
  })
})

it('answers prepare-leave with failure rather than claiming unsaved work is ready', async () => {
  const f = fixture()
  f.client.prepareLeave = async () => { throw new Error('仍在生成') }
  f.reply({ type: 'mira:prepare-leave', id: 'leave-1' })
  await vi.waitFor(() => expect(f.port.postMessage).toHaveBeenCalledWith({ type: 'mira:leave-ready', id: 'leave-1', ok: false, error: 'Error: 仍在生成' }))
  f.client.close()
})
