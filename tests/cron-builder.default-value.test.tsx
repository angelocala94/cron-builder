import { screen } from '@testing-library/dom'
import { cleanup, render } from '@testing-library/react'

import { Cron } from '@/registry/new-york/components/cron-builder'
import { type CronError } from '@/registry/new-york/lib/cron-builder/types'

function renderCron(props: React.ComponentProps<typeof Cron>) {
  const setValue = vi.fn()
  const onError = vi.fn()

  render(<Cron onError={onError} setValue={setValue} {...props} />)

  return { onError, setValue }
}

function readSurface() {
  return {
    period: screen.queryByTestId('select-period')?.textContent ?? null,
    months: screen.queryByTestId('custom-select-months')?.textContent ?? null,
    monthDays:
      screen.queryByTestId('custom-select-month-days')?.textContent ?? null,
    weekDays:
      screen.queryByTestId('custom-select-week-days')?.textContent ?? null,
    hours: screen.queryByTestId('custom-select-hours')?.textContent ?? null,
    minutes:
      screen.queryByTestId('custom-select-minutes')?.textContent ?? null,
  }
}

describe('Cron bootstrap model', () => {
  it('infers the editable schedule surface from a yearly cron', () => {
    const { onError, setValue } = renderCron({ value: '0 5 1 */6 *' })

    expect(setValue).toHaveBeenLastCalledWith('0 5 1 */6 *', {
      selectedPeriod: 'year',
    })
    expect(onError).toHaveBeenLastCalledWith(undefined)
    expect(readSurface()).toEqual({
      period: 'year',
      months: expect.stringContaining('every 6'),
      monthDays: expect.stringContaining('1'),
      weekDays: expect.stringContaining('day of the week'),
      hours: expect.stringContaining('05'),
      minutes: expect.stringContaining('00'),
    })
  })

  it('treats a weekday-only cron as a weekly schedule with wildcard placeholders', () => {
    renderCron({ value: '* * * * 1' })

    expect(readSurface()).toEqual({
      period: 'week',
      months: null,
      monthDays: null,
      weekDays: expect.stringContaining('MON'),
      hours: expect.stringContaining('every hour'),
      minutes: expect.stringContaining('every minute'),
    })
  })

  it('keeps an explicit default period when the cron is ambiguous but compatible', () => {
    const { setValue } = renderCron({
      defaultPeriod: 'week',
      value: '10 10 * * *',
    })

    expect(setValue).toHaveBeenLastCalledWith('10 10 * * *', {
      selectedPeriod: 'week',
    })
    expect(readSurface().period).toBe('week')
    expect(readSurface().weekDays).toContain('every day of the week')
  })

  it('falls back to the first compatible allowed period when the detected one is disallowed', () => {
    const { setValue } = renderCron({
      allowedPeriods: ['week', 'month', 'year'],
      value: '10 10 * * *',
    })

    expect(setValue).toHaveBeenLastCalledWith('10 10 * * *', {
      selectedPeriod: 'week',
    })
    expect(readSurface().period).toBe('week')
  })

  it('re-evaluates ambiguous schedules when defaultPeriod changes at runtime', () => {
    const setValue = vi.fn()
    const onError = vi.fn()

    const { rerender } = render(
      <Cron
        defaultPeriod='day'
        onError={onError}
        setValue={setValue}
        value='10 10 * * *'
      />,
    )

    expect(readSurface().period).toBe('day')

    rerender(
      <Cron
        defaultPeriod='week'
        onError={onError}
        setValue={setValue}
        value='10 10 * * *'
      />,
    )

    expect(readSurface().period).toBe('week')
    expect(setValue).toHaveBeenLastCalledWith('10 10 * * *', {
      selectedPeriod: 'week',
    })
  })
})

