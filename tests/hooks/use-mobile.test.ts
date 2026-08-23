/**
 * @vitest-environment jsdom
 */
import { act, renderHook } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { useIsMobile } from '@/hooks/use-mobile'

type Listener = () => void

const listeners = new Set<Listener>()
const removeEventListener = vi.fn((_: string, listener: Listener) => {
  listeners.delete(listener)
})

function setWidth(width: number) {
  window.innerWidth = width
}

beforeEach(() => {
  listeners.clear()
  vi.stubGlobal(
    'matchMedia',
    vi.fn((query: string) => ({
      media: query,
      matches: window.innerWidth < 768,
      addEventListener: (_: string, listener: Listener) => {
        listeners.add(listener)
      },
      removeEventListener,
    })),
  )
})

afterEach(() => {
  vi.unstubAllGlobals()
  removeEventListener.mockClear()
  setWidth(1024)
})

describe('useIsMobile', () => {
  it('reports false on desktop widths', () => {
    setWidth(1024)
    const { result } = renderHook(() => useIsMobile())
    expect(result.current).toBe(false)
  })

  it('reports true below the 768px breakpoint', () => {
    setWidth(767)
    const { result } = renderHook(() => useIsMobile())
    expect(result.current).toBe(true)
  })

  it('treats exactly 768px as desktop', () => {
    setWidth(768)
    const { result } = renderHook(() => useIsMobile())
    expect(result.current).toBe(false)
  })

  it('updates when the media query change event fires', () => {
    setWidth(1024)
    const { result } = renderHook(() => useIsMobile())
    expect(result.current).toBe(false)

    act(() => {
      setWidth(500)
      listeners.forEach((listener) => listener())
    })

    expect(result.current).toBe(true)
  })

  it('removes its listener on unmount', () => {
    const { unmount } = renderHook(() => useIsMobile())
    unmount()
    expect(removeEventListener).toHaveBeenCalledWith(
      'change',
      expect.any(Function),
    )
  })
})
