import { type MutableRefObject } from 'react'

import { DEFAULT_LOCALE_EN } from '@/registry/new-york/lib/cron-builder/locale'
import {
  type AllowEmpty,
  type ClockFormat,
  type ConverterParts,
  type DropdownConfig,
  type DropdownsConfig,
  type LeadingZero,
  type Locale,
  type OnError,
  type PeriodType,
  type SetInternalError,
  type SetValueNumbersOrUndefined,
  type SetValuePeriod,
  type ShortcutsValues,
  type Shortcuts,
  type Unit,
} from '@/registry/new-york/lib/cron-builder/types'

const SUPPORTED_SHORTCUTS: ShortcutsValues[] = [
  {
    name: '@yearly',
    value: '0 0 1 1 *',
  },
  {
    name: '@annually',
    value: '0 0 1 1 *',
  },
  {
    name: '@monthly',
    value: '0 0 1 * *',
  },
  {
    name: '@weekly',
    value: '0 0 * * 0',
  },
  {
    name: '@daily',
    value: '0 0 * * *',
  },
  {
    name: '@midnight',
    value: '0 0 * * *',
  },
  {
    name: '@hourly',
    value: '0 * * * *',
  },
]

export const UNITS: Unit[] = [
  {
    type: 'minutes',
    min: 0,
    max: 59,
    total: 60,
  },
  {
    type: 'hours',
    min: 0,
    max: 23,
    total: 24,
  },
  {
    type: 'month-days',
    min: 1,
    max: 31,
    total: 31,
  },
  {
    type: 'months',
    min: 1,
    max: 12,
    total: 12,
    alt: [
      'JAN',
      'FEB',
      'MAR',
      'APR',
      'MAY',
      'JUN',
      'JUL',
      'AUG',
      'SEP',
      'OCT',
      'NOV',
      'DEC',
    ],
  },
  {
    type: 'week-days',
    min: 0,
    max: 6,
    total: 7,
    alt: ['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'],
  },
]

export function setValuesFromCronString(
  cronString: string,
  setInternalError: SetInternalError,
  onError: OnError,
  allowEmpty: AllowEmpty,
  internalValueRef: MutableRefObject<string>,
  firstRender: boolean,
  locale: Locale,
  shortcuts: Shortcuts,
  setMinutes: SetValueNumbersOrUndefined,
  setHours: SetValueNumbersOrUndefined,
  setMonthDays: SetValueNumbersOrUndefined,
  setMonths: SetValueNumbersOrUndefined,
  setWeekDays: SetValueNumbersOrUndefined,
  setPeriod: SetValuePeriod,
  defaultPeriod?: PeriodType,
  allowedPeriods?: PeriodType[],
  dropdownsConfig?: DropdownsConfig,
) {
  if (onError) {
    onError(undefined)
  }

  setInternalError(false)
  let error = false

  if (!cronString) {
    if (
      allowEmpty === 'always' ||
      (firstRender && allowEmpty === 'for-default-value')
    ) {
      return
    }

    error = true
  }

  if (!error) {
    if (
      shortcuts &&
      (shortcuts === true || shortcuts.includes(cronString as never))
    ) {
      if (cronString === '@reboot') {
        setPeriod('reboot')
        return
      }

      const shortcut = SUPPORTED_SHORTCUTS.find(
        (supportedShortcut) => supportedShortcut.name === cronString,
      )

      if (shortcut) {
        cronString = shortcut.value
      }
    }

    try {
      const cronParts = parseCronString(cronString)
      const detectedPeriod = getPeriodFromCronParts(
        cronParts,
        defaultPeriod,
        allowedPeriods,
      )

      setPeriod(detectedPeriod)
      setMinutes(cronParts[0])
      setHours(cronParts[1])
      setMonthDays(cronParts[2])
      setMonths(cronParts[3])
      setWeekDays(cronParts[4])

      const allEmpty = cronParts.every((part) => part.length === 0)
      if (
        allEmpty &&
        (allowEmpty === 'never' ||
          (!firstRender && allowEmpty === 'for-default-value'))
      ) {
        error = true
      }

      if (!error) {
        error = hasDropdownAllowEmptyError(
          cronParts,
          detectedPeriod,
          firstRender,
          dropdownsConfig,
        )
      }
    } catch {
      error = true
    }
  }

  if (error) {
    internalValueRef.current = cronString
    setInternalError(true)
    setError(onError, locale)
  }
}

