'use client';

import Link from 'next/link';
import { useMemo, useState } from 'react';
import { ThemeToggle } from '@/components/theme-toggle';
import {
  CRON_DOC_LINES,
  CRON_SAMPLES,
  analyzeCronExpression,
  buildCronExpression,
  createDefaultCronState,
  ensureQuartzDayPair,
  getFieldBounds,
  getGridValues,
  getTabLabel,
  getWeekdayLabel,
  parseCronExpression,
  readExpressionFieldSegments,
  sanitizeSelectedValues,
  sanitizeStateValue,
  type CronFieldKey,
  type CronWorkspaceState,
  type DayOfMonthFieldState,
  type DayOfWeekFieldState,
  type NumericFieldState,
  type YearFieldState,
} from '@/lib/cron-workspace';

const TAB_KEYS: CronFieldKey[] = [
  'second',
  'minute',
  'hour',
  'day_of_month',
  'month',
  'day_of_week',
  'year',
];

function useCronWorkspaceState() {
  const [cronState, setCronState] = useState<CronWorkspaceState>(() =>
    createDefaultCronState(),
  );
  const [expressionInput, setExpressionInput] = useState(() =>
    buildCronExpression(createDefaultCronState()),
  );

  const commitState = (
    nextState: CronWorkspaceState,
    editedField?: 'day_of_month' | 'day_of_week',
  ) => {
    const normalized = editedField
      ? ensureQuartzDayPair(nextState, editedField)
      : nextState;
    setCronState(normalized);
    setExpressionInput(buildCronExpression(normalized));
  };

  return {
    cronState,
    expressionInput,
    setExpressionInput,
    commitState,
    setCronState,
  };
}

function CronNumberInput({
  value,
  min,
  max,
  onChange,
}: {
  value: number;
  min: number;
  max: number;
  onChange: (value: number) => void;
}) {
  return (
    <input
      className="cron-inline-input"
      type="number"
      min={min}
      max={max}
      value={value}
      onChange={(event) => onChange(Number(event.target.value))}
    />
  );
}

function SpecificValueGrid({
  field,
  selected,
  onToggle,
}: {
  field: CronFieldKey;
  selected: number[];
  onToggle: (value: number) => void;
}) {
  return (
    <div className="cron-value-grid">
      {getGridValues(field).map((value) => {
        const label =
          field === 'day_of_week'
            ? getWeekdayLabel(value)
            : field === 'year'
              ? String(value)
              : String(value).padStart(2, '0');

        return (
          <label key={value}>
            <input
              checked={selected.includes(value)}
              type="checkbox"
              onChange={() => onToggle(value)}
            />
            <span>{label}</span>
          </label>
        );
      })}
    </div>
  );
}

