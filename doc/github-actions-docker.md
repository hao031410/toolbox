# GitHub 自动构建并推送镜像

## 目标

- 监听 `master` 分支提交
- 先执行 `lint + build`
- 成功后分别构建 `web` 与 `api` 镜像
- 推送到指定 Docker 仓库

工作流文件：[`/.github/workflows/docker-publish.yml`](/Users/jsh/project/tool/toolbox/codex_v1/.github/workflows/docker-publish.yml)

## GitHub Environment

- 当前工作流绑定了 `master` environment
- 配置位置：`Settings -> Environments -> master`

## 需要配置的 GitHub Variables

- `DOCKER_REGISTRY`
  - 示例：`registry.example.com`
  - 如果使用 Docker Hub，可填：`docker.io`
- `WEB_IMAGE`
  - 示例：`your-org/toolbox-web`
- `API_IMAGE`
  - 示例：`your-org/toolbox-api`

## 需要配置的 GitHub Secrets

- `DOCKER_USERNAME`
- `DOCKER_PASSWORD`

## 镜像标签

每次推送 `master` 会生成三类标签：

- `latest`
- `master`
- `sha-<commit-sha>`

示例：

```text
registry.example.com/your-org/toolbox-web:latest
registry.example.com/your-org/toolbox-web:master
registry.example.com/your-org/toolbox-web:sha-<commit-sha>
```

## Docker 文件

- Web 镜像：[docker/web.Dockerfile](/Users/jsh/project/tool/toolbox/codex_v1/docker/web.Dockerfile)
- API 镜像：[docker/api.Dockerfile](/Users/jsh/project/tool/toolbox/codex_v1/docker/api.Dockerfile)

## 运行时环境变量

API 容器支持这些环境变量：

- `PORT`
- `PERSISTENCE_DRIVER`
- `JSON_STORAGE_DIR`
- `DATABASE_URL`

建议：

- 演示环境：`PERSISTENCE_DRIVER=json`
- 生产环境：`PERSISTENCE_DRIVER=database`

## 本地验证命令

构建 web 镜像：

```bash
docker build -f docker/web.Dockerfile -t toolbox-web:local .
```

构建 api 镜像：

```bash
docker build -f docker/api.Dockerfile -t toolbox-api:local .
```

运行 api：

```bash
docker run --rm -p 3001:3001 \
  -e PERSISTENCE_DRIVER=json \
  -e JSON_STORAGE_DIR=./temp/data \
  toolbox-api:local
```

运行 web：

```bash
docker run --rm -p 3000:3000 toolbox-web:local
```

## docker-compose 部署

- Compose 文件：[docker-compose.yml](/Users/jsh/project/tool/toolbox/codex_v1/docker-compose.yml)
- Nginx 配置：[docker/nginx.conf](/Users/jsh/project/tool/toolbox/codex_v1/docker/nginx.conf)
- 环境变量示例：[.env.deploy.example](/Users/jsh/project/tool/toolbox/codex_v1/.env.deploy.example)

当前部署方式：

- `nginx` 对外暴露 `80`
- `/` 转发到 `web`
- `/api/` 转发到 `api`
- 前端默认直接请求同域 `/api`

启动前：

```bash
cp .env.deploy.example .env
docker compose pull
docker compose up -d
```

## 说明

- 当前是双镜像发布：`web` 和 `api` 分开推送
- 当前前端默认走同域 `/api`，由 Nginx 反向代理到 API
- 如果后续接入管理后台，建议继续沿用同一套发布方式，单独增加 `admin` 镜像即可