export function hasDropdownAllowEmptyError(
  cronParts: ConverterParts,
  period: PeriodType,
  allowForDefaultValue: boolean,
  dropdownsConfig?: DropdownsConfig,
) {
  if (!dropdownsConfig || period === 'reboot') {
    return false
  }

  const fields: {
    key: 'minutes' | 'hours' | 'month-days' | 'months' | 'week-days'
    index: number
    isActive: boolean
  }[] = [
    { key: 'minutes', index: 0, isActive: period !== 'minute' },
    {
      key: 'hours',
      index: 1,
      isActive: period !== 'minute' && period !== 'hour',
    },
    {
      key: 'month-days',
      index: 2,
      isActive: period === 'year' || period === 'month',
    },
    { key: 'months', index: 3, isActive: period === 'year' },
    {
      key: 'week-days',
      index: 4,
      isActive: period === 'year' || period === 'month' || period === 'week',
    },
  ]

  return fields.some(({ key, index, isActive }) => {
    if (!isActive) {
      return false
    }

    const fieldAllowEmpty = dropdownsConfig[key]?.allowEmpty

    if (!fieldAllowEmpty || cronParts[index].length !== 0) {
      return false
    }

    return (
      fieldAllowEmpty === 'never' ||
      (fieldAllowEmpty === 'for-default-value' && !allowForDefaultValue)
    )
  })
}

export function getCronStringFromValues(
  period: PeriodType,
  months: number[] | undefined,
  monthDays: number[] | undefined,
  weekDays: number[] | undefined,
  hours: number[] | undefined,
  minutes: number[] | undefined,
  humanizeValue: boolean | undefined,
  dropdownsConfig: DropdownsConfig | undefined,
) {
  if (period === 'reboot') {
    return '@reboot'
  }

  const parsedArray = parseCronArray(
    [
      period !== 'minute' && minutes ? minutes : [],
      period !== 'minute' && period !== 'hour' && hours ? hours : [],
      (period === 'year' || period === 'month') && monthDays ? monthDays : [],
      period === 'year' && months ? months : [],
      (period === 'year' || period === 'month' || period === 'week') &&
      weekDays
        ? weekDays
        : [],
    ] as ConverterParts,
    humanizeValue,
    dropdownsConfig,
  )

  return cronToString(parsedArray)
}

export function partToString(
  cronPart: number[],
  unit: Unit,
  humanize?: boolean,
  leadingZero?: LeadingZero,
  clockFormat?: ClockFormat,
) {
  if (isFull(cronPart, unit) || cronPart.length === 0) {
    return '*'
  }

  const step = getStep(cronPart)

  if (step && isInterval(cronPart, step)) {
    if (isFullInterval(cronPart, unit, step)) {
      return `*/${step}`
    }

    return `${formatValue(
      getMin(cronPart),
      unit,
      humanize,
      leadingZero,
      clockFormat,
    )}-${formatValue(
      getMax(cronPart),
      unit,
      humanize,
      leadingZero,
      clockFormat,
    )}/${step}`
  }

  if (
    cronPart.length === 2 &&
    cronPart[1] - cronPart[0] > 1 &&
    isFullInterval(cronPart, unit, cronPart[1] - cronPart[0])
  ) {
    return `*/${cronPart[1] - cronPart[0]}`
  }

  return toRanges(cronPart)
    .map((part) => {
      if (Array.isArray(part)) {
        return `${formatValue(
          part[0],
          unit,
          humanize,
          leadingZero,
          clockFormat,
        )}-${formatValue(part[1], unit, humanize, leadingZero, clockFormat)}`
      }

      return formatValue(part, unit, humanize, leadingZero, clockFormat)
    })
    .join(',')
}

export function formatValue(
  value: number,
  unit: Unit,
  humanize?: boolean,
  leadingZero?: LeadingZero,
  clockFormat?: ClockFormat,
) {
  let cronPartString = value.toString()
  const { type, alt, min } = unit
  const needLeadingZero =
    leadingZero &&
    (leadingZero === true ||
      (Array.isArray(leadingZero) &&
        leadingZero.includes(type as 'month-days' | 'hours' | 'minutes')))
  const need24HourClock =
    clockFormat === '24-hour-clock' && (type === 'hours' || type === 'minutes')

  if ((humanize && type === 'week-days') || (humanize && type === 'months')) {
    cronPartString = alt![value - min]
  } else if (value < 10 && (needLeadingZero || need24HourClock)) {
    cronPartString = cronPartString.padStart(2, '0')
  }

  if (type === 'hours' && clockFormat === '12-hour-clock') {
    const suffix = value >= 12 ? 'PM' : 'AM'
    let hour: number | string = value % 12 || 12

    if (hour < 10 && needLeadingZero) {
      hour = hour.toString().padStart(2, '0')
    }

    cronPartString = `${hour}${suffix}`
  }

  return cronPartString
}

