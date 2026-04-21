import { screen, waitFor, within } from '@testing-library/dom'
import { render } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { useState } from 'react'

import { Cron } from '@/registry/new-york/components/cron-builder'

describe('Cron editor flows', () => {
  it('lets the user broaden a schedule from minute granularity to a yearly one', async () => {
    const user = userEvent.setup()

    render(<Cron setValue={vi.fn()} value='* * * * *' />)

    await user.click(screen.getByTestId('select-period'))
    await user.click(screen.getByRole('option', { name: 'year' }))

    await waitFor(() => {
      expect(screen.getByTestId('select-period')).toHaveTextContent('year')
      expect(screen.getByTestId('custom-select-months')).toHaveTextContent(
        'every month',
      )
      expect(screen.getByTestId('custom-select-month-days')).toHaveTextContent(
        'every day of the month',
      )
      expect(screen.getByTestId('custom-select-week-days')).toHaveTextContent(
        'every day of the week',
      )
    })
  })

  it('updates a multi-value selection from the inline field panel', async () => {
    const user = userEvent.setup()

    render(<Cron setValue={vi.fn()} value='1,4 * * * *' />)

    await user.click(screen.getByRole('button', { name: /01,04/i }))
    await user.click(screen.getByRole('option', { name: '59' }))

    await waitFor(() => {
      expect(screen.getByTestId('custom-select-minutes')).toHaveTextContent(
        '01,04,59',
      )
    })
  })

  it('supports cadence gestures through double click on a field option', async () => {
    const user = userEvent.setup()

    render(<Cron setValue={vi.fn()} value='1,4 * * * *' />)

    await user.click(screen.getByRole('button', { name: /01,04/i }))
    await user.dblClick(screen.getByRole('option', { name: '02' }))

    await waitFor(() => {
      expect(screen.getByTestId('custom-select-minutes')).toHaveTextContent(
        'every 2',
      )
    })
  })

  it('navigates the period listbox with arrow keys and activates with Enter', async () => {
    const user = userEvent.setup()
    const setValue = vi.fn()

    render(<Cron setValue={setValue} value='* * * * *' />)

    await user.click(screen.getByTestId('select-period'))

    await waitFor(() => {
      expect(screen.getByRole('option', { name: 'minute' })).toHaveFocus()
    })

    await user.keyboard('{ArrowUp}')
    await waitFor(() => {
      expect(screen.getByRole('option', { name: 'hour' })).toHaveFocus()
    })

    await user.keyboard('{Home}')
    await waitFor(() => {
      expect(screen.getByRole('option', { name: 'year' })).toHaveFocus()
    })

    await user.keyboard('{End}')
    await waitFor(() => {
      expect(screen.getByRole('option', { name: 'minute' })).toHaveFocus()
    })

    await user.keyboard('{ArrowUp}{Enter}')

    await waitFor(() => {
      expect(screen.getByTestId('select-period')).toHaveTextContent('hour')
    })
  })

  it('navigates a grid field listbox with arrow keys across rows and columns', async () => {
    const user = userEvent.setup()

    render(<Cron setValue={vi.fn()} value='5 * * * *' />)

    await user.click(screen.getByRole('button', { name: /05/ }))

    await waitFor(() => {
      expect(screen.getByRole('option', { name: '05' })).toHaveFocus()
    })

    await user.keyboard('{ArrowRight}')
    await waitFor(() => {
      expect(screen.getByRole('option', { name: '06' })).toHaveFocus()
    })

    await user.keyboard('{ArrowDown}')
    await waitFor(() => {
      expect(screen.getByRole('option', { name: '11' })).toHaveFocus()
    })

    await user.keyboard('{ArrowLeft}')
    await waitFor(() => {
      expect(screen.getByRole('option', { name: '10' })).toHaveFocus()
    })

    await user.keyboard('{ArrowUp}')
    await waitFor(() => {
      expect(screen.getByRole('option', { name: '05' })).toHaveFocus()
    })
  })

  it('applies option clicks immediately when double-click cadence is disabled', async () => {
    const user = userEvent.setup()
    const setValue = vi.fn()

    render(
      <Cron
        periodicityOnDoubleClick={false}
        setValue={setValue}
        value='1,4 * * * *'
      />,
    )

    await user.click(screen.getByRole('button', { name: /01,04/i }))
    await user.click(screen.getByRole('option', { name: '59' }))

    expect(setValue).toHaveBeenLastCalledWith('1,4,59 * * * *', {
      selectedPeriod: 'hour',
    })
  })

  it('localizes accessibility labels through locale.aria', async () => {
    const user = userEvent.setup()

    render(
      <Cron
        locale={{
          aria: {
            clearField: 'Cancella campo',
            minutesOptions: 'Opzioni dei minuti',
            periodOptions: 'Opzioni del periodo',
          },
        }}
        setValue={vi.fn()}
        value='1,4 * * * *'
      />,
    )

    await user.click(screen.getByRole('button', { name: /01,04/i }))

    await waitFor(() => {
      expect(
        screen.getByRole('button', { name: 'Cancella campo' }),
      ).toBeInTheDocument()
      expect(
        screen.getByRole('listbox', { name: 'Opzioni dei minuti' }),
      ).toBeInTheDocument()
    })

    await user.click(screen.getByTestId('select-period'))

    await waitFor(() => {
      expect(
        screen.getByRole('listbox', { name: 'Opzioni del periodo' }),
      ).toBeInTheDocument()
    })
  })

  it('supports fully controlled usage through onChange alone', async () => {
    const user = userEvent.setup()
    const onChange = vi.fn()

    function Wrapper() {
      const [value, setValue] = useState('* * * * *')

      return (
        <Cron
          onChange={(nextValue, extra) => {
            onChange(nextValue, extra)
            setValue(nextValue)
          }}
          value={value}
        />
      )
    }

    render(<Wrapper />)

    await user.click(screen.getByTestId('select-period'))
    await user.click(screen.getByRole('option', { name: 'year' }))

    await waitFor(() => {
      expect(onChange).toHaveBeenLastCalledWith('* * * * *', {
        selectedPeriod: 'year',
      })
      expect(screen.getByTestId('select-period')).toHaveTextContent('year')
    })
  })
})

