# Design System

> 本项目通用设计规范，所有工具页必须遵循。

---

## 1. 设计哲学

### 1.1 核心原则

| 原则 | 说明 |
|------|------|
| **克制** | 颜色少而精，主色调不超过 3 个 |
| **清晰** | 信息层级通过颜色对比度明确区分 |
| **一致** | 相同语义元素在不同页面表现一致 |
| **渐进** | 交互引导由浅入深，不一次性暴露全部功能 |

### 1.2 交互风格：渐进引导式

```
用户旅程设计：
┌─────────┐    ┌─────────┐    ┌─────────┐    ┌─────────┐
│  触发   │ → │  反馈   │ → │  展开   │ → │  深入   │
│ (轻量)  │    │ (即时)  │    │ (可选)  │    │ (完整)  │
└─────────┘    └─────────┘    └─────────┘    └─────────┘
```

**具体约束：**
- **首屏极简**：初始状态只展示核心入口
- **即时反馈**：任何操作都有视觉响应（hover、click、loading）
- **分层展开**：次要功能折叠，需要时展开
- **避免弹窗轰炸**：优先使用 inline 展开、抽屉、横幅，而非阻断式弹窗

---

## 2. Design Tokens

### 2.1 颜色系统

#### Light Mode

```css
/* 背景层 */
--bg-page: #f5f3f0;           /* 页面背景 - 暖灰 */
--bg-card: #ffffff;           /* 卡片背景 - 纯白 */
--bg-elevated: #faf9f7;       /* 悬浮背景 - 浅灰 */
--bg-overlay: rgba(0,0,0,0.3); /* 遮罩层 */

/* 主色调 - 墨绿 */
--primary-900: #20342f;       /* 主按钮、强调文字 */
--primary-700: #2d7a5a;       /* 成功状态、链接 */
--primary-100: rgba(32,52,47,0.05); /* 悬停背景 */

/* 功能色 */
--warning-600: #b58a2a;       /* 警告图标、待处理 */
--warning-400: #b54a2a;       /* 错误、危险操作 */
--success-600: #2d7a5a;       /* 成功状态 */
--info-600: #2d5a7a;          /* 信息提示（可选） */

/* 文字色 */
--text-primary: #3c3326;      /* 主文字 - 深褐 */
--text-secondary: #5c574e;    /* 次要文字 */
--text-tertiary: #8b8075;     /* 辅助文字、placeholder */
--text-white: #ffffff;        /* 白底上的文字 */

/* 边框/分割线 */
--border-light: rgba(60,51,38,0.08);
--border-medium: rgba(60,51,38,0.12);
--border-focus: rgba(32,52,47,0.3);
```

#### Dark Mode

```css
--bg-page: #1a1a1a;
--bg-card: #252525;
--bg-elevated: #2a2a2a;
--bg-overlay: rgba(0,0,0,0.7);

--primary-900: #4a9e7c;
--primary-700: #5cb85c;
--primary-100: rgba(74,158,124,0.1);

--warning-600: #d4a84b;
--warning-400: #d46a4a;
--success-600: #5cb85c;
--info-600: #5a9ec8;

--text-primary: #e8e4e0;
--text-secondary: #a8a29a;
--text-tertiary: #6b6560;
--text-white: #1a1a1a;

--border-light: rgba(255,255,255,0.08);
--border-medium: rgba(255,255,255,0.12);
--border-focus: rgba(74,158,124,0.4);
```

### 2.2 间距系统

```css
/* 基础单位 4px */
--space-1: 4px;
--space-2: 8px;
--space-3: 12px;
--space-4: 16px;
--space-5: 20px;
--space-6: 24px;
--space-8: 32px;
--space-10: 40px;
--space-12: 48px;

/* 语义化间距 */
--gap-xs: var(--space-1);
--gap-sm: var(--space-2);
--gap-md: var(--space-4);
--gap-lg: var(--space-6);
--gap-xl: var(--space-8);

/* 内边距 */
--padding-card: var(--space-6);
--padding-button-sm: var(--space-2) var(--space-3);
--padding-button-md: var(--space-3) var(--space-5);
--padding-input: var(--space-3) var(--space-4);
--padding-section: var(--space-8);
```