export function parsePartArray(arr: number[], unit: Unit) {
  const values = sort(dedup(fixSunday(arr, unit)))

  if (values.length === 0) {
    return values
  }

  const outOfRangeValue = outOfRange(values, unit)

  if (typeof outOfRangeValue !== 'undefined') {
    throw new Error(`Value "${outOfRangeValue}" out of range for ${unit.type}`)
  }

  return values
}

function parseCronArray(
  cronArr: ConverterParts,
  humanizeValue: boolean | undefined,
  dropdownsConfig: DropdownsConfig | undefined,
) {
  return cronArr.map((partArr, index) => {
    const unit = UNITS[index]
    const parsedArray = parsePartArray(partArr, unit)
    const dropdownOption: DropdownConfig | undefined =
      dropdownsConfig?.[unit.type]

    return partToString(
      parsedArray,
      unit,
      dropdownOption?.humanizeValue ?? humanizeValue,
    )
  })
}

function cronToString(parts: string[]) {
  return parts.join(' ')
}

const PERIOD_ORDER: PeriodType[] = [
  'minute',
  'hour',
  'day',
  'week',
  'month',
  'year',
]

function getPeriodRank(period: PeriodType) {
  const rank = PERIOD_ORDER.indexOf(period)
  return rank === -1 ? -1 : rank
}

function getPeriodFromCronParts(
  cronParts: ConverterParts,
  defaultPeriod?: PeriodType,
  allowedPeriods?: PeriodType[],
): PeriodType {
  let minPeriod: PeriodType

  if (cronParts[3].length > 0) {
    minPeriod = 'year'
  } else if (cronParts[2].length > 0) {
    minPeriod = 'month'
  } else if (cronParts[4].length > 0) {
    minPeriod = 'week'
  } else if (cronParts[1].length > 0) {
    minPeriod = 'day'
  } else if (cronParts[0].length > 0) {
    minPeriod = 'hour'
  } else {
    minPeriod = 'minute'
  }

  const minRank = getPeriodRank(minPeriod)

  if (defaultPeriod) {
    const defaultRank = getPeriodRank(defaultPeriod)

    if (
      defaultRank >= minRank &&
      (!allowedPeriods || allowedPeriods.includes(defaultPeriod))
    ) {
      return defaultPeriod
    }
  }

  if (allowedPeriods) {
    for (let index = minRank; index < PERIOD_ORDER.length; index += 1) {
      if (allowedPeriods.includes(PERIOD_ORDER[index])) {
        return PERIOD_ORDER[index]
      }
    }
  } else {
    return minPeriod
  }

  return minPeriod
}

export function parseCronString(str: string): ConverterParts {
  if (typeof str !== 'string') {
    throw new Error('Invalid cron string')
  }

  const parts = str.replace(/\s+/g, ' ').trim().split(' ')

  if (parts.length !== 5) {
    throw new Error('Invalid cron string format')
  }

  return parts.map((part, index) => {
    return parsePartString(part, UNITS[index])
  }) as ConverterParts
}

function parsePartString(str: string, unit: Unit) {
  if (str === '*' || str === '*/1') {
    return []
  }

  const values = sort(
    dedup(
      fixSunday(
        replaceAlternatives(str, unit.min, unit.alt)
          .split(',')
          .map((value) => {
            const valueParts = value.split('/')

            if (valueParts.length > 2) {
              throw new Error(`Invalid value "${str}" for "${unit.type}"`)
            }

            const left = valueParts[0]
            const right = valueParts[1]
            const parsedValues =
              left === '*' ? range(unit.min, unit.max) : parseRange(left, str, unit)

            return applyInterval(parsedValues, parseStep(right, unit))
          })
          .flat(),
        unit,
      ),
    ),
  )

  const outOfRangeValue = outOfRange(values, unit)

  if (typeof outOfRangeValue !== 'undefined') {
    throw new Error(`Value "${outOfRangeValue}" out of range for ${unit.type}`)
  }

  if (values.length === unit.total) {
    return []
  }

  return values
}

