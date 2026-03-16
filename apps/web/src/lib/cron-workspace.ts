import { getFutureMatches } from '@datasert/cronjs-matcher';
import { parse, type CronExprs, type CronField } from '@datasert/cronjs-parser';

export type CronFieldKey =
  | 'second'
  | 'minute'
  | 'hour'
  | 'day_of_month'
  | 'month'
  | 'day_of_week'
  | 'year';

export type CronTabKey = Exclude<CronFieldKey, never>;

type NumericMode = 'every' | 'range' | 'step' | 'specific';
type DayOfMonthMode =
  | NumericMode
  | 'omit'
  | 'last-day'
  | 'last-weekday'
  | 'nearest-weekday';
type DayOfWeekMode = NumericMode | 'omit' | 'last' | 'nth';
type YearMode = NumericMode | 'none';

export type NumericFieldState = {
  mode: NumericMode;
  rangeStart: number;
  rangeEnd: number;
  stepStart: number;
  stepEvery: number;
  selected: number[];
};

export type DayOfMonthFieldState = Omit<NumericFieldState, 'mode'> & {
  mode: DayOfMonthMode;
  nearestWeekday: number;
};

export type DayOfWeekFieldState = Omit<NumericFieldState, 'mode'> & {
  mode: DayOfWeekMode;
  nthWeekday: number;
  nthInstance: number;
  lastWeekday: number;
};

export type YearFieldState = Omit<NumericFieldState, 'mode'> & {
  mode: Exclude<YearMode, 'specific'>;
};

export type CronWorkspaceState = {
  second: NumericFieldState;
  minute: NumericFieldState;
  hour: NumericFieldState;
  day_of_month: DayOfMonthFieldState;
  month: NumericFieldState;
  day_of_week: DayOfWeekFieldState;
  year: YearFieldState;
};

export type CronAnalysis = {
  valid: boolean;
  normalizedExpression: string;
  state: CronWorkspaceState | null;
  fieldSegments: Record<CronFieldKey, string>;
  fieldMeanings: string[];
  nextRuns: CronRunPreview[];
  error?: string;
  previewHint?: string;
};

export type CronRunPreview = {
  iso: string;
  label: string;
  meta: string;
};

export type CronSample = {
  name: string;
  expression: string;
  description: string;
};

export const CRON_DOC_LINES = [
  'Quartz Cron 默认按 6 段解析；填写年字段时自动按 7 段解析。',
  '日和周需至少有一侧使用 ?，可视化配置时会自动保持这一规则。',
  '支持 * , - / ? L W #，适合常见定时与月度规则配置。',
];

export const CRON_SAMPLES: CronSample[] = [
  { name: '每天中午', expression: '0 0 12 * * ?', description: '每天中午 12 点执行' },
  { name: '每 5 分钟', expression: '0 0/5 * * * ?', description: '每 5 分钟执行一次' },
  { name: '工作时段', expression: '0 0 8-18 ? * MON-FRI', description: '周一到周五 8 点到 18 点整点执行' },
  { name: '三次/周', expression: '0 30 9 ? * MON,WED,FRI', description: '每周一、周三、周五 09:30 执行' },
  { name: '月初', expression: '0 0 0 1 * ?', description: '每月 1 日 0 点执行' },
  { name: '月末', expression: '0 15 10 L * ?', description: '每月最后一天 10:15 执行' },
  { name: '最近工作日', expression: '0 0 9 15W * ?', description: '每月最接近 15 日的工作日 9 点执行' },
  { name: '每月首个周一', expression: '0 0 9 ? * 1#1', description: '每月第一个周一 9 点执行' },
  { name: '周末傍晚', expression: '0 0 18 ? * SAT,SUN', description: '每周末 18 点执行' },
  { name: '指定年份', expression: '0 0 9 ? * MON-FRI 2026', description: '2026 年工作日 9 点执行' },
];

const WEEKDAY_LABELS = ['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'];
const WEEKDAY_TEXT = ['周日', '周一', '周二', '周三', '周四', '周五', '周六'];

function createNumericField(
  rangeStart: number,
  rangeEnd: number,
  stepStart: number,
  stepEvery: number,
): NumericFieldState {
  return {
    mode: 'every',
    rangeStart,
    rangeEnd,
    stepStart,
    stepEvery,
    selected: [],
  };
}

