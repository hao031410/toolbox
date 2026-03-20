# @tools/_template

工具开发模板，复制此目录创建新工具。

## 使用方式

```bash
cd references/@tools
cp -r _template my-tool-name
cd my-tool-name
```

## 目录结构

```
my-tool-name/
├── README.md           # 工具说明
├── package.json        # 包配置
├── DESIGN.md           # 设计文档（可选）
├── src/                # 源码
│   ├── index.tsx       # 入口组件
│   ├── components/     # 组件
│   └── hooks/          # 工具 Hooks
├── prototype.html      # 原型文件（可选）
└── fixtures/           # 测试数据
    └── sample.json
```

## 开发检查清单

- [ ] 修改 package.json 中的名称和描述
- [ ] 更新 README.md 工具说明
- [ ] 遵循 Design System 规范
- [ ] 使用渐进引导式交互
- [ ] 添加必要的测试数据
- [ ] 本地测试通过

## 设计规范引用

所有组件必须从 `@design` 包导入：

```tsx
import { Button, Card, Input } from '@design/components';
import { colors, spacing } from '@design/tokens';
```
