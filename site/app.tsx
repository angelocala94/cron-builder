import * as React from 'react'

import { buttonVariants } from '@/components/ui/button'
import {
  Cron,
  type AllowEmpty,
  type ClockFormat,
  type CronError,
  type Mode,
} from '@/registry/new-york/components/cron-builder'
import { cn } from '@/lib/utils'

const PRESETS = [
  { label: 'Weekdays 5:30', value: '30 5 * * 1-5' },
  { label: 'Every hour', value: '0 * * * *' },
  { label: 'Monthly', value: '15 9 1 * *' },
  { label: '@reboot', value: '@reboot' },
] as const

const CLOCK_OPTIONS = [
  { label: '24h', value: '24-hour-clock' as ClockFormat },
  { label: '12h', value: '12-hour-clock' as ClockFormat },
] as const

const EMPTY_OPTIONS = [
  { label: 'Wildcard', value: 'always' as AllowEmpty },
  { label: 'Default', value: 'for-default-value' as AllowEmpty },
  { label: 'Never', value: 'never' as AllowEmpty },
] as const

const MODE_OPTIONS = [
  { label: 'Multi', value: 'multiple' as Mode },
  { label: 'Single', value: 'single' as Mode },
] as const

const LABEL_OPTIONS = [
  { label: 'Raw', value: 'raw' },
  { label: 'Humanized', value: 'humanized' },
] as const

type PropDef = {
  name: string
  type: string
  required?: boolean
  defaultValue?: string
  description: string
  example?: string
}

type PropGroup = {
  title: string
  description?: string
  props: readonly PropDef[]
}