### 2.3 圆角系统

```css
--radius-sm: 6px;             /* 小按钮、标签 */
--radius-md: 8px;             /* 输入框、卡片 */
--radius-lg: 12px;            /* 大卡片、弹窗 */
--radius-xl: 16px;            /* 特殊强调 */
--radius-full: 9999px;        /* 胶囊按钮 */
```

### 2.4 阴影系统

```css
/* Light Mode */
--shadow-sm: 0 1px 2px rgba(0,0,0,0.05);
--shadow-md: 0 4px 12px rgba(0,0,0,0.08);
--shadow-lg: 0 8px 24px rgba(0,0,0,0.12);
--shadow-xl: 0 8px 32px rgba(0,0,0,0.2);

/* Dark Mode */
--shadow-sm: 0 1px 2px rgba(0,0,0,0.2);
--shadow-md: 0 4px 12px rgba(0,0,0,0.3);
--shadow-lg: 0 8px 24px rgba(0,0,0,0.4);
--shadow-xl: 0 8px 32px rgba(0,0,0,0.5);
```

### 2.5 字体系统

```css
--font-sans: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
--font-mono: 'SF Mono', Monaco, monospace;

--text-xs: 12px;
--text-sm: 13px;
--text-base: 14px;
--text-md: 16px;
--text-lg: 18px;
--text-xl: 20px;
--text-2xl: 24px;

--font-normal: 400;
--font-medium: 500;
--font-semibold: 600;
--font-bold: 700;
```

---

## 3. 组件规范

### 3.1 按钮

#### Primary Button
```css
background: var(--primary-900);
color: var(--text-white);
border-radius: var(--radius-md);
padding: var(--padding-button-md);
font-size: var(--text-base);
font-weight: var(--font-medium);
transition: all 0.2s ease;

/* Hover */
filter: brightness(1.1);
transform: translateY(-1px);

/* Active */
transform: translateY(0);
```

#### Secondary Button
```css
background: transparent;
color: var(--text-secondary);
padding: var(--padding-button-sm);
font-size: var(--text-sm);

/* Hover */
color: var(--primary-900);
background: var(--primary-100);
```

#### Warning Button
```css
background: linear-gradient(135deg, var(--warning-600), var(--warning-400));
color: var(--text-white);
box-shadow: 0 2px 8px rgba(181,138,42,0.3);
```

### 3.2 输入控件

#### 文本输入
```css
border: 1px solid var(--border-medium);
border-radius: var(--radius-md);
background: var(--bg-card);
padding: var(--padding-input);
font-size: var(--text-base);
color: var(--text-primary);

transition: border-color 0.2s, box-shadow 0.2s;

/* Focus */
border-color: var(--primary-900);
box-shadow: 0 0 0 3px var(--primary-100);
```

#### 选择器（Select）
```css
/* 同文本输入基础样式 */
/* 下拉箭头使用 SVG 图标，非浏览器默认 */
appearance: none;
background-image: url("data:image/svg+xml,...");
background-repeat: no-repeat;
background-position: right 12px center;
padding-right: 40px;

transition: border-color 0.2s, background-color 0.2s;

/* Hover */
border-color: var(--primary-700);
background-color: var(--bg-elevated);

/* Focus */
border-color: var(--primary-900);
box-shadow: 0 0 0 3px var(--primary-100);
```

