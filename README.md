# Toolbox - 工具集合平台

一个遵循统一设计规范的工具集合平台。

## 特性

- 首页工具入口
- 表达式计算器
- 历史记录持久化
- OCR 发票识别
- 局域网文件传输
- `master` 自动构建并推送 Docker 镜像
- 统一 Design System 设计规范

## 技术栈

- 前端：Next.js 16 + React 19 + TypeScript
- 后端：NestJS 11 + TypeScript
- 样式：基于 Design Tokens 的 Tailwind CSS
- 包管理：pnpm + Turborepo
- 发布：GitHub Actions + Docker

## 目录结构

```text
├── apps/
│   ├── web/                # Web 应用
│   └── api/                # API 服务
├── references/             # 工具引用集合
│   ├── @design/            # 设计规范（强制遵循）
│   │   ├── README.md       # 设计规范文档
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
├── scripts/                # 构建/部署脚本
└── CLAUDE.md               # 开发规范（必读）
```

## 本地启动

安装依赖：

```bash
npm ci
```

启动开发环境：

```bash
npm run dev
```

访问地址：

- Web: `http://localhost:3000`
- API: `http://localhost:3001`

## 环境变量

示例文件：[`/.env.example`](/Users/jsh/project/tool/toolbox/codex_v1/.env.example)

核心变量：

- `PERSISTENCE_DRIVER`
  - `json` 或 `database`
- `JSON_STORAGE_DIR`
- `DATABASE_URL`
- `OCR_ENGINE`
  - `disabled` 或 `siliconflow`
- `SILICON_FLOW_API_KEY`
- `SILICON_FLOW_BASE_URL`
- `SILICON_FLOW_OCR_MODEL`

默认建议：

- 本地演示：`PERSISTENCE_DRIVER=json`
- 生产环境：`PERSISTENCE_DRIVER=database`
- 未接云端 OCR 时：`OCR_ENGINE=disabled`
- 接入硅基流动 OCR 时：

```env
OCR_ENGINE=siliconflow
SILICON_FLOW_BASE_URL=https://api.siliconflow.cn/v1
SILICON_FLOW_OCR_MODEL=deepseek-ai/DeepSeek-OCR
SILICON_FLOW_API_KEY=你的密钥
```

## 构建检查

```bash
npm run lint
npm run build
```

## Docker 发布

相关文件：

- 工作流：[.github/workflows/docker-publish.yml](/Users/jsh/project/tool/toolbox/codex_v1/.github/workflows/docker-publish.yml)
- 说明文档：[doc/github-actions-docker.md](/Users/jsh/project/tool/toolbox/codex_v1/doc/github-actions-docker.md)

行为：

- 监听 `master` 分支提交
- 先执行 `lint + build`
- 构建并推送 `web` 和 `api` 两个镜像

当前工作流绑定 GitHub `Environment: master`。

需要在 `Settings -> Environments -> master` 配置 Variables：

- `DOCKER_REGISTRY`
- `WEB_IMAGE`
- `API_IMAGE`

需要配置 Secrets：

- `DOCKER_USERNAME`
- `DOCKER_PASSWORD`

## docker-compose 部署

部署文件：

- [docker-compose.yml](/Users/jsh/project/tool/toolbox/codex_v1/docker-compose.yml)
- [.env.deploy.example](/Users/jsh/project/tool/toolbox/codex_v1/.env.deploy.example)

当前默认部署方式：

- Web 直接暴露 `3000`
- API 直接暴露 `3001`
- 反向代理由服务器侧自行处理

## 说明

- 当前仓库中的 [.cache/output](/Users/jsh/project/tool/toolbox/codex_v1/.cache/output) 是构建输出目录，不提交 Git
- 本地 JSON 数据默认写入 [.cache/temp](/Users/jsh/project/tool/toolbox/codex_v1/.cache/temp)
- 后续新增 OCR、局域网传输、后台管理等能力时，建议继续沿用 `apps/*` 的拆分方式扩展
