'use client';

import Link from 'next/link';
import { useMemo, useState } from 'react';
import { ThemeToggle } from '@/components/theme-toggle';

type ToolItem = {
  key: string;
  name: string;
  description: string;
  href?: string;
  icon: React.ReactNode;
};

type ToolGroup = {
  id: string;
  title: string;
  tools: ToolItem[];
};

const toolGroups: ToolGroup[] = [
  {
    id: 'daily',
    title: '日常工具',
    tools: [
      {
        key: 'lan-transfer',
        name: '局域网文件传输',
        description: '同一局域网内直连传文件，手机电脑免中转。',
        href: '/lan-transfer',
        icon: (
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
            <path d="M7 7h.01" />
            <path d="M17 7h.01" />
            <path d="M7 17h.01" />
            <path d="M17 17h.01" />
            <rect x="4" y="4" width="16" height="16" rx="3" />
            <path d="M8.5 12h7" />
            <path d="m13 9 2.5 3-2.5 3" />
          </svg>
        ),
      },
      {
        key: 'ocr-invoice',
        name: '发票 OCR 汇总',
        description: '批量识别 PDF、图片、ZIP 并汇总导出。',
        href: '/ocr-invoice',
        icon: (
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
            <rect x="4" y="4" width="16" height="16" rx="3" />
            <path d="M8 9h8" />
            <path d="M8 13h4" />
            <path d="M8 17h8" />
          </svg>
        ),
      },
      {
        key: 'calculator',
        name: '计算器',
        description: '表达式计算、括号、小数、历史记录。',
        href: '/calculator',
        icon: (
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
            <rect x="5" y="3.5" width="14" height="17" rx="2.5" />
            <path d="M8 7.5h8" />
            <path d="M8 11.5h2" />
            <path d="M14 11.5h2" />
            <path d="M8 15.5h2" />
            <path d="M14 15.5h2" />
          </svg>
        ),
      },
    ],
  },
  {
    id: 'developer',
    title: '开发者工具',
    tools: [
      {
        key: 'cron',
        name: 'Cron 表达式',
        description: 'Quartz 6/7 段构建、校验、反解析与触发预览。',
        href: '/cron',
        icon: (
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
            <path d="M12 6v6l4 2" />
            <circle cx="12" cy="12" r="8" />
            <path d="M5 4.5h4" />
            <path d="M15 19.5h4" />
          </svg>
        ),
      },
      {
        key: 'timestamp',
        name: '时间戳转换',
        description: 'Unix 时间与日期格式互转。',
        icon: (
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
            <path d="M12 6v6l4 2" />
            <circle cx="12" cy="12" r="8" />
          </svg>
        ),
      },
      {
        key: 'diff',
        name: '文本比对',
        description: '快速对比两段文本差异。',
        icon: (
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
            <path d="M6 7h12" />
            <path d="M6 12h6" />
            <path d="M6 17h12" />
            <path d="M16 10l2 2 4-4" />
          </svg>
        ),
      },
      {
        key: 'random',
        name: '随机字符串',
        description: '生成测试用随机内容。',
        icon: (
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
            <path d="M7 8a3 3 0 0 1 3-3h4a3 3 0 1 1 0 6h-4a3 3 0 1 0 0 6h4a3 3 0 1 0 0-6" />
          </svg>
        ),
      },
    ],
  },
  {
    id: 'coming',
    title: '即将上线',
    tools: [
      {
        key: 'date',
        name: '日期工具',
        description: '日期差、周次、格式化。',
        icon: (
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
            <path d="M4 7h16" />
            <path d="M7 4v6" />
            <path d="M17 4v6" />
            <rect x="4" y="5" width="16" height="15" rx="2" />
          </svg>
        ),
      },
      {
        key: 'format',
        name: '格式转换',
        description: 'JSON、YAML、文本格式互转。',
        icon: (
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
            <path d="M8 8h8" />
            <path d="M8 12h8" />
            <path d="M8 16h5" />
            <rect x="5" y="4" width="14" height="16" rx="2" />
          </svg>
        ),
      },
      {
        key: 'more',
        name: '更多工具',
        description: '按高频需求持续补充。',
        icon: (
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
            <path d="M5 12h14" />
            <path d="M12 5v14" />
          </svg>
        ),
      },
    ],
  },
];