#### 自定义下拉菜单（Dropdown）
```css
/* 触发器 */
.dropdown-trigger {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
  padding: 8px 12px;
  width: 120px;               /* 固定宽度 */
  border: 1px solid var(--border-medium);
  border-radius: var(--radius-md);
  background: var(--bg-card);
  color: var(--text-primary);
  font-size: 14px;
  cursor: pointer;
  transition: all 0.2s ease;
}

.dropdown-trigger-text {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;        /* 文字不换行 */
}

.dropdown-trigger:hover {
  border-color: var(--primary-700);
  background: var(--bg-elevated);
}

.dropdown-trigger.active {
  border-color: var(--primary-900);
  box-shadow: 0 0 0 3px var(--primary-100);
}

/* 下拉菜单 */
.dropdown-menu {
  position: absolute;
  top: calc(100% + 4px);
  background: var(--bg-card);
  border: 1px solid var(--border-light);
  border-radius: var(--radius-md);
  box-shadow: var(--shadow-lg);
  z-index: 100;
  opacity: 0;
  visibility: hidden;
  transform: translateY(-8px);
  transition: all 0.2s ease;
  overflow: hidden;
  min-width: 100%;
}

.dropdown-menu.show {
  opacity: 1;
  visibility: visible;
  transform: translateY(0);
}

/* 菜单项 */
.dropdown-item {
  padding: 6px 10px;          /* 紧凑间距 */
  font-size: 13px;            /* 稍小字体 */
  color: var(--text-primary);
  cursor: pointer;
  transition: all 0.15s ease;
  display: flex;
  align-items: center;
  gap: 4px;
  white-space: nowrap;        /* 文字不换行 */
  overflow: hidden;
  text-overflow: ellipsis;
}

.dropdown-item:hover {
  background: var(--primary-100);
  color: var(--primary-900);
}

.dropdown-item.selected {
  background: var(--primary-100);
  color: var(--primary-900);
  font-weight: 500;
}

/* 分隔线 */
.dropdown-divider {
  height: 1px;
  background: var(--border-light);
  margin: 4px 0;
}
```

**使用建议：**
- 原生 Select：简单场景，不需要自定义选项样式
- 自定义 Dropdown：需要图标、分组、复杂选项样式时使用

#### 复选框 & 单选
```css
width: 18px;
height: 18px;
border: 2px solid var(--border-medium);
border-radius: 4px; /* 单选使用 50% */
cursor: pointer;
transition: all 0.15s;

/* Checked */
background: var(--primary-900);
border-color: var(--primary-900);
```

#### 开关（Toggle）
```css
width: 44px;
height: 24px;
border-radius: 9999px;
background: var(--border-medium);
position: relative;
transition: background 0.2s;

/* Knob */
width: 20px;
height: 20px;
border-radius: 50%;
background: white;
position: absolute;
left: 2px;
top: 2px;
transition: transform 0.2s;

/* Checked */
background: var(--primary-900);
transform: translateX(20px);
```

### 3.3 选择类控件

#### 标签选择器（Chip/Tag）
```css
display: inline-flex;
align-items: center;
gap: 4px;
padding: 4px 10px;
border-radius: 9999px;
font-size: var(--text-xs);
font-weight: 500;

/* Default */
background: var(--primary-100);
color: var(--primary-900);

/* Selected */
background: var(--primary-900);
color: var(--text-white);
```

#### 单选卡片
```css
border: 2px solid var(--border-light);
border-radius: var(--radius-md);
padding: var(--space-4);
cursor: pointer;
transition: all 0.2s;

/* Hover */
border-color: var(--border-medium);
background: var(--bg-elevated);

/* Selected */
border-color: var(--primary-900);
background: var(--primary-100);
box-shadow: 0 0 0 3px var(--primary-100);
```

### 3.4 数据展示

#### 表格筛选器规范

```
【数据字段筛选 - 左侧】           【操作按钮 - 右侧】
名称...  [类型 ▼]  [时间 ▼]      [搜索] [重置] [导出]

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
表格内容...
```