/**
 * 创建默认工作区状态。
 * 默认让“日”生效、“周”使用 ?，避免 Quartz 在日/周字段上冲突。
 */
export function createDefaultCronState(): CronWorkspaceState {
  return {
    second: createNumericField(0, 1, 0, 1),
    minute: createNumericField(0, 1, 0, 1),
    hour: createNumericField(0, 1, 0, 1),
    day_of_month: {
      ...createNumericField(1, 2, 1, 1),
      mode: 'every',
      nearestWeekday: 15,
    },
    month: createNumericField(1, 2, 1, 1),
    day_of_week: {
      ...createNumericField(1, 2, 1, 1),
      mode: 'omit',
      nthWeekday: 1,
      nthInstance: 1,
      lastWeekday: 5,
    },
    year: {
      ...createNumericField(new Date().getFullYear(), new Date().getFullYear() + 1, new Date().getFullYear(), 1),
      mode: 'none',
    },
  };
}

function sortUnique(values: number[]) {
  return Array.from(new Set(values)).sort((left, right) => left - right);
}

function clamp(value: number, min: number, max: number) {
  if (Number.isNaN(value)) {
    return min;
  }
  return Math.min(max, Math.max(min, value));
}

function countSegments(expression: string) {
  return expression.trim().split(/\s+/).filter(Boolean).length;
}

function getWeekdayToken(value: number) {
  return WEEKDAY_LABELS[clamp(value, 0, 6)];
}

function getWeekdayText(value: number) {
  return WEEKDAY_TEXT[clamp(value, 0, 6)];
}

function formatSelectedValues(values: number[], field: CronFieldKey) {
  const sorted = sortUnique(values);

  if (field === 'day_of_week') {
    return sorted.map(getWeekdayToken).join(',');
  }

  return sorted.join(',');
}

/**
 * 将字段状态转换成 Quartz 片段。
 * 这里统一输出单一模式，避免 UI 配置产生不可回放的复合表达式。
 */
export function buildFieldSegment(
  field: CronFieldKey,
  state:
    | NumericFieldState
    | DayOfMonthFieldState
    | DayOfWeekFieldState
    | YearFieldState,
) {
  if (field === 'day_of_month') {
    const nextState = state as DayOfMonthFieldState;

    if (nextState.mode === 'omit') {
      return '?';
    }
    if (nextState.mode === 'last-day') {
      return 'L';
    }
    if (nextState.mode === 'last-weekday') {
      return 'LW';
    }
    if (nextState.mode === 'nearest-weekday') {
      return `${nextState.nearestWeekday}W`;
    }
  }

  if (field === 'day_of_week') {
    const nextState = state as DayOfWeekFieldState;

    if (nextState.mode === 'omit') {
      return '?';
    }
    if (nextState.mode === 'last') {
      return `${nextState.lastWeekday}L`;
    }
    if (nextState.mode === 'nth') {
      return `${nextState.nthWeekday}#${nextState.nthInstance}`;
    }
  }

  if (field === 'year') {
    const nextState = state as YearFieldState;

    if (nextState.mode === 'none') {
      return '';
    }
  }

  if (state.mode === 'every') {
    return '*';
  }

  if (state.mode === 'range') {
    if (field === 'day_of_week') {
      const nextState = state as DayOfWeekFieldState;
      return `${getWeekdayToken(nextState.rangeStart)}-${getWeekdayToken(nextState.rangeEnd)}`;
    }

    return `${state.rangeStart}-${state.rangeEnd}`;
  }

  if (state.mode === 'step') {
    return `${state.stepStart}/${state.stepEvery}`;
  }

  return formatSelectedValues(state.selected, field);
}

/**
 * 根据当前状态构建 Quartz 表达式。
 * 年字段为空时输出 6 段；有值时输出 7 段。
 */
export function buildCronExpression(state: CronWorkspaceState) {
  const nextState = ensureQuartzDayPair(state, 'day_of_month');
  const segments = [
    buildFieldSegment('second', nextState.second),
    buildFieldSegment('minute', nextState.minute),
    buildFieldSegment('hour', nextState.hour),
    buildFieldSegment('day_of_month', nextState.day_of_month),
    buildFieldSegment('month', nextState.month),
    buildFieldSegment('day_of_week', nextState.day_of_week),
  ];
  const yearSegment = buildFieldSegment('year', nextState.year);

  if (yearSegment) {
    segments.push(yearSegment);
  }

  return segments.join(' ');
}