function NumericFieldEditor({
  field,
  state,
  onChange,
}: {
  field: CronFieldKey;
  state: NumericFieldState;
  onChange: (nextState: NumericFieldState) => void;
}) {
  const bounds = getFieldBounds(field);

  return (
    <div className="cron-config-body">
      <label className="cron-option-line">
        <input
          checked={state.mode === 'every'}
          name={`${field}-mode`}
          type="radio"
          onChange={() => onChange({ ...state, mode: 'every' })}
        />
        <span>任意值</span>
        <small>允许的通配符 `, - * /`</small>
      </label>

      <label className="cron-option-line">
        <input
          checked={state.mode === 'range'}
          name={`${field}-mode`}
          type="radio"
          onChange={() => onChange({ ...state, mode: 'range' })}
        />
        <span>周期从</span>
        <CronNumberInput
          max={bounds.max}
          min={bounds.min}
          value={state.rangeStart}
          onChange={(value) =>
            onChange({
              ...state,
              mode: 'range',
              rangeStart: sanitizeStateValue(field, value),
            })
          }
        />
        <span>到</span>
        <CronNumberInput
          max={bounds.max}
          min={bounds.min}
          value={state.rangeEnd}
          onChange={(value) =>
            onChange({
              ...state,
              mode: 'range',
              rangeEnd: sanitizeStateValue(field, value),
            })
          }
        />
        <span>{getTabLabel(field)}</span>
      </label>

      <label className="cron-option-line">
        <input
          checked={state.mode === 'step'}
          name={`${field}-mode`}
          type="radio"
          onChange={() => onChange({ ...state, mode: 'step' })}
        />
        <span>从</span>
        <CronNumberInput
          max={bounds.max}
          min={bounds.min}
          value={state.stepStart}
          onChange={(value) =>
            onChange({
              ...state,
              mode: 'step',
              stepStart: sanitizeStateValue(field, value),
            })
          }
        />
        <span>{getTabLabel(field)}开始，每</span>
        <CronNumberInput
          max={bounds.max - bounds.min + 1}
          min={1}
          value={state.stepEvery}
          onChange={(value) =>
            onChange({
              ...state,
              mode: 'step',
              stepEvery: Math.max(1, value),
            })
          }
        />
        <span>{getTabLabel(field)}执行一次</span>
      </label>

      <div className="cron-option-block">
        <label className="cron-option-line">
          <input
            checked={state.mode === 'specific'}
            name={`${field}-mode`}
            type="radio"
            onChange={() => onChange({ ...state, mode: 'specific' })}
          />
          <span>指定</span>
        </label>
        <SpecificValueGrid
          field={field}
          selected={state.selected}
          onToggle={(value) => {
            const nextValues = state.selected.includes(value)
              ? state.selected.filter((item) => item !== value)
              : [...state.selected, value];
            onChange({
              ...state,
              mode: 'specific',
              selected: sanitizeSelectedValues(field, nextValues),
            });
          }}
        />
      </div>
    </div>
  );
}

function DayOfMonthEditor({
  state,
  onChange,
}: {
  state: DayOfMonthFieldState;
  onChange: (nextState: DayOfMonthFieldState) => void;
}) {
  const bounds = getFieldBounds('day_of_month');

  return (
    <div className="cron-config-body">
      <label className="cron-option-line">
        <input
          checked={state.mode === 'every'}
          name="day-of-month-mode"
          type="radio"
          onChange={() => onChange({ ...state, mode: 'every' })}
        />
        <span>每天</span>
        <small>允许的通配符 `, - * /`</small>
      </label>

      <label className="cron-option-line">
        <input
          checked={state.mode === 'omit'}
          name="day-of-month-mode"
          type="radio"
          onChange={() => onChange({ ...state, mode: 'omit' })}
        />
        <span>不指定</span>
        <small>输出 `?`，由周字段决定</small>
      </label>

      <label className="cron-option-line">
        <input
          checked={state.mode === 'range'}
          name="day-of-month-mode"
          type="radio"
          onChange={() => onChange({ ...state, mode: 'range' })}
        />
        <span>周期从</span>
        <CronNumberInput
          max={bounds.max}
          min={bounds.min}
          value={state.rangeStart}
          onChange={(value) =>
            onChange({
              ...state,
              mode: 'range',
              rangeStart: sanitizeStateValue('day_of_month', value),
            })
          }
        />
        <span>到</span>
        <CronNumberInput
          max={bounds.max}
          min={bounds.min}
          value={state.rangeEnd}
          onChange={(value) =>
            onChange({
              ...state,
              mode: 'range',
              rangeEnd: sanitizeStateValue('day_of_month', value),
            })
          }
        />
        <span>日</span>
      </label>

      <label className="cron-option-line">
        <input
          checked={state.mode === 'step'}
          name="day-of-month-mode"
          type="radio"
          onChange={() => onChange({ ...state, mode: 'step' })}
        />
        <span>从</span>
        <CronNumberInput
          max={bounds.max}
          min={bounds.min}
          value={state.stepStart}
          onChange={(value) =>
            onChange({
              ...state,
              mode: 'step',
              stepStart: sanitizeStateValue('day_of_month', value),
            })
          }
        />
        <span>日开始，每</span>
        <CronNumberInput
          max={31}
          min={1}
          value={state.stepEvery}
          onChange={(value) =>
            onChange({
              ...state,
              mode: 'step',
              stepEvery: Math.max(1, value),
            })
          }
        />
        <span>日执行一次</span>
      </label>

      <label className="cron-option-line">
        <input
          checked={state.mode === 'last-day'}
          name="day-of-month-mode"
          type="radio"
          onChange={() => onChange({ ...state, mode: 'last-day' })}
        />
        <span>每月最后一天</span>
      </label>

      <label className="cron-option-line">
        <input
          checked={state.mode === 'last-weekday'}
          name="day-of-month-mode"
          type="radio"
          onChange={() => onChange({ ...state, mode: 'last-weekday' })}
        />
        <span>每月最后一个工作日</span>
      </label>

      <label className="cron-option-line">
        <input
          checked={state.mode === 'nearest-weekday'}
          name="day-of-month-mode"
          type="radio"
          onChange={() => onChange({ ...state, mode: 'nearest-weekday' })}
        />
        <span>最接近</span>
        <CronNumberInput
          max={31}
          min={1}
          value={state.nearestWeekday}
          onChange={(value) =>
            onChange({
              ...state,
              mode: 'nearest-weekday',
              nearestWeekday: sanitizeStateValue('day_of_month', value),
            })
          }
        />
        <span>日的工作日</span>
      </label>

      <div className="cron-option-block">
        <label className="cron-option-line">
          <input
            checked={state.mode === 'specific'}
            name="day-of-month-mode"
            type="radio"
            onChange={() => onChange({ ...state, mode: 'specific' })}
          />
          <span>指定</span>
        </label>
        <SpecificValueGrid
          field="day_of_month"
          selected={state.selected}
          onToggle={(value) => {
            const nextValues = state.selected.includes(value)
              ? state.selected.filter((item) => item !== value)
              : [...state.selected, value];
            onChange({
              ...state,
              mode: 'specific',
              selected: sanitizeSelectedValues('day_of_month', nextValues),
            });
          }}
        />
      </div>
    </div>
  );
}

