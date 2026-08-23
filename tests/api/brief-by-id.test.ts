import { NextRequest } from 'next/server'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { GET } from '@/app/api/briefs/[id]/route'

function jsonResponse(body: unknown, ok = true, status = 200) {
  return { ok, status, json: async () => body } as Response
}

function call(id: string) {
  return GET(new NextRequest(`http://localhost/api/briefs/${id}`), {
    params: Promise.resolve({ id }),
  })
}

describe('GET /api/briefs/[id]', () => {
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

  it('maps script fields and joins multi-chunk rich text', async () => {
    fetchMock.mockResolvedValue(
      jsonResponse({
        id: 'page-9',
        created_time: '2026-02-02T00:00:00.000Z',
        properties: {
          'Brief Title': { title: [{ plain_text: 'One Click Away' }] },
          Client: { rich_text: [{ plain_text: 'KaryaWAN' }] },
          Script: {
            rich_text: [{ plain_text: 'Shot 1. ' }, { plain_text: 'Shot 2.' }],
          },
          'Hook Score': { number: 9 },
          'Framework Score': { number: 0 },
          'CTA Score': { number: null },
          Duration: { number: 45 },
        },
      }),
    )

    const body = await (await call('page-9')).json()

    expect(fetchMock).toHaveBeenCalledWith(
      'https://api.notion.com/v1/pages/page-9',
      expect.objectContaining({
        headers: {
          Authorization: 'Bearer test-key',
          'Notion-Version': '2022-06-28',
        },
      }),
    )
    expect(body.success).toBe(true)
    expect(body.brief).toMatchObject({
      id: 'page-9',
      briefTitle: 'One Click Away',
      client: 'KaryaWAN',
      script: 'Shot 1. Shot 2.',
      hookScore: 9,
      frameworkScore: 0,
      ctaScore: null,
      duration: '45',
      createdTime: '2026-02-02T00:00:00.000Z',
    })
  })

  it('extracts email, phone, url, date and select properties', async () => {
    fetchMock.mockResolvedValue(
      jsonResponse({
        id: 'page-10',
        created_time: 'now',
        properties: {
          Email: { email: 'elton@example.com' },
          WhatsApp: { phone_number: '+60123456789' },
          'Reference URL': { url: 'https://wan.video' },
          Deadline: { date: { start: '2026-05-15' } },
          Platform: { select: { name: 'YouTube' } },
          Status: { select: null },
          Tone: { rich_text: [] },
        },
      }),
    )

    const body = await (await call('page-10')).json()

    expect(body.brief).toMatchObject({
      email: 'elton@example.com',
      whatsapp: '+60123456789',
      referenceUrl: 'https://wan.video',
      deadline: '2026-05-15',
      platform: 'YouTube',
      status: null,
      tone: null,
    })
  })

  it('returns nulls for absent properties', async () => {
    fetchMock.mockResolvedValue(
      jsonResponse({ id: 'page-9', created_time: 'now', properties: {} }),
    )

    const body = await (await call('page-9')).json()

    expect(body.brief).toMatchObject({
      briefTitle: 'Untitled',
      client: '',
      email: null,
      hookScore: null,
      videoPrompts: null,
    })
  })

  it('returns 404 with the Notion error message', async () => {
    fetchMock.mockResolvedValue(
      jsonResponse({ message: 'Could not find page' }, false, 404),
    )

    const response = await call('missing')

    expect(response.status).toBe(404)
    await expect(response.json()).resolves.toEqual({
      success: false,
      error: 'Could not find page',
    })
  })

  it('returns 404 with a fallback message when Notion sends no message', async () => {
    fetchMock.mockResolvedValue(jsonResponse({}, false, 400))

    await expect((await call('missing')).json()).resolves.toEqual({
      success: false,
      error: 'Brief not found',
    })
  })

  it('returns 500 when the request throws', async () => {
    fetchMock.mockRejectedValue(new Error('DNS failure'))

    const response = await call('page-9')

    expect(response.status).toBe(500)
    await expect(response.json()).resolves.toEqual({
      success: false,
      error: 'DNS failure',
    })
  })
})
