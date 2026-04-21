import {
  getCronStringFromValues,
  parseCronString,
} from '@/registry/new-york/lib/cron-builder/converter'

describe('Cron converter invariants', () => {
  it('parses incoming cron text into a normalized internal model', () => {
    expect(parseCronString('0 1 3-5 5 */2')).toEqual([
      [0],
      [1],
      [3, 4, 5],
      [5],
      [0, 2, 4, 6],
    ])

    expect(parseCronString('*/30 * * * *')).toEqual([
      [0, 30],
      [],
      [],
      [],
      [],
    ])

    expect(parseCronString('* * * * 7')).toEqual([[], [], [], [], [0]])
    expect(parseCronString('010 * * * *')).toEqual([[10], [], [], [], []])
  })

  it('serializes the internal model back to concise canonical cron strings', () => {
    expect(
      getCronStringFromValues(
        'hour',
        undefined,
        undefined,
        undefined,
        undefined,
        [10],
        false,
        undefined,
      ),
    ).toBe('10 * * * *')

    expect(
      getCronStringFromValues(
        'year',
        [1, 7],
        [1],
        [],
        [5],
        [0],
        false,
        undefined,
      ),
    ).toBe('0 5 1 */6 *')

    expect(
      getCronStringFromValues(
        'reboot',
        undefined,
        undefined,
        undefined,
        undefined,
        undefined,
        false,
        undefined,
      ),
    ).toBe('@reboot')
  })

  it('rejects malformed tokens instead of silently accepting them', () => {
    const invalidInputs = [
      '2/2/2 * * * *',
      '1,,2 * * * *',
      '0xF * * * *',
      '1-4/2crash * * * *',
    ]

    invalidInputs.forEach((value) => {
      expect(() => parseCronString(value)).toThrow()
    })
  })
})