function DayOfWeekEditor({
  state,
  onChange,
}: {
  state: DayOfWeekFieldState;
  onChange: (nextState: DayOfWeekFieldState) => void;
}) {
  const bounds = getFieldBounds('day_of_week');

  return (
    <div className="cron-config-body">
      <label className="cron-option-line">
        <input
          checked={state.mode === 'every'}
          name="day-of-week-mode"
          type="radio"
          onChange={() => onChange({ ...state, mode: 'every' })}
        />
        <span>每周</span>
        <small>允许的通配符 `, - * /`</small>
      </label>

      <label className="cron-option-line">
        <input
          checked={state.mode === 'omit'}
          name="day-of-week-mode"
          type="radio"
          onChange={() => onChange({ ...state, mode: 'omit' })}
        />
        <span>不指定</span>
        <small>输出 `?`，由日字段决定</small>
      </label>

      <label className="cron-option-line">
        <input
          checked={state.mode === 'range'}
          name="day-of-week-mode"
          type="radio"
          onChange={() => onChange({ ...state, mode: 'range' })}
        />
        <span>周期从</span>
        <CronNumberInput
          max={bounds.max}
          min={bounds.min}
          value={state.rangeStart}
          onChange={(value) =>
            onChange({
              ...state,
              mode: 'range',
              rangeStart: sanitizeStateValue('day_of_week', value),
            })
          }
        />
        <span>到</span>
        <CronNumberInput
          max={bounds.max}
          min={bounds.min}
          value={state.rangeEnd}
          onChange={(value) =>
            onChange({
              ...state,
              mode: 'range',
              rangeEnd: sanitizeStateValue('day_of_week', value),
            })
          }
        />
        <span>周</span>
      </label>

      <label className="cron-option-line">
        <input
          checked={state.mode === 'step'}
          name="day-of-week-mode"
          type="radio"
          onChange={() => onChange({ ...state, mode: 'step' })}
        />
        <span>从</span>
        <CronNumberInput
          max={bounds.max}
          min={bounds.min}
          value={state.stepStart}
          onChange={(value) =>
            onChange({
              ...state,
              mode: 'step',
              stepStart: sanitizeStateValue('day_of_week', value),
            })
          }
        />
        <span>周开始，每</span>
        <CronNumberInput
          max={7}
          min={1}
          value={state.stepEvery}
          onChange={(value) =>
            onChange({
              ...state,
              mode: 'step',
              stepEvery: Math.max(1, value),
            })
          }
        />
        <span>周执行一次</span>
      </label>

      <label className="cron-option-line">
        <input
          checked={state.mode === 'last'}
          name="day-of-week-mode"
          type="radio"
          onChange={() => onChange({ ...state, mode: 'last' })}
        />
        <span>每月最后一个星期</span>
        <CronNumberInput
          max={6}
          min={0}
          value={state.lastWeekday}
          onChange={(value) =>
            onChange({
              ...state,
              mode: 'last',
              lastWeekday: sanitizeStateValue('day_of_week', value),
            })
          }
        />
      </label>

      <label className="cron-option-line">
        <input
          checked={state.mode === 'nth'}
          name="day-of-week-mode"
          type="radio"
          onChange={() => onChange({ ...state, mode: 'nth' })}
        />
        <span>每月第</span>
        <CronNumberInput
          max={5}
          min={1}
          value={state.nthInstance}
          onChange={(value) =>
            onChange({
              ...state,
              mode: 'nth',
              nthInstance: Math.min(5, Math.max(1, value)),
            })
          }
        />
        <span>个星期</span>
        <CronNumberInput
          max={6}
          min={0}
          value={state.nthWeekday}
          onChange={(value) =>
            onChange({
              ...state,
              mode: 'nth',
              nthWeekday: sanitizeStateValue('day_of_week', value),
            })
          }
        />
      </label>

      <div className="cron-option-block">
        <label className="cron-option-line">
          <input
            checked={state.mode === 'specific'}
            name="day-of-week-mode"
            type="radio"
            onChange={() => onChange({ ...state, mode: 'specific' })}
          />
          <span>指定</span>
        </label>
        <SpecificValueGrid
          field="day_of_week"
          selected={state.selected}
          onToggle={(value) => {
            const nextValues = state.selected.includes(value)
              ? state.selected.filter((item) => item !== value)
              : [...state.selected, value];
            onChange({
              ...state,
              mode: 'specific',
              selected: sanitizeSelectedValues('day_of_week', nextValues),
            });
          }}
        />
      </div>
    </div>
  );
}

