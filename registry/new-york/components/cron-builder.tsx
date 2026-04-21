'use client'

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'

import { Button } from '@/components/ui/button'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'
import {
  formatValue,
  getCronStringFromValues,
  hasDropdownAllowEmptyError,
  parsePartArray,
  parseCronString,
  partToString,
  setValuesFromCronString,
  UNITS,
} from '@/registry/new-york/lib/cron-builder/converter'
import { DEFAULT_LOCALE_EN } from '@/registry/new-york/lib/cron-builder/locale'
import {
  type ClockFormat,
  type CronProps,
  type DropdownsConfig,
  type FilterOption,
  type LeadingZero,
  type Locale,
  type Mode,
  type PeriodType,
  type SetValue,
  type SetValueFunction,
  type SetValueNumbersOrUndefined,
} from '@/registry/new-york/lib/cron-builder/types'
import { cn } from '@/lib/utils'

const DEFAULT_ALLOWED_DROPDOWNS = [
  'period',
  'months',
  'month-days',
  'week-days',
  'hours',
  'minutes',
] as const

const DEFAULT_ALLOWED_PERIODS: PeriodType[] = [
  'year',
  'month',
  'week',
  'day',
  'hour',
  'minute',
  'reboot',
]

const DEFAULT_SHORTCUTS = [
  '@yearly',
  '@annually',
  '@monthly',
  '@weekly',
  '@daily',
  '@midnight',
  '@hourly',
] as const

const WEEK_DAY_KEYS = [
  'sun',
  'mon',
  'tue',
  'wed',
  'thu',
  'fri',
  'sat',
] as const

const MONTH_KEYS = [
  'jan',
  'feb',
  'mar',
  'apr',
  'may',
  'jun',
  'jul',
  'aug',
  'sep',
  'oct',
  'nov',
  'dec',
] as const

type ClickRecord = {
  time: number
  value: number
}

type CronFieldProps = {
  ariaOptionsLabel: string
  placeholder: string
  prefix?: string
  suffix?: string
  value?: number[]
  setValue: SetValueNumbersOrUndefined
  unit: (typeof UNITS)[number]
  locale: Locale
  disabled: boolean
  readOnly: boolean
  humanizeLabels?: boolean
  leadingZero?: LeadingZero
  clockFormat?: ClockFormat
  period: PeriodType
  periodicityOnDoubleClick: boolean
  mode: Mode
  allowClear?: boolean
  filterOption?: FilterOption
  optionsList?: string[]
  open: boolean
  onOpenChange: (open: boolean) => void
  grid?: boolean
  invalid?: boolean
}

function emitValueChange(
  setValue: SetValue,
  onChange: SetValueFunction | undefined,
  value: string,
  selectedPeriod: PeriodType,
) {
  if (onChange) {
    onChange(value, { selectedPeriod })
    return
  }

  if (setValue) {
    ;(setValue as SetValueFunction)(value, { selectedPeriod })
  }
}

function getPeriodLabel(period: PeriodType, locale: Locale) {
  switch (period) {
    case 'year':
      return locale.yearOption || DEFAULT_LOCALE_EN.yearOption
    case 'month':
      return locale.monthOption || DEFAULT_LOCALE_EN.monthOption
    case 'week':
      return locale.weekOption || DEFAULT_LOCALE_EN.weekOption
    case 'day':
      return locale.dayOption || DEFAULT_LOCALE_EN.dayOption
    case 'hour':
      return locale.hourOption || DEFAULT_LOCALE_EN.hourOption
    case 'minute':
      return locale.minuteOption || DEFAULT_LOCALE_EN.minuteOption
    case 'reboot':
      return locale.rebootOption || DEFAULT_LOCALE_EN.rebootOption
  }
}

function getLeadingZeroValue(
  dropdownsConfig: DropdownsConfig | undefined,
  field: 'month-days' | 'hours' | 'minutes',
  leadingZero: LeadingZero,
) {
  return dropdownsConfig?.[field]?.leadingZero ?? leadingZero
}

function getOrderedLocaleList<Key extends string>(
  arrayValue: string[] | undefined,
  mapValue: Partial<Record<Key, string>> | undefined,
  defaultArray: string[],
  keys: readonly Key[],
) {
  if (arrayValue?.length) {
    return arrayValue
  }

  if (mapValue) {
    return keys.map((key, index) => mapValue[key] || defaultArray[index])
  }

  return defaultArray
}

function getPeriodOptions(
  locale: Locale,
  allowedPeriods: PeriodType[],
  shortcuts: CronProps['shortcuts'],
) {
  return allowedPeriods
    .filter((allowedPeriod) => {
      if (allowedPeriod !== 'reboot') {
        return true
      }

      return (
        shortcuts === true ||
        (Array.isArray(shortcuts) && shortcuts.includes('@reboot'))
      )
    })
    .map((allowedPeriod) => ({
      label: getPeriodLabel(allowedPeriod, locale),
      value: allowedPeriod,
    }))
}

function usePrevious<T>(value: T) {
  const ref = useRef(value)

  useEffect(() => {
    ref.current = value
  }, [value])

  return ref.current
}

function sortNumbers(values: number[]) {
  return [...values].sort((left, right) => left - right)
}

