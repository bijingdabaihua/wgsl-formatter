# 本地测试指南

## 🎯 快速开始 - 构建并测试插件

### 步骤 1: 构建插件包

```bash
# 1. 确保依赖已安装
npm install

# 2. 运行测试（可选，确保代码正常）
npm test

# 3. 构建并打包插件
npm run package
```

这会在当前目录生成 `wgsl-formatter-0.1.0.vsix` 文件。

### 步骤 2: 在 VSCode 中安装

#### 方法 1: 使用命令行（推荐）

```bash
code --install-extension wgsl-formatter-0.1.0.vsix
```

#### 方法 2: 使用 VSCode 界面

1. 打开 VSCode
2. 按 `Ctrl+Shift+P` (Windows/Linux) 或 `Cmd+Shift+P` (macOS)
3. 输入 "Extensions: Install from VSIX..."
4. 选择 `wgsl-formatter-0.1.0.vsix` 文件
5. 重启 VSCode（如果提示）

#### 方法 3: 拖放安装

1. 打开 VSCode
2. 打开扩展面板 (`Ctrl+Shift+X`)
3. 将 `.vsix` 文件拖放到扩展面板

### 步骤 3: 验证安装

1. 打开 VSCode
2. 按 `Ctrl+Shift+X` 打开扩展面板
3. 搜索 "WGSL Formatter"
4. 应该看到已安装的扩展

### 步骤 4: 测试功能

#### 创建测试文件

创建一个 `test.wgsl` 文件：

```wgsl
fn main(){let x=1+2;return x;}

struct MyStruct{
position:vec3<f32>,
color:vec4<f32>,
}

fn computeShading(position:vec3<f32>,normal:vec3<f32>,lightDir:vec3<f32>)->vec3<f32>{
let diffuse=max(dot(normal,lightDir),0.0);
return diffuse;
}
```

#### 测试格式化

1. 打开 `test.wgsl` 文件
2. 按 `Shift+Alt+F` (Windows/Linux) 或 `Shift+Option+F` (macOS)
3. 代码应该被自动格式化

**预期结果：**

```wgsl
fn main() {
    let x = 1 + 2;
    return x;
}

struct MyStruct {
    position: vec3<f32>,
    color:    vec4<f32>,
}

fn computeShading(
    position: vec3<f32>,
    normal: vec3<f32>,
    lightDir: vec3<f32>
) -> vec3<f32>
{
    let diffuse = max(dot(normal, lightDir), 0.0);
    return diffuse;
}
```

#### 测试范围格式化

1. 选择部分代码
2. 按 `Ctrl+K Ctrl+F` (Windows/Linux) 或 `Cmd+K Cmd+F` (macOS)
3. 只有选中的部分被格式化

#### 测试保存时格式化

1. 在 VSCode 设置中启用：
   ```json
   {
     "editor.formatOnSave": true
   }
   ```
2. 修改 `.wgsl` 文件
3. 保存文件 (`Ctrl+S`)
4. 代码应该自动格式化

### 步骤 5: 测试配置选项

打开 VSCode 设置 (`Ctrl+,`)，搜索 "wgsl"，测试以下配置：

#### 缩进大小
```json
{
  "wgslFormatter.indentSize": 2
}
```

#### 使用制表符
```json
{
  "wgslFormatter.useTabs": true
}
```

#### 行长度限制
```json
{
  "wgslFormatter.maxLineLength": 80
}
```

#### 禁用自动换行
```json
{
  "wgslFormatter.enableLineWrapping": false
}
```

## 🔄 更新插件

如果你修改了代码，需要重新构建和安装：

```bash
# 1. 卸载旧版本
code --uninstall-extension wgsl-formatter.wgsl-formatter

# 2. 重新构建
npm run package

# 3. 重新安装
code --install-extension wgsl-formatter-0.1.0.vsix

# 4. 重启 VSCode
```

## 🐛 调试插件

### 方法 1: 使用 VSCode 调试（开发模式）

这个方法不需要打包，直接运行源代码：

1. 在 VSCode 中打开项目文件夹
2. 按 `F5` 或点击 "Run and Debug"
3. 选择 "Run Extension"
4. 会打开一个新的 VSCode 窗口（Extension Development Host）
5. 在新窗口中测试插件功能
6. 可以在原窗口设置断点调试

### 方法 2: 查看输出日志

1. 在 VSCode 中按 `Ctrl+Shift+U` 打开输出面板
2. 在下拉菜单中选择 "WGSL Formatter"
3. 查看格式化日志和错误信息

### 方法 3: 查看开发者工具

1. 按 `Ctrl+Shift+P`
2. 输入 "Developer: Toggle Developer Tools"
3. 查看控制台输出

## 📋 测试检查清单

- [ ] 插件成功安装
- [ ] 可以识别 `.wgsl` 文件
- [ ] 全文档格式化正常工作
- [ ] 范围格式化正常工作
- [ ] 保存时格式化正常工作
- [ ] 缩进配置生效
- [ ] 行长度限制生效
- [ ] 错误处理正常（测试语法错误的文件）
- [ ] 性能可接受（测试大文件）

## 🔧 常见问题

### Q: 安装后找不到插件？

**A:** 检查扩展面板，确保插件已启用。如果被禁用，点击启用按钮。

### Q: 格式化没有效果？

**A:** 
1. 确保文件扩展名是 `.wgsl`
2. 检查输出面板是否有错误信息
3. 尝试手动触发格式化 (`Shift+Alt+F`)

### Q: 如何完全卸载插件？

**A:**
```bash
# 命令行卸载
code --uninstall-extension wgsl-formatter.wgsl-formatter

# 或在 VSCode 扩展面板中右键点击插件 → 卸载
```

### Q: 修改代码后如何快速测试？

**A:** 使用开发模式（按 F5），不需要打包，直接运行源代码。

## 📊 性能测试

测试不同大小的文件：

```bash
# 创建测试文件
# 小文件 (~100 行)
# 中文件 (~1000 行)
# 大文件 (~5000 行)

# 测试格式化时间
# 应该：
# - 小文件: < 100ms
# - 中文件: < 500ms
# - 大文件: < 2s
```

## 🎨 测试用例

### 测试用例 1: 基本格式化

**输入:**
```wgsl
fn test(){let x=1;}
```

**预期输出:**
```wgsl
fn test() {
    let x = 1;
}
```

### 测试用例 2: 结构体对齐

**输入:**
```wgsl
struct Test{
a:f32,
position:vec3<f32>,
}
```

**预期输出:**
```wgsl
struct Test {
    a:        f32,
    position: vec3<f32>,
}
```

### 测试用例 3: 长函数签名换行

**输入:**
```wgsl
fn longFunction(param1:f32,param2:vec3<f32>,param3:vec4<f32>,param4:mat4x4<f32>)->vec3<f32>{return vec3<f32>(0.0);}
```

**预期输出:**
```wgsl
fn longFunction(
    param1: f32,
    param2: vec3<f32>,
    param3: vec4<f32>,
    param4: mat4x4<f32>
) -> vec3<f32>
{
    return vec3<f32>(0.0);
}
```

## 🚀 下一步

测试完成后，你可以：

1. 继续开发新功能
2. 修复发现的 bug
3. 分享给团队成员测试
4. 准备发布到市场（参考 PUBLISHING_GUIDE.md）

---

**祝测试顺利！** 🎉