const PROP_GROUPS: readonly PropGroup[] = [
  {
    title: 'Core',
    description:
      'The controlled contract — what goes in, what comes out. One of setValue or onChange is required.',
    props: [
      {
        name: 'value',
        type: 'string',
        required: true,
        description:
          'The current cron expression. Accepts the classic five-field POSIX format (minute hour day-of-month month day-of-week) and shortcuts like @hourly, @daily, @reboot.',
      },
      {
        name: 'setValue',
        type: '(value: string) => void',
        description:
          'Optional controlled callback when you only need the next cron string. Provide this or onChange.',
      },
      {
        name: 'onChange',
        type: '(value, { selectedPeriod }) => void',
        description:
          'Alternative to setValue that also reports the currently selected period ("year", "month", "week", "day", "hour", "minute", "reboot"). Provide this or setValue. Use it when you need to react to period changes explicitly.',
        example: `<Cron
  value={value}
  onChange={(nextValue, { selectedPeriod }) => {
    setValue(nextValue)
    setSelectedPeriod(selectedPeriod)
  }}
/>`,
      },
      {
        name: 'className',
        type: 'string',
        description:
          'Extra classes merged onto the root element. Use it to tweak spacing, width or background from your theme.',
      },
    ],
  },
  {
    title: 'Selection',
    description:
      'Control how values are picked inside each dropdown and which presets appear at the top.',
    props: [
      {
        name: 'mode',
        type: "'multiple' | 'single'",
        defaultValue: "'multiple'",
        description:
          'In "multiple" mode every dropdown can hold several values — e.g. weekdays = Mon, Wed, Fri. In "single" mode each dropdown is restricted to one value at a time, which is handy when your scheduler only accepts a single entry per field.',
      },
      {
        name: 'allowEmpty',
        type: "'always' | 'never' | 'for-default-value'",
        defaultValue: "'for-default-value'",
        description:
          'Controls when a field is allowed to stay on the wildcard (*). "always" keeps the wildcard available at any time. "never" forces the user to pick an explicit value. "for-default-value" (the default) allows the wildcard only while the cron still matches the initial default.',
      },
      {
        name: 'shortcuts',
        type: 'boolean | ShortcutsType[]',
        defaultValue:
          "['@yearly', '@annually', '@monthly', '@weekly', '@daily', '@midnight', '@hourly']",
        description:
          'Which @-shortcuts the component accepts as input for value (they get expanded internally) and whether @reboot appears as a period option. Pass true to accept every shortcut including @reboot, false to disable all shortcuts, or an array to restrict explicitly.',
        example: `<Cron
  value={value}
  setValue={setValue}
  shortcuts={['@daily', '@hourly']}
/>`,
      },
      {
        name: 'defaultPeriod',
        type: "'year' | 'month' | 'week' | 'day' | 'hour' | 'minute' | 'reboot'",
        defaultValue: "'day'",
        description:
          'Period selected when value is empty, and tie-breaker for cron strings compatible with several periods (e.g. "10 10 * * *" fits day, week, month or year). Re-evaluated when the prop changes at runtime.',
      },
      {
        name: 'allowedPeriods',
        type: 'PeriodType[]',
        defaultValue: 'all periods',
        description:
          'Restrict the list of selectable periods — useful when your backend only accepts, say, hourly or daily schedules.',
      },
      {
        name: 'allowedDropdowns',
        type: 'CronType[]',
        defaultValue: 'all dropdowns',
        description:
          "Hide specific dropdowns. Accepts 'period', 'months', 'month-days', 'week-days', 'hours', 'minutes'.",
      },
      {
        name: 'allowClear',
        type: 'boolean',
        defaultValue: 'true',
        description:
          'Shows a small clear button inside each field dropdown, letting the user reset that single field back to the wildcard without touching the others.',
      },
      {
        name: 'periodicityOnDoubleClick',
        type: 'boolean',
        defaultValue: 'true',
        description:
          'When true, double-clicking a numeric option (e.g. "5" under minutes) builds an every-N schedule for that field (every 5 minutes). While enabled, the component keeps a short click window to distinguish a real double click from a single selection. Disable it for immediate option clicks — step expressions then have to be composed by picking each value individually.',
      },
    ],
  },
  {
    title: 'Display',
    description:
      'Tweak how values and labels are rendered inside the dropdowns.',
    props: [
      {
        name: 'clockFormat',
        type: "'24-hour-clock' | '12-hour-clock'",
        defaultValue: "'24-hour-clock'",
        description:
          'How the hour and minute dropdowns render. In 24-hour mode hours and minutes are zero-padded ("05", "17", "03"); in 12-hour mode hours show AM/PM labels ("5AM", "8PM").',
      },
      {
        name: 'humanizeValue',
        type: 'boolean',
        defaultValue: 'false',
        description:
          'Renders selected month and weekday values as labels ("Jan", "Mon") instead of their numeric indices. Labels come from the current locale.',
      },
      {
        name: 'humanizeLabels',
        type: 'boolean',
        defaultValue: 'true',
        description:
          'Uses friendly labels inside the option list of month and weekday dropdowns. Set it to false to show raw numbers.',
      },
      {
        name: 'leadingZero',
        type: "boolean | ('month-days' | 'hours' | 'minutes')[]",
        defaultValue: 'false',
        description:
          'Prefixes numeric values with a leading zero ("01", "02"…). Accepts a boolean to toggle it globally or an array to target specific fields. Note: hours and minutes are already padded when clockFormat is "24-hour-clock" (the default), so this prop is mostly useful for month-days.',
      },
    ],
  },
  {
    title: 'Clear button',
    description:
      'The inline action that resets the expression. Enabled by default; hide it when your UI already exposes its own reset.',
    props: [
      {
        name: 'clearButton',
        type: 'boolean',
        defaultValue: 'true',
        description:
          'Shows the inline clear button next to the expression. Disable it if your UI already exposes an external reset action.',
      },
      {
        name: 'clearButtonAction',
        type: "'empty' | 'fill-with-every'",
        defaultValue: "'fill-with-every'",
        description:
          'What the Clear button emits. "empty" emits an empty string (""); "fill-with-every" emits "* * * * *" — every field explicitly wildcarded.',
      },
      {
        name: 'clearButtonProps',
        type: 'ButtonHTMLAttributes',
        description:
          'Forwarded to the underlying button — use it to pass className, aria-label, data-* attributes.',
      },
    ],
  },
  {
    title: 'State',
    description:
      'Disable editing, lock the current value, or observe validation errors.',
    props: [
      {
        name: 'disabled',
        type: 'boolean',
        defaultValue: 'false',
        description: 'Fully disables every control and dims the component.',
      },
      {
        name: 'readOnly',
        type: 'boolean',
        defaultValue: 'false',
        description:
          'Locks the current value without dimming the component. Useful when a scheduled job is already running and must not be edited.',
      },
      {
        name: 'displayError',
        type: 'boolean',
        defaultValue: 'true',
        description:
          'Shows the built-in inline error state when the current value cannot be parsed. Turn it off if you render your own error UI via onError.',
      },
      {
        name: 'onError',
        type: '(error: CronError) => void',
        description:
          'Fires when the current cron string can\'t be parsed. Receives { type: "invalid_cron", description } while invalid, and undefined as soon as the value becomes valid again.',
        example: `<Cron
  value={value}
  setValue={setValue}
  onError={(error) => {
    if (error) setErrorMessage(error.description)
    else setErrorMessage(null)
  }}
/>`,
      },
    ],
  },
  {
    title: 'Advanced',
    description:
      "Per-dropdown overrides for when you need different behavior in a single field (e.g. read-only minutes, clearable hours). Any option set here wins over the matching top-level prop.",
    props: [
      {
        name: 'dropdownsConfig',
        type: 'DropdownsConfig',
        description:
          'An object keyed by dropdown name. The period entry supports only disabled and readOnly. Months and week-days support humanizeLabels/humanizeValue, allowClear, allowEmpty, mode, periodicityOnDoubleClick and filterOption. Month-days, hours and minutes support leadingZero, allowClear, allowEmpty, mode, periodicityOnDoubleClick and filterOption. Unspecified fields fall back to the top-level prop value.',
        example: `<Cron
  value={value}
  setValue={setValue}
  dropdownsConfig={{
    period: { readOnly: true },
    minutes: {
      mode: 'single',
      leadingZero: true,
      allowEmpty: 'never',
      filterOption: ({ value }) => Number(value) < 30,
    },
    'week-days': {
      humanizeLabels: false,
      allowEmpty: 'never',
    },
  }}
/>`,
      },
    ],
  },
  {
    title: 'Internationalization',
    description:
      'Override any user-facing string. Missing keys fall back to the built-in English locale.',
    props: [
      {
        name: 'locale',
        type: 'Locale',
        defaultValue: 'DEFAULT_LOCALE_EN',
        description:
          'Pass a subset of the Locale keys — all labels, prefixes, placeholders, week-day and month arrays or keyed maps, plus the invalid-cron error message. Accessibility labels live under locale.aria. Anything you omit keeps the default English copy.',
        example: `<Cron
  value={value}
  setValue={setValue}
  locale={{
    everyText: 'ogni',
    emptyHours: 'ogni ora',
    emptyMinutes: 'ogni minuto',
    prefixMonthDays: 'il',
    prefixHours: 'alle',
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
    errorInvalidCron: 'Cron non valido',
    aria: {
      clearField: 'Cancella campo',
      periodOptions: 'Opzioni del periodo',
      monthsOptions: 'Opzioni dei mesi',
      monthDaysOptions: 'Opzioni dei giorni del mese',
      weekDaysOptions: 'Opzioni dei giorni della settimana',
      hoursOptions: 'Opzioni delle ore',
      minutesOptions: 'Opzioni dei minuti',
    },
  }}
/>`,
      },
    ],
  },
]

