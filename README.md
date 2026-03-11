# Toolbox

一个可扩展的个人工具站 MVP。

当前已实现：

- 首页工具入口
- 表达式计算器
- 历史记录持久化
- 持久化双实现：本地 JSON / 远程数据库
- `master` 自动构建并推送 Docker 镜像

## 技术栈

- 前端：Next.js 16 + React 19 + TypeScript
- 后端：NestJS 11 + TypeScript
- 持久化：
  - 本地演示：JSON
  - 生产预留：PostgreSQL
- 发布：GitHub Actions + Docker

## 目录

```text
apps/
  web/      # 前端站点
  api/      # 后端 API
doc/        # 设计与部署文档
docker/     # 镜像构建文件
temp/       # 本地临时数据
output/     # 早期静态原型，可忽略
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
- `NEXT_PUBLIC_API_BASE_URL`

默认建议：

- 本地演示：`PERSISTENCE_DRIVER=json`
- 生产环境：`PERSISTENCE_DRIVER=database`

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

需要配置 GitHub Variables：

- `DOCKER_REGISTRY`
- `WEB_IMAGE`
- `API_IMAGE`
- `NEXT_PUBLIC_API_BASE_URL`

需要配置 GitHub Secrets：

- `DOCKER_USERNAME`
- `DOCKER_PASSWORD`

## 说明

- 当前仓库中的 [output](/Users/jsh/project/tool/toolbox/codex_v1/output) 是早期静态原型，已加入忽略，不参与正式构建和发布。
- 本地 JSON 数据默认写入 [temp](/Users/jsh/project/tool/toolbox/codex_v1/temp)。
- 后续新增 OCR、局域网传输、后台管理等能力时，建议继续沿用 `apps/*` 的拆分方式扩展。
