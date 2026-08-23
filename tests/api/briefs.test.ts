import { NextRequest } from 'next/server'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { GET } from '@/app/api/briefs/route'

const notionPage = {
  id: 'page-1',
  created_time: '2026-01-01T00:00:00.000Z',
  properties: {
    'Brief Title': { title: [{ plain_text: 'ScamGuard MY' }] },
    Client: { rich_text: [{ plain_text: 'KaryaWAN' }] },
    'Contact Name': { rich_text: [{ plain_text: 'Elton' }] },
    Email: { email: 'elton@example.com' },
    WhatsApp: { phone_number: '+60123456789' },
    Platform: { select: { name: 'YouTube' } },
    'Reference URL': { url: 'https://wan.video' },
    Deadline: { date: { start: '2026-05-15' } },
    Status: { select: null },
  },
}

function jsonResponse(body: unknown, ok = true, status = 200) {
  return { ok, status, json: async () => body } as Response
}

function request(query: string) {
  return new NextRequest(`http://localhost/api/briefs${query}`)
}

describe('GET /api/briefs', () => {
  const fetchMock = vi.fn()

  beforeEach(() => {
    vi.stubGlobal('fetch', fetchMock)
    vi.stubEnv('NOTION_API_KEY', 'test-key')
    vi.spyOn(console, 'error').mockImplementation(() => {})
  })

  afterEach(() => {
    vi.unstubAllGlobals()
    vi.unstubAllEnvs()
    vi.restoreAllMocks()
    fetchMock.mockReset()
  })

  it('requires an email or brief id', async () => {
    const response = await GET(request(''))

    expect(response.status).toBe(400)
    await expect(response.json()).resolves.toEqual({
      success: false,
      error: 'Email or Brief ID is required',
    })
    expect(fetchMock).not.toHaveBeenCalled()
  })

  it('fetches a single page by brief id and maps every property type', async () => {
    fetchMock.mockResolvedValue(jsonResponse(notionPage))

    const response = await GET(request('?briefId=page-1'))
    const body = await response.json()

    expect(fetchMock).toHaveBeenCalledWith(
      'https://api.notion.com/v1/pages/page-1',
      expect.objectContaining({
        headers: {
          Authorization: 'Bearer test-key',
          'Notion-Version': '2022-06-28',
        },
      }),
    )
    expect(body).toEqual({
      success: true,
      briefs: [
        {
          id: 'page-1',
          briefTitle: 'ScamGuard MY',
          client: 'KaryaWAN',
          contactName: 'Elton',
          email: 'elton@example.com',
          whatsapp: '+60123456789',
          platform: 'YouTube',
          duration: null,
          budget: null,
          targetAudience: null,
          keyMessage: null,
          tone: null,
          referenceUrl: 'https://wan.video',
          deadline: '2026-05-15',
          sourceChannel: null,
          status: null,
          createdTime: '2026-01-01T00:00:00.000Z',
        },
      ],
    })
  })

  it('falls back to placeholder title and client when absent', async () => {
    fetchMock.mockResolvedValue(
      jsonResponse({ ...notionPage, properties: {} }),
    )

    const body = await (await GET(request('?briefId=page-1'))).json()

    expect(body.briefs[0]).toMatchObject({ briefTitle: 'Untitled', client: '' })
  })

  it('returns 404 when the page lookup fails', async () => {
    fetchMock.mockResolvedValue(
      jsonResponse({ message: 'Could not find page' }, false, 404),
    )

    const response = await GET(request('?briefId=missing'))

    expect(response.status).toBe(404)
    await expect(response.json()).resolves.toEqual({
      success: false,
      error: 'Could not find page',
    })
  })

  it('queries the database by email, newest first', async () => {
    fetchMock.mockResolvedValue(jsonResponse({ results: [notionPage] }))

    const response = await GET(request('?email=elton%40example.com'))
    const body = await response.json()

    const [url, init] = fetchMock.mock.calls[0]
    expect(url).toContain('/databases/')
    expect(url).toContain('/query')
    expect(init.method).toBe('POST')
    expect(JSON.parse(init.body)).toEqual({
      filter: { property: 'Email', email: { equals: 'elton@example.com' } },
      sorts: [{ timestamp: 'created_time', direction: 'descending' }],
      page_size: 50,
    })
    expect(body.success).toBe(true)
    expect(body.briefs).toHaveLength(1)
  })

  it('returns 500 when the database query fails', async () => {
    fetchMock.mockResolvedValue(jsonResponse({}, false, 502))

    const response = await GET(request('?email=elton%40example.com'))

    expect(response.status).toBe(500)
    await expect(response.json()).resolves.toEqual({
      success: false,
      error: 'Failed to fetch briefs',
    })
  })

  it('returns 500 with the thrown message when the network call rejects', async () => {
    fetchMock.mockRejectedValue(new Error('socket hang up'))

    const response = await GET(request('?email=elton%40example.com'))

    expect(response.status).toBe(500)
    await expect(response.json()).resolves.toEqual({
      success: false,
      error: 'socket hang up',
    })
  })

  it('returns a generic 500 message for non-Error rejections', async () => {
    fetchMock.mockRejectedValue('boom')

    const response = await GET(request('?email=elton%40example.com'))

    expect(response.status).toBe(500)
    await expect(response.json()).resolves.toEqual({
      success: false,
      error: 'Failed to fetch briefs',
    })
  })
})
