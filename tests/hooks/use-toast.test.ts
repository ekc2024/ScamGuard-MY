/**
 * @vitest-environment jsdom
 */
import { act, renderHook } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

type ToastModule = typeof import('@/hooks/use-toast')

let mod: ToastModule

beforeEach(async () => {
  vi.resetModules()
  vi.useFakeTimers()
  mod = await import('@/hooks/use-toast')
})

afterEach(() => {
  vi.useRealTimers()
})

describe('reducer', () => {
  const toast = { id: '1', title: 'first', open: true }

  it('adds a toast and honours the single-toast limit', () => {
    const withOne = mod.reducer({ toasts: [] }, { type: 'ADD_TOAST', toast })
    expect(withOne.toasts).toEqual([toast])

    const withTwo = mod.reducer(withOne, {
      type: 'ADD_TOAST',
      toast: { id: '2', title: 'second', open: true },
    })
    expect(withTwo.toasts).toHaveLength(1)
    expect(withTwo.toasts[0].id).toBe('2')
  })

  it('updates only the matching toast', () => {
    const state = { toasts: [toast, { id: '2', title: 'second' }] }

    const next = mod.reducer(state, {
      type: 'UPDATE_TOAST',
      toast: { id: '2', title: 'renamed' },
    })

    expect(next.toasts).toEqual([toast, { id: '2', title: 'renamed' }])
  })

  it('closes a single toast on dismiss', () => {
    const state = { toasts: [toast, { id: '2', open: true }] }

    const next = mod.reducer(state, { type: 'DISMISS_TOAST', toastId: '1' })

    expect(next.toasts[0].open).toBe(false)
    expect(next.toasts[1].open).toBe(true)
  })

  it('closes every toast when dismissed without an id', () => {
    const state = { toasts: [toast, { id: '2', open: true }] }

    const next = mod.reducer(state, { type: 'DISMISS_TOAST' })

    expect(next.toasts.every((t) => t.open === false)).toBe(true)
  })

  it('removes one toast by id and all toasts without an id', () => {
    const state = { toasts: [toast, { id: '2' }] }

    expect(
      mod.reducer(state, { type: 'REMOVE_TOAST', toastId: '1' }).toasts,
    ).toEqual([{ id: '2' }])
    expect(mod.reducer(state, { type: 'REMOVE_TOAST' }).toasts).toEqual([])
  })
})

describe('toast', () => {
  it('exposes the created toast through useToast', () => {
    const { result } = renderHook(() => mod.useToast())

    act(() => {
      mod.toast({ title: 'Scam detected' })
    })

    expect(result.current.toasts).toHaveLength(1)
    expect(result.current.toasts[0]).toMatchObject({
      title: 'Scam detected',
      open: true,
    })
  })

  it('generates a distinct id per toast', () => {
    const first = mod.toast({ title: 'a' })
    const second = mod.toast({ title: 'b' })

    expect(first.id).not.toBe(second.id)
  })

  it('updates a live toast through the returned handle', () => {
    const { result } = renderHook(() => mod.useToast())

    let handle!: ReturnType<ToastModule['toast']>
    act(() => {
      handle = mod.toast({ title: 'before' })
    })
    act(() => {
      handle.update({ id: handle.id, title: 'after' })
    })

    expect(result.current.toasts[0].title).toBe('after')
  })

  it('closes then removes a dismissed toast after the remove delay', () => {
    const { result } = renderHook(() => mod.useToast())

    let handle!: ReturnType<ToastModule['toast']>
    act(() => {
      handle = mod.toast({ title: 'bye' })
    })
    act(() => {
      handle.dismiss()
    })

    expect(result.current.toasts[0].open).toBe(false)

    act(() => {
      vi.advanceTimersByTime(1_000_000)
    })

    expect(result.current.toasts).toHaveLength(0)
  })

  it('dismisses via onOpenChange(false)', () => {
    const { result } = renderHook(() => mod.useToast())

    act(() => {
      mod.toast({ title: 'closable' })
    })
    act(() => {
      result.current.toasts[0].onOpenChange?.(false)
    })

    expect(result.current.toasts[0].open).toBe(false)
  })

  it('leaves the toast open on onOpenChange(true)', () => {
    const { result } = renderHook(() => mod.useToast())

    act(() => {
      mod.toast({ title: 'still open' })
    })
    act(() => {
      result.current.toasts[0].onOpenChange?.(true)
    })

    expect(result.current.toasts[0].open).toBe(true)
  })

  it('dismisses all toasts from the hook helper', () => {
    const { result } = renderHook(() => mod.useToast())

    act(() => {
      mod.toast({ title: 'one' })
    })
    act(() => {
      result.current.dismiss()
    })

    expect(result.current.toasts[0].open).toBe(false)
  })

  it('stops notifying after unmount', () => {
    const { result, unmount } = renderHook(() => mod.useToast())
    const before = result.current.toasts
    unmount()

    act(() => {
      mod.toast({ title: 'after unmount' })
    })

    expect(result.current.toasts).toBe(before)
  })
})
