import { describe, it, expect } from 'vitest'
import { TRANSITION_DURATION, ANIMATION_DURATION } from '../../../src/styles/tokens'

describe('design token constants', () => {
  it('exports TRANSITION_DURATION as 150', () => {
    expect(TRANSITION_DURATION).toBe(150)
  })

  it('exports ANIMATION_DURATION as 220', () => {
    expect(ANIMATION_DURATION).toBe(220)
  })
})
