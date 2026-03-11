'use client';

import Link from 'next/link';
import { useEffect, useMemo, useRef, useState } from 'react';
import { ThemeToggle } from '@/components/theme-toggle';
import {
  apiBaseUrl,
  buildCalculatorHistoryUrl,
  createDeviceId,
} from '@/lib/toolbox-api';

type HistoryItem = {
  id: string;
  expression: string;
  result: string;
  createdAt: string;
};

function sanitizeExpression(rawValue: string) {
  const value = rawValue.replace(/\s+/g, '');

  if (!value) {
    return '';
  }

  if (!/^[0-9+\-*/().]+$/.test(value)) {
    throw new Error('仅支持数字、小数点、括号和四则运算符。');
  }

  if (/[+\-*/]{2,}/.test(value.replace(/--/g, ''))) {
    throw new Error('表达式中含有连续运算符。');
  }

  return value;
}

function evaluateExpression(rawValue: string) {
  const expression = sanitizeExpression(rawValue);

  if (!expression) {
    return { expression: '', value: '0' };
  }

  let result: number;

  try {
    result = Function(`"use strict"; return (${expression})`)() as number;
  } catch {
    throw new Error('表达式格式不正确。');
  }

  if (!Number.isFinite(result)) {
    throw new Error('结果无效，请检查除零或括号。');
  }

  return {
    expression,
    value: String(Number.parseFloat(result.toFixed(12))),
  };
}

