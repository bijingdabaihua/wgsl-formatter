# Bug 修复总结

## 🐛 问题描述

用户在使用插件格式化以下 WGSL 代码时遇到错误：

```wgsl
fn main() -> vec4<f32> {
   return vec4<f32>(1.0, 1.0, 1.0, 1.0);
}
```

错误信息：
```
WGSL Formatter: Unable to format due to syntax errors in the code.
```

## 🔍 根本原因

解析器无法正确处理**类型构造函数调用**，例如 `vec4<f32>(1.0, 1.0, 1.0, 1.0)`。

问题出在 `src/parser.ts` 的 `parsePrimaryExpression()` 方法中：
- 解析器只能识别 `Identifier` 类型的函数调用
- `vec4` 被词法分析器识别为 `TokenType.Vec4` 关键字，而不是标识符
- 因此解析器无法将 `vec4<f32>(...)` 识别为函数调用表达式

## ✅ 修复方案

### 1. 修改 `src/parser.ts`

在 `parsePrimaryExpression()` 方法中添加对类型关键字的支持：

- 检测类型关键字（`vec2`, `vec3`, `vec4`, `mat2x2`, `mat3x3`, `mat4x4`, `f32`, `i32`, `u32`, `bool`）
- 解析泛型参数（如 `<f32>`）
- 将类型关键字作为函数名处理函数调用

### 2. 修复其他问题

同时修复了以下问题：
- 移除 `src/parser.ts` 中未使用的 `ASTNode` 导入
- 修复 `src/provider.ts` 中缺少的 `maxLineLength` 和 `enableLineWrapping` 配置
- 移除 `src/rules/linewrapping.ts` 中未使用的 `FormatContext` 导入

## 🧪 测试验证

创建了新的测试文件 `tests/unit/parser-generic.test.ts`，包含以下测试用例：

1. ✅ 解析带泛型返回类型的函数 `vec4<f32>`
2. ✅ 解析 `vec3<f32>` 类型
3. ✅ 解析带泛型类型参数的函数

所有测试通过！

## 📦 更新后的插件

- **文件**: `wgsl-formatter-0.1.0.vsix`
- **大小**: 23.96 KB
- **状态**: ✅ 已重新构建并打包

## 🚀 如何更新

### 方法 1: 重新安装

```bash
# 卸载旧版本
code --uninstall-extension wgsl-formatter.wgsl-formatter

# 安装新版本
code --install-extension wgsl-formatter-0.1.0.vsix
```

### 方法 2: 使用安装脚本

**Windows:**
```powershell
.\install-local.ps1
```

**Linux/macOS:**
```bash
./install-local.sh
```

## ✨ 现在支持的语法

插件现在可以正确格式化以下 WGSL 代码：

### 类型构造函数
```wgsl
let v4 = vec4<f32>(1.0, 2.0, 3.0, 4.0);
let v3 = vec3<f32>(1.0, 2.0, 3.0);
let v2 = vec2<f32>(1.0, 2.0);
let m = mat4x4<f32>(...);
```

### 函数返回类型
```wgsl
fn getColor() -> vec4<f32> {
    return vec4<f32>(1.0, 0.0, 0.0, 1.0);
}
```

### 函数参数
```wgsl
fn computeShading(
    position: vec3<f32>,
    normal: vec3<f32>,
    color: vec4<f32>
) -> vec3<f32> {
    // ...
}
```

### 结构体字段
```wgsl
struct VertexOutput {
    @builtin(position) position: vec4<f32>,
    @location(0)       color:    vec3<f32>,
}
```

## 📝 测试你的代码

1. 重新安装插件
2. 打开你的 WGSL 文件
3. 按 `Shift+Alt+F` (Windows/Linux) 或 `Shift+Option+F` (macOS)
4. 代码应该被正确格式化，不再报错！

## 🎉 问题已解决！

你现在可以正常使用插件格式化包含类型构造函数的 WGSL 代码了。

如果还有其他问题，请查看输出面板（`Ctrl+Shift+U` → 选择 "WGSL Formatter"）获取详细日志。
