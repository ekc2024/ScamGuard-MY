import { describe, expect, it } from 'vitest'
import { cn } from '@/lib/utils'

describe('cn', () => {
  it('joins class names', () => {
    expect(cn('px-2', 'text-sm')).toBe('px-2 text-sm')
  })

  it('drops falsy values', () => {
    expect(cn('px-2', undefined, null, false, '')).toBe('px-2')
  })

  it('resolves conditional object and array syntax', () => {
    expect(cn(['flex', { hidden: false, 'p-2': true }])).toBe('flex p-2')
  })

  it('lets later tailwind classes win over conflicting earlier ones', () => {
    expect(cn('px-2 py-1', 'px-4')).toBe('py-1 px-4')
    expect(cn('text-red-500', 'text-blue-500')).toBe('text-blue-500')
  })

  it('returns an empty string with no input', () => {
    expect(cn()).toBe('')
  })
})