function getPanelWidthClass({
  clockFormat,
  grid,
  period,
  unitType,
}: {
  clockFormat: CronFieldProps['clockFormat']
  grid: boolean
  period: CronFieldProps['period']
  unitType: CronFieldProps['unit']['type']
}) {
  if (!grid) {
    return 'min-w-[11rem] max-w-[18rem]'
  }

  if (unitType === 'hours' && clockFormat === '12-hour-clock') {
    return 'w-[16rem]'
  }

  if (unitType === 'minutes') {
    return period === 'day' || period === 'hour' ? 'w-[14rem]' : 'w-[18rem]'
  }

  return 'w-[11rem]'
}

function getOptionsClass({
  grid,
  period,
  unitType,
}: {
  grid: boolean
  period: CronFieldProps['period']
  unitType: CronFieldProps['unit']['type']
}) {
  if (!grid) {
    return 'grid gap-1'
  }

  if (unitType === 'minutes') {
    if (period === 'day' || period === 'hour') {
      return 'grid grid-cols-5 gap-1.5'
    }

    return 'grid grid-cols-6 gap-1.5'
  }

  return 'grid grid-cols-4 gap-1.5'
}

function getOptionsColumnCount({
  grid,
  period,
  unitType,
}: {
  grid: boolean
  period: CronFieldProps['period']
  unitType: CronFieldProps['unit']['type']
}) {
  if (!grid) {
    return 1
  }

  if (unitType === 'minutes') {
    return period === 'day' || period === 'hour' ? 5 : 6
  }

  return 4
}

function useListboxKeyboardNav({
  open,
  length,
  columns,
  getInitialIndex,
}: {
  open: boolean
  length: number
  columns: number
  getInitialIndex: () => number
}) {
  const optionRefs = useRef<Array<HTMLButtonElement | null>>([])
  const [activeIndex, setActiveIndex] = useState(0)
  const getInitialIndexRef = useRef(getInitialIndex)
  getInitialIndexRef.current = getInitialIndex

  useEffect(() => {
    if (!open) {
      return
    }
    setActiveIndex(getInitialIndexRef.current())
  }, [open])

  useEffect(() => {
    if (!open) {
      return
    }
    const button = optionRefs.current[activeIndex]
    if (button) {
      button.focus()
    }
  }, [activeIndex, open])

  useEffect(() => {
    if (length > 0 && activeIndex > length - 1) {
      setActiveIndex(length - 1)
    }
  }, [activeIndex, length])

  const onKeyDown = useCallback(
    (event: React.KeyboardEvent<HTMLDivElement>) => {
      if (!length) {
        return
      }
      const last = length - 1
      let next = activeIndex

      switch (event.key) {
        case 'ArrowDown':
          next = Math.min(last, activeIndex + columns)
          event.preventDefault()
          break
        case 'ArrowUp':
          next = Math.max(0, activeIndex - columns)
          event.preventDefault()
          break
        case 'ArrowRight':
          if (columns > 1) {
            next = Math.min(last, activeIndex + 1)
            event.preventDefault()
          }
          break
        case 'ArrowLeft':
          if (columns > 1) {
            next = Math.max(0, activeIndex - 1)
            event.preventDefault()
          }
          break
        case 'Home':
          next = 0
          event.preventDefault()
          break
        case 'End':
          next = last
          event.preventDefault()
          break
        default:
          return
      }

      if (next !== activeIndex) {
        setActiveIndex(next)
      }
    },
    [activeIndex, columns, length],
  )

  return { optionRefs, activeIndex, onKeyDown }
}

