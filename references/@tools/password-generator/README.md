# 密码生成器

生成随机密码，支持自定义长度和字符类型。

## 功能

- ✅ 生成 8-64 位随机密码
- ✅ 自定义字符类型（大写、小写、数字、符号）
- ✅ 密码强度指示
- ✅ 一键复制
- ✅ 渐进式配置（默认隐藏高级选项）

## 文件结构

```
password-generator/
├── README.md           # 本文档
├── DESIGN.md           # 设计文档
├── prototype.html      # 可交互原型
└── src/
    └── index.tsx       # 正式实现
```

## 渐进引导设计

1. **初始状态**：只显示生成按钮，使用默认配置（16位，全字符）
2. **展开配置**：点击"自定义选项"调整参数
3. **即时反馈**：生成后立即显示密码和强度条
4. **快捷操作**：复制按钮显示"已复制"确认

## 验收清单

> 详见：[工具开发检查清单](../../../docs/guides/tool-development-checklist.md)

- [x] DESIGN.md 已完成
- [x] prototype.html 已通过评审
- [x] 代码遵循 Design System
- [x] 渐进引导式交互实现
- [x] README.md 已更新
- [x] 无 console.log / debugger
- [ ] 构建通过（待执行）

## 进度档案

- [docs/tools/password-generator.md](../../../docs/tools/password-generator.md)
