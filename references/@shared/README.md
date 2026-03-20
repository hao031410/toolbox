# 共享资源 (@shared)

> 工具间的共享逻辑层，非强制使用。

---

## 定位

| 目录 | 用途 | 强制 |
|------|------|------|
| `@design/components` | UI 组件（展示层） | ✅ 必须遵循 |
| `@shared/utils` | 纯工具函数（无 UI） | ❌ 按需使用 |
| `@shared/hooks` | 自定义 React Hooks | ❌ 按需使用 |
| `@shared/styles` | 共享样式（动画、混合） | ❌ 按需使用 |

---

## 目录说明

### `utils/` - 纯工具函数

**准入标准：**
- 无 UI、无 React 依赖
- 纯函数，可独立测试
- 被 2+ 个工具复用

**预期内容：**
- `clipboard.ts` - 剪贴板操作封装
- `formatter.ts` - 日期、数字、文件大小格式化
- `validator.ts` - 表单校验规则
- `crypto.ts` - 加密/哈希工具
- `download.ts` - 文件下载触发

**反例（不应放这里）：**
- 组件级别的逻辑（放组件内）
- 单个工具专用的函数（放工具目录内）

---

### `hooks/` - 自定义 React Hooks

**准入标准：**
- 通用逻辑，不绑定特定业务
- 被 2+ 个工具复用

**预期内容：**
- `useDebounce.ts` - 防抖
- `useLocalStorage.ts` - localStorage 同步
- `useClipboard.ts` - 剪贴板状态
- `useMediaQuery.ts` - 响应式断点
- `useCountdown.ts` - 倒计时

**反例：**
- 单个工具的业务逻辑 Hook（放工具目录内）

---

### `styles/` - 共享样式

**准入标准：**
- CSS 动画、Keyframes
- CSS 混合（mixins）
- 全局变量补充

**预期内容：**
- `animations.css` - fade-in、slide-up、spin 等
- `mixins.css` - 复用 CSS 模式

**注意：**
- 颜色、间距优先使用 `@design/tokens`
- 不要定义与 Design System 冲突的样式

---

## 使用方式

```typescript
// Utils
import { formatDate, copyToClipboard } from '@shared/utils';

// Hooks
import { useDebounce, useLocalStorage } from '@shared/hooks';

// Styles
import '@shared/styles/animations.css';
```

---

## 新增流程

1. 确认内容符合"准入标准"
2. 确认不被 Design System 覆盖
3. 创建文件并导出
4. 更新本文档"预期内容"列表（打勾）
5. 提交 PR

---

## 当前状态

| 类别 | 状态 | 已有内容 |
|------|------|----------|
| utils | 📝 空置 | - |
| hooks | 📝 空置 | - |
| styles | 📝 空置 | - |

**待补充（按需）：**
- [ ] `utils/clipboard.ts`
- [ ] `utils/formatter.ts`
- [ ] `hooks/useDebounce.ts`
- [ ] `hooks/useLocalStorage.ts`
- [ ] `styles/animations.css`