function CheckIcon() {
  return (
    <svg
      width='14'
      height='14'
      viewBox='0 0 24 24'
      fill='none'
      stroke='currentColor'
      strokeWidth='2.5'
      strokeLinecap='round'
      strokeLinejoin='round'
      aria-hidden='true'
    >
      <polyline points='20 6 9 17 4 12' />
    </svg>
  )
}

function SparkleIcon() {
  return (
    <svg
      width='18'
      height='18'
      viewBox='0 0 24 24'
      fill='none'
      stroke='currentColor'
      strokeWidth='1.8'
      strokeLinecap='round'
      strokeLinejoin='round'
      aria-hidden='true'
    >
      <path d='M9.937 15.5A2 2 0 0 0 8.5 14.063l-6.135-1.582a.5.5 0 0 1 0-.962L8.5 9.936A2 2 0 0 0 9.937 8.5l1.582-6.135a.5.5 0 0 1 .963 0L14.063 8.5A2 2 0 0 0 15.5 9.937l6.135 1.581a.5.5 0 0 1 0 .964L15.5 14.063a2 2 0 0 0-1.437 1.437l-1.582 6.135a.5.5 0 0 1-.963 0z' />
      <path d='M20 3v4' />
      <path d='M22 5h-4' />
      <path d='M4 17v2' />
      <path d='M5 18H3' />
    </svg>
  )
}