function CronField({
  ariaOptionsLabel,
  placeholder,
  prefix,
  suffix,
  value,
  setValue,
  unit,
  locale,
  disabled,
  readOnly,
  humanizeLabels,
  leadingZero,
  clockFormat,
  period,
  periodicityOnDoubleClick,
  mode,
  allowClear,
  filterOption = () => true,
  optionsList,
  open,
  onOpenChange,
  grid = true,
  invalid = false,
}: CronFieldProps) {
  const clicksRef = useRef<ClickRecord[]>([])
  const timeoutIdsRef = useRef<number[]>([])

  useEffect(() => {
    return () => {
      timeoutIdsRef.current.forEach((timeoutId) => {
        window.clearTimeout(timeoutId)
      })
      timeoutIdsRef.current = []
    }
  }, [])

  const options = useMemo(() => {
    const baseOptions =
      optionsList?.map((option, index) => ({
        value: (unit.min === 0 ? index : index + 1).toString(),
        label: option,
      })) ??
      Array.from({ length: unit.total }, (_, index) => {
        const numericValue = unit.min === 0 ? index : index + 1

        return {
          value: numericValue.toString(),
          label: formatValue(
            numericValue,
            unit,
            humanizeLabels,
            leadingZero,
            clockFormat,
          ),
        }
      })

    return baseOptions.filter(filterOption)
  }, [
    clockFormat,
    filterOption,
    humanizeLabels,
    leadingZero,
    optionsList,
    unit,
  ])

  const summary = useMemo(() => {
    if (!value || value.length === 0) {
      return placeholder
    }

    const parsedArray = parsePartArray(value, unit)
    const cronValue = partToString(
      parsedArray,
      unit,
      humanizeLabels,
      leadingZero,
      clockFormat,
    )
    const intervalMatch = cronValue.match(/^\*\/([0-9]+),?$/)

    if (intervalMatch?.[1]) {
      return `${locale.everyText || DEFAULT_LOCALE_EN.everyText} ${intervalMatch[1]}`
    }

    return cronValue
  }, [
    clockFormat,
    humanizeLabels,
    leadingZero,
    locale.everyText,
    placeholder,
    unit,
    value,
  ])

  const simpleClick = useCallback(
    (newValueOption: number | number[]) => {
      const nextOptions = Array.isArray(newValueOption)
        ? sortNumbers(newValueOption)
        : [newValueOption]
      let nextValue: number[] = nextOptions

      if (value) {
        nextValue = mode === 'single' ? [] : [...value]

        nextOptions.forEach((option) => {
          if (value.includes(option)) {
            nextValue = nextValue.filter((item) => item !== option)
          } else {
            nextValue = sortNumbers([...nextValue, option])
          }
        })
      }

      setValue(nextValue.length === unit.total ? [] : nextValue)

      if (mode === 'single' && !periodicityOnDoubleClick) {
        onOpenChange(false)
      }
    },
    [mode, onOpenChange, periodicityOnDoubleClick, setValue, unit.total, value],
  )

  const doubleClick = useCallback(
    (newValueOption: number) => {
      if (newValueOption === 0 || newValueOption === 1) {
        setValue([])
        return
      }

      const limit = unit.total + unit.min
      const nextValue: number[] = []

      for (let index = unit.min; index < limit; index += 1) {
        if (index % newValueOption === 0) {
          nextValue.push(index)
        }
      }

      const sameValue =
        !!value &&
        value.length === nextValue.length &&
        value.every((item, index) => item === nextValue[index])
      const allValuesSelected = nextValue.length === options.length

      setValue(sameValue || allValuesSelected ? [] : nextValue)
    },
    [options.length, setValue, unit.min, unit.total, value],
  )

  const handleOptionClick = useCallback(
    (rawValue: string) => {
      if (readOnly) {
        return
      }

      const nextValue = Number(rawValue)

      if (!periodicityOnDoubleClick) {
        simpleClick(nextValue)
        return
      }

      const clicks = clicksRef.current
      const doubleClickTimeout = 220

      clicks.push({
        time: Date.now(),
        value: nextValue,
      })

      const timeoutId = window.setTimeout(() => {
        timeoutIdsRef.current = timeoutIdsRef.current.filter(
          (activeTimeoutId) => activeTimeoutId !== timeoutId,
        )

        if (
          periodicityOnDoubleClick &&
          clicks.length > 1 &&
          clicks[clicks.length - 1].time - clicks[clicks.length - 2].time <
            doubleClickTimeout
        ) {
          if (
            clicks[clicks.length - 1].value === clicks[clicks.length - 2].value
          ) {
            doubleClick(nextValue)
          } else {
            simpleClick([
              clicks[clicks.length - 2].value,
              clicks[clicks.length - 1].value,
            ])
          }
        } else {
          simpleClick(nextValue)
        }

        clicksRef.current = []
      }, doubleClickTimeout)

      timeoutIdsRef.current.push(timeoutId)
    },
    [doubleClick, periodicityOnDoubleClick, readOnly, simpleClick],
  )

  const isInteractive = !disabled && !readOnly
  const panelWidthClass = getPanelWidthClass({
    clockFormat,
    grid,
    period,
    unitType: unit.type,
  })
  const optionsClass = getOptionsClass({
    grid,
    period,
    unitType: unit.type,
  })
  const optionsColumnCount = getOptionsColumnCount({
    grid,
    period,
    unitType: unit.type,
  })
  const triggerClass = grid
    ? 'min-w-[3.5rem] justify-start text-left'
    : 'min-w-[9rem] max-w-[13rem] justify-between text-left'

  const clearable =
    allowClear !== false && isInteractive && !!value && value.length > 0

  const getInitialActiveIndex = useCallback(() => {
    if (!value || value.length === 0) {
      return 0
    }
    const firstSelected = options.findIndex((option) =>
      value.includes(Number(option.value)),
    )
    return firstSelected >= 0 ? firstSelected : 0
  }, [options, value])

  const { optionRefs, activeIndex, onKeyDown: onListboxKeyDown } =
    useListboxKeyboardNav({
      open,
      length: options.length,
      columns: optionsColumnCount,
      getInitialIndex: getInitialActiveIndex,
    })

  return (
    <div
      className={cn(
        'relative flex items-center gap-1.5',
        disabled && 'opacity-70',
      )}
      data-testid={`custom-select-${unit.type}`}
    >
      {prefix ? (
        <span className='whitespace-nowrap text-sm text-foreground'>
          {prefix}
        </span>
      ) : null}

      <Popover onOpenChange={onOpenChange} open={isInteractive ? open : false}>
        <div className='group/field relative'>
          <PopoverTrigger
            render={
              <button
                className={cn(
                  'inline-flex h-8 items-center rounded-md border bg-background px-2.5 text-sm shadow-sm transition-colors',
                  'gap-2 whitespace-nowrap',
                  open && 'border-primary ring-2 ring-primary/15',
                  invalid &&
                    'border-destructive bg-destructive/5 ring-2 ring-destructive/10',
                  !value?.length && 'text-muted-foreground',
                  triggerClass,
                  isInteractive
                    ? 'hover:border-primary/40 hover:bg-accent/60 hover:text-accent-foreground'
                    : 'cursor-default',
                  clearable && 'pr-7',
                )}
                disabled={!isInteractive}
                type='button'
              />
            }
          >
            {summary}
          </PopoverTrigger>

          {clearable ? (
            <button
              aria-label={
                locale.aria?.clearField || DEFAULT_LOCALE_EN.aria.clearField
              }
              className={cn(
                'absolute right-1 top-1/2 z-10 inline-flex h-5 w-5 -translate-y-1/2 items-center justify-center rounded-sm text-muted-foreground opacity-0 transition-opacity',
                'hover:bg-accent hover:text-foreground',
                'group-hover/field:opacity-100 focus-visible:opacity-100',
              )}
              onClick={(event) => {
                event.stopPropagation()
                setValue([])
              }}
              type='button'
            >
              <svg
                aria-hidden='true'
                fill='none'
                height='12'
                stroke='currentColor'
                strokeLinecap='round'
                strokeLinejoin='round'
                strokeWidth='2'
                viewBox='0 0 24 24'
                width='12'
              >
                <path d='M18 6 6 18' />
                <path d='M6 6l12 12' />
              </svg>
            </button>
          ) : null}
        </div>

        {isInteractive ? (
          <PopoverContent
            align='start'
            className={cn('gap-0 p-2', panelWidthClass)}
            sideOffset={6}
          >
            <div
              aria-label={ariaOptionsLabel}
              aria-multiselectable={mode !== 'single' || periodicityOnDoubleClick}
              className={optionsClass}
              onKeyDown={onListboxKeyDown}
              role='listbox'
            >
              {options.map((option, index) => {
                const numericValue = Number(option.value)
                const selected = !!value?.includes(numericValue)
                const isActive = index === activeIndex

                return (
                  <button
                    aria-selected={selected}
                    className={cn(
                      'rounded-md border px-2 py-1.5 text-sm transition-colors',
                      grid
                        ? 'min-h-8 min-w-8 text-center'
                        : 'flex min-h-8 w-full items-center justify-between gap-3 text-left',
                      selected
                        ? 'border-primary bg-primary text-primary-foreground'
                        : 'border-border bg-background hover:border-primary/40 hover:bg-accent hover:text-accent-foreground',
                    )}
                    key={option.value}
                    onClick={() => handleOptionClick(option.value)}
                    ref={(element) => {
                      optionRefs.current[index] = element
                    }}
                    role='option'
                    tabIndex={isActive ? 0 : -1}
                    type='button'
                  >
                    <span>{option.label}</span>
                  </button>
                )
              })}
            </div>
          </PopoverContent>
        ) : null}
      </Popover>

      {suffix ? (
        <span className='whitespace-nowrap text-sm text-foreground'>
          {suffix}
        </span>
      ) : null}
    </div>
  )
}

