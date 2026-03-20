# Project Toolbox - 开发规范

> 本项目是一个工具集合平台，所有工具必须遵循以下规范。

---

## 1. 项目结构

```
├── apps/                    # 应用源码
│   ├── web/                # Web 应用主包
│   └── api/                # API 服务
├── references/             # 工具引用集合（核心）
│   ├── @design/            # 设计规范（强制遵循）
│   │   ├── tokens/         # Design Tokens
│   │   ├── components/     # 共享组件
│   │   └── showcase/       # 规范展示页
│   ├── @tools/             # 工具集合
│   │   ├── _template/      # 新工具模板
│   │   ├── ocr-invoice/    # OCR 发票识别
│   │   ├── lan-transfer/   # 局域网文件传输
│   │   └── calculator/     # 计算器
│   └── @shared/            # 共享资源
│       ├── utils/          # 工具函数
│       ├── hooks/          # 共享 Hooks
│       └── styles/         # 共享样式
├── docs/                   # 文档
│   ├── design/             # 设计文档
│   ├── api/                # API 文档
│   └── guides/             # 开发指南
├── .cache/                 # 缓存目录（不提交 Git）
│   ├── temp/               # 临时文件
│   └── output/             # 构建输出
├── docker/                 # Docker 配置
└── scripts/                # 构建/部署脚本
```

---

## 2. 开发规范

### 2.1 设计规范（强制）

所有工具必须遵循 `references/@design` 中定义的设计规范：

- **Design Tokens**: 颜色、间距、圆角、阴影、字体
- **组件规范**: 按钮、输入框、表格、弹窗等
- **交互模式**: 渐进引导式交互

**关键约束：**
- 禁止随意添加新颜色，必须使用 Token
- 圆角严格使用 6/8/12/16 档
- 优先使用 inline 展开而非阻断式弹窗

详见：`references/@design/README.md`

### 2.2 新工具开发流程（5步标准流程）

**硬性约束：必须切新分支开发，禁止原分支直接开发**

```
1. 创建分支
   git checkout -b feature/tool-{tool-id}
   示例：feature/tool-password-generator

2. 复制模板
   cp -r references/@tools/_template references/@tools/{tool-id}

3. 开发实现（按顺序）
   3.1 编写 DESIGN.md（需求、交互流程、组件清单）
   3.2 制作 prototype.html（可交互原型）
   3.3 评审通过后，正式开发 src/index.tsx
   3.4 编写 README.md（使用统一验收清单）

4. 自检并提交 PR
   - 对照验收清单逐项检查
   - 填写 PR 模板
   - 关联进度文档

5. 合并后更新进度
   修改 docs/tools/index.md 更新状态为"已完成"
```

**Bug 修复流程**：
```
git checkout -b bugfix/tool-{tool-id}-{描述}
# 修复代码 → 自检 → 提交 PR → 合并
```

### 2.3 文件命名规范

| 类型 | 命名 | 示例 |
|------|------|------|
| 组件 | PascalCase | `InvoiceCard.tsx` |
| 工具函数 | camelCase | `formatDate.ts` |
| 常量 | SNAKE_CASE | `API_ENDPOINTS.ts` |
| 样式文件 | kebab-case | `invoice-card.css` |
| 测试文件 | `*.test.ts` | `formatDate.test.ts` |

### 2.4 Git 提交规范

```
类型: 描述

类型列表:
- feat: 新功能
- fix: Bug 修复
- docs: 文档更新
- style: 代码格式（不影响功能）
- refactor: 重构
- test: 测试相关
- chore: 构建/工具相关

示例:
feat(ocr): 添加发票批量识别功能
fix(calculator): 修复除零错误
docs: 更新设计规范文档
```

### 2.5 分支管理规范（硬性约束）

| 场景 | 分支命名 | 基分支 |
|------|----------|--------|
| 新工具开发 | `feature/tool-{tool-id}` | master |
| Bug 修复 | `bugfix/tool-{tool-id}-{简述}` | master |