**筛选字段**
- 位置：表格头部或表格上方的筛选栏
- 布局：筛选字段在左，操作按钮在右
- 字段类型：
  - 文本搜索（名称、编号等）- 输入框（需配合搜索按钮）
  - 枚举筛选（类型、状态、分类等）- 下拉选择（即时触发）
  - 时间范围（创建时间、更新时间）- 下拉或日期选择器（即时触发）
- 操作按钮顺序：[搜索] [重置] [导出]
- 交互：文本搜索需点击搜索按钮，下拉筛选即时触发

```css
/* 状态标签页区域 */
.table-tabs {
  display: flex;
  gap: 4px;
  padding: 16px 24px;
  background: var(--bg-card);
  border-radius: 16px 16px 0 0;
  border-bottom: 1px solid var(--border-light);
}

/* 数据字段筛选栏 */
.table-filters {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px 24px;
  background: var(--bg-card);
  border-bottom: 1px solid var(--border-light);
  flex-wrap: wrap;
  gap: 12px;
}

/* 筛选字段组 */
.filter-group {
  display: flex;
  align-items: center;
  gap: 10px;
  flex-wrap: wrap;
}

/* 操作按钮组 */
.table-actions {
  display: flex;
  gap: 8px;
}
```

**设计原则：**
- 数据字段筛选用输入框/下拉（精准查询）
- 筛选器在左，操作按钮在右
- 按钮使用小尺寸（padding: 8px 12/16px, font-size: 13px）

#### 卡片
```css
background: var(--bg-card);
border-radius: var(--radius-lg);
padding: var(--padding-card);
box-shadow: var(--shadow-md);
border: 1px solid var(--border-light);
transition: box-shadow 0.2s, transform 0.2s;

/* Hover（可点击卡片） */
box-shadow: var(--shadow-lg);
transform: translateY(-2px);
```

#### 列表项
```css
padding: var(--space-4);
border-bottom: 1px solid var(--border-light);
transition: background 0.15s;

/* Hover */
background: var(--bg-elevated);
```

#### 表格
```css
width: 100%;
border-collapse: collapse;
font-size: var(--text-sm);

th, td {
  padding: var(--space-3) var(--space-4);
  text-align: left;
  border-bottom: 1px solid var(--border-light);
}

th {
  font-weight: 600;
  color: var(--text-secondary);
  font-size: var(--text-xs);
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

tr:hover td {
  background: var(--bg-elevated);
}
```

### 3.5 导航与布局

#### 步骤指示器
```css
.step-dot {
  width: 28px;
  height: 28px;
  border-radius: 50%;
  background: var(--border-medium);
  color: var(--text-tertiary);
  font-size: var(--text-xs);
  font-weight: 600;

  /* Active */
  background: var(--primary-900);
  color: var(--text-white);

  /* Completed */
  background: var(--primary-700);
  color: var(--text-white);
}

.step-line {
  flex: 1;
  height: 2px;
  background: var(--border-medium);

  /* Completed */
  background: var(--primary-700);
}
```

#### 标签页（Tabs）
```css
.tab-list {
  display: flex;
  border-bottom: 1px solid var(--border-light);
  gap: var(--space-1);
}

.tab {
  padding: var(--space-3) var(--space-4);
  font-size: var(--text-sm);
  color: var(--text-secondary);
  border-bottom: 2px solid transparent;
  margin-bottom: -1px;
  cursor: pointer;
  transition: all 0.2s;
}

.tab:hover {
  color: var(--text-primary);
  background: var(--bg-elevated);
}

.tab.active {
  color: var(--primary-900);
  border-bottom-color: var(--primary-900);
  font-weight: 500;
}
```

#### 面包屑
```css
display: flex;
align-items: center;
gap: var(--space-2);
font-size: var(--text-sm);
color: var(--text-secondary);

.breadcrumb-item:not(:last-child)::after {
  content: '/';
  margin-left: var(--space-2);
  color: var(--text-tertiary);
}

.breadcrumb-item:last-child {
  color: var(--text-primary);
  font-weight: 500;
}
```