function mapFieldToState(
  field: CronFieldKey,
  input: CronField,
  hasYear: boolean,
): NumericFieldState | DayOfMonthFieldState | DayOfWeekFieldState | YearFieldState {
  if (field === 'year' && !hasYear) {
    const base = createDefaultCronState().year;
    return { ...base, mode: 'none' };
  }

  if (field === 'day_of_month') {
    const base = createDefaultCronState().day_of_month;

    if (input.omit) {
      return { ...base, mode: 'omit' };
    }
    if (input.lastDay) {
      return { ...base, mode: 'last-day' };
    }
    if (input.lastWeekday) {
      return { ...base, mode: 'last-weekday' };
    }
    if (input.nearestWeekdays?.length) {
      return {
        ...base,
        mode: 'nearest-weekday',
        nearestWeekday: input.nearestWeekdays[0],
      };
    }
  }

  if (field === 'day_of_week') {
    const base = createDefaultCronState().day_of_week;

    if (input.omit) {
      return { ...base, mode: 'omit' };
    }
    if (input.lastDays?.length) {
      return { ...base, mode: 'last', lastWeekday: input.lastDays[0] };
    }
    if (input.nthDays?.length) {
      return {
        ...base,
        mode: 'nth',
        nthWeekday: input.nthDays[0].day_of_week,
        nthInstance: input.nthDays[0].instance,
      };
    }
  }

  const base =
    field === 'day_of_month'
      ? createDefaultCronState().day_of_month
      : field === 'day_of_week'
        ? createDefaultCronState().day_of_week
        : field === 'year'
          ? createDefaultCronState().year
          : field === 'second'
            ? createDefaultCronState().second
            : field === 'minute'
              ? createDefaultCronState().minute
              : field === 'hour'
                ? createDefaultCronState().hour
                : createDefaultCronState().month;

  if (input.all) {
    return { ...base, mode: 'every' };
  }

  if (input.steps?.length) {
    return {
      ...base,
      mode: 'step',
      stepStart: input.steps[0].from,
      stepEvery: input.steps[0].step,
    };
  }

  if (input.ranges?.length) {
    return {
      ...base,
      mode: 'range',
      rangeStart: input.ranges[0].from,
      rangeEnd: input.ranges[0].to,
    };
  }

  if (field === 'year' && input.values?.length) {
    const yearValue = sortUnique(input.values)[0];
    return {
      ...base,
      mode: 'range',
      rangeStart: yearValue,
      rangeEnd: yearValue,
    } as YearFieldState;
  }

  return {
    ...base,
    mode: 'specific',
    selected: sortUnique(input.values ?? []),
  };
}

/**
 * 反解析表达式，回填为 UI 可编辑的字段状态。
 * 若表达式包含超出当前 UI 的复合规则，仍会校验成功，但可视化仅保留第一组规则。
 */
export function parseCronExpression(expression: string) {
  const normalized = expression.trim().replace(/\s+/g, ' ');
  const segmentCount = countSegments(normalized);

  if (![6, 7].includes(segmentCount)) {
    throw new Error('仅支持 Quartz 6 段或 7 段表达式。');
  }

  const parsed = parse(normalized, { hasSeconds: true });
  const expressionState = parsed.expressions[0];

  if (!expressionState) {
    throw new Error('无法解析当前表达式。');
  }

  const hasYear = segmentCount === 7;
  const nextState: CronWorkspaceState = {
    second: mapFieldToState('second', expressionState.second, hasYear) as NumericFieldState,
    minute: mapFieldToState('minute', expressionState.minute, hasYear) as NumericFieldState,
    hour: mapFieldToState('hour', expressionState.hour, hasYear) as NumericFieldState,
    day_of_month: mapFieldToState('day_of_month', expressionState.day_of_month, hasYear) as DayOfMonthFieldState,
    month: mapFieldToState('month', expressionState.month, hasYear) as NumericFieldState,
    day_of_week: mapFieldToState('day_of_week', expressionState.day_of_week, hasYear) as DayOfWeekFieldState,
    year: mapFieldToState('year', expressionState.year, hasYear) as YearFieldState,
  };

  return {
    normalizedExpression: normalized,
    parsed,
    state: ensureQuartzDayPair(nextState, 'day_of_month'),
  };
}

