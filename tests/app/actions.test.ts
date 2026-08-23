import { describe, expect, it } from 'vitest'
import { submitBrief, type BriefFormData } from '@/app/actions'

function makeData(overrides: Partial<BriefFormData> = {}): BriefFormData {
  return {
    briefTitle: 'ScamGuard MY launch',
    client: 'KaryaWAN',
    platform: 'YouTube',
    duration: '45s',
    purpose: 'Awareness',
    targetAudience: 'Malaysians',
    tone: 'Urgent',
    keyMessage: 'One click away',
    videoMode: 'Wan-T2V',
    aiVideoTool: 'WAN AI',
    ...overrides,
  }
}

describe('submitBrief', () => {
  it('rejects a missing brief title', async () => {
    const result = await submitBrief(makeData({ briefTitle: '' }))
    expect(result).toEqual({
      success: false,
      error: 'Brief Title and Client are required',
    })
  })

  it('rejects a missing client', async () => {
    const result = await submitBrief(makeData({ client: '' }))
    expect(result.success).toBe(false)
    expect(result).not.toHaveProperty('notionData')
  })

  it('maps form fields onto Notion property names', async () => {
    const result = await submitBrief(makeData())

    expect(result.success).toBe(true)
    expect(result.notionData).toEqual({
      'Brief Title': 'ScamGuard MY launch',
      Client: 'KaryaWAN',
      Platform: 'YouTube',
      Duration: '45s',
      Purpose: 'Awareness',
      'Target Audience': 'Malaysians',
      Tone: 'Urgent',
      'Key Message': 'One click away',
      'Video Mode': 'Wan-T2V',
      'AI Video Tool': 'WAN AI',
      Status: 'New',
    })
  })

  it('normalises blank optional fields to null', async () => {
    const result = await submitBrief(
      makeData({ platform: '', duration: '', tone: '', aiVideoTool: '' }),
    )

    expect(result.notionData).toMatchObject({
      Platform: null,
      Duration: null,
      Tone: null,
      'AI Video Tool': null,
      Status: 'New',
    })
  })
})