### 3.6 反馈与状态

#### 警告横幅
```css
background: linear-gradient(135deg, rgba(181,138,42,0.1), rgba(181,74,42,0.05));
border: 1px solid rgba(181,138,42,0.2);
border-radius: var(--radius-md);
padding: var(--space-3) var(--space-4);
color: var(--warning-600);
font-size: var(--text-sm);
cursor: pointer;
transition: all 0.2s;

/* Hover */
border-color: rgba(181,138,42,0.4);
box-shadow: 0 2px 8px rgba(181,138,42,0.1);
```

#### 空状态
```css
text-align: center;
padding: var(--space-12) var(--space-8);

.empty-icon {
  font-size: 48px;
  margin-bottom: var(--space-4);
  opacity: 0.5;
}

.empty-title {
  font-size: var(--text-lg);
  font-weight: 600;
  color: var(--text-primary);
  margin-bottom: var(--space-2);
}

.empty-desc {
  font-size: var(--text-sm);
  color: var(--text-secondary);
  margin-bottom: var(--space-6);
}
```

#### 加载状态
```css
/* Spinner */
.spinner {
  width: 24px;
  height: 24px;
  border: 2px solid var(--border-light);
  border-top-color: var(--primary-900);
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
}

/* Skeleton */
.skeleton {
  background: linear-gradient(
    90deg,
    var(--bg-elevated) 25%,
    var(--border-light) 50%,
    var(--bg-elevated) 75%
  );
  background-size: 200% 100%;
  animation: shimmer 1.5s infinite;
  border-radius: var(--radius-sm);
}
```

### 3.7 浮层与弹窗

#### 抽屉（Drawer）- 优先使用
```css
position: fixed;
right: 0;
top: 0;
bottom: 0;
width: 480px;
max-width: 90vw;
background: var(--bg-card);
box-shadow: var(--shadow-xl);
z-index: 1000;
transform: translateX(100%);
transition: transform 0.3s ease;

/* Open */
transform: translateX(0);
```

#### 居中弹窗（Modal）- 谨慎使用
```css
position: fixed;
top: 50%;
left: 50%;
transform: translate(-50%, -50%);
width: 400px;
max-width: 90vw;
max-height: 80vh;
border-radius: var(--radius-lg);
background: var(--bg-card);
box-shadow: var(--shadow-xl);
z-index: 2000;

/* 仅用于关键确认、错误提示 */
```

#### Tooltip
```css
position: absolute;
padding: var(--space-2) var(--space-3);
background: var(--text-primary);
color: var(--bg-card);
font-size: var(--text-xs);
border-radius: var(--radius-sm);
z-index: 1300;
opacity: 0;
transform: translateY(4px);
transition: opacity 0.15s, transform 0.15s;
pointer-events: none;

/* Visible */
opacity: 1;
transform: translateY(0);
```

#### 下拉菜单
```css
position: absolute;
min-width: 160px;
background: var(--bg-card);
border-radius: var(--radius-md);
box-shadow: var(--shadow-lg);
border: 1px solid var(--border-light);
z-index: 1100;
opacity: 0;
transform: scale(0.96);
transition: opacity 0.15s, transform 0.15s;

/* Visible */
opacity: 1;
transform: scale(1);
```

---

## 4. 交互模式

### 4.1 渐进展开模式

**场景：列表项有更多操作**

```
初始状态：仅显示主信息和【查看详情】
点击展开：展开该行，显示完整信息和操作按钮
再次点击：收起

而非：一次性展示所有列和操作按钮
```

### 4.2 分步向导模式

**场景：局域网文件共享**

