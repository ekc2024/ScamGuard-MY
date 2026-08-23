import { NextRequest } from 'next/server'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { GET } from '@/app/api/library/route'

function jsonResponse(body: unknown, ok = true, status = 200) {
  return { ok, status, json: async () => body } as Response
}

function call(query = '') {
  return GET(new NextRequest(`http://localhost/api/library${query}`))
}

function requestBody(mock: ReturnType<typeof vi.fn>) {
  return JSON.parse(mock.mock.calls[0][1].body)
}

describe('GET /api/library', () => {
  const fetchMock = vi.fn()

  beforeEach(() => {
    vi.stubGlobal('fetch', fetchMock)
    vi.stubEnv('NOTION_API_KEY', 'test-key')
    vi.spyOn(console, 'error').mockImplementation(() => {})
    fetchMock.mockResolvedValue(jsonResponse({ results: [] }))
  })

  afterEach(() => {
    vi.unstubAllGlobals()
    vi.unstubAllEnvs()
    vi.restoreAllMocks()
    fetchMock.mockReset()
  })

  it('sends no filter when no query params are given', async () => {
    await call()

    expect(requestBody(fetchMock)).toEqual({
      sorts: [{ timestamp: 'created_time', direction: 'descending' }],
      page_size: 100,
    })
  })

  it('sends a bare condition for a single filter', async () => {
    await call('?category=Scripts')

    expect(requestBody(fetchMock).filter).toEqual({
      property: 'Category',
      select: { equals: 'Scripts' },
    })
  })

  it('combines multiple filters with `and`', async () => {
    await call('?category=Scripts&type=Hook&search=scam')

    expect(requestBody(fetchMock).filter).toEqual({
      and: [
        { property: 'Category', select: { equals: 'Scripts' } },
        { property: 'Type', select: { equals: 'Hook' } },
        { property: 'Title', title: { contains: 'scam' } },
      ],
    })
  })

  it('maps pages, falls back to Name/Description, and derives filter options', async () => {
    fetchMock.mockResolvedValue(
      jsonResponse({
        results: [
          {
            id: 'a',
            created_time: '2026-01-01T00:00:00.000Z',
            properties: {
              Title: { title: [{ plain_text: 'Scam hook' }] },
              Category: { select: { name: 'Scripts' } },
              Type: { select: { name: 'Hook' } },
              Tags: {
                multi_select: [{ name: 'scam' }, { name: '' }, { name: 'my' }],
              },
              Content: { rich_text: [{ plain_text: 'body' }] },
            },
          },
          {
            id: 'b',
            created_time: '2026-01-02T00:00:00.000Z',
            properties: {
              Name: { title: [{ plain_text: 'Named item' }] },
              Category: { select: { name: 'Scripts' } },
              Description: { rich_text: [{ plain_text: 'fallback body' }] },
            },
          },
          { id: 'c', created_time: '2026-01-03T00:00:00.000Z', properties: {} },
        ],
      }),
    )

    const body = await (await call()).json()

    expect(body.items).toEqual([
      {
        id: 'a',
        title: 'Scam hook',
        category: 'Scripts',
        type: 'Hook',
        tags: ['scam', 'my'],
        content: 'body',
        createdTime: '2026-01-01T00:00:00.000Z',
      },
      {
        id: 'b',
        title: 'Named item',
        category: 'Scripts',
        type: null,
        tags: [],
        content: 'fallback body',
        createdTime: '2026-01-02T00:00:00.000Z',
      },
      {
        id: 'c',
        title: 'Untitled',
        category: null,
        type: null,
        tags: [],
        content: null,
        createdTime: '2026-01-03T00:00:00.000Z',
      },
    ])
    expect(body.filters).toEqual({ categories: ['Scripts'], types: ['Hook'] })
  })

  it('ignores property types it cannot render as text or tags', async () => {
    fetchMock.mockResolvedValue(
      jsonResponse({
        results: [
          {
            id: 'a',
            created_time: '2026-01-01T00:00:00.000Z',
            properties: {
              Title: { title: [{ plain_text: 'Only title' }] },
              Type: { number: 3 },
              Tags: { people: [{ id: 'user-1' }] },
            },
          },
        ],
      }),
    )

    const body = await (await call()).json()

    expect(body.items[0]).toMatchObject({ type: null, tags: [] })
    expect(body.filters).toEqual({ categories: [], types: [] })
  })

  it('returns 500 when Notion rejects the query', async () => {
    fetchMock.mockResolvedValue(
      jsonResponse({ message: 'Invalid filter' }, false, 400),
    )

    const response = await call('?category=Scripts')

    expect(response.status).toBe(500)
    await expect(response.json()).resolves.toEqual({
      success: false,
      error: 'Invalid filter',
    })
  })

  it('returns 500 when the request throws', async () => {
    fetchMock.mockRejectedValue(new Error('offline'))

    const response = await call()

    expect(response.status).toBe(500)
    await expect(response.json()).resolves.toEqual({
      success: false,
      error: 'offline',
    })
  })
})
