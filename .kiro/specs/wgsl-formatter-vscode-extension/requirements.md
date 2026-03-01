# 需求文档

## 简介

WGSL Formatter 是一个 Visual Studio Code 扩展插件，用于解决 WebGPU Shading Language (WGSL) 代码编写中的格式化问题。该插件的初期版本专注于提供 WGSL 代码的自动格式化功能，帮助开发者在编写大型 WebGPU 项目时保持代码的可读性和一致性。

## 术语表

- **Extension**: VSCode 扩展插件
- **WGSL**: WebGPU Shading Language，WebGPU 着色器语言
- **Formatter**: 代码格式化器，负责格式化 WGSL 代码
- **VSCode**: Visual Studio Code 编辑器
- **Document**: VSCode 中打开的文档对象
- **Language_Server**: 语言服务器，提供语言特性支持

## 需求

### 需求 1: 插件安装与激活

**用户故事:** 作为开发者，我希望能够轻松安装和激活插件，以便快速开始使用 WGSL 格式化功能。

#### 验收标准

1. WHEN 用户从 VSCode 扩展市场安装 Extension，THE Extension SHALL 自动注册 WGSL 语言支持
2. WHEN 用户打开 .wgsl 文件，THE Extension SHALL 自动激活
3. THE Extension SHALL 在激活后无需额外配置即可使用
4. WHEN Extension 激活失败，THE Extension SHALL 在 VSCode 输出面板显示错误信息

### 需求 2: WGSL 文件识别

**用户故事:** 作为开发者，我希望插件能够识别 WGSL 文件，以便自动应用格式化功能。

#### 验收标准

1. THE Extension SHALL 识别 .wgsl 文件扩展名
2. THE Extension SHALL 将 .wgsl 文件关联到 WGSL 语言模式
3. WHERE 用户手动设置文件语言为 WGSL，THE Extension SHALL 提供格式化支持

### 需求 3: 代码格式化功能

**用户故事:** 作为开发者，我希望能够格式化 WGSL 代码，以便保持代码的可读性和一致性。

#### 验收标准

1. WHEN 用户触发格式化命令（Shift+Alt+F 或右键菜单），THE Formatter SHALL 格式化当前 Document 中的 WGSL 代码
2. THE Formatter SHALL 正确处理 WGSL 语法结构（函数、结构体、变量声明、注释）
3. THE Formatter SHALL 保持代码的语义不变
4. WHEN Document 包含语法错误，THE Formatter SHALL 尽可能格式化有效部分并保留原始内容
5. THE Formatter SHALL 在 500 毫秒内完成单个文件的格式化操作

### 需求 4: 格式化规则

**用户故事:** 作为开发者，我希望格式化器遵循一致的规则，以便团队代码风格统一。

#### 验收标准

1. THE Formatter SHALL 使用 4 个空格作为默认缩进
2. THE Formatter SHALL 在运算符前后添加空格
3. THE Formatter SHALL 在逗号后添加空格
4. THE Formatter SHALL 对齐结构体字段
5. THE Formatter SHALL 保留空行用于逻辑分组
6. THE Formatter SHALL 移除行尾多余空格
7. THE Formatter SHALL 确保文件以单个换行符结尾

### 需求 5: 格式化范围支持

**用户故事:** 作为开发者，我希望能够格式化选定的代码范围，以便只处理需要修改的部分。

#### 验收标准

1. WHEN 用户选择代码范围并触发格式化，THE Formatter SHALL 仅格式化选定范围
2. THE Formatter SHALL 保持选定范围外的代码不变
3. WHEN 选定范围包含不完整的语法结构，THE Formatter SHALL 扩展到最近的完整语法单元

### 需求 6: 保存时自动格式化

**用户故事:** 作为开发者，我希望在保存文件时自动格式化代码，以便保持代码始终处于格式化状态。

#### 验收标准

1. WHERE 用户启用 "editor.formatOnSave" 配置，WHEN 用户保存 WGSL 文件，THE Formatter SHALL 自动格式化 Document
2. WHERE 用户禁用 "editor.formatOnSave" 配置，THE Formatter SHALL 不在保存时自动格式化
3. WHEN 自动格式化失败，THE Extension SHALL 允许文件正常保存并在输出面板显示警告

