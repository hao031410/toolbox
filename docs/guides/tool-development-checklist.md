# 工具开发检查清单

> 统一的工具验收标准，所有工具必须逐项通过后方可合并。

---

## 开发前（Planning）

- [ ] **需求确认**: 功能范围、默认值、交互方式已确认
- [ ] **分支创建**: 已按规范创建分支 `feature/tool-{tool-id}`
- [ ] **目录初始化**: 已复制 `_template` 并修改配置

---

## 设计阶段（Design）

- [ ] **DESIGN.md 完成**: 包含需求、流程图、组件清单
- [ ] **渐进引导设计**: 初始状态简单，支持展开高级选项
- [ ] **原型完成**: `prototype.html` 可交互
- [ ] **设计评审通过**: 已确认视觉和交互细节

---

## 开发阶段（Development）

- [ ] **Design System 合规**:
  - [ ] 颜色使用 `@design/tokens`
  - [ ] 组件使用 `@design/components`
  - [ ] 间距/圆角符合规范
- [ ] **渐进引导实现**: 初始状态 → 生成结果 → 展开配置
- [ ] **代码规范**:
  - [ ] 文件命名符合 PascalCase/camelCase 规范
  - [ ] 无 `console.log` / `debugger`
  - [ ] 版本注释完整（@id, @version, @since）
- [ ] **README.md 更新**: 使用统一验收清单格式

---

## 提交前（Pre-PR）

- [ ] **自检完成**: 对照本清单逐项检查
- [ ] **构建通过**: `pnpm build:tool {tool-id}` 无错误
- [ ] **原型与实现一致**: 关键交互无偏差
- [ ] **进度文档更新**: `docs/tools/index.md` 已更新状态

---

## PR 模板（创建 PR 时填写）

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

---

## 合并后（Post-Merge）

- [ ] **进度更新**: `docs/tools/index.md` 状态改为"已完成"
- [ ] **档案补充**: `docs/tools/{tool-id}.md` 填写完整
- [ ] **分支清理**: 删除已合并的功能分支
