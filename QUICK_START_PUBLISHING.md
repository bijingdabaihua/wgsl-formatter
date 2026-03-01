# 快速发布指南

这是一个简化的发布步骤，帮助你快速将扩展发布到 GitHub 和 VSCode 市场。

## 🚀 一次性设置（只需做一次）

### 1. 创建 GitHub 仓库

```bash
# 在 GitHub 上创建新仓库后
git init
git remote add origin https://github.com/YOUR_USERNAME/wgsl-formatter.git
git add .
git commit -m "Initial commit"
git branch -M main
git push -u origin main
```

### 2. 获取 VSCode Marketplace 发布令牌

1. 访问 [Azure DevOps](https://dev.azure.com)
2. 创建 Personal Access Token (PAT)
   - Scopes: **Marketplace (Manage)**
   - 保存 token（只显示一次！）

3. 访问 [VSCode Marketplace](https://marketplace.visualstudio.com/manage)
4. 创建发布者账户
5. 记住你的发布者 ID

### 3. 更新 package.json

```json
{
  "publisher": "你的发布者ID",
  "repository": {
    "type": "git",
    "url": "https://github.com/YOUR_USERNAME/wgsl-formatter"
  }
}
```

### 4. 配置 GitHub Secrets

在 GitHub 仓库设置中添加：
- Settings → Secrets and variables → Actions
- 新建 secret: `VSCE_PAT` = 你的 Azure DevOps PAT

## 📦 每次发布流程

### 方法 1: 使用自动化脚本（推荐）

**Windows (PowerShell):**
```powershell
# 补丁版本 (0.1.0 -> 0.1.1)
.\scripts\release.ps1 patch

# 次版本 (0.1.0 -> 0.2.0)
.\scripts\release.ps1 minor

# 主版本 (0.1.0 -> 1.0.0)
.\scripts\release.ps1 major
```

**Linux/macOS (Bash):**
```bash
# 给脚本执行权限（首次）
chmod +x scripts/release.sh

# 补丁版本
./scripts/release.sh patch

# 次版本
./scripts/release.sh minor

# 主版本
./scripts/release.sh major
```

脚本会自动：
1. ✅ 检查代码状态
2. ✅ 运行所有测试
3. ✅ 更新版本号
4. ✅ 构建和打包
5. ✅ 创建 Git tag
6. ✅ 推送到 GitHub
7. ✅ 触发自动发布

### 方法 2: 手动发布

```bash
# 1. 运行测试
npm test

# 2. 更新版本号
npm version patch  # 或 minor, major

# 3. 更新 CHANGELOG.md
# 手动编辑文件，添加版本变更说明

# 4. 提交更改
git add .
git commit -m "chore: release v0.1.1"

# 5. 创建并推送 tag
git tag v0.1.1
git push origin main --tags

# 6. GitHub Actions 会自动发布
```

## 🔍 验证发布

### 检查 GitHub Actions
访问: `https://github.com/YOUR_USERNAME/wgsl-formatter/actions`

应该看到两个工作流运行：
- ✅ Create Release
- ✅ Publish Extension

### 检查 GitHub Release
访问: `https://github.com/YOUR_USERNAME/wgsl-formatter/releases`

应该看到新的 release，包含 `.vsix` 文件

### 检查 VSCode Marketplace
访问: `https://marketplace.visualstudio.com/items?itemName=你的发布者ID.wgsl-formatter`

通常需要 5-30 分钟审核通过

## 🐛 常见问题

### 问题 1: GitHub Actions 失败

**检查:**
- VSCE_PAT secret 是否正确设置
- package.json 中的 publisher 是否正确
- 版本号是否与 tag 匹配

### 问题 2: 发布到市场失败

**解决:**
```bash
# 手动发布
npx vsce login 你的发布者ID
# 输入 PAT
npx vsce publish
```

### 问题 3: 版本号不匹配

**解决:**
```bash
# 查看当前版本
node -p "require('./package.json').version"

# 查看最新 tag
git describe --tags --abbrev=0

# 如果不匹配，删除 tag 重新创建
git tag -d v0.1.1
git push origin :refs/tags/v0.1.1
```

## 📝 发布检查清单

发布前确认：

- [ ] 所有测试通过
- [ ] CHANGELOG.md 已更新
- [ ] package.json 版本号正确
- [ ] README.md 内容最新
- [ ] 本地测试扩展功能正常
- [ ] Git 工作目录干净
- [ ] 在 main 分支上

## 🎯 快速命令参考

```bash
# 测试
npm test                    # 运行测试
npm run test:coverage       # 测试覆盖率
npm run lint               # 代码检查
npm run typecheck          # 类型检查

# 构建
npm run build              # 构建扩展
npm run package            # 创建 .vsix 包

# 版本管理
npm version patch          # 0.1.0 -> 0.1.1
npm version minor          # 0.1.0 -> 0.2.0
npm version major          # 0.1.0 -> 1.0.0

# Git
git tag v0.1.0            # 创建 tag
git push origin main --tags  # 推送 tag

# 发布
npx vsce login            # 登录市场
npx vsce publish          # 发布扩展
npx vsce package          # 仅打包
```

## 🔗 有用的链接

- [完整发布指南](./PUBLISHING_GUIDE.md)
- [GitHub Actions 文档](https://docs.github.com/actions)
- [VSCode 扩展发布文档](https://code.visualstudio.com/api/working-with-extensions/publishing-extension)
- [语义化版本规范](https://semver.org/lang/zh-CN/)

---

**第一次发布？** 建议先阅读 [完整发布指南](./PUBLISHING_GUIDE.md) 了解详细步骤。
