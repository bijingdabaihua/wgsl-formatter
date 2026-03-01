#!/bin/bash

# WGSL Formatter Release Script
# 用法: ./scripts/release.sh [patch|minor|major]

set -e

# 颜色输出
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# 检查参数
if [ -z "$1" ]; then
    echo -e "${RED}错误: 请指定版本类型 (patch, minor, major)${NC}"
    echo "用法: ./scripts/release.sh [patch|minor|major]"
    exit 1
fi

VERSION_TYPE=$1

# 验证版本类型
if [[ ! "$VERSION_TYPE" =~ ^(patch|minor|major)$ ]]; then
    echo -e "${RED}错误: 版本类型必须是 patch, minor 或 major${NC}"
    exit 1
fi

echo -e "${GREEN}🚀 开始发布流程...${NC}"

# 1. 检查工作目录是否干净
echo -e "${YELLOW}检查 Git 状态...${NC}"
if [[ -n $(git status -s) ]]; then
    echo -e "${RED}错误: 工作目录不干净，请先提交或暂存更改${NC}"
    git status -s
    exit 1
fi

# 2. 确保在 main 分支
CURRENT_BRANCH=$(git branch --show-current)
if [ "$CURRENT_BRANCH" != "main" ]; then
    echo -e "${YELLOW}警告: 当前不在 main 分支 (当前: $CURRENT_BRANCH)${NC}"
    read -p "是否继续? (y/N) " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        exit 1
    fi
fi

# 3. 拉取最新代码
echo -e "${YELLOW}拉取最新代码...${NC}"
git pull origin $CURRENT_BRANCH

# 4. 运行测试
echo -e "${YELLOW}运行测试...${NC}"
npm test

# 5. 运行代码检查
echo -e "${YELLOW}运行代码检查...${NC}"
npm run lint
npm run format:check
npm run typecheck

# 6. 更新版本号
echo -e "${YELLOW}更新版本号 ($VERSION_TYPE)...${NC}"
NEW_VERSION=$(npm version $VERSION_TYPE --no-git-tag-version)
echo -e "${GREEN}新版本: $NEW_VERSION${NC}"

# 7. 构建和打包
echo -e "${YELLOW}构建扩展...${NC}"
npm run build

echo -e "${YELLOW}打包扩展...${NC}"
npm run package

# 8. 提示更新 CHANGELOG
echo -e "${YELLOW}请更新 CHANGELOG.md 文件${NC}"
echo "添加版本 $NEW_VERSION 的变更说明"
read -p "按 Enter 继续 (完成 CHANGELOG 更新后)..." 

# 9. 提交更改
echo -e "${YELLOW}提交更改...${NC}"
git add package.json package-lock.json CHANGELOG.md
git commit -m "chore: release $NEW_VERSION"

# 10. 创建 tag
echo -e "${YELLOW}创建 Git tag...${NC}"
git tag $NEW_VERSION

# 11. 推送到远程
echo -e "${YELLOW}推送到远程仓库...${NC}"
git push origin $CURRENT_BRANCH
git push origin $NEW_VERSION

echo -e "${GREEN}✅ 发布流程完成!${NC}"
echo -e "${GREEN}GitHub Actions 将自动:${NC}"
echo "  1. 创建 GitHub Release"
echo "  2. 发布到 VSCode Marketplace"
echo "  3. 上传 .vsix 文件"
echo ""
echo -e "${YELLOW}查看发布状态:${NC}"
echo "  https://github.com/$(git config --get remote.origin.url | sed 's/.*github.com[:/]\(.*\)\.git/\1/')/actions"
