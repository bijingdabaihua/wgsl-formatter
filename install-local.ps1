# 本地安装 WGSL Formatter 插件脚本

Write-Host "🚀 WGSL Formatter 本地安装脚本" -ForegroundColor Green
Write-Host ""

# 检查 .vsix 文件是否存在
$vsixFile = "wgsl-formatter-0.1.0.vsix"
if (-not (Test-Path $vsixFile)) {
    Write-Host "❌ 找不到 $vsixFile 文件" -ForegroundColor Red
    Write-Host "正在构建插件包..." -ForegroundColor Yellow
    npm run package
    
    if ($LASTEXITCODE -ne 0) {
        Write-Host "❌ 构建失败" -ForegroundColor Red
        exit 1
    }
}

Write-Host "✅ 找到插件包: $vsixFile" -ForegroundColor Green
Write-Host ""

# 检查是否已安装旧版本
Write-Host "检查是否已安装旧版本..." -ForegroundColor Yellow
$installed = code --list-extensions | Select-String "wgsl-formatter"

if ($installed) {
    Write-Host "⚠️  检测到已安装的版本，正在卸载..." -ForegroundColor Yellow
    code --uninstall-extension wgsl-formatter.wgsl-formatter
    Start-Sleep -Seconds 2
}

# 安装插件
Write-Host "正在安装插件..." -ForegroundColor Yellow
code --install-extension $vsixFile

if ($LASTEXITCODE -eq 0) {
    Write-Host ""
    Write-Host "✅ 插件安装成功！" -ForegroundColor Green
    Write-Host ""
    Write-Host "📝 下一步操作：" -ForegroundColor Cyan
    Write-Host "1. 重启 VSCode（如果需要）"
    Write-Host "2. 打开 test-example.wgsl 文件"
    Write-Host "3. 按 Shift+Alt+F 格式化代码"
    Write-Host ""
    Write-Host "🔧 配置选项（在 VSCode 设置中）：" -ForegroundColor Cyan
    Write-Host "  - wgslFormatter.indentSize: 缩进大小（默认 4）"
    Write-Host "  - wgslFormatter.useTabs: 使用制表符（默认 false）"
    Write-Host "  - wgslFormatter.maxLineLength: 最大行长度（默认 100）"
    Write-Host "  - wgslFormatter.enableLineWrapping: 启用自动换行（默认 true）"
    Write-Host ""
    Write-Host "📖 查看完整测试指南: LOCAL_TESTING_GUIDE.md" -ForegroundColor Cyan
} else {
    Write-Host ""
    Write-Host "❌ 安装失败" -ForegroundColor Red
    Write-Host "请尝试手动安装：" -ForegroundColor Yellow
    Write-Host "1. 打开 VSCode"
    Write-Host "2. 按 Ctrl+Shift+P"
    Write-Host "3. 输入 'Extensions: Install from VSIX...'"
    Write-Host "4. 选择 $vsixFile 文件"
}
