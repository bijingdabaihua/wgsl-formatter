# WGSL Formatter Release Script (PowerShell)
# 用法: .\scripts\release.ps1 [patch|minor|major]

param(
    [Parameter(Mandatory=$true)]
    [ValidateSet('patch', 'minor', 'major')]
    [string]$VersionType
)

$ErrorActionPreference = "Stop"

function Write-ColorOutput($ForegroundColor) {
    $fc = $host.UI.RawUI.ForegroundColor
    $host.UI.RawUI.ForegroundColor = $ForegroundColor
    if ($args) {
        Write-Output $args
    }
    $host.UI.RawUI.ForegroundColor = $fc
}

Write-ColorOutput Green "🚀 开始发布流程..."

# 1. 检查工作目录是否干净
Write-ColorOutput Yellow "检查 Git 状态..."
$gitStatus = git status --porcelain
if ($gitStatus) {
    Write-ColorOutput Red "错误: 工作目录不干净，请先提交或暂存更改"
    git status -s
    exit 1
}

# 2. 确保在 main 分支
$currentBranch = git branch --show-current
if ($currentBranch -ne "main") {
    Write-ColorOutput Yellow "警告: 当前不在 main 分支 (当前: $currentBranch)"
    $continue = Read-Host "是否继续? (y/N)"
    if ($continue -ne "y" -and $continue -ne "Y") {
        exit 1
    }
}

# 3. 拉取最新代码
Write-ColorOutput Yellow "拉取最新代码..."
git pull origin $currentBranch

# 4. 运行测试
Write-ColorOutput Yellow "运行测试..."
npm test
if ($LASTEXITCODE -ne 0) {
    Write-ColorOutput Red "测试失败"
    exit 1
}

# 5. 运行代码检查
Write-ColorOutput Yellow "运行代码检查..."
npm run lint
if ($LASTEXITCODE -ne 0) {
    Write-ColorOutput Red "代码检查失败"
    exit 1
}

npm run format:check
if ($LASTEXITCODE -ne 0) {
    Write-ColorOutput Red "格式检查失败"
    exit 1
}

npm run typecheck
if ($LASTEXITCODE -ne 0) {
    Write-ColorOutput Red "类型检查失败"
    exit 1
}

# 6. 更新版本号
Write-ColorOutput Yellow "更新版本号 ($VersionType)..."
$newVersion = npm version $VersionType --no-git-tag-version
Write-ColorOutput Green "新版本: $newVersion"

# 7. 构建和打包
Write-ColorOutput Yellow "构建扩展..."
npm run build
if ($LASTEXITCODE -ne 0) {
    Write-ColorOutput Red "构建失败"
    exit 1
}

Write-ColorOutput Yellow "打包扩展..."
npm run package
if ($LASTEXITCODE -ne 0) {
    Write-ColorOutput Red "打包失败"
    exit 1
}

# 8. 提示更新 CHANGELOG
Write-ColorOutput Yellow "请更新 CHANGELOG.md 文件"
Write-Output "添加版本 $newVersion 的变更说明"
Read-Host "按 Enter 继续 (完成 CHANGELOG 更新后)"

# 9. 提交更改
Write-ColorOutput Yellow "提交更改..."
git add package.json package-lock.json CHANGELOG.md
git commit -m "chore: release $newVersion"

# 10. 创建 tag
Write-ColorOutput Yellow "创建 Git tag..."
git tag $newVersion

# 11. 推送到远程
Write-ColorOutput Yellow "推送到远程仓库..."
git push origin $currentBranch
git push origin $newVersion

Write-ColorOutput Green "✅ 发布流程完成!"
Write-ColorOutput Green "GitHub Actions 将自动:"
Write-Output "  1. 创建 GitHub Release"
Write-Output "  2. 发布到 VSCode Marketplace"
Write-Output "  3. 上传 .vsix 文件"
Write-Output ""
Write-ColorOutput Yellow "查看发布状态:"

$repoUrl = git config --get remote.origin.url
$repoPath = $repoUrl -replace '.*github.com[:/](.*?)(.git)?$', '$1'
Write-Output "  https://github.com/$repoPath/actions"