export default function HomePage() {
  const [inputValue, setInputValue] = useState('');
  const [keyword, setKeyword] = useState('');

  const groups = useMemo(() => {
    const normalized = keyword.trim().toLowerCase();

    if (!normalized) {
      return toolGroups;
    }

    return toolGroups
      .map((group) => ({
        ...group,
        tools: group.tools.filter((tool) =>
          `${tool.name} ${tool.description}`.toLowerCase().includes(normalized),
        ),
      }))
      .filter((group) => group.tools.length > 0);
  }, [keyword]);

  const renderToolCard = (tool: ToolItem) => {
    const isAvailable = Boolean(tool.href);
    const cardClassName = isAvailable
      ? 'tool-card'
      : 'tool-card tool-card-disabled';
    const iconClassName = isAvailable ? 'tool-icon' : 'tool-icon tool-icon-disabled';

    const content = (
      <>
        <div className="tool-card-header">
          <span className={iconClassName} aria-hidden="true">
            {tool.icon}
          </span>
          {!isAvailable ? (
            <span className="tool-status-badge" aria-label={`${tool.name}开发中`}>
              开发中
            </span>
          ) : null}
        </div>
        <h3 className="tool-card-title">{tool.name}</h3>
        <p className="tool-card-desc">{tool.description}</p>
      </>
    );

    if (isAvailable) {
      return (
        <Link
          key={tool.key}
          className={cardClassName}
          href={tool.href!}
          aria-label={`进入${tool.name}`}
        >
          {content}
        </Link>
      );
    }

    return (
      <div key={tool.key} className={cardClassName}>
        {content}
      </div>
    );
  };

  return (
    <div className="site-shell">
      <header className="site-header fade-up">
        <Link className="brand" href="/">
          <span className="brand-mark" aria-hidden="true" />
          <span className="brand-text">你的工具箱</span>
        </Link>
        <nav className="main-nav" aria-label="主导航">
          <Link className="is-active" href="/">
            首页
          </Link>
          <ThemeToggle />
        </nav>
      </header>

      <main className="main-content">
        <section className="hero fade-up fade-delay-1">
          <p className="hero-kicker">Personal Tool Notes</p>
          <h1>工具箱</h1>
          <p className="hero-desc">简洁、顺手、直接可用</p>
          <div className="tool-search" aria-label="工具检索区">
            <div className="search-row">
              <label className="search-input-wrap" htmlFor="tool-search">
                <span className="sr-only">搜索工具</span>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  <circle cx="11" cy="11" r="7" />
                  <path d="m20 20-3.5-3.5" />
                </svg>
                <input
                  id="tool-search"
                  className="tool-search-input"
                  type="search"
                  value={inputValue}
                  onChange={(event) => setInputValue(event.target.value)}
                  onKeyDown={(event) => {
                    if (event.key === 'Enter') {
                      setKeyword(inputValue);
                    }
                  }}
                  placeholder="搜索工具，如 计算器 / 时间戳"
                />
              </label>
              <button
                className="btn btn-primary"
                type="button"
                onClick={() => setKeyword(inputValue)}
              >
                搜索
              </button>
            </div>
          </div>
        </section>

        <section className="tool-directory fade-up fade-delay-2">
          {groups.map((group) => (
            <section key={group.id} className="tool-group">
              <div className="tool-group-head">
                <h2>{group.title}</h2>
                <span className="tool-count">{group.tools.length}</span>
              </div>
              <div className="tool-list">{group.tools.map(renderToolCard)}</div>
            </section>
          ))}
        </section>
      </main>

      <footer className="site-footer">
        <p>© 2026 你的工具箱</p>
        <p>先把一个工具做好，再继续扩展</p>
      </footer>
    </div>
  );
}