function ClipboardIcon() {
  return (
    <svg
      width='14'
      height='14'
      viewBox='0 0 24 24'
      fill='none'
      stroke='currentColor'
      strokeWidth='2'
      strokeLinecap='round'
      strokeLinejoin='round'
      aria-hidden='true'
    >
      <rect width='8' height='4' x='8' y='2' rx='1' />
      <path d='M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2' />
    </svg>
  )
}

function GithubIcon() {
  return (
    <svg
      width='18'
      height='18'
      viewBox='0 0 24 24'
      fill='currentColor'
      aria-hidden='true'
    >
      <path d='M12 0C5.37 0 0 5.37 0 12c0 5.3 3.44 9.8 8.2 11.38.6.11.82-.26.82-.58v-2.03c-3.34.73-4.04-1.61-4.04-1.61-.55-1.39-1.34-1.76-1.34-1.76-1.09-.74.08-.73.08-.73 1.21.08 1.84 1.24 1.84 1.24 1.07 1.84 2.81 1.31 3.5 1 .11-.78.42-1.31.76-1.61-2.67-.3-5.47-1.33-5.47-5.93 0-1.31.47-2.38 1.24-3.22-.12-.3-.54-1.52.12-3.18 0 0 1.01-.32 3.3 1.23a11.5 11.5 0 016 0c2.29-1.55 3.3-1.23 3.3-1.23.66 1.66.24 2.88.12 3.18.77.84 1.24 1.91 1.24 3.22 0 4.61-2.81 5.62-5.48 5.92.43.37.81 1.1.81 2.22v3.29c0 .32.22.7.83.58C20.57 21.8 24 17.3 24 12c0-6.63-5.37-12-12-12z' />
    </svg>
  )
}

function useCopy(value: string) {
  const [copied, setCopied] = React.useState(false)
  const handleCopy = React.useCallback(async () => {
    try {
      await navigator.clipboard.writeText(value)
      setCopied(true)
      window.setTimeout(() => setCopied(false), 1400)
    } catch {
      /* clipboard API unavailable */
    }
  }, [value])
  return { copied, handleCopy }
}

function TerminalCommand({ value }: { value: string }) {
  const { copied, handleCopy } = useCopy(value)
  return (
    <div className='terminal-snippet group relative overflow-hidden rounded-2xl'>
      <pre className='overflow-x-auto px-4 py-3 pr-14 font-mono text-sm leading-6 text-left'>
        <code>
          <span className='terminal-prompt'>$</span> {value}
        </code>
      </pre>
      <button
        onClick={handleCopy}
        className='terminal-copy-btn absolute right-2 top-1/2 inline-flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:text-foreground'
        aria-label={copied ? 'Copied' : 'Copy command'}
        type='button'
      >
        {copied ? <CheckIcon /> : <ClipboardIcon />}
      </button>
    </div>
  )
}

