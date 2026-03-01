#!/bin/bash

# 本地安装 WGSL Formatter 插件脚本

# 颜色定义
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

echo -e "${GREEN}🚀 WGSL Formatter 本地安装脚本${NC}"
echo ""

# 检查 .vsix 文件是否存在
VSIX_FILE="wgsl-formatter-0.1.0.vsix"
if [ ! -f "$VSIX_FILE" ]; then
    echo -e "${RED}❌ 找不到 $VSIX_FILE 文件${NC}"
    echo -e "${YELLOW}正在构建插件包...${NC}"
    npm run package
    
    if [ $? -ne 0 ]; then
        echo -e "${RED}❌ 构建失败${NC}"
        exit 1
    fi
fi

echo -e "${GREEN}✅ 找到插件包: $VSIX_FILE${NC}"
echo ""

# 检查是否已安装旧版本
echo -e "${YELLOW}检查是否已安装旧版本...${NC}"
if code --list-extensions | grep -q "wgsl-formatter"; then
    echo -e "${YELLOW}⚠️  检测到已安装的版本，正在卸载...${NC}"
    code --uninstall-extension wgsl-formatter.wgsl-formatter
    sleep 2
fi

# 安装插件
echo -e "${YELLOW}正在安装插件...${NC}"
code --install-extension "$VSIX_FILE"

if [ $? -eq 0 ]; then
    echo ""
    echo -e "${GREEN}✅ 插件安装成功！${NC}"
    echo ""
    echo -e "${CYAN}📝 下一步操作：${NC}"
    echo "1. 重启 VSCode（如果需要）"
    echo "2. 打开 test-example.wgsl 文件"
    echo "3. 按 Shift+Alt+F (Linux) 或 Shift+Option+F (macOS) 格式化代码"
    echo ""
    echo -e "${CYAN}🔧 配置选项（在 VSCode 设置中）：${NC}"
    echo "  - wgslFormatter.indentSize: 缩进大小（默认 4）"
    echo "  - wgslFormatter.useTabs: 使用制表符（默认 false）"
    echo "  - wgslFormatter.maxLineLength: 最大行长度（默认 100）"
    echo "  - wgslFormatter.enableLineWrapping: 启用自动换行（默认 true）"
    echo ""
    echo -e "${CYAN}📖 查看完整测试指南: LOCAL_TESTING_GUIDE.md${NC}"
else
    echo ""
    echo -e "${RED}❌ 安装失败${NC}"
    echo -e "${YELLOW}请尝试手动安装：${NC}"
    echo "1. 打开 VSCode"
    echo "2. 按 Ctrl+Shift+P (Linux) 或 Cmd+Shift+P (macOS)"
    echo "3. 输入 'Extensions: Install from VSIX...'"
    echo "4. 选择 $VSIX_FILE 文件"
fi
