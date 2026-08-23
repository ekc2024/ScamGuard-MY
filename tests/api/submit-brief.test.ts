import { NextRequest } from 'next/server'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { POST } from '@/app/api/submit-brief/route'

const create = vi.hoisted(() => vi.fn())

vi.mock('@notionhq/client', () => ({
  Client: class {
    pages = { create }
  },
}))

function post(body: unknown) {
  return POST(
    new NextRequest('http://localhost/api/submit-brief', {
      method: 'POST',
      body: JSON.stringify(body),
      headers: { 'Content-Type': 'application/json' },
    }),
  )
}

describe('POST /api/submit-brief', () => {
  beforeEach(() => {
    create.mockResolvedValue({ id: 'new-page' })
    vi.spyOn(console, 'error').mockImplementation(() => {})
  })

  afterEach(() => {
    create.mockReset()
    vi.restoreAllMocks()
  })

  it('rejects a payload without a brief title or client', async () => {
    const response = await post({ briefTitle: '', client: '' })

    expect(response.status).toBe(400)
    await expect(response.json()).resolves.toEqual({
      success: false,
      error: 'Brief Title and Client are required',
    })
    expect(create).not.toHaveBeenCalled()
  })

  it('creates a Notion page with only the required properties', async () => {
    const response = await post({ briefTitle: 'Launch', client: 'KaryaWAN' })

    expect(response.status).toBe(200)
    await expect(response.json()).resolves.toEqual({
      success: true,
      message: 'Brief submitted successfully',
      pageId: 'new-page',
    })

    const properties = create.mock.calls[0][0].properties
    expect(Object.keys(properties)).toEqual([
      'Brief Title',
      'Client',
      'Status',
    ])
    expect(properties['Brief Title']).toEqual({
      title: [{ text: { content: 'Launch' } }],
    })
    expect(properties.Status).toEqual({ select: { name: 'New' } })
  })

  it('maps each optional field to its Notion property shape', async () => {
    await post({
      briefTitle: 'Launch',
      client: 'KaryaWAN',
      contactName: 'Elton',
      email: 'elton@example.com',
      whatsapp: '+60123456789',
      platform: 'YouTube',
      duration: '45s',
      budget: 'RM5000',
      targetAudience: 'Malaysians',
      keyMessage: 'One click away',
      tone: 'Urgent',
      referenceUrl: 'https://wan.video',
      deadline: '2026-05-15',
      sourceChannel: 'WhatsApp',
    })

    const properties = create.mock.calls[0][0].properties
    expect(properties).toMatchObject({
      'Contact Name': { rich_text: [{ text: { content: 'Elton' } }] },
      Email: { email: 'elton@example.com' },
      WhatsApp: { phone_number: '+60123456789' },
      Platform: { select: { name: 'YouTube' } },
      Duration: { select: { name: '45s' } },
      Budget: { rich_text: [{ text: { content: 'RM5000' } }] },
      Tone: { select: { name: 'Urgent' } },
      'Reference URL': { url: 'https://wan.video' },
      Deadline: { date: { start: '2026-05-15' } },
      'Source Channel': { rich_text: [{ text: { content: 'WhatsApp' } }] },
    })
    expect(create.mock.calls[0][0].parent).toEqual({
      database_id: 'cc27f313-ae7f-49c9-b67e-eabdfc9dfea8',
    })
  })

  it('returns 500 with the Notion error message', async () => {
    create.mockRejectedValue(new Error('validation_error'))

    const response = await post({ briefTitle: 'Launch', client: 'KaryaWAN' })

    expect(response.status).toBe(500)
    await expect(response.json()).resolves.toEqual({
      success: false,
      error: 'validation_error',
    })
  })

  it('returns 500 for malformed JSON bodies', async () => {
    const response = await POST(
      new NextRequest('http://localhost/api/submit-brief', {
        method: 'POST',
        body: 'not json',
        headers: { 'Content-Type': 'application/json' },
      }),
    )

    expect(response.status).toBe(500)
    await expect(response.json()).resolves.toMatchObject({ success: false })
  })
})