function CodeBlock({ code }: { code: string }) {
  const { copied, handleCopy } = useCopy(code)
  return (
    <div className='terminal-snippet relative overflow-hidden rounded-2xl'>
      <pre className='overflow-x-auto px-4 py-4 pr-14 font-mono text-sm leading-6 text-left'>
        <code>{code}</code>
      </pre>
      <button
        onClick={handleCopy}
        className='terminal-copy-btn absolute right-2 top-2 inline-flex h-8 w-8 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:text-foreground'
        aria-label={copied ? 'Copied' : 'Copy code'}
        type='button'
      >
        {copied ? <CheckIcon /> : <ClipboardIcon />}
      </button>
    </div>
  )
}

function SegmentedControl<T extends string>({
  label,
  onChange,
  options,
  value,
}: {
  label: string
  onChange: (value: T) => void
  options: readonly { label: string; value: T }[]
  value: T
}) {
  return (
    <div className='flex items-center justify-between gap-4'>
      <span className='text-[0.68rem] font-semibold uppercase tracking-[0.22em] text-muted-foreground'>
        {label}
      </span>
      <div className='segmented inline-flex items-center rounded-full border border-border/60 bg-background/60 p-0.5'>
        {options.map((option) => {
          const active = value === option.value
          return (
            <button
              key={option.value}
              onClick={() => onChange(option.value)}
              className={cn(
                'rounded-full px-3 py-1 text-xs font-medium transition-colors',
                active
                  ? 'bg-primary text-primary-foreground shadow-sm'
                  : 'text-muted-foreground hover:text-foreground',
              )}
              type='button'
            >
              {option.label}
            </button>
          )
        })}
      </div>
    </div>
  )
}

function OutputBar({ value }: { value: string }) {
  const { copied, handleCopy } = useCopy(value)
  return (
    <div className='flex flex-wrap items-center gap-3 rounded-2xl border border-border/70 bg-background/40 px-4 py-3'>
      <span className='text-[0.65rem] font-semibold uppercase tracking-[0.28em] text-muted-foreground'>
        Output
      </span>
      <code className='flex-1 font-mono text-sm text-foreground'>{value}</code>
      <button
        onClick={handleCopy}
        type='button'
        className='inline-flex items-center gap-1.5 rounded-lg border border-border/60 bg-background/60 px-2.5 py-1 text-xs font-medium text-muted-foreground transition-colors hover:text-foreground'
        aria-label={copied ? 'Copied' : 'Copy output'}
      >
        {copied ? <CheckIcon /> : <ClipboardIcon />}
        <span>{copied ? 'Copied' : 'Copy'}</span>
      </button>
    </div>
  )
}