**禁止行为**：
- ❌ 在业务功能分支（如 `feature/ocr-dashboard`）上直接开发新工具
- ❌ 多工具共用同一分支开发
- ❌ 未经 PR 直接推送到 master

### 2.6 PR 模板

创建 PR 时必须填写：

```markdown
## 工具信息
- **Tool ID**: {tool-id}
- **类型**: 新工具 / Bug 修复
- **关联文档**: docs/tools/{tool-id}.md

## 验收清单
- [ ] DESIGN.md 已完成
- [ ] prototype.html 已通过评审
- [ ] 代码遵循 Design System
- [ ] 渐进引导式交互实现
- [ ] README.md 已更新
- [ ] 无 console.log / debugger
- [ ] 构建通过

## 截图
<!-- UI 变更必须附截图 -->
```

### 2.7 工具版本管理

每个工具文件头必须包含版本注释：

```typescript
/**
 * {工具名称}
 * @id {tool-id}
 * @version {major.minor.patch}
 * @since {YYYY-MM-DD}
 */
```

版本号规则：
- `major`: 破坏性变更或整体重构
- `minor`: 功能新增
- `patch`: Bug 修复或优化

---

## 3. 工具进度管控

工具开发进度统一在 `docs/tools/index.md` 维护，禁止分散在各工具 README 中。

### 3.1 进度状态定义

| 状态 | 图标 | 说明 |
|------|------|------|
| 规划中 | 📝 | 需求确认，尚未开分支 |
| 开发中 | 🚧 | 已切分支，正在开发 |
| 评审中 | 👀 | PR 已提交，等待评审 |
| 已完成 | ✅ | 已合并到 master |

### 3.2 工具档案

每个工具在 `docs/tools/{tool-id}.md` 维护独立档案：
- 功能摘要
- 版本历史
- 已知问题
- 维护者

---

## 4. 目录说明

| 目录 | 用途 | 提交 Git |
|------|------|----------|
| `references/@design/` | 设计系统（Token、组件、展示） | ✅ |
| `references/@tools/` | 工具源码（设计文档、原型、实现） | ✅ |
| `references/@shared/` | 共享资源（工具函数、Hooks）- [详见说明](references/@shared/README.md) | ✅ |
| `docs/` | 项目文档（指南、API、工具档案） | ✅ |
| `.cache/` | 缓存和构建输出 | ❌ |
| `doc/` | ⚠️ 已废弃，内容已迁移到 docs/ | - |

---

## 5. 技术栈

- **前端**: Next.js + TypeScript + Tailwind CSS
- **样式**: 基于 Design Tokens 的 Tailwind 配置扩展
- **构建**: pnpm + Turborepo
- **部署**: Docker + GitHub Actions

---

## 6. 快速开始

```bash
# 1. 安装依赖
pnpm install

# 2. 启动设计规范展示页
pnpm dev:design

# 3. 开发新工具（必须切分支）
git checkout -b feature/tool-my-tool
cp -r references/@tools/_template references/@tools/my-tool
cd references/@tools/my-tool
pnpm dev

# 4. 构建所有工具
pnpm build:tools

# 5. 本地预览
pnpm preview
```

---

## 6. 注意事项

1. **分支约束**: 开发新工具必须切独立分支，禁止污染业务分支
2. **设计规范优先**: 任何 UI 变更需先确认是否符合 Design System
3. **渐进引导**: 新工具交互必须遵循渐进引导式原则
4. **文档同步**: 代码变更需同步更新相关文档
5. **进度管控**: 在 `docs/tools/index.md` 维护工具状态
6. **PR 自检**: 提交 PR 前必须对照验收清单逐项检查

---

## 7. 相关文档索引

| 文档 | 路径 | 说明 |
|------|------|------|
| 工具开发检查清单 | `docs/guides/tool-development-checklist.md` | 统一验收标准 |
| 工具进度总览 | `docs/tools/index.md` | 所有工具状态 |
| 设计规范展示 | `references/@design/showcase/index.html` | 可视化规范 |
| 工具模板 | `references/@tools/_template/` | 新工具复制起点 |

---

*最后更新: 2026-03-20*
