# 🚀 立即安装和测试

## ✅ 插件包已构建完成！

文件位置: `wgsl-formatter-0.1.0.vsix` (19.6 KB)

---

## 📦 方法 1: 一键安装（推荐）

### Windows (PowerShell)
```powershell
.\install-local.ps1
```

### Linux/macOS (Bash)
```bash
chmod +x install-local.sh
./install-local.sh
```

---

## 📦 方法 2: 手动命令行安装

在终端中运行：

```bash
code --install-extension wgsl-formatter-0.1.0.vsix
```

---

## 📦 方法 3: VSCode 界面安装

1. 打开 VSCode
2. 按 `Ctrl+Shift+P` (Windows/Linux) 或 `Cmd+Shift+P` (macOS)
3. 输入并选择: **Extensions: Install from VSIX...**
4. 选择文件: `wgsl-formatter-0.1.0.vsix`
5. 点击安装
6. 重启 VSCode（如果提示）

---

## 📦 方法 4: 拖放安装

1. 打开 VSCode
2. 按 `Ctrl+Shift+X` 打开扩展面板
3. 将 `wgsl-formatter-0.1.0.vsix` 文件拖放到扩展面板
4. 点击安装

---

## 🧪 测试插件

### 1. 打开测试文件

在 VSCode 中打开 `test-example.wgsl` 文件（已为你创建）

### 2. 格式化代码

按快捷键：
- **Windows/Linux**: `Shift+Alt+F`
- **macOS**: `Shift+Option+F`

或者：
- 右键点击 → 选择 "Format Document"

### 3. 查看效果

代码应该被自动格式化，包括：
- ✅ 正确的缩进
- ✅ 运算符周围的空格
- ✅ 结构体字段对齐
- ✅ 长函数签名自动换行

---

## ⚙️ 配置选项

打开 VSCode 设置 (`Ctrl+,`)，搜索 "wgsl"：

```json
{
  // 缩进大小
  "wgslFormatter.indentSize": 4,
  
  // 使用制表符而不是空格
  "wgslFormatter.useTabs": false,
  
  // 最大行长度
  "wgslFormatter.maxLineLength": 100,
  
  // 启用自动换行
  "wgslFormatter.enableLineWrapping": true,
  
  // 保存时自动格式化
  "editor.formatOnSave": true
}
```

---

## 🔍 验证安装

### 检查扩展是否已安装

1. 打开扩展面板 (`Ctrl+Shift+X`)
2. 搜索 "WGSL Formatter"
3. 应该看到已安装的扩展

### 查看输出日志

1. 按 `Ctrl+Shift+U` 打开输出面板
2. 在下拉菜单选择 "WGSL Formatter"
3. 查看格式化日志

---

## 🔄 更新插件

如果你修改了代码，需要重新安装：

```bash
# 1. 重新构建
npm run package

# 2. 重新运行安装脚本
.\install-local.ps1  # Windows
./install-local.sh   # Linux/macOS
```

---

## 🐛 开发模式（不需要打包）

如果你想调试代码：

1. 在 VSCode 中打开项目文件夹
2. 按 `F5` 启动调试
3. 会打开一个新的 VSCode 窗口
4. 在新窗口中测试插件
5. 可以在原窗口设置断点

---

## ❓ 遇到问题？

### 插件没有生效？

1. 确保文件扩展名是 `.wgsl`
2. 重启 VSCode
3. 检查扩展是否启用
4. 查看输出面板的错误信息

### 格式化没有反应？

1. 手动触发格式化 (`Shift+Alt+F`)
2. 检查是否有语法错误
3. 查看输出面板 (WGSL Formatter)

### 需要卸载？

```bash
code --uninstall-extension wgsl-formatter.wgsl-formatter
```

---

## 📚 更多信息

- 完整测试指南: `LOCAL_TESTING_GUIDE.md`
- 发布指南: `PUBLISHING_GUIDE.md`
- 快速发布: `QUICK_START_PUBLISHING.md`

---

**现在就试试吧！** 🎉

打开终端，运行：
```bash
code --install-extension wgsl-formatter-0.1.0.vsix
```

然后打开 `test-example.wgsl` 文件，按 `Shift+Alt+F` 格式化！