function LlmsCard({ url }: { url: string }) {
  const { copied, handleCopy } = useCopy(url)
  return (
    <aside className='llms-card relative overflow-hidden rounded-2xl border border-border/60 p-5 sm:p-6'>
      <div className='flex flex-wrap items-start gap-4 sm:flex-nowrap'>
        <div className='llms-icon flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-primary'>
          <SparkleIcon />
        </div>
        <div className='grid min-w-0 flex-1 gap-1'>
          <p className='text-sm font-semibold text-foreground'>
            Integrating with AI agents?
          </p>
          <p className='text-sm leading-6 text-muted-foreground'>
            Copy the full docs in a single markdown file tuned for LLMs — paste
            it into Claude, ChatGPT, Cursor or any other agent and let it wire
            the component up for you.
          </p>
        </div>
      </div>

      <div className='mt-4 flex flex-wrap items-center gap-2 sm:pl-[3.5rem]'>
        <div className='terminal-snippet relative flex-1 min-w-0 overflow-hidden rounded-xl'>
          <pre className='overflow-x-auto px-3 py-2 pr-12 font-mono text-xs leading-5 text-left sm:text-sm'>
            <code>{url}</code>
          </pre>
          <button
            onClick={handleCopy}
            type='button'
            className='terminal-copy-btn absolute right-1.5 top-1/2 inline-flex h-7 w-7 -translate-y-1/2 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:text-foreground'
            aria-label={copied ? 'Copied' : 'Copy llms.txt URL'}
          >
            {copied ? <CheckIcon /> : <ClipboardIcon />}
          </button>
        </div>
        <a
          href={url}
          target='_blank'
          rel='noopener'
          className='inline-flex items-center gap-1.5 rounded-xl border border-border/60 bg-background/40 px-3 py-2 text-xs font-medium text-muted-foreground transition-colors hover:text-foreground'
        >
          Open
          <svg
            width='12'
            height='12'
            viewBox='0 0 24 24'
            fill='none'
            stroke='currentColor'
            strokeWidth='2'
            strokeLinecap='round'
            strokeLinejoin='round'
            aria-hidden='true'
          >
            <path d='M7 17L17 7' />
            <path d='M7 7h10v10' />
          </svg>
        </a>
      </div>
    </aside>
  )
}

function PropDoc({
  name,
  type,
  required,
  defaultValue,
  description,
  example,
}: PropDef) {
  return (
    <article className='prop-doc grid grid-cols-[minmax(0,_1fr)] gap-3 rounded-2xl border border-border/60 p-5'>
      <header className='flex flex-wrap items-center gap-2'>
        <code className='font-mono text-base font-semibold text-foreground'>
          {name}
        </code>
        {required ? (
          <span className='prop-required'>required</span>
        ) : (
          <span className='prop-optional'>optional</span>
        )}
      </header>

      <dl className='flex flex-wrap items-center gap-x-4 gap-y-2 text-xs'>
        <div className='flex items-center gap-1.5'>
          <dt className='prop-meta-label'>type</dt>
          <dd className='prop-meta-value'>{type}</dd>
        </div>
        {defaultValue && (
          <div className='flex items-center gap-1.5'>
            <dt className='prop-meta-label'>default</dt>
            <dd className='prop-meta-value'>{defaultValue}</dd>
          </div>
        )}
      </dl>

      <p className='text-sm leading-6 text-muted-foreground'>{description}</p>

      {example && (
        <div className='pt-1'>
          <CodeBlock code={example} />
        </div>
      )}
    </article>
  )
}

function PropGroupSection({ group }: { group: PropGroup }) {
  return (
    <section className='grid grid-cols-[minmax(0,_1fr)] gap-5'>
      <header className='grid gap-1 border-b border-border/50 pb-3'>
        <div className='flex items-baseline justify-between gap-4'>
          <h3 className='text-xl font-semibold tracking-[-0.01em] text-foreground'>
            {group.title}
          </h3>
          <span className='text-xs text-muted-foreground'>
            {group.props.length}{' '}
            {group.props.length === 1 ? 'prop' : 'props'}
          </span>
        </div>
        {group.description && (
          <p className='text-sm leading-6 text-muted-foreground'>
            {group.description}
          </p>
        )}
      </header>
      <div className='grid grid-cols-[minmax(0,_1fr)] gap-4'>
        {group.props.map((p) => (
          <PropDoc key={p.name} {...p} />
        ))}
      </div>
    </section>
  )
}

const SITE_URL = 'https://angelocala94.github.io/cron-builder/'