function replaceAlternatives(str: string, min: number, alt?: string[]) {
  if (!alt) {
    return str
  }

  str = str.toUpperCase()

  for (let index = 0; index < alt.length; index += 1) {
    str = str.replace(alt[index], `${index + min}`)
  }

  return str
}

function fixSunday(values: number[], unit: Unit) {
  if (unit.type !== 'week-days') {
    return values
  }

  return values.map((value) => (value === 7 ? 0 : value))
}

function parseRange(rangeStr: string, context: string, unit: Unit) {
  const subparts = rangeStr.split('-')

  if (subparts.length === 1) {
    const value = convertStringToNumber(subparts[0])

    if (Number.isNaN(value)) {
      throw new Error(`Invalid value "${context}" for ${unit.type}`)
    }

    return [value]
  }

  if (subparts.length === 2) {
    const minValue = convertStringToNumber(subparts[0])
    const maxValue = convertStringToNumber(subparts[1])

    if (Number.isNaN(minValue) || Number.isNaN(maxValue)) {
      throw new Error(`Invalid value "${context}" for ${unit.type}`)
    }

    if (maxValue < minValue) {
      throw new Error(
        `Max range is less than min range in "${rangeStr}" for ${unit.type}`,
      )
    }

    return range(minValue, maxValue)
  }

  throw new Error(`Invalid value "${rangeStr}" for ${unit.type}`)
}

function outOfRange(values: number[], unit: Unit) {
  const first = values[0]
  const last = values[values.length - 1]

  if (first < unit.min) {
    return first
  }

  if (last > unit.max) {
    return last
  }

  return undefined
}

function parseStep(step: string | undefined, unit: Unit) {
  if (typeof step === 'undefined') {
    return undefined
  }

  const parsedStep = convertStringToNumber(step)

  if (Number.isNaN(parsedStep) || parsedStep < 1) {
    throw new Error(`Invalid interval step value "${step}" for ${unit.type}`)
  }

  return parsedStep
}

function applyInterval(values: number[], step?: number) {
  if (!step) {
    return values
  }

  const minValue = values[0]

  return values.filter((value) => value % step === minValue % step || value === minValue)
}

function isFull(values: number[], unit: Unit) {
  return values.length === unit.max - unit.min + 1
}

function getStep(values: number[]) {
  if (values.length <= 2) {
    return undefined
  }

  const step = values[1] - values[0]

  return step > 1 ? step : undefined
}

function isInterval(values: number[], step: number) {
  for (let index = 1; index < values.length; index += 1) {
    if (values[index] - values[index - 1] !== step) {
      return false
    }
  }

  return true
}

function isFullInterval(values: number[], unit: Unit, step: number) {
  const min = getMin(values)
  const max = getMax(values)
  const hasAllValues = values.length === (max - min) / step + 1

  return min === unit.min && max + step > unit.max && hasAllValues
}

function getMin(values: number[]) {
  return values[0]
}

function getMax(values: number[]) {
  return values[values.length - 1]
}

function toRanges(values: number[]) {
  const result: Array<number | number[]> = []
  let start: number | null = null

  values.forEach((value, index, self) => {
    if (value !== self[index + 1] - 1) {
      if (start !== null) {
        result.push([start, value])
        start = null
      } else {
        result.push(value)
      }
    } else if (start === null) {
      start = value
    }
  })

  return result
}

function range(start: number, end: number) {
  const values: number[] = []

  for (let index = start; index <= end; index += 1) {
    values.push(index)
  }

  return values
}

function sort(values: number[]) {
  values.sort((left, right) => left - right)
  return values
}

function dedup(values: number[]) {
  const result: number[] = []

  values.forEach((value) => {
    if (!result.includes(value)) {
      result.push(value)
    }
  })

  return result
}

export function setError(onError: OnError, locale: Locale) {
  if (onError) {
    onError({
      type: 'invalid_cron',
      description:
        locale.errorInvalidCron || DEFAULT_LOCALE_EN.errorInvalidCron,
    })
  }
}

function convertStringToNumber(str: string) {
  const parsedValue = Number.parseInt(str, 10)
  const numericValue = Number(str)

  return parsedValue === numericValue ? numericValue : Number.NaN
}
