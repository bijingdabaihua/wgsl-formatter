# 🚀 VSCode Marketplace 自动发布指南

> 本文档指导你如何配置从 GitHub 自动发布扩展到 VSCode Marketplace。

---

## 一、前置条件

1. **已注册的 Publisher**：你已经在 [Azure DevOps](https://dev.azure.com) 上注册了一个 publisher（你的 `package.json` 里写的是 `"publisher": "wgsl-tools"`）。
2. **已创建的 Access Token**：你有一个可用于发布扩展的 Personal Access Token (PAT)。

如果还没注册 publisher，请看[官方文档](https://code.visualstudio.com/api/working-with-extensions/publishing-extension#create-a-publisher)。

---

## 二、获取 VSCE_PAT（最关键的一步）

`VSCE_PAT` 是 GitHub Actions 用来向 VSCode Marketplace 认证的令牌。按以下步骤获取：

### 步骤 1：登录 Azure DevOps

打开 [https://dev.azure.com](https://dev.azure.com) 并用你的 Microsoft 账号登录。

### 步骤 2：创建 Personal Access Token

1. 点击右上角头像 → **Personal access tokens**
2. 点击 **New Token**
3. 填写配置：
   | 字段 | 值 |
   |------|------|
   | **Name** | `VSCode Marketplace Publish` |
   | **Organization** | `All accessible organizations` |
   | **Expiration** | 建议选 1 年（到期前记得续） |
   | **Scopes** | 点击 **Show all scopes** → 找到 **Marketplace** → 勾选 **Manage** |
4. 点击 **Create**
5. **⚠️ 立即复制生成的 token**（页面关闭后无法再次查看）

> 这个 token 的格式类似 `xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx`

---

## 三、在 GitHub 仓库设置 Secret

拿到 token 后，需要把它存到 GitHub 仓库的 Secrets 里：

1. 打开你的 GitHub 仓库页面：`https://github.com/bijingdabaihua/wgsl-formatter`
2. 点击顶部 **Settings** 标签
3. 左侧菜单 → **Secrets and variables** → **Actions**
4. 点击 **New repository secret**
5. 填写：
   - **Name**：`VSCE_PAT`（⚠️ 必须完全匹配，大写）
   - **Secret**：粘贴你刚复制的 token
6. 点击 **Add secret**

✅ 完成！现在 GitHub Actions 就有权限自动发布到 Marketplace 了。

---

## 四、发布流程（一次设置，终身受用）

配置好 secret 后，发布新版本只需要 **一步**：

### 方式 A：使用脚本（推荐）

```bash
# macOS / Linux
./scripts/release.sh patch   # 0.1.1 → 0.1.2
./scripts/release.sh minor   # 0.1.1 → 0.2.0
./scripts/release.sh major   # 0.1.1 → 1.0.0

# Windows PowerShell
.\scripts\release.ps1 patch
```

脚本会自动：
1. ✅ 检查 git 状态是否干净
2. ✅ 运行测试、lint、格式化检查、类型检查
3. ✅ 更新 `package.json` 版本号
4. ✅ 构建并打包
5. ✅ 提示你更新 CHANGELOG.md
6. ✅ 提交更改并打 tag
7. ✅ 推送到 GitHub

### 方式 B：手动操作

如果你不想用脚本，也可以手动：

```bash
# 1. 确保工作目录干净
git status

# 2. 更新版本号（会自动修改 package.json 和 package-lock.json）
npm version patch   # 或 minor / major

# 3. 更新 CHANGELOG.md（在对应版本下写变更内容）
# 手动编辑 CHANGELOG.md ...

# 4. 提交并打 tag
git add package.json package-lock.json CHANGELOG.md
git commit -m "chore: release v$(node -p "require('./package.json').version")"
git tag v$(node -p "require('./package.json').version")

# 5. 推送（推送 tag 会自动触发发布流程）
git push origin main
git push origin --tags
```

---

## 五、GitHub Actions 会自动做什么？

一旦你推送了 tag（例如 `v0.1.2`），GitHub Actions 会自动执行：

### 工作流 1：`release.yml`（创建 GitHub Release）
触发条件：`push tags v*.*.*`

1. 运行完整 CI（测试、lint、类型检查）
2. 构建并打包 `.vsix`
3. 从 `CHANGELOG.md` 提取当前版本的变更说明
4. 创建 GitHub Release，并附带 `.vsix` 文件

### 工作流 2：`publish.yml`（发布到 Marketplace）
触发条件：`release published`（Release 创建完成后自动触发）

1. 再次运行测试和构建
2. 验证 `package.json` 版本号与 tag 一致
3. 使用 `VSCE_PAT` 发布到 VSCode Marketplace

你可以在仓库的 **Actions** 标签页查看执行状态和日志。

---

## 六、验证发布是否成功

### 检查 GitHub Release
访问：`https://github.com/bijingdabaihua/wgsl-formatter/releases`

### 检查 VSCode Marketplace
1. 打开 [VSCode Marketplace](https://marketplace.visualstudio.com/items?itemName=wgsl-tools.wgsl-formatter)
2. 确认版本号已更新
3. 或者在 VSCode 里搜索扩展，看版本是否最新

---

## 七、常见问题

### Q1: Actions 报错 `Error: Access Denied`
> 原因：`VSCE_PAT` 没有设置，或者 token 过期/权限不对。
> 解决：检查 token 是否有 **Marketplace > Manage** 权限，并确认 secret 名称是 `VSCE_PAT`（全大写）。

### Q2: Actions 报错 `package.json version does not match tag version`
> 原因：`npm version` 没成功运行，或者 tag 打错了。
> 解决：确保 `package.json` 里的 `version` 字段和 tag 名称一致（例如 tag 是 `v0.1.2`，package.json 里必须是 `0.1.2`）。

### Q3: 版本已经发布过，无法重复发布
> VSCode Marketplace 不允许重复发布同一版本。
> 解决：先 `npm version patch` 升一个小版本再发布。

### Q4: CHANGELOG.md 没有更新
> 项目现在已有 `CHANGELOG.md` 文件。每次发版前在文件顶部 `## [Unreleased]` 下方添加变更说明，发版时再移到对应版本号下。

---

## 八、文件变更摘要

本次为你添加/修改的文件：

| 文件 | 说明 |
|------|------|
| `CHANGELOG.md` | 新增，记录版本变更历史 |
| `.github/workflows/publish.yml` | 修复，移除已弃用的 `upload-release-asset` action |
| `PUBLISH_GUIDE.md` | 本文件，完整的发布指南 |

---

## 九、下一步

1. **获取 VSCE_PAT** → [Azure DevOps](https://dev.azure.com)
2. **设置 GitHub Secret** → 仓库 Settings → Secrets
3. **测试发布** → 运行 `./scripts/release.sh patch`
4. **验证** → 检查 GitHub Releases 和 VSCode Marketplace

有问题随时问！🎉