export function App() {
  const [value, setValue] = React.useState('30 5 * * 1-5')
  const [clockFormat, setClockFormat] =
    React.useState<ClockFormat>('24-hour-clock')
  const [mode, setMode] = React.useState<Mode>('multiple')
  const [allowEmpty, setAllowEmpty] = React.useState<AllowEmpty>('always')
  const [humanizeValue, setHumanizeValue] = React.useState(false)
  const [error, setError] = React.useState<CronError>(undefined)

  const siteUrl = React.useMemo(() => SITE_URL, [])
  const registryRoot = React.useMemo(
    () => (siteUrl.endsWith('/') ? siteUrl : `${siteUrl}/`),
    [siteUrl],
  )
  const directItemUrl = `${registryRoot}r/cron-builder.json`
  const installDirectCmd = `pnpm dlx shadcn@latest add ${directItemUrl}`
  const llmsUrl = `${registryRoot}llms.txt`

  const usageSnippet = `import * as React from 'react'
import { Cron } from '@/components/cron-builder'

export function Schedule() {
  const [value, setValue] = React.useState('30 5 * * 1-5')
  return <Cron value={value} setValue={setValue} />
}`

  return (
    <div className='site-shell relative overflow-x-clip'>
      <div className='hero-orb hero-orb-left absolute left-[-12rem] top-[4rem] h-[26rem] w-[26rem] rounded-full blur-3xl' />
      <div className='hero-orb hero-orb-right absolute right-[-8rem] top-[2rem] h-[24rem] w-[24rem] rounded-full blur-3xl' />
      <div className='hero-grid absolute inset-x-0 top-0 h-[34rem]' />

      <main className='relative mx-auto flex min-h-screen w-full max-w-6xl flex-col px-5 pb-10 pt-12 sm:px-8 sm:pt-20 lg:px-10'>
        <section className='relative z-20 flex flex-col items-center gap-7 pb-20 text-center'>
          <h1 className='text-balance text-5xl font-semibold tracking-[-0.05em] sm:text-6xl lg:text-7xl'>
            Cron, the shadcn way.
          </h1>
          <p className='mx-auto max-w-xl text-base leading-7 text-muted-foreground sm:text-lg sm:leading-8'>
            Drop-in React editor for cron expressions. One command to install,
            themed with your tokens, fully typed.
          </p>

          <div className='flex flex-wrap justify-center gap-3'>
            <a
              className={cn(
                buttonVariants({ variant: 'default' }),
                'shadow-lg shadow-primary/20',
              )}
              href='#demo'
            >
              Try the demo
            </a>
            <a
              className={buttonVariants({ variant: 'outline' })}
              href='#usage'
            >
              How to use
            </a>
            <a
              aria-label='View source on GitHub'
              className={cn(buttonVariants({ variant: 'outline' }), 'gap-2')}
              href='https://github.com/angelocala94/cron-builder'
              rel='noopener noreferrer'
              target='_blank'
            >
              <GithubIcon />
              GitHub
            </a>
          </div>

          <div className='w-full max-w-4xl pt-2'>
            <TerminalCommand value={installDirectCmd} />
          </div>
        </section>

        <section id='demo' className='relative z-20 grid gap-8 pb-24'>
          <div className='grid max-w-2xl gap-3'>
            <h2 className='text-3xl font-semibold tracking-[-0.02em] sm:text-4xl'>
              Play with it
            </h2>
            <p className='text-base leading-7 text-muted-foreground'>
              Pick a preset or tune the settings. The cron updates as you go.
            </p>
          </div>

          <div className='demo-shell'>
            <div className='demo-halo absolute inset-0 rounded-[2rem]' />
            <div className='surface-panel relative z-10 grid gap-5 p-5 sm:p-6'>
              <div className='flex flex-wrap items-center gap-2'>
                <span className='mr-1 text-[0.65rem] font-semibold uppercase tracking-[0.28em] text-muted-foreground'>
                  Presets
                </span>
                {PRESETS.map((preset) => {
                  const active = value === preset.value
                  return (
                    <button
                      key={preset.label}
                      onClick={() => setValue(preset.value)}
                      type='button'
                      className={cn(
                        'preset-chip rounded-full border px-3 py-1 text-xs font-medium transition-colors',
                        active
                          ? 'border-primary/60 bg-primary text-primary-foreground shadow-sm'
                          : 'border-border/70 bg-background/40 text-muted-foreground hover:bg-background/70 hover:text-foreground',
                      )}
                    >
                      {preset.label}
                    </button>
                  )
                })}
              </div>

              <div className='demo-card rounded-[1.5rem] border border-border/70 p-4 shadow-[0_24px_80px_-36px_rgba(0,0,0,0.7)] sm:p-5'>
                <Cron
                  allowEmpty={allowEmpty}
                  clearButtonAction='fill-with-every'
                  clockFormat={clockFormat}
                  humanizeValue={humanizeValue}
                  mode={mode}
                  onError={setError}
                  setValue={setValue}
                  shortcuts={true}
                  value={value}
                />
              </div>

              <OutputBar value={value} />

              <div className='settings-grid grid gap-3 rounded-2xl border border-border/70 bg-background/40 p-4 sm:grid-cols-2 sm:gap-x-6'>
                <SegmentedControl
                  label='Clock'
                  onChange={setClockFormat}
                  options={CLOCK_OPTIONS}
                  value={clockFormat}
                />
                <SegmentedControl
                  label='Mode'
                  onChange={setMode}
                  options={MODE_OPTIONS}
                  value={mode}
                />
                <SegmentedControl
                  label='Empty'
                  onChange={setAllowEmpty}
                  options={EMPTY_OPTIONS}
                  value={allowEmpty}
                />
                <SegmentedControl
                  label='Labels'
                  onChange={(next) => setHumanizeValue(next === 'humanized')}
                  options={LABEL_OPTIONS}
                  value={humanizeValue ? 'humanized' : 'raw'}
                />
              </div>

              {error && (
                <p className='text-xs leading-6 text-destructive'>
                  {error.description}
                </p>
              )}
            </div>
          </div>
        </section>

        <section
          id='usage'
          className='relative z-10 grid grid-cols-[minmax(0,_1fr)] gap-12 pb-20'
        >
          <div className='grid max-w-2xl gap-3'>
            <h2 className='text-3xl font-semibold tracking-[-0.02em] sm:text-4xl'>
              How to use
            </h2>
            <p className='text-base leading-7 text-muted-foreground'>
              Fully controlled — pass a cron string in, receive one back.
              Start minimal, then tune any of the props below to match your
              scheduler and your UI.
            </p>
          </div>

          <CodeBlock code={usageSnippet} />

          <LlmsCard url={llmsUrl} />

          <div className='grid gap-3 border-t border-border/50 pt-10'>
            <h3 className='text-2xl font-semibold tracking-[-0.02em] text-foreground sm:text-3xl'>
              Props reference
            </h3>
            <p className='max-w-2xl text-sm leading-6 text-muted-foreground'>
              Everything you can pass to the Cron component, grouped by what
              it controls. All props are optional unless marked otherwise.
            </p>
          </div>

          <div className='grid grid-cols-[minmax(0,_1fr)] gap-12'>
            {PROP_GROUPS.map((group) => (
              <PropGroupSection key={group.title} group={group} />
            ))}
          </div>
        </section>

        <footer className='flex flex-wrap items-center justify-center gap-x-2 gap-y-1 pb-2 pt-6 text-center text-xs text-muted-foreground'>
          <span>
            Heavily inspired by{' '}
            <a
              href='https://github.com/xrutayisire/react-js-cron'
              target='_blank'
              rel='noopener noreferrer'
              className='underline decoration-muted-foreground/40 underline-offset-4 transition-colors hover:text-foreground hover:decoration-foreground/60'
            >
              react-js-cron
            </a>
          </span>
          <span aria-hidden='true'>·</span>
          <span>MIT License</span>
        </footer>
      </main>
    </div>
  )
}
