# WGSL Formatter

<div align="center">

**🎨 Professional code formatter for WebGPU Shading Language**

[![Version](https://img.shields.io/badge/version-0.1.1-blue.svg)](https://marketplace.visualstudio.com/items?itemName=wgsl-tools.wgsl-formatter)
[![License](https://img.shields.io/badge/license-MIT-green.svg)](LICENSE)
[![VSCode](https://img.shields.io/badge/VSCode-1.75.0+-purple.svg)](https://code.visualstudio.com/)

[English](#english) | [中文](#中文)

</div>

---

<a name="english"></a>

## ✨ Features

- 🚀 **Lightning Fast** - Format files in milliseconds
- 🎯 **Smart Formatting** - Intelligent indentation and spacing
- 📐 **Auto Alignment** - Beautiful struct field alignment
- 🔄 **Format on Save** - Automatic formatting when you save
- ⚙️ **Highly Configurable** - Customize to match your style
- 🛡️ **Error Tolerant** - Handles syntax errors gracefully
- 🌍 **Cross-Platform** - Works on Windows, macOS, and Linux

## 📦 Installation

**Method 1: VSCode Marketplace**
1. Open VSCode Extensions (`Ctrl+Shift+X` / `Cmd+Shift+X`)
2. Search for "WGSL Formatter"
3. Click Install

**Method 2: Quick Install**
```
ext install wgsl-tools.wgsl-formatter
```

## 🚀 Quick Start

1. Open any `.wgsl` file
2. Press `Shift+Alt+F` (Windows/Linux) or `Shift+Option+F` (macOS)
3. Done! Your code is now beautifully formatted ✨

### Enable Format on Save

Add to your VSCode settings:

```json
{
  "editor.formatOnSave": true,
  "[wgsl]": {
    "editor.defaultFormatter": "wgsl-tools.wgsl-formatter"
  }
}
```

## 📸 Before & After

<table>
<tr>
<td> Before </td> <td> After </td>
</tr>
<tr>
<td>

```wgsl
struct Vertex{
@location(0) pos:vec3<f32>,
@location(1) normal:vec3<f32>,
}
fn main(v:Vertex)->vec4<f32>{
return vec4<f32>(v.pos,1.0);
}
```

</td>
<td>

```wgsl
struct Vertex {
    @location(0) pos:    vec3<f32>,
    @location(1) normal: vec3<f32>,
}

fn main(v: Vertex) -> vec4<f32> {
    return vec4<f32>(v.pos, 1.0);
}
```

</td>
</tr>
</table>

## ⚙️ Configuration

| Setting | Default | Description |
|---------|---------|-------------|
| `wgslFormatter.indentSize` | `4` | Spaces per indentation level |
| `wgslFormatter.useTabs` | `false` | Use tabs instead of spaces |
| `wgslFormatter.maxLineLength` | `100` | Maximum line length |
| `wgslFormatter.enableLineWrapping` | `true` | Enable automatic line wrapping |

## 🎯 What Gets Formatted

✅ Indentation and nesting  
✅ Operator spacing (`=`, `+`, `-`, `*`, `/`)  
✅ Comma spacing  
✅ Struct field alignment  
✅ Function parameter alignment  
✅ Blank line normalization  
✅ Trailing whitespace removal  

## 🤝 Contributing

Contributions are welcome! Please check out our [Contributing Guide](CONTRIBUTING.md).

## 📝 License

MIT © [WGSL Tools](LICENSE)

## 🔗 Links

- [GitHub Repository](https://github.com/bijingdabaihua/wgsl-formatter)
- [Issue Tracker](https://github.com/bijingdabaihua/wgsl-formatter/issues)
- [Changelog](CHANGELOG.md)

---

<a name="中文"></a>

## ✨ 功能特性

- 🚀 **极速格式化** - 毫秒级格式化速度
- 🎯 **智能格式化** - 智能缩进和空格处理
- 📐 **自动对齐** - 结构体字段自动对齐
- 🔄 **保存时格式化** - 保存文件时自动格式化
- ⚙️ **高度可配置** - 自定义格式化风格
- 🛡️ **容错处理** - 优雅处理语法错误
- 🌍 **跨平台支持** - 支持 Windows、macOS 和 Linux

## 📦 安装

**方法 1：VSCode 扩展商店**
1. 打开 VSCode 扩展面板（`Ctrl+Shift+X` / `Cmd+Shift+X`）
2. 搜索 "WGSL Formatter"
3. 点击安装

**方法 2：快速安装**
```
ext install wgsl-tools.wgsl-formatter
```

## 🚀 快速开始

1. 打开任意 `.wgsl` 文件
2. 按 `Shift+Alt+F`（Windows/Linux）或 `Shift+Option+F`（macOS）
3. 完成！代码已格式化 ✨

### 启用保存时格式化

在 VSCode 设置中添加：

```json
{
  "editor.formatOnSave": true,
  "[wgsl]": {
    "editor.defaultFormatter": "wgsl-tools.wgsl-formatter"
  }
}
```

## 📸 格式化前后对比

<table>
<tr>
<td> 格式化前 </td> <td> 格式化后 </td>
</tr>
<tr>
<td>

```wgsl
struct Vertex{
@location(0) pos:vec3<f32>,
@location(1) normal:vec3<f32>,
}
fn main(v:Vertex)->vec4<f32>{
return vec4<f32>(v.pos,1.0);
}
```

</td>
<td>

```wgsl
struct Vertex {
    @location(0) pos:    vec3<f32>,
    @location(1) normal: vec3<f32>,
}

fn main(v: Vertex) -> vec4<f32> {
    return vec4<f32>(v.pos, 1.0);
}
```

</td>
</tr>
</table>

## ⚙️ 配置选项

| 配置项 | 默认值 | 说明 |
|--------|--------|------|
| `wgslFormatter.indentSize` | `4` | 每级缩进的空格数 |
| `wgslFormatter.useTabs` | `false` | 使用 Tab 而非空格 |
| `wgslFormatter.maxLineLength` | `100` | 最大行长度 |
| `wgslFormatter.enableLineWrapping` | `true` | 启用自动换行 |

## 🎯 格式化内容

✅ 缩进和嵌套  
✅ 运算符空格（`=`、`+`、`-`、`*`、`/`）  
✅ 逗号后空格  
✅ 结构体字段对齐  
✅ 函数参数对齐  
✅ 空行规范化  
✅ 行尾空格清理  

## 🤝 参与贡献

欢迎贡献代码！请查看我们的[贡献指南](CONTRIBUTING.md)。

## 📝 开源协议

MIT © [WGSL Tools](LICENSE)

## 🔗 相关链接

- [GitHub 仓库](https://github.com/bijingdabaihua/wgsl-formatter)
- [问题反馈](https://github.com/bijingdabaihua/wgsl-formatter/issues)
- [更新日志](CHANGELOG.md)

---

<div align="center">

**Made with ❤️ for WebGPU developers**

If you find this extension helpful, please ⭐ star the repo!

</div>
