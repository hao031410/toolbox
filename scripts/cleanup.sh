#!/bin/bash
# 清理旧目录（在确认迁移完成后运行）

set -e

echo "⚠️  此脚本将删除旧目录中的文件"
echo "请确保:"
echo "  1. 所有重要文件已迁移到 packages/"
echo "  2. 已提交当前更改到 Git"
echo ""
read -p "确认清理? (yes/no): " confirm

if [ "$confirm" != "yes" ]; then
    echo "已取消"
    exit 0
fi

echo ""
echo "🧹 清理旧目录..."

# 清理已迁移的文件
rm -f doc/design-system.md
rm -f temp/design-system-showcase.html
rm -f temp/ocr-prototype.html

echo "✅ 清理完成"
echo ""
echo "保留的目录（需手动检查）:"
echo "  - doc/ (剩余文档)"
echo "  - temp/ (临时文件)"
echo "  - output/ (构建输出，将改为自动构建)"
echo ""
echo "建议:"
echo "  1. 检查 doc/ 中是否还有需要的文档"
echo "  2. 检查 temp/ 中是否还有未迁移的文件"
echo "  3. 确认 output/ 中的文件是否已复制到对应工具目录"