function YearEditor({
  state,
  onChange,
}: {
  state: YearFieldState;
  onChange: (nextState: YearFieldState) => void;
}) {
  const bounds = getFieldBounds('year');

  return (
    <div className="cron-config-body">
      <label className="cron-option-line">
        <input
          checked={state.mode === 'none'}
          name="year-mode"
          type="radio"
          onChange={() => onChange({ ...state, mode: 'none' })}
        />
        <span>不指定年份</span>
        <small>留空时按 6 段解析</small>
      </label>

      <label className="cron-option-line">
        <input
          checked={state.mode === 'every'}
          name="year-mode"
          type="radio"
          onChange={() => onChange({ ...state, mode: 'every' })}
        />
        <span>任意年份</span>
      </label>

      <label className="cron-option-line">
        <input
          checked={state.mode === 'range'}
          name="year-mode"
          type="radio"
          onChange={() => onChange({ ...state, mode: 'range' })}
        />
        <span>周期从</span>
        <CronNumberInput
          max={bounds.max}
          min={bounds.min}
          value={state.rangeStart}
          onChange={(value) =>
            onChange({
              ...state,
              mode: 'range',
              rangeStart: sanitizeStateValue('year', value),
            })
          }
        />
        <span>到</span>
        <CronNumberInput
          max={bounds.max}
          min={bounds.min}
          value={state.rangeEnd}
          onChange={(value) =>
            onChange({
              ...state,
              mode: 'range',
              rangeEnd: sanitizeStateValue('year', value),
            })
          }
        />
        <span>年</span>
      </label>

      <label className="cron-option-line">
        <input
          checked={state.mode === 'step'}
          name="year-mode"
          type="radio"
          onChange={() => onChange({ ...state, mode: 'step' })}
        />
        <span>从</span>
        <CronNumberInput
          max={bounds.max}
          min={bounds.min}
          value={state.stepStart}
          onChange={(value) =>
            onChange({
              ...state,
              mode: 'step',
              stepStart: sanitizeStateValue('year', value),
            })
          }
        />
        <span>年开始，每</span>
        <CronNumberInput
          max={50}
          min={1}
          value={state.stepEvery}
          onChange={(value) =>
            onChange({
              ...state,
              mode: 'step',
              stepEvery: Math.max(1, value),
            })
          }
        />
        <span>年执行一次</span>
      </label>
    </div>
  );
}