describe('Cron formatting options', () => {
  it('can present symbolic weekday labels or raw numeric ranges from the same cron', () => {
    renderCron({
      humanizeLabels: false,
      value: '* * * * MON-WED,sat',
    })

    expect(readSurface().weekDays).toContain('1-3,6')

    cleanup()

    renderCron({
      humanizeValue: true,
      value: '* * * * MON-WED,sat',
    })

    expect(readSurface().weekDays).toContain('MON-WED,SAT')
  })

  it('keeps leading zeros and 12-hour labels when requested', () => {
    renderCron({
      clockFormat: '12-hour-clock',
      leadingZero: true,
      value: '1 3,18 6,23 * *',
    })

    expect(readSurface()).toEqual({
      period: 'month',
      months: null,
      monthDays: expect.stringContaining('06,23'),
      weekDays: expect.stringContaining('day of the week'),
      hours: expect.stringContaining('03AM,06PM'),
      minutes: expect.stringContaining('01'),
    })
  })

  it('expands shortcuts and normalizes sunday aliases during bootstrap', () => {
    const monthly = renderCron({
      shortcuts: ['@monthly'],
      value: '@monthly',
    })

    expect(monthly.setValue).toHaveBeenLastCalledWith('0 0 1 * *', {
      selectedPeriod: 'month',
    })
    expect(readSurface().period).toBe('month')

    cleanup()

    renderCron({ value: '* * * * 7' })

    expect(readSurface().period).toBe('week')
    expect(readSurface().weekDays).toContain('SUN')
  })

  it('accepts keyed locale maps for weekday and month labels', () => {
    renderCron({
      humanizeValue: true,
      locale: {
        weekDaysMap: {
          sun: 'Domenica',
          mon: 'Lunedi',
          tue: 'Martedi',
          wed: 'Mercoledi',
          thu: 'Giovedi',
          fri: 'Venerdi',
          sat: 'Sabato',
        },
        monthsMap: {
          jan: 'Gennaio',
          feb: 'Febbraio',
          mar: 'Marzo',
          apr: 'Aprile',
          may: 'Maggio',
          jun: 'Giugno',
          jul: 'Luglio',
          aug: 'Agosto',
          sep: 'Settembre',
          oct: 'Ottobre',
          nov: 'Novembre',
          dec: 'Dicembre',
        },
        altWeekDaysMap: {
          sun: 'DOM',
          mon: 'LUN',
          tue: 'MAR',
          wed: 'MER',
          thu: 'GIO',
          fri: 'VEN',
          sat: 'SAB',
        },
        altMonthsMap: {
          jan: 'GEN',
          feb: 'FEB',
          mar: 'MAR',
          apr: 'APR',
          may: 'MAG',
          jun: 'GIU',
          jul: 'LUG',
          aug: 'AGO',
          sep: 'SET',
          oct: 'OTT',
          nov: 'NOV',
          dec: 'DIC',
        },
      },
      value: '0 0 * 1,2 1,2',
    })

    expect(readSurface().months).toContain('GEN-FEB')
    expect(readSurface().weekDays).toContain('LUN-MAR')
  })

  it('uses an explicit 24-hour clock default for hours and minutes', () => {
    renderCron({ value: '1 5 * * *' })

    expect(readSurface()).toEqual({
      period: 'day',
      months: null,
      monthDays: null,
      weekDays: null,
      hours: expect.stringContaining('05'),
      minutes: expect.stringContaining('01'),
    })
  })
})

describe('Cron error policy', () => {
  const defaultError: CronError = {
    description: 'Invalid cron expression',
    type: 'invalid_cron',
  }

  it('surfaces invalid input instead of trying to coerce it', () => {
    const { onError } = renderCron({ value: 'wrong value' })

    expect(onError).toHaveBeenLastCalledWith(defaultError)
    expect(readSurface().period).toBe('day')
  })

  it('honors global and per-field empty guards during initialization', () => {
    const wildcard = renderCron({
      allowEmpty: 'never',
      value: '* * * * *',
    })

    expect(wildcard.onError).toHaveBeenLastCalledWith(defaultError)

    const fieldGuard = renderCron({
      dropdownsConfig: {
        hours: { allowEmpty: 'never' },
      },
      value: '* * * * 1',
    })

    expect(fieldGuard.onError).toHaveBeenLastCalledWith(defaultError)
  })

  it('can render with every dropdown hidden while keeping the normalized cron output', () => {
    const { setValue } = renderCron({
      allowedDropdowns: [],
      value: '1 1 1 1 1',
    })

    expect(setValue).toHaveBeenLastCalledWith('1 1 1 1 1', {
      selectedPeriod: 'year',
    })
    expect(readSurface()).toEqual({
      period: null,
      months: null,
      monthDays: null,
      weekDays: null,
      hours: null,
      minutes: null,
    })
  })

  it('accepts reboot only when shortcuts support it', () => {
    renderCron({
      shortcuts: true,
      value: '@reboot',
    })

    expect(readSurface()).toEqual({
      period: 'reboot',
      months: null,
      monthDays: null,
      weekDays: null,
      hours: null,
      minutes: null,
    })
  })
})