### 需求 7: 错误处理

**用户故事:** 作为开发者，我希望在格式化失败时获得清晰的错误信息，以便了解问题所在。

#### 验收标准

1. WHEN Formatter 遇到无法处理的语法错误，THE Extension SHALL 在 VSCode 输出面板显示错误详情
2. WHEN Formatter 遇到内部错误，THE Extension SHALL 记录错误堆栈并通知用户
3. IF 格式化操作超时，THEN THE Extension SHALL 取消操作并显示超时消息
4. THE Extension SHALL 在错误发生时保持原始文档内容不变

### 需求 8: 性能要求

**用户故事:** 作为开发者，我希望格式化操作快速完成，以便不影响编码流程。

#### 验收标准

1. THE Formatter SHALL 在 500 毫秒内完成小于 1000 行的文件格式化
2. THE Formatter SHALL 在 2 秒内完成小于 5000 行的文件格式化
3. WHEN 文件超过 5000 行，THE Extension SHALL 显示进度提示
4. THE Extension SHALL 使用少于 100MB 的内存处理单个文件

### 需求 9: 配置选项

**用户故事:** 作为开发者，我希望能够配置基本的格式化选项，以便适应不同的代码风格偏好。

#### 验收标准

1. THE Extension SHALL 提供 "wgslFormatter.indentSize" 配置项用于设置缩进大小
2. THE Extension SHALL 提供 "wgslFormatter.useTabs" 配置项用于选择使用制表符或空格
3. THE Extension SHALL 在配置更改后立即应用新设置
4. WHERE 用户未设置配置项，THE Extension SHALL 使用默认值（4 个空格）

### 需求 10: 兼容性

**用户故事:** 作为开发者，我希望插件能够在不同平台上正常工作，以便团队成员使用不同操作系统时保持一致体验。

#### 验收标准

1. THE Extension SHALL 支持 Windows 操作系统
2. THE Extension SHALL 支持 macOS 操作系统
3. THE Extension SHALL 支持 Linux 操作系统
4. THE Extension SHALL 兼容 VSCode 版本 1.75.0 及以上
5. THE Extension SHALL 正确处理不同操作系统的换行符（CRLF 和 LF）

### 需求 11: 行长度限制和自动换行

**用户故事:** 作为开发者，我希望格式化器能够自动换行过长的代码行，以便提高代码可读性并避免水平滚动。

#### 验收标准

1. THE Extension SHALL 提供 "wgslFormatter.maxLineLength" 配置项用于设置最大行长度（默认值 100）
2. THE Extension SHALL 提供 "wgslFormatter.enableLineWrapping" 配置项用于启用或禁用自动换行功能（默认值 true）
3. WHERE 用户启用自动换行功能，WHEN 代码行长度超过配置的最大值，THE Formatter SHALL 自动换行
4. WHEN 函数参数列表超过最大行长度，THE Formatter SHALL 将每个参数放置在单独的行上并正确缩进
5. WHEN 函数参数列表换行后，THE Formatter SHALL 将右括号和返回类型放置在单独的行上
6. WHEN 函数体的左花括号在换行的函数签名之后，THE Formatter SHALL 将左花括号放置在新行上
7. WHEN 结构体字段列表超过最大行长度，THE Formatter SHALL 保持每个字段在单独行上的现有格式
8. WHEN 长表达式超过最大行长度，THE Formatter SHALL 在运算符处换行并保持正确缩进
9. THE Formatter SHALL 在换行后的续行使用额外的缩进级别（相对于原始行）
10. WHERE 用户禁用自动换行功能，THE Formatter SHALL 不对超长行进行换行处理
11. FOR ALL 有效的 WGSL 代码，格式化前后的语义 SHALL 保持完全一致（不变性属性）
12. FOR ALL 启用自动换行的格式化操作，连续两次格式化 SHALL 产生相同的结果（幂等性属性）