```
【步骤 1：上传】          【步骤 2：处理】          【步骤 3：分享】
┌─────────────┐          ┌─────────────┐          ┌─────────────┐
│   📤        │    →     │   ⚡        │    →     │   ✓         │
│ 选择文件    │          │ 生成链接... │          │ 复制链接    │
│             │          │ ████████░░░ │          │ 完成/再来   │
└─────────────┘          └─────────────┘          └─────────────┘

核心设计：
- 每步只有一个明确的行动点
- 进度实时反馈（进度条/动画）
- 随时可以返回上一步
- 最终结果直接可用
```

**设计要点：**
1. **首屏极简**：只有上传区，没有其他干扰
2. **即时反馈**：选择文件后立即进入处理状态
3. **进度可见**：让用户知道正在发生什么
4. **结果直接**：分享链接一键复制，无需额外操作

### 4.2 上下文引导模式

```
场景：新用户首次使用

第1步：高亮核心入口，其他区域弱化（mask）
第2步：用户点击后，高亮下一个关键元素
第3步：完成核心流程后，展示完整界面

而非：一次性弹出长篇引导说明
```

### 4.3 即时反馈模式

| 操作 | 反馈 |
|------|------|
| Hover 可点击元素 | 颜色变化 / 轻微上浮 |
| Click 按钮 | 按下效果 + Loading 状态 |
| 提交表单 | 按钮变 Loading，成功/失败提示 |
| 长操作 | 进度条或百分比显示 |
| 完成操作 | 轻量提示（toast）或状态更新 |

### 4.4 容错恢复模式

```
删除操作：
1. 删除按钮点击 → 按钮变为"确认删除"（二次确认 inline）
2. 确认后执行 → 显示"已删除" + 【撤销】按钮（3秒内）
3. 超时后 → 状态更新，撤销按钮消失

而非：直接弹出确认对话框阻断流程
```

---

## 5. 布局规范

### 5.1 容器尺寸

| 场景 | 宽度 | 说明 |
|------|------|------|
| 标准卡片 | 600px | 表单、简单流程 |
| 宽卡片 | 800px | 复杂表单、详情页 |
| 展开大屏 | 95vw, max 1400px | 数据大盘、报表 |
| 抽屉 | 480px | 详情、编辑 |
| 小弹窗 | 400px | 确认、提示 |

### 5.2 响应式断点

```css
--breakpoint-sm: 480px;   /* 手机 */
--breakpoint-md: 768px;   /* 平板 */
--breakpoint-lg: 1024px;  /* 小桌面 */
--breakpoint-xl: 1400px;  /* 大桌面 */
```

### 5.3 层级（Z-Index）

```css
--z-dropdown: 100;        /* 下拉菜单 */
--z-sticky: 200;          /* 吸顶元素 */
--z-drawer: 1000;         /* 抽屉 */
--z-modal: 1100;          /* 弹窗 */
--z-toast: 1200;          /* 全局提示 */
--z-tooltip: 1300;        /* 工具提示 */
```

---

## 6. 动画规范

### 6.1 过渡时间

```css
--duration-fast: 150ms;     /* 悬停、小状态 */
--duration-normal: 200ms;   /* 按钮、折叠 */
--duration-slow: 300ms;     /* 弹窗、抽屉 */
--easing-default: ease;
--easing-smooth: cubic-bezier(0.4, 0, 0.2, 1);
```

### 6.2 动画曲线

| 场景 | 曲线 | 说明 |
|------|------|------|
| 悬停效果 | ease | 自然响应 |
| 展开/收起 | cubic-bezier(0.4, 0, 0.2, 1) | 平滑减速 |
| 弹出层 | cubic-bezier(0, 0, 0.2, 1) | 快速出现，缓慢落定 |
| 消失 | ease-in | 快速退出 |

### 6.3 常用动画

```css
@keyframes fade-in {
  from { opacity: 0; }
  to { opacity: 1; }
}

@keyframes slide-up {
  from { opacity: 0; transform: translateY(8px); }
  to { opacity: 1; transform: translateY(0); }
}

@keyframes scale-in {
  from { opacity: 0; transform: scale(0.96); }
  to { opacity: 1; transform: scale(1); }
}

@keyframes spin {
  to { transform: rotate(360deg); }
}
```