/**
 * 保证日和周字段满足 Quartz 的互斥规则。
 * 用户改动其中一侧时，另一侧会自动切成 ?，避免生成非法表达式。
 */
export function ensureQuartzDayPair(
  state: CronWorkspaceState,
  editedField: 'day_of_month' | 'day_of_week',
) {
  const nextState: CronWorkspaceState = {
    ...state,
    day_of_month: { ...state.day_of_month },
    day_of_week: { ...state.day_of_week },
  };

  if (editedField === 'day_of_month') {
    if (nextState.day_of_month.mode !== 'omit') {
      nextState.day_of_week.mode = 'omit';
    } else if (nextState.day_of_week.mode === 'omit') {
      nextState.day_of_week.mode = 'every';
    }
  }

  if (editedField === 'day_of_week') {
    if (nextState.day_of_week.mode !== 'omit') {
      nextState.day_of_month.mode = 'omit';
    } else if (nextState.day_of_month.mode === 'omit') {
      nextState.day_of_month.mode = 'every';
    }
  }

  return nextState;
}

function describeNumericSegment(
  field: CronFieldKey,
  state:
    | NumericFieldState
    | DayOfMonthFieldState
    | DayOfWeekFieldState
    | YearFieldState,
) {
  if (state.mode === 'every') {
    return '任意值';
  }
  if (state.mode === 'range') {
    return `${state.rangeStart} 到 ${state.rangeEnd}`;
  }
  if (state.mode === 'step') {
    return `从 ${state.stepStart} 开始，每 ${state.stepEvery} 次`;
  }
  return state.selected.length ? `指定 ${state.selected.join(', ')}` : '未指定';
}

/**
 * 生成人类可读的字段说明，保证输入表达式后同屏能看到参数含义。
 */
export function buildFieldMeanings(state: CronWorkspaceState) {
  const meanings = [
    `// 秒   ${buildFieldSegment('second', state.second)}   ${describeNumericSegment('second', state.second)}`,
    `// 分钟 ${buildFieldSegment('minute', state.minute)}   ${describeNumericSegment('minute', state.minute)}`,
    `// 小时 ${buildFieldSegment('hour', state.hour)}   ${describeNumericSegment('hour', state.hour)}`,
  ];

  if (state.day_of_month.mode === 'omit') {
    meanings.push('// 日   ?   由星期字段决定');
  } else if (state.day_of_month.mode === 'last-day') {
    meanings.push('// 日   L   每月最后一天');
  } else if (state.day_of_month.mode === 'last-weekday') {
    meanings.push('// 日   LW   每月最后一个工作日');
  } else if (state.day_of_month.mode === 'nearest-weekday') {
    meanings.push(`// 日   ${state.day_of_month.nearestWeekday}W   靠近 ${state.day_of_month.nearestWeekday} 日的工作日`);
  } else {
    meanings.push(`// 日   ${buildFieldSegment('day_of_month', state.day_of_month)}   ${describeNumericSegment('day_of_month', state.day_of_month)}`);
  }

  meanings.push(`// 月   ${buildFieldSegment('month', state.month)}   ${describeNumericSegment('month', state.month)}`);

  if (state.day_of_week.mode === 'omit') {
    meanings.push('// 周   ?   由日期字段决定');
  } else if (state.day_of_week.mode === 'last') {
    meanings.push(`// 周   ${state.day_of_week.lastWeekday}L   每月最后一个${getWeekdayText(state.day_of_week.lastWeekday)}`);
  } else if (state.day_of_week.mode === 'nth') {
    meanings.push(`// 周   ${state.day_of_week.nthWeekday}#${state.day_of_week.nthInstance}   每月第 ${state.day_of_week.nthInstance} 个${getWeekdayText(state.day_of_week.nthWeekday)}`);
  } else if (state.day_of_week.mode === 'range') {
    meanings.push(`// 周   ${buildFieldSegment('day_of_week', state.day_of_week)}   ${getWeekdayText(state.day_of_week.rangeStart)}到${getWeekdayText(state.day_of_week.rangeEnd)}`);
  } else if (state.day_of_week.mode === 'specific') {
    meanings.push(`// 周   ${buildFieldSegment('day_of_week', state.day_of_week)}   ${state.day_of_week.selected.map(getWeekdayText).join('、')}`);
  } else {
    meanings.push(`// 周   ${buildFieldSegment('day_of_week', state.day_of_week)}   ${describeNumericSegment('day_of_week', state.day_of_week)}`);
  }

  if (state.year.mode === 'none') {
    meanings.push('// 年   -   未填写，按 6 段处理');
  } else {
    meanings.push(`// 年   ${buildFieldSegment('year', state.year)}   ${describeNumericSegment('year', state.year)}`);
  }

  return meanings;
}