describe('Cron reset and safety behaviour', () => {
  it('resets to a wildcard cron by default and can also reset to an empty value', async () => {
    const user = userEvent.setup()
    const setWildcard = vi.fn()
    const setEmpty = vi.fn()

    const { rerender } = render(<Cron setValue={setWildcard} value='1 1 1 1 1' />)

    await user.click(screen.getByRole('button', { name: 'Clear' }))

    await waitFor(() => {
      expect(setWildcard).toHaveBeenNthCalledWith(2, '* * * * *', {
        selectedPeriod: 'year',
      })
    })

    rerender(
      <Cron clearButtonAction='empty' setValue={setEmpty} value='1 1 1 1 1' />,
    )

    await user.click(screen.getByRole('button', { name: 'Clear' }))

    await waitFor(() => {
      expect(setEmpty).toHaveBeenNthCalledWith(2, '', {
        selectedPeriod: 'year',
      })
    })
  })

  it('keeps panels non-interactive when the component is read only', async () => {
    const user = userEvent.setup()

    render(<Cron readOnly setValue={vi.fn()} value='1,4 * * * *' />)

    await user.click(screen.getByRole('button', { name: /01,04/i }))

    await waitFor(() => {
      expect(
        screen.queryByRole('button', { name: '59' }),
      ).not.toBeInTheDocument()
    })
  })

  it('stays render-stable even if dropdown configuration is recreated inline', async () => {
    const renderCount = { current: 0 }

    function Wrapper() {
      const [value, setValue] = useState('* * 1 * *')
      renderCount.current += 1

      return (
        <Cron
          dropdownsConfig={{
            'month-days': {
              mode: 'single',
            },
          }}
          setValue={setValue}
          value={value}
        />
      )
    }

    render(<Wrapper />)

    await waitFor(() => {
      expect(screen.getByTestId('select-period')).toBeVisible()
    })

    expect(renderCount.current).toBeLessThan(20)
  })
})

describe('Cron field filtering', () => {
  it('filters out disallowed minute and weekday options from the current panels', async () => {
    const user = userEvent.setup()

    render(
      <Cron
        dropdownsConfig={{
          minutes: {
            filterOption: ({ value }) => Number(value) < 58,
          },
          'week-days': {
            filterOption: ({ value }) => Number(value) !== 0,
          },
        }}
        setValue={vi.fn()}
        value='4,6 * * * 1'
      />,
    )

    await user.click(screen.getByRole('button', { name: /04,06/i }))

    await waitFor(() => {
      expect(screen.getByRole('option', { name: '57' })).toBeInTheDocument()
      expect(
        screen.queryByRole('option', { name: '58' }),
      ).not.toBeInTheDocument()
      expect(
        screen.queryByRole('option', { name: '59' }),
      ).not.toBeInTheDocument()
    })

    await user.click(
      within(screen.getByTestId('custom-select-week-days')).getByRole('button', {
        name: /MON/i,
      }),
    )

    await waitFor(() => {
      expect(
        screen.queryByRole('option', { name: 'Sunday' }),
      ).not.toBeInTheDocument()
      expect(screen.getByRole('option', { name: 'Monday' })).toBeInTheDocument()
    })
  })

  it('shows per-field clear actions by default when a field has a value', async () => {
    const user = userEvent.setup()

    render(<Cron setValue={vi.fn()} value='1,4 * * * *' />)

    await user.click(screen.getByRole('button', { name: /01,04/i }))

    await waitFor(() => {
      expect(
        screen.getByRole('button', { name: 'Clear field' }),
      ).toBeInTheDocument()
    })
  })
})
