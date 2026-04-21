import type {
  ButtonHTMLAttributes,
  Dispatch,
  SetStateAction,
} from 'react'

export interface LocaleAria {
  clearField?: string
  periodOptions?: string
  monthsOptions?: string
  monthDaysOptions?: string
  weekDaysOptions?: string
  hoursOptions?: string
  minutesOptions?: string
}

export interface DefaultLocaleAria {
  clearField: string
  periodOptions: string
  monthsOptions: string
  monthDaysOptions: string
  weekDaysOptions: string
  hoursOptions: string
  minutesOptions: string
}

export type WeekDayKey =
  | 'sun'
  | 'mon'
  | 'tue'
  | 'wed'
  | 'thu'
  | 'fri'
  | 'sat'

export type MonthKey =
  | 'jan'
  | 'feb'
  | 'mar'
  | 'apr'
  | 'may'
  | 'jun'
  | 'jul'
  | 'aug'
  | 'sep'
  | 'oct'
  | 'nov'
  | 'dec'

export type WeekDayMap = Partial<Record<WeekDayKey, string>>
export type MonthMap = Partial<Record<MonthKey, string>>

export interface Locale {
  everyText?: string
  emptyMonths?: string
  emptyMonthDays?: string
  emptyMonthDaysShort?: string
  emptyWeekDays?: string
  emptyWeekDaysShort?: string
  emptyHours?: string
  emptyMinutes?: string
  emptyMinutesForHourPeriod?: string
  yearOption?: string
  monthOption?: string
  weekOption?: string
  dayOption?: string
  hourOption?: string
  minuteOption?: string
  rebootOption?: string
  prefixPeriod?: string
  prefixMonths?: string
  prefixMonthDays?: string
  prefixWeekDays?: string
  prefixWeekDaysForMonthAndYearPeriod?: string
  prefixHours?: string
  prefixMinutes?: string
  prefixMinutesForHourPeriod?: string
  suffixMinutesForHourPeriod?: string
  errorInvalidCron?: string
  clearButtonText?: string
  weekDays?: string[]
  weekDaysMap?: WeekDayMap
  months?: string[]
  monthsMap?: MonthMap
  altWeekDays?: string[]
  altWeekDaysMap?: WeekDayMap
  altMonths?: string[]
  altMonthsMap?: MonthMap
  aria?: LocaleAria
}

export interface DefaultLocale {
  everyText: string
  emptyMonths: string
  emptyMonthDays: string
  emptyMonthDaysShort: string
  emptyWeekDays: string
  emptyWeekDaysShort: string
  emptyHours: string
  emptyMinutes: string
  emptyMinutesForHourPeriod: string
  yearOption: string
  monthOption: string
  weekOption: string
  dayOption: string
  hourOption: string
  minuteOption: string
  rebootOption: string
  prefixPeriod: string
  prefixMonths: string
  prefixMonthDays: string
  prefixWeekDays: string
  prefixWeekDaysForMonthAndYearPeriod: string
  prefixHours: string
  prefixMinutes: string
  prefixMinutesForHourPeriod: string
  suffixMinutesForHourPeriod: string
  errorInvalidCron: string
  clearButtonText: string
  weekDays: string[]
  weekDaysMap?: WeekDayMap
  months: string[]
  monthsMap?: MonthMap
  altWeekDays: string[]
  altWeekDaysMap?: WeekDayMap
  altMonths: string[]
  altMonthsMap?: MonthMap
  aria: DefaultLocaleAria
}

export type SetValueFunction = (
  value: string,
  extra: { selectedPeriod: PeriodType },
) => void

export type SetValue =
  | SetValueFunction
  | Dispatch<SetStateAction<string>>
  | undefined

export type CronError =
  | {
      type: 'invalid_cron'
      description: string
    }
  | undefined

export type OnError =
  | ((error: CronError) => void)
  | Dispatch<SetStateAction<CronError>>
  | undefined

export type ClearButtonProps = Omit<
  ButtonHTMLAttributes<HTMLButtonElement>,
  'children' | 'onClick'
>

export type ClearButtonAction = 'empty' | 'fill-with-every'

export type PeriodType =
  | 'year'
  | 'month'
  | 'week'
  | 'day'
  | 'hour'
  | 'minute'
  | 'reboot'

export type AllowEmpty = 'always' | 'never' | 'for-default-value'

export type CronType =
  | 'period'
  | 'months'
  | 'month-days'
  | 'week-days'
  | 'hours'
  | 'minutes'

export type LeadingZeroType = 'month-days' | 'hours' | 'minutes'
export type LeadingZero = boolean | LeadingZeroType[]

export type ClockFormat = '24-hour-clock' | '12-hour-clock'

export type ShortcutsType =
  | '@yearly'
  | '@annually'
  | '@monthly'
  | '@weekly'
  | '@daily'
  | '@midnight'
  | '@hourly'
  | '@reboot'

export type Shortcuts = boolean | ShortcutsType[]
export type Mode = 'multiple' | 'single'

export type FilterOption = ({
  value,
  label,
}: {
  value: string
  label: string
}) => boolean

export type DropdownConfig = {
  humanizeLabels?: boolean
  humanizeValue?: boolean
  leadingZero?: boolean
  disabled?: boolean
  readOnly?: boolean
  allowClear?: boolean
  allowEmpty?: AllowEmpty
  periodicityOnDoubleClick?: boolean
  mode?: Mode
  filterOption?: FilterOption
}

export type DropdownsConfig = {
  period?: Pick<DropdownConfig, 'disabled' | 'readOnly'>
  months?: Omit<DropdownConfig, 'leadingZero'>
  'month-days'?: Omit<DropdownConfig, 'humanizeLabels' | 'humanizeValue'>
  'week-days'?: Omit<DropdownConfig, 'leadingZero'>
  hours?: Omit<DropdownConfig, 'humanizeLabels' | 'humanizeValue'>
  minutes?: Omit<DropdownConfig, 'humanizeLabels' | 'humanizeValue'>
}

export interface CronBuilderProps {
  value?: string
  onChange?: SetValueFunction
  setValue?: SetValue
  className?: string
  humanizeLabels?: boolean
  humanizeValue?: boolean
  leadingZero?: LeadingZero
  defaultPeriod?: PeriodType
  disabled?: boolean
  readOnly?: boolean
  allowClear?: boolean
  allowEmpty?: AllowEmpty
  shortcuts?: Shortcuts
  clockFormat?: ClockFormat
  clearButton?: boolean
  clearButtonProps?: ClearButtonProps
  clearButtonAction?: ClearButtonAction
  displayError?: boolean
  onError?: OnError
  periodicityOnDoubleClick?: boolean
  mode?: Mode
  allowedDropdowns?: CronType[]
  allowedPeriods?: PeriodType[]
  dropdownsConfig?: DropdownsConfig
  locale?: Locale
}

/** @deprecated Use `CronBuilderProps` instead. */
export type CronProps = CronBuilderProps

export type SetValueNumbersOrUndefined = Dispatch<
  SetStateAction<number[] | undefined>
>
export type SetValuePeriod = Dispatch<SetStateAction<PeriodType | undefined>>
export type SetInternalError = Dispatch<SetStateAction<boolean>>

export interface Unit {
  type: Exclude<CronType, 'period'>
  min: number
  max: number
  total: number
  alt?: string[]
}

export interface ShortcutsValues {
  name: Exclude<ShortcutsType, '@reboot'>
  value: string
}

export type ConverterParts = [number[], number[], number[], number[], number[]]