function PeriodSelect({
  disabled,
  invalid,
  locale,
  open,
  onOpenChange,
  readOnly,
  setValue,
  shortcuts,
  value,
  allowedPeriods,
}: {
  disabled: boolean
  invalid: boolean
  locale: Locale
  open: boolean
  onOpenChange: (open: boolean) => void
  readOnly: boolean
  setValue: (value: PeriodType | undefined) => void
  shortcuts: CronProps['shortcuts']
  value: PeriodType
  allowedPeriods: PeriodType[]
}) {
  const options = useMemo(
    () => getPeriodOptions(locale, allowedPeriods, shortcuts),
    [allowedPeriods, locale, shortcuts],
  )

  const isInteractive = !disabled && !readOnly

  const getInitialActiveIndex = useCallback(() => {
    const selected = options.findIndex((option) => option.value === value)
    return selected >= 0 ? selected : 0
  }, [options, value])

  const { optionRefs, activeIndex, onKeyDown: onListboxKeyDown } =
    useListboxKeyboardNav({
      open,
      length: options.length,
      columns: 1,
      getInitialIndex: getInitialActiveIndex,
    })

  return (
    <div className='relative flex items-center gap-1.5'>
      {locale.prefixPeriod !== '' ? (
        <span className='whitespace-nowrap text-sm text-foreground'>
          {locale.prefixPeriod || DEFAULT_LOCALE_EN.prefixPeriod}
        </span>
      ) : null}

      <Popover onOpenChange={onOpenChange} open={isInteractive ? open : false}>
        <PopoverTrigger
          render={
            <button
              className={cn(
                'inline-flex h-8 items-center rounded-md border bg-background px-2.5 text-sm shadow-sm transition-colors',
                'whitespace-nowrap',
                open && 'border-primary ring-2 ring-primary/15',
                invalid &&
                  'border-destructive bg-destructive/5 ring-2 ring-destructive/10',
                isInteractive
                  ? 'hover:border-primary/40 hover:bg-accent/60 hover:text-accent-foreground'
                  : 'cursor-default',
              )}
              data-testid='select-period'
              disabled={!isInteractive}
              type='button'
            />
          }
        >
          {getPeriodLabel(value, locale)}
        </PopoverTrigger>

        {isInteractive ? (
          <PopoverContent
            align='start'
            className='min-w-[9rem] w-auto gap-0 p-1.5'
            sideOffset={6}
          >
            <div
              aria-label={
                locale.aria?.periodOptions || DEFAULT_LOCALE_EN.aria.periodOptions
              }
              className='grid gap-1'
              onKeyDown={onListboxKeyDown}
              role='listbox'
            >
              {options.map((option, index) => {
                const selected = option.value === value
                const isActive = index === activeIndex

                return (
                  <button
                    aria-selected={selected}
                    className={cn(
                      'rounded-md border px-2 py-1.5 text-left text-sm transition-colors',
                      selected
                        ? 'border-primary bg-primary text-primary-foreground'
                        : 'border-border bg-background hover:border-primary/40 hover:bg-accent hover:text-accent-foreground',
                    )}
                    data-testid={`period-option-${option.value}`}
                    key={option.value}
                    onClick={() => {
                      setValue(option.value)
                      onOpenChange(false)
                    }}
                    ref={(element) => {
                      optionRefs.current[index] = element
                    }}
                    role='option'
                    tabIndex={isActive ? 0 : -1}
                    type='button'
                  >
                    {option.label}
                  </button>
                )
              })}
            </div>
          </PopoverContent>
        ) : null}
      </Popover>
    </div>
  )
}