function ConfigEditor({
  activeField,
  state,
  onChange,
}: {
  activeField: CronFieldKey;
  state: CronWorkspaceState;
  onChange: (
    nextState: CronWorkspaceState,
    editedField?: 'day_of_month' | 'day_of_week',
  ) => void;
}) {
  if (activeField === 'day_of_month') {
    return (
      <DayOfMonthEditor
        state={state.day_of_month}
        onChange={(nextFieldState) =>
          onChange({ ...state, day_of_month: nextFieldState }, 'day_of_month')
        }
      />
    );
  }

  if (activeField === 'day_of_week') {
    return (
      <DayOfWeekEditor
        state={state.day_of_week}
        onChange={(nextFieldState) =>
          onChange({ ...state, day_of_week: nextFieldState }, 'day_of_week')
        }
      />
    );
  }

  if (activeField === 'year') {
    return (
      <YearEditor
        state={state.year}
        onChange={(nextFieldState) => onChange({ ...state, year: nextFieldState })}
      />
    );
  }

  return (
    <NumericFieldEditor
      field={activeField}
      state={state[activeField] as NumericFieldState}
      onChange={(nextFieldState) =>
        onChange({ ...state, [activeField]: nextFieldState } as CronWorkspaceState)
      }
    />
  );
}

export default function CronPage() {
  const [activeField, setActiveField] = useState<CronFieldKey>('second');
  const { cronState, expressionInput, setExpressionInput, commitState, setCronState } =
    useCronWorkspaceState();
  const timezone = useMemo(
    () => Intl.DateTimeFormat().resolvedOptions().timeZone || 'Asia/Shanghai',
    [],
  );
  const analysis = useMemo(
    () => analyzeCronExpression(expressionInput, timezone),
    [expressionInput, timezone],
  );
  const fieldSegments = analysis.valid
    ? readExpressionFieldSegments(analysis.normalizedExpression)
    : readExpressionFieldSegments(buildCronExpression(cronState));

  const handleReverseParse = () => {
    try {
      const parsed = parseCronExpression(expressionInput);
      setCronState(parsed.state);
      setExpressionInput(parsed.normalizedExpression);
    } catch {
      // 校验结果已在结果区提示，这里不额外插入新布局。
    }
  };

  return (
    <div className="site-shell">
      <header className="site-header fade-up">
        <Link className="brand" href="/">
          <span className="brand-mark" aria-hidden="true" />
          <span className="brand-text">你的工具箱</span>
        </Link>
        <nav className="main-nav" aria-label="主导航">
          <Link href="/">首页</Link>
          <ThemeToggle />
        </nav>
      </header>

      <main className="main-content cron-page">
        <section className="cron-config-page fade-up fade-delay-1">
          <div className="cron-config-head">
            <div>
              <p className="cron-kicker">Quartz Cron Builder</p>
              <h1>Cron 表达式工具</h1>
            </div>
          </div>

          <section className="cron-config-panel">
            <div className="cron-config-tabs" role="tablist" aria-label="字段切换">
              {TAB_KEYS.map((field) => (
                <button
                  key={field}
                  className={`cron-config-tab ${activeField === field ? 'is-active' : ''}`}
                  type="button"
                  onClick={() => setActiveField(field)}
                >
                  {getTabLabel(field)}
                </button>
              ))}
            </div>

            <ConfigEditor
              activeField={activeField}
              state={cronState}
              onChange={commitState}
            />
          </section>

          <section className="cron-result-panel">
            <div className="cron-result-title">
              <h2>表达式</h2>
            </div>

            <div className="cron-segment-board">
              {TAB_KEYS.map((field) => (
                <div key={field}>
                  <span>{field === 'day_of_week' ? '星期' : getTabLabel(field)}</span>
                  <strong>{fieldSegments[field] || ''}</strong>
                </div>
              ))}
            </div>

            <div className="cron-expression-row">
              <label className="cron-expression-field">
                <span>Cron表达式</span>
                <input
                  spellCheck="false"
                  type="text"
                  value={expressionInput}
                  onChange={(event) => setExpressionInput(event.target.value)}
                />
              </label>
              <button
                className="btn btn-primary cron-primary-btn"
                type="button"
                onClick={handleReverseParse}
              >
                反解析
              </button>
            </div>

            <div className="cron-run-list">
              <h3>{analysis.valid ? '最近5次运行时间' : analysis.error ?? '最近5次运行时间'}</h3>
              {analysis.valid && analysis.nextRuns.length ? (
                <ol>
                  {analysis.nextRuns.map((item) => (
                    <li key={item.iso}>
                      <strong>{item.label}</strong>
                      <span>{item.meta}</span>
                    </li>
                  ))}
                </ol>
              ) : (
                <ol>
                  <li>
                    <strong>--</strong>
                    <span>{analysis.previewHint ?? '表达式校验通过后显示'}</span>
                  </li>
                </ol>
              )}
            </div>
          </section>

          <section className="cron-doc-panel">
            <div className="cron-doc-title">
              <h2>说明</h2>
            </div>
            <div className="cron-doc-block">
              <p>{CRON_DOC_LINES[0]}</p>
            </div>
            <div className="cron-doc-block">
              <pre className="cron-doc-ascii">{`┌────────── [可选] 秒 (0 - 59)
├────────── 分钟 (0 - 59)
├────────── 小时 (0 - 23)
├────────── 日 (1 - 31)
├────────── 月 (1 - 12)
├────────── 星期 (0 - 6 / SUN-SAT)
└────────── [可选] 年`}</pre>
            </div>
            <div className="cron-doc-block">
              <ul>
                <li>星号 `*`：表示匹配任意值。</li>
                <li>逗号 `,`：用于分隔多个值。</li>
                <li>斜线 `/`：用于指定间隔值。</li>
                <li>连字符 `-`：用于指定范围。</li>
                <li>问号 `?`：仅用于日期和星期字段，表示不指定具体值。</li>
              </ul>
            </div>
          </section>

          <section className="cron-sample-panel">
            <div className="cron-doc-title">
              <h2>常见样例</h2>
            </div>
            <ul className="cron-sample-lines">
              {CRON_SAMPLES.map((sample) => (
                <li key={sample.expression}>
                  <button
                    className="cron-sample-item"
                    type="button"
                    onClick={() => {
                      setExpressionInput(sample.expression);
                      try {
                        const parsed = parseCronExpression(sample.expression);
                        setCronState(parsed.state);
                      } catch {
                        // ignore
                      }
                    }}
                  >
                    <code>{sample.expression}</code>
                    <span>{sample.description}</span>
                  </button>
                </li>
              ))}
            </ul>
          </section>
        </section>
      </main>

      <footer className="site-footer">
        <p>© 2026 你的工具箱</p>
        <p>先把交互结构定准，再进入正式开发</p>
      </footer>
    </div>
  );
}