export default function CalculatorPage() {
  const [deviceId, setDeviceId] = useState('');
  const [expression, setExpression] = useState('');
  const [result, setResult] = useState('0');
  const [isError, setIsError] = useState(false);
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const resultRef = useRef<HTMLOutputElement | null>(null);

  const keypad = useMemo(
    () => [
      { label: 'AC', action: 'clear', kind: 'action' },
      { label: '(', value: '(', kind: 'operator' },
      { label: ')', value: ')', kind: 'operator' },
      { label: '/', value: '/', kind: 'operator' },
      { label: '7', value: '7' },
      { label: '8', value: '8' },
      { label: '9', value: '9' },
      { label: '*', value: '*', kind: 'operator' },
      { label: '4', value: '4' },
      { label: '5', value: '5' },
      { label: '6', value: '6' },
      { label: '-', value: '-', kind: 'operator' },
      { label: '1', value: '1' },
      { label: '2', value: '2' },
      { label: '3', value: '3' },
      { label: '+', value: '+', kind: 'operator' },
      { label: '0', value: '0' },
      { label: '.', value: '.' },
      { label: '←', action: 'backspace', kind: 'action' },
      { label: '=', action: 'evaluate', kind: 'action', className: 'equal-key' },
    ],
    [],
  );

  useEffect(() => {
    setDeviceId(createDeviceId());
  }, []);

  useEffect(() => {
    if (!deviceId) {
      return;
    }

    fetch(buildCalculatorHistoryUrl(deviceId))
      .then((response) => response.json() as Promise<HistoryItem[]>)
      .then((items) => setHistory(items))
      .catch(() => setHistory([]));
  }, [deviceId]);

  useEffect(() => {
    const node = resultRef.current;
    if (!node) {
      return;
    }

    node.classList.remove('result-flash');
    void node.offsetWidth;
    node.classList.add('result-flash');
  }, [result]);

  const refreshResult = (nextExpression: string) => {
    try {
      const computed = evaluateExpression(nextExpression);
      setResult(computed.value);
      setIsError(false);
      return computed;
    } catch (error) {
      setResult(error instanceof Error ? error.message : '表达式错误');
      setIsError(true);
      return null;
    }
  };

  const persistHistory = async (nextExpression: string) => {
    const computed = refreshResult(nextExpression);

    if (!computed?.expression || !deviceId) {
      return;
    }

    setExpression(computed.expression);

    try {
      const response = await fetch(`${apiBaseUrl}/calculator/histories`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          deviceId,
          expression: computed.expression,
          result: computed.value,
        }),
      });
      const created = (await response.json()) as HistoryItem;
      setHistory((current) =>
        [created, ...current.filter((item) => item.id !== created.id)].slice(
          0,
          20,
        ),
      );
    } catch {
      setHistory((current) =>
        [
          {
            id: `${Date.now()}`,
            expression: computed.expression,
            result: computed.value,
            createdAt: new Date().toISOString(),
          },
          ...current,
        ].slice(0, 20),
      );
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

      <main className="main-content calculator-page">
        <section className="page-intro calculator-intro fade-up fade-delay-1">
          <h1>表达式计算器</h1>
          <p>四则运算、括号、小数、历史记录。</p>
        </section>

        <section className="calculator-layout fade-up fade-delay-2">
          <div className="calculator-panel">
            <label className="sr-only" htmlFor="expression">
              输入表达式
            </label>
            <div className="calc-screen">
              <textarea
                id="expression"
                className="expression-input"
                spellCheck="false"
                value={expression}
                onChange={(event) => {
                  setExpression(event.target.value);
                  refreshResult(event.target.value);
                }}
                onKeyDown={(event) => {
                  if (event.key === 'Enter' && !event.shiftKey) {
                    event.preventDefault();
                    void persistHistory(expression);
                  }
                  if (event.key === 'Escape') {
                    setExpression('');
                    setResult('0');
                    setIsError(false);
                  }
                }}
                placeholder="例如：1 + (2 * 3.5)"
              />
              <div className="result-row">
                <span className="result-label">Result</span>
                <output
                  ref={resultRef}
                  className={`result-value ${isError ? 'is-error' : ''}`}
                >
                  {result}
                </output>
              </div>
            </div>

            <div className="calc-actions" aria-label="计算器按键">
              {keypad.map((key) => (
                <button
                  key={key.label}
                  className={`calc-key ${key.className ?? ''}`}
                  type="button"
                  data-kind={key.kind}
                  onClick={() => {
                    if (key.action === 'clear') {
                      setExpression('');
                      setResult('0');
                      setIsError(false);
                      return;
                    }
                    if (key.action === 'backspace') {
                      const next = expression.slice(0, -1);
                      setExpression(next);
                      refreshResult(next);
                      return;
                    }
                    if (key.action === 'evaluate') {
                      void persistHistory(expression);
                      return;
                    }

                    const next = `${expression}${key.value ?? ''}`;
                    setExpression(next);
                    refreshResult(next);
                  }}
                >
                  {key.label}
                </button>
              ))}
            </div>

            <div className="shortcut-bar" aria-label="快捷键说明">
              <span>Enter 计算</span>
              <span>Backspace 删除</span>
              <span>Esc 清空</span>
            </div>
          </div>

          <aside className="history-panel">
            <div className="history-head">
              <h2>最近记录</h2>
              <button
                className="history-clear"
                type="button"
                onClick={async () => {
                  if (!deviceId) {
                    return;
                  }

                  try {
                    await fetch(`${apiBaseUrl}/calculator/histories/${deviceId}`, {
                      method: 'DELETE',
                    });
                  } finally {
                    setHistory([]);
                  }
                }}
              >
                清空
              </button>
            </div>
            {history.length ? (
              <ul className="history-list">
                {history.map((item) => (
                  <li key={item.id}>
                    <button
                      className="history-item"
                      type="button"
                      onClick={() => {
                        setExpression(item.expression);
                        setResult(item.result);
                        setIsError(false);
                      }}
                    >
                      <span className="history-expression">{item.expression}</span>
                      <span className="history-result">{item.result}</span>
                    </button>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="history-empty">还没有计算记录，先算一笔。</p>
            )}
          </aside>
        </section>

        <section className="usage-note fade-up fade-delay-3">
          <h2>使用说明</h2>
          <ul>
            <li>当前版本只支持基础表达式：数字、小数点、括号与四则运算符。</li>
            <li>按 Enter 可以直接计算并写入历史记录，点击历史项可回填表达式。</li>
            <li>如果结果提示错误，请优先检查括号是否闭合、是否存在连续运算符或除零。</li>
          </ul>
        </section>
      </main>

      <footer className="site-footer">
        <p>© 2026 你的工具箱</p>
        <p>先把一个工具做好，再继续扩展</p>
      </footer>
    </div>
  );
}