---

## 7. 禁忌清单

| ❌ 禁止 | ✅ 正确 | 原因 |
|--------|--------|------|
| 使用纯黑 `#000` | 使用暖灰 `#3c3326` | 纯黑过于刺眼，暖灰更柔和 |
| 使用纯红 `#ff0000` | 使用 `#b54a2a` | 功能色需符合整体调性 |
| 圆角不统一 | 严格使用 6/8/12/16 档 | 保持一致性 |
| 阴影颜色不统一 | 统一使用 `rgba(0,0,0,0.xx)` | 避免混乱 |
| 文字颜色超过4种 | 只用 `text-primary/secondary/tertiary` | 控制层级 |
| 随意添加新颜色 | 必须使用 token 中的颜色 | 维护一致性 |
| 阻断式弹窗提示 | 使用 inline 或抽屉 | 渐进引导，不打断流程 |
| 一次性展示全部功能 | 分层展开，核心优先 | 降低认知负担 |
| 操作无反馈 | 任何操作都有视觉响应 | 确认用户意图 |
| 删除直接弹窗确认 | inline 二次确认 + 撤销 | 更流畅的体验 |

---

## 8. 使用示例

### CSS 变量切换 Dark Mode

```css
:root {
  /* Light 模式作为默认 */
  --bg-page: #f5f3f0;
  /* ... */
}

[data-theme="dark"] {
  --bg-page: #1a1a1a;
  /* ... */
}
```

### 渐进展开组件示例

```html
<!-- 初始状态 -->
<div class="list-item" onclick="toggleExpand(this)">
  <div class="item-summary">
    <span>项目名称</span>
    <span class="text-secondary">概要信息</span>
  </div>
  <button class="btn btn-secondary">查看详情</button>
</div>

<!-- 展开状态 -->
<div class="list-item expanded">
  <div class="item-summary">...</div>
  <div class="item-detail">
    <!-- 完整信息 -->
    <div class="actions">
      <button class="btn btn-primary">编辑</button>
      <button class="btn btn-secondary">删除</button>
    </div>
  </div>
</div>
```

---

## 9. 迭代记录

| 日期 | 版本 | 变更 |
|------|------|------|
| 2026-03-19 | v1.0 | 初始版本，建立完整 Design System |

---

**待讨论事项：**
- [ ] Dark Mode 颜色对比度是否舒适
- [ ] 是否需要更多功能色（如 info、neutral）
- [ ] 是否需要更细致的按钮尺寸档位
- [ ] 图表专用颜色序列设计

---

## 10. 代码实现

### 10.1 目录结构

```
@design/
├── tokens/           # Design Tokens（真实代码）
│   ├── colors.ts
│   ├── spacing.ts
│   ├── typography.ts
│   └── index.ts
├── components/       # 共享组件（真实代码）
│   ├── Button.tsx
│   ├── Card.tsx
│   ├── Input.tsx
│   ├── Slider.tsx
│   ├── Toggle.tsx
│   ├── ProgressBar.tsx
│   └── index.ts
└── showcase/         # 规范展示页
    └── index.html
```

### 10.2 使用方式

**Tokens:**
```typescript
import { colors, spacing } from '@design/tokens';

const style = {
  background: colors.bgCard,
  padding: spacing.md,
};
```

**Components:**
```typescript
import { Button, Card, Input } from '@design/components';

<Card>
  <Input placeholder="输入" />
  <Button variant="primary">提交</Button>
</Card>
```

### 10.3 新增 Token/组件流程

1. 在 `tokens/` 或 `components/` 添加定义
2. 更新对应 `index.ts` 导出
3. 修改 showcase 展示新内容
4. 更新本文档说明
5. 提交 PR 评审
