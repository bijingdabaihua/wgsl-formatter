# 发布指南 / Publishing Guide

本指南介绍如何将 WGSL Formatter 扩展发布到 GitHub 和 Visual Studio Code 插件市场。

## 目录

1. [准备工作](#准备工作)
2. [发布到 GitHub](#发布到-github)
3. [发布到 VSCode 插件市场](#发布到-vscode-插件市场)
4. [自动化发布](#自动化发布)

---

## 准备工作

### 1. 确保代码质量

在发布前，运行所有检查：

```bash
# 运行测试
npm test

# 检查代码覆盖率
npm run test:coverage

# 代码检查
npm run lint

# 格式检查
npm run format:check

# 类型检查
npm run typecheck
```

### 2. 更新版本号

根据语义化版本规范更新版本：

```bash
# 补丁版本 (0.1.0 -> 0.1.1) - 修复 bug
npm version patch

# 次版本 (0.1.0 -> 0.2.0) - 新功能
npm version minor

# 主版本 (0.1.0 -> 1.0.0) - 破坏性变更
npm version major
```

### 3. 更新 CHANGELOG.md

在 `CHANGELOG.md` 中记录本次发布的变更：

```markdown
## [0.2.0] - 2024-01-20

### Added
- 新功能描述

### Changed
- 变更描述

### Fixed
- 修复的问题描述
```

---

## 发布到 GitHub

### 步骤 1: 创建 GitHub 仓库

1. 访问 [GitHub](https://github.com) 并登录
2. 点击右上角的 "+" → "New repository"
3. 填写仓库信息：
   - Repository name: `wgsl-formatter`
   - Description: `Code formatter for WebGPU Shading Language (WGSL)`
   - 选择 Public
   - 不要初始化 README（我们已经有了）
4. 点击 "Create repository"

### 步骤 2: 初始化 Git 并推送代码

```bash
# 初始化 Git 仓库（如果还没有）
git init

# 添加远程仓库
git remote add origin https://github.com/YOUR_USERNAME/wgsl-formatter.git

# 添加所有文件
git add .

# 提交
git commit -m "Initial release v0.1.0"

# 推送到 GitHub
git branch -M main
git push -u origin main
```

### 步骤 3: 创建 GitHub Release

#### 方法 1: 通过 GitHub 网页界面

1. 访问你的仓库页面
2. 点击右侧的 "Releases" → "Create a new release"
3. 填写信息：
   - Tag version: `v0.1.0`
   - Release title: `v0.1.0 - Initial Release`
   - Description: 从 CHANGELOG.md 复制相关内容
4. 上传 `.vsix` 文件作为附件：
   ```bash
   # 先构建包
   npm run package
   ```
   然后上传 `wgsl-formatter-0.1.0.vsix`
5. 点击 "Publish release"

#### 方法 2: 通过命令行（使用 GitHub CLI）

```bash
# 安装 GitHub CLI (如果还没有)
# Windows: winget install GitHub.cli
# macOS: brew install gh
# Linux: 参考 https://cli.github.com/

# 登录
gh auth login

# 创建 tag
git tag v0.1.0
git push origin v0.1.0

# 创建 release 并上传 .vsix 文件
gh release create v0.1.0 \
  wgsl-formatter-0.1.0.vsix \
  --title "v0.1.0 - Initial Release" \
  --notes-file CHANGELOG.md
```

### 步骤 4: 更新 package.json 中的仓库链接

确保 `package.json` 中的仓库链接正确：

```json
{
  "repository": {
    "type": "git",
    "url": "https://github.com/YOUR_USERNAME/wgsl-formatter"
  },
  "bugs": {
    "url": "https://github.com/YOUR_USERNAME/wgsl-formatter/issues"
  },
  "homepage": "https://github.com/YOUR_USERNAME/wgsl-formatter#readme"
}
```

---

## 发布到 VSCode 插件市场

### 步骤 1: 创建 Azure DevOps 账户

1. 访问 [Azure DevOps](https://dev.azure.com)
2. 使用 Microsoft 账户登录（或创建新账户）
3. 创建一个组织（如果还没有）

### 步骤 2: 创建 Personal Access Token (PAT)

1. 在 Azure DevOps 中，点击右上角的用户图标
2. 选择 "Personal access tokens"
3. 点击 "New Token"
4. 填写信息：
   - Name: `vscode-marketplace`
   - Organization: 选择你的组织
   - Expiration: 选择过期时间（建议 90 天或自定义）
   - Scopes: 选择 "Custom defined"
   - 勾选 "Marketplace" → "Manage"
5. 点击 "Create"
6. **重要**: 复制生成的 token（只显示一次！）

### 步骤 3: 创建发布者账户

1. 访问 [Visual Studio Marketplace Publisher Management](https://marketplace.visualstudio.com/manage)
2. 点击 "Create publisher"
3. 填写信息：
   - ID: 发布者 ID（例如：`your-name`，必须唯一）
   - Name: 显示名称
   - Email: 联系邮箱
4. 点击 "Create"

### 步骤 4: 更新 package.json 中的发布者

```json
{
  "publisher": "your-publisher-id"
}
```

### 步骤 5: 使用 vsce 登录

```bash
# 使用你的 PAT 登录
npx vsce login your-publisher-id

# 输入刚才创建的 Personal Access Token
```

### 步骤 6: 发布扩展

```bash
# 发布到市场
npm run publish

# 或者手动执行
npx vsce publish
```

发布过程：
1. 自动运行 `vscode:prepublish` 脚本（构建）
2. 创建 `.vsix` 包
3. 上传到 VSCode 市场
4. 通常需要几分钟到几小时审核

### 步骤 7: 验证发布

1. 访问 [VSCode Marketplace](https://marketplace.visualstudio.com/)
2. 搜索你的扩展名称
3. 或直接访问：`https://marketplace.visualstudio.com/items?itemName=your-publisher-id.wgsl-formatter`

---

## 自动化发布

### 使用 GitHub Actions 自动发布

创建 `.github/workflows/publish.yml`：

```yaml
name: Publish Extension

on:
  release:
    types: [published]

jobs:
  publish:
    runs-on: ubuntu-latest
    
    steps:
      - name: Checkout code
        uses: actions/checkout@v4
      
      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '18'
          cache: 'npm'
      
      - name: Install dependencies
        run: npm ci
      
      - name: Run tests
        run: npm test
      
      - name: Build extension
        run: npm run build
      
      - name: Publish to VSCode Marketplace
        run: npx vsce publish -p ${{ secrets.VSCE_PAT }}
        env:
          VSCE_PAT: ${{ secrets.VSCE_PAT }}
      
      - name: Upload VSIX to Release
        uses: actions/upload-release-asset@v1
        env:
          GITHUB_TOKEN: ${{ secrets.GITHUB_TOKEN }}
        with:
          upload_url: ${{ github.event.release.upload_url }}
          asset_path: ./wgsl-formatter-${{ github.event.release.tag_name }}.vsix
          asset_name: wgsl-formatter-${{ github.event.release.tag_name }}.vsix
          asset_content_type: application/zip
```

### 配置 GitHub Secrets

1. 访问你的 GitHub 仓库
2. 进入 Settings → Secrets and variables → Actions
3. 点击 "New repository secret"
4. 添加：
   - Name: `VSCE_PAT`
   - Value: 你的 Azure DevOps Personal Access Token
5. 点击 "Add secret"

### 使用自动化发布

```bash
# 1. 更新版本号
npm version minor

# 2. 推送 tag
git push origin main --tags

# 3. 在 GitHub 上创建 Release
# GitHub Actions 会自动：
# - 运行测试
# - 构建扩展
# - 发布到 VSCode 市场
# - 上传 .vsix 到 Release
```

---

## 发布检查清单

在发布前，确保完成以下检查：

### 代码质量
- [ ] 所有测试通过 (`npm test`)
- [ ] 代码覆盖率达标 (`npm run test:coverage`)
- [ ] 无 ESLint 错误 (`npm run lint`)
- [ ] 代码格式正确 (`npm run format:check`)
- [ ] TypeScript 类型检查通过 (`npm run typecheck`)

### 文档
- [ ] README.md 更新完整
- [ ] CHANGELOG.md 记录了所有变更
- [ ] package.json 版本号已更新
- [ ] LICENSE 文件存在

### 配置
- [ ] package.json 中的 publisher 正确
- [ ] package.json 中的 repository URL 正确
- [ ] .vscodeignore 配置正确

### 构建
- [ ] 扩展可以成功构建 (`npm run build`)
- [ ] 可以创建 .vsix 包 (`npm run package`)
- [ ] 本地测试安装正常

### 发布
- [ ] Git 仓库已推送到 GitHub
- [ ] 创建了 GitHub Release
- [ ] 发布到 VSCode 市场成功

---

## 常见问题

### Q: 发布失败，提示 "Publisher not found"
A: 确保 package.json 中的 `publisher` 字段与你在 VSCode Marketplace 创建的发布者 ID 完全一致。

### Q: 如何撤回已发布的版本？
A: 使用命令：
```bash
npx vsce unpublish your-publisher-id.wgsl-formatter@0.1.0
```

### Q: 如何更新已发布的扩展？
A: 更新版本号后重新发布即可：
```bash
npm version patch
npm run publish
```

### Q: Personal Access Token 过期了怎么办？
A: 在 Azure DevOps 中创建新的 PAT，然后重新登录：
```bash
npx vsce login your-publisher-id
```

### Q: 如何查看扩展的下载统计？
A: 访问 [Publisher Management](https://marketplace.visualstudio.com/manage) 查看详细统计。

---

## 版本管理建议

### 语义化版本规范

- **主版本号 (Major)**: 不兼容的 API 变更
- **次版本号 (Minor)**: 向后兼容的功能新增
- **修订号 (Patch)**: 向后兼容的问题修复

### 发布频率建议

- **Patch 版本**: 发现严重 bug 时立即发布
- **Minor 版本**: 每 2-4 周发布一次新功能
- **Major 版本**: 重大重构或破坏性变更时发布

### Git 分支策略

```
main (稳定版本)
  ├── develop (开发分支)
  │   ├── feature/new-feature
  │   └── bugfix/fix-issue
  └── release/v0.2.0 (发布准备)
```

---

## 资源链接

- [VSCode Extension API](https://code.visualstudio.com/api)
- [Publishing Extensions](https://code.visualstudio.com/api/working-with-extensions/publishing-extension)
- [vsce CLI](https://github.com/microsoft/vscode-vsce)
- [Azure DevOps](https://dev.azure.com)
- [GitHub CLI](https://cli.github.com/)

---

**祝发布顺利！** 🚀