export function Cron(props: CronProps) {
  const {
    clearButton = true,
    clearButtonProps = {},
    clearButtonAction = 'fill-with-every',
    locale = DEFAULT_LOCALE_EN,
    value = '',
    onChange,
    setValue,
    displayError = true,
    onError,
    className,
    defaultPeriod,
    allowEmpty = 'for-default-value',
    humanizeLabels = true,
    humanizeValue = false,
    disabled = false,
    readOnly = false,
    leadingZero = false,
    shortcuts = [...DEFAULT_SHORTCUTS],
    clockFormat = '24-hour-clock',
    periodicityOnDoubleClick = true,
    mode = 'multiple',
    allowedDropdowns = [...DEFAULT_ALLOWED_DROPDOWNS],
    allowedPeriods = DEFAULT_ALLOWED_PERIODS,
    allowClear = true,
    dropdownsConfig,
  } = props

  const internalValueRef = useRef(value)
  const initialValueRef = useRef(value)
  const hasSyncedValueRef = useRef(false)
  const firstRenderRef = useRef(true)
  const syncedConfigSignatureRef = useRef<string | null>(null)
  const [period, setPeriod] = useState<PeriodType | undefined>()
  const [monthDays, setMonthDays] = useState<number[] | undefined>()
  const [months, setMonths] = useState<number[] | undefined>()
  const [weekDays, setWeekDays] = useState<number[] | undefined>()
  const [hours, setHours] = useState<number[] | undefined>()
  const [minutes, setMinutes] = useState<number[] | undefined>()
  const [error, setInternalError] = useState(false)
  const [valueCleared, setValueCleared] = useState(false)
  const [openField, setOpenField] = useState<string | null>(null)
  const previousValueCleared = usePrevious(valueCleared)
  const effectiveDefaultPeriod = defaultPeriod ?? 'day'
  const localeErrorText =
    locale.errorInvalidCron || DEFAULT_LOCALE_EN.errorInvalidCron
  const syncConfigRef = useRef({
    allowEmpty,
    allowedPeriods,
    defaultPeriod,
    dropdownsConfig,
    locale,
    shortcuts,
  })
  const dropdownsConfigRef = useRef(dropdownsConfig)
  const dropdownsConfigSignature = useMemo(
    () => JSON.stringify(dropdownsConfig),
    [dropdownsConfig],
  )
  const syncConfigSignature = useMemo(
    () =>
      JSON.stringify({
        allowEmpty,
        allowedPeriods,
        defaultPeriod,
        dropdownsConfig,
        locale,
        shortcuts,
      }),
    [allowEmpty, allowedPeriods, defaultPeriod, dropdownsConfig, locale, shortcuts],
  )

  syncConfigRef.current = {
    allowEmpty,
    allowedPeriods,
    defaultPeriod,
    dropdownsConfig,
    locale,
    shortcuts,
  }
  dropdownsConfigRef.current = dropdownsConfig

  useEffect(() => {
    const isInitialSync = !hasSyncedValueRef.current
    const configChanged =
      syncedConfigSignatureRef.current !== syncConfigSignature

    if (!isInitialSync && value === internalValueRef.current && !configChanged) {
      return
    }

    const currentConfig = syncConfigRef.current

    setValuesFromCronString(
      value,
      setInternalError,
      onError,
      currentConfig.allowEmpty,
      internalValueRef,
      isInitialSync,
      currentConfig.locale,
      currentConfig.shortcuts,
      setMinutes,
      setHours,
      setMonthDays,
      setMonths,
      setWeekDays,
      setPeriod,
      currentConfig.defaultPeriod,
      currentConfig.allowedPeriods,
      currentConfig.dropdownsConfig,
    )

    hasSyncedValueRef.current = true
    syncedConfigSignatureRef.current = syncConfigSignature
  }, [onError, syncConfigSignature, value])

  useEffect(() => {
    if (
      (period || minutes || months || monthDays || weekDays || hours) &&
      !valueCleared &&
      !previousValueCleared
    ) {
      const currentDropdownsConfig = dropdownsConfigRef.current
      const selectedPeriod = period || effectiveDefaultPeriod
      const cron = getCronStringFromValues(
        selectedPeriod,
        months,
        monthDays,
        weekDays,
        hours,
        minutes,
        humanizeValue,
        currentDropdownsConfig,
      )

      emitValueChange(setValue, onChange, cron, selectedPeriod)
      internalValueRef.current = cron

      if (firstRenderRef.current) {
        initialValueRef.current = cron
        firstRenderRef.current = false
      }

      const isEmptyCron = cron === '* * * * *'
      const isInitialValue = cron === initialValueRef.current
      const hasGlobalEmptyError =
        isEmptyCron &&
        (allowEmpty === 'never' ||
          (allowEmpty === 'for-default-value' && !isInitialValue))
      const hasPerDropdownError =
        !hasGlobalEmptyError &&
        hasDropdownAllowEmptyError(
          [
            minutes ?? [],
            hours ?? [],
            monthDays ?? [],
            months ?? [],
            weekDays ?? [],
          ],
          selectedPeriod,
          isInitialValue,
          currentDropdownsConfig,
        )

      if (hasGlobalEmptyError || hasPerDropdownError) {
        setInternalError(true)
        if (onError) {
          onError({
            type: 'invalid_cron',
            description: localeErrorText,
          })
        }
      } else {
        if (onError) {
          onError(undefined)
        }

        setInternalError(false)
      }
    } else if (valueCleared) {
      setValueCleared(false)
    }
  }, [
    allowEmpty,
    dropdownsConfigSignature,
    hours,
    humanizeValue,
    minutes,
    monthDays,
    months,
    onChange,
    onError,
    period,
    previousValueCleared,
    setValue,
    valueCleared,
    weekDays,
    effectiveDefaultPeriod,
    localeErrorText,
  ])

  const handleClear = useCallback(() => {
    setMonthDays(undefined)
    setMonths(undefined)
    setWeekDays(undefined)
    setHours(undefined)
    setMinutes(undefined)
    setOpenField(null)

    let nextValue = ''
    const nextPeriod =
      period !== 'reboot' && period ? period : effectiveDefaultPeriod

    if (nextPeriod !== period) {
      setPeriod(nextPeriod)
    }

    if (clearButtonAction === 'fill-with-every') {
      nextValue = getCronStringFromValues(
        nextPeriod,
        undefined,
        undefined,
        undefined,
        undefined,
        undefined,
        undefined,
        undefined,
      )
    }

    emitValueChange(setValue, onChange, nextValue, nextPeriod)
    internalValueRef.current = nextValue
    setValueCleared(true)

    const isEmptyCron = nextValue === '* * * * *'
    const isInitialValue = nextValue === initialValueRef.current
    const hasEmptyError =
      allowEmpty === 'never' && (clearButtonAction === 'empty' || isEmptyCron)
    const hasPerDropdownError =
      !hasEmptyError &&
      isEmptyCron &&
      hasDropdownAllowEmptyError(
        [[], [], [], [], []],
        nextPeriod,
        isInitialValue,
        dropdownsConfigRef.current,
      )

    if (hasEmptyError || hasPerDropdownError) {
      setInternalError(true)
      if (onError) {
        onError({
          type: 'invalid_cron',
          description: localeErrorText,
        })
      }
    } else {
      if (onError) {
        onError(undefined)
      }

      setInternalError(false)
    }
  }, [
    allowEmpty,
    clearButtonAction,
    effectiveDefaultPeriod,
    localeErrorText,
    onChange,
    onError,
    period,
    setValue,
  ])

  const clearButtonNode = useMemo(() => {
    if (!clearButton || readOnly) {
      return null
    }

    return (
      <Button
        className='h-8 rounded-md px-3 text-sm'
        disabled={disabled}
        onClick={handleClear}
        size='sm'
        variant='destructive'
        {...clearButtonProps}
      >
        {locale.clearButtonText || DEFAULT_LOCALE_EN.clearButtonText}
      </Button>
    )
  }, [
    clearButton,
    clearButtonProps,
    disabled,
    handleClear,
    locale.clearButtonText,
    readOnly,
  ])

  const periodForRender = period || effectiveDefaultPeriod
  const localizedMonths = useMemo(
    () =>
      getOrderedLocaleList(
        locale.months,
        locale.monthsMap,
        DEFAULT_LOCALE_EN.months,
        MONTH_KEYS,
      ),
    [locale.months, locale.monthsMap],
  )
  const localizedAltMonths = useMemo(
    () =>
      getOrderedLocaleList(
        locale.altMonths,
        locale.altMonthsMap,
        DEFAULT_LOCALE_EN.altMonths,
        MONTH_KEYS,
      ),
    [locale.altMonths, locale.altMonthsMap],
  )
  const localizedWeekDays = useMemo(
    () =>
      getOrderedLocaleList(
        locale.weekDays,
        locale.weekDaysMap,
        DEFAULT_LOCALE_EN.weekDays,
        WEEK_DAY_KEYS,
      ),
    [locale.weekDays, locale.weekDaysMap],
  )
  const localizedAltWeekDays = useMemo(
    () =>
      getOrderedLocaleList(
        locale.altWeekDays,
        locale.altWeekDaysMap,
        DEFAULT_LOCALE_EN.altWeekDays,
        WEEK_DAY_KEYS,
      ),
    [locale.altWeekDays, locale.altWeekDaysMap],
  )
  const showMonths = periodForRender === 'year' && allowedDropdowns.includes('months')
  const showMonthDays =
    (periodForRender === 'year' || periodForRender === 'month') &&
    allowedDropdowns.includes('month-days')
  const showWeekDays =
    (periodForRender === 'year' ||
      periodForRender === 'month' ||
      periodForRender === 'week') &&
    allowedDropdowns.includes('week-days')
  const showHours =
    periodForRender !== 'minute' &&
    periodForRender !== 'hour' &&
    allowedDropdowns.includes('hours')
  const showMinutes =
    periodForRender !== 'minute' && allowedDropdowns.includes('minutes')

  const displayMonthDays =
    !readOnly ||
    (monthDays && monthDays.length > 0) ||
    ((!monthDays || monthDays.length === 0) &&
      (!weekDays || weekDays.length === 0))

  const displayWeekDays =
    periodForRender === 'week' ||
    !readOnly ||
    (weekDays && weekDays.length > 0) ||
    ((!weekDays || weekDays.length === 0) &&
      (!monthDays || monthDays.length === 0))

  const monthDaysIsDisplayed =
    !readOnly ||
    (monthDays && monthDays.length > 0) ||
    ((!monthDays || monthDays.length === 0) &&
      (!weekDays || weekDays.length === 0))

  const invalid = error && displayError

  return (
    <div className={cn('grid gap-2', className)}>
      <div
        className={cn(
          'flex flex-wrap items-start gap-x-2 gap-y-2',
          disabled && 'opacity-90',
        )}
      >
        {allowedDropdowns.includes('period') ? (
          <PeriodSelect
            allowedPeriods={allowedPeriods}
            disabled={dropdownsConfig?.period?.disabled ?? disabled}
            invalid={invalid}
            locale={locale}
            onOpenChange={(open) => setOpenField(open ? 'period' : null)}
            open={openField === 'period'}
            readOnly={dropdownsConfig?.period?.readOnly ?? readOnly}
            setValue={setPeriod}
            shortcuts={shortcuts}
            value={periodForRender}
          />
        ) : null}

        {periodForRender === 'reboot' ? (
          clearButtonNode
        ) : (
          <>
            {showMonths ? (
              <CronField
                allowClear={dropdownsConfig?.months?.allowClear ?? allowClear}
                ariaOptionsLabel={
                  locale.aria?.monthsOptions || DEFAULT_LOCALE_EN.aria.monthsOptions
                }
                clockFormat={clockFormat}
                disabled={dropdownsConfig?.months?.disabled ?? disabled}
                filterOption={dropdownsConfig?.months?.filterOption}
                grid={false}
                humanizeLabels={
                  dropdownsConfig?.months?.humanizeLabels ?? humanizeLabels
                }
                invalid={invalid}
                locale={locale}
                mode={dropdownsConfig?.months?.mode ?? mode}
                onOpenChange={(open) => setOpenField(open ? 'months' : null)}
                open={openField === 'months'}
                optionsList={localizedMonths}
                period={periodForRender}
                periodicityOnDoubleClick={
                  dropdownsConfig?.months?.periodicityOnDoubleClick ??
                  periodicityOnDoubleClick
                }
                placeholder={locale.emptyMonths || DEFAULT_LOCALE_EN.emptyMonths}
                prefix={
                  locale.prefixMonths === ''
                    ? undefined
                    : locale.prefixMonths || DEFAULT_LOCALE_EN.prefixMonths
                }
                readOnly={dropdownsConfig?.months?.readOnly ?? readOnly}
                setValue={setMonths}
                unit={{
                  ...UNITS[3],
                  alt: localizedAltMonths,
                }}
                value={months}
              />
            ) : null}

            {showMonthDays && displayMonthDays ? (
              <CronField
                allowClear={
                  dropdownsConfig?.['month-days']?.allowClear ?? allowClear
                }
                ariaOptionsLabel={
                  locale.aria?.monthDaysOptions ||
                  DEFAULT_LOCALE_EN.aria.monthDaysOptions
                }
                clockFormat={clockFormat}
                disabled={dropdownsConfig?.['month-days']?.disabled ?? disabled}
                filterOption={dropdownsConfig?.['month-days']?.filterOption}
                invalid={invalid}
                leadingZero={getLeadingZeroValue(
                  dropdownsConfig,
                  'month-days',
                  leadingZero,
                )}
                locale={locale}
                mode={dropdownsConfig?.['month-days']?.mode ?? mode}
                onOpenChange={(open) =>
                  setOpenField(open ? 'month-days' : null)
                }
                open={openField === 'month-days'}
                period={periodForRender}
                periodicityOnDoubleClick={
                  dropdownsConfig?.['month-days']?.periodicityOnDoubleClick ??
                  periodicityOnDoubleClick
                }
                placeholder={
                  !weekDays || weekDays.length === 0
                    ? locale.emptyMonthDays || DEFAULT_LOCALE_EN.emptyMonthDays
                    : locale.emptyMonthDaysShort ||
                      DEFAULT_LOCALE_EN.emptyMonthDaysShort
                }
                prefix={
                  locale.prefixMonthDays === ''
                    ? undefined
                    : locale.prefixMonthDays || DEFAULT_LOCALE_EN.prefixMonthDays
                }
                readOnly={dropdownsConfig?.['month-days']?.readOnly ?? readOnly}
                setValue={setMonthDays}
                unit={UNITS[2]}
                value={monthDays}
              />
            ) : null}

            {showWeekDays && displayWeekDays ? (
              <CronField
                allowClear={
                  dropdownsConfig?.['week-days']?.allowClear ?? allowClear
                }
                ariaOptionsLabel={
                  locale.aria?.weekDaysOptions ||
                  DEFAULT_LOCALE_EN.aria.weekDaysOptions
                }
                clockFormat={clockFormat}
                disabled={dropdownsConfig?.['week-days']?.disabled ?? disabled}
                filterOption={dropdownsConfig?.['week-days']?.filterOption}
                grid={false}
                humanizeLabels={
                  dropdownsConfig?.['week-days']?.humanizeLabels ??
                  humanizeLabels
                }
                invalid={invalid}
                locale={locale}
                mode={dropdownsConfig?.['week-days']?.mode ?? mode}
                onOpenChange={(open) =>
                  setOpenField(open ? 'week-days' : null)
                }
                open={openField === 'week-days'}
                optionsList={localizedWeekDays}
                period={periodForRender}
                periodicityOnDoubleClick={
                  dropdownsConfig?.['week-days']?.periodicityOnDoubleClick ??
                  periodicityOnDoubleClick
                }
                placeholder={
                  periodForRender === 'week' ||
                  !monthDays ||
                  monthDays.length === 0
                    ? locale.emptyWeekDays || DEFAULT_LOCALE_EN.emptyWeekDays
                    : locale.emptyWeekDaysShort ||
                      DEFAULT_LOCALE_EN.emptyWeekDaysShort
                }
                prefix={
                  periodForRender === 'week' || !monthDaysIsDisplayed
                    ? locale.prefixWeekDays === ''
                      ? undefined
                      : locale.prefixWeekDays || DEFAULT_LOCALE_EN.prefixWeekDays
                    : locale.prefixWeekDaysForMonthAndYearPeriod === ''
                      ? undefined
                      : locale.prefixWeekDaysForMonthAndYearPeriod ||
                        DEFAULT_LOCALE_EN.prefixWeekDaysForMonthAndYearPeriod
                }
                readOnly={dropdownsConfig?.['week-days']?.readOnly ?? readOnly}
                setValue={setWeekDays}
                unit={{
                  ...UNITS[4],
                  alt: localizedAltWeekDays,
                }}
                value={weekDays}
              />
            ) : null}

            {showHours ? (
              <CronField
                allowClear={dropdownsConfig?.hours?.allowClear ?? allowClear}
                ariaOptionsLabel={
                  locale.aria?.hoursOptions || DEFAULT_LOCALE_EN.aria.hoursOptions
                }
                clockFormat={clockFormat}
                disabled={dropdownsConfig?.hours?.disabled ?? disabled}
                filterOption={dropdownsConfig?.hours?.filterOption}
                invalid={invalid}
                leadingZero={getLeadingZeroValue(
                  dropdownsConfig,
                  'hours',
                  leadingZero,
                )}
                locale={locale}
                mode={dropdownsConfig?.hours?.mode ?? mode}
                onOpenChange={(open) => setOpenField(open ? 'hours' : null)}
                open={openField === 'hours'}
                period={periodForRender}
                periodicityOnDoubleClick={
                  dropdownsConfig?.hours?.periodicityOnDoubleClick ??
                  periodicityOnDoubleClick
                }
                placeholder={locale.emptyHours || DEFAULT_LOCALE_EN.emptyHours}
                prefix={
                  locale.prefixHours === ''
                    ? undefined
                    : locale.prefixHours || DEFAULT_LOCALE_EN.prefixHours
                }
                readOnly={dropdownsConfig?.hours?.readOnly ?? readOnly}
                setValue={setHours}
                unit={UNITS[1]}
                value={hours}
              />
            ) : null}

            {showMinutes ? (
              <CronField
                allowClear={dropdownsConfig?.minutes?.allowClear ?? allowClear}
                ariaOptionsLabel={
                  locale.aria?.minutesOptions ||
                  DEFAULT_LOCALE_EN.aria.minutesOptions
                }
                clockFormat={clockFormat}
                disabled={dropdownsConfig?.minutes?.disabled ?? disabled}
                filterOption={dropdownsConfig?.minutes?.filterOption}
                invalid={invalid}
                leadingZero={getLeadingZeroValue(
                  dropdownsConfig,
                  'minutes',
                  leadingZero,
                )}
                locale={locale}
                mode={dropdownsConfig?.minutes?.mode ?? mode}
                onOpenChange={(open) => setOpenField(open ? 'minutes' : null)}
                open={openField === 'minutes'}
                period={periodForRender}
                periodicityOnDoubleClick={
                  dropdownsConfig?.minutes?.periodicityOnDoubleClick ??
                  periodicityOnDoubleClick
                }
                placeholder={
                  periodForRender === 'hour'
                    ? locale.emptyMinutesForHourPeriod ||
                      DEFAULT_LOCALE_EN.emptyMinutesForHourPeriod
                    : locale.emptyMinutes || DEFAULT_LOCALE_EN.emptyMinutes
                }
                prefix={
                  periodForRender === 'hour'
                    ? locale.prefixMinutesForHourPeriod === ''
                      ? undefined
                      : locale.prefixMinutesForHourPeriod ||
                        DEFAULT_LOCALE_EN.prefixMinutesForHourPeriod
                    : locale.prefixMinutes === ''
                      ? undefined
                      : locale.prefixMinutes || DEFAULT_LOCALE_EN.prefixMinutes
                }
                readOnly={dropdownsConfig?.minutes?.readOnly ?? readOnly}
                setValue={setMinutes}
                suffix={
                  periodForRender === 'hour' &&
                  locale.suffixMinutesForHourPeriod !== ''
                    ? locale.suffixMinutesForHourPeriod ||
                      DEFAULT_LOCALE_EN.suffixMinutesForHourPeriod
                    : undefined
                }
                unit={UNITS[0]}
                value={minutes}
              />
            ) : null}

            {clearButtonNode}
          </>
        )}
      </div>

      {invalid ? (
        <p className='text-xs font-medium text-destructive' role='alert'>
          {locale.errorInvalidCron || DEFAULT_LOCALE_EN.errorInvalidCron}
        </p>
      ) : null}
    </div>
  )
}

export const converter = {
  formatValue,
  getCronStringFromValues,
  parseCronString,
  partToString,
  setValuesFromCronString,
}

export type {
  AllowEmpty,
  ClockFormat,
  CronProps,
  CronError,
  DropdownConfig,
  DropdownsConfig,
  FilterOption,
  LeadingZero,
  Locale,
  MonthKey,
  MonthMap,
  Mode,
  ClearButtonAction,
  CronType,
  PeriodType,
  Shortcuts,
  ShortcutsType,
  WeekDayKey,
  WeekDayMap,
} from '@/registry/new-york/lib/cron-builder/types'

export { DEFAULT_LOCALE_EN }
