#!/bin/bash
# 迁移脚本：将旧结构文件迁移到新的 packages 结构

set -e

echo "🚀 开始迁移到新的 package 结构..."

# 颜色输出
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# 1. 迁移设计规范
echo -e "${YELLOW}迁移设计规范...${NC}"
if [ -f "doc/design-system.md" ]; then
    mv doc/design-system.md packages/@design/README.md
    echo -e "${GREEN}✓${NC} doc/design-system.md → packages/@design/README.md"
fi

# 2. 迁移设计展示页
echo -e "${YELLOW}迁移设计展示页...${NC}"
if [ -f "temp/design-system-showcase.html" ]; then
    mv temp/design-system-showcase.html packages/@design/showcase/index.html
    echo -e "${GREEN}✓${NC} temp/design-system-showcase.html → packages/@design/showcase/index.html"
fi

# 3. 迁移 OCR 工具
echo -e "${YELLOW}迁移 OCR 工具...${NC}"
if [ -f "temp/ocr-prototype.html" ]; then
    mkdir -p packages/@tools/ocr-invoice
    mv temp/ocr-prototype.html packages/@tools/ocr-invoice/prototype.html
    mv doc/design-ocr-invoice.md packages/@tools/ocr-invoice/DESIGN.md 2>/dev/null || true
    echo -e "${GREEN}✓${NC} OCR 工具迁移完成"
fi

# 4. 迁移 LAN 传输工具
echo -e "${YELLOW}迁移 LAN 传输工具...${NC}"
if [ -f "output/lan-transfer.html" ]; then
    mkdir -p packages/@tools/lan-transfer
    cp output/lan-transfer.html packages/@tools/lan-transfer/
    mv doc/lan-transfer-progress.md packages/@tools/lan-transfer/PROGRESS.md 2>/dev/null || true
    echo -e "${GREEN}✓${NC} LAN 传输工具迁移完成"
fi

# 5. 迁移计算器工具
echo -e "${YELLOW}迁移计算器工具...${NC}"
if [ -f "output/calculator.html" ]; then
    mkdir -p packages/@tools/calculator
    cp output/calculator.html packages/@tools/calculator/
    echo -e "${GREEN}✓${NC} 计算器工具迁移完成"
fi

# 6. 迁移 cron 工具
echo -e "${YELLOW}迁移 Cron 工具...${NC}"
if [ -f "output/cron.html" ]; then
    mkdir -p packages/@tools/cron-parser
    cp output/cron.html packages/@tools/cron-parser/
    mv temp/cronjs-inspect packages/@tools/cron-parser/inspector 2>/dev/null || true
    echo -e "${GREEN}✓${NC} Cron 工具迁移完成"
fi

echo ""
echo -e "${GREEN}✅ 迁移完成！${NC}"
echo ""
echo "接下来:"
echo "  1. 检查迁移后的文件"
echo "  2. 运行 ./scripts/cleanup.sh 清理旧目录"
echo "  3. 更新 apps/web 中的工具注册"
echo ""
echo "新结构预览:"
find packages -type f \( -name "*.md" -o -name "*.html" \) | head -10