function formatAbsoluteTime(iso: string, timezone: string) {
  return new Intl.DateTimeFormat('zh-CN', {
    timeZone: timezone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false,
  })
    .format(new Date(iso))
    .replace(/\//g, '-');
}

function formatRelativeTime(targetTime: Date, currentTime: Date) {
  const diffMs = targetTime.getTime() - currentTime.getTime();
  const diffSeconds = Math.round(diffMs / 1000);

  if (diffSeconds <= 0) {
    return '刚刚';
  }
  if (diffSeconds < 60) {
    return `${diffSeconds} 秒后`;
  }

  const diffMinutes = Math.round(diffSeconds / 60);

  if (diffMinutes < 60) {
    return `${diffMinutes} 分钟后`;
  }

  const diffHours = Math.round(diffMinutes / 60);

  if (diffHours < 48) {
    return `${diffHours} 小时后`;
  }

  const diffDays = Math.round(diffHours / 24);
  return `${diffDays} 天后`;
}

function isEveryLike(
  state:
    | NumericFieldState
    | DayOfMonthFieldState
    | DayOfWeekFieldState
    | YearFieldState,
) {
  return state.mode === 'every' || (state.mode === 'step' && state.stepEvery <= 1);
}

/**
 * 某些高频规则会让匹配器长时间遍历，先跳过预览，避免页面卡顿。
 */
function shouldSkipPreview(state: CronWorkspaceState) {
  const isHighFrequency =
    isEveryLike(state.second) &&
    isEveryLike(state.minute) &&
    isEveryLike(state.hour);

  if (!isHighFrequency) {
    return false;
  }

  return (
    state.day_of_month.mode === 'last-day' ||
    state.day_of_month.mode === 'last-weekday' ||
    state.day_of_month.mode === 'nearest-weekday' ||
    state.day_of_month.mode === 'range' ||
    state.day_of_month.mode === 'specific' ||
    state.day_of_week.mode === 'last' ||
    state.day_of_week.mode === 'nth' ||
    state.day_of_week.mode === 'range' ||
    state.day_of_week.mode === 'specific' ||
    state.month.mode !== 'every' ||
    state.year.mode !== 'none'
  );
}

/**
 * 计算未来运行时间，统一输出绝对时间 + 星期/相对时间。
 */
export function getNextRuns(expression: string, timezone: string, limit = 5) {
  const normalized = expression.trim().replace(/\s+/g, ' ');
  const parsed = parse(normalized, { hasSeconds: true });
  const now = new Date();
  const matches = getFutureMatches(parsed, {
    matchCount: limit,
    timezone,
    formatInTimezone: true,
    startAt: now.toISOString(),
  });

  return matches.map((iso) => {
    const date = new Date(iso);
    return {
      iso,
      label: formatAbsoluteTime(iso, timezone),
      meta: `${getWeekdayText(date.getDay())} · ${formatRelativeTime(date, now)}`,
    };
  });
}

function getFieldSegments(state: CronWorkspaceState) {
  return {
    second: buildFieldSegment('second', state.second),
    minute: buildFieldSegment('minute', state.minute),
    hour: buildFieldSegment('hour', state.hour),
    day_of_month: buildFieldSegment('day_of_month', state.day_of_month),
    month: buildFieldSegment('month', state.month),
    day_of_week: buildFieldSegment('day_of_week', state.day_of_week),
    year: buildFieldSegment('year', state.year),
  };
}

/**
 * 校验当前表达式，并返回结果区展示需要的全部数据。
 */
export function analyzeCronExpression(
  expression: string,
  timezone: string,
): CronAnalysis {
  const fallbackState = createDefaultCronState();
  const fallbackExpression = buildCronExpression(fallbackState);

  if (!expression.trim()) {
    return {
      valid: false,
      normalizedExpression: fallbackExpression,
      state: fallbackState,
      fieldSegments: getFieldSegments(fallbackState),
      fieldMeanings: buildFieldMeanings(fallbackState),
      nextRuns: [],
      error: '请输入 Quartz 6 段或 7 段表达式。',
      previewHint: undefined,
    };
  }

  try {
    const parsed = parseCronExpression(expression);
    const state = parsed.state;
    const skipPreview = shouldSkipPreview(state);

    return {
      valid: true,
      normalizedExpression: parsed.normalizedExpression,
      state,
      fieldSegments: getFieldSegments(state),
      fieldMeanings: buildFieldMeanings(state),
      nextRuns: skipPreview ? [] : getNextRuns(parsed.normalizedExpression, timezone),
      previewHint: skipPreview
        ? '当前规则触发频率过高，已跳过未来运行时间预览以避免页面卡顿。'
        : undefined,
    };
  } catch (error) {
    return {
      valid: false,
      normalizedExpression: expression.trim(),
      state: null,
      fieldSegments: getFieldSegments(fallbackState),
      fieldMeanings: buildFieldMeanings(fallbackState),
      nextRuns: [],
      error: error instanceof Error ? error.message : '表达式校验失败。',
      previewHint: undefined,
    };
  }
}

export function getFieldBounds(field: CronFieldKey) {
  switch (field) {
    case 'second':
    case 'minute':
      return { min: 0, max: 59 };
    case 'hour':
      return { min: 0, max: 23 };
    case 'day_of_month':
      return { min: 1, max: 31 };
    case 'month':
      return { min: 1, max: 12 };
    case 'day_of_week':
      return { min: 0, max: 6 };
    case 'year':
      return { min: 1970, max: 2099 };
    default:
      return { min: 0, max: 59 };
  }
}

/**
 * 规范化数值输入，避免 UI 中出现 NaN、越界值或空数组。
 */
export function sanitizeStateValue(
  field: CronFieldKey,
  value: number,
) {
  const bounds = getFieldBounds(field);
  return clamp(value, bounds.min, bounds.max);
}

export function sanitizeSelectedValues(field: CronFieldKey, values: number[]) {
  return sortUnique(values.map((value) => sanitizeStateValue(field, value)));
}

export function getGridValues(field: CronFieldKey) {
  const bounds = getFieldBounds(field);
  const values: number[] = [];

  for (let current = bounds.min; current <= bounds.max; current += 1) {
    values.push(current);
  }

  return values;
}

export function getWeekdayLabel(value: number) {
  return `${getWeekdayToken(value)} / ${getWeekdayText(value)}`;
}

export function getTabLabel(field: CronFieldKey) {
  switch (field) {
    case 'second':
      return '秒';
    case 'minute':
      return '分钟';
    case 'hour':
      return '小时';
    case 'day_of_month':
      return '日';
    case 'month':
      return '月';
    case 'day_of_week':
      return '周';
    case 'year':
      return '年';
    default:
      return field;
  }
}

export function getFieldLegend(field: CronFieldKey) {
  const bounds = getFieldBounds(field);

  if (field === 'day_of_week') {
    return '0-6 / SUN-SAT';
  }

  return `${bounds.min}-${bounds.max}`;
}

export function readExpressionFieldSegments(expression: string) {
  const parts = expression.trim().split(/\s+/).filter(Boolean);
  return {
    second: parts[0] ?? '',
    minute: parts[1] ?? '',
    hour: parts[2] ?? '',
    day_of_month: parts[3] ?? '',
    month: parts[4] ?? '',
    day_of_week: parts[5] ?? '',
    year: parts[6] ?? '',
  } satisfies Record<CronFieldKey, string>;
}

export type ParsedCronPayload = ReturnType<typeof parseCronExpression> & {
  parsed: CronExprs;
};
